# VOICE-CHOICE: which voice each Taxila teacher speaks with, per lane (v2 synthesis, 2026-10-03)

Synthesis of the v2 experiments: `azure-speech-voices.md` (185 Azure clips), `reference-gemini.md` + `judge-summary.md`
(AI-judge proxy, Gemini reference), `open-tts-on-azure.md` (open models on Azure GPU, own-voice plan),
`stt-hinglish.md` (the ear side of the cascade), and the earlier `../voices-hindi.md`, `../listening-samples.md`.
Every report carries an adversarial review; this file applies those corrections and does not repeat
claims the reviews struck. Evidence tags: **[M]** measured in v2, **[P]** earlier measurement in this repo, **[V]** vendor
list / price API / `voices/list` (re-read 2026-10-03), **[E]** estimate with arithmetic shown, **[U]** unverified.

**What this file is not.** It is not proof that any voice is "indistinguishable from a real Indian person". No human
has rated a v2 clip yet and no human anchor exists for the five passages. The AI judge is a single same-family
judge that cannot tell real humans from TTS (it rated real Indian speakers 3.25, below most TTS). The goal question
is decided by the human blind test in §8, built as `blind-test.html`.

---

## 0. Verdict

1. **Production pick today (GA, Azure-billed): `en-IN-Diya:DragonHDLatestNeural` for Asha (classes 1-4), on both
   lanes.** It is the only voice that is GA, AI-judge top tier (4.70: native 5.0, Hindi 5.0, natural 4.2, warmth 4.6,
   0/5 accent leak) and fast enough per sentence (TTFB 244 ms median, streams at ~3.6x real time) [M]. Price $22/M
   chars on a verified meter [V], which per lesson text is the same as gpt-4o-mini-tts (~$21.7/M equivalent) [M].
2. **Best Azure voice by the proxy: `hi-IN-Priya:MAI-Voice-2.1` (HD), 4.85**, but it is **Preview** [V voices/list], so
   by `voice-lane-a-v1-panel-decides` it cannot ship to minors. It is the switch-on-GA candidate. It is also the slow one:
   TTFB ~1.0 s flat across passage length, a fixed start-up cost on every sentence [M].
3. **Male (Arjun, 5-9): `hi-IN-Dhruv:MAI-Voice-2.1-Flash` leads the proxy (4.65) but is Preview; the GA pick is
   `en-IN-Arjun:DragonHDLatestNeural` (lang-tagged), which is intelligible (WER 0) and fast (242 ms) but was never
   AI-rated** (budget ran out). The panel decides between them and `cedar` on lane A.
