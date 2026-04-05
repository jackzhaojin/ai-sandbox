import { TrendingUp, TrendingDown, Wallet, PiggyBank, DollarSign, Target } from 'lucide-react';
import type { SummaryData } from '../types';

interface SummaryCardsProps {
  data: SummaryData;
}

interface CardProps {
  title: string;
  amount: number;
  change: number;
  icon: React.ReactNode;
  color: string;
  isCurrency?: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Card = ({ title, amount, change, icon, color, isCurrency = true }: CardProps) => {
  const isPositive = change >= 0;
  const changeColor = change > 0 ? 'text-[var(--success)]' : change < 0 ? 'text-[var(--danger)]' : 'text-[var(--muted-foreground)]';
  
  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--muted-foreground)] mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[var(--foreground)]">
            {isCurrency ? formatCurrency(amount) : amount.toLocaleString()}
          </h3>
          <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${changeColor}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
            <span className="text-[var(--muted-foreground)] font-normal ml-1">vs last month</span>
          </div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

export const SummaryCards = ({ data }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Total Income"
        amount={data.income}
        change={data.incomeChange}
        icon={<DollarSign className="w-6 h-6" />}
        color="#3b82f6"
      />
      <Card
        title="Total Expenses"
        amount={data.expenses}
        change={data.expensesChange}
        icon={<Wallet className="w-6 h-6" />}
        color="#ef4444"
      />
      <Card
        title="Total Savings"
        amount={data.savings}
        change={data.savingsChange}
        icon={<PiggyBank className="w-6 h-6" />}
        color="#10b981"
      />
      <Card
        title="Net Worth"
        amount={data.netWorth}
        change={data.netWorthChange}
        icon={<Target className="w-6 h-6" />}
        color="#8b5cf6"
      />
    </div>
  );
};
