/** Opt-in real inference evaluation. Uses packaged synthetic inputs only. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { analysisResponseSchema, type ChatMessage } from "../src/lib/schemas";
import { parseChat } from "../src/lib/parse-chat";
import { validateAnalysis } from "../src/lib/validate-analysis";
import { groupAnalysis } from "../src/lib/group-analysis";
import { EXTRACTION_INSTRUCTIONS } from "../src/lib/model-prompt";
import { checkFixtureExpectations, type FixtureLabel } from "../src/lib/evaluation-checks";

async function main() {
  const endpoint = process.argv[2];
  if (!endpoint || !/^https?:\/\//.test(endpoint)) throw new Error("Usage: npm run evaluate -- https://your-app.example [output.json]");
  const target = new URL("/api/analyze", endpoint);
  const outputPath = process.argv[3] || "/tmp/minread-evaluation.json";
  const fixtures: { id:string; synthetic:boolean; raw_text:string; selected_user:string; timezone:string; messages:ChatMessage[] }[] = JSON.parse(readFileSync(new URL("../datasets/synthetic/conversations.json", import.meta.url), "utf8"));
  const requested = process.argv[4]?.split(",");
  if (requested?.some(id=>!fixtures.some(f=>f.id===id))) throw new Error("Unknown synthetic case.");
  const selected = requested ? fixtures.filter(f=>requested.includes(f.id)) : fixtures;
  const labels: FixtureLabel[] = JSON.parse(readFileSync(new URL("../datasets/synthetic/expected.json", import.meta.url), "utf8"));
  const results: Record<string, unknown>[] = [];
  const recent: { time: number; tokens: number }[] = [];
  // Serial calls, no automatic retries. Reserve 4,500 tokens for short chats and
  // 7,000 for the long fixture against 8,000 TPM. Wait in short intervals.
  for (const fixture of selected) {
    if (fixture.synthetic !== true) throw new Error("Evaluation accepts synthetic fixtures only.");
    const reservedTokens = fixture.messages.length > 50 ? 7_000 : 4_500;
    while (recent.filter(r => Date.now()-r.time < 65_000).reduce((n,r)=>n+r.tokens,0)+reservedTokens > 8_000) {
      await new Promise(resolve=>setTimeout(resolve,1_000));
    }
    const started = Date.now();
    const response = await fetch(target, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: fixture.raw_text, selectedUser: fixture.selected_user, timezone: fixture.timezone }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => null);
      results.push({ caseId: fixture.id, status: response.status, elapsedMs:Date.now()-started, passed: false, error: typeof failure?.error === "string" ? failure.error : "Analysis request failed; output not scored." });
      recent.push({ time: Date.now(), tokens: 7_000 });
    } else {
      const { analysis, usage } = analysisResponseSchema.parse(await response.json());
      validateAnalysis(analysis, parseChat(fixture.raw_text));
      const label = labels.find(l=>l.case_id===fixture.id)!;
      const failures = checkFixtureExpectations(analysis, label, fixture.selected_user);
      results.push({ caseId: fixture.id, passed: failures.length===0, failures, elapsedMs:Date.now()-started, usage, sections:groupAnalysis(analysis,fixture.selected_user), analysis });
      recent.push({ time: Date.now(), tokens: usage?.totalTokens ?? 7_000 });
    }
    writeFileSync(outputPath, JSON.stringify({
      generatedAt: new Date().toISOString(), model: "openai/gpt-oss-120b", promptSha256:createHash("sha256").update(EXTRACTION_INSTRUCTIONS).digest("hex"),
      scope:`${selected.length} synthetic fixtures; automated structural checks, not semantic accuracy scores`, results,
    }, null, 2)+"\n");
    const last = results.at(-1)!;
    console.log(JSON.stringify({caseId:last.caseId,passed:last.passed,failures:last.failures,usage:last.usage}));
  }
  console.log(`Completed ${results.length} cases. Report: ${outputPath}`);
  if (results.some(r=>!r.passed)) process.exitCode=1;
}
void main().catch(() => { console.error("Evaluation stopped. Check the endpoint and existing partial report; no automatic retry was made."); process.exitCode=1; });
