# Non-verbal behaviour for the Taxila tutor: gaze, blinks, head, brows, smiles, listening, turn-taking, emotion

Date: 2026-10-02. Scope: everything the 3D tutor's face and head do **except the lips**. That covers when she looks
at the child, the module or away; how and when she blinks; nods and tilts; brow raises; smiles; how she listens
without making sound; idle life; five emotional states; and the cues that hand the floor to the child. The face is
driven by `gpt-realtime-2.1` over WebRTC. That gives a remote `MediaStream`, data-channel events and transcript deltas,
and **no visemes or timing marks**. It must run in Capacitor's Android WebView on ₹10k phones.

Builds on (read these first; this file does not repeat them):
- `web-3d-talking-heads.md`: three.js + TalkingHead 1.7 stack, RMS/HeadAudio lips, AEC-safe audio tap (§6), first face-state table (§7).
- `audio-to-face-ml.md`: `FaceFrame` protocol (§5.1), FaceCompositor priorities (§5.3), Director move → expression table (§6.1), prosody, autonomic and listening layers (§6.2–6.4).
- `character-creation.md`: MPFB base, stylisation levels, per-character `faceStyle`.
- `../design/lesson-arc.md` §4: the four floor states (YOUR TURN, LISTENING, THINKING, SPEAKING) and the Director's `handover` field.
- `../design/kids-ux-ages.md`: bands B1 6-7, B2 8-9, B3 10-12, B4 13-15; uncanny valley after about age 9.
- `../../harvest/companion-tech.md` §13: lip-sync on the playback clock, nothing heavy on the audio thread. Rejected #5: **no audio backchannels**.

This file adds:
- the literature on behaviour (ECA lineage, gaze, blink, nod and smile timing, nonverbal immediacy in teaching, children and the uncanny valley);
- **corrections** to three rules in the sibling docs;
- a **working behaviour-controller prototype** (`behaviour-proto/`) that runs scripted lessons and checks behaviour invariants;
- per-frame cost measurements.

Evidence tags:
- **[V]** I read it in the primary source this session (paper text, or code in a cloned repo).
- **[S]** secondary, or abstract-level, including citations carried over from sibling docs.
- **[R]** recalled from the literature. The DOI was resolved this session (Crossref) but the numbers were not re-read. Treat as [S] until checked.
- **[M]** measured here (`behaviour-proto/`, method in §8).
- **[I]** my inference or design choice.
- **[U]** unverified guess, to be tuned.

---

## 0. TL;DR: findings that change decisions

1. **On a phone, the head carries the behaviour and the eyes carry the contact [M, geometry §4.6].**
   - At a face height of 400 px (the L1 full-face layout), a 2° eye saccade moves the iris about 1 px. A 3° nod moves the chin about 10 px.
   - In the 160 px face tile of the L2/L3 layouts, eye micro-motion is invisible.
   - So budget the behaviour into head pitch, tilt and lean, and make **whole gaze shifts (≥8°)** meaningful. Run eye micro-saccades only when the face is large.
2. **Gaze aversion is a turn-taking tool, not decoration [V: Andrist et al. 2014; Ho et al. 2015].**
   - **Floor holding.** When a robot averted its gaze during a mid-speech pause, people waited **608 ms** before interrupting. With static gaze or badly timed aversions they waited 327–331 ms. The paper's text and its figure swap which arm is which.
   - **Yielding.** People begin speaking about 430 ms after the speaker looks at them. Mutual gaze is engaged **2.41 s** before a floor-passing utterance ends, with no aversions after that.
   - **Starting a turn.** Speakers start averted and return to direct gaze about 0.74–0.78 s into their turn.
   - **Thinking.** Cognitive aversions at the start of answers made the robot's answers rate as more thoughtful (p < .001 vs bad timing). Participants also waited longer before re-asking a question.
   - **For Taxila:** THINKING lasts about 2.1–2.4 s (lesson-arc §4). A cognitive aversion turns that gap from "lag" into "she is thinking". A direct gaze plus lean-in in the last ~2.4 s is the visual half of the YOUR TURN ring.
3. **Never nod while a child answers a closed question [I, from pedagogy + Greta/NVBG semantics].**
   - In a closed item, a listener nod reads as "correct". That leaks a verdict before her turn, which lesson-arc §4 forbids, and affirms wrong answers.
   - Silent continuer nods are allowed **only in open turns** (explanations, stories, teach-back) and only at child pauses.
   - This **narrows** `audio-to-face-ml.md` §6.4, which nods on every pause.
4. **Listening blinks must be short [V: Hömke, Holler & Levinson 2018, n=35].** In that study, nods with **long** listener blinks (607 ms vs 208 ms) made speakers give **significantly shorter answers** (β = −2.86, p = .044), and nobody noticed the manipulation. Taxila wants longer answers from children, so blinks during LISTENING and YOUR TURN stay ≤250 ms.
5. **THINKING must be verdict-neutral, and that exposes a one-turn lag in the face plan [I].**
   - The Director runs *off* the critical path (ARCHITECTURE §1.2), so a `face` program it arms with `session.update` applies to the **next** response, one turn late for praise or concern about *this* answer.
   - The controller therefore takes its valence for the current response from low-latency client sources, ranked by how fast they arrive:
     - a module answer checked against the verified key;
     - a praise-lexicon hit in **her own** transcript, placed on the playback clock;
     - the engine's `goal_met` payoff.
   - The Director's arm carries the slower *lesson* affect (curious, concerned, warm).
6. **TalkingHead's built-in liveliness has to be switched off, not tuned [V, `talkinghead.mjs`].**
   - Every frame it adds a random value of up to **0.2–0.4** (scaled by volume) to one of 20 face morphs, including `browDownLeft/Right` and `noseSneer*` (`mtRandomized`, l. 735, 2684). That reads as micro-frowns and sneers.
   - Its "misc" mood template randomly raises brows to 0.3 every 0.1–5 s.
   - Its blinks are uniform 1–8 s and its gaze is a coin-flip on eye contact.
   - The Taxila controller owns gaze, blink, brows and head. TalkingHead keeps breathing, pose, lips and rendering (§4.7).
