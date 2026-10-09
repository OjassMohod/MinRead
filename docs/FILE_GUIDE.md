# minread: a beginner's guide to every repository file

This guide assumes you know Python variables, conditions, loops, lists, and
functions. Read it in order once; afterward, use the filenames to find the part
you want to understand. It explains responsibilities and important operations,
not every individual line of syntax.

## Step 1: Learn the small amount of vocabulary you need

**Browser / frontend:** the part running on the user's device. It shows the form,
responds to clicks, and displays results.

**Server / backend:** the program running on the hosting provider's machine. It
checks requests and calls Groq using the secret API key.

**API:** a way for one program to ask another program to do something. Clicking
Analyze makes the browser ask our server to analyze a chat. Our server then asks
Groq to run the language model.

**Node.js:** runs JavaScript outside the browser, a little like the Python
interpreter runs Python programs. Node.js is not an AI model.

**React:** helps build a screen from reusable functions called components.
**Next.js:** organizes React pages and server functions into one deployable app.

**TypeScript:** JavaScript with descriptions of the types values should have.
For example, `name: string` says a name must be text. Type checking can catch
mistakes before running the app. It does not replace checking data arriving over
the internet.

**Objects and JSON:** an object stores named values. In Python, the nearest
comparison is a dictionary:

```python
message = {"sender": "Ravi", "text": "Send the slides"}
print(message["sender"])
```

JSON is a standard text representation of objects, lists, strings, numbers, and
booleans. Programs use it to exchange data. JSON `null` is like Python `None`.

**State:** values React remembers between clicks. Changing state tells React to
update the screen. An ordinary local variable inside a function would not provide
that same persistent screen state.

**Asynchronous work:** reading a file or waiting for Groq takes time. An `async`
function can use `await` to wait for that operation to finish. The browser can
still respond to other events while it waits; this is not a promise of parallel
CPU computation.

**Validation:** checking data before using it. A schema is the collection of
rules for those checks, like many `if` statements collected in one place.

**File extensions:**

| Extension | Meaning here |
| --- | --- |
| `.ts` | TypeScript logic |
| `.tsx` | TypeScript that also describes screen elements using JSX |
| `.css` | Visual styling rules |
| `.json` | Structured data or settings |
| `.md` | Markdown documentation |
| `.yml` | Structured instructions for an automation service |

JSX looks like HTML inside code, for example `<button>Analyze</button>`. React
turns that description into screen elements. It is not a Python string or an
instruction to the AI model.

`import` brings in code from another file, like Python imports. `export` makes
code available for other files to import. `@/lib/...` is this project's shortcut
for `src/lib/...`.

`throw` signals an error, like Python `raise`. `try`/`catch` handles an error, like
Python `try`/`except`. A custom error class is a way to attach useful information
such as an HTTP status to that error; you do not need to learn classes first to
follow the input → processing → result path.

Arrays here are like Python lists. `map()` creates a new array by applying a
function to each item; `filter()` keeps items matching a condition; `some()` asks
whether at least one item matches. You could express these operations using
ordinary Python loops and `if` statements.

## Step 2: Follow one conversation through the application

Suppose Asha enters:

```text
Ravi: Asha, send the slides by 5 PM on 12 October 2026, IST.
Asha: I'll send them.
```

The main route through the files is:

1. `layout.tsx` creates the outer page and loads the styles.
2. `page.tsx` supplies the homepage and the configured provider's display name.
3. `conversation-input.tsx` remembers the pasted text and name.
4. On Analyze, it checks the input and uses `parse-chat.ts` to preview messages.
5. The browser sends JSON to `/api/analyze`.
6. `route.ts` checks origin, body, input shape, and chat format.
7. `analyze-conversation.ts` gets server settings and builds a real Groq request.
8. `model-prompt.ts` supplies instructions and conversation data; `schemas.ts`
   supplies the required output structure.
9. `validate-analysis.ts` checks the returned structure and source references.
10. The browser receives `{ analysis, usage }`.
11. `group-analysis.ts` sorts findings into the four sections.
12. `analysis-results.tsx` renders clickable cards. Clicking one asks
    `conversation-input.tsx` to show the cited original messages.

The AI extracts the meaning. Ordinary functions handle validation, grouping,
counting, rendering, and source lookup. The AI does not create the website itself
when a user clicks Analyze.

## Step 3: Understand the visible website

### 1. `src/app/layout.tsx` — the outer page

**Purpose:** provide the common wrapper around the site's pages.

**What it does:**

