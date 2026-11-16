// Round 7 M5a (owner's #4, cinematic animation at $0): the SCENE, a code-built animation the child watches while she
// explains. It is a different thing from the whiteboard: the board is drawn by hand on her words; a scene is a small film of
// filled, coloured actors (the sun, a drop, the Earth, a roti cut in four) that MOVE on keyframed tracks, with short
// captions, its beats bound to her clauses. Pure data + pure functions shared by the server (builders, lint, facts) and
// the client player (src/modules/scene/ScenePlayer.tsx): the player draws exactly what sceneAt() says.
//
//   { v: 1, kind: "scene", id, stage: { w: 400, h: 300 }, bg, durationMs,
//     actors:   [{ id, prop?, parts?, at: [x, y], scale?, rot?, opacity?, z? }]      (a prop is a code-drawn part list)
//     tracks:   [{ actor, keys: [{ t, at?, rot?, scale?, opacity? }], ease?, loop? }]  (loop: the keys repeat every N ms)
//     captions: [{ t, until?, text, at?: "top" | "bottom" }]                          (short, ≤ 32 chars, the lesson's language)
//     beats:    [{ t, clause?, says }]                                                 (what is shown from t; clause = her clause index)
//     facts:    { ... } }                                                              (values on screen, for her facts row)
//
// Coordinates are stage units (origin top-left, y down); times are ms from the scene's start. No model ever writes a
// scene: builders are code (server/forge/animate/scenes.js), so every number on screen is computed.
import { PROPS, propParts } from "./scene-props.js";

export const SCENE_STAGE = Object.freeze({ w: 400, h: 300 });
/** Colour tokens (the player maps them per theme). */
export const COLOURS = Object.freeze(["sky", "night", "sea", "water", "land", "soil", "leaf", "stem", "sun", "fire", "cloud", "ice", "earth", "moon",
  "metal", "copper", "wood", "food", "crust", "blood", "paper", "ink", "soft", "accent", "mark", "good", "white", "shadow"]);
