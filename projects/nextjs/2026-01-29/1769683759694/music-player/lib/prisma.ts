/**
 * Prisma Client Singleton
 * Ensures a single Prisma Client instance across the application
 * Prevents connection exhaustion in development with hot reloading
 */

import { PrismaClient } from '@/lib/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
