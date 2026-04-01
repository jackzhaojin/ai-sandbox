import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  PiggyBank,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { compactCurrencyFormatter, formatSignedPercent } from '../lib/format'
import type { SummaryMetric, SummaryMetricId } from '../types/finance'

const cardConfig: Record<
  SummaryMetricId,
  {
    icon: LucideIcon
    iconClassName: string
    glowClassName: string
    deltaLabel: string
  }
> = {
  income: {
    icon: ArrowUpCircle,
    iconClassName: 'text-[var(--income)]',
    glowClassName: 'from-emerald-500/18 via-emerald-500/8 to-transparent',
    deltaLabel: 'vs. last month',
  },
  expenses: {
    icon: ArrowDownCircle,
    iconClassName: 'text-[var(--expenses)]',
    glowClassName: 'from-rose-500/16 via-rose-500/8 to-transparent',
    deltaLabel: 'month over month',
  },
  savings: {
    icon: PiggyBank,
    iconClassName: 'text-[var(--savings)]',
    glowClassName: 'from-blue-500/18 via-blue-500/8 to-transparent',
    deltaLabel: 'automation rate',
  },
  netWorth: {
    icon: Landmark,
    iconClassName: 'text-[var(--net-worth)]',
    glowClassName: 'from-violet-500/18 via-violet-500/8 to-transparent',
    deltaLabel: 'quarter to date',
  },
}

interface SummaryCardsProps {
  metrics: SummaryMetric[]
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => {
        const config = cardConfig[metric.id]
        const Icon = config.icon
        const isExpense = metric.id === 'expenses'
        const deltaToneClassName =
          metric.delta >= 0
            ? isExpense
              ? 'text-rose-500'
              : 'text-emerald-500'
            : isExpense
              ? 'text-emerald-500'
              : 'text-rose-500'

        return (
          <article
            key={metric.id}
            className="surface-card group relative overflow-hidden rounded-[28px] p-5 transition duration-300 hover:-translate-y-1"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${config.glowClassName}`}
            />
            <div className="relative flex h-full flex-col gap-6">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                  <Icon size={22} className={config.iconClassName} />
                </div>
                <span
                  className={`rounded-full border border-current/15 bg-current/10 px-3 py-1 text-xs font-semibold ${deltaToneClassName}`}
                >
                  {formatSignedPercent(metric.delta)}
                </span>
              </div>

              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {metric.label}
                </p>
                <p className="mt-2 font-display text-4xl tracking-[-0.05em] text-[var(--text-primary)]">
                  {compactCurrencyFormatter.format(metric.value)}
                </p>
              </div>

              <div className="mt-auto">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {config.deltaLabel}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {metric.insight}
                </p>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
