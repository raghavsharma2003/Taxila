// plan(ctx) → the G1 route for one item: which activity (T1 engine params or a T2a scene template), in what
// order of fallbacks, and why. Pure code over in-memory inputs — no I/O, no model (FACTORY.md §6.1: replayable;
// content-live-tiers: "the router is deterministic server code; the model never picks its tier, template or
// renderer").
import { activitiesFor } from "./derive.js";
import { bandOf, sceneLang, interestSet, interestIdOf } from "./strings.js";

/** Renderers G1 can fill (derive.js) — the only ones that matter here; the frame may register more (number-line@1). */
export const G1_RENDERERS = ["fraction-bars@1", "scene@1"];
/** The G1 renderers the child's frame can mount (src/modules/frame/registry.ts; tests/forge-g1.test.mjs pins this against
 *  the registry, so a registry change fails a test instead of drifting). scene@1 is ON by default since W1-B #5: its
 *  frame renderer shipped (scene-renderer-validator-ports) and render-check.mjs now drives scene@1 fills (wrong commit
 *  + solution, frame verdict = gate key = server grader; evals/forge-g1-render.mjs). FORGE_SCENE_RENDERER=0 turns it
 *  off (the kill switch, e.g. if a renderer regression ships). */
export function liveRenderers(env = process.env) {
  const r = new Set(["fraction-bars@1"]);
  if (env.FORGE_SCENE_RENDERER !== "0") r.add("scene@1");
  return r;
}

/** Moves that take a G1 activity; the rest close the module (server/director/modules.js CLEAR_MOVES). */
const FILL_MOVES = new Set(["practice", "probe", "retrieval", "remediate", "homework", "show_module", "reteach", "explain", "worked_example", "hint"]);
const SHOW_MOVES = new Set(["show_module", "reteach", "explain", "worked_example"]);
export const moveKind = (move) => (typeof move === "string" ? move : move?.kind) || "practice";

/**
 * @param {{ item: any, kit: any, move?: any, child?: { classLevel?: number, languagePref?: string, interests?: string[] },
 *   renderers?: Set<string> }} ctx
 */
export function plan(ctx) {
  const { item, kit } = ctx;
  const reasons = [];
  const kind = moveKind(ctx.move);
  const band = bandOf(ctx.child?.classLevel ?? 6);
  const lang = sceneLang(ctx.child?.languagePref ?? "hinglish");
  // The kit's own interest contexts that match the child's interests ride along (closed InterestIds only).
  const childSkins = interestSet(ctx.child?.interests);
  const kitSkins = new Set((kit.interestContexts || []).map(interestIdOf).filter(Boolean));
  const skins = childSkins.filter((s) => s !== "generic").sort((a, b) => Number(kitSkins.has(b)) - Number(kitSkins.has(a)));
  if (!skins.length) skins.push("generic");
  const base = { band, lang, skins, show: SHOW_MOVES.has(kind) };
  if (!FILL_MOVES.has(kind)) return { ...base, primary: null, fallbacks: [], reasons: [`move_excludes_module:${kind}`], rejects: [] };
  if (!item) return { ...base, primary: null, fallbacks: [], reasons: ["no_item"], rejects: [] };
  if (item.verified && item.verified.agrees === false) return { ...base, primary: null, fallbacks: [], reasons: ["kit_item_disputed"], rejects: [] };

  const renderers = ctx.renderers ?? liveRenderers();
  const { activities, rejects } = activitiesFor(item, kit);
  const hinted = (a) => kit.formats.engineHints.some((h) => a.renderer === "fraction-bars@1" ? /fraction|pizza|fold/i.test(h)
    : a.template === "sequence-steps@1" ? /sequenc|scramble|order|story/i.test(h) : true);
  // T1 engines first (correctness is engine maths), then T2a templates; a kit hint for the mechanic breaks ties.
  const ranked = activities
    // A diagnostic exists to tell misconceptions apart, so its options-with-traps form ranks first when it can mount.
    .map((a, i) => ({ a, i, s: (item.diagnostic && a.template === "choice-card@1" ? -20 : 0) + (a.tier === "T1" ? 0 : 10) + (hinted(a) ? 0 : 1) }))
    .sort((x, y) => x.s - y.s || x.i - y.i).map((x) => x.a);
  if (SHOW_MOVES.has(kind)) {
    // A show move may only display: engines can (labels on, no goal pressure); scenes are probes, so not here.
    const show = ranked.filter((a) => a.tier === "T1");
    if (!show.length) reasons.push("show_needs_engine");
    return finish(show);
  }
  return finish(ranked);

  function finish(list) {
    const live = list.filter((a) => renderers.has(a.renderer));
    const later = list.filter((a) => !renderers.has(a.renderer));
    for (const a of later) reasons.push(`renderer_not_shipped:${a.renderer}`);
    if (!list.length) reasons.push("no_activity_for_item");
    for (const a of live) reasons.push(`eligible:${a.renderer}${a.template ? "/" + a.template : ""}${hinted(a) ? ":hint" : ":content"}`);
    return { ...base, primary: live[0] ?? null, fallbacks: live.slice(1), catalogue: later, reasons, rejects };
  }
}