4. **Older female register (Uma, 8-9, also selectable for 5-7): no measured winner.** GA candidates are DragonHD
   `en-IN-Meera` (slowest DragonHD at 13.8 chars/s, closest to Uma's slow pace) and `en-IN-Neerja`; both unrated by the
   judge. Meera is in the shortlist block of the panel.
5. **The Gemini gap is inside judge noise.** Directed Gemini-3.8-flash-tts scored 5.00; Priya 4.85, Diya 4.70, Dhruv
   4.65. The judge's own retest disagreement is 0.30 per clip and n=5 clips per arm, so the four are a tied top group.
   The whole gap is naturalness (4.6 / 4.2 / 4.4 vs 5.0) and warmth (4.8 / 4.6 / 4.2 vs 5.0). Gemini without its
   director note fell to 4.45, below the Azure leaders [M, proxy]. Gemini is reference-only: off Azure, and barred
   from child paths (`ct-no-gemini-api-for-minors`).
6. **One voice per character across lanes.** Today lane A (premium) speaks `marin` and the cascade speaks
   gpt-4o-mini-tts. A child who gets both lanes in a week meets two different people. Voice Live lane B
   (gpt-realtime-2.1 brain + the same Azure voice) removes that, and it is cheaper than the native lane (~$0.042 vs
   $0.082 per minute of teacher speech [P/V]). It costs ~80 ms more first audio (858 vs 776 ms median [P]).
   Proposal: lane B with the character's cascade voice becomes the premium-lane candidate against lane A in the panel.
7. **gpt-4o-mini-tts (today's cascade default) is effectively unmeasured on quality:** the judge rated 2 of its 20
   clips (coral, 3.5); a published 1,900-rater Indian study puts gpt-4o-mini-tts at Bradley-Terry 943 against Gemini
   2.5 Pro TTS 1129 [P, arXiv 2604.21481, not re-verified]. It stays as the cross-service fallback (Azure OpenAI vs
   Azure Speech), not the default, unless the panel prefers it.
8. **If no Azure voice passes the panel**, the ladder is (a) tune what we have (rate, lang tags, styles, PCM) and
   re-panel, (b) **Azure Professional Voice** from a consented, work-for-hire teacher recording (production route),
   (c) LoRA of Veena/Svara on an Azure A100 (hedge). §7.
9. **Gaps that must close before any "indistinguishable" claim:** a real-teacher recording of passages a-e (human
   anchor); gpt-live-1, gpt-realtime-2.1 and Voice Live B/C rendered on passages a-e; PCM (not mp3) stimuli; 2-3 takes
   per cell; sentence-level TTFB from Central India with n >= 20. §9.

---

## 1. Candidates and what we know about each

GA/Preview from `voices/list` (eastus2, 2026-10-03) [V]. AI judge = Gemini-3.1-Pro, composite of 4 axes, n=5 clips
unless noted [M, proxy]. TTFB/total = median over 5 passages, US container -> eastus2, one take per cell [M].
WER = round-trip through gpt-4o-transcribe with a deliberately lenient scorer (saturated; cannot rank voices) [M].

| voice | status | judge composite (native / natural / hindi / warmth) | accent leak | TTFB / total ms | chars/s at rate 0.95 | WER mean | $/1M chars |
|---|---|---|---|---|---|---|---|
| `en-IN-Diya:DragonHDLatestNeural` (plain) | **GA** | **4.70** (5.0 / 4.2 / 5.0 / 4.6) | 0/5 | 290 / 3701 | 15.2 | 0.000 | 22 [V] |
| `en-IN-Diya:DragonHDLatestNeural` (lang-tagged) | **GA** | not rated | - | 244 / 3504 | 15.9 | 0.000 | 22 [V] |
| `hi-IN-Priya:MAI-Voice-2.1` (HD, styled) | Preview | **4.85** (5.0 / 4.6 / 5.0 / 4.8) | 0/5 | 994 / 1474 | 9.3 | 0.008 | 22? [U] |
| `hi-IN-Dhruv:MAI-Voice-2.1-Flash` (styled) | Preview | **4.65** (5.0 / 4.4 / 5.0 / 4.2) | 0/5 | 438 / 734 | 11.0 | 0.000 | 15? [U] |
| `hi-IN-Diya:DragonLatestNeural` | Preview | 4.75 (n=2) | 0/2 | 884 / 1782 | 13.4 | 0.005 | 15? [U] |
| `hi-IN-Kavya:MAI-Voice-2.1-Flash` (styled) | Preview | 4.05 (4.8 / 3.2 / 4.8 / 3.4) | 0/5 | 320 / 797 | 11.3 | 0.000 | 15? [U] |
| `hi-IN-Priya:MAI-Voice-2.1-Flash` (styled) | Preview | 3.85 (4.4 / 3.0 / 4.4 / 3.6) | 0/5 | 337 / 785 | 8.9 | 0.006 | 15? [U] |
| `hi-IN-Dhruv:MAI-Voice-2.1` (HD) | Preview | 3.80 (4.6 / 2.8 / 4.6 / 3.2) | 0/5 | 903 / 1251 | 9.4 | 0.000 | 22? [U] |
| `en-IN-Arjun:DragonHDLatestNeural` (lang-tagged) | **GA** | not rated | - | 242 / 3813 | 15.5 | 0.000 | 22 [V] |
| `en-IN-Meera:DragonHDLatestNeural` (lang-tagged) | **GA** | not rated | - | 245 / 3914 | 13.8 | 0.005 | 22 [V] |
| `en-IN-Neerja` / `Aarti` / `Lavanya` DragonHD | **GA** | not rated (Lavanya 1 clip 5.0) | - | 239-260 / 3.6-3.7 s | 14.9-16.0 | 0-0.005 | 22 [V] |
| `hi-IN-SwaraNeural` (plain / cheerful+empathetic) | **GA** | 2.0 (n=1) | - | 645 / 1404; styled 1164 / 2039 | 9.7 / 10.2 | 0.000 | 15 [V] |
| gpt-4o-mini-tts `marin` (cascade today) | GA, snapshot unknown | not rated | - | 304 / 2536 | 11.8 (no rate control) | 0.000 | ~21.4 equiv. [V/M] |
| gpt-4o-mini-tts `coral` | GA | 3.5 (n=1 of 5) | - | 664 / 2766 | 11.6 | 0.000 | ~21.8 equiv. |
| `hi-IN-*:DragonHDOmniLatestNeural` (6 voices) | **unlisted** | 2.5 (n=1-2) | - | 593 median, p90 4958, max 8734 | 11.9 | 0.007 | ? |
| `hi-IN-Grant` / `Harper` MAI | Preview, cross-lingual stock personas | 3.65-4.10 | 0-1/5 | | | | |

Read with the caveats from the reviews:
- **HD vs Flash swings in opposite directions** (Priya HD 4.85 / Flash 3.85; Dhruv HD 3.80 / Flash 4.65). With the same
  styles, that is judge noise or a voice x tier interaction, not a tier effect. Do not pick a tier from these numbers.
- **`native_indian` equals `hindi_pronunciation` in 154/166 judge ratings**, so the composite double-counts one axis.
  Natural and warmth are where voices differ.
- **Grant and Harper are not Indian voices**: the same personas appear under cs-CZ, da-DK, de-DE and other locales [V].
  They are the "English speaker attempting Hindi" case and are out of the shortlist (still in the panel as distractors).
- **DragonHDOmni is out of production**: it resolves but is not in `voices/list`, and its tail (8.7 s) is unusable
  live. Rejected (§10).
- **Codec path favours the reference.** Gemini clips were PCM encoded once; Azure clips were 96 kbps mp3, decoded and
  re-encoded. Azure's near-tie is therefore conservative.
- **The ASR column cannot rank voices.** 160/185 clips at WER 0; the scorer is gpt-4o-transcribe (excluded from grading
  for hallucination) with 0.34 per-word edit tolerance.

---

## 2. Ranked shortlist per teacher character

Rule applied: performance first; a Preview voice can be a benchmark or a "switch on GA" target, never the production
pick for minors (`voice-lane-a-v1-panel-decides`); a reference (Gemini, open models) only calibrates.

### Asha: classes 1-4, female, young, warm, unhurried, mid-pitch (the child may call her didi; she never self-labels)

| rank | voice | lane use | status | why |
|---|---|---|---|---|
| 1 | **`en-IN-Diya:DragonHDLatestNeural`**, Devanagari runs lang-tagged, rate slowed (§3) | cascade default + lane B premium | GA | top-tier proxy (4.70, 0 leak), 244 ms TTFB, verified $22/M; one voice on both lanes |
| 2 | `hi-IN-Priya:MAI-Voice-2.1` HD (excited / softvoice per segment) | benchmark; switch target on GA | Preview | best Azure proxy score (4.85; natural 4.6, warmth 4.8) but ~1 s TTFB per sentence |
| 3 | `hi-IN-Diya:DragonLatestNeural` | benchmark | Preview | 4.75 on 2 clips only; 884 ms TTFB |
| 4 | `marin` on gpt-realtime-2.1 (lane A, v1 incumbent) | lane A | GA | all pedagogy evidence is on this lane; voice unrated in v2; unhinted ASR wrote Hindi as Urdu/Bengali script on 6/40 native-OpenAI Hindi clips [P] |
| 5 | gpt-4o-mini-tts `marin` (named snapshot) | cascade fallback | GA | cross-service fallback; quality unmeasured here |
| ref | Gemini-3.8-flash-tts Kore (directed) | panel reference only | not shippable | the "smoothness" target the owner likes |

### Arjun: classes 5-9, male, young, bright, brisk but clear

| rank | voice | lane use | status | why |
|---|---|---|---|---|
| 1 | **`en-IN-Arjun:DragonHDLatestNeural`** lang-tagged | cascade + lane B | GA | the only GA male Indian HD voice; WER 0, 242 ms; **not AI-rated**, so the panel must confirm |
| 2 | `hi-IN-Dhruv:MAI-Voice-2.1-Flash` (excited / softvoice) | benchmark; switch target on GA | Preview | best male proxy score (4.65), 438 ms TTFB, 734 ms total |
| 3 | `cedar` on gpt-realtime-2.1 | lane A | GA | v1 incumbent; unrated in v2 |
| 4 | `en-IN-ArjunIndicNeural`, `hi-IN-Aarav/Kunal/Rehaan/Madhur` Neural | untested | GA | named in the brief, never swept (review R1); cheapest GA fallback at $15/M |
| - | `hi-IN-Arjun:MAI-Voice-2.1(-Flash)` | no | Preview | 3.50-3.62, weakest natural (2.5); also lacks `softvoice` |

### Uma (8-9) and any female voice for 5-9: older, lower, slower, warm-dry

| rank | voice | status | why |
|---|---|---|---|
| 1 | `en-IN-Meera:DragonHDLatestNeural` lang-tagged | GA | slowest DragonHD (13.8 chars/s), the closest pace to Uma's; unrated; in the shortlist block |
| 2 | `en-IN-Neerja:DragonHDLatestNeural` | GA | unrated; in the full panel blocks |
| 3 | `hi-IN-Priya:MAI-Voice-2.1` with a lower rate and no `excited` | Preview | benchmark only |
| - | Asha's Diya at a slower rate | GA | acceptable only if the panel says Meera/Neerja are not warm; two characters must stay distinguishable by ear |

---

## 3. Recipe per voice (SSML / instructions)

Shapes only. Nothing here is a line a teacher could say; `{{...}}` are slots filled by the Director's reply after
`toSpoken()` (`server/voice/spoken.js`). Every TTS input goes through `toSpoken()` first (numbers, notation,
helplines digit by digit) on every lane. Output format for the cascade player: `raw-24khz-16bit-mono-pcm` (matches the
current PCM path in `server/voice/speech.js`); `audio-24khz-96kbitrate-mono-mp3` only for cached narration.

**Script policy for Hinglish (all Azure voices).** Hindi words in Devanagari, English words in Latin script, as the
Director writes them. Do not transliterate English into Devanagari for Azure voices: Azure Speech arms were 0-8% Latin
in ASR output vs 22% for gpt-4o-mini-tts, which means they already Hindi-ise English words [M]; whether that sounds
right is an ear question. Exception: the IndicF5/F5 family needs Latin -> Devanagari first (0/10 -> 10/10) [M].

### 3.1 `en-IN-Diya` / `en-IN-Arjun` / `en-IN-Meera` : DragonHDLatestNeural (GA, NeuralHD, no StyleList [V])

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN">
  <voice name="en-IN-Diya:DragonHDLatestNeural">
    <prosody rate="{{rate}}">{{latin run}} <lang xml:lang="hi-IN">{{devanagari run}}</lang> {{latin run}}</prosody>
  </voice>
</speak>
```
- **Lang tags:** wrap each Devanagari run in `<lang xml:lang="hi-IN">`. Measured effect on WER/TTFB/duration: none
  (0.002 vs 0.004, same TTFB) [M]; accent effect: ear A/B in the panel (both variants in the blocks). Keep tags on by
  default: they are free and make the intended language explicit.
- **Rate:** DragonHD spoke 15.2-15.9 chars/s at `rate=0.95`, faster than measured Hinglish speech (12.0 chars/s [P]).
  Targets: Asha ~11 chars/s, Arjun ~13, Uma ~11. Arithmetic [E]: Asha 0.95 x 11/15.9 = 0.66, Arjun 0.95 x 13/15.5 = 0.80,
  Uma 0.95 x 11/13.8 = 0.76. **[U] whether DragonHD honours `prosody rate` proportionally is not measured** (only
  0.95 was rendered). First step of the next render: Diya at 0.70 / 0.80 / 0.90, measure chars/s.
- **Expression:** no `express-as` (no StyleList). Praise vs correction comes from the text shape (shorter sentences,
  a `<break time="250ms"/>` before the correction). Optional `<break>` at clause ends for class 1-2.
- **Voice Live (lane B):** session voice `{ "name": "en-IN-Diya:DragonHDLatestNeural", "type": "azure-standard",
  "rate": "{{rate}}" }` plus `custom_lexicon_url` for NCERT terms and helpline numerals [V voices-hindi §0.5].

### 3.2 `hi-IN-Priya` / `hi-IN-Dhruv` / `hi-IN-Kavya` : MAI-Voice-2.1(-Flash) (Preview; benchmark until GA)

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="hi-IN">
  <voice name="hi-IN-Dhruv:MAI-Voice-2.1-Flash">
    <prosody rate="{{rate}}">
      <mstts:express-as style="{{style}}">{{segment}}</mstts:express-as>
    </prosody>
  </voice>
</speak>
```
- **Styles only from the voice's own StyleList** [V]: Priya/Kavya/Dhruv list `excited`, `softvoice`, `hopeful`,
  `joyful`, `relieved`, `confused`, `determined`, `whispering` and others; **`hi-IN-Arjun:MAI` lacks `softvoice`**, and
  sending it returned 400/502 depending on the day [M]. Map: praise segment `excited` (or `joyful` for class 1-4),
  correction segment `softvoice`, encouragement `hopeful`, neutral explanation no style. The adapter validates against
  `voices/list` at boot and drops unknown styles silently.
- **Rate:** MAI spoke 8.9-11.3 chars/s at 0.95. Asha target 11 -> Priya ~1.15, Kavya ~0.95; Arjun target 13 -> Dhruv
  ~1.1 [E, same proportionality caveat].
- No lang tags needed: hi-IN primary, Latin English read as written.
- **HD start-up cost:** ~0.6 s more TTFB than Flash on every request regardless of length [M]; in a sentence-chunked
  cascade that cost is paid per sentence unless the next sentence is requested while the current one plays.

### 3.3 gpt-4o-mini-tts (cascade fallback)

- `model`: name the snapshot. Two exist (`2025-03-20` preview, `2025-12-15` GA, newer) [V]; ask the owner to deploy
  `2025-12-15` if the current deployment is the preview. The v2 sweep cannot say which one it measured.
- `voice`: `marin` (Asha/Uma), `cedar` (Arjun): the same names as lane A, so fallback keeps the timbre family.
- `instructions`: timbre, accent, pace and register only (already enforced in `speechStyle()`): North Indian
  Hindi-English accent with Indian-English vowels; unhurried for 1-4; warmer and brighter on praise, softer and slower
  on correction. **Never** an age, job, family or human identity (`voices-hindi.md` R1.4: a biography in a voice
  note becomes a claim to be a person).
- No SSML, no reliable rate control (the sweep had none) [M]. `speed` is [U] for this model.

### 3.4 gpt-realtime-2.1 native (lane A) and GPT-Live-1 (lane A+)

- `audio.output.voice` `marin` / `cedar`, locked once audio starts; `audio.output.speed` 0.25-1.5 [P], start 0.95 for
  Asha. The voice note goes LAST in the instructions (position is mechanism) and describes timbre, accent and pace only.
- GPT-Live-1 paraphrases its commentary channel and turned an English stimulus into Hinglish 2/2 [P], so it can only be
  judged in Round 2 (live system), never on read passages.

### 3.5 `hi-IN-SwaraNeural` (GA, styles `cheerful`, `empathetic`, `newscast`)

`express-as cheerful` for praise and `empathetic` for correction work, but cost +0.5 s TTFB (1164 vs 645 ms) [M] and
the one judged clip scored 2.0. Not shortlisted; kept as the cheapest GA hi-IN-primary fallback.

---

## 4. Per-lane recommendation

| lane | today (code / decision) | proposed default | fallback | evidence and condition |
|---|---|---|---|---|
| **Cascade TTS** (default lane, `voice-lane-cascade-default`) | gpt-4o-mini-tts via `/audio/speech` PCM (`server/voice/speech.js`) | **Azure Speech DragonHD per character** (Asha `en-IN-Diya`, Arjun `en-IN-Arjun`, Uma `en-IN-Meera`), lang-tagged, PCM, sentence-chunked | gpt-4o-mini-tts `marin`/`cedar` (different service, same Azure bill) | proxy 4.70 vs 3.5 (n=1); GA; 244 ms TTFB vs 302 ms; cost-neutral per character of lesson text. Ship only after the panel's pilot round confirms Diya >= gpt-4o-mini-tts marin on natural + native (or the full panel says inconclusive and the owner accepts the proxy) |
| **Premium realtime** (budgeted share) | lane A: gpt-realtime-2.1 native `marin` / `cedar` (`voice-lane-a-v1-panel-decides`) | **candidate: lane B, Voice Live + gpt-realtime-2.1 + the character's DragonHD voice** | lane A native voice | one voice per character across lanes; ~$0.042 vs $0.082 per minute; +82 ms first audio (858 vs 776 ms) [P]. Lane B must pass `evals/realtime-bakeoff.mjs`, the never-deny-AI battery, and Round 2 (prosody that follows the child) |
| **Lane C** (`azure-realtime` meera / diya) | panel candidate | fastest first audio (476 ms [P]) | - | blocked until it passes the teacher bake-off (all pedagogy evidence is on gpt-realtime-2.1) |
| **Narration / pre-rendered** (kit intros, helpline hand-off) | gpt-4o-mini-tts cache | the character's cascade voice, cached as mp3 | - | the safety hand-off (Childline 1098, Tele-MANAS 14416) is pre-rendered in the winning voice and digit-checked by ASR before release |
| **STT** (ear of the cascade) | `taxila-live-transcribe` + keywords | unchanged (see `stt-hinglish.md`) | Azure Speech real-time LID hi-IN+en-IN | keywords hold lesson terms only, never the item's answer numbers (stt review R2); D4 is ~0.5 s slower to final text than Azure real-time (review R3) |

Implementation note for the cascade swap (not built here): a second provider in `server/voice/speech.js` that posts SSML
to `https://<region>.tts.speech.microsoft.com/cognitiveservices/v1` with `X-Microsoft-OutputFormat:
raw-24khz-16bit-mono-pcm`; style map from `voices/list` at boot; the cache key already includes `voice` and `version`,
so add the SSML recipe version to `STYLE_VERSION`. Azure Speech REST returns the body as it is synthesised (DragonHD
TTFB 244 ms, total ~3.6x faster than real time) [M].

---

## 5. Cost and latency per teacher hour

Basis [E]: the teacher speaks ~40% of a session hour at ~720 chars/min = ~17,300 chars per session-hour (same basis as
`open-tts-on-azure.md` §3.3), ₹88/$ (as `voices-hindi.md` §4). Per-character prices are comparable across voices
because the lesson text is fixed; per-minute prices are not (voices speak at different rates).

| voice / lane | $/1M chars | $ per session-hour | ₹ per session-hour | first audio (median, US container) |
|---|---|---|---|---|
| DragonHD (Diya / Arjun / Meera) | 22 [V] | 0.38 | 33 | 244 ms TTFB, sentence streamed |
| MAI-Voice-2.1 HD (Priya) | 22? [U] | 0.38 | 33 | 994 ms |
| MAI-Voice-2.1-Flash (Dhruv, Kavya) | 15? [U] | 0.26 | 23 | 321 ms family median |
| Neural (Swara, Indic, hi-IN standard) | 15 [V] | 0.26 | 23 | 645 ms (Swara) |
| gpt-4o-mini-tts | ~21.7 equiv. ($12/M audio tokens [V]) | 0.38 | 33 | 302 ms |
| Voice Live B (gpt-realtime-2.1 + Azure voice) | - | ~$0.042/min of teacher speech -> ~1.0 per hour at 24 min speech | ~89 | 858 ms [P] |
| Lane A gpt-realtime-2.1 native | - | ~$0.082/min -> ~2.0 | ~173 | 776 ms [P] |
| Azure Professional Voice HD (own voice) | 48 [V] | 0.83 + $4.032/h hosting per voice | 73 + hosting | as DragonHD [U] |
| Self-hosted Veena/Svara, Central India A100 VM | - | ~0.10 at full use; 2 replicas $10.3/h [E] | ~9 | 0.2-0.3 s warm [E] |

Realtime rows exclude context re-processing, which dominates long sessions (`mk-azure-voice-cost-per-hour`: rt-2.1
windowed ₹512/h). Per lesson text DragonHD costs the same as today's gpt-4o-mini-tts ($0.38 each). Against the ₹28/h
cascade model, which assumed $15/M Neural TTS with 50% pre-rendered, DragonHD adds $0.12 per 17.3k chars, about
₹6-12/h depending on the pre-render share [E]; the owner's performance-first rule accepts that. MAI and DragonHDOmni have no
retail meter; confirm the billed meter from one day of Cost Management before scaling MAI [U].

Latency is an upper bound: one take per cell, US container through a proxy, eastus2. Re-measure the shortlist from
Azure Container Apps (Central India) with the first sentence of each passage, n >= 20, and first verify the voices
exist in centralindia [U].

---

## 6. Gap to the Gemini reference (what the owner likes)

| arm (Gemini-3.1-Pro judge, n=5) | native | natural | hindi | warmth | leak | composite |
|---|---|---|---|---|---|---|
| Gemini-3.8-flash-tts, directed (6 voices) | 5.0 | 5.0 | 5.0 | 5.0 | 0 | 5.00 (ceiling) |
| MAI-Voice-2.1 HD Priya | 5.0 | 4.6 | 5.0 | 4.8 | 0 | 4.85 |
| DragonHD Diya (plain) | 5.0 | 4.2 | 5.0 | 4.6 | 0 | 4.70 |
| MAI Flash Dhruv | 5.0 | 4.4 | 5.0 | 4.2 | 0 | 4.65 |
| Gemini-3.8 Sulafat, no director note | 4.2 | 4.6 | 4.2 | 4.8 | 1/5 | 4.45 |
| real Indian speakers (IndicTTS read prose, different text) | 4.2 | 2.4 | 4.2 | 2.2 | 0 | 3.25 |
| American-accent negative control | 2.4 | 3.2 | 2.4 | 3.8 | 4/5 | 2.95 |

What the gap means:
- **Pronunciation and nativeness: no gap.** Azure leaders already match the directed reference.
- **Naturalness and warmth: a 0.2-0.8 gap**, the axes where direction matters. Gemini lost 0.55 composite without its
  note, so the Azure equivalents (styles, rate, breaks, Voice Live prosody) are the first lever.
- **Why it may be smaller than it looks:** same-family judge (Gemini TTS 4.94 vs 3.57 for the rest), codec path favouring
  the reference, director note worded like the rubric, ceiling at 5.0.
- **Why it may be larger:** the judge scored real humans below TTS, so it does not measure "sounds human" at all, and
  its rubric under-penalises accent (the American control still got 2.4 native). What the owner heard may be Gemini
  *Live* dialogue, which is untested and differs from Gemini TTS.
- **No production path either way:** Gemini outputs must never become fine-tune, clone or prompt-audio data (Gemini
  API terms), and the clips are played to adult raters only.

---

## 7. If no Azure voice is indistinguishable: the ladder

Trigger: in the panel (§8), the best GA Azure arm's real-person rate is below the human anchor's with a 95% interval that
does not overlap, OR any reference arm beats every GA Azure arm on natural + native with a paired lower bound > 50%
(escalate to the owner; never add a vendor quietly).

1. **Tune and re-panel (1 week, ~$5).** Rate-equalised renders (§3.1 rates), lang-tag on/off, MAI style variants,
   gpt-4o-mini-tts `instructions` variants, PCM stimuli, 3 takes per cell, Voice Live B with `custom_lexicon_url`.
   No new vendor, no GPU.
2. **Azure Professional Voice: the production route.** Record once: a consenting professional Hindi-English voice
   artist under a work-for-hire contract that names synthetic use in a children's product, revocation and pay; ~2,000
   utterances (~50% classroom Hinglish written by our own script team as recording material, ~25% pure Hindi, ~15%
   Indian English, ~10% numbers and notation read the toSpoken way; 3-4 style sets of ~300: explaining, praise, gentle
   correction, calm question); 48 kHz / 24-bit, 3-4 h finished audio, about ₹1.5-4 lakh [E, unverified market rate].
   Microsoft requires Limited Access approval and a recorded consent statement: **apply now**, the lead time is unknown
   and it may be refused for a child-facing persona. hi-IN supports HD, multi-style, cross-lingual (one hi-IN set also
   speaks en-IN) [V, not re-verified in review]. Costs [V]: training $52/compute-hour (~$520 per voice), hosting
   $4.032/h per deployed model (~$2.9k/month always-on per voice, ~$5.9k for two), HD synthesis $48/M (₹73 per
   session-hour at 17.3k chars). Same SSML and API as today; works in Voice Live as a custom voice [U].
3. **Open TTS on Azure GPU: the hedge.** LoRA of **Veena** (Apache-2.0, native Hinglish, reads Latin English inside
   Hindi) or **Svara** (Apache-2.0, Orpheus-Hindi base) on the same recordings, about $5-40 per run on an A100 [E].
   Serving: an A100 VM in **Central India** ($5.142/h on demand [V]; serverless A100 is not offered in India), two
   warm replicas ~$7.5k/month, cheaper than DragonHD only above ~20-28 sustained concurrent sessions [E]. T4 cannot
   run the 3B codec models in real time (`t4-cannot-serve-3b-codec-tts`). Pilot first (~$70: TTFA, RTF and the
   concurrency knee from an Indian client), Azure Speech as automatic fallback, weights mirrored to ACR/Azure Files
   (never pulled from huggingface.co at runtime). Licence chain to record before shipping: Svara inherits the Llama 3.2
   Community Licence; Veena's four voices belong to real artists (get Maya's written confirmation of third-party
   commercial consent, or use only our own LoRA voice). Gate: an open voice must first reach the Azure leaders in the
   panel (Veena and Svara passage-b clips are in the shortlist block).
4. **Check before step 3:** whether Mistral **Voxtral TTS** (Hindi among 9 languages; CC BY-NC weights, so no self-host)
   is sold Direct from Azure on Foundry. If it is, it is a newest-model, production-legal arm for step 1.
5. **Never:** zero-shot cloning (Chatterbox, VoxCPM2, IndicF5) as the product voice; a clone of a real child or of a
   named teacher without a written agreement; Gemini or other reference output as training data.

Child-safety floor for every rung: "indistinguishable" is a naturalness target, not identity concealment. The winning
voice must pass the never-deny-AI battery on its lane, and children are asked "person or computer?" only after the
disclosure is restored (Round 2).

---

## 8. Human blind-test protocol

**Instrument.** `blind-test.html` (internal: all 282 v2 clips + shortlist aliases + catch trials, 361 entries in 11
blocks) and `blind-test-external.html` (357 entries: drops the four zero-shot clone clips, which cloned a real
Resemble speaker who never consented to us). Built by `make-blind-v2.py`; scored by `score-blind-v2.py`. The page holds
only codes, passage letters, block ids and a per-code playback gain; the unblinding file is `blind-key.json` (never
shared). Codes are fresh 5-letter randoms, so the codes printed in v2 reports cannot unblind anything.

**What the page does.** Per clip: play button with progress; ratings unlock once playback starts; four 1-5 sliders
(native Indian, natural, warmth, Hindi pronunciation; a slider counts only after it is touched) and "real person?
yes / no"; optional note. Order is shuffled per listener (seeded by listener id). Ratings save to localStorage as you go
(in-memory fallback with a warning); Export downloads JSON (`taxila-blind-test-ratings/v2`), Copy and Import also work.
Loudness: each clip carries a gain to -26 LUFS (measured with ffmpeg ebur128, peaks capped at -1 dBFS). Served over
http(s) the page applies it with WebAudio (boost and cut); opened as a file it can only attenuate, so 14 quiet clips
(down to -32.4 LUFS) play up to 6.4 dB low; serve it with `python3 -m http.server` from `v2/` for the panel.
Verified in headless Chromium over http and file://: renders at 375 px with no horizontal scroll, plays, rates, exports.

**Blocks.** B1-B10: the 282 clips split by a fixed shuffle (~28 each) + one degraded low anchor + one hidden repeat.
S (shortlist, 59): Priya HD/Flash, Kavya Flash, Dhruv Flash, Diya DragonHD plain and lang-tagged, Arjun and Meera
DragonHD lang-tagged, hi-IN Diya Dragon, gpt-4o-mini-tts marin, Gemini Kore (reference), Veena and Svara (passage b),
plus catches, all under alias codes distinct from the B blocks. Each listener does S plus one random B block (~45 min).

**Before the panel (blocking).**
1. Record the **human anchor**: one female and one male Indian teacher (consented, paid, adult), passages a-e, same
   chain (mono 24 kHz), then `python3 make-blind-v2.py --human <dir>` (files `<passage-id>-<name>.mp3`; they go into S
   and the B blocks). Without it "real person?" has no base rate.
2. **Pilot:** owner + 2-3 fluent Hindi listeners do block S. Drop unusable clips; check the -26 LUFS matching by ear.
3. Known residual leaks to accept or fix: reference clips are 64 kbps with fixed 150/400 ms edge pads, Azure clips 96
   kbps with native edges (codec and onset can be learned); one take per cell. Fix by re-rendering the shortlist as PCM,
   edge-trimmed, 3 takes, into a v3 folder (the v2 audio budget is spent: 58.8 MB of 60).
4. **Panel ethics note** before any child takes part (consent by a parent, recorded; where audio goes; deletion).

**Listeners.** Adults first: parents and teachers from the launch states, Hindi-belt and non-Hindi-belt, plus 3
teachers; >= 20 kept listeners and >= 800 judgments before any claim. Children only in Round 2, with guardian consent,
on `blind-test-child.html` (`--audience child`: Azure arms only, no Gemini or open-model clips), neutral labels, no
faces, no kinship framing.

**Exclusion (pre-registered, in `score-blind-v2.py`).** A clip counts only if >= 80% was heard and all five answers are
set. A listener is excluded if their degraded anchors average natural >= 3.5 or any is called a real person, or if their
hidden repeats differ from the source by > 1.5 points mean absolute.

**Decision rule.**
- Report each axis separately, never one MOS, with 95% bootstrap intervals that resample listeners.
- Voice choice within a lane: within-listener paired difference on the same passage; a voice wins only if the 95% lower
  bound of the paired preference is > 50% on natural AND native against each other arm in that lane
  (`voices-hindi.md` §6.3). Otherwise the result is "inconclusive" and the GA default in §4 stands.
- "Indistinguishable" may be written only if the human anchor is present, the voice's real-person rate interval overlaps
  the anchor's, and the n thresholds are met.
- The production slot goes to the best **GA Azure** arm. A Preview arm that wins becomes the "switch on GA" target. A
  reference that wins triggers §7 escalation, never a vendor swap.

**Round 2 (live system).** Same scripted child turns into lane A, lane B (Diya), lane C and GPT-Live-1; record the
replies; pairwise "which teacher would you rather learn from" and "person or computer?" after disclosure. This is where
lane B could lose (prosody that follows the child).

---

## 9. Not tested yet (the next render, in a v3 folder)

- **gpt-live-1 (`taxila-live`), gpt-realtime-2.1 (`taxila-realtime`), gpt-realtime-2.1-mini, gpt-audio-1.5** on passages
  a-e. Native voices were only rendered on the v1 pack's different passages (`../listening-samples.md`).
- **Voice Live B and C** on passages a-e (session shape in `../probe-voices-hindi.mjs` `laneVL`).
- **en-IN Indic Neural** (AartiIndic, ArjunIndic, NeerjaIndic, PrabhatIndic) and **hi-IN standard Neural** (Aarav,
  Ananya, Aarti, Arjun, Kavya, Kunal, Rehaan, Madhur): GA, $15/M, never swept.
- DragonHD at reduced `prosody rate` (does it honour 0.70-0.90?).
- AI judge on the 100 unrated Azure clips (needs ~$5 on the OpenRouter key; use the `:batch` judge slug at half price),
  then `judge-pairwise.mjs`; a non-Google discriminating judge (untested candidates in `reference-gemini.md` R9).
- Open models on passages a, c, d, e (only b exists), Veena as a full passage (it was sentence-by-sentence with 200 ms
  gaps), all through `stt/score.mjs` CER instead of the 10-slot count.

## 10. Rejected in v2 (do not retry without the stated change)

- **DragonHDOmni for production:** unlisted in `voices/list` (an undocumented name can vanish), TTFB tail to 8.7 s.
  Retry only if it is listed and its p90 is re-measured under 1 s.
- **A family-default style map:** `softvoice` on `hi-IN-Arjun:MAI` failed (HTTP 502 in the sweep, 400 in the review
  probe). Styles come only from each voice's `StyleList`.
- **Grant / Harper (MAI) as Indian teachers:** cross-lingual stock personas, not Indian voices.
- **gpt-audio as an audio judge** (already logged, `gpt-audio-not-a-judge`).
- **IndicF5 behind a Latin-script normaliser-less pipeline** (0/10 English terms), and any model scored only by
  gpt-4o-transcribe WER as evidence of naturalness.

## Files

- `blind-test.html`, `blind-test-external.html`, `blind-external-files.txt` (exactly what to ship externally),
  `blind/` (hard links + 5 degraded renders, 0.27 MB new audio), `blind-key.json` (sealed), `blind-test.template.html`,
  `make-blind-v2.py`, `score-blind-v2.py`.
- Source reports: `azure-speech-voices.md`, `reference-gemini.md`, `judge-summary.md`, `open-tts-on-azure.md`,
  `stt-hinglish.md`; routing: `../../models/MODEL-ROUTER.md`.
- Audio budget: `samples/` 56.7 MB + `stt/audio` 1.8 MB + new `blind/` 0.27 MB = 58.8 MB (hard links counted once).
