// The ONE certificate gate for the child's work tray (round 4, stream 2 content, BUILD-PLAN §3.2 work item 1).
//
// Every path that can put pixels in the Desk's tray asks this file, at the device's viewport class, BEFORE the piece is
// revealed: the Studio slot (server/studio/seam.js slotFor / slotSnapshot / the stream's scripts), the Stagecraft reveal
// (server/stagecraft/seam-bridge.js merge), the Director's module mount (server/director/modules.js mountable), the
// explainer fill (the explainer@1 module and the Studio whiteboard fallback), the whiteboard (seam.requestIntent drawn),
// and play (server/forge3/live.js). forge-g2 "made for you" has no tray path (TRAY_PATHS below says why; the test proves
// it stays that way). tests/r4-content-tray-gate.test.mjs lists every producer of a tray artifact in the server and fails
// when one is added without a gate call.
//
// What "certified" means, per artifact kind (each a verdict measured in the REAL Desk tray at the judged boxes, or a pure
// prediction of the same thing; never a model's opinion, rj-holistic-model-judge-gate):
//   whiteboard  the client's own layout-for-the-box (src/studio/boardFit.ts + boardView.ts, imported here: one code) puts
//               its smallest word at ≥ 14 px in the device's tray box (the box the client reported, else the contract's)
//   stagecraft  a Studio v2 piece: its library certificate (certs/catalogue.json) serves at ALL THREE judged sizes and at
//               the device's (brief item 2: Studio v2 is off the child path unless certified at all three), or a
//               generated spec's live verdict (gate.js judgeArtifact, cached on the piece) at all three; the board rung
//               never (boards come from the whiteboard path)
//   play        the play certificate (certs/play.json) for (family, mode, art, band) or the topic's own samples, at the
//               device's size; never judged = NOT shown (round 3 allowed it)
//   skeleton    the skeleton certificate (certs/skeleton.json: every sampled instance of the archetype at that size)
//   frame       a live verdict for the build (gate.js, cached on the piece) at the device's size; unjudged = not shown
//               (the slot's skeleton, when certified, is shown instead)
//   image       never (nothing produces one; an unknown kind is refused)
//   module      the engine's certificate (certs/modules.json) at the device's size; explainer@1 carries a whiteboard
//               script, judged by the whiteboard rule at the tray box
//
// Viewport class: the Desk reports its work-tray box (POST /api/studio/viewport); the class is the box's WIDTH class
// (certificates are judged per width class). A tray shorter than the contract box at that class is `tight`: boards are
// judged at the real box; fixed-certificate pieces keep the device's own last line (play MIN_BOX, the Studio v2 device
// check, the module frame's fit). Unknown device = p360 (the commonest and hardest phone).
//
// Pure and synchronous (≤ 1 ms per call except a whiteboard fit, ~1-5 ms), never throws, never a network call.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verdictFor, certificates } from "./certify.js";
import { playCertificates, playPassed } from "./compose.js";
import { fitBoard, minPxAt } from "../../src/studio/boardFit.ts";
import { boardFrame } from "../../src/studio/boardView.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..", "..");
export const CONTRACT_FILE = path.join(ROOT, "docs", "design", "round4", "build", "box-contract.json");
export const SKELETON_CERT_FILE = path.join(here, "certs", "skeleton.json");
export const MODULE_CERT_FILE = path.join(here, "certs", "modules.json");
export const VP_CLASSES = Object.freeze(["p360", "p412", "l1366"]);
/** The serving floor (certify.js servesView: the 14 px rule; classes 4-5 are certified at 16 and served at 14). */
export const SERVE_FLOOR_PX = 14;
/** The client's fit target per band (src/studio/boardFit.ts BOARD_FLOOR_PX / _YOUNG). */
const FIT_FLOOR = { young: 16, older: 14 };

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
let contractMemo = null, skeletonMemo, moduleMemo;
/** The stage box contract (stream 2 owns it: grow, never shrink). */
export function boxContract() { return (contractMemo ??= readJson(CONTRACT_FILE, { boxes: {} })); }
export function skeletonCertificates() { if (skeletonMemo === undefined) skeletonMemo = readJson(SKELETON_CERT_FILE, null); return skeletonMemo; }
export function moduleCertificates() { if (moduleMemo === undefined) moduleMemo = readJson(MODULE_CERT_FILE, null); return moduleMemo; }
/** Test seams. */
export const _setSkeletonCertificates = (t) => { skeletonMemo = t; };
export const _setModuleCertificates = (t) => { moduleMemo = t; };