7. **The evidence does not support "more expression = more learning".**
   - Pedagogical-agent meta-analyses give small gains (g ≈ 0.20). In them, **2D agents (g = 0.38) beat 3D (g = 0.11)** [V-abstract, via lesson-arc §1]. The owner's 3D choice therefore has to earn its keep through *behaviour quality*, not polygons.
   - Teacher nonverbal immediacy correlates strongly with *perceived* and affective learning (r ≈ .49) and only modestly with tested learning (Witt et al. 2004) [S].
   - Baylor & Kim 2009 titled their result "when less is more" [R].
   - **Design consequence:**
     - a hard **expressive budget**: at most one big expression per 30 s, and at most one praise smile per 5 turns, matching the voice's praise cap;
     - band scaling (B4 gets 55% of B1's amplitude);
     - a measured pass bar for "distracting" in E-B5.
8. **Uncanny risk for older children is a *behaviour* risk as much as a mesh risk.**
   - Children over about 9 find agents creepy when they seem to have human-like **minds** (Brink et al. 2019, n=240) [V-abstract].
   - Mismatched realism is eerie (Mitchell et al. 2011) [S].
   - Random gaze hurt a realistic avatar more than a cartoon one (Garau et al. 2003) [R].
   - **Consequence:** in B3–B4, keep emotion intensity low and contingency high, so that every movement has a reason.
   - The list of behaviours that read as uncanny is in §9.
9. **Hard cultural unknown: the Indian head wobble [U].** A lateral head roll often signals "yes / I'm following" in
   India, while a Western nod/shake vocabulary assumes pitch = yes and yaw = no. v1 uses **no head shakes at all**
   (low value, high ambiguity, and negative when correcting a child). A small roll-wobble continuer is a per-character option, set by a blind test with Indian children and parents (E-B6).
10. **The controller is cheap [M].**
    - 40 simulated lessons (234 min, 421k frames at 30 fps) on a 2.1 GHz Xeon: `update()` costs **p50 1.6 µs, p99 8.4 µs, p99.9 62 µs**.
    - Assuming a 3–6× slower phone core [U], that is still under 0.4 ms at p99.9, against a 33 ms frame.
    - An optional main-thread F0 estimator costs **p50 102 µs, p99 282 µs** per frame [M]. v1 drives prosody from RMS only; F0 is gated on a device measurement (E-B7).
11. **The invariants bite [M].** Six behaviour invariants (§8.2) pass on 40 seeds in bands B2 and B4. Each of **6/6 deliberate mutations** of the controller is caught by its invariant:
    - nodding on closed answers;
    - no verdict-neutral release;
    - no expressive budget;
    - no thinking aversion;
    - slow barge release;
    - no look-back on barge-in.

    Ship `sim.mjs` as a CI gate next to the echosim floor table. Behaviour that is not gated drifts.

---

## 1. Constraints this design is judged against

| constraint | source | consequence |
|---|---|---|
| No visemes or timestamps from the API; the remote audio is a `MediaStream` | brief | prosody comes from an `AnalyserNode` RMS tap; utterance end is *estimated* (§4.4) |
| Nothing on the audio thread; lips slaved to the playback clock | companion-tech §13 | the controller runs inside TalkingHead's rAF `update(dt)`, the same clock as the lips |
| No audio backchannels while the child speaks | rejected #5 (`backchannel`) | listening is **visual only**: nods, brows, gaze, stillness |
| No emotion recognition of the child or the tutor | rejected #8, GCL-10 | the face responds to **events and verified keys**, never to inferred affect |
| No verdict before her turn; one ring only in YOUR TURN | lesson-arc §4 rules 1, 6 | THINKING is neutral; the face cue for YOUR TURN must match the ring target |
| Praise caps: ≤1 praise token per 5 turns in practice; inflated praise reads as "not smart" | lesson-arc P5; discourse §0-9 [V] | the face's praise is praise too, so it gets the same cap |
| Sentence-shaped prompt text gets recited | inherited law | face control is an **enum + intensity** owned by the client, never in the voice model's instructions |
| ₹10k Android WebView, 30 fps cap | web-3d §9 | controller ≤0.5 ms/frame at p99 on device; no per-frame allocation beyond small objects |

---

## 2. What the evidence says, channel by channel

### 2.1 Embodied conversational agents: what to borrow

| system | what it is | what Taxila takes | what it leaves |
|---|---|---|---|
| **Cassell's REA and BEAT** (BEAT: Cassell, Vilhjálmsson & Bickmore 2001, doi:10.1145/383259.383315) [R] | text → nonverbal behaviour by rules over discourse structure (theme/rheme, new info → beat gesture + brow, turn end → gaze at listener) | the idea that **function, not form**, is the unit: "yield the turn" or "mark new information", realised differently per channel | XML pipelines over a full parse; we have no time-aligned text |
| **SAIBA: FML → BML → realizer** (Kopp et al. 2006; Vilhjálmsson et al. 2007) [R] | intent markup (FML) → behaviour markup (BML, with sync points start/ready/stroke/relax/end) → realizer | the three layers map 1:1 onto Taxila: **Director = intent**, **controller = behaviour planner**, **TalkingHead + compositor = realizer**. Adopt the sync-point vocabulary for envelopes | BML XML itself (needless parse and allocation on a phone) |
| **Greta** (Pelachaud group; `github.com/isir/greta`, Java, **GPL-3.0 on master, LGPL-3.0 on `master-lgpl`**, v2.0 June 2025, English and French only) [V, repo] | a full SAIBA agent with a **ListenerIntentPlanner** (rules map user signals to backchannels, `rulesfile.xml`) [V] | the rule shape [V]:<br>• user `silence`/`fall`/`rise`/`fall-rise`/`high` pitch signals map to backchannels with a probability (0.8–1.0);<br>• each backchannel is either **mimicry** or a **reactive** response (e.g. 0.6/0.4);<br>• `SILENCE_THRESHOLD = 2000` ms ("6000 … looks like a little bit long") [V];<br>• the gaze realizer's speed caps are eyes 150°/s, head 50°/s, torso 15°/s [V] | Java, GPL, desktop renderer. **Mimicry of the child's face is out**: there is no camera, and mimicry is emotion-adjacent |
| **NVBG rules** (USC ICT, bundled in Greta `bin/NVBG/.../nvb_rules.xsl`) [V] | word-class → behaviour templates | the semantic map [V]:<br>• affirmation → nod + brow raise;<br>• intensification → nod + frown;<br>• contrast → head to side + brow raise;<br>• response request → nod + brow raise;<br>• word search → tilt + brow raise + gaze away;<br>• negation → shake;<br>• question → brow raise. | English parse; Taxila uses only a tiny Hinglish lexicon on her own transcript (§4.3) |
| **Rapport Agent** (Gratch et al. 2007, doi:10.1007/978-3-540-74997-4_12) [R] | a listening agent that nods on speaker pauses and prosody and mirrors posture; **contingent** feedback beat non-contingent | contingency is the active ingredient: a nod tied to the child's pause beats a nod on a timer | posture mirroring (no camera) |
| **TalkingHead 1.7** (MIT) [V, source] | moods, blink templates, eye-contact coin flip, volume-driven head bobs | its rendering, breathing, pose and the `mtAvatar` interface | its random baseline jitter, `misc` brow template, uniform blinks and probabilistic gaze (§0-6, §4.7) |

### 2.2 Gaze

| finding | n and method | number | Taxila rule |
|---|---|---|---|
| Speakers end turns with direct gaze; the partner starts talking ~0.43 s after it. Speakers start turns averted, with direct gaze returning ~0.74–0.78 s after speech onset (Ho, Foulsham & Kingstone 2015, PLOS ONE) | 40 people, dual eye-trackers, 2 games | lag 423 ± 388 ms and 432 ± 557 ms; 780 ± 923 ms and 736 ± 724 ms [V] | re-gaze 0.75 ± 0.3 s into her turn; direct gaze held through the yield |
| Gaze-aversion model, from human dyads (Andrist, Tan, Gleicher & Mutlu 2014, HRI) | 48 people, 5-min dyads, coded | cognitive aversions: length 3.54 ± 1.26 s, starting 1.32 s before the event; intimacy aversions: 1.96 ± 0.32 s every 4.75 ± 1.39 s (speaking), 1.14 ± 0.27 s every 7.21 ± 1.88 s (listening); floor aversions: 2.30 ± 1.10 s, ending 1.27 s after the next utterance starts; mutual gaze from **−2.41 s** before a floor-passing end. Cognitive aversions mostly go **up**, intimacy and floor aversions **sideways** [V] | §4.2 schedulers use these distributions directly |
| …the same model on a robot | 30 people, 3 tasks | **floor holding**: waited 608 ms before interrupting vs 327–331 ms (static gaze, bad timing), p < .001. **Thoughtfulness** ↑ vs bad timing (p < .001) and vs static (p = .005). People waited longer before re-asking (p = .017, .041). **Listening aversions did not change disclosure** (p = .735, .972) [V] | floor and cognitive aversions earn their place; listening aversions are kept rare and are pointed at the **module** (shared attention), not into empty space |
| Children's gaze aversion while thinking (Doherty-Sneddon et al. 2002, *Dev. Psych.* 38:438) | 25 eight-year-olds, 26 five-year-olds, Q&A with an adult | 8-year-olds averted 52% vs 39% for 5-year-olds; by phase **listening 26%, thinking 76%, speaking 32%**; aversion rose on hard questions for 8-year-olds only [V] | a child looking away is **normal thinking**, not disengagement. During YOUR TURN silences she softens her gaze and looks at the module; she never stares the child down |
| Averting gaze from faces improves recall on hard questions (Glenberg et al. 1998) | adults | [S] | the same reason: her stare costs the child effort |
| Gaze realism must match visual realism (Garau et al. 2003, CHI) | dyads with avatars | random gaze hurt the more realistic avatar [R] | no random gaze anywhere; every shift has a function label in the log |
| Mona Lisa effect: on a flat display, a frontal face gaze reads as eye contact from any viewing angle (Al Moubayed et al. 2012) [R] | perception studies | — | "look at child" = look down the camera axis; reliable on phones |
| Learners follow an instructor's gaze to the referenced part of a slide (video-modelling studies, e.g. Ouwehand, van Gog & Paas 2015) [R] | eye-tracking | — | look at the module **when she talks about it** (Director `show module`, `highlight`), then come back |

### 2.3 Blinks

| finding | number | rule |
|---|---|---|
| Rates: rest 17/min, conversation 26/min, reading 4.5/min (Bentivoglio et al. 1997, n=150) [S] | — | per-state targets in `DEFAULTS.blinkPerMin`; gaze on the module uses a reading-like low rate (10/min) |
| Listeners blink 0.25–0.5 s after a *speaker's* blink, and only at pauses and utterance ends (Nakano & Kitazawa 2010) [V-abstract] | — | her blinks fall **on phrase boundaries** (≥150 ms pause), so blinks become part of the prosody |
| Long listener blinks (607 ms) shorten the speaker's answers vs short ones (208 ms) (Hömke et al. 2018, n=35, VR) [V] | β = −2.86, p = .044 | listening blinks ≤250 ms; no "slow blink" while the child is speaking |
| Large gaze shifts evoke blinks (gaze-evoked blinking) [R] | — | blinks are advanced to gaze shifts >15° with p 0.6 |
| TalkingHead: uniform 1–8 s delay, 85% single, 15% double, 250–450 ms long [V] | — | replaced with gamma inter-blink intervals (k=3), a 250 ms total blink, and 12% doubles |

### 2.4 Head motion and nods

- **Head motion tracks prosody.** Sentence-level head motion correlates with MFCCs at r ≈ 0.8 (Busso et al. 2007) [S].
  - **Rule:** on her speech, add a nod impulse on energy accents: 1.5–3° pitch, damped spring k 120, ζ 0.6, refractory 350 ms.
- **Volume-driven head movement is already in TalkingHead** [V]. It raises the head on new volume maxima with p 0.4, but only when its coin-flip `isEyeContact` is true.
  - **Rule:** replace it with the accent detector, so the motion is deterministic given the audio.
- **Shakes.** NVBG maps negation → shake [V]. In Indian conversation the lateral wobble/roll often means "yes/ok", so shake vs wobble is ambiguous [U].
  - **Rule:** no shakes in v1. A corrective "nahi" from a teacher already carries the meaning in the voice; a shake adds a scold.
- **Tilt.** A head tilt of 3–8° is the classic interest/listening signal [R].
  - **Rule:** listening tilt 4° toward the child; curious 6°; concerned 5°. The tilt eases over 400 ms and never snaps.
- **Lean-in.** Forward lean is a core nonverbal-immediacy cue (Mehrabian; Andersen) [R]. In the head-and-shoulders view, lean is shown as head pitch −3° plus a slight forward translation.
  - **Rule:** lean-in on YOUR TURN entry, half-release on LISTENING, release on THINKING.

### 2.5 Eyebrows

- **Brow flashes and pitch.** About 71% of rapid brow rise-falls coincide with F0 rises (Cavé et al. 1996) [S]. But in task dialogue, brow raises cluster at the **start of discourse segments and instructions** more than on questions, and line up only weakly with pitch accents (Flecha-García 2010) [R].
  - **Rule:** the reliable brow flash is at the **start of each new move** (first ~300 ms of her response).
  - Accent-locked flashes are rare: p 0.35 on strong accents, refractory 1.2 s.
- **Questions.** A brow raise on questions is grammatical in sign languages, not in Hindi or English speech [R].
  - **Rule:** for a question hand-over, the "expectant" face is **direct gaze + held small brow raise (0.14) + lean-in**. It starts at the yield point and holds into YOUR TURN.
- **Concern.** Concern comes mostly from `browInnerUp` (AU1). An oblique brow at AU1 > 0.35 reads as *sad*.
  - **Rule:** cap concern at 0.30 AU1 + 0.06 AU4. A sad teacher face after a child's mistake is shaming, so it is banned.

### 2.6 Smiles

- **Dynamics decide whether a smile reads as genuine.** Smiles with slower onsets and offsets and shorter apexes were judged more genuine (Krumhuber & Kappas 2005, *J. Nonverbal Behav.*, doi:10.1007/s10919-004-0887-x) [R]. Dynamics matter more than the AU6 cheek raise (Krumhuber & Manstead 2009) [R].
  - **Rule:** a cosine onset of 350–700 ms, apex hold 1.2–1.8 s, offset 700–1000 ms. Never a step change.
  - The `cheekSquint`/`eyeSquint` share rides with the smile, at about 0.4–0.6 of its amplitude.
- **Praise inflation is real.** 79% of children aged 10–13 judged an inflated-praise recipient as less able (discourse §0-9) [V].
  - **Rule:** the "proud" face at intensity ≥2 obeys the same ≤1-per-5-turns cap as spoken praise. Extra cues are demoted to a warm smile.
- **Resting face.** A permanent big smile is a mask. A resting `mouthSmile` of 0.08–0.15 (per character) reads as warmth [I].

### 2.7 Listening without sound

- **Where backchannels go.** Listener backchannels in English and Japanese are cued by a region of low pitch after the speaker has been talking for a while (Ward & Tsukahara 2000, doi:10.1016/s0378-2166(99)00109-5) [R].
- **Greta's rules.** Its listener fires on `silence`/`fall`/`rise` signals [V].
- **Taxila's rule:**
  - A **visual** continuer nod (2.5°, single, no sound) fires when the child pauses ≥300 ms after ≥0.7 s of speech, with p 0.5 and a refractory period of 3 s.
  - It fires **only when `handover = open`**.
  - It needs a local analyser tap on the child's mic track (passive; it never touches the uplink, the AEC path or the floor logic).
  - In the sim this gives about 1.0 nod per open turn (4–9 s turns) [M].
- **Why not the rejected audio backchannel's problem?** The audio version needed a mic hold, and digital silence on the uplink ends the turn (rejected #5). A nod changes nothing on the audio path.
  - The remaining risk is purely perceptual: nods read as impatience if too frequent [U], or as "correct" on closed items [I]. Hence the open-only gate and E-B2.

### 2.8 Teaching evidence: what nonverbal behaviour buys

| claim | evidence | consequence |
|---|---|---|
| Teacher immediacy (smiles, gaze, lean, vocal variety) raises *perceived* and affective learning, with a weaker link to tested learning | Witt, Wheeless & Allen 2004 meta-analysis, r ≈ .49 affective [S] | warmth is for motivation and persistence; don't promise score gains from the face |
| Pedagogical agents help a little; **2D > 3D**; K-12 benefits more; system-paced settings more | Castro-Alonso et al. 2021; Noetel et al. 2022; Schroeder et al. 2013 [V-abstract, lesson-arc §1] | 3D must not cost attention. Behaviour must be *legible* and *sparse* |
| An agent with human-like gesture, gaze, expression and movement → better transfer than a static one (the "embodiment principle") | Mayer & DaPra 2012 [R] | the static-with-lips baseline is not enough: gaze and head must be contingent |
| Adding every nonverbal channel is not additive; the useful channel depends on the learning outcome | Baylor & Kim 2009, "when less is more" [R] | the expressive budget; module-deictic gaze is prioritised over emotional display during procedural steps |
| Gaze aversion makes an agent's pauses read as thinking | Andrist 2014 [V] | THINKING aversion is the cheapest latency mask available |

### 2.9 Children and the uncanny valley

- **Under ~9 (B1–B2):** children don't find human-like agents creepy. The risk is believing she is real (kids-ux §11).
  - Expressiveness can be high: cartoon-scale smiles, a big brow flash at a reveal.
  - Disclosure stays concrete and verbal, never through the face.
- **Over ~9 (B3–B4):** creepiness follows perceived *mind* (Brink et al. 2019) [V-abstract]. Strong emotional displays claim a mind.
  - Intensity is scaled down to 0.7 (B3) and 0.55 (B4). Behaviour stays tightly contingent.
  - Teens also reject "babyish" exaggeration (NN/g via kids-ux §0-9) [V].
- **Behavioural uncanny, independent of the mesh:**
  - dead eyes (no saccades, no lid-follow);
  - metronome blinks;
  - perfect symmetry;
  - a frozen face during latency;
  - a smile that snaps on or off;
  - nodding that ignores the speaker;
  - lip–expression conflict (smiling lips that fail to close on प/ब/म);
  - head and eyes moving in lock-step.

  Each one is designed out in §4 and listed as a test in §9.

---

## 3. Design rules (each one maps to code in `behaviour-proto/controller.mjs`)

1. **Every movement has a function label** in the log: `contact`, `yield`, `cognitive:up`, `floor:side`, `module:watch`, `shared-attention`, `ring:module`, `listen-nod`, `phrase` blink, and so on. Nothing is random in *whether* it happens, only in its exact timing.
2. **The floor state is the master switch.** It comes from link and module events, never timers, and it is the same state the UI rings show (lesson-arc §4).
3. **The face never delivers a verdict before her voice does.**
   - THINKING releases any expression within 300 ms.
   - No nods on closed answers.
   - The only exception is a payoff the engine has already revealed (`goal_met`).
4. **Yield with the eyes.**
   - No aversions in the last `yieldLeadS` = 2.41 s of a floor-passing turn.
   - A direct gaze, a held small brow and a lean-in on YOUR TURN.
   - If the hand-over target is the module (`try`), gaze goes to the ringed module first, then checks back with the child.
5. **Hold the floor with the eyes.** In a mid-turn pause ≥150 ms, avert sideways with p 0.35. Return 1.27 ± 0.51 s after she resumes.
6. **Think with the eyes.** In THINKING, a cognitive aversion starts 0.3 ± 0.1 s after the child stops, mostly upward and capped at 3.5 s. She re-gazes 0.75 ± 0.3 s after her own speech starts.
7. **Don't stare at a thinking child.**
   - In YOUR TURN silence and LISTENING, gaze breaks go to the **module** (shared attention), not to empty space.
   - Drift and stillness: head drift ×0.5 in YOUR TURN and ×0.7 in LISTENING.
8. **Blinks are prosody.**
   - Gamma intervals at the per-state rate. An event blink *advances* an imminent scheduled blink to a phrase boundary or gaze shift instead of adding one.
   - Listener blinks stay short.
   - On a state change, the pending interval is time-warped, never redrawn (redrawing silently halved the rate in short states, §8.3).
9. **Expressions have envelopes.**
   - Cosine attack, hold and release, per emotion (§4.3).
   - A per-character fixed L/R asymmetry of ±6%.
   - Emotion never attenuates `jawOpen`, and a bilabial closure scales smiles by 0.4 (FaceCompositor priority, sibling §5.3).
10. **Budget and band-scale everything expressive.**
    - Big expression = scaled intensity ≥0.6. At most 1 per 30 s; extras are demoted to 0.45, not dropped.
    - Praise ≥2 at most 1 per 5 turns.
    - Band scale: B1 1.0, B2 0.9, B3 0.7, B4 0.55.
11. **No head shakes, no sad face, no mimicry, no emotion recognition.**
12. **Level of detail by on-screen face size** (§4.6). Below 220 px face height: no micro-saccades, gaze shifts ≥10°, nods ×1.3.

---

## 4. The controller

### 4.1 Architecture

```
          Director (server, per turn)                 ModuleHost (iframe bridge)
  arm({emotion,intensity,handover}) ─┐        mount/param_change/answer/goal_met/idle ─┐
                                      ▼                                                ▼
 data channel ──► LinkAdapter ──► ┌──────────────────────────────────────────────────────────┐
 (output_audio_buffer.started/    │ BehaviourController (main thread, inside TalkingHead's   │
  stopped/cleared, input_audio_   │ rAF update(dt), ≤30 fps; the same clock as the lip driver)│
  buffer.speech_started/stopped,  │  FloorFSM: idle│speaking│yielding│your_turn│listening│   │
  response.output_audio_          │            thinking  (+ barge transient)                  │
  transcript.delta/done) ────────►│  TurnClock: est. remaining = chars/cps − elapsed          │
                                  │  Affect: emotion envelope, budget, band scale             │
 remote MediaStream ─► Analyser ─►│  Prosody: fast/slow RMS → accents, pauses                 │
 (her voice; NOT to destination)  │  Schedulers: Gaze │ Blink │ Head(spring) │ Brow │ Lean     │
 mic track ─► Analyser (passive) ►│  Listen: continuer nods (open turns only)                 │
                                  └───────────────┬──────────────────────────────────────────┘
                                                  ▼  upper-face bs + head[p,y,r] + gaze[y,p] + lean
                         FaceCompositor (sibling §5.3) ◄── lip layer (RMS jaw + HeadAudio shapes)
                                                  ▼
                                   TalkingHead mtAvatar / bones  (later: any FaceFrame renderer)
```

**SAIBA mapping:**
- The Director produces *intent*: the move, the hand-over type and the lesson affect.
- The controller is the *behaviour planner*.
- The compositor plus TalkingHead are the *realizer*.

The output is the renderer-agnostic `FaceFrame` (sibling §5.1), so a later Gaussian head or video avatar consumes the same behaviour.

### 4.2 Floor states and their behaviour programme

| state | entered on | gaze | blinks/min | head | brows / mouth | lean |
|---|---|---|---|---|---|---|
| **idle** | session start; `output_audio_buffer.stopped` with `handover=chain` | contact 1.14 s breaks every 7.2 s (to the module if one is mounted) | 17 | drift 1° | resting baseline | 0 |
| **speaking** | `output_audio_buffer.started` (the first audio *played*) | starts averted if coming from THINKING; re-gaze at 0.75 s; intimacy aversions 1.96 s / 4.75 s; floor aversions in pauses | 26 (phrase-locked) | accent nods 1.5–3°; drift 1.5°; gaze-follow 30% (more past 15°) | **brow flash at move start**; armed emotion fires here | 0 |
| **yielding** | TurnClock remaining < 2.41 s and `handover ≠ chain` | **direct, no aversions** | 20 | nods continue | held brow 0.14 if hand-over is a question | 0 → |
| **your_turn** | `output_audio_buffer.stopped` with `handover ≠ chain` | at the ring target: the child (mic or choice) or the module (`try`, 2.5 s, then checks back); module glances 1.14 s every 7.2 s | 18, short | stillness ×0.5 | brow held from yield; on `idle` from the module: soft brow 0.12 + look at the child | **1 (lean-in)** |
| **listening** | `input_audio_buffer.speech_started` | contact; breaks only to the module | 18, **≤250 ms** | tilt 4°; stillness ×0.7; **continuer nods only if `open`** | `browInnerUp` +0.08 (attentive) | 0.5 |
| **thinking** | `input_audio_buffer.speech_stopped`; module `answer` | **cognitive aversion** at +0.3 s, up 45% / side 35% / down 20%, ≤3.5 s | 22 | drift | **expression released in 300 ms (verdict-neutral)** | 0.2 |
| *barge* (transient) | `speech_started` during speaking/yielding | to the child at once (33–36 ms in the sim [M]) | — | nod velocity zeroed | release in 200 ms; brow 0.15 "oh?" | → 0.5 |

**Notes:**
- **THINKING > 3.5 s.** The aversion ends and gaze returns to the child with no expression. The UI's 4 s "one moment" escalation (lesson-arc rule 3) takes over. A face that keeps "thinking" for 8 s reads as broken.
- **YOUR TURN escalation (4 s / 6 s).** The face does not escalate. No impatience markers: no sigh, no posture shift, no "well?" tilt. The re-entry is verbal and narrows the question (lesson-arc rule 4).

### 4.3 Emotions (shapes, not lines)

ARKit deltas are given at full intensity before band scaling. Envelope = attack/hold/release in ms.

| emotion | when | face | head | contact | envelope |
|---|---|---|---|---|---|
| **warm** | greeting, rapport, `koi baat nahi` reassurance, hint steps 1–2 | `mouthSmile` 0.28, `cheekSquint` 0.12, `eyeSquint` 0.10 | tilt 2°, gain 0.9 | 0.70 | 600 / 1500 / 900 |
| **curious** | probe, predict, error-spot, child's surprising answer, "let's find out" | `browInnerUp` 0.28, `browOuterUp` 0.22, `mouthSmile` 0.08 | tilt 6° | 0.85 | 350 / 1800 / 700 |
| **excited** | `goal_met` payoff, prediction resolved, reveal | `mouthSmile` 0.55, `cheekSquint` 0.35, `eyeSquint` 0.2, `browOuterUp` 0.25, `eyeWide` 0.12 | gain 1.35 | 0.70 | 350 / 1200 / 900 |
| **concerned** | Director affect counters: pata-nahi loop, "I can't", hint step 3+ | `browInnerUp` 0.30, `browDown` 0.06, `mouthPress` 0.12. **Not sad** | tilt 5°, gain 0.7 (slower) | 0.75 | 700 / 2500 / 1200 |
| **proud** | effortful success: solved after hints, teach-back done, first-time mastery | `mouthSmile` 0.45, `cheekSquint` 0.32, `eyeSquint` 0.22 + **one slow nod** | tilt 3° | 0.85 | 550 / 1600 / 1000 |

**Where the valence comes from, by latency.** This is the fix for the one-turn lag (§0-5).

| source | latency | used for |
|---|---|---|
| module `answer` checked client-side against the verified key (kits carry blind-solved keys) | ~0 ms | arming `proud`/`warm` (correct) or `curious` (wrong: the error is information about the step, discourse §298) for **this** response; fires at `output_audio_buffer.started` |
| praise lexicon in **her** transcript deltas: *shabash, bahut badhiya, wah, bilkul sahi, perfect, well done* → `cue('proud' or 'warm')`; *socho, kya lagta hai* → `curious`; *chalo* → excited at 1 | delta lead over audio is [U] (sibling E-8) | placed at `speakT0 + charOffset/cps − leadComp`. Additive, capped, and obeys the praise cap |
| engine `goal_met` | ~0 ms | `excited` 2, even in THINKING (the engine already revealed the outcome) |
| Director arm (`session.update` side channel) | one turn | lesson affect (`concerned` after a loop), move-level `curious` for probes, the `handover` type |

### 4.4 TurnClock: knowing when she is about to finish

There are no audio timestamps, so the end of her turn is estimated.
- `response.output_audio_transcript.done` arrives well before playback ends (generation runs ahead of real-time playback) [U].
- remaining ≈ `totalChars / cps − (now − speakT0)`, where `cps` is calibrated per voice. The default is 13.5 chars/s for Hinglish at ~150 wpm [U].
- `output_audio_buffer.stopped` is the ground truth and always wins.
- Sim [M]: with the true voice rate ±15% off calibration, mutual gaze was held **≥1.0 s before every floor-passing end (0/670 failures)**, with a median of 3.1 s.
  - A slower-than-calibrated voice yields **early**, which is harmless: longer contact.
  - A faster one yields late. That is bounded by `stopped`, but the hand-over then loses its gaze cue. Calibrate `cps` per voice from logged `transcript chars / playback seconds` (E-B3).

### 4.5 Module events

| event (bridge) | behaviour |
|---|---|
| `mount` / Director `show module` | gaze and head to the module for 0.6–0.9 s, brows up a little, then back (joint attention) |
| host `highlight` cmd | gaze to the highlighted element's direction for the length of the reference (her word about it); the deictic cue |
| `param_change` (child manipulating) in YOUR TURN | **watch** the module 1.6 s per change; no nods, no smile (no verdict); low reading-like blink rate |
| `answer` (commit) | → THINKING (verdict-neutral) |
| `goal_met` | `excited` 2, subject to the budget |
| `idle` (child inactive in module) during YOUR TURN | look back at the child + soft brow 0.12 (an invitation, not impatience) |
| `error` | nothing on the face; the UI handles it |

### 4.6 Gaze geometry and level of detail on a phone

The avatar lives "behind the glass". To look at the module, she must look toward its **on-screen** position:

```ts
// faceRect, moduleRect: DOM rects in CSS px. D = virtual eye-to-glass distance in px (≈1.2 × face height) [U]
function moduleDir(faceRect: DOMRect, moduleRect: DOMRect): [number, number] {
  const ex = faceRect.x + faceRect.width / 2, ey = faceRect.y + faceRect.height * 0.42;     // eye line
  const mx = moduleRect.x + moduleRect.width / 2, my = moduleRect.y + moduleRect.height / 2;
  const D = 1.2 * faceRect.height, deg = 180 / Math.PI;
  return [Math.atan2(mx - ex, D) * deg, Math.atan2(my - ey, D) * deg];                     // [yaw, pitch]
}
// call on layout change (ResizeObserver), not per frame: controller.setModuleDir(...moduleDir(f, m))
```

**Visibility arithmetic** [M, geometry; I, the stylised factor]:
- Iris displacement ≈ r·sin θ.
- A real eyeball radius is about 12 mm on a ~230 mm face, ≈ 0.052 × face height H. Stylised MPFB eyes are about ×1.4, so r ≈ 0.073 H.

| face height H | 2° eye | 5° eye | 10° eye | 3° head nod (chin, pivot ≈ 0.5 H) |
|---|---|---|---|---|
| 400 px (L1 full face) | 1.0 px | 2.5 px | 5.1 px | ≈ 10 px |
| 160 px (L2/L3 tile) | 0.4 px | 1.0 px | 2.0 px | ≈ 4 px |

**LOD rule:**
- Below H = 220 px, drop micro-saccades.
- Make every gaze shift at least 10° and carry 50% of it in head yaw.
- Raise nod gain ×1.3.

This also saves the per-frame cost of eye bone updates.

### 4.7 Integrating with TalkingHead 1.7 (what to switch off)

```js
// once after showAvatar(): give the face to the controller
head.mtRandomized = [];                                   // kill per-frame random morph jitter (l. 735/2684)
const keep = new Set(['breathing', 'pose']);              // drop 'head','eyes','blink','mouth','misc' templates
for (const m of Object.values(head.animMoods)) m.anims = m.anims.filter(a => keep.has(a.name));
head.animMoods.taxila = { baseline: { ...tutor.rest.baseline }, speech: { deltaRate: 0, deltaPitch: 0, deltaVolume: 0 },
  anims: head.animMoods.neutral.anims };
head.setMood('taxila');
head.opt.avatarIdleEyeContact = head.opt.avatarSpeakingEyeContact = 0;   // no coin-flip eye contact
// per frame, inside head.opt.update(dt) after lips.update(dt):
const f = behaviour.update(dt, { herRms: lips.rms, childRms: mic.rms });
compositor.apply(f);       // writes mtAvatar[k].newvalue / needsUpdate, eye + head bones, honours lip priority
```

These hooks were read from the source [V]. Whether `animMoods` filtering is stable across TalkingHead updates is [U]: pin the version and keep the vendored-patch list (web-3d §5.5). Three more notes:
- The random morph jitter only runs in `upper`/`head` views or `avatarOnly` mode. Those are exactly Taxila's views.
- The volume-driven head bob only runs while an `eyes` template has set eye contact, so removing that template disables the bob.
- `streamStart()` calls `lookAtCamera(500)` and the `speakText` paths call `speakWithHands()`. Taxila uses neither, because lips come from its own driver (web-3d §6.2). If anyone switches to TalkingHead's streaming API, stub both.

Re-verify all of this after any upgrade.

### 4.8 Per-character style and per-band scaling

Character style is data in the character manifest (web-3d §8, `character-creation.md` `faceStyle`):

```json
"behaviour": { "restSmile": 0.10, "blinkPerMin": { "speaking": 24 }, "headGain": 1.0, "nodGain": 0.8,
  "tiltBias": 1.5, "browGain": 1.0, "avertSide": "left", "wobble": false, "asymSeed": 17 }
```

- An older "Dadaji" storyteller: headGain 0.7, slower envelopes (+30%), more downward aversions, restSmile 0.12.
- A young "Bhaiya": headGain 1.2, nodGain 1.1, brow flash p 0.45.
- A friendly robot for B1: blink replaced by an "LED dim", aversions shorter, headGain 1.3. Being non-human, it carries less uncanny risk; Brink's finding is about human-like minds.
- Band scale multiplies **every** expressive amplitude but **not** gaze or turn-taking timing. Yielding and floor cues are structural, not decorative.

---

## 5. Director moves → behaviour (refines sibling §6.1)

`handover` values follow lesson-arc: `closed` (item answer), `open` (explain, teach-back, story), `choice` (tiles),
`try` (module), `chain` (she continues).

| Director move | armed emotion (intensity) | handover | the moment that matters |
|---|---|---|---|
| continue + praise (correct) | **from the key or lexicon, not the Director**: proud 2 or warm 1 (praise cap) | per next item | smile onset on her praise word; one slow nod |
| probe (why-after-correct, predict, contrast) | curious 1 | `open` | brow flash at move start; yield gaze + held brow; continuer nods allowed |
| hint ladder 1–2 | warm 1 | `closed` | soft; a nod on the hint word (accent) |
| hint 3+, pata-nahi loop | concerned 1 | `choice` (narrowed) | slower head; never sad; gaze to the tiles at the yield |
| re-teach, different representation | curious 1 | `try` | gaze to the module at the re-frame, back at the question |
| show module | curious 1 | `try` | mount glance 0.6–0.9 s; ring:module gaze at YOUR TURN |
| retrieval / teach-back | warm 1 | `open` | stillness; lean-in; nods at the child's pauses |
| FLIP (her planted error) | warm 1 | `open` | she "commits" with a confident face, then curious when the child objects. No wink (it gives the error away) |
| break / wrap-up | warm 2 (bounded by the budget) | `chain` / `choice` | relaxed; namaste gesture where the character has one |
| child barge-in | — | — | stop, look, "oh?" brow; never annoyance |

---

## 6. Wiring (client)

```ts
const C = createBehaviourController({ band: child.band, style: tutor.behaviour, seed: tutor.asymSeed, cps: tutor.voice.cps });
dc.onmessage = ({ data }) => {
  const e = JSON.parse(data);
  switch (e.type) {
    case 'output_audio_buffer.started': case 'output_audio_buffer.stopped': case 'output_audio_buffer.cleared':
    case 'input_audio_buffer.speech_started': case 'input_audio_buffer.speech_stopped': C.onLink(e.type); break;
    case 'response.output_audio_transcript.delta': lexicon.feed(e.delta, C); break;   // praise/curious cues on HER words
    case 'response.output_audio_transcript.done': C.onTranscriptDone([...e.transcript].length); break;
  }
};
director.onTurnPlan((plan) => C.arm({ emotion: plan.face?.emotion, intensity: plan.face?.intensity, handover: plan.handover }));
moduleBridge.on((ev) => { if (ev.event === 'answer') { const ok = kit.check(ev.payload); C.arm({ emotion: ok ? 'proud' : 'curious', intensity: ok ? 2 : 1, handover: 'closed' }); } C.onModule(ev.event); });
new ResizeObserver(() => C.setModuleDir(...moduleDir(faceEl.getBoundingClientRect(), modEl.getBoundingClientRect()))).observe(stageEl);
```

- `arm()` from a module answer overrides the Director's arm for **this** response only. The Director's plan arrives later and arms the next one.
- Arm calls are idempotent per response id in production. The prototype simplifies this.
- The child-mic analyser is `ctx.createMediaStreamSource(localStream)` → `AnalyserNode`. It is never connected to `destination`, and it touches neither the uplink track nor any floor logic.
- **[U] Confirm on device that the passive tap changes nothing in Chromium's AEC/AGC (E-B8).**

---

## 7. What the sibling docs said that this changes

| sibling rule | change | why |
|---|---|---|
| `audio-to-face-ml.md` §6.4: "one small nod on each child pause > 300 ms, max 1 per 3 s" | **open turns only**; never on closed or choice answers | a nod is an affirmation (NVBG affirmation → nod [V]) and leaks a verdict |
| `audio-to-face-ml.md` §6.1: Director `face` field fires on the next `output_audio_buffer.started` | keep it for lesson affect; **valence for the current answer comes from the key, the lexicon or `goal_met`** | the Director is off the critical path, so its arm is one turn late |
| `web-3d-talking-heads.md` §7: thinking aversion 400–900 ms | aversion **starts** +0.3 s after the child stops and **lasts** until 0.75 s into her speech (≤3.5 s) | Andrist cognitive aversion length 3.54 s; Ho re-gaze ~0.75 s [V] |
| `web-3d-talking-heads.md` §7: idle eye contact ≈ 0.4 via TalkingHead options | TalkingHead eye-contact and random templates **off**; gaze is scheduled by function | TalkingHead's coin-flip gaze and jitter are random motion [V] |
| `audio-to-face-ml.md` §6.3: micro-saccades 0.5–1° | 1.5–3°, and only when the face is ≥220 px tall | sub-pixel at phone size (§4.6) |
| `audio-to-face-ml.md` §6.3: blinks biased to boundaries | advance, don't add; time-warp on state change | measured rate inflation and deflation (§8.3) |

---

## 8. Prototype and measurements [M]

### 8.1 Method

- **Code.**
  - `behaviour-proto/controller.mjs` is the controller (256 lines, no dependencies, seeded RNG).
  - `behaviour-proto/sim.mjs` drives it through **40 seeded lessons × 18 turns**. Turn kinds are drawn from closed, open, try, praise and barge.
- **Her speech.** A synthetic RMS envelope:
  - 4.5 Hz syllables;
  - 200–500 ms phrase pauses every 1.5–3 s;
  - 12% accents ×2.4.
- **The child.**
  - Closed answers are 1.4–2.6 s long with one 450 ms hesitation.
  - Open turns are 4–9 s with a pause every 2.2 s.
- **Frames.** 30 fps with ±3 ms rAF jitter.
- **Voice rate.** The true rate is ±15% off the calibrated `cps`.
- **Machine.** Node 22.22, Intel Xeon 2.1 GHz.
- **Reproduce:**
  - `node sim.mjs 40 B2`
  - `node sim.mjs 40 B4`
  - `node f0bench.mjs`

  Outputs are saved in `behaviour-proto/sim-B2.txt` and `sim-B4.txt`.

### 8.2 Results (B2, 40 seeds, 421,161 frames = 234 min)

| metric | result | target / source |
|---|---|---|
| `update()` cost | **p50 1.59 µs, p99 8.35 µs, p99.9 61.8 µs** (B4: 1.51 / 7.16 / 75.8) | ≤0.5 ms p99 on device [U ×3–6 phone factor] |
| blinks/min, speaking | 29.1 | 26 (Bentivoglio): +12%, from phrase and gaze advancing near the boundary |
| blinks/min, listening / thinking / your_turn / yielding / module gaze | 17.7 / 22.0 / 16.5 / 22.5 / 17.5 | 18 / 22 / 18 / 20 / 10. Module is high because glances are short and gaze-evoked blinks cluster on entry [I] |
| THINKING aversion onset after the child stops | p10 0.20, p50 0.33, p90 0.46 s; 720/720 present | 0.3 ± 0.1 s |
| re-gaze after her speech onset | p10 0.23, p50 0.77, p90 1.19 s | 0.74–0.78 s (Ho 2015) |
| mutual gaze held before a floor-passing end | p10 1.84, p50 3.09 s; **<1.0 s in 0/670** | ≥ ~2.4 s nominal (Andrist) |
| aversion lengths (mean) | cognitive 3.05 s (capped 3.5), intimacy 1.96 s, floor 2.19 s, shared-attention 1.10 s | 3.54 / 1.96 / 2.30 / 1.14 s |
| continuer nods in open turns | 1.01 per turn (106 turns) | no human target exists for child turns; tune in E-B2 |
| barge-in: gaze to the child / expression released | 33 ms p50 (max 36) / 156 ms p50 (max 171) | ≤1 frame / ≤300 ms |
| max smile in THINKING before any reveal | 0.000 | ≤0.05 |

**Invariants, all passing (B2 and B4):**
- I1: verdict-neutral THINKING.
- I2: no nod on a closed answer.
- I5: big-expression budget.
- I6: thinking aversion present and on time.
- I7: barge gaze ≤100 ms and release ≤300 ms.

**Mutation check.** Each mutation below was applied to a copy of the controller, with the sim run on 20 seeds. **6/6 were caught**, each by its intended invariant:

| mutation | caught by |
|---|---|
| `nod-any` (nod in every turn) | I2 |
| `no-release` (smile carries into THINKING) | I1 (smile 0.208) |
| `no-budget + no-praise-cap` | I5 |
| `no-think-avert` | I6 |
| `slow-barge` (no expression release) | I7 expression |
| `barge-no-look` | I7 gaze |

**Optional F0 estimator.** A normalised autocorrelation at 16 kHz with a 512-sample window over 80–400 Hz, run per frame: **p50 102 µs, p99 282 µs** on the Xeon, with 0.3% median error on a clean synthetic voice. The real-voice error is [U]. RMS-only prosody costs about 0.

### 8.3 Two bugs the sim found (they would have shipped)

1. **The blink rate halved in short states.**
   - Re-drawing a gamma(k=3) inter-blink interval on every state entry resets its rising hazard. Before the fix, listening ran at 8.3/min, thinking at 13.7/min and your_turn at 10.0/min.
   - Fix: time-warp the pending interval by the ratio of the means. That brought listening to 17.7, thinking to 22.0 and your_turn to 16.5.
   - Any controller that "resets the blink timer on state change" has this bug, and TalkingHead's per-mood templates restart the same way [I].
2. **Additive event blinks inflated the rate.** Adding phrase and gaze-evoked blinks on top of the schedule raised speaking to 31/min. Fix: an event *advances* a scheduled blink that is already within 0.6–1.0 mean intervals, which gave 29/min.
   - Also, the first version of the sim could not catch nod or smile leaks: closed answers had no pauses, and goal_met never fired. A gate is only as good as its scenarios, so the mutation check is part of the gate.

### 8.4 What this does *not* show

- **Perceived naturalness.** Nothing here is a human rating. The sim proves the *rules* hold, not that they look right. E-B1 to E-B6 do that.
- **The audio is synthetic.** Accent detection on real Hindi tutor audio needs the bench clips from web-3d §5 (E-B4).
- **Phone cost.** The phone figure is a scaling guess. Measure in the WebView with the renderer running (E-B7, alongside web-3d E-5).

---

## 9. Behaviours that read as uncanny or wrong (design them out, then test for them)

| anti-pattern | cause | guard |
|---|---|---|
| dead stare | no saccades, no blinks during a long listen | micro-saccades (large face), gamma blinks, module glances |
| metronome blinks | fixed or uniform intervals | gamma k=3 + boundary advancing |
| face twitching | random morph jitter (TalkingHead `mtRandomized`) | disabled (§4.7) |
| frozen during latency | no THINKING behaviour | cognitive aversion + breathing + drift |
| smile snap | step changes | cosine envelopes ≥350 ms |
| nod-as-verdict | nods on closed answers | open-only gate (I2) |
| verdict leak in THINKING | expression carried over | release (I1) |
| staring at a thinking child | high contact in silence | module-directed breaks, stillness, soft gaze |
| head–eye lock-step | head copies the eyes 1:1 | head follows 30% below 15°, lag 250 ms |
| perfect symmetry | identical L/R | fixed ±6% asymmetry per character |
| smiling through प/ब/म | expression overrides the lips | compositor: closure scales the smile ×0.4 (sibling §5.3) |
| emotional over-claim (B3–B4 creep) | full-intensity emotion | band scale + budget |
| "impatient" teacher | escalating head and brow during YOUR TURN | no face escalation; verbal re-entry only |
| bobble-head | prosody gain too high on a small tile | LOD + accent refractory 350 ms |

---

## 10. Experiments that gate this (with pass bars)

| id | question | method | pass bar |
|---|---|---|---|
| E-B1 | Does the behaviour layer beat "lips only" and "TalkingHead defaults"? | Blind paired 20 s clips, same real tutor audio, 3 arms. B2 and B4 children (n ≥ 15 per band) on a 5-point smiley scale for "feels like a real teacher" and "feels weird"; parents (n ≥ 15) the same | controller ≥ defaults on "real teacher" and ≤ on "weird", both bands; if not, the layer is rejected and logged |
| E-B2 | Do silent continuer nods help or read as impatience/verdict? | Within-child, open-turn tasks, nods on vs off; measure child turn length (words) + a post-item "did she think you were right?" probe on closed items | open-turn length ≥ off arm; "she thought I was right" rate on wrong answers no higher with nods |
| E-B3 | TurnClock accuracy | Log `transcript chars / playback s` per voice from 200 real responses; replay | yield ≥1.0 s before `stopped` in ≥95%, and never after `stopped` |
| E-B4 | Accent detector on real Hindi audio | Bench clips (web-3d §5) with forced-aligned stressed syllables | nod impulses within ±120 ms of an aligned accent ≥60%; false accents ≤1 per 3 s |
| E-B5 | Does 3D behaviour distract from the module? | Eye-tracking or tap-latency proxy on module tasks, avatar behaviour on vs reduced | task time and errors not worse than reduced (non-inferiority, 10%) |
| E-B6 | Head-wobble continuer for Indian children | Blind clips: none vs pitch nod vs roll wobble, n ≥ 20 parents + 20 B3 children across ≥3 regions | ship wobble per character only if preferred by ≥60% in a region |
| E-B7 | Device cost | WebView on 2 reference ₹10k phones, renderer running, 10 min trace | controller p99 ≤0.5 ms; F0 p99 ≤1.5 ms, else F0 stays off |
| E-B8 | Passive mic tap safety | AEC/AGC A/B with tap on vs off, echosim-style metrics on device | no measurable change in echo return loss or VAD timing |

---

## 11. Candidate `context/` entries (for the main loop's inbox)

**Decisions**
- **D-BEH-1: the client-side behaviour controller owns gaze, blink, brows and head; TalkingHead keeps lips, breathing, pose and render.**
  - Rationale: TalkingHead's random templates and jitter are uncontingent motion [V]; function-labelled behaviour is testable.
  - Reverse if E-B1 shows that TalkingHead defaults rate equal or better.
- **D-BEH-2: no nods on closed or choice answers; continuer nods only on `open`.**
  - Rationale: a nod is affirmation, and lesson-arc bans a verdict before her turn.
  - Reverse if E-B2 shows no increase in "she thought I was right" on wrong answers.
- **D-BEH-3: valence for the current response comes from the verified key, her own transcript or `goal_met`; the Director arms only lesson affect and `handover`.**
  - Reverse if the Director moves onto the critical path with less than ~300 ms added latency.
- **D-BEH-4: expressive budget (1 big per 30 s, praise ≤1 per 5 turns) and band scale 1.0/0.9/0.7/0.55.**
  - Reverse on E-B1 per band.
- **D-BEH-5: `behaviour-proto/sim.mjs` invariants plus the mutation check become a CI gate** for any change to the controller.

**Measurements**
- M-BEH-1: the §8.2 table (n = 40 seeded lessons, 421k frames, Node 22 on a Xeon 2.1 GHz, 2026-10-02).
- M-BEH-2: F0 per-frame cost (n = 3000 frames, synthetic tone).

**Rejections (pre-emptive, with the reason)**
- R-BEH-1: random or coin-flip gaze and per-frame morph jitter as "liveliness". It is uncontingent and twitchy [V source]; random gaze hurt a realistic avatar (Garau) [R].
- R-BEH-2: re-drawing blink timers on state change. It halved the blink rate in short states [M].
- R-BEH-3: head shakes for "nahi". Ambiguous with the Indian wobble, and a scold [U, I].
- R-BEH-4: a sad face for wrong answers. Shaming; the error is information about the step.
- R-BEH-5: mimicking the child's expressions (Greta-style mimicry). No camera, emotion-adjacent (rejected #8 class).

---

## Sources

**Read this session (primary)**
- Andrist, Tan, Gleicher & Mutlu (2014), "Conversational gaze aversion for humanlike robots", HRI '14: https://pages.cs.wisc.edu/~bilge/pubs/2014/HRI14-Andrist.pdf **[V]**
- Ho, Foulsham & Kingstone (2015), "Speaking and listening with the eyes", PLOS ONE: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0136905 **[V]**
- Hömke, Holler & Levinson (2018), "Eye blinks are perceived as communicative signals in human face-to-face interaction", PLOS ONE: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0208030 **[V]**
- Doherty-Sneddon, Bruce, Bonner, Longbotham & Doyle (2002), "Development of gaze aversion as disengagement from visual information", *Dev. Psych.* 38(3):438: https://dspace.stir.ac.uk/bitstream/1893/361/1/gazeaversionpaper9.pdf **[V]**
- Nakano & Kitazawa (2010), "Eyeblink entrainment at breakpoints of speech", *Exp. Brain Res.*, doi:10.1007/s00221-010-2387-z (Europe PMC abstract) **[V-abstract]**
- Greta (isir/greta), GPL-3.0 / LGPL-3.0 branch: `core/ListenerIntentPlanner/.../ListenerIntentPlanner.java`, `bin/ListenerIntentPlanner/TriggerRules/rulesfile.xml`, `core/BehaviorRealizer/.../GazeKeyframeGenerator.java`, `bin/NVBG/data/nvbg-common/nvb_rules.xsl`: https://github.com/isir/greta **[V]**
- TalkingHead 1.7 `modules/talkinghead.mjs` (met4citizen, MIT; repo HEAD 2026-09-25): `animTemplateEyes`, `animTemplateBlink`, `animMoods`, `mtRandomized`, volume head movement: https://github.com/met4citizen/TalkingHead **[V]**

**Carried from sibling docs (their tags kept)**
- Brink, Gray & Wellman (2019), *Child Development*, doi:10.1111/cdev.12999 [V-abstract, kids-ux]
- Castro-Alonso et al. 2021; Noetel et al. 2022; Schroeder et al. 2013, pedagogical-agent meta-analyses [V-abstract, lesson-arc]
- Witt, Wheeless & Allen (2004), *Communication Monographs* 71:184 [S, vibe-temperament]
- Bentivoglio et al. (1997), blink rates: https://movementdisorders.onlinelibrary.wiley.com/doi/abs/10.1002/mds.870120629 [S]
- Glenberg, Schroeder & Robertson (1998), gaze aversion: https://link.springer.com/article/10.3758/BF03211385 [S]
- Cavé et al. (1996), eyebrow and F0; Busso et al. (2007), head motion and prosody [S, audio-to-face-ml]
- Mitchell et al. (2011), face/voice realism mismatch, *i-Perception* [S]
- Inflated praise (79% of 10-13-year-olds), via `../voice/indian-teacher-discourse.md` §0-9 [V there]

**Recalled; DOI resolved via Crossref this session, numbers not re-read [R]**
- Baylor & Kim (2009), "Designing nonverbal communication for pedagogical agents: When less is more", *Computers in Human Behavior*, doi:10.1016/j.chb.2008.10.008
- Krumhuber & Kappas (2005), "Moving smiles", *J. Nonverbal Behavior*, doi:10.1007/s10919-004-0887-x
- Ward & Tsukahara (2000), "Prosodic features which cue back-channel responses in English and Japanese", *J. Pragmatics*, doi:10.1016/s0378-2166(99)00109-5
- Gratch, Wang, Gerten & Fast (2007), "Creating rapport with virtual agents", IVA, doi:10.1007/978-3-540-74997-4_12
- Lee, Badler & Badler (2002), "Eyes alive", SIGGRAPH, doi:10.1145/566570.566629
- Cassell, Vilhjálmsson & Bickmore, "BEAT: the Behavior Expression Animation Toolkit" (SIGGRAPH 2001; book chapter doi:10.1007/978-3-662-08373-4_8)
- Not resolved this session (the web-search budget was exhausted), cited from memory: Kopp et al. 2006 / Vilhjálmsson et al. 2007 (SAIBA/BML); Garau et al. 2003 (CHI, avatar realism × gaze); Al Moubayed et al. 2012 (Mona Lisa effect); Flecha-García 2010 (*Speech Communication*, eyebrow raises in dialogue); Krumhuber & Manstead 2009 (AU6 and smile genuineness); Mayer & DaPra 2012 (embodiment principle); Ouwehand, van Gog & Paas 2015 (gaze cues in video examples); Mehrabian / Andersen (nonverbal immediacy). **Verify these before they enter `context/` as anything stronger than [R].**

---

## Graphics review

Reviewer stance: an adversarial real-time graphics engineer, 2026-10-02. I re-read the cited TalkingHead 1.7.0 source
(`modules/talkinghead.mjs`, repo HEAD b3e277b, 2026-09-25), three.js r180's morph shader chunk, the Andrist 2014 PDF and
Hömke 2018, and the sibling docs this one depends on. I also re-ran the prototype under harsher conditions than the sim
uses. Scripts and raw output are in `behaviour-proto/review/` (`drift.mjs`, `nod.mjs`, `nodfix.mjs`, `merge.mjs`,
`snap.mjs`, `realaudio.mjs`, `sim-cps.mjs`, `script.mjs`, `review-output.txt`). Tags are as in the header.

**Verdict.** The behaviour design is sound. The invariant and mutation gate is the best idea in the file. But the
prototype and the integration code have **five defects that would ship a visibly broken face**, and three claims that hold
in the sim but not on the WebRTC path. None of them changes the architecture. All of them change code or numbers.

### GR-1. Defects that would ship (fix before any device test)

| # | defect | evidence | effect on screen | fix |
|---|---|---|---|---|
| 1 | **`head.mtRandomized = []` (§4.7) crashes TalkingHead's frame loop.** `animate()` does `i = this.mtRandomized[floor(random()*length)]; j = this.mtAvatar[i]; if (!j.needsUpdate)` (l. 2684–2686) on every frame outside `full` view and always in `avatarOnly` mode. | [V] source; [M] the same three lines throw `Cannot read properties of undefined (reading 'needsUpdate')` | Outside `avatarOnly`, rAF is re-armed before the throw, so the loop keeps running and **every frame aborts before `opt.update` and `updateMorphTargets`**: a frozen face plus 30 exceptions/s. In the perf doc's worker shim (`avatarOnly`), the throw goes to our caller. | Add a guard to the vendored-patch list (web-3d §5.5): `if (this.mtRandomized.length)` around the block. Never empty the array without the patch. |
| 2 | **Nods are about 4× smaller than specified, and the size depends on frame rate.** `S.nod.v -= amp*9` on a k=120, ζ=0.6 spring gives a continuous-time peak of 0.0455 × v0, so 1.23° for a "3°" nod. Explicit integration at frame dt cuts that further. | [M] `nod.mjs`: a 3° request peaks at **0.75° at 30 fps, 0.63° at 24 fps, 0.24° at 15 fps** | Chin travel is **1.0 px** on the 160 px tile and 2.6 px on L1. §4.6 assumes 4 px and 10 px. So the "head carries the behaviour" claim (§0-1) is false *as implemented*, and the sim cannot see it because I2 counts nod events, not amplitude. | Fixed 4 ms substeps, with the impulse normalised so that the **peak** equals the requested degrees. `nodfix.mjs` gives 2.86° for a 3° request at 16.7–66 ms frames. Add an amplitude invariant (I8: observed peak within ±20% of the request at 15/24/30 fps). |
| 3 | **A second emotion snaps the first one off.** `emote()` replaces `S.emo` and restarts the envelope from 0. Nothing cross-fades. | [M] `snap.mjs`: warm at apex, then a lexicon `curious` cue → `mouthSmileLeft` drops **0.19 in one frame** (B1) | "Smile snap" is exactly the §9 anti-pattern the doc claims to design out. It fires whenever a praise or curious lexicon hit lands during an armed emotion, which is the common case. | Keep the outgoing level as a separate decaying layer (release over its own `rel` ms) and sum it under the new onset. Add a test: no blendshape changes by more than 0.06 between frames outside blinks and visemes. |
| 4 | **Gaze is never clamped.** `moduleDir()` returns **pitch +64°** for the L2 layout (160 px tile at the top, module below) and **−63°** for L3, on a 360×780 phone [M `snap.mjs`]. The controller passes this straight to the eyes (head takes only `0.2 × pitch`). | [M], [V] `controller.mjs` l. 220–243 | Eyes rolled ~50° past the human range: the iris hides under the lid and the face shows mostly sclera. For a child, that is the most frightening frame this system could draw. | Clamp eye-in-head to ±25° yaw, +20°/−25° pitch. Give the remainder to head pitch/yaw (cap ±20°), then to the bust. Compute the target in 3D (`camera.unproject` of the module centre onto a plane at the glass) instead of the `D = 1.2H` heuristic, because the right answer depends on the virtual camera's FOV, which §4.6 ignores. |
| 5 | **The controller clock is not the playback clock.** `t += min(dt, 66 ms)`. TalkingHead also clamps the dt it hands to `opt.update` (`2 × animFrameDur`, l. 2679). The TurnClock then measures elapsed speech on a clock that loses time on every long frame. | [M] `drift.mjs`, 400 turns: with 5% / 10% / 20% of frames at 50–200 ms, the clock is **467 / 862 / 1393 ms behind** at turn end (p50). Mutual gaze before the end drops below 1.0 s in **12 / 37 / 63** of 400 turns, and the yield **never happens** in 0 / 2 / 47 | performance-android §3.4 measured 18–44 frames over 50 ms per ~270 under module load (7–16%), which is this regime. It also breaks the house rule that the face is slaved to the playback clock (companion-tech §13). | Read time from the stamped audio clock the worker already receives (performance-android §5.1), or `performance.now()`. Clamp only the **integrator** step (substeps), never the clock. Add a heavy-tailed dt arm to the sim (the current ±3 ms jitter is unrealistically clean). |

### GR-2. Timing on the real WebRTC path (the sim assumes zero-latency events)

1. **The state machine runs on server-side events that the sibling docs already demoted to hints.**
   - §4.2 says `speaking` is entered on "`output_audio_buffer.started` (the first audio *played*)". It is not.
     `audio-to-face-ml.md` G-2/§952 and `web-3d-talking-heads.md` R-6 established three things: it is a server-side send
     time; it leads the audible sound by the jitter buffer plus the output path (about 60–200 ms on the speaker, 200–400 ms on
     BT A2DP **[U]**); and the event family is undocumented, so it may disappear.
   - Effect: the brow flash at move start, the armed smile and the re-gaze clock all run early. `stopped` fires before her last
     syllable is audible, so the lean-in, the YOUR TURN gaze and the ring all arrive **over her final word**.
   - Fix: drive `speaking`/`stopped` from the voice-tap RMS gate (voiced ≥ 2 frames; silent ≥ 250 ms after a `stopped`
     hint). Keep the events as hints. Add the sibling's contract test that runs the controller **with the events suppressed**.
2. **THINKING onset is mislabelled.**
   - The sim measures "0.33 s after the child stops" from `speech_stopped`, which it fires the moment the child stops.
   - On the wire, `speech_stopped` follows `silence_duration_ms` (500 ms by default [S, Azure realtime docs]; tech-and-market
     §1 recommends **800–1000 ms** for children), plus one network leg.
   - So the cognitive aversion really starts about **1.1–1.5 s after the child's last sound** [I]. Meanwhile she holds the
     LISTENING stare with a 4° tilt.
   - Fix: start the aversion from the **local** mic tap's end-of-speech (≥300 ms of silence). If `speech_stopped` has not
     confirmed within `silence_duration_ms + 300`, revert to soft contact. Report the onset from the child's last voiced frame
     in the sim.
3. **"Barge gaze in 33 ms" is measured from the event, not from the child.**
   - `speech_started` arrives after server VAD detection plus uplink and downlink. The real delay from the child's onset is
     several hundred ms **[U]**.
   - The child-mic tap the design already has can trigger the look in 1–2 frames. Gate it so echo of her own voice does not
     trigger it: require child RMS > k × her RMS while she is speaking, with k tuned in E-B8 **[I]**.
   - A gaze shift is cheap and reversible, which an audio cut is not, so false positives are tolerable here.
   - Mouth closure must still follow the audio (sibling G-3.3).
4. **The TurnClock's ±15% voice-rate assumption is too narrow.** [M] On the 10 marin/cedar realtime-voice clips from this
   session's voice bench, the rate in **code points per second of speech** was:

   | text | cp/s |
   |---|---|
   | Devanagari | 17.6, 16.0 |
   | Roman Hinglish | 15.1, 16.2 |
   | mixed | 14.1, 13.9 |
   | English | 14.9, 12.6 |
   | **numerals** | **9.3, 9.9** |

   That is −31% to +30% around the 13.5 default. Digits expand into many spoken syllables (a maths tutor's normal content).
   Devanagari packs more speech per code point than its Latin transliteration: Latin / Devanagari code points 1.14–1.16,
   and against graphemes 1.65–2.15 [M `script.mjs`].
   - Re-running `sim.mjs` with these rates: **<1.0 s of mutual gaze in 45/670 floor-passing ends (6.7%)**, which fails
     E-B3's 95% bar, and p90 mutual gaze is 5.8 s (a long stare on numeral-heavy turns) [M `sim-cps.mjs`].
   - Fixes:
     - Count spoken units, not code points: expand numerals to words and count Devanagari by graphemes × a per-voice factor.
     - Keep an online per-session rate estimate from completed turns (chars / RMS-voiced seconds).
     - Investigate `response.done` usage (output audio tokens) as an exact duration source before playback ends **[U]: verify
       that Azure WebRTC reports it and that tokens per second are constant**.
5. **The remote-audio analyser depends on a Chromium quirk.** Chromium does not feed a remote WebRTC stream into
   `createMediaStreamSource` unless a media element is consuming it (crbug 933677 [S]).
   - The current design is safe because playback is an unmuted `<audio>` (web-3d §6.1).
   - But anyone who "simplifies" playback into WebAudio, or mutes the element, gets a silent analyser and a dead face.
   - Fix: put this in the contract test and in a code comment.
6. **Placement conflicts with the perf doc.** §4.1 and §6 put the controller in TalkingHead's main-thread `opt.update`,
   fed by main-thread `AnalyserNode`s. performance-android §5.1 moves rendering to an OffscreenCanvas worker, because
   main-thread relays caused **136–303 ms lip freezes** under module load.
   - The controller should live **in the render worker**.
   - Her RMS and the child's RMS should arrive from AudioWorklets over transferred ports (`AnalyserNode` does not exist in
     workers).
   - Link and module events can be posted from the main thread. A 100–300 ms stall there is tolerable for behaviour, but not
     for lips.
7. **Output-route latency applies to behaviour too.** The sibling's signed, per-route `latencyComp` delay line (audio-to-face
   G-2) must also delay prosody-locked behaviour: accent nods, phrase blinks and the brow flash. Otherwise, on BT earbuds the
   head nods 100–250 ms before the stressed syllable is heard, which reads as anticipation, not emphasis.

