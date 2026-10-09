import assert from "node:assert/strict";
import test from "node:test";
import { resolveModelProvider } from "../src/lib/model-provider";

test("defaults target Groq with the shared provider-independent credential contract", () => {
  const config = resolveModelProvider({});
  assert.equal(config.provider, "groq");
  assert.equal(config.model, "openai/gpt-oss-120b");
  assert.equal(config.baseURL, "https://api.groq.com/openai/v1");
});
test("the Groq model can change without changing application code", () => {
  assert.equal(resolveModelProvider({ provider: "groq", model: "openai/gpt-oss-20b" }).model, "openai/gpt-oss-20b");
});
test("unknown destinations and nonselected Groq models fail closed", () => {
  assert.throws(() => resolveModelProvider({ provider: "https://example.invalid" }));
  assert.throws(() => resolveModelProvider({ model: "gpt-4.1-mini" }));
});
test("switching to a paid provider requires explicit server-side opt-in", () => {
  assert.throws(() => resolveModelProvider({ provider: "openai" }), /Paid providers are disabled/);
  const config = resolveModelProvider({ provider: "openai", allowPaid: "true" });
  assert.equal(config.label, "OpenAI");
  assert.equal(config.baseURL, "https://api.openai.com/v1");
});
