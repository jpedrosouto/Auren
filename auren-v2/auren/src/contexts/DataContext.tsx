import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { fetchTransactions, appendTransaction, deleteTransactionRow, Transaction } from '../services/googleSheets';
import { useAuth } from './AuthContext';

interface DataContextType {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  refresh: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  transactions: [], isLoading: false, error: null, lastSync: null,
  refresh: async () => {}, addTransaction: async () => {}, deleteTransaction: async () => {},
});

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTransactions();
      setTransactions(data);
      setLastSync(new Date());
    } catch (e: any) {
      if (e.message === 'SPREADSHEET_NOT_SET') {
        setError('SPREADSHEET_NOT_SET');
      } else if (e.message === 'AUTH_REQUIRED') {
        setError('AUTH_REQUIRED');
      } else {
        setError(e.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    await appendTransaction(t);
    await refresh();
  };

  const deleteTransaction = async (id: number) => {
    // id is 1-based; real sheet row = id + 1 (header), index = id (0-based header row 0)
    await deleteTransactionRow(id);
    await refresh();
  };

  return (
    <DataContext.Provider value={{ transactions, isLoading, error, lastSync, refresh, addTransaction, deleteTransaction }}>
      {children}
    </DataContext.Provider>
  );
};
