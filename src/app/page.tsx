import { ConversationInput } from "@/components/conversation-input";
import { connection } from "next/server";
import { getProviderConfig } from "@/lib/server/model-config";

export default async function Home() {
  // Provider disclosure follows runtime settings, not a stale build-time value.
  await connection();
  let providerName = "the configured cloud provider";
  try { providerName = getProviderConfig().label; } catch { /* API reports a safe configuration error. */ }
  return <main>
    <header><a className="brand" href="/" aria-label="minread home">minread<span>.</span></a><span className="badge">Every insight has a source</span></header>
    <section className="intro"><p className="eyebrow">LESS SCROLLING. MORE CLARITY.</p><h1>What did you miss?</h1><p>Turn a busy conversation into a clear next step—with the messages to back it up.</p><ol className="steps" aria-label="How minread works"><li><span>01</span> Paste your chat</li><li><span>02</span> Get your catch-up</li><li><span>03</span> Check the sources</li></ol></section>
    <ConversationInput providerName={providerName} />
    <footer>AI findings can be wrong. Check supporting messages before acting. Use synthetic or non-sensitive chats for testing.</footer>
  </main>;
}