### GR-3. Performance claims

- **The controller's µs numbers are real, but they are not the budget that matters.** The behaviour layer's cost lives in
  three places:
  - TalkingHead + three: about **4 ms p50 / 19 ms p95** of main-thread JS at 4× CPU throttle [M, performance-android §3.4];
  - GPU morph evaluation;
  - the compositor.

  Rewrite §0-10 as "the controller is negligible; the behaviour layer's cost is the morphs it keeps active".
- **Active morphs cost GPU time; zero morphs are free.** three r180 skips zero influences (`if (morphTargetInfluences[i] != 0.0)`
  in `morphtarget_vertex.glsl.js`) [V].
  - The behaviour layer keeps about 6–14 influences non-zero at all times:
    - the rest smile on L/R;
    - asymmetric pairs;
    - brows while listening;
    - **gaze, because TalkingHead drives the eyes with `eyeLook*` morphs, not bones** (`eyesRotateX/Y` map onto
      `eyeLookIn/Out/Up/Down`, l. 2316–2325) [V].
  - So budget against the active count, not the 52 shipped.
- **"Dropping micro-saccades saves eye-bone updates" (§4.6) is wrong twice.** In TalkingHead, gaze is morphs. And a bone
  rotation costs effectively nothing next to skinning, which runs every frame regardless. The real reason to drop them below
  220 px is that tier B renders at **DPR 1 without MSAA** (performance-android §4). There, a sub-pixel iris move draws as edge
  shimmer, not as motion. That reason is visual, not performance.
