# Synthetic dataset API budget

Measured locally on 9 October 2026; no API calls or credits were used.

## Dataset size

- 12 conversations: eight development and four held out.
- 158 messages, including one 100-message noisy thread.
- 10,237 Unicode characters / 10,291 UTF-8 bytes of paste-ready conversation text.
- `conversations.json` is 39,844 bytes, including fixture metadata and duplicated
  representations. Do not send this whole file to the model.
- Expected labels are separate and must never be sent as model input.

## Method and assumptions

Tokenized the current extraction instructions, structured response schema, and each
case's actual `buildModelInput` representation using `gpt-tokenizer@4.0.0`, model
`gpt-oss-120b`, encoding `o200k_harmony`. Added 100 tokens per request for framing
and provider overhead. This is a planning estimate, not measured provider billing.

Per request: instructions 531 tokens, schema 579 tokens, framing reserve 100 tokens,
plus the individual conversation JSON and context. Total estimated input across
12 independent requests: **20,075 tokens**. Raw pasted chats alone are 3,165 tokens;
ignoring repeated prompt/schema overhead substantially underestimates usage.

Carry over the current 3,000-token generation cap to the Groq adapter, bounding
all generated completion content including reasoning under that cap. Use low
reasoning effort. Confirm actual input, completion, and reasoning accounting in
the provider usage response after obtaining a key. No paid fallback is allowed.

At that cap, a conservative planning budget is:

`20,075 estimated input + 12 × 3,000 generated tokens = 56,075 tokens/full run`.

Actual output will often be smaller. Tokenizing label-shaped illustrative results
gave 1,639 visible tokens across all cases, but those are human-authored labels,
not generated results; they do not establish actual output or reasoning usage.

## Daily budget scenarios

Groq publishes 200,000 tokens/day and 1,000 requests/day for both selected GPT-OSS
models on Free Plan. The account's actual limits may differ, and all users share
the organization's limits. Figures below assume no other account usage or retries.

| Scenario | Requests | Estimated budget at generation cap | Remaining of 200,000 |
| --- | ---: | ---: | ---: |
| One full dataset run | 12 | 56,075 | 143,925 |
| Two full test runs + two longest-chat demos | 26 | 125,990 | 74,010 |
| Three full test runs + two longest-chat demos | 38 | 182,065 | 17,935 |
| Three full test runs + two short demos (dev-01 and dev-02) | 38 | 177,205 | 22,795 |
| Four full dataset runs | 48 | 224,300 | Exceeds by 24,300 |
| Five full dataset runs | 60 | 280,375 | Exceeds by 80,375 |

The longest chat has an estimated 3,920 input tokens and a 6,920-token budget with
the completion cap. Two demos here mean two analyses of that conversation, not
two reruns of all 12 fixtures.

## Scheduling and reserve

The 8,000 tokens/minute limit can bind long before 30 requests/minute. Do not run
the dataset in parallel. Initially pace requests approximately 65 seconds apart
and honor rate-limit/reset/retry headers. Then adapt pacing to measured usage.
Allow roughly 13 minutes per complete run at this conservative pace.

Reserve at least 20,000 daily tokens for judge demos and retries. Prefer the two
short judge demos: after three full tests they leave 22,795 tokens, whereas two
long demos leave only 17,935 tokens at the generation cap. Track aggregate
token counts only; do not log real conversation text. Local parser/unit tests and
Preview messages use no model quota. Repeatedly running held-out cases while
tuning forfeits their value as unseen evaluation; create new unseen cases afterward.

Three full test runs plus two single-chat demos fit the estimated daily budget,
but five whole-dataset runs cannot be guaranteed at the current generation cap.
Two short live smoke checks measured 2,007 and 2,215 tokens (4,222 total).
No long request has been measured yet. Subtract those tests and any other account
usage from the daily quota before relying on these estimates. Provider overhead, refusals, retries, and unrelated account
usage can reduce the available budget.

Sources: [Groq limits](https://console.groq.com/docs/rate-limits),
[API reference](https://console.groq.com/docs/api-reference),
[reasoning controls](https://console.groq.com/docs/reasoning).

The current extraction prompt has additional coverage instructions; the estimates
above describe the earlier prompt and must not be treated as an exact current
budget. Actual measured usage and request failures from the subsequent live
evaluation are in `docs/evaluation-results.json`. The runner reserves 4,500 tokens
per short case and 7,000 for the long case, pacing against 8,000 TPM. Failed calls
without usage metadata may still consume quota. Account-wide usage also counts.
