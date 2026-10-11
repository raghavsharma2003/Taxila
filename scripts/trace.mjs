#!/usr/bin/env node
// Release 12, the flight recorder: read the recorded sessions (TRACKING-BRIEF.md §Access). Main runs it with production read
// access; streams run it against TEST only (TAXILA_DB=test).
//
//   node --env-file=.env.local scripts/trace.mjs --recent [--guardian <email|sha256>] [--child <id-prefix>] [--limit 20]
//   node --env-file=.env.local scripts/trace.mjs --session <lesson-id | child-id-prefix | pid> [--from hh:mm[:ss]] [--to hh:mm[:ss]] [--json] [--all]
//   node --env-file=.env.local scripts/trace.mjs --flags [--since 2026-10-11]
//   node --env-file=.env.local scripts/trace.mjs --replay <session> --at hh:mm:ss[,...] [--out dir]   (T-client's scripts/trace-replay.mjs)
//
// --session prints ONE merged, time-ordered timeline: the child (said / tapped), the teacher (said, and whether it played),
// the screen (stage, board page cleared or overlaid, images), every server decision with its reasons, every model call with a
// pointer to its prompt, every error. The owner's flags are marked ★. Times are UTC. --all also prints the srv.req / net.req
// noise that the default view folds into the matching response.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function db() { const { q } = await import("../server/db.js"); return q; }
const hhmmss = (d) => new Date(d).toISOString().slice(11, 23);
const cut = (s, n = 140) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const j = (v) => (v == null ? "" : typeof v === "string" ? v : JSON.stringify(v));

