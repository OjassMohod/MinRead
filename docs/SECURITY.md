# minread security and quota protection

## Deployed firewall rule

The user reported publishing a Vercel Firewall rule on the current deployment:

- Name: `minread-analysis-rate-limit`
- Request Path equals `/api/analyze`
- Fixed window: 3 requests per 60 seconds, keyed by IP Address
- Action: Too Many Requests (429)

The shared counter is managed by Vercel before application inference, so it is
not an unreliable per-instance memory counter. Configure the rule in the Vercel
project and publish changes; committing source alone does not install a firewall
rule. This rule needs no application API key, new paid service, SDK, or environment
variable. If desired, also match HTTP Method POST so other methods do not count.

The application recognizes 429 even when the firewall returns HTML, shows a clear
wait message, and never substitutes example output for a failed model request.
The UI handling was verified using explicit test-only transport responses.
Independent live rule enforcement has not yet been verified: workspace networking
blocked access to the deployed domain. User-reported publication is not a measured
live 429 test.

Limits: IP limits can affect users behind a shared campus connection; distributed
clients can still exhaust organization-wide provider quotas. The rule does not
prove authentication, guarantee daily availability, or create a billing cap.
Stay on Groq Free Plan; paid fallback remains disabled. Vercel's firewall may
process IP metadata; do not claim that no host processes identifying metadata.

## Application protections

- Server-only key, fixed provider URL registry, and paid-provider opt-in disabled.
- Same-origin browser checks, strict request schema, streamed 80 KB body cap,
  20,000-character chat limit, and request-body timeout.
- Strict model output and source-ID validation, bounded output, model timeout,
  and no automatic API retries.
- React-escaped plain text: chat/model text is never inserted as HTML.
- Noncached API responses and sanitized errors; no app chat persistence, analytics,
  session replay, or conversation-content logging.
- Prompt separates untrusted chat data from extraction instructions, grants no
  tools/actions, and requires supporting sources. This mitigates prompt injection
  but cannot guarantee semantic accuracy.

## Verify without consuming model quota

From a fresh rate-limit window, send four invalid JSON-schema requests (`{}` with
Content-Type application/json) to the deployed `/api/analyze` within 60 seconds.
The application rejects these before inference, so they do not call Groq. The
first three should receive 400 and the fourth 429. Inspect Vercel firewall logs
if results differ. Do not disable the rule to hide failures.

Do not publish actual secrets, use private chats as test inputs, or claim
zero leakage/retention. Provider and hosting policies still apply.
