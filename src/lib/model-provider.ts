export type ModelProvider = "groq" | "openai";

const providers = {
  groq: { label: "Groq", baseURL: "https://api.groq.com/openai/v1", defaultModel: "openai/gpt-oss-120b" },
  openai: { label: "OpenAI", baseURL: "https://api.openai.com/v1", defaultModel: "gpt-4.1-mini" },
} as const;

export class ModelConfigurationError extends Error {}

/** Server-selected destinations only: input requests cannot change provider or model. */
export function resolveModelProvider(settings: { provider?: string; model?: string; allowPaid?: string }) {
  const provider = settings.provider?.trim() || "groq";
  if (provider !== "groq" && provider !== "openai") throw new ModelConfigurationError("Unsupported model provider.");
  if (provider === "openai" && settings.allowPaid !== "true") {
    throw new ModelConfigurationError("Paid providers are disabled. Use Groq Free Plan for this project.");
  }
  const info = providers[provider];
  const model = settings.model?.trim() || info.defaultModel;
  if (provider === "groq" && !["openai/gpt-oss-120b", "openai/gpt-oss-20b"].includes(model)) {
    throw new ModelConfigurationError("Select a supported Groq Free Plan model.");
  }
  return { provider, ...info, model };
}
