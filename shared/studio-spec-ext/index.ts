// studio-spec@2 EXTENSION registry (VALUES-100 V3.1-V3.2). Same three jobs as shared/studio-spec.ts — schema,
// repair-or-default, pure grading from the raw act — for the archetypes that take Studio v2 from 48 class 4-7 topics
// to all of them. `ALL_SPECS` / `validateAny` / `gradeAny` are the single lookup the host, server and catalogue use.
//
// Integration: until patch docs/design/values/v3/patches/01-host-ext-specs.patch lands (host.ts looks up ALL_SPECS),
// `registerExtSpecs()` merges the extension defs into the base ENGINE_SPECS record at runtime so the unmodified host
// can mount extension engines. It is idempotent and only adds keys (never replaces a base archetype).
import { ENGINE_SPECS, gradeAnswer, validateSpec, type Graded } from "../studio-spec.ts";
import { UNGRADED, validateWith, type ExtSpecDef } from "./common.ts";
import { sceneDef } from "./scene.ts";
import { EXT_GAMES } from "./games.ts";

export * from "./common.ts";
const def = <S>(d: ExtSpecDef<S>) => d as unknown as ExtSpecDef<unknown>;
export const ENGINE_SPECS_EXT: Record<string, ExtSpecDef<unknown>> = Object.fromEntries(
  [def(sceneDef), ...EXT_GAMES.map((d) => def(d))].map((d) => [d.archetype, d]),
);
export const ARCHETYPES_EXT = Object.keys(ENGINE_SPECS_EXT);
for (const a of ARCHETYPES_EXT) if (a in ENGINE_SPECS) throw new Error("extension archetype collides with a base archetype: " + a);

export function validateSpecExt<S = unknown>(archetype: string, raw: unknown) {
  const d = ENGINE_SPECS_EXT[archetype];
  if (!d) throw new Error("unknown extension archetype " + archetype);
  return validateWith(d as ExtSpecDef<S>, archetype, raw);
}
export function gradeAnswerExt(archetype: string, spec: unknown, itemId: string, value: unknown): Graded {
  const d = ENGINE_SPECS_EXT[archetype];
  if (!d || typeof itemId !== "string" || itemId.length > 64) return UNGRADED;
  try { return d.grade(spec, itemId, value); } catch { return UNGRADED; }
}
/** One lookup over base + extension archetypes. */
export function isArchetype(a: string): boolean { return a in ENGINE_SPECS || a in ENGINE_SPECS_EXT; }
export function validateAny(archetype: string, raw: unknown) { return archetype in ENGINE_SPECS_EXT ? validateSpecExt(archetype, raw) : validateSpec(archetype, raw); }
export function gradeAny(archetype: string, spec: unknown, itemId: string, value: unknown): Graded { return archetype in ENGINE_SPECS_EXT ? gradeAnswerExt(archetype, spec, itemId, value) : gradeAnswer(archetype, spec, itemId, value); }
let registered = false;
/** Interim shim (see header): lets core/host.ts, which looks up ENGINE_SPECS, mount extension engines. */
export function registerExtSpecs(): void {
  if (registered) return; registered = true;
  for (const [a, d] of Object.entries(ENGINE_SPECS_EXT)) {
    if (a in ENGINE_SPECS) continue;
    (ENGINE_SPECS as Record<string, unknown>)[a] = {
      archetype: a, title: d.title, kind: d.kind, subject: d.subjects[0] === "maths" ? "maths" : "science",
      outcomes: { classes: d.outcomes.classes, topics: d.outcomes.topics, misconceptions: d.outcomes.misconceptions },
      schema: d.schema, defaultSpec: d.defaultSpec, grade: d.grade,
      // the base validateSpec calls repair() then the strict schema: identical semantics to validateWith
      repair: d.repair,
    };
  }
}
