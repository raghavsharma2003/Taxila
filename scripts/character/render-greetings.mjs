// Render her daily home greetings (server/face-puppet/greetings.js) once, in Diya's DragonHD voice, into
// public/audio/hello-day-<id>.mp3, then write each clip's viseme sidecar (scripts/character/clip-visemes.py).
// Needs the Azure speech keys in .env.local (the same as the lesson's TTS); one short clip per line, 27 lines in all, a
// one-off spend of a few cents. Skips clips that already exist unless --force.
//   node --env-file=.env.local scripts/character/render-greetings.mjs [--force] [--only en-m1,hi-a2]
//   then: HF_HOME=/tmp/claude-0/char/hf python3 scripts/character/clip-visemes.py public/audio/hello-day-*.mp3
import fs from "node:fs";
import { GREETINGS } from "../../server/face-puppet/greetings.js";
import { dhdClip } from "../../server/voice/azureTts.js";
import { plainSsml } from "../../server/voice/expressive/compile/dhd.js";
import { dhdVoiceFor } from "../../server/voice/voices.js";
import { spokenOptsForChild } from "../../server/voice/spoken.js";

const force = process.argv.includes("--force");
const only = process.argv.includes("--only") ? new Set(process.argv[process.argv.indexOf("--only") + 1].split(",")) : null;
const v = dhdVoiceFor("asha");
const dv = { voice: v.dhd, baseRate: v.baseRate };
let made = 0;
for (const [lang, parts] of Object.entries(GREETINGS)) {
  const spoken = spokenOptsForChild({ language_pref: lang, class_level: 6 });
  for (const lines of Object.values(parts)) {
    for (const [id, text] of lines) {
      if (only && !only.has(id)) continue;
      const out = `public/audio/hello-day-${id}.mp3`;
      if (fs.existsSync(out) && !force) continue;
      const audio = await dhdClip(plainSsml(text, dv, spoken));
      fs.writeFileSync(out, audio);
      made++;
      console.log(out, audio.length, "B:", text);
    }
  }
}
console.log(`${made} clip(s) rendered; now run clip-visemes.py on public/audio/hello-day-*.mp3`);
