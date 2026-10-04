// W1-B acceptance, production API: a rerun of the live-content audit's M1 probe (8 topics x 10 turns, text lane,
// purpose practice) against the catalog-bound Director and the in-lesson Forge G1 fills. Turns 1-5 are the audit's
// child lines; from turn 6 the child answers the asked item with its kit key, so the lesson walks more than one item
// (in the audit's script every lesson stuck on its first item for 6 hint turns).
//   - 0 unknown-engine mounts (every mount is in shared/engine-catalog.js ENGINES), and only valid engine modes;
//   - at least 1 item-bound mount in every maths lesson (goal item:<id>, a bound engine plan; or g1:<id>, a G1 fill);
//   - at least 1 G1 mount per science or English lesson that POSES an item G1 can fill (the fill builds and passes the
//     G1 gate here, offline, as on the server; reported per topic with the items posed);
//   - a bound module answer writes a kt_evidence row with via = 'module', and so does a G1 fill's answer committed with
//     a false `correct` claim (graded by the server's binding; needs the W1-B lesson.js call sites) (needs TAXILA_DB_URL for the target's DB;
//     without it the row check is skipped with a WARN and the turn's acceptance is checked through the API).
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

for (const topicId of TOPICS) {
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  await withTestAccount(async ({ api, child }) => {
    const K = await kitOf(topicId);
    const start = await api("POST", "/api/lesson/start", { childId: child.id, topicId, mode: "text", purpose: "practice" });
    const cmds = [...(start.moduleCommands ?? [])];
    const posed = new Set();
    let seq = 0, bound = null, g1Answer = null, asked = start.ui?.ask?.itemId ?? null;
    for (const [i, line] of LINES.entries()) {
      const key = i >= 5 && asked ? K.find(asked)?.answer : null;
      const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText: key ? String(key) : line, typed: true, turnSeq: ++seq });
      asked = r.ui?.ask?.itemId ?? null;
      if (asked) posed.add(asked);
      cmds.push(...(r.moduleCommands ?? []));
      const m = (r.moduleCommands ?? []).find((c) => c.op === "mount" && c.params?.itemId && c.params.itemId === r.ui?.ask?.itemId);
      // a bound engine plan on the item being asked: answer it in the activity (a module-only turn), once per lesson
      if (m && !bound) {
        bound = m;
        const ans = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText: "", typed: true, turnSeq: ++seq,
          moduleEvents: [{ moduleId: m.moduleId, engine: m.engine, type: "answer", name: "answer", data: { value: m.params.target ?? "x", correct: true }, at: Date.now() }] });
        cmds.push(...(ans.moduleCommands ?? []));
        bound.accepted = ans.status === 200;
      }
      // a G1 fill on the item being asked: commit its RIGHT answer while claiming correct:false. The server must grade
      // it from its own binding (gradeEvent), never from the frame's claim: a module-graded kt_evidence row follows.
      const g = (r.moduleCommands ?? []).find((c) => c.op === "mount" && c.goal === `g1:${asked}` && c.engine === "scene@1");
      if (g && !g1Answer) {
        const sc = g.params.scene, pr = sc.probe;
        const pick = pr.correct.match(/^pick == '([a-z0-9_]+)'$/)?.[1];
        const ord = pr.correct.match(/^order\((\w+)\) == '([^']+)'$/);
        const value = pick ? { kind: "sc.commit", probe: pr.id, probe_kind: pr.kind, via: "tap", vars: { pick } }
          : ord ? { kind: "sc.commit", probe: pr.id, probe_kind: pr.kind, via: "tap", vars: {}, order: { [ord[1]]: ord[2].split(",") } } : null;
        if (value) {
          const before = db ? (await db.query("select count(*)::int as n from kt_evidence where child_id = $1 and via = 'module'", [child.id]))[0].n : null;
          const ans = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText: "", typed: true, turnSeq: ++seq,
            moduleEvents: [{ moduleId: g.moduleId, engine: "scene@1", type: "answer", name: "answer", data: { value, correct: false }, at: Date.now() }] });
          cmds.push(...(ans.moduleCommands ?? []));
          const after = db ? (await db.query("select count(*)::int as n from kt_evidence where child_id = $1 and via = 'module'", [child.id]))[0].n : null;
          g1Answer = { item: asked, accepted: ans.status === 200, wrote: before !== null ? after > before : null };
        }
      }
      if (r.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: start.lessonId });
    const mounts = cmds.filter((c) => c.op === "mount");
    const unknown = mounts.filter((c) => !ENGINES[c.engine]);
    const badMode = mounts.filter((c) => c.params?.mode !== undefined && !ENGINES[c.engine]?.modes.includes(c.params.mode));
    const itemBound = mounts.filter((c) => /^(item|g1):/.test(c.goal ?? ""));
    const g1 = mounts.filter((c) => /^g1:/.test(c.goal ?? ""));
    all.push({ topicId, mounts: mounts.length, unknown: unknown.length, itemBound: itemBound.length, g1: g1.length });
    console.log(`${topicId}: ${mounts.length} mounts [${mounts.map((c) => `${c.engine}${c.goal ? `(${c.goal.split(":")[0]})` : ""}`).join(", ")}]`);
    ok(unknown.length === 0, `${topicId}: 0 unknown-engine mounts (${unknown.map((c) => c.engine).join(", ") || "none"})`);
    ok(badMode.length === 0, `${topicId}: every engine mode is the engine's own (${badMode.map((c) => `${c.engine}:${c.params.mode}`).join(", ") || "ok"})`);
    if (/-maths-/.test(topicId)) ok(itemBound.length >= 1, `${topicId}: at least 1 item-bound mount in the maths lesson (${itemBound.length})`);
    const fillablePosed = [];
    for (const id of posed) if (await K.fillable(id, classLevel)) fillablePosed.push(id);
    console.log(`  posed: ${[...posed].join(", ") || "none"}; G1-fillable among them: ${fillablePosed.join(", ") || "none"}`);
    if (/-(science|english)-/.test(topicId)) {
      if (fillablePosed.length) ok(g1.length >= 1, `${topicId}: at least 1 G1 mount (the lesson posed ${fillablePosed.length} fillable item(s)) (${g1.length})`);
      else warn(`${topicId}: the lesson posed no item G1 can fill; G1 mount not required`);
    }
    if (g1Answer) {
      ok(g1Answer.accepted, `${topicId}: the G1 module answer (item ${g1Answer.item}) was accepted`);
      if (g1Answer.wrote === null) warn(`${topicId}: TAXILA_DB_URL not set; the G1 answer's kt_evidence row not read`);
      else ok(g1Answer.wrote, `${topicId}: a G1 module answer (graded by the server's binding, the frame's claim ignored) wrote a kt_evidence row via 'module'`);
    }
    if (bound) {
      ok(bound.accepted, `${topicId}: the bound module answer (${bound.engine}, item ${bound.params.itemId}) was accepted`);
      if (db) {
        const rows = await db.query("select via, grader, cls from kt_evidence where child_id = $1 order by seq desc limit 20", [child.id]);
        ok(rows.some((x) => x.via === "module"), `${topicId}: a kt_evidence row with via 'module' (${rows.map((x) => x.via).join(",") || "no rows"})`);
      } else warn(`${topicId}: TAXILA_DB_URL not set; kt_evidence via='module' not read`);
    }
  }, { tag: "w1b-mounts", child: { classLevel, firstName: "Riya" } });
}
const anyBound = all.some((x) => x.itemBound > 0);
ok(anyBound, `item-bound mounts seen across the battery (${all.map((x) => `${x.topicId.replace(/-t\d+$/, "")}:${x.itemBound}`).join(" ")})`);
if (isLocal) warn("local target: the battery ran against a local server, not production");
done();
