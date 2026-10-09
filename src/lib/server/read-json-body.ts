import { MAX_REQUEST_BYTES } from "../limits";

export class RequestInputError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Limit actual streamed bytes, not just a caller-controlled Content-Length. */
export async function readJsonBody(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestInputError(415, "Send an application/json request.");
  }
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_REQUEST_BYTES) throw new RequestInputError(413, "Request is too large.");
  if (!request.body) throw new RequestInputError(400, "Request body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RequestInputError(408, "Request body timed out."));
      void reader.cancel().catch(() => undefined);
    }, 5_000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) throw new RequestInputError(413, "Request is too large.");
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw new RequestInputError(400, "Request must contain valid JSON."); }
  } catch (error) {
    void reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
