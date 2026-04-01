import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, PiggyBank, DollarSign } from 'lucide-react';
import type { SummaryData } from '../types';

interface SummaryCardsProps {
  data: SummaryData;
}

interface CardProps {
  title: string;
  amount: number;
  change: number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function Card({ title, amount, change, icon, colorClass, bgClass }: CardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-lg ${bgClass} flex items-center justify-center`}>
          <div className={colorClass}>{icon}</div>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(amount)}</p>
      </div>
    </div>
  );
}

export function SummaryCards({ data }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Total Income"
        amount={data.income}
        change={data.incomeChange}
        icon={<TrendingUp className="w-6 h-6" />}
        colorClass="text-success-600 dark:text-success-400"
        bgClass="bg-success-50 dark:bg-success-900/20"
      />
      <Card
        title="Total Expenses"
        amount={data.expenses}
        change={data.expensesChange}
        icon={<TrendingDown className="w-6 h-6" />}
        colorClass="text-danger-600 dark:text-danger-400"
        bgClass="bg-danger-50 dark:bg-danger-900/20"
      />
      <Card
        title="Savings"
        amount={data.savings}
        change={data.savingsChange}
        icon={<PiggyBank className="w-6 h-6" />}
        colorClass="text-primary-600 dark:text-primary-400"
        bgClass="bg-primary-50 dark:bg-primary-900/20"
      />
      <Card
        title="Net Worth"
        amount={data.netWorth}
        change={data.netWorthChange}
        icon={<DollarSign className="w-6 h-6" />}
        colorClass="text-warning-600 dark:text-warning-400"
        bgClass="bg-warning-50 dark:bg-warning-900/20"
      />
    </div>
  );
}
