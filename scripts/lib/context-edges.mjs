// Shared edge rules for the context graph: merge-inbox.mjs (refuses what it cannot place), context.mjs --check (every
// merged edge is in the graph or in DROPPED.json) and scripts/context-repair-2026-11-09.mjs (the one-off repair).
// The graph knows seven relations (graph.json "relations"). Sessions wrote others; this file says which of those map
// onto the seven and how, and nothing else is guessed.

/** One edge from an inbox file, whatever keys the session used ({src,rel,dst} or {from,kind,to}). */
export const normalizeEdge = (raw) => ({ src: raw?.src ?? raw?.from, rel: raw?.rel ?? raw?.kind, dst: raw?.dst ?? raw?.to });
export const edgeKey = (e) => `${e.src}|${e.rel}|${e.dst}`;

/**
 * Relations outside the seven, mapped (owner decision 2026-11-10, plus the exact synonyms):
 *   A informs B      -> B caused_by A
 *   A implements B   -> A part_of B           A refines B -> A part_of B
 *   A supports B     -> B measured_by A when A is a measurement, else B caused_by A
 *   synonyms with the same meaning, reversed or renamed: A measures B -> B measured_by A; A superseded_by B -> B supersedes A;
 *   A constrained_by B -> B constrains A; A refined_by B -> B part_of A; A motivated-by B -> A caused_by B;
 *   A evidence B / A found_by B -> A measured_by B when B is a measurement, else A caused_by B.
 * Widened 2026-11-10 (main loop, after the audit's second reading placed 18 more edges):
 *   A extends B      -> A measured_by B when B is a measurement, else A part_of B
 *   A amends B, A about B -> A part_of B
 *   A explains B     -> B caused_by A
 *   A rejected_for B, A guarded_by B -> A caused_by B
 *   A depends_on B   -> A constrains B  (the graph reads "src constrains dst" as "dst bounds src")
 * `related` has no direction and names none of the seven, so it is dropped with its reason, as is any other word.
 */
export function mapRelation(e, kindOf) {
  const { src: a, rel, dst: b } = e;
  switch (rel) {
    case "informs": return { src: b, rel: "caused_by", dst: a };
    case "implements": case "refines": return { src: a, rel: "part_of", dst: b };
    case "supports": return kindOf(a) === "measurement" ? { src: b, rel: "measured_by", dst: a } : { src: b, rel: "caused_by", dst: a };
    case "measures": return { src: b, rel: "measured_by", dst: a };
    case "superseded_by": return { src: b, rel: "supersedes", dst: a };
    case "constrained_by": return { src: b, rel: "constrains", dst: a };
    case "refined_by": return { src: b, rel: "part_of", dst: a };
    case "motivated-by": return { src: a, rel: "caused_by", dst: b };
    case "evidence": case "found_by": return { src: a, rel: kindOf(b) === "measurement" ? "measured_by" : "caused_by", dst: b };
    case "extends": return { src: a, rel: kindOf(b) === "measurement" ? "measured_by" : "part_of", dst: b };
    case "amends": case "about": return { src: a, rel: "part_of", dst: b };
    case "explains": return { src: b, rel: "caused_by", dst: a };
    case "rejected_for": case "guarded_by": return { src: a, rel: "caused_by", dst: b };
    case "depends_on": return { src: a, rel: "constrains", dst: b };
    default: return null;
  }
}

/** The (source kind, relation, target kind) shapes the graph already uses: a mapped edge of a shape never seen is not honest. */
export function shapesOf(g) {
  const kind = new Map(g.nodes.map((n) => [n.id, n.kind]));
  return new Set(g.edges.map((e) => `${kind.get(e.src)} ${e.rel} ${kind.get(e.dst)}`));
}

/**
 * What to do with one inbox edge against a graph.
 * @returns {{ add: object, mapped?: boolean } | { present: object } | { drop: string }}
 */
export function placeEdge(raw, g, { byId, have, shapes }) {
  const e = normalizeEdge(raw);
  if (!e.src || !e.dst || !e.rel) return { drop: "the edge lacks a source, a target or a relation" };
  if (!byId.has(e.src) || !byId.has(e.dst)) return { drop: `endpoint not in the graph: ${!byId.has(e.src) ? e.src : e.dst}` };
  if (g.relations[e.rel]) return have.has(edgeKey(e)) ? { present: e } : { add: e };
  const m = mapRelation(e, (id) => byId.get(id)?.kind);
  if (!m) return { drop: `relation "${e.rel}" has no honest mapping onto the seven relations` };
  if (m.src === m.dst) return { drop: "mapped edge would point at itself" };
  const shape = `${byId.get(m.src).kind} ${m.rel} ${byId.get(m.dst).kind}`;
  if (!shapes.has(shape)) return { drop: `"${e.rel}" maps to ${m.rel}, but the graph has no edge of the shape "${shape}"` };
  return have.has(edgeKey(m)) ? { present: m } : { add: m, mapped: true };
}

export function indexOf(g) {
  return { byId: new Map(g.nodes.map((n) => [n.id, n])), have: new Set(g.edges.map(edgeKey)), shapes: shapesOf(g) };
}

/** Statuses that say "this is current" and so cannot sit on a node something supersedes. */
export const CURRENT_STATUS = /^(live|provisioned|proposed)/;
