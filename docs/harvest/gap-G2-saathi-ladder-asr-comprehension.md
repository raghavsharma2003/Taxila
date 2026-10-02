# Gap G2: Saathi ladder, deterministic misconception extraction, learner ASR, sound-alikes, homework photo

Harvest gap-fill, 2026-10-02. Source: `ai2bharat` `origin/main` @ `a11c521`. Every citation below is
`path@ai2b@main` (with line numbers where they matter). The source repo was used read-only: `git show` /
`git ls-tree` / `git archive` against the ref, with no checkout, commit or push. **No secrets were read.** `asr.ts`
reads `SARVAM_API_KEY_POOL` / `SARVAM_API_KEY` from env, and no value exists in the tree. I opened no `.env`.

**Why this gap existed.** `ai2bharat-core.md` lists these files (AIC06, 08, 13-15, 17, 21-22, 27-29). The
INHERITANCE-MAP gives only `ladder.ts`/`glossary-first.ts` a single combined row (§2.13 L486), and `extract.ts`
appears only for its memory kinds (§2.7 L359). The map has no row for `asr.ts`, `asr-handler.ts`, `sound-alikes.ts`,
`moments.ts`, `bubbles.ts`, `register-predicates.ts`, `signal.ts` or `rank.ts`. The map also says (L190, L500) that a
covert comprehension detector "exists nowhere". This report reads the code, runs the parts that bear on
comprehension, and corrects that statement.

**What was executed.** I extracted `lib/` and `evals/indic-benchmark/lib` via `git archive origin/main` into the
session scratchpad. I ran the real `extractMemoryCandidates`, `classifyIntent` and `matchedSoundAlikes`/`soundAlikeRow`
under `node --experimental-strip-types` (Node 22.22) on hand-written probes (results in §3). I did not run the test
suites. Test names and assertions were read from source.

---

## 1. TL;DR

1. **The ladder plus misconception extraction is not a comprehension detector.** It is a *self-reported-struggle
   recorder* bolted onto **overt** checks. Each lesson ends in MCQ checks (`conceptCheck`, `practice`, `transferCheck`,
   `rubricChecks`). The ladder fires only when the learner **asks** for help on a live check: "hint", "stuck",
   "confused", "samajh nahi" (`lib/saathi/stage-gate.ts@ai2b@main` L118-123, L183). Saathi never learns whether the
   learner's answer was right or wrong. A model never sees correctness, and no rule reads it.
2. **Its signals are two counts and one regex capture.** (a) Rung-1 entries on this module ≥2 → `weak-topic`. (b) The
   same glossary term looked up ≥2 times → `term-asked`. (c) The learner's own words that match one of four
   `misconceptionShapes` on a non-`allow` turn → `misconception` (`memory/extract.ts@ai2b@main` L113-118, L148-197).
   Nothing compares the captured "misconception" with an answer key. It is stored whether the belief is right or
   wrong.
3. **The extractor is weaker than the map implies, and has three concrete defects** (all reproduced by running the
   code, §3):
   - The rule says "a misconception is read only on a ladder turn". The code reads `decision !== "allow"`, so
     **blocked turns count too**. "give me the answer, matlab sach mein bata do" is stored as misconception
     `"sach mein bata do"`.
   - `X ka matlab Y hai` keeps **only X**, because `firstCapture` returns group 1. The wrong meaning (Y), which is the
     whole misconception, is discarded. "photosynthesis ka matlab khana banana hai" → misconception
     `"photosynthesis"`.
   - Any attempt is stored as a misconception. "I think the answer is B" → `"the answer is B"`, even when B is
     correct.
4. **Taxila is already past this.** `server/director/classify.js` maps each utterance onto the active kit item's
   **key and named misconception options**. It has an ASR-confidence gate (`ASR_MIN 0.5`), a lexical don't-know path
   (`server/learner/affect.js` `DONT_KNOW`), teach-back scoring (`TEACHBACK_PASS 0.6`) and "a model never grades". That
   is a keyed misconception classifier. Saathi's is an unkeyed phrase catcher. **Decision: idea-only for the
   comprehension question.** Copy three narrow rules: the closed-source union, the fail-don't-trim word cap and
   rung-1-only entry counting. Do not port the extractor's misconception shapes.
