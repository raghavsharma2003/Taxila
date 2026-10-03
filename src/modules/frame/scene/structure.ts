// The frame's structural check for scene@1 documents. The server validator (zod schema + lint S1–S7 + solver,
// genui-scene-dsl.mjs / server/forge/scene/dsl.mjs) already passed the scene; the frame does not re-run it
// (CONTENT-ENGINE §3.2: it would ship zod and the 200k-state solver to the phone). This is the cheap subset
// that keeps a malformed or tampered document from rendering: shape, limits, id syntax, known kinds,
// references, expressions that parse, and no markup in any string.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseExpr } from "./expr.ts";
import { BANDS, STAGES } from "./layout.ts";

export const KINDS = new Set(["rect", "circle", "ellipse", "wedge", "line", "poly", "text", "math", "sprite", "image", "group", "repeat", "axis", "connector",
  "zone", "slider", "stepper", "toggle", "choice", "button", "order", "keypad"]);
const ID = /^[a-z][a-z0-9_]{0,23}$/;
const BAD_STR = /<[A-Za-z/!?]|\{\{|javascript:/i;
export const LIMITS = { nodes: 80, vars: 8, derive: 8, timelines: 4, goals: 5, steps: 60, instances: 100, strLen: 160 };

export function checkScene(raw: unknown): { scene: any | null; errors: string[] } {
  const errors: string[] = [];
  const E = (m: string) => errors.length < 12 && errors.push(m);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { scene: null, errors: ["scene: not an object"] };
  const s = structuredClone(raw) as any;
  if (s.dsl !== "scene@1" && s.dsl !== "scene@1.1") E(`dsl: ${JSON.stringify(s.dsl)} is not scene@1`);
  if (!s.meta || !BANDS[s.meta.band]) E("meta.band: not B1-B4");
  if (!s.stage || !(s.stage.aspect in STAGES)) E("stage.aspect: not 4:3 | 1:1 | 3:4");
  for (const k of ["vars", "derive", "timelines", "goals"]) {
    s[k] ??= [];
    if (!Array.isArray(s[k])) E(`${k}: not an array`);
  }
  if (!Array.isArray(s.nodes) || !s.nodes.length) E("nodes: none");
  if (errors.length) return { scene: null, errors };
  if (s.nodes.length > LIMITS.nodes) E(`nodes: ${s.nodes.length} > ${LIMITS.nodes}`);
  if (s.vars.length > LIMITS.vars || s.derive.length > LIMITS.derive || s.timelines.length > LIMITS.timelines || s.goals.length > LIMITS.goals) E("limits: too many vars/derive/timelines/goals");
  const ids = new Set<string>();
  const walkStrings = (v: unknown, path: string) => {
    if (typeof v === "string") {
      if (v.length > LIMITS.strLen) E(`${path}: string too long`);
      if (BAD_STR.test(v)) E(`${path}: markup in a string`);
    } else if (Array.isArray(v)) v.forEach((x, i) => walkStrings(x, `${path}/${i}`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walkStrings(x, `${path}/${k}`);
  };
  walkStrings(s, "");
  for (const [i, n] of s.nodes.entries()) {
    if (!n || typeof n !== "object") { E(`nodes/${i}: not an object`); continue; }
    if (!ID.test(n.id ?? "")) E(`nodes/${i}: bad id ${JSON.stringify(n.id)}`);
    if (ids.has(n.id)) E(`nodes/${i}: duplicate id ${n.id}`);
    ids.add(n.id);
    if (!KINDS.has(n.kind)) E(`nodes/${i}: unknown kind ${JSON.stringify(n.kind)}`);
  }
  const varIds = new Set(s.vars.map((v: any) => v?.id));
  for (const n of s.nodes) {
    if (n.parent && !s.nodes.some((q: any) => q.id === n.parent && q.kind === "group")) E(`${n.id}: parent ${n.parent} is not a group`);
    if (["slider", "stepper", "toggle", "choice", "keypad"].includes(n.kind) && !varIds.has(n.var)) E(`${n.id}: binds unknown var ${n.var}`);
    if (n.kind === "choice" && (!Array.isArray(n.options) || n.options.length < 2 || n.options.length > 4)) E(`${n.id}: 2-4 options`);
    if (n.kind === "order" && (!Array.isArray(n.items) || n.items.length < 2 || n.items.length > 6)) E(`${n.id}: 2-6 items`);
    if (n.kind === "repeat" && (!n.item || !n.layout)) E(`${n.id}: repeat needs item and layout`);
    if ((n.kind === "line" || n.kind === "poly") && !Array.isArray(n.pts)) E(`${n.id}: pts`);
    if (n.kind === "text" && !(n.text?.en || n.text?.fmt?.en)) E(`${n.id}: text needs l10n`);
  }
  const exprs: [string, string][] = [
    ...s.derive.map((d: any) => [`derive ${d.id}`, d.expr] as [string, string]),
    ...s.goals.map((g: any) => [`goal ${g.id}`, g.when] as [string, string]),
    ...(s.probe ? [["probe.correct", s.probe.correct] as [string, string], ...(s.probe.traps ?? []).map((t: any) => ["trap", t.when] as [string, string])] : []),
  ];
  for (const n of s.nodes) for (const [k, v] of Object.entries(n)) if (v && typeof v === "object" && typeof (v as any).$ === "string") exprs.push([`${n.id}.${k}`, (v as any).$]);
  for (const [where, src] of exprs) {
    try {
      if (typeof src !== "string") throw new Error("not a string");
      parseExpr(src);
    } catch (e) {
      E(`${where}: ${(e as Error).message}`);
    }
  }
  const steps = s.timelines.reduce((a: number, t: any) => a + (Array.isArray(t?.steps) ? t.steps.length : 0), 0);
  if (steps > LIMITS.steps) E(`timelines: ${steps} steps > ${LIMITS.steps}`);
  if (!s.goals.length && !s.probe) E("scene needs a goal or a probe");
  return { scene: errors.length ? null : s, errors };
}
