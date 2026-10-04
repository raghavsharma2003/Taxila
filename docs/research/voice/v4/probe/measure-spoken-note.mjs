// Run from the repo root AFTER applying prompt-patch.diff: node docs/research/voice/v4/probe/measure-spoken-note.mjs (2026-10-04: 79,680 compiles, note shed 0, nothing else newly shed).
// Measures the said-aloud note's cost over every kit item: is it shed, and does it push anything else out?
import { readdirSync, readFileSync } from "fs";
import { normalizeKit } from "../../../../../server/content/kits.js";
import { compileWithReport, BudgetError } from "../../../../../server/compiler/compile.js";
import { CHARACTERS } from "../../../../../server/compiler/characters/index.js";
import { initLessonState, branchesFor } from "../../../../../server/director/state.js";
import { buildPracticeQueue, findItem } from "../../../../../server/director/items.js";
import * as SH from "../../../../../server/director/shapes.js";
const DIR = new URL("../../../../../data/kits/", import.meta.url).pathname;
const LANGS = ["hinglish", "hindi", "english"];
const brief = (ageBand, languagePref) => ({ firstName: "Aarav", classLevel: ageBand === "6-9" ? 3 : 7, ageBand, languagePref,
  interests: ["cricket", "trains", "drawing", "cooking with nani"], recentWins: ["counting in tens", "halves of a roti", "plants need sunlight"],
  activeMisconceptions: ["a bigger bottom number means a bigger fraction", "heavier things always fall faster", "plants eat soil for food"],
  memoryCallbacks: ["got a new puppy", "loves mango season", "won a drawing contest"], vibe: { pace: "medium", verbosity: "chatty", humour: "medium" }, relationshipStage: "familiar (6 sessions together)" });
const stats = {};
const bump = (k, f) => { const s = stats[k] ??= { n: 0, shed: 0, otherNewDrops: 0, throws: 0, tok: [] }; f(s); };
for (const f of readdirSync(DIR).filter((n) => /^c\d+-[a-z]+\.json$/.test(n)).sort()) {
  let d; try { d = JSON.parse(readFileSync(DIR + f, "utf8")); } catch { continue; }
  for (const t of d.topics ?? []) {
    const kit = normalizeKit(t, { topicId: t.topicId, verified: true }); if (!kit) continue;
    for (const item of kit.items.slice(0, 4)) for (const lang of LANGS) for (const ageBand of ["6-9", "10-15"]) {
      for (const v of [{ lane: "text", spoken: true, hintLevel: 0 }, { lane: "text", spoken: true, hintLevel: 3, correction: ["ai_denial", "ability"] },
        { lane: "voice", hintLevel: 0, moveVoiced: false }, { lane: "voice", hintLevel: 3, moveVoiced: true, correction: ["ai_denial", "exclusivity"] }]) {
        const s = initLessonState({ topicId: kit.topicId, kit, seed: 7, now: 0, ctx: { firstName: "Aarav", teacherName: "Asha", teacherId: "asha", protege: CHARACTERS.asha.protege, ageBand, lang, interests: ["cricket"], firstMeeting: false, hasCallback: true, topicTitle: "T", nextTitle: "N" } });
        Object.assign(s, { phase: "practice", introduced: kit.skills.map((sk) => sk.id), activeItemId: item.id, hintLevel: v.hintLevel, turn: 9, minutes: 6, moveVoiced: v.moveVoiced, correction: v.correction,
          lastMove: v.hintLevel ? { kind: "hint", itemId: item.id, skillId: item.skillId, hintLevel: v.hintLevel, shape: SH.hint({ level: v.hintLevel, rungShape: item.hints[v.hintLevel - 1] }) }
            : { kind: "practice", itemId: item.id, skillId: item.skillId, hintLevel: 0, shape: SH.pose({ item, prefix: SH.CONFIRM.correct }) } });
        const input = { character: CHARACTERS.asha, brief: brief(ageBand, lang), lessonState: s, move: s.lastMove, item, content: [], topic: { title: kit.topicId, classLevel: d.class, subject: d.subject }, language: lang, lane: v.lane, ...(v.lane === "voice" ? { branches: branchesFor(s, kit) } : {}) };
        const key = `${v.lane}${v.spoken ? "+cascade" : ""} rung${v.hintLevel}`;
        let a, b;
        try { a = compileWithReport({ ...input, spoken: false }); } catch (e) { if (e instanceof BudgetError) continue; throw e; }
        try { b = compileWithReport({ ...input, spoken: true }); } catch (e) { bump(key, (s) => { s.n++; s.throws++; }); continue; }
        const shed = b.dropped.some((x) => x.startsWith("move:spoken"));
        const extra = b.dropped.filter((x) => !x.startsWith("move:spoken") && !a.dropped.includes(x)).length;
        bump(key, (st) => { st.n++; if (shed) st.shed++; if (extra) st.otherNewDrops++; st.tok.push(b.tokens - a.tokens); });
      }
    }
  }
}
for (const [k, s] of Object.entries(stats)) { s.tok.sort((x, y) => x - y); console.log(k, `n=${s.n} shed=${s.shed} otherPartsNewlyShed=${s.otherNewDrops} throws=${s.throws} addedTokens median=${s.tok[s.tok.length >> 1]} max=${s.tok.at(-1)}`); }
