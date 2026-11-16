# Archive proposal: finished-probe media in `docs/` (DOCS-41)

**This is a proposal. Nothing has been moved or deleted.** Written 2026-11-10 by the docs audit, on `int/r6` at integration 21a.
It needs the owner's yes, and main's, before anyone moves a byte.

## The problem

`docs/` is 17,289 tracked files and 2.78 GB (no LFS). 11,729 of those files are binary media (pictures, screen recordings,
audio probes, packed logs) and they hold **2,468 MB**, about 89% of it. They are the output of finished probes: every clone of
the repository downloads them, and `git` carries them for ever. The write-ups next to them are small and stay.

## What would move

Binary media only: png, jpg, gif, webp, wav, pcm, mp3, ogg, mp4, webm and `.gz`, per top-level tree. Never the `.md`, `.json`,
`.html`, `.mjs` or `.py` beside them. Counts and sizes are of the working tree at integration 21a. "Last commit" is the last
commit that touched any of the tree's media; `ae880e84` (2026-11-06) is the repository's squashed starting commit, so for most trees
it only says "not touched since the squash".

| Tree | Media files | Size | Last commit | Read by code, tests or scripts by media path (proof below) |
|---|---|---|---|---|
| `docs/research/voice` | 4,201 (1717 pcm, 1235 wav, 809 mp3, 440 ogg) | 953 MB | `ae880e84` 2026-11-06 | 1 line in `evals/voice-pace-owner/measure.mjs` |
| `docs/design/teacher` | 999 (841 png, 58 webp, 48 mp4, 47 jpg, 5 mp3) | 367 MB | `ae880e84` 2026-11-06 | 31 lines in 28 files: face build scripts (`scripts/character/**`, `evals/face-puppet/clip.mjs`) |
| `docs/design/round4` | 1,865 (896 webp, 648 png, 291 jpg, 15 webm, 12 mp4, 3 gz) | 215 MB | `ae880e84` 2026-11-06 | 14 lines in 14 files: `scripts/character/puppet2d/lamp1`, `lamp2`; `tests/prod/*` (never run in the gate) |
| `docs/design/reset` | 651 (619 png, 16 jpg, 16 webm) | 198 MB | `ae880e84` 2026-11-06 | 1 line in `src/studio-v2/tools/record.mjs` |
| `docs/design/round3` | 1,007 (745 png, 259 jpg, 3 gz) | 157 MB | `ae880e84` 2026-11-06 | none |
| `docs/handoff` | 102 (69 gz, 33 wav) | 154 MB | `ae880e84` 2026-11-06 | none |
| `docs/design/build` | 763 (763 png) | 124 MB | `ae880e84` 2026-11-06 | 1 line in `tests/e2e-design-lesson-truth.mjs` (it writes screenshots there) |
| `docs/design/round7` | 879 (790 png, 87 mp4, 2 webm) | 99 MB | `e23b3fd6` 2026-11-09 | none, but this is the current round: leave it |
| `docs/design/gap-audit` | 530 (529 png, 1 jpg) | 84 MB | `ae880e84` 2026-11-06 | none |
| `docs/design/superhuman` | 343 (185 wav, 158 mp3) | 65 MB | `ae880e84` 2026-11-06 | none |
| `docs/research/content` | 129 (85 wav, 44 png) | 22 MB | `ae880e84` 2026-11-06 | none |
| `docs/design/round2` | 86 (86 png) | 16 MB | `ae880e84` 2026-11-06 | none |
| `docs/design/audit` | 174 (174 png) | 14 MB | `ae880e84` 2026-11-06 | none |
| **Total** | **11,729** | **2,468 MB** | | |

## Proposed order

1. **No reader at all, finished work (about 510 MB):** `round3`, `handoff` (the 2026-10-27 archives; `docs/handoff/STORAGE.md` already
   says fuller copies are in container `handoff-2026-10-27`), `gap-audit`, `superhuman`, `research/content`, `round2`, `audit`.
2. **One named reader each (about 1.3 GB):** `research/voice`, `reset`, `build`. Keep the one file each reader names, move the rest.
   `design/build` is a screenshot folder that a test writes into, so the test, not the folder, is the owner of what appears there.
3. **Read by build scripts (about 580 MB):** `design/teacher` and `design/round4` hold the inputs and judged sheets of the face
   rebuilds (r8, lamp1, lamp2). Move only after the owner picks the look (r8, lamp2 or r9) and the scripts that read them are retired or
   re-pointed; until then they are the only copy of those inputs.
