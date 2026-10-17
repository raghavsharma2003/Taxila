// Builds the standalone demo art/character/puppet2d/lamp2/demo.html: demo/page.html (lamp1's scene and slots, rig
// swapped: make-page.py) with the bundle (production PuppetDriver + lamp2 KeyRig + the shipped r8 runtime), the pack
// (geom.json + every layer as a data URI) and the TTS line (WAV + Azure viseme / word marks) inlined.
//   node build-demo.mjs                                  (lamp2)
//   PACKDIR=public/face-puppet/r8 OUT_HTML=<path> node build-demo.mjs   (the r8 calibration through the same page)
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const HERE = "/home/user/Taxila/scripts/character/puppet2d/lamp2";
const SCR = process.env.L2_SCRATCH || "/tmp/claude-0/-home-user-Taxila/4f5bd6cc-5f93-53a8-934d-4a29dc9ad564/scratchpad/l2";
const PACKDIR = process.env.PACKDIR ? (process.env.PACKDIR.startsWith("/") ? process.env.PACKDIR : `/home/user/Taxila/${process.env.PACKDIR}`) : "/home/user/Taxila/art/character/puppet2d/lamp2";
const OUT_HTML = process.env.OUT_HTML || `${PACKDIR}/demo.html`;
fs.mkdirSync(`${SCR}/demo-build`, { recursive: true });
execFileSync("python3", ["-I", `${HERE}/demo/make-page.py`], { stdio: "inherit" });
execFileSync("/home/user/Taxila/node_modules/.bin/rolldown", ["-c", `${HERE}/demo/rolldown.config.mjs`], { cwd: "/home/user/Taxila", stdio: "inherit", env: { ...process.env, OUT_FILE: `${SCR}/demo-build/puppet.js` } });
const bundle = fs.readFileSync(`${SCR}/demo-build/puppet.js`, "utf8");
const geom = JSON.parse(fs.readFileSync(`${PACKDIR}/geom.json`, "utf8"));
const names = geom.rev === "lamp2" ? ["body", "head", ...Object.keys(geom.keys)] : Object.keys(geom.rects).filter((n) => n !== "bg").concat(["interior"]);
const imgs = {};
for (const n of names) imgs[n] = "data:image/webp;base64," + fs.readFileSync(`${PACKDIR}/${n}.webp`).toString("base64");
const marks = JSON.parse(fs.readFileSync(`${SCR}/tts/line-marks.json`, "utf8"));
const line = { text: marks.text, voice: marks.voice, visemes: marks.visemes, words: marks.words };
const wav = fs.readFileSync(`${SCR}/tts/line.wav`).toString("base64");
let page = fs.readFileSync(`${HERE}/demo/page.html`, "utf8");
const put = (k, v) => { const i = page.indexOf(k); if (i < 0) throw new Error("missing " + k); page = page.slice(0, i) + v + page.slice(i + k.length); };
put("/*BUNDLE*/", bundle.replace(/<\/script/gi, "<\\/script"));
put("/*PACK*/", JSON.stringify({ geom, imgs }));
put("/*LINE*/", JSON.stringify(line));
put("/*WAV*/", wav);
if (geom.rev !== "lamp2") page = page.replace("<body>", '<body class="r8">');
fs.writeFileSync(OUT_HTML, page);
console.log(OUT_HTML, (page.length / 1024).toFixed(0), "KB");
