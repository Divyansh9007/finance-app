import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface TransactionFormData {
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
}

const schema = yup.object({
  accountId: yup.string().required('Account is required'),
  type: yup.string().oneOf(['income', 'expense']).required('Type is required'),
  amount: yup.number().positive('Amount must be positive').required('Amount is required'),
  category: yup.string().required('Category is required'),
  description: yup.string().required('Description is required'),
  date: yup.string().required('Date is required'),
  notes: yup.string()
});

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Others'
];

const INCOME_CATEGORIES = [
  'Salary',
  'Business',
  'Investment',
  'Freelance',
  'Rental',
  'Others'
];

const TransactionsPage: React.FC = () => {
  const {
    accounts,
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useData();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<TransactionFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const watchType = watch('type');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const transactionData = {
        ...data,
        amount: Number(data.amount),
        date: new Date(data.date)
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionData);
        setEditingTransaction(null);
      } else {
        await addTransaction(transactionData);
      }

      reset();
      setShowForm(false);
    } catch (error) {
      // Error handled by context
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    reset({
      accountId: transaction.accountId,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: format(transaction.date, 'yyyy-MM-dd'),
      notes: transaction.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        // Error handled by context
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
    reset();
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage your income and expenses</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <div className="flex items-center text-gray-600">
            <Filter size={16} className="mr-2" />
            <span className="text-sm">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Add/Edit Transaction Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account
                  </label>
                  <select
                    {...register('accountId')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} - ₹{account.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {errors.accountId && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    {...register('amount')}
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {(watchType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    {...register('description')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    {...register('date')}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any additional notes..."
                />
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
                  {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => {
              const account = accounts.find(a => a.id === transaction.accountId);
              
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight size={20} />
                        ) : (
                          <ArrowDownRight size={20} />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {transaction.description}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{transaction.category}</span>
                          <span>•</span>
                          <span>{account?.name}</span>
                          <span>•</span>
                          <span>{format(transaction.date, 'MMM d, yyyy')}</span>
                        </div>
                        {transaction.notes && (
                          <p className="text-sm text-gray-500 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first transaction.'
              }
            </p>
            {!searchTerm && filterType === 'all' && filterCategory === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
              >
                Add Your First Transaction
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;