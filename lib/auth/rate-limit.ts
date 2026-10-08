type RateLimitEntry = {
  timestamps: number[];
};

const buckets = new Map<string, RateLimitEntry>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function prune(timestamps: number[], windowMs: number, now: number) {
  return timestamps.filter((time) => now - time < windowMs);
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Safeguard against unbounded memory growth
  if (buckets.size > 5000) {
    for (const [k, v] of buckets.entries()) {
      if (v.timestamps.length === 0 || now - (v.timestamps[v.timestamps.length - 1] ?? 0) > 30 * 60 * 1000) {
        buckets.delete(k);
      }
    }
  }

  const entry = buckets.get(key) ?? { timestamps: [] };
  entry.timestamps = prune(entry.timestamps, windowMs, now);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets.set(key, entry);
    return { allowed: false, retryAfterSeconds };
  }

  entry.timestamps.push(now);
  buckets.set(key, entry);
  return { allowed: true, retryAfterSeconds: 0 };
}

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 15 * 60 * 1000 },
  forgotPassword: { limit: 5, windowMs: 15 * 60 * 1000 },
  resendVerification: { limit: 5, windowMs: 15 * 60 * 1000 },
  verifyEmail: { limit: 20, windowMs: 15 * 60 * 1000 },
  resetPassword: { limit: 20, windowMs: 15 * 60 * 1000 },
  tracking: { limit: 30, windowMs: 60 * 1000 },
} as const;

export const RATE_LIMIT_MESSAGE = "Too many requests. Please wait a moment and try again.";
