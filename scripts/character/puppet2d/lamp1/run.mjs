// Run lamp1 image jobs (jobs.mjs) through imgapi.mjs (ledger + hard stop). PNG out to the scratch raw/ folder, a
// webp copy to docs/design/round4/asha/images/. Sources: <scratch>/raw/<src>.png. "AGE_PICK" resolves to the id in
// <scratch>/age-pick.txt (the age front chosen by eye).
//   NODE_USE_ENV_PROXY=1 node scripts/character/puppet2d/lamp1/run.mjs <id>[,<id>...] [--force] [--conc 2] [--jobs <file.mjs>]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { call } from "./imgapi.mjs";

const SCR = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha";
const RAW = `${SCR}/raw`, WEBP = "/home/user/Taxila/docs/design/round4/asha/images";
fs.mkdirSync(RAW, { recursive: true }); fs.mkdirSync(WEBP, { recursive: true });
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const jobsFile = opt("--jobs", "./jobs.mjs");
const { JOBS } = await import(new URL(jobsFile, import.meta.url));
const ids = (argv[0] || "").split(",").filter(Boolean);
const force = argv.includes("--force");
const conc = +opt("--conc", 2);
const resolveSrc = (s) => (s === "AGE_PICK" ? fs.readFileSync(`${SCR}/age-pick.txt`, "utf8").trim() : s === "RIG_PICK" ? fs.readFileSync(`${SCR}/rig-pick.txt`, "utf8").trim() : s);

const queue = ids.map((id) => { const j = JOBS[id]; if (!j) throw new Error(`no job ${id}`); return { id, ...j }; })
  .filter((j) => force || !fs.existsSync(`${RAW}/${j.id}.png`));
async function one(j) {
  const src = j.kind === "gen" ? [] : [{ file: `${RAW}/${resolveSrc(j.src)}.png`, name: "input.png" }, ...(j.extra || []).map((e) => ({ file: `${RAW}/${e}.png`, name: `${e}.png` }))];
  for (const s of src) if (!fs.existsSync(s.file)) throw new Error(`missing source ${s.file}`);
  const buf = await call({ tag: j.id, kind: j.kind || "edit", prompt: j.prompt, images: src, mask: j.mask || null, quality: j.quality || "high", size: j.size || "1024x1024", stage: j.stage || "" });
  fs.writeFileSync(`${RAW}/${j.id}.png`, buf);
  execFileSync("python3", ["-I", "-c", "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=90,method=6)", `${RAW}/${j.id}.png`, `${WEBP}/${j.id}.webp`]);
}
const worker = async () => { while (queue.length) { const j = queue.shift(); try { await one(j); } catch (e) { console.log(`[run] FAIL ${j.id}: ${e.message}`); } } };
await Promise.all(Array.from({ length: conc }, worker));
