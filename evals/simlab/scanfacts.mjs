// The server's own distress attribution per turn (flight recorder `safety.scan`: sources classify_model / classify_words /
// predicate / content_filter / episode_open …), read from the TEST database's trace_event rows by lesson id. A deleted
// test account's rows cascade away, but a safeguarded lesson's account is kept (its deletion needs a safeguarding
// review), so the lessons that matter here keep their rows.
//   node evals/simlab/scanfacts.mjs <run-dir>   → <run-dir>/SAFETY-SCAN.json and a per-lesson summary on stdout
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import "./lib.mjs"; // loads .env.local

const dir = process.argv[2];
if (!dir) throw new Error("usage: scanfacts.mjs <run-dir>");
const url = process.env.DATABASE_URL ?? "";
if (!url.includes(process.env.SIMLAB_DB_HOST || "ep-winter-tooth")) throw new Error("not the TEST database: refusing");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

const out = [];
for (const f of readdirSync(join(dir, "records")).filter((f) => f.endsWith(".json")).sort()) {
  const r = JSON.parse(readFileSync(join(dir, "records", f), "utf8"));
  if (!r.lessonId) continue;
  const rows = await sql.query("select turn, data from trace_event where sid = $1 and kind = 'safety.scan' order by turn", [r.lessonId]);
  const byTurn = new Map(rows.map((x) => [x.turn, x.data]));
  const scripted = new Set(r.turns.filter((t) => /^\(scripted/.test(t.child?.private ?? "")).map((t) => t.n));
  // the server's turn counter can run ahead of the lab's child turn number (opening turns); match by the lab's n first, and
  // report the server turns too so a reader can line them up
  const sg = r.turns.filter((t) => t.move === "safeguard").map((t) => t.n);
  const distressTurns = rows.filter((x) => x.data?.distress).map((x) => ({ turn: x.turn, sources: x.data.sources, kind: x.data.kind, safeguardMove: x.data.safeguardMove, episodeOpen: x.data.episodeOpen }));
  out.push({ persona: r.persona, arm: r.arm, lane: r.lane, lessonId: r.lessonId, scripted: [...scripted], safeguardTurns: sg, traced: rows.length, distressTurns });
  if (sg.length || distressTurns.length) console.log(`${r.persona} ${r.arm}/${r.lane} ${r.lessonId} sg=[${sg}] scripted=[${[...scripted]}] traced=${rows.length} ${distressTurns.map((d) => `#${d.turn}:${d.sources.join("+")}${d.kind ? `(${d.kind})` : ""}`).join(" ")}`);
}
writeFileSync(join(dir, "SAFETY-SCAN.json"), JSON.stringify(out, null, 1));
console.log(`${out.length} lessons, ${out.filter((x) => x.traced).length} with trace rows`);
