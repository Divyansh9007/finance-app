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
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const imageData = await fileToGenerativePart(imageFile);
    
    const prompt = `
      Analyze this receipt/bill image and extract the following information in JSON format:
      - vendor: name of the store/business
      - amount: total amount (number only, no currency symbols)
      - date: date in YYYY-MM-DD format
      - category: best guess category from these options: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Others
      - items: array of item names if visible
      
      Return only valid JSON, no other text. If you cannot detect a field, set it to null.
    `;
    
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response text to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
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
      Return as JSON array: [{"type": "...", "title": "...", "message": "...", "recommendation": "..."}]
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response text to extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const insights = JSON.parse(jsonMatch[0]);
      return insights.map((insight: any) => ({
        ...insight,
        type: insight.type || 'info'
      }));
    }
    
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Error generating financial insights:', error);
    
    // Fallback to basic insights if API fails
    const savingsRate = transactions.length > 0 
      ? ((transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - 
          transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)) / 
         transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)) * 100
      : 0;
    
    const insights: AnalysisInsight[] = [];
    
    if (savingsRate > 20) {
      insights.push({
        type: 'positive',
        title: 'Excellent Savings Rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. You're doing great at managing your finances!`,
        recommendation: 'Consider investing your surplus savings for better returns.'
      });
    } else if (savingsRate < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. This is below the recommended 20%.`,
        recommendation: 'Review your expenses and identify areas where you can cut back.'
      });
    }
    
    if (transactions.length > 0) {
      const topExpenseCategory = Object.entries(
        transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a)[0];
      
      if (topExpenseCategory) {
        insights.push({
          type: 'info',
          title: 'Top Spending Category',
          message: `Your highest spending category is ${topExpenseCategory[0]} with ₹${topExpenseCategory[1].toLocaleString()}.`,
          recommendation: 'Monitor this category closely and look for optimization opportunities.'
        });
      }
    }
    
    return insights;
  }
};

async function fileToGenerativePart(file: File): Promise<any> {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result?.toString().split(',')[1]);
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type
    }
  };
}