// Recorded clips and the blind-judge grid, rendered by the PRODUCTION puppet (src/face-puppet stage → driver → judged
// runtime) on a scripted clock in Chromium (harness capture mode).
//   node evals/face-puppet/clip.mjs lesson   → out/clip-lesson.mp4 (+ frames) : a 36 s lesson moment driven ONLY by product
//                                             inputs: floor status, Diya PCM tap + her viseme events, faceCues affects
//                                             (delight, gentle_concern), duplex poses + content-blind nods
//   node evals/face-puppet/clip.mjs grid     → out/judge/grid_X.jpg + ref.jpg : the r6/r7/r8 judge grid (same 9 cells, same
//                                             order) rendered through the production stage
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";

const what = process.argv[2] || "lesson";
const OUT = "evals/face-puppet/out/";
const PORT = 4722;
const srv = spawn(process.execPath, ["evals/face-puppet/serve.mjs", String(PORT)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 760, height: 760 } });
await page.goto(`http://127.0.0.1:${PORT}/h/index.html?mode=capture&px=720`);
await page.waitForFunction("window.H && (window.H.ready || window.H.error)", null, { timeout: 60000 });
const err = await page.evaluate("window.H.error");
if (err) throw new Error(err);
const el = await page.$("#host");
const H = (expr) => page.evaluate(expr);

function pcmEnv(id) {
  const b = fs.readFileSync(`${OUT}diya/${id}.pcm`);
  const s = new Int16Array(b.buffer, b.byteOffset, b.length >> 1);
  const lv = [];
  for (let i = 0; i + 1200 <= s.length; i += 1200) { let e = 0; for (let j = i; j < i + 1200; j++) e += (s[j] / 32768) ** 2; lv.push(Math.min(1, Math.sqrt(e / 1200) * 9)); } // 50 ms steps
  return lv;
}

