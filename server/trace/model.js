// Release 12 flight recorder: `model.call`, from the ONE model-call wrapper (server/azure.js post() and chatStream()).
// Tier 1 (every account): kind, deployment, lane, status, ms, attempt, tokens, ttft, the prompt's id (its first system
// line, cut) and sha256, and the output text (fitted to 8 KB). Tier 2 (TAXILA_TRACE_FULL_FOR): the FULL request body and
// the raw response as one JSON blob in the "trace" container; the event carries data.blob = { ref, bytes, type } at once
// and the upload runs in the background (a failed upload is recorded as model.call.blob_failed). Never throws, never awaits.
import { createHash } from "node:crypto";
import { record } from "./writer.js";
import { traceCtx } from "./context.js";
import { putTraceBlob, traceBlobPath, traceBlobConfigured } from "./blob.js";

let blobSeq = 0;
const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/** The prompt messages of a request body (chat completions, responses, or a plain `messages` list). */
const promptOf = (body) => body?.messages ?? body?.input ?? null;
/** The first system/developer line, cut: a stable, readable prompt id. */
function promptId(msgs) {
  if (!Array.isArray(msgs)) return null;
  const sys = msgs.find((m) => m?.role === "system" || m?.role === "developer");
  const c = typeof sys?.content === "string" ? sys.content : Array.isArray(sys?.content) ? sys.content.map((x) => x?.text ?? "").join(" ") : "";
  return c ? c.replace(/\s+/g, " ").trim().slice(0, 80) : null;
}
/** The output text of a parsed response (chat completions or responses API). */
export function outputTextOf(out) {
  try {
    if (!out || typeof out !== "object") return null;
    if (typeof out.output_text === "string") return out.output_text;
    const c = out.choices?.[0]?.message?.content;
    if (typeof c === "string") return c;
    if (Array.isArray(out.output)) return out.output.flatMap((o) => (Array.isArray(o?.content) ? o.content : [])).map((x) => x?.text ?? "").join("");
    return null;
  } catch { return null; }
}

/**
 * @param {{ kind: string, deployment: string, lane?: string, quotaLane?: string, status: unknown, ms: number, attempt?: number,
 *   tokens?: object, ttftMs?: number|null, body?: object, out?: unknown, text?: string|null, error?: string }} m
 */
export function recordModelCall(m) {
  try {
    if (m.kind === "tts" || m.kind === "realtime_secret") return; // speech and key minting are not model calls (T-voice records TTS)
    const msgs = promptOf(m.body);
    const json = msgs ? JSON.stringify(msgs) : "";
    const text = m.text ?? outputTextOf(m.out);
    const data = { kind: m.kind, deployment: m.deployment, lane: m.quotaLane ?? m.lane ?? null, status: m.status, ms: m.ms,
      ...(m.attempt ? { attempt: m.attempt } : {}), ...(m.tokens ? { tokens: m.tokens } : {}), ...(m.ttftMs != null ? { ttftMs: m.ttftMs } : {}),
      promptId: promptId(msgs), promptSha: json ? sha(json) : null, promptMsgs: Array.isArray(msgs) ? msgs.length : null,
      output: text ?? null, ...(m.error ? { error: m.error } : {}), ...(Array.isArray(m.filterCats) ? { filterCats: m.filterCats } : {}) };
    const c = traceCtx();
    if ((c?.tier ?? 1) >= 2 && traceBlobConfigured() && m.body) {
      const path = traceBlobPath({ sid: c?.sid ?? "server", src: "server", seq: `${Date.now()}${++blobSeq}`, ext: "json" });
      const payload = JSON.stringify({ request: m.body, response: m.out ?? (text != null ? { text } : null) });
      data.blob = { ref: path, bytes: Buffer.byteLength(payload), type: "application/json" };
      putTraceBlob(path, payload, "application/json").catch((e) => record("model.call.blob_failed", { ref: path, error: String(e?.message ?? e).slice(0, 160) }));
    }
    record("model.call", data);
  } catch { /* the recorder never breaks a model call */ }
}
