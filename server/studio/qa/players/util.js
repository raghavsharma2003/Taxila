// Player helpers shared by the archetype players (G2 / G5 / G6 / G8 building blocks).
import { overlaps, boxGap, centre } from "../common.js";

/** G2: every selector has at least `min` visible elements. → [ok, missing[]] */
export async function seamPresent(c, sels) {
  const missing = [];
  for (const [sel, min = 1] of sels) if ((await c.visible(sel)).length < min) missing.push(`${sel}${min > 1 ? ` x${min}` : ""}`);
  return c.add("G2.seam", missing.length === 0, missing.slice(0, 5));
}

/** G8: the candidates' style signatures are identical before the child acts. */
export async function noHint(c, sel, id = "G8.no_hint") {
  const sig = await c.styleSignatures(sel);
  return c.add(id, sig.length > 0 && new Set(sig).size === 1, [...new Set(sig)].slice(0, 3));
}

/**
 * G5 for a single-key question: tap a wrong candidate (graded wrong), then the right one (graded right), then done.
 * `attr` is the candidate's data attribute (e.g. data-option); values are the attribute values.
 */
export async function wrongThenRight(c, { sel, attr, wrong, right, id = "G5.play_truth", settle = 700 }) {
  const why = [];
  const n0 = c.answers().length;
  if (!(await c.tap(sel, { attr, value: wrong }))) why.push(`no ${attr}=${wrong} to tap`);
  else {
    const a = await c.waitAnswer(n0 + 1);
    if (!a || c.answers().length !== n0 + 1 || a.correct !== false || JSON.stringify(a.value) !== JSON.stringify(wrong)) why.push(`wrong tap posted ${JSON.stringify(a?.value)} (${a?.correct})`);
  }
  await c.sleep(settle);
  const n1 = c.answers().length;
  if (!(await c.tap(sel, { attr, value: right }))) why.push(`no ${attr}=${right} to tap after a wrong answer`);
  else {
    const a = await c.waitAnswer(n1 + 1);
    if (!a || a.correct !== true || JSON.stringify(a.value) !== JSON.stringify(right)) why.push(`right tap posted ${JSON.stringify(a?.value)} (${a?.correct})`);
  }
  await c.sleep(settle);
  c.add(id, why.length === 0, why);
  return why.length === 0;
}

/** G5: Studio.done() reached the host (a closing celebration may take a moment: up to 2.5 s after the last answer). */
export async function doneCalled(c) {
  const t = performance.now();
  while (!c.log.some((e) => e.type === "done") && performance.now() - t < 2500) await c.sleep(60);
  return c.add("G5.done", c.log.some((e) => e.type === "done"), "");
}

/** G4: labels (sel, keyed by attr) do not overlap and sit inside the design box. */
export async function labelsLayout(c, sel, attr) {
  const ls = await c.visible(sel);
  const ov = overlaps(ls, attr);
  const outside = ls.filter((b) => b.x < -1 || b.y < -1 || b.x + b.w > c.stage.w + 1 || b.y + b.h > c.stage.h + 1).map((b) => b.attrs[attr]);
  return c.add("G4.labels_no_overlap", ov.length === 0 && outside.length === 0, [...ov, ...outside.map((o) => `out:${o}`)]);
}

/**
 * G4 anchoring (added after LIVE-STUDIO §14.5: "Oxygen" by the sun): each label is within `maxGap` design units of its
 * referent's box AND no other referent is clearly nearer (a label pointing at the wrong part).
 * @param {Map<string, {x:number,y:number,w:number,h:number}[]>} referents key → candidate boxes (e.g. particles over time)
 */
export function anchored(c, labels, referents, attr, { maxGap = 40, id = "G4.labels_anchored", rivals = null } = {}) {
  const why = [];
  for (const l of labels) {
    const k = l.attrs[attr];
    const own = referents.get(k);
    if (!own?.length) { why.push(`${k}: no referent`); continue; }
    const g = Math.min(...own.map((b) => boxGap(l, b)));
    if (g > maxGap) { why.push(`${k}: ${Math.round(g)} from its referent`); continue; }
    if (rivals && !rivals.has(k)) continue;
    for (const [k2, bs] of referents) {
      if (k2 === k || !bs.length || (rivals && !rivals.has(k2))) continue;
      const g2 = Math.min(...bs.map((b) => boxGap(l, b)));
      if (g2 + 12 < g) { why.push(`${k}: nearer to ${k2}`); break; }
    }
  }
  return c.add(id, labels.length > 0 && why.length === 0, why.slice(0, 4));
}

export { centre, boxGap, overlaps };
export const med = (x) => (x.length ? x.slice().sort((p, q) => p - q)[x.length >> 1] : NaN);
/** Poll until fn() is truthy (or ms passes). → its last value */
export async function until(c, fn, ms = 1500, step = 60) {
  const t = performance.now();
  let v = await fn();
  while (!v && performance.now() - t < ms) { await c.sleep(step); v = await fn(); }
  return v;
}