- **The F0 cost leaves out resampling.** The bench runs at 16 kHz; the Android context runs at 44.1/48 kHz.
  - Decimating first is cheap (a short FIR).
  - Running the same autocorrelation at 48 kHz is about 9× the work.
  - The estimator belongs in the worklet or the worker, not on the main thread.
- **Allocations and log.** `update()` allocates about 10 small objects per frame (the `bs` object, the closure, the `drift`
  array, the return value), and `S.log` grows without bound. Both are harmless in Node; on a phone they add GC pressure over a
  40-minute lesson. Use a ring buffer for the log and reuse the output object.

### GR-4. Rig and asset consistency

1. **The B-lite morph list (performance-android §3.3, `bench/perf/pipeline.mjs` `LITE`) cannot render this behaviour layer.**
   It keeps `cheekSquintLeft` but not **`cheekSquintRight`**, so every warm/proud/excited smile is lopsided by 0.12–0.35 ×
   intensity on one cheek. It also drops all 8 `eyeLook*` shapes and `eyeWide*`. With TalkingHead's morph-driven gaze, that
   means **no gaze at all**, and no lid-follow on look-down (the §2.9 "dead eyes" item) [M, list diff].
   - Fix: add `cheekSquintRight` and the 4 `eyeLookDown/Up` shapes (lid-follow).
   - Drive gaze through eye bones in B-lite.
   - Drop `eyeWide` from `excited` when the shape is absent.
