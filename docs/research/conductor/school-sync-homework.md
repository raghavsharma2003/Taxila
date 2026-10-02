# School sync and homework help: syncing Taxila with the child's real school

Status: research + design, 2026-10-02. Written for the design-review workflow. It deepens
`day-cycle.md` §4 (homework flow, rules H1-H7, state machine) and §7.3 (exam windows), and it extends the
event log and job kinds in `orchestration-architecture.md` §3 and §5.1. Where this file and a later
`context/decisions.md` entry disagree, the decision entry wins.

Read with: `docs/ARCHITECTURE.md` §1.2 (Director, answer withholding) and §1.6 (safety lanes);
`learning-science.md` §6 (rules cited as **LS-n**); `learner/kt-algorithms.md` (evidence event, grader-noise
folding, misconception state); `learner/vibe-temperament.md` §4.9 (banned inferences);
`design/parent-experience.md` §7 (school sync card), §9 (PTM), §10 (notebook camera default off);
`data/kits/SCHEMA.md` (kit items, 4-step hints, misconception `diagnostic`); `data/curriculum/` (742 topics).

**Tags** follow the sibling docs: **[V]** primary source checked this session, **[S]** secondary or search
summary, **[M]** prior knowledge not re-checked, **[I]** our inference or design proposal, **[U]**
unmeasured, must be measured on Taxila data. Binding constraint (CLAUDE.md, `azure-only-compute`): only
Azure OpenAI first-party models and Azure services. Model names below are the repo's deployment aliases:
`taxila-brain` = gpt-5.6-sol, `taxila-fast` = gpt-5.6-luna, `text-embedding-3-small`; plus Azure AI
Document Intelligence (an Azure service, allowed).

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| SS1 | **A per-child `SchoolMirror` is a code-owned model, fed by eight input kinds.** Every input is a *candidate* fact with a source and a confidence. A fact becomes "confirmed" only by a parent tap, or by two independent sources agreeing. | Inputs come from children, photos and parents, and all of them are noisy. "Noisy input is never cleaned into certainty" is inherited law (harvest HC, `hp-companion-voiceclone`) | Measured: parent confirmations change < 2% of auto-accepted facts over 8 weeks (M-SS2). In that case drop confirmation for that source |
| SS2 | **Two-channel transcription.** Azure Document Intelligence Read/Layout handles printed text (English and Hindi) and English handwriting. `taxila-brain` vision at `detail: high` handles Hindi handwriting, math layout and anything DI marks low-confidence. **`taxila-fast` never transcribes.** | DI v4.0 handwriting covers 12 languages and **Hindi is not one of them**, while printed Hindi is supported [V]. GPT-5.5 scored chrF++ 58.5 on 300 real *printed* Devanagari scans, against 86.3 for the best model, which is about the same as classical EasyOCR [V, Singh 2026]. Inherited: luna/terra "read part, assert the rest" on screenshots, 12 screens / 160 calls [V, harvest `vision-fab`] | M-SS1 shows sol beats DI on printed Hindi or English handwriting at equal or lower fabrication, or shows luna at 0 fabrications on the homework bench |
| SS3 | **Literal transcription comes first, and the child reads it back, before any photo produces evidence.** The answer crop is transcribed without the question in view, a non-reasoning OCR cross-checks it, code checks the arithmetic of every line, and the child confirms "is this what you wrote?" | VLMs "fix" student errors while transcribing: over-correction ran **42.1-66.2% across 15 VLMs** on FERMAT, and prompt mitigation gave no net gain [V, Seong et al. 2026]. That fixing erases exactly the misconception evidence this feature exists to find | An M-SS1 arm with single-call "transcribe and judge" (Levine et al. found single-call better for *grading* [V]) matches literal-first on over-correction rate |
| SS4 | **Hindi handwriting is gated.** Until M-SS1 passes for `hi-hand`, a Hindi-handwritten answer is never transcribed into evidence. The fallback is for the child to read their answer aloud ("apna answer padh ke sunao"), which goes through ASR. | SS2 numbers; no Azure-native Hindi handwriting OCR exists [V] | M-SS1 `hi-hand` digit/character error and fabrication meet the gate |
| SS5 | **Mapping to NCERT is a constrained choice, never free naming.** Code builds a candidate list from class, board, book, chapter pointer and timetable. Embeddings rank it, and `taxila-fast` picks an id from that enum or `none`. Confidence is calibrated, and thresholds route to auto-accept, ask, or unmapped. | Constraining GPT-4 Turbo to the topic raised misconception-identification precision from **0.526 to 0.753** (Otero, Druga & Lan 2024) [V]. The same effect is expected for topic mapping [I]. Free naming invents chapters | Top-1 accuracy of free naming ≥ constrained on M-SS2 |
| SS6 | **A non-NCERT book is mapped once, from a photo of its contents page, at library level.** The `(publisher, title, class, edition)` alias table is shared across all children. | Many private schools use private-publisher books in classes 1-8 [M]. One contents-page photo maps a whole year, and book metadata carries no child data [I]. This mirrors orchestration C8 (shared library, not per child) | Alias precision < 85% on M-SS2. Then map per chapter on first homework instead |
| SS7 | **The voice model never receives the final answer to a school item.** Its compiled instructions hold the step shape and the *isomorphic* kit item with that item's answer. A code leak guard post-checks every teacher utterance and every on-screen string against the key. A leak marks the item `leaked`, removes it as evidence, and assigns a fresh isomorphic item to solve alone. | Safety by predicate, not instruction (ARCHITECTURE §3). The realtime lane cannot be pre-checked (ARCHITECTURE §1.6). Unguarded GPT-4 helped practice and harmed later exams; the guarded "GPT Tutor" with teacher-designed hints largely avoided the harm (Bastani et al. 2025, PNAS) [S]; LS-15 | None for the principle. The guard's normaliser grows from leak red-team findings (M-SS3) |
| SS8 | **The ladder bottoms out on an isomorph, never on the school item.** The ladder runs restate → pump → principle hint → step prompt → worked isomorphic example with a self-explanation prompt → child solves their own item. If the child is still stuck, the item becomes "ask your teacher tomorrow" plus a scheduled lesson on the skill. | Students skimmed 68% of non-final hint levels in < 1 s to reach the bottom-out answer, and help abuse correlated negatively with learning [V, Aleven et al. 2016]. Bottom-out hints are still needed to get unstuck, and they work when they are self-explained [V, same; Shih et al. 2008 cited there] | DC-M5 micro-RCT (day-cycle) shows the isomorph bottom-out lowers independent-test performance vs a no-help arm |
| SS9 | **Answer keys for unmatched items need two independent `taxila-brain` solves that agree, plus a code check where the answer is computable.** If there is no key, there is no correctness talk: the teacher gives process help only. | "A model never grades" (inherited law). Keys are what the leak guard and "check my working" rely on, so a wrong key is a double failure [I] | Measured dual-solve key error rate on Class 1-9 items < 0.5% *and* single-solve equal (M-SS4). Then drop the second solve |
| SS10 | **For a graded test paper, the school teacher's mark is the correctness evidence (`grader: 'human'`).** Taxila proposes *misconception hypotheses* only from the topic's kit list, plus generic error classes. A hypothesis is confirmed only by that misconception's kit `diagnostic` item in a later lesson. | A diagnosis constrained to a library beats open diagnosis (SS5 evidence). Kit misconceptions already carry diagnostics (`SCHEMA.md`). LS-12: misconception library is the moat | Probe-confirmation rate of hypotheses < 30% (M-SS4). The photos are then noise and should only schedule probes |
| SS11 | **Taxila never contradicts the school teacher to the child.** When our dual-solved key disagrees with the teacher's mark, a neutral "worth asking" line goes to the parent only. | Child trust in the school teacher; Taxila's key or transcription is the likelier error (SS3) [I] | None |
| SS12 | **PTM and report-card *behaviour* remarks never become child labels.** Academic remarks map to skill candidates for the parent to confirm. Behaviour remarks stay as the parent's own private note, are never put in the teacher brief, and are never inferred from. | `vibe-temperament` §4.9 banned inferences ("talks in class", "careless" are moral or trait labels) [V, repo] | None |
| SS13 | **Raw images are deleted after extraction by default. Extracted text goes through the same safety scan as transcripts.** | `day-cycle` H6; parent-experience §10 notebook camera default off. Essays and diary pages can carry disclosures [I] | Parent turns on "notebook keep" (already designed) |
| SS14 | **Homework help sits inside the School Bag Policy 2020 envelopes and never lengthens homework.** | MoE/NCERT: no homework up to Class II; ≤ 2 h/week in III-V; ≤ 1 h/day in VI-VIII; ≤ 2 h/day in IX+; "mechanical" homework criticised [V] | None; envelopes change only if the policy does |

