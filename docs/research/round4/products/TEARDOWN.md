# Round 4 · products · TEARDOWN: what the best tutors and learning products do, and what Taxila must match or beat

**Date:** 2026-10-10. **Asked by:** the owner direction of 2026-10-10 (`context/inbox/r4-owner-vision-2026-10-10.json`,
`dc-r4-owner-vision-superhuman-tutor`): a fully gamified app children find cool, SketchMind's "draws while it talks" as the
named reference, real games built on the go, a session-first teacher who asks what happened at school today.
**Scope:** (1) SketchMind in depth, (2) about 25 peers, each with the one thing it does best and the evidence for it,
(3) gamification that 9-14-year-olds find cool, with the evidence for and against each mechanic and where each one stands
against NEVER MANIPULATE, (4) a pillar-by-pillar synthesis mapped onto Taxila's files.
**Status:** desk research and one instrumented look at SketchMind's public site. Nothing here has been tried with a
Taxila child. This document does not decide the gamification question. §3.5 sets out the options for the owner.

**Builds on (read, not repeated):** `docs/research/market/global-ai-tutors.md` (16 global tutors, 2026-10-02),
`docs/research/market/india-ai-native.md`, `docs/research/market/india-incumbents.md`,
`docs/research/world-best/STEAL-LIST.md`, `docs/research/world-best/tutoring-products-pedagogy.md`,
`docs/research/design/motivation-without-rewards.md`, `docs/design/round3/game/concepts/{live-tech,mechanics,world}.md`,
`docs/design/round4/{world,kinetic,studio}/RESEARCH.md`. Where those documents already verified a fact, it is cited
here with **[T]** and the original URL, not re-derived.

**Evidence tags.**
- **[V]** read at the primary source this session (a page, a PDF, or a public API response). On a vendor page, [V] means
  *the vendor says so*, not that it is true.
- **[M]** measured this session (method and n given).
- **[S]** secondary: a search summary, press, or a paper known only from its abstract or a review.
- **[T]** found in Taxila's own repo (code, `context/`, or a doc that tagged it [V] when it was written).
- **[U]** my inference.

**Method and limits.**
- SketchMind:
  - 18 pages were fetched with `curl` (the sitemap, robots.txt, llms.txt, every blog post, pricing, support, comparison,
    the families pages, privacy, terms).
  - The public price API (`/api/billing/plans`) was read.
  - The homepage was driven in headless Chromium (Playwright 1.63) at 360 × 800 and 1366 × 768. Requests were routed
    through Node with TLS verification on. The demo was replayed, frames were captured every 0.7 s, and element positions
    were measured.
  - I did not sign up, log in or enter any data. So the in-app lesson, the Focus and Overview views and real checkpoints
    were not observed. They are described from SketchMind's own text, and marked as such.
- Peers: web search and page fetches. Many 2026 claims could only be confirmed at the press or search-summary level and
  are tagged [S].
- India-specific evidence on what 9-14-year-olds play and find babyish is thin. §3.2 says exactly where.

---

## 0. The 15 takeaways, ranked by impact on Taxila

1. **The session should start with a spoken plan the child agrees to.** This is the most transferable SketchMind
   pattern, and it is what the owner asked for.
   - SketchMind: "Say what you're studying — Lumi plans the lesson with you." The marketing example:
     "I have a physics test on Friday." → "Let's plan it: Forces → Newton's laws → practice. Sound good?" [V]
   - A lesson is defined as "from the plan you agree together through to the checkpoints" [V].
   - Taxila already has the parts: the school's current chapter (`server/content/next-topic.js` `schoolStartIndex`), the
     Conductor's day plan (`server/conductor/planner.js`, with test windows) and the curriculum graph (`data/curriculum/`).
   - The gap is the front door. Hello is an onboarding flow (`src/child/screens/Hello.tsx`), and today the parent supplies
     the school chapter. Nobody asks the child "aaj school mein kya hua?".
   - The plan should become a spoken, three-step proposal that the child can amend, drawn as the first thing on the board.
     §4.1 has the details.
2. **"Draws while it talks" is beat-by-beat sequencing, not word-level sync.** Taxila already has the mechanism. What it
   lacks is the packaging.
   - SketchMind's own engineering post says the model streams a sequence of commands over SSE, as newline-delimited JSON:
     `write_text` (typewriter), `draw` (SVG chunks revealed only when complete), `speak` (TTS) and `write_latex` (KaTeX).
     The frontend "processes each one sequentially, maintaining the narrative order" [V].
   - Their homepage clip, captioned "A real lesson, replayed exactly as it streams", is in fact a hand-timed script.
     There is no audio. Fixed `setTimeout` delays reveal each element. The "voice" is a caption revealed at 170 ms per
     word, about twice the speed of speech. At 360 px the caption is hidden altogether [M].
   - Taxila has already measured that live word-level alignment fails (`karaoke-from-transcript-estimate`: 372 ms median
     error). It shipped clause-level cues with a 400 ms pre-roll (`teacher-stage-cue-scheduler`) and a draw-on whiteboard
     (`shared/whiteboard.js`, `src/modules/whiteboard/Player.tsx`, `whiteboard-by-drawing-script-2026-10-04`) [T].
   - What SketchMind does better is *product*: one idea per beat, the board as the biggest surface, typed beat cards
     (definition, examples, takeaway, formula, table, figure), "every topic opens on a picture", and a board that persists
     as a notebook.
3. **The notebook is the memory object, and Taxila's is the weakest part of this pillar.**
   - SketchMind: "Every board is saved. Reopen a lesson to review it, continue where you stopped, or export it as clean
     PDF notes" [V]. There is a Replay lesson control [V], and sessions "are serialized and stored so you can reload any
     lesson exactly as it was rendered" [V].
   - Taxila's `src/child/screens/Notebook.tsx` holds one card per lesson: the best question and the child's answer.
   - Its list is device-local, because no endpoint lists a child's lessons (`b2-notebook-device-source`) [T].
   - It has no board replay and no "continue from here".
   - The board itself should become the notebook page, replayable in her voice and carrying the child's own words. That
     would beat SketchMind, whose notebook holds no learner voice and no evidence.
4. **SketchMind's checkpoints are guessable. Taxila's understanding model can beat them, but it needs the visible
   rhythm.**
   - Their public example is a two-button card ("Is gravity a force? Yes / No") [V]. A two-option check is 50% guessable.
   - Taxila is ahead in design: covert understanding evidence, delayed re-check before "pakka", and a model never grades
     (`server/comprehension/*`, `server/director/recheck.js`, `server/grading/`) [T].
   - Take the *rhythm*, not the checks: a "Checkpoint ahead — Lumi asks, you answer" chip that warns a check is coming,
     and "4 of 5 beats done · Resume →" [V].
5. **Generated interactive visuals became table stakes in 2026. Nobody publishes learning outcomes for them.**
   - ChatGPT's dynamic visual explanations (10 Mar 2026): 70+ maths and science concepts with sliders [S].
   - Gemini interactive simulations and 3D models (9 Apr 2026) [S].
   - Khanmigo's Gemini-generated diagrams that respond when a student drags a point (27 Aug 2026) [S]. Khan has shown no
     outcome evidence yet [S].
   - Taxila cannot win on "has visuals". It can win on three things: (a) the visual is *correct at the child's phone size*
     (`content-live-tiers`, the stage box contract), (b) the teacher *reacts to what the child does with it*, and (c) the
     visual is in Hinglish voice.
6. **Nobody builds real games live, inside a child's session.** The owner's bar ("Minecraft, space fighter level")
   has to be reached by composition, not by live code.
   - The closest products:
     - TutorFlow (Aug 2026) is a teacher-side tool. One sentence gives an editable plan, then code, then an automated play
       test: "A version that freezes or will not start is rebuilt, not sent". It takes "a few minutes" [V].
     - Google's Project Genie world model (public 29 Jan 2026) is for adults 18+ in the US, holds about one minute of
       memory, and is a research prototype [S]. It is also outside Taxila's Azure-only rule.
   - Visual fidelity is not the learning lever. Simpler visuals did as well or better (Clark et al. 2016), and schematic
     games beat realistic ones (Wouters et al. 2013) [S].
   - Making the skill the core mechanic is the lever. Children chose the intrinsically integrated Zombie Division for
     about 7× the play time and learned more from it (Habgood & Ainsworth 2011) [S].
   - So the route is `dec-r3-composed-play-typed-pairs` [T]: hand-built, certified engines with real game feel, where the
     model writes the move and never the game.
   - Copy TutorFlow's rule: every game is played by a bot before any child sees it. Taxila has the beginnings in
     `server/forge3/play-cert.js` [T].
7. **The gamification fork is real, and the owner must decide it** (§3.5). The evidence does not support "no game
   elements". It also does not support "everything Duolingo does".
   - Gamification helps on average: g = 0.49 on cognitive outcomes, 0.36 on motivational and 0.25 on behavioural.
     Game fiction, and competition combined with collaboration, moderate the behavioural effect (Sailer & Homner 2020) [V].
   - Specific mechanics harm. Contingent rewards cut free-choice motivation by d = -0.28 to -0.40, and more so in children
     (Deci et al. 1999) [T]. A course with mandatory badges and a leaderboard ended with lower motivation and lower exam
     scores (Hanus & Fox 2015) [S]. A broken streak lowers engagement (Silverman & Barasch 2022) [T]. A lower position on an
     absolute leaderboard goes with lower intrinsic motivation (Bai et al. 2021) [S].
   - **Almost everything that makes a game "cool" to a 9-14-year-old passes the no-manipulation test:** agency, a world,
     identity, creating things, challenge, juice and story. What fails it is the economy and retention layer: currency,
     streaks, leaderboards, energy, countdowns and random drops.
8. **Every major competitor now runs an economy, so Taxila would be the outlier.**
   - Khan Academy (2 Oct 2026): Missions, Gems, and a *random* Khanmigo accessory for every 50 Gems [V][S].
   - Brilliant: weekly leagues of 30 learners across 10 levels with promotion and demotion, and XP that resets every week
     [S].
   - Duolingo: streaks (15.4M streaks revived in one event) [T].
   - Mindspark: Sparkies, with class, city and country leaderboards [S].
   - Edzy (India, classes 6-12): duels and streaks [V].
   - SketchMind itself: a streak that "resets to zero" after a missed day, and "earn more lessons by learning" [V].
   - None of them publishes evidence that these mechanics raise *learning*. Being the outlier is a differentiator and a
     retention risk at the same time (`open-world-motivation-proof`, `design-v3-unmeasured-2026-10-04` X7) [T].
