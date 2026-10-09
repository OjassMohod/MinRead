"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { parseChat } from "@/lib/parse-chat";
import { MAX_CHAT_CHARACTERS } from "@/lib/limits";
import { analysisResponseSchema, analysisRequestSchema, type AnalysisOutput, type ChatMessage } from "@/lib/schemas";
import { AnalysisResults } from "./analysis-results";
import { DEMO_CHAT, DEMO_USER } from "@/lib/demo-chat";
import { readChatFile } from "@/lib/import-chat";

export function ConversationInput({ providerName }: { providerName: string }) {
  const [rawText, setRawText] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const evidence = useRef<HTMLElement | null>(null);
  const sourceTrigger = useRef<HTMLElement | null>(null);
  const pending = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useEffect(() => () => { pending.current?.abort(); }, []);
  useEffect(() => {
    if (analysis) document.getElementById("results-title")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }, [analysis]);

  function input() {
    return analysisRequestSchema.parse({ rawText, selectedUser, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  }
  function invalidate() {
    revision.current++; pending.current?.abort(); pending.current = null;
    setBusy(false); setMessages([]); setAnalysis(null); setError(""); setActiveSources([]);
    setImporting(false); setImportNotice("");
  }
  function preview() {
    invalidate();
    try {
      setMessages(parseChat(input().rawText));
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== "ZodError" ? failure.message : "Enter your name and a non-empty conversation within the size limit.");
    }
  }
  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); invalidate();
    const currentRevision = revision.current;
    try {
      const request = input();
      setMessages(parseChat(request.rawText));
      const controller = new AbortController(); pending.current = controller;
      setBusy(true);
      const response = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request), signal: controller.signal, cache: "no-store",
      });
      if (response.status === 429) throw new Error("Too many analyses. Please wait a minute before trying again.");
      if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Analysis is unavailable. Please try again later.");
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Analysis failed. Please retry.");
      const validated = analysisResponseSchema.parse(payload);
      if (currentRevision === revision.current) setAnalysis(validated.analysis);
    } catch (failure) {
      if (currentRevision !== revision.current) return;
      if (failure instanceof Error && failure.name === "AbortError") return;
      setError(failure instanceof Error && failure.name !== "ZodError" ? failure.message : "Unable to analyze this input. Check the name, format, and size limit.");
    } finally {
      if (currentRevision === revision.current) { setBusy(false); pending.current = null; }
    }
  }
  function clear() { invalidate(); setRawText(""); setSelectedUser(""); }
  function loadExample() {
    invalidate(); setRawText(DEMO_CHAT); setSelectedUser(DEMO_USER);
    setMessages(parseChat(DEMO_CHAT));
  }
  async function importFile(file: File) {
    invalidate();
    const currentRevision = revision.current;
    setImporting(true);
    try {
      const imported = await readChatFile(file);
      if (currentRevision !== revision.current) return;
      setRawText(imported.rawText); setMessages(imported.messages);
      setImportNotice("Imported locally. Review the messages and enter your name before Analyze.");
    } catch (failure) {
      if (currentRevision === revision.current) setError(failure instanceof Error ? failure.message : "Unable to import this file.");
    } finally {
      if (currentRevision === revision.current) setImporting(false);
    }
  }
  function showSources(ids: string[]) {
    sourceTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActiveSources([...new Set(ids)]);
  }
  function closeSources() {
    setActiveSources([]);
    sourceTrigger.current?.focus();
  }
  useEffect(() => {
    if (!activeSources.length) return;
    evidence.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    evidence.current?.focus({ preventScroll: true });
  }, [activeSources]);
  function messageList(items: ChatMessage[], original = false) {
    return <ol className="messages">{items.map(message => <li id={original ? `message-${message.id}` : undefined} tabIndex={-1} className={activeSources.includes(message.id) ? "highlighted" : undefined} key={message.id}><div className="message-heading"><strong>{message.sender}</strong><span>{message.id}</span></div>{message.timestamp && <time dateTime={message.timestamp}>{message.timestamp}</time>}<p>{message.text}</p></li>)}</ol>;
  }

  return <div className="workspace">
    <section className="panel">
      <h2>Your conversation</h2><p className="muted">Paste messages in <code>Name: message</code> format.</p>
      <div className="example"><div className="actions"><button type="button" className="secondary" onClick={loadExample} disabled={busy || importing}>{rawText ? "Replace with synthetic example" : "Try a synthetic example"}</button><button type="button" className="secondary" onClick={() => fileInput.current?.click()} disabled={busy || importing}>{importing ? "Importing…" : "Import .txt"}</button></div><input ref={fileInput} type="file" accept=".txt,text/plain" aria-label="Import chat text file" hidden disabled={busy || importing} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void importFile(file); }} /><p className="muted">Examples and imports load locally. Use .txt with Name: message lines; click Analyze to send text to AI.</p>{importNotice && <p role="status">{importNotice}</p>}</div>
      <form onSubmit={analyze} aria-busy={busy}>
        <label htmlFor="user">Your name or handle</label>
        <input id="user" value={selectedUser} onChange={event => { invalidate(); setSelectedUser(event.target.value); }} disabled={busy || importing} maxLength={80} placeholder="Exactly as it appears in the chat" required />
        <label htmlFor="chat">Chat messages</label>
        <textarea id="chat" value={rawText} onChange={event => { invalidate(); setRawText(event.target.value); }} disabled={busy || importing} maxLength={MAX_CHAT_CHARACTERS} rows={6} placeholder="Paste your conversation here…" aria-describedby="format count privacy" required />
        <div className="input-meta"><span id="format">Optional: [ISO timestamp] Name: message</span><span id="count">{rawText.length.toLocaleString()} / 20,000</span></div>
        <p id="privacy" className="notice">Analyze sends your conversation through our server to {providerName}. Avoid sensitive information. We do not save chats; provider and hosting retention policies still apply. Preview stays on your device.</p>
        <div className="actions"><button type="submit" disabled={busy || importing}>{busy ? "Analyzing…" : "Analyze conversation"}</button><button type="button" className="secondary" onClick={preview} disabled={busy || importing}>Preview messages</button><button type="button" className="secondary" onClick={clear}>Clear</button></div>
        {busy && <p role="status">Analyzing your conversation. Clear cancels waiting; an already-sent provider request may continue.</p>}
        {error && <p role="alert" className="error">{error}</p>}
      </form>
    </section>
    <section className="panel" aria-labelledby="preview-title">
      <h2 id="preview-title">Conversation preview</h2>
      <p role="status" className="muted">{messages.length ? `${messages.length} messages parsed. These are original messages, not AI results.` : "Preview messages locally, or Analyze to generate a catch-up with supporting sources."}</p>
      {messageList(messages, true)}
    </section>
    {analysis && <AnalysisResults analysis={analysis} selectedUser={selectedUser.trim()} onSources={showSources} />}
    {activeSources.length > 0 && <section ref={evidence} tabIndex={-1} className="panel evidence-panel" aria-labelledby="evidence-title" onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closeSources(); } }}><h2 id="evidence-title">Source messages</h2><p className="muted">Original messages in conversation order. Verify that they support the selected finding.</p>{messageList(messages.filter(message => activeSources.includes(message.id)))}<button type="button" className="secondary" onClick={closeSources}>Close sources</button></section>}
  </div>;
}
