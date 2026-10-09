import { MAX_REQUEST_BYTES } from "./limits";
import { parseChat } from "./parse-chat";

/** Read locally; never upload the file or silently truncate it. */
export async function readChatFile(file: File) {
  if (!/\.txt$/i.test(file.name)) throw new Error("Choose a UTF-8 .txt chat file.");
  if (file.size > MAX_REQUEST_BYTES) throw new Error("File exceeds 80 KB. Import a smaller conversation.");
  let rawText: string;
  try { rawText = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()); }
  catch { throw new Error("Unable to read this file. Use a UTF-8 text file."); }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(rawText)) throw new Error("Choose a plain-text chat file, not a binary file.");
  const messages = parseChat(rawText);
  return { rawText, messages };
}
