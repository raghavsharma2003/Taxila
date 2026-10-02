# Need and goals: the NeedModel, the first meeting, and how need stays current

2026-10-02 · scope: modelling a child's NEED (school pace and syllabus position, upcoming tests, homework, parent goals, gap-to-grade, aspiration), how expert tutors run a first meeting, the intake conversation (parent and child), and updates from homework photos and parent check-ins.

**Builds on, does not repeat:** `learning-science.md` (rule 28 placement, §5 TaRL/ASER/PARAKH levels, §8 profile, §9 E8), `design/parent-experience.md` (onboarding O1-O9, School sync, PX rules, cadence cap, PTM), `learner/vibe-temperament.md` (rapport, age bands, session state), `safety/dpdp-deep.md` (legal modes M0-M3; the Need row is "parent-declared, low risk"), `harvest/gurukul.md` §4.5-4.7 (integrity, exam window not countdown), `voice/indian-teacher-discourse.md` §2.6 (tuition talk).

**Tags** (house scheme): **[V]** read in the primary source this session (abstract-only reads say so) · **[S]** secondary source · **[M]** from memory or unverified, check before build · **[U]** untested hypothesis or starting number to tune · **[I]** my inference. Web search budget was exhausted before this task started, so sources were fetched by known URL or DOI (OpenAlex / Semantic Scholar lookups); anything I could not fetch is [M].

**Authoring law applies:** everything below that the teacher "says" is a *shape* (`⟨slot⟩` patterns, move names), never a line. Any UI copy shown is layout only and must not be pasted into a prompt.

**Owner directives that bind this design (Taxila `CLAUDE.md`, 2026-10-02):** Azure-only compute and AI (photo extraction runs on Azure OpenAI gpt-5.6 vision; transient photo storage is Azure Blob, not a third-party store); compliance is deprioritised, so the legal-mode table (§4.8) is a switch-on spec, not a launch gate. The child-safety and anti-pressure invariants (N2, N3, N10-N12) are product and stay regardless.

---

## 1. Findings that change the design

1. **The tutor's impression of what a child "doesn't get" is the least reliable part of a first meeting.** Tutors "could only assess students' normative understanding ... but tutors were dismal at diagnosing the students' alternative understanding" (Chi, Siler & Jeong 2004) [V-abstract; upgrades learning-science §1.2's [M]]. Parents are worse: beliefs about their child's performance "are often inaccurate" (Dizon-Ross 2019, AER) [V-abstract]. **So intake collects *facts* from people and *level* from structured probes.** A parent's "kamzor hai fractions mein" is stored as a belief, used to prioritise *what to probe*, and never written into skill state.
2. **Who knows what, reliably, differs by claim type.** Parents and printed school papers are good for dates, chapters and the book in use; children 10-15 are fair for "what happened in class today"; children 6-9 are poor for dates and chapter names [I]. Photos of printed text are far more reliable than photos of handwriting (FERMAT: VLM error localisation on handwritten maths 0.45 for GPT-4o, and "performance improves consistently as visual complexity is reduced") [V]. The model weights each observation by **source x claim type** (§3.2), not by who is speaking.
3. **The Indian school year is test-shaped, and the shape is only partly public.** CBSE Class IX 2026-27 [V]: school-run annual exam 80 marks (3 h) + internal assessment 20; IA = periodic assessment, multiple assessment, portfolio, subject enrichment at 25% each; **three periodic assessments per subject, average of the best two, at least one competency-based**; Maths and Science now Standard (compulsory) plus optional **Advanced** (25 marks, 1 h, all HOTS); Basic/Standard maths discontinued from 2026-27; Class IX graded absolutely A1 (91-100) to D (33-40); board papers about 50% competency-focused. Maths IX unit weights: Number System 7, Algebra 20, Coordinate Geometry 4, Geometry 25, Mensuration 14, Statistics and Probability 10; typology 54% remember/ understand, 24% apply, 22% analyse/evaluate/create; IA for maths = pen-paper test + multiple assessment 5+5, portfolio 5, lab 5 [V]. **For classes 1-8 CBSE lets schools set assessment and even books** (`data/curriculum/boards.json`, bye-law 2.4.7) [V]; the common "PT1, half-yearly, PT2, annual" pattern is [M]. **Design consequence:** the calendar is learned per child from datesheets, diaries and parents; board templates are only priors.
4. **Year-end stakes rose in classes 5 and 8.** The 2019 RTE amendment "removed the no-detention policy, thereby allowing state governments to reintroduce examinations in Classes 5 and 8", with remedial instruction and a re-exam before detention [S, Wikipedia]. A December 2024 central rule for central-government schools (re-exam within two months) is [M]. Weight annual exams higher in classes 5 and 8 where the child's school detains.
5. **Proximal goals work for children; distal goals do nothing.** Children with "gross deficits and disinterest" in maths, given proximal subgoals, "progressed rapidly ... achieved substantial mastery", gained self-efficacy and intrinsic interest; "distal goals had no demonstrable effects"; proximity also produced *calibrated* self-efficacy (Bandura & Schunk 1981) [V-abstract]. For adolescents, a 30-minute mental-contrasting + implementation-intentions exercise produced "more than 60% more practice questions" before a high-stakes exam (Duckworth et al. 2011, n=66) [V-abstract]. **Child goals are one-week goals; if-then plans only for ages 12-15.**
6. **Parents should set routines, not teach the maths.** Across 448 studies (480,830 families), parent involvement correlates small-positive with achievement (r = .13-.23), "the only exception was that parents' homework assistance was negatively associated with children's achievement (r = -.15)" (Barger et al. 2019, Psych Bull) [V-abstract]. Patall, Cooper & Robinson 2008: training parents raised homework completion; **rule-setting** had the strongest association; associations were negative in middle school and for maths [V-abstract]. Homework-achievement correlations are stronger in grades 7-12 than K-6 (Cooper et al. 2006) [V-abstract]. **So:** parent check-ins ask for facts and routines; homework support lives with the AI teacher; homework is a stronger lever for classes 6-9 and mainly a *school-sync signal* for classes 1-5.
7. **Exams are already the main anxiety.** NCERT's 2022 survey (n = 3,79,842, grades 6-12, 28 states + 8 UTs): 81% named studies, exams and results as the cause of anxiety; exams/results alone 33-34% at the middle stage; girls reported more [V]. Need modelling must never become a pressure engine: windows not countdowns (gurukul §4.7), no predicted marks, no "behind" talk to the child.
8. **A diagnosis can be a sales weapon.** BYJU'S "commission sales that diagnosed children as weak in order to sell them" (`market/india-incumbents.md` §4.1) [S]. Placement output is structurally barred from any payment or upsell surface (invariant N12).
9. **Good tutoring programmes align with the classroom and talk to families.** NSSA quality standards: an intentional relationship strategy, tutor consistency, **curricular alignment** ("reduces the potential for student confusion"), formative assessment used to plan sessions, an individual progress measure, and regular caregiver engagement; no standard covers goal setting or the first session [V]. TaRL's tool rates each child at "the highest level they can comfortably achieve", from letters to a Grade-2 story and from number recognition to 3-digit by 1-digit division (ASER tools, 19 languages, "All Rights Reserved") [V]. **Build our own ASER-style items; do not copy theirs.**
10. **Aspiration is gendered at home.** Young Lives found "an 'institutionalized' gender bias against girls in education in India" across ages 8-15, including in aspirations (Dercon & Singh 2013) [V-abstract]. Taxila records only the child's own stated interest, never a parent's career plan for the child, and gender is not an input anywhere in NeedModel (invariant N11).

---

## 2. What "need" means, as five questions the Director must answer every session

| question | NeedModel part | consumer |
|---|---|---|
| Q1 Where is school now, in each subject? | `SyllabusPace` (position + pace filter, §4.3) | school-sync track, parent "School mein abhi" |
| Q2 What is coming, and what does it cover? | `AssessmentEvent[]` + readiness (§4.4) | exam-window mode, parent window card |
| Q3 What was assigned? | `HomeworkItem[]` (§6) | homework track (teach toward, never hand over) |
| Q4 How far is the child's working level from the class? | `Placement` per strand, θ on a grade scale (§4.5) | foundation track (TaRL), level bridge |
| Q5 What do the parent and child want? | `Goal[]`, `Constraint` (§4.6) | planner weights, goal card, PTM agenda |

Need decides **what to work on** and **in what proportion**. It never decides mastery (knowledge layer) or how to teach (format layer). One-way flow: Need reads skill state; Need never writes it, except placement seeding, which is capped at `practising` (N9).

---

## 3. Sources of need information and how much each is trusted

### 3.1 Channels
- **Parent onboarding** (O4 in parent-experience.md, plus three fields here, §5.2).
- **Parent "first meeting" voice call** (optional, 3-6 min, §5.3).
- **Child intake lesson** (`lesson.kind = 'diagnostic'`, §5.4).
- **Lesson-start "school check" move** (every lesson, 1 child turn, §7).
- **Photos**: school diary, homework page, worksheet, datesheet or circular, marked test (§6).
- **Parent check-ins**: one quick-reply question riding on the weekly report, plus the PTM agenda (§8).

### 3.2 Reliability matrix (observation noise for the filters; [U] starting values, calibrate in MN1-MN2)

| claim type | datesheet/circular photo | printed page photo | handwritten photo | parent one-tap confirm | parent free answer | child 10-15 | child 6-9 |
|---|---|---|---|---|---|---|---|
| chapter now (σ in topics) | 0.5 | 0.7 | 1.5 | 1.0 | 1.5 | 1.5 | 2.5 |
| test date | exact after confirm | n/a | n/a | exact | ±3 days | ±3 days, needs confirm | never auto-applied |
| test scope | high | n/a | n/a | high | medium | low | ignore |
| child's level | n/a | n/a | hypothesis only | **belief, not evidence** | belief | self-report, invalid | invalid |

Self-report of understanding is invalid evidence (learning-science rule 1); a parent's or child's level claim only creates a **probe request** (§4.7).

---

## 4. NeedModel specification

