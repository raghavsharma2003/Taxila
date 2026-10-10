// Builds the standalone demo art/character/puppet2d/lamp1/demo.html: demo/page.html with the rig bundle (production
// PuppetDriver + lamp1 runtime, rolldown IIFE), the pack (geom.json + every layer as a data URI: WebGL cannot read
// file:// images), and the TTS line (WAV + Azure viseme / word marks) inlined. Works from file:// and from any host.
//   node build-demo.mjs            (bundles first; writes demo.html and prints its size)
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const HERE = "/home/user/Taxila/scripts/character/puppet2d/lamp1";
const PACKDIR = "/home/user/Taxila/art/character/puppet2d/lamp1";
const SCR = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha";
// demo/rolldown.config.mjs: src/face-puppet's own ./runtime imports (driver.ts: Expressions, Listener; safety.ts) resolve to
// the lamp1 runtime, i.e. the bundle is the product after integrate/02
execFileSync("/home/user/Taxila/node_modules/.bin/rolldown", ["-c", `${HERE}/demo/rolldown.config.mjs`], { cwd: "/home/user/Taxila", stdio: "inherit", env: { ...process.env, OUT_FILE: `${SCR}/demo-build/puppet.js` } });
const bundle = fs.readFileSync(`${SCR}/demo-build/puppet.js`, "utf8");
const geom = JSON.parse(fs.readFileSync(`${PACKDIR}/geom.json`, "utf8"));
const imgs = {};
for (const n of Object.keys(geom.rects).filter((n) => n !== "bg").concat(["interior"])) imgs[n] = "data:image/webp;base64," + fs.readFileSync(`${PACKDIR}/${n}.webp`).toString("base64");
const marks = JSON.parse(fs.readFileSync(`${SCR}/tts/line-marks.json`, "utf8"));
const line = { text: marks.text, voice: marks.voice, visemes: marks.visemes, words: marks.words };
const wav = fs.readFileSync(`${SCR}/tts/line.wav`).toString("base64");
let page = fs.readFileSync(`${HERE}/demo/page.html`, "utf8");
const put = (k, v) => { const i = page.indexOf(k); if (i < 0) throw new Error("missing " + k); page = page.slice(0, i) + v + page.slice(i + k.length); };
put("/*BUNDLE*/", bundle.replace(/<\/script/gi, "<\\/script"));
put("/*PACK*/", JSON.stringify({ geom, imgs }));
put("/*LINE*/", JSON.stringify(line));
put("/*WAV*/", wav);
fs.writeFileSync(`${PACKDIR}/demo.html`, page);
console.log("demo.html", (page.length / 1024).toFixed(0), "KB");
