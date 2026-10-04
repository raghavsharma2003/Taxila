# Owner reset — 2026-10-04 (hands-on test of production, rated 0/100)

Binding. Outranked only by the child-safety floor. Every stream, review and acceptance test must cite this file.
Node ids: `owner-reset-2026-10-04`, `owner-test-0-of-100-2026-10-04`, `rj-plumbing-batteries-as-acceptance`.

## What the owner found (verbatim intent, voice-dictated)
1. **Wrong age.** Onboarding and everything after it looks like it is for a five-year-old. The app targets classes 4-7; children in that band are
   roughly 9-13 (owner: "up to ~15"). They would not use it. "Stupid gimmicky" — babyish visuals, tone and interactions must go.
2. **Wrong level.** Selected class 4 and was asked "how many sides are in a dice" — first-year content. Questions must match the selected class and
   the child's demonstrated level (NCERT/CBSE class 4-7 depth), adaptively.
3. **Games are not games.** "Selecting some options, entering a number like a calculator." Required: real, real-time, genuinely fun games
   (action, physics, strategy, timing, simulation) that teach the concept — not quizzes in costume.
4. **Animations are super cheap and basic.** Required: rich, polished, cinematic explanatory animation and visualisation (3Blue1Brown/Brilliant/
   Kurzgesagt quality bar), interactive where it helps.
5. **No reasoning, does not listen.** She fails to understand what the child says, cannot follow "do it this way" instructions, overlaps the child.
6. **Diversion handling is absent.** When the child switches topic she just continues the old topic. Required: notice the diversion, say so kindly
   ("we're drifting — let's finish this, then I'll come back to your question"), park it and return to it later; if the child insists and it is
   within boundaries, engage briefly; if out of bounds, decline warmly and win attention back to the lesson in an engaging way.
7. **Child saying "end the lesson" ends it.** Must not: acknowledge, check in, offer a short wrap-up/break, respect parent limits.
8. **Steering ignored.** "Talk about something else", "explain differently", "show me a diagram" — not done.
9. **Visible failures.** A build failed to deploy while she talked about something else and something else showed. Required: ZERO visible failure —
   the child never knows things are being built; fallbacks are invisible and seamless.
10. **Interaction model is weird.** Click-to-speak, and she stops speaking when you click. Required: natural hands-free, full-duplex conversation
    (see docs/research/duplex/**), no overlaps, natural turn-taking.
11. **Basic UI controls broken.** Date and time selection could not be done properly.
12. **Presentation.** No proper diagram, no proper flow; nothing was presented well. Whole product design must be rethought.
13. **Voice robotic; teacher animation bad** (voice v4 and the 2D puppet ≥ 4.5/5 workstreams continue).
14. **Generation frequency.** Generated content (diagrams, whiteboard, games, animations, images) should appear FREQUENTLY, driven by the child and the
    conversation — adaptive, not rare and not fixed.
15. **The bar.** "Not an impulse app, not an MVP, not cheap." Build it like magic: innovative, deep, hard, real work; things built and deployed without
    fail; hundreds of problems must be found and fixed. Stop being easy.

16. **Duplex architecture is core, not optional.** The listening-thinking-speaking-building teacher (docs/research/duplex/**,
    workstream wf_3622f8d6-318) is a first-class Wave 2.5 stream with its own experience acceptance: natural gaps after real turn ends, no
    talking over the child, no cutting off a thinking child, backchannels at the right moments, instant yield on barge-in, builds started from
    what the child is saying. It replaces click-to-speak.
    **Correction (same day):** silence must not be the turn-end mechanism. Build Griffin's principle: a continuous conversational engine
    that re-decides every sub-second mini-turn and listens while she speaks. Generation stays cascaded; the decision engine is ours.
    Silence is only a feature and a backstop (`owner-duplex-no-silence-gate-2026-10-04`).

## What changes in how we work
- Acceptance = real child-like sessions judged on experience (transcripts reviewed), plus the owner's own test. Plumbing batteries are necessary,
  never sufficient (`rj-plumbing-batteries-as-acceptance`).
- Design target is preteens/teens (9-15): mature, cool, game-grade UI; no cartoon-baby aesthetic, no childish copy.
- Content difficulty is calibrated to class and adapts to the child.
- Studio quality bar: real-time games and cinematic animation; generation frequent and adaptive; zero visible failure.
- Conversation intelligence: reasoning about what the child means, steering, diversion handling with boundaries, natural duplex turn-taking.