2. **Who rotates the eyes is unresolved.**
   - character-creation §3 specifies bones for rotation plus `eyeLook*` for lids.
   - TalkingHead uses `eyeLook*` for rotation.
   - §4.7 here says "eye + head bones".
   - Pick one: bones rotate, and `eyeLook*` is driven at **lid-follow gain only**. Then add a per-character degrees → morph
     calibration to the `behaviour` manifest. The controller outputs degrees; a 0.28 `mouthSmile` or a 10° look means
     different things on different meshes.
   - The same applies to the emotion table: add per-shape gains per character, not only `browGain`.
3. **Head motion should go through TalkingHead's pseudo-morphs (`headRotateX/Y/Z`, `bodyRotate*`), not raw bone writes.**
   `opt.update` runs after `mixer.update` and `updatePoseDelta`, but also after `dynamicbones.update` (l. 2737–2745) [V].
   Bone writes there leave dynamic hair one frame behind the head.
4. **The kept `pose` template is random motion.** It switches body pose (`side`/`hip`/`wide`/`straight`) every 5–30 s
   (l. 424–430) [V], which contradicts design rule 1. In a bust view that shows as a shoulder shift mid-sentence. Pin
   `straight`, or change pose only on `idle` or state changes.
5. Minor: the random jitter runs in every view except `full` (`viewName !== 'full' || isAvatarOnly`, l. 2683), so also in
   `mid`, not only `upper`/`head` as §4.7 says.

