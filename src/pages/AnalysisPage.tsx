import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useData } from '../contexts/DataContext';
import { generateFinancialInsights, AnalysisInsight } from '../utils/gemini';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import toast from 'react-hot-toast';

const AnalysisPage: React.FC = () => {
  const { accounts, transactions, loading } = useData();
  const [insights, setInsights] = useState<AnalysisInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const analysisData = useMemo(() => {
    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);
    const last6Months = eachMonthOfInterval({
      start: subMonths(currentMonth, 5),
      end: currentMonth
    });

    // Current month data
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);
    const currentMonthTransactions = transactions.filter(
      t => t.date >= currentMonthStart && t.date <= currentMonthEnd
    );

    // Last month data
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);
    const lastMonthTransactions = transactions.filter(
      t => t.date >= lastMonthStart && t.date <= lastMonthEnd
    );

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate trends
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;

    // Monthly spending pattern
    const monthlyData = last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthTransactions = transactions.filter(
        t => t.date >= monthStart && t.date <= monthEnd
      );

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM'),
        income,
        expenses,
        savings: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
      };
    });

    // Category analysis
    const categoryExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryExpenses)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: currentExpenses > 0 ? (amount / currentExpenses) * 100 : 0
      }));

    // Spending patterns
    const averageMonthlyExpenses = monthlyData.length > 0 
      ? monthlyData.reduce((sum, month) => sum + month.expenses, 0) / monthlyData.length
      : 0;

    const averageSavingsRate = monthlyData.length > 0
      ? monthlyData.reduce((sum, month) => sum + month.savingsRate, 0) / monthlyData.length
      : 0;

    return {
      currentIncome,
      currentExpenses,
      incomeChange,
      expenseChange,
      monthlyData,
      topCategories,
      averageMonthlyExpenses,
      averageSavingsRate
    };
  }, [transactions]);

  const generateInsights = async () => {
    if (transactions.length === 0) {
      toast.error('Add some transactions first to get AI insights');
      return;
    }

    setLoadingInsights(true);
    try {
      const aiInsights = await generateFinancialInsights(transactions, accounts);
      setInsights(aiInsights);
      toast.success('AI insights generated successfully!');
    } catch (error) {
      toast.error('Failed to generate insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && insights.length === 0) {
      generateInsights();
    }
  }, [transactions.length]);

  const savingsTips = [
    {
      title: "Follow the 50/30/20 Rule",
      description: "Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment."
    },
    {
      title: "Track Your Daily Expenses",
      description: "Small daily expenses add up. Track everything to identify unnecessary spending."
    },
    {
      title: "Automate Your Savings",
      description: "Set up automatic transfers to your savings account to ensure consistent saving."
    },
    {
      title: "Review Subscriptions Monthly",
      description: "Cancel unused subscriptions and services to reduce recurring expenses."
    },
    {
      title: "Use the 24-Hour Rule",
      description: "Wait 24 hours before making non-essential purchases to avoid impulse buying."
    },
    {
      title: "Plan Your Meals",
      description: "Meal planning can significantly reduce food expenses and minimize waste."
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Financial Analysis</h1>
          <p className="text-gray-600">AI-powered insights to help you make better financial decisions</p>
        </div>
        <button
          onClick={generateInsights}
          disabled={loadingInsights || transactions.length === 0}
          className="bg-black text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <RefreshCw size={16} className={`mr-2 ${loadingInsights ? 'animate-spin' : ''}`} />
          {loadingInsights ? 'Generating...' : 'Refresh Insights'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                ₹{analysisData.currentIncome.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                {analysisData.incomeChange >= 0 ? (
                  <TrendingUp size={16} className="text-green-600 mr-1 flex-shrink-0" />
                ) : (
                  <TrendingDown size={16} className="text-red-600 mr-1 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${
                  analysisData.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analysisData.incomeChange).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                ₹{analysisData.currentExpenses.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                {analysisData.expenseChange >= 0 ? (
                  <TrendingUp size={16} className="text-red-600 mr-1 flex-shrink-0" />
                ) : (
                  <TrendingDown size={16} className="text-green-600 mr-1 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${
                  analysisData.expenseChange >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {Math.abs(analysisData.expenseChange).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600">Avg. Monthly Expenses</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                ₹{analysisData.averageMonthlyExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">Last 6 months</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600">Savings Rate</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {analysisData.averageSavingsRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-2">Target: 20%+</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
      >
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">AI-Powered Insights</h2>
        
        {loadingInsights ? (
          <div className="flex items-center justify-center py-8">
            <div className="loading mr-3"></div>
            <span className="text-gray-600">Generating AI insights...</span>
          </div>
        ) : insights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight, index) => {
              const Icon = insight.type === 'positive' ? TrendingUp : 
                          insight.type === 'warning' ? AlertTriangle : BarChart3;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'positive' 
                      ? 'bg-green-50 border-green-400'
                      : insight.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon size={20} className={`flex-shrink-0 mt-0.5 ${
                      insight.type === 'positive' 
                        ? 'text-green-600'
                        : insight.type === 'warning'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-medium ${
                        insight.type === 'positive' 
                          ? 'text-green-800'
                          : insight.type === 'warning'
                          ? 'text-yellow-800'
                          : 'text-blue-800'
                      }`}>
                        {insight.title}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        insight.type === 'positive' 
                          ? 'text-green-700'
                          : insight.type === 'warning'
                          ? 'text-yellow-700'
                          : 'text-blue-700'
                      }`}>
                        {insight.message}
                      </p>
                      {insight.recommendation && (
                        <p className={`text-sm mt-2 font-medium ${
                          insight.type === 'positive' 
                            ? 'text-green-800'
                            : insight.type === 'warning'
                            ? 'text-yellow-800'
                            : 'text-blue-800'
                        }`}>
                          💡 {insight.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="mb-4">Add more transactions to get personalized AI insights</p>
            <button
              onClick={generateInsights}
              disabled={transactions.length === 0}
              className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Insights
            </button>
          </div>
        )}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Spending Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">6-Month Spending Trend</h3>
          <ResponsiveContainer width="100%" height={250} className="lg:h-80">
            <LineChart data={analysisData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis formatter={(value) => `₹${value.toLocaleString()}`} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                strokeWidth={2}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Spending Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Spending Categories</h3>
          {analysisData.topCategories.length > 0 ? (
            <div className="space-y-4">
              {analysisData.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{category.category}</span>
                      <span className="text-sm text-gray-600 ml-2 flex-shrink-0">{category.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-black h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900">
                      ₹{category.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 lg:h-64 text-gray-500">
              No expense data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Savings Rate Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Savings Rate Trend</h3>
        <ResponsiveContainer width="100%" height={250} className="lg:h-80">
          <BarChart data={analysisData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis formatter={(value) => `${value}%`} />
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            <Bar
              dataKey="savingsRate"
              fill="#000000"
              name="Savings Rate"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Money-Saving Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-6 rounded-2xl border border-blue-200"
      >
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">💡 Smart Saving Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsTips.map((tip, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">{tip.title}</h3>
              <p className="text-sm text-gray-600">{tip.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisPage;