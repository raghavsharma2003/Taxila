# Games: three engine needs from Studio's judged regeneration (design notes, not built)

2026-11-11, stream C2 Games, for main. These three scripted topics have no game target, because no play engine can show the mix-up the lesson is about. Each note says what the child does, what the law and the grade are, how the mal-rule plays out on screen, and what evidence goes back to the lesson. Each is a **new mode on an existing family**, not a new family, so the picker, the because records, the cert and the phone seam (tests/r8-play-phone-seam.test.mjs) carry over.

The order is main's: value first.

## 1. c6-maths-ch02-t03, measuring an angle: `kon/place` (the child places the protractor)

**Today.** `kon/set` draws the protractor already centred on the vertex, with its base on the first arm. That exercises only `wrong-scale`, which reads 180 − θ. The kit's other mix-ups cannot happen on this board:
- `vertex-off`: the bottom edge goes on the vertex, not the centre point;
- `join-wrong-end`: the degree mark is joined to the far end of the first arm;
- `tool-size`: a bigger protractor is thought to read more.

**The child.** An angle is drawn with its two arms. The protractor lies loose beside it. The child:
1. drags the protractor by its body (it translates);
2. turns it by a handle on its rim (it rotates about its own centre point);
3. locks it ("Rakh do");
4. reads the angle off the scale, by choosing on the scale or on a number wheel. The `set` variant instead draws the second arm from a dot at the mark.

At 360 px the protractor is at least 200 px wide and both handles are at least 48 px. Rotation snaps to 1°.

**The law (pure, in `kon.logic.ts`).**
- The placement passes when the centre point is within `tolPx` of the vertex and the base line is within ±3° of an arm.
- The reading is graded against the angle the protractor *as placed* would show, not against the true angle.
- A wrong placement can therefore be read "correctly" and still give the wrong number, and the law draws that: the scale's 0 is on the arm, but the centre is off the vertex, so the arm through the mark misses the true second arm.

**Mal-rules (malActs):**
- `vertex-off`: the bottom edge sits on the vertex. The centre is offset by the base-to-centre depth along the normal, so the read value is off and the drawn arm visibly does not start at the vertex.
- `wrong-scale`: unchanged from `kon/set` (180 − θ).
- `join-wrong-end`: in the `set` variant, the second arm is drawn from the mark to the far end of the first arm, not to the vertex. The law shows the angle actually made at that far point.
- `tool-size`: a second level type. The same angle is shown with two protractors of different sizes, and the question is "which reads more?". The answer "the same" is right; picking the bigger tool plays out as both readings shown side by side.

**Evidence.** On top of today's verdict, first_try, misses and mal, the result carries:
- `placed: {centreErrPx, baseErrDeg, ok}`
- `read: n`
- `mal ∈ {vertex-off, wrong-scale, join-wrong-end, tool-size}`

The facts row gets `placed=ok|off`, so the teacher can say "centre on the corner" without guessing.

**Size.** Logic, generator, solver and malActs, plus the view (drag and rotate, with hit areas). The coverage rule changes from `set` to `place` with s3 and s2. A cert at p360. Roughly one build agent, one session.

## 2. c6-maths-ch02-t02, naming an angle: `kon/name` (letters on the vertex and arms)

**Today.** `kon/zone` covers kind and compare, with no letters, so `vertex-name` (the letters can be in any order, and the vertex need not be the middle letter) cannot be asked.

**The child.** A figure with two or three angles that share rays. The points carry letters: A, B, C, D, plus O at a shared vertex. There are two goals:
- `say`: one angle is lit, and the child taps three letters in order to name it.
- `find`: a name such as ∠ABC is shown, and the child taps the arc of the angle it names.

**The law.** A name is right when its middle letter is the angle's vertex and its outer letters lie on that angle's two arms, in either order (ABC = CBA). The generator only draws figures where a wrong-order name still names *something* checkable: either a different drawn angle, or the triangle corner at an arm's end point.

**Mal-rule `vertex-name` (and the `say` variant's "any order").** The middle letter is an arm point, not the vertex. It plays out with the law lighting up the angle that the written name *actually* denotes, at the middle letter, drawn dashed when it is not one of the figure's angles. The child sees a different corner light up than the one she meant.

The kit's other mix-ups are already on `kon/zone` (`longer-arms`, `arc-size`) or belong to `kon/turn` (`full-turn-zero`), so `name` takes only this one.

**Evidence:** the name chosen, `vertexOk`, `armsOk` and the mal.

**Size.** Small. Logic and a view on `kon.lines`, whose lettered points and rays already exist for `pair/linear`. About half a session.

## 3. c4-maths-ch14-t01, tally marks: `stambh/tally` (tallies drawn in fives)

**Today.** `stambh/picto` covers the topic's pictograph mix-ups (`count-pictures`, `half-picture`). The kit's third mix-up, `tally-four` (a bundle read as 4, or five written as five standing lines), has no board.

**The child.** A small scene of things to count passes by: bangles on a stall, or vehicles at a crossing. The child keeps a tally with two buttons, "|" (one standing line) and "╱" (the line across). The two goals:
- `keep`: after the scene, she writes the totals into the table, where the topic title, "using tally marks and a table", meets the existing picto mode.
- `read`: given a row of tallies, she says how many.

The buttons are at least 64 px for the 6–9 band. Bundles wrap so that ten bundles fit in 360 px.

**The law.**
- A bundle is four standing lines and one line across, worth 5.
- The count is 5 × bundles + singles.
- In `keep`, a fifth standing line without a cross is a legal mark but makes no bundle. The law groups by 5 at commit, and shows it.

**Mal-rule `tally-four`:**
- In `read`, the answer is 4 × bundles + singles. It plays out on a number line that shows her total, then the true total, with the gap equal to the number of bundles.
- In `keep`, five standing lines are drawn and no cross. The law's commit pass circles each group of five standing lines and marks it "not a bundle", and the total read off her own tally comes out short.

**Evidence:** answer, bundles, crossesMissing and the mal. The facts row gets `bundles=n`.

**Size.** Logic, generator and solver for the new mode, a view reusing stambh's row layout, a coverage entry (s1) and a cert. About half to one session.

## What I would drop for them

Nothing is in flight in Games now: round 8 Play P1–P3, the follow-ups and the phone seam have all merged. The three together are about two build sessions, at the model policy's medium effort, with no paid run.

The only cost is what main would otherwise give Games next. Unless that's something else, I would do them in the order above: `kon/place`, then `kon/name`, then `stambh/tally`.
