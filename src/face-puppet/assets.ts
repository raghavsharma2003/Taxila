// Where the shipped puppets live, per LOOK (round 4 stream 5, the look switch). A look is one judged puppet pack:
//   r8    — the style-C chibi Asha (JUDGE-r8 4.1/5; the owner's ship bar is 4.0); the default until the owner says go;
//   lamp1 — the grown-up Asha, face option 4 "Lamplight flat", cardigan + block-print kurta (dc-r4-face-lamplight-flat,
//           dc-r4-outfit-cardigan-print-kurta). HELD (2026-10-10): its live puppet failed the blind uncanny gate (4, 5, 3,
//           4 / 5 against <= 1; r8 0 / 5; rj-r4-lamp1-mesh-warp-uncanny), so no page may paint it: neither ?look= nor
//           TAXILA_FACE_LOOK selects a held look (dev builds can still trial it with &heldlook=1). A passing rig (lamp2)
//           joins as a new look.
// Each pack is WebP layers + geometry, served from /face-puppet/<look>/ (public/), fetched lazily after mount. Which look
// a page shows is decided in ./look.ts (?look= on the device, else the server's TAXILA_FACE_LOOK).
export type PuppetLook = "r8" | "lamp1";
export const PUPPET_LOOKS: readonly PuppetLook[] = ["r8", "lamp1"];
/** The deploy default while the server has not said otherwise. Making lamp1 the default needs the owner's yes. */
export const DEFAULT_LOOK: PuppetLook = "r8";
/** Looks keyed here but never painted (see lamp1 above). The server keeps the same list (server/face-puppet/config.js). */
export const HELD_LOOKS: readonly PuppetLook[] = ["lamp1"];
/** Looks painted ONLY when the server names them for the owner cohort (server/face-puppet/config.js COHORT_FACE_LOOKS,
 *  TAXILA_FACE_LOOK_FOR): never from ?look= in production. Empty until a candidate (e.g. lamp2) is approved for that. */
export const COHORT_LOOKS: readonly PuppetLook[] = [];
/**
 * A look a page may paint: keyed, not held and not cohort-only. `{ cohort: true }` (the server's owner-cohort answer)
 * also admits a cohort-only look; `{ held: true }` (dev trials only) admits a held or cohort-only one.
 */
export const isPuppetLook = (v: unknown, { held = false, cohort = false }: { held?: boolean; cohort?: boolean } = {}): v is PuppetLook =>
  typeof v === "string" && (PUPPET_LOOKS as readonly string[]).includes(v)
  && (held || !(HELD_LOOKS as readonly string[]).includes(v))
  && (held || cohort || !(COHORT_LOOKS as readonly string[]).includes(v));

type View = readonly [number, number, number];
export interface LookPack {
  look: PuppetLook;
  /** /face-puppet/<look>/ */
  base: string;
  /** The backdrop the painted layers were cut against: the canvas clears to it (no halo). 0-1 RGB. */
  clear: readonly [number, number, number];
  /** The rest-space window shown per framing: [x0, y0, width] in the pack's 1024² space (its geom.json `views`). */
  view: { readonly medium: View; readonly close: View };
}

const PACKS: Record<PuppetLook, LookPack> = {
  // c-front's backdrop cream; views tuned over the r8 polish rounds
  r8: { look: "r8", base: "/face-puppet/r8/", clear: [251.4 / 255, 229.4 / 255, 188.6 / 255], view: { medium: [60, 8, 904], close: [140, 70, 744] } },
  // the lamplit flat backdrop and views of the lamp1 pack's own geom.json (`clear`, `views`); tests/r4-asha-look.test.mjs
  // checks these against public/face-puppet/lamp1/geom.json whenever the pack is there
  lamp1: { look: "lamp1", base: "/face-puppet/lamp1/", clear: [0.96, 0.82, 0.6], view: { medium: [60, 0, 904], close: [171, 30, 708] } },
};

export const lookPack = (look: PuppetLook = DEFAULT_LOOK): LookPack => PACKS[look] ?? PACKS[DEFAULT_LOOK];
/** The pack's backdrop as a CSS colour (the host paints it before any pixel of the face arrives). */
export const lookBackground = (look: PuppetLook = DEFAULT_LOOK): string => `rgb(${lookPack(look).clear.map((c) => Math.round(c * 255)).join(",")})`;

/** The rest-pose still per framing (the same face at t = 0, the `still` slot and every fallback of a look). Rendered by
 *  `node evals/face-puppet/run.mjs poster` from the live rig at rest, over the view's full width and down to the bottom of
 *  the art, so `width: 100%; height: auto` from the top lines up with the canvas pixel for pixel. */
export const puppetPoster = (framing: "medium" | "close" = "medium", look: PuppetLook = DEFAULT_LOOK) => `${lookPack(look).base}rest-${framing}.webp`;

// The r8 names every caller used before the switch (tests/p2-face-server.test.mjs checks PUPPET_REV against the server's).
/** The default pack revision (mirrors server/face-puppet/rev.js PUPPET_REV). */
export const PUPPET_REV = DEFAULT_LOOK;
export const PUPPET_BASE = PACKS.r8.base;
export const PUPPET_CLEAR: [number, number, number] = [...PACKS.r8.clear];
export const PUPPET_VIEW = { medium: PACKS.r8.view.medium, close: PACKS.r8.view.close } as const satisfies Record<string, View>;
