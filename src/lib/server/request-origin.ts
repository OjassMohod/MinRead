/** Next.js can construct request.url with an internal hostname. Compare the
 * browser's origin with the actual HTTP Host, never caller-supplied forwarded hosts.
 * This blocks cross-origin browser requests; it is not authentication or rate limiting.
 */
export function isAllowedOrigin(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true; // Native clients are still subject to validation and usage limits.
  try {
    const url = new URL(origin);
    const requestUrl = new URL(request.url);
    const host = request.headers.get("host") ?? requestUrl.host;
    return origin === url.origin && url.host === host && url.protocol === requestUrl.protocol;
  } catch { return false; }
}
