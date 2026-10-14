// board.show for the Teacher agent (AGENT.md §1 tools): her lines become a code-drawn whiteboard script, normalised by the
// shared whiteboard contract, so what the tool reports as mounted is exactly what the child sees (screen truth). Labels,
// numbers and short terms only (a board line is ≤ 24 characters, never narration: shared/whiteboard.js textProblem).
import { normalizeScript, textProblem, scriptFacts, LIMITS } from "../../shared/whiteboard.js";

const W = 400, H = 300;

/** Split a line into ≤ 24-character board lines at word boundaries. */
function wrap(line) {
  const out = [];
  let cur = "";
  for (const w of String(line ?? "").replace(/\s+/g, " ").trim().split(" ")) {
    if (!w) continue;
    const next = cur ? `${cur} ${w}` : w;
    if ([...next].length <= LIMITS.maxTextChars) cur = next;
    else { if (cur) out.push(cur); cur = [...w].slice(0, LIMITS.maxTextChars).join(""); }
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * → { ok, script, shown: string[], refused: string[] }. `lines` from the agent; at most `max` board lines are drawn, each
 * one that the contract refuses (markup, a link, a sentence) is reported as refused, never drawn.
 */
export function boardScript(lines, { lessonId, seq = 0, max = 6 } = {}) {
  const shown = [], refused = [];
  for (const l of (Array.isArray(lines) ? lines : []).flatMap(wrap)) {
    if (shown.length >= max) { refused.push(l); continue; }
    if (textProblem(l)) refused.push(l); else shown.push(l);
  }
  if (!shown.length) return { ok: false, script: null, shown, refused };
  const gap = Math.min(46, (H - 40) / shown.length);
  const top = Math.max(40, (H - gap * (shown.length - 1)) / 2);
  const ops = shown.map((t, i) => ({ id: `a${i}`, op: "text", at: [W / 2, Math.round(top + i * gap)], text: t, size: i === 0 && shown.length > 1 ? "m" : "m",
    ink: i === 0 ? "accent" : "chalk", startMs: 200 + i * 700, endMs: 800 + i * 700 }));
  const raw = { v: 1, board: { w: W, h: H, ground: "chalk" }, ops, scriptId: `${lessonId ?? "lesson"}:agent:${seq}`, mode: "fresh", anchor: "line_audio_start",
    line: { lessonId: lessonId ?? "" }, durationMs: 800 + shown.length * 700 };
  const n = normalizeScript(raw, { strict: false });
  if (!n.ok) return { ok: false, script: null, shown: [], refused: [...shown, ...refused] };
  const script = { ...n.script, scriptId: raw.scriptId, mode: "fresh", anchor: raw.anchor, line: raw.line };
  script.facts = scriptFacts(script, { kind: "diagram", archetype: "whiteboard" });
  return { ok: true, script, shown, refused };
}

/** The Studio slot the response carries for a board the agent drew (the client's tray shows it; say.js reads its texts). */
export const boardSlot = (script, seq) => ({ slotId: `agent-${seq}`, intentId: script.scriptId, state: "revealed", artifact: { kind: "whiteboard", stage: { w: script.board.w, h: script.board.h }, script } });
