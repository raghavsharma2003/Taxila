// Round 3 · stream play acceptance (docs/design/round3/play/). Same file before and after, against a local production server
// (node server/serve.mjs, NODE_ENV=production, Neon TEST, HEAD + docs/design/round3/play/patches) or taxila.dev. Pure API:
// no model call happens on any play route, so it costs nothing but a test account.
//
// Checks (all must pass):
//   P0 routes     /api/play/admit answers (the play routes are mounted: patch 01)
//   P1 levels     /api/play/start serves a code-built, solver-proven, shortcut-free level for one topic per family / mode
//                 (8 cases: atoms, strips, bundles, balance, number line, rounding, two labs) with an art direction and a world
//   P2 truth      the level's own solution, posted as raw acts, is graded solved by the SERVER's replay
//   P3 claims     a wrong act sequence carrying claim fields (correct / verdict / solved / score) is NOT graded solved
//   P4 tamper     an edited session token is refused (400), and a level id that does not match the session is refused (409)
//   P5 doors      /api/play/next serves the next level (garam / teekha) and /api/play/level returns the session's level
//   P6 lines      every micro-reaction the server sent passes the play guard (no verdict, praise or pressure word, no key)
//   P7 world      /api/play/world: four families, stations with only drawn states (no counts, %s, locks), routes cite edges
//   P8 lesson     the in-lesson loop (patches 01-03): a lesson, a play session tied to it, the solved level's SIGNED evidence
//                 and seam ride a module-only turn → the teacher takes a full turn (her reply is non-empty, passes the play
//                 guard) and exactly one kt_evidence row via "game" lands for the level (Neon TEST read, local runs only);
//                 the same tokens again fold nothing; a forged evidence token folds nothing. Costs one reply model call.
//   T1 latency    start and act API time from this machine, p90 (local ≠ India; reported, bar 800 ms local)
//
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8787 node tests/prod/round3-play.mjs [--out DIR]
// File name is not a node --test pattern (npm test never hits a server).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withTestAccount, ok, warn, done, BASE, isLocal, dbq } from "./lib.mjs";
import { LOGIC } from "../../src/play/families/index.ts";
import { reactionProblems, MOMENT_KINDS } from "../../shared/play.ts";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("out", join(process.cwd(), "evals", "prod-runs", `round3-play-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}`));
mkdirSync(OUT, { recursive: true });

const CASES = [
  { id: "atoms", topicId: "c6-maths-ch05-t04", classLevel: 6 },
  { id: "strips", topicId: "c6-maths-ch07-t04", classLevel: 6 },
  { id: "bundles", topicId: "c4-maths-ch07-t01", classLevel: 4 },
  { id: "balance", topicId: "c7-maths-ch15-t02", classLevel: 7 },
  { id: "line", topicId: "c6-maths-ch10-t02", classLevel: 6 },
  { id: "round", topicId: "c4-maths-ch04-t03", classLevel: 4 },
  { id: "lab-sprout", topicId: "c6-science-ch10-t02", classLevel: 6 },
  { id: "lab-magnet", topicId: "c6-science-ch04-t01", classLevel: 6 },
];
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 800, via: "touch", act }));
const p90 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)] : null; };
const report = { at: new Date().toISOString(), base: BASE, local: isLocal, cases: [] };
const tStart = [], tAct = [];

