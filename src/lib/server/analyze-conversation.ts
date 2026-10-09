import "server-only";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { analysisOutputSchema, type AnalysisRequest, type ChatMessage } from "../schemas";
import { buildModelInput, EXTRACTION_INSTRUCTIONS } from "../model-prompt";
import { MAX_MODEL_OUTPUT_TOKENS, MODEL_TIMEOUT_MS } from "../limits";
import { validateAnalysis } from "../validate-analysis";
import { getModelConfig } from "./model-config";
import { ModelConfigurationError } from "../model-provider";

export class ModelError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function analyzeConversation(request: AnalysisRequest, messages: ChatMessage[], signal?: AbortSignal) {
  let config;
  try { config = getModelConfig(); }
  catch (error) {
    if (error instanceof ModelConfigurationError) throw new ModelError(503, `AI analysis is unavailable: ${error.message} No model request was made.`);
    throw new ModelError(503, "AI analysis is unavailable: server credentials are not configured. Your conversation was not sent to the model.");
  }
  const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL, timeout: MODEL_TIMEOUT_MS, maxRetries: 0 });
  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: EXTRACTION_INSTRUCTIONS },
        { role: "user", content: buildModelInput(request, messages, new Date().toISOString()) },
      ],
      response_format: zodResponseFormat(analysisOutputSchema, "minread_analysis"),
      max_completion_tokens: MAX_MODEL_OUTPUT_TOKENS,
      ...(config.provider === "groq" ? { reasoning_effort: "low" as const } : { store: false }),
    }, { signal });

    const choice = response.choices[0];
    if (choice?.message.refusal) throw new ModelError(502, "The model could not analyze this conversation.");
    if (!choice || choice.finish_reason !== "stop") {
      throw new ModelError(502, "The model did not finish the analysis. Try a shorter conversation.");
    }
    if (!choice.message.content) throw new ModelError(502, "The model could not analyze this conversation.");
    try {
      return {
        analysis: validateAnalysis(JSON.parse(choice.message.content), messages),
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          reasoningTokens: response.usage.completion_tokens_details?.reasoning_tokens ?? null,
        } : null,
      };
    }
    catch { throw new ModelError(502, "The model returned an invalid or unsupported result. Please retry."); }
  } catch (error) {
    if (error instanceof ModelError) throw error;
    if (error instanceof OpenAI.APIConnectionTimeoutError) throw new ModelError(504, "Analysis timed out. Try a shorter conversation.");
    if (error instanceof OpenAI.APIError && error.status === 429) throw new ModelError(503, "The model is temporarily unavailable or its usage limit was reached. Try again later.");
    // Provider errors can contain request data: never log or return them.
    throw new ModelError(502, "Unable to reach the model. Please retry later.");
  }
}
