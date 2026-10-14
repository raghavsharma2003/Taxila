#!/usr/bin/env node
// Round 5, stream 2 (the board): the owner's lesson a95d2ff1 replayed (the child's exact 15 turns, spoken lane, the chip as a
// chip; the release-11 export docs/design/round4/build/r12/rca/owner-lessons-2026-10-11.json) through a local server on the
// Neon TEST branch, then scored by predicate from what the server itself recorded (board_page, studio_mount, turn):
//   per request turn (2, 6 a game; 10 a photo; 22 the picture chip with aloo named; 24, 26 aloo; 28 an image):
//     answered   a game: an interactive piece mounted, or she says honestly no game is ready (no game claimed);
//                a picture of aloo: a page (or image) that names aloo, or an honest "no photo" with no pointing;
//                a photo with nothing named: a NEW page drawn for it
//   over the whole lesson:
//     table      pages that are the release-11 "Recursive rule | Explicit rule" table (owner: 7 of 10)
//     repeats    pages identical to the page before them (never, unless asked)
//     pointing   her lines that point at the screen/board while what was asked is not on it
// Her lines are model-written, so a replay shows the code's behaviour on the same child turns, not the same words (n = 1
// per run). Writes <out>/owner-replay.json and .md.
//   TAXILA_BASE=http://localhost:8097 TAXILA_DB=test NODE_USE_ENV_PROXY=1 node --env-file=.env.local tests/prod/r5-owner-replay.mjs --out <dir>
import fs from "node:fs";
import { join } from "node:path";
import { withTestAccount, freshChild, openLesson, arg, ROOT, ok, done } from "./_owner.mjs";