5. **Learner ASR (`asr.ts`, `asr-handler.ts`) is Sarvam Saarika, so it is barred as code** (Azure-only). The value is
   the decisions and the failure taxonomy. The transcript is a draft that is never auto-sent (D-059). There is never a
   dead mic (D-060). Failures are named: `no-key`, `pool-exhausted`, `size`, `empty` and others. Audio is never
   persisted. The "32-52% CER on code-switched Hinglish" figure is **stated with no n** in this repo
   (`context/registry.json` D-059). Treat it as unmeasured.
6. **`sound-alikes.ts` is not Hindi sound-alike correction.** It is a 12-row table of *English AI-evaluation
   jargon* (rubric, pairwise, calibration…) and how a Hindi-tuned ASR mishears it. It never rewrites the transcript.
   It adds one `heard-by-voice: x->y` TAIL row for the model, and only on voice turns. The *shape* is right for Taxila:
   pull-only, after transcription, never in the STT prompt. Taxila independently measured that a term list in the
   gpt-4o-transcribe prompt hallucinates lesson content from near-silence (`server/voice/stt.js` L26-31). The
   *matcher* is a substring `includes` and must not be copied. "rational number kya hai" → `rational->rationale`, a
   false correction for a class-8 maths child.
7. **`photo.ts` is copy-grade.** It is pure, imports only the contract, validates base64 length without decoding, plans
   a re-encode that never upscales, and strips EXIF by canvas re-encode. The handler's
   *photo-on-a-checked-step → ladder, never the model* rule (`handler.ts@ai2b@main` L503-517) is the homework-integrity
   rule Taxila needs.

---

## 2. Asset rows

Decision vocabulary as in the map: **copy / adapt / idea / build-new / skip**. Status = maturity in the source plus my
Q (1-5) for fitness to Taxila.

