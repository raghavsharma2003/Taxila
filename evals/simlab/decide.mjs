// Decided-correctness child (main, 2026-10-15): the harness, not the child model, decides whether each answer to a posed kit
// item is right, from the card state and the item's kind (answer-model.json, seeded so a run is reproducible); the child model
// only writes that outcome in character, and a decided-wrong answer that says the key is re-drawn, then replaced.
// The child model never sees the item's id or kind; it sees the key only when the decided outcome is "right".
import { readFileSync } from "fs";
import { join } from "path";
import { ROOT } from "./lib.mjs";

export const ANSWER_MODEL = JSON.parse(readFileSync(join(ROOT, "evals/simlab/answer-model.json"), "utf8"));
export const childMode = () => (process.env.SIMLAB_CHILD_MODE === "decided" ? "decided" : "free");

const kits = new Map();
/** The kit item by id (c3-maths-ch03-t02-i01 → data/kits/c3-maths.json), or null. */
export function kitItem(itemId) {
  const m = String(itemId ?? "").match(/^c(\d+)-([a-z]+)-/);
  if (!m) return null;
  const f = join(ROOT, "data", "kits", `c${m[1]}-${m[2]}.json`);
  if (!kits.has(f)) { try { kits.set(f, JSON.parse(readFileSync(f, "utf8"))); } catch { kits.set(f, null); } }
  const kit = kits.get(f);
  for (const t of kit?.topics ?? []) { const it = t.items.find((i) => i.id === itemId); if (it) return { ...it, topic: t }; }
  return null;
}

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/(\d),(?=\d)/g, "$1").replace(/[^\p{L}\p{N}.]+/gu, " ").trim();
const words = (s) => new Set(norm(s).split(" ").filter((w) => w.length >= 3 || /^\d+$/.test(w)));

/** Does the posed card plausibly ask this item (the Director rewords items)? Shared words or every number of the item. */
export function asksItem(askText, item) {
  if (!askText || !item) return false;
  const a = words(askText);
  for (const pr of [item.prompt_en, item.prompt_hi]) {
    if (!pr) continue;
    const w = [...words(pr)];
    if (!w.length) continue;
    const nums = w.filter((x) => /^\d+$/.test(x));
    if (nums.length && nums.every((x) => a.has(x))) return true;
    if (w.filter((x) => a.has(x)).length / w.length >= 0.35) return true;
  }
  return false;
}

/** Does the child's answer say the item's key (or an accepted form)? */
// Hinglish connectives read as their English key words ("north aur south" is the key "north and south")
const CONNECT = (s) => s.replace(/\b(?:aur|or)\b/g, "and").replace(/\bya\b/g, "or");
// a long worked key ("… average speed = 120/3 = 40 km/h") ends in its answer: that last number counts as the key too
const finalNumber = (k) => { const ns = norm(k).match(/\d+(?:\.\d+)?/g); return ns && norm(k).split(" ").length > 3 ? ns[ns.length - 1] : null; };

export function saysKey(text, item) {
  const t = CONNECT(norm(text));
  if (!t || !item) return false;
  const tw = t.split(" ");
  const fin = finalNumber(item.answer);
  if (fin && tw.includes(fin)) return true; // decided-1 leak: "40 km/h" said against a long worked key
  // a one-token key ("70", "5n", "हाँ") matches a whole token, however short; a longer key matches as a whole-word phrase
  // (smoke r5-decided-smoke-rel142: "5n?" slipped through when short keys were skipped)
  for (const k of [item.answer, ...(item.acceptable ?? [])].filter((x) => x != null && String(x).trim())) {
    const nk = CONNECT(norm(k));
    if (!nk) continue;
    if (!nk.includes(" ")) { if (tw.includes(nk)) return true; continue; }
    if ((` ${t} `).includes(` ${nk} `)) return true;
  }
  return false;
}

// a small seeded generator (mulberry32 over a string hash): the same seed, card, turn and item give the same outcome
function rng(key) {
  let h = 1779033703 ^ key.length;
  for (let i = 0; i < key.length; i++) { h = Math.imul(h ^ key.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/**
 * The outcome of the child's answer to a posed item: { itemId, kind, depth, state, outcome: right|wrong|dont_know,
 * misconception?: {id, belief, signs} }. `state` is the card's state for the item's skill now (after logged learning).
 */
export function decide(p, state, held, item, n, seed = process.env.SIMLAB_SEED || "taxila") {
  const depth = ANSWER_MODEL.deepKinds.includes(item.kind) ? "deep" : "plain";
  const st = state[item.skillId] ?? "not";
  const r = rng(`${seed}|${p.id}|${n}|${item.id}`);
  const base = { itemId: item.id, skillId: item.skillId, kind: item.kind, depth, state: st };
  if (r() < ANSWER_MODEL.pCorrect[st][depth]) return { ...base, outcome: "right" };
  const heldMs = p.misconceptions.filter((m) => held.includes(m.id));
  const targeted = heldMs.find((m) => m.id === item.targetsMisconception);
  const pick = targeted && r() < ANSWER_MODEL.wrongShows["the item's targeted misconception, when the child holds it"] ? targeted
    : heldMs.length && r() < ANSWER_MODEL.wrongShows["another held misconception of the topic"] ? heldMs[Math.floor(r() * heldMs.length)] : null;
  if (pick) return { ...base, outcome: "wrong", misconception: { id: pick.id, belief: pick.belief, signs: pick.signs } };
  return { ...base, outcome: r() < ANSWER_MODEL.dontKnow[st] ? "dont_know" : "wrong" };
}

/** The instruction the child model gets for this answer (never the item's id or kind; the key only when it is right). */
export function decisionText(d, item) {
  const key = [item.answer, ...(item.acceptable ?? [])].filter(Boolean).slice(0, 3).join(" / ");
  if (d.outcome === "right") return `If the child now answers the question on the card, the answer comes out RIGHT this time: the right answer is "${key}". Say it the child's own way${d.state === "understood" ? ", with a short reason in a child's words" : ", without a real reason (the child half-knows it)"}.`;
  // the key is never shown for a wrong / don't-know outcome (it would prime it); the runner re-draws an answer that says it
  const dont = "Do not give the correct answer, and do not tap the button with the correct answer.";
  if (d.outcome === "dont_know") return `If the child now answers the question on the card, the child does NOT know it this time: pata nahi / a hesitant non-answer. ${dont}`;
  if (d.misconception) return `If the child now answers the question on the card, the answer comes out WRONG this time, showing the child's mistaken idea: ${d.misconception.belief} (it shows as: ${d.misconception.signs.join("; ")}). ${dont}`;
  return `If the child now answers the question on the card, the answer comes out WRONG this time: a plausible wrong answer a child of this age would give. ${dont}`;
}

export const DONT_KNOW_LINE = { hinglish: "pata nahi… mujhe nahi aata yeh", hindi: "पता नहीं… मुझे नहीं आता ये", english: "I don't know… I can't do this one" };