---

## 1. Evidence, compressed to what changes the design

### 1.1 Homework help and learning
- **Unguarded answers harm, guarded hints don't (Bastani et al. 2025, PNAS)** [S]: in a high-school field
  experiment, a ChatGPT-like "GPT Base" was used as a crutch and students did worse once access was
  removed. "GPT Tutor", prompted to give teacher-designed hints and not answers, largely removed the harm.
  Our lesson: a *prompt* was enough in their setting, but Taxila's voice lane will be pushed by children,
  so the guard is code (SS7). The sibling docs carry the 48% / −17% figures [S].
- **Help seeking in ITSs (Aleven, McLaren, Roll & Koedinger 2016, IJAIED 26:205)** [V]: 68% of hint
  levels before the last were viewed for < 1 s; after 3 errors on a step, the next action was a hint
  request only 34% of the time (help *avoidance*); help use correlated negatively with learning gains,
  partly as a selection effect. They recommend keeping principle-based hints (action + condition +
  principle) and bottom-out hints, which get students unstuck; prompting self-explanation after errors
  improved learning (Butcher & Aleven 2013, cited there). **Consequences:** the ladder is paced by child
  turns, not taps (§5.2); help is *offered* after repeated errors; the bottom-out is a worked isomorph
  followed by "why did step 2 work?".
