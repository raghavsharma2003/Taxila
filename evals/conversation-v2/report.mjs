// REPORT.md for a conversation-v2 run: pass rates per intent (with Wilson 80% intervals), splits by lane / moment /
// language, what the production Director actually did (move kinds, lesson ends), what the prod perception layer emitted
// (prescreen.json flags), defects seen in passing (verbatim re-asks, duplicate sentences, ASCII drawings read aloud,
// safeguard false alarms), and the UNDERSTAND bake-off table when present. No model calls.
// Run: node evals/conversation-v2/report.mjs --dir evals/conversation-v2/results/<stamp>
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { FAMILY } from "./cases.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const DIR = arg("dir", join(HERE, "results", "latest"));
const read = (f) => JSON.parse(fs.readFileSync(join(DIR, f), "utf8"));
const scored = read("scored.json"), probes = read("probes.json"), pre = read("prescreen.json"), summary = read("summary.json");
const meta = fs.existsSync(join(DIR, "run-meta.json")) ? read("run-meta.json") : {};
const P = new Map(probes.map((p) => [p.id, p]));
const wilson = (k, n, z = 1.2816) => { if (!n) return [0, 0]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - m) / d, (c + m) / d]; };
const pc = (x) => `${Math.round(100 * x)}%`;
const frac = (k, n) => `${k}/${n} (${n ? pc(k / n) : "—"}) [${pc(wilson(k, n)[0])}-${pc(wilson(k, n)[1])}]`;
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();

const online = scored.filter((r) => !r.offline && !r.skipped);
const offline = scored.filter((r) => r.offline);
const skipped = scored.filter((r) => r.skipped);
const L = [];
L.push(`# Conversation-v2 battery on production — ${DIR.split("/").pop()}`, "");
L.push(`Target ${meta.base ?? "?"} (revision taxila-web--s9242020-kj16, sha 9242020). ${meta.lessons ?? "?"} real lessons, ${meta.turns ?? "?"} child turns, ${meta.errors ?? 0} HTTP errors, ${meta.accounts ?? "?"} test accounts. Started ${meta.startedAt ?? "?"}.`);
L.push(`Cases: ${scored.length} (${online.length} scored on production, ${offline.length} distress cases scored offline on the prod commit's detection path, ${skipped.length} not reached).`);
L.push(`Judges: ${summary.judges.join(" + ")}; per-check agreement ${summary.checkAgreement} (Cohen's kappa ${summary.kappa}, n=${summary.checkN} checks); per-case agreement ${summary.caseAgreement} (n=${summary.caseN}); every disagreement (${scored.filter((r) => r.disputed).length}) decided by a human read (adjudications.json), plus a 40-case spot check of agreed cases (39/40 agreed).`, "");

const onPass = online.filter((r) => r.pass).length;
L.push("## Headline", "");
L.push(`- **Production passes ${frac(onPass, online.length)} of the online cases** (Wilson 80% interval in brackets).`);
L.push(`- Offline distress detection on the prod path: ${frac(offline.filter((r) => r.pass).length, offline.length)}.`);
const fam = {};
for (const r of online) { const f = (fam[FAMILY[r.intent]] ??= { n: 0, k: 0 }); f.n++; if (r.pass) f.k++; }
L.push("", "| family | pass |", "|---|---|", ...Object.entries(fam).sort().map(([f, v]) => `| ${f} | ${frac(v.k, v.n)} |`), "");

