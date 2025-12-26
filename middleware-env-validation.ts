/**
 * Environment validation for middleware
 * This file is imported early to validate environment variables
 */

// Only validate on server-side
if (typeof window === 'undefined') {
  try {
    // Import validation functions
    const { validateAppUrl, validateDatabaseUrl, validateNextAuthSecret } = require('./lib/env-validation');
    
    // Validate critical environment variables
    if (process.env.NEXT_PUBLIC_APP_URL) {
      validateAppUrl(process.env.NEXT_PUBLIC_APP_URL);
    }
    
    if (process.env.DATABASE_URL) {
      validateDatabaseUrl(process.env.DATABASE_URL);
    }
    
    if (process.env.NEXTAUTH_SECRET) {
      validateNextAuthSecret(process.env.NEXTAUTH_SECRET);
    }
    
    console.log('✅ Middleware: Environment variables validated');
  } catch (error) {
    console.error('❌ Middleware: Environment variable validation failed:', error);
    // In production, we want to fail fast
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