export const BACKGROUNDS = Object.freeze(["sky", "night", "paper", "lab", "field"]);
export const SHAPES = Object.freeze(["circle", "ellipse", "rect", "poly", "sector", "line", "path", "text"]);
export const CAPTION_MAX = 32;
/** Caption text size in stage units (18: ≥ 14 px in the 360 phone box, the young floor). */
export const CAPTION_SIZE = 18;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const pt = (p) => Array.isArray(p) && p.length === 2 && isNum(p[0]) && isNum(p[1]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** A part list is valid when every part is a known shape with finite geometry and known colours. → null | reason */
export function partProblem(p) {
  if (!p || !SHAPES.includes(p.shape)) return "shape";
  for (const k of ["fill", "stroke"]) if (p[k] !== undefined && !COLOURS.includes(p[k])) return `colour:${p[k]}`;
  switch (p.shape) {
    case "circle": return pt(p.c) && isNum(p.r) && p.r > 0 ? null : "circle";
    case "ellipse": return pt(p.c) && isNum(p.rx) && isNum(p.ry) ? null : "ellipse";
    case "rect": return pt(p.at) && isNum(p.w) && isNum(p.h) && p.w > 0 && p.h > 0 ? null : "rect";
    case "poly": return Array.isArray(p.points) && p.points.length >= 2 && p.points.every(pt) ? null : "poly";
    case "sector": return pt(p.c) && isNum(p.r) && isNum(p.from) && isNum(p.to) ? null : "sector";
    case "line": return pt(p.from) && pt(p.to) ? null : "line";
    case "path": return typeof p.d === "string" && /^[MLHVCSQTAZmlhvcsqtaz0-9.,\s-]+$/.test(p.d) && p.d.length < 2000 ? null : "path";
    case "text": return pt(p.at) && typeof p.text === "string" && [...p.text].length <= CAPTION_MAX ? null : "text";
    default: return "shape";
  }
}

/** The local bounding box of a part list (paths counted by their numbers, a safe over-estimate). */
export function partsBox(parts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const p of parts) {
    if (p.shape === "circle" || p.shape === "sector") { add(p.c[0] - p.r, p.c[1] - p.r); add(p.c[0] + p.r, p.c[1] + p.r); }
    else if (p.shape === "ellipse") { add(p.c[0] - p.rx, p.c[1] - p.ry); add(p.c[0] + p.rx, p.c[1] + p.ry); }
    else if (p.shape === "rect") { add(p.at[0], p.at[1]); add(p.at[0] + p.w, p.at[1] + p.h); }
    else if (p.shape === "poly") for (const q of p.points) add(q[0], q[1]);
    else if (p.shape === "line") { add(...p.from); add(...p.to); }
    else if (p.shape === "text") { const w = textW(p.text, p.size ?? 14); add(p.at[0] - w / 2, p.at[1] - (p.size ?? 14)); add(p.at[0] + w / 2, p.at[1] + 4); }
    else if (p.shape === "path") { const n = (p.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number); for (let i = 0; i + 1 < n.length; i += 2) add(n[i], n[i + 1]); }
  }
  return Number.isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : { x: 0, y: 0, w: 0, h: 0 };
}
/** A caption's / label's width in stage units at `size` (Devanagari counted wider). */
export function textW(text, size = 14) {
  let w = 0;
  for (const ch of String(text)) w += /[ऀ-ॿ]/.test(ch) ? 0.62 : /[A-Z0-9]/.test(ch) ? 0.62 : /[\s.,'-]/.test(ch) ? 0.3 : 0.52;
  return w * size;
}

/** The actor's parts: its own `parts`, else its prop's. */
export const actorParts = (a) => (Array.isArray(a.parts) ? a.parts : a.prop ? propParts(a.prop) : []);

/**
 * Normalise a scene STRICTLY: unknown fields dropped, every actor's parts valid, every track's actor known and its keys
 * in time order inside the scene, captions short. → { ok, scene, errors }
 */
export function normalizeScene(s) {
  const errors = [];
  const stage = { w: SCENE_STAGE.w, h: SCENE_STAGE.h };
  const durationMs = isNum(s?.durationMs) ? clamp(Math.round(s.durationMs), 1000, 60_000) : null;
  if (!durationMs) errors.push("duration");
  const ids = new Set();
  const actors = [];
  for (const a of Array.isArray(s?.actors) ? s.actors : []) {
    if (typeof a?.id !== "string" || ids.has(a.id)) { errors.push(`actor_id:${a?.id}`); continue; }
    if (a.prop !== undefined && !PROPS.includes(a.prop)) { errors.push(`prop:${a.prop}`); continue; }
    const parts = actorParts(a);
    const bad = parts.map(partProblem).find(Boolean);
    if (!parts.length || bad) { errors.push(`parts:${a.id}:${bad ?? "none"}`); continue; }
    if (!pt(a.at)) { errors.push(`at:${a.id}`); continue; }
    ids.add(a.id);
    actors.push({ id: a.id, ...(a.prop ? { prop: a.prop } : { parts }), at: [...a.at], scale: isNum(a.scale) ? a.scale : 1, rot: isNum(a.rot) ? a.rot : 0,
      opacity: isNum(a.opacity) ? clamp(a.opacity, 0, 1) : 1, z: isNum(a.z) ? a.z : 0 });
  }
  const tracks = [];
  for (const tr of Array.isArray(s?.tracks) ? s.tracks : []) {
    if (!ids.has(tr?.actor)) { errors.push(`track_actor:${tr?.actor}`); continue; }
    const keys = (Array.isArray(tr.keys) ? tr.keys : []).filter((k) => isNum(k?.t)).map((k) => ({ t: Math.round(k.t),
      ...(pt(k.at) ? { at: [...k.at] } : {}), ...(isNum(k.rot) ? { rot: k.rot } : {}), ...(isNum(k.scale) ? { scale: k.scale } : {}), ...(isNum(k.opacity) ? { opacity: clamp(k.opacity, 0, 1) } : {}) }));
    if (keys.length < 1 || keys.some((k, i) => i && k.t < keys[i - 1].t) || keys.some((k) => k.t < 0 || (durationMs && k.t > durationMs))) { errors.push(`track_keys:${tr.actor}`); continue; }
    tracks.push({ actor: tr.actor, keys, ease: tr.ease === "linear" ? "linear" : "inOut", ...(isNum(tr.loop) && tr.loop > 0 ? { loop: Math.round(tr.loop) } : {}) });
  }
  const captions = [];
  for (const c of Array.isArray(s?.captions) ? s.captions : []) {
    if (!isNum(c?.t) || typeof c.text !== "string" || !c.text.trim() || [...c.text].length > CAPTION_MAX) { errors.push(`caption:${c?.text}`); continue; }
    captions.push({ t: Math.round(c.t), until: isNum(c.until) ? Math.round(c.until) : durationMs ?? c.t + 3000, text: c.text.trim(), at: c.at === "top" ? "top" : "bottom" });
  }
  const beats = (Array.isArray(s?.beats) ? s.beats : []).filter((b) => isNum(b?.t) && typeof b.says === "string").map((b) => ({ t: Math.round(b.t), ...(Number.isInteger(b.clause) && b.clause >= 0 ? { clause: b.clause } : {}), says: b.says.slice(0, 80) }))
    .sort((a, b) => a.t - b.t);
  const scene = { v: 1, kind: "scene", id: String(s?.id ?? "scene"), stage, bg: BACKGROUNDS.includes(s?.bg) ? s.bg : "paper", durationMs: durationMs ?? 1000, actors, tracks, captions, beats,
    facts: s?.facts && typeof s.facts === "object" ? { ...s.facts } : {} };
  return { ok: !errors.length, scene, errors };
}

const ease = (u, kind) => (kind === "linear" ? u : u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const lerp = (a, b, u) => a + (b - a) * u;
/** One actor's state at time t from its track (or its rest state). */
function trackAt(a, tr, t) {
  const st = { x: a.at[0], y: a.at[1], rot: a.rot, scale: a.scale, opacity: a.opacity };
  if (!tr) return st;
  let tt = t;
  if (tr.loop && t > tr.keys[0].t) tt = tr.keys[0].t + ((t - tr.keys[0].t) % tr.loop);
  // every property holds its last keyed value; between two keys that both carry it, it is eased
  for (const [prop, get] of [["at", (k) => k.at], ["rot", (k) => k.rot], ["scale", (k) => k.scale], ["opacity", (k) => k.opacity]]) {
    const ks = tr.keys.filter((k) => get(k) !== undefined);
    if (!ks.length) continue;
    let v;
    // (before its first key an actor is at REST, as the scene placed it: a track starts at its first key)
    if (tt < ks[0].t) continue;
    if (tt === ks[0].t) v = get(ks[0]);
    else if (tt >= ks.at(-1).t) v = get(ks.at(-1));
    else {
      const i = ks.findIndex((k) => k.t > tt);
      const k0 = ks[i - 1], k1 = ks[i], u = ease((tt - k0.t) / Math.max(1, k1.t - k0.t), tr.ease);
      v = prop === "at" ? [lerp(get(k0)[0], get(k1)[0], u), lerp(get(k0)[1], get(k1)[1], u)] : lerp(get(k0), get(k1), u);
    }
    if (prop === "at") { st.x = v[0]; st.y = v[1]; } else st[prop] = v;
  }
  return st;
}
/** Every actor's state at time t (z-ordered), and the captions showing. The player draws exactly this. */
export function sceneAt(scene, t) {
  const byActor = new Map(scene.tracks.map((tr) => [tr.actor, tr]));
  const actors = scene.actors.map((a) => ({ id: a.id, a, ...trackAt(a, byActor.get(a.id), t) })).sort((p, q) => p.a.z - q.a.z);
  const captions = scene.captions.filter((c) => t >= c.t && t < c.until);
  return { actors, captions };
}
/** The actor's stage-space box in a state (scale about its origin; rotation by its box's circumscribed square). */
export function actorBox(a, st) {
  const b = partsBox(actorParts(a));
  const k = st.scale;
  let x = st.x + b.x * k, y = st.y + b.y * k, w = b.w * k, h = b.h * k;
  if (st.rot % 360 !== 0) { const cx = x + w / 2, cy = y + h / 2, r = Math.hypot(w, h) / 2; x = cx - r; y = cy - r; w = h = 2 * r; }
  return { x, y, w, h };
}

/** Times worth checking: every key, beat and caption edge, and every 250 ms. */
function sampleTimes(scene) {
  const ts = new Set([0, scene.durationMs]);
  for (const tr of scene.tracks) for (const k of tr.keys) ts.add(k.t);
  for (const b of scene.beats) ts.add(b.t);
  for (const c of scene.captions) { ts.add(c.t); ts.add(Math.min(scene.durationMs, c.until - 1)); }
  for (let t = 0; t <= scene.durationMs; t += 250) ts.add(t);
  return [...ts].sort((a, b) => a - b);
}
/**
 * The scene's layout lint (the gate's floor): a visible actor stays on the stage (an actor that enters or leaves is
 * invisible while outside), captions fit their band and never overlap one another, at least one beat, duration 4-40 s.
 * → issues (strings); [] = clean.
 */
export function lintScene(scene) {
  const issues = [];
  const { w: W, h: H } = scene.stage;
  if (scene.durationMs < 4000 || scene.durationMs > 40_000) issues.push(`duration:${scene.durationMs}`);
  if (!scene.beats.length) issues.push("no_beats");
  const out = new Set();
  for (const t of sampleTimes(scene)) {
    const { actors, captions } = sceneAt(scene, t);
    for (const s of actors) {
      if (s.opacity < 0.05 || out.has(s.id)) continue;
      const b = actorBox(s.a, s);
      if (b.x < -4 || b.y < -4 || b.x + b.w > W + 4 || b.y + b.h > H + 4) { out.add(s.id); issues.push(`off_stage:${s.id}@${t}`); }
    }
    for (const at of ["top", "bottom"]) if (captions.filter((c) => c.at === at).length > 1) issues.push(`caption_overlap:${at}@${t}`);
    // a caption never covers a foreground actor (z ≥ 0; a background — sea, ground, a field — may run under it)
    for (const c of captions) {
      const cw = Math.min(W - 8, textW(c.text, CAPTION_SIZE) + 20), cy = c.at === "top" ? 6 : H - 38;
      const cb = { x: (W - cw) / 2, y: cy, w: cw, h: 32 };
      for (const s of actors) {
        if (s.opacity < 0.05 || s.a.z < 0 || out.has(s.id)) continue;
        const b = actorBox(s.a, s);
        const ix = Math.min(b.x + b.w, cb.x + cb.w) - Math.max(b.x, cb.x), iy = Math.min(b.y + b.h, cb.y + cb.h) - Math.max(b.y, cb.y);
        if (ix > 4 && iy > 4) issues.push(`caption_covers:${s.id}@${c.text.slice(0, 12)}`);
      }
    }
  }
  for (const c of scene.captions) if (textW(c.text, CAPTION_SIZE) > W - 16) issues.push(`caption_wide:${c.text}`);
  return [...new Set(issues)];
}

/**
 * The scene on her line's clock: beats with a clause are moved to that clause's onset (ms from her line's start), and the
 * time between them is stretched or squeezed piece by piece (the film follows her voice). → (tLine) → tScene
 */
export function lineWarp(scene, clauseOnsets) {
  const pins = [[0, 0]];
  for (const b of scene.beats) {
    const on = b.clause !== undefined ? clauseOnsets?.[b.clause] : undefined;
    if (isNum(on) && on > pins.at(-1)[0] && b.t > pins.at(-1)[1]) pins.push([on, b.t]);
  }
  return (tl) => {
    if (pins.length < 2) return tl;
    for (let i = 1; i < pins.length; i++) if (tl < pins[i][0]) return lerp(pins[i - 1][1], pins[i][1], (tl - pins[i - 1][0]) / (pins[i][0] - pins[i - 1][0]));
    return pins.at(-1)[1] + (tl - pins.at(-1)[0]);
  };
}
/** Reduced motion: the scene holds still at each beat (the state the beat names) until the next one. */
export const stillAt = (scene, t) => { let s = 0; for (const b of scene.beats) if (b.t <= t) s = b.t; return Math.max(s, scene.beats.length ? 0 : t); };
/** What a beat shows (the facts row's moment): the says of the last beat at or before t. */
export const beatAt = (scene, t) => [...scene.beats].reverse().find((b) => b.t <= t) ?? null;

// ───────────────────────────── withholding (main: answer leaks are zero-visible-failure) ─────────────────────────────
const RAT = (t) => {
  const s = String(t).replace(/\s+/g, "").replace(/[−–]/g, "-");
  let m = s.match(/^(-?\d+)\/(\d+)$/); if (m) return Number(m[2]) ? [Number(m[1]), Number(m[2])] : null;
  m = s.match(/^(-?\d+(?:\.\d+)?)$/); if (m) { const d = (m[1].split(".")[1] ?? "").length; return [Math.round(Number(m[1]) * 10 ** d), 10 ** d]; }
  return null;
};
/** Every value a scene puts on screen: the numbers and fractions in its captions, its text parts and its facts. */
export function sceneValues(scene) {
  const texts = [...scene.captions.map((c) => c.text), ...scene.actors.flatMap((a) => actorParts(a).filter((p) => p.shape === "text").map((p) => p.text)),
    ...Object.values(scene.facts ?? {}).map(String)];
  return [...new Set(texts.flatMap((t) => String(t).match(/-?\d+\s*\/\s*\d+|-?\d+(?:\.\d+)?/g) ?? []).map((x) => x.replace(/\s+/g, "")))];
}
/** The scene's on-screen values that equal one of `held` (rational equality: 2/8 is 1/4). */
export function sceneShowsHeld(scene, held) {
  const hs = (held ?? []).map(RAT).filter(Boolean);
  return sceneValues(scene).filter((v) => { const r = RAT(v); return r && hs.some((h) => h[0] * r[1] === r[0] * h[1]); });
}
/**
 * May a scene play now? Never while a keyed card or check is live (`cardLive`), never when the live card's withheld values
 * could not be computed (`held === null`: fail closed), never while any value is withheld, and never when it shows one.
 * → { ok, why }
 */
export function sceneMayPlay(scene, { held, cardLive = false } = {}) {
  if (cardLive) return { ok: false, why: "card_live" };
  if (held === null) return { ok: false, why: "held_unknown" };
  if (Array.isArray(held) && held.length) {
    const hit = sceneShowsHeld(scene, held);
    return { ok: false, why: hit.length ? `shows_held:${hit.join(",")}` : "card_live" };
  }
  return { ok: true, why: "no_live_key" };
}
