# Duplex → face bridge (p1-duplex ↔ p2-face interface)

2026-10-06 · p1-duplex · status: **agreed by code**: the seam is the face stream's existing
`src/face-puppet/duplexBridge.ts` (owned by p2-face). p1-duplex calls only the two exports below and never edits that file.

## The two calls duplex makes

| call | where duplex makes it | what it means |
|---|---|---|
| `withPuppet(emit)` | `src/lesson/uiBridge.ts` (patch 05) passes `duplexFace: { wrapEmit: withPuppet, detach: puppetDuplexDetach }` to the cascade link → `src/duplex/cascadeDuplex.ts` → `DuplexLive({ wrapEmit })` → `new EngineHost({ emit: wrapEmit(emit) })` | every host command passes through `puppetDuplexSink` first, unchanged |
| `puppetDuplexDetach()` | `DuplexLive.stop()` (lesson closed, link closed, or the engine fell back to today's path) | the floor state and the mic-level Listener own the floor faces and nods again |

There is one host per cascade link, so one producer of floor faces and nods at a time. Shadow mode wraps the emit
too: shadow computes and logs, so the face gets the same listening cues. The voice is never actuated in shadow.

## What reaches the face (the shapes `duplexBridge.ts` reads; `src/duplex/host.ts HostCommand`)

| host command | when | face meaning (duplexBridge.ts) |
|---|---|---|
| `{ to: "face", t, cue: { kind: "pose", pose, why } }` | each governed phase change (`phasePose`) and each REACT (`listen_lean`, `hold_pose`, `checkin_look`, `still_with_you`, `calm_attend`, `your_turn`) | the floor face. The **first pose attaches the engine**: the mic-level Listener stops nodding |
| `{ to: "face", t, cue: { kind: "nod", peakDeg: 4 } }` | a BACKCHANNEL nod at a backchannel opportunity (BOP: a 200-500 ms falling dip after ≥ 1.5 s of child speech) | one continuer nod. Never while she speaks, never in a safety turn, at most one every 3 s (`driver.ts`), and **content-blind** |
| `{ to: "face", t, cue: { kind: "clip", clip } }` | never in a lesson today (`audioBackchannel: false`, `lexicalBackchannel: false`) | nothing. The face never invents a mouth for a sound it was not given |
| `{ to: "voice", op: "yield", t, … }` | barge-in, stop or repeat request, the child's answer over her question, revoke, safety | `cut`: her mouth closes now |
| `{ to: "safety", op: "attend", t }` and `{ to: "floor", phase: "safety_attend" }` | the sticky partial-safety predicate tripped | the calm_steady pose (policy.ts R6) |

## Guarantees from the duplex side

- **Content-blind.** No cue carries words, the transcript, the uptake or correctness. `puppetDuplexSink` reads none of
  them. No cue is keyed to a verdict (`duplex-verdict-blind-timing`).
- **No emotion is inferred or named** (Microsoft Code of Conduct restriction 12). Poses are floor states: listening,
  holding, thinking, your turn, calm. They are never an affect reading of the child's voice.
- **Clock.** `t` and `at` are the host clock: epoch ms, the clock of the shared mic tap (`src/voicesig/lessonTap.ts
  epochClock`). The face does not schedule against them today. If it ever does, it must convert them first, because
  `performance.now()` is a different clock.
- **Failure.** A throw inside the sink is swallowed there. A duplex fault calls `puppetDuplexDetach()` on the way to
  today's path, so the face never freezes without nods.

## Known gap: not built, owned by p2-face if wanted

- **The hush.** When the child talks over her, her gain drops to 0.05 (≈ −26 dB) as `{ to: "voice", op: "duck",
  level: 0.05 }`. The engine then decides between "keep talking" (a continuer) and "yield".
  - `duplexBridge.ts` does not forward `duck`, so her mouth keeps its full viseme motion while her voice is hushed.
  - Nothing breaks. She looks as if she is talking softly, for at most ~1 s, before a yield closes the mouth.
  - If p2-face wants a smaller mouth during a hush: forward `duck` with `level ≤ 0.1` as a new bus event in
    `duplexBridge.ts`. Duplex already emits it, so duplex needs no change.
