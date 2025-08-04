import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  User,
  CreditCard,
  Bell,
  Shield,
  Download,
  Trash2,
  Plus,
  Edit2,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import toast from 'react-hot-toast';

interface AccountFormData {
  name: string;
  type: string;
  balance: number;
}

const accountSchema = yup.object({
  name: yup.string().required('Account name is required'),
  type: yup.string().required('Account type is required'),
  balance: yup.number().min(0, 'Balance cannot be negative').required('Balance is required')
});

const ACCOUNT_TYPES = [
  'Savings Account',
  'Current Account',
  'Credit Card',
  'Cash',
  'Investment Account',
  'Others'
];

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { accounts, addAccount, updateAccount, deleteAccount } = useData();
  const [activeTab, setActiveTab] = useState('profile');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AccountFormData>({
    resolver: yupResolver(accountSchema)
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Download }
  ];

  const onSubmitAccount = async (data: AccountFormData) => {
    try {
      const accountData = {
        ...data,
        balance: Number(data.balance)
      };

      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
        setEditingAccount(null);
      } else {
        await addAccount(accountData);
      }

      reset();
      setShowAccountForm(false);
    } catch (error) {
      // Error handled by context
    }
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
    reset({
      name: account.name,
      type: account.type,
      balance: account.balance
    });
    setShowAccountForm(true);
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account? This will also delete all associated transactions.')) {
      try {
        await deleteAccount(id);
      } catch (error) {
        // Error handled by context
      }
    }
  };

  const handleCancelAccount = () => {
    setShowAccountForm(false);
    setEditingAccount(null);
    reset();
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={user?.displayName || ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <input
              type="text"
              value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Bank Accounts</h3>
          <p className="text-gray-600">Manage your bank accounts and balances</p>
        </div>
        <button
          onClick={() => setShowAccountForm(true)}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Account
        </button>
      </div>

      {/* Account Form */}
      {showAccountForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border"
        >
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-gray-900">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h4>
            <button
              onClick={handleCancelAccount}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmitAccount)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., HDFC Savings"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  {ACCOUNT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Balance (₹)
                </label>
                <input
                  {...register('balance')}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {errors.balance && (
                  <p className="mt-1 text-sm text-red-600">{errors.balance.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancelAccount}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
              >
                {editingAccount ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Accounts List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {accounts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <div key={account.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{account.name}</h4>
                    <p className="text-sm text-gray-600">{account.type}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₹{account.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first bank account to start tracking your finances.
            </p>
            <button
              onClick={() => setShowAccountForm(true)}
              className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              Add Your First Account
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Transaction Alerts</h4>
              <p className="text-sm text-gray-600">Get notified when new transactions are added</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Monthly Reports</h4>
              <p className="text-sm text-gray-600">Receive monthly financial summary reports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Budget Alerts</h4>
              <p className="text-sm text-gray-600">Get alerts when you're close to budget limits</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Security Settings</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Password</h4>
            <p className="text-sm text-gray-600 mb-4">
              Change your password to keep your account secure
            </p>
            <button className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors">
              Change Password
            </button>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-600 mb-4">
              Add an extra layer of security to your account
            </p>
            <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Enable 2FA
            </button>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Login Sessions</h4>
            <p className="text-sm text-gray-600 mb-4">
              Manage your active login sessions
            </p>
            <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              View Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Data & Privacy</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Export Data</h4>
            <p className="text-sm text-gray-600 mb-4">
              Download a copy of all your financial data
            </p>
            <button
              onClick={() => toast.success('Data export will be available soon!')}
              className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center"
            >
              <Download size={16} className="mr-2" />
              Export Data
            </button>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Delete Account</h4>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data
            </p>
            <button
              onClick={() => toast.error('Account deletion will be available soon!')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'accounts':
        return renderAccountsTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'data':
        return renderDataTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;