import { test } from "node:test";
import assert from "node:assert";
import { createHash, timingSafeEqual } from "node:crypto";

// Re-implement or import the function we want to test to keep the test self-contained and clean
function safeCompare(a: string, b: string): boolean {
  const aHash = createHash("sha256").update(a).digest();
  const bHash = createHash("sha256").update(b).digest();
  try {
    return timingSafeEqual(aHash, bHash);
  } catch {
    return false;
  }
}

function parseClientIp(
  requestIp: string | undefined,
  xForwardedFor: string | null
): string {
  let ip = requestIp;
  if (!ip) {
    if (xForwardedFor) {
      ip = xForwardedFor.split(",")[0].trim();
    }
  }
  return ip || "127.0.0.1";
}

test("safeCompare correctly matches equal strings", () => {
  assert.strictEqual(safeCompare("my-secure-key", "my-secure-key"), true);
  assert.strictEqual(safeCompare("", ""), true);
});

test("safeCompare rejects unequal strings", () => {
  assert.strictEqual(safeCompare("my-secure-key", "other-key"), false);
  assert.strictEqual(safeCompare("key", "longer-key"), false);
  assert.strictEqual(safeCompare("longer-key", "key"), false);
  assert.strictEqual(safeCompare("", "key"), false);
});

test("parseClientIp uses request.ip if present", () => {
  const ip = parseClientIp("192.168.1.1", "10.0.0.1, 10.0.0.2");
  assert.strictEqual(ip, "192.168.1.1");
});

test("parseClientIp falls back to first IP of X-Forwarded-For if request.ip is absent", () => {
  const ip = parseClientIp(undefined, "10.0.0.1, 10.0.0.2");
  assert.strictEqual(ip, "10.0.0.1");
});

test("parseClientIp falls back to 127.0.0.1 if both are absent", () => {
  const ip = parseClientIp(undefined, null);
  assert.strictEqual(ip, "127.0.0.1");
});