1. Loads `globals.css`.
2. Sets the browser-tab title and page description.
3. Wraps the page content in `<html>` and `<body>` and declares English as the
   document language.

`children` means the content placed inside this wrapper. Picture a Python
function that takes some content and puts it inside a surrounding structure.

### 2. `src/app/page.tsx` — the homepage

**Purpose:** decide what appears when someone visits the site's root URL.

**What it does:**

1. Reads the provider's safe display settings on the server.
2. Falls back to a generic provider label if configuration is invalid.
3. Shows the brand, introduction, three-step explanation, input component, and
   footer.

It passes `providerName` to the input component, just as you pass an argument to
another Python function. It does not pass the API key. `connection()` makes the
page use the current request-time settings rather than freezing that disclosure
when the app is built.

### 3. `src/app/globals.css` — the appearance

**Purpose:** control colors, spacing, fonts, borders, layout, and focus outlines.

A CSS rule such as `button { ... }` applies appearance settings to buttons.
Classes such as `.result-card` target particular kinds of elements.

The file also changes the two-column layout into a single column on narrow
screens. That is why the same app can fit a phone. CSS does not call Groq or
extract deadlines.

### 4. `src/components/conversation-input.tsx` — the main controller for user interaction

**Purpose:** connect the form, preview, import, analysis, clear, and source viewer.

It keeps separate state values for the chat text, selected name, parsed messages,
results, errors, loading state, and selected source IDs.

Important functions:

- `input()` checks the current text, name, and browser timezone.
- `preview()` parses the chat locally without calling the model.
- `analyze()` sends a validated request, waits for the result, checks it, and
  updates the displayed analysis. It displays honest errors if the request fails.
- `loadExample()` loads synthetic input; it does not load a canned AI answer.
- `importFile()` reads and validates a local text file, then fills the input and
  preview. It does not upload the file.
- `clear()` resets the input, preview, analysis, and source selection.
- `showSources()` and `closeSources()` control the evidence panel.
- `messageList()` renders original messages as a list of screen elements.

A `revision` counter increments when the current work is invalidated. An older
file read or request must match the current counter before it can change the
screen. This prevents a slow operation from restoring text after Clear.

An abort controller cancels the browser's pending analysis wait. It cannot undo
processing that already reached Groq. Effects handle automatic scrolling,
keyboard-focus return, and cleanup when leaving the component.

### 5. `src/components/analysis-results.tsx` — the four-section result display

**Purpose:** turn validated analysis into readable cards.

**What it does:**

1. Calls `groupAnalysis()`.
2. Counts actions, decisions, and open issues from those actual arrays.
3. Renders tasks, summary, decisions, and open issues in the requested order.
4. Shows owners, original deadline wording, local-time dates, and uncertainty.
5. Sends source IDs back to the input component when a card is clicked.

`SourceHint()` is a small reusable function for the source-link wording and icon.
The cards render text through React rather than inserting it as raw HTML.

For Python intuition, rendering a list is like:

```python
for finding in findings:
    display_card(finding)
```

Here, React creates interactive screen elements instead of printing text.

### 6. `src/lib/demo-chat.ts` — the example input

**Purpose:** store a short synthetic chat and its example user name.

The example contains a changed deadline, confirmed decision, and unanswered
question. The example button copies these strings into the form. The file
contains no precomputed analysis: Analyze still makes a real model request.

### 7. `src/lib/import-chat.ts` — safe local file reading

**Purpose:** implement the `.txt` import operation separately from the screen.

`readChatFile()`:

1. Checks the filename ends in `.txt`.
2. Rejects files over 80,000 bytes.
3. Reads the file locally and decodes UTF-8 text.
4. Rejects invalid encoding and certain binary control characters.
5. Calls the normal parser, which also enforces the character limit.
6. Returns the text and parsed messages.

It does not support PDF, images, or arbitrary WhatsApp/Slack export formats. The
file must use the app's supported `Name: message` format, optionally with ISO
timestamps. Oversized inputs are rejected, not shortened silently.

## Step 4: Understand how chat data is represented and checked

### 8. `src/lib/limits.ts` — shared limits

**Purpose:** keep important numbers in one place:

- 20,000 characters per conversation.
- 80,000 bytes per API request body.
- 3,000 maximum model completion tokens.
- 30-second model-request timeout.

Characters and bytes are different: some characters need several bytes in UTF-8.
Tokens are the pieces the model processes; they are not the same as words.

Other files import these constants so their limits remain consistent.

