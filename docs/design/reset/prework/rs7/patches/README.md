# RS-7 integration patches: the Devanagari step and the voice switch

These were generated with `diff -u` against the tree as it stood on 2026-10-05 (Wave 2 was still in flight). Patches 03 and 04 were regenerated after Wave 2 added `laneSwitched` (W2-D fixer). The switch respects it: a lesson that moved realtime → cascade keeps the character's realtime voice, and the switch does not apply. Apply them
from the repo root with `patch -p1 < <file>`, in order, after Wave 2 has merged.

**Verified:** all four applied cleanly to a scratch copy of `server/`. With them applied, the voice suites passed 390/390,
the same as the unpatched baseline (re-run after the regeneration):
- `spoken`;
- `voice-cascade*`;
- `voice-expressive-*`;
- `voice-latency`;
- `w2d-voice-lanes`;
- `voice-translit`.

A smoke run of the patched `styleForChild` + `plainParts` covered four settings:

| env | engine / voice | document |
|---|---|---|
| (unset) | dhd, DragonHD | byte-identical to today |
| `TAXILA_VOICE_DEVANAGARI=1` | dhd | Hindi runs in Devanagari inside `<lang hi-IN>` |
| `TAXILA_TEACHER_VOICE=priya` + `TAXILA_ALLOW_PREVIEW_VOICE=1` | dhd engine, `hi-IN-Priya:MAI-Voice-2.1` | the MAI document, with no prosody |
| `TAXILA_TEACHER_VOICE=marin` | oai `marin` | the text path |

| # | file | applies to | what it does |
|---|---|---|---|
| 01 | `01-dhd-spokenrun.patch` | `server/voice/expressive/compile/dhd.js` | `spokenRun(text, spoken, register)` runs `toDevanagari` after `speakable()` when `spoken.devanagari` is set. The safety predicate runs on the **written** text and the register. `compileDhd` passes the register through. `plainSsml` and `compileDhd` hand off to `compileMai` when `v.compiler === "mai"` (Priya). That gives one entry point for dhd, mai and omni documents. |
| 02 | `02-speech-ttsinput.patch` | `server/voice/speech.js` | `ttsInput` applies the same step for the gpt-4o-mini-tts lane when the style's spoken cell asks for it. It takes effect only when the voice switch selects marin and the flag is on: the step lifted marin's number words from 91.0% to 97.6% (REPORT). |
| 03 | `03-routes-voice-switch.patch` | `server/routes/voice.js` `styleForChild` | `TAXILA_TEACHER_VOICE` → `styleFor(choice, base)`. When it is unset, today's path runs, plus `spoken.devanagari` for every en-IN DragonHD voice when `TAXILA_VOICE_DEVANAGARI=1`. The style `version` changes with the step, so cached audio is never replayed across the change. |
| 04 | `04-routes-tts-switch.patch` | `server/routes/tts.js` (text lane "Hear") | The same switch and step on the mp3 path, so the streamed voice and "Hear" stay one identity. |

**Not patched, on purpose:**
- `server/voice/voices.js` is untouched, and the production default voice does not change. The new switch lives in the new
  file `server/voice/voice-switch.js`, because `voices.js` already exists and Wave 2 owns it in flight.
- `server/voice/expressive/compile/omni.js` already calls `spokenRun`, so it picks up patch 01 without its own patch.
- `server/routes/child.js` `skillLineSaid` (a gpt-4o-mini-tts line) is left as is. Follow-up: route it through `spokenText()` from `voice-switch.js`.

**Turning it on:** set `TAXILA_VOICE_DEVANAGARI=1` in the Container App secrets/env. It is the plan's `voice.devanagari`
flag and is off by default.
- To roll back, unset it. The cache keys differ (the `:dv` version suffix), so nothing stale is replayed.
- When it lands, re-measure the -35% base rate with `evals/tts-pace.mjs` on Devanagari input. This is the reversal
  condition of `w2g-base-rate-minus-35`. The 40-line render showed total duration −1.5%, which is a screen, not a pace
  measurement.

**The owner's voice pick is a config flip:** `TAXILA_TEACHER_VOICE=diya|priya|marin`.
- Priya also needs `TAXILA_ALLOW_PREVIEW_VOICE=1`, because of `voice-ga-only-for-minors`. Without it the flip is refused
  and logged, and the legacy voice speaks.
- Unset means today's behaviour exactly.

**Review rs7 (2026-10-05) changes:**
- Patch 01: when `compileDhd` hands a **safety-register** plan to `compileMai` (Priya), it now passes `devanagari: false`, because
  `compileMai` (existing `mai.js`) calls `spokenRun` without the register. Before this, a safety clause with no helpline number
  or identity words was converted on Priya. Diya was already protected. All four patches re-applied cleanly. With them applied,
  the voice suites passed 392/392, including 2 new translit tests.
- `translit/index.js`: (a) "ek saath" / "do saath" ("together") is no longer turned into एक साठ ("one sixty"). (b) A sentence
  naming AI / robot / insaan is left untouched, per sentence, because the shared IDENTITY regex missed "Nahi, main AI teacher hoon".
  The test split still scores 97.8% word accuracy and 344/345 number words.
- `evals/translit/renders/` measured 141 MB (326 WAV files), not the 103 MB the build report gave. That is still under the 200 MB cap.
  Delete it before any commit.