### GR-5. Uncanny-valley risks for children that the doc under-weights

1. **The floor-holding evidence came from big head turns on a robot with no eyes.**
   - Andrist 2014 ran on a **NAO with no articulated eyes**. Aversions were **head** motions of about 20° (up), 28° (side) and
     22° (down). Intimacy aversions were scaled ×0.4 [V, §3.2]. n = 10 per condition, between-subjects, adults [V].
   - This controller averts mostly with the eyes: side 12°, with the head following only 30% (3.6°). On the 160 px tile that
     is a **2.4 px** iris shift and about 5 px of nose travel. A 20° head turn moves the nose about 27 px [M, geometry].
   - The 608 ms effect therefore cannot be assumed to transfer.
   - Fix: on small tiles, carry floor and cognitive aversions **head-led (≥10–15°)**. Keep eye-led motion for intimacy
     aversions only, which mirrors Andrist's own ×0.4.
   - Note also: aversion never held the floor for the full 2–4 s pause; it delayed interruption by about 280 ms [V].
2. **Eye-roll risk.** An upward cognitive aversion (45% of draws, eyes −10°), combined with the listening `browInnerUp`
   +0.08, is close to TalkingHead's own 🙄 recipe (`eyesRotateX −0.8` + `browInnerUp`). For a B3–B4 child who has just answered,
   a look that reads as contempt is the worst possible signal **[I]**.
   - Use head-led, lid-following, slower (≥150 ms) upward aversions.
   - Bias B3–B4 to side or down.
   - Add "did she roll her eyes / was she annoyed?" to E-B1.
