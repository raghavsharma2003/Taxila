# Language and social-studies engines for Taxila (English 1–9, Hindi, EVS 3–5, SST 6–9)

**Date:** 2026-10-02 · **Workstream:** content / language-sst-engines.
**Scope:**
- every topic in `data/curriculum/c{1..9}-english.json`, `c{6..9}-hindi.json` and `c{6..9}-sst.json` (228 topics);
- plus the 59 EVS/science topics that `science-engine-map.json` left as generic `map | sequence | story | scenario | sorter`. These engines are the implementation of those generic formats.

**Builds on (read first, not repeated):**
- `tech-and-market.md` §3–4: the T0/T1/T2 tiers, the sandbox and bridge, and image latency.
- `learning-science.md` §2.4 (dual coding, seductive details, songs only for verbatim content), §5.4 (Hinglish) and §7 (probes P1–P24).
- `maths-engines.md` §3 (probe specs, fading) and `science-engines.md` §2 (salience, facts not prose).
- `design/kids-ux-ages.md` (bands B1–B4, reading support R0–R2, karaoke captions, Devanagari typography).
- `shared/contracts.ts` (the bridge types that actually ship).

**Companion:** `language-sst-engine-map.json` maps all 228 topics to a primary engine plus up to 4 secondary engines, and lists the 59 absorbed generic topics. It is generated from the curriculum files by `language_sst_engine_map.py` (a rule table plus 26 named per-chapter overrides). Every count below comes from it.

| tag | meaning |
|---|---|
| **[V]** | checked this session against the primary source: the abstract or full text by DOI, the vendor documentation, or the government PDF |
| **[S]** | secondary: a sibling doc's citation or a summary |
| **[M]** | from memory of the literature or of the language, not re-checked. The session's web-search budget was exhausted before this workstream started, so verification was done by direct fetches of known DOIs and URLs. Check every [M] before it becomes a `context/` entry |
| **[U]** | our design hypothesis or estimate. Measure it (§7) |
| **[I]** | a design inference from this document |

---

## 0. TL;DR (decisions)

1. **13 engines: the 12 requested plus `source-card` for history sources. They are built on 4 shared kits, so the build is 4 kits plus 13 thin configs.**
   - `text-kit`: tokens, akshara segmentation, karaoke clock, speech window.
   - `tile-kit`: tap-to-slot tiles.
   - `card-kit`: ordering, bins and regions.
   - `map-kit`: map rendering and distance error, used by `map-explorer` only.

   Every topic in scope gets a primary engine in this set, except one (`c9-sst-ch16`, budgeting), which belongs to the maths `money`/`data-graphs` engines.
2. **Language chapters get a text-anchor engine, and skills get skill engines.** The curriculum files for English, Hindi and SST are titles only (`SOURCES.md`). So chapter-level mapping makes `rhythm-poem` (69 primary topics), `story-sequence` (53) and `read-along` (11 primary, **126 any**) look dominant. The skill engines (`phonics`, `word-builder`, `sentence-scramble`, `grammar-transform`) are never primary, because grammar and phonics strands are not in the seed.
   - **Fix the data, not the engines:** the English, Hindi and SST files need a skills layer: NIPUN Bharat FLN components for Classes 1–3, and grammar and vocabulary strands for 4–9.
   - Hindi for Classes 1–5 (*Sarangi*, *Veena*) was never built. That is exactly where `phonics@1` (varnamala and barahkhadi) lives. This is a **data gap that blocks a Hindi Class 1–2 launch**.
3. **The engine never grades language freely.**
   - Correctness comes from (a) deterministic rules: akshara composition, sandhi tables, Hindi agreement tables, timeline arithmetic, map geometry; or (b) a verified key (`accept[]`) built by the LLM, checked by a second pass, and stored in the kit (`KitItem.verified`).
   - An answer that is not in the key goes to a **closed-set** classification ("grammatical? same meaning?"), never to free grading (ARCHITECTURE §1.2, inherited law *a model never grades*).
4. **Reading is scored by Azure Pronunciation Assessment (PA) in the host, never in the iframe.**
   - PA lists **hi-IN and en-IN** **[V]**.
   - `EnableMiscue` returns word-level `Omission` / `Insertion` / `Mispronunciation` **[V]**. It works only in single-shot mode (audio of 30 s or less), so passages are segmented at **25 s or less** **[V]**.
   - Prosody and syllable scores are **en-US only** **[V]**. So Hindi fluency is measured as correct words per minute (WCPM) plus miscues, not by a prosody score.
   - **`AccuracyScore` and `Mispronunciation` are logged but carry no evidence** until they are calibrated on Indian children (M-L1/M-L2). Pronunciation is not accent: Indian English is the target variety, and en-IN is the locale.
5. **Karaoke timing is built offline, never live.**
   - Azure TTS raises `WordBoundary` with the audio offset and the text position for each word **[V]**.
   - For teacher-voice narration (gpt-4o-mini-tts, which gives no word events), timings come from offline forced alignment.
   - The host owns the audio clock and streams the position to the frame. The sandbox CSP in tech-and-market §3.4 has no `media-src`, so audio inside the frame would be blocked anyway.
6. **Maps: political boundaries come only from Survey of India data.**
   - DST's 2021 guidelines, clause xiii: "For political Maps of India of any scale including national, state and other boundaries, SoI published maps or SoI digital boundary data are the standard to be used" **[V]**.
   - The world layer uses Natural Earth's **India point-of-view** admin-0 file. It is public domain **[V]**, but its alignment with SoI is a legal check **[U]**.
   - The LLM may select feature IDs. It never produces geometry.
7. **Retrieval is the default map mode, not labelling.**
   - Carpenter & Pashler 2007: repeatedly showing a map with one feature deleted and having the learner recall it beat equal-time restudy on map drawing 30 min later (n = 50) **[V]**.
   - `map-explorer` therefore ships a `retrieve` mode, and its location error in km is a continuous metric, like PAE on the maths number line.
8. **Timelines:**
   - Ordinal picture timelines for B1–B2. Dates had little meaning before Grade 3, though children ordered pictures well (Barton & Levstik 1996, n = 58, K–6) **[V]**.
   - Linear dates from Class 3. BCE/CE from Class 6, with **no year zero**.
   - The curriculum misconception "BCE years count upward" (`c6-sst-ch04-t01`) is a deterministic detector.
9. **Grammar is taught by transforming sentences, not by labelling them.**
   - Writing meta-analysis: grammar instruction **d = −0.32**, sentence combining **d = +0.50** (Graham & Perin 2007, 123 documents) **[V]**.
   - Contextualised grammar RCT: e = 0.21, helping able writers more (Jones, Myhill & Bailey 2012) **[V]**.
   - So `grammar-transform` and `sentence-scramble` are manipulation engines. Terms are named after use.
10. **Poems: rhythm serves recitation, which is a verbatim outcome; meaning is taught by other engines.**
    - Music training → phonological awareness **d = 0.2**, growing with hours for rhyme, and **no** reliable effect on reading fluency (Gordon et al. 2015, 13 studies, n = 901) **[V]**.
    - Gesture reproduction beat pictures for productive L2 vocabulary in 5-year-olds (Tellier 2008, n = 20) **[V]**.
    - `rhythm-poem` therefore has beat, actions and vanishing-text retrieval, and links to `story-sequence` / `picture-word` for meaning.
    - No generated melody in the live path.
11. **Role-play is fictional and generic.** There is no first-person simulation of real or historical persons, real parties or religious figures. Stranger-safety scenarios are third person with choice chips. The child is never an NPC's target.
    - Drama-based pedagogy: positive achievement effect over 47 quasi-experiments, strongest when teacher-led, with more than five lessons, and integrated into language arts (Lee et al. 2015) **[V]**.
12. **Azure-only by construction (CLAUDE.md directive).** Every paid service these engines need is Azure first-party: scoring is Azure Speech PA; narration is Azure TTS or gpt-4o-mini-tts; images are gpt-image-2; closed-set checks run on taxila-fast. Natural Earth, SoI and StoryWeaver are *data and content*, not compute. Nothing here calls a third-party AI API.
13. **The three engine docs disagree on the contract.** The shipped `shared/contracts.ts` uses `interaction | answer | goal_met | stuck`. Maths uses `probe_*` events and `MC.` ids. Science uses `ModuleEventV2` with salience, Band A/B/C and lowercase `mc.` ids. **This doc targets the shipped types plus the smallest delta (§3), and flags the merge for the synthesis.**

---

## 1. Evidence → design rules

