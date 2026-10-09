// forge3 live composition (round 3, stream forge): for one stage moment, the ladder of what to put on the child's screen,
// best first, every rung a piece that is correct by construction and judged at the child's size before it can show.
//
// Measured before (docs/design/round3/forge/audit, taxila.dev 2026-10-09, 12 visual asks): 6/6 game, animation and
// simulation asks got a static board (2 of them replaced the engine the child already had in the tray with it), 12/12 boards
// were the same chalk look, 7/12 boards said something the picture did not show, and 0/1155 library views of Studio v2
// pieces passed the play floors on a 360 phone. The ladder below fixes the ORDER of answers; the pieces themselves come
// from the play stream's grammar (shared/play.ts, docs/design/round3/play/GRAMMAR.md: code-generated, solver-checked levels,
// four art directions) and the existing library, and a rung is only offered when the visual QA certificate allows it at
// the child's viewport class (server/forge3/certify.js; the device's own box is checked again in src/studio/StudioStage.tsx).
//
// Rules (pure, < 1 ms, no model call, no I/O beyond the cached coverage and certificate files):
//   - an INTERACTIVE ask ("game khelna hai", "animation dikhao", "simulation") or an interactive need (practice, probe,
//     contrast a misconception) is answered by something the child can DO: a play level when the skill is admitted to play
//     (data/play/coverage.json), else a certified library game, else the engine already in the tray (keep it), and only
//     then a board, then voice;
//   - a PICTURE ask ("diagram", "picture dikhao", "draw it", "whiteboard pe") is answered by a board drawn on her line (the
//     whiteboard gate W0-W13), else a certified library explainer, else voice;
//   - a safeguarding moment shows nothing new (voice only); an excluded topic (play coverage `excluded`) gets no game;
//   - variety: the art direction rotates (pickArt: never the last art twice in a row for the child and subject unless the
//     child chose it), and a family/mode shown in the last two pieces of the lesson steps down behind an unshown one when
//     both are admitted.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { servable, verdictFor, certificates } from "./certify.js";
import { topicParts } from "./art.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const COVERAGE = path.join(here, "..", "..", "data", "play", "coverage.json");
const PLAY_CERTS = path.join(here, "certs", "play.json");

export const INTERACTIVE_ASKS = Object.freeze(new Set(["game", "animation", "simulation"]));
export const PICTURE_ASKS = Object.freeze(new Set(["diagram", "picture", "draw", "whiteboard", "board"]));
const INTERACTIVE_NEEDS = new Set(["practice", "probe", "contrast_misconception", "verify", "practice_set"]);

let coverageMemo; // undefined = not read, null = none
/** The play coverage table (data/play/coverage.json, the play stream's build), or null while it does not exist. */
export function playCoverage({ fresh = false, file = COVERAGE } = {}) {
  if (coverageMemo !== undefined && !fresh) return coverageMemo;
  try { coverageMemo = JSON.parse(fs.readFileSync(file, "utf8")); } catch { coverageMemo = null; }
  return coverageMemo;
}
export const _setCoverage = (c) => { coverageMemo = c; };

let playCertMemo;
/** Test seam: the play certificate table (null = none written: every art allowed, reported "not yet judged"; undefined = re-read the file). */
export const _setPlayCertificates = (t) => { playCertMemo = t; };
/** The play visual-QA table (server/forge3/play-cert.js), or null while none was written. */
export function playCertificates({ fresh = false, file = PLAY_CERTS } = {}) {
  if (playCertMemo !== undefined && !fresh) return playCertMemo;
  try { playCertMemo = JSON.parse(fs.readFileSync(file, "utf8")); } catch { playCertMemo = null; }
  return playCertMemo;
}
/**
 * Did (family, mode, art) pass the visual QA at viewport class `vp` for this class band? null = never judged. With a
 * `topicId` whose own levels were sampled (table.samples), THEIR serving verdicts decide (a family cell fails when any
 * topic's level failed; one topic's clean level should not be refused for another topic's defect, nor the reverse).
 */
