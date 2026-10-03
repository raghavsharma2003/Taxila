// Real prerequisite edges for the Sky map (PRODUCT-DESIGN-V2 §3.8: "edges are real prerequisites"). The child map
// response carries chapters → topics → skills but not the syllabus graph, so the edges come from the NCERT graph in
// data/curriculum/c<class>-<subject>.json, loaded lazily (one 10-20 KB chunk per subject, map route only).
// An edge is drawn only between two topics that are BOTH on the visible constellation map; a prerequisite in an
// earlier class draws nothing (no invented lines).
const files = () => import.meta.glob<{ default: { chapters?: { topics?: { id: string; prerequisites?: string[] }[] }[] } }>("../../../data/curriculum/c*-*.json");

const SUBJECT_FILE: Record<string, string> = { "social-science": "sst", "social science": "sst", sst: "sst", science: "science", maths: "maths", math: "maths", english: "english", hindi: "hindi", evs: "evs" };

/** topic id → its prerequisite topic ids, for one class and subject. Empty when the file is not there. */
export async function loadPrereqs(classLevel: number, subject: string): Promise<Map<string, string[]>> {
  const key = SUBJECT_FILE[subject.toLowerCase()] ?? subject.toLowerCase();
  const loader = files()[`../../../data/curriculum/c${classLevel}-${key}.json`];
  const out = new Map<string, string[]>();
  if (!loader) return out;
  try {
    const mod = await loader();
    for (const ch of mod.default.chapters ?? []) for (const tp of ch.topics ?? []) out.set(tp.id, tp.prerequisites ?? []);
  } catch {
    /* no edges */
  }
  return out;
}

/** Edges between visible topics: [fromTopic, toTopic] where `from` is a prerequisite of `to`. Pure (unit-tested). */
export function visibleEdges(prereqs: Map<string, string[]>, visibleTopics: Set<string>): [string, string][] {
  const edges: [string, string][] = [];
  for (const [to, froms] of prereqs) {
    if (!visibleTopics.has(to)) continue;
    for (const from of froms) if (from !== to && visibleTopics.has(from)) edges.push([from, to]);
  }
  return edges;
}
