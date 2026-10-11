# The image rung: a picture the child asks for, on the stage (main's (B))

**Status:** a design only. Nothing is built here. Release 13 ships the floor, (A): she never offers a picture that cannot be made, and when one is asked for she says plainly that she can't show it and describes it in words. That floor is in `state.js` `visualUnavailable` and `tests/r13-visual-honest.test.mjs`. The r12 fix-2 predicate (`director/say.js` `screenClaimProblem`) makes "screen par aloo dekho" impossible unless something on the stage shows aloo.

This document is the path to (B), the owner's "content on the go": on "aloo dikhao", a kid-safe picture of aloo appears on the stage within the lesson, and her line points at it truthfully.

**Sources:**
- code at `84bc6050` and this branch;
- `context/decisions.md` (image-default-flare-low-2026-10-04, image-lanes-flare-low-both, image-capacity-pool, diagram-router-no-baked-labels);
- `context/measurements.md`, cited inline;
- `context/rejected.md` (generated-media-carries-facts, the FLUX.2-pro image slot).

## 1. What exists today, and what does not

| Piece | State | Where |
|---|---|---|
| Image deployment | gpt-image-2.5-flare, quality always **low**; fallback `taxila-image` (gpt-image-2) on a 429 or filter refusal | `server/azure.js:22-41` (`DEPLOY.image`, `IMAGE`) |
| A server call to it | **none** (only offline scripts: `scripts/region/foundry-si.mjs:153`, images/generations, 1024², png) | — |
| Image builder | `builders.js image()` + `imagePrompt` (fixed watercolour template + one KIT term); ready only if an OCR no-text check AND Content Safety pass; facts `onScreen: {}` | `server/stagecraft/builders.js:49-53, 165-171` |
| Its dependencies in production | **not wired**: `productionDeps` has no `imageCall`, `ocrNoText` or `contentSafety` (status `open-stagecraft-image-dormant`) | `server/stagecraft/lesson.js:57`, `context/architecture.md:176` |
| Image moderation | **text only** (`contentsafety/text:analyze`); no image analyze call exists | `server/forge/g2/safety.js:56-63` |
| Storage | `putBlob` content-addressed to `taxilaforge/forge`, public read, child-free bytes only; not used for images yet | `server/forge/blob.js` |
| Client renderer | `kind: "image"` → `src/studio/ImageRenderer.tsx`: `<img>` contain-fit; accepts only `data:image/*`, `/api/studio/…` or `*.blob.core.windows.net`; a load error leaves the calm ground | `shared/studio.ts:120`, `src/studio/renderers.ts:52` |
| Studio intents | `requestIntent` accepts **only `kind: "whiteboard"`**; Stagecraft mounts image layers via their board twin (no `<img>`) | `server/studio/seam.js:775-778`, `src/stagecraft/controller.ts:107` |
| Free-subject request | **new in release 13**: `requestOf` / `freeSubjectOf` read "aloo dikhao", "X ke baare mein padhna hai"; `state.offTopic` keeps it 4 turns | `server/director/requests.js`, `state.js` |

**Measured** (all at flare low, 1024²):
- p50 **15.1 s**, $0.0066 per image. 151 images, 160 requests, checked by eye, not blind. One prompt was refused: "children, rejected by the safety system". Source: model refresh, 2026-10-04, `measurements.md:1623`.
- p50 15,461 ms, p90 18,483 ms, n = 10. One 429 failed over to gpt-image-2. Source: E-ST4, 2026-10-05, `measurements.md:3331`.
- Quota: flare is **4 RPM for the whole subscription**. A quota increase is needed before launch (`decisions.md:2293`).

## 2. The flow

```
child turn ──► requestOf / UNDERSTAND note: visual + subject ("aloo")          (release 13, exists)
          ──► Director: subject outside the kit → visualUnavailable (A, floor)   (release 13, exists)
                 └─ NEW: if the image rung may run → plan "reteach" with move.image = { subject, state: "asked" }
          ──► brain/turn.js: Studio intent { kind: "image", subject, lessonId }   (NEW: seam.requestIntent accepts "image")
          ──► server/studio/image.js (NEW)
                 1. subject gate (code, before any model): scanSafety + unsafeChildPhrase + a person/body/brand/violence
                    blocklist; a subject that fails → never drawn, the floor (A) line stands
                 2. cache: blob key = sha256(template version + normalized subject + band); a hit is instant
                 3. prompt: KID-SAFE TEMPLATE (§3) with the subject as the only slot
                 4. generate: DEPLOY.image, quality low, 1024² → webp; 429/refusal → IMAGE.fallback; 25 s budget
                 5. moderate the PIXELS: Content Safety image:analyze (§3); OCR no-text check (existing rule)
                 6. store: putBlob (child-free bytes; the subject is not a child id); facts { kind: "image",
                    archetype: "image", onScreen: { subject: "aloo", alt: "a potato" } }
          ──► reveal on the stage on a LATER turn (the 15 s build never blocks her reply)
          ──► her reply on the reveal turn points at it; screenClaimProblem's stageWords reads facts.onScreen.subject/alt
```

The image is never on the reply's critical path. It takes ~15 s and the reply has a ~2.5 s budget. So the turn the child asks, she says (A): "abhi bana rahi hoon", plus the subject in words.

That phrase is the one change from (A)'s line, and it is allowed only while the build is in flight. The reveal happens when the piece is ready: on a later turn, through the existing `slotFor` / `statusFacts` reveal path. It needs a new `kind: "image"` facts row so her next line says "dekho, yeh aloo hai" truthfully.

If the build fails, times out or is refused, nothing appears. The next turn says nothing about a picture that didn't come: that is the existing Studio rule, never naming a failed piece.

