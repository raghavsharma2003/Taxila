// Corpora for the safety-robust eval (2026-10-05). Everything is read from files checked into the repo; nothing from
// /tmp (the TaxilaFDB streams there are ephemeral). The 84 TaxilaFDB distress items are rebuilt from the render manifest
// exactly as the critic's world saw them: one item per (F10 scenario x test voice x condition), the rendered child WORDS
// per segment (world.mjs sttTimeline uses gold.childWords = the manifest's words), and stream id `${scenario}~${voice}~${cond}`
// so seed 0 is the critic's own sttReal draw (perturb.mjs applyConds: h32(`${id}|critic`) ^ 0x9e37).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sttReal } from "../duplex/critic/perturb.mjs";
import { ES3 } from "../signals/es3-adversarial.data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
export const h32 = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
const short = (v) => v.replace(/^hi-IN-|Neural$/g, "");
const DEV = /[ऀ-ॿ]/u;

/** One turn as timed segments of words: { id, segs: [[w, w, ...], ...], kind?, distressSeg? }. */
export function taxilaFdbDistress() {
  const man = rd("evals/duplex/taxilafdb/data/render-manifest.json");
  const scs = new Map(rd("evals/duplex/taxilafdb/data/scenarios.json").scenarios.map((s) => [s.id, s]));
  const out = [];
  for (const [scId, recs] of Object.entries(man.renders)) {
    const sc = scs.get(scId);
    if (!sc || sc.family !== "F10" || sc.gold?.distressSeg == null) continue;
    for (const rec of recs) {
      if (rec.split !== "test" || !rec.child?.ok) continue;
      const segs = [];
      for (const w of rec.child.words) (segs[w.seg] ??= []).push(w.w);
      for (const cond of ["clean", "noisy"]) out.push({ id: `${scId}~${short(rec.voice)}~${cond}`, segs: segs.map((s) => s ?? []), kind: sc.gold.distressKind, distressSeg: sc.gold.distressSeg, text: segs.map((s) => (s ?? []).join(" ")).join(" ") });
    }
  }
  return out;
}

/** TaxilaFDB child lesson segments that are NOT distress (every non-F10 scenario's child turn + the F10 benign rows). */
export function taxilaFdbLesson() {
  const out = [];
  for (const sc of rd("evals/duplex/taxilafdb/data/scenarios.json").scenarios) {
    if (sc.gold?.distressSeg != null) continue;
    const segs = (sc.child?.segs ?? []).map((s) => String(s.text ?? "").split(/\s+/).filter(Boolean));
    if (!segs.some((s) => s.length)) continue;
    out.push({ id: sc.id, segs, text: segs.map((s) => s.join(" ")).join(" ") });
  }
  return out;
}

const toSegs = (text) => [String(text).split(/\s+/).filter(Boolean)];

/** ES-3 category a: 20 distress texts x 4 contexts = 80 turns (ids a0..a79). */
export const es3Distress = () => ES3.filter((c) => c.cat === "a").map((c) => ({ id: c.id, segs: toSegs(c.text), text: c.text }));
/** ES-3 categories b-h (220 turns): sarcasm, quoting, provocation, feelings, injection, other voices, stammer. */
export const es3Other = () => ES3.filter((c) => c.cat !== "a").map((c) => ({ id: c.id, segs: toSegs(c.text), text: c.text, cat: c.cat }));

/** ES-1: 8,357 synthetic lesson turns (evals/signals/data/es1.jsonl). */
export function es1Turns() {
  const out = [];
  for (const line of fs.readFileSync(path.join(ROOT, "evals/signals/data/es1.jsonl"), "utf8").split("\n")) {
    if (!line.trim()) continue;
    const j = JSON.parse(line);
    j.turns.forEach((t, k) => out.push({ id: `${j.id}#${k}`, text: String(t.input?.childText ?? "") }));
  }
  return out;
}

/** Child turns of the owner-truth sessions and the conversation-v2 run (real production transcripts). */
export function transcriptChildTurns() {
  const out = [];
  const dirs = [["owner-truth", "evals/owner-truth/results/2026-10-04T18-30-08/sessions"], ["conversation-v2", "evals/conversation-v2/results/2026-10-04-run1/lessons"]];
  for (const [src, dir] of dirs) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter((x) => x.endsWith(".json")).sort()) {
      const d = JSON.parse(fs.readFileSync(path.join(abs, f), "utf8"));
      (d.turns ?? []).forEach((t, k) => { if (t.who === "child" && typeof t.childText === "string" && t.childText.trim()) out.push({ id: `${src}/${f}#${k}`, src, text: t.childText }); });
    }
  }
  return out;
}

/** The conversation-v2 offline distress items (cases.mjs, offline only: never sent to production). */
export async function conversationV2Distress() {
  const m = await import("../conversation-v2/cases.mjs").catch(() => null);
  const all = m ? (m.CASES ?? m.cases ?? m.default ?? []) : [];
  return (Array.isArray(all) ? all : []).filter((c) => c.intent === "distress" || c.tag === "distress" || c.kind === "distress").map((c, i) => ({ id: `cv2-d${i}`, text: c.text ?? c.childText ?? c.say }));
}

/**
 * The text a predicate sees for one turn after the critic's sttReal on the child's words (seed per item). Each segment's
 * final carries the transcriber's end punctuation (a danda for a Devanagari-dominant segment, a period otherwise): the
 * live finals all did (CRITIQUE §2 B1), and the shipped predicate's letter-boundary lookaheads treat "।" as a letter.
 * @returns {{ text: string, hallucinated: number[] }} hallucinated: segment indexes replaced by another script
 */
export function perturbedText(item, seed, { punct = true, opts } = {}) {
  const words = [];
  item.segs.forEach((ws, seg) => ws.forEach((w) => words.push({ w, seg, src: "child" })));
  const tl = sttReal({ words: words.map((x) => ({ ...x })), segs: [] }, seed, opts);
  const bySeg = new Map();
  for (const w of tl.words) { if (!bySeg.has(w.seg)) bySeg.set(w.seg, []); bySeg.get(w.seg).push(w.w); }
  const FOREIGN = /[^\p{Script=Devanagari}\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;
  const hallucinated = [];
  const parts = [];
  for (const [seg, ws] of [...bySeg.entries()].sort((a, b) => a[0] - b[0])) {
    if (ws.length === 1 && FOREIGN.test(ws[0]) && item.segs[seg].length >= 1 && !FOREIGN.test(item.segs[seg].join(" "))) hallucinated.push(seg);
    let s = ws.join(" ");
    if (punct && !/[।.?!]$/u.test(s)) s += DEV.test(s) ? "।" : ".";
    parts.push(s);
  }
  return { text: parts.join(" "), hallucinated };
}

/** Clean text with the same end punctuation a live final carries (the clean arm). */
export const cleanText = (item, { punct = true } = {}) => item.segs.map((ws) => { const s = ws.join(" "); return punct && s && !/[।.?!]$/u.test(s) ? s + (DEV.test(s) ? "।" : ".") : s; }).join(" ");

/** Seed k for an item: k = 0 is the critic's own draw (applyConds), k >= 1 fresh. */
export const seedOf = (id, k) => (k === 0 ? (h32(`${id}|critic`) ^ 0x9e37) >>> 0 : h32(`${id}|safety-robust|${k}`));
