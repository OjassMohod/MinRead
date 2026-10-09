import { z } from "zod";
import { MAX_CHAT_CHARACTERS } from "./limits";

const timestamp = z.iso.datetime({ offset: true });
export const messageSchema = z.strictObject({
  id: z.string().regex(/^m\d{3,}$/),
  sender: z.string().min(1).max(80),
  text: z.string().min(1),
  timestamp: timestamp.nullable(),
});

export const analysisRequestSchema = z.strictObject({
  rawText: z.string().min(1).max(MAX_CHAT_CHARACTERS).refine(s => s.trim().length > 0, "Paste a conversation."),
  selectedUser: z.string().trim().min(1, "Enter your name or handle.").max(80),
  timezone: z.string().max(100).refine(value => {
    try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; }
    catch { return false; }
  }, "Use a valid timezone."),
});

export const findingSchema = z.strictObject({
  kind: z.enum(["task", "decision", "change", "informational", "open_issue"]),
  description: z.string().min(1).max(1000),
  owner: z.string().min(1).max(80).nullable(),
  deadlineText: z.string().min(1).max(200).nullable(),
  deadlineIso: timestamp.nullable(),
  status: z.enum(["open", "completed", "cancelled", "unclear", "resolved"]),
  sourceIds: z.array(messageSchema.shape.id).min(1).max(30),
  ambiguity: z.string().min(1).max(1000).nullable(),
});
export const analysisOutputSchema = z.strictObject({
  summary: z.array(z.strictObject({
    text: z.string().min(1).max(1000),
    sourceIds: z.array(messageSchema.shape.id).min(1).max(30),
  })).max(6),
  findings: z.array(findingSchema).max(120),
});

export type ChatMessage = z.infer<typeof messageSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;

// Transport metadata is separate from the schema requested from the model.
export const analysisResponseSchema = z.strictObject({
  analysis: analysisOutputSchema,
  usage: z.strictObject({
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
    reasoningTokens: z.number().int().nonnegative().nullable(),
  }).nullable(),
});
