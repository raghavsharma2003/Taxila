# Seam additions for RS-0's seam commit (RESET-PLAN §3.1 item 5: "Placement, plus item ge and demand fields (RS-6)")

## shared/contracts.ts — append

```ts
/** Grade-equivalent on server/learner/kt/ability.js's scale: GE 0 = start of class 1; class C runs from GE C-1 to C. */
export type GE = number;
export type ItemDemand = "recall" | "apply" | "reason" | "transfer";
// KitItem gains (optional; director/items.js itemGE falls back to the difficulty proxy without them):
//   ge?: GE;            // rater-calibrated (rubric v2, two model families) or re-levelled
//   demand?: ItemDemand;
export interface PlacementResult {
  strand: string; classLevel: number; n: number; nGraded: number;
  mean: GE; sd: number; median: GE; q30: GE; modes: GE[]; ambiguous: boolean;
  expected: GE; level: "behind" | "on_track" | "ahead"; startGE: GE; startRule: "q50" | "q30"; skipAhead: boolean;
  movedDown: boolean; movedUp: boolean;
  placement: Record<string, { mu: GE; sd: number }>; // own-evidence site for ability.js initialBase({ placement })
}
export interface PlacementItemPublic { id: string; format: "numeric" | "mcq"; prompt_en: string; prompt_hi: string; unit?: string; options?: string[] }
// Route responses (03-routes-placement.js, review 2026-10-05):
//   POST /api/placement/start  -> { placementId: string; item: PlacementItemPublic } | { skip: true }   (class outside 3-9)
//   POST /api/placement/answer -> { done: false; item: PlacementItemPublic } | { done: true; summary: { level; skipAhead } }
//                                 409 { error: "stale item"; item: PlacementItemPublic | null }  -> re-render that item, no error UI
```

## data/kits/SCHEMA.md — add to the item interface

```ts
    ge?: number;                   // grade-equivalent (ability.js scale). class C = GE C-1..C. Set by data/kits-relevel/merge.mjs from
                                   // two v2 raters (mean grade - 0.5); absent = director uses C-1+(difficulty-3)*0.5
    demand?: "recall"|"apply"|"reason"|"transfer";
    relevel?: "opener"|"ongrade"|"harder";   // RS-6 re-levelled item
```
`difficulty` stays the in-topic rung only (CONTENT-LEVEL F1.1).
