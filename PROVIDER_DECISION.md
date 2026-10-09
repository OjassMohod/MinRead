# minread free API provider decision

Verified against official documentation on 9 October 2026.

## Decision

Use **Groq Free Plan** with `openai/gpt-oss-120b`. `openai/gpt-oss-20b` is an
alternative with the same published free quotas. Both support strict JSON Schema
output. The `openai/` model prefix identifies the model family; inference is hosted
by Groq and does not require an OpenAI API key.

The project must use a free-plan organization, never upgrade automatically, and
never fall back to a paid provider. A free plan has finite quotas and availability;
it is not an unlimited or permanently guaranteed service. Using a paid organization
can incur charges even with the same model, so keep the organization on Free Plan.

## Published Free Plan quotas for both selected models

| Limit | Published value |
| --- | --- |
| Requests per minute | 30 |
| Requests per day | 1,000 |
| Tokens per minute | 8,000 |
| Tokens per day | 200,000 |

Limits apply at the organization level, shared by users of the deployed app.
Exceeding any limit produces HTTP 429. Exact account limits can differ; the console
Limits page and response headers are authoritative for the actual organization.
Some organizations also have separate input/output token-per-minute limits.

The token quota is likely to bind first for conversation analysis. For example,
at approximately 4,000 total tokens per analysis, 200,000 tokens/day supports about
50 analyses/day, not 1,000. This is an illustration, not a throughput guarantee:
prompt/schema overhead, reasoning, output, and provider accounting affect usage.
Do not confuse a model's context window with free-tier throughput limits.

## Data policy

Groq says customer inputs/outputs are not retained by default, but reliability and
abuse-monitoring logs can retain them for up to 30 days (longer when legally required).
All customers may enable Zero Data Retention in organization Data Controls.
Usage metadata remains collected. Enable ZDR, avoid batch/fine-tuning/persistence
features, and use fictional test conversations. Do not promise zero leakage.

Google's Gemini pricing page confirms free input/output for Flash-Lite variants,
but lists free-tier data as used to improve products. Its rate-limits page directs
users to AI Studio for active account-specific quotas rather than guaranteeing a
single public quota table. Groq is preferred for this app's privacy and structured
extraction requirements.

## Configuration and migration status

- The adapter uses shared server-only `CHAT_MODEL_API_KEY` and configurable
  provider/model. A separate `GROQ_API_KEY` is not needed.
- The current workspace binding works against `api.groq.com`. Node.js must use
  `NODE_USE_ENV_PROXY=1` here for its requests to reach the platform proxy.
- Groq model availability and two actual structured-output analyses passed.
  The first used a production-server request; the second used the browser flow.
  Their total measured usage was 4,222 tokens. This is not a full accuracy benchmark.
- Defaults remain Groq / `openai/gpt-oss-120b`, paid fallback disabled. Keep the
  organization on Free Plan; the app cannot inspect the account's billing plan.
- Vercel needs its own securely entered key; workspace proxy bindings do not
  transfer. Deployment configuration and instructions are included in README.
- Public deployment and its actual URL smoke check remain outstanding.

## Official sources

- [Free Plan limits](https://console.groq.com/docs/rate-limits)
- [Structured Outputs and supported models](https://console.groq.com/docs/structured-outputs)
- [Groq data controls and retention](https://console.groq.com/docs/your-data)
- [GPT-OSS 120B model](https://console.groq.com/docs/model/openai/gpt-oss-120b)
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
