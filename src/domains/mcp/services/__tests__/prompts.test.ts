import { test } from "node:test";
import assert from "node:assert";
import { listPrompts, getPrompt } from "../prompts";

test("listPrompts returns list of prompts", async () => {
  const prompts = await listPrompts();
  assert.ok(prompts);
  assert.strictEqual(prompts.length, 1);
  assert.strictEqual(prompts[0]!.name, "safe_agent_preamble");
});

test("getPrompt returns prompt details when name matches", async () => {
  const prompt = await getPrompt("safe_agent_preamble");
  assert.ok(prompt);
  assert.strictEqual(prompt.name, "safe_agent_preamble");
  assert.strictEqual(prompt.messages.length, 1);
  assert.strictEqual(prompt.messages[0]!.role, "user");
  assert.ok(prompt.messages[0]!.content.text.includes("get_ownership"));
});

test("getPrompt returns null when name does not match", async () => {
  const prompt = await getPrompt("non_existent_prompt");
  assert.strictEqual(prompt, null);
});
