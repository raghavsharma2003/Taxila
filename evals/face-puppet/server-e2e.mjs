// Live end-to-end of patch 01 on a PATCHED server tree (pass its root): two parts of one reply through the real
// speakChunk (DragonHD via the websocket), consumed the way routes/voice.js consumes them (edgeTrim with onLead, marks
// subscribed at the part's first chunk), then the same two parts again from the memory cache (marks must come back).
//   node --env-file=.env.local evals/face-puppet/server-e2e.mjs <patched root>
const root = process.argv[2];
process.env.AZURE_SPEECH_REGION ||= process.env.AZURE_SPEECH_REGION_SIN;
process.env.AZURE_SPEECH_KEY ||= process.env.AZURE_SPEECH_KEY_SIN;
const { speakChunk, voiceLane, speechStyle } = await import(`${root}/server/voice/speech.js`);
const { edgeTrim } = await import(`${root}/server/voice/expressive/pauses.js`);
const { plainSsml } = await import(`${root}/server/voice/expressive/compile/dhd.js`);
const V = { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 };
const parts = ["Chalo, aaj hum fractions dekhenge.", "Thoda dhyaan se dekho, yeh tukda kitna bada hai?"];
const style = { ...speechStyle({ id: "asha" }, "coral"), engine: "dhd", dhd: V };
async function reply(tag) {
  const lane = voiceLane("00000000-0000-0000-0000-0000000000e2");
  const jobs = parts.map((p) => speakChunk(p, style, undefined, { engine: "dhd", ssml: plainSsml(p, V), store: "memory" }, lane));
  const rows = [];
  for (let i = 0; i < jobs.length; i++) {
    let leadMs = -1, first = true, off = null, bytes = 0; const vq = [];
    const t0 = performance.now(); let firstMs = 0;
    for await (const c of edgeTrim(jobs[i].read(), { lead: true, tail: i < parts.length - 1, onLead: (n) => { leadMs = Math.round(n / 24); } })) {
      if (first) { first = false; firstMs = Math.round(performance.now() - t0); off = jobs[i].marks?.onMarks?.((m) => vq.push(m)) ?? null; }
      bytes += c.length;
    }
    off?.();
    const v = vq.flatMap((m) => m.visemes), w = vq.flatMap((m) => m.words ?? []);
    rows.push({ run: tag, part: i, cached: !!jobs[i].cached, firstChunkMs: firstMs, seconds: +(bytes / 48000).toFixed(2), leadMs, visemes: v.length, words: w.length });
  }
  return rows;
}
const a = await reply("live"), b = await reply("cache");
console.table([...a, ...b]);
process.exit(0);
