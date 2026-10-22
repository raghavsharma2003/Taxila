// Round 5 (main 2026-10-15): the WRONG-VALUE rate per ear. For every gold value the child said (assemble.mjs childSegs with a
// value), the ear's items whose audio overlaps that segment are read with the engine's own numeral parser
// (src/duplex/numerals.ts valuesOf):
//   right  the gold value is among the values read
//   wrong  a value was read and none of them is the gold one (a verdict on a value the child never said)
//   lost   no value read (an empty final, or words without a number: the Director's re-ask)
// yes/no golds ("yes"): right on हाँ/haan/yes/ha, wrong on नहीं/no, else lost. Wilson 95% CI on the wrong rate.
//   node evals/duplex-2026-10/wrong-value.mjs --bake <dir> --arms a,b,c --variants owner,phone,clean [--bata]
import fs from "node:fs";
import path from "node:path";
import { valuesOf } from "../../src/duplex/numerals.ts";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), ARMS = arg("--arms").split(","), VARS = arg("--variants", "owner").split(",");
const YES = /(^|[\s,.।!?])(हाँ|हां|हा|haan|han|ha|yes|yeah|जी)([\s,.।!?]|$)/i, NO = /(^|[\s,.।!?])(नहीं|nahi|nahin|no)([\s,.।!?]|$)/i;
const wilson = (k, n) => {
  if (!n) return [null, null];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)].map((x) => Math.round(x * 1000) / 10);
};
const normFrac = (v) => String(v).replace(/\s+/g, "");
// --bata: azure-speech spells the fraction word बटा as बता ("2 बता दो" = 2/2); read "<number> बता <number>" as a fraction
const BATA = process.argv.includes("--bata");
const readable = (t) => (BATA ? t.replace(/(\S+)\s+बता\s+(\S+)/g, (all, a, b) => (valuesOf(a).length && valuesOf(b).length ? `${a} बटा ${b}` : all)) : t);

function itemsOf(events) {
  const items = [];
  let cur = null;
  for (const e of events) {
    if (e.type === "input_audio_buffer.speech_started") { cur = { a0: e.a0, a1: null, text: null }; items.push(cur); }
    else if (e.type === "input_audio_buffer.speech_stopped" && cur) cur.a1 = e.a1;
    else if ((e.type === "conversation.item.input_audio_transcription.completed" || e.type === "conversation.item.input_audio_transcription.failed") && cur) { cur.text = e.text ?? ""; cur = null; }
  }
  return items.filter((x) => x.a0 !== null && x.a0 !== undefined);
}

const out = {};
for (const arm of ARMS) {
  const rows = [];
  for (const v of VARS) {
    for (const f of fs.readdirSync(path.join(BAKE, "runs")).filter((x) => x.startsWith(`${arm}.${v}.`))) {
      const id = f.slice(`${arm}.${v}.`.length, -5);
      const m = JSON.parse(fs.readFileSync(path.join(BAKE, `${id}.json`), "utf8"));
      const run = JSON.parse(fs.readFileSync(path.join(BAKE, "runs", f), "utf8"));
      const items = itemsOf(run.events ?? run.stt ?? []);
      for (const s of m.gold.childSegs.filter((x) => x.value !== null && x.value !== undefined)) {
        // VAD padding: an item covers [a0, a1]; the segment counts when they overlap
        const its = items.filter((x) => x.a0 <= s.end + 100 && (x.a1 ?? Infinity) >= s.start - 100);
        const text = its.map((x) => x.text ?? "").join(" ").trim();
        let res;
        if (s.value === "yes") res = YES.test(text) ? "right" : NO.test(text) ? "wrong" : "lost";
        else {
          const got = valuesOf(readable(text)).map((x) => normFrac(x.v));
          res = !got.length ? "lost" : got.includes(normFrac(s.value)) ? "right" : "wrong";
        }
        rows.push({ id, variant: v, gold: s.value, text, res });
      }
    }
  }
  const n = rows.length, k = (r) => rows.filter((x) => x.res === r).length;
  out[arm] = { n, right: k("right"), wrong: k("wrong"), lost: k("lost"), wrongRatePct: n ? Math.round((1000 * k("wrong")) / n) / 10 : null, wrongCI95: wilson(k("wrong"), n),
    wrongs: rows.filter((x) => x.res === "wrong").map((x) => `${x.id}/${x.variant}: ${x.gold} → "${x.text.slice(0, 40)}"`) };
}
console.log(JSON.stringify(out, null, 1));
