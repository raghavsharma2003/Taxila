// Round 5, stream 2: picture.get, a REAL picture of a thing the child asked to see ("aloo ki photo dikhao"), or an honest
// "cannot" (docs/design/round4/build/r12/rca/IMAGE-RUNG.md, the design; docs/design/round5/AGENT.md, the tool). Never on the
// reply's critical path: the job runs ~12-20 s and reveals on the Studio stream when it is ready (the early slot), so her
// line that turn says it is being made and gives it in words.
//
// Safety, in order, all code (no model decides): the subject is a short plain noun phrase that passes the child-safety
// predicates and the person / body / brand / weapon blocklist (director/state.js drawableSubject); the prompt is a fixed
// kid-safe template with the subject as its only slot (never the child's other words); the PIXELS are moderated by Azure AI
// Content Safety image:analyze before reveal (any category at severity >= 2 is refused; an error refuses: fail closed). No
// curriculum fact is ever carried by a generated picture (labels stay on the board).
// Budgets: at most PICTURES_PER_LESSON per lesson; the image lane's own rate (gpt-image-2.5-flare is 4 RPM for the whole
// subscription: a 429 falls back to gpt-image-2, then sunburst). Bytes: JPEG quality ~60, served as a data URL the renderer
// accepts (src/studio/ImageRenderer.tsx), cached in memory by subject.
import { resolveLane } from "../endpoints.js";
import { DEPLOY } from "../azure.js";
import { createHash } from "node:crypto";
import { drawableSubject } from "../director/state.js";

/**
 * Who gets real pictures on the Director lane (owner decision 14.2, the cohort pattern of server/duplex/config.js):
 * TAXILA_PICTURES = off (nobody) | all (everyone) | unset (the cohort only); TAXILA_PICTURES_FOR = comma-separated guardian
 * accounts, each a lower-case email OR the sha256 hex of one. PURE.
 */
export function picturesFor(guardian, env = process.env) {
  const mode = String(env.TAXILA_PICTURES ?? "").trim().toLowerCase();
  if (["0", "off", "false"].includes(mode)) return false;
  if (["all", "on", "1"].includes(mode)) return true;
  const e = String(guardian?.email ?? "").trim().toLowerCase();
  if (!e) return false;
  const h = createHash("sha256").update(e).digest("hex");
  return String(env.TAXILA_PICTURES_FOR ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
    .some((v) => (/^[0-9a-f]{64}$/.test(v) ? v === h : v === e));
}

export const PICTURES_PER_LESSON = Number(process.env.TAXILA_PICTURES_PER_LESSON || 4);
const TEMPLATE_V = "img-subject@1";
/** The kid-safe template: the subject is its only slot. PURE. */
export const promptFor = (subject) =>
  `A friendly children's-book illustration of ${subject}, one object, centred, plain light background, soft colours, simple shapes; no people, no faces, no eyes or mouth on objects, no hands, no text, no letters, no numbers, no logos.`;
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();

const cache = new Map();          // subject → { src, alt, at }
const restUntil = new Map();      // deployment → time its 429 back-off ends
/** Pictures being made right now, across all lessons: beyond MAX_IN_FLIGHT a new ask is told honestly it cannot come now. */
let inFlight = 0;
export const MAX_IN_FLIGHT = Number(process.env.TAXILA_PICTURES_IN_FLIGHT || 3);
const perLesson = new Map();      // lessonId → count
const failed = new Map();         // lessonId → the subject whose picture was promised and did not come (told once)
/** The subject of a picture she said was coming and that failed, once (the next turn says so). */
export const takeFailedPicture = (lessonId) => { const s = failed.get(lessonId) ?? null; failed.delete(lessonId); return s; };
const jobs = new Map();           // jobId → { state, subject, ... }
let deps = { generate: null, moderate: null };
/** Tests only: replace the network layer ({ generate(subject) → { b64, deployment }, moderate(b64) → maxSeverity }). */
export const _setPictureDeps = (d) => { deps = { ...deps, ...d }; };
export const _resetPictures = () => { cache.clear(); perLesson.clear(); jobs.clear(); failed.clear(); restUntil.clear(); inFlight = 0; };

async function generate(subject, { timeoutMs = 30_000 } = {}) {
  if (deps.generate) return deps.generate(subject);
  const { endpoint, key } = resolveLane("IMAGE");
  const base = String(endpoint ?? "").replace(/\/+$/, "").replace(/\/openai.*$/, "");
  if (!base || !key) throw Object.assign(new Error("image lane not configured"), { code: "unconfigured" });
  const chain = [...new Set([process.env.REFRESH_DEPLOY_IMAGE25_FLARE || "taxila-image25-flare", DEPLOY.image, "taxila-image", process.env.REFRESH_DEPLOY_IMAGE25_SUNBURST || "taxila-image25-sunburst"].filter(Boolean))];
  const t0 = Date.now();
  let last = null;
  for (const dep of chain) {
    // flare is 4 RPM for the whole subscription: a deployment that answered 429 rests for its back-off, the chain moves on
    if ((restUntil.get(dep) ?? 0) > Date.now()) continue;
    const left = timeoutMs - (Date.now() - t0);
    if (left < 4000) break;
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), left);
    try {
      const r = await fetch(`${base}/openai/deployments/${dep}/images/generations?api-version=2025-04-01-preview`, { method: "POST", signal: ctl.signal,
        headers: { "api-key": key, "content-type": "application/json" },
        body: JSON.stringify({ prompt: promptFor(subject), n: 1, size: "1024x1024", quality: "low", output_format: "jpeg", output_compression: 60 }) });
      const j = await r.json().catch(() => ({}));
      const b64 = j?.data?.[0]?.b64_json;
      if (r.ok && b64) return { b64, deployment: dep, ms: Date.now() - t0 };
      last = Object.assign(new Error(`image ${r.status} ${String(j?.error?.code ?? "").slice(0, 40)}`), { code: r.status === 429 ? "rate" : j?.error?.code === "content_filter" ? "filter" : `http_${r.status}` });
      if (r.status === 429) restUntil.set(dep, Date.now() + Math.max(15_000, Number(r.headers.get("retry-after")) * 1000 || 20_000));
      if (![429, 500, 502, 503, 504].includes(r.status) && last.code !== "filter") break;   // a bad request is not retried elsewhere
    } catch (e) { last = Object.assign(new Error(String(e?.message ?? e)), { code: e?.name === "AbortError" ? "timeout" : "network" }); }
    finally { clearTimeout(timer); }
  }
  throw last ?? Object.assign(new Error("no image"), { code: "none" });
}

