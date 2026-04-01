import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import type { Transaction } from '../types';
import { categoryIcons } from '../data/mockData';

interface TransactionsTableProps {
  transactions: Transaction[];
}

type SortField = 'date' | 'description' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';

function formatCurrency(amount: number, type: 'income' | 'expense'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
  return type === 'income' ? `+${formatted}` : `-${formatted}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getSortIcon(field: SortField, sortField: SortField, sortDirection: SortDirection) {
  if (sortField !== field) {
    return <ArrowUpDown size={14} className="text-slate-400" />;
  }
  return sortDirection === 'asc' 
    ? <ArrowUp size={14} className="text-blue-500" />
    : <ArrowDown size={14} className="text-blue-500" />;
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.category))];
    return cats.sort();
  }, [transactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [transactions, sortField, sortDirection, filterCategory, searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Recent Transactions
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filteredAndSortedTransactions.length} transactions found
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
              />
            </div>
            
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-800 dark:text-slate-100 appearance-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {getSortIcon('date', sortField, sortDirection)}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center gap-1">
                  Description
                  {getSortIcon('description', sortField, sortDirection)}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category
                  {getSortIcon('category', sortField, sortDirection)}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  Amount
                  {getSortIcon('amount', sortField, sortDirection)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredAndSortedTransactions.map((transaction) => (
              <tr 
                key={transaction.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    <span>{categoryIcons[transaction.category] || '📦'}</span>
                    {transaction.category}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                  transaction.type === 'income' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(transaction.amount, transaction.type)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedTransactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">No transactions found</p>
        </div>
      )}
    </div>
  );
}