/** The contract box for a class: the tray (or the play-mode world box), Older or Young Desk. */
export function contractBox(vp, { young = false, play = false } = {}) {
  const b = boxContract().boxes?.[young ? "b2" : "b3"]?.[play ? "play" : "tray"]?.[vp]?.box;
  return b ? { w: b.w, h: b.h } : null;
}

/**
 * A reported tray box → its viewport class. Width decides the class (the certificates' judged widths: 328 / 380 / 752);
 * a box shorter than the contract's at that class is `tight`.
 */
export function vpClassForBox(box, { young = false } = {}) {
  const w = Number(box?.w) || 0, h = Number(box?.h) || 0;
  if (!(w > 0) || !(h > 0)) return { vp: "p360", tight: false, known: false };
  let vp = "p360";
  for (const c of VP_CLASSES) { const b = contractBox(c, { young }); if (b && w + 2 >= b.w) vp = c; }
  const want = contractBox(vp, { young });
  return { vp, tight: !!want && h + 2 < want.h, known: true };
}

// ───────────────────────────── the per-lesson viewport (reported by the Desk) ─────────────────────────────
const viewports = new Map(); // lessonId → { vp, tight, box, young, at }
export function setViewport(lessonId, { box, young = false } = {}) {
  if (!lessonId) return null;
  const c = vpClassForBox(box, { young });
  const v = { ...c, box: c.known ? { w: Math.round(box.w), h: Math.round(box.h) } : null, young: !!young, at: Date.now() };
  viewports.delete(lessonId);
  viewports.set(lessonId, v);
  if (viewports.size > 2000) viewports.delete(viewports.keys().next().value);
  return v;
}
/** The device's class for a lesson; unknown = the 360 phone with the contract box. */
export function viewportOf(lessonId) {
  return viewports.get(lessonId) ?? { vp: "p360", tight: false, box: null, young: false, known: false };
}
export const _clearViewports = () => viewports.clear();

// ───────────────────────────── the rules ─────────────────────────────

/** The px kept free around the stage box (src/studio/StudioStage.tsx insetFor). */
const insetFor = (w) => (w <= 420 ? 2 : 8);

/**
 * A whiteboard script at a box: what the client will draw (StudioStage: the camera frame, then fitBoard for a fresh board)
 * and its smallest word in px. → { ok, minPx, why }
 */
export function boardAt(script, box, { young = false } = {}) {
  try {
    if (!script?.board?.w || !Array.isArray(script.ops)) return { ok: false, minPx: null, why: "no board" };
    const inset = insetFor(box.w);
    const area = { w: box.w - 2 * inset, h: box.h - 2 * inset };
    const fr = boardFrame(script);
    const design = fr.framed ? { w: fr.w, h: fr.h } : { w: script.board.w, h: script.board.h };
    const r = fitBoard(script, area, design, young ? FIT_FLOOR.young : FIT_FLOOR.older);
    // a fitted board is shown on its own new board (no camera); else the camera frame of the original
    const px = r.t ? r.pxAfter : minPxAt(script, design, area);
    if (px == null) return { ok: true, minPx: null, why: "no words" };
    return { ok: px >= SERVE_FLOOR_PX, minPx: px, why: px >= SERVE_FLOOR_PX ? r.why : `smallest word ${px} px < ${SERVE_FLOOR_PX} at ${box.w}x${box.h}` };
  } catch (e) { return { ok: false, minPx: null, why: `fit threw: ${String(e?.message ?? e).slice(0, 60)}` }; }
}

/**
 * Can a Studio v2 world (1000 x 625 design units, labels 38, targets 130: src/studio-v2/core/tokens.ts) be PLAYED in the
 * contract box of class `vp`, rather than shown as its board twin? The same arithmetic as the stage's device check
 * (src/studio/StudioStage.tsx: label ≥ 14 px, target ≥ 44 px; the phone rail band above the world). The certificate
 * table judged whatever the stage showed, which at 360 was the TWIN for every piece: a twin is a board, not the game.
 */
export function studioV2PlayableAt(vp, { young = false } = {}) {
  const b = contractBox(vp, { young });
  if (!b) return false;
  const inset = insetFor(b.w);
  const rail = b.w <= 420 ? (young ? 124 : 112) : 0;
  const w = Math.min(b.w - 2 * inset, (b.h - rail - 2 * inset) * 1.6);
  const s = w / 1000;
  return 38 * s >= 14 && 130 * s >= 44;
}
/** Studio v2 piece (library game / explainer) certified as itself at all three sizes. */
export function studioV2Certified(topicId, piece, { young = false, certs = null } = {}) {
  const row = (certs ?? certificates())?.topics?.[topicId]?.[piece];
  return !!row && VP_CLASSES.every((v) => serveAt(row, v) && studioV2PlayableAt(v, { young }));
}

