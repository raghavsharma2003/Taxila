// The authored Studio catalogue in the live lesson (ship5 p4-content; VALUES-100 V3.1-V3.2). data/studio-catalogue/topics/
// holds, per class 4-7 topic, one real-time game or simulation spec, one scene explainer spec and the whiteboard plans for
// the explainer's beats, authored offline by evals/studio-catalogue/author.mjs from the topic's verified kit slice and
// cross-checked by a second model family. Nothing in a topic file is TRUSTED here: every entry is re-validated by code at
// load, against the CURRENT engine registry and the CURRENT kit, before a lesson may show it:
//
//   - the topic id is a class 4-7 topic and not under the child-safety floor (SAFETY_EXCLUDED: no generated game or
//     animation for the Adolescence chapter);
//   - the spec passes its archetype's validator WITHOUT falling back to the reviewed default (validateAny) — a spec the
//     validator had to replace is not this topic's spec;
//   - every kit id the spec cites (`src`, `targets`) is an id of THIS topic's kit (the code-checked kit-id validator: the
//     authoring prompt's "use the id exactly" is never trusted; review v3 2026-10-05 found 3 unknown ids in 2 of 20 files);
//   - the blind cross-check's verdict is "pass" (an unchecked or failed entry is reported, never shown);
//   - every child-visible string passes the local SEVERE and PII predicates (forge/g2/safety.js; the MILD list is not
//     applied: "blood", "die", "kill" are curriculum words in kit content, and the blind check reads suitability);
//   - every whiteboard beat passes the strict script shape and the stage lint (shared/whiteboard.js);
//   - (round 4 content, brief item 2) the game and the explainer are certified at ALL THREE judged sizes (360 x 800,
//     412 x 915, 1366 x 768: server/forge3/certs/catalogue.json, the serving verdict); never judged = not served. Round 3
//     served a piece that passed at one size; 0 of 1155 Studio v2 views passed at the 360 phone, so on phones every one of
//     them was a board twin under a game's name.
//
// Pure reads, once per process (cached); no model call, no network, no child data. The lesson uses an entry through the
// Stagecraft instant rung (builders.js engineDefault): correct-by-construction, ≈ 0 ms, graded by the host (gradeAny).
import fs from "node:fs";
import { ENGINE_SPECS } from "../../shared/studio-spec.ts";
import { ENGINE_SPECS_EXT, validateAny, SAFETY_EXCLUDED, TOPIC_RE_EXT } from "../../shared/studio-spec-ext/index.ts";
import { normalizeScript, lintScript } from "../../shared/whiteboard.js";
import { SEVERE, PII } from "../forge/g2/safety.js";
import { servable } from "../forge3/certify.js";
import { studioV2Certified } from "../forge3/tray-gate.js";

/** round 4 content: served only when certified AS ITSELF (not its board twin) at all three sizes (FORGE3_QA_CERTS=0: the
 *  round 3 rule, ≥ 1 size). */
const qaServable = (topicId, piece) => process.env.FORGE3_QA_CERTS === "0" ? servable(topicId, piece) : studioV2Certified(topicId, piece);

const DIR = new URL("../../data/studio-catalogue/topics/", import.meta.url);
const KITS = new URL("../../data/kits/", import.meta.url);
export const EXPLAINER = "scene-explainer@1";
const KIND = { game: "game", simulation: "simulation", explainer: "animation" };

let kitIndex = null;
/** topicId → kit topic, over every class 4-7 subject kit (read once). */
export function kitTopicAny(topicId) {
  if (!kitIndex) {
    kitIndex = new Map();
    let files = [];
    try { files = fs.readdirSync(KITS); } catch { files = []; }
    for (const f of files) if (/^c[4-7]-[a-z]+\.json$/.test(f)) {
      try { for (const t of JSON.parse(fs.readFileSync(new URL(f, KITS), "utf8")).topics ?? []) kitIndex.set(t.topicId, t); } catch { /* an unreadable kit adds nothing */ }
    }
  }
  return kitIndex.get(topicId) ?? null;
}
export const _resetKitIndex = () => { kitIndex = null; };

