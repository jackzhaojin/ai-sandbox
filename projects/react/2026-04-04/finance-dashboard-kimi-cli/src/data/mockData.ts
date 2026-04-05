import type { Transaction, MonthlyData, CategoryData, Budget, SummaryData } from '../types';

export const summaryData: SummaryData = {
  income: 12500,
  expenses: 8200,
  savings: 4300,
  netWorth: 145600,
  incomeChange: 12.5,
  expensesChange: -3.2,
  savingsChange: 28.4,
  netWorthChange: 8.7,
};

export const monthlyData: MonthlyData[] = [
  { month: 'May', income: 11000, expenses: 7800 },
  { month: 'Jun', income: 11200, expenses: 8100 },
  { month: 'Jul', income: 11500, expenses: 7900 },
  { month: 'Aug', income: 11800, expenses: 8200 },
  { month: 'Sep', income: 12000, expenses: 8000 },
  { month: 'Oct', income: 12200, expenses: 8300 },
  { month: 'Nov', income: 12400, expenses: 8100 },
  { month: 'Dec', income: 12500, expenses: 8200 },
  { month: 'Jan', income: 12300, expenses: 7900 },
  { month: 'Feb', income: 12500, expenses: 8000 },
  { month: 'Mar', income: 12600, expenses: 8100 },
  { month: 'Apr', income: 12500, expenses: 8200 },
];

export const categoryData: CategoryData[] = [
  { name: 'Housing', value: 2800, color: '#3b82f6' },
  { name: 'Food', value: 1200, color: '#10b981' },
  { name: 'Transportation', value: 800, color: '#f59e0b' },
  { name: 'Entertainment', value: 600, color: '#8b5cf6' },
  { name: 'Utilities', value: 500, color: '#ef4444' },
  { name: 'Healthcare', value: 400, color: '#06b6d4' },
  { name: 'Shopping', value: 900, color: '#ec4899' },
  { name: 'Other', value: 1000, color: '#64748b' },
];

export const transactions: Transaction[] = [
  { id: '1', date: '2026-04-03', description: 'Salary Deposit', category: 'Income', amount: 12500, type: 'income' },
  { id: '2', date: '2026-04-03', description: 'Whole Foods Market', category: 'Food', amount: 156.32, type: 'expense' },
  { id: '3', date: '2026-04-02', description: 'Netflix Subscription', category: 'Entertainment', amount: 15.99, type: 'expense' },
  { id: '4', date: '2026-04-02', description: 'Shell Gas Station', category: 'Transportation', amount: 65.0, type: 'expense' },
  { id: '5', date: '2026-04-01', description: 'Rent Payment', category: 'Housing', amount: 2800, type: 'expense' },
  { id: '6', date: '2026-04-01', description: 'Electric Bill', category: 'Utilities', amount: 145.5, type: 'expense' },
  { id: '7', date: '2026-03-31', description: 'Gym Membership', category: 'Healthcare', amount: 49.99, type: 'expense' },
  { id: '8', date: '2026-03-30', description: 'Target Shopping', category: 'Shopping', amount: 234.67, type: 'expense' },
  { id: '9', date: '2026-03-29', description: 'Uber Ride', category: 'Transportation', amount: 28.5, type: 'expense' },
  { id: '10', date: '2026-03-28', description: 'Restaurant Dinner', category: 'Food', amount: 89.5, type: 'expense' },
  { id: '11', date: '2026-03-27', description: 'Freelance Payment', category: 'Income', amount: 2500, type: 'income' },
  { id: '12', date: '2026-03-26', description: 'Pharmacy', category: 'Healthcare', amount: 32.25, type: 'expense' },
  { id: '13', date: '2026-03-25', description: 'Spotify Premium', category: 'Entertainment', amount: 9.99, type: 'expense' },
  { id: '14', date: '2026-03-24', description: 'Grocery Store', category: 'Food', amount: 127.8, type: 'expense' },
  { id: '15', date: '2026-03-23', description: 'Internet Bill', category: 'Utilities', amount: 79.99, type: 'expense' },
];

export const budgets: Budget[] = [
  { category: 'Housing', budgeted: 3000, spent: 2800, color: '#3b82f6' },
  { category: 'Food', budgeted: 1400, spent: 1200, color: '#10b981' },
  { category: 'Transportation', budgeted: 1000, spent: 800, color: '#f59e0b' },
  { category: 'Entertainment', budgeted: 800, spent: 600, color: '#8b5cf6' },
  { category: 'Utilities', budgeted: 600, spent: 500, color: '#ef4444' },
  { category: 'Healthcare', budgeted: 500, spent: 400, color: '#06b6d4' },
  { category: 'Shopping', budgeted: 1200, spent: 900, color: '#ec4899' },
];

export const categories = ['All', 'Income', 'Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'];
