// W2-B acceptance, production API: the explain rungs of the Studio fallback ladder (LIVE-STUDIO §3.12 rungs 4-5).
// 12 topics (4 maths, 4 science, 4 EVS/SST), text lane, a learn lesson walked until its explain move:
//   - on the explain move something is on the tray: an engine show (rung 4) or the explainer@1 board (rung 5), in at
//     least 10 of 12 topics; an explainer / diagram (the board) is counted separately;
//   - every explainer@1 mount carries a script that passes the STRICT normalise and the layout lint (shared/whiteboard.js)
//     and has facts (what the teacher's facts row is written from);
//   - every mount is an engine in ENGINES (no unknown engine);
//   - 0 empty trays: every explain move reached has something on the tray (Rev 2; the terms board is the last rung);
//   - Studio forced off: today no Studio rung is live (W2-F/H), so every explain beat above already IS the
//     Studio-off case; when studio.enabled exists this file asserts it per account (open item w2b-studio-off-flag).
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/w2b-explain-rungs.mjs   (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done } from "./lib.mjs";
import { ENGINES } from "../../shared/engine-catalog.js";
import { normalizeScript, lintScript } from "../../shared/whiteboard.js";

const TOPICS = ["c5-maths-ch02-t01", "c6-maths-ch02-t01", "c4-maths-ch01-t02", "c7-maths-ch01-t02",
  "c6-science-ch02-t04", "c6-science-ch03-t01", "c7-science-ch07-t02", "c7-science-ch10-t02",
  "c4-evs-ch01-t01", "c5-evs-ch02-t01", "c6-sst-ch13-t01", "c7-sst-ch20-t01"];
const LINES = ["haan, main ready hoon", "ok", "haan", "samjhao na", "ok", "theek hai", "haan", "ok"];

const rows = [];
for (const topicId of TOPICS) {
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  await withTestAccount(async ({ api, child }) => {
    const start = await api("POST", "/api/lesson/start", { childId: child.id, topicId, mode: "text" });
    const mounted = new Map();
    const track = (cmds) => { for (const c of cmds ?? []) { if (c.op === "mount") mounted.set(c.moduleId, c); else if (c.op === "unmount") mounted.delete(c.moduleId); } };
    track(start.moduleCommands);
    const all = [...(start.moduleCommands ?? [])];
    let seq = 0, explain = null;
    for (const childText of LINES) {
      const r = await api("POST", "/api/lesson/turn", { lessonId: start.lessonId, childText, asrConfidence: 0.95, typed: true, turnSeq: ++seq });
      track(r.moduleCommands); all.push(...(r.moduleCommands ?? []));
      if (r.move?.kind === "explain") {
        explain = { tray: r.ui?.tray, on: [...mounted.values()], ms: r.ms, board: null };
        // W2 integration: the live Studio whiteboard (W2-E/F) replaces the explainer@1 rung when Studio takes the ask; the
        // turn answers with the slot "planning" and the script (or, if the live board fails its gate, this rung's template
        // board as the slot's fallback) follows. Converge on it the way a late-mounting stage does (GET /api/studio/slot).
        const slot = r.ui?.studioSlot;
        if (r.ui?.tray === "studio" && slot?.intentId && /:wb:/.test(slot.intentId)) {
          for (let i = 0; i < 24 && !explain.board; i++) {
            const got = slot.artifact ? slot : (await api("GET", `/api/studio/slot?lessonId=${start.lessonId}&intentId=${encodeURIComponent(slot.intentId)}`, undefined, [200, 404]).catch(() => null))?.slot;
            if (got?.artifact?.kind === "whiteboard") explain.board = got.artifact.script;
            else if (got?.state === "failed") break;
            else await new Promise((res) => setTimeout(res, 500));
          }
        }
        break;
      }
      if (r.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
    const unknown = all.filter((c) => c.op === "mount" && !ENGINES[c.engine]);
    ok(unknown.length === 0, `${topicId}: no unknown-engine mounts (${unknown.map((c) => c.engine).join(",") || "none"})`);
    for (const c of all.filter((x) => x.op === "mount" && x.engine === "explainer@1")) {
      const n = normalizeScript(c.params?.script, { strict: true });
      ok(n.ok && lintScript(n.script).length === 0 && Object.keys(n.script?.facts?.onScreen ?? {}).length > 0,
        `${topicId}: explainer script passes strict normalise + lint, with facts (${n.errors.join(",") || c.params?.template})`);
    }
    const shown = explain?.on.at(-1) ?? null;
    if (explain?.board) {
      const n = normalizeScript(explain.board, { strict: false });
      ok(n.ok && n.script.ops.length > 0, `${topicId}: the Studio whiteboard slot carries a drawable board (${n.errors.join(",") || `${n.script?.ops?.length} ops`})`);
    }
    const engine = explain?.tray === "studio" ? (explain.board ? "studio-whiteboard" : null) : shown?.engine ?? null;
    rows.push({ topicId, explainReached: !!explain, tray: explain?.tray ?? null, engine, template: explain?.tray === "studio" ? null : shown?.params?.template ?? null, turnMs: explain?.ms ?? null });
    if (!explain) warn(`${topicId}: the lesson never reached an explain move in ${LINES.length} turns`);
  }, { child: { classLevel }, tag: "w2b" });
}

console.table(rows);
const reached = rows.filter((r) => r.explainReached);
const rung = reached.filter((r) => r.engine);
const board = reached.filter((r) => r.engine === "explainer@1" || r.engine === "studio-whiteboard");
ok(rung.length >= 10, `an engine show or the board on the explain move in ≥ 10 of 12 topics (${rung.length}/${rows.length}; board ${board.length}, engine ${rung.length - board.length})`);
// Rev 2: 0 empty trays: EVERY explain move reached shows something (the key-terms board is the last rung: W2-B fixer)
ok(reached.every((r) => r.tray && r.tray !== "none" && r.engine), `no explain move with an empty tray (${reached.filter((r) => !r.engine || r.tray === "none").map((r) => r.topicId).join(",") || "none"})`);
ok(reached.every((r) => r.engine ? r.tray === (r.engine === "studio-whiteboard" ? "studio" : "module") : true), "the explain move's tray is the module tray for a mount, the studio tray for the live board");
done();
