// W2-F acceptance (BUILD-PLAN §4 W2-F; LIVE-STUDIO §11): the Studio build system in production.
//   A. The gate service (studio-qa): with STUDIO_QA_URL (+ STUDIO_QA_TOKEN) set, every hand golden passes at its params
//      and at its held-out params, a seeded mutant per probe kind is refused, an unauthenticated call is refused, and
//      the gate's time over n ≥ 30 calls is p50 ≤ 12 s / p90 ≤ 18 s ("Gate on Azure"). Without STUDIO_QA_URL this part
//      is reported as not run (never as a pass).
//   B. The live whiteboard (owner priority 6), through the production lesson API: a text lesson walked to its
//      explanation beats. At least one board must reach the client across the 4 lessons (FAIL otherwise;
//      W2F_ALLOW_NO_WB=1 turns that into a WARN for runs before W2-E lets the ask through the attention budget). Every
//      board that arrives is RE-GATED here with the full whiteboard gate (qa/whiteboard.js W0-W9: shape, stage, labels
//      anchored, numbers from her line or the verified kit, counts, and W9 no reveal: never the answer of a kit item she
//      has not said), carries the line anchor, never the child's name, and arrives ≤ 6 s after the turn's reply. Sync:
//      the estimated lateness (arrival − the reply − W2F_AUDIO_MS, default 700 ms until her audio starts) has p90 ≤ 1.5 s
//      (the production number is POST /api/studio/wb-timing's log; this API-only run has no audio).
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/w2f-studio-gate.mjs   (TAXILA_BASE for a local server; STUDIO_QA_URL for A)
import { readFileSync } from "node:fs";
import { withTestAccount, ok, warn, done } from "./lib.mjs";
import { normalizeScript, lintScript } from "../../shared/whiteboard.js";
import { gateWhiteboard, withheldValues } from "../../server/studio/qa/whiteboard.js";
import { redactLine, speechMsOf } from "../../server/studio/plan.js";
import { kitFromFile } from "../../server/content/kits.js";
import { getTopic } from "../../server/content/curriculum.js";

