# Release 12: the flight recorder (full session tracking)

Main session, 2026-10-11 14:15 UTC. This brief is shared by four streams: T-server (stream 3), T-client (stream 2),
T-voice (4B) and RCA (4A).

## Why: the owner, 2026-10-11 ~14:10 UTC, verbatim (abridged only where marked)

> "whatever is happening in the app, we have the track record of that, right? What the teacher is showing in the UI,
> in the front end, and the whole communication and everything is basically logged so that ... whatever interaction or
> testing I do in the site is basically highly recorded and so that I can just point it out to you and you basically can
> check the logs and the data to verify and understand what exactly went wrong there. ... literally saving everything
> from every element of front end, what was shown to the user, from the front end, what was loaded, what was not loaded,
> what were getting into the back end, what was the user saying, what was communicated to the user by the teacher, what
> happened there. Everything, literally everything. ... you need to exactly find all the things around this and make a
> system that tracks all the things. ... I'm explicitly saying the full tracking, what is being shown to me, what's
> happening in the back end, everything, what I'm doing, what the teacher is doing, and what I'm receiving and what I'm
> giving. Everything has to be recorded in extreme detail. So by yourself also, you can later audit it ... you should
> have all the access of this tracking and data so that you can by yourself take actions and understand the data."
>
> The same message also says: "I think we have not even started building this app ... I will rate it 1 out of 100 right
> now."

## What the database already told us, and what it could not

Main read the owner's two lessons today, read-only, from the production tables `turn`, `brain_trace`, `studio_mount`
and `board_page`:

- lesson `a95d2ff1-0d79-4d4c-8f32-dd255c2236e1`, 13:47-13:52 UTC, c9-maths-ch08-t01;
- lesson `b08fe8a7-a827-4c50-837f-de51da5cfe1b`, 14:06 UTC, still open.

The full dump is in RCA's message.

**The data can show these failures:**

1. **The same board, again and again.** 8 of the 10 board pages in a95d2ff1 open with the same "Recursive rule |
   Explicit rule" table. All three mounts are `whiteboard`, all on skill `c9-maths-ch08-t01-s1`. This held whatever
   the child asked for: games, a picture, aloo (potato), a different subject.
2. **She narrates things that aren't on screen.**
   - "Screen par game: left Recursive, right Explicit" while no game was mounted.
   - "screen par aloo dekho" twice while the board showed the maths table again.
   - Only then: "main is screen par nayi image nahi dikha sakti".
3. **No off-topic visual exists.** Nothing can draw a potato in a maths lesson. She offered "picture, story, quiz",
   the child chose picture, and nothing appeared.
4. **A misheard request.** ASR heard "recording rules" for "recursive rules". She answered "background noise main
   control nahi kar sakti" to a request to clear the board.
5. **Odd guard replies.** "Ab 10 ke baad number bolo." came after the child gave 7 and 16 in one long turn.
6. **Silent fallbacks.** `studio.rung_replaced` and `turn.speculation_miss` sit on nearly every trace row, and nothing
   says what was replaced, by what, or why.

**What the data cannot show:**

- what the phone actually displayed. The owner says new drawings were drawn over the previous content; the database
  holds only the scripts;
- whether an image loaded or failed;
- what audio played, and whether it was cut off;
- the ASR alternatives and the raw mic audio;
- the mic mode (tap-to-talk vs hands-free) and why;
- the model prompts and raw outputs;
- why the Studio rung was replaced;
- network failures and client errors;
- what the child tapped.

## The decision: `dc-r12-flight-recorder`

Every session is recorded end to end, client and server, in one time-ordered stream that main can query, replay and
audit without asking the owner anything. The owner can point at a moment. Two tiers, because of a public promise we
keep:

- **Tier 1, every account, always on.** Structured events from client and server (below). No audio. The promise
  "Audio of your child's voice is never stored" (landing FAQ, /privacy, promises.ts) stays true word for word.
- **Tier 2, owner cohort only** (`TAXILA_TRACE_FULL_FOR`, guardian email or sha256; the same pattern as
  TAXILA_UI_KAKSHA). Everything in tier 1, plus:
  - a DOM replay (rrweb, with canvas sampled for games and the board);
  - raw mic audio and the TTS audio she played;
  - the full model prompts and raw responses.

  A visible **REC** chip sits in the lesson header whenever tier 2 is on, so nobody is recorded without seeing it.

Reverse if:

- the owner wants tier 2 for everyone. That needs the public promise rewritten first, never quietly;
- tier 1 measurably slows a turn (budget below);
- storage cost grows past what the evidence is worth.

## The contract (all streams build to this; T-server owns `shared/trace.ts`)

