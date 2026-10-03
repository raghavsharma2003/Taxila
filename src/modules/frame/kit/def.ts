// EngineDef helpers. Every engine accepts the Director's planning context (server/director/modules.js sends
// topicId, skillId, itemId, lang, representation and the item's extracted fractions/numbers with every
// mount), so a mount that has not yet been adapted to the engine still degrades to a sensible activity built
// from those values instead of a wall of "unknown param" issues.
import type { EngineDef } from "../../../../shared/contracts.ts";

type ParamSpec = EngineDef["params"][string];

export const CONTEXT_PARAMS: Record<string, ParamSpec> = {
  topicId: { type: "string", doc: "Director context: kit topic id" },
  skillId: { type: "string", doc: "Director context: skill id" },
  itemId: { type: "string", doc: "Director context: kit item id" },
  lang: { type: "string", doc: "Director context: lesson language (init.lang is authoritative)" },
  representation: { type: "string", doc: "Director context: the remediation's representation (free text, never shown)" },
  fractions: { type: "array", doc: "Director context: [[n, d], …] extracted from the item prompt" },
  numbers: { type: "array", doc: "Director context: numbers extracted from the item prompt" },
  predict: { type: "boolean", default: false, doc: "Director predict intent: hide answer-bearing aids (live readouts, the drawn comparison, the dots to count) until a verdict or reveal; `mode` stays the engine's own" },
};

/** "show" and "predict" are the Director's generic modes: the engine picks its own from the values given. */
export const GENERIC_MODES = ["show", "predict"];

export function defineEngine(def: EngineDef): EngineDef {
  return { ...def, params: { ...CONTEXT_PARAMS, ...def.params }, emits: [...new Set([...def.emits, "params_adjusted", "retap", "goal_met", "stuck"])] };
}
