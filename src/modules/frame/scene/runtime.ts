// scene@1 runtime state (no DOM): the values, where each draggable sits, the order lists, and the verdicts
// the scene's own expressions give for them. Shared by the renderer and the Node tests, which check that the
// frame's verdicts match the server validator's for the same state.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { evalSrc, type Env, type Val } from "./expr.ts";
import { layout, type Scene } from "./layout.ts";

export interface Draggable {
  id: string; // node id, or "<repeat>_<i>" for repeat instances
  cls: string; // node id or repeat id
  tags: Set<string>;
  start: string | null;
}

export interface RT {
  vals: Record<string, Val>; // vars only (derives are recomputed)
  place: Record<string, string | null>; // draggable id → zone id
  order: Record<string, string[]>;
}

export function draggablesOf(scene: Scene, L = layout(scene, emptyEnv(scene))): Draggable[] {
  const out: Draggable[] = [];
  for (const n of scene.nodes) if (n.drag && n.kind !== "repeat") out.push({ id: n.id, cls: n.id, tags: new Set([n.id, ...(n.tags ?? [])]), start: n.drag.in ?? null });
  for (const n of scene.nodes)
    if (n.kind === "repeat" && n.item?.drag)
      for (const q of L.instances.filter((x) => x.of === n.id)) out.push({ id: q.id, cls: n.id, tags: new Set([n.id, ...(n.item.tags ?? [])]), start: n.item.drag.in ?? null });
  return out;
}

export function initialRT(scene: Scene, drs: Draggable[]): RT {
  const vals: Record<string, Val> = {};
  for (const v of scene.vars) vals[v.id] = v.init;
  const place: Record<string, string | null> = {};
  for (const d of drs) place[d.id] = d.start;
  const order: Record<string, string[]> = {};
  for (const n of scene.nodes) if (n.kind === "order") order[n.id] = n.start ?? n.items.map((i: any) => i.id);
  return { vals, place, order };
}

function emptyEnv(scene: Scene): Env {
  const vals: Record<string, Val> = {};
  for (const v of scene.vars) vals[v.id] = v.init;
  const env: Env = { vals, state: { count: () => 0, has: () => false, at: () => "", order: (l) => (scene.nodes.find((n: any) => n.id === l)?.start ?? scene.nodes.find((n: any) => n.id === l)?.items?.map((i: any) => i.id) ?? []).join(",") } };
  for (const d of scene.derive) {
    try { vals[d.id] = evalSrc(d.expr, env); } catch { vals[d.id] = NaN; }
  }
  return env;
}

export function envOf(scene: Scene, rt: RT, drs: Draggable[]): Env {
  const vals: Record<string, Val> = { ...rt.vals };
  const env: Env = {
    vals,
    state: {
      count: (zone, tag) => drs.filter((d) => rt.place[d.id] === zone && (!tag || d.tags.has(tag))).length,
      has: (zone, id) => drs.some((d) => d.tags.has(id) && rt.place[d.id] === zone),
      at: (id) => rt.place[drs.find((d) => d.tags.has(id) && rt.place[d.id])?.id ?? ""] ?? "",
      order: (list) => (rt.order[list] ?? []).join(","),
    },
  };
  for (const d of scene.derive) {
    try { vals[d.id] = evalSrc(d.expr, env); } catch { vals[d.id] = NaN; }
  }
  return env;
}

const truthy = (src: string, env: Env) => {
  try { return evalSrc(src, env) === true; } catch { return false; }
};

/** The probe's verdict on this state: correct, and the first trap that holds (a misconception token). */
export function probeOutcome(scene: Scene, env: Env): { correct: boolean; misc: string | null } {
  const p = scene.probe;
  if (!p) return { correct: false, misc: null };
  const correct = truthy(p.correct, env);
  const trap = correct ? null : (p.traps ?? []).find((t: any) => truthy(t.when, env));
  return { correct, misc: trap?.misc ?? null };
}

export const goalsMet = (scene: Scene, env: Env): string[] => scene.goals.filter((g: any) => truthy(g.when, env)).map((g: any) => g.id);

/** Can draggable d go into zone z (accepts ∩ tags, and the zone's cap)? */
export function accepts(scene: Scene, rt: RT, drs: Draggable[], d: Draggable, zoneId: string): boolean {
  const z = scene.nodes.find((n: any) => n.id === zoneId && n.kind === "zone");
  if (!z || !z.accepts.some((t: string) => d.tags.has(t))) return false;
  const inZone = drs.filter((x) => x.id !== d.id && rt.place[x.id] === zoneId).length;
  return !z.cap || inZone < z.cap;
}

/** For reveal: the option of a choice that makes the probe correct (exactly one, by validator rule S4). */
export function correctOption(scene: Scene, rt: RT, drs: Draggable[], choiceId: string): string | null {
  const ch = scene.nodes.find((n: any) => n.id === choiceId && n.kind === "choice");
  if (!ch || !scene.probe) return null;
  for (const o of ch.options) {
    const env = envOf(scene, { ...rt, vals: { ...rt.vals, [ch.var]: o.id } }, drs);
    if (probeOutcome(scene, env).correct) return o.id;
  }
  return null;
}

/** For reveal: an order that makes the probe correct (≤ 6 items, ≤ 720 permutations). */
export function correctOrder(scene: Scene, rt: RT, drs: Draggable[], orderId: string): string[] | null {
  const items: string[] = rt.order[orderId] ?? [];
  const perms = (a: string[]): string[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));
  for (const p of perms(items)) {
    if (probeOutcome(scene, envOf(scene, { ...rt, order: { ...rt.order, [orderId]: p } }, drs)).correct) return p;
  }
  return null;
}
