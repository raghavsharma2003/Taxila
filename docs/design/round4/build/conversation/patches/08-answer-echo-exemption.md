# Patch request 08 (design note only; no code): an answer-echo exemption for reviewed kit content

Stream 4A, 2026-10-10, for the main session's safety review. Status: **proposal**. Nothing in `server/director/safety.js`,
`server/safety/**` or `server/director/classify.js` changes until it is approved.

## The problem

`safety-kit-hits.md` lists the kit strings that scanSafety fires on. After patches 05 and 07, the ones still firing are
**real kit content in ordinary wording**, not canonical collisions:

- six `families` (fear) hits on a bare "bully" in civics and story strings, e.g. "Who would stop a bully or a thief?" and
  "the strong might bully or steal from the weak … matsya nyaya";
- the sportsmanship answer with मारपीट (`lexicon:maarpeet_maar_padti`);
- the Baba Bharti summary with "kisi ko mat batana" (`lexicon:secret_dont_tell`);
- the c7 answer to "whom can you talk to", which names bullying and Childline 1098 (`families` fear).

A child who gives the RIGHT answer in the kit's own words gets the safeguard move and the helplines. The predicate cannot be
narrowed for these. "bully", मारपीट and "mat batana" are real disclosure words, and a shape-level mask (the 05/07 method) would
quiet real disclosures too.

Two true-content strings must **keep firing**: "I hurt myself" (a grammar example; out of context it is a self-harm
statement) and the online-stranger prompt ("Send me your photos and your school's name").

## The proposal

A turn-level exemption that never touches the pure predicate. The predicate keeps returning what it returns today. One
helper decides whether this child turn's predicate hit is an echo of reviewed kit content.

```
server/director/echo.js   (new, owned by the main session / safety)
  echoExempt({ text, item, hit }) -> { exempt: boolean, why: string }
```

It returns `exempt: true` only when ALL of these hold:

1. **Reviewed content only.** The matched kit string is on an allow-list the safety review signs off, one entry per string:
   kit id, item id, field, a sha256 of the normalised text, and the `via` it fires on. The allow-list is data
   (`data/kits/safety-echo-allow.json`), built from `safety-kit-hits.md` and reviewed by a human. "I hurt myself" and the
   online-stranger prompt are never on it. A kit rebuild that changes a listed string drops its entry (the hash no longer
   matches), so new content never inherits an exemption.
2. **The CURRENT item only.** The child's text is compared with the item now on the card: prompt, answer, acceptables and
   hints, in every language field. Never another item, and never a teacher line.
3. **Echo, not more.** After normalisation (lower case, NFKC, punctuation and filler stripped: "umm", "matlab", "i think",
   "shayad"), the child's text equals the allow-listed string, or is a contiguous span of it at least 6 words long that holds
   the firing words. Nothing outside the kit string may remain.
4. **No first-person addition.** If anything the child adds outside the matched span holds a first-person pronoun or verb
   form (main, mujhe, mera, meri, mere, I, me, my, myself, मैं, मुझे, मेरा …), there is no exemption, even if every other test
   passes. "ek bully mujhe roz maarta hai" is never an echo of "Who would stop a bully?".
5. **Same firing reason.** The predicate's `via` on the child's text equals the allow-list entry's `via`. If the child's line
   fires for any other reason, there is no exemption.

When it is exempt, the turn is graded as an answer and the predicate's distress flag is not set. **The model distress read
still runs on the turn** (needsModelDistressRead treats an exempted turn like `source: "exact"`), so the backup floor stays.
The exemption is logged on the turn (`safetyEcho: { via, entry }`) and counted in the parent-free audit table. It is never
silent.

## Where it sits

- **`classify.js classifyFast`**, right after `const safety = scanSafety(text)` (line 442 today):
  `if (safety.distress && target.mode === "item" && echoExempt({ text, item: target.item, hit: safety }).exempt) safety = { distress: false, kind: null, echo: true }`.
  This is the one place a predicate hit becomes `flags.distress` for a graded turn.
- **Every other consumer of the child's turn must agree**, or the exemption is half-applied. Today they are:
  - `brain/turn.js` (lines 223, 280, 379, 712: the safety gate, help chips, the relational seam input, the disclosure kind);
  - `relational/signals.js` (`harm`);
  - `duplex/understand.js` and the duplex partial-safety state (`safetyPending`, OR-ed into the turn in turn.js);
  - `latency/routes.js` (the ack);
  - `voicesig/lesson.js`;
  - `conversation/screen.js`;
  - the session intake.
  The safe way is ONE call per turn: turn.js computes `turnSafety = echoExempt(...) ? quiet : scanSafety(childText)` once,
  and passes it down. The duplex floor's sticky `safetyPending` must accept the same exemption, or a spoken echo still fires
  from the partials.
- **Never inside `safety.js` or `server/safety/**`.** The predicate stays pure and context-free, and its tests and
  fingerprint do not move.

## Risks

1. **A real disclosure in kit words.** A child who is being bullied may answer "Who would stop a bully?" with words that
   echo the kit. Rule 4 removes any line with a first-person addition. A pure echo carries no first-person content, and the
   model distress read still runs on it. What remains is a child reading the kit's line aloud with nothing of their own,
   which is not a disclosure on its face.
2. **Spoken lanes.** ASR does not reproduce kit text exactly. Rule 3's span match must be tested on the spoken battery's
   transcripts. An exemption that fires only on typed echoes is fine (it fails closed on speech). One that fires on loose
   overlap is not.
3. **Drift.** A kit rebuild that edits a listed string must drop its entry (the hash). A test should fail when an allow-list
   entry's hash matches no kit string.
4. **Half-applied exemption.** If only classify.js applies it, relational signals, the duplex floor and the ack still treat
   the turn as distress. The proposal therefore makes it one per-turn decision in turn.js.
5. **Scope creep.** The allow-list is the scope. An entry is added only through the same review as a safety patch, with the
   string, its `via` and the reason.

## Proof standard (if approved)

- A review test: each allow-listed string, typed as the current item's answer, is not a safeguard. The same string with a
  first-person addition ("… aur ek bully mujhe bhi maarta hai") is. "I hurt myself" and the online-stranger prompt still
  fire. An echo of an item that is not current still fires.
- The both-arms diff over every kit string and eval utterance with the exemption on: 0 new firing. Also the count of
  exemptions on the battery and on the round-2 and round-3 adversarial suites (expected 0: none of them echoes kit text).
- `w2i-safety` 39/39; adversarial r2 10/10, r3 unchanged; persona invariants; the safety-robust fingerprint unchanged
  (the predicate does not move).
