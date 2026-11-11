import { dhdStreamWs, prewarmDhdWs } from "/home/user/Taxila/server/voice/azureTtsWs.js";
import { edgeTrim } from "/home/user/Taxila/server/voice/expressive/pauses.js";
const E = process.env; E.AZURE_SPEECH_REGION = E.AZURE_SPEECH_REGION_SIN; E.AZURE_SPEECH_KEY = E.AZURE_SPEECH_KEY_SIN;
const ssml = (t) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN"><voice name="en-IN-Diya:DragonHDLatestNeural">${t}</voice></speak>`;
const L = ["Bilkul sahi, cube ke chhe faces hote hain.", "Achha, ek baar phir se gin ke dekho.", "Do faces jahan milte hain, use edge kehte hain.", "Shabash, ab batao, corner kitne hain?"];
await prewarmDhdWs();
for (let i = 0; i < 8; i++) {
  const t0 = performance.now();
  const s = await dhdStreamWs(ssml(L[i % 4]), { words: false });
  const fb = performance.now() - t0;
  let trimmed = 0, bytes = 0, firstChunkAt = 0;
  for await (const c of edgeTrim((async function* () { for await (const x of s.chunks) { bytes += x.length; yield x; } })(), { lead: true, tail: true })) { if (!trimmed) { trimmed = performance.now() - t0; } }
  console.log(`first byte ${Math.round(fb)} ms · first kept (edge-trimmed) ${Math.round(trimmed)} ms · total ${Math.round(performance.now() - t0)} ms · ${bytes} bytes`);
}
process.exit(0);