const G = JSON.parse(readFileSync(new URL("../../evals/live-studio/goldens/goldens.json", import.meta.url), "utf8"));
const golden = (id) => readFileSync(new URL(`../../evals/live-studio/goldens/${id}.html`, import.meta.url), "utf8");
const QA = (process.env.STUDIO_QA_URL || "").replace(/\/+$/, "");
const TOKEN = process.env.STUDIO_QA_TOKEN || "";
const PARTS = process.env.W2F_PARTS || "AB";      // run one part alone with W2F_PARTS=A or B
const q = (xs, p) => { const s = xs.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

// ───────────────────────────── A. the gate service ─────────────────────────────
if (!PARTS.includes("A")) warn("A: skipped (W2F_PARTS)");
else if (!QA) warn("A: STUDIO_QA_URL unset: the studio-qa gate service part was NOT run (deploy it with scripts/deploy-studio-qa.mjs)");
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
let wbSlots = 0;
const ALLOW_NO_WB = process.env.W2F_ALLOW_NO_WB === "1";
const AUDIO_MS = Number(process.env.W2F_AUDIO_MS) || 700;
const kitOf = (topicId) => { try { return kitFromFile(getTopic(topicId)); } catch { return null; } };
for (const topicId of PARTS.includes("B") ? TOPICS : []) {
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  await withTestAccount(async ({ api, child }) => {
    const start = await api("POST", "/api/lesson/start", { childId: child.id, topicId, mode: "text" });
    let seq = 0;
    const seen = (ui, reply, afterMs = 0) => {
      const art = ui?.studioSlot?.artifact;
      if (art?.kind === "whiteboard") boards.push({ topicId, script: art.script, reply, afterMs, name: child.first_name ?? child.name ?? "" });
    };
    seen(start.ui, start.teacherOpening);
    for (const childText of LINES) {
      const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText, asrConfidence: 0.95, typed: true, turnSeq: ++seq });
      const replyAt = performance.now();
      seen(r.ui, r.teacherReply);
      // The turn answers with the slot in state "planning"; the script follows on the Studio channel (StudioWire
      // {t:"script"}) a few seconds later. Converge on it the way a late-mounting stage does (GET /api/studio/slot).
      const slot = r.ui?.studioSlot;
      if (slot?.intentId && /:wb:/.test(slot.intentId) && !slot.artifact) {
        wbSlots++;
        for (let k = 0; k < 60; k++) {
          await new Promise((res) => setTimeout(res, 200));
          // GET /api/studio/slot answers { slot } (routes/studio.js); the earlier version read the wrapper and never saw a board
          const s = (await api("GET", `/api/studio/slot?lessonId=${start.lessonId}&intentId=${encodeURIComponent(slot.intentId)}`, undefined, [200, 404]).catch(() => null))?.slot;
          if (s?.artifact || (s?.state && s.state !== "planning")) { seen({ studioSlot: s }, r.teacherReply, Math.round(performance.now() - replyAt)); break; }
        }
      }
      if (r.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
  }, { child: { classLevel }, tag: "w2f" });
}
if (PARTS.includes("B")) warn(`B: ${wbSlots} whiteboard slots opened, ${boards.length} boards reached the client (a slot whose board the gate refused, e.g. W9, stays empty by design)`);
if (PARTS.includes("B") && !boards.length) {
  const msg = `B: no whiteboard artifact reached the client in ${TOPICS.length} lessons (${wbSlots} whiteboard slots opened). With 0 slots the kernel refused every ask: on the text lane an explain move that shows chips costs the one attention unit (director/proposal.js), so ask_whiteboard is rejected over_budget.attention (W2-E)`;
  if (ALLOW_NO_WB) warn(`${msg} [W2F_ALLOW_NO_WB=1]`); else ok(false, msg);
}
for (const b of boards) {
  const n = normalizeScript(b.script, { strict: true });
  const lint = n.script ? lintScript(n.script) : [{ check: "invalid" }];
  const words = (n.script?.ops ?? []).filter((o) => o.op === "text" || o.op === "label").map((o) => o.text).join(" | ");
  ok(n.ok && lint.length === 0 && n.script.anchor === "line_audio_start", `B: ${b.topicId}: whiteboard script passes strict shape + stage lint (${n.errors.join(",") || lint.map((i) => i.check).join(",") || "ok"})`);
  ok(!b.name || !new RegExp(`\\b${b.name}\\b`, "i").test(words), `B: ${b.topicId}: the child's name is not on the board`);
  ok((n.script?.ops ?? []).filter((o) => o.op === "label").every((o) => o.to || o.target), `B: ${b.topicId}: every label has a leader`);
  // the full gate again, on what the client received: the planner's reply view (vocative and name redacted) and the kit
  const line = redactLine(b.reply, b.name ? [b.name] : []);
  const kit = kitOf(b.topicId);
  const g = gateWhiteboard(b.script, { reply: line, kit: kit ?? undefined, speechMs: speechMsOf(b.reply), banned: b.name ? [b.name] : [], withhold: withheldValues(kit, { line }) });
  ok(g.pass, `B: ${b.topicId}: the received board passes the whiteboard gate W0-W9 again (${g.checks.filter((c) => !c.pass).map((c) => `${c.id} ${JSON.stringify(c.detail).slice(0, 80)}`).join("; ") || "ok"})`);
  if (b.afterMs) ok(b.afterMs <= 6000, `B: ${b.topicId}: the board arrived ${b.afterMs} ms after the reply (≤ 6 s)`);
}
const late = boards.filter((b) => b.afterMs).map((b) => b.afterMs - AUDIO_MS);
if (late.length) ok(q(late, 0.9) <= 1500, `B: sync: estimated lateness after her audio starts p50 ${q(late, 0.5)} ms, p90 ${q(late, 0.9)} ms ≤ 1500 ms (n = ${late.length}; arrival − reply − ${AUDIO_MS} ms; the client draws a late board on her clock, clock.ts)`);
done();
