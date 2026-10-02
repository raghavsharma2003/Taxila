// Second, independent ASR pass over every clip: taxila-transcribe with NO language hint (the first pass forced
// language=hi for hl/hi, which was seen translating English number words into Hindi ones). score.mjs then
// counts a flag as confirmed only when both transcripts show it.
import fs from "fs";
const KEY = process.env.AZURE_OPENAI_API_KEY;
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "").replace(/\/openai\/v1$/, "");
const TR = process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe";
const F = new URL("./raw.json", import.meta.url);
const raw = JSON.parse(fs.readFileSync(F, "utf8"));
const PROMPT = "Verbatim transcript. Write each word in the language it was spoken in; write every number, symbol and unit as the spoken words, never as digits or symbols.";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const todo = raw.rows.filter((r) => !r.err && r.asr2 == null);
let k = 0;
async function worker() {
  while (k < todo.length) {
    const r = todo[k++];
    const buf = fs.readFileSync(new URL(`./${r.clip}`, import.meta.url));
    for (let a = 1; a <= 5; a++) {
      const fd = new FormData();
      fd.append("file", new Blob([buf], { type: "audio/wav" }), "a.wav"); fd.append("prompt", PROMPT);
      let res; try { res = await fetch(`${BASE}/openai/deployments/${TR}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd, signal: AbortSignal.timeout(90_000) }); }
      catch { await sleep(3000 * a); continue; }
      if (res.status === 429) { await sleep(4000 * a); continue; }
      r.asr2 = res.ok ? (await res.json()).text || "" : `ERR HTTP ${res.status}`; break;
    }
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
fs.writeFileSync(F, JSON.stringify(raw, null, 1));
console.log(`asr2 done: ${raw.rows.filter((r) => r.asr2 && !r.asr2.startsWith("ERR")).length}/${raw.rows.length}`);
