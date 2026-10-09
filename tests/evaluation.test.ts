import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkFixtureExpectations, type FixtureLabel } from "../src/lib/evaluation-checks";
import type { AnalysisOutput, Finding } from "../src/lib/schemas";

const labels = JSON.parse(readFileSync(new URL("../datasets/synthetic/expected.json", import.meta.url), "utf8"));
function sample(id:string): { label:FixtureLabel; output:AnalysisOutput } {
  const label = labels.find((l:FixtureLabel)=>l.case_id===id);
  const findings = label.findings.map((f:Record<string,unknown>)=>({ kind:f.kind, description:f.description, owner:f.owner, deadlineText:f.deadline_text, deadlineIso:f.deadline_iso, status:f.status, sourceIds:f.source_ids, ambiguity:f.ambiguity })) as Finding[];
  return { label, output:{ summary:[], findings } };
}
test("evaluation catches a stale deadline and missing correction evidence", () => {
  const {label,output}=sample("dev-02");
  assert.deepEqual(checkFixtureExpectations(output,label,"Asha"),[]);
  output.findings[0].deadlineIso="2026-10-09T17:00:00+05:30";
  output.findings[0].sourceIds=["m001"];
  const failures=checkFixtureExpectations(output,label,"Asha");
  assert.ok(failures.some(f=>f.includes("deadline mismatch")));
  assert.ok(failures.some(f=>f.includes("correction/status evidence")));
});
test("evaluation catches completed and cancelled work incorrectly reopened", () => {
  for (const id of ["dev-03","dev-04"]) {
    const {label,output}=sample(id);
    assert.deepEqual(checkFixtureExpectations(output,label,"Asha"),[]);
    // Simulate an erroneous outstanding assignment after completion/cancellation.
    output.findings[0].kind="task";
    output.findings[0].owner="Asha";
    output.findings[0].status="open";
    assert.ok(checkFixtureExpectations(output,label,"Asha").some(f=>f.includes("user tasks")));
  }
});
test("evaluation rejects an invented calendar date for undated tomorrow", () => {
  const {label,output}=sample("dev-08");
  assert.deepEqual(checkFixtureExpectations(output,label,"Asha"),[]);
  output.findings[0].deadlineIso="2026-10-10T17:00:00+05:30";
  assert.ok(checkFixtureExpectations(output,label,"Asha").some(f=>f.includes("unsupported date")));
});
test("evaluation detects a task transferred from a similarly named participant", () => {
  const {label,output}=sample("eval-01");
  assert.deepEqual(checkFixtureExpectations(output,label,"Asha"),[]);
  output.findings[0].owner="Asha";
  assert.ok(checkFixtureExpectations(output,label,"Asha").some(f=>f.includes("user tasks")));
});
test("evaluation detects a blocker missing from open issues", () => {
  const {label,output}=sample("dev-06");
  assert.deepEqual(checkFixtureExpectations(output,label,"Asha"),[]);
  output.findings=output.findings.filter(f=>!f.sourceIds.includes("m008"));
  assert.ok(checkFixtureExpectations(output,label,"Asha").some(f=>f.includes("Open issues")));
});
test("single assignment citations are valid without redundant acknowledgement citations", () => {
  const {label,output}=sample("eval-01");
  for (const f of output.findings) f.sourceIds=f.sourceIds.slice(0,1);
  assert.deepEqual(checkFixtureExpectations(output,label,"Asha"),[]);
});
