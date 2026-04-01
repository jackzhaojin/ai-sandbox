export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryExpense {
  name: string;
  value: number;
  color: string;
}

export interface Budget {
  category: string;
  spent: number;
  limit: number;
  color: string;
}

export const summaryData = {
  income: 8450.00,
  expenses: 6230.50,
  savings: 2219.50,
  netWorth: 48750.00,
};

export const monthlyTrends: MonthlyData[] = [
  { month: 'Jul', income: 7800, expenses: 5400 },
  { month: 'Aug', income: 8200, expenses: 5800 },
  { month: 'Sep', income: 7900, expenses: 5200 },
  { month: 'Oct', income: 8500, expenses: 6100 },
  { month: 'Nov', income: 8100, expenses: 5900 },
  { month: 'Dec', income: 8450, expenses: 6230.50 },
];

export const categoryExpenses: CategoryExpense[] = [
  { name: 'Housing', value: 1800, color: '#3b82f6' },
  { name: 'Food', value: 850, color: '#10b981' },
  { name: 'Transportation', value: 450, color: '#f59e0b' },
  { name: 'Entertainment', value: 320, color: '#8b5cf6' },
  { name: 'Utilities', value: 280, color: '#ef4444' },
  { name: 'Healthcare', value: 190, color: '#ec4899' },
  { name: 'Shopping', value: 680, color: '#06b6d4' },
  { name: 'Other', value: 660.50, color: '#6b7280' },
];

export const budgets: Budget[] = [
  { category: 'Housing', spent: 1800, limit: 2000, color: '#3b82f6' },
  { category: 'Food', spent: 850, limit: 800, color: '#10b981' },
  { category: 'Transportation', spent: 450, limit: 500, color: '#f59e0b' },
  { category: 'Entertainment', spent: 320, limit: 400, color: '#8b5cf6' },
  { category: 'Utilities', spent: 280, limit: 300, color: '#ef4444' },
  { category: 'Shopping', spent: 680, limit: 600, color: '#06b6d4' },
];

export const transactions: Transaction[] = [
  { id: '1', date: '2024-12-28', description: 'Grocery Store', category: 'Food', amount: -85.30, type: 'expense' },
  { id: '2', date: '2024-12-27', description: 'Monthly Salary', category: 'Income', amount: 8450.00, type: 'income' },
  { id: '3', date: '2024-12-25', description: 'Electric Bill', category: 'Utilities', amount: -120.00, type: 'expense' },
  { id: '4', date: '2024-12-24', description: 'Gas Station', category: 'Transportation', amount: -45.50, type: 'expense' },
  { id: '5', date: '2024-12-23', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, type: 'expense' },
  { id: '6', date: '2024-12-22', description: 'Online Shopping', category: 'Shopping', amount: -128.75, type: 'expense' },
  { id: '7', date: '2024-12-20', description: 'Restaurant', category: 'Food', amount: -68.40, type: 'expense' },
  { id: '8', date: '2024-12-18', description: 'Rent Payment', category: 'Housing', amount: -1800.00, type: 'expense' },
  { id: '9', date: '2024-12-15', description: 'Freelance Project', category: 'Income', amount: 500.00, type: 'income' },
  { id: '10', date: '2024-12-14', description: 'Doctor Visit', category: 'Healthcare', amount: -85.00, type: 'expense' },
  { id: '11', date: '2024-12-12', description: 'Grocery Store', category: 'Food', amount: -92.15, type: 'expense' },
  { id: '12', date: '2024-12-10', description: 'Water Bill', category: 'Utilities', amount: -45.50, type: 'expense' },
  { id: '13', date: '2024-12-08', description: 'Movie Tickets', category: 'Entertainment', amount: -32.00, type: 'expense' },
  { id: '14', date: '2024-12-05', description: 'Uber Ride', category: 'Transportation', amount: -28.30, type: 'expense' },
  { id: '15', date: '2024-12-03', description: 'Amazon Purchase', category: 'Shopping', amount: -156.90, type: 'expense' },
];