## 3. Safety path (frozen-floor review needed before any build)

1. **The subject is a child's words.** They pass the same code predicates as every child turn:
   - `scanSafety`, run before the request;
   - `unsafeChildPhrase`, as `state.js` already does for `topic`/`switch`;
   - a new **image subject allowlist shape**: a noun phrase of at most 3 words, no person names or pronouns, no body parts, no brands or logos, no weapons or violence, no "photo of me / my", no real places that identify a child.

   On any doubt the subject is never drawn and the floor line (A) stands. The subject never reaches the image model with any other text from the child.
2. **The prompt template** (versioned, `img-subject@1`), the subject being the only slot:

   > A friendly children's-book illustration of {subject}, one object, centred, plain light background, soft colours, simple shapes; no people, no faces, no hands, no text, no letters, no numbers, no logos.

   No photorealism: illustration keeps it clearly art, never "a photo of".
3. **Pixels are moderated before reveal.** Azure AI Content Safety `image:analyze`, `api-version=2024-09-01`, on the same Foundry AIServices resource as the text call (`resolveLane("SAFETY")`).
   - Reject at severity ≥ 2 in any category, which is stricter than the platform filter.
   - Plus the existing OCR no-text check (`builders.js` B5: a missing checker means not ready).
   - Plus a cheap VLM yes/no, "does this image show {subject} and nothing else? no people?", on taxila-fast. This is a presence check only, never a fact (`rejected.md` generated-media-carries-facts).
4. **Never a fact on the image.** Labels, if any, are kit-term overlays drawn by the client (`diagram-router-no-baked-labels`). The image is mood and recognition, never curriculum truth.
5. **Safeguarding turns** retire it like any piece: `seam.onSafety`. A lesson in a safety state never asks for an image.
6. **Child-safety floor:** none of this changes what she says about herself, the helplines, or the hand-off. The floor runs on her words before the screen guard. The new risk is entirely in the picture, hence items 1 to 3.

## 4. Latency and cost

| | Value | Source |
|---|---|---|
| Generation | p50 ~15 s, p90 ~18-30 s (`BUILD_MS.image` p90 30 s is an estimate) | `measurements.md:1623, 3331`; `stagecraft/config.js:25,41` |
| Moderation | Content Safety image analyze ~0.3-1 s (to measure); VLM check ~1 s | not measured: measure in the first build |
| Cost / image | **$0.0066** generation + Content Safety (~$0.0015 per image at list, to confirm on the grant) + VLM check (~$0.0002) ≈ **$0.009** | `stagecraft/config.js:62`, `measurements.md:1475` |
| Cache hit | ~50 ms (blob GET); a subject asked again in any lesson costs nothing | design |
| Capacity | flare 4 RPM per subscription; fallback gpt-image-2 4 RPM per region × 5 | `decisions.md:2293` |
| Caps | ≤ 2 images per lesson, 1 at a time, ≤ $0.05 per lesson; the global breaker (`STUDIO_DAILY_USD`) counts it | proposed; `studio/router.js:24, 48-59` |

At 4 RPM a live product needs the quota increase (an owner action) or a precomputed cache for common subjects: fruits, vegetables, animals, vehicles, planets. That is about 300 images, roughly $3 once, reviewed by a human before use.

## 5. Files

| File | Change | Owner |
|---|---|---|
| `server/studio/image.js` (new) | subject gate, cache key, template, generate (DEPLOY.image + IMAGE.fallback), Content Safety image + OCR + VLM check, putBlob, facts | stream 2 (Studio) |
| `server/forge/g2/safety.js` or a new `server/safety/image-moderation.js` | `contentSafetyImage(bytes)` → max severity | **frozen dir `server/safety/**`: main's safety review**; placing it in forge/g2 next to the text call avoids the frozen dir |
| `server/studio/seam.js` | `requestIntent` accepts `kind: "image"`; reveal and facts row for image pieces | stream 2 |
| `server/brain/turn.js`, `brain/propose.js` | the image intent on a visual ask with an off-kit subject; `move.image` state | stream 3 + 4A |
| `server/director/state.js`, `shapes.js` | `visualBuilding({ subject })` (the in-flight line), and the reveal turn's "dekho" only with the piece on stage | 4A |
| `server/director/say.js` | `stageWords` reads `facts.onScreen.subject` / `alt` of an image slot (one line) | 4A |
| `src/studio/ImageRenderer.tsx` | none (already renders `kind: "image"` from blob URLs) | — |
| `scripts/image-cache-seed.mjs` (new) | the common-subject cache + human review sheet | stream 2 |
| tests | subject gate (unsafe subjects never drawn), template has one slot, moderation fail → nothing shown, the reveal line passes `screenClaimProblem` only with the image mounted | each owner |

## 6. Who should build it

- **Stream 2 (Studio / live content)** owns the producer (`image.js`), the seam and the cache. It is a Studio piece like the others.
- **4A** owns the Director side: the request and subject (done), the floor (done), the in-flight and reveal lines, and the claim predicate's reading of image facts.
- **Main** owns:
  - the safety review of the subject gate and the image moderation;
  - the owner action for the flare quota;
  - the decision on the precomputed cache.

**Order:**
1. Subject gate and moderation, built and reviewed first, with no reveal.
2. Producer and cache, in shadow: built and logged, never shown.
3. Reveal for a test cohort (`TAXILA_SESSION_FIRST_FOR`-style), with before/after on the owner's replay.

**Reversal condition:** if the moderation false-negative rate on a red-team subject set of at least 200 is above 0, or the p90 to reveal is above 30 s, the rung stays shadow and (A) remains the product.
