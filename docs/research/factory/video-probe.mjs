// video-probe.mjs — Taxila factory/video-animation-gen probe (2026-10-02).
// Measures taxila-sora (sora-2 on Azure, v1 /videos API): create→completed latency, failure reasons, and
// saves MP4s + frames so text rendering / science accuracy can be inspected. Max 2 jobs in flight (Azure limit).
// Usage: node --env-file=.env.local docs/research/factory/video-probe.mjs
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process";
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const MODEL = process.env.DEPLOY_SORA || "taxila-sora";
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), "video-probe-2026-10-02");
const H = { "api-key": KEY };
const CASES = [
  { id: "p1-photosynthesis-labels", seconds: "8", size: "1280x720", prompt:
    "Flat 2D educational cartoon animation for children aged 10, clean white background, simple shapes, bright colours. " +
    "A single green leaf in the centre. Yellow sun rays enter from the top left; blue arrows labelled 'CO2' enter from the left; " +
    "small bubbles labelled 'OXYGEN' float out to the right. Large clear on-screen text at the top reads 'PHOTOSYNTHESIS'. Static camera." },
  { id: "p2-seed-germination", seconds: "8", size: "1280x720", prompt:
    "Soft 2D cartoon time-lapse, cross-section of soil in a glass jar, side view, static camera. A bean seed swells, " +
    "the root grows downward first, then a curved shoot pushes upward, breaks the surface and two green leaves open. No text." },
  { id: "p3-devanagari-text", seconds: "4", size: "1280x720", prompt:
    "2D cartoon: a mango falls from a tree in an Indian village courtyard and lands on the ground. Large on-screen title in Hindi: 'गुरुत्वाकर्षण'. Static camera." },
  { id: "p4-child-character", seconds: "4", size: "1280x720", prompt:
    "Friendly 2D cartoon of an Indian schoolgirl about 9 years old in a school uniform, smiling and pointing at a big number line on a chalkboard, classroom, warm colours, static camera." },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function create(c) {
  const fd = new FormData(); fd.set("model", MODEL); fd.set("prompt", c.prompt); fd.set("seconds", c.seconds); fd.set("size", c.size);
  const t0 = Date.now(); const r = await fetch(`${BASE}/videos`, { method: "POST", headers: H, body: fd });
  const j = await r.json().catch(() => ({})); return { http: r.status, body: j, t0 };
}
async function run(c) {
  const rec = { id: c.id, seconds: c.seconds, size: c.size };
  const cr = await create(c); rec.create_http = cr.http; rec.create_ms = Date.now() - cr.t0;
  if (cr.http >= 300) { rec.error = cr.body?.error ?? cr.body; return rec; }
  const vid = cr.body.id; rec.video_id_prefix = String(vid).slice(0, 12); const t0 = cr.t0; let s = cr.body; const trail = [];
  while (!["completed", "failed", "cancelled"].includes(s.status)) {
    await sleep(5000);
    const r = await fetch(`${BASE}/videos/${vid}`, { headers: H }); s = await r.json();
    trail.push(`${Math.round((Date.now() - t0) / 1000)}s:${s.status}:${s.progress ?? ""}`);
    if (Date.now() - t0 > 15 * 60e3) { s.status = "timeout"; break; }
  }
  rec.status = s.status; rec.wall_s = Math.round((Date.now() - t0) / 100) / 10; rec.trail = trail.filter((_, i) => i % 3 === 0);
  if (s.created_at && s.completed_at) rec.server_s = s.completed_at - s.created_at;
  if (s.status !== "completed") { rec.error = s.error ?? s.failure_reason ?? null; return rec; }
  const t1 = Date.now(); const r = await fetch(`${BASE}/videos/${vid}/content`, { headers: H }); rec.download_http = r.status;
  if (r.ok) {
    const f = path.join(OUT, `${c.id}.mp4`); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); rec.download_ms = Date.now() - t1;
    rec.bytes = fs.statSync(f).size;
    try { rec.ffprobe = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration", "-of", "compact", f]).toString().trim().split("\n"); } catch {}
    try { execFileSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-vf", "fps=1,scale=640:-1,tile=4x3", "-frames:v", "1", path.join(OUT, `${c.id}-contact.jpg`)]); } catch {}
  } else rec.download_err = (await r.text()).slice(0, 200);
  return rec;
}
fs.mkdirSync(OUT, { recursive: true });
const results = []; const queue = [...CASES];
async function worker() { while (queue.length) { const c = queue.shift(); const r = await run(c); console.log(JSON.stringify(r)); results.push(r); } }
await Promise.all([worker(), worker()]);
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ date: "2026-10-02", model: MODEL, endpoint_host: new URL(BASE).host.replace(/^[^.]+/, "<resource>"), results }, null, 2));