/** A human line per event kind (what the owner and main read). Unknown kinds print their data compactly. */
export function lineFor(e) {
  const d = e.data ?? {};
  const k = e.kind;
  const flag = k === "flag.owner" ? "★ " : "";
  const bad = /(^err\.|\.error$|\.failed$|\.fail$|\.refused$|^net\.err$|^trace\.dropped$|\.timeout$|\.interrupt$)/.test(k) || (k === "srv.res" && Number(d.status) >= 500) ? "⚠ " : "";
  const who = e.src === "client" ? "client" : e.src === "worker" ? "worker" : "server";
  let s;
  switch (k) {
    case "flag.owner": s = `OWNER FLAG${d.note ? `: "${cut(d.note, 200)}"` : ""}`; break;
    case "asr.final": s = `child said "${cut(d.text, 200)}"${d.confidence != null ? ` conf=${d.confidence}` : ""}${Array.isArray(d.alternatives) && d.alternatives.length ? ` alts=${j(d.alternatives.slice(0, 3))}` : ""}${d.msFromEnd != null ? ` +${d.msFromEnd}ms` : ""}`; break;
    case "asr.partial": s = `child (partial) "${cut(d.text, 120)}"`; break;
    case "ui.tap": s = `tap ${d.role ?? ""} "${cut(d.label ?? d.testId ?? "", 80)}"${d.testId ? ` [${d.testId}]` : ""}`; break;
    case "ui.route": s = `route ${d.path ?? ""}`; break;
    case "ui.render.stage": s = `SCREEN stage=${d.kind ?? d.artifact ?? "?"}${d.mountId ? ` mount=${d.mountId}` : ""}${d.pageSeq != null ? ` page=${d.pageSeq}` : ""}${d.ops != null ? ` ops=${d.ops}` : ""}${d.cleared === true ? " CLEARED" : d.cleared === false ? " OVERLAID" : ""}`; break;
    case "ui.render.card": s = `SCREEN card "${cut(d.text, 160)}"`; break;
    case "ui.chips": s = `SCREEN chips ${j(d.chips ?? d.shown)}${d.chosen ? ` chosen=${j(d.chosen)}` : ""}`; break;
    case "ui.state": s = `desk ${d.state ?? j(d)}`; break;
    case "ui.image.load": s = `image loaded ${cut(d.src, 80)} ${d.ms ?? ""}ms`; break;
    case "ui.image.error": s = `IMAGE FAILED ${cut(d.src, 80)}`; break;
    case "tts.request": s = `she will say "${cut(d.text, 200)}"`; break;
    case "tts.start": s = `she starts speaking${d.text ? ` "${cut(d.text, 120)}"` : ""}`; break;
    case "tts.end": s = `she finished${d.full === false || d.cut ? " (CUT OFF)" : ""}${d.ms != null ? ` ${d.ms}ms` : ""}`; break;
    case "tts.interrupt": s = `she was interrupted${d.atMs != null ? ` at ${d.atMs}ms` : ""}`; break;
    case "mic.mode": s = `mic mode ${d.mode}${d.why ? ` (why: ${cut(d.why, 80)})` : ""}`; break;
    case "director.turn": {
      const acc = (d.accepted ?? []).map((x) => x.kind).join(",");
      const rej = (d.rejected ?? []).map((x) => `${x.kind}:${x.why}`).join(",");
      s = `TURN ${e.turn ?? ""} move=${d.move}${d.beat ? ` beat=${d.beat}` : ""}${d.itemId ? ` item=${d.itemId}` : ""}${d.guard?.caught?.length ? ` guard=${d.guard.caught.join("+")}${d.guard.rewritten ? "(rewritten)" : ""}` : ""}`
        + `\n            she says: "${cut(d.teacherReply, 400)}"`
        + (acc ? `\n            accepted: ${acc}` : "") + (rej ? `\n            rejected: ${rej}` : "")
        + (d.rungReplaced ? `\n            rung replaced: ${j(d.rungReplaced.replaced)} by ${j(d.rungReplaced.by)} — ${d.rungReplaced.why}` : "")
        + (d.speculation && !d.speculation.hit ? `\n            speculation miss: ${cut(j(d.speculation.differs), 300)}` : "")
        + (d.studio?.reasons?.length ? `\n            studio: ${d.studio.reasons.join(", ")}` : "")
        + `\n            reasons: ${(d.reasons ?? []).join(" ")}`;
      break;
    }
    case "model.call": s = `model ${d.deployment} ${d.kind} ${d.status} ${d.ms}ms${d.tokens ? ` in=${d.tokens.in} out=${d.tokens.out}` : ""}${d.promptId ? ` prompt="${cut(d.promptId, 60)}" sha=${d.promptSha}` : ""}${d.blob?.ref ? ` blob=${d.blob.ref}` : ""}${d.error ? ` ERROR ${cut(d.error, 120)}` : ""}${d.output ? `\n            → "${cut(d.output, 240)}"` : ""}`; break;
    case "classify.verdict": s = `classify ${d.outcome} via ${d.source}${d.verdict ? ` verdict=${d.verdict}` : ""}${d.misconceptionId ? ` misc=${d.misconceptionId}` : ""}`; break;
    case "safety.scan": s = `safety distress=${d.distress}${d.sources?.length ? ` sources=${d.sources.join("+")}` : ""}${d.kind ? ` kind=${d.kind}` : ""}`; break;
    case "board.page": s = `BOARD page ${d.seq} ${d.clears ? "CLEARS the board" : "DRAWS OVER the last page"} ops=${d.ops}${d.texts?.length ? ` "${cut(d.texts.join(" | "), 200)}"` : ""}`; break;
    case "studio.rung_replaced": s = `rung replaced ${j(d.replaced)} → ${j(d.by)}: ${d.why}`; break;
    case "turn.speculation_miss": s = `speculation miss (${d.tried}): ${cut(j(d.differs), 300)}`; break;
    case "srv.res": s = `← ${d.route} ${d.status} ${d.ms}ms${d.err ? ` ${d.err}` : ""}`; break;
    case "srv.req": s = d.body?.childText ? `CHILD → "${cut(d.body.childText, 200)}" (${d.route})` : `→ ${d.route}`; break;
    case "net.res": s = `net ${d.method ?? ""} ${d.path ?? ""} ${d.status ?? ""} ${d.ms ?? ""}ms`; break;
    case "net.err": s = `NETWORK ERROR ${d.method ?? ""} ${d.path ?? ""} ${cut(d.error ?? d.message, 120)}`; break;
    case "err.js": case "err.promise": s = `CLIENT ERROR ${cut(d.message, 200)}${d.top ? ` at ${cut(d.top, 100)}` : ""}`; break;
    case "trace.dropped": s = `RECORDER DROPPED ${d.dropped} events (total ${d.total})`; break;
    default:
      if (k.startsWith("studio.slot.")) { s = `studio slot ${k.slice(12)} ${d.kind ?? ""}${d.intentId ? ` intent=${cut(d.intentId, 40)}` : ""}${d.why ? ` why: ${cut(d.why, 160)}` : ""}${d.fallback ? ` fallback=${d.fallback}` : ""}`; break; }
      s = `${k} ${cut(j(d), 220)}`;
  }
  return `${hhmmss(e.t)} ${flag}${bad}[${who}${e.turn != null ? ` t${e.turn}` : ""}] ${s}`;
}

/** Resolve a session argument to the trace sids (+ the page loads that led into it). */
async function resolve(q, key) {
  if (UUID.test(key)) {
    const pids = await q("select distinct pid from trace_event where sid = $1 and pid is not null", [key]);
    return { sids: [key], pids: pids.map((r) => r.pid) };
  }
  if (/^[0-9a-f-]{4,35}$/i.test(key)) { // a child id prefix → that child's latest session
    const r = await q("select sid from trace_event where cid::text like $1 order by t desc limit 1", [`${key}%`]);
    if (r[0]) return resolve(q, r[0].sid);
  }
  return { sids: [key], pids: [key] }; // a pid
}