3. **Smiling through bilabials ×0.4 (§3 rule 9) flickers the smile at syllable rate.** At 4–5 bilabials/s, a stepwise ×0.4
   pulses the cheeks **[I]**. Close the lips with `mouthClose`/`mouthPress` layered over the smile, scale only
   `mouthSmile*` (not cheek or eye squint), and smooth the factor with a ≥60 ms attack and ≥120 ms release.
4. GR-1 items 3, 4 and GR-4 item 1 are uncanny defects, not just bugs: the smile snap, sclera-only eyes and a lopsided smile.
   Each one needs an automated frame check (a per-frame delta cap, an eye-in-head clamp, an L/R symmetry bound), because a
   blind child panel will not tell you *which* defect made her "weird".

### GR-6. Licences

- **TalkingHead: MIT** [V, `LICENSE`, v1.7.0]. Vendoring patches is fine. Keep the notice.
- **Greta: GPL-3.0 on `master`** [V, `LICENSE` in the clone]. The `master-lgpl` branch was not re-checked here.
  - Using the *rules as facts* (thresholds, the signal → backchannel shape) is fine.
  - **Do not vendor `rulesfile.xml`, the Java, or the NVBG `.xsl`.** The `bin/NVBG` folder carries no licence file of its
    own; NVBG is USC ICT's (Virtual Human Toolkit) [S]. Treat it as all-rights-reserved and take ideas only.
