# 007 · Cold-start answers: two quick questions, never a quiz (Learning → App, round 7)

Learning built cold-start placement (main 2026-11-07, item (c)): a new child's starting point in each subject comes from
two onboarding answers. The server side is merged on `claude/r7-learning` and the parent corner already asks and shows
it (src/parent/SchoolPlan.tsx `FeelPicker` and the "Where {name} begins" note). Two places in App's onboarding need to
ask the same thing, so most children arrive with answers on day one.

## API (server/routes/placement.js)

```
POST /api/placement/onboarding { childId, parentView?: { [subject]: "hard"|"fine"|"easy"|"unsure" },
                                          childPicks?: { [subject]: "tricky"|"okay"|"easy" } }   → { note }
GET  /api/placement/note?childId=                                                                 → { note }
```

- Send only what the screen asked: answers merge with what is stored. Unknown subjects or values are ignored, and
  "unsure" clears a parent view.
- Subjects are the class's own: maths, evs (classes 1-5) or science (6+), english, hindi, sst where a curriculum exists.
- `note.lines.{en,hinglish,hi}` are checked parent lines. Show them as they are, never rebuilt client-side.
- Client helpers already exist in `src/parent/api.ts`: `parentApi.setParentView` and `parentApi.placementNote`.

## Ask 1: parent, in set-up (src/onboarding/ChildProfile.tsx)

Put this under the optional "Which maths chapter is school on?". For the 1-2 main subjects of the class:

> **How does Maths feel for {name} right now?**  [Hard] [About right] [Easy] · Not sure

- Optional, one tap each, chips (no native select; OWNER-RESET #11). Reuse `FeelPicker` from src/parent/SchoolPlan.tsx
  if it fits the step's style.
- Post `{ parentView }` after the child is created, alongside the school chapter.

## Ask 2: child, at Hello (src/child/screens/Hello.tsx)

Put this after the interest tiles and the avatar, as one playful row per main subject (maths, plus EVS/science):

> **Maths feels…**  😊 easy · 🙂 okay · 😟 tricky

- Three big faces, no right answer, no score, no feedback beyond "Got it". It must not feel like a test: no question
  marks on items, no timer, and no item content.
- Post `{ childPicks }` once picked. Skipping is fine; the parent's answer alone is enough.

## What it changes

- The answers make one wide prior on the KT θ scale per subject.
- Topic choice starts from it when the school chapter is unknown.
- The conductor gives a foundation share when the estimate sits below the class (R9).
- It runs the subject's first week success-first, with the first two lessons bringing no new skill (R15).
- Lessons then refine it covertly: once θ settles (sd ≤ 0.7), live θ decides where lessons go next.
- Offline sim (evals/placement-coldstart/sim.mjs, 300 children per class, classes 3-8, real θ engine): with the answers,
  median lessons-to-settle fall from 9 to 6, and too-hard first lessons fall from 68% to 39% (model population) and
  from 28% to 8% (mostly on-track population).

## Copy rules

- The parent never sees a level word: no "behind", "on track", "ahead", and no class number for a level.
- The note's lines come from registered shapes (server/reports/templates.js `place.*`) and pass the report gate.
