// The teacher-output floor and the identifier scrub AS WIRED in live lessons (server/routes/lesson.js), measured on
// REAL stored turns from the Neon TEST branch (CONDUCTOR_TEST_DATABASE_URL; refuses the production endpoint):
//   1. false flags: every stored teacher turn through the wired call — floorViolations with the posed item's verified
//      content (floorContentOf: the call-site recipe), requireHelpline on a safeguard move, goodbye on a wrap — and how
//      many would have opened a floor_violation incident (FLOOR_INCIDENT_FAMILIES). Every flag is listed for review.
//      GATE: n >= 50, and incident-family flags <= FLOOR.incidents (pinned; review each one before raising it).
//   2. scrub false masks: every stored child turn through scrubPii (what the reply, classifier, grader and memory
//      models now receive). Masks are listed; GATE: n >= 50.
//   3. added latency: the wired work per turn — the floor check on a reply (twice: the draft and the final words) and
//      the scrub of the turn plus 8 turns of history — mean and p95 in µs over the corpus.
//   4. the teacher-name predicate on its corpora (evals/teacher-names.data.mjs ALLOWED / REFUSED).
//   node evals/floor-wiring.mjs [--json evals/results/floor-wiring-<date>.json]
import { existsSync, readFileSync, writeFileSync } from "fs";
import { neon } from "@neondatabase/serverless";
import { floorViolations, scrubPii } from "../server/director/safety.js";
import { posesItem } from "../server/director/items.js";
import { floorContentOf, FLOOR_INCIDENT_FAMILIES } from "../server/routes/lesson.js";
import { getKit } from "../server/content/index.js";
import { checkTeacherName } from "../server/compiler/characters/naming.js";
import { ALLOWED, ALLOWED_WIDE, REFUSED, ADVERSARIAL } from "./teacher-names.data.mjs";
import { teacherTurns } from "./lib/corpora.mjs";

const FLOOR = { minTurns: 50, incidents: 0 };
const envFile = new URL("../.env.local", import.meta.url);
const fromEnvFile = (name) => (existsSync(envFile) ? (readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith(name + "=")) || "").slice(name.length + 1).replace(/^"(.*)"$/, "$1") : "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/-pooler\./, "."); } catch { return ""; } };
const TEST = process.env.CONDUCTOR_TEST_DATABASE_URL || fromEnvFile("CONDUCTOR_TEST_DATABASE_URL");
const PROD = process.env.DATABASE_URL || fromEnvFile("DATABASE_URL");
if (!TEST) { console.error("CONDUCTOR_TEST_DATABASE_URL not set"); process.exit(2); }
if (PROD && hostOf(TEST) === hostOf(PROD)) { console.error("CONDUCTOR_TEST_DATABASE_URL is the production endpoint: refusing"); process.exit(2); }
const sql = neon(TEST);

let failed = false;
const gate = (ok, line) => { console.log(`${ok ? "PASS" : "FAIL"} ${line}`); if (!ok) failed = true; };

const rows = await sql.query(`select t.id, t.seq, t.speaker, t.text, t.meta, l.topic_id, l.state->'ctx'->>'lang' as lang
  from turn t join lesson l on l.id = t.lesson_id where t.speaker in ('teacher','child') order by t.lesson_id, t.seq`);
