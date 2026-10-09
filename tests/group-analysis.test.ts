import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { groupAnalysis } from "../src/lib/group-analysis";
import { validateAnalysis } from "../src/lib/validate-analysis";
import type { AnalysisOutput, Finding } from "../src/lib/schemas";

const root = new URL("../datasets/synthetic/", import.meta.url);
const cases = JSON.parse(readFileSync(new URL("conversations.json", root), "utf8"));
const labels = JSON.parse(readFileSync(new URL("expected.json", root), "utf8"));
function findings(label: { findings: Record<string, unknown>[] }): Finding[] {
  return label.findings.map(f => ({ kind: f.kind, description: f.description, owner: f.owner, deadlineText: f.deadline_text, deadlineIso: f.deadline_iso, status: f.status, sourceIds: f.source_ids, ambiguity: f.ambiguity })) as Finding[];
}
test("development labels validate and place open issues and decisions in expected sections", () => {
  for (const fixture of cases.filter((c: { id: string }) => c.id.startsWith("dev-"))) {
    const label = labels.find((l: { case_id: string }) => l.case_id === fixture.id);
    const output = validateAnalysis({ summary: [], findings: findings(label) }, fixture.messages);
    const groups = groupAnalysis(output, fixture.selected_user);
    assert.deepEqual(groups.openIssues, label.open_issue_indexes.map((i: number) => output.findings[i]));
    assert.deepEqual(groups.decisions, label.confirmed_decision_indexes.map((i: number) => output.findings[i]));
  }
});
test("completion and later assignment leave only the currently assigned task", () => {
  const label = labels.find((l: { case_id: string }) => l.case_id === "dev-03");
  const grouped = groupAnalysis({ summary: [], findings: findings(label) }, "Asha");
  assert.equal(grouped.actions.length, 1);
  assert.equal(grouped.actions[0].owner, "Neha");
  assert.equal(grouped.openIssues.length, 0);
});
test("answered and resolved issues are omitted, while disputed decisions stay out of confirmed choices", () => {
  const base: Finding = { kind: "open_issue", description: "Which room?", owner: null, deadlineText: null, deadlineIso: null, status: "resolved", sourceIds: ["m001", "m002"], ambiguity: null };
  const output: AnalysisOutput = { summary: [], findings: [base, { ...base, kind: "decision", status: "unclear", description: "Conflicting venue choices" }, { ...base, kind: "decision", status: "open", description: "Pending choice" }] };
  const groups = groupAnalysis(output, "Asha");
  assert.equal(groups.decisions.length, 0);
  assert.equal(groups.openIssues.length, 2);
  assert.equal(groups.openIssues[0].description, "Conflicting venue choices");
});
