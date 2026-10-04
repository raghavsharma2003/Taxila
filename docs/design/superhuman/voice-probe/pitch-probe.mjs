// pitch-probe.mjs — does en-IN DragonHD honour <prosody pitch>? n=3 per condition; f0 measured by splice.py f0 helper.
import fs from "node:fs";
const KEY = process.env.AZURE_OPENAI_API_KEY, REGION = process.env.SPEECH_REGION || "eastus2";
const LINE = "अरे! पहली बार में ही? तुमने ऊपर और नीचे दोनों को चार से divide किया।";
const lt = (s) => s.replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।.\-]*[ऀ-ॿ।!?]?/g, (m) => { const c = m.replace(/\s+$/, ""); return `<lang xml:lang="hi-IN">${c}</lang>` + m.slice(c.length); });
const C = { plain: (t) => lt(t), "pitch+15": (t) => `<prosody pitch="+15%">${lt(t)}</prosody>`, "pitch-10": (t) => `<prosody pitch="-10%">${lt(t)}</prosody>`, "vol-30": (t) => `<prosody volume="-30%">${lt(t)}</prosody>` };
fs.mkdirSync("pitch", { recursive: true });
for (const v of ["en-IN-Diya:DragonHDLatestNeural"]) for (const [c, f] of Object.entries(C)) for (let i = 0; i < 3; i++) {
  const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-pitch-probe" },
    body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN"><voice name="${v}">${f(LINE)}</voice></speak>` });
  console.log(c, i, r.status); if (r.ok) fs.writeFileSync(`pitch/${c}-${i}.wav`, Buffer.from(await r.arrayBuffer()));
}
