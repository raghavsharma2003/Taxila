# Round 7 sessions (2026-11-04)

Main loop (integration, decisions, owner contact): `session_0135KCpT8GA8E1uzNPiw2Hw3`, integration branch `int/r6`.

| Stream | Session | Branch | Notes |
|---|---|---|---|
| A Brain (teacher brain, lesson flow, conversation) | `session_01XvJxJ5Qd12UtBy6pTypxzy` | `claude/r4-conversation` (session may push only there) | was 4A |
| B Voice (hands-free duplex, ear, first-sound latency) | `session_01VFKukNpa5pM3LkqX4fPJam` | `claude/r4-duplex` (session may push only there) | was 4B |
| C1 Studio (live board, cinematic explanation, speculative build) | `session_01LJoMKWmmgGVu7ZtogXAAq5` | `claude/r4-content` (session may push only there) | was stream 2 |
| C2 Games (real games that teach) | `session_01Uk49byMD7bvaWtBrGuMPkw` | `claude/r7-games` | new |
| D Face (one grown-up Asha) | `session_01Uk49c26xwfjcNEq7a5EiFS` | `claude/r7-face` | new |
| E App (child app, lesson shell) | `session_01Uk49c2MmSpb9CU49GhQaZc` | `claude/r7-app` | new |
| F Learning (curriculum, level, Conductor, parent corner) | `session_01Uk49bzgH7EmatxJY8gd4Bz` | `claude/r7-learning` | new |
| G Platform (release, staging, cost, India hot path) | `session_01DQV1RuwHDvZdoVJ8PpbsyJ` | `claude/r4-latency` (session may push only there) | was stream 3 |

Send cross-stream patches with the Claude Code Remote `send_message` tool to the owner's session id above.

Re-used sessions can push only to their original branch, so their round-7 work lands there (main pulls from those). New sessions report their branch in their first message.
Patches: `docs/patches/to-<owner>/NNN-<slug>.patch` (PIPELINE.md §O).