export function playPassed(table, family, mode, art, vp, classLevel = 6, topicId = null) {
  if (topicId && Array.isArray(table?.samples)) {
    const own = table.samples.filter((x) => x.topicId === topicId && x.key === `${family}/${mode}` && x.art === art && !x.noLevel);
    if (own.length) {
      const serves = (x, v) => !!x.byViewport?.[v] || ((x.fails ?? []).filter((f) => f.startsWith(`${v}:`)).every((f) => f === `${v}:Q1.legible`) && Number(x.minPx?.[v]) >= 14);
      return vp ? own.every((x) => serves(x, vp)) : own.every((x) => Object.keys(x.byViewport ?? {}).some((v) => serves(x, v)));
    }
  }
  const row = table?.pieces?.[`${family}/${mode}`];
  if (!row) return null;
  const cell = row[`${art}@c${classLevel <= 5 ? 4 : 7}`];
  if (!cell) return null;
  // the serving verdict (certify.js servesView: the 14 px rule) when the table has it, else the strict one
  const v = cell.serveByViewport ?? cell.byViewport ?? {};
  return vp ? !!v[vp] : Object.values(v).some(Boolean);
}

/**
 * The play admission: the skill's own entry (GRAMMAR §10 `skills`), else the topic's first entry (the play server's
 * entryFor rule: RULES order puts a topic's core mechanic first) → { family, mode, goal, arts, contexts } or null.
 */
export function admitPlay(skillId, topicId, cov = playCoverage()) {
  if (!cov) return null;
  if (topicId && cov.excluded?.[topicId]) return null;
  const s = skillId ? cov.skills?.[skillId] : null;
  if (s && s.family && s.mode) return s;
  const e = topicId && Array.isArray(cov.entries) ? cov.entries.find((x) => x.topicId === topicId && x.family && x.mode) : null;
  return e ? { topicId: e.topicId, family: e.family, mode: e.mode, goal: e.goal ?? null, grammar: e.grammar ?? {}, misMap: e.misMap ?? {}, arts: e.arts, contexts: e.contexts ?? [], via: "topic" } : null;
}

/** Map a request kind / Director visual kind to the ask class. */
export function askClass(ask) {
  const a = String(ask ?? "").toLowerCase();
  if (INTERACTIVE_ASKS.has(a) || a === "game_request" || a === "animation_request") return "interactive";
  if (PICTURE_ASKS.has(a) || a === "visual_request" || a === "board_request") return "picture";
  return null;
}

/**
 * The ladder for one moment. PURE given the cached tables.
 * @param {{ ask?: string|null, need?: string|null, skillId?: string|null, topicId?: string|null, vp?: string|null,
 *   safety?: boolean, moduleInTray?: boolean, lesson?: { shown?: { family?: string, mode?: string, art?: string }[], lastArt?: string|null },
 *   childArt?: string|null }} m
 * @param {{ coverage?: any, certs?: any, pickArt?: Function }} [deps]
 * @returns {{ ladder: object[], pick: object, why: string[] }}
 */
