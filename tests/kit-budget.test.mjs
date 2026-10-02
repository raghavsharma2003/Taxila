// The prompt budget gate over REAL content: every queued item and diagnostic of every data/kits file,
// compiled on both lanes × every language × both age bands, must fit — truncation is silent and eats the
// end of the prompt, so the budget fails the build, never a child's lesson (inherited law). Kits are being
// generated while this runs: a file mid-write is skipped, not failed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { normalizeKit, RUNG_DEFAULTS } from "../server/content/kits.js";
import { compileWithReport, BudgetError } from "../server/compiler/compile.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";
import { initLessonState, branchesFor } from "../server/director/state.js";
import { buildPracticeQueue, findItem, promptFor, revealsAnswer } from "../server/director/items.js";
import * as SH from "../server/director/shapes.js";

const DIR = new URL("../data/kits/", import.meta.url);
const LANGS = ["hinglish", "hindi", "english"];

/** Every usable topic in every kit file that parses right now. */
function kits() {
  const out = [];
  for (const f of readdirSync(DIR).filter((n) => /^c\d+-[a-z]+\.json$/.test(n)).sort()) {
    let d;
    try { d = JSON.parse(readFileSync(new URL(f, DIR), "utf8")); } catch { continue; }
    for (const t of d.topics ?? []) {
      const kit = normalizeKit(t, { topicId: t.topicId, verified: true });
      if (kit) out.push({ file: f, classLevel: d.class, subject: d.subject, kit });
    }
  }
  return out;
}
const KITS = kits();

/** A brief at its full size, so the total budget is tested where it is tightest. */
const brief = (ageBand, languagePref) => ({
  firstName: "Aarav", classLevel: ageBand === "6-9" ? 3 : 7, ageBand, languagePref,
  interests: ["cricket", "trains", "drawing", "cooking with nani"],
  recentWins: ["counting in tens", "halves of a roti", "plants need sunlight"],
  activeMisconceptions: ["a bigger bottom number means a bigger fraction", "heavier things always fall faster", "plants eat soil for food"],
  memoryCallbacks: ["got a new puppy", "loves mango season", "won a drawing contest"],
  vibe: { pace: "medium", verbosity: "chatty", humour: "medium" }, relationshipStage: "familiar (6 sessions together)",
});

function stateOn(kit, item, { lang, ageBand, hintLevel, moveVoiced, correction }) {
  const s = initLessonState({
    topicId: kit.topicId, kit, seed: 7, now: 0,
    ctx: { firstName: "Aarav", teacherName: "Asha", teacherId: "asha", protege: CHARACTERS.asha.protege, ageBand, lang,
      interests: ["cricket"], firstMeeting: false, hasCallback: true, topicTitle: "T", nextTitle: "N" },
  });
  Object.assign(s, {
    phase: "practice", introduced: kit.skills.map((sk) => sk.id), activeItemId: item.id, hintLevel, turn: 9, minutes: 6, moveVoiced, correction,
    lastMove: hintLevel
      ? { kind: "hint", itemId: item.id, skillId: item.skillId, hintLevel, shape: SH.hint({ level: hintLevel, rungShape: item.hints[hintLevel - 1] }) }
      : { kind: "practice", itemId: item.id, skillId: item.skillId, hintLevel: 0, shape: SH.pose({ item, prefix: SH.CONFIRM.correct }) },
  });
  return s;
}

test("kit files normalize, and the load-time gates drop or replace almost nothing", () => {
  assert.ok(KITS.length > 0, "at least one kit topic loads");
  const items = KITS.reduce((n, k) => n + k.kit.items.length + k.kit.lint.itemsDropped, 0);
  const dropped = KITS.reduce((n, k) => n + k.kit.lint.itemsDropped + k.kit.lint.diagnosticsDropped, 0);
  const hints = KITS.reduce((n, k) => n + k.kit.lint.hintsReplaced, 0);
  console.log(`# kits: ${KITS.length} topics, ${items} items; dropped for the prompt budget: ${dropped}; leaking or over-long hints replaced: ${hints}`);
  assert.ok(dropped <= items * 0.01, `more than 1% of items dropped for the budget (${dropped}/${items}): shorten them in the kit`);
});

test("no rung 1-3 hint states the key, and no item's own prompt counts as a leak", () => {
  for (const { kit } of KITS) {
    for (const item of kit.items) {
      for (const rung of [0, 1, 2]) {
        if (item.hints[rung] === RUNG_DEFAULTS[rung]) continue; // a shape for the teacher, not words she says
        assert.equal(revealsAnswer(item.hints[rung], item), false, `${item.id} rung ${rung + 1} hint leaks: ${item.hints[rung]}`);
      }
      for (const lang of LANGS) assert.equal(revealsAnswer(promptFor(item, lang), item), false, `${item.id} (${lang}): posing it verbatim reads as a leak`);
    }
  }
});

test("every queued item and diagnostic compiles on both lanes, every language and age band", () => {
  let n = 0;
  for (const { kit, classLevel, subject } of KITS) {
    const topic = { title: kit.topicId, classLevel, subject };
    const queue = [...buildPracticeQueue(kit), ...kit.misconceptions.filter((m) => m.diagnostic).map((m) => `diag:${m.id}`)];
    const ids = [...new Set([...queue, ...kit.items.filter((i) => i.kind !== "teachback").map((i) => i.id)])];
    for (const id of ids) {
      for (const lang of LANGS) {
        for (const ageBand of ["6-9", "10-15"]) {
          const character = ageBand === "6-9" ? CHARACTERS.asha : CHARACTERS.arjun;
          const variants = [
            { lane: "text", hintLevel: 0, moveVoiced: false },
            { lane: "text", hintLevel: 3, moveVoiced: false, correction: ["ai_denial", "ability"] },
            { lane: "voice", hintLevel: 0, moveVoiced: false },
            { lane: "voice", hintLevel: 3, moveVoiced: true, correction: ["ai_denial", "exclusivity"] },
          ];
          for (const v of variants) {
            const probe = { seed: 7, warmup: [] };
            const item = findItem(probe, kit, id);
            const s = stateOn(kit, item, { lang, ageBand, ...v });
            const input = {
              character, brief: brief(ageBand, lang), lessonState: s, move: s.lastMove, item, content: [], topic, language: lang, lane: v.lane,
              ...(v.lane === "voice" ? { branches: branchesFor(s, kit) } : {}),
            };
            try {
              compileWithReport(input);
            } catch (e) {
              if (e instanceof BudgetError) assert.fail(`${id} · ${v.lane} · ${lang} · ${ageBand} · rung ${v.hintLevel}: ${e.message}`);
              throw e;
            }
            n += 1;
          }
        }
      }
    }
  }
  console.log(`# compiled ${n} lesson states without a BudgetError`);
});
