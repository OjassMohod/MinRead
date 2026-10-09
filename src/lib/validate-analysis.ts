import { analysisOutputSchema, type ChatMessage } from "./schemas";

/** ID validation establishes reference integrity, not semantic correctness. */
export function validateAnalysis(value: unknown, messages: ChatMessage[]) {
  const output = analysisOutputSchema.parse(value);
  const ids = new Set(messages.map(message => message.id));
  for (const item of [...output.summary, ...output.findings]) {
    if (item.sourceIds.some(id => !ids.has(id))) {
      throw new Error("Analysis contains an unknown source reference.");
    }
  }
  for (const finding of output.findings) {
    if (finding.deadlineIso && !finding.deadlineText) {
      throw new Error("A normalized deadline requires source deadline wording.");
    }
  }
  return output;
}
