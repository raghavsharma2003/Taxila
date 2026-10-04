// Duplex cost per lesson-hour (critique of duplex v2, 2026-10-04): what the duplex layer ADDS on top of the cascade's
// expected $1.61/h (docs/ops/MODEL-STACK.md §2.2, which already bills 60 min of streamed STT per hour).
//
// Measured here at L1 on a TaxilaFDB test sample, per child turn that ended in a reply: speculative draft tokens (used and
// wasted), warm-TTS characters synthesised and thrown away, semantic-estimate calls (stage A + LLM arm). Scaled to a
// lesson-hour by A1 = 80 child turns / hour (MODEL-STACK §2.1 expected [E]). Prices: MODEL-STACK §1 (Azure retail
// 2026-10-04): taxila-fast in $0.20 / out $1.20 per 1M; DragonHD $22 per 1M chars; grok-4-1-fast-nr in $0.20 / out
// $0.50 per 1M; semantic call ≈ 700 in / 12 out tokens [E: the semantic.js prompt size, not billed here].
//
//   node evals/duplex/critic/cost.mjs [--every 4]
import fs from "node:fs";
import path from "node:path";
import { listStreams, loadStream, runStream, STREAMS } from "../taxilafdb/world.mjs";
import { armSpec } from "../taxilafdb/arms.mjs";
import { facts } from "../taxilafdb/metrics.mjs";

const argv = process.argv.slice(2);
const every = Number(argv[argv.indexOf("--every") + 1] || 4);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const P = { fastIn: 0.2e-6, fastOut: 1.2e-6, ttsChar: 22e-6, semIn: 0.2e-6, semOut: 0.5e-6, semTokIn: 700, semTokOut: 12, turnsPerHour: 80 };

const ids = listStreams().filter((id, i) => i % every === 0 && JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8")).meta.split === "test");
const out = {};
let semantic = null;
try { semantic = (await import("../taxilafdb/semantic.mjs")).loadSemanticCache(); } catch { semantic = null; }
for (const lane of ["FAST", "D4"]) for (const name of ["stage-a", "stage-a-sem"]) {
  if (name === "stage-a-sem" && !semantic) continue;
  const acc = { streams: 0, replyTurns: 0, usedIn: 0, usedOut: 0, wastedIn: 0, wastedOut: 0, draftStarts: 0, warmStarts: 0, warmWastedChars: 0, warmPromoted: 0, semCalls: 0, speaks: 0 };
  for (const id of ids) {
    const d = loadStream(id);
    const r = await runStream(d, { ...armSpec(name, { semantic }), lane });
    const f = facts(r);
    const s = r.specFull || {};
    acc.streams++;
    acc.replyTurns += r.speaks.filter((c) => c.reason !== "safeguard").length;
    acc.usedIn += s.tokens?.used?.in ?? 0; acc.usedOut += s.tokens?.used?.out ?? 0;
    acc.wastedIn += s.tokens?.wasted?.in ?? 0; acc.wastedOut += s.tokens?.wasted?.out ?? 0;
    acc.draftStarts += s.prepare?.draftStarts ?? 0; acc.warmStarts += s.prepare?.warmStarts ?? 0;
    acc.warmWastedChars += s.prepare?.warmWastedChars ?? 0; acc.warmPromoted += s.prepare?.warmPromoted ?? 0;
    acc.semCalls += r.semCalls || 0;
    void f;
  }
  const perTurn = (x) => x / Math.max(1, acc.replyTurns);
  const draft$ = perTurn(acc.wastedIn) * P.fastIn + perTurn(acc.wastedOut) * P.fastOut;
  const warm$ = perTurn(acc.warmWastedChars) * P.ttsChar;
  const sem$ = perTurn(acc.semCalls) * (P.semTokIn * P.semIn + P.semTokOut * P.semOut);
  out[`${name}@${lane}`] = {
    ...acc,
    perReplyTurn: { draftStarts: +perTurn(acc.draftStarts).toFixed(2), wastedTokensIn: Math.round(perTurn(acc.wastedIn)), wastedTokensOut: Math.round(perTurn(acc.wastedOut)),
      warmStarts: +perTurn(acc.warmStarts).toFixed(2), warmWastedChars: Math.round(perTurn(acc.warmWastedChars)), semCalls: +perTurn(acc.semCalls).toFixed(2) },
    addedUsdPerLessonHour: { wastedDrafts: +(draft$ * P.turnsPerHour).toFixed(4), wastedWarmTts: +(warm$ * P.turnsPerHour).toFixed(4), semantic: +(sem$ * P.turnsPerHour).toFixed(4),
      total: +((draft$ + warm$ + sem$) * P.turnsPerHour).toFixed(4) },
  };
  console.log(`${name}@${lane}`, JSON.stringify(out[`${name}@${lane}`].perReplyTurn), JSON.stringify(out[`${name}@${lane}`].addedUsdPerLessonHour));
}
const file = path.join(HERE, "../results/critic-cost-2026-10-04.json");
fs.writeFileSync(file, JSON.stringify({ id: "critic-cost", date: "2026-10-04", streams: ids.length, prices: P,
  method: "L1 TaxilaFDB test sample (every Nth stream), Speculator accounting from the simulated launcher (token counts are the draft model's [E] sizes, harness.mjs draftModel), scaled by A1 = 80 child turns per lesson-hour [E]",
  base: "cascade expected $1.61/h incl. 60 min streamed STT (MODEL-STACK §2.2)", table: out }, null, 1));
console.log("→", path.relative(process.cwd(), file));
