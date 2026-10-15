// Round 5, stream 3 (latency) for the agent loop (docs/design/round5/AGENT.md §1 "Latency"): the Teacher's speech streams
// to TTS clause by clause while the model is still writing, with every invariant the harness owns applied PER CLAUSE.
//   - HARD RULE: no audio before the turn's distress read (`before`) resolves clean; a distress verdict means nothing of
//     this reply is spoken (the safeguard path takes the turn).
//   - The floor filter (`gate`) runs on every clause BEFORE it reaches TTS. A blocked clause stops the speech there: what
//     was already said stays said, nothing after it is spoken, and the caller gets { stopped } to repair the turn.
//   - Clause k+1 is synthesised while clause k plays (`lookahead`), and audio leaves strictly in clause order.
// The agent (server/agent/**, 4A) owns the model call and the tools; this module owns only the timing of speech.
// Measured basis: taxila-fast replies p50 1379 ms to the WHOLE reply (n = 86) vs first token ~1.2 s and the first clause
// at about the same moment for short lines (evals/latency/agent-models.mjs): the win is every line longer than one clause,
// and the TTS of the first clause overlapping the rest of the generation.

/** A clause ends at a sentence end (. ! ? । followed by space or the end), or at a comma / dash once it has >= minWords. */
export function clauseSplitter({ minWords = 4, maxChars = 180 } = {}) {
  let buf = "";
  const cut = () => {
    const out = [];
    for (;;) {
      const m = /[.!?।]+["')\]]*(\s+|$)/.exec(buf);
      let at = m && (m.index + m[0].length < buf.length || /\s$/.test(m[0])) ? m.index + m[0].length : -1;
      if (at < 0) {
        const c = /[,;:—–]\s+/g; let mm, best = -1;
        while ((mm = c.exec(buf))) { if (buf.slice(0, mm.index).trim().split(/\s+/).length >= minWords) { best = mm.index + mm[0].length; break; } }
        at = best;
      }
      if (at < 0 && buf.length > maxChars) { const sp = buf.lastIndexOf(" ", maxChars); at = sp > 0 ? sp + 1 : maxChars; }
      if (at < 0) break;
      const piece = buf.slice(0, at).trim();
      buf = buf.slice(at);
      if (piece) out.push(piece);
    }
    return out;
  };
  return {
    /** @param {string} delta @returns {string[]} the clauses completed by this delta */
    push(delta) { buf += String(delta ?? ""); return cut(); },
    /** @returns {string[]} what is left at the end of the stream */
    flush() { const rest = buf.trim(); buf = ""; return rest ? [rest] : []; },
  };
}

/**
 * Speak a streamed reply. Never throws for a gate stop or a distress verdict; a synthesis error rejects (the caller's
 * fallback: the existing per-turn path).
 * @param {{
 *   deltas: AsyncIterable<string>,
 *   before?: Promise<{ ok: boolean, why?: string }>,
 *   gate?: (clause: string, spoken: string[]) => { ok: boolean, why?: string, clause?: string, skip?: boolean },  (clause: a rewrite to say instead; skip: drop this clause)
 *   synth: (clause: string, signal: AbortSignal) => AsyncIterable<Buffer|Uint8Array>,
 *   emit: (e: { type: "clause", i: number, text: string } | { type: "audio", i: number, chunk: Buffer|Uint8Array }) => void | Promise<void>,
 *   signal?: AbortSignal, lookahead?: number, now?: () => number, split?: ReturnType<typeof clauseSplitter>,
 * }} o
 * @returns {Promise<{ spoken: string[], text: string, stopped: null | { why: string, clause: string | null }, firstClauseMs: number | null, firstAudioMs: number | null }>}
 */
export async function speakStreamed(o) {
  const now = o.now ?? (() => performance.now());
  const t0 = now();
  const ctl = new AbortController();
  const onAbort = () => ctl.abort();
  o.signal?.addEventListener?.("abort", onAbort, { once: true });
  const split = o.split ?? clauseSplitter();
  const lookahead = Math.max(1, o.lookahead ?? 1);
  const spoken = [];
  let text = "", stopped = null, firstClauseMs = null, firstAudioMs = null;
  // the distress read gates the FIRST audio (never a clause's synthesis start: that costs nothing the child hears)
  const cleared = o.before ? Promise.resolve(o.before).then((v) => (v?.ok ? null : { why: v?.why ?? "distress" }), () => ({ why: "distress_read_failed" })) : Promise.resolve(null);

  /** a buffered synthesis job: starts now, its chunks are read in order later */
  const job = (clause) => {
    const chunks = []; let done = false, err = null, wake = null;
    (async () => {
      try { for await (const c of o.synth(clause, ctl.signal)) { chunks.push(c); wake?.(); } }
      catch (e) { if (!ctl.signal.aborted) err = e; }
      finally { done = true; wake?.(); }
    })();
    return {
      async *read() {
        let i = 0;
        for (;;) {
          if (i < chunks.length) { yield chunks[i++]; continue; }
          if (err) throw err;
          if (done) return;
          await new Promise((r) => { wake = r; });
          wake = null;
        }
      },
    };
  };

  const queue = []; // { clause, job } in order, at most `lookahead` + 1 ahead of what is playing
  let ended = false;
  let wakeProducer = null, wakeConsumer = null;
  ctl.signal.addEventListener("abort", () => { wakeProducer?.(); wakeConsumer?.(); }, { once: true });
  const producer = (async () => {
    try {
      const take = async (clause0) => {
        let clause = clause0;
        if (stopped || ctl.signal.aborted) return;
        const g = o.gate ? o.gate(clause, spoken) : { ok: true };
        if (!g?.ok) { text += (text ? " " : "") + clause; stopped = { why: g?.why ?? "floor", clause }; return; }
        // 4A: the gate may DROP a clause (praise on a wrong answer, the harness's own words, a promise of what is not up)
        if (g?.skip) return;
        // the gate may REWRITE a clause (4A: speakNotWrite turns "type it" into "say it"); the rewrite is what she says
        if (typeof g.clause === "string" && g.clause.trim()) clause = g.clause.trim();
        text += (text ? " " : "") + clause;
        if (firstClauseMs == null) firstClauseMs = Math.round(now() - t0);
        while (queue.length > lookahead && !stopped && !ctl.signal.aborted) await new Promise((r) => { wakeProducer = r; });
        queue.push({ clause, job: job(clause) });
        wakeConsumer?.();
      };
      for await (const d of o.deltas) {
        if (stopped || ctl.signal.aborted) break;
        for (const c of split.push(d)) await take(c);
      }
      if (!stopped && !ctl.signal.aborted) for (const c of split.flush()) await take(c);
    } finally { ended = true; wakeConsumer?.(); }
  })();

  let i = 0;
  try {
    const block = await cleared;
    if (block) { stopped = { why: block.why, clause: null }; ctl.abort(); }
    while (!ctl.signal.aborted) {
      if (!queue.length) { if (ended) break; await new Promise((r) => { wakeConsumer = r; }); wakeConsumer = null; continue; }
      const { clause, job: j } = queue.shift();
      wakeProducer?.();
      await o.emit({ type: "clause", i, text: clause });
      for await (const chunk of j.read()) {
        if (ctl.signal.aborted) break;
        if (firstAudioMs == null) firstAudioMs = Math.round(now() - t0);
        await o.emit({ type: "audio", i, chunk });
      }
      spoken.push(clause);
      i++;
    }
  } finally {
    if (stopped || o.signal?.aborted) ctl.abort();
    // a stopped reply does not wait for the model's stream to end (the caller aborts the model call with its own signal)
    if (!ctl.signal.aborted) await producer.catch(() => {}); else producer.catch(() => {});
    o.signal?.removeEventListener?.("abort", onAbort);
  }
  return { spoken, text, stopped, firstClauseMs, firstAudioMs };
}

/**
 * The agent's structured reply streamed as JSON with "say" FIRST (4A, server/agent/agent.js): the text of the "say" string
 * as it arrives, as deltas (JSON escapes decoded), ending at its closing quote. Feed it the raw JSON deltas; the rest of
 * the object (the actions) is the caller's once the whole JSON has come.
 * @param {AsyncIterable<string>} jsonDeltas @param {string} [key]
 * @returns {AsyncIterable<string>}
 */
export async function* sayDeltasOf(jsonDeltas, key = "say") {
  let buf = "", state = "seek", esc = false, uni = "";
  const opener = new RegExp(`"${key}"\\s*:\\s*"`);
  for await (const d of jsonDeltas) {
    buf += d;
    if (state === "seek") {
      const m = opener.exec(buf);
      if (!m) { if (buf.length > 4096) buf = buf.slice(-64); continue; }
      buf = buf.slice(m.index + m[0].length);
      state = "in";
    }
    if (state !== "in") continue;
    let out = "", i = 0;
    for (; i < buf.length; i++) {
      const c = buf[i];
      if (uni) { uni += c; if (uni.length === 5) { out += String.fromCharCode(parseInt(uni.slice(1), 16)); uni = ""; } continue; }
      if (esc) { esc = false; if (c === "u") { uni = "u"; continue; } out += ({ n: "\n", t: "\t", r: "", b: "", f: "" })[c] ?? c; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === '"') { state = "done"; break; }
      out += c;
    }
    buf = "";
    if (out) yield out;
    if (state === "done") return;
  }
}
