import type { Transaction, MonthlyData, CategoryData, Budget, SummaryData } from '../types';

export const summaryData: SummaryData = {
  income: 8450.00,
  expenses: 5230.50,
  savings: 3219.50,
  netWorth: 127450.00,
  incomeChange: 12.5,
  expensesChange: -3.2,
  savingsChange: 28.4,
  netWorthChange: 8.7,
};

export const monthlyData: MonthlyData[] = [
  { month: 'Apr 2025', income: 7800, expenses: 5400 },
  { month: 'May 2025', income: 8200, expenses: 5100 },
  { month: 'Jun 2025', income: 7900, expenses: 5300 },
  { month: 'Jul 2025', income: 8500, expenses: 5200 },
  { month: 'Aug 2025', income: 8300, expenses: 5000 },
  { month: 'Sep 2025', income: 8600, expenses: 5150 },
  { month: 'Oct 2025', income: 8100, expenses: 5400 },
  { month: 'Nov 2025', income: 8400, expenses: 5100 },
  { month: 'Dec 2025', income: 9200, expenses: 5800 },
  { month: 'Jan 2026', income: 8200, expenses: 4950 },
  { month: 'Feb 2026', income: 8450, expenses: 5200 },
  { month: 'Mar 2026', income: 8450, expenses: 5230 },
];

export const categoryData: CategoryData[] = [
  { name: 'Housing', value: 1800, color: '#3b82f6' },
  { name: 'Food', value: 850, color: '#22c55e' },
  { name: 'Transportation', value: 520, color: '#f59e0b' },
  { name: 'Entertainment', value: 480, color: '#8b5cf6' },
  { name: 'Utilities', value: 380, color: '#ef4444' },
  { name: 'Shopping', value: 650, color: '#ec4899' },
  { name: 'Healthcare', value: 320, color: '#06b6d4' },
  { name: 'Other', value: 230, color: '#6b7280' },
];

export const transactions: Transaction[] = [
  { id: '1', date: '2026-03-28', description: 'Salary Deposit', category: 'Income', amount: 8450.00, type: 'income' },
  { id: '2', date: '2026-03-27', description: 'Whole Foods Market', category: 'Food', amount: 156.43, type: 'expense' },
  { id: '3', date: '2026-03-26', description: 'Electric Bill', category: 'Utilities', amount: 142.50, type: 'expense' },
  { id: '4', date: '2026-03-25', description: 'Uber Ride', category: 'Transportation', amount: 24.50, type: 'expense' },
  { id: '5', date: '2026-03-24', description: 'Netflix Subscription', category: 'Entertainment', amount: 15.99, type: 'expense' },
  { id: '6', date: '2026-03-23', description: 'Amazon Purchase', category: 'Shopping', amount: 89.99, type: 'expense' },
  { id: '7', date: '2026-03-22', description: 'Gas Station', category: 'Transportation', amount: 45.00, type: 'expense' },
  { id: '8', date: '2026-03-21', description: 'Restaurant Dinner', category: 'Food', amount: 78.50, type: 'expense' },
  { id: '9', date: '2026-03-20', description: 'Pharmacy', category: 'Healthcare', amount: 32.25, type: 'expense' },
  { id: '10', date: '2026-03-19', description: 'Gym Membership', category: 'Healthcare', amount: 49.99, type: 'expense' },
  { id: '11', date: '2026-03-18', description: 'Coffee Shop', category: 'Food', amount: 6.50, type: 'expense' },
  { id: '12', date: '2026-03-17', description: 'Spotify Premium', category: 'Entertainment', amount: 9.99, type: 'expense' },
  { id: '13', date: '2026-03-16', description: 'Target', category: 'Shopping', amount: 127.35, type: 'expense' },
  { id: '14', date: '2026-03-15', description: 'Rent Payment', category: 'Housing', amount: 1800.00, type: 'expense' },
  { id: '15', date: '2026-03-14', description: 'Internet Bill', category: 'Utilities', amount: 79.99, type: 'expense' },
  { id: '16', date: '2026-03-13', description: 'Freelance Project', category: 'Income', amount: 1200.00, type: 'income' },
  { id: '17', date: '2026-03-12', description: 'Movie Theater', category: 'Entertainment', amount: 42.00, type: 'expense' },
  { id: '18', date: '2026-03-11', description: 'Grocery Store', category: 'Food', amount: 234.67, type: 'expense' },
  { id: '19', date: '2026-03-10', description: 'Car Insurance', category: 'Transportation', amount: 145.00, type: 'expense' },
  { id: '20', date: '2026-03-09', description: 'Doctor Visit', category: 'Healthcare', amount: 125.00, type: 'expense' },
];

export const budgets: Budget[] = [
  { category: 'Housing', budgeted: 2000, spent: 1800, color: '#3b82f6' },
  { category: 'Food', budgeted: 1000, spent: 850, color: '#22c55e' },
  { category: 'Transportation', budgeted: 600, spent: 520, color: '#f59e0b' },
  { category: 'Entertainment', budgeted: 400, spent: 480, color: '#8b5cf6' },
  { category: 'Utilities', budgeted: 350, spent: 380, color: '#ef4444' },
  { category: 'Shopping', budgeted: 500, spent: 650, color: '#ec4899' },
  { category: 'Healthcare', budgeted: 400, spent: 320, color: '#06b6d4' },
  { category: 'Other', budgeted: 200, spent: 230, color: '#6b7280' },
];

export const categoryIcons: Record<string, string> = {
  'Income': 'Wallet',
  'Housing': 'Home',
  'Food': 'UtensilsCrossed',
  'Transportation': 'Car',
  'Entertainment': 'Film',
  'Utilities': 'Zap',
  'Shopping': 'ShoppingBag',
  'Healthcare': 'Heart',
  'Other': 'MoreHorizontal',
};
