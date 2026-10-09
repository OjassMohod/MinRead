import "server-only";
import { resolveModelProvider } from "../model-provider";

export function getProviderConfig() {
  return resolveModelProvider({ provider: process.env.CHAT_MODEL_PROVIDER, model: process.env.CHAT_MODEL_NAME, allowPaid: process.env.CHAT_MODEL_ALLOW_PAID });
}

/** Credentials are read only by server code and never returned to the client. */
export function getModelConfig() {
  const provider = getProviderConfig();
  const apiKey = process.env.CHAT_MODEL_API_KEY;
  if (!apiKey?.trim()) throw new Error("Model credentials are not configured.");
  return { ...provider, apiKey };
}
