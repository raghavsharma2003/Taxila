// Writes public/assets/teacher/<look>/runtime.json: everything the src/avatar runtime needs that glTF cannot carry
// (correctives as products of parents, calibration gains, asymmetry, tier files and budgets). No names in it.
//   node scripts/character/runtime-json.mjs <buildDir> <look>
import fs from "node:fs";
import path from "node:path";
import { EMOTIONS, STATES, VISEME_TO_ARKIT, correctiveParents } from "./viewer/presets.js";

// the stage light rig is parsed from shaders.js (no three import in node): G9 was solved under exactly this rig
const shSrc = fs.readFileSync("scripts/character/bakeoff/stylised-premium/viewer/shaders.js", "utf8");
const lighting = JSON.parse(shSrc.match(/export const LIGHTING = (\{[\s\S]*?\});/)[1].replace(/(\w+):/g, '"$1":').replace(/,(\s*[}\]])/g, '$1'));

const [bd, look] = process.argv.slice(2);
const L = JSON.parse(fs.readFileSync(`art/character/bakeoff/stylised-premium/looks/${look}.json`));
const fin = JSON.parse(fs.readFileSync(path.join(bd, "finish.json")));
const st = { H: JSON.parse(fs.readFileSync(path.join(bd, "H.stats.json"))), Bplus: JSON.parse(fs.readFileSync(path.join(bd, "Bplus.stats.json"))) };
const rigSrc = fs.readFileSync("scripts/character/bakeoff/stylised-premium/viewer/rig.js", "utf8");
const calibration = JSON.parse(rigSrc.match(/CALIBRATION = (\{[\s\S]*?\});/)[1].replace(/(\w+):/g, '"$1":'));
const keysOf = (t) => st[t === "Blite" ? "Bplus" : t].faceKeys;
const out = {
  schema: 1, look, lookRev: 1,
  note: "Look assets carry no name: the child names the teacher; the name lives on the child record.",
  tiers: Object.fromEntries(["H", "Bplus", "Blite"].map((t) => [t, {
    file: `${t}.glb`, bytes: fin[t].bytes, triangles: fin[t].tris, draws: fin[t].draws, morphTargets: keysOf(t).length,
    morphTextureMB: fin[t].morphTextureMB, maps: Object.fromEntries(Object.entries(fin[t].slots).map(([m, s]) => [m, Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.map]))])),
  }])),
  meshes: { face: "TaxilaSkin (+ mouth interior by _region: 0 skin, 1 teeth, 2 tongue, 3 mouth bag)", eyes: "TaxilaEye (skinned to LeftEye/RightEye)",
    cards: "TaxilaCards (H: brows + lashes; B+: lashes)", hair: "TaxilaHair", garment: "TaxilaCloth", lens: "TaxilaLens (H, glasses look only)" },
  bones: ["Spine2", "Neck", "Head", "LeftEye", "RightEye", "LeftShoulder", "RightShoulder"],
  headSplit: { Neck: 0.35, Head: 0.65 },
  morphTargets: { H: keysOf("H"), Bplus: keysOf("Bplus") },
  correctives: Object.fromEntries(keysOf("H").filter((k) => correctiveParents(k)).map((k) => [k, correctiveParents(k)])),
  correctiveRule: "weight = product of the two parents' FINAL weights (after calibration and clamping)",
  calibration,
  calibrationNote: "empty since iteration 2: the scripted expression deltas are baked into the units (keys.py expression_correctives)",
  lighting,
  lightingRule: "src/avatar must render with exactly this rig (Neutral tone mapping, exposure 1): the skin albedo is solved against it (G9); a different rig re-opens G9",
  jawCeiling: L.jawCeiling ?? 0.85,
  lipDriverRequirements: "before H ships: (1) closure expander in src/avatar/lip.ts: energy below the gate -> jaw 0 within one frame, opening on a power curve > 1 (jaw falls faster than loudness); (2) HeadAudio viseme classes driving viseme_* on H and visemeFold on B+; (3) jaw clamped at jawCeiling. See CHARACTER-PIPELINE.md 4.2",
  lidFollow: { upper: 0.5, lower: 0.25, via: "eyeLookUp*/eyeLookDown* at gaze pitch / 25 deg" },
  visemeFold: { when: "the tier has no viseme_* morphs (B+, B-lite)", map: VISEME_TO_ARKIT },
  faceStyle: L.faceStyle, iris: L.eyes.iris,
  style: { approach: "stylised-premium", skin: JSON.parse(shSrc.match(/export const STYLE = (\{[\s\S]*?\});/)[1].replace(/(\w+):/g, '"$1":')),
    rule: "toon-PBR hybrid TaxilaSkin (wrap + two-tone ramp + warm shade tint + terminator band + fresnel rim), eye limbus 0.528 r; port this shaders.js / rig.js with the assets", stylise: L.stylise },
  emotions: EMOTIONS, states: STATES,
  plates: fs.existsSync(`art/character/bakeoff-assets/stylised-premium/${look}/plate/plate.json`) ? JSON.parse(fs.readFileSync(`art/character/bakeoff-assets/stylised-premium/${look}/plate/plate.json`)) : null,
};
fs.writeFileSync(`art/character/bakeoff-assets/stylised-premium/${look}/runtime.json`, JSON.stringify(out, null, 1));
console.log(`[runtime] ${look} runtime.json`);