### 2.1 For map §2.13 learning / pedagogy / curriculum

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| Doubt ladder: orient → narrow → eliminate, 3 rungs, then the "a wrong answer costs nothing" close | `lib/saathi/ladder.ts@ai2b@main` (L72-85 `rungsFor`, L90-96 `nextHintIndex`, L112-133 `hintFor`) | shipped, Q3 | **idea** (Taxila already has a 4-rung ladder) | The rung is derived server-side from the max `hintIndex` already served in history, so a client cannot ask for rung 3 first. Every rung goes through `leaksAnswer` and is **skipped, never trimmed**. If every rung leaks, the ladder degrades to the closing turn rather than to silence. Taxila's kits use pump → hint → prompt → **assertion** (`server/content/minikit.js` L48, L71), and rung 4 gives the answer. Saathi structurally never gives it. Adopt the "server derives rung from history" and "skip a leaking rung, don't trim" rules. Keep Taxila's assertion rung for K-9 (a child must not be left stuck after 3 rungs). Rung texts are adult AI-review copy; `eliminateByOrigin` (L49-56) rests on ai2b's near-miss distractor rule, which Taxila kits must honour first. |
| Rung-1-only entry counting | `lib/saathi/memory/signal.ts@ai2b@main` L25-28 | shipped, Q4 | **copy** (rule) | Rungs 2-3 are the same visit continuing. Counting them "would turn one hard question into a weak topic the learner never came back to." Recomputed per turn from the client's window, never a stored counter. In Taxila, record a ladder *entry* as one `rel_event`/evidence row, not one row per rung. |
| Deterministic memory extraction with a closed source union | `lib/saathi/memory/extract.ts@ai2b@main` L1-29 (design), L138-231 | shipped, Q3 | **adapt** (filters) / **skip** (misconception shapes) | Keep the filter order: shape → word cap (FAIL, never trim) → never-store → forget terms → dedupe → max 2 rows/turn. Keep the `DropReason` list that lets tests assert *why* a row was refused. Do **not** keep `misconceptionShapes` (L113-118) or the `onLadder` predicate (L186), for the defects in §3. Taxila's misconception evidence must be `classify.js` outcome `misconception` with a kit `misconceptionId`, never a regex capture of free speech. |
| Misconception capture on ladder turns | `lib/saathi/memory/extract.ts@ai2b@main` L183-197 | shipped, Q1 for comprehension | **skip** | Unkeyed. It stores attempts, correct beliefs and refusal-turn chatter. See §3 and §4. |
| `weak-topic` from repeat ladder entries; `term-asked` from repeat glossary lookups | `extract.ts@ai2b@main` L148-163 | shipped, Q3 | **idea** | Good discipline: counts of what the child *did*, never a judgement. In Taxila these are weak tie-breakers beside BKT `pKnown` (`server/learner/bkt.js`), not mastery inputs. |
| Glossary-first, ahead of the ladder | `lib/saathi/glossary-first.ts@ai2b@main` L48-65 (shapes), L112-119 `asksWhatItMeans`, L152-164 | shipped-measured, Q4 | **adapt** | Rejection it encodes: "samajh nahi" was read as a hint request, so "ye rubric kya hota hai? mujhe samajh nahi aaya" got rung 1 (re-read a section) instead of the meaning (F7 journey study; `ai2bharat-core.md` rejection 53). Measured after the fix: 6/6 answered from the authored entry, model never called (`context/measurements.md@ai2b@main` L585-588, n=6). Earlier the model lane failed 5/5 (`finish_reason: length`), n=5 before and n=5 after `a9dca60` (L570-583). The `aboutSomethingElse` guard (L65: why/how/kaise/kyun → not a definition) is the right Hinglish shape. Taxila needs a bilingual NCERT glossary per class band. Run this *before* `classify.js` treats "samajh nahi aaya" as `dont_know`. |
| Authored glossary + `lookupGlossary` | `lib/saathi/glossary.ts@ai2b@main` L23-136 (16 entries), L149-161 | shipped, Q3 | **adapt** (matcher) / **skip** (content) | Content is AI-evaluation jargon. Keep the matcher: longest-term-first and word-boundary. Keep `\p{M}` in the normaliser, because without it "रूब्रिक" became "र ब र क" and **no Hindi term had ever matched** (L150-152). That is a rejection worth carrying into every Taxila Devanagari matcher. |
| Celebration licence (events, never quality; fire-once-ever; fixed magnitude; no clock) | `lib/saathi/moments.ts@ai2b@main` L53-63, L70-87; `SAATHI_MOMENTS` in `contract.ts@ai2b@main` L234-245 | shipped, Q4 | **adapt** (also gamification) | Four client-witnessed events. A storage failure means **do not fire** (L76). `first-attempt-after-stuck` is the one moment tied to the ladder: the client, not the model, witnesses it. For Taxila, key the ledger on `child_id` server-side, not `localStorage` (shared family phones). |
| Shared naive question predicate | `lib/saathi/register-predicates.ts@ai2b@main` L29 → `evals/indic-benchmark/lib/properties.mjs` | shipped, Q3 | **idea** (principle) | One predicate for the gate and the eval, deliberately naive (trailing `?` only). **For voice it is the wrong predicate:** realtime transcripts and TTS text carry punctuation unevenly, and Hinglish questions often have no `?` (L23-27 say so). The principle (gate and measurement share one function) carries over; the function does not. |
| Bubble split after the gate | `lib/saathi/bubbles.ts@ai2b@main` L131-166 | shipped, Q2 for Taxila | **idea** (text lane only) | Rejection: model-emitted `---` separators malformed 4/4 replies on one model and 2/5 on the shipped one (L6-11, imported from Meera). Irrelevant to the voice lane. It is relevant only if Taxila's text lane splits replies. |

