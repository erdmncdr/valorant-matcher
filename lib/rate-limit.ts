import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// In-memory rate limiter for development (when Redis is not available)
class InMemoryRateLimiter {
  private hits: Map<string, { count: number; resetAt: number }> = new Map()

  async limit(identifier: string, limit: number, window: number) {
    const now = Date.now()
    const key = identifier
    const hit = this.hits.get(key)

    if (!hit || now > hit.resetAt) {
      // New window
      this.hits.set(key, { count: 1, resetAt: now + window })
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + window,
      }
    }

    if (hit.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: hit.resetAt,
      }
    }

    // Increment hit count
    hit.count++
    return {
      success: true,
      limit,
      remaining: limit - hit.count,
      reset: hit.resetAt,
    }
  }
}

// Check if Redis is configured
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Create Redis client or use in-memory fallback
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// In-memory limiters for development
const memoryLimiters: Record<string, InMemoryRateLimiter> = {}

function getMemoryLimiter(name: string) {
  if (!memoryLimiters[name]) {
    memoryLimiters[name] = new InMemoryRateLimiter()
  }
  return memoryLimiters[name]
}

// Helper function to create rate limiter
function createRateLimiter(
  name: string,
  requests: number,
  window: string
) {
  if (redis) {
    // Use Redis-backed rate limiter
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
      prefix: `needone:${name}`,
    })
  } else {
    // Use in-memory rate limiter
    console.log(`[Rate Limit] Using in-memory limiter for: ${name}`)
    const windowMs = parseWindowToMs(window)

    return {
      limit: async (identifier: string) => {
        return getMemoryLimiter(name).limit(identifier, requests, windowMs)
      }
    }
  }
}

// Parse window string to milliseconds
function parseWindowToMs(window: string): number {
  const match = window.match(/^(\d+)\s*([smhd])$/)
  if (!match) return 10000 // Default 10 seconds

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return value * 1000
  }
}

// Rate limiters for different endpoints
export const loginRateLimiter = createRateLimiter("login", 5, "15 m")
export const registerRateLimiter = createRateLimiter("register", 3, "1 h")
export const messageRateLimiter = createRateLimiter("message", 20, "1 m")
export const listingRateLimiter = createRateLimiter("listing", 5, "1 h")
export const aimTrainerRateLimiter = createRateLimiter("aimtrainer", 10, "10 m")
export const apiRateLimiter = createRateLimiter("api", 100, "1 m")
export const reportRateLimiter = createRateLimiter("report", 3, "1 h")

// Export for logging
export const isUsingRedis = !!redis
