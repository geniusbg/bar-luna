/**
 * Environment Variables Validation
 * Validates critical environment variables at application startup
 */

/**
 * Validates NEXT_PUBLIC_APP_URL
 * Prevents redirecting fetch requests to attacker-controlled servers
 */
export function validateAppUrl(url: string | undefined): string {
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL must be set in environment variables'
    );
  }

  // Remove trailing slash
  const cleanUrl = url.trim().replace(/\/$/, '');

  // Whitelist of allowed domains (adjust for your production domains)
  const allowedDomains = [
    'https://bar-luna.com',
    'https://www.bar-luna.com',
    'http://localhost:3000', // Development only
    'http://localhost:4000', // Development only
    // Add your production domain here when ready
    // 'https://your-production-domain.com',
  ];

  // Check if URL matches whitelist
  const isAllowed = allowedDomains.some(domain => cleanUrl.startsWith(domain));

  if (!isAllowed) {
    // Allow localhost in development mode only
    if (process.env.NODE_ENV === 'development' && cleanUrl.startsWith('http://localhost')) {
      return cleanUrl;
    }

    throw new Error(
      `Invalid NEXT_PUBLIC_APP_URL: ${cleanUrl}. ` +
      `Must be one of: ${allowedDomains.join(', ')}`
    );
  }

  return cleanUrl;
}

/**
 * Validates DATABASE_URL format
 * Prevents redirecting database connections to attacker-controlled databases
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

  // Parse URL to extract host
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error(
      `Invalid DATABASE_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Whitelist of allowed database hosts
  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    '66.29.142.10', // Production database server
    // Add other allowed hosts here
  ];

  const hostname = parsedUrl.hostname;

  // Allow localhost in development mode
  if (process.env.NODE_ENV === 'development' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return url;
  }

  // In production, enforce host whitelist
  if (process.env.NODE_ENV === 'production' && !allowedHosts.includes(hostname)) {
    throw new Error(
      `Invalid database host: ${hostname}. ` +
      `Must be one of: ${allowedHosts.join(', ')}`
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

