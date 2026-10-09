import type { AnalysisOutput, Finding } from "./schemas";
import { groupAnalysis } from "./group-analysis";
export type FixtureLabel = {
  case_id: string;
  findings: { kind:string; owner:string|null; status:string; deadline_iso:string|null; source_ids:string[] }[];
  outstanding_user_task_indexes:number[];
  open_issue_indexes:number[];
  confirmed_decision_indexes:number[];
};
/** Contract checks only. Descriptions, faithfulness and relevance need human review. */
export function checkFixtureExpectations(output: AnalysisOutput, label: FixtureLabel, user: string) {
  const groups = groupAnalysis(output, user);
  const failures: string[] = [];
  const userTasks = groups.actions.filter(f=>f.owner===user);
  const expected = label.outstanding_user_task_indexes.map(i=>label.findings[i]);
  if (userTasks.length!==expected.length) failures.push(`Expected ${expected.length} user tasks, got ${userTasks.length}`);
  for (const task of expected) {
    const actual = userTasks.find(f=>task.source_ids.some(id=>f.sourceIds.includes(id)));
    if (!actual) { failures.push("Missing expected user task evidence"); continue; }
    if (task.deadline_iso ? !actual.deadlineIso || Date.parse(task.deadline_iso)!==Date.parse(actual.deadlineIso) : actual.deadlineIso!==null) failures.push("Current deadline mismatch or unsupported date");
    // Acknowledgements are optional citations; changed deadlines need both versions.
    const changed = label.findings.some(f=>f.kind==="change" && f.source_ids.some(id=>task.source_ids.includes(id)));
    const required = changed ? task.source_ids : task.source_ids.slice(0,1);
    if (required.some(id=>!actual.sourceIds.includes(id))) failures.push("Task omits expected assignment/correction/status evidence");
  }
  const checkSection = (name:string,actual:Finding[],indexes:number[]) => {
    if (actual.length!==indexes.length) failures.push(`${name}: expected ${indexes.length}, got ${actual.length}`);
    for (const i of indexes) if (!actual.some(f=>label.findings[i].source_ids.some(id=>f.sourceIds.includes(id)))) failures.push(`${name}: missing expected evidence`);
  };
  checkSection("Open issues",groups.openIssues,label.open_issue_indexes);
  checkSection("Confirmed decisions",groups.decisions,label.confirmed_decision_indexes);
  return failures;
}
