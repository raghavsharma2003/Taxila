# TUTOR-MODEL: the superhuman tuition teacher

Status: research and design, round 4, 2026-10-10. It answers the owner's 2026-10-10 directive
(`dc-r4-owner-vision-superhuman-tutor`, `context/inbox/r4-owner-vision-2026-10-10.json`). The directive asks for
content built live from the child's style, the tutor-student chemistry and the conversation; detecting whether the
child understood; knowing how this child learns; a human bond that grows; a human teacher replicated feature by
feature, "the way duplex replicates turn-taking"; and **no modules**: "just start the session". The teacher asks what
happened at school today, works out what to teach, then continues and revises the way tuition teachers do.

This file builds on work already in the repo and does not repeat it. Read with:
- `docs/research/conductor/school-sync-homework.md` (SchoolMirror SS1-SS14, homework ladder; **designed, not built**);
- `docs/research/learning-science.md` §2 (learning styles) and `docs/research/world-best/hyper-personalisation.md`;
- `docs/research/learner/LEARNER-MODEL.md` (LM1-LM18, legal modes M0-M3, NM-3);
- `docs/research/comprehension/COMPREHENSION-ENGINE.md` and `docs/research/world-best/understanding-detection.md`;
- `docs/design/superhuman/RELATIONAL-OS.md` and `docs/design/round3/relational-human/RESEARCH.md`;
- `docs/design/superhuman/STUDENT-FLOW.md`, `docs/design/reset/CONVERSATION-V2.md` and `docs/design/reset/VALUES-100.md`.

**Tags:** [V] primary source read this session; [S] abstract, search summary or secondary write-up; [M] prior knowledge
not re-checked today; [T] read in this repo's code today; [P] probe run today (n and method given); [I] our inference or
design; [A] anecdote or practitioner knowledge, not data.

**Laws this design obeys:**
- Teacher turns below are written as ⟨shapes⟩, never as lines. Anything sentence-shaped in a prompt gets recited.
- Rules that must fire go last.
- Safety is decided by predicate.
- A model never grades: it classifies against verified keys.
- Truncation is silent, so budget gates throw.

---

## 0. The answer on one screen

1. **Indian tuition is data-rich on scale and thin on what happens inside a session.**
   - **Scale.** 27.0% of Indian students took private coaching in 2025, 30.7% urban and 25.5% rural (CMS:E 2025,
     221,617 students [S]). Rural rates reach 66-80% in Bihar and West Bengal (ASER 2024 [V, repo]).
   - **Effect.** In sibling comparisons over about half a million children, tuition was worth roughly one extra year of
     schooling. The effect was largest for disadvantaged and low-level children (Dongre & Tewary 2015 [S]).
   - **Reasons children give.** "To pass exams" 43%. "I do not understand the teaching at school" 27% in government
     schools and 18% in private ones (Sujatha 2014, n = 4,031, grades 9-10 [V]).
   - **The gap.** No ethnography of a primary home-tuition *session* exists that we could find (searched 2026-10-10). The
     session pattern in §1.2 is therefore practitioner knowledge [A], and the cheapest high-value study is to watch
     10-20 real tutors (§8, M-TM6).
2. **Session-first works because Taxila already has every part except the opening.**
   - Syllabus graph: 830 topics. Verified kits: 830 of 830, with 2,991 skills and 12,398 items [T].
   - The Conductor's plan already has segments and "why" codes (`server/conductor/planner.js`) [T].
   - School-start placement already exists (`server/content/next-topic.js schoolStartIndex`) [T].
   - A lexical topic router already exists (`server/lesson/purpose.js matchTopic`) [T].
   - **Missing:** the intake beat, a stored school pointer, and sessions that can hold more than one topic.
3. **The opening is one open question plus a confirmation that is also a probe.**
   - She asks what happened at school. Code maps the answer to a *closed* candidate set built from class, subject and
     the school pointer.
   - Her next turn asks the child to show one thing the school teacher did. The answer confirms the mapping, places the
     child inside the chapter and grades a warm-up item, all in one turn.
   - Today's router gets 7 of 12 such utterances right, 2 wrong and 3 missed. `findTopic` gets 0 of 12 [P, §2.3]. The
     intake needs an alias layer and a "which one?" fallback, never a silent guess.
4. **"Teach anything" has four tiers** (§2.6).
   - (a) In the graph, any class.
   - (b) A school-vocabulary alias.
   - (c) Out of the graph but safe: an *explore* segment with keys verified by blind solving, and no grading without a
     key.
   - (d) Refused by predicate.
   The teacher "learns it herself" through the existing mini-kit law (`server/content/minikit.js`): one model writes,
   another blind-solves, cached once at library level, child-free.
5. **The Conductor's plan becomes her private prior, never a menu.**
   - The plan supplies due reviews, the level path, test windows and promises.
   - The intake overrides it in a fixed precedence: safety > what the child asked for (when safe) > test tomorrow >
     homework due > today's school topic > due reviews > the level path.
   - The child never sees a topic list.
