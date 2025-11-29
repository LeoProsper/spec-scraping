/**
 * Rate Limiting Service for AI API
 * 
 * Simple in-memory rate limiter for development.
 * Tracks AI requests per user with sliding window.
 * 
 * TODO: For production, move to Redis or use Supabase function check_ai_rate_limit
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store: userId -> RateLimitEntry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Default rate limit: 60 requests per hour
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 60,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Check if user is within rate limit
 * 
 * @param userId - User ID to check
 * @param config - Rate limit configuration (optional)
 * @returns true if allowed, false if exceeded
 */
export function checkRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  // No entry or expired window - allow
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }

  // Check if within limit
  if (entry.count < config.limit) {
    entry.count++;
    return true;
  }

  // Rate limit exceeded
  return false;
}

/**
 * Get remaining requests for user
 * 
 * @param userId - User ID to check
 * @param config - Rate limit configuration (optional)
 * @returns Object with remaining requests and reset time
 */
export function getRateLimitStatus(
  userId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { remaining: number; resetAt: number; limit: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now >= entry.resetAt) {
    return {
      remaining: config.limit,
      resetAt: now + config.windowMs,
      limit: config.limit,
    };
  }

  return {
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
    limit: config.limit,
  };
}

/**
 * Reset rate limit for user (for testing or admin actions)
 */
export function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}

/**
 * Cleanup expired entries
 */
function cleanup(): void {
  const now = Date.now();
  for (const [userId, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(userId);
    }
  }
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, CLEANUP_INTERVAL_MS);
}

/**
 * Get current store size (for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size;
}