/** The ids a spec may cite for this topic: the topic, its misconceptions, its items. */
export function kitIdsOf(kit) {
  if (!kit) return new Set();
  return new Set([kit.topicId, ...(kit.misconceptions ?? []).map((m) => m.id), ...(kit.items ?? []).map((i) => i.id)].filter(Boolean));
}
/** Every `src` / `targets` value the spec cites that is NOT an id of this kit (the code-checked kit-id validator). */
export function unknownKitIds(kit, spec) {
  const ok = kitIdsOf(kit), out = new Set();
  const walk = (v, k) => {
    if (Array.isArray(v)) { for (const x of v) walk(x, k); return; }
    if (v && typeof v === "object") { for (const [kk, vv] of Object.entries(v)) walk(vv, kk); return; }
    if ((k === "src" || k === "targets") && typeof v === "string" && !ok.has(v)) out.add(v);
  };
  walk(spec ?? null, "");
  return [...out];
}

/**
 * Every child-visible string a spec carries (for Q8): the `strings` table plus every short text field anywhere in the
 * spec (titles, subs, labels, options). Keys are paths; values are clipped. Numbers and ids are not text.
 */
export function stringsOfSpec(spec) {
  const out = {};
  const walk = (v, path) => {
    if (Object.keys(out).length >= 120) return;
    if (typeof v === "string") { if (/\p{L}/u.test(v) && !/^c[4-7]-[a-z]+-ch\d/.test(v) && v.length <= 400) out[path] = v; return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}.${i}`)); return; }
    if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { if (k === "archetype" || k === "skills" || k === "lang" || k === "src" || k === "targets" || k === "id") continue; walk(x, path ? `${path}.${k}` : k); }
  };
  walk(spec, "");
  return out;
}
/** The local predicates over a spec's strings: the keys that hit SEVERE or PII ([] = clean). */
export function unsafeStrings(spec) {
  return Object.entries(stringsOfSpec(spec)).filter(([, t]) => SEVERE.some((re) => re.test(t)) || PII.some((re) => re.test(t))).map(([k]) => k);
}

export const kindOf = (archetype) => KIND[ENGINE_SPECS_EXT[archetype]?.kind ?? ENGINE_SPECS[archetype]?.kind] ?? null;
export const titleOf = (archetype) => ENGINE_SPECS_EXT[archetype]?.title ?? ENGINE_SPECS[archetype]?.title ?? archetype;
const known = (a) => a in ENGINE_SPECS || a in ENGINE_SPECS_EXT;

/**
 * Re-validate one authored spec against the current registry and kit. → { ok, spec, why }
 * @param {string} archetype @param {unknown} raw @param {any} kit
 */
export function checkSpec(archetype, raw, kit) {
  if (!known(archetype)) return { ok: false, spec: null, why: "unknown_archetype" };
  if (!raw || typeof raw !== "object") return { ok: false, spec: null, why: "missing" };
  let v;
  try { v = validateAny(archetype, raw); } catch { return { ok: false, spec: null, why: "validator_threw" }; }
  if (v.fellBack) return { ok: false, spec: null, why: "fell_back" };
  const bad = unknownKitIds(kit, v.spec);
  if (bad.length) return { ok: false, spec: null, why: `unknown_kit_id:${bad.slice(0, 3).join(",")}` };
  const unsafe = unsafeStrings(v.spec);
  if (unsafe.length) return { ok: false, spec: null, why: `unsafe_string:${unsafe.slice(0, 2).join(",")}` };
  return { ok: true, spec: v.spec, why: null };
}

/** One topic file → a checked catalogue entry (or the reasons it is not usable). Never throws. */
export function entryFromRecord(rec, { kit = kitTopicAny(rec?.topicId), requireCheck = true } = {}) {
  const topicId = String(rec?.topicId ?? "");
  const e = { topicId, subject: rec?.subject ?? null, cls: rec?.class ?? null, title: rec?.title ?? null, game: null, explainer: null, boards: [], status: { game: "missing", explainer: "missing", boards: 0, boardsTotal: 0, check: "missing" } };
  if (!TOPIC_RE_EXT.test(topicId)) { e.status.game = e.status.explainer = "bad_topic"; return e; }
  if (SAFETY_EXCLUDED.test(topicId) || rec?.excluded) { e.status.game = e.status.explainer = "safety_excluded"; return e; }
  if (!kit) { e.status.game = e.status.explainer = "no_kit"; return e; }
  const verdict = rec?.check?.verdict ?? (rec?.check?.error ? "error" : "missing");
  e.status.check = verdict;
  const checked = !requireCheck || verdict === "pass";
  if (rec?.game?.archetype) {
    const g = checkSpec(rec.game.archetype, rec.game.spec, kit);
    e.status.game = !g.ok ? g.why : checked ? "ok" : "unchecked";
    if (g.ok && checked && !qaServable(topicId, "game")) e.status.game = "qa_broken";
    else if (g.ok && checked) e.game = { archetype: rec.game.archetype, kind: kindOf(rec.game.archetype), title: titleOf(rec.game.archetype), spec: g.spec };
  }
  if (rec?.explainer?.spec) {
    const x = checkSpec(EXPLAINER, rec.explainer.spec, kit);
    e.status.explainer = !x.ok ? x.why : checked ? "ok" : "unchecked";
    if (x.ok && checked && !qaServable(topicId, "explainer")) e.status.explainer = "qa_broken";
    else if (x.ok && checked) e.explainer = { archetype: EXPLAINER, kind: "animation", title: titleOf(EXPLAINER), spec: x.spec, seconds: rec.explainer.seconds ?? null };
  }
  const beats = Array.isArray(rec?.whiteboard?.beats) ? rec.whiteboard.beats : [];
  e.status.boardsTotal = beats.length;
  for (const b of beats) {
    if (!b?.script) continue;
    const n = normalizeScript(b.script, { strict: true });
    if (!n.ok || !n.script || lintScript(n.script).length) continue;
    e.boards.push({ line: String(b.line ?? ""), script: n.script });
  }
  e.status.boards = e.boards.length;
  return e;
}

let cache = null;
/**
 * Every checked entry, keyed by topic. Cached per process; `dir` for tests.
 * @returns {Map<string, ReturnType<typeof entryFromRecord>>}
 */
export function loadCatalogue({ dir = DIR, requireCheck = true, fresh = false } = {}) {
  if (cache && !fresh && dir === DIR && requireCheck) return cache;
  const out = new Map();
  let files = [];
  try { files = fs.readdirSync(dir); } catch { files = []; }
  for (const f of files) {
    if (!/^c[4-7]-[a-z]+-ch\d{2}-t\d{2}\.json$/.test(f)) continue;
    try {
      const rec = JSON.parse(fs.readFileSync(new URL(f, dir), "utf8"));
      out.set(rec.topicId, entryFromRecord(rec, { requireCheck }));
    } catch { /* an unreadable file is a missing entry */ }
  }
  if (dir === DIR && requireCheck) cache = out;
  return out;
}
export const _resetCatalogue = () => { cache = null; };

/** The usable entry of a topic, or null. */
export function catalogueEntry(topicId) { return loadCatalogue().get(topicId) ?? null; }

/** The authored spec for (topic, archetype) when the catalogue has a usable one, else null. */
export function authoredSpec(topicId, archetype) {
  const e = catalogueEntry(topicId);
  if (!e) return null;
  if (e.game?.archetype === archetype) return e.game.spec;
  if (e.explainer?.archetype === archetype) return e.explainer.spec;
  return null;
}

/**
 * The catalogue's admissibility rows for the Stagecraft catalog (catalog.js buildCatalog): archetype → the topics it
 * has a checked authored spec for. Extension archetypes are admissible ONLY through these rows (their reviewed default is
 * one example lesson's content, never another topic's); base RS-4 archetypes add these topics to their reviewed ones.
 */
export function catalogueTopicsByArchetype(cat = loadCatalogue()) {
  const by = {};
  for (const e of cat.values()) for (const x of [e.game, e.explainer]) if (x) (by[x.archetype] ??= []).push(e.topicId);
  return by;
}
