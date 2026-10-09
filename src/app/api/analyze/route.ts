import { ZodError } from "zod";
import { analysisRequestSchema } from "@/lib/schemas";
import { ChatFormatError, parseChat } from "@/lib/parse-chat";
import { analyzeConversation, ModelError } from "@/lib/server/analyze-conversation";
import { readJsonBody, RequestInputError } from "@/lib/server/read-json-body";
import { isAllowedOrigin } from "@/lib/server/request-origin";

export const runtime = "nodejs";
export const maxDuration = 40;

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return json({ error: "Cross-origin analysis requests are not allowed." }, 403);
  }
  try {
    const input = analysisRequestSchema.parse(await readJsonBody(request));
    const messages = parseChat(input.rawText);
    const analysis = await analyzeConversation(input, messages, request.signal);
    return json(analysis);
  } catch (error) {
    if (error instanceof RequestInputError || error instanceof ModelError) return json({ error: error.message }, error.status);
    if (error instanceof ChatFormatError) return json({ error: error.message }, 400);
    if (error instanceof ZodError) return json({ error: "Enter a valid name, timezone, and conversation within the 20,000-character limit." }, 400);
    return json({ error: "Analysis failed. Please try again." }, 500);
  }
}