try {
  if (what === "lesson") {
    const FPS = 30, DUR = 36;
    const dir = `${OUT}frames-lesson/`;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const meta = (id) => JSON.parse(fs.readFileSync(`${OUT}diya/${id}.json`, "utf8"));
    const L = [{ id: "00", at: 2000 }, { id: "14", at: 18200, affect: "delight" }, { id: "04", at: 26600, affect: "gentle_concern" }];
    for (const l of L) l.end = l.at + meta(l.id).ms;
    const child = pcmEnv("05"); // a recorded voice standing in for the child's mic LEVEL only (its audio is not in the clip)
    const CH0 = 9000, CH1 = 15000;
    // content-blind continuer nods at the stand-in's phrase pauses (>= 250 ms below 0.12 after >= 600 ms voiced), <= 1 per 3 s
    const nods = [];
    { let voiced = 0, quiet = 0, last = -1e9; for (let i = 0; i < child.length; i++) { const t = CH0 + i * 50; if (t > CH1) break; if (child[i] > 0.12) { voiced += 50; quiet = 0; } else { quiet += 50; if (voiced >= 600 && quiet === 250 && t - last >= 3000) { nods.push(t); last = t; voiced = 0; } } } }
    const timeline = [];
    let done = new Set();
    const events = [
      [0, `H.status(null)`],
      ...L.flatMap((l) => [[l.at - 400, l.affect ? `H.affect("${l.affect}")` : "0"], [l.at - 1, `H.line("${l.id}", ${l.at})`], [l.at, `H.status("speaking")`], [l.end + 300, `H.status("your_turn")`]]),
      [CH0 - 200, `H.status("listening")`], [CH0 - 150, `H.pose("listening", ${CH0 - 150})`],
      ...nods.map((t) => [t, `H.nod(4, ${t})`]),
      [CH1 + 200, `H.status("thinking")`], [CH1 + 210, `H.pose("thinking", ${CH1 + 210})`], [CH1 + 210, `H.child(0)`],
      [17600, `H.pose("speaking", 17600)`], [33500, `H.status(null)`],
    ].sort((a, b) => a[0] - b[0]);
    let ei = 0;
    for (let f = 0; f < FPS * DUR; f++) {
      const ms = Math.round((f * 1000) / FPS);
      while (ei < events.length && events[ei][0] <= ms) { await H(`(async () => { const H = window.H; ${events[ei][1]}; })()`); ei++; }
      if (ms >= CH0 && ms < CH1) await H(`window.H.child(${child[Math.floor((ms - CH0) / 50)] ?? 0})`);
      const d = await H(`window.H.shot(${ms}, "image/jpeg")`);
      const snap = await H(`window.H.stage.snapshot()`);
      timeline.push({ ms, state: snap.state, lip: snap.lipSource });
      fs.writeFileSync(`${dir}${String(f).padStart(5, "0")}.jpg`, Buffer.from(d.split(",")[1], "base64"));
    }
    // audio: her three lines at their times (the child's stand-in is level-only, silent in the clip)
    const wav = `${OUT}lesson-audio.wav`;
    const inputs = L.flatMap((l) => ["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", `${OUT}diya/${l.id}.pcm`]);
    const filt = L.map((l, i) => `[${i}]adelay=${l.at}|${l.at}[a${i}]`).join(";") + ";" + L.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${L.length}:normalize=0,apad=whole_dur=${DUR}[o]`;
    execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", filt, "-map", "[o]", "-t", String(DUR), wav]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", `${dir}%05d.jpg`, "-i", wav, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-c:a", "aac", "-shortest", `${OUT}clip-lesson.mp4`]);
    fs.writeFileSync(`${OUT}clip-lesson-timeline.json`, JSON.stringify({ lines: L, nods, timeline: timeline.filter((_, i) => i % 15 === 0) }, null, 1));
    console.log("clip", fs.statSync(`${OUT}clip-lesson.mp4`).size, "B; nods", nods.length);
  } else if (what === "grid") {
    const dir = `${OUT}judge/`;
    fs.mkdirSync(dir, { recursive: true });
    const cells = [];
    let t = 0;
    const shot = async (name) => { const p = `${dir}cell-${cells.length}-${name}.png`; const d = await H(`window.H.shot(${t})`); fs.writeFileSync(p, Buffer.from(d.split(",")[1], "base64")); cells.push(p); };
    const go = async (ms) => { t = ms; await H(`window.H.at(${ms})`); };
    await go(1400); await shot("rest");
    // talking: line 00 from 2.0 s; the frame nearest 2.0 s + the line's widest open vowel (between syllables, mouth open)
    const m = JSON.parse(fs.readFileSync(`${OUT}diya/00.json`, "utf8"));
    const aa = m.visemes.find((v, i) => v.id === 2 && v.ms > 600 && (m.visemes[i + 1]?.ms ?? 1e9) - v.ms >= 120) ?? m.visemes[8];
    await H(`window.H.line("00", 2000)`); await H(`window.H.status("speaking")`);
    await go(2000 + aa.ms + 40); await shot("talking");
    await H(`window.H.status("your_turn")`);
    await go(9000);
    const held = async (name, setup, variant, ms = 1200) => { await H(setup); await go(t + ms); await shot(name); await H(`window.H.release()`); await H(`window.H.head(null)`); await go(t + 1500); };
    await H(`window.H.status("thinking")`); await H(`window.H.pose("thinking", ${t})`); await go(t + 1500); await shot("thinking");
    await H(`window.H.status("your_turn")`); await H(`window.H.pose("your_turn", ${t})`); await go(t + 1500);
    await held("delight", `window.H.emote("delight", 0)`);
    await held("concern", `window.H.emote("concern", 0)`);
    await held("surprise", `window.H.emote("surprise", 0)`);
    await held("playful", `window.H.emote("playful", 0)`);
    await held("concernB", `window.H.emote("concern", 1)`);
    await held("turn", `window.H.head([0, 20, 0])`, undefined, 900);
    // 3x3 grid at 384 px per cell (r8's grid_X geometry), and the reference
    execFileSync("ffmpeg", ["-v", "error", "-y", ...cells.flatMap((c) => ["-i", c]), "-filter_complex", cells.map((_, i) => `[${i}]scale=384:384[s${i}]`).join(";") + ";" + cells.map((_, i) => `[s${i}]`).join("") + "xstack=inputs=9:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0|0_h0+h3|w0_h0+h3|w0+w1_h0+h3", "-q:v", "3", `${dir}grid_X.jpg`]);
    fs.copyFileSync("docs/design/teacher/puppet2d/judge-r8/ref.jpg", `${dir}ref.jpg`);
    console.log("grid", cells.length, "cells");
  }
} finally {
  await browser.close();
  srv.kill();
}