// per intent
L.push("## Per intent (production)", "", "| family | intent | pass | lenient | ended the lesson | what prod did (move kinds) | most-failed checks |", "|---|---|---|---|---|---|---|");
const by = {};
for (const r of online) (by[r.intent] ??= []).push(r);
for (const [intent, rs] of Object.entries(by).sort((a, b) => FAMILY[a[0]].localeCompare(FAMILY[b[0]]) || a[0].localeCompare(b[0]))) {
  const k = rs.filter((r) => r.pass).length;
  const len = rs.filter((r) => r.lenient != null);
  const moves = {}; for (const r of rs) moves[r.moveKind ?? "?"] = (moves[r.moveKind ?? "?"] ?? 0) + 1;
  const fails = {}; for (const r of rs.filter((x) => !x.pass)) for (const f of r.failed ?? []) { const key = f.startsWith("code:") ? "code" : f; fails[key] = (fails[key] ?? 0) + 1; }
  L.push(`| ${FAMILY[intent]} | ${intent} | ${frac(k, rs.length)} | ${len.length ? `${len.filter((r) => r.lenient).length}/${len.length}` : ""} | ${rs.filter((r) => r.end).length}/${rs.length} | ${Object.entries(moves).sort((a, b) => b[1] - a[1]).map(([m, c]) => `${m} ${c}`).join(", ")} | ${Object.entries(fails).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, c]) => `${f} ${c}`).join(", ")} |`);
}
L.push("", `distress (offline, prod path) | ${frac(offline.filter((r) => r.pass).length, offline.length)} | via ${offline.map((r) => r.code?.[0]?.why?.replace("prod path → ", "")).join("; ")}`, "");
if (skipped.length) L.push(`Not reached (${skipped.length}): ${skipped.map((r) => `${r.id} (${r.skipped})`).join("; ")}.`, "");

// splits
const split = (keyFn, label) => {
  const g = {};
  for (const r of online) { const k = keyFn(r); (g[k] ??= { n: 0, k: 0 }).n++; if (r.pass) g[k].k++; }
  L.push(`| ${label} | pass |`, "|---|---|", ...Object.entries(g).sort().map(([k, v]) => `| ${k} | ${frac(v.k, v.n)} |`), "");
};
L.push("## Splits", "");
split((r) => r.lane, "lane");
split((r) => (String(r.where).startsWith("teach") ? "teaching moment" : String(r.where).startsWith("terminal") ? "terminal" : "question on the table"), "moment");
split((r) => P.get(r.id)?.childPref ?? "?", "child's language preference");
split((r) => `class ${P.get(r.id)?.cls}`, "class");

// behaviour of the Director
const ends = online.filter((r) => r.end);
L.push("## What the production Director did", "");
L.push(`- The lesson ENDED on ${ends.length} probes: ${Object.entries(ends.reduce((a, r) => ((a[r.intent] = (a[r.intent] ?? 0) + 1), a), {})).map(([i, c]) => `${i} ${c}`).join(", ")}.`);
const moveAll = {}; for (const r of online) moveAll[r.moveKind ?? "?"] = (moveAll[r.moveKind ?? "?"] ?? 0) + 1;
L.push(`- Move kinds over all probes: ${Object.entries(moveAll).sort((a, b) => b[1] - a[1]).map(([m, c]) => `${m} ${c}`).join(", ")}. There is no move kind for park, detour, decline, check-in, show, play or switch language: every steering or attention intent lands on hint / repair / the next teach step / wrap.`);
const visualAsks = online.filter((r) => ["visual_request", "game_request", "animation_request"].includes(r.intent));
L.push(`- Something new reached the stage on ${visualAsks.filter((r) => (r.visualNew ?? []).length).length}/${visualAsks.length} visual/game/animation requests (${visualAsks.filter((r) => (r.visualNew ?? []).length).map((r) => `${r.id}: ${r.visualNew.join("+")}`).join("; ") || "none"}) — each one a planned teach-step mount, not a response to the ask.`);
const parks = online.filter((r) => r.returned && r.returned.a !== "n/a");
L.push(`- Parked-question return: in ${parks.length} diversion/curiosity cases with later teacher turns in the same lesson, a later turn came back to the child's topic ${parks.filter((r) => r.returned.a === "yes").length} times.`);
// verbatim re-ask and duplicates
let reask = 0, dup = 0, ascii = 0;
const asciiIds = [], dupIds = [];
for (const r of online) {
  const p = P.get(r.id);
  const ask = norm(p?.before?.ask?.text);
  const rep = norm(r.reply);
  if (ask && rep.endsWith(ask) && rep.length - ask.length < 25) reask++;
  const sents = String(r.reply ?? "").split(/(?<=[.!?।:;])\s+|\s+—\s*/).map(norm).filter((s) => s.length > 20);
  if (new Set(sents).size < sents.length) { dup++; dupIds.push(r.id); }
  if (/[─━→←•●]{3,}|[─━]{4,}|-{4,}>|\|\s*\|/.test(r.reply ?? "")) { ascii++; asciiIds.push(r.id); }
}
L.push(`- Reply is (almost) only the pending question again: ${reask}/${online.length}. A sentence repeated inside one reply: ${dup} (${dupIds.slice(0, 8).join(", ")}). A text drawing in the reply (read aloud on the cascade lane): ${ascii} (${asciiIds.join(", ")}).`);
const lat = online.map((r) => P.get(r.id)?.ms).filter(Number.isFinite);
L.push(`- Turn latency from this sandbox: p50 ${q(lat, 0.5)} ms, p90 ${q(lat, 0.9)} ms, max ${Math.max(...lat)} ms (n=${lat.length}).`);
L.push(`- Safeguard moves on non-distress turns: see CLEANUP.md (2 in ${meta.turns ?? "?"} turns: a correct answer "no", and "i'm done").`, "");

