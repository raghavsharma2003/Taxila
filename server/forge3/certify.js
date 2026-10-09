// forge3 certification: which library pieces may reach a child at which size (round 3, stream forge).
//
// The library (data/studio-catalogue/topics/*.json: a game spec, an explainer spec and whiteboard beats per class 4-7
// topic) is rendered OFFLINE in the real Desk tray + StudioStage at the judged sizes (server/forge3/qa: render.js,
// checks.js) and the verdicts are written to server/forge3/certs/catalogue.json. At reveal time the stage rung reads the
// certificate: a piece that failed at every judged size is not served at all (it is broken everywhere: 8 px words,
// overlapping coach text, clipped labels), and the device's own box decides the rest (src/studio/StudioStage.tsx shows
// the board twin when the box is too small for the piece). Uncertified (no row) = not judged = treated as failed for
// generated specs, and as "unknown" (allowed, logged) for library rows only until the first certification run lands.
//
//   FORGE3_QA_LOCAL=1 node server/forge3/certify.js [--from <matrix.json>] [--out server/forge3/certs/catalogue.json]
// (--from reuses a matrix run of docs/design/round3/forge/audit/harness/matrix.mjs instead of rendering again)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QA_VERSION } from "./qa/checks.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const CERT_FILE = path.join(here, "certs", "catalogue.json");

let memo = null;
/** The certificate table (once per process; {} when none was written). */
export function certificates({ fresh = false, file = CERT_FILE } = {}) {
  if (memo && !fresh) return memo;
  try { memo = JSON.parse(fs.readFileSync(file, "utf8")); } catch { memo = { v: 1, qa: null, topics: {} }; }
  return memo;
}
export const _setCertificates = (c) => { memo = c; };

/**
 * The verdict for a library piece. kind: "game" | "explainer" | "board"; vp: "p360" | "p412" | "l1366" (or null = any).
 * → { known: boolean, pass: boolean | null, byViewport, fails }
 */
export function verdictFor(topicId, kind, vp = null, certs = certificates()) {
  const row = certs?.topics?.[topicId]?.[kind];
  if (!row) return { known: false, pass: null, byViewport: null, fails: [] };
  // the serving verdict when the table has it (servesView), else the strict one
  const serve = row.serveByViewport ?? row.byViewport ?? {};
  const pass = vp ? !!serve[vp] : Object.values(serve).some(Boolean);
  return { known: true, pass, byViewport: row.byViewport ?? null, serveByViewport: row.serveByViewport ?? null, fails: row.fails ?? [] };
}

/** May a library piece be served at all (it passed at ≥ 1 judged size, or it was never judged)? */
export function servable(topicId, kind, certs = certificates()) {
  const v = verdictFor(topicId, kind, null, certs);
  return !v.known || v.pass;
}

/**
 * The SERVING verdict of one judged view (decision r3-forge device-swap-floor, the same rule the device uses): every hard
 * check passes, except that a classes 4-5 view may be served when its only failure is the 16 px young floor and its
 * smallest text is still ≥ the general 14 px floor (shared/play.ts FLOORS.text). The quality numbers keep the 16 px
 * verdict; this only decides what may reach a child rather than a still board.
 */
export function servesView(v) {
  if (!v) return false;
  if (v.pass) return true;
  const fails = v.fails ?? [];
  return fails.length > 0 && fails.every((f) => f === "Q1.legible") && Number(v.stats?.minPx ?? v.minPx) >= 14;
}

/** matrix.json rows → the certificate table. */
export function certificatesFromMatrix(matrix) {
  const topics = {};
  for (const r of matrix.rows ?? []) {
    if (r.error || !r.topic) continue;
    const kind = r.id.startsWith("game:") ? "game" : r.id.startsWith("explainer:") ? "explainer" : r.id.startsWith("board:") ? "board" : null;
    if (!kind) continue;
    const serveByViewport = Array.isArray(r.views) && r.views.length ? Object.fromEntries(r.views.map((v) => [v.vp, servesView(v)])) : null;
    (topics[r.topic] ??= {})[kind] = { archetype: r.group.split(":")[1] ?? null, byViewport: r.byViewport, ...(serveByViewport ? { serveByViewport } : {}), fails: r.fails.slice(0, 12) };
  }
  return { v: 1, qa: QA_VERSION, at: matrix.at ?? new Date().toISOString(), viewports: (matrix.viewports ?? []).map((v) => v.vp), topics };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
  const from = arg("from", null);
  const out = arg("out", CERT_FILE);
  if (!from) { console.error("usage: node server/forge3/certify.js --from <matrix.json> [--out file] (render first with docs/design/round3/forge/audit/harness/matrix.mjs)"); process.exit(2); }
  const certs = certificatesFromMatrix(JSON.parse(fs.readFileSync(from, "utf8")));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(certs));
  const n = Object.values(certs.topics).flatMap((t) => Object.values(t));
  console.log(`certificates: ${Object.keys(certs.topics).length} topics, ${n.length} pieces; strict pass at ≥ 1 size ${n.filter((x) => Object.values(x.byViewport).some(Boolean)).length}, servable (14 px rule) ${n.filter((x) => Object.values(x.serveByViewport ?? x.byViewport).some(Boolean)).length}; strict at every size ${n.filter((x) => Object.values(x.byViewport).every(Boolean)).length} → ${out}`);
}
