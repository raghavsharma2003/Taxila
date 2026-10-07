# Round 2 — natural conversation: research and design

Stream: conversation (V5.2: battery >= 85%, every intent family >= 70%, 0 confusing replies). Written 2026-10-06,
before the build. Measured results are in [RESULTS.md](RESULTS.md); the patch order is in [APPLY.md](APPLY.md).

## 1. The problem, from our own data first

The 2026-10-05 battery (`docs/design/ship5/p5-interaction/battery/work-2`, 355 cases, two judges) was 56.3% strict.
I read every failing row of the weakest intents. Most of them are one defect, not 47 different ones:

| defect | where it shows | share of the failing rows read |
|---|---|---|
| **the request is dropped and only the card question is posed** | out_of_bounds "reengages: only repeats the question" 9/11; adult_voice 3/4; frustration "repeats the question without a smaller step"; multi_intent; owner-2 R3 bare question x4 and R7 "aap kaun ho?" answered with the question alone (Jaccard 1.00); p5 4/40 card-question-only | about half |
| a reading the code never made | noise 0/5: garbled turns took the default path (the note's `noise` mapped to nothing) | 5 |
| a request that lasts one turn | `s.prefs` (method instructions) written by state.js and **never read** by the compiler; owner-4 "Hindi mein samjhao" next turn mixed English ("equal parts", "total") | 3 + owner-4 |
| a shape too vague to act on | animation_request 0/5: an engine was mounted (code check passed) but she never said what moves | 5 |
| grading (not this stream) | answer_partial 0/4 graded fully correct (ui.verdict correct) | 4: belongs to the truth stream |
| the checker, not the product | owner-4 S.slowly: "main dheere bolungi" (I will go slowly) matched the "told the CHILD to speak slowly" regex | 1 |

The mechanism of the first defect is visible in `brain/say.js`: the reply model is asked to do two jobs in one
generation (respond to the child, then re-pose a verified question **verbatim**, appended last with the strongest
wording in the prompt). When it runs short of the turn budget, or the pinned question dominates, it does the second
job and drops the first. The guards then catch "bare" and rewrite, but a rewrite of the same two-job turn fails the
same way, and the last-resort code repair (`keepLastLeadQuestion`, `hintStatements`) has no response to the child in
it to keep. A related arithmetic trap: `REPLY_MAX_WORDS` is 40 for class 6+ and counted the card question; a 30-word
kit question left 10 words for the response.

## 2. How the best products and papers solve this

**Separate the decision from the words, and give the generator one job.**
- Bridge (Wang, Zhang, Robinson, Loeb, Demszky, NAACL 2024; 700 real tutoring conversations): an expert's remediation
  decision (error type, strategy, intention) given to the model before it writes made GPT-4's responses +76% more
  preferred; random decisions cut quality by 97%. What transfers: our Director already makes the decision (the move and
  its shape). What we lacked is a generation step that only has to word that decision.
- MathDial (Macina et al., Findings EMNLP 2023; 3k dialogues): teachers mostly use Focus and Probing moves, Telling is
  rarest; LLM tutors fail by telling too early and by incorrect feedback. Transfers: keep the key out of the words
  (unchanged: the leak guard runs on every turn, including the new one).
- LearnLM (Google, 2024-2025): the tutor rubric scores "keeps on topic" and "manage cognitive load" separately; system
  instructions like "stay on topic" are followed even when the student tries to get around them. Transfers: an off-topic
  child must be answered *and* brought back (two jobs), which is exactly what our one-generation turn kept dropping.

**Structure the conversation in code; let the model fill a slot.**
- Duolingo Video Call with Lily (engineering blog, 2024): a fixed blueprint (opener, first question, free conversation,
  closer) where "the System whispers in Lily's ear" at set points; a mid-call check, *"Does it seem like the learner
  wants to lead this conversation? If yes, ignore what you originally were going to talk about"*, fixed replies that
  answered a learner with an unrelated question ("That's nice. Have you heard about Swiss folk music?"). Learners can
  say "What? I don't understand" and Lily repeats or slows down. Transfers: (a) the question on the card is our
  blueprint's fixed part and should be owned by the system, not re-generated; (b) "the child is leading now" is a check
  the turn must pass; (c) repair ("what?") is a first-class move.
- Khanmigo (Khan Academy blog and the 2026 Chalkbeat-reported engagement study): a moderation layer for off-topic and
  "do my homework" turns, and a consistent return to questioning. The study found many students sent off-topic messages
  or tried to extract answers. Transfers: off-topic and extraction attempts are the common case for children, not the
  edge case, so the decline-and-re-engage turn has to be reliable.

**Models drop earlier instructions; the newest, narrowest instruction wins.**
- LLMs Get Lost in Multi-Turn Conversation (Laban, Hayashi, Zhou, Neville; Microsoft/Salesforce 2025; 200k+ simulated
  conversations): -39% average from single-turn to multi-turn, mostly unreliability; models commit early and do not
  recover. Preference slots are forgotten over turns ("preference slot oblivion", arXiv 2508.01739). Transfers: a child's
  "step by step" or "Hindi please" must be **state that code re-sends on every turn**, never something the model is
  trusted to remember from the history. Our own law agrees: position is mechanism (a rule appended last fired 8/8, the
  same rule mid-prompt 0/8, html-portfolio).

**Repair for children.**
- Development of conversational repair (Brinton et al., JSHR 1986) and preschool repair requests (JSLHR 2019): children
  answer clarification requests most of the time, and older children (9+) handle stacked requests with a wider range of
  strategies; online, children repeat more and revise less. Voice assistants mostly fail the human "huh?" repair
  (Galbraith, arXiv 2311.03952). Transfers: when a turn is garbled, the no-blame "say it again / finish it" is natural for
  9-15 year olds and must never be graded; a stutter that trails off on "the" / "ki" is the signal, not a wrong answer.

## 3. What transfers to a Hindi-English voice tutor for 9-15 year olds, Azure-only

- No new model and no new call on the common path: the lead slot is the SAME reply deployment (`DEPLOY.reply`), the same
  single call, with a different last instruction. An extra call happens only on a repair (a turn that is still bare or
  a repeat after every other repair), which was already a rewrite path.
- The floor is untouched: scanSafety and the model distress read run on every committed turn as before; the joined turn
  goes through every truth guard (floor, leak, praise, register, screen, script, stage); the card question is verified
  kit content kept byte for byte.
- Hindi: pinned Hindi gets an explicit everyday-words rule; maths and science terms may stay English (NCERT Hindi-medium
  usage differs by state; the child asked for Hindi, so everyday words are Hindi).
- MS Code of Conduct restriction 12: nothing here infers emotion; "unclear" is about the words heard, never the child.

## 4. The design chosen, and why

1. **Lead slot** (`server/conversation/compose.js`, patch to `brain/say.js`). On a turn with a question pinned on the
   card that either answers a child's request or re-poses the same question, the model writes ONLY what comes before the
   question, under a last-positioned note naming the request's own shape; code strips any question (and any copy of the
   card question) from that text and appends the card question byte for byte. A lead of fewer than 4 own words falls
   through to the old one-call path. Length is counted on her own words (<= 24 / 30), so a long kit question no longer
   squeezes the response out. The same lead-only call is the last repair for any pinned turn still bare or repeating
   after the existing repairs, kept only if it adds no problem. Kill switch `TAXILA_P5_LEADSLOT=off`.
   Why not a second "planner" call: Bridge's gain came from giving the decision, which we already have; a planner adds
   ~1 s on every turn. Why not more prompt wording: the prompt already said "two parts — first: …" (p5 second pass) and
   the failure persisted on prod; the defect is structural.
