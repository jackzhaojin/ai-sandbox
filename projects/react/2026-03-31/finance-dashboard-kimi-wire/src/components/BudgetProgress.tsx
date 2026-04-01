import type { Budget } from '../types';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface BudgetProgressProps {
  budgets: Budget[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(percentage: number): { bg: string; text: string; icon: React.ReactNode } {
  if (percentage >= 100) {
    return {
      bg: 'bg-danger-500',
      text: 'text-danger-600 dark:text-danger-400',
      icon: <AlertCircle className="w-4 h-4" />,
    };
  }
  if (percentage >= 80) {
    return {
      bg: 'bg-warning-500',
      text: 'text-warning-600 dark:text-warning-400',
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  }
  return {
    bg: 'bg-success-500',
    text: 'text-success-600 dark:text-success-400',
    icon: <CheckCircle className="w-4 h-4" />,
  };
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-card p-6 border border-gray-100 dark:border-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Budget Overview
      </h2>
      <div className="space-y-5">
        {budgets.map((budget) => {
          const percentage = Math.round((budget.spent / budget.budgeted) * 100);
          const status = getStatusColor(percentage);
          const remaining = budget.budgeted - budget.spent;

          return (
            <div key={budget.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`${status.text}`}>{status.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {budget.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                  </span>
                </div>
              </div>

              <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${status.bg}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-medium ${
                    percentage >= 100
                      ? 'text-danger-600 dark:text-danger-400'
                      : percentage >= 80
                      ? 'text-warning-600 dark:text-warning-400'
                      : 'text-success-600 dark:text-success-400'
                  }`}
                >
                  {percentage}% used
                </span>
                <span
                  className={`${
                    remaining >= 0
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-danger-600 dark:text-danger-400'
                  }`}
                >
                  {remaining >= 0
                    ? `${formatCurrency(remaining)} remaining`
                    : `${formatCurrency(Math.abs(remaining))} over budget`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