### 9. `src/lib/schemas.ts` — data contracts

**Purpose:** define the allowed shapes of input, messages, findings, and responses.

Examples of rules:

- A message needs an ID, sender, text, and either an ISO timestamp or `null`.
- An analysis request needs chat text, a name, and a valid timezone.
- A finding needs a recognized kind/status and at least one source ID.
- The model returns a summary array and a findings array.
- The server response wraps analysis together with token-usage counts.

A Python equivalent might begin:

```python
if not isinstance(name, str):
    raise ValueError("Name must be text")
if len(chat) > 20000:
    raise ValueError("Chat is too long")
```

Zod expresses many such rules together. TypeScript types then describe the
validated shapes for developers. Runtime validation and type checking have
separate jobs.

### 10. `src/lib/parse-chat.ts` — text into message objects

**Purpose:** turn pasted text into an ordered array of messages.

`parseChat()` loops through lines. A regular expression—a text-pattern matching
rule—recognizes `Name: message` and `[ISO timestamp] Name: message`.

For each new message it:

1. Extracts sender, text, and optional timestamp.
2. Assigns an ID such as `m001` or `m002`.
3. Validates the message.
4. Appends it to the array.

A line without a new sender continues the previous message. Blank lines are
ignored. Invalid first lines and malformed timestamps produce errors. Missing
message times remain `null`; the parser does not invent them.

The example from Step 2 becomes two objects with senders Ravi and Asha. This is
ordinary parsing, not AI analysis.

### 11. `src/lib/validate-analysis.ts` — checking model output

**Purpose:** reject results that break the output contract.

It checks the schema, creates a set of real message IDs, and loops through every
summary/finding to ensure its source IDs exist. It also rejects a normalized
deadline that lacks original deadline wording.

A set is a collection of unique values used for fast membership checks. Think
of testing whether an ID is in a list, but with a container designed for that job.

If the model cites `m999` but the chat contains only `m001` and `m002`, this file
rejects that result.

Important limit: an existing citation does not prove the interpretation is
correct. This function checks structure and reference integrity, not the full
meaning of the conversation.

### 12. `src/lib/group-analysis.ts` — findings into four sections

**Purpose:** apply ordinary rules to model findings.

It uses filtering and sorting:

- Actions: open tasks with known owners; the selected user's tasks come first.
- Summary: the model's summary bullets.
- Decisions: confirmed decisions with `resolved` status.
- Open issues: open/unclear issues, unassigned or unclear tasks, and pending or
  disputed decisions.

Think of it as several Python loops that append items only when an `if` condition
matches. This
file does not call a model, invent facts, or assign high/medium/low priority levels.

## Step 5: Understand the server and actual AI call

### 13. `src/app/api/analyze/route.ts` — the browser-facing API endpoint

**Purpose:** receive requests at `/api/analyze`.

Next.js maps the folder structure to that URL. `POST()` is the function handling
submitted analysis requests; GET does not run analysis.

Its sequence is:

1. Check whether the browser origin is allowed.
2. Read a size-limited JSON body.
3. Validate input fields.
4. Parse chat messages.
5. Ask the model adapter to analyze them.
6. Return JSON without browser caching.

Errors are translated into safe HTTP responses. An HTTP status is a numeric
result: 200 means success, 400 usually means invalid input, and 503 means the
service is unavailable. `maxDuration = 40` tells supporting hosting platforms the
function's requested execution limit; the model timeout is separately 30 seconds.

### 14. `src/lib/server/read-json-body.ts` — bounded request reading

**Purpose:** stop oversized or malformed requests before inference.

It checks content type, checks the stated length, then reads actual incoming
chunks in a loop. It counts bytes itself instead of trusting the sender's
`Content-Length` claim. It also limits how long body reading can take.

Finally, it decodes UTF-8 and parses JSON. Incorrect content type, invalid JSON,
large bodies, and timeouts produce specific input errors.

### 15. `src/lib/server/request-origin.ts` — browser origin checking

**Purpose:** reject analysis requests coming from another website's browser page.

It compares the request's Origin against the actual Host and protocol, and rejects
cross-site browser requests. It handles the fact that Next.js may internally
construct a URL with a different hostname.

Origin checks are not login or rate limiting. Native programs can send requests
without an Origin header. The deployment's separate firewall handles IP rate
protection.

### 16. `src/lib/model-provider.ts` — allowed providers and models

**Purpose:** choose a supported provider using server settings.

