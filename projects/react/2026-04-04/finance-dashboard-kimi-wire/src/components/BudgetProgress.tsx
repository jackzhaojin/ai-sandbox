import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { budgets } from '../data/mockData';

interface BudgetItemProps {
  category: string;
  budgeted: number;
  spent: number;
  color: string;
}

function BudgetItem({ category, budgeted, spent, color }: BudgetItemProps) {
  const percentage = Math.min((spent / budgeted) * 100, 100);
  const remaining = budgeted - spent;
  const isOverBudget = spent > budgeted;
  const isNearLimit = percentage >= 80 && !isOverBudget;

  let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  let statusText = 'On track';
  let statusColor = 'text-emerald-500';

  if (isOverBudget) {
    statusIcon = <AlertCircle className="w-4 h-4 text-red-500" />;
    statusText = 'Over budget';
    statusColor = 'text-red-500';
  } else if (isNearLimit) {
    statusIcon = <AlertTriangle className="w-4 h-4 text-amber-500" />;
    statusText = 'Near limit';
    statusColor = 'text-amber-500';
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {category}
          </span>
          <div className={`flex items-center gap-1 ${statusColor}`}>
            {statusIcon}
            <span className="text-xs">{statusText}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatCurrency(spent)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {' '}
            / {formatCurrency(budgeted)}
          </span>
        </div>
      </div>

      <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOverBudget ? '#ef4444' : isNearLimit ? '#f59e0b' : color,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{percentage.toFixed(0)}% used</span>
        <span>
          {isOverBudget
            ? `${formatCurrency(Math.abs(remaining))} over`
            : `${formatCurrency(remaining)} remaining`}
        </span>
      </div>
    </div>
  );
}

export function BudgetProgress() {
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalPercentage = (totalSpent / totalBudgeted) * 100;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Budget Progress
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track your spending against budgets
        </p>
      </div>

      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Budget
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
          </span>
        </div>
        <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
          {totalPercentage.toFixed(1)}% of total budget used
        </div>
      </div>

      <div className="space-y-6">
        {budgets.map((budget) => (
          <BudgetItem
            key={budget.category}
            category={budget.category}
            budgeted={budget.budgeted}
            spent={budget.spent}
            color={budget.color}
          />
        ))}
      </div>
    </div>
  );
}
