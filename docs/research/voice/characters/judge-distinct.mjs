// Blind distinctness judge for the N arms of probe-2026-10-02 (asha-N, arjun-N, uma-N).
// Judge = taxila-brain (Azure, first-party). Address words (didi/bhaiya/ma'am…) and the three names are masked in
// BOTH child and teacher turns, and the class line is not shown, so the judge must identify the character from
// style alone. Hindi first-person gender agreement is NOT masked: it separates Arjun (masculine) from the two
// feminine sheets, so the informative cell is Asha vs Uma. Letter→character mapping is shuffled per trial.
// A model judge is a proxy for a human panel, never a replacement (Meera `brain-model`: blind, both orders).
// Run: set -a; . /home/user/Taxila/.env.local; set +a; NODE_USE_ENV_PROXY=1 node judge-distinct.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "probe-2026-10-02");
const TAG = process.env.OUT_TAG ? process.env.OUT_TAG + "-" : "";
const R = JSON.parse(fs.readFileSync(path.join(DIR, TAG + "results.json"), "utf8")).filter((x) => x.arm !== "K" && x.teacher);
const EP = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
const KEY = process.env.AZURE_OPENAI_API_KEY;
const DESC = {
  asha: "warm, playful, wonder-driven teacher of young children; slow; silly humour; choices and pretend play",
  arjun: "energetic, puzzle-loving maths and science tutor; predictions, estimation, challenge; dry wordplay",
  uma: "calm senior teacher of exam-anxious teenagers; structure, recall first, sparse praise, rare dry humour",
};
const MASK = /\b(didi|bhaiya|ma'?am|madam|miss|sir|asha|arjun|uma)\b/gi;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const sessions = {};
for (const x of R) (sessions[`${x.char}#${x.arm}#${x.rep}`] ??= []).push(x);
const out = [];
for (const pass of [0, 1]) for (const [key, turns] of Object.entries(sessions)) {
  const truth = key.split("#")[0];
  // two passes per session with different letter orders (position-bias control)
  let order = Object.keys(DESC).sort(() => rnd() - 0.5);
  if (pass === 1) order = [order[2], order[0], order[1]];
  const letters = ["A", "B", "C"];
  const menu = order.map((c, i) => `${letters[i]}: ${DESC[c]}`).join("\n");
  const transcript = turns.sort((a, b) => a.turn - b.turn)
    .map((t) => `CHILD: ${t.child.replace(MASK, "___")}\nTEACHER: ${t.teacher.replace(MASK, "___")}`).join("\n");
  const body = {
    model: "taxila-brain",
    messages: [
      { role: "system", content: "You identify which of three AI teacher characters produced a transcript. Answer with one letter, then one short reason." },
      { role: "user", content: `Characters:\n${menu}\n\nTranscript (names and address words masked as ___):\n${transcript}\n\nWhich character is the TEACHER? Reply as: <letter> | <reason>` },
    ],
    max_completion_tokens: 400,
  };
  const res = await fetch(`${EP}/chat/completions`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json();
  const txt = j.choices?.[0]?.message?.content?.trim() ?? `ERROR ${res.status} ${JSON.stringify(j).slice(0, 200)}`;
  const letter = (txt.match(/^[ABC]/) || [])[0];
  const pick = letter ? order[letters.indexOf(letter)] : null;
  out.push({ pass, session: key, arm: key.split("#")[1], truth, pick, correct: pick === truth, answer: txt });
  console.log(JSON.stringify(out.at(-1)));
}
const acc = out.filter((x) => x.correct).length;
console.log(`ACCURACY ${acc}/${out.length} (chance 1/3)`);
for (const arm of [...new Set(out.map((x) => x.arm))]) {
  const o = out.filter((x) => x.arm === arm);
  const conf = {};
  for (const x of o) conf[`${x.truth}→${x.pick}`] = (conf[`${x.truth}→${x.pick}`] || 0) + 1;
  console.log(`  arm ${arm}: ${o.filter((x) => x.correct).length}/${o.length}`, JSON.stringify(conf));
}
fs.writeFileSync(path.join(DIR, TAG + "judge.json"), JSON.stringify(out, null, 1));