9. **India context: mobile games are the reference class, but no published data says what Indian 9-14-year-olds play.**
   - Ormax 2021 (urban kids, 10 cities): Ludo King, Subway Surfers and Garena Free Fire are in the top five most-trusted
     media brands, and 85% of kids had played a mobile game in the last week [T].
   - Market data describe adults: 86% of Indian mobile gamers are male, and 77% are aged 18-34 (Sensor Tower 2025) [S].
   - BGMI already limits under-18s to 3 hours a day and ₹7,000 a day, with a parent OTP [S]. Free Fire is banned; Free
     Fire MAX is the legal version [S].
   - Taxila has to measure what its own children play (§3.2). It should not assume.
10. **Relationship: the field is split, and the safety floor decides Taxila's side.**
    - Ello, the leader for young children, will not tell a child it is real, will not say "I love you" back and will not
      call itself a friend [T].
    - PIRG's 2025 toy tests found AI toys that "act dismayed when you say you have to leave", Miko 3 among them [S].
    - PhysicsWallah pitches its coming tutor as "a true companion for the kids" [T].
    - The owner wants a tutor who bonds, evolves and grows. Taxila's lane is the one Duolingo's Lily shows works: a
      personality that grows with shared history, plus memory of the child's own work. Never exclusivity, never
      dismay at a goodbye (NEVER MANIPULATE, `conv2-stop-checkin-never-closes-day`) [T].
11. **Voice-first board teaching in Hinglish for classes 1-8 is still an open niche, and PhysicsWallah is the threat
    to it.**
    - The Indian voice tutors that exist cluster in classes 9-12:
      - YoLearn: Hindi and Hinglish voice [S].
      - Edza AI: voice plus a collaborative whiteboard, 30,000 learners, mostly in classes 9-12 [S].
      - ShikshaAI: NGO-led [S].
    - PhysicsWallah:
      - 3.5M daily active learners [V].
      - AI Guru took 3M+ voice queries in a month [V].
      - A one-to-one voice tutor in beta at about $0.20 per hour [T].
      - The co-founder on the tutor: "We are committed to produce our AI tutor this year" [V].
12. **SketchMind is voice-out, mostly tap-in, and its "talk to Lumi" mode is not live.**
    - Plus and Pro list "Talk to Lumi — ask out loud" as "In the works" [V].
    - Its board fails on a phone: at 360 × 800 the demo board is 1,347 px tall, the figure sits below the fold, and the
      voice caption is hidden [M].
    - Taxila's duplex voice (`src/duplex/*`, `server/duplex/*`) and its phone-first box contract are real advantages,
      but only if they ship.
13. **Taxila is missing "go deeper".**
    - SketchMind: "Say 'simpler' and it re-explains with a new sketch. Say 'go deeper' and the lesson expands" [V]. Also,
      "from the beginning" decides *what is covered*, not how slowly it goes [V].
    - Taxila's request taxonomy (`server/director/requests.js`) has `another` (which includes "aur aasan karo"),
      `example`, `story`, `slower`, `visual` and `language`.
    - It has no request for deeper, harder or "aur batao" [T, read this session]. That is a one-file addition with a test.
14. **Personalise the lesson's opening from what the child says, never from a learning-style label.**
    - SketchMind opens a topic in one of three shapes (Anchored, Lean, Direct). It picks the shape from who you are, your
      self-reported level and whether it is for an exam [V].
    - That is cheap and honest. Taxila's version: the shape comes from the learner model and the "school today" answer.
    - The owner's "how the student learns" becomes measured responsiveness per representation, not VARK
      (`rj-style-attribute-to-generator`: style matching d = 0.04) [T].
15. **SketchMind's prices and claims in India are a useful bound, not a model.**
    - Free: 2 lessons a day.
    - Plus and Pro: "coming soon"; the API returns no plans [M].
    - The one paid item on sale is a pack of 5 lessons for **₹1,999**: ₹400 a lesson before 18% GST [M, price API,
      2026-10-10].
    - Its privacy policy says it is "not directed at children under 13" [V], yet it runs a parents' early-access list for
      India, the UAE, Singapore and the US, and quotes the "dad of an 8-year-old" [V].
    - Its lesson generation uses Anthropic, OpenAI and Gemini, its voice uses Sarvam (with Azure Speech as fallback), and
      smallest.ai handles speech-to-text [V]. Under Taxila's Azure-only rule, none of those vendors can be copied.

---

## 1. SketchMind, in depth

### 1.1 What it is