/** Content Safety image:analyze → the highest severity (0-7, FourSeverityLevels: 0/2/4/6). Throws on any error. */
async function moderate(b64, { timeoutMs = 8000 } = {}) {
  if (deps.moderate) return deps.moderate(b64);
  const { endpoint, key } = resolveLane("SAFETY");
  const host = String(endpoint ?? "").replace(/(https:\/\/[^/]+).*/, "$1");
  if (!host || !key) throw new Error("content safety not configured");
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${host}/contentsafety/image:analyze?api-version=2024-09-01`, { method: "POST", signal: ctl.signal,
      headers: { "Ocp-Apim-Subscription-Key": key, "content-type": "application/json" }, body: JSON.stringify({ image: { content: b64 }, outputType: "FourSeverityLevels" }) });
    if (!res.ok) throw new Error(`content safety HTTP ${res.status}`);
    return ((await res.json()).categoriesAnalysis ?? []).reduce((m, c) => Math.max(m, Number(c.severity) || 0), 0);
  } finally { clearTimeout(timer); }
}

/**
 * Start a picture of `subject` for a lesson. → { ok: true, job: { id, etaMs }, cached?: true } (the job reveals through
 * `reveal(picture)` when it passes) or { ok: false, why, check } at once ("cannot": the subject, the budget, the lane).
 * @param {string} lessonId @param {string} subject @param {{ reveal: (p: { src: string, alt: string, subject: string, jobId: string }) => void, fail?: (why: string) => void }} o
 */
export function startPicture(lessonId, subject, { reveal, fail = () => {} }) {
  const s = norm(subject).slice(0, 40);
  if (!s || !drawableSubject(s)) return { ok: false, why: `no picture of "${String(subject ?? "").slice(0, 40)}" can be shown`, check: "subject" };
  const n = perLesson.get(lessonId) ?? 0;
  const hit = cache.get(s);
  if (!hit && n >= PICTURES_PER_LESSON) return { ok: false, why: "no more pictures in this lesson", check: "budget" };
  if (!hit && inFlight >= MAX_IN_FLIGHT) return { ok: false, why: "pictures are busy right now", check: "busy" };
  const id = `pic:${lessonId.slice(0, 8)}:${Date.now().toString(36)}`;
  if (hit) { jobs.set(id, { state: "ready", subject: s }); queueMicrotask(() => { try { reveal({ ...hit, subject: s, jobId: id }); } catch { /* the stream is gone */ } }); return { ok: true, cached: true, job: { id, etaMs: 0 } }; }
  perLesson.set(lessonId, n + 1);
  inFlight++;
  jobs.set(id, { state: "making", subject: s, at: Date.now() });
  (async () => {
    try {
      const g = await generate(s);
      const sev = await moderate(g.b64);
      if (sev >= 2) throw Object.assign(new Error(`moderation severity ${sev}`), { code: "moderation" });
      const pic = { src: `data:image/jpeg;base64,${g.b64}`, alt: `a picture of ${s}`, at: Date.now(), deployment: g.deployment, template: TEMPLATE_V };
      if (cache.size > 60) cache.delete(cache.keys().next().value);
      cache.set(s, pic);
      const ms = Date.now() - (jobs.get(id)?.at ?? Date.now());
      jobs.set(id, { state: "ready", subject: s, ms });
      console.info(`[studio] picture ready ${g.deployment} ${ms}ms`);
      reveal({ ...pic, subject: s, jobId: id });
    } catch (e) {
      jobs.set(id, { state: "failed", subject: s, why: e?.code ?? "error" });
      failed.set(lessonId, s);
      console.info(`[studio] picture failed ${e?.code ?? ""} ${String(e?.message ?? e).slice(0, 80)}`);
      try { fail(e?.code ?? "error"); } catch { /* nothing to tell */ }
    } finally { inFlight = Math.max(0, inFlight - 1); }
  })();
  return { ok: true, job: { id, etaMs: 15_000 } };
}
export const jobOf = (id) => jobs.get(id) ?? null;
