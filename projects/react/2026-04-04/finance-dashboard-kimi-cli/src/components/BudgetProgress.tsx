import type { Budget } from '../types';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetProgressProps {
  budgets: Budget[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getProgressColor = (spent: number, budgeted: number): string => {
  const percentage = (spent / budgeted) * 100;
  if (percentage < 70) return 'var(--success)';
  if (percentage < 90) return 'var(--warning)';
  return 'var(--danger)';
};

const getStatusIcon = (spent: number, budgeted: number) => {
  const percentage = (spent / budgeted) * 100;
  if (percentage < 70) {
    return <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />;
  }
  if (percentage < 90) {
    return <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />;
  }
  return <AlertCircle className="w-4 h-4 text-[var(--danger)]" />;
};

const getStatusText = (spent: number, budgeted: number): string => {
  const remaining = budgeted - spent;
  return `${formatCurrency(remaining)} left`;
};

export const BudgetProgress = ({ budgets }: BudgetProgressProps) => {
  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)] shadow-sm">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Budget Progress</h3>
      <div className="space-y-5">
        {budgets.map((budget) => {
          const percentage = Math.min((budget.spent / budget.budgeted) * 100, 100);
          const progressColor = getProgressColor(budget.spent, budget.budgeted);
          const statusIcon = getStatusIcon(budget.spent, budget.budgeted);
          const statusText = getStatusText(budget.spent, budget.budgeted);

          return (
            <div key={budget.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: budget.color }}
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {budget.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon}
                  <span className="text-xs text-[var(--muted-foreground)]">{statusText}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                </span>
                <span
                  className="font-medium"
                  style={{ color: progressColor }}
                >
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: progressColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
