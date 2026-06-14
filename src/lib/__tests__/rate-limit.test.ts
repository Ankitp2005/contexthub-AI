import { test } from "node:test";
import assert from "node:assert";
import { isRateLimited } from "../rate-limit";

test("isRateLimited allows requests below limit and blocks above limit", () => {
  const key = "test-ip-1";
  const options = { limit: 3, windowMs: 1000 };

  // First 3 requests should be allowed
  assert.strictEqual(isRateLimited(key, options), false);
  assert.strictEqual(isRateLimited(key, options), false);
  assert.strictEqual(isRateLimited(key, options), false);

  // 4th request should be rate limited
  assert.strictEqual(isRateLimited(key, options), true);
});

test("isRateLimited resets after window duration", async () => {
  const key = "test-ip-2";
  const options = { limit: 1, windowMs: 100 };

  // 1st request should be allowed
  assert.strictEqual(isRateLimited(key, options), false);

  // 2nd request in same window should be rate limited
  assert.strictEqual(isRateLimited(key, options), true);

  // Wait for window to expire
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Should be allowed again
  assert.strictEqual(isRateLimited(key, options), false);
});