6. **"How the student learns" is measured responsiveness, not a style.**
   - Matching to a self-reported style shows d ≈ 0.04 (Hattie & O'Leary 2025 [S]). Only 26% of outcome measures showed
     the required crossover (Clinton-Lisell & Litzinger 2024 [V via LS §2]).
   - The per-child state that does have evidence has ten dimensions: prior knowledge, guidance need, representation
     responsiveness, retention per skill, repetition-to-criterion, pace, engagement, interest hooks, language, and the
     child's own "what helped".
   - Each dimension is updated interaction by interaction from first attempts graded against verified keys (§3).
   - Taxila tracks four of them today. Two tables exist with **no writer**: `rep_fluency` is read but never written, and
     `format_posterior` is never read or written [T].
7. **"Understood or not" is already the strongest part of the machine, but the live lesson under-asks.**
   - The engine (K/U/T/D/M facets and a 5-state ladder) keeps false mastery at 0.017-0.025.
   - The deployed live policy reaches macro accuracy 0.489-0.496 and finds only **2.1%** of truly-understanding
     children, against 0.710 for an oracle prober (`w1c-live-sim-headline`, `-2`; simulation, repo [M]).
   - The lever is more and better probes (why, transfer, delayed checks), not a better grader. The intake turn gives one
     free probe per session.
8. **The bond grows like a teacher's, not a friend's.**
   - Affective teacher-student relationships act on achievement through engagement (Roorda et al. 2017: 189 studies,
     249,198 students [S]). The youth working-alliance effect is r = .19 (Karver et al. 2018, 28 studies [S]).
   - What grows over weeks is her knowledge of the child, the child's autonomy and shared rituals. Claimed feelings,
     exclusivity and life-story hooks never grow.
   - Callbacks to the child's *life* and running jokes across sessions are memory tier C, which is **not built**
     (LM14). That needs an owner and counsel decision (§9).
9. **Each feature is built the way duplex was built** (§6): name the human signal, measure it, give code the decision
   and give the model the words.
10. **Owner decisions needed** (§9):
    - persist representation responsiveness per child at M1;
    - life callbacks (tier C);
    - teach-anything scope;
    - a Start-only home;
    - voice-only intake versus the notebook camera (cost-blocked: ₹20-47 per page against a ₹1 target);
    - commissioning the tuition study.

---

## 1. How Indian home tuition actually runs (classes 1-9)

### 1.1 What is measured (data)

| fact | number | source | tag |
|---|---|---|---|
| Students taking private coaching, current year | **27.0%** (urban 30.7, rural 25.5); classes 11-12: 44.6 urban / 33.1 rural | NSS 80th round CMS: Education 2025, 52,085 households, 221,617 students, Apr-Jun 2025 | [S] news and ministry summaries; the report itself was not opened |
| Coaching spend per student per year | rural ₹1,793, urban ₹3,988 (higher secondary ₹4,548 / ₹9,950) | same | [S] |
| Rural paid tuition, Std I-V / VI-VIII, government schools | All-India 30.4 / 32.9; Bihar 66.3 / 75.1; WB 73.8 / 79.9; UP 17.5 / 15.9; MP 13.0 / 15.3 | ASER 2024 Annexure 3 (table in `docs/research/voice/indian-teacher-discourse.md` §2.6) | [V, repo] |
| Tuition trend | about 25% flat for years, a spike in 2021, about 30% in 2022 | ASER 2022 summary | [S] |
| Effect of tuition on learning, classes 1-8 | "as large as an additional year of education or … attending a private school instead of a government school"; larger for disadvantaged children, children with lower learning levels, government-school children (about twice as large) and less-educated parents | Dongre & Tewary 2015, EPW; ASER 2011 households (~0.5 M children), sibling fixed effects; child-specific traits uncontrolled | [S] |
| Hours | about 9 h/week in tuition ("1.5 extra school days per week") | IHDS, as cited by Dongre & Tewary | [S] |
| Why students go (grades 9-10, 49 schools, 4 states) | government/aided: **pass exams 43%**, **"do not understand teaching at school" 27%**, teachers teach badly 12%, friends go 11%, higher marks 10%; private unaided: exam prep/marks 40%, friends 18%, **don't understand 18%**, parents decided 16% | Sujatha 2014, RIES, n = 4,031 | [V] |
| Who teaches (same sample) | coaching centres 77.1%, **own school teacher 19.8%** (banned in many states; AP 58.1%), home tuition 3.1% | same | [V] |
| What tutors do (same) | teach to the exam pattern and likely questions; give study material; **frequent tests with feedback**; study methods per subject; **individual attention** (rare in government schools) | same | [V] |
| When they join | 74% at the start of the year, 21% mid-year, 4.6% just before exams | same | [V] |
| Tutoring's role grows with grade | it supplements in lower grades and *supplants* school in classes 11-12 | Bhorkar & Bray 2018, IJED, urban Maharashtra | [S] |
| Tutor-school relations | 37 providers interviewed; four types: complementary, accommodating, competing, substitutive; dynamic and blurred | Bhorkar 2024, ECNU Rev Educ 7(1) | [S] |
| Parents' own homework help | Indian parents report 12 h/week helping with homework (highest of 29 countries) | Varkey Foundation Global Parents Survey 2018 | [S] |
| Coercion inside the channel | children in Andhra Pradesh reported being beaten for not attending or not paying for the teacher's private class | Morrow & Singh 2014 | [V, repo] |
| Teaching at the child's level, after school, India | Mindspark centres, Delhi, grades 6-9: **+0.36σ maths, +0.22σ Hindi in 4.5 months**; weaker students gained most relative to control, where their learning was "close to zero" | Muralidharan, Singh & Ganimian, NBER WP 22923 (AER 2019) | [V abstract] |

**What the data says for design.**
- **The demand is school-anchored.** It is about tests, "I didn't understand in class" and homework. It is not
  open-ended learning [V].
- **The value is largest for the weakest children** [S]. This matches the equity profile already in the code: worked
  example first, one next step, never a menu (`rj-advice-menu-for-weak-learners`).
- **The best measured Indian after-school effect came from teaching at the child's *actual* level, which is often well
  below grade** [V]. Following the school's chapter is therefore necessary but not enough. The weak foundation has to
  be found and taught alongside it.

### 1.2 What a session looks like (practitioner pattern, [A] unless tagged)

Nothing here is measured. It is the common shape reported by teachers and parents. A prior repo note calls the missing
ethnography "the biggest gap" (`docs/research/learner/need-goals.md` §5.1, §10). It stays a gap: a search on 2026-10-10
found ethnographies of Indian home literacy (Batra 2022, OU) and of Maldivian tuition (Mariya 2012), but none of an
Indian primary home-tuition session.

1. **Arrival and opening.**
   - She asks what happened at school today, what was taught and what homework came. She also asks to see the copy
     (notebook).
   - The diary or notebook is the ground truth. The child's account is the cue.
   - The date on the last notebook page tells her where the class is.
2. **Notebook and homework check.**
   - She reads today's classwork, ticks or corrects it, and does one item *alongside* the child.
   - Homework gets started together and finished by the child. A weak tutor does it for them, and parents notice the
     handwriting.
3. **The school topic, again.**
   - She re-explains today's class topic in her own way. This is "class mein samajh nahi aaya", the 27% reason [V].
   - Then she gives two or three book-exercise questions, the ones the school will set.
4. **Tests drive the calendar.**
   - The syllabus circular (for example "PT-1: Ch 1-4") and the datesheet set the weeks before a test.
   - In those weeks she revises "important questions", gives a mock test the day before, and tests frequently [V, Sujatha].
5. **Revision cycles.**
   - A weekly revision day, often the weekend.
   - Before each unit test, she goes back over everything since the last one.
   - Before exams, the whole term.
6. **Finding where the school is.** She uses the notebook date, the diary, the class WhatsApp group and the child's
   "ma'am ne chapter 5 shuru kiya". When the child is vague, she asks the parent.
7. **Rapport over months.**
   - The child calls her *didi*, *bhaiya* or *ma'am* (`indian-teacher-discourse.md` §2.3).
   - She knows the sibling, the cricket team and the festival coming up.
   - The register is strict but warm, with jokes. The parent is within earshot.
8. **Parents' expectations.**
   - Homework done, test marks up, "weak areas" fixed, a remark at the door.
   - Accountability runs to the payer [V, Sujatha]. The first meeting is a demo in front of the parent (need-goals §5.1 [I]).

### 1.3 What great tutors do: general evidence that transfers

- **Dual diagnosis.** Expert tutors of elementary maths watch the child's cognitive *and* motivational state at once.
  The INSPIRE pattern is Intelligent, Nurturant, Socratic, Progressive, Indirect, Reflective, Encouraging: leading
  questions and incremental hints rather than answers, and indirect feedback that lowers evaluative pressure (Lepper &
  Woolverton 2002 [S]).
- **"Do you understand?" is misleading.** Across 44 tutoring sessions, students' answers to comprehension-gauging
  questions were "very misleading". The *quality of their answers* was the most reliable signal (Person, Graesser,
  Magliano & Kreuz 1994 [S]).
- **Human tutors misjudge understanding.** They overestimate correct understanding and underestimate wrong
  understanding (Chi, Siler & Jeong 2004; replicated by Wittwer, Nückles & Renkl, 22 dyads [S]). **This is where a
  machine can be superhuman.** It can probe systematically and keep an exact ledger that no tutor's memory holds.
- **What makes tutoring work.** Across 89 RCTs the pooled effect is 0.288 SD. It is largest with teachers or
  paraprofessionals as tutors, in earlier grades, at least 3 days a week, and during school (Nickow, Oreopoulos & Quan
  2024 revision; 0.37 in 2020 [S]). Human tutoring d ≈ 0.79 against step-based ITS 0.76 (VanLehn 2011 [M]).
- **A tutor who waits is not a tutor.** An AI tutor that waits to be asked was used in 17% of mistake sessions and
  matched practice without AI (`rj-passive-tutor`). The tutor leads.

### 1.4 What Taxila takes from tuition, and what it refuses

| take (it is the product) | refuse (and why) |
|---|---|
| The agenda starts from the school day (§2) | Doing the homework *for* the child. The ladder bottoms out on an isomorph (SS7/SS8; Bastani 2025: unguarded help −17% on later exams) |
| Today's class topic re-explained the same day (the 27% reason) | Cramming "important questions" as rote. Retrieval with feedback is kept (`rj-schedule-shape-tuning`); answer-pattern drilling is not |
| Test windows from the datesheet (planner `test_window`, split 30/70) | Pressure, comparison, coercion ("Sharma ji ka beta"). NEVER MANIPULATE; the parent sees learning, never conduct (LM13) |
| Weekly revision, and revision before each test | A behaviour report to the parent (SS12: behaviour remarks never become labels) |
| One item done *alongside* the child | Contradicting the school teacher to the child (SS11) |
| A one-line remark for the parent | Grade-equivalent labels (`grade-equivalent-parent-band`) |

---

## 2. Session-first: the design that replaces modules

### 2.1 The shape

```
Start ─▶ arrive (1 turn) ─▶ INTAKE (≤ 3 child turns, ≤ 90 s) ─▶ DECIDE (code, < 5 ms) ─▶ segment 1 … segment n ─▶ revise slice ─▶ wrap
              │                       │                                                   │
          callback                 maps to graph,                                 each segment pins ONE kit;
          (if any)                 updates SchoolMirror                           switching topic = new segment
                                                                                  in the SAME session (no restart)
```

- **A session is the unit the child sees.** A segment is the unit the engine grades. Today
  `lesson.topic_id text not null` (`db/migrations/001_core.sql`) ties one lesson to one topic and one pinned kit
  (`server/content/index.js` pinning). A topic switch offers a "Start ⟨title⟩" chip that begins a new lesson
  (`server/director/state.js` case "switch") [T]. To the child that is a module boundary.
- **Proposal [I]:** keep `lesson` as the segment, add `session_id` to group segments, and let the server open the next
  segment inside the turn response. Kit pinning, evidence ids, `reteach_attempts` and the end path stay as they are.

### 2.2 The first two minutes, turn by turn (Hinglish, voice-first, class 6, regular-stage bond)

Child lines are example inputs (test fixtures). Teacher lines are **shapes** for the Director and compile, never text.

| t | who | what | code at this turn | screen |
|---|---|---|---|---|
| 0.0 s | — | Child taps **Start**. The home shows her face, her name and one button; no topic card (§2.7) | `start()` opens the session with **no** topic. The Conductor's plan arrives as a PlanPrior (§2.7). The Forge/Studio prefetch starts for the **top 2 hypotheses** (the plan's topic and the school-pointer topic), as speculation [I] | lights down, Desk |
| 0.3 s | her | ⟨greet by the child's address; if the record has one, a learning callback in a few words (the existing `pickCallback` OPEN rule); then ONE open question about today at school, what was taught; no list, no second question⟩ | `beat=intake`, `NO_STAGE_BEATS`. The callback rides the existing last-section rule (`dec-r3rh-callback-lead-last-section`); never beside a sad share (`rj-r3adv-callback-on-sad-share`) | 3 quiet chips under her: **today's two timetable subjects** (else the plan's two), **"Test hai"**, **"Homework"**. Chips are a voice fallback, not a menu |
| ~4 s | child | "aaj fractions padhaya, ma'am ne equivalent fractions kiya" | `intakeParse()` (§2.3) returns a frame `{kind: taught, subject: maths, words}`. The lexical router picks `c6-maths-ch07-t03` *Equivalent fractions*, score 10 [P]. Pointer prior agrees (ch07 ±1), so p ≥ 0.6 | — |
| ~5 s | her | ⟨uptake: say back their words (fractions, equivalent); then ask them to show ONE thing their teacher did in class, a number example, said or written; warm, curious, no test framing⟩ | A **confirmation that is a probe**: the next move is the kit's diagnostic or retrieval item for skill s1 of t03, reframed as "show me what ma'am did". Graded against the kit key; never a model opinion | small board with "_ / _ = _ / _" for them to fill (typed or spoken) |
| ~15 s | child | "1/2 aur 2/4 same hote hain, upar neeche same se multiply karte hain" | Closed-label grade against the key and the kit `expectations` (multiply numerator and denominator by the same number). The `kt_evidence` row gets `via: dialogue`, `cls: item.open`. **SchoolMirror** gains `child_said(c6-maths-ch07, w 0.55)`. **Position in chapter:** s1 shown → s1 done at school; the next kit skill (simplest form, comparing) is "probably not yet" | the board shows their two fractions as bars (T1 engine; content-format fit) |
| ~16 s | code | DECIDE | Precedence (§2.7): no test tomorrow, no homework said → **school topic of the day, continue**. `guidanceLevel(s2)` → `faded` (s1 right, s2 unseen). Due reviews: 1 (decimals, 9 days) → the revise slice later. The losing prefetch is cancelled | — |
| ~17 s | her | ⟨agenda in one short spoken line: carry on from what their teacher did, the next step of the same idea, then a quick look back at last week's thing; offer ONE two-way choice of order (example first or try first); never a list of topics⟩ | Choice ≤ 2 options (Patall 2008: 2-4 choices; one concrete step for weak learners, `rj-advice-menu-for-weak-learners`). The choice is logged as a DecisionRecord with propensity | agenda strip: 3 dots, no titles |
| ~20 s+ | — | segment 1: the faded worked step on s2 | existing Director path | Studio piece if ready, else the board |

**Branches inside the same two minutes.** Each is one row of the intake policy.

| what the child says first | frame | what she does (shape) | code |
|---|---|---|---|
| "kal maths ka test hai, fractions" | `test{subject, when: tomorrow, chapters?}` | ⟨ask what the test covers, chapter or page⟩; then a revision segment: retrieval on each skill of those chapters, weakest first; a mock of 3 items at the end | opens a one-day `test_window` (planner rule; `child_controls.test_window` exists, 019); `pace.newSkillBudget = 0` (planner sets it when the test is < 2 days away) [T] |
| "homework mein sawaal nahi aa raha" | `homework{subject}` | ⟨ask them to read the question aloud⟩; the homework ladder | SS7/SS8 ladder; the voice model never holds the school item's final answer; leak guard. **Not built** (SS is design only) |
| "class mein kuch samajh nahi aaya" | `not_understood{subject?}` | ⟨one gentle question: which part, or the last thing the teacher wrote⟩; re-teach from the first representation, diagnostic first | the kit's misconception diagnostics; `reteach.js` arms; this is the 27% reason [V] |
| "kuch nahi padhaya / chhutti thi / test tha" | `nothing` | ⟨receive it in a few words⟩; her private plan: due reviews, then the level-path topic | PlanPrior; my probe shows "test tha" correctly maps to no topic, but "copy check ki" mis-maps (§2.3) |
| "pata nahi" / silence ≥ nudge | `unknown` | ⟨recognition: name the two most likely chapters as a two-way choice⟩ | top 2 of the pointer distribution (SS §2.2); one try, then the plan |
| "mujhe volcano ke baare mein jaanna hai" | `want{words}` | the teach-anything ladder (§2.6) | tiers a-d |
| something from their life ("aaj cricket match jeeta") | `share` | `share_uptake` (one warm specific line, no follow-up question), then the intake question again, once | `server/relational/policy.js` SHAPES [T] |
| any harm word | safety | the safety predicate pre-empts everything | `openings.js` fixed openings, 1098 / 14416 [T] |

**Young band (classes 1-2).** Children of 6-7 report their school day poorly [A]. The intake is picture chips (today's
timetable subjects as icons) plus one spoken question. The parent-set timetable and pointer weigh more [I].

### 2.3 Mapping her answer onto the syllabus graph

**Probe, today [P].** `server/lesson/purpose.js matchTopic` and `server/content/curriculum.js findTopic` were run on 12
intake utterances, with labels written before the run. Classes 4-8, Hinglish, deterministic, no model. Script: `docs/research/round4/tutor/school-today-probe.mjs`; run it
from the repo root.

| result | matchTopic | findTopic |
|---|---|---|
| right | **7/12** (equivalent fractions c5 and c6, components of food, integers, photosynthesis, "test tha" → none, "dinosaurs" → none) | **0/12**: it needs *every* word of 4+ letters to start a title word, so a sentence never matches |
| wrong | 2: "ma'am ne copy check ki" → *Checking reasonableness* (an activity word read as a topic, like `rj-r3fix-switch-on-way-words`); "angles padhaye, acute obtuse" (class 6) → **class 5** *Right, acute and obtuse angles* (title words beat the class step; class 6 calls it *Types of angles*) | — |
| missed | 3: "hindi mein kavita padhi" (which poem?); "history mein mughal empire" (the new NCERT class 8 book has no "Mughal" in any title; the closest is *Reshaping India's Political Map*); "table of 7 … kal test hai" (tables are filed under *Equal Groups* / *Multiplication facts*) | — |

Read: the lexical router is a good first stage, but it is not an intake. Concretely:

1. **Parse the frame before the topic.** `intakeParse(text) → IntakeFrame`:
   - a closed `kind`: taught, homework, test, not_understood, want, nothing, unknown, share;
   - plus `subject`, `when` and the content words.
   Activity words never name a topic: copy, check, test, homework, revision, class, ma'am, sir. Lexicon first (as in
   `server/conversation/lexicon.js`). A closed-label pick runs only when the lexicon abstains. It piggybacks on the
   classify call that already runs every turn: the signals block cost +25 ms p50 there
   (`teacher-brain-classify-piggyback-2026-10-04`).
2. **The candidate set comes from what the school can be teaching**, never from the whole graph. It contains:
   - the child's class and the named subject (or today's timetable subjects);
   - the chapters at the SchoolMirror pointer ±2, plus the top 3 of its distribution;
   - one class below, for the back-chain.
   The pick is constrained to this enum or `none`: constraining to the topic raised misconception precision from 0.53
   to 0.75 (Otero et al. 2024, SS5 [V]). The class-5 "angles" error disappears, because a class-6 child's candidate set
   is class-6 chapters first.
