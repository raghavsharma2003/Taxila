// Stagecraft's lesson lifecycle (ship5 p4-content). One StagecraftHost per live lesson, created when the Studio seam's
// lesson-start prefetch runs (server/studio/seam.js prefetch, patch 03) and closed when the lesson leaves the seam's
// memory or goes idle. This file is the ONLY place production wires the pure conductor to real dependencies:
//
//   catalog    base RS-4 engines (reviewed outcomes) + the extension engines ONLY where the authored catalogue has a
//              checked spec for the topic (catalogue.js) + no Wave 2 live archetypes (the W2 prefetch keeps its own
//              live race; Stagecraft's live tier stays dormant until the router bench publishes a live archetype)
//   builders   instant: the catalogue / reviewed spec (≈ 0 ms) and the kit board twin; spec: one structured call on the
//              Stagecraft spec deployment chain (taxila-stagecraft once O-1 exists, else taxila-fast-bg: never a live-path
//              deployment), then validateAny + the kit-id validator + Q8 on every child-visible string; image: dormant
//              (no OCR / Content Safety image checker is injected, so an image is never `ready`: B5)
//
// Kill switch: STAGECRAFT = on (default, owner directive 2026-10-05 "ship it") | shadow | off. `off` attaches no host and
// the seam is byte-identical Wave 2. Any failure to build a host is the same as off for that lesson (logged once).
import { StagecraftHost } from "./host.js";
import { attach, detach, hostFor } from "./seam-bridge.js";
import { buildCatalog } from "./catalog.js";
import { createBuilders } from "./builders.js";
import { catalogueTopicsByArchetype, loadCatalogue } from "./catalogue.js";
import { PERSONAL_NEEDS } from "./config.js";
import "./kernel-point.js";            // registers the kernel view's hooks on the bridge (detach forgets the view)
import { ENGINE_SPECS } from "../../shared/studio-spec.ts";
import { ENGINE_SPECS_EXT } from "../../shared/studio-spec-ext/index.ts";

const MODES = new Set(["off", "shadow", "on"]);
/** The runtime switch (read per lesson start, so an env change on the Container App needs only a restart). */
export function stagecraftMode(env = process.env) {
  const v = String(env.STAGECRAFT ?? "on").trim().toLowerCase();
  return MODES.has(v) ? v : "on";
}

let catalogMemo = null;
/** The admissibility table (once per process): base engines + catalogue rows. */
export function productionCatalog({ fresh = false } = {}) {
  if (catalogMemo && !fresh) return catalogMemo;
  const rows = catalogueTopicsByArchetype(loadCatalogue());
  const specs = {};
  for (const [id, d] of Object.entries(ENGINE_SPECS)) {
    specs[id] = { kind: d.kind, subject: d.subject, outcomes: { classes: d.outcomes.classes, topics: [...new Set([...d.outcomes.topics, ...(rows[id] ?? [])])], misconceptions: d.outcomes.misconceptions } };
  }
  for (const [id, d] of Object.entries(ENGINE_SPECS_EXT)) {
    if (!rows[id]?.length) continue;
    specs[id] = { kind: d.kind, subject: d.subjects[0], outcomes: { classes: d.outcomes.classes, topics: [...rows[id]], misconceptions: d.outcomes.misconceptions } };
  }
  catalogMemo = buildCatalog(specs, {});
  return catalogMemo;
}
export const _resetProductionCatalog = () => { catalogMemo = null; };

// ── production dependencies (lazy: tests inject their own and never load azure.js) ──
let depsMemo = null;
async function productionDeps() {
  if (depsMemo) return depsMemo;
  const [{ chat, usdOf, normUsage }, { q8Strings }] = await Promise.all([import("../azure.js"), import("../studio/plan.js")]);
  // taxila-fast-bg is taxila-fast's background twin (same model): priced as taxila-fast (azure.js PRICES has no twin row)
  const price = (dep, u) => usdOf(dep === "taxila-fast-bg" || dep === "taxila-stagecraft" ? "taxila-fast" : dep, u);
  depsMemo = { chat, usdOf: price, normUsage, q8: (strings, lang) => q8Strings({ strings }, { lang: lang === "en" ? "en" : lang === "hi" ? "hi" : "hinglish" }) };
  return depsMemo;
}
export const _setProductionDeps = (d) => { depsMemo = d; };

