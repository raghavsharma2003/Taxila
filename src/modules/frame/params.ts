// Resolve the Director's params against an EngineDef: apply defaults, enforce types, clamp numbers, check
// enums. Wrong values fall back to the default and are reported, so a planner mistake degrades to a
// sensible module instead of a broken one — and the Director hears about it.
import type { EngineDef } from "../../../shared/contracts.ts";

export interface ResolvedParams {
  params: Record<string, unknown>;
  issues: string[];
}

export function resolveParams(def: EngineDef, raw: Record<string, unknown>): ResolvedParams {
  const params: Record<string, unknown> = {};
  const issues: string[] = [];
  for (const [name, spec] of Object.entries(def.params)) {
    const v = raw[name];
    if (v === undefined || v === null) {
      if (spec.default !== undefined) params[name] = spec.default;
      continue;
    }
    let ok: boolean;
    let value: unknown = v;
    switch (spec.type) {
      case "number": {
        ok = typeof v === "number" && Number.isFinite(v);
        if (ok) {
          const n = Math.min(spec.max ?? Infinity, Math.max(spec.min ?? -Infinity, v as number));
          if (n !== v) issues.push(`${name}: ${v} clamped to ${n}`);
          value = n;
        }
        break;
      }
      case "string":
        ok = typeof v === "string" && (!spec.enum || spec.enum.includes(v));
        break;
      case "boolean":
        ok = typeof v === "boolean";
        break;
      case "array":
        ok = Array.isArray(v);
        break;
      case "object":
        ok = typeof v === "object" && !Array.isArray(v);
        break;
    }
    if (ok) params[name] = value;
    else {
      issues.push(`${name}: ${JSON.stringify(v)} is not a valid ${spec.enum ? `one of ${spec.enum.join("|")}` : spec.type}`);
      if (spec.default !== undefined) params[name] = spec.default;
    }
  }
  for (const name of Object.keys(raw)) if (!(name in def.params)) issues.push(`${name}: unknown param (ignored)`);
  return { params, issues };
}
