// Live test of patch 01's server module (docs/design/values/v4/patches/01-server-visemes/azureTtsWs.js) against Azure:
// sequential reuse of the pooled socket, two concurrent parts, words on/off, abort mid-stream.
//   node --env-file=.env.local evals/face-puppet/ws-module-test.mjs <path to a copy whose imports resolve>
import { plainSsml } from "../../server/voice/expressive/compile/dhd.js";
import { LINES } from "./lines.mjs";
const mod = await import(process.argv[2]);
const env = { ...process.env, AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION || process.env.AZURE_SPEECH_REGION_SIN, AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY || process.env.AZURE_SPEECH_KEY_SIN };
const V = { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 };
const out = [];
console.log("prewarm", await mod.prewarmDhdWs(env));
async function run(i, words) {
  const r = await mod.dhdStreamWs(plainSsml(LINES[i], V), { env, words });
  let bytes = 0, batches = 0;
  r.marks.onMarks(() => batches++);
  for await (const c of r.chunks) bytes += c.length;
  return { line: i, words, ttfbMs: r.ttfbMs, seconds: +(bytes / 48000).toFixed(2), visemes: r.marks.visemes.length, wordEvents: r.marks.words.length, batches };
}
for (const i of [1, 2, 3]) out.push(await run(i, false));
out.push(...(await Promise.all([run(4, false), run(5, true)])));
// abort mid-stream
const ac = new AbortController();
const r = await mod.dhdStreamWs(plainSsml(LINES[6], V), { env, signal: ac.signal });
let got = 0, err = null;
try { for await (const c of r.chunks) { got += c.length; if (got > 20000) ac.abort(); } } catch (e) { err = e.code; }
out.push({ abort: err, bytesBeforeAbort: got });
out.push(await run(7, false)); // the pool recovers after an aborted socket
console.table(out);
process.exit(0);
