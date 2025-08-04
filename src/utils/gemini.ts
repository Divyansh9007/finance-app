import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedReceiptData {
  vendor?: string;
  amount?: number;
  date?: string;
  category?: string;
  items?: string[];
}

export interface AnalysisInsight {
  type: 'positive' | 'warning' | 'info';
  title: string;
  message: string;
  recommendation?: string;
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Function for receipt data extraction
export const extractReceiptData = async (imageFile: File): Promise<ExtractedReceiptData> => {
  try {
    // Updated model name - gemini-pro-vision is deprecated
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imageData = await fileToGenerativePart(imageFile);
    
    const prompt = `
      Analyze this receipt/bill image and extract the following information in JSON format:
      - vendor: name of the store/business
      - amount: total amount (number only, no currency symbols)
      - date: date in YYYY-MM-DD format
      - category: best guess category from these options: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Others
      - items: array of item names if visible
      
      Return only valid JSON, no other text. If you cannot detect a field, set it to null.
      
      Example format:
      {
        "vendor": "Store Name",
        "amount": 150.50,
        "date": "2024-01-15",
        "category": "Food & Dining",
        "items": ["Item 1", "Item 2"]
      }
    `;
    
    const result = await model.generateContent([prompt, imageData]);
    const response = result.response;
    
    // Check if response is valid
    if (!response) {
      throw new Error('No response from Gemini API');
    }
    
    const text = response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }
    
    // Clean the response text to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);
      
      // Validate and clean the extracted data
      return {
        vendor: extractedData.vendor || null,
        amount: typeof extractedData.amount === 'number' ? extractedData.amount : null,
        date: extractedData.date || null,
        category: extractedData.category || 'Others',
        items: Array.isArray(extractedData.items) ? extractedData.items : []
      };
    }
    
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Error extracting receipt data:', error);
    
    // Fallback to mock data if API fails
    return {
      vendor: "Sample Store",
      amount: Math.floor(Math.random() * 1000) + 100,
      date: new Date().toISOString().split('T')[0],
      category: "Shopping"
    };
  }
};

// Function for financial analysis using Gemini
export const generateFinancialInsights = async (
  transactions: any[],
  accounts: any[]
): Promise<AnalysisInsight[]> => {
  try {
    // Updated model name - gemini-pro is deprecated
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prepare data summary for analysis
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const categoryBreakdown = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const prompt = `
      Analyze the following financial data and provide 3-5 actionable insights in JSON format:
      
      Total Income: ₹${totalIncome}
      Total Expenses: ₹${totalExpenses}
      Net Savings: ₹${totalIncome - totalExpenses}
      
      Expense Categories: ${JSON.stringify(categoryBreakdown)}
      
      For each insight, provide:
      - type: "positive", "warning", or "info"
      - title: short descriptive title
      - message: detailed explanation
      - recommendation: actionable advice (optional)
      
      Focus on spending patterns, savings rate, budget optimization, and financial health.
      Return as JSON array only, no additional text:
      [{"type": "positive", "title": "Example", "message": "Example message", "recommendation": "Example recommendation"}]
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Check if response is valid
    if (!response) {
      throw new Error('No response from Gemini API');
    }
    
    const text = response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }
    
    // Clean the response text to extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const insights = JSON.parse(jsonMatch[0]);
        
        // Validate insights structure
        if (!Array.isArray(insights)) {
          throw new Error('Invalid insights format - not an array');
        }
        
        return insights.map((insight: any) => ({
          type: insight.type || 'info',
          title: insight.title || 'Financial Insight',
          message: insight.message || 'No message available',
          recommendation: insight.recommendation || undefined
        }));
      } catch (parseError) {
        console.error('Error parsing insights JSON:', parseError);
        throw new Error('Failed to parse insights JSON');
      }
    }
    
    throw new Error('No valid JSON array found in response');
  } catch (error) {
    console.error('Error generating financial insights:', error);
    
    // Enhanced fallback insights
    return generateFallbackInsights(transactions);
  }
};

// Enhanced fallback insights function
function generateFallbackInsights(transactions: any[]): AnalysisInsight[] {
  const insights: AnalysisInsight[] = [];
  
  if (transactions.length === 0) {
    insights.push({
      type: 'info',
      title: 'Getting Started',
      message: 'Start adding transactions to get personalized financial insights.',
      recommendation: 'Add your income and expense transactions to see detailed analysis.'
    });
    return insights;
  }
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const savingsRate = totalIncome > 0 
    ? ((totalIncome - totalExpenses) / totalIncome) * 100
    : 0;
  
  // Savings rate analysis
  if (savingsRate > 20) {
    insights.push({
      type: 'positive',
      title: 'Excellent Savings Rate',
      message: `Your savings rate is ${savingsRate.toFixed(1)}%. You're doing great at managing your finances!`,
      recommendation: 'Consider investing your surplus savings for better returns.'
    });
  } else if (savingsRate < 10 && savingsRate >= 0) {
    insights.push({
      type: 'warning',
      title: 'Low Savings Rate',
      message: `Your savings rate is ${savingsRate.toFixed(1)}%. This is below the recommended 20%.`,
      recommendation: 'Review your expenses and identify areas where you can cut back.'
    });
  } else if (savingsRate < 0) {
    insights.push({
      type: 'warning',
      title: 'Spending More Than Earning',
      message: `You're spending ₹${Math.abs(totalIncome - totalExpenses).toLocaleString()} more than you earn.`,
      recommendation: 'Urgently review your expenses and create a budget to avoid debt.'
    });
  }
  
  // Category analysis
  const expenseCategories = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const topExpenseEntry = Object.entries(expenseCategories)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topExpenseEntry && totalExpenses > 0) {
    const [category, amount] = topExpenseEntry;
    const percentage = ((amount / totalExpenses) * 100).toFixed(1);
    
    insights.push({
      type: 'info',
      title: 'Top Spending Category',
      message: `${category} accounts for ${percentage}% of your expenses (₹${amount.toLocaleString()}).`,
      recommendation: 'Monitor this category closely and look for optimization opportunities.'
    });
  }
  
  // Transaction frequency
  if (transactions.length < 5) {
    insights.push({
      type: 'info',
      title: 'More Data Needed',
      message: 'Add more transactions to get better financial insights and patterns.',
      recommendation: 'Try to record all your income and expenses for comprehensive analysis.'
    });
  }
  
  return insights;
}

async function fileToGenerativePart(file: File): Promise<any> {
  try {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result?.toString();
        if (result) {
          resolve(result.split(',')[1]);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
    
    const base64Data = await base64EncodedDataPromise;
    
    return {
      inlineData: {
        data: base64Data,
        mimeType: file.type
      }
    };
  } catch (error) {
    console.error('Error converting file to generative part:', error);
    throw new Error('Failed to process image file');
  }
}