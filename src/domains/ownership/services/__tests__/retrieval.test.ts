import { test } from "node:test";
import assert from "node:assert";
import {
  normalizePattern,
  isPathMatch,
  evaluateOwnership,
  getFileOwnership,
} from "../retrieval";

// ---------------------------------------------------------------------------
// Tests: normalizePattern (pure helper)
// ---------------------------------------------------------------------------

test("normalizePattern handles wildcard and path patterns correctly", () => {
  assert.strictEqual(normalizePattern("*"), "*");
  assert.strictEqual(normalizePattern("/src/payments/*"), "src/payments/");
  assert.strictEqual(normalizePattern("src/payments/*"), "src/payments/");
  assert.strictEqual(normalizePattern("/src/payments"), "src/payments");
});

// ---------------------------------------------------------------------------
// Tests: isPathMatch (pure matcher)
// ---------------------------------------------------------------------------

test("isPathMatch matches wildcard '*' with any path", () => {
  assert.strictEqual(isPathMatch("src/payments/checkout.ts", "*"), true);
  assert.strictEqual(isPathMatch("readme.md", "*"), true);
});

test("isPathMatch matches files inside target directories", () => {
  assert.strictEqual(isPathMatch("src/payments/checkout.ts", "/src/payments/*"), true);
  assert.strictEqual(isPathMatch("sub/src/payments/checkout.ts", "/src/payments/*"), true);
  assert.strictEqual(isPathMatch("src/auth/login.ts", "/src/payments/*"), false);
});

// ---------------------------------------------------------------------------
// Tests: evaluateOwnership (pure evaluator)
// ---------------------------------------------------------------------------

test("evaluateOwnership returns unowned when rules array is empty", () => {
  const result = evaluateOwnership([], "src/payments/checkout.ts");
  assert.strictEqual(result.ownerType, "none");
  assert.strictEqual(result.ownerName, "unowned");
  assert.strictEqual(result.source, "CODEOWNERS");
});

test("evaluateOwnership matches wildcard '*' rule", () => {
  const rules = [
    {
      path_pattern: "*",
      owner_type: "user",
      owner_name: "global-owner",
    },
  ];

  const result = evaluateOwnership(rules, "src/config/settings.json");
  assert.strictEqual(result.ownerType, "user");
  assert.strictEqual(result.ownerName, "global-owner");
});

test("evaluateOwnership matches specific path pattern", () => {
  const rules = [
    {
      path_pattern: "/src/payments/*",
      owner_type: "team",
      owner_name: "payments-team",
    },
  ];

  const matchResult = evaluateOwnership(rules, "src/payments/checkout.ts");
  assert.strictEqual(matchResult.ownerType, "team");
  assert.strictEqual(matchResult.ownerName, "payments-team");

  const mismatchResult = evaluateOwnership(rules, "src/auth/login.ts");
  assert.strictEqual(mismatchResult.ownerType, "none");
  assert.strictEqual(mismatchResult.ownerName, "unowned");
});

test("evaluateOwnership respects CODEOWNERS precedence (last match wins)", () => {
  const rules = [
    {
      path_pattern: "*",
      owner_type: "user",
      owner_name: "global-admin",
    },
    {
      path_pattern: "/src/payments/*",
      owner_type: "team",
      owner_name: "payments-team",
    },
  ];

  // Matches both rules, but rule 2 is last, so it wins.
  const paymentsResult = evaluateOwnership(rules, "src/payments/checkout.ts");
  assert.strictEqual(paymentsResult.ownerType, "team");
  assert.strictEqual(paymentsResult.ownerName, "payments-team");

  // Only matches wildcard rule.
  const authResult = evaluateOwnership(rules, "src/auth/login.ts");
  assert.strictEqual(authResult.ownerType, "user");
  assert.strictEqual(authResult.ownerName, "global-admin");
});

// ---------------------------------------------------------------------------
// Interface Validation
// ---------------------------------------------------------------------------

test("getFileOwnership is exported as a function", () => {
  assert.strictEqual(typeof getFileOwnership, "function");
});
