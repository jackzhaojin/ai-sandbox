import { ArrowDownUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { DashboardCard } from './DashboardCard'
import { currencyFormatter, dateFormatter } from '../lib/format'
import type { Transaction, TransactionCategory } from '../types/finance'

type SortKey = 'date' | 'amount'
type SortDirection = 'asc' | 'desc'

interface TransactionsTableProps {
  categories: TransactionCategory[]
  transactions: Transaction[]
}

export function TransactionsTable({
  categories,
  transactions,
}: TransactionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [activeCategory, setActiveCategory] = useState<TransactionCategory | 'All'>(
    'All',
  )

  const filteredTransactions = transactions
    .filter((transaction) =>
      activeCategory === 'All'
        ? true
        : transaction.category === activeCategory,
    )
    .sort((left, right) => {
      if (sortKey === 'amount') {
        const amountDelta = left.amount - right.amount
        return sortDirection === 'asc' ? amountDelta : -amountDelta
      }

      const dateDelta =
        new Date(left.date).getTime() - new Date(right.date).getTime()
      return sortDirection === 'asc' ? dateDelta : -dateDelta
    })

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((currentDirection) =>
        currentDirection === 'asc' ? 'desc' : 'asc',
      )
      return
    }

    setSortKey(nextSortKey)
    setSortDirection(nextSortKey === 'date' ? 'desc' : 'asc')
  }

  return (
    <DashboardCard
      eyebrow="Activity"
      title="Recent transactions"
      action={
        <label className="relative block">
          <span className="sr-only">Filter transactions by category</span>
          <select
            value={activeCategory}
            onChange={(event) =>
              setActiveCategory(event.target.value as TransactionCategory | 'All')
            }
            className="appearance-none rounded-full border border-[var(--border)] bg-[var(--surface-soft)] py-2 pl-4 pr-10 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
          >
            <option value="All">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
        </label>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
          Sort by date or amount, then filter down to a single category to spot
          changes in cadence and cash impact.
        </p>
        <div className="flex gap-2">
          {(['date', 'amount'] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSort(key)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                sortKey === key
                  ? 'border-transparent bg-[var(--surface-accent)] text-slate-950'
                  : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              <ArrowDownUp size={15} />
              {key === 'date' ? 'Date' : 'Amount'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-[var(--surface-soft)] text-left">
              <tr className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <th className="px-4 py-4 font-semibold sm:px-5">Merchant</th>
                <th className="px-4 py-4 font-semibold sm:px-5">Category</th>
                <th className="px-4 py-4 font-semibold sm:px-5">Account</th>
                <th className="px-4 py-4 font-semibold sm:px-5">Date</th>
                <th className="px-4 py-4 font-semibold sm:px-5">Status</th>
                <th className="px-4 py-4 text-right font-semibold sm:px-5">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const amountToneClassName =
                  transaction.type === 'income'
                    ? 'text-emerald-500'
                    : 'text-[var(--text-primary)]'

                return (
                  <tr
                    key={transaction.id}
                    className="border-t border-[var(--border)] bg-[var(--bg-elevated)] transition hover:bg-[var(--surface-soft)]"
                  >
                    <td className="px-4 py-4 sm:px-5">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {transaction.merchant}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {transaction.type === 'income'
                            ? 'Deposit'
                            : 'Debit card'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-5">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-sm font-medium text-[var(--text-primary)]">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--text-secondary)] sm:px-5">
                      {transaction.account}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--text-secondary)] sm:px-5">
                      {dateFormatter.format(new Date(transaction.date))}
                    </td>
                    <td className="px-4 py-4 sm:px-5">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          transaction.status === 'Cleared'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/12 text-amber-500'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-4 text-right text-sm font-semibold sm:px-5 ${amountToneClassName}`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {currencyFormatter.format(transaction.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardCard>
  )
}