const serveAt = (row, vp) => !!(row?.serveByViewport ?? row?.byViewport)?.[vp];
const allThree = (row) => VP_CLASSES.every((v) => serveAt(row, v));

/**
 * May this Studio artifact be shown in the tray of a device of class `vp`?
 * @param {object} artifact  a StudioArtifact (or a PlayArtifact)
 * @param {{ vp?: string, box?: {w:number,h:number}|null, young?: boolean, topicId?: string|null, classLevel?: number,
 *   verdict?: { pass?: boolean, byViewport?: Record<string, boolean>, unavailable?: boolean } | null, certs?: any, playCerts?: any,
 *   skeletonCerts?: any }} [ctx]
 * @returns {{ ok: boolean, kind: string, cert: string, vp: string, why: string }}
 */
export function certifyForTray(artifact, ctx = {}) {
  const vp = ctx.vp ?? "p360";
  const young = !!ctx.young;
  const kind = String(artifact?.kind ?? "none");
  const out = (ok, cert, why) => ({ ok, kind, cert, vp, why });
  try {
    switch (kind) {
      case "whiteboard": {
        const box = ctx.box ?? contractBox(vp, { young });
        if (!box) return out(false, "whiteboard-fit", "no box for this class");
        const r = boardAt(artifact.script, box, { young });
        return out(r.ok, "whiteboard-fit", r.why);
      }
      case "stagecraft": {
        const sc = artifact.stagecraft ?? {};
        if (sc.rung === "board") return out(false, "none", "a Stagecraft board rung (boards come from the whiteboard path)");
        if (sc.rung === "generated_spec" || !ctx.topicId) {
          const v = ctx.verdict;
          if (!v || v.unavailable) return out(false, "judge", "not judged at the child's sizes");
          const ok = VP_CLASSES.every((c) => !!v.byViewport?.[c]);
          return out(ok, "judge", ok ? "judged at all three sizes" : "judged: fails at ≥ 1 size");
        }
        const piece = ctx.piece ?? (["animation", "explainer", "diagram"].includes(String(ctx.factsKind ?? "")) ? "explainer" : "game");
        const row = (ctx.certs ?? certificates())?.topics?.[ctx.topicId]?.[piece];
        if (!row) return out(false, "catalogue", `no certificate for ${ctx.topicId} ${piece}`);
        const twinAt = VP_CLASSES.filter((v) => !studioV2PlayableAt(v, { young }));
        if (twinAt.length) return out(false, "catalogue", `Studio v2 ${piece} is only its board twin at ${twinAt.join(",")} (a 1000-unit world in that box): not the game at all three sizes`);
        if (!allThree(row)) return out(false, "catalogue", `Studio v2 ${piece} not certified at all three sizes (${VP_CLASSES.filter((v) => !serveAt(row, v)).join(",")} fail)`);
        return out(serveAt(row, vp), "catalogue", "certified at all three sizes");
      }
      case "play": {
        const p = artifact.play ?? {};
        const band = (ctx.classLevel ?? 6) <= 5 ? 4 : 7;
        const t = ctx.playCerts !== undefined ? ctx.playCerts : playCertificates();
        const v = playPassed(t, p.family, p.mode, p.art, vp, band, p.topicId ?? ctx.topicId ?? null);
        if (v == null) return out(false, "play", `${p.family}/${p.mode} ${p.art}: never judged`);
        return out(v, "play", v ? "certified at this size" : `${p.family}/${p.mode} ${p.art}: fails at ${vp}`);
      }
      case "skeleton": {
        const t = ctx.skeletonCerts !== undefined ? ctx.skeletonCerts : skeletonCertificates();
        const row = t?.archetypes?.[artifact.archetype ?? artifact.skeleton]?.[young ? "young" : "older"];
        if (!row) return out(false, "skeleton", `no certificate for skeleton ${artifact.archetype ?? artifact.skeleton}`);
        return out(serveAt(row, vp), "skeleton", serveAt(row, vp) ? "every sampled instance passes" : `fails at ${vp}`);
      }
      case "frame": {
        const v = ctx.verdict;
        if (!v || v.unavailable) return out(false, "judge", "build not judged at the child's size");
        const ok = vp ? !!v.byViewport?.[vp] : !!v.pass;
        return out(ok, "judge", ok ? "judged at this size" : `judged: fails at ${vp}`);
      }
      default:
        return out(false, "none", `no certificate rule for kind ${kind}`);
    }
  } catch (e) { return out(false, "error", String(e?.message ?? e).slice(0, 80)); }
}

