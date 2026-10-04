// Production launcher for the draft manager (drafts.js): one streamed reply call per draft, cancellable by its own
// AbortController. Azure bills the prompt and the tokens generated before the abort; the billed estimate on abort is the
// prompt tokens (from the last usage seen, else chars/4) plus the streamed characters / 4. The clock is performance.now().
// Server only (imports server/azure.js).
import { chatStream, DEPLOY } from "../azure.js";

/**
 * @param {{ deployment?: string, messagesFor: (job:object) => {role:string, content:string}[], maxTokens?: number, effort?: string }} o
 * @returns {(job:object, now:number) => object}
 */
export function azureLauncher(o) {
  const deployment = o.deployment || DEPLOY.reply;
  return (job) => {
    const ctl = new AbortController();
    const messages = o.messagesFor(job);
    const promptChars = messages.reduce((a, m) => a + String(m.content).length, 0);
    const h = { startedAt: performance.now(), text: "", usage: undefined, readyAt: undefined, ttftMs: undefined, error: undefined };
    h.promise = chatStream(deployment, messages, { maxTokens: o.maxTokens ?? 200, effort: o.effort ?? "none", signal: ctl.signal, quotaLane: "live",
      kind: "duplex_draft", onDelta: (_d, full) => { if (h.ttftMs === undefined) h.ttftMs = performance.now() - h.startedAt; h.text = full; } })
      .then((r) => {
        h.text = r.text ?? h.text;
        const u = r.usage || {};
        h.usage = { in: u.prompt_tokens ?? u.in ?? Math.round(promptChars / 4), out: u.completion_tokens ?? u.out ?? Math.round(h.text.length / 4) };
        h.readyAt = performance.now();
        return h;
      })
      .catch((e) => { h.error = String(e?.message || e).slice(0, 200); return h; });
    h.abort = () => {
      ctl.abort();
      return { in: Math.round(promptChars / 4), out: Math.round(h.text.length / 4) };
    };
    return h;
  };
}
