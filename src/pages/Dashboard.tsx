import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const Dashboard: React.FC = () => {
  const { accounts, transactions, investments, loading } = useData();

  const dashboardData = useMemo(() => {
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const currentMonthTransactions = transactions.filter(
      t => t.date >= monthStart && t.date <= monthEnd
    );
    
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlySavings = monthlyIncome - monthlyExpenses;
    
    // Category-wise expenses
    const categoryExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const categoryData = Object.entries(categoryExpenses).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
    
    // Monthly trend data (last 6 months)
    const months = eachMonthOfInterval({
      start: subMonths(currentMonth, 5),
      end: currentMonth
    });
    
    const monthlyTrend = months.map(month => {
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
        savings: income - expenses
      };
    });
    
    // Investment portfolio value
    const totalInvestmentValue = investments.reduce(
      (sum, inv) => sum + (inv.quantity * inv.currentPrice), 0
    );
    
    const totalInvestmentCost = investments.reduce(
      (sum, inv) => sum + (inv.quantity * inv.buyPrice), 0
    );
    
    const investmentGainLoss = totalInvestmentValue - totalInvestmentCost;
    
    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      categoryData,
      monthlyTrend,
      totalInvestmentValue,
      investmentGainLoss
    };
  }, [accounts, transactions, investments]);

  const COLORS = ['#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                ₹{dashboardData.totalBalance.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <DollarSign size={20} className="text-green-600 lg:w-6 lg:h-6" />
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
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                ₹{dashboardData.monthlyIncome.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <ArrowUpRight size={20} className="text-blue-600 lg:w-6 lg:h-6" />
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
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                ₹{dashboardData.monthlyExpenses.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <ArrowDownRight size={20} className="text-red-600 lg:w-6 lg:h-6" />
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
              <p className="text-sm font-medium text-gray-600">Monthly Savings</p>
              <p className={`text-xl lg:text-2xl font-bold truncate ${
                dashboardData.monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{dashboardData.monthlySavings.toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 ${
              dashboardData.monthlySavings >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {dashboardData.monthlySavings >= 0 ? (
                <TrendingUp size={20} className="text-green-600 lg:w-6 lg:h-6" />
              ) : (
                <TrendingDown size={20} className="text-red-600 lg:w-6 lg:h-6" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Expense by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 lg:mb-6">Expenses by Category</h3>
          {dashboardData.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250} className="lg:h-80">
              <PieChart>
                <Pie
                  data={dashboardData.categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 lg:h-64 text-gray-500">
              <div className="text-center">
                <p className="mb-2">No expense data available</p>
                <Link to="/transactions" className="text-blue-600 hover:text-blue-700 text-sm">
                  Add your first transaction
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 lg:mb-6">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={250} className="lg:h-80">
            <LineChart data={dashboardData.monthlyTrend}>
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
      </div>

      {/* Accounts Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-900">Account Balances</h3>
          <Link
            to="/settings"
            className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center sm:w-auto"
          >
            <Plus size={16} className="mr-2" />
            Add Account
          </Link>
        </div>
        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div key={account.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{account.name}</p>
                    <p className="text-sm text-gray-600">{account.type}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-bold text-gray-900">
                      ₹{account.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h4>
            <p className="text-gray-600 mb-6">
              Add your first bank account to get started with tracking your finances.
            </p>
            <Link
              to="/settings"
              className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors inline-flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Your First Account
            </Link>
          </div>
        )}
      </motion.div>

      {/* Investment Overview */}
      {investments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 lg:mb-6">Investment Portfolio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                ₹{dashboardData.totalInvestmentValue.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Gain/Loss</p>
              <p className={`text-xl lg:text-2xl font-bold ${
                dashboardData.investmentGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{Math.abs(dashboardData.investmentGainLoss).toLocaleString()}
                {dashboardData.investmentGainLoss >= 0 ? ' ↑' : ' ↓'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Holdings</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{investments.length}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;