A small lookup object contains labels, API addresses, and default model names.
Conditions reject unknown providers, reject unsupported configured Groq models,
and require explicit paid-provider permission before using OpenAI.

Default: Groq with `openai/gpt-oss-120b`. It supports switching to the configured
GPT-OSS 20B option, too. The app cannot inspect whether the provider account is
actually on a free billing plan.

There is no automatic fallback to a paid service and no browser-selected API URL.

### 17. `src/lib/server/model-config.ts` — private runtime settings

**Purpose:** read configuration supplied to the server through its environment.

`getProviderConfig()` reads provider/model/paid-permission settings.
`getModelConfig()` additionally checks that `CHAT_MODEL_API_KEY` is present.

An environment variable is a setting outside the source file. In Python, you
would read one with `os.environ.get("CHAT_MODEL_API_KEY")`.

`import "server-only"` helps prevent this module from being included in browser
code. The key is not returned as a page property or included in the chat prompt.

### 18. `src/lib/model-prompt.ts` — instructions and input preparation

**Purpose:** tell the model what extraction behavior is required.

`EXTRACTION_INSTRUCTIONS` is a string describing rules: cite evidence, respect
corrections/completion, avoid invented dates and assignments, separate confirmed
decisions from unresolved issues, and ignore instructions embedded in chat data.

`buildModelInput()` converts the selected user, timezone, server reference time,
and parsed messages into JSON. It excludes expected test labels and credentials.

The model receives instructions and conversation data as separate messages. This
reduces instruction confusion but cannot guarantee immunity to prompt injection
or perfect extraction.

### 19. `src/lib/server/analyze-conversation.ts` — calling Groq

**Purpose:** make the real model request and turn its result into the app response.

It:

1. Loads private model settings.
2. Creates an API client with a timeout and no automatic retries.
3. Sends instructions and input using the configured model.
4. Requests the strict JSON output shape defined by the schema.
5. Sets the completion budget and temperature; Groq uses low reasoning effort.
6. Rejects refusals, incomplete output, and invalid results.
7. Returns validated analysis and token-usage metadata when available.

The OpenAI SDK is the communication library, but the default destination is
Groq's API. Using this SDK does not itself send these chats to OpenAI.

Errors become safe messages; categorical failure metadata may be logged, not
provider bodies or conversation content. Temperature zero reduces variation but
does not guarantee deterministic or correct answers.

## Step 6: Understand synthetic data and evaluation

These files are development resources. The normal user's Analyze request does
not load the expected labels or recorded evaluation answers.

### 20. `datasets/synthetic/conversations.json` — test inputs

**Purpose:** store 12 invented conversations with IDs, participants, timestamps,
selected user, timezone, and raw text.

Cases include deadlines, corrections, completed/cancelled work, similar names,
ambiguous dates, unanswered questions, malicious instructions, and noisy chats.
These are inputs to tests/model runs, not real users' private chats.

### 21. `datasets/synthetic/expected.json` — expected findings

**Purpose:** describe what a reviewer expects for each synthetic case.

It stores expected owners, deadlines, statuses, sources, and section memberships.
Indexes point into arrays: index `0` means the first finding, just like a Python
list. It also contains summary checks and forbidden interpretations for review.
Legacy priority annotations remain in the dataset, but the app does not implement
priority levels.

Expected labels are assertions to check, not unquestionable truth. The vendor-quote
annotation was corrected and that change is recorded in evaluation documentation.

### 22. `datasets/synthetic/manifest.json` — split membership

**Purpose:** list which case IDs belong to development and held-out groups.

Originally, development cases were for tuning and held-out cases were reserved
for later evaluation. The latter have now been exercised; fresh unseen cases are
needed for a new independent assessment.

### 23. `datasets/synthetic/README.md` — dataset instructions

**Purpose:** explain fixture formats, labels, edge cases, evaluation methods, and
annotation changes. It is a guide for developers/reviewers, not executable code.

### 24. `datasets/synthetic/TOKEN_BUDGET.md` — quota planning

**Purpose:** explain estimated input/output costs and how tests/demos fit provider
limits. It distinguishes estimates from measured usage and notes that earlier
estimates used an older prompt.

This document does not enforce a quota or prove the current account's remaining
allowance.

### 25. `src/lib/evaluation-checks.ts` — automatic result checks

**Purpose:** compare a model response with selected expected properties.

It checks selected-user task counts, deadline values, assignment/correction
citations, open-issue coverage, and confirmed decisions. It returns a list of
failure descriptions. An empty failure list means these specific checks passed.

