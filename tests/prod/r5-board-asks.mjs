#!/usr/bin/env node
// Round 5, stream 2 (the board): does the board draw what the child asked for? A 40-ask battery across classes 1-9 and
// subjects, run against a real server (local, on the Neon TEST branch) with real Azure model calls. Each case opens a
// lesson on its topic as a fresh child on the spoken lane, answers the opening once ("haan"), then makes ONE visual ask
// the way children asked in the owner's lessons ("aloo dikhao", "photo dikhao", "isko draw karo", "number line pe
// dikhao", "ek example do", "game khelna hai"). What the ask produced is read from the response AND from the server's
// own record of what was drawn (board_page, studio_mount on TEST, polled for late boards), then scored by PREDICATE, never
// by a model's opinion (a model never grades):
//   subject   the board's texts (or the image's subject/alt) name the thing asked for: one of the case's words, in
//             English, Hinglish or Devanagari
//   numline   a number line is drawn (numwork layout number_line) or a number-line engine is mounted
//   shape     the shape asked for is drawn (polygon with N corners, circle, sectors/equal parts)
//   example   a NEW page with worked numbers or terms (not the page that was already up)
//   game      an interactive piece is mounted (an engine that takes input, or a Stagecraft/play piece), or (owner decision
//             14.2) none is and her line honestly announces no game and points at nothing (counted apart: got.honest)
//   picture   a real image of the subject, else a board that draws the subject, else an honest "can't show a photo"
//             with no pointing at the screen
// and, for every case, three failures whatever the kind:
//   repeat    the page drawn for the ask has the same texts as the page that was up before it
//   overlay   the page drawn for the ask is a "continue" page over the previous one
//   pointing  her line sends the child's eyes to the screen/board while nothing on it shows the subject asked for
// The bar (round 5 brief): >= 9/10 of the asks pass. Writes <out>/board-asks.json and board-asks.md.
//
//   TAXILA_BASE=http://localhost:8097 TAXILA_DB=test NODE_USE_ENV_PROXY=1 node --env-file=.env.local tests/prod/r5-board-asks.mjs \
//     --out docs/design/round5/content/runs/<name> [--only id,id] [--par 4] [--wait 9000]
import fs from "node:fs";
import { join } from "node:path";
import { withTestAccount, freshChild, openLesson, arg, ROOT, ok, done } from "./_owner.mjs";
import { announcesGame } from "../../server/studio/request.js";

if (process.env.TAXILA_DB !== "test") { console.error("TAXILA_DB=test is required: the battery reads board_page from the TEST branch only"); process.exit(2); }
const { q } = await import("../../server/db.js");
const OUT = arg("out", join(ROOT, "docs/design/round5/content/runs", `run-${Date.now()}`));
const ONLY = arg("only", null)?.split(",") ?? null;
const PAR = Number(arg("par", 4)) || 4;
const WAIT = Number(arg("wait", 9000)) || 9000;