/**
 * May the Director mount this engine plan in the tray of a device of class `vp`? explainer@1 is judged by its script
 * (the whiteboard rule at the tray box); every other engine by its certificate (engine, mode) at that size.
 * @param {{ engine: string, params?: any }} plan
 * @param {{ vp?: string, box?: {w:number,h:number}|null, young?: boolean, certs?: any }} [ctx]
 */
export function certifyModule(plan, ctx = {}) {
  const vp = ctx.vp ?? "p360";
  const young = !!ctx.young;
  const out = (ok, cert, why) => ({ ok, kind: "module", cert, vp, why });
  try {
    if (!plan?.engine) return out(false, "none", "no engine");
    if (plan.engine === "explainer@1") {
      const script = plan.params?.script;
      const box = ctx.box ?? contractBox(vp, { young });
      if (!script || !box) return out(false, "whiteboard-fit", "no script or box");
      const px = minPxAt(script, script.board, { w: box.w - 2 * insetFor(box.w), h: box.h - 2 * insetFor(box.w) });
      if (px == null) return out(true, "whiteboard-fit", "no words");
      return out(px >= SERVE_FLOOR_PX, "whiteboard-fit", `smallest word ${px} px at ${box.w}x${box.h}`);
    }
    const t = ctx.certs !== undefined ? ctx.certs : moduleCertificates();
    const e = t?.engines?.[plan.engine];
    if (!e) return out(false, "modules", `no certificate for ${plan.engine}`);
    const mode = String(plan.params?.mode ?? "*");
    const row = e.modes?.[mode]?.[young ? "young" : "older"] ?? e.modes?.["*"]?.[young ? "young" : "older"];
    if (!row) return out(false, "modules", `no certificate for ${plan.engine} mode ${mode || "-"}`);
    return out(serveAt(row, vp), "modules", serveAt(row, vp) ? "certified at this size" : `${plan.engine} ${mode} fails at ${vp}`);
  } catch (e) { return out(false, "error", String(e?.message ?? e).slice(0, 80)); }
}

// ───────────────────────────── the registry of tray paths (tests/r4-content-tray-gate.test.mjs) ─────────────────────────────
/**
 * Every path that can put pixels in the Desk's tray, where its gate call sits, and the producers (server files that build
 * a tray artifact or a mount) it covers. The test scans server/** for producers and fails on one that no path lists.
 */
export const TRAY_PATHS = Object.freeze([
  { id: "studio-slot", gate: "server/studio/seam.js", calls: ["certifyForTray"], covers: "slotFor / slotSnapshot / statusFacts proposals: frame, skeleton, play, stagecraft, whiteboard slots" },
  { id: "studio-stream", gate: "server/studio/seam.js", calls: ["certifyForTray"], covers: "the {t:script} boards pushed on the SSE stream (drawn, template fallback, kept board) and the subscribe replay" },
  { id: "stagecraft-reveal", gate: "server/stagecraft/seam-bridge.js", calls: ["certifyForTray"], covers: "a Stagecraft reveal proposed by merge(); slotOf → stagecraftSlot" },
  { id: "module-mount", gate: "server/director/modules.js", calls: ["certifyModule"], covers: "every Director engine mount (bound plan, G1 fill, predict, show) incl. explainer@1" },
  { id: "explainer", gate: "server/director/modules.js", calls: ["certifyModule"], covers: "explainer@1 module (its script at the tray box); the Studio whiteboard fallback goes through studio-stream" },
  { id: "whiteboard", gate: "server/studio/seam.js", calls: ["certifyForTray"], covers: "seam.requestIntent: board-first, kept, board-sync, template fallback" },
  { id: "play", gate: "server/forge3/live.js", calls: ["certifyForTray"], covers: "buildLive → composeAsk → slotFor (also gated in studio-slot)" },
  { id: "forge-g2-made-for", gate: null, calls: [], covers: "NO tray path: g2/serve.js mountFor has no live caller and `g2:*` ids are not ENGINES (modules.js mountable refuses them); the Made for you shelf lists studio_mount rows and mounts nothing" },
]);