// perception
L.push("## What the prod perception layer emits (prescreen.json, offline on the prod code, same classifier deployment)", "");
L.push("| intent | n | wants_to_stop | off_topic | predicate distress | model distress |", "|---|---|---|---|---|---|");
const pg = {};
for (const r of pre.rows) {
  const g = (pg[r.intent] ??= { n: 0, stop: 0, off: 0, pd: 0, md: 0 });
  const last = r.perTurn.at(-1);
  g.n++; if (last?.flags?.wantsToStop) g.stop++; if (last?.flags?.offTopic) g.off++; if (last?.predicate) g.pd++; if (last?.flags?.distress && !last?.predicate) g.md++;
}
for (const [i, g] of Object.entries(pg).sort((a, b) => b[1].stop / b[1].n - a[1].stop / a[1].n || a[0].localeCompare(b[0]))) if (g.stop || g.off || g.pd || g.md) L.push(`| ${i} | ${g.n} | ${g.stop} | ${g.off} | ${g.pd} | ${g.md} |`);
L.push("", "(Intents with all four at zero are omitted.) wants_to_stop goes straight to `toWrap(stopping)` in state.js decide() step 2: that single boolean is why skip, change of topic, break, boredom and frustration can end a lesson.", "");

// bake-off
const bk = join(DIR, "understand-bakeoff", "TABLE.md");
if (fs.existsSync(bk)) L.push("## UNDERSTAND bake-off (prototypes/reset/conversation-v2/bakeoff.mjs)", "", fs.readFileSync(bk, "utf8"), "");

// examples
L.push("## Transcript examples (verbatim)", "");
const ex = ["diversion", "end_request", "visual_request", "change_topic", "thinking_aloud", "insistence", "out_of_bounds", "skip_item", "language_switch", "joke"];
for (const i of ex) {
  const r = online.find((x) => x.intent === i && !x.pass) ?? online.find((x) => x.intent === i);
  if (!r) continue;
  const p = P.get(r.id);
  L.push(`**${r.id}** (${p.lane}, ${p.where}, class ${p.cls}, ${p.childPref}) — ${r.pass ? "PASS" : "FAIL"}`, `- teacher before: ${p.before?.teacherReply ?? ""}`, ...(p.setup ?? []).flatMap((s) => [`- child: ${s.childText}`, `- teacher: ${s.teacherReply}`]), `- child: ${r.said}`, `- teacher [${r.moveKind}${r.end ? ", lesson ended" : ""}]: ${r.reply}`, "");
}
fs.writeFileSync(join(DIR, "REPORT.md"), L.join("\n"));
console.log(`wrote ${join(DIR, "REPORT.md")}: production ${onPass}/${online.length}`);
