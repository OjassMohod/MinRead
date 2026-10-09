# Live synthetic evaluation

Actual Groq requests were run against the production server using all 12 packaged
synthetic cases. [Recorded outputs](evaluation-results.json) preserve successful
analyses, failures, prompt hashes, token usage when returned, and recheck outcomes.
No expected labels were sent to the model. This is an evidence record, not a claim
of perfect extraction or a comprehensive semantic accuracy percentage.

## Baseline and fixes

The baseline returned 10 validated responses out of 12 requests. Nine cases met
the reviewed structural checks; one omitted an unresolved phone blocker. Two
requests (dev-02 and eval-04) returned sanitized 502 errors. Their exact underlying
cause was not established; later successful responses do not erase those failures.

Improvements:

- Strengthened complete Open Issues coverage: check important unanswered questions,
  unassigned tasks, and blockers separately, even if mentioned in the summary.
- Set extraction temperature to zero to reduce variation; it does not guarantee
  identical output or accuracy.
- Fixed overly strict scoring that demanded acknowledgement citations when an
  assignment alone supported the task. Changed deadlines still need both sources.
- Corrected dev-02's label: vendor quotes are still pending; a promise to deliver
  is not proof of receipt. This annotation change is explicitly recorded rather
  than silently changing model output or claiming an unchanged benchmark.

## Targeted final checks

- dev-02: corrected budget deadline and pending vendor-quote dependency were
  extracted; the output passes the reviewed contract checks.
- dev-06: all three issues were extracted (unassigned mobile check, unanswered
  screen-reader question, and broken phone), with the confirmed Node decision.
- eval-04: a later actual production-endpoint recheck passed the current task,
  deadline correction, and confirmed-decision checks on the long/noisy chat.

The full 12-case dataset was not rerun after the final prompt change. Targeted
rechecks cover the observed problem cases, not all regression risk. Previously
held-out cases have now been exercised; use new unseen cases for future evaluation.

## Verification beyond model extraction

23 automated tests cover input parsing, schema/source integrity, provider guards,
request handling, section grouping, and regression detection for stale deadlines,
reopened work, ambiguous dates, similar names, and missing blockers. TypeScript
checking and the production build pass locally. GitHub Actions runs these checks
without needing an API key; its hosted run status must be checked after pushing.

Browser checks verify synthetic-example loading without upload or fake output,
clear controls, mobile width, and friendly responses to HTML 429/503 failures.
Those error responses were explicit test-only fixtures, not live firewall tests.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run build
# Start the configured production server, then run real requests:
npm run evaluate -- https://your-app.vercel.app /tmp/evaluation.json
```

The evaluator serializes calls, reserves token headroom, and performs no automatic
retries. It saves only packaged synthetic inputs' outputs. It checks contracts,
not the semantic correctness of every summary sentence. Failed requests can still
use provider quota; missing usage metadata must not be treated as zero usage.
