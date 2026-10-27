import fs from "node:fs"; import path from "node:path";
import { admitPlay } from "/home/user/Taxila/server/forge3/compose.js";
import { topicGameFor } from "/home/user/Taxila/server/director/modules.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import * as C from "/home/user/Taxila/server/content/curriculum.js";
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
// an offer of a game: a question that proposes playing / showing a game
const OFFER = /(?:\b(?:game|khel)\w*\b[^.?!।]{0,40}\?|\b(?:kya|shall|should|want|chahoge|chahogi|chahenge|karein|khelein|khelenge)\b[^.?!।]{0,40}\b(?:game|khel\w*)\b)/iu;
const cache = {};
const hasGame = (id) => cache[id] ??= (() => { const t = C.getTopic(id); const k = t && kitFromFile(t); return !!(admitPlay(null, id) || (k && topicGameFor({ ctx: { lang: "hinglish", ageBand: "10-12", sessionId: "x" }, failedEngines: [] }, k, "hinglish", "B3"))); })();
let lines = 0, offers = 0, noPath = 0; const ex = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8")); const id = r.start?.topic?.id; if (!id) continue;
  r.turns.forEach((t, i) => {
    if (!t.teacher) return; lines++;
    const ss = (String(t.teacher).match(/[^.!?।]+[.!?।]*/g) ?? []).filter((x) => OFFER.test(x));
    if (!ss.length) return; offers++;
    const chipsGame = (t.screen?.chips ?? []).some((c) => /game/i.test(String(c.id ?? c.label ?? c)));
    if (!hasGame(id)) { noPath++; ex.push({ f: path.basename(f).slice(0, 30), n: t.n, chipsGame, nextMove: r.turns[i + 1]?.move?.kind ?? r.turns[i + 1]?.move, s: ss.join(" ").slice(0, 120) }); }
  });
}
console.log(JSON.stringify({ lines, offersOfGame: offers, inTopicsWithNoGame: noPath }));
for (const e of ex.slice(0, 20)) console.log(JSON.stringify(e));
