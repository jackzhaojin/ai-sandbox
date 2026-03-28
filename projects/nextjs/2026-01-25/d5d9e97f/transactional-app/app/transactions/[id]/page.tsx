import { getTransaction } from '@/app/actions/transactions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DeleteButton from './DeleteButton'

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const transaction = await getTransaction(id)

  if (!transaction) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/transactions"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Transactions
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
            <DeleteButton id={transaction.id} />
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-xl text-gray-900 mt-1">{transaction.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="text-xl text-gray-900 mt-1 capitalize">{transaction.type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-xl text-gray-900 mt-1 capitalize">{transaction.category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="text-xl text-gray-900 mt-1">
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(transaction.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