| finding | source | rule it forces |
|---|---|---|
| Systematic phonics d = 0.41 overall; **0.55 when begun early vs 0.27 after Grade 1**; synthetic and larger-unit phonics similar; small groups no worse than tutoring | Ehri, Nunes, Stahl & Willows 2001 (66 comparisons) **[V]** | `phonics@1` targets B1 (Classes 1–2) and remediation. In B3–B4 it is used only for TaRL-placed non-readers, with older-looking skins |
| Kannada akshara knowledge is acquired **more slowly** than alphabet knowledge in English, and phoneme awareness emerges later, in both low-achieving and effective schools | Nag 2007, ages 5–10 **[V]** | Hindi phonics is **akshara-first** (consonant × matra composition, barahkhadi), not phoneme-first. Mastery horizons run across years, so FSRS per akshara (kt-algorithms D2) |
| Devanagari is "partly phonemic and partly syllabic"; ि is written before the consonant but spoken after it | Vaid & Gupta 2002 **[V]** | Tiles compose in **logical** (spoken) order and the engine renders the visual order. Whether children write ि in spoken order is a handwriting issue, out of scope for tap tiles **[I]** |
| Morphological instruction helps, more for less able readers, no less for young children, and best combined with other literacy work | Bowers, Kirby & Deacon 2010 (22 studies) **[V]** | `word-builder` morph, sandhi and samaas modes from Class 3; always inside a lesson text, never as a standalone drill |
| Vocabulary interventions, pre-K–K: **d = 0.88**; larger with trained adults and explicit plus implicit teaching; author-made measures inflate; poorest at-risk children gained less | Marulis & Neuman 2010 (67 studies) **[V]** | `picture-word` is for explicit teaching inside a story (implicit). Gains are judged on **delayed, transfer** items (P10), never on the engine's own match score |
| Gesture *reproduction* > pictures for productive L2 words (5-year-olds) | Tellier 2008, n = 20 **[V]** | `actions[]` in `rhythm-poem` and `picture-word`: the child does the action. Camera-free; the teacher asks "dikhao" |
| Wordless picture-book narrative comprehension is a valid, developmental measure in K–2, including for pre-readers | Paris & Paris 2003 (n = 158, 91, ...) **[V]** | `story-sequence` with pictures only is legitimate comprehension evidence for R0 children. Kendall-tau distance is the metric |
| Grammar instruction d = −0.32 vs sentence combining +0.50 (Grades 4–12 writing) | Graham & Perin 2007 **[V]** | No "underline the noun" drills as a main activity. `grammar-transform` has a `combine` op. Labels follow use |
| Contextualised grammar RCT e = 0.21; benefits able writers more | Jones, Myhill & Bailey 2012 **[V]** | Weaker writers get transform ops with immediate model sentences (worked example), not open composition |
| Repeated reading raises fluency and comprehension, on the practised passage and as an intervention | Therrien 2004 **[V]** | `read-along`: `listen → echo → choral → solo` on the same passage, then a new passage (transfer) |
| Text-to-speech and read-aloud tools: comprehension g = 0.35 (students with reading difficulties) | Wood et al. 2018 **[V]** | Tap-to-hear on every token for R0/R1. Tap counts are logged as an **unknown-word signal**, not a penalty |
| Same-language subtitling: paragraph readers 25% → 56% with 30 min/week of subtitled film songs; syllable-synchronised highlighting | Kothari (Nielsen-ORG 2002–07) via kids-ux-ages **[S]** | Karaoke highlight at word level by default and **akshara level for R0/R1 Hindi** |
| NIPUN oral reading fluency benchmarks: **35–54 CWPM Hindi, 35–53 English** (Foundational Learning Study 2022); Vaachan Samiksha ORF ran for 2.5M students | Wadhwani AI **[V]** (grade mapping **[M]**) | `read-along.solo` computes WCPM against a per-class target from these bands |
| Music training → phonological awareness d = 0.2; rhyme effect grows with hours; no fluency effect | Gordon, Fehd & McCandliss 2015 **[V]** | Beat and rhyme in Classes 1–2 for phonological awareness. Never sell songs as reading or comprehension help |
| Rhyme categorisation and learning to read: a causal link | Bradley & Bryant 1983 **[V title; M finding]** | `rhyme-spot` mode in Classes 1–3 |
| Songs added for fun hurt (retention d = −0.30, transfer −0.48); songs help verbatim only | learning-science §2.4 (Rey 2012) **[S]** | `rhythm-poem` only carries a poem or a verbatim sequence (varnamala, months, states in order). No jingles about concepts |
| Map learning: covert retrieval of a deleted feature > restudy (n = 50) | Carpenter & Pashler 2007 **[V]** | `map-explorer.retrieve`; labelled-map viewing is only the first exposure |
| Before Grade 3, dates mean little; by Grade 5, dates link to knowledge; picture ordering is good at all ages | Barton & Levstik 1996 **[V]** | `timeline` scale: B1–B2 `ordinal` with pictures; `linear` dates from Class 3; `log` for deep time in Class 9 |
| Case comparison raises learning (meta-analysis) | Alfieri, Nokes-Malach & Schunn 2013 **[V title; d ≈ 0.50 M]** | `compare-venn` asks for **shared** features (intersection) as well as differences, and a reason for each shared item |
| Concept/knowledge maps: retention gains across 55 studies, Grade 4 to adult | Nesbit & Adesope 2006 **[V]** | Table and Venn layouts are built by the child, not shown pre-filled |
| Drama-based pedagogy: positive on achievement; strongest teacher-led, more than 5 lessons, in language arts or science | Lee, Patall, Cawthon & Steingut 2015 **[V]** | `role-play` is teacher-led (the voice teacher is the drama leader), recurring per unit, and in English and Hindi first |

**Binding rules for these engines (in addition to maths R1–R10 and the science §2 rules)**
- **LR1 Target-script purity.** In a language lesson the target text is never transliterated. Hindi reading is Devanagari only; English reading is Roman only. Glosses and instructions follow the child's medium (kids-ux §8.1). ASR text is script-normalised before display.
- **LR2 Content rights before content.** Every `TextUnit` carries `rights` (§3). Live T1 can only *select* library texts with `rights ∈ {pd, cc-by, original, licensed}`. It can write new practice sentences, but never reproduce NCERT text (tech-and-market §7.2).
- **LR3 Images are never live.** gpt-image-2 takes about 23 s per image. Story cards, vocabulary pictures and source photos come from the cache. A card set is `verified` (a vision check plus a human review that each card shows its caption) before it can be used as assessment. Unverified sets are retell-only.
- **LR4 Speech evidence is host-side and gated.** The iframe has no mic and no network. Speech scoring returns to the frame as `speech_result`. Low ASR confidence means no evidence (learning-science §7.2 rule 3).
- **LR5 Decodability by code.** Phonics and early read-along texts pass `decodable(inventory)`: every token's units are taught units, or the token is on the taught sight-word list.
- **LR6 Facts from a fact bank.** Dates, places and attributions in `timeline`, `map-explorer` and `source-card` must resolve to cited fact IDs. The LLM picks IDs; it does not author facts live.
- **LR7 Choices are diagnostic.** Every distractor has a `kind` (phonological, semantic, visual, L1, or a misconception ID), so a wrong choice is evidence about *which* confusion (P7).
- **LR8 Tap-first, with 64/96 dp targets in B1–B2** (kids-ux §0.4). Every drag has a tap twin. Long text never scrolls on the lesson stage. It pages by line or segment instead.

---

## 2. Prior art: what to copy, what to avoid

| product | what it gets right | Taxila use |
|---|---|---|
| Google Read Along (formerly Bolo) | offline on 1 GB RAM phones; listens to oral reading and helps when stuck; Hindi and English (kids-ux **[V]**) | **copy:** help-after-hesitation and word tap. **Reject:** stars and badges (reward economy, kids-ux §9) |
| Same-language subtitling (PlanetRead) | highlighting synchronised to the audio while the text is on screen (kids-ux **[S]**) | the `read-along` karaoke clock and akshara-level highlighting |
| Wadhwani Vaachan Samiksha | state-scale child ORF scoring (2.5M students) **[V]** | its published CWPM bands are a benchmark for M-L1. **No API use**: under the Azure-only directive (CLAUDE.md), all scoring runs on Azure Speech |
| Pratham TaRL / Read India | barakhadi chart; reading-level grouping (letter → word → paragraph → story, the ASER levels) **[M]** | `phonics` compose mode = interactive barakhadi; `Level.aser` is used for placement |
| StoryWeaver (Pratham Books) | levelled Hindi and English readers, openly licensed (CC BY 4.0 **[M: verify per book]**) | read-along and story-sequence library beyond the textbook, with attribution kept |
| Duolingo-style word banks | tap-to-slot sentence building (reference **[M]**) | `sentence-scramble` interaction, plus `acceptOrders` (they also accept multiple orders) |
| Seterra-style map quizzes | fast locate drills **[M]** | `locate` mode, but with the km-error metric and retrieval, not just a score |
| TimelineJS (Knight Lab, MPL-2.0 **[M]**) | readable timeline layout | design reference only; our engine needs BCE arithmetic and child editing |
| iCivics | civics role-play games (reference **[M]**) | scene structure (role, goal, consequence) for gram sabha and ward scenes; Indian institutions only |
| NCERT books | the textbook's own activities (gram sabha role-play, family timeline, harvest-festival comparison: these are the chapter hooks in the seed) | **use the book's own tasks as scene presets**, so Taxila agrees with school; write our own text |

