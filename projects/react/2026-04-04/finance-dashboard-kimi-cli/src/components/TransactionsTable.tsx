import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import type { Transaction } from '../types';

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: string[];
}

type SortField = 'date' | 'description' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';

const formatCurrency = (amount: number, type: 'income' | 'expense'): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));
  return type === 'income' ? `+${formatted}` : `-${formatted}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const TransactionsTable = ({ transactions, categories }: TransactionsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by category
    if (filterCategory !== 'All') {
      result = result.filter((t) => t.category === filterCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
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

    return result;
  }, [transactions, sortField, sortDirection, filterCategory, searchQuery]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-[var(--muted-foreground)]" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-[var(--primary)]" />
    ) : (
      <ArrowDown className="w-4 h-4 text-[var(--primary)]" />
    );
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent Transactions</h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-full sm:w-48"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--accent)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Date
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                onClick={() => handleSort('description')}
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--accent)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Description
                  <SortIcon field="description" />
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--accent)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Category
                  <SortIcon field="category" />
                </div>
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider cursor-pointer hover:bg-[var(--accent)] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sortedAndFilteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  No transactions found
                </td>
              </tr>
            ) : (
              sortedAndFilteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-[var(--accent)] transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-sm text-[var(--foreground)] whitespace-nowrap">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                      {transaction.category}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-sm font-medium text-right whitespace-nowrap ${
                      transaction.type === 'income'
                        ? 'text-[var(--success)]'
                        : 'text-[var(--foreground)]'
                    }`}
                  >
                    {formatCurrency(transaction.amount, transaction.type)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
