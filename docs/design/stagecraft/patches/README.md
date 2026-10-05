# Stagecraft patches to existing files

2026-10-05. Stagecraft itself lives only in new paths (`server/stagecraft/**`, `src/stagecraft/**`,
`shared/stagecraft.ts`, `evals/stagecraft/**`, `tests/stagecraft*.test.mjs`). Everything that must touch a file another
workstream owns is here, as a unified diff generated against the tree of 2026-10-05 07:00 UTC. Every `.patch` passed
`git apply --check` on that tree, singly and as the seam stack (P3 + P3b + P5). Wave 2 is being integrated right now,
so re-run the check before applying.

```
git apply --check docs/design/stagecraft/patches/<name>.patch && git apply docs/design/stagecraft/patches/<name>.patch
```

**Flag.** Every patch is inert until a lesson attaches a host (`server/stagecraft/seam-bridge.js attach`), and the host
reads `STAGECRAFT = off | shadow | on` (default `off`). With no host, every added call is a no-op and W2 behaviour is
byte-identical, except P5, which is a plain constant change.

**Order.** P9 → P10 (client types and renderer), P6/P8 (azure), P1 (duplex), P3 + P3b + P5 (seam), P4 (turn), then
the two snippet patches P2 and P7. Run `npx tsc -b && npx vite build && npm test` after each group.

| # | file (owner) | what | apply note |
|---|---|---|---|
| P1 | `server/duplex/buildIntent.js` (duplex) | the `onSafety` hook opens the Stagecraft quarantine; with `stagecraft: true`, `drainAtPhase` returns [] because the reveal policy owns the stage | Nominations need no patch: `BuildIntents` already takes `launch`, and `adapters.buildIntentLauncher` returns null, so nothing reaches `RevealQueue` |
| P2 | `src/duplex/host.ts` + `server/duplex/routes.js` (duplex) | mirror each governed `FloorPhase` change to the server (snippet below) | A few bytes per phase change, not per tick |
| P3 | `server/studio/seam.js` (W2-H) | imports the bridge. `statusFacts` calls `augmentView`. `slotOf` routes Stagecraft pieces to `stagecraftSlot`. `slotFor` skips `beatsFor` gating for Stagecraft pieces, because the reveal policy's want already admitted the kind for the beat. `onReveal` and `retirePiece` notify the host | Keeps the seam contract: synchronous, in memory, never throws (the bridge catches) |
| P3b | `server/studio/seam.js` (W2-H) | the two early returns in `statusFacts` (piece on screen; first-reveal or spacing) also pass through `augmentView` | Without it, Stagecraft is asked only on turns W2 itself would reveal on. That is beat-only again, which defeats item 17 |
| P4 | `server/brain/turn.js` (W2-E) | builds the `RevealPoint` with `kernel-point.js stagecraftPointFor` before `statusFacts` and passes it as `hint.stagecraftPoint` | **W2-E must confirm the field mapping in `kernel-point.js`** (beat, topic, skill, the misconception from the ledger, the signal frame). The kernel never reads the portfolio (lossless rule) |
| P5 | `server/studio/seam.js` `STUDIO_LIMITS` | `turnsBetweenReveals` 4 → 2 | Frequency (owner item 14). In the simulator, Stagecraft's own policy uses 2 |
| P6 | `server/azure.js` | `DEPLOY.stagecraftSpec` (`DEPLOY_STAGECRAFT_SPEC`, default `taxila-fast-bg`) | Owner action O-1 creates `taxila-stagecraft`. Until then: `taxila-fast-bg`, the reply's background twin with its own quota. **Not `taxila-gpt6-luna`**: that deployment carries the live whiteboard (`w2f-luna-reserved-for-whiteboard`) |
| P8 | `server/azure.js` `post()` | forwards a caller `AbortSignal` | Stagecraft cancels a build when its candidate is invalidated. Today `chat()` cannot be cancelled, so a cancelled spec's tokens are still billed (the simulator charges them as waste) |
| P9 | `shared/studio.ts` (W2-H) | `StudioArtifact` gains `{ kind: "stagecraft" }` | Needed by P10 |
| P10 | `src/studio/renderers.ts` (W2-H) | registers `src/stagecraft/StagecraftRenderer.tsx` for `stagecraft` | Mounts through `StageController` → the Studio v2 host. The stage is never empty and never shows a loading state |
| P7 | `src/lesson/ttsStream.ts` (S14) | clause events → `src/stagecraft/reveal.ts CueScheduler` (snippet below) | The clause sink exists already (`ClauseSink`, `w2g-clause-events-on-player-clock`) |

## P2: phase mirror (snippet; the diff depends on W2-H's lesson wiring of `DuplexHost`)

```ts
// src/duplex/host.ts, where the governor's phase change is emitted (around `if (e.kind === "phase")`):
if (e.kind === "phase") {
  this.o.emit({ to: "floor", t: e.at, phase: e.to, floor: shippedFloor(e.to) });
  this.o.emit({ to: "server", path: "/api/duplex/phase", body: { phase: e.to, turnSeq: this.governor.turnSeq, t: e.at } });   // STAGECRAFT P2
}
```
```js
// server/duplex/routes.js, one more route next to the slice routes:
"POST /api/duplex/phase": async (req) => {
  const { lessonId } = await deps.authorize(req, req.body?.lessonId);
  deps.stagecraftHostFor?.(lessonId)?.input({ t: "phase", phase: String(req.body?.phase ?? ""), turnSeq: Number(req.body?.turnSeq) || 0, at: Date.now() });
  return { ok: true };
},
```

## P7: clause events to the cue scheduler (snippet)

```ts
// where the lesson creates its PcmStreamPlayer / ClauseSink for a reply:
const cue = new CueScheduler<StageItem>((item) => stageController.reveal(item));    // src/stagecraft/reveal.ts
sink = { clause: (ev) => { if (ev.clause === 0 && ev.part === 0) cue.lineStarted(ev.playAt ?? performance.now()); cue.clauseOnset(ev.clause, ev.atMs); } };
// when the turn's UiDirectives.studioSlot is a stagecraft artifact:
cue.arm(slot.artifact.stagecraft.cue, itemFromSlot(slot));
// on the duplex floor events: cue.childFloor(phase === "child_turn" || phase === "overlap");
// on every animation frame: cue.tick(performance.now());
```

## Context write-ups (for the main loop; `context/*.md` are existing files)

The proposed entries are in `context/inbox/stagecraft.json`. The prose for `context/decisions.md`,
`context/measurements.md` and `context/rejected.md` is in `CONTEXT-WRITEUP.md`, next to this file, ready to append.
