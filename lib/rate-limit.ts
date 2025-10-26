// Simple in-memory rate limiter
const attempts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetTime) {
    // Create new record
    const resetTime = now + windowMs;
    attempts.set(key, { count: 1, resetTime });
    
    // Cleanup old records periodically
    if (Math.random() < 0.01) {
      cleanup();
    }

    return { allowed: true, remaining: maxAttempts - 1, resetTime };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  attempts.set(key, record);

  return { allowed: true, remaining: maxAttempts - record.count, resetTime: record.resetTime };
}

function cleanup() {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetTime) {
      attempts.delete(key);
    }
  }
}

