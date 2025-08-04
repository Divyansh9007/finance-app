import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
}

export interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'mutual_fund' | 'crypto' | 'gold' | 'sip' | 'other';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  createdAt: Date;
}

interface DataContextType {
  accounts: Account[];
  transactions: Transaction[];
  investments: Investment[];
  loading: boolean;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => Promise<void>;
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setTransactions([]);
      setInvestments([]);
      setLoading(false);
      return;
    }

    const unsubscribeAccounts = onSnapshot(
      query(collection(db, 'accounts'), where('userId', '==', user.uid)),
      (snapshot) => {
        const accountsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Account[];
        setAccounts(accountsData);
      }
    );

    const unsubscribeTransactions = onSnapshot(
      query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      ),
      (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Transaction[];
        setTransactions(transactionsData);
        setLoading(false);
      }
    );

    const unsubscribeInvestments = onSnapshot(
      query(collection(db, 'investments'), where('userId', '==', user.uid)),
      (snapshot) => {
        const investmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Investment[];
        setInvestments(investmentsData);
      }
    );

    return () => {
      unsubscribeAccounts();
      unsubscribeTransactions();
      unsubscribeInvestments();
    };
  }, [user]);

  const addAccount = async (account: Omit<Account, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'accounts'), {
        ...account,
        userId: user.uid,
        createdAt: new Date()
      });
      toast.success('Account added successfully!');
    } catch (error) {
      toast.error('Failed to add account');
      throw error;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      await updateDoc(doc(db, 'accounts', id), updates);
      toast.success('Account updated successfully!');
    } catch (error) {
      toast.error('Failed to update account');
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'accounts', id));
      toast.success('Account deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete account');
      throw error;
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId: user.uid,
        createdAt: new Date()
      });
      toast.success('Transaction added successfully!');
    } catch (error) {
      toast.error('Failed to add transaction');
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateDoc(doc(db, 'transactions', id), updates);
      toast.success('Transaction updated successfully!');
    } catch (error) {
      toast.error('Failed to update transaction');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success('Transaction deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete transaction');
      throw error;
    }
  };

  const addInvestment = async (investment: Omit<Investment, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'investments'), {
        ...investment,
        userId: user.uid,
        createdAt: new Date()
      });
      toast.success('Investment added successfully!');
    } catch (error) {
      toast.error('Failed to add investment');
      throw error;
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    try {
      await updateDoc(doc(db, 'investments', id), updates);
      toast.success('Investment updated successfully!');
    } catch (error) {
      toast.error('Failed to update investment');
      throw error;
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'investments', id));
      toast.success('Investment deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete investment');
      throw error;
    }
  };

  const value = {
    accounts,
    transactions,
    investments,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addInvestment,
    updateInvestment,
    deleteInvestment
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};