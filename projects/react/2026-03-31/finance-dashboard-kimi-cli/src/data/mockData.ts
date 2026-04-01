import type { Transaction, MonthlyData, CategoryData, Budget, SummaryData } from '../types';

export const summaryData: SummaryData = {
  income: 8500,
  expenses: 5200,
  savings: 3300,
  netWorth: 142500,
  incomeChange: 12.5,
  expensesChange: -3.2,
  savingsChange: 45.8,
  netWorthChange: 8.3,
};

export const monthlyData: MonthlyData[] = [
  { month: 'Apr', income: 7800, expenses: 5400 },
  { month: 'May', income: 8200, expenses: 5100 },
  { month: 'Jun', income: 7900, expenses: 5300 },
  { month: 'Jul', income: 8500, expenses: 5200 },
  { month: 'Aug', income: 8300, expenses: 4900 },
  { month: 'Sep', income: 8600, expenses: 5100 },
  { month: 'Oct', income: 8200, expenses: 5300 },
  { month: 'Nov', income: 8800, expenses: 5000 },
  { month: 'Dec', income: 9200, expenses: 5800 },
  { month: 'Jan', income: 8500, expenses: 5200 },
  { month: 'Feb', income: 8700, expenses: 5100 },
  { month: 'Mar', income: 8500, expenses: 5200 },
];

export const categoryData: CategoryData[] = [
  { name: 'Housing', value: 1800, color: '#3b82f6' },
  { name: 'Food', value: 800, color: '#10b981' },
  { name: 'Transport', value: 600, color: '#f59e0b' },
  { name: 'Utilities', value: 400, color: '#ef4444' },
  { name: 'Entertainment', value: 650, color: '#8b5cf6' },
  { name: 'Healthcare', value: 350, color: '#06b6d4' },
  { name: 'Shopping', value: 600, color: '#ec4899' },
];

export const budgets: Budget[] = [
  { category: 'Housing', budgeted: 2000, spent: 1800, color: '#3b82f6' },
  { category: 'Food', budgeted: 900, spent: 800, color: '#10b981' },
  { category: 'Transport', budgeted: 700, spent: 600, color: '#f59e0b' },
  { category: 'Utilities', budgeted: 450, spent: 400, color: '#ef4444' },
  { category: 'Entertainment', budgeted: 500, spent: 650, color: '#8b5cf6' },
  { category: 'Healthcare', budgeted: 400, spent: 350, color: '#06b6d4' },
  { category: 'Shopping', budgeted: 500, spent: 600, color: '#ec4899' },
];

export const transactions: Transaction[] = [
  { id: '1', date: '2026-03-31', description: 'Whole Foods Market', category: 'Food', amount: 156.43, type: 'expense' },
  { id: '2', date: '2026-03-30', description: 'Monthly Salary', category: 'Income', amount: 8500.00, type: 'income' },
  { id: '3', date: '2026-03-30', description: 'Shell Gas Station', category: 'Transport', amount: 65.00, type: 'expense' },
  { id: '4', date: '2026-03-29', description: 'Netflix Subscription', category: 'Entertainment', amount: 15.99, type: 'expense' },
  { id: '5', date: '2026-03-28', description: 'Target', category: 'Shopping', amount: 234.56, type: 'expense' },
  { id: '6', date: '2026-03-27', description: 'Electric Bill', category: 'Utilities', amount: 145.00, type: 'expense' },
  { id: '7', date: '2026-03-26', description: 'Uber Ride', category: 'Transport', amount: 28.50, type: 'expense' },
  { id: '8', date: '2026-03-25', description: 'CVS Pharmacy', category: 'Healthcare', amount: 42.99, type: 'expense' },
  { id: '9', date: '2026-03-24', description: 'Starbucks', category: 'Food', amount: 8.75, type: 'expense' },
  { id: '10', date: '2026-03-23', description: 'Amazon', category: 'Shopping', amount: 89.99, type: 'expense' },
  { id: '11', date: '2026-03-22', description: 'Gym Membership', category: 'Healthcare', amount: 75.00, type: 'expense' },
  { id: '12', date: '2026-03-21', description: 'Movie Theater', category: 'Entertainment', amount: 45.00, type: 'expense' },
  { id: '13', date: '2026-03-20', description: 'Rent Payment', category: 'Housing', amount: 1800.00, type: 'expense' },
  { id: '14', date: '2026-03-19', description: 'Freelance Work', category: 'Income', amount: 1200.00, type: 'income' },
  { id: '15', date: '2026-03-18', description: 'Restaurant', category: 'Food', amount: 85.00, type: 'expense' },
];

export const categoryIcons: Record<string, string> = {
  'Housing': '🏠',
  'Food': '🍽️',
  'Transport': '🚗',
  'Utilities': '⚡',
  'Entertainment': '🎬',
  'Healthcare': '🏥',
  'Shopping': '🛍️',
  'Income': '💰',
};
