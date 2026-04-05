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

export interface SummaryData {
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
  incomeChange: number;
  expensesChange: number;
  savingsChange: number;
  netWorthChange: number;
}
