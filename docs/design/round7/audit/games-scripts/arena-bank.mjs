// Games audit: the arena (ITEM-ARENA) bank against its own law. For every challenge in data/arena/*.json, served the way the
// server serves it (validate), then: the key is accepted, every other option is refused, options are distinct, the hint does not
// contain the key, the prompt does not contain raw {slots}, and options are not all one word-for-word duplicate.
//   node docs/design/round7/audit/games-scripts/arena-bank.mjs
import { readFileSync, readdirSync } from "node:fs";
import { arenaLogic } from "../../../../../src/play/families/arena/arena.logic.ts";
import { replayAll } from "../../../../../src/play/core/replay.ts";
const dir = new URL("../../../../../data/arena/", import.meta.url);
const env = (a) => a.map((act, i) => ({ seq: i + 1, t: 100 * (i + 1), via: "touch", act }));
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
const res = { challenges: 0, rejectedByValidate: [], keyRefused: [], wrongAccepted: [], dupOptions: [], hintLeaksKey: [], slot: [], keyTextMismatch: [], oneOption: [] };
for (const f of readdirSync(dir).filter((x) => /^c\d-[a-z]+\.json$/.test(x))) {
  const bank = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
  for (const c of bank.challenges ?? []) {
    res.challenges++;
    const keyOpt = c.options.find((o) => o.text === c.keyText) ?? c.options.find((o) => norm(o.text) === norm(c.keyText));
    const tag = `${f}:${c.id}`;
    if (!keyOpt) { res.keyTextMismatch.push(tag); continue; }
    const level = { v: "play@1", levelId: c.id, family: "arena", mode: "pick", topicId: c.topicId, skillId: c.skillId, fade: 1, goal: "pick", targets: [], mal: {}, context: "", seed: 1, proof: { solvable: true, shortcutFree: true, minActs: 2, solutions: 1, discriminates: [], pFirstTry: 0.5, score: 0, genMs: 0 },
      params: { itemId: c.id, form: c.form, prompt: c.prompt, options: c.options, key: keyOpt.id, hint: c.hint } };
    const v = arenaLogic.validate(level);
    if (!v) { res.rejectedByValidate.push(`${tag} options=${c.options.length}`); continue; }
    for (const o of c.options) {
      const r = replayAll(arenaLogic, v, env([{ kind: "aim", option: o.id }, { kind: "fire" }]));
      const won = arenaLogic.goalMet(v, r.state);
      if (o.id === keyOpt.id && !won) res.keyRefused.push(tag);
      if (o.id !== keyOpt.id && won) res.wrongAccepted.push(`${tag} ${o.text}`);
    }
    const t = c.options.map((o) => norm(o.text)); if (new Set(t).size !== t.length) res.dupOptions.push(`${tag} ${JSON.stringify(c.options.map((o) => o.text))}`);
    if (c.hint && norm(c.hint).includes(norm(c.keyText)) && norm(c.keyText).length >= 3) res.hintLeaksKey.push(`${tag} key=${c.keyText} hint=${String(c.hint).slice(0, 80)}`);
    for (const s of [c.prompt?.en, c.prompt?.hi, c.hint, ...c.options.map((o) => o.text)]) if (typeof s === "string" && /\{[a-zA-Z]+\}/.test(s) && !/\{friend[FM]?\}/.test(s)) { res.slot.push(`${tag} ${s.slice(0, 60)}`); break; }
  }
}
for (const [k, v] of Object.entries(res)) console.log(k, Array.isArray(v) ? v.length : v);
for (const k of ["rejectedByValidate", "keyRefused", "wrongAccepted", "dupOptions", "hintLeaksKey", "slot", "keyTextMismatch"]) for (const x of res[k].slice(0, 6)) console.log(`  ${k}: ${x}`);
