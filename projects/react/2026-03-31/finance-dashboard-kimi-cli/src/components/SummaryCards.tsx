import { TrendingUp, TrendingDown, Wallet, PiggyBank, DollarSign, BarChart3 } from 'lucide-react';
import type { SummaryData } from '../types';

interface SummaryCardsProps {
  data: SummaryData;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

interface CardProps {
  title: string;
  amount: number;
  change: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple';
}

function Card({ title, amount, change, icon, color }: CardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  const isPositive = change >= 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{formatPercent(change)}</span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
          {formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
}

export function SummaryCards({ data }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <Card
        title="Total Income"
        amount={data.income}
        change={data.incomeChange}
        icon={<DollarSign size={24} />}
        color="green"
      />
      <Card
        title="Total Expenses"
        amount={data.expenses}
        change={data.expensesChange}
        icon={<Wallet size={24} />}
        color="amber"
      />
      <Card
        title="Total Savings"
        amount={data.savings}
        change={data.savingsChange}
        icon={<PiggyBank size={24} />}
        color="blue"
      />
      <Card
        title="Net Worth"
        amount={data.netWorth}
        change={data.netWorthChange}
        icon={<BarChart3 size={24} />}
        color="purple"
      />
    </div>
  );
}
