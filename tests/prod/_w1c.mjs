// Shared steps for the W1-C production acceptance files (tests/prod/w1c-*.mjs). The leading underscore keeps it out of
// run.mjs's file pattern. A scripted child answers from the REPO's kits (the item on the table is named by ui.ask.itemId,
// as the client sees it), so the scripts need no debug payload and run the same on a local server and on production.
import { readFileSync, readdirSync } from "fs";

const KITS = new URL("../../data/kits/", import.meta.url);
let byItem = null, byTopic = null;
function index() {
  if (byItem) return;
  byItem = new Map(); byTopic = new Map();
  for (const f of readdirSync(KITS).filter((n) => n.endsWith(".json"))) {
    const k = JSON.parse(readFileSync(new URL(f, KITS), "utf8"));
    for (const t of k.topics ?? []) {
      byTopic.set(t.topicId, t);
      for (const it of t.items ?? []) byItem.set(it.id, { ...it, topicId: t.topicId });
      for (const m of t.misconceptions ?? []) {
        const right = m.diagnostic?.options?.find((o) => o.correct);
        const wrong = m.diagnostic?.options?.find((o) => o.misconceptionId === m.id) ?? m.diagnostic?.options?.find((o) => !o.correct);
        if (right) byItem.set(`diag:${m.id}`, { id: `diag:${m.id}`, kind: "contrast", answer: right.text, wrong: wrong?.text, topicId: t.topicId, misconceptionId: m.id });
      }
    }
  }
}
/** The kit item a ui.ask.itemId names (diag:<misconception> included), or null. */
export function kitItem(itemId) { index(); return byItem.get(itemId) ?? null; }
/** The kit topic, or null. */
export function kitTopic(topicId) { index(); return byTopic.get(topicId) ?? null; }
/** The topic an item id belongs to (`c5-maths-ch01-t01-i03` → `c5-maths-ch01-t01`). */
export const topicOfItem = (itemId) => kitItem(itemId)?.topicId ?? String(itemId ?? "").replace(/^diag:/, "").replace(/-(i\d+|m-.*)$/, "");

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One child reply to the turn on the table, as a child who knows (or, with `wrong`, holds the misconception):
 * a chip matching the answer, the kit answer typed, the topic's key idea for an open "why" question, or "go on".
 */
export function replyFor(ui, topicId, { wrong = false, explain = true } = {}) {
  const item = ui?.ask?.itemId ? kitItem(ui.ask.itemId) : null;
  // a child who does the items but cannot say why (the state after a typical first lesson: shallow)
  const SHRUG = "pata nahi, bas aise hi aata hai";
  if (!explain && (!item || item.kind === "why" || item.kind === "teachback") && (ui?.ask?.text || item)) return { text: SHRUG };
  const want = item ? (wrong ? item.wrong ?? "pata nahi" : item.answer) : null;
  if (ui?.chips?.length) {
    const match = want && ui.chips.find((c) => norm(c.label) === norm(want) || norm(c.label).includes(norm(want)) || norm(want).includes(norm(c.label)));
    if (match) return { chip: match };
    if (!item) return { chip: ui.chips[0] };
  }
  if (item) return { text: wrong && !item.wrong ? "mujhe lagta hai pata nahi" : String(want) };
  if (ui?.ask?.text) {
    const t = kitTopic(topicId);
    return { text: wrong ? "pata nahi, bas aise hi" : `Kyunki ${String(t?.expectations?.[0] ?? "yeh aise hi kaam karta hai").replace(/\.$/, "")}.` };
  }
  return { text: "haan, theek hai, aage batao" };
}

/**
 * Drive a text lesson: start (optionally on a topic), answer every turn with replyFor, wait `delayMs` before each
 * reply (the child "thinking"), stop at `maxTurns` or the lesson's end, then end it. Returns what a test needs.
 */
export async function driveLesson(api, childId, { topicId, maxTurns = 14, delayMs = 0, wrong = () => false, explain = true, end = true } = {}) {
  const start = await api("POST", "/api/lesson/start", { childId, mode: "text", ...(topicId ? { topicId } : {}) });
  const lessonId = start.lessonId;
  const asked = [];
  const turns = [];
  let ui = start.ui, seq = 0;
  if (ui?.ask?.itemId) asked.push(ui.ask.itemId);
  for (let i = 0; i < maxTurns; i++) {
    const rep = replyFor(ui, start.topic?.id ?? topicId, { wrong: wrong(i, ui), explain });
    if (delayMs) await sleep(delayMs);
    const body = rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text };
    const r = await api("POST", "/api/lesson/turn", { lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, ...body });
    turns.push({ sent: body.childText, move: r.move?.kind, verdict: r.ui?.verdict ?? null, itemId: r.ui?.ask?.itemId ?? null });
    ui = r.ui;
    if (ui?.ask?.itemId) asked.push(ui.ask.itemId);
    if (r.end) break;
  }
  const ended = end ? await api("POST", "/api/lesson/end", { lessonId }) : null;
  return { start, lessonId, turns, asked, end: ended };
}

/** A database client for the target (TAXILA_DB_URL), or null: reads the test account's own rows before it is deleted. */
export async function targetDb() {
  const url = process.env.TAXILA_DB_URL;
  if (!url) return null;
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  return (text, params = []) => sql.query(text, params);
}

/** Set (or advance) this account's test clock; waits out the cross-replica refresh. */
export async function advanceClock(api, days) {
  const r = await api("POST", "/api/test/clock", { advanceDays: days });
  await sleep(r.settleMs ?? 1500);
  return r;
}

/** The parent "how we know" card's first row for a skill (null when the card is withheld). PIN must be set. */
export async function cardRow(api, childId, skillId) {
  const e = await api("GET", `/api/parent/evidence?childId=${encodeURIComponent(childId)}&skill=${encodeURIComponent(skillId)}`);
  return { row: e.comprehension?.rows?.[0] ?? null, card: e.comprehension ?? null };
}