The gap no product fills is the same one as in maths and science: a reading, map or role-play surface that **streams semantic events and misconception signals to a live voice teacher**. Read Along talks to the child but is not a tutor. The map quizzes have no tutor at all **[I]**.

---

## 3. Contract (deltas over `shared/contracts.ts`)

```ts
// packages/engines/lang/types.ts
export type Script = "deva" | "latn";
export type Locale = "hi-IN" | "en-IN";
export type L10n = { en: string; hi: string; "hi-Latn"?: string };
export type Band = "B1" | "B2" | "B3" | "B4";          // kids-ux §0.2. Science's A/B/C and maths' 6-9/10-15 map onto these (flag for the synthesis)
export type ReadSupport = "R0" | "R1" | "R2";
export type Rights = "pd" | "cc-by" | "original" | "licensed" | "ncert-excerpt"; // ncert-excerpt: not live-selectable (LR2)
export type MiscId = `MC.${string}`;                    // maths style; science uses lowercase "mc." (flag for the synthesis)

export interface Token { i: number; surface: string; norm: string /* NFC, script-normalised */;
  units?: string[];            // aksharas (deva) or graphemes (latn), from text-kit.segment()
  pos?: string; lemma?: string; gloss?: L10n; picture?: AssetRef; freqRank?: number }
export interface Timing { tok: number; startMs: number; endMs: number; unit?: number }  // unit = akshara index for R0/R1
export interface AudioRef { assetId: string; voice: string; rate: 0.8 | 1.0; timings: Timing[];
  timingSource: "tts-wordboundary" | "forced-alignment" }
export interface AssetRef { assetId: string; alt: L10n; verified: boolean; licence: string; source?: string }
export interface TextUnit { id: string; lang: Locale; script: Script; rights: Rights; attribution?: string;
  lines: Token[][]; audio?: AudioRef[]; level?: { aser?: "letter"|"word"|"para"|"story"; cwpmTarget?: number; lexBand?: 1|2|3|4|5 } }
export interface FactRef { factId: string; citation: string }   // LR6: dates, places, attributions

export interface LangManifestExt {        // merged into EngineManifest (maths §3.1)
  kits: ("text-kit" | "tile-kit" | "card-kit" | "map-kit")[];
  speech?: { mic: true; scorer: "pa-scripted" | "realtime-only"; maxSegSec: 25 };
  content: { liveFillable: string[]; libraryOnly: string[]; needsImages: boolean; needsTimings: boolean };   // param names
  validators: ("lexicon" | "decodable" | "script" | "rights" | "fact-bank" | "imageability" | "key-closure" | "safety" | "length")[];
}
```

**Events.** These are sent as the shipped `ModuleToHost` `{ type: "interaction", name, data }`, where `name` is namespaced (`rd.seg_result`, `mp.drop`). `data` is flat, with at most 12 keys of type string, number or boolean, plus `sal: 0|1|2` (science §2.2 salience). Probe commits use the shipped `answer` event (`value`, `correct`). `goal_met` and `stuck` (20 s idle or an exhausted hint ladder) are unchanged. Probe kinds and fading follow maths §3.1 and §3.4. The language "stages" are **support levels**, not concreteness: `full` (picture + audio + text), then `partial` (text, with audio on tap), then `none` (text only). This is scaffold fading, the reading analogue of the evidence above (Therrien; Wood) **[I]**.

**Host → module deltas** (add to `HostToModule`):
- `{type:"audio_pos", assetId, ms}`. The host plays audio and sends this at 4 Hz; the frame interpolates with requestAnimationFrame.
- `{type:"speech_start", segId}` and `{type:"speech_result", segId, words:[{tok, err:"none"|"omission"|"insertion"|"uncertain", offMs, durMs}], wcpm, conf}`.
- `{type:"record_answer", probeId, value, source:"voice"}`, from maths §3.3.

**Reading window (host).** It opens when the engine requests `solo`, `echo`, `cloze` or `perform`:
1. `session.update` sets `turn_detection.create_response=false`, so the teacher does not answer mid-sentence. The flag was already in the shipped VoiceLink config.
2. The same mic `MediaStream` is forked to the Azure Speech SDK: PA, scripted, `ReferenceText` = segment, `EnableMiscue=true`, `Granularity=Word`, locale per text.
3. Per segment (25 s or less) the host posts `speech_result` to the frame and an `interaction rd.seg_result` with salience 2 to the Director.
4. The window then closes and `create_response` is restored.

Speech-SDK auth needs a short-lived token from the server (`/api/speech/token`, new) **[U]**. Cost: PA is a $0.30/h add-on (tech-and-market **[V]**). Five minutes of reading per lesson is negligible.

**What the teacher sees.** A key=value line per milestone, never sentences (science §2.4). For example:
`[module m_7 read-along] seg=3 words=18 correct=15 omit=2 insert=0 uncertain=1 wcpm=41 target=45 taps=2 help=1 selfcorr=1`

---

## 4. Engine specifications

Each engine lists: what it covers; the params (zod-able TypeScript); child actions; events (the `name` values); detectors (`MiscId ← rule`, with the curriculum topic id where the seed lists the misconception); probes; and the live/offline split. All engines emit the common events in §3.

