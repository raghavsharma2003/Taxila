// Where the shipped puppet lives. PUPPET_REV is the polish round whose runtime and pack are synced
// (evals/face-puppet/sync-runtime.mjs). r8 = JUDGE-r8 4.1/5 (JUDGE-r7 4.0): the owner's ship bar is 4.0.
// The pack is ~132 KB of WebP + geometry, served from /face-puppet/<rev>/ (public/), fetched lazily after mount.
export const PUPPET_REV = "r8";
export const PUPPET_BASE = `/face-puppet/${PUPPET_REV}/`;
/** The rest-pose still (the same face at t = 0, the `still` slot and the post-reveal fallback). */
export const PUPPET_POSTER = `${PUPPET_BASE}rest.webp`;
/** c-front's backdrop cream: the painted layers were cut against it, so the canvas clears to it (no halo). */
export const PUPPET_CLEAR: [number, number, number] = [251.4 / 255, 229.4 / 255, 188.6 / 255];
/** The rest-space window shown per framing: [x0, y0, width] in c-front pixels (1024² space). */
export const PUPPET_VIEW = { medium: [60, 8, 904], close: [170, 140, 690] } as const satisfies Record<string, readonly [number, number, number]>;
