// W2-F acceptance (BUILD-PLAN §4 W2-F; LIVE-STUDIO §11): the Studio build system in production.
//   A. The gate service (studio-qa): with STUDIO_QA_URL (+ STUDIO_QA_TOKEN) set, every hand golden passes at its params
//      and at its held-out params, a seeded mutant per probe kind is refused, an unauthenticated call is refused, and
//      the gate's time over n ≥ 30 calls is p50 ≤ 12 s / p90 ≤ 18 s ("Gate on Azure"). Without STUDIO_QA_URL this part
//      is reported as not run (never as a pass).
//   B. The live whiteboard (owner priority 6), through the production lesson API: a text lesson walked to its
//      explanation beats; every whiteboard artifact that reaches the client (ui.studioSlot.artifact.kind = whiteboard,
//      or a StudioWire script) is a script that passes the W2-F whiteboard gate's shape and stage checks (strict
//      normalise, inside the board, no overlapping words, labels anchored), carries the line anchor and never the
//      child's name. Until W2-E/W2-H wire the slot, no artifact arrives and the part says so (WARN, not FAIL).
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/w2f-studio-gate.mjs   (TAXILA_BASE for a local server; STUDIO_QA_URL for A)
import { readFileSync } from "node:fs";
import { withTestAccount, ok, warn, done } from "./lib.mjs";
import { normalizeScript, lintScript } from "../../shared/whiteboard.js";

const G = JSON.parse(readFileSync(new URL("../../evals/live-studio/goldens/goldens.json", import.meta.url), "utf8"));
const golden = (id) => readFileSync(new URL(`../../evals/live-studio/goldens/${id}.html`, import.meta.url), "utf8");
const QA = (process.env.STUDIO_QA_URL || "").replace(/\/+$/, "");
const TOKEN = process.env.STUDIO_QA_TOKEN || "";
const q = (xs, p) => { const s = xs.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

// ───────────────────────────── A. the gate service ─────────────────────────────
if (!QA) warn("A: STUDIO_QA_URL unset: the studio-qa gate service part was NOT run (deploy it with scripts/deploy-studio-qa.mjs)");
else {
  const post = async (job, auth = true) => {
    const t = Date.now();
    const res = await fetch(`${QA}/gate`, { method: "POST", headers: { "content-type": "application/json", ...(auth && TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) }, body: JSON.stringify(job) });
    return { status: res.status, body: res.ok ? await res.json() : null, ms: Date.now() - t };
  };
  const health = await fetch(`${QA}/healthz`).then((r) => r.json()).catch(() => null);
  ok(health?.ok === true, `A: studio-qa healthy (${health?.version ?? "no answer"})`);
  if (TOKEN) ok((await post({ archetypeId: "bar_chart_read", fragment: "<div></div>" }, false)).status === 401, "A: an unauthenticated gate call is refused");
  const times = [];
  const jobs = [];
  for (const id of Object.keys(G)) for (const which of ["params", "alt"]) if (G[id][which]) jobs.push({ id, which });
  for (let round = 0; times.length < 30; round++) {
    for (const { id, which } of jobs) {
      const r = await post({ archetypeId: id, fragment: golden(id), params: G[id][which], strings: G[id][`${which}Strings`] ?? G[id].strings, band: G[id].band });
      times.push(r.ms);
      if (round === 0) ok(r.status === 200 && r.body?.pass === true, `A: golden ${id} (${which}) passes on studio-qa (${r.ms} ms${r.body?.pass ? "" : `: ${JSON.stringify((r.body?.checks ?? []).filter((c) => !c.pass)).slice(0, 160)}`})`);
      if (times.length >= 30 && round > 0) break;
    }
  }
  const MUT = [["shade_fraction", 'Studio.answer({n:n,d:items[k].d});', 'Studio.answer({n:3,d:4});'],
    ["bar_chart_read", "var h=d.value*sc;", "var h=Math.sqrt(d.value/top)*H;"],
    ["hub_flows", "var paths={water:[[201,168],[201,92]],", "var paths={water:[[201,92],[201,168]],"]];
  for (const [id, find, rep] of MUT) {
    const r = await post({ archetypeId: id, fragment: golden(id).split(find).join(rep), params: G[id].params, strings: G[id].strings, band: G[id].band });
    ok(r.status === 200 && r.body?.pass === false, `A: a seeded ${id} mutant is refused (${(r.body?.checks ?? []).filter((c) => !c.pass).map((c) => c.id).slice(0, 3).join(",")})`);
  }
  const p50 = q(times, 0.5), p90 = q(times, 0.9);
  ok(p50 <= 12_000 && p90 <= 18_000, `A: gate on Azure p50 ${p50} ms ≤ 12 s, p90 ${p90} ms ≤ 18 s (n = ${times.length})`);
}

// ───────────────────────────── B. the live whiteboard through the lesson API ─────────────────────────────
const TOPICS = ["c5-maths-ch02-t01", "c4-maths-ch05-t01", "c6-maths-ch07-t01", "c7-science-ch01-t01"];
const LINES = ["haan, main ready hoon", "samjhao na", "mujhe nahi pata", "ek example dikhao", "ok", "haan", "theek hai", "samajh nahi aaya"];
const boards = [];
for (const topicId of TOPICS) {
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  await withTestAccount(async ({ api, child }) => {
    const start = await api("POST", "/api/lesson/start", { childId: child.id, topicId, mode: "text" });
    let seq = 0;
    const seen = (ui, reply) => {
      const art = ui?.studioSlot?.artifact;
      if (art?.kind === "whiteboard") boards.push({ topicId, script: art.script, reply, name: child.first_name ?? child.name ?? "" });
    };
    seen(start.ui, start.teacherOpening);
    for (const childText of LINES) {
      const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText, asrConfidence: 0.95, typed: true, turnSeq: ++seq });
      seen(r.ui, r.teacherReply);
      if (r.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
  }, { child: { classLevel }, tag: "w2f" });
}
if (!boards.length) warn(`B: no whiteboard artifact reached the client in ${TOPICS.length} lessons (the slot is wired by W2-E/W2-H; the script arrives on the SSE channel once they land)`);
for (const b of boards) {
  const n = normalizeScript(b.script, { strict: true });
  const lint = n.script ? lintScript(n.script) : [{ check: "invalid" }];
  const words = (n.script?.ops ?? []).filter((o) => o.op === "text" || o.op === "label").map((o) => o.text).join(" | ");
  ok(n.ok && lint.length === 0 && n.script.anchor === "line_audio_start", `B: ${b.topicId}: whiteboard script passes strict shape + stage lint (${n.errors.join(",") || lint.map((i) => i.check).join(",") || "ok"})`);
  ok(!b.name || !new RegExp(`\\b${b.name}\\b`, "i").test(words), `B: ${b.topicId}: the child's name is not on the board`);
  ok((n.script?.ops ?? []).filter((o) => o.op === "label").every((o) => o.to || o.target), `B: ${b.topicId}: every label has a leader`);
}
done();
