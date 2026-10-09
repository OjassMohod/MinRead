# minread

Catch up on a busy chat in one pass: **Deadlines & Action Items → Conversation
Summary → Important Decisions → Open Issues**. Click any result to see the
original supporting messages. Priority levels are intentionally outside this MVP.

Built with Next.js, TypeScript, Zod, and real server-side Groq inference. No canned
AI results, accounts, or conversation database. Preview messages locally; Analyze
sends the conversation to Groq after the privacy notice.

## Deploy on Vercel

1. Import `OjassMohod/MinRead` at https://vercel.com/new, using the branch containing
   this MVP. Choose the free Hobby plan for an eligible personal hackathon project.
2. Keep the **Next.js** framework and repository root. Node.js is pinned to **24.x**;
   `vercel.json` supplies `npm ci` and `npm run build`.
3. Add these server-side environment variables before deploying:

   | Name | Value |
   | --- | --- |
   | `CHAT_MODEL_API_KEY` | Your current Groq key, entered securely in Vercel |
   | `CHAT_MODEL_PROVIDER` | `groq` |
   | `CHAT_MODEL_NAME` | `openai/gpt-oss-120b` |
   | `CHAT_MODEL_ALLOW_PAID` | `false` |

   Do not prefix the key with `NEXT_PUBLIC_`. Workspace network secrets are not
   automatically available in Vercel. Never copy a proxy placeholder as the key;
   use the actual key from your Groq account, only in Vercel's secure settings.
4. Click Deploy. If you change environment variables afterward, redeploy.
5. Open the HTTPS deployment URL in a fresh browser. Enter `Asha` and paste:

   ```text
   Ravi: Asha, upload the final slides by 5 PM on 12 October 2026, IST.
   Asha: Yes, I will upload them.
   Ravi: Decision: use the blue theme for our demo.
   Neha: Who has the HDMI adapter for the demo?
   ```

   Click Analyze. Verify a slides task/deadline, summary, blue-theme decision,
   and unanswered adapter question. Click each result to inspect its evidence.
   Verify Clear resets input and results. These are synthetic **inputs**, not
   precomputed outputs; every Analyze makes a real model call.
6. Submit the deployed URL, a brief description, and disclose **Groq API / OpenAI
   GPT-OSS 120B** for structured chat extraction. Using the OpenAI SDK with Groq's
   endpoint does not send these requests to OpenAI. Check evaluator access if
   deployment protection is enabled.

This is a server-backed app; GitHub Pages or a static export cannot run its API.
Public deployment and a live test on its actual URL are still required before
submission. No Vercel deployment credentials are available in this workspace.

## Free API and privacy

The selected Groq Free Plan limits are 30 requests/minute, 1,000 requests/day,
8,000 tokens/minute, and 200,000 tokens/day for this model; verify your account's
actual limits. There is no automatic paid fallback. Keep Groq on Free Plan.
The app cannot inspect your account's billing plan. Quota exhaustion shows an
error rather than fake output. See [provider details](PROVIDER_DECISION.md) and
[dataset budget](datasets/synthetic/TOKEN_BUDGET.md).

The backend and Groq process chats. The app does not save conversations or log
content; provider and hosting policies still apply. Enable Groq Zero Data
Retention in its Data Controls where available. Use non-sensitive chat for demos.
Clearing cannot retract an already-sent provider request. No zero-leakage claim.

Input size limits, strict schemas, source-ID validation, escaped text, same-origin
checks, timeouts, and sanitized errors are implemented. Source IDs confirm where
an answer points, not whether every interpretation is correct. Review evidence.
The public endpoint has no distributed rate limiter: before broadly sharing it,
configure hosting-level rate controls if available on your plan. Origin checks
alone do not stop direct API clients; free provider quotas can still be exhausted.

## Run locally

Use Node.js 24. Set the variables from `.env.example` securely in your environment
or an ignored `.env.local` file; never commit a populated file.

```sh
npm ci
npm run dev
```

For this proxy-backed cloud workspace, use `NODE_USE_ENV_PROXY=1` when starting
Node.js so Groq requests use the provided network proxy. It is not needed on a
normal host without a network proxy. Preserve the supplied certificate settings.

```sh
npm test
npm run typecheck
npm run build
npm run start
```

Supported paste format: `Name: message`, optionally prefixed with `[ISO timestamp]`.
Continuation lines belong to the previous message. Other export formats need
conversion. Inputs over 20,000 characters are rejected, not truncated.

## Structure and validation

- `src/lib`: parsing, schemas, extraction prompt, provider selection, evidence
  validation, and four-section placement.
- `src/lib/server` and `src/app/api/analyze`: server-only credentials and inference.
- `src/components`: input, accessible result cards, and source viewing.
- `datasets/synthetic`: 12 labeled synthetic cases; labels never enter model inputs.
- `tests`: 17 foundation, request, provider, and grouping checks.

All 17 tests, TypeScript checking, and the production build pass. Two live Groq
checks passed (4,222 tokens total): task/deadline/unanswered-question extraction
and a browser test of deadline correction, four sections, source viewing, keyboard
controls, mobile width, and Clear.
This is a functional smoke check, not an accuracy benchmark over every fixture.
See [MVP plan](PROJECT_PLAN.md) for scope and deferred features.