// ─────────────────────────── the asks ───────────────────────────
// id, class, topic, the ask as heard (ASR form), the kind, the words that name the subject (any one counts)
const W = (...xs) => xs;
export const CASES = [
  { id: "c1-numline", cls: 1, topic: "c1-maths-ch03-t01", ask: "number line pe dikhao 1 se 9 tak", kind: "numline", nums: ["1", "9"] },
  { id: "c1-shapes", cls: 1, topic: "c1-maths-ch01-t03", ask: "circle aur triangle draw karke dikhao", kind: "shape", shape: ["circle", 3], words: W("circle", "gola", "triangle", "tribhuj", "गोल", "त्रिभुज") },
  { id: "c1-example", cls: 1, topic: "c1-maths-ch12-t02", ask: "ek example do", kind: "example" },
  { id: "c1-mango", cls: 1, topic: "c1-maths-ch03-t01", ask: "aam dikhao", kind: "picture", words: W("aam", "mango", "आम") },
  { id: "c2-triangle", cls: 2, topic: "c2-maths-ch04-t02", ask: "triangle draw karo", kind: "shape", shape: [3], words: W("triangle", "tribhuj", "त्रिभुज") },
  { id: "c2-coin-photo", cls: 2, topic: "c2-maths-ch10-t01", ask: "sikke ki photo dikhao", kind: "picture", words: W("coin", "sikka", "sikke", "₹", "rupee", "rupaya", "सिक्का", "सिक्के") },
  { id: "c2-game", cls: 2, topic: "c2-maths-ch08-t02", ask: "game khelna hai", kind: "game" },
  { id: "c2-hindi-draw", cls: 2, topic: "c2-hindi-ch01-t01", ask: "isko draw karo", kind: "draw" },
  { id: "c3-plant-pic", cls: 3, topic: "c3-evs-ch04-t01", ask: "plant ka picture dikhao", kind: "picture", words: W("plant", "paudha", "पौधा", "root", "jad", "जड़", "stem", "tana", "तना", "leaf", "leaves", "patti", "पत्ती", "flower", "phool") },
  { id: "c3-river", cls: 3, topic: "c3-evs-ch07-t01", ask: "nadi dikhao", kind: "picture", words: W("river", "nadi", "नदी") },
  { id: "c3-numline-add", cls: 3, topic: "c3-maths-ch04-t03", ask: "number line pe dikhao 23 plus 14", kind: "numline", nums: ["23"] },
  { id: "c3-clock", cls: 3, topic: "c3-maths-ch13-t01", ask: "ghadi draw karo", kind: "shape", shape: ["circle"], words: W("clock", "ghadi", "घड़ी", "hour", "minute", "12") },
  { id: "c3-aloo", cls: 3, topic: "c3-evs-ch08-t01", ask: "aloo dikhao", kind: "picture", words: W("aloo", "alu", "potato", "आलू") },
  { id: "c3-equal-parts", cls: 3, topic: "c3-maths-ch08-t01", ask: "equal parts draw karke dikhao", kind: "shape", shape: ["parts"], words: W("equal", "barabar", "बराबर", "half", "aadha", "parts") },
  { id: "c4-shadow", cls: 4, topic: "c4-evs-ch10-t01", ask: "shadow kaise banta hai draw karke dikhao", kind: "draw", words: W("shadow", "parchhai", "parchhayi", "परछाई", "light", "roshni", "torch") },
  { id: "c4-beak-photo", cls: 4, topic: "c4-evs-ch03-t01", ask: "chidiya ki chonch ki photo dikhao", kind: "picture", words: W("beak", "chonch", "चोंच", "bird", "chidiya", "चिड़िया") },
  { id: "c4-half", cls: 4, topic: "c4-maths-ch05-t01", ask: "half ka picture banao", kind: "shape", shape: ["parts"], words: W("half", "1/2", "aadha", "आधा") },
  { id: "c4-example-again", cls: 4, topic: "c4-maths-ch03-t02", ask: "ek aur example do", kind: "example" },
  { id: "c4-moon", cls: 4, topic: "c4-evs-ch10-t02", ask: "chaand dikhao", kind: "picture", words: W("moon", "chand", "chaand", "चाँद", "चांद") },
  { id: "c4-game", cls: 4, topic: "c4-maths-ch11-t01", ask: "game khelte hain", kind: "game" },
  { id: "c5-ice-steam", cls: 5, topic: "c5-evs-ch01-t01", ask: "baraf aur bhaap ka diagram dikhao", kind: "draw", words: W("ice", "baraf", "barf", "बर्फ", "vapour", "vapor", "steam", "bhaap", "भाप") },
  { id: "c5-numline-frac", cls: 5, topic: "c5-maths-ch02-t01", ask: "number line pe 1/4 dikhao", kind: "numline", nums: ["1/4"] },
  { id: "c5-flag", cls: 5, topic: "c5-evs-ch05-t02", ask: "tiranga dikhao", kind: "picture", words: W("flag", "tiranga", "तिरंगा", "saffron", "kesariya", "chakra") },
  { id: "c5-hexagon", cls: 5, topic: "c5-maths-ch07-t01", ask: "hexagon draw karo", kind: "shape", shape: [6], words: W("hexagon", "षट्भुज", "6") },
  { id: "c5-directions", cls: 5, topic: "c5-maths-ch14-t01", ask: "map pe direction dikhao", kind: "draw", words: W("north", "south", "east", "west", "uttar", "dakshin", "purab", "pashchim", "N", "S", "E", "W") },
  { id: "c6-lifecycle", cls: 6, topic: "c6-science-ch10-t03", ask: "plant ki life cycle draw karo", kind: "draw", words: W("seed", "beej", "बीज", "seedling", "flower", "phool", "fruit", "phal", "plant") },
  { id: "c6-numline-neg", cls: 6, topic: "c6-maths-ch10-t02", ask: "number line pe minus 3 dikhao", kind: "numline", nums: ["-3"] },
  { id: "c6-example", cls: 6, topic: "c6-maths-ch07-t03", ask: "ek example do", kind: "example" },
  { id: "c6-evaporation", cls: 6, topic: "c6-science-ch08-t02", ask: "evaporation ka diagram banao", kind: "draw", words: W("evaporation", "vapour", "vapor", "bhaap", "water", "paani", "sun", "surya") },
  { id: "c6-mountain-photo", cls: 6, topic: "c6-sst-ch03-t01", ask: "pahad ki photo dikhao", kind: "picture", words: W("mountain", "pahad", "pahaad", "पहाड़", "peak") },
  { id: "c7-circuit", cls: 7, topic: "c7-science-ch03-t02", ask: "circuit draw karke dikhao", kind: "draw", words: W("cell", "battery", "bulb", "switch", "wire", "circuit") },
  { id: "c7-numline-dec", cls: 7, topic: "c7-maths-ch03-t03", ask: "number line pe 0.5 dikhao", kind: "numline", nums: ["0.5"] },
  { id: "c7-eclipse", cls: 7, topic: "c7-science-ch12-t03", ask: "solar eclipse ka picture dikhao", kind: "picture", words: W("sun", "moon", "earth", "surya", "chand", "prithvi", "eclipse", "grahan") },
  { id: "c7-game", cls: 7, topic: "c7-maths-ch06-t01", ask: "koi game khilao", kind: "game" },
  { id: "c8-cell", cls: 8, topic: "c8-science-ch02-t01", ask: "cell ka diagram banao", kind: "draw", words: W("cell", "nucleus", "membrane", "cytoplasm", "koshika") },
  { id: "c8-square", cls: 8, topic: "c8-maths-ch01-t01", ask: "isko draw karke samjhao", kind: "draw" },
  { id: "c8-example", cls: 8, topic: "c8-maths-ch08-t02", ask: "ek example do na", kind: "example" },
  { id: "c9-flower", cls: 9, topic: "c9-science-ch11-t02", ask: "phool ke parts draw karo", kind: "draw", words: W("petal", "sepal", "stamen", "pistil", "pankhudi", "flower", "phool") },
  { id: "c9-aloo-offtopic", cls: 9, topic: "c9-maths-ch08-t01", ask: "aloo dikhao", kind: "picture", words: W("aloo", "alu", "potato", "आलू") },
  { id: "c9-numline-rational", cls: 9, topic: "c9-maths-ch03-t02", ask: "number line pe 3/4 dikhao", kind: "numline", nums: ["3/4"] },
];

