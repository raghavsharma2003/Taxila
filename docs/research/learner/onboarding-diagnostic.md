# Onboarding diagnostic: the first 10-15 minutes as a conversation that places, reads and listens

2026-10-02 · scope: the child's first session, designed as one engine that yields **knowledge priors, reading level, language mix, interest tags and vibe priors**, with item counts, stopping rules, game/chat framing for a 6-year-old and a 14-year-old, and TaRL grouping inside a one-child product.

**Builds on, does not repeat:** `learning-science.md` (rules 1, 22, 25-29; §5.2-5.4; probes P1-P24; DPDP 9(3)), `learner/kt-algorithms.md` (§3.4 CAT, §3.5 θ→pL0, §1.2 emissions), `learner/need-goals.md` (§4.5 grade scale, §5.4 intake I0-I5, §5.5 placement), `learner/vibe-temperament.md` (knobs, modes, VI1-VI11), `design/onboarding-flow.md` (C1-C6, M-ONB-*), `design/kids-ux-ages.md` (bands B1-B4, reading support R0-R2). **This doc's job:** those four docs specify parts of the same 10 minutes and **disagree** on the item model, the stopping rule, the GE origin and feedback. §9 resolves each conflict. Everything else here is new depth.

**Tags:** **[V]** read in the primary source this session · **[V-abs]** abstract only · **[V-title]** existence and title checked (DOI), content from memory · **[S]** secondary · **[M]** memory, check before build · **[U]** untested design number · **[Sim]** from `onboarding-cat-sim.mjs` (a model of children, not children). **Method:** the session's web-search budget was exhausted before this task began. Sources were fetched by known URL (ASER 2024 tasks PDF, the Mindspark NBER paper's Appendix C, the TaRL NBER paper, Azure Speech docs, ORF norms, the CMI paper) or resolved through Crossref, Semantic Scholar and Europe PMC. Item counts and stopping rules come from a seeded simulation, `docs/research/learner/onboarding-cat-sim.mjs` (seeded, about 45 s to run, output byte-identical across runs), not from argument.

**Authoring law:** anything the teacher "says" appears below as a *shape* (`⟨slot⟩`), never a line. Stack: TypeScript, Neon Postgres, Azure OpenAI (gpt-5.6 / gpt-realtime-2.1) and **Azure AI Speech** (an Azure service, inside the Azure-only directive).

---

## 0. Decisions on one screen

