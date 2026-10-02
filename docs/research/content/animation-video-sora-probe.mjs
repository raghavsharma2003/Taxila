// animation-video-sora-probe: is taxila-sora (sora-2, Azure preview) alive, how slow is it, and does it get
// classroom content right? Three 4 s clips, each aimed at a known video-model failure (direction/physics,
// counting + text, Devanagari text + shadow geometry). Hard cap: 3 jobs x 4 s = 12 s of video (~$1.20 at $0.10/s).
// Run from repo root: node docs/research/content/animation-video-sora-probe.mjs
// Writes animation-video-sora-probe-2026-10-02.json here; MP4s + 1 fps frames go to $SCRATCH (not the repo).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(new URL(import.meta.url).pathname);
for (const line of fs.readFileSync(path.join(HERE, "../../../.env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const MODEL = process.env.DEPLOY_SORA || "taxila-sora";
const SCRATCH = process.env.SCRATCH || "/tmp/sora-probe"; fs.mkdirSync(SCRATCH, { recursive: true });
const OUT = path.join(HERE, "animation-video-sora-probe-2026-10-02.json");
const STYLE = "Flat 2D children's educational cartoon, simple clean shapes, soft cream background, static camera, no people, no speech, soft ambient sound only.";
const CASES = [
  { id: "seed", tests: "direction: root must grow DOWN, shoot UP (gravitropism); stage order",
    prompt: `${STYLE} Side cross-section of soil in a clear glass jar. A single bean seed swells, its seed coat splits, a white root grows straight down into the soil, then a green shoot grows up out of the soil and opens two leaves. No text.` },
  { id: "count", tests: "counting (exactly 3 + 4 = 7 objects) and English text rendering",
    prompt: `${STYLE} A wooden table with exactly three red apples on the left and exactly four green apples on the right. The apples slide together into one group of seven apples. A green chalkboard behind the table shows "3 + 4 = 7" written in white chalk.` },
  { id: "shadow", tests: "shadow geometry (shorter as sun rises, points away from sun) and Devanagari text",
    prompt: `${STYLE} A wooden stick stands upright in flat ground on a sunny day. The sun moves from low on the left side of the sky to directly overhead. The stick's shadow points away from the sun and gets shorter as the sun rises. A small Hindi label "छाया" sits next to the shadow.` },
];
const H = { "api-key": KEY, "content-type": "application/json" };
const res = { date: "2026-10-02", from: "cloud build container (US) -> eastus2", deployment: MODEL, api: "POST /openai/v1/videos (v1, sora-2 schema)", size: "1280x720", seconds: "4", cases: [] };
const save = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(c) {
  const rec = { id: c.id, tests: c.tests, prompt: c.prompt, events: [] }; res.cases.push(rec); save();
  const t0 = Date.now();
  const r = await fetch(`${BASE}/videos`, { method: "POST", headers: H, body: JSON.stringify({ model: MODEL, prompt: c.prompt, size: "1280x720", seconds: "4" }) });
  const j = await r.json().catch(() => ({}));
  rec.create = { status: r.status, ms: Date.now() - t0, id: j.id, err: j.error ? String(j.error.message ?? j.error.code).slice(0, 400) : undefined };
  save(); console.log(c.id, "create", rec.create);
  if (!r.ok || !j.id) return rec;
  let last = "";
  for (let i = 0; i < 120; i++) {               // <= 10 min
    await sleep(5000);
    const s = await (await fetch(`${BASE}/videos/${j.id}`, { headers: H })).json().catch(() => ({}));
    const tag = `${s.status}:${s.progress ?? ""}`;
    if (tag !== last) { rec.events.push({ t_s: (Date.now() - t0) / 1000, status: s.status, progress: s.progress }); last = tag; save(); }
    if (["completed", "failed", "cancelled"].includes(s.status)) { rec.final = { status: s.status, err: s.error ? String(s.error.message ?? s.error.code).slice(0, 400) : undefined, expires_at: s.expires_at, created_at: s.created_at, completed_at: s.completed_at }; break; }
  }
  rec.wall_s = (Date.now() - t0) / 1000;
  if (rec.final?.status === "completed") {
    const v = await fetch(`${BASE}/videos/${j.id}/content`, { headers: { "api-key": KEY } });
    const buf = Buffer.from(await v.arrayBuffer()); const f = path.join(SCRATCH, `${c.id}.mp4`); fs.writeFileSync(f, buf);
    rec.bytes = buf.length; rec.download_status = v.status;
    try {
      const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate", "-of", "json", f]).toString());
      rec.ffprobe = probe;
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-vf", "fps=1,scale=640:-1", path.join(SCRATCH, `${c.id}_%02d.png`)]);
    } catch (e) { rec.ffprobe_err = String(e.message).slice(0, 200); }
  }
  save(); console.log(c.id, "done", rec.final, rec.wall_s); return rec;
}
// Azure preview allows 2 concurrent jobs: run 2, then 1.
await Promise.all([run(CASES[0]), run(CASES[1])]);
await run(CASES[2]);
res.billed_seconds_upper_bound = res.cases.filter((c) => c.final?.status === "completed").length * 4;
save(); console.log("wrote", OUT);
