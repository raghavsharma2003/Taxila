// Where the shipped puppet lives. PUPPET_REV is the polish round whose runtime and pack are synced
// (evals/face-puppet/sync-runtime.mjs). r8 = JUDGE-r8 4.1/5 (JUDGE-r7 4.0): the owner's ship bar is 4.0.
// The pack is ~132 KB of WebP + geometry, served from /face-puppet/<rev>/ (public/), fetched lazily after mount.
export const PUPPET_REV = "r8";
export const PUPPET_BASE = `/face-puppet/${PUPPET_REV}/`;
/** The rest-pose still per framing (the same face at t = 0, the `still` slot and the post-reveal fallback). Rendered by
 *  `node evals/face-puppet/run.mjs poster` from the live rig at rest, over the view's full width and down to the bottom of the art,
 *  so `width: 100%; height: auto` from the top lines up with the canvas pixel for pixel. */
export const puppetPoster = (framing: "medium" | "close" = "medium") => `${PUPPET_BASE}rest-${framing}.webp`;
/** c-front's backdrop cream: the painted layers were cut against it, so the canvas clears to it (no halo). */
export const PUPPET_CLEAR: [number, number, number] = [251.4 / 255, 229.4 / 255, 188.6 / 255];
/** The rest-space window shown per framing: [x0, y0, width] in c-front pixels (1024² space). */
export const PUPPET_VIEW = { medium: [60, 8, 904], close: [140, 70, 744] } as const satisfies Record<string, readonly [number, number, number]>;