2. **"unclear" reading** (lexicon `fragmentLike`, policy `noise → unclear`, state `unclear` → a no-blame "say it again
   or finish it" before the card question). Detection is a shape, not phrases: a stuttered function word or a filler,
   at least one content word, and a last word that cannot end a thought; reduplication ("dheere dheere", "cham cham")
   and article-drill answers ("a the the") are excluded and tested against all 44k kit answers.
3. **Steering persists**: `move.prefs` (the last two method instructions) is rendered in the MOVE section on every later
   turn (droppable, so it can never break the budget gate); pinned Hindi gets the everyday-words rule.
4. **Animation**: the visual shape for a moving request names what on the screen moves or changes as they drag or tap,
   and never promises a video that does not exist.
5. **Checker fix**: owner-4's childSlow regex matches imperatives only.

6. **Fallback lead** (`server/conversation/fallback-lead.js`, patch 05). Quotas are maxed and the reply lane has no
   failover, so a 429 is the common degradation: an outage turn with a card question gets a fixed code lead for what the
   move is doing (identity keeps "AI teacher" with every model down) instead of the bare question.

Added after measuring (2026-10-07, each from a battery row, each with a unit test; see RESULTS.md):
- a lead that names the item's key (or an accepted form) is refused — the leak guard cannot see a key the question
  itself names (odd/even), and a lead written before the question gave it once;
- a lead that drops, pauses or defers the question is refused — it contradicts the question code appends;
- content requests (answer their question, clarify, example, story, another way, why, how) keep the one-call path — their
  leads sat next to the key and showed no gain; the note lost "fully" and "what they asked for" (a child who asked for
  the answer was given it), and says "never its answer";
- the last lead-only repair never runs after a floor or leak catch.

What would reverse the lead slot: a measured drop in turn coherence (the judges' "flows naturally" or the owner's ear
saying the joined turn sounds stitched), or a rise in leaks (the lead is generated without seeing the question at the
end of its own words). Both are measured in RESULTS.md.

Sources:
- Bridge: https://arxiv.org/abs/2310.10648 ; https://aclanthology.org/2024.naacl-long.120/
- MathDial: https://arxiv.org/pdf/2305.14536
- LearnLM: https://arxiv.org/pdf/2412.16429 ; https://storage.googleapis.com/deepmind-media/LearnLM/LearnLM_paper.pdf
- LLMs Get Lost in Multi-Turn Conversation: https://arxiv.org/abs/2505.06120
- Preference slot oblivion: https://arxiv.org/html/2508.01739v1
- Duolingo Video Call: https://blog.duolingo.com/ai-and-video-call/
- Khanmigo: https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/ ;
  https://www.chalkbeat.org/2026/08/25/ai-tutoring-students-khanmigo-khan-academy-engagement-study/
- Repair in children: https://pubs.asha.org/doi/10.1044/jshr.2901.75 ; https://pubs.asha.org/doi/10.1044/2019_JSLHR-L-18-0402
- Voice-assistant repair: https://arxiv.org/abs/2311.03952
