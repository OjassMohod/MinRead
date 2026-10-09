# minread — MVP scope and architecture

## Updated constraint: API must be free

Use Groq Free Plan and `openai/gpt-oss-120b`; see `PROVIDER_DECISION.md` for verified
quotas and data controls. The adapter and disclosure now use configurable provider
settings, defaulting to Groq. Put the Groq key in shared `CHAT_MODEL_API_KEY`, with
its secure destination changed to `api.groq.com` in environment settings. Paid
providers are disabled by default; never add paid fallbacks or automatic upgrades.

## Goal

Help a returning chat participant understand what changed and what needs their
attention. Deliver one working flow within a 150-minute hackathon budget:
paste conversation → enter your name → analyze → inspect results and evidence.

## Locked MVP scope

- Paste plain text using `Name: message`, with optional timestamps.
- Enter a name or handle for relevance; do not infer the user's identity.
- Show outstanding tasks, explicit deadlines, decisions, changes, and a brief recap.
- Link every finding and summary bullet to supporting message IDs.
- Highlight cited messages. Priority levels are deferred to preserve deployment time.
- Provide loading, empty, invalid-input, model-error, and clear-data states.
- Make the main flow accessible by keyboard and usable on a phone.

Results must appear in this order: Deadlines & Action Items, Conversation Summary,
Important Decisions, Open Issues. Every displayed item opens its supporting
messages. Open issues include important unanswered questions, unassigned work,
unresolved blockers, and conflicting decisions; later resolution must be respected.

No accounts, conversation database, messaging integrations, attachments,
notifications, automatic replies, local inference, or unread-boundary
selection in the initial MVP. Synthetic fixtures are evaluation inputs, never
canned analysis results.

## Technical decisions

- Next.js App Router and TypeScript: one application for browser UI and backend.
- Zod: validate requests and model responses.
- Groq API: real server-side inference; default model `openai/gpt-oss-120b`, subject
  to a successful access and structured-output check. Keep the model configurable
  through server-only `CHAT_MODEL_NAME`. Never silently substitute sample output.
- Vercel: intended public deployment target; account access and deployment are
  not yet verified. The cloud development environment is not the public host.
- Credential: server-only `CHAT_MODEL_API_KEY`, passed explicitly to the SDK.
  Never use a `NEXT_PUBLIC_` variable for credentials.

Use separate modules for parsing, schemas, model extraction, response validation,
result grouping, and interface components. The unused `hello.py` starter is removed.

## Data flow and boundaries

1. Hold pasted text in browser memory. Disclose cloud processing before Analyze.
2. On Analyze, POST to the same-origin `/api/analyze` server endpoint.
3. Validate input, assign stable message IDs, and send conversation data to the
   server-selected provider (Groq by default).
4. Request structured extraction with owners, deadline text, supported normalized
   dates, status, ambiguity, and source IDs. Give the model no tools or actions.
5. Validate the output and its source IDs, then place findings in the four requested sections.
6. Return results with `Cache-Control: no-store`; render all content as escaped text.
7. Clear resets input and results. It does not delete provider-retained data.

Treat instructions inside conversations as untrusted data. Prompt instructions
reduce injection risk but do not guarantee correct extraction. Source validation
checks that IDs exist; evaluation must also check that their text supports claims.

## Limits and result rules

- Initial input maximum: 20,000 characters, enforced server-side along with a
  request-body byte limit. Reject oversize input; never silently truncate.
- Initial output budget: 3,000 tokens; model timeout: 30 seconds. Detect incomplete
  output and fail visibly rather than displaying a partial result as complete.
- Show assigned outstanding tasks first, followed by summary, confirmed decisions,
  and open issues. Do not add priority levels in this MVP.
- Later corrections supersede earlier instructions only when supported by evidence.
- Completed or cancelled items are not outstanding tasks; conflicts remain flagged.

## Security and privacy requirements

- No chat persistence, local storage, analytics, session replay, or content logging.
- Keep API keys out of browser bundles, Git, URLs, logs, and errors.
- Render plain text; never insert chat or model output as raw HTML.
- Use HTTPS for public deployment and restrict cross-origin access.
- Add deployment-supported request rate limiting before public exposure. Confirm
  the selected mechanism and plan availability; an in-memory serverless counter
  or CORS alone is not adequate abuse protection.
- Configure provider spending controls where supported and verify their semantics;
  a budget alert may not be a hard spending cap.
- Check provider and hosting retention policies before making privacy claims.
  Both backend and provider process the text; no claim of zero leakage or zero retention.
- If inference is unavailable, show an honest unavailable/error state.

## Acceptance criteria

- Unfamiliar pasted conversations produce actual model-generated results.
- Findings correctly extract tasks and deadlines and link to supporting messages.
- Changed deadlines, completed tasks, ambiguous assignments, and no-action chats
  behave as expected against labeled fixtures.
- Malicious HTML displays as text; embedded instructions do not trigger actions.
- Oversize requests are rejected; failed inference never produces canned results.
- The deployed flow works from a fresh browser session without developer credentials.

## Current evidence and prerequisites

- Project: minread; repository `OjassMohod/MinRead`; local checkout `/workspace/Test1`.
- Node.js 24 and pinned dependencies; Vercel deployment configuration is included.
- Shared `CHAT_MODEL_API_KEY` is injected. Groq model availability and a real
  production-server analysis succeeded using the workspace proxy.
- Workspace startup must set `NODE_USE_ENV_PROXY=1`; ordinary deployment does not
  need this unless its host requires an outbound network proxy.
- Vercel needs its own secure server-side key setting. Workspace proxy credentials
  do not automatically transfer. No Vercel token is available here.
- The app is deployment-ready after the listed checks, but has no verified public
  URL yet. Follow README deployment steps and test the deployed URL before submission.
- User published Vercel Firewall IP rate protection. Independent enforcement
  verification is pending workspace access; distributed clients can still consume
  the free provider quota. See docs/SECURITY.md.

## Remaining execution sequence

1. Complete: synthetic dataset, runnable app, server-side Groq extraction, privacy
   disclosure, strict validation, and four-section results with clickable evidence.
2. Skipped by user: priority levels. Corrections are addressed in extraction and
   result grouping without priority scores.
3. Completed: production build, 26 tests, UI smoke checks, and an initial full
   synthetic evaluation with failures recorded; targeted rechecks follow fixes.
4. User completed Vercel deployment and reported successful incognito access.
   Independently verify public rate protection and updated deployment after push.
5. Submit deployed URL, description, and model/provider disclosure.

Optional features are deferred. Preserve real inference, evidence, credential
protection, and deployed functional testing.

A later user-requested addition supports local UTF-8 .txt imports in the existing
chat format, with byte/character limits and no upload until Analyze.
