import assert from "node:assert/strict";
import test from "node:test";
import { readChatFile } from "../src/lib/import-chat";

test("text imports preserve multiline messages and strip a UTF-8 BOM", async () => {
  const result = await readChatFile(new File(["\ufeffAsha: First line\r\ncontinued\r\nRavi: Reply"], "chat.TXT"));
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].text, "First line\ncontinued");
});
test("imports reject unsupported, binary and invalid UTF-8 files", async () => {
  await assert.rejects(readChatFile(new File(["Asha: hello"], "chat.pdf")), /\.txt/);
  await assert.rejects(readChatFile(new File(["Asha: \u0000"], "binary.txt")), /binary/);
  await assert.rejects(readChatFile(new File([new Uint8Array([255])], "invalid.txt")), /UTF-8/);
});
test("imports reject size and format failures without truncating", async () => {
  await assert.rejects(readChatFile(new File(["x".repeat(80_001)], "large.txt")), /80 KB/);
  await assert.rejects(readChatFile(new File(["Asha: " + "x".repeat(20_000)], "long.txt")), /characters/);
  await assert.rejects(readChatFile(new File(["not a supported chat"], "chat.txt")), /Name: message/);
});
