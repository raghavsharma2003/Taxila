// Census F5 #2 (main 2026-10-21: a fragment lost its negation): the duplex echo filter (server/duplex/echo.js) on every
// (her line → the child's heard reply) pair of the sim lab's voice lessons, before / after negations stopped matching by
// consonant skeleton ("नहीं" = "n" = her "हैं" / "ना" / "हाँ"). Two sides:
//   damage   child replies whose negation the filter removed (the meaning flips: "मुझे नहीं पता …" → "मुझे पता")
//   floor    her own line fed back as the child's words (her echo, the filter's job): what is left of it
// Text level: her words timed from her line at the cascade lane's 70 ms/char; the reply's audio sits just after her line.
//   node evals/duplex-2026-10/negation-echo.mjs --records <dir>[,<dir>…] --base <echo.js of the base> [--out f.json]
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const DIRS = arg("--records").split(","), BASE = arg("--base"), OUT = arg("--out");
const { EchoSubtractor: After } = await import(new URL("../../server/duplex/echo.js", import.meta.url).href);
const { EchoSubtractor: Before } = await import(path.resolve(BASE));
// the cascade lane's whole-utterance echo test, before / after (the base tree's cascadeLink.ts beside its echo.js)
const { isEcho: isEchoAfter } = await import(new URL("../../src/lesson/cascadeLink.ts", import.meta.url).href);
const { isEcho: isEchoBefore } = await import(path.resolve(path.dirname(BASE), "../../src/lesson/cascadeLink.ts"));
const NEG = /(^|\s)(नहीं|नही|नहि|ना|न|मत|nahi|nahin|na|no|not|never|dont|don't)(?=\s|[।?.!,]|$)/iu;
const negCount = (s) => (String(s).match(new RegExp(NEG.source, "giu")) ?? []).length;

function run(E, her, child, whole = false) {
  const e = new E();
  e.heardText("u", her, 0, 70);
  const end = her.length * 70;
  // a reply: its audio follows her line (her last 2.5 s audible in it); her echo: its audio IS her whole line
  return e.subtract(child, end + 600, 0, { fromMs: whole ? 0 : Math.max(0, end - 2500), toMs: end + 400 }).text;
}

const pairs = [];
const seen = new Set();
for (const dir of DIRS) for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  let j; try { j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { continue; }
  const turns = j.turns ?? [];
  for (let i = 1; i < turns.length; i++) {
    const her = String(turns[i - 1]?.teacher ?? "").trim(), child = String(turns[i]?.child?.asr?.text ?? turns[i]?.child?.sent ?? "").trim();
    if (!her || !child) continue;
    const key = her + "\u0000" + child;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ her, child });
  }
}
const out = { pairs: pairs.length, withNegation: 0, damage: { before: 0, after: 0 }, isEchoNegatedReply: { before: 0, after: 0 }, isEchoHerLine: { before: 0, after: 0 }, otherChanged: 0, floor: { herLines: 0, leftTokensBefore: 0, leftTokensAfter: 0, linesNotFullyRemovedBefore: 0, linesNotFullyRemovedAfter: 0 }, examples: [] };
const herLines = new Set();
for (const { her, child } of pairs) {
  herLines.add(her);
  const b = run(Before, her, child), a = run(After, her, child);
  const n = negCount(child);
  if (n) out.withNegation++;
  if (negCount(b) < n) out.damage.before++;
  if (negCount(a) < n) out.damage.after++;
  if (negCount(b) < n && out.examples.length < 12) out.examples.push({ her: her.slice(-60), child, before: b, after: a });
  if (a !== b && !(negCount(b) < n)) out.otherChanged++;
  // a negated reply read whole as her echo (the cascade lane drops it)
  if (n && isEchoBefore(child, her)) out.isEchoNegatedReply.before++;
  if (n && isEchoAfter(child, her)) out.isEchoNegatedReply.after++;
}
for (const her of herLines) {
  out.floor.herLines++;
  if (isEchoBefore(her, her)) out.isEchoHerLine.before++;
  if (isEchoAfter(her, her)) out.isEchoHerLine.after++;
  const b = run(Before, her, her, true).split(/\s+/).filter(Boolean).length, a = run(After, her, her, true).split(/\s+/).filter(Boolean).length;
  out.floor.leftTokensBefore += b; out.floor.leftTokensAfter += a;
  if (b) out.floor.linesNotFullyRemovedBefore++;
  if (a) out.floor.linesNotFullyRemovedAfter++;
}
console.log(JSON.stringify(out, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ method: { date: new Date().toISOString().slice(0, 10), dirs: DIRS.map((d) => path.basename(path.dirname(d))) }, ...out }, null, 1));
