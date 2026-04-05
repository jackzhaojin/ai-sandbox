import { TrendingUp, TrendingDown, Wallet, PiggyBank, DollarSign, BarChart3 } from 'lucide-react';
import { summaryData } from '../data/mockData';

interface CardProps {
  title: string;
  amount: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

function SummaryCard({ title, amount, change, icon, color }: CardProps) {
  const isPositive = change >= 0;
  const formattedAmount = amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 transition-colors">
            {formattedAmount}
          </h3>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {change}%
            </span>
            <span className="text-sm text-slate-400 dark:text-slate-500">vs last month</span>
          </div>
        </div>
        <div
          className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 transition-transform group-hover:scale-110 duration-300`}
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export function SummaryCards() {
  const cards = [
    {
      title: 'Total Income',
      amount: summaryData.totalIncome,
      change: summaryData.incomeChange,
      icon: <Wallet className="w-6 h-6" />,
      color: '#3b82f6',
    },
    {
      title: 'Total Expenses',
      amount: summaryData.totalExpenses,
      change: summaryData.expensesChange,
      icon: <DollarSign className="w-6 h-6" />,
      color: '#ef4444',
    },
    {
      title: 'Total Savings',
      amount: summaryData.totalSavings,
      change: summaryData.savingsChange,
      icon: <PiggyBank className="w-6 h-6" />,
      color: '#10b981',
    },
    {
      title: 'Net Worth',
      amount: summaryData.netWorth,
      change: summaryData.netWorthChange,
      icon: <BarChart3 className="w-6 h-6" />,
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}
