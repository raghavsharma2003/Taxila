// /api/duplex/* — the server slice's routes (ARCHITECTURE.md v2 §11 seam S1). NOT REGISTERED: server/index.js is not
// this workstream's file. Registration is one line (docs/research/duplex/INTEGRATION.md step S1):
//   import { createDuplexRoutes } from "./duplex/routes.js";
//   register({ ...createDuplexRoutes({ authorize: lessonFor-with-consent, serverCtx: kit item → {key, misconceptions} }) })
//
// Every dependency that touches auth, the database or a model is INJECTED, so this file is pure and testable:
//   authorize(req, lessonId)       → { lessonId } or throws (the voice routes' lessonFor + core_tutoring consent)
//   serverCtx(lessonId, itemId)    → server-only item context for W drafts / misconception intents (never sent back)
//   launchDraft / launchWarm / launchBuild   (launch.js azureLauncher, a TTS warm launcher, the Studio prefetch)
// Bodies carry hashes, partial text (already the child's own words, the same text the STT gave the device) and hints.
// Responses carry flags only: safety state, promotion keys. The child's words are never written to a log here.
import { DuplexSlice } from "./slice.js";
import { duplexRegistry } from "./registry.js";

const SLICE_TTL_MS = 30 * 60_000;

/**
 * @param {{ authorize: (req:object, lessonId:string) => Promise<{lessonId:string}>, serverCtx?: (lessonId:string, itemId:string|null) => Promise<object>,
 *   launchDraft?: Function, launchWarm?: Function, launchBuild?: Function, source?: string, now?: () => number }} deps
 */
export function createDuplexRoutes(deps) {
  const slices = new Map();
  const now = deps.now || (() => Date.now());
  const sliceFor = (lessonId) => {
    let s = slices.get(lessonId);
    if (!s) {
      s = { slice: new DuplexSlice({ lessonId, source: deps.source, launchDraft: deps.launchDraft, launchWarm: deps.launchWarm, launchBuild: deps.launchBuild }), at: now() };
      slices.set(lessonId, s);
    }
    s.at = now();
    for (const [id, x] of slices) if (now() - x.at > SLICE_TTL_MS) { x.slice.close(now()); slices.delete(id); }
    return s.slice;
  };
  // safety-robust (2026-10-05): the brain's /turn reaches a lesson's live slice (model distress note) through the registry;
  // a lesson with no slice (no duplex session) gets null and nothing happens.
  duplexRegistry.sliceFor = (lessonId) => slices.get(lessonId)?.slice ?? null;
  const json = (res, code, body) => {
    res.statusCode = code;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.end(JSON.stringify(body));
  };
  const need = (body, k) => { if (body?.[k] === undefined || body?.[k] === null) throw Object.assign(new Error(`${k} is required`), { status: 400 }); return body[k]; };

  return {
    /** Her floor-handing line ended (the device's governor entered `handover`). */
    "POST /api/duplex/handover": async (req, res, body) => {
      const { lessonId } = await deps.authorize(req, need(body, "lessonId"));
      const itemId = body.itemId ?? null;
      const ctx = deps.serverCtx ? await deps.serverCtx(lessonId, itemId) : {};
      sliceFor(lessonId).handover({ t: Number(need(body, "t")), itemId, ctx, codeGradable: !!ctx.codeGradable, outcomes: ctx.outcomes || [], carryFrom: body.carryFrom ?? null });
      json(res, 200, { ok: true });
    },
    /** Partials and finals as the device saw them (batched), plus commit probes. */
    "POST /api/duplex/partial": async (req, res, body) => {
      const { lessonId } = await deps.authorize(req, need(body, "lessonId"));
      const sl = sliceFor(lessonId);
      let out = null;
      for (const ev of Array.isArray(body.events) ? body.events.slice(0, 64) : []) {
        if (ev.type === "commit") { sl.commitSent(Number(ev.t)); continue; }
        if (ev.type !== "partial" && ev.type !== "final") continue;
        out = sl.partial({ type: ev.type, itemId: String(ev.itemId), text: String(ev.text ?? "").slice(0, 2000), t: Number(ev.t), delta: !!ev.delta,
          words: Array.isArray(ev.words) ? ev.words.slice(0, 200) : undefined, audioStartMs: ev.audioStartMs, audioEndMs: ev.audioEndMs });
      }
      json(res, 200, { safety: out ? { distress: out.safety.distress, kind: out.safety.kind } : null, intent: out?.intent ? { kind: out.intent.kind, key: out.intent.key } : null });
    },
    /** One PrepareHint (debounced on the device to changes only). */
    "POST /api/duplex/prepare": async (req, res, body) => {
      const { lessonId } = await deps.authorize(req, need(body, "lessonId"));
      sliceFor(lessonId).prepare(Number(need(body, "t")), body.hint, { text: String(body.text ?? "").slice(0, 2000), uptake: body.uptake ? String(body.uptake).slice(0, 80) : null });
      json(res, 200, { ok: true });
    },
    /** Her own utterance (echo subtraction): the device forwards the word-boundary times it gets from TTS (seam S14). */
    "POST /api/duplex/her": async (req, res, body) => {
      const { lessonId } = await deps.authorize(req, need(body, "lessonId"));
      const sl = sliceFor(lessonId);
      if (body.stoppedAt !== undefined) sl.herStopped(String(need(body, "utteranceId")), Number(body.stoppedAt), body.heardUpTo ?? null);
      else sl.herUtterance({ utteranceId: String(need(body, "utteranceId")), text: String(body.text ?? "").slice(0, 2000), words: body.words ?? null, startedAt: Number(need(body, "startedAt")), msPerChar: Number(body.msPerChar ?? 70) });
      json(res, 200, { ok: true });
    },
    /** SPEAK / CUT_IN was governed: promote a ready draft by hash identity; REVOKE marks the planned row superseded. */
    "POST /api/duplex/speak": async (req, res, body) => {
      const { lessonId } = await deps.authorize(req, need(body, "lessonId"));
      const sl = sliceFor(lessonId);
      if (body.revoke) { sl.revoke(Number(need(body, "t"))); json(res, 200, { ok: true }); return; }
      const r = sl.speak(Number(need(body, "t")), { text: String(body.text ?? "").slice(0, 2000), textHash: String(need(body, "textHash")), cutInReason: body.cutInReason ?? null, engineSummary: body.engineSummary ?? null });
      json(res, 200, { phase: r.phase, genId: sl.genId, warm: !!r.warm, summary: sl.turnSummary() });
    },
  };
}