| id | decision | why (evidence) | reverse if |
|---|---|---|---|
| OD1 | **One engine:** a success-first Bayesian CAT on the need-goals grade scale. ASER ladders are its *item families* for foundational strands; they are not a separate scoring rule | The ASER ladder (2/2 per rung) used about 5.6 items and was no better than an 8-item CAT. It was worse when the child sat far below the prior: 40% placed > 1 GE too high [Sim T1] | M-OD-1: the ladder matches the CAT within 1 rung in ≥ 90% of children *and* is preferred by children |
| OD2 | **Item counts per strand in session 1: B1 ≤ 6, B2 ≤ 7, B3-B4 ≤ 8, plus ≤ 4 on the current school chapter (B3-B4).** Placement stays provisional until about 16 items, reached through just-in-time items in lessons 2-3 | 8 items: 78% within 1 GE; 16 items: 91%; 24 items: 96% [Sim T7]. SD < 0.35 (kt-algorithms §3.4) is **unreachable in 12 items**: mean posterior SD was 0.52-0.63 [Sim T1] | measured time per item lets 12 items fit with no drop-off cost (M-OD-9) |
| OD3 | **Stop a strand** on child exit, strain (2 in a row), time cap, item cap, SD < 0.55 after ≥ 4 items, predicted SD gain < 0.03 (PSER), or a confirmed ladder bracket. **Always close on a success** | PSER uses items only where they help (Choi, Grady & Dodd [V-abs]). Exit and strain rules follow vibe VI10 and P20 | early-stop rate by band > 15% (M-ONB-6) → shorten caps |
| OD4 | **Mixture prior** (on-track 0.6, far-behind 0.4). **Teaching starts at the posterior's 30th percentile.** KT priors use the *whole* posterior | Single prior, Delhi-like child: 28% placed > 1 GE too high. Mixture + q30: **7%** (2% if matched). Too-low starts (12-30%) are recovered by fast-forward in lesson 1 [Sim T6] | M-OD-10: first-lesson foundation items show P(correct) > 0.9 for > 40% of children (too conservative) |
| OD5 | **Success-first targeting:** first item P ≈ 0.85, then 0.70 after a right answer and 0.80 after a wrong one | P(correct) experienced: 0.72 vs 0.48. Runs of ≥ 3 wrong: 8% vs 44%. Cost: RMSE 0.80 vs 0.67 at 8 items [Sim T1]. The **easier adaptive test gave higher engagement and lower anxiety, with no performance difference** (Ling et al. 2017, middle school) [V-abs] | M-OD-5 shows no comfort gain over max-information targeting in Indian children |
| OD6 | **Feedback by band:** B3-B4 get light, immediate correctness feedback. B1-B2 get asymmetric feedback: a specific celebration when right; when wrong, the story moves on with no verdict | Immediate correctness feedback **raised performance across all test types** (Ling 2017) [V-abs]. This conflicts with onboarding-flow's neutral-ack rule (§9 C3) | M-OD-5 arm results per band |
| OD7 | **Reading uses Azure AI Speech pronunciation assessment** (scripted, `hi-IN`/`en-IN`, miscue on, ≤ 30 s chunks) for ASER-style ladders and a 30 s oral-reading-fluency (ORF) read. Tap-receptive and maze fallbacks; ASR alone **never lowers** a reading level | `hi-IN` and `en-IN` are supported locales; `EnableMiscue` gives Omission/Insertion and needs ≤ 30 s per call [V]. Child-ASR is the weakest link (learning-science §5.4) | M-OD-2 agreement with a human scorer κ < 0.7 → tap-only reading until a better model exists |
| OD8 | **Language mix is measured from the child's own talk** (code-mixing index + matrix language + one receptive-English check). It becomes a *proposed setting* the parent confirms, not a stored behavioural estimate | Two Hinglishes exist (Hindi matrix vs English matrix; teacher-discourse DL1). A parent's tile is a prior, not the child's mix | M-OD-7: estimator accuracy < 0.85 on matrix language |
| OD9 | **Interests:** 2-3 rounds of picture choices plus (10-15) one open question, mapped to a **closed vocabulary**, kept as Beta tags. Persisted only under P3 | Rule 25; situational vs individual interest (Hidi & Renninger 2006) [V-title]: session-1 picks are triggered interest, so they are hypotheses | M-OD-8: top tag at week 3 ≠ onboarding tag in > 60% of children → drop the rounds to 1 |
| OD10 | **Vibe from session 1: only explicit picks persist** (address term; one "mode" pick for B3-B4). Observed signals seed the session state only | Session 1 is the noisiest session (a stranger, a parent nearby, novelty). The vibe doc needs ≥ 8 effective outcomes and ≥ 2 sessions before any band moves | never: this follows the vibe doc's hysteresis law |
| OD11 | **Misconception diagnosis is not an onboarding goal.** A distractor hit only files a probe request | Mindspark ran **30 decimal comparisons per child** to diagnose misconceptions, and each error pattern occurred in only 3-5% of children [V] | — |
| OD12 | **The child chooses items:** one of two isomorphic items (B1-B2, as ASER does), or "warm-up or spicy" (B3-B4, engine-bounded) | ASER lets the child pick the paragraph, words or problem [V]. Self-adapted testing (examinee picks the difficulty) was proposed as performance-improving and anxiety-reducing (Rocklin & O'Donnell 1987; Wise et al. 1994) [V-title; finding M] | M-OD-6: choice arms show worse placement and no comfort gain |

---

## 1. Evidence that changes the design

### 1.1 How existing diagnostics place a child

| product / tool | shape | items · minutes | what Taxila takes | what it rejects |
|---|---|---|---|---|
| **ASER 2024** (Pratham) [V] | One-on-one oral "floor test": "record the highest level that each child can comfortably achieve". Reading: letters → words ("2 letters and 1 or 2 matras") → Std I paragraph ("4 simple linked sentences, each having no more than 6 words") → Std II story ("7-10 sentences"). **Starts at the paragraph**; the child chooses which. Paragraph or story level = reads "like she is reading sentences", "fluently and with ease, even if... slowly", "3 or less than 3 mistakes". Letters and words: "at least 4 out of the 5" (child-chosen). Maths: 1-9 → 11-99 → 2-digit subtraction with borrowing → 3-digit ÷ 1-digit (quotient and remainder both correct). **Starts at subtraction**; a careless mistake gets "another chance with the same question". Testers "build rapport", give "sufficient time" | about 4-10 tasks, 5-10 min [M for time] | mid-start, child choice, 4-of-5 sets, a second chance on careless slips, sentence-level fluency, ending at the best level | its items ("All Rights Reserved"); paper-and-tester dependence; only two subjects |
| **TaRL** (Banerjee et al., NBER w22746) [V] | Teachers "administered a brief oral assessment of each student's reading ability in Hindi"; children in grades 3-5 were "reassigned to ability-based groups and physically moved"; camps in **10-day rounds**; content "designed to move children to the next level on the ASER test". Effects vanished where grouping did not happen | ASER tool | level groups as *paths*; re-level every round; grouping enforced in code | grade-locked classes |
| **Mindspark** (Muralidharan, Singh & Ganimian; NBER w22923, App. C) [V] | Diagnostic in maths and Hindi: "four to five questions per grade level", "from grade 1 up to their grade level". ≥ 75% at grade level → up to 2 grades higher; ≤ 25% one grade above → stop. Its levels are "only used to customize the first set of content"; later adaptation ignores them. Bank 45,000+ items; Class 6 average 2.5 grades behind in maths, 0.5 in Hindi; Class 9: 4.5 and 2.5; **5-6 grade levels span one class** | Class 6 child: about 24-30 items | the diagnostic only seeds; performance takes over; misconception analysis needs volume | bottom-up from Grade 1 (too long for a first session; too many too-easy items for a teen) |
| i-Ready / MAP Growth / Star / ALEKS | K-12 adaptive; "criterion-referenced grade-level placements" (i-Ready) [V]; MAP about 40-53 items, Star about 27-34 items in about 20 min, ALEKS first check about 20-30 items [M] | 20-50 items, 20-45 min | proof that classic CATs spend 20+ items to place a child | sitting a child through a 40-minute test on day 1 |
| Math Garden / Rekentuin (Klinkenberg et al. 2011) [V-title] | Elo-style on-the-fly ability and difficulty, practice targeted to a high success rate (about 75% [M]) | continuous | success-first targeting and online item calibration | visible speed scoring for 6-9 (kt-algorithms §3.3) |
| Prodigy, Duolingo | placement embedded in play (Prodigy battles [M]); Duolingo "starts off easy and gets harder" (onboarding-flow [V]) | a few minutes | placement hidden inside the first real activity | reward economies (rule 27) |

### 1.2 Psychometrics that bind a 10-minute CAT
- **Targeting cost is quadratic near 0.5.** Information retained at success probability P (2PL) is 4P(1−P): 0.84 at P = 0.7, 0.75 at 0.75, 0.64 at 0.8 [Sim T4, analytic]. Success-first at about 0.75 costs about 1.3× items. Bergstrom, Lunz & Gershon (1992) studied exactly this trade-off [V-title].
- **Stopping rules:** fixed length, a minimum-SE threshold, minimum information, and predicted standard error reduction (PSER), which "administer[s] fewer items when predictive gains in information are small" (Choi et al., EPM 2011) [V-abs]. Babcock & Weiss (2012) argue for variable length with min and max bounds [V-title]. Liu & Weiss (2026) simulate how stopping rules interact with the estimator (MLE, WLE, MAP, EAP) [V-abs; the truncated abstract did not include conclusions]. Taxila uses EAP on a grid throughout, so a stopping rule tuned here must be re-checked if the estimator changes.
- **Low stakes means low effort,** above all for teens: "low student motivation is associated with a substantial decrease in test performance" (Wise & DeMars 2005) [V-abs]. Rapid guesses can be flagged by response-time effort (Wise & Kong 2005) [V-title]. In Taxila, timing is used **in-session only** (NM-3) to discard a rapid tap as evidence, never stored.
- **Children answer slowly and ASR drops turns.** The sim assumes 25 s per oral item for 6-9 and 18 s for 10-15 (taps 18 s and 14 s), with 15-25% of oral answers lost to low ASR confidence [U]. A lost answer costs time and carries no evidence (learning-science §7.2 rule 3).

### 1.3 Framing: game or chat, not test
- **Evaluative framing hurts the children Taxila most wants.** Low-SES 6-9-year-olds did worse on Raven's matrices when it was framed as an ability test than when it was framed as a game (Désert, Préaux & Jund 2009) [V-title; finding M]. The word "test" is banned (onboarding-flow G-ONB-2) for a measured reason, not a cosmetic one.
- **Gamified assessment can stay valid.** In 33 studies, "gamified tests were typically validated successfully, although mixed-domain measurement was a problem" (Lumsden et al. 2016) [V-abs]. So one game frame per strand; a frame never mixes two skills inside one item.
- **Teens reject babyishness** (NN/g via kids-ux §1 [V there]), so the 14-year-old's frame is *honest speed and autonomy*, not a mascot story (§4.2).
- **Choice:** ASER's child-chosen items [V], plus self-adapted testing [V-title], plus SDT autonomy (learning-science §3.7).

### 1.4 Reading
- ASER levels and criteria are as quoted in §1.1 [V]. Within-sentence fluency ("not a string of words") is the paragraph criterion, not speed.
- **Words per minute does not travel across languages.** Graham & van Ginkel (2014), "the value and limits of 'words per minute'" [V-title]: Hindi is akshara-based, and English is an L2 for most Taxila children. US L1 norms (Hasbrouck & Tindal 2017, 50th percentile: Grade 1 spring 60, Grade 2 fall/spring 50/100, Grade 3 83/112, Grade 6 132/146 WCPM) [V] are **ceiling anchors only**. NIPUN Bharat targets for Hindi (about 45-60 WCPM at Class 2; ≥ 60 at Class 3) are [M]. Bands, not numbers, reach anyone (§6.1).
- **Azure AI Speech pronunciation assessment** [V]: a scripted "reading scenario" with `ReferenceText` returns Accuracy, Fluency and Completeness (prosody `en-US` only) and per-word `ErrorType` ∈ {Omission, Insertion, Mispronunciation, UnexpectedBreak, MissingBreak, Monotone}. Mispronunciation is flagged when word accuracy < 60. Miscue works only in single-shot mode (≤ 30 s), so passages are **read in sentence-sized chunks** with karaoke highlighting. Locales include `hi-IN`, `en-IN` and `ta-IN`. No child-speech accuracy is published [U → M-OD-2].
- **CBM maze** (Fuchs & Fuchs 1992) [V-title]: every 7th word becomes a 3-way choice, read silently [M]. It is tap-only, so it needs no ASR, and it suits B3-B4.

### 1.5 Language mix
- **Code-Mixing Index** (Gambäck & Das 2016) [V]: for an utterance x with N language-dependent tokens, t_Li tokens per language and P alternation points, `Cu(x) = 100 · [w_m·(N − max_i t_Li) + w_p·P] / N`, with w_m + w_p = 1. Cu = 0 for a monolingual utterance.
- Children switch more than adults: 60.7% vs 36.7% of utterances are intra-sentential (HiACC, via learning-science) [V there]. The two Hinglish matrices (teacher-discourse §1) mean the estimator must classify the **matrix**, not only count English.
- **Script trap:** Devanagari ASR transliterates English words (gurukul §3.6), so a romanised lexicon measured 0 switching there. Token language ID must be script-aware (§6.2).

---

## 2. Output contract (`shared/onboarding.ts`, pure)

```ts
import type { Placement, Strand } from "./need";            // need-goals §4.1 (extended below)
import type { ExplicitPref } from "../src/learner/vibe/types";
export type Band = "B1" | "B2" | "B3" | "B4";                // kids-ux: 6-7, 8-9, 10-12, 13-15
export interface StrandPosterior { strand: Strand; grid: Float32Array; mean: number; sd: number; q30: number; q40: number;
  nEvid: number; prior: "mix" | "single"; stop: StopReason; }
export interface KnowledgeSeed {
  posteriors: StrandPosterior[];
  startAt: Partial<Record<Strand, number>>;                  // teaching start on the GE scale: q30 (B1-B3), q40 (B4) [U]
  unplaced: { strand: Strand; mean: number; sd: number; via: Strand; rho: number }[];   // §3.6 borrowing
  aserBand: Partial<Record<"maths" | "read_hi" | "read_en", AserBand>>;
  probeRequests: { skillId: string; reason: "distractor_hit" | "why_mismatch" }[];       // OD11
}
export type AserBand = "beginner" | "letter" | "word" | "para" | "story" | "num1_9" | "num11_99" | "sub" | "div" | "beyond";
export interface ReadingSeed {
  support: "R0" | "R1" | "R2";                               // kids-ux UI setting, never a label
  byLang: { lang: "hi" | "en"; aser: AserBand; wcpmBand?: "<20" | "20-44" | "45-59" | "60-89" | "90+";
            comp?: { literal: 0 | 1; inference: 0 | 1 }; maze?: number /* correct per min */; method: ("azure_pa" | "tap" | "maze")[] }[];
  readGE: { mean: number; sd: number };
}
export interface LanguageSeed {
  parentSet: "hi" | "hinglish" | "en" | "other";
  pMatrixEn: { a: number; b: number }; enTokenRate: number; cmiMedian: number; nUtt: number;
  receptiveEn: "ok" | "partial" | "no" | "untested";
  proposed: { matrix: "hi" | "en"; enInsertion: "low" | "mid" | "high"; terms: "en_labels" | "medium_terms" };
  status: "proposed" | "parent_confirmed" | "parent_changed";
}
export interface InterestTag { id: InterestId; a: number; b: number; src: ("tile" | "volunteered" | "elaborated")[]; at: string }
export interface VibeSeed { explicit: ExplicitPref[];       // persisted (vibe_explicit)
  session: { warmupTurns: number; medWords: number; humour: "play" | "neutral" | "neg" | null;
             spicyTaken: number; spicyOffered: number; retryAfterError: number; corrections: number } }   // never persisted (NM-3)
export interface OnboardingResult { runId: string; childId: string; band: Band; minutes: number;
  completed: "full" | "partial" | "child_stopped"; knowledge: KnowledgeSeed; reading: ReadingSeed;
  language: LanguageSeed; interests: InterestTag[]; vibe: VibeSeed;
  evidence: { itemId: string; strand: Strand; answerText: string; correct: boolean; hintDepth: number; independent: boolean; at: string }[] }  // "Kaise pata?"
```

Consumers: `planSession()` (need-goals §4.7) reads `startAt` and `aserBand`; the KT ledger reads `posteriors` (§3.6); `compileDirective()` (vibe §4.7) reads `vibe` and `language.proposed`; the Forge reads `interests` for story frames; R1 (onboarding-flow) renders `evidence`.

---

## 3. The engine

### 3.1 Scale, priors and the GE origin
**GE origin (pinned here, §9 C1):** 0 = start of Class 1, so the start of Class g is g − 1. Class-g skills sit at `g_s = (g − 1) + chapterIndex/nChapters`, which puts their mean near b = g − 0.5 (need-goals §4.5; consistent with kt-algorithms' `b_k = g_k − 0.5`). `enrolled = (class − 1) + monthsIntoSession/10`.

**Mixture prior per strand** [U weights; Mindspark gaps V]:
```
prior(θ) = 0.6·N(θ; enrolled − 0.5, σ0²) + 0.4·N(θ; enrolled − gapFar, σ0²),   σ0 = 1.5 (Classes 3-9), 1.0 (Classes 1-2)
gapFar_maths = max(0.5, 0.6·(class − 1.8))       → Class 6: 2.5 (Mindspark Delhi 2.5), Class 9: 4.3 (Mindspark 4.5)
gapFar_lang  = clamp(0.67·class − 3.5, 0.3, 2.5) → Class 6: 0.5, Class 9: 2.5 (Mindspark Hindi)
```
Grid: θ ∈ [−2, 12], step 0.05 (281 points), exact likelihood, no Normal re-fit during the run (kt-algorithms §3.4). Truncation: the floor component is the ASER "beginner" mass at θ < 0.2.

### 3.2 Strands, item families, bank size
| band | strand A (maths) | strand B | reading | English reading |
|---|---|---|---|---|
| B1 (Cl. 1-2) | `maths:number`: recognise 1-9 (set of 5) → 11-99 (set of 5) → add/sub without borrowing → sub with borrowing | none | school-medium ASER ladder (start: words) | English-medium only: letters and words sets |
| B2 (Cl. 3-4) | `maths:number+ops`: place value → sub with borrowing → multiplication facts → 3-digit ÷ 1-digit (start: subtraction, as ASER) | none | ASER ladder (start: paragraph) + 1 spoken comprehension question | English-medium: words + a sentence set |
| B3-B4 (Cl. 5-9) | backchain of the **current school maths chapter** (curriculum `prerequisites` edges), e.g. fractions ← division ← multiplication ← place value | `maths:chapter`: ≤ 4 on-grade items on the current chapter | B3: 30 s ORF at class − 2 + 2 questions; B4: 90 s maze + 1 inference, ORF only if the maze is below criterion | Hindi-medium: one 20 s English passage + 1 question |

- **Item = kit item with a verified key** (gurukul law: a model never grades). The answer is classified against the key; open oral answers are numbers or words. Distractors in tap items map to misconception ids (P7).
- **Recognition sets** (5 quick micro-items) are one observation with a tempered binomial likelihood: `L(θ) = Binom(k; 5, p(θ))^0.6`. The 0.6 exponent discounts within-set dependence [U]. For reference, the 4-of-5 pass probability at a true per-item accuracy p is: p = 0.9 → 0.92; 0.8 → 0.74; 0.7 → 0.53; 0.5 → 0.19; pure guessing on 3 options → 0.045 [analytic].
- **Bank needed at launch** [U]: per strand, rungs every 0.25 GE over [−0.5, class + 1], with ≥ 3 isomorphic templates per rung × {oral, tap} × {hi, en}. That is about 30 templates per maths strand and about 210 for maths Classes 1-9. Variants inherit b from the template (kt-algorithms §3.2). Reading: per language, 2 letter sets, 2 word sets, 4 paragraphs, 4 stories, and 4 passages per class 3-9 (≈ 38 per language), all **Taxila-authored** (the ASER tools are "All Rights Reserved").

### 3.3 Item selection (Director code, never the LLM; learning-science rule 14)
```ts
const TARGET = { first: 0.85, afterRight: 0.70, afterWrong: 0.80 };          // OD5 [Sim T1]
export function nextItem(run: StrandRun, bank: KitItem[]): KitItem | KitItem[] | { stop: StopReason } {
  const stop = shouldStop(run); if (stop) return { stop };
  const { mean } = summarise(run.post), last = run.evid.at(-1);
  const tp = !last ? TARGET.first : last.y ? TARGET.afterRight : TARGET.afterWrong;
  const pool = bank.filter(i => i.strand === run.strand && !run.used.has(i.id)
    && (run.kind !== "chapter" ? onBackchain(i, run.chapterTarget) : i.chapter === run.chapterTarget)
    && formatAllowed(i, run.band, run.asrMisses));                  // ≥ 2 ASR misses → tap-only for the rest of the session
  const score = (i: KitItem) => Math.abs(pObs(mean, i) - tp) + 0.15 * sameTemplateRecently(i, run) + 0.1 * frameSwitch(i, run);
  const ranked = pool.sort((x, y) => score(x) - score(y));
  if (run.band <= "B2") return [ranked[0], isomorph(ranked[0], pool)];        // child picks 1 of 2 (ASER)
  if (run.evid.length % 2 === 1) return [ranked[0], harder(ranked, mean, +0.10)];   // "warm-up or spicy": spicy ≈ P 0.60
  return ranked[0];
}
```
`pObs` folds ASR noise for oral items, `(1 − e_fn)·p + e_fp·(1 − p)` with e_fn = 0.08 and e_fp = 0.02 [U], as in kt-algorithms §1.3. Content balancing: no two consecutive items from one template; the game frame changes at most once per strand.

### 3.4 Update, discounting and the "why" check
- **Grid update:** `post_i ∝ post_i · P(y | θ_i)`, with exact 3PL plus noise. Low ASR confidence → no update; offer the same item by tap once.
- **Rapid tap** (B3-B4): a response faster than `max(1.2 s, 0.15 × the template's median time)` is discarded as evidence [U, after Wise & Kong]. After 2 such taps, switch to oral items and use the light "no rush" shape once. Timing lives in memory only.
- **Careless-slip second chance** (ASER): on a wrong open answer whose value matches a `slip`-tagged key (for example a transposed digit), offer the same item once. Score as C1 if then right, a weaker positive (kt-algorithms §1.2).
- **"Why" choice** (B3-B4 only, P2): on 2 of the correct tap answers in strand A, ask ⟨because A or because B⟩. A correct answer with the wrong reason updates with LR 1.5 instead of 3.6, and a misconception-mapped reason files a probe request [U].

### 3.5 Stopping rules
```ts
const CAP: Record<Band, number> = { B1: 6, B2: 7, B3: 8, B4: 8 }, CHAPTER_CAP = 4;
const TIME_CAP_S = { A: { B1: 165, B2: 195, B3: 180, B4: 180 }, chapter: 90, reading: { B1: 180, B2: 180, B3: 120, B4: 120 } };
export function shouldStop(r: StrandRun): StopReason | null {
  const n = r.evid.length, { sd } = summarise(r.post);
  if (r.exitIntent) return "child_exit";                               // ends at once; VI10
  if (r.strainRun >= 2) return "strain";                               // 2 consecutive pata-nahi/minimal/withdrawal turns (P20)
  if (r.secs >= TIME_CAP_S[r.kind][r.band]) return "time";
  if (r.kind === "chapter" && n >= 2 && r.evid.slice(-2).every(e => !e.y)) return "strain";   // on-grade items may be far too hard
  if (n >= (r.kind === "chapter" ? CHAPTER_CAP : CAP[r.band])) return "max_items";
  if (r.kind === "ladder" && bracketConfirmed(r)) return "bracket";    // passed rung k, failed k+1
  if (n >= 4 && sd < 0.55) return "precise";
  if (n >= 4 && expectedSdNext(r) > sd - 0.03) return "pser";
  return null;
}
// expectedSdNext: Σ_y P(y | post) · SD(post | y) for the best next item. On every stop except child_exit, if the
// last scored item was wrong, serve one closer at P ≈ 0.9 from the highest passed rung (scored; it is a real item).
```
At about 8 items, `precise` rarely fires (mean SD 0.77-0.86) [Sim T6], so in practice the run is fixed-length with early exits for strain and floors. That is intended. The design does not chase precision in session 1; it schedules it (§3.7).

### 3.6 From posteriors to priors and starting points
- **Teaching start:** `startAt[strand] = q30(post)` for B1-B3 and `q40` for B4 [Sim T6; U]. In lesson 1, two C0 in a row on foundation items step the start up 0.5 GE (fast-forward, kt-algorithms §2.6). A too-low start costs about two easy items; a too-high start costs a failed first lesson.
- **Per-skill pL0, mixture-safe:** after a few items the posterior can be bimodal, which breaks kt-algorithms' probit shortcut. Compute the exact grid expectation instead: `pL0(k) = clamp(Σ_i post_i·σ(a·(θ_i − b_k)), 0.02, 0.85)`, then apply the prerequisite cap (kt-algorithms §3.5). That is 281 multiply-adds per skill.
- **Unplaced strands borrow strength:** `μ_B|A = μ0_B + ρ·(σ0_B/σ0_A)·(μ_A − μ0_A)` and `σ²_B|A = σ0_B²·(1 − ρ²) + ρ²·(σ0_B/σ0_A)²·σ_A²`. With ρ = 0.7, placing A to SD 0.5 shrinks B's prior SD from 1.5 to 1.13, worth about 2 items [Sim T5]. Defaults: ρ = 0.6 between maths strands, 0.4 between maths and reading [U → M-OD-4]. Science/EVS/SST get their first θ this way and are placed just in time in their first lesson (need-goals §5.4).
- **Placement never writes `learned_today` or `mastered`** (need-goals N9). The Placement row (need-goals §4.1) gains `prior_kind`, `q30` and `stop_reason`.

### 3.7 Simulation summary (Class 6 maths strand unless noted; 1,500-3,000 simulated children per row; item parameters misspecified: b ± 0.4 GE, a × e^N(0, 0.25); mixed oral/tap)
| policy · stop · prior · placement | within 1 GE | > 1 GE too high | > 1 GE too low | items | min | P(correct) seen | ≥ 3 wrong in a row |
|---|---|---|---|---|---|---|---|
| max-information · SD < .35 or 12 · matched | 93% | 4% | 4% | 12 | 3.8 | 0.48 | 61% |
| max-information · 8 · matched | 87% | 7% | 7% | 8 | 2.6 | 0.48 | 44% |
| success-first · 8 · matched | 82% | 8% | 10% | 8 | 2.3 | 0.72 | 8% |
| ASER ladder 2/2 per rung · matched | 77% | 10% | 13% | 5.6 | 1.6 | 0.69 | 12% |
| success-first · 8 · **Delhi-like child, single prior** | 71% | **28%** | 1% | 8 | 2.3 | 0.50 | 38% |
| ASER ladder · Delhi-like | 58% | 40% | 1% | 6.7 | 1.9 | 0.42 | 52% |
| success-first · 8 · mixture · q30 · matched | 68% | **2%** | 30% | 8 | 2.2 | 0.79 | 4% |
| success-first · 8 · mixture · q30 · Delhi-like | 81% | **7%** | 12% | 8 | 2.2 | 0.61 | 17% |
| Class 2, success-first · 6, young-child ASR noise | 85% | 7% | 8% | 6 | 2.2 | 0.71 | 5% |
| total items 16 (session 1 + JIT in lessons 2-3), mixture | 91% | 4% | 5% | 16 | — | 0.72 | — |

Inputs are [U]: discrimination 1.5/GE, ASR miss 15-25%, item times. **What the sim does not show:** whether real children feel any difference between P 0.72 and 0.48, or whether 25 s per item is real. Those are M-OD-5 and M-OD-9.

---

## 4. The first session, minute by minute

Each item is one dialogue beat: ⟨story or chat beat⟩ → ⟨question⟩ → wait (`waitNudgeSec` 8 / 6 / 5 by vibe age band A/B/C) → the child answers by voice or tap → ⟨acknowledgement that moves the frame on⟩. The Director appends the move **last** (`voice-turn-config`); the realtime model never picks items. Phase names map to onboarding-flow C1-C6 and need-goals I0-I5.

### 4.1 Ages 6-9 (B1-B2): "help a character" story · target 11-12 min p50 · hard cap 15
| phase (maps to) | clock p50 | wrapper (shapes) | items | yields | branch / stop |
|---|---|---|---|---|---|
| F0 hello (C1-C2, I0) | 0:00-0:40 | ⟨name from cached audio⟩ ⟨concrete AI disclosure⟩ ⟨parents can see⟩ ⟨who shall I be to you: picture tiles didi · ma'am · teacher-name⟩ | 1 tap | `vibe.explicit.address` | moves on by itself |
| F1 this-or-that (C3, I1) | 0:40-2:10 | 3 rounds of 2 (B1) / 3 (B2) picture tiles from the closed vocabulary; after round 2, ⟨one light silly beat from the reviewed humour bank⟩; ⟨tell me one thing about it⟩ (optional speech) | 3 picks + 1-3 utterances | interests; mic check; ≥ 3 language samples; humour outcome (session only) | 2 ASR misses → taps for the rest of onboarding (onboarding-flow C3) |
| F2 numbers in the story (C4) | 2:10-4:55 | the protégé character (P1 learning-by-teaching) runs a stall from the child's interest; each item is a thing the stall needs: count the boxes, read the price tag, how many left after selling; the child picks 1 of 2 parcels | ≤ 6 (B1) / ≤ 7 (B2), incl. ≤ 2 recognition sets | `maths` posterior, ASER maths band | §3.5; ends on success |
| F3 reading in the story (C4) | 4:55-7:55 | the protégé "cannot read yet": shop sign (letters/words sets) → a note (Std I paragraph, child picks 1 of 2) → a storybook page (Std II; B1 reads the first 4 sentences); B2 + ⟨one "who/what happened" question⟩. Karaoke chunk highlighting; school-medium script | ASER ladder: 2-4 tasks | `reading.byLang[medium]`, R0/R1/R2 | §6.1 rules; ASR-uncertain chunk → tap-receptive; never mark a level down on ASR alone |
| F3b English (English-medium only) | +0:45 | the protégé's English sign: letters set → words set | 1-2 sets | `reading.byLang.en` | skip for Hindi-medium (deferred to lesson 2-3) |
| F4 first win (C5) | 7:55-10:25 | ⟨you will show Mummy/Papa at the end⟩ → worked → faded → solo on the first failed rung's smallest sub-step; manipulative on screen | 1 solo item | the first real `teach` + evidence event | drop one more sub-step if it fails; ends on a real success |
| F5 show your parent (C6) | 10:25-11:10 | ⟨call Mummy/Papa and show what you did⟩; protégé replays the steps | 0 | teach-back with a real listener (P1) | no streak, no "one more" |

**Feedback (OD6):** right → a specific, story-advancing celebration (⟨the stall now has ⟨n⟩⟩). Wrong → the story moves on to the next beat with a neutral earcon. No "galat" or "wrong" (invariant OD-I3). Teaching waits for F4.

### 4.2 Ages 10-15 (B3-B4): "quick chat + warm-up round" · target 13-13.5 min p50 · hard cap 15
| phase | clock p50 | wrapper (shapes) | items | yields | branch / stop |
|---|---|---|---|---|---|
| F0 hello | 0:00-0:35 | plain register ⟨AI disclosure⟩ ⟨what your parent can see chip⟩ ⟨what should you call me⟩; B4 also: ⟨two tiles: straight-to-it · with some fun⟩ | 1-2 taps | `address`; B4 `humourDose` explicit (light vs playful, inside the band ceiling) | — |
| F1 quick picks + chat (C3, I1) | 0:35-1:50 | 2 rounds of 4 tiles; one open ⟨what do you do after school / what are you into⟩; one band-C content-irony beat | 2 picks + 2-4 utterances (10-20 s of free speech) | interests incl. volunteered; language sample (CMI, matrix); humour outcome | — |
| F1b school check (I2) | 1:50-2:35 | ⟨which maths chapter is school on⟩; optional copy photo only if the parent enabled it | 1 | `need` position (child-stated, unconfirmed) | **skip if the parent already confirmed the chapter** |
| F2 warm-up round (C4) | 2:35-5:35 | honest frame: ⟨finding where to start so nothing is boring or confusing⟩ ⟨say skip if it is obvious⟩; every 2nd item ⟨warm-up or spicy?⟩; ⟨because A or B?⟩ on 2 correct taps | ≤ 8 | strand A posterior; probe requests | "skip" = a claim: serve one item +1 GE; right → jump +1 GE, wrong → continue (self-report is never evidence, rule 1) |
| F3 chapter check | 5:35-6:50 | ⟨two or three from what school is doing now⟩ | ≤ 4 | `maths:chapter` posterior (parent sees "where the school chapter is") | stop after 2 wrong; close on a strand-A success |
| F4 reading | 6:50-8:50 | B3: ⟨read this aloud⟩ 30 s passage at class − 2 in the school medium + 2 tap questions (literal, inference). B4: 90 s maze (tap the word that fits) + 1 inference question; ORF only if the maze is below criterion. Hindi-medium: 20 s English passage + 1 question | 3-4 | `reading`, R level, English reading band (feeds captions and language mix) | §6.1 |
| F5 first win | 8:50-11:50 | attempt-first if strand A ended high (expertise reversal, rule 16), else worked → faded → solo | 1-2 | first lesson evidence | — |
| F6 goal + close (I4-I5) | 11:50-13:05 | child picks 1 of 3 proximal goals; 12-15 add ⟨when/where cue → action⟩; ⟨name one specific step they did⟩ | 1 pick | `goal` (need-goals) | if the clock passes 13:30, move the goal card to lesson 2 |

**Feedback (OD6):** light and immediate in both directions (⟨yes, ⟨reason⟩⟩ / ⟨not quite, it is ⟨answer⟩; next⟩), then move on. No explanation until F5. Never a score, a count or a "level".

### 4.3 Item and time budget by band
| band | strand A | chapter | reading tasks | English | interest | language samples | scored items | placement min | session p50 |
|---|---|---|---|---|---|---|---|---|---|
| B1 | ≤ 6 | — | 2-4 | EM only, 1-2 | 3 × 2 tiles | ≥ 3 | ≤ 12 | ≤ 5.5 | 11:10 |
| B2 | ≤ 7 | — | 3-5 | EM only, 1-2 | 3 × 3 tiles | ≥ 3 | ≤ 12 | ≤ 6.0 | 11:50 |
| B3 | ≤ 8 | ≤ 4 | 3 | HM only, 1 | 2 × 4 + open | ≥ 4 | ≤ 16 | ≤ 7.0 | 13:05 |
| B4 | ≤ 8 | ≤ 4 | 2 (maze) or 3 | HM only, 1 | 2 × 4 + open | ≥ 4 | ≤ 16 | ≤ 7.0 | 13:05 |

EM = English-medium, HM = Hindi-medium. The caps match need-goals' I3 (≤ 12 for 6-9, ≤ 16 for 10-15). Per-item times are [U] until M-OD-9.

---

## 5. Making it feel like a game or a chat, not a test

| rule | 6-year-old | 14-year-old | evidence |
|---|---|---|---|
| frame | the child **helps** a character who cannot do it yet (role reversal removes the evaluator) | an honest, fast warm-up between two people; no mascot | Désert 2009 [V-title]; kids-ux NN/g teens [V there]; P1 |
| control | pick 1 of 2 parcels or notes; "phir se" replay always | "warm-up or spicy", "skip", stop any time | ASER choice [V]; self-adapted testing [V-title] |
| difficulty felt | first item P 0.85; about 7 of 10 right | same targets; spicy items let them show off | Ling 2017 [V-abs]; [Sim T1] |
| verdicts | celebrate right; no verdict on wrong | light both ways | Ling 2017 feedback effect [V-abs]; OD6 |
| talk vs items | about 1 social or story turn per 2 items | about 1 chat turn per 3-4 items (`socialTurns` = 1) | vibe §4.2 |
| what is never shown | rungs, class labels below their class, counts, timers, "test / exam / pariksha / score / marks / level" | same; plus no percentile or "you are at class N" | onboarding-flow G-ONB-2; kids-ux §1 |
| exit | "bas" or silence-strain → close on an easy success, no "one more" | same | vibe VI10 |
| speech failure | after 2 misses, tiles of what she heard, then taps; she never says she did not understand twice | same, plus typed answer | onboarding-flow C3 |
| frames vs skills | one frame per strand; numbers in a frame are the skill, never decoration | items use their interest (cricket overs, game prices) | Lumsden 2016 mixed-domain warning [V-abs]; rule 25 |

---

## 6. Reading level and language mix modules

### 6.1 Reading ladder with Azure pronunciation assessment (`server/learner/reading.ts`)
```ts
type Chunk = { ref: string; nRef: number };               // one sentence ≤ 30 s of reading (EnableMiscue limit) [V]
async function scoreChunk(pcm: Int16Array, c: Chunk, locale: "hi-IN" | "en-IN", asrText: string): Promise<ChunkScore> {
  const pa = await azureSpeechPA({ pcm, referenceText: c.ref, locale, granularity: "Word", enableMiscue: true });  // Azure AI Speech
  const err = pa.words.filter(w => w.errorType === "Omission"
    || (w.errorType === "Mispronunciation" && !tokenMatches(w.word, asrText))).length;   // dual check: accent ≠ misread [U]
  const halts = pa.words.filter(w => w.errorType === "UnexpectedBreak").length;
  return { nRef: c.nRef, err, halts, secs: pa.durationSec, completeness: pa.completenessScore, lowConf: pa.recognitionStatus !== "Success" };
}
// level rules (ASER criteria [V]; thresholds [U]):
//  letters/words set: pass if ≥ 4/5 correct (child picks the 5)
//  paragraph/story: pass if Σerr ≤ 3 over the text AND halts/nRef ≤ 0.25 AND completeness ≥ 0.9  ("sentences, not a string of words")
//  WCPM band = 60 · Σ(nRef − err) / Σsecs over chunks read; bands <20 · 20-44 · 45-59 · 60-89 · 90+ (NIPUN-shaped, [M])
//  any lowConf chunk → re-offer once, then a tap-receptive item ("tap the word I say", 3 options); the ASR path can RAISE a level, never lower it
```
- **Ladder start:** B1 at words, B2 at paragraph (ASER). Pass → up one task; fail → down. Stop on a bracket or the time cap. B1 reads only the first 4 story sentences (time), so B1 "story" is provisional [U].
- **B3-B4:** ORF at class − 2 (Hindi or English by medium) plus 2 tap questions. R2 if WCPM ≥ 60 and comprehension 2/2; R1 if WCPM is 20-59 or comprehension ≤ 1; R0 if the paragraph fails. Maze (B4): R2 if ≥ 6 correct per minute [U; M-OD-2 calibrates]. `readGE` uses the same grid engine, with each task as an item at its passage's class level.
- **R level is a UI setting** (kids-ux: tap-to-hear, karaoke captions). It never reaches the child as a word, and it goes to the parent as "reading support on" plus the evidence.

### 6.2 Language mix estimator (`src/learner/language/mix.ts`)
```ts
// every ASR-confident child utterance from F1 onward; tokens tagged hi | en | univ by taxila-fast (JSON schema, script-aware:
// a Devanagari-transliterated English word is "en"; numerals, names and fillers are "univ")
export function onUtterance(s: LanguageSeed, toks: Tok[]): LanguageSeed {
  const dep = toks.filter(t => t.lang !== "univ"); const N = dep.length; if (N < 3) return s;
  const tHi = dep.filter(t => t.lang === "hi").length, tEn = N - tHi;
  const P = dep.slice(1).filter((t, i) => t.lang !== dep[i].lang).length;
  const cu = 100 * (0.5 * (N - Math.max(tHi, tEn)) + 0.5 * P) / N;      // Gambäck & Das 2016 [V]; w_m = w_p = 0.5 [U]
  const en = matrixOf(toks) === "en";                                    // §6.2 rule below
  const n = s.nUtt + 1;
  return { ...s, nUtt: n, pMatrixEn: { a: s.pMatrixEn.a + (en ? 1 : 0), b: s.pMatrixEn.b + (en ? 0 : 1) },
           enTokenRate: s.enTokenRate + (tEn / N - s.enTokenRate) / (n + 1), cmiMedian: runningMedian(s, cu) };
}
// matrixOf: "hi" if the utterance carries Hindi grammatical frame tokens (auxiliaries hai/tha/raha, postpositions ka/ki/ko/mein/se,
// negation nahi, light verbs karo/karna); "en" if the finite verb or auxiliary is English and no Hindi frame tokens; else "mixed" (no update).
```
- **Priors from the parent tile:** Hindi → Beta(0.5, 4.5); Hinglish → Beta(1.5, 3.5); English → Beta(4, 1); Other → Beta(1, 1).
- **Proposed teacher mix after F1** (≥ 3 utterances; else the parent tile): matrix = `en` if the posterior mean > 0.6, `hi` if < 0.4, otherwise the parent tile. `enInsertion` = low / mid / high at enTokenRate < 0.15 / 0.15-0.35 / > 0.35. Terms: `en_labels` for B1-B2 (rule 29); `medium_terms` for B3-B4 (English terms for English-medium; Hindi terms with the English in brackets for Hindi-medium).
- **Receptive check** (one item in F2): for a Hindi- or mixed-matrix child, deliver one tap instruction in English-matrix register. Followed → `receptiveEn = "ok"`. If not, the teacher **never** moves to an English matrix this session (OD-I7).
- **Persistence:** raw counts die with the session (NM-3). R1 shows the parent a one-tap card, shaped ⟨Taxila will speak mostly ⟨matrix⟩ with ⟨insertion⟩ English words⟩ [theek hai / badlo]. A confirmed card becomes a **setting** on `child`, the same kind of thing as the parent's home-language tile. Within-session mirroring continues as before (teacher-discourse DL1).

---

## 7. Interest tags and vibe priors

**Closed interest vocabulary** (about 36 tags, 8 families, vetted; **no festival, religion, caste, region or brand tags**, NM-7): sport (cricket, football, kabaddi, badminton, running) · making (drawing, building, cooking, crafts) · nature (animals, birds, plants, space, weather) · vehicles (trains, cars, planes, rockets) · play (puzzles, video games, board games, toys) · performing (music, dance, acting) · stories (superheroes, adventure, funny stories, mysteries) · everyday (shop and market, money, phones and gadgets, doctors and health). The open answer (B3-B4) is mapped onto this vocabulary by `taxila-fast`; off-vocabulary content is discarded, not stored.

```
prior per tag: Beta(0.5, 2)                       (base rate about 0.2)
tile chosen:            a += 1        shown, not chosen: b += 0.3        (a weak negative: forced choice ≠ dislike)
volunteered mention:    a += 2        elaborated (≥ 2 turns on it): a += 1
story frame for session 1: the last chosen tile; later sessions: Thompson-sample among the top 6 by mean
between sessions: decay toward the prior, half-life 45 days (aligned with motivation-interest.md §2.7; Hidi & Renninger 2006 [V-title])
persist only under consent P3 (onboarding-flow P5); otherwise session-only
```
Onboarding only **seeds** the tag set: every chosen or volunteered tag starts at interest phase 1 (triggered situational). Phases 2-4 are earned later through motivation-interest.md §2.7's indicators (own questions, child-started sessions, outside knowledge across ≥ 14 days). A first-session tile pick is never read as an individual interest.

**Vibe priors (OD10).** Persisted: `vibe_explicit` rows for the address term (all bands) and, for B4, the mode pick, with a ≤ 120-character evidence line (vibe §4.10). Session-only: warm-up turns, median words per turn, the humour beat's outcome, spicy taken/offered, retry after error, corrections. These set this session's `SessionState`, and their **counts** go to `vibe_session_agg` (vibe §4.10 allows counts). Session 2's directive is `ageBandDefaults ⊕ explicit ⊕ (persisted_adaptive only: SlowKnobs updated ≤ 3 times per arm)`. Because `N_FLOOR = 8` and advancing needs ≥ 2 sessions on distinct days, **session 1 cannot move any vibe band**. That is the vibe doc's law, and the right one here: a first meeting with a stranger, with a parent nearby, is the least typical session the child will have.

---

## 8. TaRL grouping inside a one-child product

| TaRL group (ASER level) | reading path (school medium) | maths path | foundation share floor (need-goals §4.7) |
|---|---|---|---|
| Beginner | letters with sounds, oral vocabulary, read-aloud | number sense 1-9 with objects | 0.7 (Classes ≥ 2) |
| Letter / num 1-9 | letter → syllable → word blending | 11-99, place value with bundles | 0.6 |
| Word / num 11-99 | word → sentence reading, karaoke stories | addition/subtraction without, then with, borrowing | 0.5 |
| Paragraph / subtraction | story fluency + literal comprehension | multiplication, division concepts | 0.4 |
| Story / division | comprehension, inference, writing | the backchain of the current chapter | 0.2 + 0.15·gap |
| Beyond | grade passages | the school track with prerequisite-first | need-goals default |

- **The group is a path, never a label.** The child hears none of it, and the parent sees the level bridge (need-goals §4.5).
- **Grouping is enforced in code:** for a child below Story or Division, the planner cannot schedule grade-level content in the foundation track without the backchained prerequisite. TaRL failed wherever "only 0-4% of classrooms were actually grouped by level" (learning-science §5.3) [V].
- **Re-levelling cadence** mirrors TaRL's 10-day camp rounds [V]: rolling θ updates on every evidence item, plus a scheduled **re-level check** every 10 lessons or 21 days, whichever comes first. That is 4 JIT items per placed strand; for R0/R1 children, a fresh ASER-ladder passage form [U].

---

## 9. Conflicts with sibling docs, and the resolution

| # | conflict | resolution |
|---|---|---|
| C1 | **GE origin.** kt-algorithms §3.1: "θ = 6.0 means start of Class 6", but b_k = g_k − 0.5 and the prior is class − δ. need-goals §4.5: 0 = start of Class 1 | Adopt need-goals: start of Class g = g − 1. kt-algorithms §3.1's sentence should read "θ = 5.0 ≈ start of Class 6". Its equations are unchanged, except that its prior becomes the §3.1 mixture |
| C2 | Stopping: kt-algorithms SD < 0.35 or 8/12 items per subject; need-goals SD < 0.6 or 6 per strand; onboarding-flow bracket rule | §3.5 (OD3). SD < 0.35 is rejected for session 1 by simulation [Sim T1] |
| C3 | Feedback: onboarding-flow `onb-neutral-ack-in-diagnostic` | OD6: B3-B4 light feedback, B1-B2 asymmetric. Keep M-ONB-6 as the arbiter, now with three arms |
| C4 | Item model: need-goals 1PL slope 1.7 with δ ± 0.3; kt-algorithms 3PL a = 1.5 | kt-algorithms' 3PL (c by format) on need-goals' grid range; one `pObs()` |
| C5 | Caps: onboarding-flow C4 4/6/8/10 min; need-goals I3 7-9 / 9-12 min | §4.3: placement ≤ 5.5 / 6 / 7 / 7 min including reading; session ≤ 15 min |
| C6 | Language: onboarding-flow says the child's mix "adapted within the session only (NM-3)" | Still true for raw signals; the *proposed setting* is parent-confirmed (§6.2) |
| C7 | Start rung: onboarding-flow "one class below enrolled" | Replaced by the mixture prior + success-first first item; the q30 start does the conservative job better [Sim T6] |

---

## 10. Storage (Neon; `db/migrations/0xx_onboarding.sql`, sketch)
```sql
create table onboarding_run (id uuid primary key default gen_random_uuid(),
  child_id uuid not null references child(id) on delete cascade, band text not null,
  started_at timestamptz not null default now(), minutes real, completed text not null default 'partial',
  engine_version text not null);                                  -- sim/bank version, for re-scoring later
create table diag_response (id bigserial primary key, run_id uuid not null references onboarding_run(id) on delete cascade,
  child_id uuid not null references child(id) on delete cascade, strand text not null, item_id text not null,
  answer_text text, correct boolean, outcome smallint, hint_depth smallint not null default 0, independent boolean not null,
  scored boolean not null, unscored_reason text,                  -- 'asr_low' | 'rapid_tap' | 'closer' ; NO latency column (NM-3)
  at timestamptz not null default now());
alter table placement add column prior_kind text, add column q30 real, add column stop_reason text;   -- need-goals §4.2
create table reading_profile (child_id uuid references child(id) on delete cascade, lang text, aser text not null,
  wcpm_band text, comp jsonb, maze real, method text[] not null, support text not null, at timestamptz not null,
  primary key (child_id, lang));
create table interest_tag (child_id uuid references child(id) on delete cascade, tag text not null, a real not null, b real not null,
  src text[] not null, at timestamptz not null, primary key (child_id, tag));   -- written only with consent P3
alter table child add column teacher_mix jsonb;                    -- parent-confirmed LanguageSeed.proposed
```
Raw audio is never stored. Azure Speech calls are transient, with the same policy as the voice path.

## 11. Invariants (gated in `evals/`; if a change trips them, the change is wrong)
| id | predicate | method |
|---|---|---|
| OD-I1 | child-facing diagnostic strings contain none of {test, exam, pariksha, score, marks, level, class ⟨n < enrolled⟩} | lexicon (extends G-ONB-2) |
| OD-I2 | every strand run ends with a scored correct item or a closer at P ≥ 0.9 | run log |
| OD-I3 | B1-B2 diagnostic turns contain no negative verdict word {galat, wrong, nahi hua} | lexicon |
| OD-I4 | placement writes no skill state above `practising` (N9) | DB test |
| OD-I5 | an ASR-low-confidence turn never produces `correct = false`; the ASR path never lowers a reading level | unit |
| OD-I6 | no latency, onset, pause or barge-in column or log field survives the session | schema test (NM-3) |
| OD-I7 | no English-matrix teacher turn after `receptiveEn = "no"` in the same session | transcript classifier |
| OD-I8 | `interest_tag.tag` ∈ the closed vocabulary; no sensitive families | DB check constraint |
| OD-I9 | session ≤ 15 min; exit intent ends the diagnostic within 1 teacher turn | event log |
| OD-I10 | item choice and scoring are code paths; the LLM output never contains an item id it was not given | contract test |
| OD-I11 | no placement output on any price, plan or offer surface (N12) | route test |
| OD-I12 | the first scored item of every strand has predicted P ≥ 0.85 | run log |

## 12. Measurements to run first
| id | question | method | n | bar / decides |
|---|---|---|---|---|
| M-OD-1 | placement validity | a trained human ASER-style tester within 48 h, plus a 20-item extended CAT across lessons 1-3 | 60 children (Hindi- and English-medium, all bands) | within 1 GE ≥ 75% at session 1 and ≥ 88% by lesson 3 (sim predicts 78% / 91%); else revisit OD2 |
| M-OD-2 | Azure PA on Indian children | word-level miscues and ASER level vs 2 human scorers, `hi-IN` and `en-IN` | 40 children × 3 texts | κ ≥ 0.7 on level; else tap/maze only |
| M-OD-3 | item calibration | online ADF, then offline 2PL MML (kt-algorithms §3.4) | ≥ 300 responses per anchor | replace nominal b and a |
| M-OD-4 | strand correlations ρ | children with ≥ 2 placed strands | 1,000 | §3.6 borrowing on/off |
| M-OD-5 | feedback arms (none / asymmetric / light) × targeting (0.75 vs 0.5) | randomised; early-stop rate, pata-nahi rate, agreement with lesson 1-3 evidence | 40 per cell per band family | OD5, OD6 |
| M-OD-6 | choice vs no choice | randomised; same outcomes | 40 per arm per band family | OD12 |
| M-OD-7 | language-mix estimator | 200 child utterances per band, hand-tagged matrix and tokens by 2 raters | 800 utterances | matrix accuracy ≥ 0.85, CMI r ≥ 0.8 |
| M-OD-8 | interest stability and value | top tag at onboarding vs week 3; engagement with interest frames vs neutral frames | 300 children | OD9 |
| M-OD-9 | time per item by band and format; session p50/p90 | device logs (aggregate, not keyed to a child) | 200 sessions | §4.3 budgets, OD2 caps |
| M-OD-10 | too-high placements in the wild | share of children whose lesson-1 foundation items run at P < 0.5, and > 0.9 | all | the q30/q40 choice |

## 13. Decisions and context entries to log (proposed)
- **Decisions** (each with its reversal from §0): `onb-diag-one-engine` (OD1), `onb-diag-item-caps` (OD2), `onb-diag-stop-rules` (OD3), `onb-diag-mixture-prior-q30` (OD4), `onb-diag-success-first` (OD5), `onb-diag-feedback-by-band` (OD6; **supersedes** onboarding-flow `onb-neutral-ack-in-diagnostic`), `onb-diag-azure-pa-reading` (OD7), `onb-diag-langmix-proposed-setting` (OD8), `onb-diag-interest-closed-vocab` (OD9), `onb-diag-vibe-explicit-only` (OD10), `onb-diag-no-misconception-goal` (OD11), `onb-diag-child-choice` (OD12), `ge-origin-start-class1` (C1; amends kt-algorithms §3.1).
- **Measurement:** `onboarding-cat-sim-2026-10-02`. Simulated, n = 1,500-3,000 per row, `docs/research/learner/onboarding-cat-sim.mjs` (seed 20261002), inputs [U]. It is a model of children, not a measurement of them.
- **Rejected (by simulation):** `cat-sd035-first-session`. An SD < 0.35 stop needs well over 12 items (mean SD 0.52-0.63 at 12); `aser-ladder-as-scorer`: 40% placed > 1 GE too high for a far-behind child, because a 2/2 rung rule climbs one rung per two items from a start that is already too high.

## 14. Open questions
- [U] Does asymmetric feedback for 6-9 read as "silence means wrong" to children? (M-OD-5 interviews.)
- [U] Should the 0.4 far-behind weight vary with what the parent says (a "catch_up_basics" goal → 0.6)? It is tempting, but parents are poor judges of level (need-goals §1.1). Only the *weight* would move, never the evidence.
- [U] The B1 story level from 4 sentences: does it agree with ASER's full story (M-OD-1)?
- [M] Exact NIPUN Bharat WCPM targets and FLS 2022 Hindi ORF benchmarks: fetch the guidelines PDF (government hosts blocked fetches this session).
- [U] Azure PA `hi-IN` on code-mixed reading (English words inside a Hindi passage), and accuracy scores for regional accents. The dual-check rule (§6.1) is a guess.
- [U] Is a 90 s maze long enough for B4 reliability? The standard CBM maze is 2.5-3 min [M].

## 15. Sources
**Fetched and read this session [V]:** ASER Centre, *ASER 2024 assessment tasks* (PDF, pp. 38-42), https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-assessment-tasks.pdf · Muralidharan, Singh & Ganimian, *Disrupting Education?* NBER w22923 (Appendix C, Mindspark diagnostic; §4.1 learning levels), https://www.nber.org/system/files/working_papers/w22923/w22923.pdf; AER abstract https://www.aeaweb.org/articles?id=10.1257/aer.20171112 · Banerjee, Banerji, Berry, Duflo et al., *Mainstreaming an Effective Intervention* (TaRL), NBER w22746, https://www.nber.org/system/files/working_papers/w22746/w22746.pdf · Microsoft Learn, *Use pronunciation assessment*, https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment, and the locale table, https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/main/articles/ai-services/speech-service/includes/language-support/pronunciation-assessment.md · Hasbrouck & Tindal (2017), *An update to compiled ORF norms*, https://files.eric.ed.gov/fulltext/ED594994.pdf · Gambäck & Das (2016), *Comparing the Level of Code-Switching in Corpora*, LREC, https://aclanthology.org/L16-1292.pdf · Curriculum Associates, i-Ready diagnostic page, https://www.curriculumassociates.com/programs/i-ready-assessment/diagnostic.

**Abstract read [V-abs]:** Ling, Attali, Finn & Stone (2017), *Is a CAT more motivating than a fixed-item test?*, APM, doi:10.1177/0146621617707556 · Lumsden et al. (2016), *Gamification of cognitive assessment and training*, JMIR Serious Games, doi:10.2196/games.5888 · Choi, Grady & Dodd (2011), *A new stopping rule for CAT* (PSER), EPM, doi:10.1177/0013164410387338 · Wise & DeMars (2005), *Low examinee effort in low-stakes assessment*, Educational Assessment, doi:10.1207/s15326977ea1001_1 · Liu & Weiss (2026), *Interactions between termination criteria and ability estimators in CAT*, EPM, doi:10.1177/00131644261453945 · Attia et al. (2024), *Kid-Whisper*, AIES, doi:10.1609/aies.v7i1.31618 · Hasbrouck & Tindal (2006), *ORF norms*, The Reading Teacher, doi:10.1598/rt.59.7.3.

**Title and DOI checked, content from memory [V-title]:** Bergstrom, Lunz & Gershon (1992), doi:10.1207/s15324818ame0502_4 · Rocklin & O'Donnell (1987), *Self-adapted testing*, JEP, doi:10.1037/0022-0663.79.3.315 · Wise, Roos, Plake & Nebelsick-Gullett (1994), doi:10.1207/s15324818ame0701_6 · Rocklin (1997), doi:10.1080/10615809708249296 · Désert, Préaux & Jund (2009), *So young and already victims of stereotype threat*, EJPE, doi:10.1007/BF03173012 · Wise & Kong (2005), *Response time effort*, doi:10.1207/s15324818ame1802_2 · Babcock & Weiss (2012), JCAT, doi:10.7333/1212-0101001 · Klinkenberg, Straatemeier & van der Maas (2011), Math Garden, doi:10.1016/j.compedu.2011.02.003 · Walkington (2013), interest personalisation, JEP, doi:10.1037/a0031882 · Hidi & Renninger (2006), *Four-phase model of interest development*, doi:10.1207/s15326985ep4102_4 · Fuchs & Fuchs (1992), maze, doi:10.1080/02796015.1992.12085594 · Graham & van Ginkel (2014), *the value and limits of 'words per minute'*, doi:10.1080/07908318.2014.946043 · Tonidandel, Quiñones & Adams (2002), doi:10.1037/0021-9010.87.2.320 · Wikipedia, *National Education Mission* (NIPUN Lakshyas exist; FLS 2022 benchmarked ORF) [S].

**[M] (not fetched):** MAP Growth, Star and ALEKS lengths; Prodigy's in-game placement; Math Garden's 75% target; NIPUN WCPM targets; CBM maze timing and scoring.

**Repo (their own tags apply):** `docs/research/learning-science.md`; `learner/kt-algorithms.md`; `learner/need-goals.md`; `learner/vibe-temperament.md`; `learner/motivation-interest.md` (§2.7 interest phases); `design/onboarding-flow.md`; `design/kids-ux-ages.md`; `voice/indian-teacher-discourse.md`; `harvest/gurukul.md`; `context/decisions.md` (`voice-turn-config`, `azure-only-compute`); `context/measurements.md`.