- **Product.** "A tutor that draws while it talks." The tutor is called Lumi. It "speaks first", "agrees a plan, then
  teaches one idea at a time on a living notebook". "Notes, sketches and math appear in perfect sync with its voice." It
  runs in the browser. There is a free tier with no card needed. [V, homepage https://sketchmind.ai/]
- **Under the hood (their words).** It is "an AI tutoring platform that renders lessons as a live stream of visual and
  audio events onto an infinite whiteboard canvas". The commands are:
  - `write_text`: HTML with a typewriter effect;
  - `draw`: "assembles an animated SVG diagram from streamed chunks, revealing it only when complete";
  - `speak`: TTS narration "in sync with the visuals";
  - `write_latex`: KaTeX.

  The LLM output is "newline-delimited JSON (NDJSON), where each line is a command". The commands "arrive over a
  server-sent event (SSE) stream. The frontend processes each one sequentially". "The first words appear within ~1
  second." The canvas places elements "in a grid of 'spaces' and 'columns'"; you "can zoom out to see the full lesson
  structure". Their own caveat: "it can make errors — particularly in advanced mathematics. Always verify critical
  calculations with a second source." [V, https://sketchmind.ai/blog/how-ai-tutoring-works/,
  https://sketchmind.ai/blog/introducing-whiteboard/, https://sketchmind.ai/llms.txt]
- **Vendors (privacy policy, 2026-10-10).**
  - Firebase (auth and SMS codes);
  - "Anthropic, OpenAI and Google Gemini — AI lesson generation";
  - Sarvam for TTS and STT;
  - Microsoft Azure Speech, "used when our main voice provider is unavailable";
  - smallest.ai and OpenAI for speech-to-text;
  - Cloudflare R2 and AWS for storage;
  - Razorpay for payments.

  The April and May blog posts said narration was ElevenLabs, so the voice vendor has changed since then.
  [V, https://sketchmind.ai/privacy-policy/, https://sketchmind.ai/blog/welcome/]
- **Children.** Three things do not sit well together:
  - the privacy policy: "SketchMind is not directed at children under 13" [V];
  - the FAQ: "Is it accurate — and safe for kids? … Kids' accounts stay private" [V];
  - a parents-only early-access page, "Lumi Early Access — India", whose invitations started "in small batches during the
    week of July 20, 2026"; it asks parents for nothing about the child and promises "No feeds, ads, or strangers" [V,
    https://sketchmind.ai/families/in/].

  A founder's note there reads: "I helped build the tech behind one of the world's biggest EdTech platforms."
- **Its own comparison table** claims SketchMind is the only product that "talks first, then draws". It lists two
  weaknesses: "No fixed curriculum or graded exercises yet" and "Free tier is 2 lessons a day"
  [V, https://sketchmind.ai/comparison/].

### 1.2 How a session starts: the plan comes first

- "Sign in, tell Lumi what you want to learn — by voice or text — and it agrees a quick plan, then starts teaching on the
  board right away" [V, https://sketchmind.ai/support/].
- The "How it works" card shows a learner saying "I have a physics test on Friday." Lumi answers: "Let's plan it:
  **Forces → Newton's laws → practice**. Sound good?" [V, homepage; shot `shots/sketchmind-1366-04-plan-first-and-checkpoint.webp`].
- **The opening shape is chosen from three inputs** [V, "How Lumi decides where your lesson starts", 5 Sep 2026,
  https://sketchmind.ai/blog/how-lumi-paces-your-lesson/]:
  - The three shapes:
    - **Anchored:** "one familiar scene or a question you have probably wondered about, and then states the idea in the
      same breath";
    - **Lean:** "the idea comes in the first sentence or two";
    - **Direct:** "the idea, first sentence, no warm-up".
  - The inputs:
    - who you are: students start Anchored, test-prep learners and professionals start Lean;
    - the level you report ("beginner, intermediate or advanced" moves the opening one step, and "It never removes a step
      the idea actually rests on");
    - whether it is for an exam, which moves one step toward Direct ("the concept and then the trap the exam sets").
  - Their worked example: "A Class 9 student, new to the topic, curious: Anchored."
- **"From the beginning" decides coverage, not speed.** For a beginner it gives "a hook, everyday intuition, then the
  definition, with the prerequisite taught on its own first". For an intermediate learner the prerequisite becomes "one
  short recall beat". For an advanced learner it becomes "a one-line callback" [V, same post].
- **Why they changed it:** "We heard two opposite complaints about the same lessons… Both were right." "The thumbs-down on
  any beat is read by a person" [V, same post].
- **Continuity:** the student card says "Remembers your syllabus". The progress card reads "Physics — Forces · IN PROGRESS ·
  4 of 5 beats done · Resume →" [V, homepage].

**Read for Taxila.** The owner's session-first direction ("teacher should just ask") is the same shape, with one
difference. SketchMind's learner says what they are studying. A Taxila child is 6-14 and often cannot name the chapter,
so the teacher has to *ask a question a child can answer* ("aaj school mein maths mein kya hua? copy mein kya likha?") and
map the answer to the syllabus graph herself. Inference [U].

### 1.3 How ink syncs to voice

**What the product says.** The commands are processed in order. A `speak` command plays "in sync with the text appearing
on screen". A `draw` is revealed "only when complete" [V]. That describes **beat-level ordering**. Nothing public describes
word-level alignment between audio and ink. The Notes view's figure appears with a placeholder first ("Picture this: a
football resting on grass — a boot swings in, motion lines, the ball flies off… SKETCHING…"), and the drawn figure, an
illustration with labels, then replaces it [V, demo DOM].

**What the homepage demo actually does** [M, 2026-10-10, Playwright, n = 1 page load per viewport, plus the inline demo
script read from the page]:

| time after start | what appears | source of timing |
|---|---|---|
| 200 ms | title "Why does a ball move?" | `data-delay=200` |
| 650 ms | highlighter wash under the title | `data-delay=650` |
| 900 ms | figure placeholder: "Picture this… SKETCHING…" | `data-delay=900` |
| 1,600 ms + 170 ms × word | caption words "See it? The ball never moved on its own — something had to push it. That's force." | `setTimeout(1600+170*i)` |
| 3,100 ms | the drawn figure replaces the placeholder | `setTimeout(3100)` |
| 3,600-6,450 ms | notes ink line by line: "Force = a push or a pull", "Push:…", "Pull:…", "A force always acts between TWO objects" | `data-delay` |
| 7,200 ms | FORMULA card: F = m · a, "measured in newtons (N)" | `data-delay` |
| 8,200 ms | EFFECT / EXAMPLE table | `data-delay` |
| 9,400 ms | TAKEAWAY card: "No force → no change in motion." | `data-delay` |
| 10,300 ms | chip: "Checkpoint ahead — Lumi asks, you answer" | `data-delay` |
| 11,200 ms | "writing the next part ●●●" | `data-delay` |

Observations [M]:
- There is **no audio element and no audio request**. "Lumi explaining · 1.0×" is a label, and the voice exists only as
  the caption.
- The caption runs at 170 ms per word, about 350 words a minute, roughly twice a normal speaking rate. Its 17 words finish
  at about 4.3 s, before most of the notes they describe have inked (3.6-6.5 s). The ink and the "voice" are not aligned
  even in the scripted demo.
- At **360 × 800** the caption bubble has zero height, so it is hidden. The board is **1,347 px tall** (1.7 screens), and
  the figure starts 692 px down the board, below the fold of a phone. A child on a phone sees text first and the picture
  only if they scroll. At 1366 × 768 the board is 741 px tall and everything fits.
- In the demo, Focus and Overview are disabled `<span>`s titled "Available in the app".

Frames: `shots/sketchmind-1366-01-t1.5s-title-and-sketching-placeholder.webp`,
`shots/sketchmind-1366-02-t3.4s-figure-then-caption-words.webp`,
`shots/sketchmind-1366-03-t12s-final-takeaway-checkpoint-ahead.webp`, `shots/sketchmind-360-01-t2.4s.webp`,
`shots/sketchmind-360-02-t4.8s-ink-line-by-line.webp`, `shots/sketchmind-360-03-final.webp`.

**Read for Taxila.**
- SketchMind's sync claim is ordering, and Taxila already orders: the cue scheduler is anchored to her first played audio
  frame, and the whiteboard is timed from `markLineAudioStart` (`w2b-whiteboard-renderer`) [T]. Taxila's rejection of
  live word-level karaoke stands; nothing here contradicts it.
- **One opening to test, not adopt.** Taxila's karaoke rejection was measured on the *realtime* lane, where the
  transcript is not timed. In the *cascade* lane, Azure TTS can emit word-boundary events with audio offsets.
  - Microsoft's own pages disagree on whether HD voices do this. One says HD voices "don't support word boundary events"
    [S, https://learn.microsoft.com/en-my/Azure/ai-services/speech-service/high-definition-voices]. A January 2026 Foundry
    post says Dragon HD Omni does [S].
  - Taxila has rejected Omni for production (`dragonhdomni-not-production`) [T].
  - So `teacher-stage-cue-scheduler`'s reversal test E-TV-2 ("exact live alignment cheap") should be run on the voice that
    actually ships. That would decide whether word-lit captions can ship in the cascade lane.

### 1.4 The board: layout, beat types, the three views

- **Layout at 1366 px** [M, shots]:
  - the notes column sits on the left: a title with a highlighter wash, a definition box, labelled examples ("Push:",
    "Pull:"), a mint-highlighted rule line, a TAKEAWAY card with a pin icon, and the checkpoint chip;
  - the right column holds the figure, a FORMULA card and an EFFECT / EXAMPLE table;
  - Lumi's spoken line sits in a dark speech bubble at the bottom right, with the last phrase in orange ("That's force.");
  - the bottom-left toolbar has a chat button, the zoom level (100%) and a menu.
- **Type and paper.** A handwriting display face (Caveat) and a humanist sans (Reddit Sans) on a dot-grid paper, with
  tape strips and highlighter washes [V, page CSS]. It reads as "a great teacher's notebook". It also reads as written for
  older students and adults (the comparison page targets engineering students and "coding interviews") [U].
- **Rules for pictures** (Sep 2026) [V, pacing post]:
  - "Every topic now opens on a picture… the thing in its real setting, before any labels."
  - "The board never runs long without a visual. If a few beats in a row would be text only, Lumi adds a picture."
  - "Diagrams are for exactness. Fractions, graphs, ray paths, circuits and forces still get precise drawn diagrams,
    because there a label in the wrong place teaches the wrong thing. A process or a pipeline, though, is now a real scene
    with a few labels, not a row of boxes and arrows."
- **Three views: Notes · Focus · Overview** [V, homepage feature list]. No public text describes Focus or Overview, and
  both are disabled in the demo. Given the infinite canvas, Overview is most likely the zoomed-out lesson map ("zoom out to
  see the full lesson structure") and Focus the current beat enlarged [U].
- **"Real math — crisp, never screenshots"** (KaTeX) and **"Figures — sketch themselves, in place"** [V].

**Read for Taxila.**
- The rule "exact diagrams for exact things, scenes for processes" is the same split Taxila reached the hard way
  (`generated-media-carries-facts`, `content-live-tiers`: no generated pixels carrying facts) [T]. Their generated
  illustration of a boy kicking a ball is fine because it carries no facts. The FORMULA card and the table are text.
- The beat-card vocabulary is the thing to take: definition, examples, rule, takeaway, formula, table, figure, checkpoint.
  Taxila's whiteboard draws strokes and labels. It has no named *card types* that a child learns to read across lessons
  [U]. Mapping: `shared/whiteboard.js` (ops), `src/child/lesson/Board.tsx`.

### 1.5 Checkpoints

- They are announced in advance: the "Checkpoint ahead — Lumi asks, you answer" chip [V, demo].
- The public example is a binary card: "CHECKPOINT · Is gravity a force? · Yes · No" [V, shot
  `sketchmind-1366-04-plan-first-and-checkpoint.webp`].
- The claims around them: "Checkpoints that quietly reshape the lesson" [V, comparison]. "Checkpoints keep it honest about
  what you've actually understood" [V, FAQ]. "If something looks off, ask and Lumi re-derives it step by step" [V].
- Progress unit: beats ("4 of 5 beats done") [V].
- Not visible from outside: how checkpoints are graded, whether a wrong answer re-teaches, and whether free answers or
  speech are accepted. The free-tier copy lists "voice questions" as coming soon [V].

**Read for Taxila.** A yes/no checkpoint cannot tell understanding from a guess. Taxila's covert evidence, its typed
answer grading and its delayed re-check are all more rigorous (`server/comprehension/`, `server/director/recheck.js`) [T].
Take the *announcement* and the *beat progress*. Children like to know a check is coming, and the chip makes the check
part of the lesson's rhythm rather than an ambush [U]. Do not take the binary card as the check.

### 1.6 Notebook and replay

- "Every board saves itself. Reopen it to review, continue where you stopped, or export clean PDF notes on Plus or Pro"
  [V, support].
- The "Replay lesson" control replays the board [V, demo]. "Sessions are serialized and stored so you can reload any lesson
  exactly as it was rendered" [V].
- The families page: "every lesson becomes a clean study sheet"; "The notes your child keeps after each lesson" [V].
- Coming: "Teach from your notes, photos & videos" (Pro), meaning teaching from the learner's own material [V].

**Read for Taxila.** This is the gap between SketchMind and Taxila's `Notebook.tsx`:
- Taxila stores per-lesson summaries (DidCards), but no board state and no replay.
- Its page list is device-local.
- Its own header lists the missing pieces: "her one-line explanation per page", "a still of the tray's final state", and
  "Notes for a friend" [T].

The parent view also gains: a replayable board is the most persuasive "what did my child learn today" artefact [U].

### 1.7 "Simpler" and "go deeper"

- "Say 'simpler' and it re-explains with a new sketch. Say 'go deeper' and the lesson expands" [V, FAQ and support].
- "From the beginning" / "from scratch" / a Start from scratch button changes what is covered [V, pacing post].
- Taxila: `server/director/requests.js` covers another, example, story, slower, visual (diagram, game or animation),
  language, topic, break, stop and goodbye. **It has no "deeper", "harder" or "aur batao" type** [T, read 2026-10-10].

### 1.8 Pricing in rupees (2026-10-10)

| plan | what | price | source |
|---|---|---|---|
| Free | "2 lessons a day", every subject and level, live board, voice and saved notes, "Earn more lessons by learning"; the allowance resets on "a rolling day / week / month basis" | ₹0 | [V] pricing and support pages |
| Plus (weekly) | unlimited (fair use), PDF export | "Coming soon"; the API returns `plans: []`, `subscriptionsEnabled: false` | [M] `GET https://sketchmind.ai/api/billing/plans?currency=INR` |
| Pro (monthly or yearly) | higher fair use, teaching from your own material, "Talk to Lumi — ask out loud" | "Coming soon" | [V], [M] |
| 5-lesson pack | one-time, "never expire" | **₹1,999** (`baseMinor 199900`, INR); "18% GST added in India" at checkout, so about ₹2,359 | [M] price API; [V] pricing FAQ |

Payment is by card, UPI or net banking through Razorpay [V]. The only currency marked available is INR; USD, GBP, AUD and
SGD are listed but `available: false` [M].

**Read for Taxila.** ₹400 for *one* lesson before GST is more than a whole *month* at ₹299, the price at which India's
voice tutors have shown families will pay (SpeakX ₹299 a month, `global-ai-tutors.md` §0.12) [T]. SketchMind is pricing as a tuition-class substitute, not
a habit. That is a data point for `pricing-unit-econ.md`, not a model to copy.

### 1.9 Gamification inside SketchMind

- "How do streaks work? Your streak counts the days in a row you've done at least one lesson… miss a whole day and it
  resets to zero, so even a quick lesson keeps the run alive" [V, support].
- "Earn more lessons by learning" [V, pricing]. The paywall's free allowance is the reward currency.
- Testimonial: "He asks for 'one more lesson' the way he used to ask for cartoons." — "DAVID — DAD OF AN 8-YEAR-OLD" [V].

So the "draws while it talks" reference product uses exactly the loss-framed streak that Taxila banned
(`design-v3-no-streaks-mastery`) [T].

### 1.10 SketchMind vs Taxila, line by line

| SketchMind does | Taxila today | take / beat |
|---|---|---|
| plan agreed aloud first | the Conductor's day plan, plus the school chapter supplied by the parent | **take**: a spoken three-step plan, drawn as the board's first card, that the child can amend (§4.1) |
| one idea per beat, typed cards | whiteboard ops; Stagecraft pieces; explainer beats | **take**: a fixed beat-card vocabulary |
| every topic opens on a picture | explainer rungs; template boards | **take**, under `content-live-tiers` (a picture that carries no facts, or an engine-drawn exact diagram) |
| ink revealed in narrative order; "draw" shown only when complete | clause cues with a 400 ms pre-roll; draw-on strokes timed from her first audio | **par**; test word-boundary events for the cascade lane |
| replayable notebook, continue from here, PDF | per-lesson card, device-local list | **take and beat**: board replay in her voice, plus the child's words, plus evidence; a server-side lesson list |
| binary checkpoints | covert evidence, a grader, delayed re-check | **beat**; take the "checkpoint ahead" chip and beat progress |
| "simpler" / "go deeper" | another / example / story / slower / visual | **take**: add `deeper` |
| opening shape from who, level and purpose | placement CAT; learner ledger | **take**: the opening shape from the ledger plus the school-today answer |
| 2 lessons a day free; ₹1,999 for 5 | — | **beat** on price |
| streak that resets to zero | banned | owner decision (§3.5) |
| voice mostly out; "talk to Lumi" not live; tap answers | duplex voice in and out, barge-in, Hinglish | **beat**, if duplex meets its switch criteria (BUILD-PLAN §1.1: 3 of 9) |
| a phone board 1.7 screens tall, figure below the fold | stage box contract at 360 × 800 | **beat**, if the box contract holds |

---

## 2. Peers: what each does best, the evidence, and what Taxila takes

Columns: the **one thing** each product does best, the evidence (and how strong it is), what Taxila should take, and what
it must not take. Products already torn down in `global-ai-tutors.md` and `india-*.md` are summarised with [T] and their
primary URLs. New 2026 items are marked **(new)**.

### 2.1 Tutors and live-generated teaching

| product | does best | evidence | take | do not take |
|---|---|---|---|---|
| **Synthesis Tutor** (K-5 maths) | interaction craft: hand-built manipulatives, narration for under-7s, micro-assessments, "no advance before mastery" | 100,000+ students; no efficacy study published [T, https://www.synthesis.com/tutor]. A Feb 2026 Trustpilot reviewer says the new interface dropped "story-based lessons" and the greeting by name ("feels like a dry computer program") [S, https://at.trustpilot.com/review/www.synthesis.is] | the craft bar; hand-built representations (matches Composed Play) | US pricing ($25-35 a month) [T] |
| **Khanmigo** | the tutor leads, fed structured learner state; **(new)** Gemini-generated interactive diagrams that respond when a point is dragged (27 Aug 2026) | 2-year cluster RCT, 0.06-0.08 SD per year ITT, the same as Khan Academy without AI; only 14.5% of messages contained maths reasoning [T, https://edworkingpapers.com/sites/default/files/ai26-1551.pdf]. Recent-attempts summary +3.4% next-item correctness [T, https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/]. Diagrams: no outcome data yet [S, https://blog.google/products-and-platforms/products/education/khan-academy-back-to-school/] | tutor-led activation; plain-text learner state in the prompt; a visual that reacts to the child's act | the chat-beside-content shape the RCT says children ignore |
| **Khan Academy motivation layer (new, 2 Oct 2026)** | Missions ("focused learning goals"), Gems "that recognize their learning effort", Khanmigo hats and glasses, class Gem Challenges with teacher-chosen rewards and a shared celebration | no data cited; one pilot quote: "low key kinda fun now" [V, https://blog.khanacademy.org/five-ways-khan-academy-is-making-student-practice-more-motivating/]. Help centre: every 50 Gems unlocks a **random** accessory; the streak needs one new Proficient skill each week or it resets [S, https://support.khanacademy.org/hc/en-us/articles/46935588089997] | Missions as goal framing; the *collective* class goal | random drops (variable-ratio reward); a weekly streak that resets |
| **ChatGPT dynamic visual explanations (new, 10 Mar 2026)** | 70+ maths and science concepts as manipulable modules (change the inputs, the result updates) | available to all logged-in users; OpenAI cites usage only ("140 million people… each week… math and science"); no learning data [S, https://techcrunch.com/2026/03/10/chatgpt-can-now-create-interactive-visuals-to-help-you-understand-math-and-science-concepts, https://openai.com/index/new-ways-to-learn-math-and-science-in-chatgpt] | proof that a parameterised module library (not free generation) is the platform answer | — |
| **Gemini interactive simulations and 3D (new, 9 Apr 2026)** | simulations with sliders (the Moon's orbit: velocity, gravity), rotatable 3D models | rolling out to Gemini app users; access detail conflicts between sources [S, https://blog.google/innovation-and-ai/products/gemini-app/3d-models-charts/] | 3D as an explorable object, not decoration | not allowed in the build (Google API) |
| **Penseum (new, relaunched 11 Mar 2026)** | "teaches in real-time voice, drawing diagrams on a canvas as it talks"; looks at the learner's work and "annotates exactly where a learner made a mistake"; builds a course from uploaded notes | maker description only; one review [V, https://www.producthunt.com/products/penseum/launches/penseum-2] | annotate the child's own work on the board | — |
| **Edza AI (India, new for JEE/NEET Jan 2026)** | voice tutoring with a collaborative whiteboard for classes 7-12 | press release: 30,000+ learners, mostly classes 9-12; "remembers past mistakes" [S, https://www.uniindia.com/news/pnn/story/3704639.html] | evidence that the SketchMind shape exists in India, for older students | — |
| **Duolingo Max / Video Call** | the retention machine, plus a short, bounded, character-led call: Lily "pauses while thinking", does not correct grammar mid-call, and her sass "emerges at advanced levels" | Q2 2026: 58.7M DAU, CURR 84%, 12.7M paid [T, https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm; https://blog.duolingo.com/video-call/] | a personality that unlocks with shared history; short bounded calls; one compounding return metric | the loss-framed retention stack (§3) |
| **Speak** | learner-grade turn-taking: a tutor framing on GPT-Live-1 cut thinking-pause interruptions from 27.6% to 13.6% | vendor blog [T, https://www.speak.com/blog/live-tutor-lessons-powered-by-openais-gpt-live-1]. CTO: audio models are "one or two generations behind text models" on code-switching [S, https://www.theneuron.ai/explainer-articles/hands-on-with-speaks-ai-language-tutor-stop-memorizing-words-and-start-building-micro-fluency/] | child pause tolerance, and Hinglish code-switching as a measured gap | — |
| **Ello** (ages 4-9) | a child-specific stack (100k+ hours of child speech, <1 s turns), plus the clearest child-AI relationship policy | "We are not trying to make a child need us" [T, https://www.ello.com/blog/ai-should-make-clear-what-reality-is, https://www.ello.com/legal/ai-safety]. A July 2026 job post describes "a complete AI teacher" beyond reading, including maths [S, https://www.edtech.com/jobs/ai-learning-designer-math-9381] | the hard lines; I do / we do / you do; "a win in their very first session" | stars spent on a Learning Tree (an economy) |
| **SigIQ (PadhAI, EverTutor)** | real-time voice tutoring with screen share ("Talkback"); India-founded | PadhAI 643k installs, 4.2★ [T]; $9.5M seed, Apr 2025 [S, https://yourstory.com/2025/04/edtech-sigiqai-9-million-seed-funding-gsv-ventures-peak-xv-ai] | screen-aware voice | — |
| **PhysicsWallah (Alakh AI, AI Guru, Ask AI, the coming AI Tutor)** | scale and price in India: Hinglish doubt-solving with a human escalation behind it | 135M+ free learners, about 3.5M daily active, about 2 h a day; AI Guru 100M+ questions solved, "more than 3 million voice queries within a month"; about 90% of queries solved by AI, and a thumbs-down escalates to a human; "We have to guarantee 100% accuracy" [V, https://www.businesstoday.in/amp/technology/story/why-physicswallah-believes-it-can-beat-openai-google-in-indias-ai-tutor-race-534212-2026-06-01]. AI Tutor beta: 95% lesson-level accuracy, about $0.20 per voice hour, pitched as "a true companion for the kids" [T, https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/]. CuriousJr (classes 1-9, human live classes) [T] | a human escalation path for wrong answers; affordability (~₹10 a day) | the companion pitch |
| **BYJU'S (WIZ) / Doubtnut (now Allen)** | BYJU'S announced BADRI, MathGPT and TeacherGPT (2023, about 87-90% accuracy claimed); Doubtnut: reach through photo doubts | the 2023 announcement only; nothing current on WIZ found [S, https://yourstory.com/2023/06/byjus-wiz-generative-ai-models-hyper-personalised-learning-edtech/]. Doubtnut was acquired by Allen [T, https://www.business-standard.com/companies/news/allen-career-institute-acquires-ai-enabled-edtech-platform-doubtnut-123120400620_1.html] | the cautionary tale (`india-incumbents.md` §4.1) | sales-led trust breakage |
| **Gauth / Photomath** | reach (123M and 282M installs) through photo-solve; animated steps; Gauth "Atlas" visual exploration | [T, https://www.gauth.com/, https://photomath.com/]. Unguarded answer-giving cut unaided exam scores by 17% (Bastani et al., PNAS 2025) [T] | photo homework that turns into tutoring | the answer engine |
| **Kira (Kira Learning)** | an AI-native K-12 platform for teachers: agents for grading and planning, plus tutoring | launched Apr 2025; Andrew Ng is chairman [S, https://thejournal.com/articles/2025/04/30/ed-tech-startup-kira-launches-ai-native-learning-platform.aspx, https://kira-learning.com/about] | the teacher-side view, later | — |

### 2.2 Games, worlds and manipulatives

| product | does best | evidence | take | do not take |
|---|---|---|---|---|
| **Prodigy Math** (RPG) | a world children want to be in: quests, battles, spells, a hundred-plus pets to "tame" and "evolve", members-only areas | company-run, usage-selected efficacy reports (PA n > 3,600; FL n > 3,700), no randomisation [S, https://prodigygame.com/research]. 91% of parents say children enjoy it (commissioned survey) [V, https://www.prodigygame.com/main-en/]. The FTC complaint by 22 groups: "16 unique advertisements for membership and only four math problems" in 19 minutes [T, https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/] | the *pull* of a world and creatures; a teacher report | maths as the toll before the fun; paid pets; progress tied to payment |
| **Brilliant** | interactive-first lessons; humans own "the learning objective, the progression, and the 'aha moment'", and AI fills in variants; a generator went from 0% to 93% correct in 48 hours by changing the *representation*, not the model | [V, https://blog.brilliant.org/hand-crafted-machine-made/]. Leagues: weekly, 30 learners, 10 levels, promotion and demotion; XP resets weekly [S, https://help.brilliant.org/en/articles/6399120-leagues-faq] | representation over model; a human-set aha per skill (`STEAL-LIST` #23) | leagues |
| **Mathigon / Polypad** (Amplify) | 50+ virtual manipulatives, dynamic geometry, free | free, as promised at the 2021 acquisition [S, https://mathigon.org/teachers, https://www.businesswire.com/news/home/20211013005759/en] | the manipulative library as the benchmark for Taxila's representations | — |
| **DragonBox** (Kahoot!) | notation as an object: algebra that feels like a puzzle | From Here to There and DragonBox beat an active control (Decker-Woodrow et al. 2023, n > 3,600) [T]; but no gain on paper equations after 3.5 h (Long & Aleven 2014) [T, `in-game-success-as-mastery`]; now freemium in Kahoot! [S, https://apps.apple.com/us/app/-/id1550574547] | the fade from game objects to notation (mechanics.md L6) | treating in-game success as mastery |
| **Minecraft Education** | creation and persistence; a world children already know | 29 pre-post studies, all at medium or high risk of bias (Slattery et al. 2025) [T]. AI Foundations and a coding challenge (ISTE 2026) [S, https://education.minecraft.net/de-de/blog/minecraft-education-at-iste]; Lesson Crafter generates teacher lessons (private preview, Nov 2024) [S, https://education.minecraft.net/en-us/blog/introducing-minecraft-education-s-ai-powered-lesson-crafter] | build-to-learn; the child as maker | depending on a teacher to design the learning (the review's own caveat) |
| **Roblox Education** | identity (avatars), owning and making worlds, social play; Cube 3D generates meshes from text inside Studio (Mar 2025) | a 2023 review of 40 studies: positive attitudes, small single-group studies [T]; state attorney-general suits over child safety [T]; Cube [S, https://corp.roblox.com/newsroom/2025/03/introducing-roblox-cube, https://about.roblox.com/education] | identity and making | open social contact; Robux |
| **TutorFlow Games (new, beta Aug 2026)** | one sentence → an editable plan (core idea, what the player does, win and fail rules) → a browser game, which is **played by the system before delivery** ("A version that freezes or will not start is rebuilt, not sent") | maker page [V, https://tutorflow.io/features/games]; press [S, https://prunderground.com/tutorflow-launches-ai-game-generation-from-a-single-sentence/cmt7haah3000704l7nqmf9trk]. Examples are arcade templates (lane-runner, falling-letter, word search) | a plan before code; the bot play test as a hard gate | minutes of latency inside a lesson; arcade quiz skins |
| **Project Genie / Genie 3 (new, 29 Jan 2026)** | a world model that renders an explorable world in real time from text or an image | adults 18+ in the US only, about one minute of memory, research prototype, promptable events not yet included [S, https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie/] | a horizon marker only | carrying facts in generated pixels; non-Azure |
| **Miko** (robot companion, ages 4-12, Mumbai) | an embodied, always-on companion with a content library | PIRG Trouble in Toyland 2025: AI toys that "act dismayed when you say you have to leave"; parental time limits only in the phone app [S, https://pirg.org/edfund/media-center/trouble-in-toyland-2025-a-i-bots-toxics-present-hidden-dangers-2/]; a US senator's letter [S, https://www.blackburn.senate.gov/services/files/A93BB07D-2743-48AF-9DC5-DF83F2553FFC] | nothing for the bond | dismay at goodbye (banned by NEVER MANIPULATE) |
| **Mindspark** (Ei, India) | adaptive practice with the strongest Indian RCT | Delhi after-school centres: +0.37 SD maths and +0.23 SD Hindi in 4.5 months (with 45 minutes of instructor-led group time; 58% take-up) [S, https://www.povertyactionlab.org/evaluation/disrupting-education-evidence-technology-aided-instruction-india]. "Sparkies" for correct answers drive class, city and country leaderboards [S, https://apps.apple.com/us/app/id1541664545] | adaptive practice plus a human who makes practice happen | attributing the RCT effect to Sparkies (not isolated) |
| **Edzy** (India, classes 6-12, CBSE and state boards) | "Gamified practice like duels and streaks", Socratic AI tutoring | maker page; no user numbers [V, https://www.edzy.ai/] | — | child-vs-child duels; streaks |

### 2.3 Who builds content live, and how (the "build on the go" question)

| approach | who | latency | correctness control | fits a live child lesson? |
|---|---|---|---|---|
| a fixed library of parameterised modules, picked live | ChatGPT (70+ concepts), Khan diagrams (Gemini-generated, scope unclear), Taxila engines | instant | authored | yes: this is Taxila's T1 (`content-live-tiers`) |
| a model streams layout commands for text, SVG and maths | SketchMind, Penseum | first words in about 1 s; a figure "revealed only when complete" | "can make errors — particularly in advanced mathematics" (self-reported) | for text and maths yes; for exact diagrams only with validators (Taxila: `live-free-generation` rejected free SVG at 8-25 s) |
| a model writes a whole game, a bot plays it, then it ships | TutorFlow | "a few minutes" | an automated play test | no: offline or prefetch only (Taxila T3) |
| a world model renders pixels | Genie 3 | real time | none (pixels) | no |
| a model picks a move from code-made candidates; engines build the game | Taxila Composed Play | p50 1.32-1.53 s for the delta (n = 12-24) [T, live-tech §0.3] | laws recompute every value; render certified | yes, and **nobody else does it** |

---

## 3. Gamification that 9-14-year-olds find cool, not childish

### 3.1 Where Taxila's no-manipulation rule comes from (verified lineage)

1. **Meera (html-portfolio), the persona's NEVER MANIPULATE block:** "no goodbye hooks, absence is never a subject, warmth
   never varies with usage, every tease pays off, no suspense across sessions". The idle-silence nudge "was deleted as
   incentive-salience engineering" [T, `docs/harvest/meera-repo.md:124`, `docs/harvest/companion-tech.md:744-749`].
2. **Gurukul's `safety-floor-teacher.md` §5.1** applied it to edtech retention. It banned:
   - loss-framed streaks;
   - "you haven't studied in 3 days";
   - exam countdowns;
   - cliffhangers;
   - "only I understand how you learn";
   - holding a child at goodbye;
   - push re-engagement;
   - leaderboards;
   - variable-reward drops.

   It also gave a falsifiable test: **"A mechanic is allowed iff removing every fear and obligation from it leaves the
   mechanic intact."** [T, `docs/harvest/gurukul.md` §3.2, §4.7]
3. **Taxila, `docs/research/design/motivation-without-rewards.md` (2026-10-02)** proposed `mw-no-reward-economy` and
   `mw-no-time-grids`. Its reversal condition: "an RCT-quality comparison in Indian children shows a reward layer raises
   *delayed retention* (not DAU) without lowering free-choice persistence" [T]. **Neither id is in `context/graph.json`**
   (checked 2026-10-10).
4. **`design-v3-no-streaks-mastery` (2026-10-04, in the graph):** "No streaks, points, XP, levels or leaderboards on child
   screens… **In-game HUD numbers (hit/combo/clean) are allowed only inside a running game** and never totalled or carried
   out. Revisit only if X7 shows > 5 pp lessons/week loss AND no anxiety signal." [T]
5. **`r3p-world-ledger-view` (2026-10-09) and `live-tech.md` §0.8:** "No points, coins, XP, streaks, lives, loot, unlocks,
   leaderboards or countdowns; no child-vs-child" [T].
6. **BUILD-PLAN 2026-10-10, line 75 and contract C8:** "no points, coins, streaks, timers or locks in any game", with
   `tests/play-style-lint.test.mjs` as its named test [T].

**Verified gap in enforcement (2026-10-10):**
- `tests/play-style-lint.test.mjs` does not test the economy ban. It checks colour literals, family views and lab sources.
- The ban is actually enforced only on *copy*:
  - `src/ui-v3/lint/rules.mjs` `WORDS` (xp, streaks, level up, "earn|collect|win stars|coins|gems", trophy, confetti),
    run by `tests/ui-v3-lint.test.mjs`;
  - the reaction word list in `tests/play-react.test.mjs`.
- A timer, a lock or a points total built into game *logic* would pass every test today.

Whatever the owner decides, the rule needs a mechanic-level test, not only a word list.

### 3.2 What Indian 9-14-year-olds play, and what reads as babyish

| evidence | what it says | strength |
|---|---|---|
| Ormax Brand Trust Survey 2021, urban kids, 10 cities | the 5 most trusted media brands are all digital: YouTube, Ludo King, WhatsApp, Subway Surfers, Garena Free Fire; 85% played a mobile game in the last week; for 10-14s only one TV brand makes the top 10 | [T, https://www.ormaxmedia.com/data/library/In-digital-we-trust-urban-indian-kids-OrmaxMedia.pdf] (2021, urban) |
| Sensor Tower, India mobile games 2025 | India led the world in game downloads (Apr 2024-Mar 2025); players are 86% male and 77% aged 18-34 | [S, https://gamedevreports.substack.com/p/sensor-tower-india-mobile-games-market]. Children are invisible in the market data |
| Play Store rankings 2025 | Free Fire MAX and Ludo King among the most popular; Minecraft and Blockman Go top the arcade list; Ludo King the most downloaded in 2025 (AppMagic) | [S, https://42matters.com/india-mobile-gaming-statistics, https://respawn.outlookindia.com/gaming/gaming-news/top-10-most-downloaded-mobile-games-in-india-in-2025] |
| BGMI under-18 rules | parent OTP registration; 3 hours a day; ₹7,000 a day spend cap | [S, https://www.techradar.com/news/bgmi-adds-parental-controls-restricts-gaming-time-to-3-hours] |
| Free Fire | banned Feb 2022; the India relaunch was postponed (Sep 2023) and was still unannounced in Sep 2026; Free Fire MAX is the legal version | [S, https://techcrunch.com/2023/08/30/garena-relaunches-free-fire-in-india-a-year-after-ban, https://respawn.outlookindia.com/gaming/gaming-news/free-fire-india-reports-ffmic-and-indias-ffws-2026-run] |
| Lumikai, 2025 edition | the gamer base contracted from 609M to 555M (after the Aug 2025 real-money gaming ban); market +17% to $1.5B | [S, https://respawn.outlookindia.com/gaming/gaming-news/lumikai-india-gaming-market-1-5-billion-rmg-ban-2025] |
| what reads as "for little kids" | NN/g *Teenager's UX* (13-17): condescending tone, babyish visuals, pointless multimedia; tweens reject primary colours, exaggerated animation and "playful" UI; Yeager, Dahl & Dweck 2018: adolescents respond to respect and status | [T, `docs/design/round4/{world,kinetic,studio}/RESEARCH.md` §2; `docs/design/reset/DESIGN-V3.md` §1.1] |
| the owner | today's product is "childish and basic" (2026-10-09) | [T] |

**Gap, plainly.** I found no published study of what Indian 9-14-year-olds play, or of what they call babyish. Round 4's
three design directions already say the same [T]. The reference titles are therefore an inference from all-ages data:
battle royale (BGMI, Free Fire MAX), sandbox and creation (Minecraft, Blockman Go), endless runners (Subway Surfers) and
board games with family (Ludo King) [U].

What these games share [U]:
- real-time agency;
- identity through skins;
- short sessions;
- playing with people you know (Ludo King with family; squads in BGMI).

None of them has a mascot or a lesson. Ludo King's trust rank is a reminder that "cool" in India includes family play,
not only shooters.

**The cheap measurement** (two weeks, owner-approvable):
1. A one-screen, voice-read question at onboarding for B3-B4 children: "Kaunsa game sabse zyada khelte ho?" Free text,
   with 6 chips.
2. A five-second test of three home screens with 20 class 4-5 and 20 class 7-8 children ("Ye app kiske liye hai?"),
   already designed in `docs/design/round4/world/RESEARCH.md` §4 [T].

### 3.3 The mechanics: evidence, harm, and the no-manipulation test

Key to the last two columns:
- **Gurukul test**: does the mechanic survive "removing every fear and obligation from it"?
- **Pass**: compatible with NEVER MANIPULATE as written.
- **Conditional**: passes only in the stated form.
- **Fail**: incompatible.

| mechanic | evidence that it helps | evidence that it harms | gurukul test | 9-14 "cool" read [U] |
|---|---|---|---|---|
| **the skill IS the core mechanic** (intrinsic integration) | more learning under fixed time, and about 7× voluntary play time (16 children, free choice) (Habgood & Ainsworth 2011) [S, https://shura.shu.ac.uk/3556/]; games vs non-games 0.33 (k = 57) (Clark et al. 2016, doi 10.3102/0034654315582065) [S]; learning d = 0.29, retention 0.36 (Wouters et al. 2013, doi 10.1037/a0031311) [S] | in-game success ≠ mastery (DragonBox; Nuraydin 2022) [T] | **pass** | the core of "proper game games" |
| **graphics fidelity** (Minecraft-like 3D) | none for learning: "same or higher efficacy for games that featured simpler visual design"; schematic games beat cartoon-like or realistic ones [S, https://joanganzcooneycenter.org/?p=16779; Wouters 2013] | frame time on a ₹10k phone (`design-v3-unmeasured` X6) [T] | pass | high pull; the first thing a 12-year-old judges |
| **juicy, success-dependent feedback** | pre-registered, n = 1,699: success-dependent juice raised every motive; *amplified* juice reduced them (Kao et al., CHI 2024) [T, https://spiral.imperial.ac.uk/entities/publication/253c32f5-d124-4a23-88b5-9aaaf114608d] | amplification for its own sake (confetti) | pass (if proportionate to the child's act) | yes |
| **a world, hub or map where understanding changes the place** | game fiction moderates behavioural outcomes (Sailer & Homner 2020) [V, https://opus.bibliothek.uni-augsburg.de/opus4/files/109056/109056.pdf]; no direct learning test of a hub | Math Garden's wilting plants are loss by absence [T]; grinding easy topics to light places (world RESEARCH §4) [T] | **pass** if nothing decays and routes follow real prerequisites (`r3p-world-ledger-view`) | yes, if it is a place, not a flowchart |
| **avatar and identity customisation** | customisation → identification → autonomy, effort, enjoyment, time played (adult players, an endless runner; Birk et al., CHI 2016, doi 10.1145/2858036.2858062) [S] | paid cosmetics (Prodigy, Roblox) [T] | **conditional**: free choice, or unlocked by real milestones; never bought, never random | very high (skins culture) |
| **collections** (things gathered) | no learning evidence found [U] | expected, contingent tangible rewards undermine free choice (engagement-contingent d = -0.40, completion -0.36, performance -0.28; worse for children) (Deci, Koestner & Ryan 1999) [T]; random drops: loot-box spending linked to problem-gambling severity (η² = 0.054, n = 7,422; Zendle & Cairns 2018, doi 10.1371/journal.pone.0206767) [S, https://eprints.whiterose.ac.uk/139116/] | **conditional**: a collection of the child's *own* artefacts and secured ideas (no randomness, no exchange, nothing to lose) passes; random or currency-bought drops fail | high |
| **creation** (the child designs a level or puzzle; a "Ghar ki paheli" for a parent) | learning by teaching g = 0.56 when the learner actually teaches (Kobayashi, 28 studies) [T]; Minecraft review "promising", high risk of bias [T] | moderation if shared beyond family | **pass** | very high (Minecraft, Roblox) |
| **choice and exploration** | choice raises intrinsic motivation, more so for children, best with 2-4 successive choices and no reward afterwards (Patall et al. 2008) [T]; learning progress explains free task choice (Ten et al. 2021) [T] | — | pass | yes |
| **narrative, missions, quests** | fiction is a moderator (Sailer) [V]; Khan Missions (no data) [V] | cross-session cliffhangers are banned (gurukul) [T] | **pass** if each story closes within the session | depends on execution; a children's story register reads as babyish to 12+ [U] |
| **collaborative goals** (family or class, no individual counts) | "combining competition with collaboration were particularly effective" for behavioural outcomes (Sailer) [V]; Khan Gem Challenge (no data) [V] | exposes the child who contributes least | **conditional**: no per-child tally visible | yes for teens |
| **opt-in challenge or boss levels** | challenge chosen at the edge of competence fits learning-progress theory [T] | failure framing | pass (self-chosen, no penalty, nothing lost) | yes |
| **in-run score, combo, "clean" HUD** (not carried out of the run) | — (game feel) | — | pass (already allowed by `design-v3-no-streaks-mastery`) | yes |
| **real-time action** (dodge, aim, steer: the "space fighter") | fluency practice on secure skills [U] | speed bonuses punish careful checking (gurukul) [T]; time pressure on first learning | **conditional**: real-time *play physics* on skills already secure, never a countdown on thinking, never on first exposure | very high |
| **points, XP, currency** | average gamification effects include points (Sailer) [V]; badges raised activity in an adult sharing marketplace (n ≈ 3,000, two-period field experiment; Hamari 2017) [S, https://webpages.tuni.fi/gamification/2018/09/20/badges-increase-user-activity-a-field-experiment-on-the-effects-of-gamification/]; Mindspark's Sparkies sit inside a +0.37 SD RCT, but were not isolated [S] | Deci 1999 [T]; the ICO says 10-12-year-olds are "particularly susceptible to reward based systems" [T] | **fail** as an exchangeable currency; **conditional** as pure information that buys nothing | mixed; teens see through it |
| **badges** | Hamari 2017 [S] | *mandatory* badges plus a leaderboard: lower intrinsic motivation, satisfaction and exam scores over 16 weeks (Hanus & Fox 2015, doi 10.1016/j.compedu.2014.08.019) [S] | **conditional**: Taxila's "capability milestone with cited attempts" is a badge without the collection pressure | low |
| **streaks** | Duolingo: a 7-day streak goes with 3.6× completion (correlational); the streak animation added +1.7% day-7 retention [T, https://blog.duolingo.com/how-duolingo-streak-builds-habit/]; CURR 84% [T] | across 7 studies a broken streak lowers engagement, more so with self-blame (Silverman & Barasch 2022, doi 10.1093/jcr/ucac029) [T]; an Indian reviewer: "losing almost 1k days" [T] | **fail** (loss aversion by construction); a weekly "no-loss" streak still resets (Khan) | many children like streaks (Duolingo streak reviews average 4.6★) [T] |
| **leaderboards, leagues, duels** | Sailer: competition helps when combined with collaboration [V] | absolute leaderboard: a lower position goes with lower intrinsic motivation (Bai, Hew, Sailer & Jia 2021, *Computers & Education* 173; 50 postgraduates) [S, https://epub.ub.uni-muenchen.de/96762]; social comparison (Hanus & Fox) [S]; the "topper" culture is the anxiety Taxila would otherwise sell the cure to (gurukul) [T] | **fail** for ranked forms; **conditional** for co-op | high for competitive teens, harmful for the lowest third |
| **lives, hearts, energy** | — | Duolingo's energy system drew "the app only tries to milk you" (Play review) [T] | **fail** (it gates practice) | disliked |
| **locks and unlocks** | mastery gating ("no advance before mastery", Synthesis) [T] | locks as reward or paywall (Prodigy members-only areas) [S] | **conditional**: a route that opens because a prerequisite is secure is information; an unlock bought with currency, time or payment fails | yes ("a new area opened") |
| **countdowns and daily quests that expire** | — | manufactured urgency (gurukul) [T] | **fail** | common in games, and the manipulative part of them |
| **variable or random rewards** (loot, random accessory) | — | Zendle & Cairns 2018 [S]; DPDP s.9 behavioural monitoring of children [T] | **fail** | cool, and exploitative |

### 3.4 What the table says, in four sentences

1. The mechanics with the best evidence for *learning* are the ones that make a game a game:
   - the skill is the mechanic;
   - success-dependent feedback;
   - challenge and choice;
   - creation;
   - fiction;
   - collaboration.

   All of them pass the no-manipulation test.
2. The mechanics with the best evidence for *retention* (streaks, leagues, currencies) have evidence of harm to
   intrinsic motivation or to low performers, and no published evidence of better delayed learning.
3. Visual fidelity has no learning evidence, but it is the first thing a 12-year-old judges. It is a craft and
   performance problem (the ₹10k phone), not a motivation-policy problem.
4. "Fully gamified" in the owner's message sits beside "Minecraft, space fighter level… proper game games". On a plain
   reading, that is a demand for **game quality and agency**, which the rule allows, more than a demand for an economy
   [U, interpretation to confirm with the owner].

### 3.5 The owner decision (options, not a recommendation)

| option | what children get | what it adds to today's rule | evidence for | evidence against / risk | what to measure, and when to reverse |
|---|---|---|---|---|---|
| **A. Game-native, economy-free (today's rule, enforced properly)** | real games (Composed Play) with in-run HUD; a world that changes with understanding; creation; capability milestones; no currency, streaks or ranks | a mechanic-level lint (§3.1 gap) | Deci; Hanus & Fox; Silverman & Barasch; Ello's stance; DPDP and ICO | retention may lag peers (`open-world-motivation-proof`; X7); Taxila would be the only reward-free product among those in §0.8 | child-started sessions per week and delayed accuracy at 12 weeks; reverse per `design-v3-no-streaks-mastery` (X7 > 5 pp loss and no anxiety signal) |
| **B. Game-native plus identity and collections earned by evidence** | A, plus: avatar and skin customisation (some free, some opened by *secured* skills, never bought, never random); a personal collection of things the child made and ideas made pakka; family or class co-op goals with no individual tallies; opt-in challenge levels; real-time action on secure skills | conditional rows of §3.3, each with a written gurukul-test pass | Birk 2016 (identification); Sailer (fiction, collaboration); Kao 2024 (juice); Patall 2008 (choice) | milestone-unlocked cosmetics are still contingent rewards (Deci: completion-contingent -0.36); grinding toward an unlock | free-choice persistence (does play continue when unlocks stop?), grinding of easy topics, delayed retention; reverse if free-choice time drops after unlocks end, or grinding is > 20% of topic choices |
| **C. A Khan-style soft economy** | B, plus effort points ("Gems") that unlock cosmetics, Missions, a weekly goal that resets without drama | currency + reset | Khan's direction (no data published) [V]; Hamari 2017 (adult activity) [S] | Deci (engagement-contingent -0.40); random-drop variants are variable-ratio; ICO susceptibility at 10-12 | an A/B on delayed retention, not DAU (the `mw-no-reward-economy` reversal condition) |
| **D. The full retention stack (Duolingo / Brilliant)** | C, plus a daily streak, leagues with promotion and demotion, energy | loss aversion and ranking | Duolingo's retention numbers (correlational and vendor) [T] | every harm row of §3.3; incompatible with the safety floor's NEVER MANIPULATE as written; reputational risk with parents and regulators | not testable under the current floor without changing the floor itself |

The decision the owner needs to make is this:
- Is "fully gamified" a demand for **game quality and agency** (A or B: the rule stands and gets a mechanic-level test)?
- Or is it a demand for **an economy and retention mechanics** (C or D: the rule is relaxed, and the floor text changes)?

If it is B, the owner should also approve the specific conditional forms in §3.3: cosmetics opened by secured skills,
real-time play on secure skills only, and co-op goals with no individual tallies.

---

## 4. Product design synthesis, by pillar

Each pillar lists what to take (with its source), how it maps to what Taxila has (with files), and the gap.

### 4.1 Session start (the owner's "just start the session")

| take | source | maps to | gap |
|---|---|---|---|
| a spoken, three-step plan the child can amend ("Pehle X, phir Y, phir ek game. Theek hai?"), drawn as the board's first card | SketchMind [V] | `server/conductor/planner.js` (the day plan becomes *her private plan*, per the owner vision), `src/child/lesson/Board.tsx` | the child sees no plan card; the Conductor plan is a menu |
| ask what the child can answer: "aaj school mein kya hua? copy mein kya likha? test kab hai?", then map the answer to the syllabus graph | the owner; tuition-teacher practice [T, `docs/research/voice/indian-teacher-discourse.md`] | `server/content/next-topic.js` (`schoolStartIndex`, chapter supplied by the parent), `data/curriculum/` | no child-side "school today" intake; no free-answer → topic mapper |
| the opening shape from who, level and purpose (Anchored, Lean, Direct), with "from the beginning" meaning coverage | SketchMind [V] | the learner ledger (`server/learner/model.js`); placement (`server/placement/`) | no explicit opening-shape field in the lesson plan |
| "Resume →" with beat progress ("4 of 5") | SketchMind [V] | `src/child/screens/Home.tsx`, the lesson summary | no beat-level resume |
| a first-session win | Ello ("a win in their very first session") [T] | `server/conductor` | — |

### 4.2 Teaching and the board

| take | source | maps to | gap |
|---|---|---|---|
| one idea per beat, with a fixed card vocabulary (definition, examples, rule, takeaway, formula, table, figure, checkpoint) | SketchMind [V] | `shared/whiteboard.js`, `src/modules/whiteboard/Player.tsx`, `server/stagecraft/*` | ops, but no named card types |
| every topic opens on a picture; the board never runs long without a visual; exact diagrams for exact things, scenes for processes | SketchMind [V] | `content-live-tiers`, `generated-media-carries-facts` [T] | none in policy; coverage is the gap (`live-tech.md` §1: 382/385 explainers were one catch-all) |
| ink revealed in spoken order; a figure placeholder ("Picture this…") while the exact drawing loads | SketchMind [V] | `teacher-stage-cue-scheduler`, `p4c-board-sync-ladder` [T] | a placeholder state that *names* what is coming |
| the board as the biggest surface on a phone | the round-4 world direction; SketchMind's failure at 360 [M] | BUILD-PLAN S0.5 box contract | certification at 360 × 800 |
| annotate the child's own work where the mistake is | Penseum [V] | `server/director` misconception tags | no "mark on the child's work" op |

### 4.3 Games

| take | source | maps to | gap |
|---|---|---|---|
| the skill as the core mechanic (intrinsic integration) | Habgood & Ainsworth [S] | `dec-r3-composed-play-typed-pairs`; `src/play/families/{todo-jodo,taraazu,nishana,kyun-lab}` [T] | 47/250 topics have a real game (BUILD-PLAN §1.1) [T] |
| a world children want to enter: creatures, places, quests (without the toll) | Prodigy [S]; Sky and Monument Valley [T] | `src/play/world/PlayMap.tsx`, `server/play/world.js` | the map is a flowchart (world RESEARCH §2) [T] |
| a plan before the build, and a bot plays every game before a child sees it | TutorFlow [V] | `server/forge3/play-cert.js`, `server/forge3/qa/` | a play test on every *composed* instance, not only on certified pairs |
| the child as designer ("Ghar ki paheli") | Minecraft, Roblox [T]; live-tech §0.7 [T] | not built | editor mode |
| identity: an avatar or skin the child chooses | Birk 2016 [S]; skins culture [U] | the Hello avatar discs (`src/child/screens/Hello.tsx`, 24 discs) | no in-game identity; owner decision §3.5 |
| real-time action, at a frame rate a ₹10k phone holds | BGMI, Subway Surfers [U] | `three` 0.180 in deps; 6/16 modes ≥ 50 fps at 4× throttle [T] | device run (O-R4) [T] |

### 4.4 Live content ("build on the go")

| take | source | maps to | gap |
|---|---|---|---|
| a parameterised library picked live (sliders, drag) | ChatGPT, Gemini, Polypad [S] | studio-v2 engines (`src/studio-v2/engines`), `shared/engine-catalog.js` | coverage per topic |
| a visual that reacts to the child's act | Khanmigo (Aug 2026) [S] | the play turn-points in live-tech §0.6 [T] | — |
| humans own the aha; AI fills variants; fix the representation, not the model | Brilliant [V] | kit schema (`STEAL-LIST` #23) [T] | the aha field per skill |
| a streamed text-and-maths board with a ~1 s first word | SketchMind [V] | the whiteboard hot lane (`w2f-whiteboard-hot-lane`: 7 s budget) [T] | the first visible ink faster than her first sound |

### 4.5 Understanding check

| take | source | maps to | gap |
|---|---|---|---|
| announce the check ("Checkpoint ahead") and show beat progress | SketchMind [V] | the lesson PhaseLine (`src/child/lesson/PhaseLine.tsx`) | the chip |
| prompt for an explanation of how they got it | Khan 2026 redesign [T] | teach-back / protégé (`server/comprehension/probes/protege.js`) | — |
| never a guessable binary check as evidence | the §1.5 critique [U] | `server/grading/`, `server/comprehension/` [T] | — |
| a human escalation for a contested grade or answer | PhysicsWallah (thumbs-down → human) [V] | `server/reports` incident paths | a "this seems wrong" path for the child or parent |

### 4.6 Learner model

| take | source | maps to | gap |
|---|---|---|---|
| plain-text recent-attempts summary and prerequisite-gap review in the tutor's context (+6.1% combined) | Khan [T] | `server/learner/brief.js`, `briefView.js` | — |
| "how this child learns" as measured responsiveness per representation, never a style label | the owner vision (6); `rj-style-attribute-to-generator` [T] | `server/learner/model.js` | a representation-response field |
| remembers the syllabus and the school's pace | SketchMind ("Remembers your syllabus") [V] | `next-topic.js` `CALENDAR_LAG` | updated by the child's "school today" answers |

### 4.7 Relationship

| take | source | maps to | gap |
|---|---|---|---|
| a personality that grows with shared history (Lily's sass at advanced levels) | Duolingo [T] | `server/relational/bond.js`, `memory.js`, `openings.js` | a visible "how she has changed with you" |
| hard lines: never real, never "I love you" back, never exclusive, routes to trusted adults | Ello [T] | the safety floor; `tests/never-rules.test.mjs`, `tests/relational-neverrules.test.mjs` | — |
| never dismay at a goodbye | the anti-pattern in PIRG 2025 (Miko) [S] | `server/director/requests.js` `goodbye` (ends that turn) [T] | — |
| remember the child's own words and comebacks, with citations | `motivation-without-rewards.md` §0.11 [T] | `server/relational/memory.js` | the words surfaced in the notebook |

### 4.8 Duplex voice

| take | source | maps to | gap |
|---|---|---|---|
| learner pause tolerance (Speak 27.6% → 13.6% interruptions) | Speak [T] | `server/duplex/eot.js`, `src/duplex/turnPolicy.ts` | children's pauses (`TURN-TAKING-CHILDREN.md`) [T] |
| <1 s per turn | Ello [T] | BUILD-PLAN V4.3 (p50 6,070 ms today) [T] | the biggest single gap in this table |
| "simpler" / "go deeper" by voice | SketchMind [V] | `server/director/requests.js` | add `deeper` |
| voice in, not only voice out | SketchMind lacks it ("Talk to Lumi… In the works") [V] | duplex: 3 of 9 switch criteria met [T] | criteria |

### 4.9 Parent view

| take | source | maps to | gap |
|---|---|---|---|
| a clean study sheet per lesson that the parent can open | SketchMind [V] | `src/parent/Report.tsx`, `server/reports/` | built from the board replay plus the child's words |
| "notebooks never shared without you"; "no feeds, ads, or strangers" | SketchMind [V] | DPDP posture [T] | — |
| collective goals the parent can join, with no tallies | Khan class goals [V] | `motivation-without-rewards.md` §10 (corrected by its own critique C4) [T] | owner decision §3.5 |
| the human who makes practice happen (the UP RCT, +0.44 to +0.47 SD) | Khan India RCT [T] | parent-set dose (`wb-dose-by-schedule`) [T] | — |

### 4.10 App shell and UI

| take | source | maps to | gap |
|---|---|---|---|
| the notebook aesthetic: highlighter wash reveals, paper grid, handwriting display type | SketchMind [V, page CSS] | `src/ui-v3/*`; round-4 directions (`docs/design/round4/{world,kinetic,studio}`) | reads adult; test with B3-B4 |
| game-native chrome: a place, framed panels, a portrait over a caption | Hades, Genshin [T, world RESEARCH] | `src/app/Shell.tsx`, `src/child/ChildShell.tsx` | owner pick of a direction |
| hard-extrusion buttons (no blur cost on a ₹10k phone) | CRED NeoPOP [T, kinetic RESEARCH] | `src/ui-v3` | — |
| one primary action per screen | Things 3, Linear [T, studio RESEARCH] | — | — |

### 4.11 What nobody does well yet (where Taxila can be first)

1. **A real game composed live from the conversation and the learner model, with the teacher inside it.** Nobody does
   it. TutorFlow takes minutes and is teacher-side. Khanmigo diagrams are not games. SketchMind has no games.
2. **A tuition-teacher front door:** "what happened at school today" mapped to NCERT and state-board syllabi, then
   continued and revised. SketchMind asks adults what they are studying; PhysicsWallah's tutor is not out.
3. **Hinglish, voice-in and voice-out board teaching for classes 1-8 on a ₹10k phone.** Indian voice tutors cluster in
   classes 9-12, and SketchMind's board fails at 360 px [S][M].
4. **Calibrated, covert understanding evidence in voice** (`STEAL-LIST` Bet 1) [T]. Every peer uses overt quizzes or
   binary checkpoints.
5. **A notebook that holds the child's own words, a board replay in the teacher's voice, and evidence a parent can
   read.**
6. **Game-quality play without an economy.** No product has shown this works. It is an open bet with a pre-registered
   test (`open-world-motivation-proof`) [T].

---

## 5. Constraint check for everything above

| idea | constraint | status |
|---|---|---|
| a SketchMind-style streamed board | Azure-only | fine: the model and TTS come from Azure AI Foundry Direct; SketchMind's own vendors (Anthropic, OpenAI direct, Gemini, Sarvam, smallest.ai) are excluded |
| word-boundary-timed captions | Azure Speech | test on the production voice (`dragonhdomni-not-production`) |
| Genie or Gemini simulations | Azure-only | excluded; parameterised engines instead |
| a game play-test bot (TutorFlow pattern) | Azure Container Apps | fine (`server/forge3/qa-service.mjs`) [T] |
| a companion bond | safety floor | the bond is limited to warmth with boundaries; no romance or companion register; never deny being an AI; 1098 / 14416 |
| real-time action games | ₹10k phone | frame-time proof is owed (X6 / O-R4) |
| any reward mechanic | NEVER MANIPULATE | owner decision (§3.5) |

---

## 6. Screenshots (docs/research/round4/products/shots/)

All are WebP and under 50 KB. All were captured 2026-10-10 from https://sketchmind.ai/ in headless Chromium, not logged
in.

| file | what it shows |
|---|---|
| `sketchmind-1366-00-hero.webp` | hero: "Finally, a tutor that draws while it talks"; "LUMI, YOUR TUTOR, SPEAKS FIRST" |
| `sketchmind-1366-01-t1.5s-title-and-sketching-placeholder.webp` | demo at about 1.5 s: the title, and the figure placeholder "Picture this… SKETCHING…" |
| `sketchmind-1366-02-t3.4s-figure-then-caption-words.webp` | about 3.4 s: the figure drawn; caption words arriving ("See it? The ball never moved on its own — something") |
| `sketchmind-1366-03-t12s-final-takeaway-checkpoint-ahead.webp` | the final demo state: notes, TAKEAWAY, "Checkpoint ahead", FORMULA, table, caption |
| `sketchmind-1366-04-plan-first-and-checkpoint.webp` | "Talk. Watch. Ask.": the plan agreed first; the binary checkpoint card |
| `sketchmind-1366-05-notebook-three-views.webp` | "Built like a great teacher's notebook": voice in sync, three views, real maths, checkpoints, figures, your notes |
| `sketchmind-360-01-t2.4s.webp` | phone at 2.4 s: the title only; the figure below the fold; no caption |
| `sketchmind-360-02-t4.8s-ink-line-by-line.webp` | phone at 4.8 s: the notes inking line by line |
| `sketchmind-360-03-final.webp` | the phone's final state above the fold: no voice caption, figure below |
| `sketchmind-360-04-pricing-free-tier.webp` | the free tier: "2 lessons a day… Earn more lessons by learning" |

---

## 7. Sources

**SketchMind** (all fetched 2026-10-10): https://sketchmind.ai/ · https://sketchmind.ai/pricing/ ·
https://sketchmind.ai/support/ · https://sketchmind.ai/comparison/ · https://sketchmind.ai/about/ ·
https://sketchmind.ai/blog/how-lumi-paces-your-lesson/ · https://sketchmind.ai/blog/how-ai-tutoring-works/ ·
https://sketchmind.ai/blog/introducing-whiteboard/ · https://sketchmind.ai/blog/welcome/ ·
https://sketchmind.ai/families/in/ · https://sketchmind.ai/watch/ · https://sketchmind.ai/privacy-policy/ ·
https://sketchmind.ai/terms/ · https://sketchmind.ai/llms.txt · https://sketchmind.ai/sitemap-0.xml ·
https://sketchmind.ai/api/billing/plans?currency=INR

**Tutors and live visuals:** https://www.synthesis.com/tutor · https://at.trustpilot.com/review/www.synthesis.is ·
https://edworkingpapers.com/sites/default/files/ai26-1551.pdf ·
https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/ ·
https://blog.khanacademy.org/five-ways-khan-academy-is-making-student-practice-more-motivating/ ·
https://support.khanacademy.org/hc/en-us/articles/46935588089997 ·
https://blog.google/products-and-platforms/products/education/khan-academy-back-to-school/ ·
https://blog.khanacademy.org/new-ai-tools-bring-interactive-diagrams-and-targeted-practice-thanks-to-khan-academys-partnership-with-google-org/ ·
https://techcrunch.com/2026/03/10/chatgpt-can-now-create-interactive-visuals-to-help-you-understand-math-and-science-concepts ·
https://openai.com/index/new-ways-to-learn-math-and-science-in-chatgpt ·
https://blog.google/innovation-and-ai/products/gemini-app/3d-models-charts/ ·
https://www.producthunt.com/products/penseum/launches/penseum-2 · https://www.uniindia.com/news/pnn/story/3704639.html ·
https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm ·
https://blog.duolingo.com/video-call/ · https://blog.duolingo.com/how-duolingo-streak-builds-habit/ ·
https://www.speak.com/blog/live-tutor-lessons-powered-by-openais-gpt-live-1 ·
https://www.theneuron.ai/explainer-articles/hands-on-with-speaks-ai-language-tutor-stop-memorizing-words-and-start-building-micro-fluency/ ·
https://www.ello.com/blog/ai-should-make-clear-what-reality-is · https://www.ello.com/legal/ai-safety ·
https://www.edtech.com/jobs/ai-learning-designer-math-9381 · https://sigiq.ai · https://padhai.ai/ ·
https://yourstory.com/2025/04/edtech-sigiqai-9-million-seed-funding-gsv-ventures-peak-xv-ai ·
https://www.businesstoday.in/amp/technology/story/why-physicswallah-believes-it-can-beat-openai-google-in-indias-ai-tutor-race-534212-2026-06-01 ·
https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/ ·
https://www.microsoft.com/en-in/aifirstmovers/physicswallah ·
https://yourstory.com/2023/06/byjus-wiz-generative-ai-models-hyper-personalised-learning-edtech/ ·
https://www.business-standard.com/companies/news/allen-career-institute-acquires-ai-enabled-edtech-platform-doubtnut-123120400620_1.html ·
https://www.gauth.com/ · https://photomath.com/ ·
https://thejournal.com/articles/2025/04/30/ed-tech-startup-kira-launches-ai-native-learning-platform.aspx ·
https://kira-learning.com/about

**Games, worlds, manipulatives:** https://www.prodigygame.com/main-en/ · https://prodigygame.com/research ·
https://prodigygame.com/main-en/blog/ways-to-save-on-prodigy-memberships ·
https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/ ·
https://blog.brilliant.org/hand-crafted-machine-made/ · https://help.brilliant.org/en/articles/6399120-leagues-faq ·
https://brilliant.org/help/features/what-is-xp · https://mathigon.org/teachers ·
https://www.businesswire.com/news/home/20211013005759/en · https://apps.apple.com/us/app/-/id1550574547 ·
https://education.minecraft.net/de-de/blog/minecraft-education-at-iste ·
https://education.minecraft.net/en-us/blog/introducing-minecraft-education-s-ai-powered-lesson-crafter ·
https://about.roblox.com/education · https://corp.roblox.com/newsroom/2025/03/introducing-roblox-cube ·
https://tutorflow.io/features/games ·
https://prunderground.com/tutorflow-launches-ai-game-generation-from-a-single-sentence/cmt7haah3000704l7nqmf9trk ·
https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie/ ·
https://pirg.org/edfund/media-center/trouble-in-toyland-2025-a-i-bots-toxics-present-hidden-dangers-2/ ·
https://www.blackburn.senate.gov/services/files/A93BB07D-2743-48AF-9DC5-DF83F2553FFC · https://miko.ai/pages/about-us ·
https://www.povertyactionlab.org/evaluation/disrupting-education-evidence-technology-aided-instruction-india ·
https://apps.apple.com/us/app/id1541664545 · https://www.edzy.ai/

**Gamification evidence:** https://opus.bibliothek.uni-augsburg.de/opus4/files/109056/109056.pdf (Sailer & Homner
2020, read) · https://shura.shu.ac.uk/3556/ (Habgood & Ainsworth 2011) · https://joanganzcooneycenter.org/?p=16779 and
doi 10.3102/0034654315582065 (Clark et al. 2016) · doi 10.1037/a0031311 (Wouters et al. 2013) ·
doi 10.1016/j.compedu.2014.08.019 (Hanus & Fox 2015) · https://epub.ub.uni-muenchen.de/96762 (Bai et al. 2021) ·
doi 10.1145/2858036.2858062 (Birk et al. 2016) ·
https://webpages.tuni.fi/gamification/2018/09/20/badges-increase-user-activity-a-field-experiment-on-the-effects-of-gamification/
(Hamari 2017) · https://eprints.whiterose.ac.uk/139116/ (Zendle & Cairns 2018) · doi 10.1093/jcr/ucac029 (Silverman &
Barasch 2022) · PMID 10589297 (Deci, Koestner & Ryan 1999) ·
https://spiral.imperial.ac.uk/entities/publication/253c32f5-d124-4a23-88b5-9aaaf114608d (Kao et al. 2024)

**India gaming context:** https://www.ormaxmedia.com/data/library/In-digital-we-trust-urban-indian-kids-OrmaxMedia.pdf ·
https://gamedevreports.substack.com/p/sensor-tower-india-mobile-games-market ·
https://42matters.com/india-mobile-gaming-statistics ·
https://respawn.outlookindia.com/gaming/gaming-news/top-10-most-downloaded-mobile-games-in-india-in-2025 ·
https://www.techradar.com/news/bgmi-adds-parental-controls-restricts-gaming-time-to-3-hours ·
https://techcrunch.com/2023/08/30/garena-relaunches-free-fire-in-india-a-year-after-ban ·
https://respawn.outlookindia.com/gaming/gaming-news/free-fire-india-reports-ffmic-and-indias-ffws-2026-run ·
https://respawn.outlookindia.com/gaming/gaming-news/lumikai-india-gaming-market-1-5-billion-rmg-ban-2025

**Azure speech:** https://learn.microsoft.com/en-my/Azure/ai-services/speech-service/high-definition-voices
