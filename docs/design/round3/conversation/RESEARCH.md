# Round 3 · stream conversation · RESEARCH: replies right the first time

Stream: conversation. Bar (V5.2): battery ≥ 85 %, every intent family ≥ 70 %, 0 confusing replies; the brief adds: cut the
guard-rewrite rate toward 10 % (it was 60 % of measured turns on 2026-10-06, `m-lat-rewrite-share-2026-10-06`), close every
family below 70 %, and bring the duplex idea to conversation (short turns, overlap, follow-ups the way a real teacher
speaks). Written 2026-10-09, before the build was measured; the numbers are in [RESULTS.md](RESULTS.md), the patch order in
[APPLY.md](APPLY.md).

Labels: **[M]** measured here (n, method, where), **[V]** read in the source, **[S]** from a search summary of the source
(abstract level, not read in full).

## 1. The problem, from our own turns first

Round 2 measured the battery but never saw *why* a turn was rewritten: the battery harness dropped the server's debug read.
`evals/conversation-r3/run.mjs` is the v2 harness with one change, it keeps that read (guard codes on the first draft, the
rewrite, the repair, the note, the verdict, the model-call timings) for every turn of every lesson. On HEAD (= prod 145996f
for every server file), local server, Neon TEST branch, real Azure models, the first 699 turns of the battery [M]
(`evals/conversation-r3/results/base-head-1`, 2026-10-09):

| measure | HEAD |
|---|---|
| turns rewritten by the reply guard (a second model call) | 41 % (92 of 224 at the first read; 47 % at 90) |
| first draft clean | 47 % |
| posing moves (`probe`) rewritten | **28 of 37** |
| guard codes on first drafts, top | ask 64, drift 59, flat 35, noconfirm 15, wrap 13, parts 12, leak 10, nowhy 7 |
| turn wall time p50 / p90 | 3.6 s / 5.6 s |

Reading every rewritten turn (the first draft beside what shipped) gives six causes, most of them structural, not wording:

1. **The first pose of a question is a two-job turn the model fails.** On a posing move the compiled prompt says twice
   (LESSON NOW and ONE MORE CHECK, the second appended last) to pose the kit question as written. The first draft re-worded it,
   asked its own follow-up instead ("Ab batao, Pune ko Jaipur se kitne slices zyada mile?"), or wrapped the lesson up
   ("Goodbye, Ishaan" on a probe move, 10 drafts): `ask` + `drift` (+ `flat` + `wrap`). Round 2's lead slot (the model writes
   only what comes before the question; code appends the question) covered requests and re-poses, not first poses.
