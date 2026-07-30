type RateLimitInfo = {
  timestamps: number[];
};

const rateLimitMap = new Map<string, RateLimitInfo>();

/** How often (ms) to sweep the map for stale entries. */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Entries whose last hit is older than this are evicted. */
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - STALE_THRESHOLD_MS;
    for (const [key, info] of rateLimitMap) {
      const last = info.timestamps[info.timestamps.length - 1];
      if (!last || last < cutoff) {
        rateLimitMap.delete(key);
      }
    }
    // Stop the timer when the map is empty
    if (rateLimitMap.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow the Node.js process to exit even if the timer is still running
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

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

  // Lazily start cleanup on first use
  startCleanup();

  return false;
}
