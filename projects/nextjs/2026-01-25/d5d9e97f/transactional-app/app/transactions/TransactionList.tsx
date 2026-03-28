'use client'

import { deleteTransaction } from '@/app/actions/transactions'
import Link from 'next/link'

type Transaction = {
  id: string
  amount: number
  description: string
  category: string
  type: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <p className="text-gray-500 text-center py-8">No transactions yet. Add your first transaction!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>

      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <Link
                    href={`/transactions/${transaction.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {transaction.description}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                      {transaction.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`text-lg font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </span>

              <button
                onClick={() => handleDelete(transaction.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
