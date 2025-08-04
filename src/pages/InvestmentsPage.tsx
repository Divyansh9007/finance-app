import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Edit2,
  Trash2,
  Target,
  PieChart,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useData } from "../contexts/DataContext";

interface InvestmentFormData {
  name: string;
  type: "stock" | "mutual_fund" | "crypto" | "gold" | "sip" | "other";
  quantity: number;
  buyPrice: number;
  currentPrice: number;
}

const schema = yup.object({
  name: yup.string().required("Investment name is required"),
  type: yup
    .string()
    .oneOf(["stock", "mutual_fund", "crypto", "gold", "sip", "other"])
    .required("Type is required"),
  quantity: yup
    .number()
    .positive("Quantity must be positive")
    .required("Quantity is required"),
  buyPrice: yup
    .number()
    .positive("Buy price must be positive")
    .required("Buy price is required"),
  currentPrice: yup
    .number()
    .positive("Current price must be positive")
    .required("Current price is required"),
});

const INVESTMENT_TYPES = [
  { value: "stock", label: "Stocks" },
  { value: "mutual_fund", label: "Mutual Funds" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "gold", label: "Gold" },
  { value: "sip", label: "SIP" },
  { value: "other", label: "Others" },
];

const InvestmentsPage: React.FC = () => {
  const {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
  } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvestmentFormData>({
    resolver: yupResolver(schema),
  });

  const portfolioData = React.useMemo(() => {
    const totalInvestmentValue = investments.reduce(
      (sum, inv) => sum + inv.quantity * inv.currentPrice,
      0
    );

    const totalInvestmentCost = investments.reduce(
      (sum, inv) => sum + inv.quantity * inv.buyPrice,
      0
    );

    const totalGainLoss = totalInvestmentValue - totalInvestmentCost;
    const totalGainLossPercentage =
      totalInvestmentCost > 0 ? (totalGainLoss / totalInvestmentCost) * 100 : 0;

    // Type-wise breakdown
    const typeBreakdown = investments.reduce((acc, inv) => {
      const value = inv.quantity * inv.currentPrice;
      const cost = inv.quantity * inv.buyPrice;
      const gainLoss = value - cost;

      if (!acc[inv.type]) {
        acc[inv.type] = {
          type: inv.type,
          value: 0,
          cost: 0,
          gainLoss: 0,
          count: 0,
        };
      }

      acc[inv.type].value += value;
      acc[inv.type].cost += cost;
      acc[inv.type].gainLoss += gainLoss;
      acc[inv.type].count += 1;

      return acc;
    }, {} as Record<string, any>);

    const typeData = Object.values(typeBreakdown).map((type: any) => ({
      ...type,
      name:
        INVESTMENT_TYPES.find((t) => t.value === type.type)?.label || type.type,
      percentage:
        totalInvestmentValue > 0
          ? (type.value / totalInvestmentValue) * 100
          : 0,
    }));

    // Individual investment data with calculated metrics
    const investmentData = investments.map((inv) => {
      const currentValue = inv.quantity * inv.currentPrice;
      const totalCost = inv.quantity * inv.buyPrice;
      const gainLoss = currentValue - totalCost;
      const gainLossPercentage =
        totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

      return {
        ...inv,
        currentValue,
        totalCost,
        gainLoss,
        gainLossPercentage,
      };
    });

    return {
      totalInvestmentValue,
      totalInvestmentCost,
      totalGainLoss,
      totalGainLossPercentage,
      typeData,
      investmentData,
    };
  }, [investments]);

  const onSubmit = async (data: InvestmentFormData) => {
    try {
      const investmentData = {
        ...data,
        quantity: Number(data.quantity),
        buyPrice: Number(data.buyPrice),
        currentPrice: Number(data.currentPrice),
      };

      if (editingInvestment) {
        await updateInvestment(editingInvestment.id, investmentData);
        setEditingInvestment(null);
      } else {
        await addInvestment(investmentData);
      }

      reset();
      setShowForm(false);
    } catch (error) {
      // Error handled by context
    }
  };

  const handleEdit = (investment: any) => {
    setEditingInvestment(investment);
    reset({
      name: investment.name,
      type: investment.type,
      quantity: investment.quantity,
      buyPrice: investment.buyPrice,
      currentPrice: investment.currentPrice,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this investment?")) {
      try {
        await deleteInvestment(id);
      } catch (error) {
        // Error handled by context
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingInvestment(null);
    reset();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Investment Portfolio
          </h1>
          <p className="text-gray-600">
            Track your stocks, mutual funds, and other investments
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Investment
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{portfolioData.totalInvestmentValue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{portfolioData.totalInvestmentCost.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Target size={24} className="text-gray-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Gain/Loss
              </p>
              <p
                className={`text-2xl font-bold ${
                  portfolioData.totalGainLoss >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {portfolioData.totalGainLoss >= 0 ? "+" : ""}₹
                {portfolioData.totalGainLoss.toLocaleString()}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                portfolioData.totalGainLoss >= 0 ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {portfolioData.totalGainLoss >= 0 ? (
                <TrendingUp size={24} className="text-green-600" />
              ) : (
                <TrendingDown size={24} className="text-red-600" />
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Return %</p>
              <p
                className={`text-2xl font-bold ${
                  portfolioData.totalGainLossPercentage >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {portfolioData.totalGainLossPercentage >= 0 ? "+" : ""}
                {portfolioData.totalGainLossPercentage.toFixed(2)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <PieChart size={24} className="text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Investment Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingInvestment ? "Edit Investment" : "Add New Investment"}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Name
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., RELIANCE, HDFC Equity Fund"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    {...register("type")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {INVESTMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity/Units
                  </label>
                  <input
                    {...register("quantity")}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buy Price (₹)
                  </label>
                  <input
                    {...register("buyPrice")}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.buyPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.buyPrice.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Price (₹)
                  </label>
                  <input
                    {...register("currentPrice")}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.currentPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.currentPrice.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                >
                  {editingInvestment ? "Update Investment" : "Add Investment"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts */}
      {portfolioData.typeData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Portfolio Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-2xl shadow-sm border"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Portfolio Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={portfolioData.typeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percentage }) =>
                    `${name} ${percentage.toFixed(1)}%`
                  }
                >
                  {portfolioData.typeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Type-wise Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Type-wise Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={portfolioData.typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis formatter={(value) => `₹${value.toLocaleString()}`} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="gainLoss" fill="#000000" name="Gain/Loss" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Investments List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {portfolioData.investmentData.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {portfolioData.investmentData.map((investment) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        investment.gainLoss >= 0
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {investment.gainLoss >= 0 ? (
                        <TrendingUp size={20} />
                      ) : (
                        <TrendingDown size={20} />
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900">
                        {investment.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          {
                            INVESTMENT_TYPES.find(
                              (t) => t.value === investment.type
                            )?.label
                          }
                        </span>
                        <span>•</span>
                        <span>{investment.quantity} units</span>
                        <span>•</span>
                        <span>Buy: ₹{investment.buyPrice}</span>
                        <span>•</span>
                        <span>Current: ₹{investment.currentPrice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ₹{investment.currentValue.toLocaleString()}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          investment.gainLoss >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {investment.gainLoss >= 0 ? "+" : ""}₹
                        {investment.gainLoss.toLocaleString()}(
                        {investment.gainLossPercentage >= 0 ? "+" : ""}
                        {investment.gainLossPercentage.toFixed(2)}%)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(investment)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(investment.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No investments yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start building your investment portfolio by adding your first
              investment.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              Add Your First Investment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentsPage;
