import { dhdStreamWs, prewarmDhdWs } from "/home/user/Taxila/server/voice/azureTtsWs.js";
import { onsetOf } from "/home/user/Taxila/server/voice/expressive/pauses.js";
const E = process.env; E.AZURE_SPEECH_REGION = E.AZURE_SPEECH_REGION_SIN; E.AZURE_SPEECH_KEY = E.AZURE_SPEECH_KEY_SIN;
const plain = (t) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN"><voice name="en-IN-Diya:DragonHDLatestNeural">${t}</voice></speak>`;
const lead0 = (t) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="en-IN-Diya:DragonHDLatestNeural"><mstts:silence type="Leading-exact" value="0ms"/>${t}</voice></speak>`;
const L = ["Bilkul sahi, cube ke chhe faces hote hain.", "Achha, ek baar phir se gin ke dekho.", "Do faces jahan milte hain, use edge kehte hain.", "Shabash, ab batao, corner kitne hain?"];
await prewarmDhdWs();
const res = { plain: [], lead0: [] };
for (let i = 0; i < 12; i++) for (const [k, f] of [["plain", plain], ["lead0", lead0]]) {
  const t0 = performance.now();
  let s; try { s = await dhdStreamWs(f(L[i % 4]), { words: false }); } catch (e) { console.log(k, "ERR", e.message.slice(0, 100)); continue; }
  const fb = performance.now() - t0;
  let all = Buffer.alloc(0), onAt = 0, onPos = -1;
  for await (const c of s.chunks) { all = Buffer.concat([all, Buffer.from(c)]); if (onPos < 0) { const o = onsetOf(all); if (o >= 0) { onPos = o; onAt = performance.now() - t0; } } }
  res[k].push([Math.round(fb), Math.round(onAt), Math.round(onPos / 24)]);
}
for (const [k, v] of Object.entries(res)) { const med = (j) => v.map((x) => x[j]).sort((a, b) => a - b)[v.length >> 1]; console.log(k, `n=${v.length} firstByte p50 ${med(0)} · onset arrives p50 ${med(1)} · onset position in audio p50 ${med(2)} ms`); }
process.exit(0);
