# 024 — say the play "why" line aloud in a lesson (written ask)

From: Games (C2), 2026-11-10 — round 8 Play H (main's decision: the child's "why this game" line).

**What exists (ours, claude/r8-play-follow).** At the start of a level whose because is a mix-up focus, a step up, a step
down or a family switch, the play server returns `why: { text, speak, reason }` (server/play/why.js; ≤ 64 characters, code
only, never a grade). The play surface shows it above the goal. `speak` is true the first time a reason appears in a play
session. The client (src/play/PlaySession.tsx) listens to the lesson runtime's `taxila:teacher-speaking` event and, when
`speak` is true and the teacher is NOT speaking, calls its host's `onSay(text, reason)`, else raises the window event
`taxila:play-say` (`PLAY_SAY`, detail `{ text, reason }`). Inside a lesson nobody listens yet, so today the line is shown
and never spoken. At home there is no voice on the play path either.

**The ask (the teacher's voice is yours).** When a `taxila:play-say` arrives while the floor is free (no teacher turn
playing, no child turn open), have the lesson's teacher say that line in her voice, once. The line is server-authored
(the play session token can prove it: `POST /api/play/level { sessionId }` returns the same `why` from the signed body), so
a speak path can take the play session token instead of client text (no speech proxy). If a teacher turn starts while it
is being said, drop it (no two voices). Nothing about the grade or the level depends on it.

**Why not a code patch.** Play can tell whether the teacher is speaking (the runtime's own event), but play has no voice:
the only TTS path (`/api/tts`) speaks stored teacher turns by design, and the voice lane (src/lesson/**) is not ours.
