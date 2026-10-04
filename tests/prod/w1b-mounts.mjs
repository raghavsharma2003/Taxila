// W1-B acceptance, production API: a rerun of the live-content audit's M1 probe (8 topics x 10 turns, text lane,
// purpose practice) against the catalog-bound Director and the in-lesson Forge G1 fills. Turns 1-5 are the audit's
// child lines; from turn 6 the child answers the asked item with its kit key, so the lesson walks more than one item
// (in the audit's script every lesson stuck on its first item for 6 hint turns).
//   - 0 unknown-engine mounts (every mount is in shared/engine-catalog.js ENGINES), and only valid engine modes;
//   - at least 1 item-bound mount in every maths lesson (goal item:<id>, a bound engine plan; or g1:<id>, a G1 fill);
//   - at least 1 G1 mount per science or English lesson that POSES an item G1 can fill (the fill builds and passes the
//     G1 gate here, offline, as on the server; reported per topic with the items posed);
//   - a bound module answer writes a kt_evidence row with via = 'module' (a bound engine's verdict is still the frame's
//     own: the row's outcome mirrors the claim, open item engines-v1-server-recheck);
//   - a G1 fill is graded by the SERVER's binding, never the frame's claim, both ways: a WRONG commit claiming
//     correct:true writes an incorrect via='module' row, and the RIGHT commit claiming correct:false writes a correct
//     one (needs the W1-B lesson.js call sites, context/inbox/w1-b-lesson-wiring.patch).
//   The row checks need TAXILA_DB_URL for the target's DB; without it they are skipped with a WARN and only the turn's
//   acceptance is checked through the API. Maths lessons report catalog-bound (goal item:) and G1 (goal g1:) mounts
//   separately; the acceptance counts either as item-bound and WARNs when a maths lesson had only G1.
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/w1b-mounts.mjs   (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done, isLocal } from "./lib.mjs";
import { ENGINES } from "../../shared/engine-catalog.js";
import { getKit } from "../../server/content/index.js";
import { diagnosticItems } from "../../server/forge/derive.js";

// The local fill check below builds the fill offline exactly as the server does (code pick, gate), touching no DB/Blob.
process.env.FORGE_FLAVOUR = "off"; process.env.FORGE_DB_CACHE = "off"; process.env.FORGE_BLOB = "off";
const { requestFill } = await import("../../server/forge/index.js");

const TOPICS = ["c5-maths-ch02-t01", "c6-maths-ch07-t01", "c4-maths-ch05-t01", "c7-maths-ch08-t01",
  "c6-science-ch02-t01", "c4-evs-ch01-t01", "c5-english-ch02-t01", "c7-english-ch01-t01"];
const LINES = ["haan, main ready hoon", "mujhe nahi pata", "7", "ek example se samjhao na", "abhi bhi samajh nahi aaya",
  "1/2", "ok", "pata nahi", "4", "ok"];

/** The local kit (the same files the server ships): its items, and whether G1 can mount one for this child. */
async function kitOf(topicId) {
  const kit = await getKit(topicId, { generate: false });
  const items = [...kit.items, ...diagnosticItems(kit)];
  const find = (id) => items.find((i) => i.id === id) ?? null;
  const fillable = async (id, classLevel) => {
    const it = find(id);
    if (!it) return false;
    const r = await requestFill({ kit, item: it, move: "practice", learner: { child: { classLevel, languagePref: "hinglish", interests: [] }, recentWrong: [], activeMisconceptions: [], pKnown: {} }, needByMs: 10_000, noGapRow: true });
    return r.status === "ready";
  };
  return { kit, find, fillable };
}

const all = [];
const db = process.env.TAXILA_DB_URL ? (await import("@neondatabase/serverless")).neon(process.env.TAXILA_DB_URL) : null;
const maxSeq = async (childId) => (db ? (await db.query("select coalesce(max(seq), 0)::bigint as s from kt_evidence where child_id = $1", [childId]))[0].s : null);
const rowsAfter = async (childId, since) => db.query("select via, cls, outcome, misconception_id from kt_evidence where child_id = $1 and seq > $2 order by seq", [childId, since]);

