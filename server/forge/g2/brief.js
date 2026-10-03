// S0 RESOLVE + the gap brief (FACTORY.md §3.1). The brief is child-free by construction: it is computed from a topic
// id alone (kit text and kit ids), so one reviewed core serves every child whose day hits the same gap (§1.1:
// "Personalisation lives in G1; novelty lives in G2"). The identity key is what single-flight and the catalogue use.
import { createHash } from "crypto";
import { loadTopic, archetypeFor, eligibleSpecs, splitLevels, LEVELS_VERSION } from "./levels.js";
import { KIT_HASH } from "./bundle.js";

export const RECIPE = { id: "g2-recipe@1", builder: "taxila-codex", designer: "taxila-brain", levels: LEVELS_VERSION };

/** B1 6-7 / B2 8-9 → "6-9"; else "10-15" (contracts.ts ChildBrief.ageBand). */
export const ageBandOf = (classLevel) => (classLevel <= 4 ? "6-9" : "10-15");

/**
 * @param {string} topicId
 * @returns {{ ok: true, brief: object, identityKey: string, levels: object } | { ok: false, reason: string }}
 */
export function briefFor(topicId, { archetype: forced } = {}) {
  const topic = loadTopic(topicId);
  if (!topic) return { ok: false, reason: "unknown_topic" };
  const archetype = forced || archetypeFor(topic);
  if (!archetype) return { ok: false, reason: "no_eligible_items" };
  const { specs, skipped } = eligibleSpecs(topic, archetype);
  if (specs.length < 4) return { ok: false, reason: "too_few_items" };
  const levels = splitLevels(specs);
  const brief = {
    topicId, subject: topic._subject, classLevel: topic._class, ageBand: ageBandOf(topic._class), archetype,
    skills: (topic.skills || []).map((s) => s.title).slice(0, 5),
    misconceptions: (topic.misconceptions || []).map((m) => ({ id: m.id, belief: String(m.belief || "").slice(0, 160) })).slice(0, 3),
    itemCount: specs.length, sampleKinds: [...new Set(specs.map((s) => s.truth))], skipped,
  };
  // CoreIdentity (§1.1): archetype × objective class × band × kit, recipe and levels versions. No child data.
  const identityKey = createHash("sha256").update(JSON.stringify({ topicId, archetype, band: brief.ageBand, recipe: RECIPE, kit: KIT_HASH })).digest("hex").slice(0, 24);
  return { ok: true, brief, identityKey, levels };
}
