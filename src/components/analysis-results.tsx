"use client";

import type { AnalysisOutput, Finding } from "@/lib/schemas";
import { groupAnalysis } from "@/lib/group-analysis";

function SourceHint({ count }: { count: number }) {
  return <span className="source-hint">View {count} source {count === 1 ? "message" : "messages"}<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17 17 7M7 7h10v10" /></svg></span>;
}

export function AnalysisResults({ analysis, selectedUser, onSources }: {
  analysis: AnalysisOutput; selectedUser: string; onSources: (ids: string[]) => void;
}) {
  const sections = groupAnalysis(analysis, selectedUser);
  function localDeadline(value: string) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
  function card(finding: Finding, index: number) {
    return <li key={index}><button type="button" className="result-card" onClick={() => onSources(finding.sourceIds)} aria-label={`Show source messages for ${finding.description}`}>
      <span className="result-title">{finding.description}</span>
      {finding.owner && <span className={finding.owner === selectedUser ? "owner-pill yours" : "owner-pill"}>Owner: {finding.owner}{finding.owner === selectedUser ? " (you)" : ""}</span>}
      {finding.deadlineText && <span className="deadline">Deadline: {finding.deadlineText}{finding.deadlineIso ? <span className="local-deadline">{localDeadline(finding.deadlineIso)} · your local time</span> : " — exact date/time unresolved"}</span>}
      {finding.ambiguity && <span className="result-uncertainty">Uncertainty: {finding.ambiguity}</span>}
      <SourceHint count={finding.sourceIds.length} />
    </button></li>;
  }
  return <section className="panel analysis-results" aria-labelledby="results-title">
    <div className="results-heading"><div><p className="eyebrow">FROM CONVERSATION TO CLARITY</p><h2 id="results-title">Your catch-up</h2></div><span className="badge">For {selectedUser}</span></div>
    <div className="result-counts" aria-label="Catch-up counts"><span><strong>{sections.actions.length}</strong> open {sections.actions.length === 1 ? "action" : "actions"}</span><span><strong>{sections.decisions.length}</strong> confirmed {sections.decisions.length === 1 ? "decision" : "decisions"}</span><span><strong>{sections.openIssues.length}</strong> open {sections.openIssues.length === 1 ? "issue" : "issues"}</span></div>
    <p className="muted">AI findings can be wrong. Select any item to check its source messages.</p>
    <section aria-labelledby="actions-title"><h3 id="actions-title">1. Deadlines &amp; Action Items</h3>
      {sections.actions.length ? <ul className="result-list">{sections.actions.map(card)}</ul> : <p>No assigned outstanding actions were identified.</p>}
    </section>
    <section aria-labelledby="summary-title"><h3 id="summary-title">2. Conversation Summary</h3>
      {sections.summary.length ? <ul className="result-list">{sections.summary.map((bullet, index) => <li key={index}><button type="button" className="result-card" onClick={() => onSources(bullet.sourceIds)} aria-label={`Show source messages for summary: ${bullet.text}`}><span>{bullet.text}</span><SourceHint count={bullet.sourceIds.length} /></button></li>)}</ul> : <p>No summary items were identified.</p>}
    </section>
    <section aria-labelledby="decisions-title"><h3 id="decisions-title">3. Important Decisions</h3>
      {sections.decisions.length ? <ul className="result-list">{sections.decisions.map(card)}</ul> : <p>No confirmed decisions were identified.</p>}
    </section>
    <section aria-labelledby="issues-title"><h3 id="issues-title">4. Open Issues</h3>
      {sections.openIssues.length ? <ul className="result-list">{sections.openIssues.map(card)}</ul> : <p>No unresolved issues were identified.</p>}
    </section>
  </section>;
}
