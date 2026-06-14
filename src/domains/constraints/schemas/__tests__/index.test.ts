import { test } from "node:test";
import assert from "node:assert";
import { ConstraintInputSchema } from "../index";

test("ConstraintInputSchema validates valid inputs successfully", () => {
  const validPayload = {
    scope: "repository",
    constraint_type: "no-force-push",
    description: "Force pushing is disallowed on all branches",
    severity: "HIGH",
  };

  const result = ConstraintInputSchema.safeParse(validPayload);
  assert.strictEqual(result.success, true);
});

test("ConstraintInputSchema rejects payloads with missing or empty fields", () => {
  const invalidPayload = {
    scope: "",
    constraint_type: "no-force-push",
    description: "Force pushing is disallowed on all branches",
    // severity is missing
  };

  const result = ConstraintInputSchema.safeParse(invalidPayload);
  assert.strictEqual(result.success, false);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    assert.ok(fieldErrors.scope);
    assert.ok(fieldErrors.severity);
  }
});
