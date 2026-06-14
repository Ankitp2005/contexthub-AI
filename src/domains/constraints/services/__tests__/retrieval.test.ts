import { test } from "node:test";
import assert from "node:assert";
import {
  isConstraintApplicable,
  getApplicableConstraints,
} from "../retrieval";

// ---------------------------------------------------------------------------
// Tests: isConstraintApplicable (pure helper)
// ---------------------------------------------------------------------------

test("isConstraintApplicable matches exact scope", () => {
  assert.strictEqual(isConstraintApplicable("payments", "payments"), true);
  assert.strictEqual(isConstraintApplicable("auth", "auth"), true);
  assert.strictEqual(isConstraintApplicable("auth", "payments"), false);
});

test("isConstraintApplicable matches wildcard '*' scope", () => {
  assert.strictEqual(isConstraintApplicable("*", "payments"), true);
  assert.strictEqual(isConstraintApplicable("*", "auth"), true);
  assert.strictEqual(isConstraintApplicable("*", "any-scope"), true);
});

test("isConstraintApplicable matches 'global' scope", () => {
  assert.strictEqual(isConstraintApplicable("global", "payments"), true);
  assert.strictEqual(isConstraintApplicable("global", "auth"), true);
  assert.strictEqual(isConstraintApplicable("global", "any-scope"), true);
});

// ---------------------------------------------------------------------------
// Interface Validation
// ---------------------------------------------------------------------------

test("getApplicableConstraints is exported as a function", () => {
  assert.strictEqual(typeof getApplicableConstraints, "function");
});