- ARKit blendshape **names** are an interoperability vocabulary; no trap. No other third-party code is used by this doc.

### GR-7. Evidence that is stated more strongly than its source

- "2D agents (g = 0.38) beat 3D (g = 0.11)": Castro-Alonso et al. 2021 say 2D "**tended to** be more effective" over
  **32 effect sizes, N = 2104** [S, abstract via ERIC/Springer]. That is a moderator trend, not an established win.
- Andrist floor-holding: the text gives 608 vs 329 (static) vs 327 (bad timing); the figure prints 331 for static [V]. The values differ (329 vs 331); the arms are not swapped, so §0-2's "swap" wording is wrong.
- Brink et al. 2019 used **videos of robots** (machine-like vs very human-like), n = 240, ages 3–18 [S, abstract]. The
  transfer to a stylised on-screen tutor is inference **[I]**.
- Hömke 2018 is verified as cited (208 vs 607 ms; β = −2.86, SE 1.42, p = .044; VR; nobody noticed) [V].

### GR-8. Production effort (missing from the doc) **[I]**

| work | effort |
|---|---|
| Fix GR-1 and GR-2; port the controller to the render worker; worklet RMS taps; event-suppressed contract test; heavy-tailed-dt and real-rate sim arms; amplitude / delta / clamp / symmetry invariants | ~2–3 engineer-weeks |
| Per-character calibration: deg → morph, per-shape gains, a 5-emotion × 3-size visual QA, a B-lite variant | ~2–3 tech-artist days per character, so ~3 weeks for 6 characters |
| E-B7/E-B8 on two ₹10k phones (trace + AEC A/B) | ~1 week |
| E-B1, E-B2, E-B6 child and parent studies (consent, recruitment, ≥3 regions for E-B6) | 4–8 calendar weeks; the critical path |

### GR-9. Checked and found sound

- **Blinks survive low frame rates.** 0% of 232–270 blinks per run were never shown ≥0.9 closed at 15/20/24/30 fps (min
  peak 0.94 at 15 fps) [M `snap.mjs`].
- **The listening blink rate does not depend on per-state style overrides.** With `{}` and with `{speaking: 24}` it was
  19.1 and 18.0/min against a target of 18 [M `merge.mjs`].
  - `eyeBlinkLeft` alone takes `eyeSquintLeft × 0.3` (0.061 L−R at excited B1), so one eye is slightly more closed during
    a smile. It is small; apply it to both lids.
- **The accent detector is not refractory-bound on real voice.**
  - 0.42 accents/s overall (≈0.6–0.8 per second of speech), 0.07 strong/s, 13 phrase pauses/min across the 10 clips
    [M `realaudio.mjs`].
  - It is **level-dependent**: at gain 0.3 the rate falls to 0.14/s. The absolute `voiced > 0.012` gate needs
    normalising to the stream's running level (the remote level after Opus/AGC is unknown).
- **The TalkingHead hooks are verified.**
  - `opt.update(dt)` is called after the mixer and pose and before `updateMorphTargets` (l. 2740–2744), so writes land in
    the same frame.
  - The volume head bob is gated on `isEyeContact` (l. 2700).
  - `mtRandomized` is the 20 morphs listed, with jitter of `(1 + vol/255)·rand/5`.
- **The §4.6 geometry arithmetic is correct.** The problem is the nod amplitude actually produced (GR-1 #2).

### GR-10. Corrections for the main loop

1. §4.7 code: `head.mtRandomized = []` crashes TalkingHead's frame loop. Patch the jitter block with a length guard (vendored patch).
2. Nod impulse: use fixed 4 ms substeps with a peak-normalised impulse. The current code yields 0.75° for "3°" at 30 fps (0.24° at 15 fps). Add an amplitude invariant.
3. Emotion transitions must cross-fade (the current cue swap drops the smile 0.19 in one frame). Add a per-frame delta-cap invariant.
4. Clamp gaze: eye-in-head ±25°/+20°/−25°, head ≤20°, target computed in 3D. The L2/L3 layouts currently produce ±64° eye pitch.
5. The controller clock must be the stamped audio clock or `performance.now()`, never the sum of clamped dt. Clamping loses 0.47–1.39 s per turn under realistic long frames and drops yields.
6. §4.2 "`output_audio_buffer.started` = first audio played" is wrong. Drive speaking/stopped from the voice-tap RMS gate; events are hints; add a contract test with the events suppressed.
7. THINKING aversion onset is ~1.1–1.5 s after the child stops on the wire (`silence_duration_ms` 500–1000 + network), not 0.33 s. Use the local mic tap for onset, and report the sim metric from the child's last voiced frame.
8. "Barge gaze 33 ms" is from the event. Use an echo-gated local mic tap for the look.
9. TurnClock: measured voice rates are 9.3–17.6 cp/s (numerals ~9.5, Devanagari ~17), not ±15%. With those rates the sim fails E-B3 (45/670 <1.0 s). Count spoken units, estimate online, and check `response.done` audio usage [U].
10. Move the controller into the render worker with worklet RMS ports, per performance-android §5.1. Apply the per-route `latencyComp` to prosody-locked nods, blinks and brows.
11. §0-10 / §4.6: the controller's cost is negligible; the real cost is TalkingHead + three (≈4 ms p50 at 4×) and active morphs. TalkingHead gaze is `eyeLook*` morphs, not bones. Micro-saccades are dropped below 220 px for DPR-1 shimmer, not for performance. The F0 cost excludes resampling and must stay off the main thread.
12. The B-lite `LITE` list lacks `cheekSquintRight`, `eyeLook*` and `eyeWide*`, which gives a lopsided smile and no gaze or lid-follow. Fix the list or drive gaze by bones.
13. Decide eye rotation = bones, `eyeLook*` = lid-follow. Add per-character deg→morph and per-shape gains. Drive the head through `headRotate*` pseudo-morphs. Pin TalkingHead's `pose` template.
14. Aversions on small tiles must be head-led (≥10–15°): Andrist's effect came from 20–28° head turns on an eyeless NAO, n = 10 per condition. Bias B3–B4 cognitive aversions away from "up" (eye-roll risk).
15. Bilabial smile scaling: smooth it and scale only `mouthSmile*`, to avoid syllable-rate smile flicker.
16. Licence: do not vendor Greta's GPL rule files or NVBG's XSL (no licence file; USC ICT). Take the ideas only.
17. Soften "2D beats 3D" to "tended to" (k = 32, N = 2104). Fix the Andrist "swap" wording (text 329 vs figure 331).
18. Add a production-effort line: ~2–3 engineer-weeks, plus ~3 tech-artist weeks for 6 characters, plus 4–8 weeks of child studies on the critical path.

**Sources for this review:** TalkingHead source as above (https://github.com/met4citizen/TalkingHead); three.js r180
`src/renderers/shaders/ShaderChunk/morphtarget_vertex.glsl.js`; Andrist et al. 2014 PDF (link in Sources) §3.2 and §5;
Hömke et al. 2018 (link in Sources); Castro-Alonso, Wong, Adesope & Paas 2021, *Educ. Psychol. Rev.*,
https://link.springer.com/article/10.1007/s10648-020-09587-1 (abstract); Brink, Gray & Wellman 2019,
https://pubmed.ncbi.nlm.nih.gov/29236300/ (abstract); Azure realtime audio how-to (server VAD, `silence_duration_ms`),
https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio [S]; OpenAI VAD guide,
https://developers.openai.com/api/docs/guides/realtime-vad [V]; Chromium remote-stream-to-WebAudio issue crbug 933677,
via https://dev.to/orca_forge/browser-voice-interaction-ai-pitfall-guide-2026-16-common-traps-with-aec-getusermedia-and-40hd
[S]; Greta repo licence (https://github.com/isir/greta, `LICENSE` on master) [V].
