import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useData } from "../contexts/DataContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import toast from "react-hot-toast";

const ReportsPage: React.FC = () => {
  const { accounts = [], transactions = [], loading } = useData();
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [selectedPeriod, setSelectedPeriod] = useState(new Date());
  const [downloading, setDownloading] = useState(false);

  const reportData = useMemo(() => {
    // Early return with safe defaults if no accounts or transactions
    if (!accounts.length || !transactions.length) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        transactionCount: 0,
        categoryData: [],
        accountBreakdown: [],
        trendData: [],
        periodStart: new Date(),
        periodEnd: new Date(),
      };
    }

    const periodStart =
      reportType === "monthly"
        ? startOfMonth(selectedPeriod)
        : startOfYear(selectedPeriod);

    const periodEnd =
      reportType === "monthly"
        ? endOfMonth(selectedPeriod)
        : endOfYear(selectedPeriod);

    const periodTransactions = transactions.filter(
      (t) => t.date >= periodStart && t.date <= periodEnd
    );

    const totalIncome = periodTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = periodTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpenses;

    // Category breakdown
    const expenseCategories = periodTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(expenseCategories).map(
      ([category, amount]) => ({
        name: category,
        value: amount,
        percentage:
          totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : "0",
      })
    );

    // Account-wise breakdown
    const accountBreakdown = accounts.map((account) => {
      const accountTransactions = periodTransactions.filter(
        (t) => t.accountId === account.id
      );
      const accountIncome = accountTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const accountExpenses = accountTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        account: account.name,
        income: accountIncome,
        expenses: accountExpenses,
        net: accountIncome - accountExpenses,
      };
    });

    // Daily/Monthly trend
    const trendData =
      reportType === "monthly"
        ? getDailyTrend(periodTransactions, periodStart, periodEnd)
        : getMonthlyTrend(transactions, selectedPeriod);

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      transactionCount: periodTransactions.length,
      categoryData,
      accountBreakdown,
      trendData,
      periodStart,
      periodEnd,
    };
  }, [transactions, accounts, reportType, selectedPeriod]);

  const getDailyTrend = (transactions: any[], start: Date, end: Date) => {
    const days = [];
    const current = new Date(start);

    while (current <= end) {
      const dayTransactions = transactions.filter(
        (t) => t.date.toDateString() === current.toDateString()
      );

      const income = dayTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = dayTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      days.push({
        date: format(current, "dd"),
        income,
        expenses,
        net: income - expenses,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getMonthlyTrend = (transactions: any[], year: Date) => {
    const months = [];

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(year.getFullYear(), i, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthTransactions = transactions.filter(
        (t) => t.date >= monthStart && t.date <= monthEnd
      );

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: format(monthDate, "MMM"),
        income,
        expenses,
        net: income - expenses,
      });
    }

    return months;
  };

  const downloadCSV = () => {
    if (!transactions || transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const periodStart =
      reportType === "monthly"
        ? startOfMonth(selectedPeriod)
        : startOfYear(selectedPeriod);

    const periodEnd =
      reportType === "monthly"
        ? endOfMonth(selectedPeriod)
        : endOfYear(selectedPeriod);

    const periodTransactions = transactions.filter(
      (t) => t.date >= periodStart && t.date <= periodEnd
    );

    if (periodTransactions.length === 0) {
      toast.error("No transactions in selected period to export");
      return;
    }

    const csvContent = [
      ["Date", "Type", "Amount", "Category", "Description", "Account"],
      ...periodTransactions.map((t) => {
        const account = accounts.find((a) => a.id === t.accountId);
        return [
          format(t.date, "yyyy-MM-dd"),
          t.type,
          t.amount,
          t.category,
          t.description,
          account?.name || "Unknown",
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(selectedPeriod, "yyyy-MM")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV downloaded successfully!");
  };

  const COLORS = [
    "#000000",
    "#374151",
    "#6B7280",
    "#9CA3AF",
    "#D1D5DB",
    "#F3F4F6",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading"></div>
      </div>
    );
  }

  // Show empty state if no accounts
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No accounts found
        </h3>
        <p className="text-gray-600 mb-6">
          You need to add at least one account before generating reports.
        </p>
        <Link
          to="/settings"
          className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors inline-flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Add Your First Account
        </Link>
      </div>
    );
  }

  // Show empty state if no transactions
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No transactions found
        </h3>
        <p className="text-gray-600 mb-6">
          You need to add some transactions before generating reports.
        </p>
        <Link
          to="/transactions"
          className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors inline-flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Add Your First Transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Financial Reports
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of your financial data
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={downloadCSV}
            disabled={!transactions || transactions.length === 0}
            className="bg-gray-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Download size={16} className="mr-2" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value as "monthly" | "yearly")
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="monthly">Monthly Report</option>
              <option value="yearly">Yearly Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {reportType === "monthly" ? "Month" : "Year"}
            </label>
            <input
              type={reportType === "monthly" ? "month" : "number"}
              value={
                reportType === "monthly"
                  ? format(selectedPeriod, "yyyy-MM")
                  : selectedPeriod.getFullYear()
              }
              onChange={(e) => {
                if (reportType === "monthly") {
                  setSelectedPeriod(new Date(e.target.value + "-01"));
                } else {
                  setSelectedPeriod(new Date(parseInt(e.target.value), 0, 1));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex items-end">
            <div className="flex items-center text-gray-600">
              <Filter size={16} className="mr-2 flex-shrink-0" />
              <span className="text-sm">
                Period: {format(reportData.periodStart || new Date(), "MMM d")}{" "}
                - {format(reportData.periodEnd || new Date(), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div
        id="report-content"
        className="space-y-6 lg:space-y-8 bg-white p-4 lg:p-8 rounded-2xl shadow-sm border"
      >
        {/* Summary Stats */}
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">
            Financial Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4 lg:p-6 bg-green-50 rounded-lg"
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp
                  size={20}
                  className="text-green-600 lg:w-6 lg:h-6"
                />
              </div>
              <p className="text-sm font-medium text-green-700">Total Income</p>
              <p className="text-xl lg:text-2xl font-bold text-green-800">
                ₹{reportData.totalIncome.toLocaleString()}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-4 lg:p-6 bg-red-50 rounded-lg"
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingDown
                  size={20}
                  className="text-red-600 lg:w-6 lg:h-6"
                />
              </div>
              <p className="text-sm font-medium text-red-700">Total Expenses</p>
              <p className="text-xl lg:text-2xl font-bold text-red-800">
                ₹{reportData.totalExpenses.toLocaleString()}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-center p-4 lg:p-6 rounded-lg ${
                reportData.netSavings >= 0 ? "bg-blue-50" : "bg-orange-50"
              }`}
            >
              <div
                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                  reportData.netSavings >= 0 ? "bg-blue-100" : "bg-orange-100"
                }`}
              >
                <DollarSign
                  size={20}
                  className={`lg:w-6 lg:h-6 ${
                    reportData.netSavings >= 0
                      ? "text-blue-600"
                      : "text-orange-600"
                  }`}
                />
              </div>
              <p
                className={`text-sm font-medium ${
                  reportData.netSavings >= 0
                    ? "text-blue-700"
                    : "text-orange-700"
                }`}
              >
                Net {reportData.netSavings >= 0 ? "Savings" : "Deficit"}
              </p>
              <p
                className={`text-xl lg:text-2xl font-bold ${
                  reportData.netSavings >= 0
                    ? "text-blue-800"
                    : "text-orange-800"
                }`}
              >
                ₹{Math.abs(reportData.netSavings).toLocaleString()}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 lg:p-6 bg-gray-50 rounded-lg"
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText size={20} className="text-gray-600 lg:w-6 lg:h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700">Transactions</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-800">
                {reportData.transactionCount}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Expense Categories */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Expense Breakdown
            </h3>
            {reportData.categoryData && reportData.categoryData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={250}
                className="lg:h-80"
              >
                <PieChart>
                  <Pie
                    data={reportData.categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {reportData.categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 lg:h-64 text-gray-500">
                <div className="text-center">
                  <p className="mb-2">No expense data available</p>
                  <Link
                    to="/transactions"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Add your first transaction
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Trend Chart */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {reportType === "monthly" ? "Daily" : "Monthly"} Trend
            </h3>
            {reportData.trendData && reportData.trendData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={250}
                className="lg:h-80"
              >
                <LineChart data={reportData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={reportType === "monthly" ? "date" : "month"}
                  />
                  <YAxis
                    formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  />
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
                    dataKey="net"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Net"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 lg:h-64 text-gray-500">
                <div className="text-center">
                  <p className="mb-2">No trend data available</p>
                  <Link
                    to="/transactions"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Add transactions to see trends
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Breakdown */}
        {reportData.accountBreakdown &&
          reportData.accountBreakdown.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Account-wise Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Account
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Income
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Expenses
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.accountBreakdown.map((account, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {account.account}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600">
                          ₹{account.income.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          ₹{account.expenses.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-medium ${
                            account.net >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ₹{Math.abs(account.net).toLocaleString()}
                          {account.net >= 0 ? " ↑" : " ↓"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Category Details */}
        {reportData.categoryData && reportData.categoryData.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Category Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.categoryData.map((category, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {category.name}
                    </h4>
                    <span className="text-sm text-gray-600 flex-shrink-0 ml-2">
                      {category.percentage}%
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mb-2">
                    ₹{category.value.toLocaleString()}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
