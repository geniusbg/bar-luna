import { PrismaClient } from '@prisma/client';
import { validateDatabaseUrl } from './env-validation';

// Validate DATABASE_URL on import (runs once per server startup)
if (typeof window === 'undefined') {
  // Server-side only - validate database URL
  try {
    validateDatabaseUrl(process.env.DATABASE_URL);
  } catch (error) {
    console.error('❌ DATABASE_URL validation failed:', error);
    // Don't throw in development to allow easier setup
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;


