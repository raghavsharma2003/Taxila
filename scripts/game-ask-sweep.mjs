// Round 5 (14.3, main's item 2): over the c4-c9 maths topics, what does "mujhe game khelna hai" get? Code only, no model,
// no database: for each topic's first skill,
//   play      forge3 compose() admits a PLAY piece (the play coverage table)
//   engine    the Director's topic engine (modules.js TOPIC_MAP: the item engine an interactive ask can mount)
//   lesson    the lesson-start Studio plan (seam.js candidateIntents) holds a piece the child can act on (kind game or
//             simulation) whose skeleton is certified at the 360 phone (the piece that 14.3's lessonPieceForAsk shows)
// before = play (14.2 answers a game ask with a play piece, or with an engine only when one is ALREADY in the tray: prod
// c7-maths-ch08-t01 has fractions@1 and got no_game_piece 3 of 3); after = play || lesson (14.3 lessonPieceForAsk). `engine`
// is reported apart: a topic engine 14.3 still does not mount for a game ask (the next gain). The gap: none of the three.
//   node scripts/game-ask-sweep.mjs [--out file]
import fs from "node:fs";
import { compose } from "../server/forge3/compose.js";
import { candidateIntents } from "../server/studio/seam.js";
import { archetype } from "../server/studio/archetypes/index.js";
import { certifyForTray } from "../server/forge3/tray-gate.js";

const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
const TOPIC_MAP = JSON.parse(fs.readFileSync("shared/engine-topic-map.json", "utf8"));
const engineFor = (topicId) => { const e = TOPIC_MAP?.[topicId] ?? TOPIC_MAP?.topics?.[topicId]; return typeof e === "string" ? e : e?.engine ?? null; };
const rows = [];
for (let c = 4; c <= 9; c++) {
  const f = `data/kits/c${c}-maths.json`;
  if (!fs.existsSync(f)) continue;
  for (const kit of JSON.parse(fs.readFileSync(f, "utf8")).topics ?? []) {
    const skillId = kit.skills?.[0]?.id ?? null;
    const comp = compose({ ask: "game", skillId, topicId: kit.topicId, vp: "p360" });
    const play = comp.ladder?.[0]?.kind === "play";
    const engine = engineFor(kit.topicId);
    let lesson = null;
    try {
      const cands = candidateIntents({ lessonId: `sweep-${kit.topicId}`, kit, topicId: kit.topicId, child: { class_level: c } });
      for (const x of cands) {
        const kind = archetype(x.archetype)?.kind;
        if (kind !== "game" && kind !== "simulation") continue;
        const sk = { kind: "skeleton", stage: archetype(x.archetype).stage, skeleton: archetype(x.archetype).skeleton, archetype: x.archetype, intentId: "s", params: x.params ?? {}, strings: {} };
        const g = certifyForTray(sk, { vp: "p360", young: c <= 5 });
        if (g.ok) { lesson = x.archetype; break; }
        lesson ??= `${x.archetype} (uncertified)`;
      }
    } catch (e) { lesson = `error: ${String(e?.message ?? e).slice(0, 40)}`; }
    const lessonOk = !!lesson && !/uncertified|error/.test(lesson);
    rows.push({ topicId: kit.topicId, cls: c, play, engine, lesson, before: play, after: play || lessonOk, engineOnly: !play && !lessonOk && !!engine });
  }
}
const n = rows.length;
const sum = { topics: n, before: rows.filter((r) => r.before).length, after: rows.filter((r) => r.after).length, engineOnly: rows.filter((r) => r.engineOnly).map((r) => r.topicId),
  gap: rows.filter((r) => !r.after && !r.engine).map((r) => r.topicId) };
console.log(JSON.stringify({ topics: sum.topics, before: sum.before, after: sum.after, engineOnly: sum.engineOnly.length, gapCount: sum.gap.length }));
console.log("gap:", sum.gap.join(" "));
if (out) fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), sum, rows }, null, 1));