/**
 * The spec tier's deployment chain. Owner action O-1 creates a dedicated deployment; naming it in DEPLOY_STAGECRAFT_SPEC
 * puts it first (and takes it off the "absent" list). Never a live-path deployment (quota.pickDeployment refuses those).
 */
export function specChainCfg(env = process.env) {
  const dep = String(env.DEPLOY_STAGECRAFT_SPEC ?? "").trim();
  if (!dep || dep === "taxila-fast-bg") return {};
  return { chains: { spec: [dep, "taxila-fast-bg"], image: ["taxila-image25-flare", "taxila-image"], live: ["race"] }, absent: [], globalRpm: { [dep]: 60, "taxila-fast-bg": 60, "taxila-image25-flare": 3, "taxila-image": 3, race: 6 },
    rpm: { [dep]: 120, "taxila-fast-bg": 120, "taxila-gpt6-luna": 60, "taxila-mistral-m35": 60, "taxila-image25-flare": 3, "taxila-image": 3, race: 6 } };
}

const lastInput = new Map();     // lessonId → ms of the last turn (idle sweep)
const IDLE_MS = 45 * 60_000;
let sweeper = null;
function sweep(now = Date.now()) {
  for (const [id, at] of lastInput) if (now - at > IDLE_MS) stopStagecraft(id);
}

/**
 * Attach a host for a lesson starting now. Never throws; resolves to the host or null (off / failure / practice).
 * @param {{ lessonId: string, purpose?: string, child?: { class_level?: number, studio_control?: string } | null, studioControl?: string }} ctx
 * @param {{ mode?: string, deps?: object, builders?: object, catalog?: object, clock?: () => number, timerMs?: number, sink?: (row: object) => void }} [o]
 */
export async function startStagecraft(ctx, o = {}) {
  try {
    const mode = o.mode ?? stagecraftMode();
    if (mode === "off" || !ctx?.lessonId || ctx.purpose === "practice") return null;
    if (hostFor(ctx.lessonId)) return hostFor(ctx.lessonId);
    const deps = o.deps ?? (o.builders ? {} : await productionDeps());
    const builders = o.builders ?? createBuilders({ ...deps, child: ctx.child ?? {} });
    const host = new StagecraftHost({ lessonId: ctx.lessonId, mode, catalog: o.catalog ?? productionCatalog(), builders, clock: o.clock, timerMs: o.timerMs, sink: o.sink ?? telemetrySink,
      cfg: { ...specChainCfg(), personalNeeds: PERSONAL_NEEDS } });
    // a parent's "Only ready-made ones" / Studio off: the conductor builds nothing speculative (control "ready_made" / "off")
    const control = ctx.child?.studio_control ?? ctx.studioControl ?? "on";
    if (control !== "on") host.state.meta.control = control === "off" ? "off" : "ready_made";
    attach(ctx.lessonId, host.start());
    lastInput.set(ctx.lessonId, Date.now());
    if (!sweeper) { sweeper = setInterval(() => sweep(), 60_000); sweeper.unref?.(); }
    return host;
  } catch (e) {
    console.warn("[stagecraft] host not started (lesson runs Wave 2 only):", String(e?.message ?? e).slice(0, 120));
    return null;
  }
}
/** The lesson left the seam's memory (ended, evicted, replaced by the child's next lesson). Idempotent. */
export function stopStagecraft(lessonId) {
  lastInput.delete(lessonId);
  try { detach(lessonId); } catch { /* already gone */ }
}
/** A turn touched the lesson (keeps it out of the idle sweep). */
export function touchStagecraft(lessonId) { if (lastInput.has(lessonId)) lastInput.set(lessonId, Date.now()); }
export const _sweep = sweep;

// ── telemetry: rows are ids, rungs, reasons, costs (never child words); one compact log line per point/ready/landed ──
const LOG_KINDS = new Set(["point", "ready", "invalidated", "quota_429", "failover", "error"]);
const recent = [];
export function telemetrySink(row) {
  if (!row || !LOG_KINDS.has(row.kind)) return;
  recent.push(row);
  if (recent.length > 2000) recent.shift();
  if (process.env.STAGECRAFT_LOG === "1") console.info(`[stagecraft] ${row.kind} ${row.servedRung ?? row.rung ?? ""} ${row.reason ?? ""} ${row.family ?? ""}`.trim());
}
/** The recent rows (ops route / tests). */
export const recentRows = () => recent.slice();