- **Homework load (School Bag Policy 2020, MoE/NCERT)** [V]: the envelopes in SS14. The policy also says
  homework "snatches play time" and criticises "copy answers from books" style work. It recommends
  creative home tasks with family (e.g. tracking the household's rice and sugar use) and reading.
  Cooper et al. 2006 found homework-achievement r ≈ 0 in grades 3-5 (day-cycle §1.4 [S]).
  **Consequence:** for B1 (Class 1-2) homework help is parent-led, short, and reframed as play. Taxila
  helps with creative/project homework by *planning*, never by producing.

### 1.2 Reading children's pages with Azure models
- **Azure Document Intelligence v4.0 (2024-11-30 GA) `prebuilt-read` / `prebuilt-layout`** [V, MS Learn,
  updated 2026-07-10]: printed text covers several hundred languages including Hindi; handwritten text
  covers English, Chinese Simplified, French, German, Italian, Japanese, Korean, Portuguese, Spanish,
  Russian, Thai and Arabic, **not Hindi**. Omit the language code on mixed pages. Layout returns tables
  (timetables, date sheets).
- **Azure OpenAI vision** [V, MS Learn 2026-07-29]: ≤ 20 MB per image, ≤ 10 images per request;
  `detail: low` is one 512×512 view, `high` adds 512×512 tiles at double token cost, and low resolution
  "could impact the accuracy of object and text recognition". **Consequence:** transcription at `high` on
  crops; page classification at `low` on the whole page.
- **Devanagari OCR stress test (Singh 2026, arXiv 2606.29213)** [V, abstract]: 10 systems, 300 real
  *printed* scans. Clean synthetic text did not separate models (chrF++ 91-98). On real scans GPT-5.5 scored
  58.5, about EasyOCR's level; Gemini 2.5 Flash 86.3 and Claude Opus 4.7 82.2 (neither allowed here).
  "Strong English OCR does not predict Indic OCR." gpt-5.6 is untested; children's *handwritten*
  Devanagari will be harder than print [I].
- **Over-correction (Seong, Liermann, Kim, Shin & Lim 2026, arXiv 2604.22774)** [V]: 15 VLMs on FERMAT
  (2,244 handwritten multi-line solutions) replaced a written "2 × 3 = 5" with the logically correct token
  in **42.1-66.2%** of cases; prompting traded the gain against overall accuracy (no net improvement). Their
  PINK metric penalises corrections (expert preference 55% vs BLEU 39.5%).
- **Grading handwritten math (Levine, Aenlle, Zilles, West & Silva 2026, arXiv 2605.19043, UIUC)** [V]:
  GPT-5-mini, GPT-5.1 and Gemini-3-flash against instructor rubrics on 600 submissions: rubric-item
  accuracy 87-99%, and **87% of the best model's errors were transcription failures**, not rubric errors
  (blur, rotation, hallucinated content, missing work marked correct). Single-call beat two-stage for
  grading. They advise preview transcriptions, quality warnings and human review for high stakes, and found
  no reliable confidence signal for auto-flagging.
- **FERMAT (ACL 2025)** [S]: 609 problems, grades 7-12, with planted computational, conceptual, notational
  and presentation errors. VLMs were weak at locating errors in handwriting. This is the closest public
  shape to our M-SS1 bench.
- **Inherited (html-portfolio, `docs/harvest/json/hp-main-engine.json`)** [V, repo]: gpt-5.6-luna/terra
  read 3-4 of 9 messages and asserted the rest (1-2 fabrications / 32), and one Foundry deployment's
  behaviour drifted within 4 days (`vision-drift-4day`). **Consequence:** pin the deployment version,
  re-run the bench on every model or version change, require a bounding box for every extracted line.

### 1.3 Diagnosing misconceptions from wrong answers
- **Otero, Druga & Lan 2024 (arXiv 2412.03765)** [V]: 55 algebra misconceptions, 220 examples, grades
  4-8, GPT-4 Turbo. Precision/recall 0.526/0.529 unconstrained, **0.753/0.748 with a topic constraint**;
  ratios and proportions stayed at 0.286 precision even constrained; text only. **Consequence:** classify
  against the kit's per-topic list (SS10); treat ratios as low trust.
- **Eedi "Mining Misconceptions in Mathematics" (Kaggle, Sep-Dec 2024)** [S]: 1,857 K-12 MCQs with
  distractors mapped to misconceptions. The winning MAP@25 was ~0.64. Even purpose-built retrieval puts
  the right misconception in a 25-list only about two-thirds of the time. **A photo diagnosis is a
  hypothesis, never a verdict.**
- Teachers' knowledge of student misconceptions predicts their students' gains (Sadler et al., cited in the
  2026 distractor-generation literature) [S]. This is why the parent report names "tricky bits" in
  skill language rather than scores.

### 1.4 What Indian school sync actually looks like [M/I, verify per school]
Homework reaches the child through the **school diary**, the **class WhatsApp group** (forwards), a
**school app** (ERP/LMS such as Toddle or Teachmint), or the child's memory. Test syllabi arrive as a
circular ("PT-1: Ch 1-4"), date sheets as a printed table, timetables as a grid in the diary. NEP-aligned
report cards move toward the PARAKH Holistic Progress Card (competency descriptors plus remarks) [M].
There are no parent-authorisable public APIs for Indian school ERPs [I], so **v1 sync is capture-based
(photo, share, voice, tap), not integration-based.**

---

## 2. The SchoolMirror: what Taxila models about the child's school

```ts
// shared/school/mirror.ts — folded by code from student_event; owner: school-sync module (one writer)
export interface SchoolMirror {
  childId: string;
  school?: { board: 'cbse' | 'icse' | 'rbse' | 'state' | 'other'; medium: 'en' | 'hi' | 'mixed';
             sessionStart: string; nameHash?: string };          // school name hashed, never needed in clear
  books: Record<Subject, BookRef>;                                // NCERT id or a school_book alias id
  timetable?: { confirmed: boolean; days: Record<Weekday, PeriodSubject[]>; validFrom: string };
  pointers: Record<Subject, ChapterPointer>;                     // "school is at chapter X"
  homework: HomeworkTask[];                                      // open + last 14 days
  tests: SchoolTest[];                                           // announced, upcoming, done
  remarks: PtmNote[];                                            // parent-owned notes (SS12)
  calendar: { holidays: string[]; events: { on: string; kind: 'ptm' | 'exam' | 'holiday' | 'event' }[] };
  confirmBudget: { weekOf: string; asked: number; max: 1 };      // parent questions per week (SS1)
}
export type Subject = 'maths' | 'science' | 'evs' | 'english' | 'hindi' | 'sst';
export interface BookRef { kind: 'ncert' | 'alias'; id: string; confidence: number }
export interface PeriodSubject { period: number; subject: Subject | 'other'; start?: string }
export interface ChapterPointer {
  chapterId: string | null; dist: Array<{ chapterId: string; p: number }>;  // top-3 kept
  lastEvidenceAt: string; lastConfirmedAt?: string; sources: PointerSource[];
}
export interface PointerSource { kind: SourceKind; chapterId: string; weight: number; at: string; ref: string }
export type SourceKind = 'parent_pick' | 'test_syllabus' | 'homework_match' | 'worksheet_match'
  | 'child_said' | 'timetable_drift' | 'toc_order';
```

### 2.1 The eight input kinds

| input | how it arrives | extracted to | default source weight [U] | who confirms |
|---|---|---|---|---|
| today's school topic | child, at session open ("aaj school mein kya padha?"), voice or chip; parent tap | `school.chapter_taught` | child 0.55 · parent 0.9 | auto when it agrees with the pointer ±1, else ask the child "Fractions wala?" |
| homework page (diary, notebook, worksheet) | camera / gallery / Android share from WhatsApp | items + chapter guess → `HomeworkTask` | 0.8 × mapping confidence | child picks items; mapping per SS5 |
| test paper (graded) | camera, multi-page | per-question results + hypotheses (§6) | correctness: the teacher's mark | parent sees the summary; low-confidence rows show as "unclear" |
| school timetable | one photo of the diary grid; or a tap-grid editor | `timetable` | 0.95 after confirm | parent, once per term |
| exam schedule / test syllabus | photo or PDF of the date sheet and syllabus circular; WhatsApp share | `school.test_announced` per subject with chapters | 0.95 | parent confirms dates (they drive day-cycle §7.3 windows) |
| contents page of each book | onboarding "photograph the contents page" (optional) | `school_book` + chapter aliases (library) | n/a | none per child; library QA (SS6) |
| PTM / report-card remarks | parent types, dictates, or photographs the remarks box | `PtmNote` (academic → skill candidates) | n/a | parent confirms each academic mapping |
| school calendar / circulars | photo, share, or manual dates | holidays, PTM days, exam weeks | 0.9 | parent |

### 2.2 Chapter-pointer fusion (pure code, per subject)

```ts
// Each source votes for a chapter; votes decay; textbook order gives drift.
const HALF_LIFE_DAYS: Record<SourceKind, number> = { parent_pick: 21, test_syllabus: 30, homework_match: 10,
  worksheet_match: 10, child_said: 5, timetable_drift: 7, toc_order: 365 };
function pointerDist(sources: PointerSource[], now: Date, order: string[]): Map<string, number> {
  const score = new Map<string, number>();
  for (const s of sources) {
    const ageDays = (now.getTime() - Date.parse(s.at)) / 864e5;
    const w = s.weight * Math.pow(0.5, ageDays / HALF_LIFE_DAYS[s.kind]);
    score.set(s.chapterId, (score.get(s.chapterId) ?? 0) + w);
  }
  // drift prior: schools move forward in book order; spread 15% of the mass to the next chapter after ~14 days [U]
  const top = [...score.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const i = order.indexOf(top[0]);
    const daysSince = (now.getTime() - Math.max(...sources.filter(s => s.chapterId === top[0]).map(s => Date.parse(s.at)))) / 864e5;
    if (i >= 0 && i + 1 < order.length && daysSince > 14) score.set(order[i + 1], (score.get(order[i + 1]) ?? 0) + 0.15 * top[1]);
  }
  const z = [...score.values()].reduce((a, b) => a + b, 0) || 1;
  return new Map([...score.entries()].map(([k, v]) => [k, v / z]));
}
// Pointer = argmax if p ≥ 0.6. If p < 0.6 and confirmBudget allows, ask the parent ONE question on the
// Parent corner card (not a push; parent-experience cadence caps). Otherwise keep the distribution and
// let the planner hedge: prefer prerequisites shared by the top-2 chapters.
```

**What the pointer drives:**
- the 40% "current school chapter" share of new-learning time (day-cycle §3.4 step 5);
- the morning preview topic;
- the mapping candidate window (§4);
- test windows.

A pointer change emits `school.pointer_changed`. The reducer then re-plans at the next boundary, never
mid-lesson (orchestration §2 rule 3).

---

## 3. Capture and extraction pipeline

### 3.1 Capture on the device
- **Camera:** web uses `<input type="file" accept="image/*" capture="environment">`. The Android
  WebView fires `ACTION_IMAGE_CAPTURE` with no native plugin (harvest A35 [V, repo]).
- **Share target:** Android registers an intent filter for `image/*`, `application/pdf` and
  `text/plain`, so a WhatsApp forward of the homework message or date sheet lands in Taxila. The PWA
  equivalent is the Web Share Target API [M]. Shared text is PII-stripped (phone numbers, names after
  "~", group names) before it leaves the device [I].
- **Who captures:**
  - B1-B2: the parent captures, behind the parent gate.
  - B3-B4: the child may capture, with the parent's notebook-camera toggle on.
  - The child is never asked to photograph a test paper the parent hasn't seen. Test papers are
    parent-captured at every band [I].
- **On-device quality gate:**
  - Checks: canvas downscale to 512 px grey; variance of the Laplacian (blur); mean and clipped-pixel
    share (dark or glare); largest-quadrilateral page fill (page found?); orientation from EXIF.
  - Each check returns `ok | retake(reason)`. The retake copy is a shape for the band ("thoda roshni
    mein").
  - Thresholds are calibrated on M-SS6 [U]. The gate exists because Levine et al.'s top failures were
    blur and rotation [V].
- **Limits:** ≤ 6 pages per capture (the vision cap is 10 images per request [V], leaving room for
  crops). Each page is re-encoded on the device to ≤ 2048 px on the long side at JPEG q 0.8 [U].
- **Upload:** `POST /api/capture` returns a write-only SAS URL into Blob `taxila-captures/{childId}/{captureId}/`
  (private container, unlike Forge's public one). Then the device emits `capture.submitted`.

### 3.2 Server extraction DAG (`job kind: capture.extract`)
Lane `fast` when the child is waiting (priority 0); `slow` for test papers and timetables (priority 2).
Each stage is a checkpointed step (orchestration §7.5), and derived objects are create-only (harvest
HC51 DAG [V, repo]).

```
 S0 normalise    server re-encode (strips EXIF/GPS), deskew/rotate, keep 2048 px master; face detector → blur faces (never stored)
 S1 classify     taxila-fast, detail:low, whole page → { purpose_guess, subject_guess, script: en|hi|mixed, handwriting_share, has_teacher_marks }
 S2 layout       DI prebuilt-layout (no language code: mixed pages) → lines + bboxes + tables + per-word confidence
 S3 segment      code: question markers (Q1, 1., (a), प्रश्न 1, १.) + layout → regions {question, answer, teacher_mark, margin}
 S4 transcribe   per region, routed (table below); answer regions in LITERAL mode (§3.3)
 S5 reconcile    code: DI vs vision per line → agree | differ(tokens) | one-sided; digits that differ → uncertain
 S6 structure    taxila-fast, text only (no image) → PageExtract (JSON schema) from reconciled lines; every item cites region ids
 S7 verify       code: every item has ≥1 region bbox; item count vs S3 markers; no text absent from S4 output (anti-fabrication)
 S8 safety       extracted free text (essays, diary notes) → the transcript safety classifier (ARCHITECTURE §1.6)
 S9 map          §4 → topic/skill candidates and confidence
 S10 emit        capture.extracted (or capture.unreadable with reason) ; raw images scheduled for deletion (SS13)
```

**Routing in S4 [I, every row to be confirmed by M-SS1]:**

| region content | primary | cross-check | notes |
|---|---|---|---|
| printed English or Hindi (question text, worksheet, date sheet) | DI layout | — | DI printed Hindi is supported [V]; vision only if DI conf < 0.8 |
| English handwriting (answers) | DI read | `taxila-brain` literal | disagreement → uncertain tokens |
| Hindi handwriting | `taxila-brain` literal | none available on Azure | **gated (SS4)**; fallback is read-aloud |
| handwritten math (columns, fractions, long division) | `taxila-brain` literal, crop per line | DI read for digits | code re-checks arithmetic (§3.3 D3) |
| tables (timetable, date sheet) | DI layout tables | `taxila-brain` if cells empty | parent confirms the grid |
| teacher marks (ticks, crosses, "3/5", red ink) | code colour mask (red/green channel) + DI on masked layer | `taxila-brain` | separates the teacher layer from the child's ink [I] |
| diagrams or drawings | none (described, not transcribed) | — | "child drew a labelled plant" at most |

### 3.3 Faithful transcription: four defences against "fixing" the child

1. **D1 Context-blind literal crops.** Answer regions are sent *without* the question text and with a
   transcription-only instruction: no solving, keep every error, mark unreadable tokens `⟨?⟩`. Removing
   the problem should weaken the model's prior about what "should" be written [I]. Seong et al. report
   that prompting alone does not fix over-correction [V], which is why D2-D4 exist.
2. **D2 Non-reasoning cross-check.** DI is a recognition model and does not solve, so it has no motive to
   "fix" [I]. Wherever DI supports the script, a digit or token disagreement marks the token `uncertain`
   instead of picking a winner.
3. **D3 Arithmetic consistency in code.** Each transcribed line `a op b = c` is evaluated (exact rational
   arithmetic, no floats). Two patterns are flagged as suspected over-correction and trigger D4:
   - the teacher marked an item wrong, yet every transcribed line is correct;
   - the transcribed final answer equals the key, yet DI read a different digit.
4. **D4 Child read-back.** Before any transcription becomes evidence or feedback, the child sees it with
   uncertain tokens highlighted: "Tumne yeh likha hai na?". They confirm, correct by tap, or read it
   aloud. The child is the authority on *what they wrote*, never on whether it is right. For B1 the
   parent confirms.

**Without D4, a homework photo produces help but no evidence.** Evidence from a photo always carries
`grader: 'code'` (arithmetic) or `'llm'`, with the vision confusion matrix folded in (kt-algorithms §1.3).
It is down-weighted for homework (day-cycle H4: 0.5 of the folded LR [U]).

### 3.4 Output contract

```ts
// shared/school/extract.ts
export type CapturePurpose = 'homework' | 'worksheet' | 'test_paper' | 'timetable' | 'date_sheet'
  | 'syllabus' | 'toc' | 'ptm_remarks' | 'diary' | 'circular';
export interface PageExtract {
  captureId: string; extractVersion: string;          // model deployment ids + prompt hashes (pinned; vision drifts)
  purpose: CapturePurpose; subject?: Subject; script: 'en' | 'hi' | 'mixed';
  quality: { legibleShare: number; uncertainTokens: number; retakeAdvised: boolean };
  items: ExtractItem[]; tables?: ExtractTable[]; freeText?: { regionId: string; text: string }[];
}
export interface ExtractItem {
  itemRef: string;                                    // "Q3(b)" as printed
  regionIds: string[];                                // bboxes; an item without regions is dropped (S7)
  questionText: string; questionLang: 'en' | 'hi' | 'mixed';
  childAnswer?: { text: string; lines: string[]; uncertain: number[]; literal: true; readBack: 'pending' | 'confirmed' | 'corrected' | 'skipped' };
  teacherMark?: { kind: 'tick' | 'cross' | 'partial' | 'score'; awarded?: number; max?: number; conf: number };
  kind: 'numeric' | 'mcq' | 'fill_blank' | 'short_answer' | 'long_answer' | 'match' | 'diagram' | 'essay' | 'grammar' | 'translation' | 'project';
  mapping?: ItemMapping;                              // §4
}
```

---

## 4. Mapping to NCERT topics, kit skills and answer keys

### 4.1 Topic mapping (constrained choice)

```ts
// server/school/map.ts (sketch)
async function mapItem(item: ExtractItem, ctx: MapContext): Promise<ItemMapping> {
  // 1 candidates by code: the book for (class, subject, board) or the school_book alias → chapters
  const window = ctx.pointer ? chaptersAround(ctx.pointer, -3, +1) : allChapters(ctx.book);
  let cands = topicsIn(window);                       // ≈ 10-40 topics
  // 2 rank: embeddings over topic title + outcomes + kit item prompts (en + hi), cached per topic
  const ranked = await embedRank(item.questionText, cands, { k: 8 });
  // widen if weak: whole book, then prior class (revision homework) — never other subjects
  const pool = ranked[0].score < ctx.cfg.minSim ? await embedRank(item.questionText, widen(ctx), { k: 8 }) : ranked;
  // 3 choose: taxila-fast, JSON schema with enum = pool ids + "none"; returns id + skill ids from that topic's kit
  const pick = await chooseFromEnum(item, pool);      // never free text
  // 4 calibrate (logistic over: sim margin top1-top2, pick==top1, pointer prior p, ocr legibleShare) [U: fit on M-SS2]
  const conf = calibrate(pick, pool, ctx.pointerDist, item);
  return { topicId: pick.id === 'none' ? null : pick.id, skillIds: pick.skillIds, conf,
           route: conf >= 0.85 ? 'auto' : conf >= 0.5 ? 'ask' : 'unmapped', alternatives: pool.slice(0, 2).map(p => p.id) };
}
```

- **`ask`** shows the child two chips with chapter names, in the book's own words. A chip tap is also a
  `child_said` pointer vote.
- **`unmapped`** keeps the subject only and routes to "explain the idea" mode (day-cycle §4.1).
- Mapping never invents a topic outside `data/curriculum` and the alias table.
- Language subjects (English, Hindi; `depth: titles` in the curriculum seed) map to the *lesson* (chapter)
  plus a generic skill family (grammar point, comprehension, writing form). The kits do not yet cover them.

### 4.2 Non-NCERT books (library-level alias, SS6)
1. The parent photographs the contents page. S2 reads it with DI layout tables, giving chapters with page
   numbers.
2. `taxila-brain` maps each chapter to ≤ 3 NCERT topic ids of the same or adjacent class. The candidates
   come from the same subject's curriculum files (constrained enum), with `none` allowed.
3. Code checks that the map is monotone in book order where possible, and flags crossings.
4. The alias row is library data keyed by `(publisher, title, class, edition_year)`. A second family with
   the same book reuses it. A human QA spot-check promotes `draft → verified`.
5. State-board books (RBSE and others in `boards.json`) use the same path until they get their own
   curriculum files.

### 4.3 Item → kit → key (the match ladder)

| level | condition | key source | correctness talk allowed? | evidence class |
|---|---|---|---|---|
| K1 kit item | normalised text ≈ a kit item (rare: NCERT exercise reprinted) | kit `answer` (blind-solver verified) | yes | item.open / mcq |
| K2 kit template | same skill and kind as a kit item, different numbers or context | code solver for computable kinds (arithmetic, fractions, units, place value); else K3 | yes | item.open |
| K3 open item, computable | `taxila-brain` solves twice, independently (different prompt framings, reasoning on, no shared context) | agreement + code re-check of the final value → `dual_solve` | yes | item.open (grader 'llm' folded) |
| K3' disagreement | the two solves disagree, or code rejects | none → `no_key` | **no**: process help only | none |
| K4 open-ended (explain, essay, letter, grammar rewrite) | — | kit `expectations` if a topic matched; else none | only rubric-shaped feedback ("you have the cause, add the effect") | probe.why if matched, else none |

The key is stored in `homework_item.key`. It reaches only: the leak guard, the check-my-working locator,
and evidence classification. It is **never** compiled into the voice instructions (SS7).

---

## 5. Homework-help policy

### 5.1 Principles (the integrity contract, shown to parents once)
- "The homework stays your child's. Taxila helps them understand it and do it themselves." This is a
  floor: no parent setting enables answer mode.
- Explain, don't solve. Point, don't correct. Plan, don't produce.
- Never accuse. Copied-looking work (day-cycle H5) gets "explain one of these to me", not a verdict.
- Help is short and inside the slot cap (day-cycle §3.2). It never assigns extra school-style homework
  (SS14).
- Stuck is a legitimate end state. "Kal teacher se poochna" is a good outcome, and the parent note lists
  *attempted*, not *done*.

### 5.2 The homework ladder (HL), per item

| step | name | teacher move (shape, never a line) | exit to next step when | evidence |
|---|---|---|---|---|
| HL0 | read and restate | child reads the question aloud or in their own words; teacher asks what is being asked and what is given | restatement wrong → stay (misread is the commonest fix) | none |
| HL1 | pump | "what do you know / what have you tried?"; child attempts aloud or on paper | an attempt exists and is wrong, or after 2 contentless turns | the attempt is classified against the key (if K1-K3) |
| HL2 | principle hint | name the concept, the condition, the action in general terms (Aleven: action + condition + principle) | a further wrong attempt or "pata nahi" | hint level logged (kt modifier) |
| HL3 | step prompt | a targeted question on the *first* failing step ("is ten ones ko kya bolte hain?") | still stuck on that step | — |
| HL4 | worked isomorph | teacher works the K2 kit item or a generated isomorph *with different numbers*, on the whiteboard, then asks the child to self-explain one step ("step 2 kyun?") | self-explanation given (any quality) | teach event + probe.why on the isomorph |
| HL5 | own item | child solves the school item alone; teacher only affirms *process* steps, never the value | done, or child asks for a check | independent attempt (down-weighted, H4) |
| — | stuck exit | after HL4 + one HL5 attempt still failing: mark "ask teacher", schedule the skill in tomorrow's lesson (day-cycle §3.4 step 2/4) | — | wheel-spin counter |

**Pacing rules (anti help abuse, all code):**
- A step advances only after a child turn with content. Taps cannot skip.
- "Pata nahi" twice moves *sideways* to a smaller sub-step, never up the ladder (Aleven: rapid
  click-through to the bottom-out is the abuse pattern).
- "Bas answer batao" / "just tell me" jumps directly to HL4. This is honest: the bottom-out is the
  isomorph. The teacher names the deal in a shape like "main ek waisa hi karke dikhati hoon, phir tum
  apna".
- After 2 wrong attempts the teacher *offers* help before being asked (help avoidance: only 34% asked
  after 3 errors [V]).
- Band defaults [I]:
  - B1: the parent is present. HL2 is replaced by a concrete-object prompt (LS-19). The parent gets the
    hint shapes on their screen in their language ("ask her: 10 more than 34?").
  - B3-B4: the child may skip HL0 on second and later items of the same kind.

### 5.3 Item-type policy matrix

| kind | allowed | never |
|---|---|---|
| numeric, word problem | ladder; isomorph worked; "check my working" points to the step | the value, the corrected digit, "almost, it's 42" |
| MCQ | ask for elimination with reasons; check says which *reason* has a gap | which option is right; "not (b)" |
| fill-blank or one-word recall (Science, SST) | point to the textbook section (we know the chapter); quick retrieval on the idea; child finds and writes it | dictating the word |
| short or long answer (explain, why, describe) | Socratic outline: child speaks points; teacher probes against kit `expectations`; child writes in their own words | dictating sentences; writing a model answer for the item |
| essay, letter, story, paragraph (English, Hindi) | idea questions, structure frame (beginning-middle-end as a shape); after the child drafts: feedback on structure + exactly one sentence the child rewrites (H2) | any generated sentence they could copy; rewriting their paragraph |
| grammar or vyakaran worksheet | rule hint with a *different* example word; check points to the line | the filled form for their item |
| translation | meaning questions word by word | the translated sentence |
| diagram or map | which parts and labels a complete diagram needs; checklist | drawing it, or naming a label's position on their item |
| project or creative homework (School Bag Policy style) | plan, materials, safety, timeline; parent-facing checklist | producing content, images or text for submission; Forge never generates school-submittable artefacts |
| "check my answers" on a finished sheet | per item: ✓ looks consistent / ⟳ "look again at step k" / ? unclear; no values | marking with corrected answers; a score |

### 5.4 Leak guard (code, SS7)

```ts
// server/homework/leakGuard.ts — runs on: every on-screen string BEFORE display (pre-check),
// and every teacher transcript turn AFTER speech (post-check; realtime cannot be pre-checked).
export function containsAnswer(text: string, key: AnswerKey): boolean {
  const t = normalise(text);              // lowercase; Devanagari digits ०-९ → 0-9; Hindi/Hinglish number words → digits
                                          // ("teis", "तेईस", "saadhe teen" → 3.5); "3 by 4", "teen bata chaar", "3/4", "0.75" → canonical rational
  return key.forms.some(f => matchesForm(t, f)) &&       // numeric forms compared as rationals, ± unit
         !key.allowContexts.some(c => t.includes(c));    // numbers legitimately present in the question itself
}
export interface AnswerKey { itemId: string; forms: string[]; allowContexts: string[]; source: 'kit' | 'code' | 'dual_solve' }
// post-check hit ⇒ event homework.leak { itemId, turnId } ⇒ Director: item → 'leaked' (no evidence), next
// instruction = isomorphic item for the child to solve alone (ARCHITECTURE §1.2), incident row for review.
```

Notes:
- Keys of K4 open-ended items are not string-checkable. There, the post-check is the
  `taxila-fast` "did the teacher produce a sentence the child could copy as the answer?" classifier. It
  is a signal only, never a gate (orchestration §5.1: a model judge never gates alone).
- The voice prompt receives the school item's *text* (the child is talking about it), so the realtime
  model could solve it itself. Withholding the key reduces leaks but cannot prevent them, which is why
  the post-check and the isomorph recovery exist. M-SS3 measures the residual.

### 5.5 Check my working (where, not what)
1. The child photographs their finished work. S4 transcribes it literally, with D1-D4.
2. For computable kinds, code evaluates each line and returns the first line whose value is inconsistent
   with the previous line or with the question.
3. For other kinds, `taxila-brain` returns `{ firstSuspectLine, category: 'copying_error' | 'operation' |
   'place_value' | 'sign' | 'unit' | 'concept' | 'incomplete' }` and nothing else. That output schema has
   no field for a value.
4. The teacher says "line 3 dekho, borrowing" as a shape. A lint fails the output if the pointer text
   contains any key form.

### 5.6 Homework session state machine (refines day-cycle §4.3)

```ts
type HwState = 'capturing' | 'extracting' | 'confirming_readback' | 'choosing' | 'mapping_ask'
  | { ladder: 'HL0' | 'HL1' | 'HL2' | 'HL3' | 'HL4' | 'HL5' } | 'child_writing' | 'checking'
  | 'explaining_unmatched' | 'stuck_exit' | 'timeboxed' | 'done' | 'abandoned';
// extracting → confirming_readback (any childAnswer present) | choosing
// confirming_readback → choosing (all confirmed/corrected/skipped; skipped ⇒ no evidence from that item)
// choosing → mapping_ask (route 'ask') | {ladder:'HL0'} (K1-K3) | explaining_unmatched (unmapped or K3')
// HL_n → HL_{n+1} only via child content turn (5.2 pacing); "just tell me" → HL4; HL5 success → choosing | done
// HL5 fail after HL4 → stuck_exit → choosing | done ; any → timeboxed (minutes ≥ cap) ; any → abandoned (vibe 'stopped')
// homework.leak in any HL state → item 'leaked' → isomorph assigned → HL5 on the isomorph
```

---

## 6. Test-paper analysis → misconception detection

### 6.1 Flow
```
 parent photographs graded paper (all pages) ─► capture.extract (purpose test_paper, slow lane)
   ─► per question: questionText (printed, DI) · childAnswer (literal, D1-D3) · teacherMark (colour layer)
   ─► map each question to topic/skill (§4.1) and key (§4.3)
   ─► classify outcome per question (code first, then constrained model)
   ─► aggregate: skills × outcomes, error-type profile, misconception hypotheses
   ─► child read-back on the 3-5 questions that matter (wrong + mapped), never the whole paper
   ─► emit test.analysed ─► Conductor: probes scheduled, parent summary, plan weights
```

### 6.2 Per-question outcome classification

| class | rule (in order) | evidence written |
|---|---|---|
| `correct` | teacher tick or full marks | kt evidence, `grader: 'human'`, `context: 'school_test'` |
| `blank` | no answer region ink | opportunity with outcome "no attempt" (not a wrong answer) |
| `misread` | the answer solves a different question (code: matches key of a perturbed reading, e.g. perimeter for area) | strategy note; no misconception |
| `slip` | one arithmetic step wrong, method right, and the same skill correct elsewhere on the paper | small LR; no misconception |
| `procedural(k)` | consistent wrong step type (code taxonomy: borrow, carry, place value, sign, order of operations, unit) | evidence + generic error class |
| `conceptual → mc_id` | `taxila-fast` chooses from **that topic's kit misconception ids** + `other` + `none`, given literal work and the kit `signs[]` | **hypothesis only** (§6.3), never kt_misconception directly |
| `presentation` | right value, marks lost for units/steps/notation | none; parent-facing "show steps" note |
| `disputed` | our `dual_solve`/kit key and the teacher's mark disagree | nothing to the child (SS11); parent sees "worth asking about Q4" only if read-back confirmed |

The teacher's mark is the correctness signal because it comes from a human grader. Our transcription is
used only to explain *why*. Partial credit maps to the categorical outcomes in kt-algorithms §1.2 [U:
mapping]. A school test is independent and delayed, so it is logged as an **external outcome** for
efficacy measurement (LS-36). It adds evidence at weight 0.7 [U], but it never on its own sets `mastered`,
because test conditions and transcription are uncertain.

### 6.3 From hypothesis to confirmed misconception
- A hypothesis row holds `(child, misconception_id, source = test|homework, question refs, prior)`.
- **Strength.** One question gives `weak`. The same misconception on ≥ 2 questions, or on a test plus a
  homework item, gives `moderate`. This rests on constrained-classification precision of ~0.75 at best
  [V, Otero], and lower for ratios.
- **Confirmation.** The Conductor schedules the kit's `diagnostic` item for that misconception into the
  next lesson's warm-up, using the probe budget (lesson-arc §6). Then:
  - a diagnostic choice that hits the misconception option writes the kt_misconception evidence;
  - a correct choice retires the hypothesis (`refuted`);
  - after two unconfirmed weeks the hypothesis expires.
- **Effect on the plan:** a confirmed misconception →
  - a remediation segment, with the kit `remediation.representation` and move shape;
  - a contrast probe;
  - a delayed re-check two sessions later.
- **Error-profile effects** (never stored as traits, only as counts on the paper):
  - many `misread` → a "read the question twice" strategy turn in the next exam window;
  - many `presentation` → a parent note about showing steps.

### 6.4 What the parent sees (parent-experience PX rules)
"What this test shows" sits on the Parent corner card, with three parts:
- skills that held up;
- 1-2 tricky bits in skill language ("borrowing across a zero");
- what Taxila will do this week.

It shows no marks re-computation, no rank and no predicted marks. Low-confidence rows show as "we
couldn't read Q5 clearly". A disputed mark shows only as "worth asking about Q4". The test is never a
push notification (DC8).

---

## 7. Timetable, exam schedule, PTM remarks, today's topic

- **Timetable.**
  - DI layout table → `{weekday → [period, subject]}`. Subject names are normalised by a small
    dictionary (Maths/Mathematics/गणित/Ganit; EVS/Our Wondrous World; SST/Social).
  - The parent confirms the grid once per term.
  - Uses:
    - a homework *expectation* per day: "today had Maths and Hindi", so a session open asks about those
      two;
    - mapping priors;
    - the morning preview choosing a subject that is actually on today's timetable;
    - the `school_return` wakeup time (orchestration §5.6).
- **Exam schedule and syllabus.**
  - The date sheet gives rows `{date, subject, test name}`. The syllabus circular gives `{test, subject,
    chapters as printed}`, mapped through §4.2 to chapter ids.
  - The parent confirms the dates. Each row emits `school.test_announced`, which opens the day-cycle
    §7.3 window.
  - A syllabus that is "Ch 1-4" in a private book resolves through the alias table. If no alias exists,
    the parent is asked to photograph the contents page (one ask).
- **PTM and report-card remarks (SS12).**
  - Text is entered, dictated or photographed. `taxila-fast` splits it into clauses and classifies each
    as `academic(subject, skill candidates)` | `behaviour` | `logistics` | `praise`.
  - Academic clauses map through §4.1 (constrained) and show to the parent as "Teacher said fractions
    are weak. Should Taxila focus on these?" with the topic chips. A yes becomes a parent goal that
    weights the plan.
  - Behaviour clauses ("talks in class", "careless", "slow writer") are saved verbatim in the parent's
    private note. They never reach the ChildBrief, the teacher, the KT model or the report writer.
  - Handwriting or speed remarks may become a parent-chosen *accommodation* setting ("shorter writing
    tasks"), never a label (vibe §4.9).
  - The monthly AI "PTM" (parent-experience §9) can show what the school said next to what Taxila sees,
    as two columns, without reconciling them into a verdict.
- **Today's topic, from the child.**
  - The first 30-60 s of the after-school session opens with "aaj school mein kya hua?" as a shape.
  - The utterance is classified against `timetable(today) × pointer ±2 chapters` (constrained enum) and
    becomes a `child_said` vote.
  - When it agrees with the pointer it is accepted silently. When it conflicts, the teacher asks one
    chip question. Children's reports are also relationship material (memory consolidator), so the
    question is conversational, not a form.
  - It is never asked twice in one day and is skippable.

---

## 8. Data

### 8.1 Events (additions to `shared/conductor/events.ts`)

```ts
  | { type: 'capture.submitted'; captureId: string; purpose: CapturePurpose; pages: number; by: 'child' | 'parent'; via: 'camera' | 'gallery' | 'share' }
  | { type: 'capture.extracted'; captureId: string; extractId: string; items: number; legibleShare: number; uncertainTokens: number }
  | { type: 'capture.unreadable'; captureId: string; reason: 'blur' | 'dark' | 'no_page' | 'script_gated' | 'empty' }
  | { type: 'school.pointer_changed'; subject: Subject; from: string | null; to: string; p: number }
  | { type: 'school.timetable_confirmed'; validFrom: string }
  | { type: 'school.book_registered'; subject: Subject; bookRef: BookRef }
  | { type: 'homework.task_created'; taskId: string; subject: Subject; topicIds: string[]; dueOn?: string; source: CapturePurpose | 'child_said' | 'parent' }
  | { type: 'homework.session_ended'; hwSessionId: string; itemsAttempted: number; maxLadder: string; stuckItems: number; leaked: number; minutes: number }
  | { type: 'homework.leak'; hwSessionId: string; itemId: string; lane: 'voice' | 'screen'; turnId?: string }
  | { type: 'test.analysed'; testId: string; subject: Subject; questions: number; mapped: number; hypotheses: string[]; disputed: number }
  | { type: 'misconception.hypothesis'; hypothesisId: string; misconceptionId: string; strength: 'weak' | 'moderate' }
  | { type: 'school.ptm_note_added'; noteId: string; academicClauses: number }
// 'homework.submitted' (orchestration §3.1) becomes an alias of capture.submitted{purpose:'homework'} at ingest.
```

New job kinds are `capture.extract` (fast or slow lane by purpose), `school.map_book` (library, slow) and
`test.analyse` (slow, priority 2). The existing `homework.prepare` precomputes keys and isomorphs for
tasks due tomorrow during night prep (day-cycle §9). Each job declares `concurrencyKey: child:{id}` = 1
and reserves its budget with the cost governor (orchestration C7).

### 8.2 Ownership (adds to orchestration §6)

| fact | owner (only writer) | table |
|---|---|---|
| captures, extracts, transcription | capture pipeline | `capture`, `page_extract`, `extract_item` |
| school mirror (pointer, timetable, tests, books) | school-sync module (folded from events) | `school_mirror` (+ events) |
| book aliases | library curation (QA promotes) | `school_book`, `school_book_chapter` |
| homework tasks, sessions, ladder events | Director (homework mode) | `homework_task`, `homework_item`, `homework_session`, `hint_event` |
| test results and hypotheses | test analyser; confirmation by KT | `test_paper`, `test_question`, `misconception_hypothesis` |
| PTM notes | parent API | `ptm_note` |

### 8.3 SQL (proposed `db/migrations/0xx_school_sync.sql`)

```sql
create table capture (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  purpose text not null, pages int not null check (pages between 1 and 6),
  captured_by text not null check (captured_by in ('child','parent')), via text not null,
  blob_prefix text not null,                       -- private container; raw deleted per policy
  raw_delete_after timestamptz,                    -- null = parent "notebook keep" on
  raw_deleted_at timestamptz, created_at timestamptz not null default now()
);
create table page_extract (
  id uuid primary key, capture_id uuid not null references capture(id) on delete cascade,
  extract_version text not null,                   -- deployment ids + prompt hashes (vision drift)
  script text not null, legible_share real not null, uncertain_tokens int not null,
  body jsonb not null,                             -- PageExtract minus items
  created_at timestamptz not null default now()
);
create table extract_item (
  id uuid primary key, extract_id uuid not null references page_extract(id) on delete cascade,
  item_ref text not null, kind text not null, region_ids text[] not null check (cardinality(region_ids) > 0),
  question_text text not null, child_answer jsonb, read_back text check (read_back in ('pending','confirmed','corrected','skipped')),
  teacher_mark jsonb, topic_id text, skill_ids text[], map_conf real, map_route text
);
create table school_mirror (
  child_id uuid primary key references child(id) on delete cascade,
  board text, medium text, books jsonb not null default '{}', timetable jsonb, pointers jsonb not null default '{}',
  calendar jsonb not null default '{}', confirm_week text, confirm_asked int not null default 0,
  version bigint not null default 0, updated_at timestamptz not null default now()
);
create table school_book (                         -- library level: no child data
  id text primary key,                             -- hash(publisher,title,class,edition_year)
  publisher text not null, title text not null, class int not null, subject text not null, edition_year int,
  status text not null default 'draft' check (status in ('draft','verified','rejected')), created_at timestamptz default now()
);
create table school_book_chapter (
  book_id text references school_book(id) on delete cascade, number int not null, title text not null,
  ncert_topic_ids text[] not null default '{}', map_conf real, primary key (book_id, number)
);
create table homework_task (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  subject text not null, topic_ids text[] not null default '{}', due_on date, source text not null,
  capture_id uuid references capture(id) on delete set null, status text not null default 'open'
    check (status in ('open','helped','stuck','closed')), created_at timestamptz not null default now()
);
create table homework_item (
  id uuid primary key, task_id uuid not null references homework_task(id) on delete cascade,
  extract_item_id uuid references extract_item(id) on delete set null,
  match_level text not null check (match_level in ('K1','K2','K3','K3x','K4')),
  kit_item_id text, isomorph_item jsonb,           -- the worked example the voice may use
  key jsonb,                                       -- AnswerKey; NEVER sent to the client or compiler
  outcome text check (outcome in ('solved_alone','solved_after_HL4','stuck','leaked','skipped'))
);
create table hint_event (
  hw_session_id uuid not null, item_id uuid not null references homework_item(id) on delete cascade,
  seq int not null, step text not null, trigger text not null,    -- 'child_turn' | 'just_tell_me' | 'offered' | 'sideways'
  at timestamptz not null default now(), primary key (hw_session_id, item_id, seq)
);
create table test_paper (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  capture_id uuid references capture(id) on delete set null, subject text not null,
  test_name text, taken_on date, max_marks real, awarded real, analysed_at timestamptz
);
create table test_question (
  test_id uuid references test_paper(id) on delete cascade, item_ref text not null,
  topic_id text, skill_ids text[], outcome_class text not null, misconception_id text,
  awarded real, max real, key_source text, primary key (test_id, item_ref)
);
create table misconception_hypothesis (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  misconception_id text not null, source text not null check (source in ('test','homework')),
  refs jsonb not null, strength text not null check (strength in ('weak','moderate')),
  status text not null default 'open' check (status in ('open','probing','confirmed','refuted','expired')),
  created_at timestamptz not null default now(), expires_at timestamptz not null
);
create table ptm_note (
  id uuid primary key, child_id uuid not null references child(id) on delete cascade,
  raw_text text not null,                          -- parent-private; never in ChildBrief (SS12)
  academic jsonb not null default '[]',            -- [{clause, subject, topicIds[], parentConfirmed}]
  created_at timestamptz not null default now()
);
create index on homework_task (child_id, status, due_on);
create index on misconception_hypothesis (child_id, status);
```

Invariant tests (`node --test tests/`), written as predicates. Each test needs a negative control.

| id | invariant |
|---|---|
| I1 | No compiled voice instruction contains any `homework_item.key.forms` value outside `allowContexts`. The test fuzzes the compiler with keys present. |
| I2 | An `extract_item` with an empty `region_ids` cannot be inserted. |
| I3 | No `kt_evidence` row has `context = 'homework'` unless its source item's `read_back` is `confirmed` or `corrected`. |
| I4 | `ptm_note.raw_text` is unreachable from the ChildBrief builder (static import check plus a runtime test). |
| I5 | Every `misconception_hypothesis` id exists in that topic's kit. |
| I6 | The check-my-working output schema has no value-bearing field. |

---

## 9. Privacy and safety
- **Minimise:**
  - Faces are blurred at S0 and never stored.
  - Names of other children, teachers, phone numbers and WhatsApp group names are stripped from shared
    text on the device and again on the server (regex plus DI key-value detection) [I].
  - School name is hashed.
  - Raw images are deleted after extraction unless the parent enables "notebook keep" (SS13).
  - The extract keeps item text, the chapter guess and region boxes, and nothing else.
- **Safety scan:** essays, diary pages and "my family" compositions go through the transcript safety
  classifier (S8). A hit follows the same safeguarding protocol, including the parent-suppression branch
  (orchestration §5.8).
- **Honesty:** the teacher says plainly when she cannot read something ("yeh line mujhe saaf nahi dikh
  rahi"). She never pretends to have seen a page she did not receive (harvest: grounding by delivery).
- **No school-facing output** in v1: nothing is sent to schools. The printable PTM card stays the parent's
  (parent-experience §9).

## 10. Cost and latency (all [U] until measured)
- **Per homework page:** 1 luna low-detail classify, 1 DI layout page, 2-6 sol high-detail crops, 1 luna
  structure call, embeddings, 1 luna enum pick per item, and K3 dual solves only for chosen items.
- **Budget:** under ₹1 per page target [U]. This needs the M-SS1 run to price. DI Read/Layout per-page
  pricing must be checked on the Azure pricing page before committing [U].
- **Latency:** time from photo to item chips ≤ 8 s p50 / 15 s p90 on the fast lane [U].
  - Item chips stream as each item clears S7.
  - Keys for the item the child picks compute while HL0-HL1 run, because those steps need no key.
- **Night prep:** precompute isomorphs and keys for tasks due tomorrow (`homework.prepare`, slow lane,
  Batch where allowed).

## 11. Measurements and gates (log each with n, method, date in `context/measurements.md`)

| id | what | method | gate before the feature ships [I] |
|---|---|---|---|
| M-SS1 | transcription fidelity by script × kind × band (`en-print`, `en-hand`, `hi-print`, `hi-hand`, `math-hand`) | **bench:** ≥ 300 crops per cell from consented real notebooks (parent donation opt-in) plus staff-written child-style pages with **planted errors** (FERMAT/PINK style). **arms:** DI only, sol literal-first (D1-D3), sol single-call. **metrics:** CER, digit error rate, over-correction rate on planted errors, fabrication (asserted text absent from the page), illegible-flag recall. Re-run on every deployment or version change | digits ≤ 2% error; over-correction ≤ 5% after D1-D3; fabrication 0 asserted items in the bench; `hi-hand` must pass separately (SS4) |
| M-SS2 | mapping accuracy | 500 real homework items labelled by two teachers (κ reported) | top-1 ≥ 90% at `auto`; `ask` resolves ≥ 95% |
| M-SS3 | answer leakage | child-simulator red team, 200 homework sessions pushing for answers (Hinglish, Devanagari numerals, "bas bata do") | 0 screen-lane leaks; voice-lane leaks ≤ 1% of items, with recovery to an isomorph in 100% |
| M-SS4 | key and hypothesis quality | dual-solve key error vs teacher keys (n ≥ 500 items); hypothesis precision vs teacher raters; probe-confirmation rate | key error < 0.5%; confirmation ≥ 30% (SS10 reversal) |
| M-SS5 | learning effect | DC-M5 micro-RCT (day-cycle): ladder vs no homework help, delayed independent test | ladder ≥ no help (non-inferiority) |
| M-SS6 | capture usability | retake rate, time to chips, abandonment at capture, by band and phone RAM tier | retake ≤ 25%; abandonment ≤ 15% |

The benchmark idea is this file's. Its thresholds are proposals, not literature standards.

## 12. Open questions and risks
- **Hindi handwriting** may not reach the gate with gpt-5.6. Then Hindi-medium children rely on read-aloud
  for homework evidence. The help flow still works, because the child can read the question aloud too.
  Escalate to the owner rather than adding a non-Azure OCR vendor (azure-only-compute).
- **Siblings and parents off-mic.** Homework evidence is down-weighted (H4). Test papers are independent
  but old.
- **Private-book coverage.** Unknown share. Measure the alias hit rate in the first 500 families.
- **Language subjects** (English and Hindi grammar and writing) have no kits yet, so they get process help
  only until kits exist.
- **Teacher-mark reading:** colour masks fail on blue-ink teachers or photocopies. Fall back to the vision
  read with D4.
- **Disputed marks** could erode trust in Taxila *or* in the school. SS11 keeps it parent-only. Measure
  parent reactions qualitatively.
- **The `taxila-fast` enum pick** for misconceptions on ratios is expected to be weak (0.286 precision in
  Otero [V]). Consider generating no hypotheses for ratio topics until data exists.

## 13. Sources
- Aleven, McLaren, Roll & Koedinger 2016, *Help helps, but only so much*, IJAIED 26(1):205-223 — https://www.cs.cmu.edu/~aleven/Papers/2016/Aleven_etal_IJAIED2016-Helpseeking.pdf [V]
- Bastani et al. 2025, *Generative AI without guardrails can harm learning*, PNAS — https://www.pnas.org/doi/10.1073/pnas.2422633122 (correction: https://www.pnas.org/doi/10.1073/pnas.2518204122) [S]
- Microsoft Learn, Document Intelligence Read/Layout language support (v4.0, updated 2026-07-10) — https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/language-support/ocr [V]
- Microsoft Learn, vision-enabled chat models (detail, limits; 2026-07-29) — https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/gpt-with-vision [V]
- Singh 2026, *Can OCR-VLMs Read Devanagari?* — https://arxiv.org/abs/2606.29213 [V, abstract]
- Seong, Liermann, Kim, Shin & Lim 2026, *When VLMs "Fix" Students* — https://arxiv.org/html/2604.22774v2 [V]
- Levine, Aenlle, Zilles, West & Silva 2026, *Automated Grading of Handwritten Mathematics Using Vision-Capable LLMs* — https://arxiv.org/abs/2605.19043 [V]
- FERMAT, *Can Vision-Language Models Evaluate Handwritten Math?*, ACL 2025 — https://aclanthology.org/2025.acl-long.720/ [S]
- Otero, Druga & Lan 2024, *A Benchmark for Math Misconceptions* — https://arxiv.org/html/2412.03765v1 [V]
- Eedi, *Mining Misconceptions in Mathematics* (Kaggle 2024) — https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics [S]
- MoE/NCERT, *Policy on School Bag 2020* — https://ncert.nic.in/pdf/Final%20School%20Bag%20Policy%202020.pdf [V]
- Repo: `docs/harvest/json/hp-main-engine.json` (vision-fab, vision drift), `hp-main-voice-surfaces.json` (A35 camera, grounding by delivery), `hp-companion-voiceclone.json` (HC51 DAG, noisy-input law) [V, repo]
