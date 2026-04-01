import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { DashboardCard } from './DashboardCard'
import { currencyFormatter } from '../lib/format'
import type { ExpenseCategory } from '../types/finance'

interface CategoryChartProps {
  categories: ExpenseCategory[]
}

export function CategoryChart({ categories }: CategoryChartProps) {
  const total = categories.reduce((sum, category) => sum + category.value, 0)

  return (
    <DashboardCard eyebrow="Breakdown" title="Expense mix">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)]">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="value"
                nameKey="name"
                innerRadius={74}
                outerRadius={110}
                paddingAngle={3}
                stroke="transparent"
              >
                {categories.map((category) => (
                  <Cell key={category.name} fill={category.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-strong)',
                  border: '1px solid var(--border)',
                  borderRadius: '18px',
                  boxShadow: 'var(--shadow-soft)',
                }}
                formatter={(
                  value:
                    | string
                    | number
                    | readonly (string | number)[]
                    | undefined,
                ) => {
                  if (value == null) {
                    return ''
                  }

                  const normalizedValue = Array.isArray(value) ? value[0] : value
                  return currencyFormatter.format(Number(normalizedValue))
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="-mt-40 flex items-center justify-center">
            <div className="rounded-full border border-[var(--border)] bg-[var(--bg-strong)] px-6 py-5 text-center shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)]">
                Total spend
              </p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-[var(--text-primary)]">
                {currencyFormatter.format(total)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {categories.map((category) => {
            const percentage = Math.round((category.value / total) * 100)

            return (
              <div
                key={category.name}
                className="surface-subtle rounded-3xl px-4 py-3 transition duration-300 hover:border-[var(--border-strong)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {category.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {percentage}% of budget
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {currencyFormatter.format(category.value)}
                    </p>
                    <p className="text-xs text-emerald-500">{category.change}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardCard>
  )
}