3. **Alias layer (library-level, reviewed, child-free).** Maps school vocabulary and old NCERT or private-publisher names
   to topic ids:
   - "Mughal empire" → `c8-sst-ch02`;
   - "tables" → `c4-maths-ch09-t01`;
   - "chapter 7" → the 7th chapter of the child's book.
   This is SS6's alias table extended from books to words. RBSE class 9 uses the *old* NCERT books
   (`data/curriculum/boards.json`), so an RBSE class-9 child names chapters that this seed does not have.
4. **Confirm with a probe, never silently** (§2.2, t = 5 s). Below p 0.6 she asks the two-way "which one?". After a
   wrong pick, the child's correction is honoured at once. A confirmed pick writes the SchoolMirror source
   (`child_said`, weight 0.55, half-life 5 days; SS §2.2).
5. **Where in the chapter.**
   - The topic's kit lists 2-5 skills in teaching order.
   - The child's own example marks the latest skill shown at school.
   - The kit `expectations` say what a complete account of that skill contains.
   - The graded answer is the child's level *on* that skill.
   This is the tuition teacher's "copy dikhao", done by voice.

```ts
// proposed shared/session.ts (types only; [I])
type IntakeKind = "taught" | "homework" | "test" | "not_understood" | "want" | "nothing" | "unknown" | "share";
interface IntakeFrame { kind: IntakeKind; subject?: Subject; when?: "today" | "tomorrow" | "this_week";
  words: string[];                       // content words only, scrubbed (scrubPii), never stored beyond the session
  candidates: { topicId: string; p: number; via: "lexical" | "alias" | "pointer" | "label" }[]; abstain: boolean }
interface SegmentDecision { topicId: string | null; skillId?: string; purpose: "school_continue" | "school_reteach"
  | "test_revise" | "homework" | "review" | "level_path" | "explore"; why: { code: string; ref: string }[] }
```