2. **Two guards contradicted each other.** On a re-pose the lead slot (and the `ask` guard) end the turn on the card's short
   form of the question, while `drift` demanded half the FULL prompt's content words. Every request answered on a question
   already posed (small talk, a question of theirs, "pehle mera sawaal") tripped `drift`, and the drift repair cut what the
   draft had said to the child: "pehle mera sawaal, phir padhai" got a real answer about rainbows in the draft and shipped
   as the bare flags question (the battery's insistence "engages_brief: no"); "aap kahan rehte ho?" shipped as the bare
   question.
3. **A repair ladder that ends in the bare question.** A leak caught on a hint (often a false positive: the key 3 of "one
   third of 9" is also the number of groups) cut the hint, the lead-only repair was barred after any leak, and the turn
   shipped as the question alone: owner-2 R3 "bare question after a wrong answer", 4 of 90 turns on prod.
4. **Guards that read the wrong thing.** A granted break ("brb") had to hand back, so the rewrite added a lesson question to
   it; "Bilkul, aap break lijiye" (agreeing to the request) was caught as praise of an answer; "Kabir, haan, 1 player bach
   jaata hai" was caught as not confirming; a why-probe "kaunsa rule use karke decide kiya?" was caught as not asking why;
   confirming the item just answered ("Flag A mein 4 equal sections hain") was caught as naming parts the screen does not
   show; a kit question that is an instruction ("…sabse chhote tak lagao.") was caught as not handing back.
5. **Prompt notes recited.** "name what is sensible in it" came back as the word: "B chunna sensible tha", "Minecraft ka bada
   ghar alag baat hai; aapne usse yaad dilaya, sensible" (5 of 599 battery replies in round 2's run C [M]); the park note's
   "kindly name that it is a different thing from today's work" came back as the same sentence in every park; the frustration
   note's "this one is hard work and that is okay" came back literally ("is question mein hard work hai, aur yeh okay hai").
   The inherited law again: sentence-shaped prompt text gets recited.
6. **Intent moves that are right in code but thin in words**: a decline with no hook (out_of_bounds "reengages" failed 8 of
   12 in round 2 run C) and a "why not" line read as a lecture; a stop check-in that said "We'll stop the lesson here" and
   offered nothing else, after which "yes" got "Lesson ended, Meher. You may close the book now. <a question>"; a share from
   the child's life ("mere paas naya cycle aaya hai") acknowledged but not kept.

The prod note from the main loop is cause 4's family: on c5-maths-ch07-t02-i06 (no verdict on the turn) "Aapne Pattern A ka
niyam sahi pehchaana" shipped because the praise pattern allowed three words between "aapne" and "sahi"; the same lesson
shipped "Aapne pattern ka agla number sahi nikala" twice on module answers graded not_yet ("nikala" was not a listed verb),
which the owner checker did not count because it reads typed rows only [M] (`evals/owner-truth/results/acceptance-2026-10-09T07-30-13/owner-1.json`).

## 2. How the best systems and papers solve this

**Decide in code, let the model fill one slot.**
- Rasa CALM [V, rasa.com docs]: an LLM turns the message into a small set of commands (start flow, set slot, clarify,
  chit-chat, knowledge answer, cancel, hand-off); deterministic flows execute them, and **conversation repair is a set of
  named patterns** (digression, correction, cancellation, clarification, chit-chat, skip, repeat, user silence), each a flow
  with its own response, overridable one by one. A contextual rephraser words the fixed responses. Transfers: our Director is
  the flow engine and the UNDERSTAND note is the command generator already; what CALM adds is that *each repair is its own
  code path with its own response shape*, never one generic instruction.
- StratL (Puech et al., Findings of ACL 2025) [S]: a tutoring strategy as a sequence of single-turn **tutoring intents**
  re-chosen by a transition graph after every student utterance; prompting with a plain description of the strategy was not
  enough for intent selection. BIPED (Kwon et al., ACL 2024) [S]: select the tutor act, then generate for it. Bridge (Wang
  et al., NAACL 2024; round 2): the expert's decision given to the model made responses 76 % more preferred. Transfers: the
  decision is already code; the generation step should carry one decided job.
- Duolingo Video Call (round 2): the fixed parts of a call are the system's, the model fills the free parts.

**Fewer constraints per generation, the critical one last.**
- IFScale (Jaroslawicz et al., 2025, arXiv 2507.11538) [S]: 20 frontier models, accuracy falls as instruction density rises
  (best 68 % at 500 instructions), with a primacy bias that grows with load. Our compiled prompt holds dozens of constraints;
  53 % of first drafts broke at least one guard [M]. Transfers: take constraints OUT of the generation (code owns the
  question, the order, the hand-back) instead of adding wording.
- Our own law (html-portfolio, inherited): a rule appended last fired 8/8, the same rule mid-prompt 0/8.
- "Let Me Speak Freely?" (Tam et al., EMNLP Industry 2024) [S]: format restrictions (JSON) degrade reasoning, looser formats
  degrade it less. Transfers: no JSON turn; the model writes free spoken text for ONE slot, code assembles.

**Repair, persistence and kept promises.**
- PrefEval (Zhao et al., ICLR 2025 oral) [S]: preference following falls below 10 % at 10 turns (~3k tokens) zero-shot;
  prompting and retrieval still degrade; fine-tuning helps. Laban et al. 2025 (round 2): −39 % from single- to multi-turn.
  Transfers: anything that must hold across turns lives in code state and is re-sent (round 2 did `s.prefs`); a promise to
  come back to something is a code slot (`s.later`) the Director serves, never the model's memory.
- Chirpy Cardinal (Stanford, Alexa Prize; Chi, Paranjape et al. 2020, arXiv 2008.12348) [V]: re-offence rate per response
  to offensive users: **avoid + the user's name + a prompt to something new 0.346**, empathetic 0.461, counter-argument +
  prompt 0.567, asking why + name 0.638. A statement followed by a question drew new user content on 32.8 % of turns vs
  27.2 % statement alone and 26.4 % question alone; the acknowledgement generator related positively to ratings; repeated
  questions caused "decision fatigue". Transfers: an out-of-bounds decline is short, gives no reason, uses the name and
  hands a hook into the work; a turn is an acknowledgement then one question.
- LLM repair (Bielefeld, ACL 2026) [S]: models range from resisting appropriate repair to being easily manipulated by it.
  Transfers: repairs ("say it again", "you said stop: keep going, a break, or stop?") are code moves, not the model's call.

**Short turns, uptake, the child talks.**
- CIMA (Stasaski et al., BEA 2020) [S]: tutor responses average 7.15 words, student turns 5.38. Typed physics tutoring
  (Litman et al., IJAIED 2006) and Core, Moore & Zinn (2003) [S]: the student's share of words and the length of student turns
  correlate with learning. Transfers: her own words per turn are a cost to keep small; the outcome is the child's talk.
- Conversational uptake (Demszky et al., ACL 2021) [S]: building on what the student said (acknowledge, repeat, reformulate)
  is linked to achievement; an automated feedback RCT on 1,136 instructors raised uptake 24 % [S]. Transfers: the slot's first
  job is the child's own words ("start from what they actually did"), never a stock opener.

**Duplex, and what it means for words.**
- Full-Duplex-Bench (Lin et al., 2025, arXiv 2503.04721) [S]: pause handling, backchannels, smooth turn-taking and user
  interruption; end-to-end models (Moshi, dGSLM) answer fast but take over the floor where a backchannel belongs and handle
  pauses and interruptions poorly; cascades are slower. M3-DuplexBench (2026) [S] adds multilingual, multi-domain turns.
- Fillers (arXiv 2507.22352, VR study; 2508.11781) [S]: natural, contextual fillers improve perceived response time at long
  delays (≥ ~4 s), artificial wait indicators do not, and fillers can make an agent seem less intelligent.
- Transfers to a cascade tutor's *words* (the floor itself is the duplex stream's engine): (a) **front-load the uptake**: the
  part that answers the child comes first and the fixed question last, so a barge-in during the question costs only a
  question the card still shows; (b) **one job per turn, short**: a first-pose bridge is capped at 18 words (14 for 6-9);
  (c) **no stock fillers**: the uptake is the content-bearing filler; (d) the question is verified, fixed text known before the
  reply is written, so its audio can be prepared ahead of the reply (a latency-stream follow-on, not built here).

## 3. What transfers to a Hindi-English voice tutor for 9-15 year olds, Azure-only

- No new model, no new call on the common path: the slot is the same reply deployment (`DEPLOY.reply`, taxila-fast) and the
  same single call, with a different last note. A model call is *removed* on every turn whose first draft would have been
  rewritten.
- The floor is untouched: scanSafety and the model distress read run on every committed turn as before; the joined turn runs
  every truth guard (floor, leak, praise, deny, screen, parts, register, script, stage); the question is kit content, byte
  for byte; a lead that names the key is refused.
- Hindi-English: shapes are English notes and the model translates them; a note that reads as a sentence comes back as a
  literal Hinglish translation ("hard work hai, aur yeh okay hai"), so notes say what the line DOES, never what it says.
- MS Code of Conduct restriction 12 (knowledge states, never emotions): the share uptake is told never to name a feeling of
  theirs (the first smoke read "yeh baat tumne khushi se batayi").

## 4. The design chosen, and why

1. **Every pinned turn is composed** (`compose.js`, `brain/say.js`): the first pose of a question joins the lead slot. The
   model writes a bridge (and, after a right answer, the confirmation first: the slot's own last note, position is
   mechanism); code strips its questions and appends the verified question. `ask`, `drift`, `twoq`, `flat` and a mid-lesson
   goodbye cannot occur on those turns by construction. Shorter budget (18 / 14 words, ≥ 2 words) because the kit question
   that follows is long. Kill switch `TAXILA_P5_R3CONV=off`.
2. **Guards agree with each other**: `drift` asks only a first pose (a re-pose ending on the card's form has posed it); a turn
   ending on the pinned kit question has handed the floor back whatever its verb; a granted break hands back nothing; agreeing
   to a non-answer request on an unverified reading is not praise; a confirmation word among the first two statements
   confirms; asking for the rule or what they thought is asking why; the answered item's own parts may be named.
3. **The repair ladder ends in code, never in the bare question**: the lead-only repair also after a leak catch (the new lead
   is key-checked and the joined turn may carry no new problem, a leak included; a floor catch still bars it), then a fixed
   code lead (`fallback-lead.js`: the kit hint's statements when safe and not yet said, else a nudge from a small set she has
   not said this lesson).
4. **Repair moves as code patterns**: a stop check-in must offer a choice (going on or a break as well as stopping; English
   "we'll stop the lesson here" is a goodbye), and the turn after a check-in that was not a stop carries on; a share from
   their life is noticed and kept in `s.later`, served once when the question resolves or before the wrap (a promise she
   keeps); a decline is avoid + name + hook (Chirpy Cardinal's lowest re-offence strategy), no reason given.
5. **Truth guard for the prod case**: the praise pattern allows a clause (≤ 60 characters, within one sentence) between
   "aapne / tumne / you" and "sahi / correct / right + verb", with the verbs of finding and working out; a superset of the
   owner checker's own pattern.
6. **Recited notes reworded as shapes**: the not-yet note "start from what they actually did, in their terms" (uptake, no
   quotable adjective), the park note without its "different thing" clause, the frustration note as what the line does.

Why not a planner call (Bridge-style): the decision is already code, and a second call is ~1 s on every turn. Why not more
wording on the pose: the prompt already says it twice, once last, and 28 of 37 posing turns still failed [M]. Why not a JSON
turn: the format tax (Tam et al.) for no gain over one free-text slot. Why not two parallel drafts: already rejected
(`rejected.md`: Director median 1,577 vs 1,422 ms, both drafts often fail the same guard).

## 5. Rejected or left out, and why

- **Relaxing the leak predicate for small number keys** ("3 equal groups" when the key of "one third of 9" is 3): the
  cleanest fix for cause 3, but `revealsAnswer` is the truth stream's predicate and a number said next to the asked unit is a
  real reveal ("toh 3 drumsticks"); a narrow rule needs the truth stream's replay. Here the repair ladder no longer ends bare
  instead; the false positive itself is handed over (RESULTS.md "still short").
- **Parking a question about her** (owner-2 R7.defer: deferring is ignoring, F11, owner rule) vs the battery's diversion
  gold, which expects a park for "aapko kaunsa cricketer pasand hai?": the owner rule wins. Statements from the child's life
  are parked (with a kept promise); questions about her are answered now.
- **G-ASK parity change** (a focusing sub-question instead of the card question on a hint turn, MathDial's "Focus" move):
  more natural, but the classifier grades the reply against the card's key; a misgrade risk the truth stream must own.
- **Content requests in the slot** (example, story, clarify, answer their question, why, how): round 2 measured key leaks in
  those leads and no gain; unchanged.
- **Fine-tuning the reply model on preference following** (PrefEval's fix): no Azure fine-tune path in this round's budget,
  and state in code already carries what must persist.
- **Stock fillers** ("Hmm, achha…") before every reply: fillers help only at long delays and can cost perceived intelligence;
  the uptake is the filler.

## Sources

- Rasa CALM: https://rasa.com/docs/rasa-pro/concepts/dialogue-understanding ; conversation repair: https://rasa.com/docs/rasa-pro/concepts/conversation-repair/
- StratL: https://arxiv.org/html/2410.03781 ; https://aclanthology.org/2025.findings-acl.1348.pdf
- BIPED: https://arxiv.org/pdf/2406.03486 ; Intent Matters: https://arxiv.org/pdf/2506.07626
- Bridge: https://aclanthology.org/2024.naacl-long.120/ (round 2)
- IFScale: https://arxiv.org/abs/2507.11538
- Let Me Speak Freely?: https://arxiv.org/abs/2408.02442 ; https://preview.aclanthology.org/credits/2024.emnlp-industry.91
- PrefEval: https://arxiv.org/abs/2502.09597 ; LLMs Get Lost in Multi-Turn Conversation: https://arxiv.org/abs/2505.06120
- Chirpy Cardinal: https://arxiv.org/abs/2008.12348 ; https://ai.stanford.edu/blog/chirpy-cardinal
- LLM repair: https://aclanthology.org/2026.acl-long.651.pdf ; voice-assistant repair: https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2024.1356847/pdf
- CIMA: https://people.ischool.berkeley.edu/~hearst/papers/cima_bea_2020.pdf ; spoken vs typed tutoring: https://people.cs.pitt.edu/~litman/ijaied06.pdf
- Conversational uptake: https://mpoweringt.owlstown.net/publications/24670-measuring-conversational-uptake-a-case-study-on-student-teacher-interactions
- Full-Duplex-Bench: https://arxiv.org/abs/2503.04721 ; M3-DuplexBench: https://arxiv.org/html/2607.29125
- Fillers: https://arxiv.org/html/2507.22352v1 ; https://arxiv.org/pdf/2508.11781
