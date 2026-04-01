import type { Budget } from '../types';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetProgressProps {
  budgets: Budget[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(percentage: number): { bg: string; text: string; icon: React.ReactNode } {
  if (percentage >= 100) {
    return {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      icon: <AlertCircle size={16} />,
    };
  }
  if (percentage >= 80) {
    return {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      icon: <AlertTriangle size={16} />,
    };
  }
  return {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: <CheckCircle2 size={16} />,
  };
}

function BudgetItem({ budget }: { budget: Budget }) {
  const percentage = Math.min((budget.spent / budget.budgeted) * 100, 100);
  const status = getStatusColor(percentage);
  const isOverBudget = budget.spent > budget.budgeted;

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: budget.color }}
          />
          <span className="font-medium text-slate-800 dark:text-slate-100">
            {budget.category}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.icon}
          <span>{percentage.toFixed(0)}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-slate-600 dark:text-slate-400">
          Spent: <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(budget.spent)}</span>
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          Budget: {formatCurrency(budget.budgeted)}
        </span>
      </div>

      <div className="h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: budget.color,
            opacity: isOverBudget ? 0.8 : 1,
          }}
        />
      </div>

      {isOverBudget && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle size={12} />
          Over budget by {formatCurrency(budget.spent - budget.budgeted)}
        </p>
      )}
    </div>
  );
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalPercentage = (totalSpent / totalBudgeted) * 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Budget Progress
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track your spending against monthly budgets
        </p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Budget</span>
          <span className={`text-sm font-medium ${
            totalPercentage >= 100 
              ? 'text-red-600 dark:text-red-400' 
              : totalPercentage >= 80 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {totalPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              totalPercentage >= 100 
                ? 'bg-red-500' 
                : totalPercentage >= 80 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Spent: <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(totalSpent)}</span>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {formatCurrency(totalBudgeted)}
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {budgets.map((budget) => (
          <BudgetItem key={budget.category} budget={budget} />
        ))}
      </div>
    </div>
  );
}
