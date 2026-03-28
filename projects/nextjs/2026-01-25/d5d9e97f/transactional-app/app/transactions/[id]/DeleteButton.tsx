'use client'

import { deleteTransaction } from '@/app/actions/transactions'
import { useRouter } from 'next/navigation'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this transaction?')) {
      const result = await deleteTransaction(id)
      if (result.success) {
        router.push('/transactions')
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
    >
      Delete Transaction
    </button>
  )
}
