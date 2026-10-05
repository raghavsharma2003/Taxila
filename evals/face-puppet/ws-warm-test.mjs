// Review v4: does patch 01's socket pool stay warm across (a) a barge-in abort of the in-flight part and (b) an idle gap
// longer than IDLE_MS? Live against Azure; first audio of the NEXT part is the number that matters.
//   TAXILA_DHD_WS_IDLE_MS=8000 node --env-file=.env.local evals/face-puppet/ws-warm-test.mjs <path to azureTtsWs.js copy>
import fs from "node:fs";
import { plainSsml } from "../../server/voice/expressive/compile/dhd.js";
import { LINES } from "./lines.mjs";
const mod = await import(process.argv[2]);
const env = { ...process.env, AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION || process.env.AZURE_SPEECH_REGION_SIN, AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY || process.env.AZURE_SPEECH_KEY_SIN };
const region = env.AZURE_SPEECH_REGION;
const V = { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { date: new Date().toISOString().slice(0, 10), idleMs: mod.IDLE_MS, keepWarm: "KEEP_WARM_MS" in mod, rows: [] };
async function run(i, tag, signalAt) {
  const ac = new AbortController();
  const t0 = performance.now();
  const r = await mod.dhdStreamWs(plainSsml(LINES[i], V), { env, signal: ac.signal });
  let got = 0, err = null;
  try { for await (const c of r.chunks) { got += c.length; if (signalAt && got > signalAt) ac.abort(); } } catch (e) { err = e.code; }
  out.rows.push({ tag, ttfbMs: r.ttfbMs, totalMs: Math.round(performance.now() - t0), aborted: err, pool: mod.__pool ? mod.__pool(region) : "n/a" });
}
await mod.prewarmDhdWs(env);
await run(1, "warm");
await run(2, "abort-mid", 20000);
await sleep(2500);
await run(3, "after-abort");
await sleep(mod.IDLE_MS + 3000);
await run(4, "after-idle-gap");
await sleep(mod.IDLE_MS + 3000);
await run(5, "after-2nd-idle-gap");
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(`evals/face-puppet/out/ws-warm-${process.argv[3] || "run"}.json`, JSON.stringify(out, null, 1));
process.exit(0);
