// Pool the product-path runs (out/lipsync-product-<tag>.json) by arm: first draw, reveal, freezes in her voice (puppet vs
// the ?puppet=0 control), viseme coverage, fps under the throttled phone profile.
//   node evals/p2-face/summarise.mjs r0-fix- r0-v4- r0-off- r0-t4- r0-t6- fix- v4-
import fs from "node:fs";
import { q } from "./recorder.mjs";

const OUT = new URL("./out/", import.meta.url).pathname;
const prefixes = process.argv.slice(2);
const all = fs.readdirSync(OUT).filter((f) => /^lipsync-product-.*\.json$/.test(f) && !f.endsWith("-raw.json") && !f.includes("-score"));
const res = { date: new Date().toISOString().slice(0, 10), arms: {} };
for (const pre of prefixes) {
  const runs = all.filter((f) => f.startsWith(`lipsync-product-${pre}`)).map((f) => JSON.parse(fs.readFileSync(OUT + f, "utf8")));
  if (!runs.length) continue;
  const fd = runs.map((r) => r.firstDrawMs).filter((x) => x != null), rv = runs.map((r) => r.reveal?.ms).filter((x) => x != null);
  const fr = runs.map((r) => r.freezes).filter(Boolean);
  const voiced = fr.reduce((s, x) => s + x.voicedSecs, 0), f180 = fr.reduce((s, x) => s + x.over180, 0);
  const vis = runs.flatMap((r) => (r.replies ?? []).map((x) => x.visemeShare)).filter((x) => x != null);
  res.arms[pre] = {
    runs: runs.length, loadavg1m: { min: Math.min(...runs.map((r) => r.loadavg1m ?? NaN)), max: Math.max(...runs.map((r) => r.loadavg1m ?? NaN)) },
    face: [...new Set(runs.map((r) => r.face))], pageErrors: runs.reduce((s, r) => s + (r.pageErrors?.length ?? 0), 0),
    firstDrawMs: { n: fd.length, median: q(fd, 0.5), max: fd.length ? Math.max(...fd) : null },
    revealMs: { n: rv.length, median: q(rv, 0.5), max: rv.length ? Math.max(...rv) : null, why: runs.map((r) => r.reveal?.why ?? null) },
    revealedBeforeFirstSound: `${runs.filter((r) => r.revealedBeforeFirstSound === true).length}/${runs.filter((r) => r.revealedBeforeFirstSound != null).length}`,
    freezesInHerVoice: { voicedSecs: +voiced.toFixed(1), over180: f180, per10s: +((f180 / Math.max(1, voiced)) * 10).toFixed(2), maxMs: fr.length ? Math.max(...fr.map((x) => x.maxMs)) : null },
    visemeShareOfSpeakingFrames: { n: vis.length, median: q(vis, 0.5), min: vis.length ? Math.min(...vis) : null },
    replies: runs.reduce((s, r) => s + (r.replies?.length ?? 0), 0),
    fps: runs[0].fps ? { speakingFpsP50: q(runs.map((r) => r.fps?.speakingFpsP50).filter((x) => x != null), 0.5), idleFpsP50: q(runs.map((r) => r.fps?.idleFpsP50).filter((x) => x != null), 0.5), workP95Median: q(runs.map((r) => r.fps?.workP95Median).filter((x) => x != null), 0.5), workP95Max: Math.max(...runs.map((r) => r.fps?.workP95Max ?? 0)), finalDpr: runs.map((r) => r.fps?.finalDpr), finalFpsCap: runs.map((r) => r.fps?.finalFpsCap), governor: runs.flatMap((r) => r.fps?.governor ?? []).map((e) => e.step ?? e.reason) } : null,
  };
}
fs.writeFileSync(OUT + "summary.json", JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