### 2.2 For map §2.1 realtime-voice (learner ASR, Hindi/English sound-alike handling)

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| ASR provider seam + named failure union | `lib/saathi/asr.ts@ai2b@main` L36-81 | shipped, Q3 | **idea** | `null` provider = "not configured", which is a state with a name, not a throw. `empty` (a 200 with no transcript) is named because it "renders as 'you said nothing'" (L48). Map onto Taxila's `cascadeLink.ts` push-to-talk fallback and `server/routes/voice.js`. |
| Sarvam Saarika credential pool (rotate only on 402/429/credit text; never on transport; each key at most once; cursor read once) | `lib/saathi/asr.ts@ai2b@main` L117-322 | shipped, Q1 | **skip** (barred: Sarvam, and pooled free credits) | Azure-only directive. The rotation rules are already known in the map (§3.9 #168 on retry ladders). One subtle bug class is worth knowing: "read the cursor ONCE; a walk that re-read it every iteration would skip a credential per rotation" (L237-239). |
| ASR route order + "transcript is a DRAFT, never auto-sent" | `lib/saathi/asr-handler.ts@ai2b@main` L12, L97-102, L159-170; D-059, D-060, D-061 in `context/registry.json@ai2b@main` | shipped, Q2 | **idea** | Saathi is typed-chat-with-dictation. Taxila is a live voice lesson, so the draft-and-edit pattern does not apply to the main lane. It applies to a homework/doubt composer for older children. Route order to keep: origin → configured → identity → **provider check before reading the body** (do not spend a child's 4G data on bad news, L97-99) → bounded body → size from base64 arithmetic → rate limit → transcribe. **Defect:** L166 silently `slice`s the transcript to 500 chars, which is the silent-truncation class Taxila's laws forbid. D-061 also records a rejection: Saathi *declined* live calls because "a realtime lane has twice been measured to drop rules the text lane keeps (once safety, once recall)". The reversal condition is a byte-identity assertion that realtime receives the same compiled CORE as text. Taxila's realtime premium lane must carry that assertion. |
| Sound-alike table, pull-only TAIL row | `lib/saathi/sound-alikes.ts@ai2b@main` L34-47 (12 pairs), L63-73, L76-80; wired at `lib/saathi/prompt.ts@ai2b@main` L269-274 (`viaVoice` only) | shipped, Q3 | **adapt** (mechanism) / **skip** (table, matcher) | Right shape for Taxila. Correct *after* STT, as a hint row to the teacher model, never by rewriting the transcript and never in the STT prompt. Taxila's own measurement agrees: a term list in the gpt-4o-transcribe prompt produced lesson content from near-silence (`server/voice/stt.js` L26-31; `docs/research/voice/asr-kids-hinglish.md` §3.4). Rebuild the table per **kit**: NCERT terms (numerator, denominator, photosynthesis, विभाजन…) from real child-transcript errors. **Defects not to copy:** (1) `text.includes(heard)` is a substring match. "rational number" fires `rational->rationale`, "evolution" fires `->evaluation`, "promise" fires `prom->prompt` (§3). Use word-boundary matching, as `rank.ts` and `extract.ts` already require. (2) `soundAlikeRow` prints `heard[0]`, not the variant actually heard, so "faculty" renders `factually->factuality`. (3) No Devanagari-side pairs exist. (4) The table is adult English jargon, not school vocabulary. |
| Indic matcher rule: keep `\p{M}` | `lib/saathi/glossary.ts@ai2b@main` L150-153 | shipped, Q5 | **copy** (rule) | Any Taxila normaliser over child transcripts (classify exact-match, glossary, sound-alikes) must keep combining marks. |

### 2.3 For map §2.10 multimodal-vision (homework photo)

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| Photo pure half: `validatePhoto`, `base64ByteLength` (no decode), `isStandardBase64`, `planReencode` (never upscale; min long edge 64, max 1024), `acceptsSourceFile` | `lib/saathi/photo.ts@ai2b@main` L48-55, L60-63, L70-80, L97-110, L113-117; caps in `SAATHI_PHOTO` `contract.ts@ai2b@main` L101-121 | shipped, Q4 | **copy** | Zero imports beyond the contract, so a grep test can prove the pipeline has no store (`tests/saathi-multimodal.test.ts@ai2b@main` "the photo pipeline contains no store"). Never upscaling is anti-fabrication: "handing it a blurrier, larger image is handing it the failure" (L92-95). Re-tune caps for notebook OCR (1024 px long edge may be low for a full handwritten page; measure). JPEG/WebP only, HEIC refused (Android Capacitor camera output must be re-encoded first). |
| Photo-on-a-checked-step → ladder, never the model | `lib/saathi/handler.ts@ai2b@main` L503-517; test "a photo on a live checked step never reaches the model, and the learner gets a rung" | shipped, Q4 | **adapt** | "A photographed practice task is the highest-value attack on the integrity rule." Code cannot tell a photo of a doubt from a photo of the check, so the rule is structural. Taxila analogue: while a keyed item is live, a homework photo routes to the hint rung, not to vision. |
| Honest no-vision states | `handler.ts@ai2b@main` L524-541 (`photo-not-read`); tests "no key plus a photo…", "a fabricating photo reply is discarded whole" | shipped, Q4 | **adapt** | The trace names "a photo arrived and no model saw it". Pair it with the map's vision fabrication facts (§2.10). ai2b's own measurement: DeepSeek-V4-Flash returned a confident invented description at `prompt_tokens: 16` (n=1 synthetic image, 2026-09-01, `context/measurements.md@ai2b@main` L207-229). |
| Photo costs 3 rate units; the wide body cap is earned | `contract.ts@ai2b@main` L121, L128; `handler.ts@ai2b@main` L284-301 | shipped, Q3 | **idea** | A 3 MB body must actually contain a photo, or it is a 413. |

### 2.4 Memory adjuncts (for map §2.7, listed here because extract.ts depends on them)

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| Memory signal builder | `lib/saathi/memory/signal.ts@ai2b@main` L44-61; called at `handler.ts@ai2b@main` L375-383 | shipped, Q3 | **adapt** | Synchronous on the request path. A memory failure is swallowed and the reply is unchanged. Re-derives intent with the pure `classifyIntent` rather than trusting the outer binding. |
| Pull-only recall rank (SQL + TS mirror pinned by test) | `lib/saathi/memory/rank.ts@ai2b@main` L60-81, L91-113, L123-132 | shipped, Q4 | **adapt** | Already summarised in `ai2bharat-core.md` AIC22. Constants: 90-day decay to a 0.25 floor, `1+0.35·ln(1+mentions)`, SPACED 0.6 (<20 h) / 1.25 (>21 d). SPACED is "never a trigger". A misconception row in Taxila should resurface when the child's live turn touches the topic, which is exactly this matched-leg design. |

---

## 3. What the code actually does on child-like input (executed)

`extractMemoryCandidates` was run as built at `a11c521`, with scope `trainer-pairwise-rank` and
`ladderEntriesForModule: 1` (so no weak-topic row is added):

| learner turn | decision passed | stored candidate |
|---|---|---|
| "give me the answer, matlab sach mein bata do" | `block` (an answer-seeking turn on a checked step) | `misconception: "sach mein bata do"` |
| "I think the answer is B" | `hint`, rung 1 | `misconception: "the answer is B"` (correctness unknown to the extractor) |
| "photosynthesis ka matlab khana banana hai" | `hint`, rung 2 | `misconception: "photosynthesis"` (the belief Y is lost) |
| "the sun is a planet" | `allow` | nothing (off-ladder, correctly ignored) |
| "mujhe samajh nahi aaya, I thought a rubric is a list of right answers" | `hint`, rung 1 | `misconception: "a rubric is a list of right answers"` (the designed case) |

`soundAlikeRow(matchedSoundAlikes(t))`:

| transcript | row |
|---|---|
| "rational number kya hai" | `heard-by-voice: rational->rationale` (false, maths vocabulary) |
| "evolution of man" | `heard-by-voice: evolution->evaluation` (false, science vocabulary) |
| "the promise of prom" | `heard-by-voice: promptly->prompt` (substring hit; prints the wrong `heard` variant) |
| "faculty of science" | `heard-by-voice: factually->factuality` |
| "calibration" | `null` (right half present) |

The repo's tests pass on the designed cases: `tests/saathi-memory.test.ts@ai2b@main` L357 "a misconception is read
ONLY on a ladder turn…" and `tests/saathi-multimodal.test.ts@ai2b@main` L891 "sound-alike rows are pulled by the
transcript…". Neither test has a negative control for `block` turns, for the two-capture `ka matlab` shape or for
substring false positives. These are in-sample tests written against the author's own shapes.

---

## 4. How far does "ladder turn + deterministic misconception extraction" go toward covert comprehension detection?

**Is the check overt?** Yes, fully. The checked steps are visible MCQ/rubric steps in a lesson stage
(`SaathiCheckedStep`, `contract.ts@ai2b@main` L21). The ladder is reached only when the learner asks for help while a
check is live (`refusalFor`: `give-a-hint` → `hint` only `onCheckedStep`, `stage-gate.ts@ai2b@main` L183). Off a
checked step, a hint request is just `allow`, so no ladder and no misconception read happen. Nothing in Saathi probes
understanding unprompted. `pedagogy.ts@ai2b@main` L137 (`firstMoveOnDoubt: ask-what-was-tried -> restate-back ->
then content`) is a prompt row the model may follow. It is not a detector, and nothing reads its result.

**What signals does it use?**
- *Self-report of struggle*: the hint/stuck/"samajh nahi"/madad shapes (`stage-gate.ts@ai2b@main` L118-123).
- *Persistence*: rung-1 entries per module, counted from the client's window (`signal.ts@ai2b@main` L25-28).
- *Vocabulary gap*: the same glossary term asked twice (`signal.ts@ai2b@main` L37-42).
- *Stated belief*: a regex capture of "I thought / X is a Y / X ka matlab / means …" on a non-`allow` turn.
- **Not used:** answer correctness, which distractor was chosen, latency, hesitation, re-attempt success, transfer
  performance, teach-back, or any comparison against a key. `SaathiMemorySignal` (`extract.ts@ai2b@main` L55-66)
  excludes them by type. That is a deliberate privacy choice ("nothing here is an inference about a person"), and it
  is exactly why the extractor cannot detect comprehension.

**Can it run on realtime transcripts?** Mechanically yes: every function is pure string → rows and needs no model.
Practically, only as a **post-turn Director signal**, for three reasons:
1. In a speech-to-speech lane the reply starts before any server-side gate. The ladder's authored-rung reply cannot be
   served inline. It would have to be injected as an instruction (`session.update`/`conversation.item.create`) for the
   *next* turn.
2. The shapes and `endsInQuestion` depend on punctuation (`[.!?]|$`) that ASR adds inconsistently.
3. Child transcripts at Taxila's measured ASR quality would push wrong captures into durable memory, unless they are
   gated on `asrConfidence ≥ ASR_MIN` the way `classify.js` already gates evidence.

On Taxila's cascade lane, which is the default, the Director already sees the final transcript before replying. There
the ladder-entry and glossary-first logic can run inline, but it is redundant with `classify.js` + `state.js`
(`"stuck"` outcome) + `affect.js` (`dontKnowStreak`).

**Verdict.** It is a **partial precursor for 2 of the ~8 signals** a covert detector needs: self-reported stuckness
and persistence on a topic. It also supplies good *storage discipline* for misconception rows: closed kinds,
fail-don't-trim, the forget filter, pull-only recall. It is **not** a detector. It is overt-check-bound, learner-initiated
and unkeyed, and in its free-text form it misfires (§3). Taxila's existing `classify.js` keyed-misconception
classifier is already the more advanced artefact in the portfolio. The genuinely missing pieces stay missing:
unprompted probe selection, first-try vs eventual correctness, transfer, teach-back scoring validated on children, and
a held-out eval.

---

## 5. Correction to INHERITANCE-MAP.md

- **L190** ("What exists nowhere… a covert comprehension detector"): the claim stands for a *covert detector*, but it
  should name the precursor. ai2bharat Saathi has an overt-check, learner-initiated struggle recorder
  (`ladder.ts`, `memory/signal.ts`, `memory/extract.ts`), and Taxila itself already has a keyed classifier
  (`server/director/classify.js`). Neither probes covertly or is validated on children.
- **L486** (the combined glossary-first/ladder row): split it. Glossary-first is **adapt** (measured 6/6 vs 0/5). The
  ladder is **idea** (Taxila already has a 4-rung kit ladder with an assertion rung).
- **L359** (extract.ts as memory kinds only): add that its misconception shapes are **skip**, for the §3 defects.
- **L500** "Build new" (§2.13): the nearest-signals list should add "ladder entries per topic (rung-1 only) and
  glossary repeat-lookups".
- **§2.1 and §2.10:** add the rows above. There were none for `asr.ts`, `asr-handler.ts`, `sound-alikes.ts` or
  `photo.ts` as a pure module.

## 6. Coverage

**Read in full at `a11c521`:** `lib/saathi/{ladder,asr,asr-handler,sound-alikes,glossary-first,glossary,photo,moments,register-predicates,bubbles}.ts`,
`lib/saathi/memory/{extract,signal,rank}.ts`.

**Read in part:** `stage-gate.ts` (L100-190), `handler.ts` (L360-400, L465-560, L740-776), `prompt.ts` (L262-280),
`contract.ts` (types, `SAATHI_PHOTO`, `SAATHI_VOICE`, `SAATHI_MOMENTS`), `pedagogy.ts` (grep), `context/registry.json`
D-059 to D-062, and `context/measurements.md` (vision 2026-09-01, Round 12, glossary probes).

**Tests:** names and the relevant bodies of `tests/saathi-memory.test.ts`, `saathi-multimodal.test.ts`,
`saathi.test.ts`, `saathi-asr-pool.test.ts`, `saathi-humanization.test.ts` and `saathi-question-trim.test.ts`. They
were read, not run.

**Not read:** `vision-gate.ts`, `output-gate.ts`, `components/saathi/{asr-client,voice-input,photo-attach}.ts` (covered
by AIC27/AIC29 in `ai2bharat-core.md`), `memory/{kinds,never-store,recall,store}.ts` beyond the greps.

**Unmeasured anywhere:** child ASR CER, false-positive rates of any of these shapes on real learner text, and the
32-52% Hinglish CER figure (stated, no n).
