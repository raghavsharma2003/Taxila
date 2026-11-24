# Taxila — architecture (draft v0, 2026-10-02)

Status: **draft by the main loop**, written before the research syntheses landed; it is reviewed and revised
by the design-review workflow against `docs/research/**/` and `docs/harvest/INHERITANCE-MAP.md`. Where this
file and a later `context/decisions.md` entry disagree, the decision entry wins.

> **What has changed since this draft (added 2026-11-09 by the docs audit).** This is the original design sketch. It was
> never revised into a description of the built system, and no such page exists yet (`docs/design/round7/audit/docs-memory.md`,
> DOCS-24). The ideas in §0, §1.3, §1.6 and §3 still hold. These parts no longer describe the code:
> - **Lane.** The default lesson lane is the cascade: speech to text, a reply the server writes, then text to speech.
>   The realtime voice call of §0 and §1.1 is opt-in (`mode: "voice"`, see `server/routes/lesson.js`).
> - **Director.** It is on the critical path, not off it (§1.2): the server writes every reply. The turn runs through
>   `server/brain/turn.js` and `server/director/`.
> - **Host.** The server is `server/serve.mjs` on Azure Container Apps (`taxila-web`), with a worker (`server/worker.mjs`).
>   The Vercel project is paused. The database is Neon in us-east-1, not Singapore.
> - **Classifier.** The deployment is whatever `DEPLOY_CLASSIFY` names (`server/azure.js`), not always taxila-fast.
> - **Routes.** §2 lists 9 of roughly 25 route tables; `server/index.js` is the registry.
> - **Audio.** Not stored in general, with two exceptions: trace clips for the owner cohort (`server/trace/tier.js`)
>   and the consented voice-signal pilot.

## 0. The one-paragraph system

A child talks to a teacher character over a live WebRTC voice call (Azure `gpt-realtime-2.1`). The voice
model is the teacher's *mouth and ears*, never her *judgment*: a server-side **Director** owns the lesson —
which step we are on, which probe to run, whether the last answer counts as evidence, what to show next — and
it steers the voice by rewriting the session instructions between turns. Everything the child says and does
(transcripts, taps, drags in a module) becomes **evidence** that updates an interpretable **learner model**.
Modules (games, simulations, diagrams) are drawn from a library of parameterised **engines** the Director
configures in a couple of seconds, rendered in a sandboxed frame that streams interaction events back. All
structure lives in code; the language models generate language *inside* that structure.

```
          ┌──────────────── browser / Android WebView ─────────────────┐
 child ──►│ VoiceLink (WebRTC)  ◄──audio──►  Azure gpt-realtime-2.1     │
          │   ├─ data channel: transcripts, speech events               │
          │   └─ session.update ◄── director move (from server)         │
          │ Stage: teacher avatar · captions · 4-state status          │
          │ ModuleHost: sandboxed engines / scene DSL ──events──┐      │
          └───────────────┬────────────────────────────────────┼──────┘
                          │ /api/lesson/turn  (transcripts + events, batched)
                          ▼                                     │
          ┌──── server (2026-10-02: Vercel; now Azure, see note) ──────▼──────┐
          │ Director  = lesson state machine (code)                    │
          │   ├─ Evidence classifier (taxila-fast, keyed to kit answers)│
          │   ├─ Learner model update (BKT + misconception flags)       │
          │   ├─ Move selector (probe scheduler, hint ladder, formats)  │
          │   ├─ Module planner (engine + params; scene DSL generator)  │
          │   └─ Compiler → next instructions (budget-gated)            │
          │ Safety monitor (child transcript → safeguarding protocol)   │
          │ Consolidation after lesson (memory, rel-state, report)      │
          └───────────────┬────────────────────────────────────────────┘
                          ▼
             Neon Postgres: accounts, consent, children,
             sessions, turns, evidence, skill_state, memories, …
```

## 1. Components

### 1.1 VoiceLink (client)
- WebRTC to `POST {AZURE}/openai/v1/realtime/calls` with an ephemeral key minted by `/api/realtime/token`
  (proven: SDP 201 from Chromium; media path to be proven on device).
- Session config from `context/decisions.md#voice-turn-config`: server_vad 0.6 / 900 ms / 300 ms prefix,
  `create_response: true`, `interrupt_response: true`, transcription `taxila-transcribe`, voice per character.
