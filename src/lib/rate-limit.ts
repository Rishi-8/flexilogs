// Simple in-memory sliding-window rate limiter, keyed per user.
// Good enough for a single-instance deployment. For multi-instance / serverless,
// replace `hits` with a shared store (Redis / Upstash) — keep the same API.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

const hits = new Map<string, number[]>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const cutoff = now - WINDOW_MS;
  const arr = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= MAX_REQUESTS) {
    return { ok: false, remaining: 0, resetAt: arr[0] + WINDOW_MS };
  }
  arr.push(now);
  hits.set(key, arr);
  return {
    ok: true,
    remaining: MAX_REQUESTS - arr.length,
    resetAt: now + WINDOW_MS,
  };
}
