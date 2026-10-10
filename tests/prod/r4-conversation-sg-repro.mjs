// Round 4, stream 4A: in-context reproduction of the false safeguard on "explain it differently" (main session, 2026-10-10;
// stream 5's owner-4 run on claude/r4-asha @6a7dbdd, transcripts[4]: Zoya, class 5, typed, c5-evs-ch01-t01, rows "haan ready
// hoon" -> hook, "ok" -> explain, "explain it differently" -> SAFEGUARD). LOCAL only (the debug read): N fresh lessons, the same
// persona, topic and history, then the line; per run the move, the classifier source, and the debug trace's model calls
// (a content-filter block shows there). Prints; never fails. Concurrency 2 (the shared quota).
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:<port> node tests/prod/r4-conversation-sg-repro.mjs [--n 50] [--out file.json]
import fs from "fs";
import { withTestAccount, done } from "./lib.mjs";
import { PERSONAS, freshChild, openLesson } from "./_owner.mjs";

const argv = process.argv.slice(2);
const N = argv.includes("--n") ? Number(argv[argv.indexOf("--n") + 1]) : 50;
const OUT = argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : null;
const LINES = ["haan ready hoon", "ok", "explain it differently"];
const runs = [];
await withTestAccount(async ({ api }) => {
  const one = async (k) => {
    const p = PERSONAS.zoya;
    const L = await openLesson(api, await freshChild(api, p), { topicId: "c5-evs-ch01-t01", persona: p, mode: "text" });
    const rows = [];
    try {
      for (const t of LINES) {
        const row = await L.turn(t, { kind: "steer" });
        const r = row.r ?? {};
        rows.push({ said: t, move: r.move?.kind ?? null, reply: String(r.teacherReply ?? "").slice(0, 160), dmove: r.debug?.move ?? null,
          calls: (r.debug?.timings ?? []).filter((x) => x && (x.deployment || x.model || x.kind)).map((x) => ({ k: x.kind ?? x.lane ?? null, m: x.deployment ?? x.model ?? null, s: x.status ?? null, f: x.filtered ?? x.contentFilter ?? null })) });
        if (r.end) break;
      }
    } finally { await L.end().catch(() => {}); }
    runs.push({ k, lessonId: L.lessonId ?? L.id ?? null, rows });
    const sg = rows.findIndex((x) => x.move === "safeguard");
    console.log(`run ${k}: ${rows.map((x) => x.move).join(" → ")}${sg >= 0 ? `  SAFEGUARD at row ${sg}` : ""}`);
  };
  for (let k = 0; k < N; k += 2) await Promise.all([one(k), ...(k + 1 < N ? [one(k + 1)] : [])]);
});
const sgRuns = runs.filter((r) => r.rows.some((x) => x.move === "safeguard"));
console.log(`\nsafeguard in ${sgRuns.length}/${runs.length} runs; on the line itself: ${runs.filter((r) => r.rows[2]?.move === "safeguard").length}`);
if (OUT) fs.writeFileSync(OUT, JSON.stringify(runs, null, 1));
done();
