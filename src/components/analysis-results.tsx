"use client";

import type { AnalysisOutput, Finding } from "@/lib/schemas";
import { groupAnalysis } from "@/lib/group-analysis";

export function AnalysisResults({ analysis, selectedUser, onSources }: {
  analysis: AnalysisOutput; selectedUser: string; onSources: (ids: string[]) => void;
}) {
  const sections = groupAnalysis(analysis, selectedUser);
  function card(finding: Finding, index: number) {
    return <li key={index}><button type="button" className="result-card" onClick={() => onSources(finding.sourceIds)} aria-label={`Show source messages for ${finding.description}`}>
      <span className="result-title">{finding.description}</span>
      {finding.owner && <span>Owner: {finding.owner}{finding.owner === selectedUser ? " (you)" : ""}</span>}
      {finding.deadlineText && <span>Deadline: {finding.deadlineText}{finding.deadlineIso ? ` (${finding.deadlineIso})` : " — exact date/time unresolved"}</span>}
      {finding.ambiguity && <span className="result-uncertainty">Uncertainty: {finding.ambiguity}</span>}
      <span className="source-hint">View {finding.sourceIds.length} source {finding.sourceIds.length === 1 ? "message" : "messages"} ↗</span>
    </button></li>;
  }
  return <section className="panel analysis-results" aria-labelledby="results-title">
    <h2 id="results-title">Your catch-up</h2>
    <p className="muted">AI findings can be wrong. Select any item to check its source messages.</p>
    <section aria-labelledby="actions-title"><h3 id="actions-title">1. Deadlines &amp; Action Items</h3>
      {sections.actions.length ? <ul className="result-list">{sections.actions.map(card)}</ul> : <p>No assigned outstanding actions were identified.</p>}
    </section>
    <section aria-labelledby="summary-title"><h3 id="summary-title">2. Conversation Summary</h3>
      {sections.summary.length ? <ul className="result-list">{sections.summary.map((bullet, index) => <li key={index}><button type="button" className="result-card" onClick={() => onSources(bullet.sourceIds)} aria-label={`Show source messages for summary: ${bullet.text}`}><span>{bullet.text}</span><span className="source-hint">View {bullet.sourceIds.length} source {bullet.sourceIds.length === 1 ? "message" : "messages"} ↗</span></button></li>)}</ul> : <p>No summary items were identified.</p>}
    </section>
    <section aria-labelledby="decisions-title"><h3 id="decisions-title">3. Important Decisions</h3>
      {sections.decisions.length ? <ul className="result-list">{sections.decisions.map(card)}</ul> : <p>No confirmed decisions were identified.</p>}
    </section>
    <section aria-labelledby="issues-title"><h3 id="issues-title">4. Open Issues</h3>
      {sections.openIssues.length ? <ul className="result-list">{sections.openIssues.map(card)}</ul> : <p>No unresolved issues were identified.</p>}
    </section>
  </section>;
}