async function session(key) {
  const q = await db();
  const { sids, pids } = await resolve(q, key);
  // events of the session, of the page loads that led into it, and of the same REQUESTS (a lesson start's model calls run
  // before the lesson id exists, under the start request's rid)
  const rows = await q(`with s as (select sid, pid, cid, gid, src, seq, t, kind, turn, rid, tier, data from trace_event
      where sid = any($1::text[]) or (pid is not null and pid = any($2::text[])))
    select * from s
    union
    select e.sid, e.pid, e.cid, e.gid, e.src, e.seq, e.t, e.kind, e.turn, e.rid, e.tier, e.data from trace_event e
      where e.rid in (select rid from s where rid is not null) and e.sid <> all($1::text[])
    order by t, src, seq`, [sids, pids]);
  const day = rows[0] ? new Date(rows[0].t).toISOString().slice(0, 10) : null;
  const at = (hm) => (hm && day ? new Date(`${day}T${hm.length === 5 ? `${hm}:00` : hm}Z`).getTime() : null);
  const from = at(arg("--from")), to = at(arg("--to"));
  const evs = rows.filter((r) => (from == null || new Date(r.t).getTime() >= from) && (to == null || new Date(r.t).getTime() <= to + 999));
  if (has("--json")) { process.stdout.write(JSON.stringify(evs, null, 1) + "\n"); return; }
  const all = has("--all");
  const quiet = new Set(["srv.req", "net.req"]);
  console.log(`session ${key}  sids=${sids.join(",")}  events=${evs.length}${evs[0] ? `  ${new Date(evs[0].t).toISOString()} → ${new Date(evs.at(-1).t).toISOString()}` : ""}`);
  const flags = evs.filter((e) => e.kind === "flag.owner").length;
  const errors = evs.filter((e) => lineFor(e).includes("⚠ ")).length;
  console.log(`flags ★ ${flags}  errors/failures ⚠ ${errors}  turns ${new Set(evs.map((e) => e.turn).filter((x) => x != null)).size}`);
  for (const e of evs) {
    if (!all && quiet.has(e.kind) && !(e.data?.body?.childText)) continue; // the child's words always show
    console.log(lineFor(e));
  }
}

async function recent() {
  const q = await db();
  const g = arg("--guardian"), c = arg("--child"), limit = Number(arg("--limit", "20"));
  const gHash = g ? (/^[0-9a-f]{64}$/i.test(g) ? g.toLowerCase() : createHash("sha256").update(g.trim().toLowerCase()).digest("hex")) : null;
  const rows = await q(`select e.sid, min(e.t) as first, max(e.t) as last, max(e.cid::text) as cid, count(*)::int as events,
      max(e.turn) as turns, count(*) filter (where e.kind like 'err.%' or e.kind like '%.failed' or e.kind like '%.error' or e.kind = 'net.err'
        or e.kind = 'studio.slot.refused' or (e.kind = 'srv.res' and (e.data->>'status')::int >= 500))::int as errors,
      count(*) filter (where e.kind = 'flag.owner')::int as flags, max(l.topic_id) as topic, max(ch.first_name) as child
    from trace_event e left join lesson l on l.id::text = e.sid left join child ch on ch.id = e.cid left join guardian gu on gu.id = e.gid
    where e.t > now() - interval '30 days'
      and ($1::text is null or encode(sha256(lower(gu.email)::bytea), 'hex') = $1)
      and ($2::text is null or e.cid::text like $2 || '%')
    group by e.sid order by max(e.t) desc limit $3`, [gHash, c, limit]);
  for (const r of rows) console.log(`${new Date(r.first).toISOString().slice(0, 16)}  ${r.sid}  child=${r.child ?? "-"} (${(r.cid ?? "").slice(0, 8)})  topic=${r.topic ?? "-"}  turns=${r.turns ?? 0}  events=${r.events}  ⚠${r.errors}  ★${r.flags}`);
  if (!rows.length) console.log("(no sessions)");
}

async function flags() {
  const q = await db();
  const since = arg("--since", new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10));
  const rows = await q("select sid, pid, cid, t, turn, note from trace_flag where t >= $1::timestamptz order by t desc limit 200", [since]);
  for (const r of rows) console.log(`★ ${new Date(r.t).toISOString().slice(0, 19)}Z  ${r.sid}${r.turn != null ? ` turn ${r.turn}` : ""}  "${cut(r.note ?? "", 160)}"\n   → node scripts/trace.mjs --session ${r.sid} --from ${new Date(new Date(r.t).getTime() - 60_000).toISOString().slice(11, 19)} --to ${new Date(new Date(r.t).getTime() + 60_000).toISOString().slice(11, 19)}`);
  if (!rows.length) console.log("(no flags)");
}

async function main() {
  try {
    if (has("--replay")) {
      const script = fileURLToPath(new URL("./trace-replay.mjs", import.meta.url));
      const r = spawnSync(process.execPath, [script, ...argv.filter((a) => a !== "--replay"), ...(arg("--replay") ? [] : [])], { stdio: "inherit" });
      process.exit(r.status ?? 1);
    }
    if (has("--session")) await session(arg("--session") ?? (() => { throw new Error("--session <lesson-id|child-prefix|pid>"); })());
    else if (has("--flags")) await flags();
    else await recent();
  } catch (e) {
    console.error(`[trace] ${e?.message ?? e}`);
    process.exitCode = 1;
  } finally {
    try { const { closeDb } = await import("../server/db.js"); await closeDb?.(); } catch { /* */ }
  }
}
if (import.meta.url === `file://${process.argv[1]}`) main().then(() => process.exit(process.exitCode ?? 0));