It uses ordinary functions, conditions, array filtering, and loops. It does not
fully evaluate summary faithfulness or the meaning of every sentence.

### 26. `scripts/evaluate.ts` — real-model evaluation runner

**Purpose:** run synthetic cases against an actual app endpoint.

It reads the fixture files, chooses all or selected cases, sends them one at a
time, checks responses, records token usage, and writes a report after each case.
It waits when its token-headroom estimate suggests another request would exceed
the minute allowance. Expected labels are used after inference, not in the prompt.

A prompt hash is a fingerprint of the instruction string, useful for identifying
which prompt was evaluated. It is not an accuracy score.

This runner uses API quota. Normal unit tests do not. It performs no automatic
retries and cannot account for all other activity sharing the provider account.

### 27. `docs/evaluation-results.json` — recorded observations

**Purpose:** preserve actual synthetic model outputs, request failures, usage,
prompt hashes, and rechecks.

It retains originally recorded results alongside reviewed checks when scoring or
annotations were corrected. Later successes do not remove earlier failures. The
app never reads this file to supply a user's analysis.

### 28. `docs/EVALUATION.md` — explanation of the evaluation

**Purpose:** explain what was run, what failed, what changed, and what the checks
can and cannot establish. It also gives reproduction commands.

It distinguishes a full baseline run from targeted final rechecks; those are not
the same as rerunning every case after the final change.

## Step 7: Understand the automated test files

A test calls a function with a chosen input and checks the result. Python intuition:

```python
result = some_function(test_input)
assert result == expected_result
```

These six test files currently contain 26 tests in total. They use local inputs
and test objects; they do not make live Groq calls.

### 29. `tests/foundation.test.ts`

Checks parsing against development fixtures, multiline/missing timestamps, invalid
input, malicious text preservation, and invalid source/deadline structures.
Purpose: catch broken input/output handling.

### 30. `tests/group-analysis.test.ts`

Checks section placement, completion/assignment handling, resolved issues, and
pending/disputed decisions. Purpose: ensure findings go into the right sections.
These tests supply expected findings; they do not prove the model can extract them.

### 31. `tests/provider.test.ts`

Checks Groq defaults, model switching, unsupported settings, and paid-provider
permission. Purpose: prevent unsafe or unintended configuration choices. It does
not authenticate with Groq or verify live account billing.

### 32. `tests/request.test.ts`

Checks JSON reading, byte limits despite dishonest declared lengths, model-input
separation, strict SDK output-format construction, and origin matching.
Purpose: catch request and integration-contract mistakes without live inference.

### 33. `tests/evaluation.test.ts`

Deliberately introduces stale deadlines, reopened work, invented dates, wrong
ownership, and missing blockers into sample results. It checks whether the
scoring helper notices. It also checks that valid assignment citations are not
rejected just for lacking acknowledgements.

Purpose: test the test/evaluation logic itself, so its reports are meaningful.

### 34. `tests/import.test.ts`

Checks local text-file reading: multiline text, encoding marker handling, invalid
UTF-8, binary/unsupported files, size limits, and malformed chats.
Purpose: ensure file import rejects bad inputs rather than silently changing them.

A file can contain several separate tests.

## Step 8: Understand installation, build, deployment, and automation

### 35. `package.json` — project tools and commands

**Purpose:** name the project, declare Node.js 24, list libraries, and define
commands such as `dev`, `build`, `start`, `test`, `typecheck`, and `evaluate`.

A dependency is a library the project uses. Examples: React for the interface,
Zod for validation, and the OpenAI SDK for API communication. Development tools
include TypeScript and the test runner.

The nearest Python comparison is a project configuration file containing package
requirements and task commands.

### 36. `package-lock.json` — exact dependency versions

**Purpose:** record the resolved library versions and their dependencies.

`npm ci` uses it to reproduce installation instead of picking new versions each
time. It also stores package integrity information used during installation.
It is generated by npm; do not hand-edit its many entries as ordinary app logic.

### 37. `tsconfig.json` — TypeScript checking settings

**Purpose:** configure how TypeScript checks and resolves this project's files.

Strict mode catches more mistakes. The `@/*` mapping provides the `src/` shortcut.
`noEmit` means the standalone typecheck reports problems without generating the
application's JavaScript output; Next.js handles the build.

These are tool settings, not runtime chat data.

### 38. `next.config.ts` — Next.js configuration

**Purpose:** configure framework behavior and response headers.

