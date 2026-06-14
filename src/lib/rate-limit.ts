type RateLimitInfo = {
  timestamps: number[];
};

const rateLimitMap = new Map<string, RateLimitInfo>();

export interface RateLimitOptions {
  limit: number;     // Maximum number of requests allowed
  windowMs: number;  // Time window in milliseconds
}

/**
 * Checks if the request limit has been exceeded for the given key (e.g. IP).
 * Returns true if rate limited, false if allowed.
 */
export function isRateLimited(
  key: string,
  options: RateLimitOptions
): boolean {
  const now = Date.now();
  const info = rateLimitMap.get(key) || { timestamps: [] };

  // Filter timestamps to keep only those within the window
  const windowStart = now - options.windowMs;
  info.timestamps = info.timestamps.filter((t) => t > windowStart);

  if (info.timestamps.length >= options.limit) {
    return true;
  }

  info.timestamps.push(now);
  rateLimitMap.set(key, info);
  return false;
}