### 4.1 Types (TypeScript; `shared/need.ts`, pure, imported by Director and server)
```ts
export type Subject = "maths" | "science" | "evs" | "english" | "hindi" | "sst";
export type NeedSource =
  | "parent_onboarding" | "parent_call" | "parent_checkin" | "parent_app"
  | "photo_datesheet" | "photo_printed" | "photo_handwritten" | "photo_diary" | "photo_marked_test"
  | "child_said" | "inferred";
export interface BookRef { subject: Subject; bookId: string; // "ncert:c6-maths" | "private:<slug>" | "unknown"
  mapBy: "chapter" | "topic"; }                                 // ICSE/private books map by topic (boards.json)
export interface SyllabusPace {                                 // §4.3; one per (child, subject)
  subject: Subject; book: BookRef; nTopics: number;
  p: number; v: number;                                         // topic index; topics per school-week
  P: [number, number, number, number];                          // 2x2 covariance, row-major
  at: string; lastObs?: { source: NeedSource; at: string };
  gatedRun: { z: number; at: string }[];                        // outliers held for re-init (§4.3)
}
export type AssessmentKind = "class_test" | "unit_test" | "periodic" | "half_yearly" | "annual"
  | "term" | "olympiad" | "entrance" | "state_survey" | "other";
export interface AssessmentEvent {
  id: string; kind: AssessmentKind; subjects: Subject[];
  window: { start: string; end: string };                       // dates; a single day is start = end
  scope: { topicIds: string[]; source: NeedSource; confidence: number } | null;
  source: NeedSource; confirmed: boolean; status: "upcoming" | "in_window" | "done" | "cancelled";
  stakes?: "detention_year";                                    // class 5/8 where the school detains (§1.4)
  result?: { said: "good" | "ok" | "hard" | null; marks?: number; max?: number }; // parent-entered only
}
export interface HomeworkItem {
  id: string; subject: Subject; topicIds: string[]; questionsText: string[]; // printed text only, no names
  due?: string; source: NeedSource; status: "open" | "worked_on" | "child_done" | "dropped";
}
export type Strand = `${Subject}:${string}`;                    // e.g. "maths:fractions", "hindi:decoding"
export interface Placement {                                    // §4.5
  strand: Strand; thetaMean: number; thetaSd: number;           // grade-level scale, 0 = start of class 1
  enrolledLevel: number; nItems: number; at: string; method: "intake" | "jit" | "rolling";
  aserBand?: "letter" | "word" | "para" | "story" | "num1_9" | "num10_99" | "sub" | "div"; // foundational only
}
export type ParentGoal = "test_results" | "understand" | "catch_up_basics" | "homework_independence"
  | "confidence" | "entrance_target" | "stay_ahead" | "reading" | "other";
export interface Goal {
  id: string; owner: "parent" | "child"; kind: ParentGoal | "proximal";
  rank?: 1 | 2;                                                 // parent: top two only
  target?: { skillIds?: string[]; topicIds?: string[]; by?: string; entrance?: "jnv" | "sainik" | "olympiad" | "other" };
  ifThen?: { when: string; then: string };                      // ages 12-15 only (§5.4 I4)
  note?: string;                                                // ≤120 chars, parent-visible
  status: "active" | "met" | "dropped"; createdAt: string;
}
export interface Constraint { minutesPerDay: number; tuitionSubjects: Subject[]; freeWindows: string[];
  homeworkArrives: ("diary" | "whatsapp_group" | "school_app" | "child_tells")[]; helper?: "parent" | "sibling" | "tutor" | "none"; }
export interface ParentBelief { skillOrTopicId: string; says: "can" | "cannot" | "unsure"; at: string; source: NeedSource }
export interface NeedModel {
  childId: string; classLevel: number; board: string; medium: string; books: BookRef[];
  pace: SyllabusPace[]; events: AssessmentEvent[]; homework: HomeworkItem[];
  placements: Placement[]; goals: Goal[]; constraint: Constraint; beliefs: ParentBelief[];
  probeRequests: { skillId: string; reason: "parent_belief" | "photo_mark" | "photo_error" | "child_said"; at: string }[];
}
```
ChildBrief (contracts.ts) gains one telegraphic field, ≤ 40 tokens, appended with the move: `need: "school ⟨topicTitle⟩ · window ⟨kind⟩ ⟨bucket⟩ (⟨scope chapters⟩) · goal ⟨skill⟩ by ⟨weekday⟩"`. `bucket` ∈ {this week, next week, in 2-3 weeks, later}. **No day counts reach the child or the model.**

### 4.2 Storage (`db/migrations/002_need.sql`, sketch)
```sql
create table need_observation (            -- append-only ledger: every claim, its source, what it changed
  id bigserial primary key, child_id uuid not null references child(id) on delete cascade,
  kind text not null,                      -- position | event | scope | homework | belief | result | goal | constraint
  source text not null, payload jsonb not null, confidence real not null,
  applied boolean not null, gated_reason text, confirmed_by text,   -- 'parent' | 'child' | null
  at timestamptz not null default now());
create table syllabus_pace (child_id uuid references child(id) on delete cascade, subject text,
  book_id text not null, n_topics int not null, p real not null, v real not null, cov real[4] not null,
  at timestamptz not null, primary key (child_id, subject));
create table assessment_event (id uuid primary key default gen_random_uuid(),
  child_id uuid not null references child(id) on delete cascade, kind text not null, subjects text[] not null,
  win_start date not null, win_end date not null, scope_topic_ids text[], scope_conf real,
  source text not null, confirmed boolean not null default false, status text not null default 'upcoming',
  stakes text, result jsonb);
create table homework_item (id uuid primary key default gen_random_uuid(), child_id uuid not null references child(id) on delete cascade,
  subject text not null, topic_ids text[] not null, questions_text text[] not null, due date,
  source text not null, status text not null default 'open', created_at timestamptz not null default now());
create table placement (child_id uuid references child(id) on delete cascade, strand text,
  theta_mean real not null, theta_sd real not null, enrolled_level real not null, n_items int not null,
  method text not null, aser_band text, at timestamptz not null, primary key (child_id, strand));
create table goal (id uuid primary key default gen_random_uuid(), child_id uuid not null references child(id) on delete cascade,
  owner text not null, kind text not null, rank int, target jsonb, if_then jsonb, note text check (length(note) <= 120),
  status text not null default 'active', created_at timestamptz not null default now());
create table parent_belief (id bigserial primary key, child_id uuid not null references child(id) on delete cascade,
  ref_id text not null, says text not null, source text not null, at timestamptz not null default now());
-- photos: NO table. Images live in a per-request buffer, deleted after extraction (§6.5).
-- consent purposes gain 'notebook_photos' (default off; parent-enabled control already exists).
```
Constraint, books and board live on `child` (new columns `books jsonb`, `constraint jsonb`).

### 4.3 Syllabus position: a constant-velocity filter per subject
State `x = [p, v]`: `p` = topic index in the child's book order (curriculum JSON order; for `mapBy: "topic"` books, the NCERT topic order is the proxy), `v` = topics per **school-week** (holidays excluded via a calendar: default regional vacations [M] + parent-entered breaks).

