// The API side of the forge3 visual-QA gate (round 3, stream forge): judge a generated artifact before it can reach a child.
//
// Used for pieces that were NOT certified offline: a generated Stagecraft spec (the `generated_spec` rung), a composed play
// level of a (family, mode, art) not yet certified, a live board sampled for the shadow audit. The trusted API never runs
// a renderer: it posts the artifact to the forge3-qa service (FORGE3_QA_URL, server/forge3/qa-service.mjs, untrusted
// environment). A verdict is cached per artifact hash (a re-reveal of the same spec costs nothing). A service that is not
// configured, down, slow (timeoutMs) or busy returns { pass: false, unavailable: true }: NOT JUDGED = NOT SHOWN, and the
// caller drops to the next rung of compose()'s ladder. Never throws.
import { createHash } from "node:crypto";

const DEFAULT_TIMEOUT_MS = 2500;
const CACHE_MAX = 500;
const cache = new Map(); // hash → { at, verdict }

export const artifactHash = (artifact) => createHash("sha256").update(JSON.stringify(artifact ?? null)).digest("hex").slice(0, 32);

/**
 * @param {object} artifact  a StudioArtifact
 * @param {{ url?: string, token?: string, timeoutMs?: number, mode?: "desk"|"play", young?: boolean, fetchImpl?: typeof fetch }} [o]
 * @returns {Promise<{ pass: boolean, byViewport?: Record<string, boolean>, fails?: string[], unavailable?: boolean, cached?: boolean, ms: number }>}
 */
export async function judgeArtifact(artifact, o = {}) {
  const t0 = Date.now();
  const key = `${o.mode ?? "desk"}:${o.young ? 1 : 0}:${artifactHash(artifact)}`;
  const hit = cache.get(key);
  if (hit) return { ...hit.verdict, cached: true, ms: Date.now() - t0 };
  const url = String(o.url ?? process.env.FORGE3_QA_URL ?? "").replace(/\/+$/, "");
  if (!url) return { pass: false, unavailable: true, why: "FORGE3_QA_URL unset", ms: Date.now() - t0 };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), o.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const token = o.token ?? process.env.FORGE3_QA_TOKEN;
    const res = await (o.fetchImpl ?? fetch)(`${url}/judge`, { method: "POST", signal: ctl.signal,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ artifact, mode: o.mode ?? "desk", young: !!o.young }) });
    if (!res.ok) return { pass: false, unavailable: true, why: `HTTP ${res.status}`, ms: Date.now() - t0 };
    const j = await res.json();
    const verdict = { pass: !!j.pass, byViewport: j.byViewport ?? {}, fails: j.fails ?? [] };
    cache.set(key, { at: Date.now(), verdict });
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    return { ...verdict, ms: Date.now() - t0 };
  } catch (e) {
    return { pass: false, unavailable: true, why: e?.name === "AbortError" ? "timeout" : String(e?.message ?? e).slice(0, 80), ms: Date.now() - t0 };
  } finally { clearTimeout(timer); }
}

/** May this judged artifact show on a device of viewport class `vp` (p360 | p412 | l1366)? Unjudged never shows. */
export const showableAt = (verdict, vp) => !!verdict && !verdict.unavailable && (vp ? !!verdict.byViewport?.[vp] : !!verdict.pass);

export const _clearCache = () => cache.clear();
