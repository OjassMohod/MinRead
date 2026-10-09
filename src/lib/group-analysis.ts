import type { AnalysisOutput } from "./schemas";

/** Section placement is deterministic; the model extracts facts, not UI ordering. */
export function groupAnalysis(analysis: AnalysisOutput, selectedUser: string) {
  const actions = analysis.findings.filter(f => f.kind === "task" && f.status === "open" && f.owner !== null);
  actions.sort((a, b) => Number(b.owner === selectedUser) - Number(a.owner === selectedUser));
  const decisions = analysis.findings.filter(f => f.kind === "decision" && f.status === "resolved");
  const openIssues = analysis.findings.filter(f => {
    if (f.status !== "open" && f.status !== "unclear") return false;
    return f.kind === "open_issue" || (f.kind === "task" && (f.owner === null || f.status === "unclear")) || f.kind === "decision";
  });
  return { actions, summary: analysis.summary, decisions, openIssues };
}
