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

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface Budget {
  category: string;
  budgeted: number;
  spent: number;
  color: string;
}

export const monthlyTrendData: MonthlyData[] = [
  { month: 'Jan', income: 5200, expenses: 3800 },
  { month: 'Feb', income: 5500, expenses: 4100 },
  { month: 'Mar', income: 5300, expenses: 3600 },
  { month: 'Apr', income: 5800, expenses: 4200 },
  { month: 'May', income: 5600, expenses: 3900 },
  { month: 'Jun', income: 6000, expenses: 4300 },
  { month: 'Jul', income: 6200, expenses: 4100 },
  { month: 'Aug', income: 5900, expenses: 3800 },
  { month: 'Sep', income: 6100, expenses: 4000 },
  { month: 'Oct', income: 6300, expenses: 4200 },
  { month: 'Nov', income: 5800, expenses: 3900 },
  { month: 'Dec', income: 6500, expenses: 4500 },
];

export const expenseCategories: CategoryData[] = [
  { name: 'Housing', value: 1200, color: '#3b82f6' },
  { name: 'Food', value: 600, color: '#10b981' },
  { name: 'Transportation', value: 400, color: '#f59e0b' },
  { name: 'Entertainment', value: 300, color: '#8b5cf6' },
  { name: 'Utilities', value: 250, color: '#ef4444' },
  { name: 'Healthcare', value: 200, color: '#ec4899' },
  { name: 'Shopping', value: 350, color: '#06b6d4' },
  { name: 'Other', value: 200, color: '#6b7280' },
];

export const transactions: Transaction[] = [
  { id: '1', date: '2026-04-04', description: 'Salary Deposit', category: 'Income', amount: 5800, type: 'income' },
  { id: '2', date: '2026-04-03', description: 'Whole Foods Market', category: 'Food', amount: -145.67, type: 'expense' },
  { id: '3', date: '2026-04-02', description: 'Electric Bill', category: 'Utilities', amount: -125.00, type: 'expense' },
  { id: '4', date: '2026-04-01', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, type: 'expense' },
  { id: '5', date: '2026-04-01', description: 'Rent Payment', category: 'Housing', amount: -1200.00, type: 'expense' },
  { id: '6', date: '2026-03-31', description: 'Gas Station', category: 'Transportation', amount: -65.43, type: 'expense' },
  { id: '7', date: '2026-03-30', description: 'Freelance Project', category: 'Income', amount: 850.00, type: 'income' },
  { id: '8', date: '2026-03-29', description: 'Restaurant', category: 'Food', amount: -78.50, type: 'expense' },
  { id: '9', date: '2026-03-28', description: 'Pharmacy', category: 'Healthcare', amount: -45.20, type: 'expense' },
  { id: '10', date: '2026-03-27', description: 'Amazon Purchase', category: 'Shopping', amount: -129.99, type: 'expense' },
  { id: '11', date: '2026-03-26', description: 'Uber Ride', category: 'Transportation', amount: -24.50, type: 'expense' },
  { id: '12', date: '2026-03-25', description: 'Gym Membership', category: 'Healthcare', amount: -49.99, type: 'expense' },
  { id: '13', date: '2026-03-24', description: 'Coffee Shop', category: 'Food', amount: -6.75, type: 'expense' },
  { id: '14', date: '2026-03-23', description: 'Internet Bill', category: 'Utilities', amount: -79.99, type: 'expense' },
  { id: '15', date: '2026-03-22', description: 'Movie Theater', category: 'Entertainment', amount: -32.00, type: 'expense' },
];

export const budgets: Budget[] = [
  { category: 'Housing', budgeted: 1300, spent: 1200, color: '#3b82f6' },
  { category: 'Food', budgeted: 700, spent: 650, color: '#10b981' },
  { category: 'Transportation', budgeted: 500, spent: 380, color: '#f59e0b' },
  { category: 'Entertainment', budgeted: 300, spent: 280, color: '#8b5cf6' },
  { category: 'Utilities', budgeted: 250, spent: 225, color: '#ef4444' },
  { category: 'Healthcare', budgeted: 200, spent: 150, color: '#ec4899' },
  { category: 'Shopping', budgeted: 400, spent: 420, color: '#06b6d4' },
];

export const summaryData = {
  totalIncome: 6200,
  totalExpenses: 3500,
  totalSavings: 2700,
  netWorth: 125000,
  incomeChange: 8.5,
  expensesChange: -3.2,
  savingsChange: 15.3,
  netWorthChange: 4.2,
};

export const categoryIcons: Record<string, string> = {
  Housing: 'Home',
  Food: 'UtensilsCrossed',
  Transportation: 'Car',
  Entertainment: 'Film',
  Utilities: 'Zap',
  Healthcare: 'Heart',
  Shopping: 'ShoppingBag',
  Income: 'Wallet',
  Other: 'MoreHorizontal',
};
