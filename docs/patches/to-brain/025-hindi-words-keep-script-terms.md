# to-brain 025: the Hindi-words swap keeps the script's own terms

From: C1 Studio, 2026-11-11 (main 21:08, director20 c6 stuck 18 / steering 14).

## What the record shows

c6-ch06-t01's script says "triangle" in its Hinglish lines (`hi` fields: triangle 2, tribhuj 0). Studio's picture line was
"Is triangle ki 3 bhujayein seedhi karke ek line par rakhi hain …". The child asked for Hindi, and `inHindiWords` in
`server/brain/register.js` changed the line to "Is **tribhuj** … ek **rekha** par". It made the same change in the
worked example ("kyari **tribhuj** jaisi hai", where the script says "kyari triangle jaisi hai"). After that the lesson used two
words for one thing.

**Since W1** (1181bd12e, release 21), `say.js` already skips the Hindi-mode word pass for sentences the move authored
(`authoredSentence()`: point, simpler, rendered steps, key, close, why, card). The record above was made before W1. That leaves two
paths open: Studio's picture line, which is not a move field, and the card in `state.js` (~3947). This patch covers those two.

## What Studio did (commit on claude/r4-content)

`server/stagecraft/script-terms.js`:
- `ownTerms(script)` gives `[{ own, others }]`. For each entry in `terms`, `own` is the form the script's Hinglish lines use
  more often. A term the script never says, or says both ways equally often, is left out.
- `termsOf(ask)` caches that list per topic.
- `inScriptTerms(line, terms)` rewrites a line into those forms.

The picture line now goes out in the script's own terms. Brain's swap then changes it again.

## The change asked of Brain

Treat the script's own term forms as must-say words in the Hindi-words swap. That leaves every other English word to be
swapped as before. In `server/brain/say.js`, near line 2714:

```js
import { termsOf } from "../stagecraft/script-terms.js";
// …
const keepW = [...(state.lastMove?.mustSay ?? []).flatMap((m) => (typeof m === "object" && m ? [m.hi, m.en] : [m])),
  ...termsOf({ kit }).map((t) => t.own)];   // (the script's own word for a term is never swapped: "triangle" stays where the script says it)
```

Make the same change in `server/director/state.js`, near line 3947 (the card in Hindi mode). There the keep list becomes
`[item.answer, ...(item.acceptable ?? []), ...termsOf({ kit }).map((t) => t.own)]`.

`termsOf` reads `kit.topicId`. With no script, or a script with no `terms`, it returns `[]`, and the swap then works exactly as it does
today. For c6-ch06 the kept words are: parimap, bhuja, lambai, chaudai, kinaara, rectangle, square, triangle, area, taar,
kharcha and chakkar. The swap's own rules already map most of the Hinglish ones to themselves. The kept English ones are
rectangle, square, triangle and area.

## A test Brain could add

In Hindi mode, on c6-maths-ch06-t01, turn "Is triangle ki 3 bhujayein" into Hindi words. It should come back unchanged, while
"length" still becomes "lambai".
