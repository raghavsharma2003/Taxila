# Round 4 · parallel cloud sessions (main session's launch record)

Main session: `session_0135KCpT8GA8E1uzNPiw2Hw3` (integration, merges, migrations, deploys, context graph).
Each stream session runs in its own cloud container on its own branch, cut from `claude/blissful-mayer-icwe2j`.

## Wave 1 (launched 08:04-08:09 UTC 2026-10-10, right after round 3 went live; base 8e438f0 / ceaf942 / 522dca6)

| stream | branch | Neon TEST branch (own compute) | brief | session |
|---|---|---|---|---|
| 2 live content | `claude/r4-content` | `test-r4-content` (br-restless-bonus-b73okq6v) | BUILD-PLAN §7 Brief 2 + v2 note below | session_01LJoMKWmmgGVu7ZtogXAAq5 |
| 3 latency | `claude/r4-latency` | `test-r4-latency` (br-aged-moon-b7zul173) | Brief 3 | session_01DQV1RuwHDvZdoVJ8PpbsyJ |
| 4A conversation + session-first | `claude/r4-conversation` | `test-r4-conversation` (br-wandering-star-b7sldvat) | Brief 4A + v2 note below (phase 2: session-first server path) | session_01XvJxJ5Qd12UtBy6pTypxzy |
| 4B duplex | `claude/r4-duplex` | `test-r4-duplex` (br-broad-glade-b7m5wv6a) | Brief 4B | session_01VFKukNpa5pM3LkqX4fPJam |
| 5 Asha | `claude/r4-asha` | `test-r4-asha` (br-round-bonus-b7t7hyi2) | Brief 5 | session_01Lf4yL8fEizFCiGs8P2uRxF |

Held for wave 2 (re-planned around the owner's 2026-10-10 vision, `dc-r4-owner-vision-superhuman-tutor`):
games (lanes 1A-1D become real-game engines built live from the lesson), the gamified app UI/UX, the
session-first "tuition teacher" flow. Research in `docs/research/round4/{products,games,tutor}/`.

## Keys (least privilege, `dc-r4-session-keys-least-privilege`)

No key is pasted into any prompt. Each stream's keys sit in table `_r4_session_env` on that stream's own Neon TEST
branch; the session runs `NODE_USE_ENV_PROXY=1 node scripts/r4-session-env.mjs '<branch url>'` once to write its
gitignored `.env.local`. Sets: the lesson stack (Azure OpenAI/Foundry endpoint + key, deployment names, Central
India speech, `REFRESH_DEPLOY_*` names) for every stream; plus the South India / SIN endpoints for latency and
duplex; plus `DEPLOY_CODEX` / `DEPLOY_IMAGE` for content. Test-only secrets (`TAXILA_PLAY_KEY`,
`FORGE_G2_CHILD_SALT`, `VOICESIG_SUBJECT_KEY`, `TAXILA_OPS_KEY`, `LOG_HASH_SALT`) are fresh random values, never
production's. Never given: the production `DATABASE_URL`, Azure service-principal / deploy credentials, storage
account keys, ACS keys, Neon API, AWS, Vercel, OpenRouter. After round 4: drop the tables, delete the branches,
rotate the shared Azure model and speech keys.

## v2 notes appended to wave-1 briefs

- **Stream 2:** the owner names SketchMind ("a tutor that draws while it talks") as the reference. The board inks
  one beat at a time in sync with her voice, the plan is agreed first, checkpoints check understanding, and the
  notebook is saved and can be reopened. Items (1)-(7) of Brief 2 are the foundation and stay first. Write the
  stage box contract (`docs/design/round4/build/box-contract.json`) yourself on day 0: you own the Desk.
- **Stream 4A:** the owner wants a session-first flow with no modules. She asks what happened at school today and
  what the child wants to learn, maps that to the syllabus, then teaches, continues and revises like a tuition
  teacher. The design is still being researched (`docs/research/round4/tutor/TUTOR-MODEL.md`), and the main session
  will send it. Until then, work the battery, weakest families first.
