// lib/server/ratelimit.ts — per-IP sliding-window rate limits (spec-addendum §8.8)
// FR-AI-11; NFR-SEC-07: fail closed when Upstash is unreachable
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
let _perMinute: Ratelimit | null = null;
let _perDay: Ratelimit | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL ?? "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
    });
  }
  return _redis;
}

function getPerMinute(): Ratelimit {
  if (!_perMinute) {
    const limit = Number(process.env.RATE_PER_MINUTE ?? "10");
    _perMinute = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, "60 s"),
      prefix: "fif:rpm",
    });
  }
  return _perMinute;
}

function getPerDay(): Ratelimit {
  if (!_perDay) {
    const limit = Number(process.env.RATE_PER_DAY ?? "60");
    _perDay = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, "86400 s"),
      prefix: "fif:rpd",
    });
  }
  return _perDay;
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number };

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  try {
    const [rm, rd] = await Promise.all([
      getPerMinute().limit(identifier),
      getPerDay().limit(identifier),
    ]);
    if (!rm.success) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((rm.reset - Date.now()) / 1000)) };
    }
    if (!rd.success) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((rd.reset - Date.now()) / 1000)) };
    }
    return { allowed: true };
  } catch {
    // Fail closed per NFR-SEC-07
    return { allowed: false, retryAfter: 60 };
  }
}
