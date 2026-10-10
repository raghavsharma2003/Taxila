# Round 4 · BUILD-PLAN v2 (wave 2): real games built live, and a gamified app

**Date:** 2026-10-10. **Base:** `claude/blissful-mayer-icwe2j`. Round 3 is live as b371f4e.

**Why this plan exists.** The owner's direction of 2026-10-10 is `dc-r4-owner-vision-superhuman-tutor`:
> "games … minecraft, space fighter level … proper game games … build on the go … depending on the overall
> understanding of the student and the ongoing convo/lecture with the duplex way"
> "real great fully gamified app for student learning which they find cool and engaging"

**Read with:**
- `docs/research/round4/games/FEASIBILITY.md`: the architecture, the seven engines and their skills, and the
  prototype numbers;
- `docs/research/round4/products/TEARDOWN.md`: the gamification evidence;
- `docs/research/round4/tutor/TUTOR-MODEL.md`;
- `docs/design/round4/BUILD-PLAN.md`: §4 ownership rules and §5 merge procedure still apply. Wave 1 is in
  `build/SESSIONS.md`.

## 1. The architecture (from FEASIBILITY §0 and §3)

**Built once and reviewed:** the deep engines, each a 3D view over a round-3 family law. A law is code: it generates,
solves and grades, with mal-rules. Each engine also has art packs (text-free, pre-generated on Azure image models and
reviewed) and procedural sound.

**Built live per lesson, by code:**
- the level, made by `law.generate({skill, focusMal, fade, seed, box})` in about 0.07 ms;
- it targets the misconception she just heard (`misconception_seen`);
- it is proven solvable and shortcut-free;
- the server rebuilds it from its parameters and never trusts the device's copy.

**Written live by a model (`taxila-fast`, strict schema):** only the dress, chosen from closed enums: theme, story
wrapper, music, pace, teacher move and language. It is measured at p50 1,133 ms (n = 12, 12/12 valid). If it is late
or invalid, the base dress plays.

**Evidence:**
1. The device posts the child's raw acts.
2. The server replays them through the same law and returns signed evidence.
3. The ledger folds it with `via: "game"` at weight 0.5, counting first shots only.
4. Game evidence is never the delayed check.

**Not used live:**
- model-written game code: 37-54 s and needs review;
- world models: they cannot carry an exact fraction, and Genie is not sold Direct from Azure;
- 3D mesh generation: an owner decision on self-hosted open weights.

**Gamification is option B** (`dc-r4-gamification-b`):
- **Allowed:** real games where the skill is the mechanic; a world that changes as understanding grows; collections
  opened only by secured skills; co-op goals with no tallies; fast action only on secure skills; in-run scores that
  end with the run.
- **Banned:** carried points or currency, streaks, leagues, lives that gate learning, random drops, countdowns on new
  skills, and anything that punishes absence.
- **Enforcement:** a logic-level lint for every engine (FEASIBILITY §6), not only copy.

## 2. Decisions taken by the main session (delegated; logged as `dc-r4-games-o-g`)

- **O-G1 dressed 3D worlds.** Allowed for 3D engines. Scenery never sits on a learning object; learning objects are
  always drawn on top in reserved hues; labels sit on backing pills. The child pilot carries a plain-vs-dressed arm.
- **O-G2 music.** An adaptive bed is allowed. It ducks to 0 within about 120 ms whenever she speaks. It is off by
  default for classes 4-5; the child can turn it on. `music: off` stays in the enum.
- **O-G4 verb.** "daago / fire" is used at non-living targets only: mines, asteroids, drones. Nothing alive is ever
  destroyed. A parent switch turns the wording to "scan" (words and sound only).

## 3. Wave 2 streams

| stream | branch | Neon TEST branch | delivers |
|---|---|---|---|
| G1 games core + Antariksh | `claude/r4-games-core` | `test-r4-games` | the shared 3D play core, E1 Antariksh over the Nishana law (fractions, decimals and integers on the line, rounding), the dress delta, the logic-level economy lint, the S0.3 per-family rule split, and certification C1-C10 at three viewports into the ledger |
| G2 Khand voxel world | `claude/r4-khand` | `test-r4-khand` | E2 Khand: a Minecraft-class block world. It needs a greedy mesher in a worker, touch build/remove/walk, and a new Nazariya law (views, arrays as multiplication, area vs perimeter, square and cube numbers, symmetry). Builds persist as artefacts |
| U1 gamified app directions | `claude/r4-app-design` | `test-r4-appdesign` | three gamified app directions as real interactive phone prototypes, for the OWNER TO PICK, then the build spec for the chosen one |

**Ownership.** This adds to BUILD-PLAN §4.

**G1 inherits lane 1A's files** (BUILD-PLAN §3.1), since 1A is not running:
- `src/play/core/**`, `src/play/{PlaySession,PlayStage,PlayStudioRenderer}.tsx`;
- `src/play/{client,copy,lessonBridge,lessonLang}.ts`, `src/play/world/**`, `src/play/dev/**`;
- `src/play/families/{todo-jodo,taraazu,nishana,kyun-lab}/**`, `src/play/families/views.ts`,
  `src/play/families/index.ts`;
- `shared/play.ts`, `server/play/**`, `server/forge3/play-cert.js`, `server/forge3/certs/play.json`;
- `data/play/**`, `tests/play-*.test.mjs`, `tests/prod/round3-play.mjs`;
- plus the new `src/play/engines/{core3d,antariksh}/**` and `docs/design/round4/build/games-core/**`.

**G2 owns:**
- `src/play/engines/khand/**`, `src/play/families/nazariya/**`, `server/play/tools/rules/nazariya.mjs`,
  `data/play/reactions/nazariya.json`;
- `tests/r4-khand-*.test.mjs`, `docs/design/round4/build/khand/**`;
- its own lines in `shared/play.ts` FAMILIES/MODES and in `src/play/families/index.ts` LOGIC (hand-merged by main).

Until G1's core lands on the base, G2 renders with three.js directly behind a thin adapter in its own folder. It ports
onto G1's `CORE-API` after main merges G1.

**U1 owns** `docs/design/round4/app/**` only. It writes no product code until the owner picks a direction.

**Coordination G1 → G2.** G1's first push is the core API as a written contract:
`docs/design/round4/build/games-core/CORE-API.md` plus the TypeScript interface file. The main session tells G2 when
it is on G1's branch. G2 may read G1's branch (`git fetch origin claude/r4-games-core`) and may not push to it.

## 4. Merge order (continues BUILD-PLAN §5)

1. 5a single teacher.
2. Stream 2, content.
3. **G1** games core.
4. **G2** Khand.
5. 4A conversation, then 4B duplex, then 3 latency, then 5b lamp1.
6. U1's chosen direction becomes a wave-3 build stream.

Every merge runs the full integrated battery and the prod battery after deploy.

## 5. Later (wave 3)

- E4 Kila (factors and multiples tower defence).
- E5 Chadhai (integer platformer).
- E6 Yantra (science puzzle-physics over the Kyun-Lab laws).
- E7 Nagar (EVS systems sim).
- E3 Daud (racer).
- The English, Hindi and SST interactives (lane 1D).
- The gamified shell build for the direction the owner picks.
- A real-phone run, which needs the owner's device (O-R4).
