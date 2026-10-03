// Re-synthesise the lip-bench stimulus audio from the committed viseme JSON (same text + voice) with the Azure Speech REST
// endpoint (Azure-only directive: first-party Azure Speech). The WAVs are not committed (6.3 MB).
//   node --env-file=.env.local evals/avatar/gen-stim-rest.mjs <outDir/>     (NODE_USE_ENV_PROXY=1 behind the proxy)
// Azure Speech REST endpoint. Never prints the key.
import fs from "node:fs";
const KEY = process.env.AZURE_OPENAI_API_KEY, REGION = process.env.SPEECH_REGION || "eastus2";
const SRC = "/home/user/Taxila/docs/research/avatar/bench/stim/", OUT = process.argv[2];
for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith(".json"))) {
  const m = JSON.parse(fs.readFileSync(SRC + f, "utf8"));
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${m.lang}"><voice name="${m.voice}">${m.text}</voice></speak>`;
  const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-bench" }, body: ssml });
  if (!r.ok) { console.log("ERR", f, r.status, (await r.text()).slice(0, 120)); continue; }
  const b = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(OUT + f.replace(".json", ".wav"), b);
  const lastVis = m.visemes.at(-1).t;
  console.log(f, "bytes", b.length, "durMs", Math.round((b.length - 44) / 48), "lastVisemeMs", Math.round(lastVis));
}