if (process.env.TAXILA_DB !== "test") { console.error("TAXILA_DB=test is required"); process.exit(2); }
const { q } = await import("../../server/db.js");
const EXPORT = JSON.parse(fs.readFileSync(join(ROOT, "docs/design/round4/build/r12/rca/owner-lessons-2026-10-11.json"), "utf8"));
const L0 = EXPORT["a95d2ff1-0d79-4d4c-8f32-dd255c2236e1"];
const OUT = arg("out", join(ROOT, "docs/design/round5/content/runs", `owner-${Date.now()}`));
const KIKO = { name: "Kiko", classLevel: 9, lang: "hinglish", interests: ["cricket"] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ALOO = /aloo|alu\b|potato|आलू/i;
const TABLE = /recursive rule|explicit rule/i;
const POINT = /\b(screen|board|whiteboard)\s*(?:par|pe|mein|me|ke|ki|on)\b|\bon the (?:screen|board)\b|(?:स्क्रीन|बोर्ड)\s*(?:पर|पे|में)/i;
const CANT = /\b(?:photo|picture|tasveer|image|chitra|फोटो|तस्वीर)\b[^.?!]{0,60}\b(?:nahi|nahin|can'?t|cannot|not)\b|\bno (?:photo|picture)\b/i;
const NO_GAME = /\b(?:game|khel)\b[^.?!]{0,60}\b(?:nahi|nahin|not ready|abhi nahi|ready nahi)\b|\bno game\b/i;
const textsOf = (script) => (script?.ops ?? []).flatMap((o) => (typeof o?.text === "string" ? [o.text] : Array.isArray(o?.rows) ? [o.rows.flat().join(" ")] : []));
const sig = (script) => JSON.stringify([...new Set(textsOf(script).map((t) => t.toLowerCase().trim()))].sort());
const REQ = { 2: "game", 6: "game", 10: "photo", 22: "aloo", 24: "aloo", 26: "aloo", 28: "aloo" };

await withTestAccount(async ({ api }) => {
  const child = await freshChild(api, KIKO);
  const L = await openLesson(api, child, { topicId: L0.lesson.topic_id, spoken: true, persona: KIKO });
  const rows = [];
  for (const t of L0.turns.filter((x) => x.speaker === "child")) {
    const chip = t.meta?.chipId ?? null;
    const at = new Date();
    const row = await L.turn(t.text, { raw: true, asr: t.asr_conf ?? 0.9, body: chip ? { chipId: chip, typed: true } : {} });
    const r = row.r ?? {};
    rows.push({ seq: t.seq, child: t.text, chip, at, reply: r.teacherReply ?? null, error: r.error?.message ?? null, move: r.move?.kind ?? null, request: r.move?.request ?? null,
      mounts: (r.moduleCommands ?? []).filter((c) => c.op === "mount").map((c) => String(c.engine ?? c.moduleId ?? "")), slot: r.ui?.studioSlot?.artifact?.kind ?? null });
    await sleep(4500);                    // the board for this turn lands (line plans are 2-5 s) before the next turn
    if (r.end || L.ended) break;
  }
  await sleep(6000);
  const pages = await q("select seq, intent_id, script, created_at from board_page where lesson_id = $1 order by seq", [L.lessonId]);
  const mounts = await q("select kind, revealed_at from studio_mount where lesson_id = $1 and revealed_at is not null order by revealed_at", [L.lessonId]);
  await L.end();
  // each page belongs to the last child turn sent before it was written
  for (const p of pages) { const owner = [...rows].reverse().find((x) => x.at <= new Date(p.created_at)); if (owner) (owner.pages ??= []).push(p); }
  let prev = null, repeats = 0, table = 0;
  for (const p of pages) { if (prev && sig(p.script) === sig(prev.script) && textsOf(p.script).length) repeats++; if (textsOf(p.script).some((x) => TABLE.test(x))) table++; prev = p; }
  const scored = rows.map((x) => {
    const kind = REQ[x.seq] ?? null;
    const pts = (x.pages ?? []).flatMap((p) => textsOf(p.script));
    const interactive = x.mounts.some((m) => m && !/^explainer@/.test(m)) || mounts.some((m) => m.kind !== "whiteboard" && new Date(m.revealed_at) >= x.at && (!rows[rows.indexOf(x) + 1] || new Date(m.revealed_at) < rows[rows.indexOf(x) + 1].at));
    const pointingBad = kind === "aloo" && POINT.test(x.reply ?? "") && !pts.some((t) => ALOO.test(t));
    let answered = null;
    // a game: a piece to play, or a game she runs in words (no screen claimed), or an honest "no game ready"
    if (kind === "game") answered = interactive || !POINT.test(x.reply ?? "") || NO_GAME.test(x.reply ?? "");
    if (kind === "photo") answered = (x.pages ?? []).length > 0 || CANT.test(x.reply ?? "");
    if (kind === "aloo") answered = pts.some((t) => ALOO.test(t)) || (CANT.test(x.reply ?? "") && !POINT.test(x.reply ?? ""));
    if (pointingBad) answered = false;
    return { ...x, kind, answered, pointingBad, pageTexts: pts.slice(0, 12), pages: (x.pages ?? []).length, interactive };
  });
  const asks = scored.filter((x) => x.kind);
  const report = { date: new Date().toISOString(), lessonReplayed: L.lessonId, method: "the owner's exact child turns of a95d2ff1 (spoken lane, chip as chip), local server on Neon TEST, real Azure models; scored from board_page / studio_mount / the response by predicate. n = 1 replay. Adult-run harness.",
    asks: { n: asks.length, answered: asks.filter((x) => x.answered).length }, pages: pages.length, tablePages: table, repeats, pointing: scored.filter((x) => x.pointingBad).length, errors: scored.filter((x) => x.error).length, rows: scored };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(join(OUT, "owner-replay.json"), JSON.stringify(report, null, 1));
  const cell = (v) => String(v ?? "").replace(/\|/g, "/").replace(/\s+/g, " ").slice(0, 200);
  fs.writeFileSync(join(OUT, "owner-replay.md"), [`# Owner replay a95d2ff1: ${report.asks.answered}/${report.asks.n} asks answered; ${pages.length} pages, ${table} table, ${repeats} repeats, ${report.pointing} bad pointing`, "",
    "| seq | child | ask | answered | she says now | board drawn for the turn |", "|---|---|---|---|---|---|",
    ...scored.map((x) => `| ${x.seq} | ${cell(x.chip ? `[chip] ${x.child}` : x.child)} | ${x.kind ?? ""} | ${x.kind ? (x.answered ? "yes" : "**no**") : ""} | ${cell(x.error ? `ERROR ${x.error}` : x.reply)} | ${cell(x.pageTexts.join(" · ") || (x.interactive ? "interactive piece" : "—"))} |`)].join("\n"));
  console.log(JSON.stringify({ ...report, rows: undefined }, null, 1));
  ok(!report.errors, "no HTTP errors");
}, { tag: "r5-owner" });
done();
