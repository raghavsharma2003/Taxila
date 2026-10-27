// Round 5 (14.3, main's bar a): when her line carries its own numbers, does the line planner's board draw THOSE numbers, or
// recite the kit's worked example? (prod 2001d8cc: her "3/5 x 2/3, 15 parts, 6 marked", three drafts drew "1/2 x 3/4 = 3/8".)
// Her REAL lines with two or more numbers are taken from sim-lab records (adult-run simulated lessons, no child), each planned
// once against its topic's kit with the kit's worked example as the move's content (the recitation risk), sequentially (the
// shared deployment's load cap). Scored by code: the draft passes the board gate; it writes at least one of her numbers; it
// writes numbers but none of hers (recited).
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local tests/prod/r5-wb-her-numbers.mjs --records <dir> --plan <module> [--n 20] --out <file>
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { numbersIn } from "../../server/studio/qa/whiteboard.js";
import { textsOf } from "../../server/studio/request.js";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const dir = arg("records");
const planPath = path.resolve(arg("plan", "server/studio/plan.js"));
const N = Number(arg("n", 20));
const out = arg("out");
const { planWhiteboard } = await import(pathToFileURL(planPath).href);

const kits = new Map();
const kitFor = (topicId) => {
  const m = /^(c\d+)-([a-z]+)-/.exec(topicId ?? "");
  if (!m) return null;
  const f = `data/kits/${m[1]}-${m[2]}.json`;
  if (!kits.has(f)) kits.set(f, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null);
  const all = kits.get(f);
  return (all?.topics ?? []).find((t) => t.topicId === topicId) ?? null;
};

// her lines: teacher turns with 2+ distinct numbers, one per lesson turn, spread across lessons
const lines = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const topicId = r.start?.topic?.id;
  const kit = kitFor(topicId);
  if (!kit?.workedExample) continue;
  const t = (r.turns ?? []).find((x) => x.teacher && new Set(numbersIn(x.teacher)).size >= 2 && !/safeguard/.test(String(x.move ?? "")));
  if (t) lines.push({ lesson: f, topicId, kit, text: t.teacher });
  if (lines.length >= N) break;
}

const rows = [];
for (const L of lines) {
  const we = L.kit.workedExample;
  const content = [we.problem, ...(we.steps ?? [])].filter(Boolean).slice(0, 6);
  const ask = { line: { text: L.text }, intent: { beat: "explain", style: { band: "B3" } }, kit: { content }, mode: "fresh" };
  let r;
  try { r = await planWhiteboard(ask, { kit: L.kit, budgetMs: 9000 }); } catch (e) { r = { ok: false, why: String(e?.message ?? e).slice(0, 60) }; }
  const hers = [...numbersIn(L.text)];
  const board = r?.script ? [...numbersIn(textsOf(r.script).join(" "))] : [];
  const row = { lesson: L.lesson, topicId: L.topicId, ok: !!r?.ok, why: r?.ok ? null : String(r?.why ?? "").slice(0, 80), hersOnBoard: board.some((n) => hers.includes(n)),
    recited: board.length > 0 && !board.some((n) => hers.includes(n)), attempts: r?.attempts ?? null, line: L.text.slice(0, 140), boardTexts: r?.script ? textsOf(r.script).slice(0, 8) : [] };
  rows.push(row);
  console.log(`${row.ok ? "ok " : "NO "} hers=${row.hersOnBoard ? "y" : "n"} recited=${row.recited ? "Y" : "n"} ${L.topicId} | ${row.boardTexts.join(" · ").slice(0, 90)}`);
}
const sum = { n: rows.length, gatePass: rows.filter((x) => x.ok).length, hersOnBoard: rows.filter((x) => x.ok && x.hersOnBoard).length, recited: rows.filter((x) => x.ok && x.recited).length };
console.log(JSON.stringify(sum));
if (out) fs.writeFileSync(out, JSON.stringify({ plan: path.relative(process.cwd(), planPath), at: new Date().toISOString(), sum, rows }, null, 1));
