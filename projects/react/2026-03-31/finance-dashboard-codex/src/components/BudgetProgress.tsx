import { DashboardCard } from './DashboardCard'
import { currencyFormatter } from '../lib/format'
import type { BudgetItem } from '../types/finance'

interface BudgetProgressProps {
  budgets: BudgetItem[]
}

function getBudgetTone(percentage: number) {
  if (percentage < 75) {
    return {
      barClassName: 'bg-emerald-500',
      textClassName: 'text-emerald-500',
      badgeLabel: 'Healthy',
    }
  }

  if (percentage < 95) {
    return {
      barClassName: 'bg-amber-500',
      textClassName: 'text-amber-500',
      badgeLabel: 'Watch',
    }
  }

  return {
    barClassName: 'bg-rose-500',
    textClassName: 'text-rose-500',
    badgeLabel: 'Over target',
  }
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  return (
    <DashboardCard eyebrow="Budgets" title="Category pacing">
      <div className="space-y-4">
        {budgets.map((budget) => {
          const percentage = Math.round((budget.spent / budget.limit) * 100)
          const tone = getBudgetTone(percentage)

          return (
            <article
              key={budget.category}
              className="surface-subtle rounded-3xl p-4 transition duration-300 hover:border-[var(--border-strong)]"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {budget.category}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {budget.note}
                  </p>
                </div>
                <span
                  className={`rounded-full bg-current/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${tone.textClassName}`}
                >
                  {tone.badgeLabel}
                </span>
              </div>

              <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${tone.barClassName}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-[var(--text-secondary)]">
                  {currencyFormatter.format(budget.spent)} of{' '}
                  {currencyFormatter.format(budget.limit)}
                </p>
                <p className={`font-semibold ${tone.textClassName}`}>
                  {percentage}%
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </DashboardCard>
  )
}
