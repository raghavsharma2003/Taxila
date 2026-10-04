// gnm: the viewer's emotion / state presets as plain bs dictionaries (with the rig's product correctives), for gates.py
import { EMOTIONS, STATES, emotionPose, correctiveParents, VISEME_TO_ARKIT } from "./viewer/presets.js";
import fs from "node:fs";
const L = JSON.parse(fs.readFileSync(`art/character/bakeoff/gnm/looks/${process.argv[3] || "teal"}.json`));
const out = { emotions: {}, states: {} };
for (const e of Object.keys(EMOTIONS)) out.emotions[e] = emotionPose(e, 1, L.faceStyle.asym, L).bs;
for (const [k, s] of Object.entries(STATES)) { const e = emotionPose(s.affect[0], s.affect[1], L.faceStyle.asym, L); out.states[k] = { ...e.bs, ...(s.extra || {}) }; if (s.viseme) out.states[k][s.viseme[0]] = s.viseme[1]; }
const names = ["jawOpen_mouthClose", "jawOpen_mouthSmileLeft", "jawOpen_mouthSmileRight", "eyeBlink_eyeLookDownLeft", "eyeBlink_eyeLookDownRight", "eyeBlink_eyeSquintLeft", "eyeBlink_eyeSquintRight", "browInnerUp_browDownLeft", "browInnerUp_browDownRight", "cheekSquint_eyeBlinkLeft", "cheekSquint_eyeBlinkRight", "mouthFunnel_jawOpen"];
out.correctives = Object.fromEntries(names.map((n) => [n, correctiveParents(n)]));
out.jawCeiling = L.jawCeiling ?? 1;
out.visemeFold = VISEME_TO_ARKIT;
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