It removes the framework's powered-by header and adds headers that discourage
content-type guessing, avoid referrer disclosure, and prevent framing.
These controls address particular browser behaviors; they do not make the app
risk-free or replace authentication/rate limiting.

### 39. `vercel.json` — hosting instructions

**Purpose:** tell Vercel this is a Next.js project and use `npm ci` for installation
and `npm run build` for its production build.

It does not contain credentials, install the firewall rule, or itself publish a
website. Deployment still requires Vercel project/account configuration.

### 40. `.env.example` — configuration template

**Purpose:** list the server setting names with safe defaults and a blank API key.

A developer can use it as a template for an ignored local settings file, or enter
those names securely in hosting settings. An example file is not automatically
loaded as the actual secret configuration.

Never put a real key in this tracked template. Do not use a `NEXT_PUBLIC_` prefix
for secrets, because that prefix can expose values to browser code.

### 41. `.gitignore` — files Git should leave out

**Purpose:** exclude dependencies, build outputs, local environment files, and
machine-specific artifacts from new Git additions. `.env.example` is the explicit
exception to the environment-file exclusion.

Gitignore does not erase a secret already committed, encrypt files, or prevent
someone from deliberately force-adding an ignored file.

### 42. `.github/workflows/checks.yml` — checks on GitHub

**Purpose:** automatically run tests, type checking, and the build after a push or
pull request. This is continuous integration, usually shortened to CI.

GitHub starts a temporary machine, checks out the code, installs Node.js 24,
installs pinned dependencies, and runs the commands. The job needs no model key
and uses no inference quota. It has read-only repository permissions and a
10-minute timeout.

A successful run confirms those commands passed on that revision. It does not
prove deployed inference or all AI interpretations are correct.

## Step 9: Understand project documentation

### 43. `README.md` — the project's front door

Explains the problem, features, setup, deployment, provider configuration, privacy,
verification, evaluation, and file import. Read this first when opening the repo.
It guides users/developers; the app does not execute it.

### 44. `PROJECT_PLAN.md` — scope and decisions

Records the MVP boundaries, architecture, security goals, progress, and deferred
work. It explains why some features exist and others were postponed.

### 45. `PROVIDER_DECISION.md` — why Groq was chosen

Records provider research, free quotas, retention considerations, settings, and
links to official sources. External policies can change; this document is a
record of the decision, not a live query of provider limits.

### 46. `prompt.md` — AI-assisted development record

Records actual significant instructions, the tools/models used when known,
affected components, outcomes, debugging, and verification status. It documents
how coding assistance was used. It is separate from `model-prompt.ts`, the runtime
instruction sent to Groq when analyzing a chat.

### 47. `AGENTS.md` — instructions for coding assistants

Tells AI coding agents to read the documentation bundled with this installed
Next.js version before changing code. It addresses potentially unfamiliar
framework behavior. It does not define the chat-analysis model's behavior.

### 48. `docs/SECURITY.md` — security boundaries and firewall details

Explains the user-configured Vercel rate-limit rule, implemented protections,
verification status, and remaining risks. The firewall rule lives in Vercel's
settings, not in a source file in this repository. This document records it.

### 49. `docs/FILE_GUIDE.md` — this learning guide

Explains every tracked project file in beginner-friendly terms. It is documentation,
not part of the running website or model input.

## Step 10: Know which important files are not committed

You may see these locally after setup:

- `node_modules/`: downloaded libraries, installed by npm.
- `.next/`: generated development/build files, created by Next.js.
- `next-env.d.ts`: generated TypeScript declarations for Next.js.
- `.env.local`: optional actual local configuration, which must stay out of Git.
- `.git/`: Git's internal version-history data, not application source.

The repository should not include installed libraries, generated build output,
or actual keys. Likewise, temporary browser-check scripts used during development
were outside the repository; they are not additional committed application files.

## Step 11: Use this reading order when learning the code

Start with:

1. `parse-chat.ts`: the closest to familiar Python loops and lists.
2. `group-analysis.ts`: filtering and sorting.
3. `limits.ts` and `schemas.ts`: constants and validation rules.
4. `model-prompt.ts`: what the model is asked to do.
5. `route.ts` and `analyze-conversation.ts`: server workflow and external requests.
6. `conversation-input.tsx` and `analysis-results.tsx`: state and screen updates.
7. Relevant tests: examples of inputs, expected outputs, and failures.
8. Configuration files when you need to run or deploy the project.

You do not need to understand `package-lock.json` line by line to understand or
modify minread. Follow the flow of data and the small functions that change it.