- **Prior at onboarding** (date `t`, session start April [M]): `v0 = nTopics / 32` (≈ 32 teaching weeks [U]; Class 6 maths has 36 topics → 1.1/week; Class 9 maths 41 → 1.3/week); `p0 = v0 · schoolWeeks(sessionStart, t)`; `P0 = diag((0.3·p0)² + 4, (0.3·v0)²)`. On 2 October (≈ 19 school-weeks after a summer break) a Class 6 maths prior is about topic 21 of 36 (± 7). The parent's first one-tap confirm usually collapses this.
- **Predict** over `Δ` school-weeks: `p ← p + vΔ`; `P ← F P Fᵀ + Δ·diag(qP, qV)`, `F = [[1,Δ],[0,1]]`, `qP = 0.3`, `qV = 0.02` [U].
- **Update** with chapter-level observation `z` (the chapter's middle topic) and `R = nTopicsInChapter²/12 + σ_source²` (σ from §3.2). Innovation `y = z − p`, `S = P₀₀ + R`. **Gate** if `y²/S > 9`: a homework page from an old chapter is usually *revision*, not position. Gated observations are logged (`applied = false`); two gated observations agreeing within 2 topics and 2 school-weeks **re-initialise** `p` at their mean with variance `R` (the school jumped, or our book map is wrong).
```ts
export function paceUpdate(s: SyllabusPace, z: number, R: number): { s: SyllabusPace; gated: boolean } {
  const [a, b, c, d] = s.P, S = a + R, y = z - s.p;
  if ((y * y) / S > 9) return { s, gated: true };
  const k0 = a / S, k1 = c / S;
  return { gated: false, s: { ...s, p: s.p + k0 * y, v: Math.max(0, s.v + k1 * y),
    P: [(1 - k0) * a, (1 - k0) * b, c - k1 * a, d - k1 * b] } };
}
export const chapterConfidence = (s: SyllabusPace, ch: { first: number; last: number }) =>
  normCdf((ch.last + 0.5 - s.p) / Math.sqrt(s.P[0])) - normCdf((ch.first - 0.5 - s.p) / Math.sqrt(s.P[0]));
```
Shown to the parent as "School mein abhi: Ch ⟨n⟩ [badlo]" only when `chapterConfidence ≥ 0.6`; below that the chapter is a question in the VOI queue (§8.2), never a guess presented as fact.

### 4.4 Assessment calendar and readiness
- **Priors by board and class** generate *unconfirmed placeholder windows* only (CBSE IX: three periodic assessments + school annual, [V] count; months [M]). Placeholders never render to anyone; they only raise the VOI of asking "any test coming?" in typical months.
- **Default scope** when unknown: periodic/unit test = topics taught since the previous event up to predicted `p` at window start; half-yearly = topics 0..p; annual = whole book for Class IX [M: school set], else 0..p. Default scopes are `confidence ≤ 0.5` and are replaced by any datesheet scope.
- **Topic weight inside a scope:** Class IX maths uses the CBSE unit marks [V] divided by topics in the unit; other classes weight topics equally [U].
- **Urgency** for an event `e` with `d` days to window start: `u(d) = 0` if `d > 21`; `exp(−d/7)` for `0 ≤ d ≤ 21`; `1` inside the window; `0` after, which queues a one-time optional "kaisa gaya" check-in 2-7 days later (§8). `wKind`: class_test 0.3, unit/periodic 0.6, half_yearly/annual 1.0 (×1.3 if `stakes = "detention_year"`), olympiad 0.4, entrance 0.8 if a parent goal names it [U].
- **Readiness** at the window start `T`: `ready(e) = Σ_t w_t · mean_s∈t pRecall(s, T)`, with `pRecall = pKnown · exp(−(T − lastSeen)/S_s)` and stability `S_s` from the scheduler (initial 3 days, doubling after each delayed success) [U]. Internal only. Parent sees counts ("Ch 5: 9 of 12 skills pakka") per PX; **never a predicted mark** (gurukul §4.6).
- **Exam-window mode** starts when any event with `wKind ≥ 0.6` has `d ≤ 14`: the planner shifts track-B time to spaced, interleaved retrieval over the scope weighted by `(1 − ready)`, starting early so spacing helps; new-topic teaching inside the last 2 days is limited to scope gaps [U]. The teacher refers to it as a window and a plan, never a countdown.

### 4.5 Gap-to-grade: a grade-scale ability per strand
Every skill gets a grade position `g_s = (class − 1) + chapterIndex / nChapters` from the curriculum JSON (Class 4 chapter 5 of 14 → 3.36). Foundational reading/number levels map onto the same scale (letters 0.3, words 0.7, Std I paragraph 1.0, Std II story 2.0; numbers 1-9 0.3, 10-99 1.0, subtraction with borrowing 2.0, 3-digit ÷ 1-digit 3.5 [U]). Each strand (maths: number/place value, operations, fractions-decimals, measurement, geometry, data, algebra; languages: decoding, fluency, comprehension) has ability θ on this scale.

- **Response model** (1PL with guessing): `P(correct) = c + (1 − c) · σ(1.7 · (θ − g_s − δ_item))`, `c = 0` for open oral answers, `1/k` for k-option taps; `δ_item ∈ [−0.3, 0.3]` from kit difficulty.
- **Prior:** `θ ~ N(enrolled − 0.5, 1.5²)`, `enrolled = (class − 1) + monthsIntoSession/10`. The 0.5 mean gap is a paying-family guess against Delhi government-school averages of 2.5 grades behind at grade 6, and the 1.5 SD reflects 5-6 grade levels of spread inside one class (learning-science §5.2) [U].
- **Posterior on a grid** (θ from −1 to 10, step 0.1; 111 points), weighted by probe weight `w`: `post(θ) ∝ prior(θ) · Π P(y | θ)^w`. Cheap enough for the per-turn Director.
- **Rolling update after intake:** every later evidence row on a strand's skills updates the same grid; between sessions the variance inflates by 0.02 per school-week (children learn). `closingRate = Δθ/Δmonths`; "gap closing" means `closingRate > 0.1 + school pace` [U].
- **Seeding the knowledge layer:** `pKnown_s = clamp(σ(1.7(θ̂ − g_s)), 0.05, 0.8)`, status `introduced` or `practising` only. Placement never produces `learned_today` or `mastered` (N9).
- **Reporting:** `gap = enrolled − θ̂` drives the parent's level bridge ("Class 6 · building the Class 4 fraction steps"), never a number for the child (N2).

### 4.6 Goals, constraints and aspiration
- **Parent goals:** closed set (ParentGoal), top two ranked, optional ≤120-char note. Each maps to planner weights (table below). Re-asked every 8 weeks, or after a term exam (MN8).
- **Child goals:** proximal only (≤ 7 days, one skill or one task, chosen by the child from 2-3 options the Director generates). One active goal card at a time. Ages 12-15 add an if-then plan (when/where ⟨cue⟩ → ⟨action⟩). Ages 6-11 get no if-then: MCII evidence is adolescent [V-abstract].
- **Aspiration** ("badi hoke kya banna hai") is child-stated, optional, stored as a `memory` row of kind `interest` under the memory consent, used for F4 contexts and, for 10-15, values framing (why this skill matters for *their* stated goal). It never changes difficulty, expectations or effort targets; it is never asked of the parent; it is never inferred (§1.10).
- **Constraint:** minutes/day (parent control), tuition subjects (Taxila does not duplicate a tutor's homework load), how homework arrives, and who helps. No income, caste, religion, family situation, health or disability *labels* are collected. A parent may set *accommodations* (more wait time, larger text, read-aloud questions) without naming a diagnosis (N10).

| parent goal | planner effect |
|---|---|
| test_results | `w_exam ×1.5`; window card on; post-test check-in on |
| understand | `why` and transfer probes ×1.5 in school track; exam mode starts at d ≤ 10 not 14 |
| catch_up_basics | foundation share floor 0.5 (§4.7) |
| homework_independence | homework track on; isomorphic-first strict; child-done self-check before teacher check |
| confidence | success-first targeting P ≈ 0.8 on openers; vibe `challenge: reassure-first` default |
| entrance_target | adds an entrance event with practice scope from the exam's syllabus [M per exam] |
| stay_ahead | school track targets `p̂ + 2` topics (pre-teach next topic) |
| reading | foundational reading strand placed first, daily read-aloud segment |

### 4.7 The planner: two tracks, prerequisite-first
TaRL works only when level-teaching actually happens (learning-science §5.3), and NSSA says align with the classroom. A tuition-style product that ignores Friday's test loses the parent; a test-driven one that ignores Class 3 place value fails the child. **Each session has a foundation track and a school track**, and prerequisite-first is a hard rule inside both.
```ts
type Segment = { track: "foundation" | "school" | "exam" | "homework" | "review"; topicId: string; reason: string; minutes?: number };
export function planSession(n: NeedModel, ks: Map<string, SkillState>, now: Date, minutes: number): Segment[] {
  const examMode = n.events.some(e => wKind(e) >= 0.6 && daysTo(e, now) <= 14 && e.status !== "done");
  const gap = maxGapGrades(n.placements, ["maths", "english", "hindi"]);     // worst strand that matters now
  let foundation = clamp(0.2 + 0.15 * gap, 0.2, 0.7);
  if (topGoal(n) === "catch_up_basics") foundation = Math.max(foundation, 0.5);
  if (examMode) foundation *= 0.5;
  const cands = [...schoolSyncTopics(n, now), ...examScopeTopics(n, now), ...dueReviews(ks, now),
                 ...homeworkTopics(n, now, 2 /*days*/), ...probeRequestTopics(n)];
  const scored = cands.map(t => ({ t, s:
      W.hw * hw(t, n, now) + W.exam * sumEvents(n, now, e => wKind(e) * u(daysTo(e, now)) * inScope(t, e) * (1 - ready(t, e, ks)))
    + W.sync * Math.exp(-Math.abs(idx(t) - predictP(n, t.subject, now)) / 1.5)
    + W.rev * due(t, ks, now) + W.goal * goalBoost(t, n.goals) })).sort((a, b) => b.s - a.s);
  const segs: Segment[] = [];
  for (const { t } of scored.slice(0, 3)) {
    const pre = firstWeakPrereq(t, ks, { pKnownBelow: 0.4, maxDepth: 3 });      // backchain (TaRL)
    if (pre) segs.push({ track: "foundation", topicId: pre, reason: `prereq of ${t.id}` });
    segs.push({ track: t.kind, topicId: t.id, reason: t.kind });                 // school | exam | homework | review
  }
  return allocateMinutes(segs, minutes, { foundation, homeworkCap: 0.4, minRetrieval: 1 });
}
```
Default `W = { hw: 1.0, exam: 1.2, sync: 0.6, rev: 0.5, goal: 0.4 }` [U; MN6 tunes]. Homework never exceeds 40% of a session, and every session keeps at least one retrieval item (learning-science §3.5). A parent's belief or a photo hint produces `probeRequestTopics`, which become *diagnostic probes*, never teaching assumptions.

### 4.8 Legal-mode treatment (dpdp-deep.md §5.2/§6)

| field | source | M0 stateless | M1 academic record (default) | retention |
|---|---|---|---|---|
| class, board, medium, books, constraint | parent | yes | yes | account life |
| syllabus pace | parent + photos + child | parent-set chapter only | yes (content position) | account life |
| assessment events (confirmed) | parent, datesheet | yes | yes | session year + 1 |
| child-stated unconfirmed events | child | session only | yes, flagged unconfirmed, 14-day TTL | 14 days |
| homework items (printed text) | photos | session only | yes | 60 days |
| placement θ per strand | probes | session only | yes (like skill_state) | account life |
| parent goals, notes | parent | yes | yes | until changed |
| child goal cards | child | session only | yes (content-tied) | 90 days |
| parent beliefs | parent | no | yes, calibration only (M4 in parent doc) | 180 days |
| school results (marks) | parent-entered only | yes | yes, never shown to the child | session year + 1 |
| aspiration | child | no | `memory` consent only | per memory rules |
| photo images | photo | never stored | never stored | deleted after extraction (§6.5) |
| response timing during intake | live | never | never (NM-3) | none |

---

## 5. The first meeting

### 5.1 What expert tutors do, and what Taxila keeps
- **Rapport before probing; diagnose, then sequence** (INSPIRE: nurturant, progressive; vibe doc §3.6) [S]. **Control via choices.**
- **Diagnose with structure, not impressions** (Chi 2004) [V-abstract]; the ASER-style "highest level comfortably achieved", start easy and climb [V].
- **Indian tuition first meeting** [I; no ethnography exists, teacher-discourse §2.6 calls it the biggest gap]: the parent briefs the tutor on school marks and "weak areas" within the child's earshot; the tutor asks for the school copy and the datesheet; the first session is a demo. Taxila **keeps** the copy and the datesheet (facts, high value), **replaces** "weak areas" talk with a private placement and a calibrated parent summary, and **drops** briefing within the child's earshot (the parent call happens before the handover or separately; PX8 applies to the voice too).
- **Laws for every intake turn:** (1) facts from people, level from probes; (2) one question per turn, and every slot accepts "pata nahi" or "baad mein" as a complete answer; (3) never ask a child to rate themselves; (4) the child hears no level, no gap and no comparison; (5) intake never touches price, plan or offers (N12); (6) a parent call stays under 6 minutes, and a child's first session stays under 15 minutes (ages 6-9) or 20 minutes (ages 10-15).

### 5.2 Parent onboarding additions (inside O4, ≤ 20 s extra)
- **Book per core subject**: prefilled NCERT for CBSE/NCERT (boards.json); otherwise "different book" → a photo of the cover later (sets `mapBy: "topic"`).
- **"Any test in the next 2 weeks?"** Yes / No / Pata nahi. Yes → subject chips + rough week.
- **Top goal**: one tap from 6 icons (ParentGoal minus `other` and `entrance_target`, which come later). Everything else is progressive: asked only when its VOI is high (§8.2).

### 5.3 Parent "first meeting" call (optional; offered at O9 and in Parent corner)
A voice call with the AI teacher, in the parent's language, run as a slot machine by the Director. Per parent turn, `taxila-fast` extracts into `ParentIntakeExtract` (JSON schema; unknown allowed). The next slot is the highest-VOI unfilled slot; the parent can end at any slot.

| slot | shape of the teacher move | extracts to |
|---|---|---|
| S0 open | ⟨AI disclosure⟩ → ⟨purpose: understand school and goals, 5 min⟩ → ⟨ask what to call them⟩ | none |
| S1 school now | ⟨ask: chapter school is on, per subject the parent knows⟩ → ⟨read back as chapter titles⟩ | position obs (parent_call) |
| S2 coming up | ⟨ask: tests in next weeks, and what they cover⟩ → ⟨offer: photograph the datesheet later⟩ | events (unconfirmed until confirm card) |
| S3 success | ⟨ask: what would make the next 3 months feel good, their words⟩ → ⟨reflect as goal + one concrete⟩ → ⟨confirm⟩ | goals (rank 1-2) |
| S4 noticed | ⟨ask: what they have seen the child find easy or hard⟩ → ⟨thank; say it will be checked gently⟩ | beliefs + probe requests |
| S5 routine | ⟨ask: school hours, tuition, when the phone is free⟩ | constraint |
| S6 homework | ⟨ask: how homework arrives, who helps⟩ → ⟨state the norm: the teacher teaches toward answers, does not give them⟩ | constraint.homeworkArrives, helper |
| S7 close | ⟨plan for week 1 from NeedModel⟩ → ⟨what the parent will see and when⟩ → ⟨no outcome promise⟩ | none |

Declines, with what to say instead (PTM rules): predicted marks or rank → "which skills of the test chapters are pakka" after the first week; "is she intelligent / weak" → what will be checked and how the parent will see it; requests to drill for marks only → the two-track plan, plainly explained. Labels the parent uses ("weak", "slow") are never echoed back (PX4) and never stored verbatim: S4 stores the topic and `says: "cannot"`, not the adjective.

### 5.4 Child intake: the first lesson (`kind = 'diagnostic'`)

| phase | 6-9 (≤ 15 min) | 10-15 (≤ 20 min) | Director rules |
|---|---|---|---|
| I0 hello | ⟨AI disclosure⟩ ⟨parents can see learning⟩ ⟨name, address term⟩; 45 s | same, plain register; 45 s | O8 honesty; vibe `openingRamp` |
| I1 interest | one light interest question; 60 s | one; 60 s | feeds F4 contexts (vibe doc) |
| I2 school check | ⟨what happened in maths today⟩ ⟨offer: show the copy⟩ (camera only if parent enabled); 60 s | ⟨chapter now⟩ ⟨anything coming up⟩ ⟨show the copy⟩; 90 s | child-stated facts → unconfirmed; dates go to the parent confirm queue |
| I3 placement games | ≤ 2 strands, ≤ 12 items, oral + tap fallback, game-framed in a module; 7-9 min | ≤ 2 strands, ≤ 16 items; 9-12 min | §5.5 algorithm; success-first; stop rules |
| I4 goal card | child picks 1 of 2 proximal goals (by ⟨weekday⟩: ⟨skill⟩); 45 s | picks 1 of 3; adds ⟨when/where cue → action⟩; 90 s | Bandura & Schunk; MCII for 12-15 only |
| I5 close | ⟨name one specific action they did⟩ ⟨preview next⟩; 30 s | same | process praise; no level, no score, no "test" word |

**Strand choice for I3:** (a) the strand behind the parent's top concern or goal, (b) the prerequisite strand of the child's current school chapter. Other strands are placed **just in time**: the first lesson that needs a strand opens with 3-5 embedded placement items (`method: "jit"`). Progressive placement keeps the first session short, and the first lesson is still a real lesson.

### 5.5 Placement algorithm (adaptive, success-first)
```ts
export function nextPlacementItem(post: Grid, pool: KitItem[], hist: Resp[]): KitItem | "stop" {
  const { mean, sd } = summarise(post);
  const lastTwoFailed = hist.length >= 2 && !hist.at(-1)!.correct && !hist.at(-2)!.correct;
  if (sd < 0.6 || hist.length >= MAX_PER_STRAND /*6*/) return "stop";
  if (lastTwoFailed && hist.at(-1)!.pExpected > 0.6) return "stop";     // strained: close on an easy win
  const targetP = hist.length === 0 ? 0.8 : hist.at(-1)!.correct ? 0.6 : 0.75;
  return argmin(pool.filter(onBackchainOfCurrentChapter), i => Math.abs(pCorrectAt(mean, i) - targetP));
}
```
After `"stop"` on a strained run, the Director schedules one item at `P ≈ 0.9` so the strand ends on a success. Answers are classified against kit keys (no free grading). ASR confidence below the threshold yields no evidence and switches the item to tap. Response time is not stored (NM-3).

**What each person hears afterwards.** Child: nothing about levels. Parent (O9): per placed strand, one level-bridge line plus "Kaise pata?" listing the items, answers and date, with the honest note that placement is re-checked in every lesson. The parent's S4 beliefs are *not* contrasted with the placement in the same screen; calibration happens over weeks through the evidence view (Dizon-Ross).

---

## 6. Homework and school-paper photos

### 6.1 Pipeline (`POST /api/need/photo`)
1. **Gate:** `notebook_photos` consent and the parent control on; ≤ 10 photos/day; JPEG ≤ 1.5 MB, downscaled on device.
2. **Safety screen** (gpt-5.6 vision, JSON): a face or person in frame, or not schoolwork → reject and delete at once; the child is told the shape ⟨only copy and book pages⟩.
3. **Classify page type:** `textbook_page | printed_worksheet | notebook_handwritten | school_diary | datesheet_or_circular | marked_test | not_schoolwork`.
4. **Extract per type** (structured output; per-field confidence; **no person names, school name, phone numbers or roll numbers**: the schema has no field for them and a regex scrubber runs after):
   - datesheet/circular → `{kind, subject, date (DD/MM/YYYY, Indian order), syllabus chapters}`
   - diary → `{subject, chapter/exercise refs, questions, due}`
   - textbook page / worksheet → `{book guess, chapter, section, question texts}`
   - handwritten notebook → `{question refs, child's final answers (transcribed), teacher marks}`
   - marked test → `{assessment name, per-question tick/cross, total if printed}`
5. **Match to the curriculum:** exact chapter-title match in the board's book first; else embed the question texts against topic outcomes and let the model pick among the top 5 with a confidence. New NCERT books use in-chapter "Figure it Out" sets more than numbered exercises [M], so titles and question text carry the match, not exercise numbers.
6. **Resolve:** dates and scopes always get a **one-tap confirm card** (to the uploader, or to the parent if a child uploaded). Other fields auto-apply at confidence ≥ 0.85; 0.6-0.85 apply with inflated R; < 0.6 are logged only.
7. **Apply:** position observation (R from §3.2 by page type), events, homework items, and **probe requests**. Handwritten answers that look wrong, and red-pen crosses, become *probe requests* ("walk me through ⟨question ref⟩" next lesson). **They are not evidence.** Reasons: the house law "a model never grades"; FERMAT (AI4Bharat/IIT Madras; 2,244 grade 7-12 solutions handwritten by 43 annotators) found error detection at 0.65 balanced accuracy and localisation at 0.45 for GPT-4o [V]; GPT-4o matched instructor scores on 46.7% of handwritten exam parts even with answer + rubric (Caraeni et al. 2024, n = 18 students) [V]; and handwriting OCR was "the greatest challenge", with failing scripts still needing human grading (Kortemeyer et al. 2024) [V-abstract]. These are 2024-25 models. gpt-5.6 must be measured on our own photos (MN2), not assumed better.
8. **Teacher marks** (ticks, crosses, a printed score) are a *school signal*: they raise priority for that topic and, if repeated across two papers, nudge the strand prior (`θ` mean −0.2, sd ×1.2); they never write skill state.

### 6.2 Homework sessions (integrity + learning)
- The teacher teaches toward the answer on an **isomorphic item first** (same skill, different numbers, from the kit or generated and solver-verified), then the child does their own homework question themselves; Taxila checks only after the child's own attempt ("check my answer" is allowed after an attempt). A full solution to the child's actual homework question is never produced (gurukul §4.5; N7).
- Homework answer keys are produced by a solver pass and a second independent solve; disagreement → the item is used only for teaching the method, never for checking.
- Classes 1-2 get no extra written work from Taxila; the weekly parent home task stays the only "homework" Taxila adds (PX one-task rule; the national bag/homework policy says the same [M]).

### 6.3 What photos change, and how fast
- One datesheet photo usually fixes Q2 for a whole term: it is the highest-value photo, so the VOI picker asks for it in typical test months.
- Diary and homework photos update Q1 weekly and fill Q3; revision pages are gated (§4.3).

### 6.4 Failure handling
Misread dates are the costliest error (a test placed a week late stops exam mode). Dates are never auto-applied (N6); the confirm card shows the date as day name + date ("Thu 12 Nov") to catch DD/MM vs MM/DD swaps.

### 6.5 Retention
The image lives only in the request's memory or a private Azure Blob object with a 10-minute TTL (lifecycle rule plus explicit delete); it is deleted after extraction, with a 24-hour hard ceiling on any failure path, checked by a sweeper (N5). Only the scrubbed extraction JSON is kept, as a `need_observation` row. No thumbnails. A parent "keep my child's work" portfolio option is out of scope for v1.

---

## 7. The child's "school check" at the start of each lesson
One warm-up move, ≤ 1 child turn, skipped when the NeedModel was updated in the last 48 h or the child opts for "seedha shuru": ⟨ask about today or this week at school in ⟨subject⟩⟩. `taxila-fast` extracts `{chapterMention, testMention, homeworkMention}`. Child-stated tests create unconfirmed events (14-day TTL) that can steer *this* session (cheap, reversible) but change multi-day plans only after a parent confirm. A child saying "I'm weak at X" is not stored; X becomes a probe request.

---

## 8. Parent check-ins

### 8.1 Channels and caps
- **Weekly report** (WhatsApp utility template): at most **one** need question as a quick-reply row, inside the ≤ 2 learning messages/week cap (PX). Never in a safety, account or payment message.
- **PTM** (monthly voice): up to 3 need slots on the agenda (school now, coming up, goals refresh).
- **Parent corner**: the School sync bar (always available, no prompt).

### 8.2 Which question to ask: value of information
```ts
export function pickParentQuestion(n: NeedModel, now: Date): NeedAsk | null {
  const asks: NeedAsk[] = [];
  for (const s of n.pace) {                                  // Q1 per subject
    const conf = chapterConfidence(s, chapterAt(s, predictP(s, now)));
    asks.push({ kind: "position", subject: s.subject, voi: (1 - conf) * subjectWeight(n, s.subject),
                prefill: chapterAt(s, predictP(s, now)) });  // one-tap confirm of our best guess
  }
  const nextKnown = n.events.find(e => e.status === "upcoming" && e.confirmed);
  if (!nextKnown) asks.push({ kind: "next_test", voi: typicalTestMonth(n.board, n.classLevel, now) ? 0.6 : 0.25 });
  for (const e of n.events.filter(e => e.status === "upcoming" && (!e.scope || e.scope.confidence < 0.6)))
    asks.push({ kind: "scope_photo", eventId: e.id, voi: 0.8 * u(daysTo(e, now)) * wKind(e) });
  for (const e of n.events.filter(e => e.status === "done" && !e.result && daysSince(e.window.end, now) <= 7))
    asks.push({ kind: "how_did_it_go", eventId: e.id, voi: 0.35 });
  if (weeksSince(lastGoalAsk(n), now) >= 8) asks.push({ kind: "goals_refresh", voi: 0.3 });
  const best = asks.filter(a => !recentlyDeclined(n, a, 21 /*days*/)).sort((a, b) => b.voi - a.voi)[0];
  return best && best.voi >= 0.3 ? best : null;              // silence is a valid outcome
}
```
- Every ask is one tap: our best guess prefilled + 2 alternatives + "Pata nahi". "Pata nahi" is a full answer and suppresses that ask for 21 days.
- "How did it go" offers good / ok / hard / "marks batayein". Marks are optional, stored as entered, shown back only in the parent's own list, never to the child, never compared, and used for research calibration of readiness (MN7) and, only if repeated and large, a small prior nudge.

### 8.3 What each answer updates
| answer | update | never |
|---|---|---|
| chapter confirm | `paceUpdate` with σ = 1.0 | overwrite pace without the filter |
| test yes + week | unconfirmed event → confirm card for exact date | start exam mode on an unconfirmed date > 7 days out |
| scope photo | event scope (confidence from extraction) | — |
| "she can't do X" (PTM) | `parent_belief` + probe request | write skill state; echo the label |
| goals | goal rows, planner weights | infer goals from behaviour |
| marks | `result` on the event | show or predict marks to anyone else |

---

## 9. Invariants (gated in evals; if a change trips them, the change is wrong)
- **N1 prerequisite-first:** property test over random NeedModels: any planned school/exam topic with a prerequisite at `pKnown < 0.4` within depth 2 has that prerequisite segment earlier in the session.
- **N2 no gap talk to the child:** lint on compiled instructions and child UI strings: no grade-gap numbers, no `behind / peeche / kamzor / weak / slow`, no "Class ⟨n⟩ level" phrasing.
- **N3 window, not countdown:** no `⟨number⟩ din (baaki)` / "days left" patterns in child or parent strings; the ChildBrief `need` field carries buckets only.
- **N4 beliefs are not evidence:** the parent-check-in and parent-call handlers cannot import the skill-state writer (module boundary test).
- **N5 photos are not stored:** sweeper test finds zero image objects older than 24 h; extraction rows pass the name/phone/roll-number scrubber.
- **N6 dates need a human tap:** no `assessment_event.confirmed = true` without a confirm action.
- **N7 homework integrity:** isomorphic-first and no full solution to a photographed question (extends the gurukul integrity eval).
- **N8 cadence:** ≤ 1 need question per weekly message; none in safety messages; ≤ 2 learning messages per week.
- **N9 placement cap:** placement writes only `introduced` or `practising`.
- **N10 banned asks:** the intake extraction schemas have no fields for income, caste, religion, family situation, health or disability labels; the classifier drops such content.
- **N11 no gender input:** no gender field exists in NeedModel or planner inputs (type test).
- **N12 no diagnosis-to-sell:** paywall and plan components cannot import placement or gap data (module boundary test).

---

## 10. What to measure first

| id | question | method | decides |
|---|---|---|---|
| MN1 | Position accuracy | predicted vs parent-confirmed chapter by weeks since last observation; 100 children, 8 weeks | `qP`, `qV`, σ table; whether to ask weekly |
| MN2 | Photo extraction on Indian school paper | 300 hand-labelled photos (diaries, datesheets, worksheets, notebooks; Devanagari and Latin; low-end phone cameras): page-type accuracy, chapter match, date exact-match, handwritten answer CER, tick/cross precision | thresholds in §6.1; whether teacher marks can ever count as evidence (needs precision ≥ 0.9) |
| MN3 | Placement validity and reliability | θ̂ vs an ASER-style oral test by a trained tester (learning-science E8) and test-retest within 7 days; time to place | `MAX_PER_STRAND`, prior, slope 1.7 |
| MN4 | Intake completion | drop-off by phase (I0-I5, S0-S7), minutes used, "baad mein" rate | slot order and budgets |
| MN5 | Check-in yield | response rate and accuracy vs photo evidence; opt-out by arm (ask vs no ask) | VOI threshold 0.3 |
| MN6 | Two-track allocation | randomise foundation share (0.2 fixed vs adaptive vs 0.5 floor); delayed retention on school-chapter items, prerequisite gains, churn | `foundation` formula, `W` |
| MN7 | Exam-window mode | randomise start (14 vs 7 days) and content (scope retrieval vs normal); outcome: delayed retention 2 weeks after the test, parent-reported "how did it go" | exam mode design |
| MN8 | Goal stability | re-ask at 8 weeks; % changed; does a changed goal change behaviour | refresh cadence |
| MN9 | Proximal goal card | randomise card on/off; next-week return, goal-skill delayed success | keep or drop I4 |

---

## 11. Decisions to log (proposed ids, each with a reversal condition)

| id | decision | reverse if |
|---|---|---|
| `need-facts-from-people-level-from-probes` | parent/child level claims are beliefs that only create probes | a study shows parent judgments of specific skills agree with delayed probe outcomes at κ ≥ 0.7 |
| `need-progressive-intake` | onboarding adds 3 fields; the rest is VOI-driven over weeks | MN4 shows a single full intake completes at ≥ 85% and improves first-month plans |
| `need-position-filter` | per-subject constant-velocity filter with gating | MN1 shows simple "last reported chapter" is as accurate |
| `need-photo-delete` | images deleted after extraction; no portfolio in v1 | parents ask for a portfolio *and* counsel clears retention for it |
| `need-photo-not-evidence` | handwritten answers and teacher marks are probe requests, not evidence | MN2 shows gpt-5.6 tick/cross and answer reading at precision ≥ 0.9 on our photos |
| `need-two-track` | foundation and school tracks every session, prerequisite-first hard rule | MN6 shows a single track beats it on delayed outcomes without raising churn |
| `need-exam-window` | exam mode 14 days out, window language, no predicted marks | MN7 shows a different start beats it; the marks ban does not reverse |
| `need-proximal-goals` | child goals ≤ 7 days; if-then only 12-15 | MN9 shows no effect (drop the card) or MCII evidence appears for under-12s |
| `need-no-parent-aspiration` | aspiration is child-stated only; parents are not asked for a career plan | none expected; a parent demand alone does not reverse it |
| `need-isomorphic-first` | homework: teach on a twin item, child solves their own | evidence that the child copies the twin's steps without learning (delayed probe fails at higher rates than the normal ladder) |

---

## 12. Open questions
- **Tuition ethnography** (the biggest gap): observe or interview 10-20 Hindi-belt home tutors about their first meeting with a parent and child. Everything in §5.1 marked [I] rests on its absence.
- **School calendars:** collect about 200 real datesheets across CBSE, state boards and ICSE, classes 1-9, to replace the [M] month priors and the default scopes.
- **School WhatsApp groups:** many teachers post homework there [I]. Can a parent forward that image to a task-specific Taxila number under Meta's 2026 AI-assistant policy (parent-experience §8 [M])?
- **The December 2024 detention rule** and which states detain in classes 5 and 8: verify by state before `stakes = "detention_year"` is set automatically (until then, parent-set only).
- **CBSE IX portfolio and Advanced level:** can a child's own Taxila reflections legitimately support the school portfolio without becoming a submittable artefact (gurukul §4.5)? Should Advanced Maths be modelled as its own entrance-style event?
- **Private books** in CBSE classes 1-8: topic-order mapping is approximate; how much does it degrade MN1?
- **DPDP:** confirm with counsel that a notebook photo processed and deleted within minutes under a separate `notebook_photos` consent fits M1 (dpdp-deep.md Q-list).

---

## 13. Sources (fetched 2026-10-02 unless marked)

Indian assessment and policy
- CBSE Secondary Curriculum 2026-27 Part 1 (assessment scheme §3, IA §3.3, Standard/Advanced): https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Curriculum_SecP1_2026-27.pdf [V]
- CBSE Mathematics Class IX 2026-27 (unit weights, question typology, IA split): https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Maths_SecP1IX_2026-27.pdf [V]
- CBSE curriculum index 2026-27: https://cbseacademic.nic.in/curriculum_2027.html [V]
- Boards and book use: `data/curriculum/boards.json` (CBSE bye-law 2.4.7) [V, repo]
- RTE Act and the 2019 amendment: https://en.wikipedia.org/wiki/Right_of_Children_to_Free_and_Compulsory_Education_Act,_2009 [S]
- NCERT, Mental Health and Well-being of School Students: A Survey (2022): https://ncert.nic.in/pdf/Mental_Health_WSS_A_Survey_new.pdf [V]
- ASER tools: https://asercentre.org/aser-tools/ ; ASER 2024 report: https://asercentre.org/wp-content/uploads/2022/12/ASER_2024_Final-Report_13_2_24.pdf (link listed, not read) [V/S]
- J-PAL, Teaching at the Right Level: https://www.povertyactionlab.org/case-study/teaching-right-level-improve-learning [V]
- Muralidharan, Singh & Ganimian 2019, AER 109(4):1426-60 (Mindspark): https://www.aeaweb.org/articles?id=10.1257/aer.20171112 [V-abstract]

Tutoring, goals, parents, homework
- NSSA Tutoring Quality Standards: https://nssa.stanford.edu/tqis/quality-standards [V]
- Chi, Siler & Jeong 2004, Cognition and Instruction 22(3), doi:10.1207/s1532690xci2203_4 [V-abstract via OpenAlex]
- Bandura & Schunk 1981, JPSP 41(3):586, doi:10.1037/0022-3514.41.3.586 [V-abstract via Semantic Scholar]
- Duckworth, Grant, Loew, Oettingen & Gollwitzer 2011, Educational Psychology 31(1), doi:10.1080/01443410.2010.506003 [V-abstract via OpenAlex]
- Barger, Kim, Kuncel & Pomerantz 2019, Psychological Bulletin, doi:10.1037/bul0000201 [V-abstract]
- Patall, Cooper & Robinson 2008, Review of Educational Research 78(4), doi:10.3102/0034654308325185 [V-abstract via OpenAlex]
- Cooper, Robinson & Patall 2006, Review of Educational Research 76(1), doi:10.3102/00346543076001001 [V-abstract via OpenAlex]
- Fan, Xu, Cai, He & Fan 2017, Educational Research Review 20, doi:10.1016/j.edurev.2016.11.003 [title only; abstract elided]
- Dizon-Ross 2019, AER, doi:10.1257/aer.20171172 [V-abstract]
- Dercon & Singh 2013, World Development 45, doi:10.1016/j.worlddev.2012.12.001 [V-abstract]
- Lepper's INSPIRE model: via `learner/vibe-temperament.md` §3.6 [S]

Photo grading and handwriting
- Nath, Bathina, Khan & Khapra 2025, "Can Vision-Language Models Evaluate Handwritten Math?" (FERMAT): https://arxiv.org/abs/2501.07244 ; results: https://arxiv.org/html/2501.07244v2 [V]
- Caraeni, Scarlatos & Lan 2024, "Evaluating GPT-4 at Grading Handwritten Solutions in Math Exams": https://arxiv.org/abs/2411.05231 ; https://arxiv.org/html/2411.05231v2 [V]
- Kortemeyer, Nöhl & Onishchuk 2024, "Grading Assistance for a Handwritten Thermodynamics Exam using Artificial Intelligence": https://arxiv.org/abs/2406.17859 [V-abstract]

Internal (repo): `docs/research/learning-science.md`, `design/parent-experience.md`, `learner/vibe-temperament.md`, `safety/dpdp-deep.md`, `market/india-incumbents.md`, `voice/indian-teacher-discourse.md`, `harvest/gurukul.md`, `docs/ARCHITECTURE.md`, `shared/contracts.ts`, `db/migrations/001_core.sql`.


---

## Review

Skeptical review, 2026-10-02 (learning scientist + engineer). Cross-checked against `safety/dpdp-deep.md`, `learner/kt-algorithms.md` (R4, R3, R20) and `learner/onboarding-diagnostic.md`. Tags as above. Severity: **B** = blocks build or is unsafe for children, **H** = wrong or untestable as written, **M** = tighten. Where a correction changes text above, the correction wins.

### R1. Unsafe for children, or missing safeguards

- **R1.1 [B] The school check and parent call have no safeguarding hook.** §5.4 I2 and §7 invite a child to talk about school every lesson. Children answer that with corporal punishment, bullying, exam fear, or "I'll fail and papa will beat me". The child-safety floor in `CLAUDE.md` (Childline 1098, Tele-MANAS 14416, safeguarding hand-off) is not mentioned anywhere in this doc. **Fix:** run the safety predicate on every child utterance *before* `taxila-fast` extraction, and make the extractor output `{chapterMention, testMention, homeworkMention, distress}` where `distress` routes to the safeguarding path and is never written to `need_observation`. Add invariant **N13: no need-extraction result is applied for a turn on which the safety predicate fired.** The same applies to parent-call S4 (a parent may disclose violence at home).
- **R1.2 [B] Exam-window mode is a pressure engine for the youngest children.** §1.7 cites NCERT's anxiety data, then §4.4 shifts the plan to retrieval drills for any `wKind ≥ 0.6` event, with `stakes = detention_year` ×1.3, `test_results` ×1.5 and `entrance_target` (JNV/Sainik, a 10-year-old's goal chosen by a parent). Avoiding the word "countdown" does not remove the pressure, because the *plan itself* changes. **Fix:** (a) exam mode is off for classes 1-2 (no formal exams for these classes under NEP/CBSE [M, verify]) and opt-in by parent for class 3-4; (b) cap exam-mode share of a session at 0.5 and keep the opening and closing segments non-exam for ages 6-11; (c) `entrance_target` and `detention_year` can be set only by the parent and never change what the child is told; (d) mark "window language reduces anxiety" as **[U]** (it is a gurukul-internal choice, not evidence), and add an MN7 secondary outcome, child-reported mood at lesson end by arm, with a stop rule if exam mode lowers return rate or mood.
- **R1.3 [H] Placement can strain a child.** `nextPlacementItem` stops on two failures *only if* `pExpected > 0.6`. If the items were hard (`pExpected` 0.5) it continues to 6 items. With `sd < 0.6` almost never reached under a misspecified model, most strands run the full 6. **Fix:** unconditional stop at 2 consecutive failures *or* 3 failures in the last 4 on a strand, then one P≈0.9 item. Counts in §5.4 ("≤ 12 items ages 6-9") must be hard caps in code, not budgets in prose. Stop the whole diagnostic if a child says stop, goes silent for 2 waits, or any distress signal fires (R1.1).
- **R1.4 [H] Oral-answer misses are scored as failures with no ASR safeguard.** "ASR confidence below threshold yields no evidence" does not cover a *confident wrong transcript*: child speech and Hindi-English numerals are error-prone [M], and `kt-algorithms` R20 already says non-attempts must not update. **Fix:** a first oral miss on a placement item is re-offered once as a tap before counting; a mismatch between transcript and a tap answer is logged as ASR-suspect; teach-back or "idk" is a distinct outcome (kt R20), not a failure.
- **R1.5 [H] No-gender-input (N11) blocks fairness measurement, and the evidence for N11 is thin.** Dercon & Singh is about parental aspiration bias; it justifies *not asking the parent for career plans*, it does not justify *never collecting gender anywhere*. With no gender field, nobody can detect that the planner or placement under-serves girls (exactly the bias §1.10 worries about), or that `entrance_target` is set 3x less for daughters. **Fix:** keep gender out of planner and Director inputs (type test stays), but store it in an analytics-only table (access-controlled, parent-declared, optional) and add a quarterly parity audit: placement θ, foundation share, goal kinds, exam-mode rate, churn, by gender and by medium (Hindi/English). Add this as **N14** (audit job exists and runs on sim data pre-launch).
- **R1.6 [H] Shared devices break "parent confirm".** Many Indian children use a parent's phone. A "parent one-tap confirm" tapped by the child is not a confirmation, and N6 can be satisfied by a child tapping through. **Fix:** confirm cards that change behaviour require the parent gate (PIN or OTP from the Parent corner), else store `confirmed_by: "child"`, `confirmed = false`, and allow only the soft effect (R3.5). N6 must test `confirmed_by = 'parent'` with a gate token.
- **R1.7 [M] Accommodations and learning difficulties have no path.** §4.6 avoids labels, good, but a dyslexic or dyscalculic child will place as a large "gap" and be sent to `catch_up_basics` forever, with no humane signal. **Fix:** add a *non-diagnostic* "persistent plateau" rule (strand θ gain < 0.1 over 8 weeks despite varied formats) that adds a parent-card suggestion to talk to the school or a specialist; never a label. Mark **[I]**; needs a specialist reviewer.
- **R1.8 [M] The "success-first, then rig the end" rule needs a limit.** Ending every strained strand on a P≈0.9 item is fine once, but if it happens in >50% of strands the child is learning that the diagnostic is easy. Cap the rigged item to the closing item only, and log how often it fires (MN4).

### R2. Legal and privacy: DPDP 9(3) and Azure facts

(Owner has deprioritised compliance; the points below are about *design decisions that are expensive to reverse*, not launch gates. Where a point is a plain factual error, fix it regardless.)

- **R2.1 [H] "Need row is parent-declared, low risk" understates s.9(3).** `dpdp-deep.md` §5 says the Act defines neither "tracking" nor "behavioural monitoring", that the Fourth Schedule wording implies educational tracking *is* monitoring (surplusage argument), and that Q1 (a persisted parent-visible academic record vs persisted engagement/vibe models) is **open** for counsel. Need-goals §4.8 labels M1 "default" and several rows low risk as if Q1 were settled. Specific rows that are *not* academic-record-only: `parent_belief` (a third party's opinion of the child, 180 days), `child_said` observations, `closingRate` (a trend of the child over time), photo-derived "teacher marks" priors, and the `need_observation` ledger itself, which is a complete behavioural log with `payload jsonb`. **Fix:** retag §4.8 "M1 default" as **[U, depends on counsel Q1]**; classify each row as academic-record (A) or behavioural (B) in the table; ship only A rows in the M1 build and gate B rows behind the legal-mode switch the doc already describes (but make that switch real, see R2.2).
- **R2.2 [B] The legal-mode table has no enforcement in the schema.** Retention periods (14 days, 60, 90, 180, "session year + 1") exist only in prose: no `expires_at`, no `legal_mode`, no sweeper except photos. The ledger is "append-only", which conflicts with erasure on withdrawal (s.8(7)/Rule retention) and with M0 (stateless). **Fix:** add `expires_at timestamptz` and `purpose text` columns to `need_observation`, `parent_belief`, `homework_item`, `goal`, plus a generic sweeper job with a test per row type (N5 generalised to **N5b: no row older than its TTL**); "append-only" becomes "append-only until TTL or erasure"; `payload` stores only scrubbed structured fields, never child utterances or free text.
- **R2.3 [B] "Images never stored" is false as written for Azure.** Azure OpenAI by default retains prompts and completions (including images) for up to 30 days for abuse monitoring unless the customer is approved for modified abuse monitoring [M, verify in current Azure docs]; "Global" deployment types may process in any region versus "DataZone"/regional types [M]. §6.5 and the M0/M1 table claim "never stored". **Fix:** (a) apply for modified abuse monitoring *before* photo launch, or state "retained by provider up to 30 days" in the notice and in N5; (b) pin the deployment to an India or DataZone-compatible region; (c) no request-body logging on `/api/need/photo` (App Insights, ACA ingress logs); add a test that the route's logger redacts bodies.
- **R2.4 [B] "10-minute TTL via lifecycle rule" cannot be implemented.** Azure Blob lifecycle management evaluates in days and runs about once per day [M], so it cannot enforce 10 minutes, and its worst case already approaches the 24-hour ceiling. **Fix:** do not write photos to Blob at all in the normal path (stream to the vision call in memory; the doc already allows "request memory"). If Blob is needed for retries, delete explicitly in a `finally`, turn off soft-delete and versioning on that container, and run a 5-minute sweeper (container job) that lists by creation time. Replace the "lifecycle rule" claim.
- **R2.5 [H] The face/person screen runs after the image has already reached the model.** Step 2 is a gpt-5.6 vision call, so a child's face has already been sent. **Fix:** on-device face detection and EXIF/GPS stripping before upload (on-device ML is compatible with the Azure-only rule, which governs paid cloud AI); server rejects any JPEG with EXIF GPS; keep the model screen as a second layer only.
- **R2.6 [M] Free-text fields defeat N10.** `Goal.note` (≤120 chars) and the parent-call S4/S5 answers can contain health, family or caste information; "the classifier drops such content" is an untested LLM behaviour. **Fix:** make `note` a pick-list plus optional text that is run through a regex+classifier gate and *rejected with a retry* rather than silently dropped; add N10 test with 50 adversarial notes and a recall target (>= 0.95) [U].
- **R2.7 [M] Parent call recording.** §5.3 is a voice call with a parent; nothing says whether audio is stored (the project rule is "audio never stored", `dpdp-deep` notes the tension). State it: transcript-extraction only, no audio, notice at S0 (shape: ⟨disclose AI and that nothing is recorded⟩).
- **R2.8 [M] Dizon-Ross and Chi are not child-safety or legal evidence**; they are used to justify "facts from people, level from probes". Keep the rule, but see R3.1 for the over-claim.

### R3. Design rules that lack evidence or are over-claimed

- **R3.1 [H] Finding 1 overreaches.** Chi, Siler & Jeong (2004) is about tutors diagnosing students' *conceptual misconceptions* in a science topic; it does not show that "the tutor's impression of what a child doesn't get is the least reliable part of a first meeting". Dizon-Ross (2019) is Malawian parents' beliefs about their children's test performance, not Indian paying parents' beliefs about a specific skill. Both are [V-abstract] only. **Fix:** retag the finding **[I]** with these sources as *consistent with* it; add MN5 arm "parent belief vs probe outcome" per skill (the proposed reversal `κ ≥ 0.7` is almost unreachable for noisy single-item probes, so pick a realistic threshold, e.g. AUC of belief predicting probe failure ≥ 0.65, otherwise the rule can never reverse and becomes dogma).
- **R3.2 [H] The "parents set routines, not teach maths" rule (finding 6) is causal advice from correlational meta-analyses.** Barger r = -.15 for homework help and Patall's negative maths/middle-school associations are confounded by reverse causation (struggling children get more help). The rule is a reasonable *default* but must be tagged **[I, correlational]**, and the parent-facing copy must not claim "helping hurts". The 40% homework cap and the "homework mainly a signal for classes 1-5" decision rest on Cooper 2006 correlations; tag **[U]** and put in MN6.
- **R3.3 [H] The "one-week goals" rule contradicts its own source.** Bandura & Schunk (1981) used *per-session* subgoals with ~40 children aged 7-10 over 7 sessions; a seven-day goal for a 6-9 year-old is distal by that paper's logic. **Fix:** ages 6-9 goal horizon = *this lesson or the next one*; ages 10-11 ≤ 3 days; 12-15 ≤ 7 days. Duckworth et al. 2011 (n = 66) measured *practice questions completed*, not learning gain, in US adolescents preparing for a standardised test [V-abstract; confirm the sample age]; the "ages 12-15" band is an extrapolation. Tag **[U]**, keep MN9, and make "drop the goal card" the default if MN9 is null.
- **R3.4 [H] Teacher ticks/crosses nudge θ before MN2 exists.** §6.1 item 8 lets a repeated red-pen signal move `θ` mean -0.2 and sd ×1.2, while step 7 and §11 say photo marks are *not evidence* until precision ≥ 0.9 is measured. These conflict, and a red cross may reflect carelessness or an unfair mark. **Fix:** delete the θ nudge from v1; teacher marks only raise probe priority. Re-introduce only after MN2 and only as a capped prior shift (|Δθ| ≤ 0.2 total).
- **R3.5 [H] Date-confirm policy has no safe default.** If the parent never confirms, exam mode never starts (false negative); if it starts on a wrong date, the cost is some extra revision (cheap). **Fix:** allow a *soft window* (spaced retrieval over the default scope, no urgency language, no weight boost beyond `wKind×0.5`) for an unconfirmed event ≤ 7 days out that came from a datesheet photo; full exam mode needs the gated confirm (R1.6). Make the unconfirmed-photo-datesheet case an explicit row in N6.
- **R3.6 [M] Citation hygiene.** Fan et al. 2017 is listed with "title only", cited nowhere: remove. RTE amendment cited from Wikipedia and the December 2024 rule is [M]: the `stakes` flag is already parent-set only, good. CBSE IX counts (three periodic assessments, best-two average) are marked [V]; re-verify that the internal "periodic" vs "half-yearly" naming in §4.4 matches the circular, since §4.4 treats half-yearly as a separate default while the doc says Class IX has only IA + annual.
- **R3.7 [M] The reliability matrix (§3.2) is entirely invented numbers.** Fine as starting values, but nothing says what happens before MN1 completes (which needs 100 children for 8 weeks, i.e. post-launch). **Fix:** run an *offline synthetic harness now* (R5.1) and treat the σ table as a prior to be replaced by estimated values per source once n ≥ 30 confirmations per source.

### R4. Wrong or inconsistent maths and engineering

- **R4.1 [H] Position filter gates the one observation that should never be gated.** Schools reorder chapters (and new NCERT books reshuffled topics). The gate `y²/S > 9` rejects a *parent-confirmed "we are on Ch 7"* when the filter believes Ch 3, then needs two agreeing gated observations within 2 weeks to recover; meanwhile the parent sees a wrong chapter, and in the confirm card the parent's own tap is overridden. **Fix:** observations with `source ∈ {parent_onboarding, parent_app one-tap, photo_datesheet confirmed}` hard re-initialise `p` (variance R, `v` reset to prior) instead of being gated; only photo-handwritten/printed/diary and child-said are gated. Also model *non-monotone and non-contiguous* position: keep a per-chapter `taught: Set` as a side channel (a chapter taught out of order is "taught" even if p is lower), since a scalar index cannot represent "Geometry first, Algebra later".
- **R4.2 [H] `paceUpdate` has no predict step and mixes units.** It assumes the caller already advanced `p` and `P` to the observation date; as written, `y = z − s.p` uses a stale `p`. Make `paceUpdate(s, z, R, now)` call `predict(s, Δ)` first (Δ from the school-week calendar) and test it. The 2x2 `P` must be kept symmetric (`b = c`; the code updates them independently and will drift). Clamp `P00` to ≥ 0.25 to stop the gate becoming brittle (S → R small).
- **R4.3 [H] Concurrent writes will lose updates.** Photos, the child school-check and the parent app can update the same `syllabus_pace`/`placement` row; the filter is read-modify-write. **Fix:** `version int` column with compare-and-swap, or `select … for update` inside the transaction (Neon pooled connections: keep the transaction short, no advisory locks across requests). Add a concurrency test (two simultaneous photo observations produce the same state as sequential).
- **R4.4 [H] Placement model has no slip and over-claims precision.** `P = c + (1−c)σ(…)` approaches 1, so one careless miss on an easy item (or an ASR error, R1.4) collapses θ. With slope 1.7 per grade and ~0.54 Fisher information per item, six items give a posterior SD of about 0.5 *if the model is right*, which makes the stop rule `sd < 0.6` fire as if the estimate were solid. **Fix:** 4PL with slip `s = 0.08` (kt-algorithms uses guess/slip too), stop on `sd < 0.6` *and* at least 4 items, and report `q30` (kt/onboarding-diagnostic already extend Placement with `q30`, `prior_kind`, `stop_reason`; fold those into §4.1 so there is one `Placement` type).
- **R4.5 [H] Duplicate and conflicting specs.** (a) §4.5 grid is 111 points (-1..10); `kt-algorithms` uses a 41-point ADF; (b) §4.5 seeding `pKnown = σ(1.7(θ̂−g_s))` is exactly the double-count that `kt-algorithms` R4 flags (P(correct) used as P(known); use `(P − g)/(1 − g − s)`); (c) §4.5's prior `enrolled − 0.5` and `kt-algorithms`' `b = g − 0.5` offset mean an on-grade child succeeds ~50% of on-grade items, which kt R4 says to recalibrate to ~0.7. **Fix:** one placement/θ implementation owned by `kt-algorithms`+`onboarding-diagnostic`; `need.ts` imports it, and this doc keeps only the grade-scale definition and the planner. Also seed from the posterior mean over the grid, not the point estimate θ̂.
- **R4.6 [H] The urgency curve contradicts exam-mode timing.** `u(d) = exp(−d/7)`: at `d = 14`, `u = 0.135`; at `d = 21`, `0.05` then a cliff to 0. With `W.exam = 1.2`, exam scope never outranks homework (`W.hw = 1.0`) until about a week out, so "exam mode starts at 14 days to allow spacing" is nominal. **Fix:** choose the intended behaviour and encode it: either `u(d) = clamp(1 − d/21, 0, 1)` (linear ramp, 0.33 at d = 14), or a step to a fixed exam share. Test with the property "at d = 14 the scope retrieval share ≥ 0.3 of non-foundation minutes".
- **R4.7 [H] `foundation` is global but the gap is per strand.** `maxGapGrades` over maths, English and Hindi means a Hindi-decoding gap pulls the share of *maths* time into foundation. Make foundation share per subject (the segment already carries `topicId`), and compute it from the gap of the *strands that are prerequisites of the planned topic*.
- **R4.8 [M] `allocateMinutes` can break N1.** If the budget trims the school segment's prerequisite but keeps the school segment (or vice versa), N1 fails by construction. Specify: segments are dropped in (prerequisite, target) *pairs*; a target without its prerequisite is not scheduled. Add that to the N1 property test, with the depth mismatch fixed (planner uses depth 3, N1 states depth 2: test the stronger one).
- **R4.9 [M] The scoring terms are on different scales.** `sumEvents` can exceed 1 with several events, `hw` and `due` are unspecified. Normalise each term to [0,1] and *cap* the exam term, else `W` is not tunable (MN6 cannot interpret it).
- **R4.10 [M] Schema bugs.** (a) `constraint` is a reserved word in Postgres: `alter table child add column constraint jsonb` fails; rename to `study_constraint` (TS type can stay `Constraint`). (b) `placement` has primary key `(child_id, strand)` and stores only the latest row, but `closingRate = Δθ/Δmonths` needs history: add `placement_history` (append, TTL per R2.2). (c) `parent_belief.says` has no check constraint (`can|cannot|unsure`); `ref_id` has no FK to the curriculum graph; same for `topic_ids text[]`, so a curriculum JSON change silently orphans rows: store a `curriculum_version` and validate on write. (d) no `updated_at`/`version` anywhere (R4.3). (e) `assessment_event` lacks `source_obs_id`, so a bad photo extraction cannot be rolled back; the ledger has `applied` but nothing links applied rows to the events they created.
- **R4.11 [M] Ambiguous inflation.** "variance inflates by 0.02 per school-week" is unit-ambiguous (variance vs SD; the kt doc inflates Glicko-style). `closingRate > 0.1 + school pace` mixes grades/month with topics/week. Replace with `closingRate > expectedRate(class)` where `expectedRate` is grades per month for an on-grade child (≈ 0.1 GE/month by construction, i.e. 1 grade per 10 months); state units.
- **R4.12 [M] Hardcoded academic-year start.** `monthsIntoSession` assumes April and `v0 = nTopics/32`. State boards differ (RBSE, Karnataka, Kerala, Delhi government schools reopen on different dates [M]). Put `sessionStart`, `teachingWeeks` and the vacation calendar in a per-board/per-state config with the child's school overriding it; unit-test `schoolWeeks()` with a state-board fixture.
- **R4.13 [M] The ChildBrief `need` field is not covered by N2/N3.** Those invariants lint *static strings* only. The model's generated speech is free to say "test" in the first session or "you are behind" paraphrased. Per the repo law "safety by predicate, not instruction", add a runtime output predicate on the teacher's transcript (Hindi, Hinglish and English token list plus a classifier) that blocks or regenerates; N2/N3 should assert the predicate exists and passes an adversarial set of 200 prompts.

### R5. Untestable or unmeasurable as written

- **R5.1 [H] Nothing is testable before real users.** MN1-MN9 all need children. Yet the filter, planner, N1, N6 and the photo-gating logic can be tested offline now. Add a **synthetic-child harness** (reuse `student-simulators.md`): simulate 200 children with (a) true pace trajectories incl. reordered chapters, revision homework and holiday breaks; (b) parents with 20% wrong chapter answers; (c) datesheet photos with DD/MM swapped. Outputs: chapter MAE vs weeks since observation, gate false-reject and false-accept rates, exam-mode start error in days, N1/N6 violations. Acceptance (starting values, [U]): MAE ≤ 1.5 topics with weekly observations; false-reject of parent-confirmed observations = 0.
- **R5.2 [H] No end-to-end test that the NeedModel helps.** MN6/MN7 test components. Add **MN10: need-aware planner vs the same system with a generic adaptive planner (no NeedModel)**, outcome = delayed retention of the *school-chapter* items 2 weeks later and parent-reported usefulness; otherwise the whole module's value is assumed. Also report cost (photo calls, tokens) per child per week.
- **R5.3 [M] "photo extraction measured on 300 photos" has no acceptance thresholds for gating dates.** Set them: date exact-match ≥ 0.95 on printed datesheets, Devanagari subset reported separately, abstain-rate reported; if not met, datesheet photos create only *suggestions* (confirm card prefilled) rather than events.
- **R5.4 [M] N2 lints UI strings but the banned list is English plus a few Hindi words.** Hinglish romanisation variants (`kamzor`, `kamjor`, `peeche`, `pichhda`, `कमज़ोर`, `पिछड़ा`) must be normalised; add transliteration-insensitive matching and Devanagari entries.
- **R5.5 [M] N5 tests the sweeper, not the pipeline.** Add: integration test with a fake image containing a name, phone number and roll number; assert the extraction row and logs contain none, and no Blob object exists after success and after each failure path.

### R6. What is missing

1. **Year rollover.** On promotion (April or state date): increment `classLevel`, archive events and homework, reset `pace` priors, re-anchor `enrolledLevel`, expire goals, re-ask books. Currently undefined; a stale `classLevel` silently makes every placement look worse or better.
2. **School change and board change mid-year**, multiple children per parent, and a child with two tuition sources; the `books` map and pace must be re-initialisable.
3. **Medium and script.** Hindi-medium NCERT chapter titles and Devanagari datesheets; the book match step (§6.1 item 5) names only titles in "the board's book". Add Hindi titles to the curriculum graph and a script-aware matcher.
4. **Non-school pathways**: homeschool, NIOS, open school, children out of school for months. The NeedModel assumes a school calendar.
5. **Offline and low-end devices**: the photo pipeline assumes uploads and a decent camera; define the fallback (parent enters chapter by tap, no photo) and ensure the VOI picker never *requires* photos.
6. **Subject coverage inconsistencies.** `Subject` includes `evs`, `sst`; the planner only uses maths, English, Hindi in `maxGapGrades`; science and SST get θ by borrowing (onboarding-diagnostic). Say so, and decide how class 1-2 "EVS/maths/language" strands are modelled.
7. **Failure modes of the Director's use of `need`**: what happens if the NeedModel is stale (no observation for 3 weeks)? Define staleness: pace confidence below 0.6 for 3 weeks → drop `school` track weight to 0.3 and ask.
8. **Cost envelope**: gpt-5.6 vision per photo, parent voice call minutes, extraction calls per child per week. No numbers; add a budget line per child-month and a kill switch.
9. **Parent expectation management**: a parent whose child places 2 grades behind may react with pressure on the child. The doc controls what the *child* hears; add parent-side guardrails (what the weekly summary says about gap; "level bridge" wording is shapes only, with a test that no parent string contains a grade-gap number for classes 1-5 unless the parent opens "Kaise pata?").
10. **Opt-out and deletion UX for need data** (view, correct, delete a goal/belief/event) and a correction path when a photo extraction was wrong.

### R7. Corrections to apply, in priority order

1. Add the safeguarding hook and N13 (R1.1); make placement and exam-mode stop rules unconditional (R1.2, R1.3).
2. Fix the legal and storage facts: TTL columns and sweepers (R2.2), Azure retention claim (R2.3), no 10-minute lifecycle (R2.4), on-device face/EXIF screen (R2.5); retag §4.8 M1 "default" as depending on counsel Q1 (R2.1).
3. Bypass the gate for confirmed observations; add predict step, symmetry, versioned writes (R4.1-R4.3).
4. Add slip, one placement implementation, fix the pKnown seeding double-count (R4.4, R4.5).
5. Fix the urgency curve, per-subject foundation, pair-wise segment dropping (R4.6-R4.8).
6. Remove the θ nudge from teacher marks in v1 (R3.4); soft-window rule for unconfirmed dates (R3.5); parent gate for confirm (R1.6).
7. Re-tag evidence: findings 1, 5, 6 and the goal horizons (R3.1-R3.3); delete the uncited Fan et al. reference.
8. Add the synthetic harness and MN10, runtime output predicate, parity audit (R5.1, R5.2, R4.13, R1.5).
9. Fix schema bugs (`constraint` reserved word, placement history, FKs, versioning) (R4.10).
10. Write the missing pieces: year rollover, staleness, cost, deletion UX (R6).
