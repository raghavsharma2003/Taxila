import fs from "fs"; import { execFileSync } from "child_process";
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const r = await fetch(`${E}/audio/speech`, { method: "POST", headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" },
  body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: "coral", input: process.argv[4] || "Haan didi, mujhe lagta hai cube ke chhe faces hote hain, aur aath corners.", instructions: "Voice of a shy 9-year-old Indian child answering a teacher in class. Natural, a little hesitant, Indian accent, not theatrical.", response_format: "pcm" }) });
if (!r.ok) throw new Error("tts " + r.status);
const dir = process.argv[2]; fs.writeFileSync(dir + "/raw.pcm", Buffer.from(await r.arrayBuffer()));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", dir + "/raw.pcm", "-af", "asetrate=28800,aresample=24000,atempo=0.8333", "-ar", "24000", "-ac", "1", process.argv[3]]);
console.log("speech.wav written", fs.statSync(process.argv[3]).size, "bytes");
