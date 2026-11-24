// Her daily home greeting clips, end to end (round 7 face-home-daily-greeting): the one command to run once the owner
// approves the spend (docs/design/round7/OWNER.md, spend batch: 27 clips, a few cents) and the Azure keys are back.
//   node scripts/character/greetings-pipeline.mjs                 dry run (the default): what exists, what a run would
//                                                                 make, and whether this machine can do it. No Azure call.
//   node --env-file=.env.local scripts/character/greetings-pipeline.mjs --run [--only en-m1,hi-a2] [--force]
// A run does, in order:
//   1. render   the missing clips (render-greetings.mjs: Diya DragonHD, Azure speech; the only paid step)
//   2. sidecars the viseme + word sidecar of every clip that has none (clip-visemes.py: wav2vec2 letter CTC, CPU, free)
//   3. checks   every line has a clip AND a sidecar with visemes; every b / m / p word of a sidecar has a lip seal
//               (viseme 21) inside it; the server hands a clip to a child (greetings.js greetingFor). Exits 1 on a failed
//               check, so a half-made set is never mistaken for a finished one.
// The clips then reach a child with no deploy step beyond the usual one: greetingFor serves a clip as soon as its file
// exists (public/audio/hello-day-<id>.mp3), and the client lip-syncs it from the sidecar (src/face-puppet/clipBridge.ts).
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { greetingLines, renderGreetings } from "./render-greetings.mjs";
import { greetingFor } from "../../server/face-puppet/greetings.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const arg = (k) => process.argv.includes(k);
const only = arg("--only") ? new Set(process.argv[process.argv.indexOf("--only") + 1].split(",")) : null;

export const sidecarOf = (clipFile) => clipFile.replace(/\.mp3$/, ".visemes.json");
const BIL_ROMAN = /(^|[^p])(?:b|m|p(?!h))/;
/** A sidecar word that should close her lips (the sidecar's words are the CTC's rough Roman letters). */
export const bilabialWord = (t) => BIL_ROMAN.test(String(t).toLowerCase().replace(/[^a-z]/g, ""));

/** Checks on one line's files. Pure apart from reading them. */
export function checkLine(l, read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null)) {
  const problems = [];
  if (read(l.file) == null) problems.push("no clip");
  const raw = read(sidecarOf(l.file));
  if (raw == null) { problems.push("no sidecar"); return { id: l.id, problems, seals: null }; }
  let side;
  try { side = JSON.parse(raw); } catch { problems.push("sidecar is not JSON"); return { id: l.id, problems, seals: null }; }
  if (!Array.isArray(side.visemes) || !side.visemes.length) problems.push("sidecar has no visemes");
  const words = (side.words ?? []).filter((w) => bilabialWord(w.text));
  const sealed = words.filter((w) => (side.visemes ?? []).some((v) => v.id === 21 && v.ms >= w.ms - 60 && v.ms <= w.ms + w.durMs));
  if (sealed.length < words.length) problems.push(`lip seals ${sealed.length}/${words.length}`);
  return { id: l.id, problems, seals: `${sealed.length}/${words.length}` };
}

/** Whether this machine can make the sidecars: python3 with torch + transformers, and ffmpeg. */
export function sidecarToolsReady() {
  const py = spawnSync("python3", ["-c", "import torch, transformers, numpy"], { encoding: "utf8" });
  const ff = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return { python: py.status === 0, ffmpeg: ff.status === 0 };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const run = arg("--run");
  const lines = greetingLines().filter((l) => !only || only.has(l.id));
  const missingClips = lines.filter((l) => !fs.existsSync(l.file));
  const tools = sidecarToolsReady();
  const keys = !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION); // server/voice/azureTts.js dhdConfig
  console.log(`greetings: ${lines.length} lines (${lines.reduce((a, l) => a + l.text.length, 0)} characters), ${lines.length - missingClips.length} clips rendered, ${missingClips.length} to render`);
  console.log(`this machine: Azure speech key + region in env ${keys ? "yes" : "NO"} · python torch/transformers ${tools.python ? "yes" : "NO"} · ffmpeg ${tools.ffmpeg ? "yes" : "NO"}`);
  if (!run) {
    for (const l of missingClips) console.log(`  would render ${l.id} (${l.lang} ${l.part}): ${l.text}`);
    console.log(`dry run: nothing called. A run renders ${missingClips.length} clip(s) on Azure (the only paid step), then sidecars and checks.`);
    process.exit(0);
  }
  if (missingClips.length || arg("--force")) {
    const made = await renderGreetings({ force: arg("--force"), only });
    console.log(`1. render: ${made.length} clip(s)`);
  } else console.log("1. render: nothing to render");
  const needSide = lines.filter((l) => fs.existsSync(l.file) && (arg("--force") || !fs.existsSync(sidecarOf(l.file))));
  if (needSide.length) {
    if (!tools.python || !tools.ffmpeg) { console.error("2. sidecars: this machine lacks python torch/transformers or ffmpeg (see clip-visemes.py)"); process.exit(1); }
    const r = spawnSync("python3", [`${ROOT}scripts/character/clip-visemes.py`, ...needSide.map((l) => l.file)], { stdio: "inherit" });
    if (r.status !== 0) { console.error("2. sidecars: clip-visemes.py failed"); process.exit(1); }
    console.log(`2. sidecars: ${needSide.length} written`);
  } else console.log("2. sidecars: all present");
  const results = lines.map((l) => checkLine(l));
  const bad = results.filter((r) => r.problems.length);
  for (const r of results) console.log(`  ${r.id}: ${r.problems.length ? r.problems.join("; ") : "ok"}${r.seals ? ` (seals ${r.seals})` : ""}`);
  const kid = { id: "c-pipeline-check", language_pref: lines[0]?.lang ?? "english" };
  const g = greetingFor(kid);
  console.log(`3. checks: ${results.length - bad.length}/${results.length} lines ok; the server hands ${kid.language_pref} "${g.id}" ${g.clip ? `with its clip ${g.clip}` : "WITHOUT a clip"}`);
  process.exit(bad.length || !g.clip ? 1 : 0);
}
