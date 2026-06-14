import { test } from "node:test";
import assert from "node:assert";
import { IncidentInputSchema } from "../index";

test("IncidentInputSchema validates valid inputs successfully", () => {
  const validPayload = {
    title: "Database connection failure",
    description: "Primary DB connection pool exhausted",
    severity: "CRITICAL",
    status: "OPEN",
    services: ["database", "api"],
  };

  const result = IncidentInputSchema.safeParse(validPayload);
  assert.strictEqual(result.success, true);
});

test("IncidentInputSchema rejects payloads with missing fields or empty services array", () => {
  const invalidPayload = {
    title: "Database connection failure",
    description: "Primary DB connection pool exhausted",
    severity: "",
    status: "OPEN",
    services: [], // empty services array
  };

  const result = IncidentInputSchema.safeParse(invalidPayload);
  assert.strictEqual(result.success, false);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    assert.ok(fieldErrors.severity);
    assert.ok(fieldErrors.services);
  }
});
