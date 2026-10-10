// Round 4 face: image generation / edit runner on the Azure OpenAI image deployment (taxila-image = gpt-image-2),
// following scripts/character/stylised/gen-refs.mjs (generations for fronts, edits with input_fidelity high for the
// expression set). Keys come from .env.local and are never printed or written. Every call that returns an image is
// logged to docs/design/round4/face/gen.json (prompt, model, size, date, usage). Hard cap: 90 images in total.
//   NODE_USE_ENV_PROXY=1 node gen.mjs <jobId>[,<jobId>...] [--force] [--conc 2]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { JOBS } from "./jobs.mjs";

const REPO = "/home/user/Taxila";
const HERE = path.dirname(new URL(import.meta.url).pathname);
for (const line of fs.readFileSync(`${REPO}/.env.local`, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const DEP = process.env.DEPLOY_IMAGE || "taxila-image";
const LOG = `${REPO}/docs/design/round4/face/gen.json`;
const CAP = 90;
const argv = process.argv.slice(2);
const ids = (argv[0] || "").split(",").filter(Boolean);
const force = argv.includes("--force");
const conc = argv.includes("--conc") ? +argv[argv.indexOf("--conc") + 1] : 2;

const readLog = () => (fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, "utf8")) : {
  about: "Every image request made for the round-4 face options. model = Azure OpenAI deployment taxila-image (gpt-image-2) on the AZURE_OPENAI_ENDPOINT account (eastus2). Images that came back are counted against the 90-image cap whether kept or rejected. No keys or endpoint URLs are stored.",
  cap: CAP, images: [], failures: [] });
const writeLog = (L) => fs.writeFileSync(LOG, JSON.stringify(L, null, 1));
const used = () => readLog().images.length;

function toPng(srcWebpOrPng, outPng) {
  execFileSync("python3", ["-I", "-c", `import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2])`, srcWebpOrPng, outPng]);
}
function saveImage(job, j, ms, attempts) {
  const png = path.join(HERE, "raw", `${job.id}.png`), webp = path.join(HERE, "webp", `${job.id}.webp`);
  fs.writeFileSync(png, Buffer.from(j.data[0].b64_json, "base64"));
  execFileSync("python3", ["-I", "-c", `import sys;from PIL import Image;im=Image.open(sys.argv[1]);print(im.size);im.convert("RGB").save(sys.argv[2],quality=92,method=6)`, png, webp]);
  const L = readLog();
  // never drop a row: a forced re-run is a new image against the cap
  L.images.push({ id: job.id, family: job.family, kind: job.kind, src: job.src || null, model: `${DEP} (gpt-image-2)`, endpoint: "AZURE_OPENAI_ENDPOINT (eastus2)",
    size: job.size || "1024x1024", quality: job.quality || "high", input_fidelity: job.kind === "edit" ? (job.fidelity || "high") : null,
    date: new Date().toISOString(), ms, attempts, usage: j.usage ?? null, revised_prompt: j.data[0].revised_prompt ?? null, prompt: job.prompt });
  writeLog(L);
}
async function call(job) {
  const size = job.size || "1024x1024", quality = job.quality || "high";
  let attempts = 0;
  for (let i = 0; i < 6; i++) {
    if (used() >= CAP) throw new Error(`cap ${CAP} reached`);
    attempts++;
    const t0 = Date.now();
    let r;
    try {
      if (job.kind === "gen") {
        r = await fetch(`${E}/images/generations`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" },
          body: JSON.stringify({ model: DEP, prompt: job.prompt, n: 1, size, quality }), signal: AbortSignal.timeout(400_000) });
      } else {
        const srcPng = path.join(HERE, "raw", `${job.src}.png`);
        if (!fs.existsSync(srcPng)) toPng(path.join(HERE, "webp", `${job.src}.webp`), srcPng);
        const fd = new FormData();
        fd.append("model", DEP); fd.append("prompt", job.prompt); fd.append("n", "1"); fd.append("size", size);
        fd.append("quality", quality); fd.append("input_fidelity", job.fidelity || "high");
        fd.append("image[]", new Blob([fs.readFileSync(srcPng)], { type: "image/png" }), "front.png");
        r = await fetch(`${E}/images/edits`, { method: "POST", headers: { "api-key": K }, body: fd, signal: AbortSignal.timeout(400_000) });
      }
    } catch (e) {
      console.log(`[gen] ${job.id} network ${String(e.message).slice(0, 120)}; retry`);
      await new Promise((s) => setTimeout(s, 15000 * (i + 1)));
      continue;
    }
    const ms = Date.now() - t0;
    if (r.ok) {
      const j = await r.json();
      if (!j.data?.[0]?.b64_json) { const L = readLog(); L.failures.push({ id: job.id, status: 200, note: "no image in response", date: new Date().toISOString() }); writeLog(L); throw new Error("no image"); }
      saveImage(job, j, ms, attempts);
      console.log(`[gen] ${job.id} ok ${(ms / 1000).toFixed(1)} s out_tokens=${j.usage?.output_tokens ?? "?"} (images used ${used()}/${CAP})`);
      return;
    }
    const t = (await r.text()).slice(0, 400).replace(/https?:\/\/\S+/g, "<url>");
    const L = readLog(); L.failures.push({ id: job.id, status: r.status, body: t, date: new Date().toISOString() }); writeLog(L);
    if (r.status !== 429 && r.status < 500) throw new Error(`${job.id} HTTP ${r.status}: ${t}`);
    console.log(`[gen] ${job.id} retry ${r.status}`);
    await new Promise((s) => setTimeout(s, 20000 * (i + 1)));
  }
  throw new Error(`${job.id}: retries exhausted`);
}
const queue = ids.map((id) => { const j = JOBS[id]; if (!j) throw new Error(`no job ${id}`); return { id, ...j }; })
  .filter((j) => force || !fs.existsSync(path.join(HERE, "webp", `${j.id}.webp`)));
const worker = async () => { while (queue.length) { const j = queue.shift(); try { await call(j); } catch (e) { console.log(`[gen] FAIL ${j.id}: ${e.message}`); } } };
await Promise.all(Array.from({ length: conc }, worker));
