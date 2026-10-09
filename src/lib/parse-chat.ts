import { MAX_CHAT_CHARACTERS } from "./limits";
import { messageSchema, type ChatMessage } from "./schemas";

export class ChatFormatError extends Error {}

/** Each new message starts with `Name: text` or `[ISO timestamp] Name: text`.
 * Lines without a sender continue the previous message. Blank lines are ignored.
 * Missing timestamps remain null; analysis time never replaces message time.
 */
export function parseChat(rawText: string): ChatMessage[] {
  if (rawText.length > MAX_CHAT_CHARACTERS) {
    throw new ChatFormatError(`Conversation exceeds ${MAX_CHAT_CHARACTERS.toLocaleString()} characters.`);
  }
  const messages: ChatMessage[] = [];
  const lines = rawText.replace(/\r\n?/g, "\n").split("\n");
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const match = line.match(/^(?:\[([^\]]+)\]\s+)?([^:\[\]\r\n]{1,80}):\s*(.*)$/);
    if (match) {
      const [, timestamp, sender, text] = match;
      const parsed = messageSchema.safeParse({
        id: `m${String(messages.length + 1).padStart(3, "0")}`,
        sender: sender.trim(), text: text.trim(), timestamp: timestamp ?? null,
      });
      if (!parsed.success) {
        throw new ChatFormatError(`Invalid sender, timestamp, or empty message on line ${index + 1}.`);
      }
      messages.push(parsed.data);
    } else {
      if (!messages.length || line.startsWith("[")) {
        throw new ChatFormatError(`Line ${index + 1} must use Name: message, optionally preceded by [ISO timestamp].`);
      }
      messages[messages.length - 1].text += `\n${line}`;
    }
  }
  if (!messages.length) throw new ChatFormatError("Paste at least one message using Name: message.");
  return messages;
}
