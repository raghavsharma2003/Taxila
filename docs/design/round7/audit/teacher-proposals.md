# Teacher audit: proposals for the owner (round 7, 2026-11-10)

"Not good enough" findings from `teacher.md`. Nothing here is built; each is a short case for a decision.

## P-1 (TEACHER-08): her reply's checks as one table, not one long list

**What happens now.** Every draft of her line (`server/brain/say.js textReply`) is judged by 50 checks in one list
(`say.js:1095-1167`): praise on a wrong answer, a leaked key, a second question, a line that drifts from the card, a line
that is too long, and so on. Each check was added after a run showed the need, each is switched by its own flag, and
the fixes are spread over a separate repair step (`shapeFix`) and a model rewrite. A child does not see this directly;
what they see is the result when two checks fight: a reply cut to the bare question, or her explanation dropped so that
a later check is satisfied. Runs director8 to director16 found several of these by hand.

**Proposed change.** Keep every check, but write them as rows of one table: id, when it applies, the check, its repair,
and its order. Add one test that runs every repair against every other check on the recorded lines (director runs) and
fails when a repair re-trips another check. A new check is then a new row plus a green run of that test.

**Cost.** About two days of Brain time, no model calls (the recorded lines are already in `evals/`). Risk: a
behaviour change during the move; the recorded-line test is what guards it.

## P-2 (TEACHER-06): the agent lane reads the kit whole, or does not run

**What happens now.** On the agent lane (owner cohort only) the teacher sees the first 180 characters of each offered
question, the first 200 of the card, and the first 4 key ideas. 1,666 of 25,194 kit questions are longer than 180
characters; 669 of 830 topics have more than 4 key ideas. She can pose a question she has only half read.

**Proposed change.** Measure the per-turn state against a stated budget and throw when it would cut (the turn then
falls back to the Director, as every agent failure already does), instead of cutting. Raise the clips to the kit's own
limits first, so the throw is rare.

**Cost.** Small (one file, `server/agent/prompt.js`), plus one sim-lab run on the owner cohort's topics to see the
fallback rate. Tokens per agent turn rise a little.

## P-3 (TEACHER-01): one protégé, named by the server, drawn by the client

**What happens now.** Classes 1-3: she says "teach this to Golu, a pretend baby elephant", while the screen shows a
cloud pup, a pebble or a sprout.

**Proposed change.** The server picks the young protégé per child from the three sprites (each with a name and a
"what": e.g. a cloud pup called Golu) and sends its kind with the lesson start; the client draws that kind instead of
hashing the name itself. The owner chooses the three names.

**Cost.** Brain (asha.js, shapes, start response), Face (Protege.tsx reads the kind), a contracts field. Small; one
owner choice of names.
