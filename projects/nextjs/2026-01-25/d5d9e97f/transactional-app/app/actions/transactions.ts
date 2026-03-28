'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['income', 'expense']),
  date: z.string().optional(),
})

export async function createTransaction(formData: FormData) {
  const rawData = {
    amount: parseFloat(formData.get('amount') as string),
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    type: formData.get('type') as string,
    date: formData.get('date') as string,
  }

  try {
    const validated = transactionSchema.parse(rawData)

    await prisma.transaction.create({
      data: {
        ...validated,
        date: validated.date ? new Date(validated.date) : new Date(),
      },
    })

    revalidatePath('/transactions')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues }
    }
    return { success: false, error: 'Failed to create transaction' }
  }
}

export async function getTransactions() {
  return await prisma.transaction.findMany({
    orderBy: { date: 'desc' },
  })
}

export async function getTransaction(id: string) {
  return await prisma.transaction.findUnique({
    where: { id },
  })
}

export async function deleteTransaction(id: string) {
  try {
    await prisma.transaction.delete({
      where: { id },
    })
    revalidatePath('/transactions')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete transaction' }
  }
}
