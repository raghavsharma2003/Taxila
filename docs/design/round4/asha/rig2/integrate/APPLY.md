# lamp2 into the app: patch-request for stream 5's look switch

Status: **lamp2 is a HELD look.** It failed its blind gates (RESULTS.md): v3 passes uncanny (1, 1, 0 /5) but premium
stays 2.6-2.8 against r8's 3.0-3.4 in the same runs. The patch only keys it, the way lamp1 is keyed: never painted from `?look=` or
`TAXILA_FACE_LOOK`, dev trials only with `&heldlook=1`. Nothing changes for any child. r8 stays the default.

`01-look-lamp2-held.patch` (made against `origin/claude/r4-asha` at 6a7dbdde, stream 5's branch):
- `src/face-puppet/assets.ts`: `PuppetLook` + `"lamp2"`, `HELD_LOOKS` + `"lamp2"`, `LookPack.rig?: "mesh" | "keys"`,
  the lamp2 pack (base `/face-puppet/lamp2/`, clear colour and framings from `art/character/puppet2d/lamp2/geom.json`).
- `server/face-puppet/config.js`: `HELD_FACE_LOOKS` + `"lamp2"` (the server keeps the same held list).
- `src/face-puppet/stage.ts`: a `"keys"` look loads `KeyRig` (Canvas 2D, no WebGL2 needed), adds `KEY_LEAD_MS` to the
  driver's viseme lead, sets `rig.calm` from `driver.inSafety` every frame, and skips the GL context-restore path.
- `tests/r4-asha-look.test.mjs`: the look list, lamp2 held, lamp2's rig kind.

Needs, from this branch (`claude/r4-asha-rig2`): `src/face-puppet/rig-keys/**`. Not needed while held: the pack in
`public/` (stream 5's test asserts a held pack is not shipped). To trial it in a dev build later, copy
`art/character/puppet2d/lamp2/{body,head,<keys>}.webp`, `geom.json`, `rest-medium.webp`, `rest-close.webp` to
`public/face-puppet/lamp2/`.

Checked on a scratch worktree of stream 5's branch with the patch and `rig-keys/` applied: `npx tsc -b` clean;
`tests/r4-asha-*`, `tests/p2-face-*`, `tests/avatar-*`: 112/112 pass (2026-10-10).

The bilabial rule: lamp2's extension (`scripts/character/puppet2d/lamp2/bilabial2.js`, 132/132 bilabial words sealed on
the 24-line battery vs 121/132 with lamp1's rule) is NOT in this patch: stream 5 owns the product's text rule (its
`visemes.ts`). The measured difference is in RESULTS.md for whoever applies it.