const teacher = rows.filter((r) => r.speaker === "teacher");
const child = rows.filter((r) => r.speaker === "child" && !/^\[/.test(r.text));
const kits = new Map();
const kitOf = async (id) => { if (!kits.has(id)) kits.set(id, await getKit(id, { generate: false }).catch(() => null)); return kits.get(id); };

// warm the regexes once so the latency below is the steady state a running server sees (the first call compiles them)
for (const t of teacher.slice(0, 5)) floorViolations(t.text);
for (const c of child.slice(0, 5)) scrubPii(c.text);

// 1. floor, as wired
const flagged = [];
let posed = 0;
const floorUs = [];
for (const t of teacher) {
  const k = await kitOf(t.topic_id);
  const lang = t.lang || "hinglish";
  const item = k?.items.find((i) => posesItem(t.text, i, lang) && (i.prompt_en || i.prompt_hi)) ?? null;
  if (item) posed += 1;
  const move = t.meta?.move;
  const opts = { content: floorContentOf(item), requireHelpline: move === "safeguard", goodbye: move === "wrap" };
  const t0 = performance.now();
  const fam = floorViolations(t.text, opts);
  floorViolations(t.text, opts); // the reply guard checks the draft and the final words
  floorUs.push((performance.now() - t0) * 1000);
  if (fam.length) flagged.push({ id: t.id, move, families: fam, incident: fam.some((f) => FLOOR_INCIDENT_FAMILIES.includes(f)), text: t.text.slice(0, 160) });
}
for (const f of flagged) console.log(`      ${f.families.join("+")}${f.incident ? " [incident]" : ""} (${f.move}) ${f.text}`);
const incidents = flagged.filter((f) => f.incident).length;
gate(teacher.length >= FLOOR.minTurns, `real teacher turns: n = ${teacher.length} (${posed} posing a kit item, content passed)`);
gate(incidents <= FLOOR.incidents, `incident-family flags: ${incidents}/${teacher.length} · any family: ${flagged.length}/${teacher.length}`);
// ... and the recorded model turns of earlier evals (no posed item known: content [] — the stricter case)
const recorded = teacherTurns();
const recFlags = recorded.filter((r) => floorViolations(r.text).some((f) => FLOOR_INCIDENT_FAMILIES.includes(f)));
for (const r of recFlags.slice(0, 10)) console.log(`      recorded ${floorViolations(r.text)} ${r.where}: ${r.text.slice(0, 120)}`);
console.log(`info recorded teacher turns (evals/lib/corpora.mjs): incident-family flags ${recFlags.length}/${recorded.length}`);

// 2. scrub, as wired (the child's turn + 8 turns of history per model call)
const masked = [];
const scrubUs = [];
for (let i = 0; i < child.length; i++) {
  const c = child[i];
  const r = scrubPii(c.text);
  if (r.found.length) masked.push({ id: c.id, found: r.found, text: c.text.slice(0, 120), out: r.text.slice(0, 120) });
  const hist = child.slice(Math.max(0, i - 8), i).map((x) => x.text);
  const t0 = performance.now();
  for (const h of [c.text, ...hist]) scrubPii(h);
  scrubUs.push((performance.now() - t0) * 1000);
}
for (const m of masked) console.log(`      mask ${m.found.join("+")}: ${m.text} → ${m.out}`);
gate(child.length >= FLOOR.minTurns, `real child turns: n = ${child.length} · masked: ${masked.length} (listed above for review)`);
// ... and teacher turns: scrubbed too since 2026-10-03 (a voice transcript can echo the child's identifiers back)
const tMasked = teacher.filter((t) => scrubPii(t.text).found.length);
for (const m of tMasked) console.log(`      teacher mask ${scrubPii(m.text).found.join("+")}: ${m.text.slice(0, 120)}`);
console.log(`info real teacher turns scrubbed: ${tMasked.length}/${teacher.length} masked (listed above for review)`);

// 3. latency
const stat = (xs) => { const s = [...xs].sort((a, b) => a - b); return { median: +(s[Math.floor(s.length / 2)] ?? 0).toFixed(1), mean: +(s.reduce((a, b) => a + b, 0) / (s.length || 1)).toFixed(1), p95: +(s[Math.floor(s.length * 0.95)] ?? 0).toFixed(1), max: +(s.at(-1) ?? 0).toFixed(1), n: s.length }; };
const lat = { floorPerReplyUs: stat(floorUs), scrubPerTurnUs: stat(scrubUs) };
console.log(`latency: floor ${JSON.stringify(lat.floorPerReplyUs)} µs per reply (draft + final) · scrub ${JSON.stringify(lat.scrubPerTurnUs)} µs per turn (turn + 8 history)`);

// 4. the name predicate on its corpora
const ok = (ALLOWED ?? []).filter((n) => checkTeacherName(n, { childFirstName: "Riya Sharma", characterId: "asha" }).ok).length;
const refusedRight = (REFUSED ?? []).filter(([n, reason]) => { const r = checkTeacherName(n, { childFirstName: "Riya Sharma", characterId: "asha" }); return reason === null ? r.ok : !r.ok && r.reason === reason; }).length;
const n0 = performance.now();
for (let i = 0; i < 20; i++) for (const n of ALLOWED ?? []) checkTeacherName(n, { childFirstName: "Riya Sharma" });
const nameUs = ((performance.now() - n0) * 1000) / (20 * (ALLOWED?.length || 1));
gate(ALLOWED && ok === ALLOWED.length, `names: ${ok}/${ALLOWED?.length} ordinary names pass · ${refusedRight}/${REFUSED?.length} refusal rows right · ${nameUs.toFixed(1)} µs/check`);
const wideOk = ALLOWED_WIDE.filter((n) => checkTeacherName(n, { childFirstName: "Riya Sharma", characterId: "asha" }).ok).length;
const advRight = ADVERSARIAL.filter(([n, d]) => { const r = checkTeacherName(n, { childFirstName: "Riya Sharma", characterId: "asha" }); return !r.ok && r.detail === d; }).length;
gate(wideOk === ALLOWED_WIDE.length && advRight === ADVERSARIAL.length, `names (rev 2): wide corpus ${wideOk}/${ALLOWED_WIDE.length} pass · reviewer's adversarial ${advRight}/${ADVERSARIAL.length} refused with the right family`);

const out = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : null;
if (out) {
  writeFileSync(out, JSON.stringify({
    date: new Date().toISOString().slice(0, 10), source: "Neon test branch turn rows",
    teacher: { n: teacher.length, posed, flagged: flagged.length, incidents, flags: flagged.map(({ id, move, families, incident }) => ({ id, move, families, incident })) },
    recorded: { n: recorded.length, incidentFlags: recFlags.length },
    child: { n: child.length, masked: masked.length, kinds: masked.map((m) => m.found) },
    latency: lat, names: { allowed: ALLOWED?.length, allowedPass: ok, refusedRows: REFUSED?.length, refusedRight, usPerCheck: +nameUs.toFixed(1),
      wide: ALLOWED_WIDE.length, widePass: wideOk, adversarial: ADVERSARIAL.length, adversarialRight: advRight },
    teacherScrub: { n: teacher.length, masked: tMasked.length },
  }, null, 2));
  console.log(`wrote ${out}`);
}
process.exit(failed ? 1 : 0);