// ─────────────────────────── predicates ───────────────────────────
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFC");
const textsOf = (script) => (script?.ops ?? []).map((o) => (typeof o?.text === "string" ? o.text : Array.isArray(o?.rows) ? o.rows.flat().join(" ") : "")).filter(Boolean);
const sig = (script) => JSON.stringify([...new Set(textsOf(script).map(norm))].sort());
/** a word hit: whole-ish match for short latin words (N/S/E/W), substring for the rest */
function hits(texts, words) {
  const all = texts.map(norm).join(" | ");
  return (words ?? []).filter((w) => {
    const x = norm(w);
    if (/^[a-z]{1,2}$/.test(x)) return texts.some((t) => norm(t).trim() === x);
    return all.includes(x);
  });
}
const POINT = /\b(screen|board|whiteboard)\s*(?:par|pe|mein|me|ke|ki|on)\b|\bon the (?:screen|board)\b|\blook at the (?:screen|board|picture)\b|(?:स्क्रीन|बोर्ड)\s*(?:पर|पे|में)|\b(?:yahan|yaha|neeche|niche|upar)\s+(?:dekh\w*)\b|\bdekh(?:o|iye|ie)\b[^.?!]{0,30}\b(?:screen|board|picture|photo|drawing|diagram)\b/i;
const CANT = /\b(?:photo|picture|tasveer|image|chitra)\b[^.?!]{0,60}\b(?:nahi|nahin|can'?t|cannot|not able)\b|\b(?:nahi|nahin)\b[^.?!]{0,30}\b(?:dikha|bana)\s*(?:sakti|sakta|paungi|paati)\b|\bcan'?t show\b/i;
const INTERACTIVE = /number_line_jump|shade_fraction|sort_bins|balance_scale|game|play|drag|tap|quiz|match/i;

function polygons(script, n) { return (script?.ops ?? []).some((o) => (o.op === "polygon" && Array.isArray(o.points) && o.points.length === n) || (n === 4 && o.op === "rect")); }
function circles(script) { return (script?.ops ?? []).some((o) => o.op === "circle" || o.op === "ellipse"); }
function parts(script) {
  const ops = script?.ops ?? [];
  return ops.filter((o) => o.op === "sector").length >= 2 || ops.filter((o) => o.op === "rect").length >= 2 || ops.some((o) => o.op === "numwork" && o.layout === "fraction");
}
// a number line: the renderer's own (numwork number_line) or a drawn one (a long horizontal line with >= 2 ticks across it)
function numline(script) {
  const ops = script?.ops ?? [];
  if (ops.some((o) => o.op === "numwork" && o.layout === "number_line")) return true;
  const horiz = ops.filter((o) => (o.op === "line" || o.op === "arrow") && o.from && o.to && Math.abs(o.to[1] - o.from[1]) < 6 && Math.abs(o.to[0] - o.from[0]) >= 150);
  return horiz.some((h) => ops.filter((o) => o.op === "line" && o.from && o.to && Math.abs(o.from[0] - o.to[0]) < 3 && Math.min(o.from[1], o.to[1]) <= h.from[1] && Math.max(o.from[1], o.to[1]) >= h.from[1]).length >= 2);
}

/** score one case from what the ask produced */
export function score(c, got) {
  const why = [];
  const page = got.page;                  // the board page drawn for the ask (script) or null
  const texts = [...textsOf(page), ...(got.image ? [got.image.subject ?? "", got.image.alt ?? ""] : [])];
  const subjectWords = c.words ?? [];
  const subj = subjectWords.length ? hits(texts, subjectWords) : [];
  // an interactive piece: a Director engine the child acts on (every engine but the static explainer board) or a Studio play /
  // Stagecraft piece
  const interactive = got.mounts.some((m) => m && !/^explainer@/.test(m)) || got.studioKinds.some((k) => /stagecraft|play|frame|game/.test(k));
  let pass = false;
  switch (c.kind) {
    case "numline": {
      // the numbers the child named must be on it (written in any op), not another question's numbers
      const cells = new Set(texts.flatMap((t) => String(t).replace(/[−–]/g, "-").split(/[\s,|;]+/)).map((x) => x.replace(/^\+/, "")).filter(Boolean));
      const named = (c.nums ?? []).every((n) => cells.has(n));
      const line = (!!page && numline(page)) || got.mounts.some((m) => /number_line/.test(m));
      pass = line && named;
      if (!line) why.push("no number line"); else if (!named) why.push(`number line without ${(c.nums ?? []).join(", ")}`);
      break;
    }
    case "shape": {
      const want = c.shape ?? [];
      const okShape = want.every((s) => (s === "circle" ? circles(page) : s === "parts" ? parts(page) : polygons(page, s)));
      pass = !!page && (okShape || subj.length > 0);
      if (!pass) why.push(page ? `shape ${want.join("+")} not drawn` : "no page");
      break;
    }
    case "example": pass = !!page && texts.length >= 2 && !got.repeat; if (!pass) why.push(page ? "page has no worked content" : "no page"); break;
    // owner decision 14.2: a game that cannot mount may be answered honestly (no game announced, nothing pointed at); it is
    // counted apart (got.honest) so the report shows how many game asks got a real piece
    case "game": {
      const honestNoGame = !interactive && !announcesGame(got.reply ?? "") && !POINT.test(got.reply ?? "");
      pass = interactive || honestNoGame;
      if (honestNoGame) got.honest = true;
      if (!pass) why.push(`no interactive piece and her line announces a game (mounts: ${got.mounts.join(",") || "-"}; studio: ${got.studioKinds.join(",") || "-"})`);
      break;
    }
    case "draw": pass = !!page && (subjectWords.length ? subj.length > 0 : texts.length >= 1 || (page.ops ?? []).length >= 3); if (!pass) why.push(page ? `page does not show ${subjectWords.slice(0, 3).join("/") || "it"}` : "no page"); break;
    case "picture": {
      const shown = (got.image && subj.length > 0) || (!!page && subj.length > 0);
      const honest = !shown && CANT.test(got.reply ?? "") && !POINT.test(got.reply ?? "");
      pass = shown || honest;
      if (honest) got.honest = true;
      if (!pass) why.push(page ? `page does not show ${subjectWords.slice(0, 3).join("/")}` : "no picture and no honest can't");
      break;
    }
  }
  if (got.repeat) { why.push("repeat: same page as before the ask"); pass = false; }
  if (page && page.mode === "continue") { why.push("overlay: drawn over the previous page"); pass = false; }
  // pointing at the screen while nothing shows what was asked (only judged when the case names a subject)
  if (subjectWords.length && POINT.test(got.reply ?? "") && !subj.length) { why.push("pointing: her line points at the screen, which does not show it"); pass = false; }
  return { pass, why, subjectHits: subj };
}

// ─────────────────────────── one case ───────────────────────────
async function boardPages(lessonId) {
  return q("select seq, intent_id, script, created_at from board_page where lesson_id = $1 order by seq", [lessonId]).catch(() => []);
}
async function mountsOf(lessonId) {
  return q("select kind, archetype, source, facts, revealed_at from studio_mount where lesson_id = $1 order by revealed_at nulls last", [lessonId]).catch(() => []);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCase(api, c) {
  // the account's setup calls are retried once (a 500 from POST /api/parent/controls cost one case in the baseline run)
  const child = await freshChild(api, { name: "Kiko", classLevel: c.cls, lang: "hinglish", interests: ["cricket"] })
    .catch(async () => { await sleep(1500); return freshChild(api, { name: "Kiko", classLevel: c.cls, lang: "hinglish", interests: ["cricket"] }); });
  const L = await openLesson(api, child, { topicId: c.topic, spoken: true, persona: { name: "Kiko", classLevel: c.cls, lang: "hinglish" } });
  const rows = [];
  try {
    const first = await L.turn("haan", { raw: true });
    rows.push({ child: "haan", reply: first.r?.teacherReply ?? null, error: first.r?.error?.message ?? null });
    await sleep(2500);
    const before = await boardPages(L.lessonId);
    const prevPage = before.at(-1)?.script ?? null;
    const t0 = Date.now();
    const row = await L.turn(c.ask, { raw: true, asr: 0.9 });
    const r = row.r ?? {};
    // late boards land on the slot after the response: wait, then read what the server itself recorded
    let after = await boardPages(L.lessonId);
    for (let waited = 0; waited < WAIT && after.length <= before.length; waited += 1500) { await sleep(1500); after = await boardPages(L.lessonId); }
    await sleep(1200);
    after = await boardPages(L.lessonId);
    const fresh = after.filter((p) => !before.some((b) => b.intent_id === p.intent_id));
    const slotArt = r.ui?.studioSlot?.artifact ?? null;
    const page = fresh.at(-1)?.script ?? (slotArt?.kind === "whiteboard" ? slotArt.script : null);
    const mounts = (r.moduleCommands ?? []).filter((m) => m.op === "mount").map((m) => String(m.engine ?? m.moduleId ?? ""));
    const sm = (await mountsOf(L.lessonId)).filter((m) => m.revealed_at && new Date(m.revealed_at).getTime() >= t0 - 500);
    const studioKinds = [...new Set([...(slotArt?.kind ? [slotArt.kind] : []), ...sm.map((m) => m.kind).filter((k) => k && k !== "whiteboard")])];
    const imageRow = sm.find((m) => m.kind === "image");
    const image = slotArt?.kind === "image" ? { subject: slotArt.subject ?? slotArt.facts?.onScreen?.subject ?? null, alt: slotArt.alt ?? null }
      : imageRow ? { subject: imageRow.facts?.facts?.onScreen?.subject ?? imageRow.facts?.onScreen?.subject ?? null, alt: imageRow.facts?.facts?.onScreen?.alt ?? null } : null;
    const repeat = !!(page && prevPage && sig(page) === sig(prevPage) && textsOf(page).length > 0);
    // what the reply guards did to her line (the stored teacher row; the test account and its rows are deleted at cleanup)
    const trow = (await q("select meta from turn where lesson_id = $1 and speaker = 'teacher' order by seq desc limit 1", [L.lessonId]).catch(() => []))[0];
    const got = { reply: r.teacherReply ?? null, error: r.error?.message ?? null, move: r.move?.kind ?? null, request: r.move?.request ?? null, guard: trow?.meta?.guard ?? r.guard ?? null, page, prevTexts: textsOf(prevPage).slice(0, 10),
      pageTexts: textsOf(page).slice(0, 14), mode: page?.mode ?? null, mounts, studioKinds, image, repeat, pages: { before: before.length, after: after.length }, ms: row.ms };
    const s = score(c, got);
    return { ...c, ...s, got: { ...got, page: undefined, honest: got.honest ?? false }, lessonId: L.lessonId, rows };
  } finally { await L.end(); }
}

// ─────────────────────────── run ───────────────────────────
const cases = CASES.filter((c) => !ONLY || ONLY.includes(c.id));
const results = [];
await withTestAccount(async ({ api }) => {
  let i = 0;
  const worker = async () => {
    while (i < cases.length) {
      const c = cases[i++];
      try { const r = await runCase(api, c); results.push(r); console.log(`${r.pass ? "PASS" : "FAIL"} ${c.id}: ${r.pass ? (r.got.honest ? "honest can't" : r.subjectHits.join(",") || r.got.pageTexts.slice(0, 3).join(" · ")) : r.why.join("; ")}`); }
      catch (e) { results.push({ ...c, pass: false, why: [`threw: ${String(e?.message ?? e).slice(0, 200)}`], got: null }); console.log(`FAIL ${c.id}: threw ${e?.message}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAR, cases.length) }, worker));
}, { tag: "r5-board" });

results.sort((a, b) => CASES.findIndex((c) => c.id === a.id) - CASES.findIndex((c) => c.id === b.id));
const passed = results.filter((r) => r.pass).length;
const summary = { date: new Date().toISOString(), base: process.env.TAXILA_BASE, n: results.length, passed, share: results.length ? Math.round((passed / results.length) * 1000) / 10 : 0,
  byKind: Object.fromEntries([...new Set(results.map((r) => r.kind))].map((k) => [k, `${results.filter((r) => r.kind === k && r.pass).length}/${results.filter((r) => r.kind === k).length}`])),
  failures: Object.fromEntries(["repeat", "overlay", "pointing"].map((k) => [k, results.filter((r) => (r.why ?? []).some((w) => w.startsWith(k))).length])),
  method: "local server on the Neon TEST branch, real Azure models; per case a fresh child, the spoken lane, one 'haan' then the ask; board read from board_page/studio_mount (TEST) after up to --wait ms; scored by code predicates (subject words, shapes, number line, interactive mount, repeat, overlay, pointing). Adult-run harness: no child." };
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(join(OUT, "board-asks.json"), JSON.stringify({ summary, results }, null, 1));
const cell = (x) => String(x ?? "").replace(/\|/g, "/").replace(/\s+/g, " ").slice(0, 160);
fs.writeFileSync(join(OUT, "board-asks.md"), [`# Board asks: ${passed}/${results.length}`, "", "```json", JSON.stringify(summary, null, 1), "```", "",
  "| case | ask | pass | why | board texts | she said |", "|---|---|---|---|---|---|",
  ...results.map((r) => `| ${r.id} | ${cell(r.ask)} | ${r.pass ? "yes" : "**no**"} | ${cell((r.why ?? []).join("; "))} | ${cell(r.got?.image ? `IMAGE ${r.got.image.subject}` : (r.got?.pageTexts ?? []).slice(0, 6).join(" · "))} | ${cell(r.got?.reply)} |`)].join("\n"));
console.log(JSON.stringify(summary, null, 1));
ok(true, `board asks ${passed}/${results.length}`);
done();
