# 012: five picture-view faults Learning's readers found (dc-r8-director23 C)

**From:** the main loop, 2026-11-16. **To:** Studio. **Source:** `docs/status/learning.md` on `claude/r7-learning` `3e25c5c60` ("For Brain and Studio, through main"); the director23 judgement, `docs/design/round7/judgements/director23-2026-11-16.md`.

**Why now.** A child who asks for a picture now always gets the board's second view (16 of 16 in director23), and from director24 each view has a caption Learning wrote against what `altCall` draws. The readers who wrote the 156 captions found views that are wrong or that give an answer away. A caption cannot fix a picture.

1. **`wholes@1` takes at most two wholes.** A three-whole card's picture view fails with `wholes_count` and draws nothing new (c4 s3 c3; c5-t02 s1 c2; c5-t02 s3 c1). Draw three, or give those boards another second view.
2. **A strip board's second view is circles** while the card says "upar wali patti" and "neeche wali patti". The view of a strip board keeps the strips' order and a label that says which is which, or is a different drawing of strips (a number line with the same parts).
3. **c5-t02 s3 e3's view draws 3/5 and 3/8 as circles in unequal pieces.** Every fraction view has equal parts; a law in the view's own checks asserts it.
4. **c5-t01 s1 e2's view draws an 8-part strip just before the card whose key is 8.** A view never shows a count, part or figure that a later card in the same skill asks for. The picture turn already has the later cards' keys (`laterKeys`); the view is chosen or parameterised with them, as the caption is.
5. **The fallback lines (`altSay`) say "sankhya rekhayein" and "nishaan"** where the c5 chapter says "number line" and "mark". The fallback uses the script's own terms (`inScriptTerms` exists for this).

Also still open from director22: the c4 s3 e1 board draws the 4-part strip while the child is asked to predict it; and `011-second-play-changes-colours.md`.

**Check for each:** a test over every board of the four pilots that a picture request can reach (Learning's `viewCaption` marks them): the view draws, its parts are equal where it shows a fraction, it shows nothing in `laterKeys`, and the caption's nouns are true of it. Report in `docs/status/studio.md` on your branch and by pushing, per `docs/patches/to-brain/029-report-by-push.md`.