### L1 `phonics@1` · P0 for a Class 1–2 launch, else P1 · tile-kit + text-kit
**Covers:** varnamala (स्वर, व्यंजन by varga), barahkhadi (consonant × matra), akshara blending into words, matra minimal pairs, conjuncts and half-forms (क्ष त्र ज्ञ श्र, प्र vs पर्); English grapheme–phoneme correspondences (GPCs), CVC blending and segmenting, digraphs, split digraphs. Classes 1–2 in every chapter's secondary list (22 topics); Hindi Classes 1–2 once the curriculum gap (§0.2) is filled; remediation for TaRL-placed older children.
```ts
{ script: "deva" | "latn";
  mode: "grid" | "compose" | "blend" | "segment" | "swap" | "conjunct";
  inventory: string[];                    // units taught so far → LR5 decodability gate
  items: { word: string; units: string[]; picture?: AssetRef; distractorUnits?: { u: string; misc?: MiscId }[] }[]; // ≤ 6
  grid?: { layout: "varga" | "frequency"; showArticulation: boolean };   // varga = कवर्ग…पवर्ग rows; articulation icons B2+
  audio: "unit-recordings" | "teacher";   // isolated sounds are curated recordings, never TTS (TTS says letter names) [U]
  maxOptions: 2 | 3; tracing: boolean }   // tracing = finger-trace on a letter, B1 only
```
- **Actions:** tap a unit to hear it; drag or tap a matra onto a consonant (क + ि → कि); build a word from aksharas (क + म + ल → कमल, the primer's no-matra words first **[M]**); hear a word and pick its units; swap one unit to make a new word (कल → काल; cat → cot → cut).
- **Events:** `ph.tap {unit}` · `ph.compose {cons, matra, result, ok}` · `ph.blend {units, ok, ms}` · `ph.segment {word, chosen, ok, err_pos}` · `ph.swap {from, to, pos, ok}`.
- **Detectors:**
  - `MC.HIN.MATRA_LENGTH ← ि/ी or ु/ू swapped in compose/segment` (hrasva/dirgha, the commonest Hindi spelling error **[M]**)
  - `MC.HIN.NASAL ← ं vs ँ swapped`
  - `MC.HIN.REPHA_RAKAR ← र्क chosen for क्र (or the reverse)`
  - `MC.HIN.HALF_FORM ← full consonant chosen where a half-form is needed`
  - `MC.ENG.LETTER_NAME ← letter names used to blend (bee-ay-tee)` (voice relayed via `record_answer`)
  - `MC.ENG.FIRST_UNIT_GUESS ← first unit right, rest wrong, across ≥ 3 items`
  - `MC.ENG.SHORT_VOWEL ← a/u or e/i swaps in segment`
  - `MC.ENG.BD ← b/d confusions in visually-similar distractors`
  - Indian-English accent features (v/w, dental t/d) are **never** detectors.
- **Probes:** contrast (कल/काल pairs), translate (sound → units, units → picture), diagnose (each distractor maps to a misconception), construct ("make three words with म"). **Support levels:** picture + sound on every unit, then sound on tap, then units only.
- **Live/offline:** live T1 fills `items` from the inventory (validators: decodable, lexicon, script). Unit recordings are a fixed library (about 60 Hindi and 44 English units **[U]**).

### L2 `word-builder@1` · P1 · tile-kit
**Covers:** spelling by tiles; morphology (un-, -ness, -ful; Hindi उपसर्ग/प्रत्यय: अ+सफल, सुंदर+ता); compounds (sun+flower; समास: राज+पुत्र); sandhi joining and splitting (विद्या + आलय → विद्यालय); word and rhyme families; the "new words" outcome of every chapter (106 topics as secondary).
```ts
{ lang: Locale; mode: "spell" | "morph" | "compound" | "sandhi-join" | "sandhi-split" | "family";
  parts: { text: string; role: "prefix" | "root" | "suffix" | "unit" | "word"; gloss?: L10n }[];
  targets: { word: string; parts: number[]; meaning?: L10n; rule?: "dirgha" | "guna" | "vriddhi" | "yan" | "ayadi" | string }[];
  allowOpen: boolean;                  // child builds any word; accepted if in the lexicon, then the teacher asks its meaning
  lexicon: string;                     // graded word list id (en C1-5, C6-9; hi C6-9)
  showRule: "never" | "after" | "always" }
```
- **Actions:** pick tiles into slots; split a word with a "cut" tap; flip the rule card after building.
- **Events:** `wb.build {result, ok, inLexicon, parts}` · `wb.split {word, cut_at, ok}`.
- **Detectors:**
  - `MC.HIN.SANDHI_CONCAT ← parts concatenated without the vowel change (विद्याआलय)`
  - `MC.HIN.UPSARG_PRATYAY ← prefix used as suffix or the reverse`
  - `MC.ENG.SUFFIX_SPELLING ← happy+ness → "happyness"`
  - `MC.ENG.PREFIX_MEANING ← un- or dis- chosen as an intensifier in a meaning probe`
  - `MC.HIN.MATRA_LENGTH` (shared with L1)
- **Correctness:** NFC string equality against the targets or the lexicon. Sandhi uses a deterministic rule table for the 5 vowel-sandhi classes plus a reviewed exception list **[M]**.
- **Live/offline:** live T1 is safe. The lexicon and rule tables are bundled.

### L3 `sentence-scramble@1` · P1 · tile-kit
**Covers:** word order, punctuation and capitalisation; question formation from statements; Hindi SOV vs English SVO; sentence-level retell of stories (22 topics, Classes 1–5, as secondary; also mounted per grammar strand).
```ts
{ lang: Locale; tokens: string[]; target: string[]; acceptOrders: string[][];  // all valid orders (key closure, offline check)
  chunking: "word" | "phrase"; punctuation: boolean; capitalise: boolean;
  mode: "order" | "question-from-statement" | "meaning-first";   // meaning-first: gloss/picture shown, build the sentence that means it
  meaning?: { gloss?: L10n; picture?: AssetRef };
  distractorTokens?: { text: string; misc: MiscId }[];   // e.g. an extra "is" for no-inversion
  maxTokens: 9 | 14 }                                    // B1-B2 | B3-B4
```
- **Events:** `ss.place {tok, slot}` · `ss.submit {order, inAccept, first_wrong_slot, moves, ms}` · `ss.unlisted {order}`. An unlisted order goes to the Director's closed-set check (grammatical? same meaning?). If yes, it is accepted and queued for key review.
- **Detectors:**
  - `MC.ENG.VERB_FINAL ← verb or auxiliary placed last (L1 SOV transfer)`
  - `MC.ENG.NO_INVERSION ← wh-question built subject-before-auxiliary` (an Indian English feature: taught as "the school form", never as an error in speech **[I]**)
  - `MC.ENG.ARTICLE_DROP ← article tile left unused or placed after the noun`
  - `MC.HIN.VERB_MEDIAL ← Hindi verb placed mid-sentence (English order)`
  - `MC.HIN.POSTPOSITION_FIRST ← में/का placed before the noun`
- **Probes:** contrast (two orders, one changes the meaning: "Dog bites man" vs "Man bites dog"), translate (picture → sentence).
- **Live/offline:** live T1 with `key-closure`, which requires at least one listed order and rejects specs where a permutation check (taxila-fast, closed set) finds an unlisted valid order **[U: 1–2 s budget]**.

### L4 `story-sequence@1` · P0 · card-kit
**Covers:** picture and sentence story ordering, "what happens next" prediction, missing card, cause-and-effect links, retelling, and process chains (pot-making, fibre to fabric, farm to plate, cotton to cloth, an election). **53 primary topics + 24 absorbed** generic `story` and `sequence` topics.
```ts
{ cards: { id: string; picture?: AssetRef; text?: TextUnit; audio?: AudioRef }[];   // 3–8; 3–4 for B1
  correctOrder: string[]; acceptOrders?: string[][];
  mode: "order" | "next" | "missing" | "cause" | "retell" | "process";
  links?: { from: string; to: string; kind: "then" | "because" | "so" }[];         // cause mode: child draws arrows
  revealText: "never" | "after_order" | "always"; showNumbers: boolean;
  verifiedSet: boolean }                                                           // LR3; false ⇒ retell only, no evidence
```
- **Events:** `sq.move` (salience 0) · `sq.submit {order, tau, first_err, adj_swaps}` · `sq.link {from, to, kind, ok}` · `sq.retell {cards_hit, order_ok, ms}`. Retell coverage comes from the Director's closed-set match of the child's speech against card captions.
- **Detectors:**
  - `MC.NARR.ENDS_ONLY ← first and last right, middle scrambled (≥ 2 sets)`
  - `MC.NARR.SURFACE_CUE ← adjacent cards ordered by visual similarity, not event`
  - `MC.NARR.CAUSE_EFFECT_SWAP ← link arrow reversed`
  - `MC.PROC.STEP_SKIP ← process card omitted in retell or placed after its dependent`
- **Metric:** normalised Kendall-tau distance, a continuous comprehension score.
- **Probes:** predict (`next` before reveal, P5), translate (order → oral retell, P14), teach-back (P1: retell to a "younger" character).
- **Live/offline:** card art is library-only. One reference character sheet per story; gpt-image-2 edits keep the character consistent; a vision check confirms each card shows its caption, then human review. Text-only sets (Classes 6–9) are live-fillable from the lesson text, with sentences sampled from licensed or original text (LR2).
- **Evidence:** Paris & Paris 2003 **[V]**.

### L5 `picture-word@1` · P1 · card-kit
**Covers:** imageable vocabulary (body parts, animals, food, places, tools), audio ↔ picture ↔ word matching, memory pairs, minimal-pair listening (34 topics, mostly Classes 1–3; also Class 6 *Spices*).
```ts
{ lang: Locale; mode: "pic>word" | "word>pic" | "audio>pic" | "audio>word" | "pairs";
  items: { word: string; picture: AssetRef; audio?: AudioRef; gloss?: L10n; action?: string }[];   // action → gesture icon (Tellier)
  distractors: { word: string; picture?: AssetRef; kind: "phon" | "sem" | "visual" | "l1"; misc?: MiscId }[];
  maxOptions: 2 | 3 | 4; imageabilityMin: 4;   // 1–7 scale; abstract words (duty, honesty) are rejected by the validator
  showL1Gloss: boolean }
```
- **Events:** `pw.choose {target, chosen, kind, ms}` · `pw.pair {a, b, ok}` · `pw.say {word, ok}` (via `record_answer`).
- **Detectors:** the distractor `kind` *is* the diagnosis:
  - `MC.VOC.PHON ← cap/cat type confusions (≥ 2)`: listening or decoding, not meaning.
  - `MC.VOC.SEM ← dog for cat`: knows the category, not the word.
  - `MC.VOC.L1 ← false-friend or translation-equivalent errors`.
- **Probes:** diagnose (P7), translate (picture → say it), delayed retrieval of the same items next session (P10, FSRS per item).
- **Live/offline:** pictures library-only, about 1,500 imageable words for Classes 1–5 **[U]**. Live T1 picks items and distractors from tagged words.
- **Evidence:** Marulis & Neuman 2010 **[V]**; Tellier 2008 **[V]**.

### L6 `read-along@1` · P0 · text-kit + host speech window
**Covers:** listening with karaoke, echo reading, choral reading, solo reading with miscue scoring, cloze reading; WCPM; tap-to-hear. Primary for 11 topics, secondary for **126**: nearly every prose, letter and play text, and every poem's first pass.
```ts
{ text: TextUnit;
  mode: "listen" | "echo" | "choral" | "solo" | "cloze";
  highlight: "word" | "akshara" | "line";        // akshara default for Hindi R0/R1 (SLS)
  rate: 0.8 | 1.0;                               // pre-rendered at both rates; no live time-stretch
  segMaxSec: 25;                                 // PA single-shot limit [V]
  tapToHear: boolean; glossOnTap: boolean;
  scoring?: { locale: Locale; useAccuracy: false; helpAfterMs: 3000; cwpmTarget?: number };
  clozeEvery?: number;                           // cloze: every nth content word is withheld
  comprehension?: string[] }                     // follow-on module ids (story-sequence, picture-word)
```
- **Actions:** play or pause; tap a word to hear it; read aloud during the reading window; at the line end, say "phir se" (again) to the teacher.
- **Events:**
  - `rd.play {seg, rate}`
  - `rd.tap {tok, freq}` (an unknown-word signal)
  - `rd.hesitate {tok, ms}`: at 3 s or more, the engine highlights the word and plays it, and the word counts as an error for WCPM, the standard ORF convention **[M]**
  - `rd.seg_result {seg, words, correct, omit, insert, uncertain, selfcorr, help, wcpm, ms}` (salience 2)
- **Detectors:**
  - `MC.READ.FIRST_UNIT_GUESS ← substitutions share the first unit but differ in the rest`
  - `MC.READ.SKIP_UNKNOWN ← omissions concentrated on low-frequency words`
  - `MC.READ.WORD_BY_WORD ← accuracy ≥ 95% but WCPM < 60% of the target` (a fluency problem, not decoding)
  - Self-corrections are a *positive* signal (P16).
- **Probes:** cloze (P3-like near transfer), "main idea in a few words" after the passage (P11), delayed reread for WCPM gain (P10).
- **Live/offline:** library-only: the text, rights, audio and timings are built offline. Timings come from TTS `WordBoundary` **[V]**, or from forced alignment of teacher-voice audio. The live path selects a passage by `level` and objective.
- **Evidence:** Therrien 2004 **[V]**, Wood et al. 2018 **[V]**, SLS **[S]**, NIPUN CWPM **[V]**, Azure PA **[V]**.

### L7 `grammar-transform@1` · P1 · tile-kit
**Covers:**
- English: tense, number, negation, yes/no and wh-questions, passive voice, reported speech, sentence combining.
- Hindi: वचन (number), लिंग (gender), काल (tense), the ने construction, कारक postpositions, and honorific आप.

These are the "vocabulary and grammar items" outcome of every Class 4–9 chapter (68 topics as secondary; mounted per grammar strand).
```ts
type GrammarOp = "tense:past" | "tense:present" | "tense:future" | "tense:perfect" | "number" | "negate"
  | "question:yn" | "question:wh" | "voice:passive" | "voice:active" | "reported" | "combine"
  | "hi:vachan" | "hi:ling" | "hi:kaal" | "hi:ne" | "hi:karak" | "hi:aadar";
{ lang: Locale; source: string[]; op: GrammarOp;
  tray: { text: string; misc?: MiscId }[];   // candidate forms, incl. diagnostic distractors (did go / did went / goed)
  accept: string[][];                        // verified key (KitItem.verified)
  combine?: { second: string[]; connectors: string[] };    // because / so / although / जो…वह
  contrastPair?: boolean;                    // show two sentences differing only in the target feature (P8)
  showRule: "never" | "after" | "always"; workedFirst: boolean }   // workedFirst for weaker writers (Jones 2012)
```
- **Actions:** tap a tile to swap in a tray form; insert or delete a tile; reorder; for `combine`, drop a connector between two sentences.
- **Events:** `gt.edit {slot, from, to}` · `gt.submit {result, ok, first_err_slot, edits}`.
- **Detectors:**
  - `MC.ENG.DOUBLE_PAST ← did + past form`
  - `MC.ENG.OVERREG ← -ed on an irregular verb / -s on an irregular plural`
  - `MC.ENG.SV_AGREE ← 3sg -s missing or extra`
  - `MC.ENG.REPORT_NO_BACKSHIFT`
  - `MC.ENG.REPORT_PRONOUN ← pronoun not shifted`
  - `MC.ENG.PASSIVE_NO_BE`
  - `MC.HIN.NE_AGREEMENT ← verb agrees with the ergative subject (लड़के ने रोटी खाया)` **[M: linguistics]**
  - `MC.HIN.OBLIQUE ← direct form before a postposition (लड़का को)`
  - `MC.HIN.ADJ_AGREE ← अच्छा/अच्छी/अच्छे mismatch`
  - `MC.HIN.AADAR ← आप with a singular verb`
- **Correctness:** the key, plus deterministic agreement tables (Hindi gender and number paradigms; an English irregular verb list).
- **Probes:** contrast, spot-the-error (P6, only after mastery), construct (combine two sentences in two ways).
- **Live/offline:** live T1 is allowed for ops with closed paradigms (number, gender, tense, negation, ne). `reported`, `voice` and `combine` keys come from the kit (offline, second-pass verified), because they have many valid outputs.

### S1 `map-explorer@1` · P0 · map-kit
**Covers:** India's states and UTs and their capitals; major rivers; physical regions; climate and rainfall regions; latitude and longitude (Ujjain meridian, Tropic of Cancer, IST meridian); continents and oceans; neighbours and cross-border rivers; historical sites, routes and approximate extents; pilgrimage and trade routes; population density; schematic local maps (a walk to school, a neighbourhood gali). **26 primary + 9 absorbed** generic `map` topics.
```ts
{ basemap: "india" | "world" | "region" | "schematic";
  projection: "equirect" | "lcc-india";   // equirect for lat/long lessons (straight graticule)
  layers: ("states" | "capitals" | "rivers" | "relief" | "climate" | "rainfall" | "graticule" | "neighbours"
           | "sites" | "routes" | "density" | "extent" | "networks" | "continents" | "oceans")[];
  targets: string[];                      // feature ids ONLY (LR6); geometry is never LLM output
  mode: "explore" | "locate" | "name" | "trace" | "route" | "retrieve" | "direction" | "coordinate" | "overlay";
  labels: "all" | "targets" | "none"; tolKm: number;   // hit tolerance; small states get a lens (M-L7)
  time?: { slice: string; approx: true; factRef: FactRef };   // historical extents are "approximate", reviewed T2 only
  schematic?: { grid: [number, number]; places: { id: string; label: L10n; icon: string; cell: [number, number] }[] } }
```
- **Actions:** tap a region or point; drop a pin; trace a river from source to mouth (ordered checkpoints); connect route stops; pick a compass direction; read or plot a lat/long.
- **Events:** `mp.tap {feature, target, hit, dist_km}` · `mp.drop {feature, dist_km, region_ok}` · `mp.trace {feature, coverage, order_ok, reversed}` · `mp.dir {from, to, answer, ok}` · `mp.coord {lat, lon, err_deg, swapped}`.
- **Detectors:**
  - `MC.SST.LATLONG_SAME ← lat and long swapped in coordinate mode, or a meridian traced when a parallel was asked` (c6-sst-ch01-t01)
  - `MC.SST.INDIA_CONTINENT ← India tapped for "Asia", or a continent label dropped on India` (c6-sst-ch02-t01)
  - `MC.EVS.RIVER_FROM_SEA ← trace drawn mouth → source` (c5-evs-ch02-t01; primary owner is `water-cycle@1`)
  - `MC.EVS.DESERT_HOT ← Thar chosen for "cold desert"` (c4-evs-ch09-t01)
  - `MC.EVS.ONE_LANGUAGE ← Hindi chosen for every state in a language overlay` (c5-evs-ch05-t01)
  - `MC.GEO.NORTH_UP ← direction errors only on rotated maps`
  - `MC.GEO.CAPITAL_SWAP`
- **Metric:** median km error per region, a spatial PAE; it is a proxy, not a lever.
- **Probes:** retrieve (P10-style within a session: a feature is deleted and the child restores it), predict ("where will it rain most?" before the rainfall overlay, P5), contrast (two overlays).
- **Data:**
  - SoI boundary data for India and its states (DST 2021 xiii **[V]**).
  - Natural Earth India POV for the world layer, rivers and relief **[V; legal check U]**.
  - Simplified TopoJSON, about 150 kB gzipped for India **[U]**.
  - Feature IDs are stable (`IN-UP`, `RIV-GANGA`).
- **Legal and sensitivity:** no alternative boundary styles; no LLM-drawn shapes; extents are captioned "approximate".

### S2 `timeline@1` · P1 (P0 for a Class 6+ SST launch) · card-kit
**Covers:** before/after picture timelines (B1–B2); family and personal timelines (the c6-sst-ch04 hook); dated events; BCE/CE; centuries; durations; parallel lanes for dynasties and regions; deep time on a log scale (c9 early humans); biographies (English biographies are timeline-primary). 18 primary, 36 any.
```ts
type Year = { y: number; era: "BCE" | "CE" };     // never 0; internally 1 BCE ↦ 0 only for distance arithmetic
{ scale: "ordinal" | "linear" | "log"; range: { from: Year; to: Year };
  events: { id: string; label: L10n; when?: Year | { from: Year; to: Year }; approx?: boolean; picture?: AssetRef;
            lane?: string; fact: FactRef }[];                 // LR6
  lanes?: { id: string; label: L10n }[];
  mode: "before-after" | "order" | "place" | "read" | "duration" | "century";
  snapYears: number; showCenturies: boolean;
  personal?: { ephemeral: true } }                            // the child's own events: not stored after the session without consent
```
- **Events:** `tl.order {tau}` · `tl.place {event, placed, actual, err_years, rel_err}` · `tl.duration {answer, actual}` · `tl.century {year, answer, actual}`.
- **Detectors:**
  - `MC.SST.BCE_UP ← 300 BCE placed right of 200 BCE, or a BCE→BCE duration computed in the wrong direction` (c6-sst-ch04-t01)
  - `MC.HIST.YEAR_ZERO ← 1 BCE → 1 CE given as 2 years`
  - `MC.HIST.CENTURY_OFF ← 1857 → "18th century"`
  - `MC.HIST.EVEN_GAPS ← events spaced evenly in place mode (ordinal thinking)`
  - `MC.HIST.DEEP_TIME ← Harappa placed near the Mauryas`
- **Probes:** predict ("how long ago?" before the reveal), translate (dates ↔ positions, sharing the integer intuition with maths `number-line`, but with no zero), contrast (the same events on two scales).
- **Evidence:** Barton & Levstik 1996 **[V]**.

### S3 `compare-venn@1` · P0 · card-kit
**Covers:** two- and three-set Venns, disjoint sorting (the absorbed `sorter` format), attribute tables for 2–4 items, and odd one out. Examples: weather vs climate; mountain, plateau and plain; haat, mall and online; Nagara vs Dravida; rights vs duties; kharif vs rabi; renewable vs non-renewable; Sattriya and Bihu; types of government. **18 primary + 18 absorbed** sorter topics.
```ts
{ mode: "venn2" | "venn3" | "sort" | "table" | "odd-one-out";
  sets: { id: string; label: L10n; picture?: AssetRef }[];                 // 2–4
  items: { id: string; label: L10n; picture?: AssetRef; truth: string[]; misc?: MiscId; fact?: FactRef }[];   // ≤ 8 B1-B2, ≤ 12 B3-B4
  attributes?: { id: string; label: L10n }[];                              // table mode
  requireReason: "shared" | "all" | "none";    // spoken reason for intersection placements (Director closed-set)
  allowNew: boolean }                           // the child proposes an item by voice, classified against the sets
```
- **Events:** `cv.place {item, region, ok, truth}` · `cv.reason {item, ok}` · `cv.done {acc, shared_acc, exclusive_acc}`.
- **Detectors:**
  - `MC.CMP.ALL_SHARED ← overuse of the intersection`
  - `MC.CMP.NONE_SHARED ← the intersection is never used: contrast without comparison`
  - `MC.SST.WEATHER_CLIMATE ← "today it will rain" placed in climate` (c7-sst-ch02-t01, c9-sst-ch03-t01)
  - `MC.SST.UNPAID_NOT_WORK ← home cooking placed outside "work"` (c6-sst-ch13-t01)
  - `MC.SST.RIGHTS_NO_DUTIES` (c8-sst-ch12-t01)
  - `MC.EVS.SAME_FESTIVAL` (c3-evs-ch03-t01)
  - `MC.EVS.SHINY_METAL` (c3-evs-ch10-t01)
  - `MC.EVS.PLASTIC_ROTS` (c3-evs-ch12-t02)
  - `MC.ECO.MONEY_INTRINSIC` (c7-sst-ch11-t01; via a "what gives a note value" table)
- **Probes:** contrast (P8), diagnose (item → region), near transfer (a new item at the end).
- **Live/offline:** live T1 is allowed. Items must carry `truth`, and contested items are rejected by a validator rule (no item whose truth is "depends" unless `requireReason: "all"`).

### X1 `role-play@1` · P0 · scene card + Director
**Covers:**
- Language functions: greet, request, apologise, ask for help, shop, receive guests.
- Literary scenes from the plays, ekanki and dialogues: read your part, then improvise.
- Interview chapters, where the child is the interviewer.
- Civic simulations: gram sabha, a ward complaint, Lok Adalat, a polling booth, Question Hour, barter at a haat, pricing at a mandi, the ₹100 choice, a canteen business plan.
- Third-person safety scenarios (the absorbed `scenario` topics).

**24 primary + 8 absorbed.**
```ts
{ scene: { id: string; title: L10n; setting: L10n; picture?: AssetRef; register: "formal" | "informal" | "mixed" };
  roles: { id: string; name: L10n; kind: "npc" | "child"; voice: "teacher" | `tts:${string}`;
           persona: string /* ≤ 200 chars, a shape not lines */; fictional: true }[];
  goals: { id: string; say: L10n; check: { intents: string[] } | { slot: string; values?: string[] } }[];
  beats: { id: string; npcMove: string /* shape */; next: { onIntent: string; to: string }[] }[];   // ≤ 8 beats
  langTarget?: { lang: Locale; functions: string[]; vocab: string[] };
  civic?: { process: string; probes: MiscId[] };
  script?: TextUnit;                       // read-your-part mode for plays (rights per LR2)
  maxTurns: number;
  safety: { thirdPersonOnly: boolean; noRealPersons: true; noStrangerContact: true } }
```
- **Mechanics:** NPC lines are spoken by the teacher in character, with an on-screen character card (name, role, picture). Scripted NPC lines can be pre-rendered TTS in a second voice. The child speaks freely. The Director classifies each turn against `goals` and `next` intents (closed set). The module only shows the scene, the speaker, the goal checklist and choice chips (the fallback when ASR confidence is low).
- **Events:** `rp.turn {beat, intent, slots, lang_mix, words}` · `rp.goal {goal}` · `rp.exit {reason, turns}`.
- **Detectors:**
  - `MC.CIV.WRONG_AUTHORITY ← the MP, MLA or PM asked about a streetlight or garbage pile` (c6-sst-ch12 hook)
  - `MC.ECO.SHOPKEEPER_PRICE ← as a seller in a glut, keeps the price high and expects sales` (c9-sst-ch09-t01)
  - `MC.ECO.MONEY_INTRINSIC ← in the barter → money scene` (c7-sst-ch11-t01)
  - `MC.LANG.REGISTER ← तू/informal forms used to an elder or official`
  - `MC.EVS.STRANGER_SAFE ← in a third-person choice, picks "go with the helpful stranger"` (c3-evs-ch02-t02). This triggers the safety-teaching branch, not a score.
- **Safety:**
  - No first-person play of real people. In an interview chapter, the "interviewee" answers only with attributed text from the lesson.
  - No real parties, leaders, communities-in-conflict or religious figures.
  - Abuse and stranger scenarios are always third person ("What should Bela do?").
- **Evidence:** Lee et al. 2015 **[V]**.

### X2 `rhythm-poem@1` · P0 · text-kit
**Covers:** every poem, pad and doha (46 English + 22 Hindi primary + Kabir/Tukaram in c8-sst-ch15); action rhymes for Classes 1–2; varnamala and other verbatim chants; rhyme spotting; vanishing-text memorisation; doha matra counting (Classes 6–9: रहीम के दोहे, कबीर के दोहे).
```ts
{ poem: TextUnit;                                         // rights: pd | licensed | original (LR2)
  meter?: { kind: "free" | "stress" | "matra"; pattern?: number[] };   // doha: [13, 11, 13, 11] per half-line pair [S]
  beat: { bpm: number /* 60–110 */; taal?: "keherwa-8" | "dadra-6" | "none"; accentEvery: number; click: "soft" | "none" };
  mode: "listen" | "echo-line" | "clap" | "rhyme-spot" | "fill-gap" | "perform" | "matra-count";
  actions?: { line: number; gesture: string }[];
  gaps?: { schedule: "vanishing"; maxFrac: number };      // more words hidden each pass (retrieval, P10-in-session)
  meaningModule?: string }                                // comprehension lives in another engine (story-sequence / picture-word)
```
- **Events:** `rh.clap {beat, offset_ms}` (salience 0, aggregated) · `rh.line {line, completeness, omit}` · `rh.gap {tok, ok}` · `rh.rhyme {pair, ok}` · `rh.matra {line, counted, actual}`.
- **Detectors:**
  - `MC.POEM.LINE_SKIP`
  - `MC.POEM.RHYME_BY_SPELLING ← bough/cough judged as rhyming`
  - `MC.HIN.MATRA_WEIGHT ← syllable before a conjunct counted laghu (1) instead of guru (2)`
  - Beat-offset spread is logged only, never a misconception.
- **Correctness:** matra counts come from a deterministic laghu/guru scanner (long vowel, anusvara or visarga, or a following conjunct gives guru) **[M]**, with a teacher-reviewed key per doha for exceptions.
- **No melody generation in the live path.** The stack has no music model. The teacher chants over a WebAudio beat (no assets, under 2 kB). Sung versions are licensed recordings or original compositions, reviewed offline.
- **Evidence:** learning-science §2.4 **[S]**; Gordon 2015 **[V]**; Tellier 2008 **[V]**.

### S4 `source-card@1` · P2 · card-kit
**Covers:** historians' sources (c6-sst-ch04): inscriptions, coins (the c7-sst-ch06 hook), artefacts (Harappan seals), text excerpts (Arthashastra, c9-sst-ch14), cave art (Bhimbetka). Tasks: observe, infer, question, date, corroborate. 4 primary, 18 any.
```ts
{ source: { kind: "inscription" | "coin" | "artefact" | "text" | "picture" | "map"; asset: AssetRef;
            provenance: { where: L10n; when: Year | { from: Year; to: Year }; approx: boolean; fact: FactRef };
            transcript?: TextUnit; hotspots?: { id: string; box: [number, number, number, number]; label: L10n }[] };
  claims: { id: string; text: L10n; support: "shows" | "does_not" | "cannot_tell" }[];
  tasks: ("observe" | "infer" | "question" | "date" | "corroborate")[]; pair?: string /* second source id */ }
```
- **Events:** `sc.hotspot {id}` · `sc.claim {claim, chosen, truth}` · `sc.question {intent}`.
- **Detectors:** `MC.HIST.SOURCE_TELLS_ALL ← "cannot tell" claims marked "shows"` (overclaiming from evidence) · `MC.HIST.OLD_IS_TRUE ← a later source preferred only because it is older or "official"` **[M]**.
- **Evidence:** the sourcing heuristic (Wineburg) and the *Reading Like a Historian* curriculum (Reisman 2012) **[M]**. Photos come from Wikimedia, ASI or museums, with the per-file licence kept (tech-and-market §4).

---

## 5. Coverage (computed from `language-sst-engine-map.json`)

**Primary engine by subject**

| subject (topics) | rhythm-poem | story-seq | read-along | role-play | map | timeline | compare | picture-word | source-card | external |
|---|---|---|---|---|---|---|---|---|---|---|
| English (118) | 46 | 38 | 5 | 9 | 7 | 7 | 2 | 4 | 0 | 0 |
| Hindi 6–9 (45) | 22 | 10 | 6 | 4 | 2 | 0 | 1 | 0 | 0 | 0 |
| SST 6–9 (65) | 1 | 5 | 0 | 11 | 17 | 11 | 15 | 0 | 4 | 1 (`maths:money`) |
| **absorbed EVS/science (59)** | – | 24 (16 story, 8 sequence) | – | 8 (scenario) | 9 (map) | – | 18 (sorter) | – | – | – |

The 59 absorbed topics split into 36 EVS (Classes 3–5) and 23 science (Classes 6–9).

**Engine load**

| engine | tier | primary | any | + absorbed | classes |
|---|---|---|---|---|---|
| rhythm-poem | P0 | 69 | 70 | – | 1–9 |
| story-sequence | P0 | 53 | 77 | 24 | 1–9 |
| map-explorer | P0 | 26 | 53 | 9 | 2–9 |
| role-play | P0 | 24 | 81 | 8 | 1–9 |
| compare-venn | P0 | 18 | 49 | 18 | 1–9 |
| read-along | P0 | 11 | **126** | – | 1–9 |
| timeline | P1 (P0 if SST launch) | 18 | 36 | – | 3–4, 6–9 |
| phonics | P0 for a C1–2 launch, else P1 | 0 | 22 | – | 1–2 (+ Hindi 1–2 once built) |
| word-builder | P1 | 0 | 106 | – | 1–9 |
| grammar-transform | P1 | 0 | 68 | – | 4–9 |
| picture-word | P1 | 4 | 34 | – | 1–3, 6 |
| sentence-scramble | P1 | 0 | 22 | – | 1–5 |
| source-card | P2 | 4 | 18 | – | 6–9 |

How to read this:
- The skill engines show zero primary topics **because of the data, not the pedagogy** (§0.2). Their real load is per skill strand. It can only be computed once the English and Hindi files gain skill-level topics (NIPUN FLN components for Classes 1–3; grammar and vocabulary strands for 4–9).
- The seed lists only **9 misconceptions** across all English, Hindi and SST topics (all in SST). Every one has a named detector above. Eight are deterministic rules over taps and placements; the price misconception (c9-sst-ch09) runs over the role-play's price slots. The `MC.HIN.*`, `MC.ENG.*`, `MC.READ.*` and `MC.NARR.*` detectors are this doc's additions, mostly **[M]**. They need a kit-level misconception file with sources before they move mastery (learning-science §7.2: a detector only schedules a verifying probe).

---

## 6. Content pipeline, live/offline split and cost

| engine | live T1 fills (1–3 s) | library only (offline T0/T2, reviewed) | validators |
|---|---|---|---|
| phonics | items from the inventory | unit recordings, grid layout | decodable, lexicon, script |
| word-builder | parts, targets | lexicons, sandhi tables | lexicon, script |
| sentence-scramble | tokens, accept orders | – | key-closure, length, safety |
| story-sequence | text-only card sets (C6–9) | picture card sets, character sheets | rights, imageability (vision), safety |
| picture-word | item and distractor selection | pictures (~1.5k words) | imageability, lexicon |
| read-along | passage *selection* | text, rights, audio at 0.8 and 1.0 rates, timings | rights, decodable (R0/R1) |
| grammar-transform | closed-paradigm ops | reported, voice and combine keys | key, agreement tables |
| map-explorer | targets, mode, layers | geometry, feature IDs, extents | fact-bank, feature-id |
| timeline | event selection | fact bank with citations | fact-bank |
| compare-venn | sets, items, truth | – | safety, contested-item |
| role-play | beats and intents within a scene template | scene templates, NPC TTS lines | safety, no-real-persons |
| rhythm-poem | mode, gaps, beat | poem text, rights, audio, timings, matra keys | rights |
| source-card | claim selection | photos, provenance, transcripts | fact-bank, licence |

**Timing pipeline.**
1. Narration text goes to TTS at two rates.
2. For Azure neural voices, timings come from the `WordBoundary` audio offsets (ticks) and text positions **[V]**.
3. For teacher-voice audio (gpt-4o-mini-tts), timings come from offline forced alignment using Azure STT word offsets (100-ns units, as in PA results **[V]**).
4. `text-kit.segment()` then maps word timings to akshara timings by proportional split within each word **[I]**.
5. The output is stored as `AudioRef.timings`.

The read-along "book voice" may be a distinct storyteller voice, which is diegetically fine, if forced alignment of the teacher voice proves poor (M-L4).

**Akshara segmentation.** Use `Intl.Segmenter` (grapheme) and then merge across virama + consonant into one akshara, so that क्ष and त्र are single tiles. Unicode's newer Indic conjunct rule (GB9c) may make the merge unnecessary on new WebViews, but the merge step stays for old Android WebViews **[M; test M-L5]**.

**Image cost.** About 18 images per Class 1–3 chapter (6 story cards and 12 vocabulary pictures) at gpt-image-2 medium (~$0.053 each, tech-and-market §4) is about **$1 per chapter**, or about $40 for the Class 1–3 English chapters **[derived]**. Human review time, not tokens, is the real cost **[U]**.

**Rights.** These are design inputs, not legal advice; get counsel (tech-and-market §7.2).
- NCERT prose and poems: rights per text. Not live-selectable until licensed.
- Bhakti-era poets (Kabir, Rahim, Surdas, Meera), Tagore and Subhadra Kumari Chauhan: likely public domain under India's life + 60 years term **[M: verify per text and translation]**.
- StoryWeaver: CC BY with attribution **[M]**.
- Taxila originals: original texts written on the chapter themes, which carry the most practice load.

---

## 7. Build order and the measurements that gate it

**Kits first (about 7 engineer-weeks [U]):**
- `text-kit`: tokeniser, akshara segmenter, Devanagari font and matra-clipping QA (kids-ux §8.2), karaoke clock synced from `audio_pos`, tap-to-hear, speech-window client.
- `tile-kit`: slots, tray, tap twin for every drag, NFC compose.
- `card-kit`: ordering, bins, Venn regions, lanes.
- `map-kit`: TopoJSON renderer, lens for small states, distance metric.

**Then** P0 (read-along, story-sequence, rhythm-poem, map-explorer, compare-venn, role-play), followed by P1 and P2. Total about **30 engineer-weeks** including the kits **[U]**, excluding content review.

| id | measurement | method | gates |
|---|---|---|---|
| M-L1 | PA miscue validity on Indian children | ≥ 30 children × {hi, en} × 3 passages; 2 human raters per word (omission, insertion, substitution); κ(PA, human) vs κ(human, human) | using `rd.seg_result` as mastery evidence |
| M-L2 | PA accent bias | AccuracyScore distribution by home region at equal human-rated correctness | `useAccuracy` stays false unless no bias is found |
| M-L3 | reading-window turn-taking | false teacher barge-ins per minute with `create_response=false`; resume latency | `solo` and `perform` modes |
| M-L4 | forced-alignment quality for teacher-voice TTS | timing error vs hand-marked boundaries (target ≤ 80 ms median) **[U]** | teacher voice vs storyteller voice for the book |
| M-L5 | akshara segmentation in WebView | conjunct test set (क्ष त्र ज्ञ श्र द्ध, repha) on Android WebView versions in the 2–3 GB device pool | text-kit merge step |
| M-L6 | story-card validity | vision-check vs human agreement on "card shows caption"; child accuracy on verified vs unverified sets | `verifiedSet` gate |
| M-L7 | map targeting on a 360 dp-wide screen | miss rate for Goa, Sikkim, Tripura, Delhi, Puducherry, Lakshadweep, with and without the lens | lens and `tolKm` defaults |
| M-L8 | grammar key coverage | % of child answers outside `accept` that humans judge correct (target < 3%) | live T1 for closed ops |
| M-L9 | role-play intent classification | closed-set accuracy on child Hinglish turns vs human, per band | civic scenes as evidence |
| M-L10 | vanishing-text vs repeated listening | A/B, recitation completeness after 2 days (delayed) | the `fill-gap` default |

---

## 8. Risks and open questions

- **Child speech scoring is unproven for Indian children.** PA's accuracy model is not described for child or accented speech **[U]**. Until M-L1 passes, reading evidence is teacher-heard (the realtime model) plus tap signals only.
- **Maps are a legal surface.** The Natural Earth India POV is public domain, but whether it aligns with SoI data needs a check. Use SoI data for India wherever it is available.
- **History is politically contested** (the new books' medieval chapters are publicly debated) **[M]**:
  - Teach the textbook's content faithfully and attribute claims to it ("aapki kitaab kehti hai").
  - Keep role-play out of conflict roles.
  - Keep extents and dates in the reviewed fact bank.
- **Copyright** of NCERT texts limits read-along and recitation of the actual chapter text until licensed (LR2).
- **Data gaps.** There are no Hindi Class 1–5 files and no skill layer. Both are needed before Hindi phonics and the grammar engines can be prioritised from data.
- **Contract divergence** across the maths, science and language docs (§0.13) must be resolved once, in `shared/contracts.ts`, before any engine is built.

---

## Sources

**Verified this session [V]**
- Literature: Ehri, Nunes, Stahl & Willows (2001), RER: [10.3102/00346543071003393](https://doi.org/10.3102/00346543071003393) · Graham & Perin (2007), J Ed Psych: [10.1037/0022-0663.99.3.445](https://doi.org/10.1037/0022-0663.99.3.445) · Jones, Myhill & Bailey (2012/13), Reading and Writing: [10.1007/s11145-012-9416-1](https://doi.org/10.1007/s11145-012-9416-1) · Bowers, Kirby & Deacon (2010), RER: [10.3102/0034654309359353](https://doi.org/10.3102/0034654309359353) · Marulis & Neuman (2010), RER: [10.3102/0034654310377087](https://doi.org/10.3102/0034654310377087) · Tellier (2008), Gesture: [10.1075/gest.8.2.06tel](https://doi.org/10.1075/gest.8.2.06tel) · Paris & Paris (2003), RRQ: [10.1598/RRQ.38.1.3](https://doi.org/10.1598/RRQ.38.1.3) · Therrien (2004), RASE: [10.1177/07419325040250040801](https://doi.org/10.1177/07419325040250040801) · Wood, Moxley, Tighe & Wagner (2018), J Learn Disabil: [10.1177/0022219416688170](https://doi.org/10.1177/0022219416688170) · Gordon, Fehd & McCandliss (2015), Front Psychol: [10.3389/fpsyg.2015.01777](https://doi.org/10.3389/fpsyg.2015.01777) · Nag (2007), J Res Reading: [10.1111/j.1467-9817.2006.00329.x](https://doi.org/10.1111/j.1467-9817.2006.00329.x) · Vaid & Gupta (2002), Brain and Language: [10.1006/brln.2001.2556](https://doi.org/10.1006/brln.2001.2556) · Carpenter & Pashler (2007), PB&R: [10.3758/BF03194092](https://doi.org/10.3758/BF03194092) · Barton & Levstik (1996), AERJ: [10.3102/00028312033002419](https://doi.org/10.3102/00028312033002419) · Nesbit & Adesope (2006), RER: [10.3102/00346543076003413](https://doi.org/10.3102/00346543076003413) · Lee, Patall, Cawthon & Steingut (2015), RER: [10.3102/0034654314540477](https://doi.org/10.3102/0034654314540477)
- Microsoft Learn, [Use pronunciation assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment) (EnableMiscue, ErrorType, 30 s single-shot, prosody en-US only) and the [PA locale table](https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/ai-services/speech-service/includes/language-support/pronunciation-assessment.md) (hi-IN, en-IN)
- Microsoft Learn, [speech synthesis events include](https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/ai-services/speech-service/includes/how-to/speech-synthesis/events.md) (`WordBoundary`)
- DST, [Guidelines for acquiring and producing Geospatial Data … including Maps](https://dst.gov.in/sites/default/files/Final%20Approved%20Guidelines%20on%20Geospatial%20Data.pdf) (15 Feb 2021), clause xiii
- Natural Earth, [Admin 0 point-of-views](https://www.naturalearthdata.com/blog/admin-0-countries-point-of-views/) (India POV, v5.1.1) and [terms of use](https://www.naturalearthdata.com/about/terms-of-use/) (public domain)
- Wadhwani AI, [Vaachan Samiksha](https://www.wadhwaniai.org/vaachan-samiksha-leveraging-ai-to-bridge-the-literacy-divide/) (NIPUN CWPM bands)

**Title and venue verified, finding from memory or abstract unavailable**
- Alfieri, Nokes-Malach & Schunn (2013): [10.1080/00461520.2013.775712](https://doi.org/10.1080/00461520.2013.775712)
- Bradley & Bryant (1983), Nature: [10.1038/301419a0](https://doi.org/10.1038/301419a0)
- Kothari (2008): [10.1007/s11159-008-9110-3](https://doi.org/10.1007/s11159-008-9110-3)
- Kothari, Pandey & Chudgar (2004): [10.1162/1544752043971170](https://doi.org/10.1162/1544752043971170)

**Secondary [S]:** [Doha (poetry)](https://en.wikipedia.org/wiki/Doha_(poetry)) (13+11 matra structure); the sibling docs as cited inline.

**Memory [M], to verify:** NIPUN Bharat FLN components; ASER reading levels; Pratham barakhadi pedagogy; StoryWeaver licence; Hindi ergative (ने) agreement and the sandhi classes; laghu/guru scansion rules; Wineburg sourcing and Reisman 2012; TimelineJS licence; Indian copyright term (life + 60).