/** A scene@1 commit for this fill: the key ("right") or a wrong answer ("wrong"); null when the scene has no wrong one. */
function commitValue(sc, which) {
  const pr = sc?.probe;
  if (!pr) return null;
  const key = pr.correct.match(/^pick == '([a-z0-9_]+)'$/)?.[1];
  if (key) {
    const ch = (sc.nodes ?? []).find((n) => n.kind === "choice");
    const id = which === "right" ? key : ch?.options?.map((o) => o.id).find((o) => o !== key);
    return id ? { kind: "sc.commit", probe: pr.id, probe_kind: pr.kind, via: "tap", vars: { [ch?.var ?? "pick"]: id } } : null;
  }
  const ord = pr.correct.match(/^order\((\w+)\) == '([^']+)'$/);
  if (!ord) return null;
  const right = ord[2].split(","), wrong = [...right].reverse();
  if (which === "wrong" && wrong.join(",") === right.join(",")) return null;
  return { kind: "sc.commit", probe: pr.id, probe_kind: pr.kind, via: "tap", vars: {}, order: { [ord[1]]: which === "right" ? right : wrong } };
}

for (const topicId of TOPICS) {
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  await withTestAccount(async ({ api, child }) => {
    const K = await kitOf(topicId);
    const start = await api("POST", "/api/lesson/start", { childId: child.id, topicId, mode: "text", purpose: "practice" });
    const cmds = [...(start.moduleCommands ?? [])];
    const posed = new Set();
    let seq = 0, bound = null, asked = start.ui?.ask?.itemId ?? null;
    const g1Checks = { wrong: null, right: null };
    const mounted = new Map();
    const track = (c) => { if (c.op === "mount") mounted.set(c.moduleId, c); else if (c.op === "unmount") mounted.delete(c.moduleId); };
    for (const c of start.moduleCommands ?? []) track(c);
    for (const [i, line] of LINES.entries()) {
      const key = i >= 5 && asked ? K.find(asked)?.answer : null;
      const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText: key ? String(key) : line, typed: true, turnSeq: ++seq });
      asked = r.ui?.ask?.itemId ?? null;
      if (asked) posed.add(asked);
      cmds.push(...(r.moduleCommands ?? []));
      for (const c of r.moduleCommands ?? []) track(c);
      const m = (r.moduleCommands ?? []).find((c) => c.op === "mount" && c.params?.itemId && c.params.itemId === r.ui?.ask?.itemId);
      // a bound engine plan on the item being asked: answer it in the activity (a module-only turn), once per lesson
      if (m && !bound) {
        bound = m;
        const since = await maxSeq(child.id);
        const ans = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText: "", typed: true, turnSeq: ++seq,
          moduleEvents: [{ moduleId: m.moduleId, engine: m.engine, type: "answer", name: "answer", data: { value: m.params.target ?? "x", correct: true }, at: Date.now() }] });
        cmds.push(...(ans.moduleCommands ?? []));
        for (const c of ans.moduleCommands ?? []) track(c);
        asked = ans.ui?.ask?.itemId ?? asked;
        bound.accepted = ans.status === 200;
        bound.rows = since === null ? null : await rowsAfter(child.id, since);
      }
      // a G1 fill on the item being asked: first commit a WRONG answer claiming correct:true, then the RIGHT one claiming
      // correct:false (on the same mount when it stays up, else on the lesson's next G1 mount). The server grades both
      // from its own binding (gradeEvent): the kt_evidence rows' outcomes are the binding's, never the claim's.
      for (const phase of ["wrong", "right"]) {
        if (g1Checks[phase] || (phase === "right" && !g1Checks.wrong)) continue;
        const g = [...mounted.values()].find((c) => c.engine === "scene@1" && c.goal === `g1:${asked}`);
        const value = g && commitValue(g.params.scene, phase);
        if (!value) break;
        const since = await maxSeq(child.id);
        const ans = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText: "", typed: true, turnSeq: ++seq,
          moduleEvents: [{ moduleId: g.moduleId, engine: "scene@1", type: "answer", name: "answer", data: { value, correct: phase === "wrong" }, at: Date.now() }] });
        cmds.push(...(ans.moduleCommands ?? []));
        for (const c of ans.moduleCommands ?? []) track(c);
        asked = ans.ui?.ask?.itemId ?? asked;
        g1Checks[phase] = { item: g.goal.slice(3), accepted: ans.status === 200, rows: since === null ? null : await rowsAfter(child.id, since) };
      }
      if (r.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: start.lessonId });
    const mounts = cmds.filter((c) => c.op === "mount");
    const unknown = mounts.filter((c) => !ENGINES[c.engine]);
    const badMode = mounts.filter((c) => c.params?.mode !== undefined && !ENGINES[c.engine]?.modes.includes(c.params.mode));
    const itemBound = mounts.filter((c) => /^(item|g1):/.test(c.goal ?? ""));
    const catalogBound = mounts.filter((c) => /^item:/.test(c.goal ?? ""));
    const g1 = mounts.filter((c) => /^g1:/.test(c.goal ?? ""));
    all.push({ topicId, mounts: mounts.length, unknown: unknown.length, itemBound: itemBound.length, catalogBound: catalogBound.length, g1: g1.length });
    console.log(`${topicId}: ${mounts.length} mounts [${mounts.map((c) => `${c.engine}${c.goal ? `(${c.goal.split(":")[0]})` : ""}`).join(", ")}]`);
    ok(unknown.length === 0, `${topicId}: 0 unknown-engine mounts (${unknown.map((c) => c.engine).join(", ") || "none"})`);
    ok(badMode.length === 0, `${topicId}: every engine mode is the engine's own (${badMode.map((c) => `${c.engine}:${c.params.mode}`).join(", ") || "ok"})`);
    if (/-maths-/.test(topicId)) {
      ok(itemBound.length >= 1, `${topicId}: at least 1 item-bound mount in the maths lesson (catalog-bound ${catalogBound.length}, G1 ${g1.length})`);
      if (itemBound.length && !catalogBound.length) warn(`${topicId}: item-bound only through G1 fills; no catalog-bound engine mounted`);
    }
    const fillablePosed = [];
    for (const id of posed) if (await K.fillable(id, classLevel)) fillablePosed.push(id);
    console.log(`  posed: ${[...posed].join(", ") || "none"}; G1-fillable among them: ${fillablePosed.join(", ") || "none"}`);
    if (/-(science|english)-/.test(topicId)) {
      if (fillablePosed.length) ok(g1.length >= 1, `${topicId}: at least 1 G1 mount (the lesson posed ${fillablePosed.length} fillable item(s)) (${g1.length})`);
      else warn(`${topicId}: the lesson posed no item G1 can fill; G1 mount not required`);
    }
    const g1Row = (phase, want) => {
      const x = g1Checks[phase];
      if (!x) return;
      ok(x.accepted, `${topicId}: the G1 ${phase} commit (item ${x.item}, claim correct:${phase === "wrong"}) was accepted`);
      if (x.rows === null) return warn(`${topicId}: TAXILA_DB_URL not set; the G1 ${phase} commit's kt_evidence row not read`);
      const mod = x.rows.filter((row) => row.via === "module");
      ok(mod.length > 0 && mod.every((row) => row.cls === want),
        `${topicId}: the G1 ${phase} commit claiming correct:${phase === "wrong"} wrote a via 'module' row graded ${want} by the server (${mod.map((row) => row.cls).join(",") || "no module row"})`);
    };
    g1Row("wrong", "incorrect");
    g1Row("right", "correct");
    if (g1Checks.wrong && !g1Checks.right) warn(`${topicId}: no second G1 posing for the right-answer commit`);
    if (bound) {
      ok(bound.accepted, `${topicId}: the bound module answer (${bound.engine}, item ${bound.params.itemId}) was accepted`);
      if (bound.rows === null) warn(`${topicId}: TAXILA_DB_URL not set; kt_evidence via='module' not read`);
      else ok(bound.rows.some((row) => row.via === "module" && row.cls === "correct"),
        `${topicId}: the bound answer wrote a correct via 'module' row (the engine's own verdict; server re-check is open) (${bound.rows.map((row) => `${row.via}:${row.cls}`).join(",") || "no rows"})`);
    }
  }, { tag: "w1b-mounts", child: { classLevel, firstName: "Riya" } });
}
const anyBound = all.some((x) => x.itemBound > 0);
ok(anyBound, `item-bound mounts seen across the battery (${all.map((x) => `${x.topicId.replace(/-t\d+$/, "")}:${x.catalogBound}+${x.g1}g1`).join(" ")})`);
if (isLocal) warn("local target: the battery ran against a local server, not production");
done();
