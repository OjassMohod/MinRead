# minread — MVP scope and architecture

## Goal

Help a returning chat participant understand what changed and what needs their
attention. Deliver one working flow within a 150-minute hackathon budget:
paste conversation → enter your name → analyze → inspect priorities and evidence.

## Locked MVP scope

- Paste plain text using `Name: message`, with optional timestamps.
- Enter a name or handle for relevance; do not infer the user's identity.
- Show outstanding tasks, explicit deadlines, decisions, changes, and a brief recap.
- Link every finding and summary bullet to supporting message IDs.
- Explain priorities in text and highlight the cited messages.
- Provide loading, empty, invalid-input, model-error, and clear-data states.
- Make the main flow accessible by keyboard and usable on a phone.

No accounts, conversation database, messaging integrations, attachments, file
imports, notifications, automatic replies, local inference, or unread-boundary
selection in the initial MVP. Synthetic fixtures are evaluation inputs, never
canned analysis results.

## Technical decisions

- Next.js App Router and TypeScript: one application for browser UI and backend.
- Zod: validate requests and model responses.
- OpenAI API: real server-side inference; initial model `gpt-4.1-mini`, subject
  to a successful access and structured-output check. Keep the model configurable
  through server-only `CHAT_MODEL_NAME`. Never silently substitute sample output.
- Vercel: intended public deployment target; account access and deployment are
  not yet verified. The cloud development environment is not the public host.
- Credential: server-only `CHAT_MODEL_API_KEY`, passed explicitly to the SDK.
  Never use a `NEXT_PUBLIC_` variable for credentials.

Use separate modules for parsing, schemas, model extraction, response validation,
priority rules, and interface components. The unused `hello.py` starter is removed.

## Data flow and boundaries

1. Hold pasted text in browser memory. Disclose cloud processing before Analyze.
2. On Analyze, POST to the same-origin `/api/analyze` server endpoint.
3. Validate input, assign stable message IDs, and send conversation data to OpenAI.
4. Request structured extraction with owners, deadline text, supported normalized
   dates, status, ambiguity, and source IDs. Give the model no tools or actions.
5. Validate the output and its source IDs, then rank findings using application rules.
6. Return results with `Cache-Control: no-store`; render all content as escaped text.
7. Clear resets input and results. It does not delete provider-retained data.

Treat instructions inside conversations as untrusted data. Prompt instructions
reduce injection risk but do not guarantee correct extraction. Source validation
checks that IDs exist; evaluation must also check that their text supports claims.

## Limits and priority rules

- Initial input maximum: 20,000 characters, enforced server-side along with a
  request-body byte limit. Reject oversize input; never silently truncate.
- Initial output budget: 3,000 tokens; model timeout: 30 seconds. Detect incomplete
  output and fail visibly rather than displaying a partial result as complete.
- Highest priority: unresolved assignments to the user with supported overdue
  deadlines or deadlines within 24 hours. Use the user's timezone and a valid
  timestamp to interpret relative dates; otherwise leave dates unresolved.
- Next: other user assignments and relevant decisions or changes.
- Lower: informational updates. A mention alone is not an assignment.
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

- Initial repository inspection found only `hello.py`; it has since been removed.
- Project name: `minread`; GitHub repository: `OjassMohod/MinRead`.
  The local checkout remains `/workspace/Test1`; folder names do not define branding.
  After the user renamed the repository, Git read access to the new URL was
  verified and origin updated to `https://github.com/OjassMohod/MinRead.git`.
  No repository reset, move, or clone is necessary for the name change.
- Node.js 24.19.0 and npm 11.9.0 are installed. No application scaffold exists yet.
- Checked credential presence only; no secret values were read or printed.
- Neither `CHAT_MODEL_API_KEY` nor `OPENAI_API_KEY` is currently injected.
- No Vercel deployment token is currently injected; an authenticated deployment
  route or manual Vercel project setup will be needed during deployment.
- Saved a cloud-environment draft requirement for `CHAT_MODEL_API_KEY`, scoped
  to HTTPS destination `api.openai.com`; this domain was added to allowed access.
- Draft saving does not inject a value, apply runtime changes, or publish.
  Supply the key securely in environment settings, review/save the changes, and
  publish the environment as required by the platform. Recheck model access afterward.
- Vercel needs its own server-side key binding; the cloud environment proxy binding
  is not automatically transferred to the deployed application.
- No inference or deployment has been verified. Dataset and UI work can continue
  while credentials are unavailable.

## Remaining execution sequence

2. Completed: 12 labeled synthetic cases in `datasets/synthetic`, eight development
   and four held-out evaluation cases. Labels are separate from model inputs.
3. Scaffold the application and modular parsing/schema foundation.
4. Wire real inference and server-side validation.
5. Build the accessible input, results, and source-navigation interface.
6. Implement ranking and correction handling.
7. Evaluate actual output, record failures, and fix the core workflow.
8. Verify security controls and deployment abuse protection.
9. Deploy and test as an evaluator from a fresh browser session.
10. Document setup, provider usage, limitations, and submission requirements.

Optional features are cut first if time slips. Preserve real inference, evidence,
credential protection, and deployed functional testing.
