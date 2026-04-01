import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { DashboardCard } from './DashboardCard'
import { currencyFormatter } from '../lib/format'
import type { MonthlyTrendPoint } from '../types/finance'

interface TrendChartProps {
  data: MonthlyTrendPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <DashboardCard
      eyebrow="Trend"
      title="Income vs. expense momentum"
      action={
        <div className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
          12 months
        </div>
      }
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            Income has outpaced spend for five consecutive months, expanding
            free cash flow into quarter close.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-3xl bg-[var(--surface-soft)] p-3 text-sm">
          <div>
            <p className="text-[var(--text-muted)]">Latest surplus</p>
            <p className="font-semibold text-[var(--text-primary)]">$7.1K</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Runway</p>
            <p className="font-semibold text-[var(--text-primary)]">14.8 mo</p>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, left: -24, bottom: 0 }}
          >
            <CartesianGrid className="grid-line" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tickLine={false}
              tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
              tickFormatter={(value: number) => `$${value / 1000}k`}
            />
            <Tooltip
              cursor={{ stroke: 'var(--chart-grid)', strokeDasharray: '5 5' }}
              contentStyle={{
                background: 'var(--bg-strong)',
                border: '1px solid var(--border)',
                borderRadius: '18px',
                boxShadow: 'var(--shadow-soft)',
              }}
              formatter={(
                value: string | number | readonly (string | number)[] | undefined,
              ) => {
                if (value == null) {
                  return ''
                }

                const normalizedValue = Array.isArray(value) ? value[0] : value
                return currencyFormatter.format(Number(normalizedValue))
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ paddingTop: '16px' }}
              formatter={(value) => (
                <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
              )}
            />
            <Line
              dataKey="income"
              name="Income"
              stroke="var(--line-income)"
              strokeWidth={3}
              dot={{ fill: 'var(--line-income)', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6 }}
              type="monotone"
            />
            <Line
              dataKey="expenses"
              name="Expenses"
              stroke="var(--line-expenses)"
              strokeWidth={3}
              dot={{ fill: 'var(--line-expenses)', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6 }}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  )
}
