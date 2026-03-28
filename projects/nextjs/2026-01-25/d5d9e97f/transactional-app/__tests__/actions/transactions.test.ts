import { createTransaction, getTransactions, getTransaction, deleteTransaction } from '@/app/actions/transactions'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock Next.js cache revalidation
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Transaction Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const mockTransaction = {
        id: '1',
        amount: 100,
        description: 'Test transaction',
        category: 'food',
        type: 'expense',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction)

      const formData = new FormData()
      formData.append('amount', '100')
      formData.append('description', 'Test transaction')
      formData.append('category', 'food')
      formData.append('type', 'expense')
      formData.append('date', '')  // Empty string for optional date

      const result = await createTransaction(formData)

      expect(result.success).toBe(true)
      expect(prisma.transaction.create).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/transactions')
    })

    it('should fail with invalid amount', async () => {
      const formData = new FormData()
      formData.append('amount', '-100')
      formData.append('description', 'Test transaction')
      formData.append('category', 'food')
      formData.append('type', 'expense')
      formData.append('date', '')

      const result = await createTransaction(formData)

      expect(result.success).toBe(false)
      expect(result).toHaveProperty('errors')
      expect(prisma.transaction.create).not.toHaveBeenCalled()
    })

    it('should fail with missing description', async () => {
      const formData = new FormData()
      formData.append('amount', '100')
      formData.append('description', '')
      formData.append('category', 'food')
      formData.append('type', 'expense')
      formData.append('date', '')

      const result = await createTransaction(formData)

      expect(result.success).toBe(false)
      expect(result).toHaveProperty('errors')
      expect(prisma.transaction.create).not.toHaveBeenCalled()
    })

    it('should fail with invalid type', async () => {
      const formData = new FormData()
      formData.append('amount', '100')
      formData.append('description', 'Test transaction')
      formData.append('category', 'food')
      formData.append('type', 'invalid')
      formData.append('date', '')

      const result = await createTransaction(formData)

      expect(result.success).toBe(false)
      expect(result).toHaveProperty('errors')
      expect(prisma.transaction.create).not.toHaveBeenCalled()
    })

    it('should handle custom date', async () => {
      const mockTransaction = {
        id: '1',
        amount: 100,
        description: 'Test transaction',
        category: 'Food',
        type: 'expense',
        date: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction)

      const formData = new FormData()
      formData.append('amount', '100')
      formData.append('description', 'Test transaction')
      formData.append('category', 'Food')
      formData.append('type', 'expense')
      formData.append('date', '2024-01-01')

      const result = await createTransaction(formData)

      expect(result.success).toBe(true)
      expect(prisma.transaction.create).toHaveBeenCalled()
    })
  })

  describe('getTransactions', () => {
    it('should fetch all transactions sorted by date', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 100,
          description: 'Transaction 1',
          category: 'Food',
          type: 'expense',
          date: new Date('2024-01-02'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          amount: 200,
          description: 'Transaction 2',
          category: 'Salary',
          type: 'income',
          date: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)

      const result = await getTransactions()

      expect(result).toEqual(mockTransactions)
      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
      })
    })
  })

  describe('getTransaction', () => {
    it('should fetch a single transaction by id', async () => {
      const mockTransaction = {
        id: '1',
        amount: 100,
        description: 'Test transaction',
        category: 'Food',
        type: 'expense',
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction)

      const result = await getTransaction('1')

      expect(result).toEqual(mockTransaction)
      expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return null for non-existent transaction', async () => {
      ;(prisma.transaction.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getTransaction('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('deleteTransaction', () => {
    it('should delete a transaction successfully', async () => {
      ;(prisma.transaction.delete as jest.Mock).mockResolvedValue({})

      const result = await deleteTransaction('1')

      expect(result.success).toBe(true)
      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
      expect(revalidatePath).toHaveBeenCalledWith('/transactions')
    })

    it('should handle deletion errors', async () => {
      ;(prisma.transaction.delete as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await deleteTransaction('1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete transaction')
    })
  })
})