export function compose(m, deps = {}) {
  const why = [];
  const ladder = [];
  const cov = deps.coverage !== undefined ? deps.coverage : playCoverage();
  const certs = deps.certs ?? certificates();
  if (m.safety) { why.push("safety: voice only"); return { ladder: [{ kind: "voice" }], pick: { kind: "voice" }, why }; }
  const cls = askClass(m.ask) ?? (INTERACTIVE_NEEDS.has(String(m.need ?? "")) ? "interactive" : m.need ? "picture" : null);
  const topicId = m.topicId ?? null;
  const vp = m.vp ?? null;
  const shown = m.lesson?.shown ?? [];
  const recent = shown.slice(-2);

  const playRung = () => {
    const a = m.skillId || topicId ? admitPlay(m.skillId ?? null, topicId, cov) : null;
    if (!a) { why.push(cov ? `play: skill ${m.skillId ?? "?"} not admitted` : "play: no coverage file yet"); return null; }
    const lastArt = m.lesson?.lastArt ?? recent.at(-1)?.art ?? null;
    const art = deps.pickArt ? deps.pickArt({ family: a.family, topicId, topicArts: a.arts, childArt: m.childArt ?? null, lastArt }) : { art: a.arts?.find((x) => x !== lastArt) ?? a.arts?.[0] ?? null, reason: "rotation" };
    const stale = recent.some((r) => r.family === a.family && r.mode === a.mode);
    // judged at this size? a (family, mode, art) that failed the visual QA here is not offered; never judged = offered
    // (the play stream's own floors test and the device's box still apply) and reported
    const pc = deps.playCerts !== undefined ? deps.playCerts : playCertificates();
    const passed = art?.art ? playPassed(pc, a.family, a.mode, art.art, vp, m.classLevel ?? 6) : null;
    if (passed === false) { why.push(`play ${a.family}/${a.mode} in ${art.art}: failed visual QA at ${vp}`); return null; }
    return { kind: "play", family: a.family, mode: a.mode, goal: a.goal ?? null, art: art?.art ?? null, artReason: art?.reason ?? null, context: a.contexts?.[0] ?? null, stale, certified: passed === true };
  };
  const libRung = (piece) => {
    if (!topicId) return null;
    const ok = vp ? verdictFor(topicId, piece, vp, certs) : { known: false, pass: servable(topicId, piece, certs) };
    if (ok.known && !ok.pass) { why.push(`library ${piece}: failed visual QA at ${vp ?? "every size"}`); return null; }
    if (!ok.known && !servable(topicId, piece, certs)) { why.push(`library ${piece}: broken at every judged size`); return null; }
    return { kind: "stagecraft", piece, topicId, certified: !!ok.known };
  };

  if (cls === "interactive") {
    const p = playRung();
    const l = libRung("game");
    // variety: a play family shown in the last two pieces steps behind a certified library game
    if (p && !p.stale) ladder.push(p);
    if (l) ladder.push(l);
    if (p && p.stale) ladder.push(p);
    if (m.moduleInTray) ladder.push({ kind: "keep_module" });
    if (String(m.ask ?? "").startsWith("animation")) { const e = libRung("explainer"); if (e) ladder.push(e); }
    ladder.push({ kind: "board" });
  } else if (cls === "picture") {
    ladder.push({ kind: "board" });
    const e = libRung("explainer");
    if (e) ladder.push(e);
  } else {
    ladder.push({ kind: "board" });
  }
  ladder.push({ kind: "voice" });
  return { ladder, pick: ladder[0], why };
}

/** Lesson-level variety bookkeeping: what the composer showed (family/mode/art), last 6. */
export function noteShown(lesson, rung) {
  if (!lesson || !rung) return lesson;
  const shown = [...(lesson.shown ?? []), { family: rung.family ?? rung.piece ?? rung.kind, mode: rung.mode ?? null, art: rung.art ?? null }].slice(-6);
  return { ...lesson, shown, lastArt: rung.art ?? lesson.lastArt ?? null };
}

/** Variety of a run of pieces: distinct art directions and forms, and the longest run of the same look. */
export function varietyOf(pieces) {
  const arts = pieces.map((p) => p.art ?? p.ground ?? "?");
  const forms = pieces.map((p) => `${p.family ?? p.kind}/${p.mode ?? p.template ?? ""}`);
  let run = 0, best = 0;
  for (let i = 0; i < arts.length; i++) { run = i && arts[i] === arts[i - 1] ? run + 1 : 1; best = Math.max(best, run); }
  return { n: pieces.length, arts: new Set(arts).size, forms: new Set(forms).size, longestSameLook: best };
}

export { topicParts };