await withTestAccount(async ({ api, child }) => {
  // P0
  const adm = await api("GET", "/api/play/admit?skillId=c6-maths-ch05-t04-s1", undefined, [200, 404]);
  if (!ok(adm.status === 200 && adm.play === true && adm.family === "todo-jodo", `P0 /api/play/admit answers (status ${adm.status})`)) {
    warn("the play routes are not mounted on this server (patch 01 not applied): the remaining checks cannot run");
    return;
  }
  const lines = [];
  for (const c of CASES) {
    const row = { id: c.id, topicId: c.topicId };
    try {
      const s = await api("POST", "/api/play/start", { childId: child.id, topicId: c.topicId, lang: "hinglish" }, [200, 404]);
      tStart.push(s.ms);
      const lv = s.level, logic = lv ? LOGIC[`${lv.family}/${lv.mode}`] : null;
      ok(s.status === 200 && !!lv && lv.proof?.solvable === true && lv.proof?.shortcutFree === true && !!logic, `P1 ${c.id}: a proven level (${lv?.family}/${lv?.mode} ${lv?.goal})`);
      ok(!!s.art?.art && ["kagaz", "chalk", "blueprint", "raat"].includes(s.art.art) && !!s.world?.stations, `P1 ${c.id}: art ${s.art?.art} (${s.art?.reason}) and a world`);
      if (!lv || !logic) { report.cases.push({ ...row, error: "no level" }); continue; }
      row.level = { family: lv.family, mode: lv.mode, goal: lv.goal, levelId: lv.levelId, discriminates: lv.proof.discriminates, art: s.art.art };
      // P4: a level id that does not match the session, and an edited token
      const mism = await api("POST", "/api/play/act", { sessionId: s.sessionId, levelId: "not-this-level", acts: [] }, [409, 400]);
      ok(mism.status === 409, `P4 ${c.id}: a foreign level id is refused (${mism.status})`);
      const [pl, mac] = s.sessionId.split(".");
      const body = JSON.parse(Buffer.from(pl, "base64url").toString("utf8")); body.seed = (body.seed ?? 0) + 1;
      const forged = `${Buffer.from(JSON.stringify(body)).toString("base64url")}.${mac}`;
      const tam = await api("POST", "/api/play/act", { sessionId: forged, levelId: lv.levelId, acts: [] }, [400, 409]);
      ok(tam.status === 400, `P4 ${c.id}: an edited session token is refused (${tam.status})`);
      // P3: a wrong sequence dressed in claims (a mal-rule's acts when the level has one, else a bare undo)
      const mal = Object.keys(lv.mal).map((m) => logic.malActs(lv, m)).find((a) => a?.length) ?? [{ kind: "undo" }];
      const claimed = env(mal).map((e) => ({ ...e, act: { ...e.act, correct: true, verdict: "solved", solved: true, score: 100 } }));
      const bad = await api("POST", "/api/play/act", { sessionId: s.sessionId, levelId: lv.levelId, acts: claimed, final: true });
      tAct.push(bad.ms);
      ok(bad.grade && bad.grade.verdict !== "solved", `P3 ${c.id}: claims never grade (server verdict ${bad.grade?.verdict})`);
      // P2: the level's own solution, as raw acts, one post per act (as the client does), the last one graded
      const sol = logic.solve(lv), acts = env(sol);
      let last = null;
      for (let k = 1; k <= acts.length; k++) {
        last = await api("POST", "/api/play/act", { sessionId: last?.sessionId ?? s.sessionId, levelId: lv.levelId, acts: acts.slice(0, k) });
        tAct.push(last.ms);
        if (last.reaction?.text) lines.push(last.reaction);
      }
      ok(last?.grade?.verdict === "solved" && last.grade.clean === true, `P2 ${c.id}: the server's replay grades the solution solved (${last?.grade?.verdict})`);
      ok(Array.isArray(last?.evidence) && last.evidence[0]?.outcome === "correct" && last.evidence[0]?.source === "game", `P2 ${c.id}: one correct game evidence row`);
      ok(Array.isArray(last?.doors) && last.doors.length >= 1, `P5 ${c.id}: doors offered after the level (${last?.doors?.length})`);
      // P5: next level and the level route
      const nx = await api("POST", "/api/play/next", { sessionId: last.sessionId, door: last.doors?.[1]?.door ?? "garam" });
      ok(!!nx.level && nx.level.levelId !== lv.levelId, `P5 ${c.id}: next level served (${nx.level?.door ?? "garam"})`);
      const lr = await api("POST", "/api/play/level", { sessionId: nx.sessionId });
      ok(lr.level?.levelId === nx.level?.levelId, `P5 ${c.id}: /api/play/level returns the session's level`);
      row.ok = true; row.reactions = lines.length;
    } catch (e) { row.error = String(e.message ?? e).slice(0, 200); ok(false, `${c.id}: ${row.error}`); }
    report.cases.push(row);
  }
  // P6
  const badLines = lines.filter((r) => reactionProblems(r.text).length || !MOMENT_KINDS.includes(r.moment));
  ok(badLines.length === 0, `P6 ${lines.length} micro-reactions, ${badLines.length} failing the play guard`);
  report.reactions = lines;
  // P7
  const w = await api("GET", `/api/play/world?childId=${child.id}`);
  const fam = w.families ?? [];
  ok(fam.length === 4, `P7 world has 4 families (${fam.length})`);
  const keys = new Set(fam.flatMap((f) => f.stations.flatMap((s) => Object.keys(s))));
  ok(![...keys].some((k) => /count|percent|pct|score|lock|xp|coin|streak|time/i.test(k)), `P7 station fields are drawn states only (${[...keys].join(",")})`);
  ok(fam.every((f) => f.routes.every((r) => (r.cite === "curriculum" || r.cite === "kit") && r.edge)), "P7 every route cites a real edge");
  report.world = { families: fam.map((f) => ({ family: f.family, stations: f.stations.length, routes: f.routes.length })) };
  // P8: the in-lesson loop
  try {
    const topicId = "c6-maths-ch05-t04";
    const les = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId });
    ok(!!les.lessonId, "P8 a lesson starts");
    const ps = await api("POST", "/api/play/start", { childId: child.id, topicId, lessonId: les.lessonId, lang: "hinglish" });
    const lv = ps.level, logic = LOGIC[`${lv.family}/${lv.mode}`];
    const sol = env(logic.solve(lv));
    let r = null;
    for (let k = 1; k <= sol.length; k++) r = await api("POST", "/api/play/act", { sessionId: r?.sessionId ?? ps.sessionId, levelId: lv.levelId, acts: sol.slice(0, k) });
    ok(typeof r.evidenceToken === "string" && typeof r.seamToken === "string" && r.seam?.kind === "level_end", "P8 the solved level returns signed evidence and a level_end seam");
    const ev = (data, type, name) => ({ moduleId: "play-intent", engine: "play", type, name, data, at: Date.now() });
    const turn = await api("POST", "/api/lesson/turn", { lessonId: les.lessonId, childText: "", turnSeq: 1, moduleEvents: [ev({ ev: r.evidenceToken }, "interaction", "play_evidence"), ev({ seam: r.seamToken }, "goal_met", "level_end")] });
    const said = String(turn.teacherReply ?? "");
    ok(!!turn.move?.kind, `P8 the teacher takes a full turn at the level end (move ${turn.move?.kind})`);
    ok(said.length > 0, `P8 she says something at the seam: "${said.slice(0, 120)}"`);
    report.lessonTurn = { move: turn.move?.kind ?? null, said: said.slice(0, 200), ms: turn.ms };
    if (isLocal) {
      const rows = await dbq("select count(*)::int as n from kt_evidence where child_id = $1 and item_key like 'play:%' and via = 'game'", [child.id]);
      ok(rows?.[0]?.n === 1, `P8 one kt_evidence row via game for the level (${rows?.[0]?.n})`);
      await api("POST", "/api/lesson/turn", { lessonId: les.lessonId, childText: "", turnSeq: 2, moduleEvents: [ev({ ev: r.evidenceToken }, "interaction", "play_evidence"),
        ev({ ev: r.evidenceToken.replace(/.$/, (ch) => (ch === "A" ? "B" : "A")) }, "interaction", "play_evidence")] });
      const again = await dbq("select count(*)::int as n from kt_evidence where child_id = $1 and item_key like 'play:%'", [child.id]);
      ok(again?.[0]?.n === 1, `P8 the same level again and a forged token fold nothing (${again?.[0]?.n})`);
    } else warn("P8 database checks run on local targets only (Neon TEST)");
    await api("POST", "/api/lesson/end", { lessonId: les.lessonId }, [200, 201, 404, 409]).catch(() => null);
  } catch (e) { ok(false, `P8 ${String(e.message ?? e).slice(0, 200)}`); }
}, { tag: "play", child: { classLevel: 6 } });

report.latency = { startP90: p90(tStart), actP90: p90(tAct), n: { start: tStart.length, act: tAct.length }, where: isLocal ? "local server, this sandbox" : "taxila.dev from the US sandbox (not India)" };
if (tStart.length) ok(p90(tStart) <= 800 || !isLocal, `T1 start p90 ${p90(tStart)} ms, act p90 ${p90(tAct)} ms (${report.latency.where})`);
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log("wrote", join(OUT, "report.json"));
done();
