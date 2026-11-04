# Khand MEASURE (work in progress, kept here only so it survives)

Stopped on 2026-10-10 by the owner's "no new features" decision. This is not part of any release and is not applied
anywhere. `0001-measure-mode-local.patch` is `git format-patch` of local commit 2cf37bdc, made on top of a78c09fa (before
the base 8448c98 merge and the core3d port).

**To resume:**
1. `git am` the patch onto a branch at a78c09fa.
2. Merge the current head into it. Expect conflicts in the registration files.
3. Change its `engine.ts` imports from `./shim/api.ts` to `../core3d/api.ts`.

**What it holds:** the Nazariya `measure` mode, where base-ten unit blocks' voxels are the small unit:
- the law and its oracle battery (0 wrong grades over 10,001 acts);
- 15 rules over 6 topics (c4-ch08 t01 / t02, c5-ch08 t01 / t02, c5-ch05-t01, c4-ch06-t01);
- reaction lines;
- the 2D bay-card twin;
- engine labels, pad and picks.

**Not done:**
- The 3D dev-page shots time out.
- Its arts are not certified.
- No lesson trial has been run.

Why it was started: `../journey/FINDINGS.md` and the coverage table sent to the main session.