```ts
// shared/trace.ts  (v1)
export interface TraceEvent {
  v: 1;
  sid: string;        // trace session: the lesson id inside a lesson, else a per-page-load uuid (pid) until a lesson starts
  pid?: string;       // per page-load id (client), so pre-lesson screens join the lesson that follows
  cid?: string;       // child id (server fills from auth; client never trusted for it)
  gid?: string;       // guardian id (server fills)
  src: "client" | "server" | "worker";
  seq: number;        // per (src, pid|process) monotonic
  t: number;          // epoch ms (server clock for server events; client clock + measured skew for client events)
  mono?: number;      // client performance.now(), for ordering inside a page
  kind: string;       // dot-namespaced, see the kind list
  turn?: number;      // lesson turn seq when known
  rid?: string;       // request id: client sets header X-Taxila-Rid on every /api call; server echoes it on srv.* events
  tier: 1 | 2;
  data: Record<string, unknown>;   // <= 8 KB serialized; larger goes to a blob, with data.blob = { ref, bytes, type }
}
```

**Kinds (minimum set; add more freely, never rename):**

- **client (T-client):**
  - pages and taps: `ui.route` (path, params), `ui.tap` (role, label, test id, never coordinates inside text inputs),
    `ui.render.stage` (what the stage shows: artifact kind, mount id, board page seq, the ops count drawn, whether the
    previous page was CLEARED or overlaid), `ui.render.card` (question text shown), `ui.chips` (chips shown, chip
    chosen), `ui.state` (Desk state changes: your_turn, speaking, listening, work-*);
  - images and media: `ui.image.load` and `ui.image.error` (src, ms, size), `ui.media` (video/game frame mounted,
    failed);
  - network: `net.req`, `net.res` and `net.err` (method, path, rid, status, ms, bytes; bodies for /api in tier 1,
    secrets masked); `net.sse` (stream events);
  - errors and performance: `err.js` and `err.promise` (message, stack, top frame); `perf.*` (LCP, long tasks over
    200 ms, memory if exposed); `dev.info` (UA, viewport, DPR, connection, build sha, look);
  - flags and tier 2: `flag.owner` (the owner's flag, with note); `rrweb.chunk` (tier 2, blob); `audio.mic.chunk` and
    `audio.tts.clip` (tier 2, blob).
- **voice (T-voice):**
  - `mic.mode` (tap | duplex, and WHY: no headphones, a flag, permission, device); `mic.state` (open, closed, denied,
    error); `vad.start` and `vad.end`;
  - `asr.partial` and `asr.final` (text, alternatives, confidence, language, ms from end of speech);
  - `tts.request`, `tts.start`, `tts.end`, `tts.interrupt` and `tts.error` (text, voice, ms); `bargein`.
- **server (T-server):**
  - requests: `srv.req` and `srv.res` (route, rid, status, ms, request and response bodies as JSON with secrets
    masked);
  - model calls: `model.call` (lane, model and deployment, prompt id, prompt sha, input and output tokens, ms, output
    text; full prompt and raw response as a tier-2 blob);
  - teaching decisions: `director.turn` (the move, beat, item, legal mode and the ACCEPTED/REJECTED proposals with
    reasons). Wherever today's code writes `studio.rung_replaced` or `turn.speculation_miss`, record what was
    replaced, by what, and why;
  - content: `studio.slot.*` (open, plan, build, qa, filled, failed with reason, timeout); `board.page` (the script
    sent, and what it clears or overlays); `forge.job.*`; `play.*` (game mount and outcome);
  - checks and saves: `safety.*` (scan result, never the matched text beyond what the floor already logs);
    `classify.*` (the verdict and its source); `db.write` summaries for turn/lesson rows.

**Transport:**

- The client batches every 2 s, and at `pagehide` via `navigator.sendBeacon`, to `POST /api/trace/batch`.
  - Auth is the session cookie; anonymous public pages are allowed with pid only.
  - Each batch is at most 256 KB. Rate limited.
  - Blobs go to `POST /api/trace/blob`, which streams to Azure Blob Storage (the existing storage account, a new
    container `trace`). Their path is `{yyyy-mm-dd}/{sid}/{src}-{seq}.{ext}`.
- Server events go through one async buffered writer. It never awaits on the turn path, drops with a counter when
  the DB is slow, and records the drop counter itself as `trace.dropped`.

**Storage:**

- Migration `029_trace.sql`:
  - `trace_event(id bigserial, sid text, pid text, cid uuid, gid uuid, src text, seq int, t timestamptz, kind text,
    turn int, rid text, tier smallint, data jsonb)`;
  - indexes on (sid, t), (cid, t), (kind, t) and rid;
  - `trace_flag` as a view or table for `flag.owner`.
- Retention: tier 1 for 30 days, tier 2 for 90 days, enforced by the existing nightly job.
- Deleting a child or a guardian (the parent corner's Data page) deletes their trace rows and blobs too. Test it.

**Budgets (gate-tested):**

- The recorder adds at most 10 ms server time to a turn (p95).
- The client spends at most 2% main-thread time in tier 1. Tier 2 rrweb is allowed more, but the board and the game
  must keep ≥ 50 fps on the dev harness.
- Batches under 256 KB.
- The recorder NEVER changes behaviour and never throws into a lesson. Everything is wrapped and fire-and-forget,
  and a broken recorder must leave the lesson identical (test it).

**Masking (gate-tested):**

- Never record: password, PIN, email or phone inputs; the auth cookie; the Authorization header; any key.
- Outside tier 2 there is no audio at all.

## Access for main (and for the owner pointing)

`scripts/trace.mjs`. Main runs it with production read access; streams run it against TEST only.

- `--recent [--guardian <email|hash>] [--child <id-prefix>]` lists recent sessions: when, child, topic, turns,
  errors, flags.
- `--session <lesson-id|child-prefix|pid> [--from hh:mm --to hh:mm]` prints ONE merged timeline in time order:
  - what the child said or tapped (transcript, alternatives, confidence);
  - what she said (text, and whether it played fully);
  - what the screen showed (stage kind, mount, board page, image load/fail, whether it was cleared or overlaid);
  - every server decision with its reasons;
  - every model call, with a pointer to its prompt;
  - every error and failure.

  Flags are marked ★. `--json` exports the same.
- `--replay <session> --at <hh:mm:ss>[,...] [--out dir]` (tier 2) renders the rrweb recording in headless Chromium.
  It writes a PNG of exactly what was on the screen at each time, plus the audio clip around it when present.
- `--flags [--since]` lists the owner's flags with links into the timeline.

**The owner's flag:** in the lesson's "…" menu (tier 2 accounts only, for now), **Flag this moment**. One tap stamps
the moment; an optional typed or spoken note follows. The owner can then just say "my flag at 7:37" and main finds it.

## Streams

| stream | session | owns | files |
|---|---|---|---|
| T-server | stream 3 (latency) | `shared/trace.ts`; migration 029; `/api/trace/batch` and `/api/trace/blob`; the server writer; instrumentation at the CHOKE POINTS (the router, the one model-call wrapper / compile(), the Studio/board/forge/job lifecycle, director decisions with the replaced-rung details, safety and classify outcomes); retention; delete cascade; `scripts/trace.mjs` (timeline, recent, flags, json); TAXILA_TRACE_FULL_FOR | `shared/trace.ts`, `server/trace/**` (new), the minimal hooks in `server/**` choke points, `db/migrations/029_trace.sql`, `scripts/trace.mjs`, tests |
| T-client | stream 2 (live content) | `src/trace/**` (new): the event bus and batcher, the fetch/EventSource/WebSocket wrappers (X-Taxila-Rid), error, perf and dev-info hooks, image and media hooks, stage/board/card/chips/Desk-state instrumentation, the REC chip, the Flag button; tier 2 rrweb (record, with canvas sampling), audio capture plumbing (with T-voice); the `--replay` renderer used by `scripts/trace.mjs` | `src/trace/**`, the minimal hooks in `src/child/lesson/**`, `src/ui-v3/kaksha/lesson/**` and stage components, `scripts/trace-replay.mjs`, tests |
| T-voice | 4B (duplex) | mic, VAD, ASR, TTS, barge-in and duplex-mode events WITH reasons (the owner had to tap the mic: why); tier 2 mic and TTS audio clips (MediaRecorder on the existing mic stream, the played TTS buffers) | `src/duplex/**`, `src/voice/**`, `src/voicesig/**`, server voice routes' hooks, tests |
| RCA | 4A (conversation) | root cause of each failure 1-6 above in the owner's two lessons. Reproduce on TEST, find the exact code path (for example why the whiteboard keeps re-deriving skill s1's comparison table; why she claims a picture or game that isn't mounted, where audit #9's honesty guard should have fired and didn't; why "different subject" + "picture" produced nothing), and write the fix plan with tests. NO deploy and no change to shipped behaviour in this release. Fix patches go on your branch for release 13 | `docs/design/round4/build/r12/rca/**`, patches as files, tests that reproduce |

## Rules

1. **Presentation and behaviour are unchanged by the recorder.** The only visible additions are the REC chip and the
   Flag button, both tier 2 only.
2. **No safety-file edits.** safety.js, floor.js and safetyStrings.ts are untouched. Safety events are recorded by
   wrapping their call sites.
3. **Branches and patches.** Start from base `claude/blissful-mayer-icwe2j` at the sha main gives you, on your own
   branch, and push often. Anything outside your files goes as a patch in
   `docs/design/round4/build/r12/<stream>/patches/`.
4. **Evidence.** Put it in `docs/design/round4/build/r12/<stream>/`.
   - T-server and T-client together: a scripted lesson on TEST against a packaged production build. Then
     `scripts/trace.mjs --session` prints the full merged timeline, and `--replay --at` produces a PNG that matches a
     Playwright screenshot taken at that moment.
   - Gates: `npx tsc -b && npx vite build && npm test`, plus your targeted tests and the budget measurements.
5. **Context.** Add `context/inbox/r12-<stream>.json`.
6. **Never** deploy, touch the production database, or call a paid or third-party API. rrweb (MIT, self-hosted in the
   bundle) is allowed; no external SaaS recorder.
7. **Time.** Push a first complete pass by **17:00 UTC**, then message main. Main integrates, gates and ships release
   12 tonight. The worker (job lifecycle hooks) deploys after the 16:00 UTC freeze ends.
