export type Theme = 'light' | 'dark'

export type SummaryMetricId = 'income' | 'expenses' | 'savings' | 'netWorth'

export interface SummaryMetric {
  id: SummaryMetricId
  label: string
  value: number
  delta: number
  insight: string
}

export interface MonthlyTrendPoint {
  month: string
  income: number
  expenses: number
}

export interface ExpenseCategory {
  name: string
  value: number
  color: string
  change: string
}

export type TransactionCategory =
  | 'Income'
  | 'Housing'
  | 'Food'
  | 'Transport'
  | 'Utilities'
  | 'Health'
  | 'Shopping'
  | 'Leisure'
  | 'Investments'

export interface Transaction {
  id: string
  merchant: string
  category: TransactionCategory
  amount: number
  type: 'income' | 'expense'
  date: string
  account: string
  status: 'Cleared' | 'Pending'
}

export interface BudgetItem {
  category: Exclude<TransactionCategory, 'Income'>
  spent: number
  limit: number
  note: string
}