- The client never composes instructions; it applies the Director's `instructions` string verbatim via
  `session.update` so the prompt has exactly one assembler (`compile()`), per the inherited rejection
  `two-prompts-for-two-lanes` (Meera's voice lane got empty memory and no minor floor).
- Push-to-talk fallback (turn_detection null + commit + response.create) for noisy rooms and 6-year-olds.
- Context pruning: after each completed response the client deletes conversation items older than the last
  N turns (`conversation.item.delete`); the Director's child brief + lesson summary carry the long context.
  This is what keeps a 45-min lesson near $3.9 on 2.1 instead of $27 (`docs/research/realtime-cost-model.py`).

### 1.2 Director (server, per turn)
Runs on `/api/lesson/turn`, called by the client after each child turn (with that turn's transcript, the
teacher's last turn transcript, and debounced module events). In this draft it ran *off* the critical path: the teacher
had already started answering from her current instructions and the Director's output shaped the next turn. (On the
cascade lane, today's default, the Director's turn produces the reply itself: see the note at the top.)
1. **Classify evidence** (taxila-fast, JSON schema): map the child's utterance onto the active item's
   `answer`/`acceptable`/misconception options — a classification against a verified key, never free grading
   (inherited law: *a model never grades*). Low ASR confidence ⇒ no evidence.
2. **Update learner model** (pure code): BKT-with-forgetting per skill, misconception flags, hint-ladder
   consumption, affect-from-dialogue counters (pata-nahi loops, minimal answers), gaming discount.
3. **Choose the next move** (pure code, a state machine over the lesson plan): continue / probe (why-after-
   correct, near transfer, predict, contrast, error-spot after mastery) / hint ladder step / re-teach with a
   different representation / show module / retrieval / teach-back / break / wrap-up. Answers are withheld until
   the ladder is exhausted; after an assertion the child must solve an isomorphic item.
4. **Plan module** if the move needs one: engine id + params (T1) from the kit's `engineHints`; scene DSL (T2)
   generated by taxila-fast when no engine fits; images only from cache or pre-generated.
5. **Compile instructions** (`compile()`): character core → child brief (≤600 tok) → lesson step + item →
   the move as a *shape* → language rule → turn-shape rule LAST. Budget gate fails loudly, never truncates.
Returns `{ instructions, moduleCommands[], ui: {chips, whiteboard} }`; the client applies them.

### 1.3 Learner model
Layers: Knowledge (BKT per skill; states unseen→introduced→practising→learned-today→mastered→due), Misconceptions
(flags with evidence counts), Need (class, board, school position, exams), Format efficacy (per format × topic
type, delayed-outcome reward, Thompson with exploration floor — *gated behind DPDP opinion*, narrow mode by
default), Vibe (dialogue-observable: pace, verbosity, humour uptake, language mix), Interests (tags), Memory
(cited episodic facts), Relationship (trust rate-limited, rupture record + lapsing stance). Final spec comes
from `docs/research/learner/LEARNER-MODEL.md`.

### 1.4 ModuleHost + engines
- Engines are React/TS components compiled into the app, mounted in a sandboxed iframe
  (`sandbox="allow-scripts"`, no network) with a typed postMessage protocol: host→module
  `init/set_param/highlight/reveal/reset`, module→host `ready/interaction/answer/goal_met/stuck/error`.
- Scene DSL (T2) renderer for compositions no engine covers. Free-form generated HTML (T3) is offline-only,
  validated headlessly and human-reviewed before it can enter the library.
- Final catalogue from `docs/research/content/CONTENT-ENGINE.md`.

### 1.5 Stage
Teacher character (2D, Rive-style states: idle / listening / thinking / speaking / delighted), lip-sync from the
remote audio stream's amplitude via WebAudio analyser (render off the audio thread), live captions (child and
teacher), whiteboard strip with the current anchor (number, word, diagram) — dual coding, and the 4-state
status rule (listening · thinking · speaking · your turn) inherited from Gurukul's design law.

### 1.6 Safety
- Floor in the compiled core AND structural gates: never deny being an AI, Childline 1098 + Tele-MANAS 14416
  in the crisis line set and in the honesty allowlist, unverified age ⇒ minor gates, no exclusivity, no
  romance/companion register, no final answers to school homework without the ladder.
- The realtime lane cannot be pre-checked, so: (a) the floor is compiled into every instructions string,
  (b) the child's transcript is scanned server-side each turn for safeguarding triggers, (c) the teacher's
  transcript is post-checked and a violation forces a corrective next instruction + an incident row.
- Parent sees everything: transcripts, evidence, memories, controls, deletion.

### 1.7 Data (Neon)
Core tables: `guardian`, `child`, `consent` (versioned, per purpose), `auth_session`, `lesson`, `turn`,
`evidence`, `skill_state`, `misconception_state`, `format_trial`, `memory` (cited), `rel_state`,
`rel_event`, `module_run`, `asset_cache`, `incident`, `audit`. Audio is not stored, with the two exceptions in the
note at the top.

### 1.8 Content (static, versioned in git)
`data/curriculum/*.json` (syllabus graph), `data/kits/*.json` (verified items, misconceptions, hint ladders,
expectations), teacher character sheets, engine catalogue.

## 2. Request map (the 2026-10-02 core; the full list is `server/index.js`)
| route | does |
|---|---|
| `POST /api/auth/signup`, `/login`, `/logout` | guardian account (email + password, scrypt; httpOnly session cookie) |
| `POST /api/consent` | record versioned consent per purpose |
| `POST/PATCH/DELETE /api/children` | child profiles under a guardian (read through `GET /api/me`) |
| `POST /api/lesson/start` | pick next topic (TaRL placement + schedule), build lesson plan, initial instructions |
| `POST /api/realtime/token` | mint ephemeral key with the compiled instructions + session config |
| `POST /api/lesson/turn` | the Director step (§1.2) |
| `POST /api/lesson/end` | close lesson: consolidation, memory, rel-state, parent note |
| `GET /api/parent/overview` | dashboard data |

## 3. Non-negotiables inherited (see `docs/harvest/`)
Sentence-shaped prompt text gets recited → write shapes. Position is mechanism → the rules that must fire go
last. Truncation is silent → budget gate fails the build. One assembler for every lane. Safety by predicate,
not by instruction. Identity by authenticated child id, never device. No reasoning model on the live reply.
Writers must be called (assert row counts). Voice chosen by blind ear, not metrics.