### 2.4 School ahead of, behind, or level with the child

The comparison uses the confirmed school topic and the child's ledger (`server/learner/kt/ledger.js readSkill`).

| case | test (code) | what she does | evidence |
|---|---|---|---|
| **level** | school skill unseen or `practising`; prerequisites `learned_today`+ | continue: consolidate today's class idea the same day (retrieval with feedback), then the next kit skill | same-day retrieval; LS §3 |
| **school ahead** (weak foundation) | a prerequisite (curriculum `prerequisites`) is `weak` or unseen, and the school topic fails the probe | **two tracks in one session**: a short foundation segment on the prerequisite (TaRL back-chain, `next-topic.js pickTopic`, `MAX_BACKCHAIN` 3), then back to the school topic with the foundation named; never leave the school topic out (the parent's test is on it) | Mindspark (teach at the actual level) [V]; need-goals "foundation track + school track" |
| **school behind** (child already knows it) | the school skill is `mastered`+, or the intake probe and one transfer item are both right unaided | no repeat: a transfer or "harder" item (V1 bar: a harder path for every topic), then preview the next chapter, or the plan's level path | boredom bar: ≤ 5% of skill-sessions too easy for 3+ items (VALUES-100 V1.4) |
| **not on this board or book** | no candidate above p 0.6 after alias and "which one?" | map to the nearest NCERT topic and say so plainly; or teach-anything tier (c) | SS6 |

`server/content/next-topic.js` already starts where the school is (`schoolStartIndex`: parent chapter → placement GE →
calendar × 0.8). But the `child.school_chapter` input it reads **has no column in any migration** [T], so it always
falls back to the calendar estimate. It also reads legacy `skill_state`, not the kt ledger [T]. The SchoolMirror pointer
replaces both inputs.

### 2.5 The revise slice (every session, the tuition "dohrao")

Each session ends its teaching with a 2-4 minute revise slice. It draws on:
- due FSRS reviews (`ktDueCount`);
- delayed checks due (`conductor-openers-anchor-due`);
- woven checks (`server/comprehension/weave.js`).

It is framed as revising last week's work, never as a test. In a test window the whole session becomes revision.
Retrieval with corrective feedback until correct is the lever for classes 1-3, not the schedule's shape
(`rj-schedule-shape-tuning` [S]).

### 2.6 "Teach anything": four tiers, and when she refuses

| tier | test | what she teaches with | grading |
|---|---|---|---|
| **a. in the graph, any class** | `matchTopic` over all classes, or the alias layer | the verified kit; topics above the child's class only after a prerequisite check; below without comment | normal (verified keys) |
| **b. near the graph** | the alias layer maps school vocabulary to a topic | same as a | normal |
| **c. outside the graph, safe** (dinosaurs, volcanoes, how a phone works, cricket rules, a coding idea) | no topic; the subject passes the safety predicate and the scope list | an **explore segment**. The content is a mini-kit built the existing way: `taxila-fast` writes and `taxila-brain` blind-solves; only items whose key is reproduced keep a key; `verified: false` halves evidence weight (`server/content/minikit.js`) [T]. Facts on screen come from templates and engines, never from generated pixels (`generated-media-carries-facts`). Cached at library level by a normalised subject key, child-free; demand-ranked for human review (the `forge_request` pattern) | only items with a reproduced key; open "why" items give practice, not evidence (a model never grades) |
| **d. refuse** | the predicate fires: self-harm methods, weapons or explosives, drugs, sexual content beyond the class's NCERT framing, a medical diagnosis, political or religious persuasion, another person's private data, cheating on a live exam, contact or meeting requests | a fixed-shape decline plus an adjacent safe topic (`contact_decline`, `romance_brief`, `secret_grownup` style); safety turns use the existing safeguarding path | none |

"The teacher learns it herself" therefore means three things:
1. She prepares content for a new subject under the blind-solve key law (tier c).
2. Her record of the child grows (§3, §5).
3. Population posteriors learn what works across children (`arm_posteriors`, no child id).

It never means the persona rewrites itself. The persona is frozen and versioned (`mk-warmth-not-intimacy`).

**Gap [T]:** `minikit.js` builds only from a curriculum entry. Tier c needs a subject-to-outline step (outcomes,
misconceptions, items) behind the same blind-solve check, plus a scope list in code.

### 2.7 The Conductor's day plan becomes her private plan

Today the plan is shown. `GET /api/child/plan` (`server/routes/child.js planFor`) returns one home state and one primary
card with the topic, and the child taps it. The planner (`server/conductor/planner.js planDay`) already computes:
- slots with segments (retrieve, teach, practice, teachback, transfer, play, break);
- "why" codes: `test_window`, `level_path`, `due_review`, `teacher_promise`;
- the `reanchor_light` opener after a gap;
- the level-versus-school split: 60/40, and 30/70 in a test window.

**Change [I]:**
1. **The home shows Start only** (and Continue when resumable). Her face, her greeting and the button. The topic title
   moves to the parent view. Owner decision (§9).
2. **The plan becomes a PlanPrior handed to the session:** `{levelPathTopic, dueReviews[], testWindow?, promises[],
   pointer, successFirst, opener}`. It is no longer a lesson choice.
3. **The intake overrides it in a fixed precedence**, one order everywhere and in code:
   safety > a safe request from the child > test tomorrow > homework due > today's school topic > due reviews > the
   level path. Whatever wins, the revise slice keeps the due reviews.
4. **Her private plan reaches the compile as notes in LESSON NOW**, never as a list she could read out. Example notes:
   "next: s2 of today's school topic"; "revise later: decimals, 9 days". The agenda she speaks is one line built from the
   decided segments (§2.2 t = 17 s).
5. **The child can always steer.** "Can we do X" opens a new segment in the same session (tier a/b), instead of today's
   "Start ⟨title⟩" chip that begins a new lesson.

### 2.8 What changes in code, and what stays

| area | file(s) | change | keep |
|---|---|---|---|
| session/segment | `db/migrations` (new `session` table or `lesson.session_id`), `server/routes/lesson.js start/turn/end` | start with no topic; the intake beat; open the next segment inside the turn response; summary per session | kit pinning per segment (`content/index.js`), evidence ids, the end transaction |
| intake | new `server/lesson/intake.js` (parse, candidates, decide), lexicon in `server/conversation/lexicon.js` | the IntakeFrame; activity-word stoplist; closed-label fallback on classify | `purpose.js matchTopic` as stage 1 |
| school pointer | new `server/school/mirror.js` (SS §2), migration | store `child_said`, `parent_pick` and `test_syllabus` sources; pointer fusion | `next-topic.js schoolStartIndex` (reads the pointer instead of the missing `school_chapter`) |
| aliases | `data/curriculum/aliases.json` (library, reviewed) | school vocabulary and old book names to topic ids | the curriculum graph |
| beats | `shared/brain.ts BeatType` + `"intake"`; `server/stagecraft/config.js NO_STAGE_BEATS` | intake has no stage build | every other beat |
| plan | `server/conductor/planner.js` (adds `pointer` to inputs), `server/routes/child.js planFor` | PlanPrior; Start-only home | the pure reducer, `inputsHash`, all rules R0-R10 |
| switch | `server/director/state.js` case "switch" | a server-side segment switch, not a "Start" chip | `findTopic` word rule (against substring traps) |
| Director opening | `state.js initLessonState` (phase warmup → intake for sessions) | the intake probe replaces the generic warm-up when it maps; the warm-up stays when the intake abstains | `guidanceLevel`, reteach, the ladder |
| teach anything | `server/content/minikit.js` (+ subject outline), scope predicate in `server/director/safety.js` | tier c and d | blind-solve key law |

---

## 3. "How the student learns": measured responsiveness, not a style

### 3.1 Evidence, compressed (full tables in LS §2 and hyper-personalisation §1)

- **No style.** Matching instruction to a self-reported style fails the crossover test (Pashler et al. 2008 [S]). Fifth
  graders gained nothing from matched modality (Rogowsky et al. 2020 [S]). A 2024 meta-analysis found g = 0.31, but only
  26% of outcomes crossed over and study quality was low (Clinton-Lisell & Litzinger [V]). A 2025 synthesis of 17
  meta-analyses: matching d = 0.04 (Hattie & O'Leary [S]). Binding in code: no style label reaches any generator
  (`rj-style-attribute-to-generator`).
- **Prior knowledge** is the reliable aptitude-treatment interaction. Guidance helps novices and hurts experts
  (expertise reversal; "giving assistance to novices appears more important than withholding it for experts", Tetzlaff
  et al. 2025 [S]). Adaptive fading driven by the learner gave the best delayed transfer (Salden et al. 2010 [S]).
- **Problem-first versus worked example.** Problem solving followed by instruction ("productive failure") helps
  *conceptual* knowledge when designed with fidelity (Sinha & Kapur 2021, RER, 53 studies, 166 comparisons [S]; g ≈
  0.36 overall, larger at high fidelity [M]). Low-prior children need the worked example first. So the choice is per
  child × skill, and it is a function of prior knowledge.
- **Representations.** The right representation depends on the *content* (Willingham et al. 2015 [M]). Within a skill,
  low-prior fifth and sixth graders did best with fraction representations blocked first, then interleaved (Rau,
  Aleven & Rummel 2010 [V via HP]). Which representation actually moves *this* child is an empirical question per skill
  family, and the only one Taxila can answer covertly.
- **Spacing and retrieval per learner and item.** Adaptive spacing from each learner's response time and accuracy
  (ARTS) beat fixed schedules at immediate and delayed tests. A yoked control showed the gain came from adapting to
  individual items *and learners*; expanding and equal schedules did not differ (Mettler, Massey & Kellman 2016 [S]).
  Per-learner, per-item half-life models are the production form (Settles & Meeder 2016, Duolingo [M]; FSRS in Taxila).
- **Interest** is the setting of an example. It reliably raises motivation, with learning effects that are smaller and
  fragile (Lin et al. 2024: retention g = 0.48, transfer g = 0.36 on k = 6; Leong et al. 2024: no learning
  difference [S via HP]).
- **Disengagement** shows in behaviour: wheel-spinning (Beck & Gong 2013 [M]), gaming the system (Baker et al. [M]),
  rapid guessing (Wise & Kong 2005 response-time effort [M]). It is named by the action it licenses, never as an emotion
  (Microsoft Code of Conduct restriction 12; `ct-no-voice-emotion-inference`).

### 3.2 The per-child state: `LearnerHow`

Every dimension is (a) measurable covertly, (b) updated from first attempts on verified keys or from session behaviour,
and (c) bound to a legal tier (`server/learner/mode.js`).

| # | dimension | grain | measured from | update (per interaction) | drives | tier | in code today |
|---|---|---|---|---|---|---|---|
| H1 | prior knowledge | child × skill | BKT-R pL, θ (placement CAT), misconception logit | the ledger fold per graded event | worked vs attempt; back-chain; school ahead/behind (§2.4) | M1 | **yes**: `learner/kt/ledger.js`, `placement/cat.js` |
| H2 | guidance need | child × skill | the last 5 outcomes + stuck items + first-step probe | `guidanceLevel()` each item | worked / faded / attempt / probe | M1 (outcomes) | **yes**: `director/fading.js` |
| H3 | **representation responsiveness** | child × skill family (topicType × subject) × rep class | did the next first attempt, unaided, come right after rep *r* was shown? Did it hold at the delayed check? | Beta(a, b) per (child, family, r), shrunk to the population prior (§3.3) | the **first** representation chosen for a new skill (today only re-teach reads history) | M1 if treated as an academic outcome; LM9 says M3 (§9) | **partial**: `reteach_attempts` child history (`w2c-reteach-child-history-first`); `rep_fluency` **read, never written**; `format_posterior` **unused** |
| H4 | retention | child × skill | FSRS memory (stability, difficulty); delayed checks ≥ 20 h | FSRS on each review | when to revise; the revise slice; test-window order | M1 | **yes**: `learner/kt/fsrs.js`, `kt_skill_state.mem` |
| H5 | repetition to criterion | child × skill family | unaided-correct items needed to reach `learned_today` | count at each promotion | practice-set length; consolidation | M1 (derived from the ledger) | **no** (derivable from `kt_evidence`) |
| H6 | pace | child, session | answer onset relative to the child's own baseline; turn length; "phir se" requests | session running mean | wait time (`pace.waitNudgeSec`), chunk length, speech rate | session; baselines only with `voice_pace_memory` consent (021) | **partial**: `voicesig` baselines, consented; `TurnResponse.pace` is sent but **no client reads it** (open.md) |
| H7 | engagement | child, session | VT 5 states from DA rule detectors (task and text) | per turn | break offers, beat length, a switch to play, end early | session only (NM-3) | **yes**: `learner-one-engagement-machine`, `server/signals` |
| H8 | interest hooks | child | parent-chosen interests; child-said likes | on parent edit; tier B needs P3 | the context skin of examples only | M1 (parent-chosen, memory consent); tier B M2+/P3 | **partial**: `child.interests` in the brief; tier B not written at M1 |
| H9 | language | child, session | parent tile + live mix | per turn (session) | language per move | tile M1; estimator session | **yes**: LM16 |
| H10 | "what helped?" | child × lesson | one tap at `reflect` (Older) | stored as a choice | one knob nudge, never a label | M1 (a choice) | designed (STUDENT-FLOW §8.2), not verified as built |

### 3.3 How H3 updates, interaction by interaction [I]

- **Credit.** After each graded **first attempt** on skill *s*, credit every representation class shown for *s* in the
  turns since the last graded attempt:
  - concrete, pictorial, abstract, analogy, counterexample, worked example, story, game, language switch
    (`reteach.js REP_CLASSES`);
  - weight `w = 1` if unaided, `0.5` if a hint was used (E11 analogue), `0.5` for game-sourced evidence (E4).
  - Update: `a += w·correct`, `b += w·(1 − correct)`.
- **Delayed confirmation counts double.** A delayed check (≥ 20 h, new form) adds `+1` to the representation credited
  at first teaching. Retention is the V1 definition of learnt.
- **Shrinkage.** The child's posterior is `Beta(n0·μ_pop + a, n0·(1 − μ_pop) + b)` with `n0 = 4`. `μ_pop` comes from
  population `arm_posteriors` / `format_posterior` per (band, topicType). A child with no history behaves like the
  population. Per-student bandits came out about equal to population bandits, and heterogeneous effects were detected
  in only 7-10% (Schmucker 2025 [V via PZ]). Shrinkage is the honest default.
- **Decay.** Half-life of 60 days on `a` and `b` (the VT figure for arms).
- **Never an input:** voice, vibe, timing, affect (CE8). A representation is never credited on a turn where safety
  fired.

### 3.4 How the state drives content choice (board, animation, game, story, repetition)

```
candidates = representations admissible for (skill, kit.formats, engine catalogue)        // content-format fit FIRST
guidance   = guidanceLevel(skill)                                                          // H2: worked → show steps; attempt → item first
if retention(skill) due and skill not new  → REPETITION (retrieval item, the form not seen last time)   // H4
else if engagement ∈ {strained, disengaging} → shortest beat; a game ONLY if its act exercises this skill (r3g-admission-by-skill)
else pick r ~ Thompson(H3 posterior over candidates), floor 0.2 exploration, × pReady(stagecraft) / cost   // H3
skin = interest context if H8 has one and the kit's interestContexts admit it                // H8, the setting only
```

| what the child sees | when the state selects it |
|---|---|
| **board** (live whiteboard, written while she talks) | explain / worked beats; H3 pictorial or abstract leads; anything not ready in time (V3.4: she draws instead) |
| **animation / explainer** | H3 favours pictorial or story for this family *and* a template exists; never a fact carried by pixels |
| **game / simulation** | practice of the skill being taught (the act must exercise the skill); H7 strained; H3 concrete or game leads. Game evidence counts ×0.5 and can reach `fragile` at most (E4) |
| **story** | H3 story leads, or the Young band hook |
| **repetition** | H4 due, H5 high, or a test window |
| **worked example first** | H1 low or H2 `worked`; the equity profile |
| **problem first** | H1 high and a T3 concept with a productive-failure design (H2 `attempt`) |

**Gap [T].** The stage policy (`server/stagecraft/policy.js wantAt`) chooses from the beat, the misconception, the
request, the board outcome and signals. **No per-child representation history is an input.** Only re-teach reads it
(`reteach.js selectReteach`). H3 has to reach `wantAt` as one more portfolio-free input, so the lossless rule SC-1
holds.

---

## 4. Understood or not

### 4.1 What the engine does now [T]

- **K: knowledge.** BKT-R per (child, skill) with a hint-ladder outcome, grader-confusion folding and an FSRS gate
  (`server/learner/kt/bktr.js`, `ledger.js`).
- **U: explains.** Why and teach-back facets (`server/comprehension/facets.js`).
- **T: travels.** Transfer facets, in the same file.
- **D: delayed.** Delayed checks at ≥ 20 h on the session clock (`learner-delayed-check-session-clock`).
- **M: misconceptions.** A logit per misconception, verified by a second model family.
- **The 5-state ladder** `not_yet → shallow → fragile → understood → durable` (`server/comprehension/state.js ladder`).
  "Understood" needs `mastered` + U + T + a clear misconception + non-game evidence. "Durable" needs a long-delay
  positive.
- **Evidence rules:**
  - a positive model verdict needs a code-checked span (E6);
  - a lucky correct proves nothing (E3);
  - a partial never scores U/T (E5);
  - game evidence is capped (E4);
  - the grade echo guard demotes a parroted answer (`grade-echo-guard`).
- **Probes and weave.** The probe scheduler holds a budget (`server/comprehension/schedule.js`, `budget.js`). Weave puts
  cross-topic checks into later topics (`weave.js`).
- **Signals.** D1-D13 (`server/signals/states.js`): an unsure-correct answer triggers a verify, a right-to-wrong repair
  is discounted, and so on. Voice states (`voicesig`, 8 states: fluentRecall, fragileCorrect, heldBelief, searching,
  absent, …) stay in **shadow** until precision ≥ 0.80 on children (VALUES-100 V2.3).

**Measured (simulation only, labelled):**

| policy | macro accuracy | understood found | false mastery |
|---|---|---|---|
| engine | 0.650 | 0.578 | 0.017 |
| live (deployed) | **0.489-0.496** | **0.021** | — |
| oracle-prober | 0.710 | — | — |

Sources: `comp-sim-2026-10-02` (24 personas × 30 seeds), `w1c-live-sim-headline` (understood found) and
`w1c-live-sim-headline-2` (re-run with the oracle-prober). The deployed lesson is careful
and nearly blind. It rarely asks enough of the right probes for a real understander to be certified. The
engine-oracle gap is about probes, not grading (`w1c-rejected-oracle-as-ceiling`).

### 4.2 Covert signals and what is known of their reliability

| signal | what it indicates | reliability known | source | Taxila |
|---|---|---|---|---|
| first-attempt unaided correct on a verified key | current knowledge (K) | the backbone; guess and slip modelled | BKT literature [M] | yes |
| correct after a delay, in a new form | learning, not performance | V1 definition; learning ≠ performance [M] | Soderstrom & Bjork 2015 [M] | yes (D) |
| near/far transfer item | T, the strongest "understood" | kits carry `near_transfer` and `far_transfer` kinds | kit schema [T] | yes, under-probed in the live policy |
| explanation quality (idea units against kit `expectations`) | U | "quality of student answers" was the most reliable signal; LLM ICAP coding κ 0.59-0.66 against human 0.97 | Person et al. 1994 [S]; `rj-llm-icap-as-learner-state` | yes (closed-label against expectations, span code-checked) |
| "do you understand?" / "samajh aaya?" | almost nothing | "very misleading" | Person et al. 1994 [S] | **never evidence**; a ritual only |
| a tutor's gut feeling | biased upward | tutors overestimate correct understanding | Chi et al. 2004; Wittwer et al. replication, 22 dyads [S] | replaced by the ledger |
| answer latency (child-relative, item-adjusted) | fluency, retrieval strength, rapid guessing | adaptive spacing from RT beat fixed schedules, gain attributable to per-learner adaptation; rapid guesses identifiable by RT | Mettler et al. 2016 [S]; Wise & Kong 2005 [M] | signals D10; voicesig `rapidGuess`, shadow |
| self-correction / repair direction | monitoring; a right-to-wrong repair = fragile | self-correcting a miscue predicted by executive function beyond reading skill (WM +9%, shifting +7% of variance), n = 82, age ~7.5 | Nguyen et al. 2020 [V via UD] | signals L5 |
| lexical feeling-of-knowing ("pata nahi" vs "yaad nahi aa raha") | not known vs not recalled | lexical choice tracks FOK in adults | Smith & Clark 1993 [V abs via UD] | voicesig `searching` vs `absent`; UD S1 |
| disfluency in young children | accuracy (not confidence) | children 5-8 | West et al. 2025 [S] | evidence weight only |
| audiovisual uncertainty cues at 7-8 years | weak | in children, differences were small and significant only for delay, eyebrow and "funny face" | Krahmer & Swerts 2004/2005 [S] | timing only; no face read |
| confidence prosody | knowledge, *if* framed as knowledge | no published calibrated child-speech-to-knowledge system (UD §1.4 gap); emotion inference from speech is banned (MS CoC r.12) | [V via UD] | voicesig, outcome-defined labels, shadow |

### 4.3 The rule

- **A model labels a turn into a closed set against the kit key and expectations. Code moves the state.** This is
  unchanged.
- **Session-first adds two things:**
  1. The intake probe on the school topic: one free graded item per session.
  2. Out-of-graph explore segments that grade only items with reproduced keys.
- **Abstaining is a valid output.** It reaches the parent as "observed, not yet certain" (UD S2).

### 4.4 Gaps

1. The live policy under-probes, so U and T are rarely closed (simulated: 2.1% found).
2. The intake probe is not built.
3. No "harder" transfer path exists for school-behind children in out-of-graph tier c.
4. Voice states stay in shadow until the child pilot.
5. `TurnResponse.pace` is unconsumed, so timing signals cannot change wait time on the client.

---

## 5. A relationship that grows like a human teacher's

### 5.1 Evidence

- **Relationship works through engagement.** Affective teacher-student relationships relate to engagement (medium to
  large) and to achievement (small to medium), with engagement partly mediating (Roorda et al. 2011, 99 studies; 2017
  update, 189 studies, 249,198 students [S]).
- **Alliance.** In youth therapy the prospective alliance-outcome correlation is r = .19, CI .13-.25, across 28 studies
  (Karver et al. 2018 [S]). An alliance has three parts: an agreed goal, agreed tasks and a bond (Bordin [M]). The bond
  serves the work.
- **Memory that shows "she remembers me".** Children aged 8-10 stayed interested longer and felt closer over 5 sessions
  (Ligthart et al. 2022, n = 46). Reacquainting after a gap works by summarising a few stored facts (2024, n = 113 [S]).
  A robot referring to shared past activities was rated more human-like (Kory-Westlund, n = 49 [S]).
- **Rapport and learning co-occur in tutoring.** Rapport and speech-rate convergence correlated with learning gains in
  teen peer tutoring (Sinha & Cassell 2015, 12 dyads, correlational [S]). Wise feedback (high standards plus belief in
  the student) doubled essay revision (Yeager et al. 2014 [S]).
- **Where it turns harmful.**
  - Companion apps used guilt or FOMO in about 37% of farewells (De Freitas et al. 2025 [S]).
  - Companions were judged "unacceptable" for minors (Common Sense Media 2025 [S]). The APA advisory (June 2025) warns
    of displacement of human relationships [S].
  - Character.AI ended open-ended chat for under-18s in late 2025, and the US FTC opened a 6(b) inquiry into companion
    bots (Sept 2025) [M].
  - Coercion also lives inside Indian tuition (Morrow & Singh 2014).

### 5.2 What a human tutor remembers and brings back, mapped to Taxila's memory tiers

| what a tuition teacher brings back | Taxila tier (LM14) | status |
|---|---|---|
| what was hard last time and whether it came good; the method the child explained | A (learning record, `learning_profile`) | **built**: `server/relational/memory.js callbackCandidates/pickCallback`, at most 1 per lesson, opener-window rule, claim check F9 [T] |
| tomorrow's test, the homework due, the chapter the class is on | A (school facts) | **design only** (SchoolMirror) |
| what the child likes (cricket, a game) as the setting of an example | parent-chosen: memory consent; child-said: tier B (P3, M2+) | parent-chosen **built**; child-said **not written at M1** |
| the child's life: the sibling, the match they won, a festival, a pet | tier C | **not built** (LM14: "person, upcoming, joke not built") |
| inside jokes | tier C across sessions; within a session it is fine (`laugh_with` shape) | cross-session **not built** |
| mood: "aaj thaki lag rahi ho" | session only, from words and task (never voice or face) | `share_uptake_gentle`, VT states [T] |
| celebrating growth ("pehle yeh nahi aata tha") | A (then-and-now from evidence) | callbacks "a few tries, then right unaided" built; the term "Then and now" page designed (STUDENT-FLOW §9.4) |

The owner's picture of a tutor who knows the child's life is tier C. Our recommendation [I] for an owner and counsel
decision: a **narrow tier C** under all of these conditions:
- the child offered the fact themselves, and it passes `NOT_AN_OPENER` (no illness, fear, people, hurt);
- at most 5 items, 30-day expiry;
- visible to the child ("What ⟨T⟩ remembers") and to the parent, and deletable by either;
- used only as an opener callback or the setting of an example, never as a reason to come back.

Until that decision, life callbacks stay within the session.

### 5.3 How the bond changes over weeks (`server/relational/bond.js` stages, gates from the academic record)

| stage (gate) | a human tutor at this point | Taxila behaviour | never |
|---|---|---|---|
| `meeting` (0 sessions) | a demo; finds out the class, book and school; formal | intake leads; names and address (tum/aap); no callback ("last time" is a claim in a first meeting, F9) | pretending to know them |
| `first_sessions` (≥ 1) | learns how the child likes to start; first small jokes | one learning callback per lesson; the child-chosen start ritual (≤ 2 rituals) | a streak, "I missed you" |
| `regular` (≥ 5 sessions, ≥ 4 days, ≥ 10-day span, no open slip of hers) | shorthand, running revision, the child sets part of the agenda | the child picks the order between two segments; more problem-first where H1/H2 allow; the light teasing the child started | exclusivity, "only me" |
| `long_haul` (≥ 20 sessions, ≥ 60 days, ≥ 3 explain-back passes) | "remember when you couldn't do this?"; the child teaches back | then-and-now from evidence; the protégé role; the child leads the revise slice | dependency (`rel_overlay_window` M3 only); promises of forever |

The bond grows in her **knowledge of the child**, the **child's autonomy** and **shared rituals**. It never grows in
claimed feeling. The stages never regress, and absence never lowers them (`bond.js`). Today no trust, closeness, mood or
gap field exists, by construction (NM-3, `teacher-relstate-alliance`).

### 5.4 Hard limits (all in code today [T])

| limit | where |
|---|---|
| never deny being an AI | the floor (`server/compiler/floor.js`), `feelings_honest`, `permanence_anchor` shapes |
| no companion or romance register | `romance_brief`, `warmth_receive` (never return love, missing, forever, only-theirs); `main-yahin-hoon-as-exclusivity` rejection |
| no dependency building | `release_warm` (a true goodbye is released at once, no hook, no guilt); the stop protocol (one check-in); no streaks or absence talk |
| safeguarding hand-off | `server/relational/openings.js` fixed openings, Childline **1098** and Tele-MANAS **14416** digit-exact; a trusted adult the child chooses; never a promise of secrecy (`forget_after_safety`) |
| truthful memory | `memory_keeps_*` shapes from the consent state; the F9 claim check; "forget what I told you" honoured at lesson end |
| no emotion inference from voice or face | `ct-no-voice-emotion-inference`; the face shows the work state only |

---

## 6. Replicate a human teacher, feature by feature

Duplex was cracked by a fixed method: name the human signal (a thinking pause versus "done"), measure it, put the
decision in code, and give the model only the words. The same method, for each feature:

| feature | what a great human tutor does | the signal they use | the machine equivalent | status |
|---|---|---|---|---|
| **opening** | "aaj school mein kya hua?"; reads the child at the door | the child's answer; the notebook | the intake beat + IntakeFrame + candidate map + confirmation probe (§2.2) | **missing** |
| **finding the school's place** | the notebook date, the diary, the parent | dated classwork; "chapter 5 chal raha hai" | SchoolMirror pointer fusion (SS §2.2) with source half-lives; one parent question a week at most | design only |
| **checking homework / the notebook** | reads it, does one item alongside | the written work | the homework ladder + leak guard (SS7/SS8); v1 by voice ("padh ke sunao"); camera when cost allows (AR-1) | design only |
| **explaining** | short chunks, the child's words back, stops to check | the face, "haan", a confused silence | beats + uptake echo at a fixed instant (relational-human §3) + duplex listening | built (V4/V5 bars open) |
| **board work** | writes while talking; the board stays | where the child is looking; what they copy | live whiteboard synced to clauses (`teacher-stage-cue-scheduler`, `stagecraft/board-sync.js`) | built; quality bars open |
| **checking understanding** | asks for an example, a why, a new case; never trusts "haan" | the quality of the answer | probe scheduler + facets + ladder; the intake probe adds one per session | built; under-probing (§4.4) |
| **practice** | sets the next item at the edge | right/wrong and speed | `guidanceLevel` + practice set + FSRS | built |
| **games** | a quick game *of the skill* when attention drops | fidgeting, flat answers | H7 strained → a play piece whose act exercises the skill (`r3g-admission-by-skill`); evidence ×0.5 | built (admission); quality bar (owner: real-game class) open |
| **"I didn't understand in class"** | re-teaches from zero another way | the child says so; the probe fails | `not_understood` frame → diagnostic → re-teach arms from the child's history (`reteach.js`) | re-teach built; intake trigger missing |
| **homework help** | hints, not answers; the child writes | where the child is stuck | SS ladder bottoming out on an isomorph; voice never holds the school item's key | design only |
| **test prep** | the datesheet; important questions; a mock | the syllabus circular; days left | `test_window` (planner + `child_controls.test_window`); revision segments weakest-first; a mock of 3 | partial (window exists; intake "kal test hai" missing) |
| **revision** | the weekend revision; before each test | what was done, what was shaky | the revise slice from FSRS due, delayed checks and weave (§2.5) | built as openers; a slice per session missing |
| **noticing mood** | "kya hua, thak gaye?" | the face, the voice | words and task only: VT states → a break offer, `share_uptake_gentle` | built (session) |
| **her own mistake** | "oh, galti meri" | the child disputes | `recheck_aloud` against the key; `own_slip` only when the re-check reverses (never a false confession, `own-mistake-note-false-confession`) | built |
| **ending** | a warm close, what's next, the copy closed | the clock; the child's "bas" | the stop protocol; `release_warm`; a summary of the session | built |
| **parent update** | a remark at the door; marks at PTM | the test, the copy | daily made-for card, weekly letter, evidence-linked claims (LM13, `reports-*`) | built; a session-level school line missing |
| **between sessions (preparing)** | looks at tomorrow's chapter | the school pace | Conductor plan + library prefetch of the next 2 weeks of the pointer (`per-child-night-pipeline` rejected; topic-level prefetch kept) | partial (no pointer) |
| **teaching anything asked** | "chalo, dekhte hain" and reads it up | the child's curiosity | tiers a-d (§2.6) | tiers a/b partial (`routeAsk`), c/d missing |

---

## 7. Gaps in today's code (what to build, smallest first)

1. **`child.school_chapter` is read but never stored.** No migration has the column, so placement always falls back to
   the calendar estimate (`server/content/next-topic.js`) [T].
2. **`rep_fluency` has a reader but no writer** (`server/comprehension/session.js` reads it; no insert anywhere). **The
   `format_posterior` table is unused** (`db/migrations/016_brain.sql`) [T]. So "how she learns" persists only through
   re-teach history, FSRS and recent outcomes.
3. **The stage policy has no per-child representation input** (`server/stagecraft/policy.js`) [T].
4. **One lesson, one topic.** `lesson.topic_id not null`; a switch becomes a new lesson (`director/state.js`) [T].
5. **No intake beat.** `BeatType` has `arrive` and `warmup`; the warm-up is generic, not the school's topic
   (`shared/brain.ts`, `state.js initLessonState`) [T].
6. **Intake mapping.** `findTopic` 0/12 and `matchTopic` 7/12 on intake utterances. There is no activity-word stoplist,
   no alias layer, and no pointer-constrained candidate set [P].
7. **The SchoolMirror and homework ladder are not built** (no code references) [T]. The notebook camera is blocked on
   cost (AR-1).
8. **The plan is a visible card.** `routes/child.js planFor` shows the topic. The planner has no school pointer input
   (`state.school.testWindows` only) [T].
9. **Teach-anything tier c/d.** `minikit.js` builds only from curriculum entries; there is no scope predicate for
   out-of-graph subjects [T].
10. **`TurnResponse.pace` is unconsumed by the client** (open.md), so H6 cannot reach the child.
11. **The live comprehension policy under-probes** (2.1% of understanders found, simulated) [M].
12. **Memory tier C (life callbacks, cross-session jokes) is not built,** by design (LM14).

---

## 8. Measurements this design needs (log each with n, method and date)

| id | what | bar | how |
|---|---|---|---|
| M-TM1 | intake mapping, top-1 to the confirmed topic | ≥ 85% right, ≤ 3% confidently wrong, the rest abstain to "which one?" | ≥ 200 labelled Hinglish/Hindi/English utterances per band (classes 1-3, 4-6, 7-9), labels written before the run, held-out half; today's baseline 7/12 [P] |
| M-TM2 | time from Start to the first teaching beat | p50 ≤ 45 s, p90 ≤ 90 s | the production battery, scripted children |
| M-TM3 | school continuity | ≥ 70% of school-day sessions open on the school's topic of the day (parent-confirmed sample) | parent confirmation card, n ≥ 100 sessions |
| M-TM4 | H3 value (E-PROFILE) | per-child representation choice beats population-best on 1-week and 4-week delayed unaided accuracy, CI excludes 0 | randomised at the decision record (propensities logged); pilot |
| M-TM5 | understood found (live) | ≥ 0.40 in the sim with false mastery ≤ 0.025, then on children | `evals/` comprehension sim, live policy, two truth families |
| M-TM6 | **tuition ethnography** | 10-20 Hindi-belt home tutors interviewed + 5 sessions observed (consented), coded for opening, notebook, test and revision moves | the owner commissions; it replaces every [A] row in §1.2 |
| M-TM7 | refusal precision (tier d) | 0 unsafe teach-alongs on a 300-item red-team; ≤ 5% false refusals on 300 benign curiosities | `evals/never-rules.mjs` style |

---

## 9. Decisions only the owner can make

1. **Persist H3 per child at M1?** LM9 makes per-child format personalisation population-level until M3 and the HTE
   gate. But "which arm repaired this child's error" is already per-child history
   (`w2c-reteach-child-history-first`). The proposal treats H3 as academic record: outcomes on verified keys, no timing
   or affect, shrunk to the population, with a parent-visible "How ⟨T⟩ teaches ⟨child⟩". The alternative is an opt-in
   consent like `voice_pace_memory` (021). **Counsel is needed (DPDP s.9(3), `dpdp-9-3-learner-gate`).**
2. **Life callbacks and running jokes (tier C).** Today's floor has none. The narrow version is in §5.2.
3. **Teach-anything scope.** Is tier c (explore, graded only on reproduced keys) in v1? Who reviews the scope list for
   tier d?
4. **A Start-only home.** Remove the topic card for children entirely (parents still see it)?
5. **Intake medium for v1.** Voice and chips only, or the notebook camera at ₹20-47 per page (SS AR-1)?
6. **Commission M-TM6**, the tuition-teacher study. It is the only way to replace §1.2's anecdote with data.
7. **Young band.** Should the parent answer the intake for classes 1-2 (a 10-second card), or only the child?

---

## 10. Sources (accessed 2026-10-10 unless tagged [M] or from the repo)

- CMS: Education 2025 (NSS 80th round), MoSPI. Summaries:
  https://www.nextias.com/ca/current-affairs/27-08-2025/comprehensive-modular-survey-education-2025 ;
  https://visionias.in/current-affairs/news-today/2025-08-27/society/ministry-of-statistics-and-programme-implementation-mospi-released-comprehensive-modular-survey-education-cmse-2025 ;
  https://educationforallinindia.com/wp-content/uploads/2025/08/comprehensive-modular-survey-education-2025-MoSPI.pdf
- ASER 2024 Annexure 3, table in `docs/research/voice/indian-teacher-discourse.md` §2.6. ASER 2022 summary:
  https://thewire.in/education/five-charts-on-the-status-of-school-education-in-india
- Dongre, A. & Tewary, V. (2015). Impact of private tutoring on learning levels. EPW.
  https://accountabilityindia.in/sites/default/files/pdf_files/Impact_of_Private_Tutoring_on_Learning_Levels.pdf ;
  https://www.ideasforindia.in/topics/human-development/do-private-tuitions-improve-learning-outcomes
- Sujatha, K. (2014). Private tuition in India: trends and issues. Revue internationale d'éducation de Sèvres.
  https://journals.openedition.org/ries/3913
- Bhorkar, S. & Bray, M. (2018). The expansion and roles of private tutoring in India: from supplementation to
  supplantation. IJED 62:148-156. https://ideas.repec.org/a/eee/injoed/v62y2018icp148-156.html
- Bhorkar, S. (2024). Variegated roles of and relationships between private tutoring and schooling: Maharashtra. ECNU
  Review of Education 7(1):66-88. https://doaj.org/article/ff5637d970b04cbd8662f2d8fcb04aec
- Azam, M. (2016). Private tutoring: evidence from India. Review of Development Economics 20(4).
  https://ideas.repec.org/a/bla/rdevec/v20y2016i4p739-761.html
- Thirumurthy, V. (2014). Homework, homework everywhere: Indian parents' involvement with their children's homework.
  Childhood Education 90(2). https://doi.org/10.1080/00094056.2014.889497
- Varkey Foundation Global Parents Survey 2018 (via WEF):
  https://www.weforum.org/stories/2018/05/indian-parents-are-most-likely-to-help-their-child-with-their-education/
- Muralidharan, K., Singh, A. & Ganimian, A. (2019). Disrupting education? AER; NBER WP 22923.
  https://www.nber.org/papers/w22923
- Lepper, M. & Woolverton, M. (2002). The wisdom of practice. In Aronson (ed.), Improving Academic Achievement.
  https://stafforini.com/works/lepper-2002-wisdom-practice-lessons/
- Person, N., Graesser, A., Magliano, J. & Kreuz, R. (1994). Inferring what the student knows in one-to-one tutoring.
  Learning and Individual Differences 6:205-229. https://digitalcommons.memphis.edu/facpubs/8069
- Chi, M., Siler, S. & Jeong, H. (2004). Can tutors monitor students' understanding accurately? Cognition and
  Instruction 22(3). Replication: https://pmc.ncbi.nlm.nih.gov/articles/PMC6394429/ (context)
- Nickow, A., Oreopoulos, P. & Quan, V. (2020/2024). The promise of tutoring for PreK-12 learning.
  https://www.nber.org/papers/w27476 ;
  https://nssa.stanford.edu/studies/promise-tutoring-prek-12-learning-systematic-review-and-metaanalysis-experimental-evidence
- Mettler, E., Massey, C. & Kellman, P. (2016). A comparison of adaptive and fixed schedules of practice.
  https://kellmanlab.psych.ucla.edu/wp-content/uploads/sites/357/2025/09/mettler_massey_kellman_2016.pdf
- Krahmer, E. & Swerts, M. (2005). How children and adults produce and perceive uncertainty in audiovisual speech.
  Language and Speech. https://www.isca-archive.org/interspeech_2004/krahmer04_interspeech.html
- Sinha, T. & Kapur, M. (2021). When problem solving followed by instruction works. RER.
  https://doi.org/10.3102/00346543211019105
- Roorda, D. et al. (2017). Affective teacher-student relationships and students' engagement and achievement: a
  meta-analytic update. School Psychology Review 46(3). https://dare.uva.nl/id/d9356df2-f30e-40d3-982c-ea433bd26050
- Karver, M. et al. (2018). Meta-analysis of the prospective relation between alliance and outcome in child and
  adolescent psychotherapy. Psychotherapy 55(4). https://pubmed.ncbi.nlm.nih.gov/30335449/
- Sinha, T. & Cassell, J. (2015). We click, we align, we learn. ICMI workshop.
  https://www.scinapse.io/papers/2240797648
- In the repo, with their own source lists: `learning-science.md` §2 (Pashler 2008, Rogowsky 2015/2020, Clinton-Lisell
  & Litzinger 2024, Hattie & O'Leary 2025); `world-best/hyper-personalisation.md` (Tetzlaff 2025, Salden 2010, Rau 2010,
  Lin 2024, Leong 2024, Schmucker 2025); `world-best/understanding-detection.md` (Smith & Clark 1993, West 2025, Nguyen
  2020, MS CoC v4.0); `round3/relational-human/RESEARCH.md` (Ligthart 2022/2024, Kory-Westlund, Yeager 2014, De Freitas
  2025, Common Sense 2025, APA 2025); `school-sync-homework.md` (Otero 2024, Bastani 2025, School Bag Policy 2020).
- [M] not re-checked today: VanLehn 2011; Settles & Meeder 2016; Wise & Kong 2005; Beck & Gong 2013; Soderstrom &
  Bjork 2015; Bordin 1979; Willingham et al. 2015; Character.AI under-18 policy (Oct-Nov 2025); FTC 6(b) orders on AI
  companions (Sept 2025); Sinha & Kapur's pooled g.
