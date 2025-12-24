import { Prisma } from '@prisma/client';

/**
 * Check if error is a database connection error
 */
export function isDatabaseError(error: any): boolean {
  // Prisma error codes for database connection issues
  if (error?.code) {
    const dbErrorCodes = [
      'P1001', // Can't reach database server
      'P1017', // Server has closed the connection
      'P2024', // Timed out fetching a new connection from the connection pool
      'P1000', // Authentication failed against database server
      'P1002', // Database server doesn't exist
      'P1003', // Database does not exist on the database server
      'P1008', // Operations timed out
      'P1009', // Database already exists on the database server
      'P1010', // User was denied access on the database
      'P1011', // Error opening a TLS connection
      'P1012', // Error opening a TLS connection
      'P1013', // The provided database string is invalid
      'P1014', // The underlying {kind} for model {model} does not exist
      'P1015', // Your Prisma schema is using features that are not supported
      'P1016', // Your raw query had an incorrect number of parameters
      'P1018', // The value for the field {field} on the {model} Model is required
      'P1019', // The value for the field {field} on the {model} Model is required
    ];
    
    if (dbErrorCodes.includes(error.code)) {
      return true;
    }
  }

  // Network errors that indicate DB connection issues
  if (error?.message) {
    const dbErrorMessages = [
      'ECONNREFUSED',
      'Connection refused',
      'Can\'t reach database server',
      'Connection pool timeout',
      'database',
      'postgres',
      'prisma',
      'connection'
    ];
    
    const lowerMessage = error.message.toLowerCase();
    if (dbErrorMessages.some(msg => lowerMessage.includes(msg.toLowerCase()))) {
      return true;
    }
  }

  // PrismaClientKnownRequestError, PrismaClientUnknownRequestError, etc.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Connection errors are in P1000-P1999 range
    if (error.code && error.code.startsWith('P10') || error.code.startsWith('P20')) {
      return true;
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return true;
  }

  return false;
}

/**
 * Get error message for database errors
 */
export function getDatabaseErrorMessage(error: any): string {
  if (!isDatabaseError(error)) {
    return 'Възникна грешка';
  }

  // Map specific error codes to user-friendly messages
  if (error?.code === 'P1001') {
    return 'Базата данни е недостъпна';
  }

  if (error?.code === 'P1017') {
    return 'Връзката с базата данни е прекъсната';
  }

  if (error?.code === 'P2024') {
    return 'Времето за свързване с базата данни изтече';
  }

  if (error?.code === 'P1000') {
    return 'Грешка при автентикация с базата данни';
  }

  // Generic database error
  return 'Проблем с базата данни';
}

