/**
 * Environment Variables Validation
 * Validates critical environment variables at application startup
 */

/**
 * Validates NEXT_PUBLIC_APP_URL format
 * Basic validation to ensure it's a valid URL format
 */
export function validateAppUrl(url: string | undefined): string {
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL must be set in environment variables'
    );
  }

  // Remove trailing slash
  const cleanUrl = url.trim().replace(/\/$/, '');

  // Basic URL format validation
  try {
    new URL(cleanUrl);
  } catch (error) {
    throw new Error(
      `Invalid NEXT_PUBLIC_APP_URL format: ${cleanUrl}. Must be a valid URL.`
    );
  }

  return cleanUrl;
}

/**
 * Validates DATABASE_URL format
 * Basic validation to ensure it's a valid PostgreSQL connection string
 */
export function validateDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error(
      'DATABASE_URL must be set in environment variables'
    );
  }

  // Must be PostgreSQL connection string
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(
      'DATABASE_URL must be a PostgreSQL connection string (postgresql://...)'
    );
  }

  // Parse URL to validate format
  try {
    new URL(url);
  } catch (error) {
    throw new Error(
      `Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Recommend SSL for production (warn but don't fail)
  if (process.env.NODE_ENV === 'production' && !url.includes('sslmode=')) {
    console.warn(
      '⚠️  WARNING: DATABASE_URL does not include SSL mode. ' +
      'Consider adding ?sslmode=require for secure connections.'
    );
  }

  return url;
}

/**
 * Validates NEXTAUTH_SECRET (already done in auth route, but included for completeness)
 */
export function validateNextAuthSecret(secret: string | undefined): string {
  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET must be set in environment variables. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  if (secret === 'dev-secret-change-in-production' || secret.length < 32) {
    throw new Error(
      'NEXTAUTH_SECRET must be a secure random string of at least 32 characters. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  return secret;
}

/**
 * Validate all critical environment variables at startup
 * Call this function early in your application startup (e.g., in middleware or root layout)
 */
export function validateEnvironmentVariables() {
  const errors: string[] = [];

  try {
    validateAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error validating NEXT_PUBLIC_APP_URL');
  }

  try {
    validateDatabaseUrl(process.env.DATABASE_URL);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error validating DATABASE_URL');
  }

  try {
    validateNextAuthSecret(process.env.NEXTAUTH_SECRET);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error validating NEXTAUTH_SECRET');
  }

  if (errors.length > 0) {
    console.error('❌ Environment variable validation failed:');
    errors.forEach(err => console.error(`   - ${err}`));
    throw new Error('Environment variable validation failed. Check logs above.');
  }

  console.log('✅ Environment variables validated successfully');
}