4. **Do not touch `docs/design/round7`:** current work; its media are this round's evidence.

Where to put it: Azure Storage (the project's existing account is Azure; the owner's Azure-only rule applies), one folder per tree,
with a `MANIFEST.json` of path, bytes and sha256 per file, and a short `README.md` left in the tree saying where it went. The write-ups
keep their links; a link to a moved picture would point at the manifest.

Cost of waiting: none to the product (the production image does not copy `docs/`). Cost of acting: every clone and CI checkout gets
smaller, but history keeps the blobs unless the owner also approves rewriting history, which this proposal does **not** ask for.

## Also read from `docs/` by the gate (not media; this is DOCS-42)

These are why no old doc tree can be archived wholesale. Each is a test that imports or reads a file there:
`tests/scene-runtime.test.mjs` imports `docs/research/content/genui-scene-dsl.mjs`; `tests/spoken.test.mjs` imports
`docs/research/voice/notation-probe-2026-10-02/items.mjs`; `tests/r4-kaksha-play.test.mjs`, `tests/round3-voicesig.test.mjs` and
`tests/p3-voicesig-server.test.mjs` read `.diff` files under the round trees. Move those two modules and the fixtures under
`tests/fixtures/` first (the tests-evals area's change).

## Proof (how to check it)

Run from the repository root on `int/r6` at integration 21a.

```
# the media of a tree, and its size
git ls-files docs/<tree> | grep -E '\.(png|jpe?g|gif|webp|wav|pcm|mp3|mp4|webm|ogg|gz)$' | wc -l
# readers by media path (code, tests, scripts, CI, Dockerfiles; the evals' own out/ folders are generated output)
git grep -n -E 'docs/<tree>/[^"'"'"' )`]*\.(png|jpe?g|gif|webp|wav|pcm|mp3|mp4|webm|ogg|gz)' -- tests evals scripts src server shared package.json .github Dockerfile ':!evals/**/out/**'
# readers of the tree at all
git grep -l -F 'docs/<tree>/' -- tests evals scripts src server shared package.json .github Dockerfile
```

A "none" in the last column means the second command printed nothing. `context/` entries that cite a tree are evidence in prose, not
readers; they cite write-ups, and those stay. A reader that only *writes* a folder (a screenshot or recording script) is listed above
because the grep cannot tell reads from writes; read each before moving its tree.

## Step 0, file by file: media that nothing names at all

Added 2026-11-10. The table above works tree by tree. This section is the narrower, exact first step: the media files
that no code and no kept write-up names, listed one per line in `docs/ARCHIVE-remove.txt`. It is still a proposal;
nothing has been removed. `scripts/docs-archive-plan.mjs` computes it and can be run again at any commit.

A media file is on the list only if all of this is true:
1. It is not under `docs/design/round7` or `docs/handoff`.
2. No code names it, or a folder above it: `server`, `src`, `shared`, `scripts`, `tests`, `evals`, `infra`, `.github`,
   `package.json`, the Dockerfiles, the Vite config. Both spellings are read (`docs/design/x`, and `"docs", "design", "x"`).
   A path that appears only in a comment is not a reader.
3. No kept write-up names it: every `.md` and `.html` under `docs/`, the root `.md` files and `context/*.md`.
4. In `docs/design/teacher`, only the 2D puppet's judging rounds 3 to 7 can qualify; everything else there is kept.

The table separates a reader in the product or a gate test (binding) from a reader in an offline tool (an eval, a
character script, a screenshot harness). The planner cannot tell an offline tool that reads from one that only writes its
output folder, so it keeps everything such a tool names. That is the larger, later step, and it needs each tool read.

<!-- plan:start (written by scripts/docs-archive-plan.mjs --write; do not edit by hand) -->
Computed at commit `e10becd99`. Code files scanned: 8405. Write-ups scanned: 756.

| | Files | MB |
|---|---|---|
| Everything under docs/ | 17319 | 2779 |
| Media under docs/ | 11891 | 2607 |
| **Proposed for removal** | **6112** | **1123** |
| Kept: a compressed write-up or result | 3 | 2.3 |
| Kept: named by a write-up | 556 | 54 |
| Kept: named by an offline tool | 4008 | 941 |
| Kept: named by the product or a gate test | 196 | 104 |
| Kept: round 7 or handoff | 1016 | 383 |
| docs/ after the removal | 11207 | 1655 |

By type, proposed for removal: pcm 1717 (367 MB), png 2001 (344 MB), wav 883 (192 MB), mp3 782 (165 MB), webp 322 (20 MB), jpg 229 (17 MB), gz 3 (8.7 MB), ogg 169 (4.1 MB), webm 2 (3.0 MB), mp4 4 (1.7 MB).

| Tree | Remove: files | Remove: MB | Kept, product or gate test | Kept, offline tool | Kept, a write-up names it | Kept, other | Example reader |
|---|---|---|---|---|---|---|---|
| docs/research/voice | 3396 | 712 | 0 (0.0 MB) | 620 (225 MB) | 185 (16 MB) | 0 (0.0 MB) | `evals/model-refresh-2026-10-04/scout/transcribe-stream.py:14` |
| docs/design/round3 | 800 | 145 | 0 (0.0 MB) | 0 (0.0 MB) | 204 (10.0 MB) | 3 (2.3 MB) | `docs/design/round4/world/RESEARCH.md` |
| docs/design/round4 | 963 | 127 | 79 (3.6 MB) | 754 (66 MB) | 69 (18 MB) | 0 (0.0 MB) | `src/ui-v3/kaksha/futurist.css:2` |
| docs/design/gap-audit | 307 | 51 | 0 (0.0 MB) | 170 (25 MB) | 53 (7.9 MB) | 0 (0.0 MB) | `evals/translit/build-corpus.mjs:14` |
| docs/design/reset | 106 | 24 | 32 (74 MB) | 513 (100 MB) | 0 (0.0 MB) | 0 (0.0 MB) | `src/studio-v2/tools/build-gallery.mjs:14` |
| docs/research/content | 129 | 22 | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) |  |
| docs/design/round2 | 84 | 15 | 0 (0.0 MB) | 0 (0.0 MB) | 2 (0.8 MB) | 0 (0.0 MB) | `docs/design/round3/game/concepts/live-tech.md` |
| docs/design/audit | 174 | 14 | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) |  |
| docs/design/superhuman | 70 | 5.7 | 0 (0.0 MB) | 273 (59 MB) | 0 (0.0 MB) | 0 (0.0 MB) | `evals/model-scout-2026-10-04/speech/judge.mjs:11` |
| docs/design/ship5 | 39 | 3.1 | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) |  |
| docs/research/round4 | 10 | 2.7 | 0 (0.0 MB) | 0 (0.0 MB) | 10 (0.2 MB) | 0 (0.0 MB) | `context/measurements.md` |
| docs/research/factory | 14 | 0.9 | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) |  |
| docs/research/avatar | 13 | 0.8 | 0 (0.0 MB) | 0 (0.0 MB) | 1 (0.4 MB) | 0 (0.0 MB) | `docs/research/avatar/tutor-selection-ux.md` |
| docs/design/round5 | 3 | 0.1 | 0 (0.0 MB) | 0 (0.0 MB) | 24 (0.6 MB) | 0 (0.0 MB) | `docs/design/round5/qa/DEFECTS.md` |
| docs/research/models | 4 | 0.1 | 0 (0.0 MB) | 1 (0.1 MB) | 8 (0.5 MB) | 0 (0.0 MB) | `evals/model-refresh-2026-10-04/setup/smoke.mjs:57` |
| docs/design/build | 0 | 0.0 | 0 (0.0 MB) | 763 (124 MB) | 0 (0.0 MB) | 0 (0.0 MB) | `tests/e2e-design-b1-route.mjs:31` |
| docs/design/round7 | 0 | 0.0 | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) | 906 (101 MB) |  |
| docs/design/teacher | 0 | 0.0 | 85 (25 MB) | 914 (342 MB) | 0 (0.0 MB) | 0 (0.0 MB) | `tests/r7-audit-docs.test.mjs:202` |
| docs/handoff | 0 | 0.0 | 0 (0.0 MB) | 0 (0.0 MB) | 0 (0.0 MB) | 110 (282 MB) |  |
<!-- plan:end -->

**At the go:** run `node scripts/docs-archive-plan.mjs --verify` at the commit where the removal is done (it fails if a
listed file has gained a reader), then `git rm --pathspec-from-file=docs/ARCHIVE-remove.txt`, the full gate, and commit.
Removing files from the working tree does not shrink history: every listed file stays in commit `8bb6b188` and earlier,
and `git checkout 8bb6b188 -- <path>` brings one back.
