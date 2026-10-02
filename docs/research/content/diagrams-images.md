# Diagrams and images for Taxila: reliability evidence, the diagram pipeline, and the illustration style guide

Workstream `content/diagrams-images`, 2026-10-02. It builds on, and does not repeat: `tech-and-market.md` §4 ("if correctness matters it must be code; if mood matters, use an image"); `genui-reliability.md` (`scene@1`, `label-diagram@1` as a spec, no live image generation); `multimodal-orchestration.md` (MO4 source ladder, MO5 layered cache keys, no per-child images); `design/visual-identity.md` §3-6 (tokens, diagram palette, shape language, representation matrix). The sibling `factory/asset-probe.mjs` (transparency, chroma-key, character sheets, stereotype and rupee checks) is not duplicated here.

This document adds the measured evidence for **labelled diagrams and renderers** and the diagram pipeline spec (engines, contracts, gates, cache). It also adds the generation-side style guide: style blocks, prompt schema, palette quantisation, QA and safety.

**Evidence tags:** **[X]** measured here (script and raw JSON next to this file) · **[V]** primary source read this session · **[S]** abstract or secondary source read this session · **[M]** from memory, not re-read (the web-search quota ran out and publisher sites were paywalled) · **[I]** inference · **[U]** unknown or assumed.

Three probes ship with this document:

| probe | what it measures | cost |
|---|---|---|
| `diagrams-images-renderer-probe.mjs` | KaTeX, Mermaid, Graphviz, ELK and dagre in headless Chromium with the real Mukta woff2 | $0 |
| `diagrams-images-svg-probe.mjs` | free LLM SVG, 4 exact diagrams × 2 deployments × n = 3, scored by code | about $0.10 |
| `diagrams-images-image-probe.mjs` | gpt-image-2 labelled diagrams in English and Hindi, text-free bases, VLM anchoring and OCR | about $0.20 |

---

## 0. TL;DR (decisions)

1. **The renderer is chosen by what must be true, never by the model.** Exact things are code; mood is a picture:
   - quantities, geometry, time, maps and circuits → the existing T1 engines;
   - structure (flows, cycles, hierarchies, parts) → the new diagram engines (§4);
   - equations → KaTeX;
   - context and story scenes → a cached raster with no text in it.
   - The router is the deterministic table in §3.
2. **Free LLM SVG is accurate when the geometry is fully specified and checked by code.** It is too slow and too unguarded for the live path. [X]
   - gpt-5.6-sol at medium effort drew **12/12** pinned diagrams exactly (triangle angles, number-line ticks, bar heights, clock hands at 3:40) in **8-25 s**.
   - gpt-5.6-luna at low effort drew **10/12** in 5-11 s. One triangle came out 13°/19°/148° instead of 50/60/70, and one minute hand was 14° off.
   - Only the pinned ids made those errors catchable at all.
   - **Decision:** free SVG is an *offline* authoring path behind a per-kind assertion manifest (§4.6). Live diagrams are engine specs filled in 1-3 s.
3. **Drop the "best model ≈ 64% on SVG-Bench" figure** from tech-and-market §4. That leaderboard has exactly one display-only row (MiniMax M3, 63.7%) and no GPT-5.x entry [V]. The evidence that actually matters:
   - Text-only LLMs reliably *execute specified geometry* but diverge when they must *compose layout* themselves (Autoregressive Mosaics, 2026) [S].
   - VLM and CLIP judges are weakest exactly on geometry, counts and layout (SVGEval, ECCV 2026; SVG-Score, 2026) [S].
   - So **a model may plan, code lays out, and code checks**.
4. **gpt-image-2 spells labels well and places them wrongly.** [X, 12 labelled images, n = 1 per cell]
   - Spelling: English **32/32**, Hindi **31/32**. The Hindi miss is a corrupted mark inside हरितलवक.
   - Leader lines on the right part: English **31/32**, Hindi **27/32**. Examples: परागकोश (anther) → filament, वर्तिकाग्र (stigma) → style, बाह्यदल (sepal) → a petal.
   - **Medium quality did not fix this:** the Hindi flower at medium had 3/6 wrong leaders.
   - **Every circuit drawn (3/3, including a text-free base) showed an open switch** although "closed circuit" was asked.
   - **Fully correct images: English 4/6, Hindi 1/6.**
   - **The VLM OCR passed the corrupted word**: it transcribed what it expected.
   - Consistent with MMMG (best model 50.2 on knowledge images) [S] and with OpenAI's own documented limits ("precise text placement", "structured compositions") [V].
   - **Rule:** no raster image ships with baked labels. Text-free bases held 4/4 [X]. Labels are SVG overlays at **human-verified anchors** (§5). A VLM proposes the anchors: 20/20 landed inside the named part in run 1, but only 16/20 agreed in colour class across two runs [X].
5. **Mermaid is not shipped to children.**
   - **Payload:** 1.58 MB gzipped [X], against 17 KB for dagre [X].
   - **Security:** a run of 2025-2026 sanitisation advisories, including XSS and CSS injection [V].
   - **Phone fit:** with its default 200 px wrapping width, a 6-node Hindi flowchart is 200 px wide and 536 px tall on a 380-dp column, against 155 × 340 for dagre/ELK with our renderer [X].
   - **Speed:** the first render took 274-293 ms cold and 40-70 ms warm on a server CPU [X].
   - **Plan instead:** the LLM fills a graph spec, dagre (or a fixed polar layout for cycles) places it, and our renderer measures text in the real font.
   - **Graphviz** is rejected for Hindi: it estimates Devanagari width without the font. Every Hindi box is at least 70 px wider than its text (English: 13 px) [X], making the drawing 85% wider than our layout (286 vs 155 px).
6. **KaTeX 0.19 plus mhchem is safe for Hindi with one CSS rule.** [X]
   - 26/26 class 1-9 expressions rendered (fractions, identities, the lens formula, four chemical equations), with a median of 0.4 ms.
   - Each Devanagari `\text{}` word stays in **one text run**, so conjuncts shape correctly: 6/6 stress strings, e.g. र्कि, ङ्क्ष.
   - By default that text falls to `KaTeX_Main → Times New Roman → serif`. The rule `.katex .text{font-family:Mukta,…}` fixes it.
   - `₹` raises `unknownSymbol`.
   - Payload: 76 KB js + 3.5 KB css + 8.5 KB mhchem (gzip), plus about 260 KB of woff2 across 20 files, subsettable.
7. **Images are generated once per concept and reused, never per child.**
   - The cache key is `(kind, canonical spec, band, script, renderer version)`.
   - Labels and language are an overlay layer, not part of the image key (MO5).
   - Library build at the 742 seed topics is about **$110-250 in tokens**. The real cost is about **45 reviewer-hours** (§9).
8. **The illustration style guide is executable** (§7): band style blocks as data; a prompt schema with cast and skin tokens; reference-image anchoring through `images/edits` (up to 16 inputs on Azure [V]); CIELAB palette quantisation with a hue-count lint; a no-text OCR gate; the G-VI-7 audit.
9. **Safety is by predicate** (§8): Content Safety on every prompt, string and output; illustrated children only (Azure blocks photorealistic minors by default [V]); no child photo or drawing ever sent to an image model; no generated maps, flags, banknotes or deities; C2PA kept in the archive original; two-key human review before anything reaches a child.

---

## 1. Evidence: LLMs writing diagrams as code

| study | finding | what it means for Taxila |
|---|---|---|
| **VGBench** (Zou et al. 2024, arXiv 2407.10972) | 4,279 understanding and 5,845 generation samples; LLMs do well on high-level formats and **worse on low-level SVG** [S] | do not ask for raw path data where a higher-level spec (graph, parts, constraints) fits |
| **SGP-Bench** (Qiu et al., ICLR 2025 spotlight, arXiv 2408.08313) | LLMs must "imagine" the render of SVG/CAD programs without seeing it; stronger reasoners do better [S] | sol-class models for offline authoring; luna for spec filling only |
| **Autoregressive Mosaics** (Nedungadi et al., arXiv 2608.30751) | all 8 models translated *specified* geometry into working code; on underspecified prompts that needed layout composition, performance "diverged significantly"; the output medium changed layout scores [S] | **the model specifies, code composes the layout** |
| **SVGEval** (Wang et al., ECCV 2026, arXiv 2608.01977) | multimodal judges "perform relatively well on semantic alignment and aesthetics, yet struggle on geometry- and layout-related judgments" [S] | a vision critique cannot certify a ray diagram or a triangle; assertions must |
| **SVG-Score** (Cipriano et al., arXiv 2609.03806) | CLIP scorers "barely react" to wrong colours, counts and spatial relations; VLM judges react unevenly [S] | never gate on CLIP similarity; a VLM is a smoke test only |
| **DiagrammerGPT** (Zala et al., COLM 2024, arXiv 2310.12128) | an LLM writes a *diagram plan* (entities, relations, boxes), an auditor LLM refines it, then a renderer draws; this beats direct T2I on dense, arrow-connected diagrams [S] | plan → audit → deterministic render is the pattern; our "renderer" is code, not a diffusion model |
| **DiagramAgent / DiagramGenBenchmark** (Wei et al., arXiv 2411.11916) | 8 diagram categories (flowcharts, model diagrams, mind maps…); Plan, Code, Check and Diagram-to-Code agents beat baselines [S] | the check agent is code plus render in our pipeline |
| **MagicGeo** (arXiv 2502.13855), **GeoLoom** (arXiv 2512.08180) | geometry figures come from formal constraints plus a solver (coordinate optimisation), not from free drawing; MagicGeoBench has 220 descriptions [S] | `geo-construct` (maths engines) gets its coordinates from a solver; the LLM only writes constraints |
| **MermaidSeqBench** (arXiv 2511.14967) | NL → Mermaid sequence diagrams: "significant capability gaps across models" on syntax and semantics [S] | parse-valid ≠ correct; Mermaid syntax buys no truth |
| **SVG-Bench** (BenchLM) | "display-only", one model listed (MiniMax M3 63.7%), excluded from weighted scoring [V] | not usable evidence; corrected here |

### 1.1 Measured here: free SVG for exact school diagrams [X]

**Method** (`diagrams-images-svg-probe.mjs`):
- 4 prompts × 2 deployments × n = 3: gpt-5.6-sol at `reasoning_effort: medium` and gpt-5.6-luna at `low`, through `/chat/completions`.
- The system prompt set phone legibility rules (≥ 16 px at 380 px wide, no overlaps, no script).
- Each task pinned machine-checkable ids (`#A #B #C`, `line.tick[data-v]`, `rect.bar[data-v]`, `#hour #minute`).
- Scoring ran in Chromium through `getScreenCTM`, so any transforms the model used still count.

| task (truth) | sol-medium correct | sol wall s | luna-low correct | luna wall s | failure seen |
|---|---|---|---|---|---|
| triangle ∠A 50 ∠B 60 ∠C 70, AB level | 3/3 | 22.5-25.3 | 2/3 | 5.8-6.1 | luna: **13.1° / 18.8° / 148°**, a different triangle with the right labels |
| number line 0-2 in quarters, P at 3/4 | 3/3 | 8.1-11.5 | 3/3 | 4.9-5.2 | none (tick deviation 0) |
| bars 12/30/45/80/150 mm, common baseline | 3/3 | 11.7-25.2 | 3/3 | 6.2-9.9 | none (height error ≤ 0.3%) |
| clock at 3:40 (hour 110°, minute 240°) | 3/3 | 9.9-14.6 | 2/3 | 6.4-10.8 | luna: minute hand at **226°**, i.e. "3:38" |
| **all** | **12/12** | 8-25 | **10/12** | 5-11 | |

- All 24 outputs parsed, and none used script, events, `foreignObject` or external `href`.
- All met the 16 px floor after fitting, with no text overlaps and no text off the drawing.
- **Read:**
  - The labelling looked right in both luna failures, so a VLM glance or a CLIP score would have passed them (SVG-Score).
  - At these latencies even the accurate model misses the ≤ 3 s live budget (`tech-and-market` §3.5).
  - n = 3 per cell is enough to set direction, not to quote a rate.
- **Not tested:** complex figures (ray diagrams with virtual images, cross-sections) and Devanagari text inside free SVG. The next run (§10, M-DI-2) adds both.

---

## 2. Evidence: raster generators for knowledge images

| source | finding | tag |
|---|---|---|
| **MMMG** (Luo et al., NeurIPS 2025 D&B, arXiv 2506.10963) | 4,456 expert-validated knowledge-image prompts, 10 disciplines, 6 education levels; GPT-4o scored **50.20**; "low entity fidelity, weak relations, and clutter" | [S] |
| **Learn Your Way** (arXiv 2509.13348) | needed a *fine-tuned* image model; the illustrations were still the lowest-rated component | [V via genui-reliability] |
| **OpenAI image-generation guide** | struggles with "precise text placement and clarity" and "placing elements precisely in structured compositions"; complex prompts take up to 2 min | [V] |
| **Azure image-generation docs** | GPT-Image-2 is GA, with arbitrary sizes up to 3,840 px edge; gpt-image-2.5 sunburst and flare are GA with quality up to `max`; edits take **up to 16 input images**; `input_fidelity` exists; transparent background is listed for GPT-Image-1 only; default quota 5 images/min; **photorealistic minors are blocked by default**; the output filter returns `contentFilter` | [V] |
| **OpenAI community** (2026-08-20) | gpt-image-2 transparent background (preview) leaves alpha at 252-254, a grey halo and RGB bleed; edits fill transparent areas instead of keeping them | [S] |
| **Azure content credentials** | every Azure OpenAI image carries a signed C2PA manifest ("AI Generated Image", "Azure OpenAI ImageGen"), verifiable at contentcredentials.org | [V] |

### 2.1 Measured here: labelled science diagrams, English vs Hindi [X]

**Method** (`diagrams-images-image-probe.mjs`):
- `taxila-image` (gpt-image-2) at 1024², low quality, n = 1 per cell.
- 4 NCERT subjects (flower LS, class 7; water cycle, class 3/6; simple circuit, class 6; plant cell, class 8), each in English and Hindi, with medium quality as well for flower and plant cell.
- The prompt asked for exactly N labels, spelled as given, each joined to its part by one leader line.
- One rater (this workstream) read every label at full resolution, cropping at 4× for Devanagari, and judged each leader-line target against NCERT usage.
- Low quality used **196 output image tokens = $0.0059 per image**, in 16.9-22.0 s.

| image | spelled right | leader on right part | science or semantic errors besides labels | fully correct |
|---|---|---|---|---|
| flower EN | 6/6 | 6/6 | none | yes |
| flower HI | 6/6 (ह्य as a valid stacked conjunct) | **4/6** (परागकोश → filament; वर्तिकाग्र → style) | none | **no** |
| water cycle EN | 4/4 | 4/4 | no cycle arrows (not asked) | yes |
| water cycle HI | 4/4 | 4/4 | evaporation arrows rise from the hills, not the water | **no** (minor) |
| circuit EN | 4/4 | 4/4 | **open** knife switch although "closed circuit" was asked; a wire runs into the bulb's glass | **no** |
| circuit HI | 4/4 | 4/4 | **open** knife switch | **no** |
| plant cell EN | 6/6 | 6/6 | none | yes |
| plant cell HI | **5/6** (stray mark inside हरितलवक) | 6/6 | none | **no** |
| **total, low quality** | EN 20/20 · HI 19/20 | EN 20/20 · HI 18/20 | 3 of 8 images | **EN 3/4 · HI 0/4** |
| flower EN, medium | 6/6 | 6/6 | none | yes |
| flower HI, medium | 6/6 | **3/6** (बाह्यदल → a petal; परागकोश → filament; वर्तिकाग्र → style) | none | **no** |
| plant cell EN, medium | 6/6 | **5/6** (cytoplasm → the wall) | none | **no** |
| plant cell HI, medium | 6/6 | 6/6 | none | yes |
| **total, all 12** | EN 32/32 · HI 31/32 | EN 31/32 · HI 27/32 | 3 of 12 | **EN 4/6 · HI 1/6** |

- **Timing and cost:**
  - Medium used 1,756 output image tokens (**$0.0527**) in 38.6-42.8 s (n = 4).
  - Low took 16.3-22.0 s (n = 12, including bases).
- **I2, text-free bases** (prompt: "no text, no letters, no numbers, no labels, no arrows, no leader lines"):
  - 4/4 had no text, by VLM OCR (`NONE`) and by eye.
  - The circuit base again drew an **open** switch, making 3/3 circuits.
- **I4, OCR as a spelling gate:**
  - taxila-brain (gpt-5.6-sol, vision, `detail: high`) transcribed all 12 labelled images as *exactly* the requested strings, in 1.6-3.2 s.
  - That includes the image whose हरितलवक visibly carries a stray mark.
  - **On the one real glyph defect, the gate falsely passed (1/1).** The VLM reads what it expects. OCR is valid only for *presence* of text (the no-text gate), never for spelling.

**Read:**
- Spelling is no longer the failure. *Semantics* is: which part the line touches, and whether the scene obeys the physics it names.
- Hindi is worse (27/32 vs 31/32 leaders; 1/6 vs 4/6 fully correct), and medium quality does not close the gap.
- The likely reason is that the model maps Hindi technical terms to parts less reliably, not that the glyphs fail [I].
- A child learning परागकोश from a line drawn to the filament learns the wrong word. One wrong label per diagram is a misconception factory, and no OCR gate can catch it.
- Hence §5: the raster carries no words, and a person verifies the anchors.

---

## 3. The router: which renderer for which visual (deterministic; the model never picks its renderer)

The Director asks for a *visual intent*, `show_visual{objective_id, intent, shape}`. The router maps the content **shape** (the topic shape from multimodal-orchestration §4) to the renderer.

| shape / need | renderer | live path | library path | why |
|---|---|---|---|---|
| quantity, number, fraction, measurement, data, time | maths T1 engines (`number-line`, `fractions`, `data-handling`, `clock-calendar`…) | T1 spec, 1-3 s | presets | exact by construction (maths-engines) |
| geometry figure | `geo-construct` (constraints + solver; JSXGraph) | T1 spec | presets | MagicGeo/GeoLoom: geometry needs a solver |
| physical phenomenon (light, circuits, magnets, water cycle as a process) | science engines (`optics@1`, `circuits@1`, `water-cycle@1`…) | T1 spec | presets | the physics is computed, not drawn |
| process, cycle, sequence, cause → effect | **`flow@1`** (§4.2) | spec fill, about 2 s | spec + cached layout | layout is code; labels come from the kit |
| hierarchy, classification, mind map | **`concept-map@1`** | spec fill | spec | as above |
| parts of a structure (flower, cell, eye, leaf, Earth's layers) | **`label-diagram@1`** over an SVG part-figure or a verified raster base | library only (bases and anchors are verified) | Forge | anchors must be verified (§2.1) |
| equation, formula, chemical equation | **`formula@1`** (KaTeX + mhchem) | spec fill (TeX string ≤ 200) | | exact, 0.4 ms |
| misconception contrast ("which is right?") | **`contrast-pair@1`** over two engine snapshots or figures | spec fill | | P8 contrasting cases (learning-science) |
| bespoke exact figure with no engine yet | **`svg-figure@1`** (library SVG with an assertion manifest) | never generated live | Forge (sol free SVG + asserts + review) | §1.1: accurate offline, slow and unguarded live |
| context, story, mood, real-world hook | **`illustration@1`** (cached raster, no text) | library or night prefetch only | Forge (gpt-image-2) | images never on the critical path (23 s, measurements.md) |
| real organism, monument, artefact | `illustration@1` with a licensed photo (Wikimedia, licence stored) | library | curation | authenticity; never generated |
| map of India or the world | `map-explorer@1` (Survey of India boundaries) | T1 | | legal; never generated |

**Hard bans (lint):**
- No raster with text.
- No raster for any `quantity`, `procedure` or `geometry` shape (multimodal-orchestration rule 24).
- No raster of a map, flag, emblem, banknote or coin design, deity or place of worship.
- No Mermaid or Graphviz in the child frame.
- No live free-form SVG.

---

## 4. Diagram pipeline (spec)

### 4.1 Flow
```
Director tool call show_visual{objective_id, intent, shape, band, lang}
  └─ Router (§3, pure function) ─► engine id
       └─ Source ladder (MO4): library hit by exact key ─► kit spec preset ─► spec-fill (luna, structured output, zod) ─► fallback
            └─ Gates D0-D9 (§4.5; ms, no model) ─► mount in the sandbox frame (scene@1 runtime) ─► ready{overflow:[]}
                 └─ telemetry ─► teacher's eyes (key=value line) ─► learner model
Forge (offline, nightly or ahead of the syllabus calendar):
  visual plan per objective (sol) ─► spec or asset job ─► render ─► gates ─► VLM smoke test ─► human two-key ─► publish (versioned, immutable)
```
- The labels in every diagram come from the **kit's verified strings**: the term list per objective in English, Hindi and Hinglish (romanised Hindi), with the NCERT spelling.
- The LLM picks term *ids*. It never types a technical term into a diagram live (language-sst LR6 pattern).

### 4.2 Engine contracts (all compile to `scene@1` static and interactive nodes, so one runtime, one telemetry and one teacher-eyes format)

```ts
// shared
type L10n = { en: string; hi: string; hi_latn?: string };          // ≤ 48 chars per label; from the kit term bank
type TermRef = { term: `T.${string}` } | { text: L10n };             // TermRef.term preferred; free text only for non-technical words
type Band = "B1" | "B2" | "B3" | "B4";
interface VisualBase { engine: string; v: 1; objective_ids: string[]; band: Band; lang: "en" | "hi" | "hi-Latn+en"; title?: TermRef; say?: L10n /* spoken description, a11y */ }

// flow@1 — process / cycle / sequence / cause→effect
interface FlowSpec extends VisualBase { engine: "flow@1";
  layout: "chain" | "cycle" | "branch" | "merge";                    // cycle = fixed polar layout; others = dagre (17 KB gz)
  direction: "down" | "right" | "auto";                             // auto: down on phones < 600 dp
  nodes: { id: string; label: TermRef; icon?: `spr.${string}`; detail?: TermRef }[];   // 2–8 (B1–B2: ≤ 5)
  edges: { from: string; to: string; label?: TermRef; kind: "then" | "becomes" | "causes" | "energy_to" }[];
  reveal: "all" | "stepwise";                                       // stepwise: teacher cue reveals node by node (temporal contiguity)
  blanks?: string[];                                                // node ids the child fills (probe: sequence/construct)
}
// concept-map@1 — hierarchy / classification / mind map
interface ConceptSpec extends VisualBase { engine: "concept-map@1";
  layout: "tree-down" | "tree-right" | "radial";
  root: CNode; maxDepth: 1 | 2 | 3;                                 // ≤ 15 nodes total; B1–B2 ≤ 7
  blanks?: string[]; sortItems?: { id: string; label: TermRef; into: string }[];   // optional sort-into-tree probe
}
type CNode = { id: string; label: TermRef; icon?: `spr.${string}`; children?: CNode[]; edgeLabel?: TermRef };
// label-diagram@1 — deepens genui-reliability §5.7 (spec there) with the verified-anchor contract
interface LabelSpec extends VisualBase { engine: "label-diagram@1";
  base: { kind: "figure"; asset: `fig.${string}` } | { kind: "raster"; asset: `ast_${string}` };   // both from the library
  parts: { part: string /* id in the asset's anchor manifest */; label: TermRef }[];                // 2–8 (B1 ≤ 4)
  mode: "show" | "quiz_drag" | "quiz_tap" | "quiz_voice";
  distractors?: TermRef[];                                          // ≤ 2, each tagged with a misconception id
  side: "auto" | "left" | "right" | "both";                         // label column(s); leader lines are computed, never drawn by a model
}
// formula@1 — KaTeX + mhchem
interface FormulaSpec extends VisualBase { engine: "formula@1";
  tex: string;                                                      // ≤ 200 chars; macro allowlist (§4.4)
  display: "block" | "inline"; size: "label" | "title" | "numeral";
  steps?: { tex: string; cue?: string }[];                          // ≤ 6: a worked example, revealed on teacher cue; fading = blank a step
}
// contrast-pair@1 — two panels, one question (P8)
interface ContrastSpec extends VisualBase { engine: "contrast-pair@1";
  left: PanelRef; right: PanelRef; ask: TermRef; answer: "left" | "right" | "same" | "neither";
  misc?: { choice: "left" | "right" | "same"; mc: `MC.${string}` }[]; reveal?: TermRef;
}
type PanelRef = { snapshot: { engine: string; params: unknown } } | { figure: `fig.${string}` } | { asset: `ast_${string}` };
// svg-figure@1 / illustration@1 — library assets only
interface FigureSpec extends VisualBase { engine: "svg-figure@1"; figure: `fig.${string}`; highlight?: string[]; tapParts?: boolean }
interface IllustrationSpec extends VisualBase { engine: "illustration@1"; asset: `ast_${string}`;
  overlays?: { part: string; label: TermRef }[]; frame: "plain" | "book"; alt: L10n /* spoken on tap */ }
```

**Events** (flat `data` ≤ 12 keys; the names are the shipped `ModuleToHost` kinds):

| engine | event | data |
|---|---|---|
| all | `ready` | `{overflow: [ids], fit_scale, min_label_px}` |
| `flow@1` | `fl.step` | `{node, idx}` |
| | `fl.tap` | `{node}` |
| | `answer` (blanks) | `{node, value, correct, misc?}` |
| `concept-map@1` | `cm.tap` | `{node}` |
| | `cm.place` | `{item, into, correct, misc?}` |
| `label-diagram@1` | `ld.drop` | `{part, label, correct, misc?}` |
| | `ld.tap` | `{part}` |
| | `goal_met` | when all parts are placed |
| `formula@1` | `fx.step` | `{idx}` |
| `contrast-pair@1` | `answer` | `{choice, correct, misc?}` |
| `svg-figure@1`, `illustration@1` | `tap` | `{part}` |

**Host commands** (shared): `highlight{part|node}`, `reveal{idx}`, `reset`, `cue{id}`. They let the voice teacher point ("dekho, yeh *anther* hai") while the part pulses. This is signalling plus temporal contiguity; the evidence is in §6.1.

### 4.3 Layout rules (code, not model)
- **Text is measured in the font it will be painted in.** Text runs through canvas `measureText` inside the frame after `document.fonts.load('Mukta')`. Layout waits for the font; it never lays out with a fallback and swaps.
  - Measured: when Noto Sans Devanagari (Android's fallback) was used for layout and Mukta for paint, nothing overflowed, because Noto is about 3% wider [X].
  - The reverse case (lay out in Mukta, paint in the fallback) would overflow, so `ready.overflow` is checked after paint.
- **Phone first.** The content column is 380 dp (412 − 2 × 16).
  - Diagrams lay out at **scale 1** for that column, so labels never shrink below the band floor: 16 sp Latin and 18 sp Devanagari, from visual-identity §4.3.
  - If the layout cannot fit, the engine returns a slot error ("8 nodes do not fit B1 at 64 dp; ≤ 5") and the spec-filler retries (genui §5.7 pattern).
- **Wrapping:** at most 2 lines per label, wrapped by word for Latin and by space or akshara boundary for Devanagari, never by code point.
- **Layout libraries:**
  - `flow@1` chain, branch and merge use dagre: 17 KB gz [X], 2-10 ms for 6 nodes.
  - `flow@1` cycle uses a fixed polar layout (nodes on a circle, arcs between them), because dagre and ELK draw a cycle as a ladder with a back-edge [I].
  - `concept-map@1` uses a tidy tree (Reingold-Tilford). This is about 3 KB of our own code [I].
- **Leader lines** for `label-diagram@1`:
  - Labels sit in side columns, sorted by anchor y and spaced to at least the band label height.
  - Leader lines run straight from label to anchor, and the label order is chosen so no two lines cross.
  - Each line ends in a kajal dot inside the part (size per `dg.leader`, §6.2), never an arrowhead.
  - The anchor point is the verified one from the manifest (§5.3).
- **Arrows mean one thing per diagram.** In a flow, an arrow means "then", "becomes" or "causes", and the edge `kind` styles it. Heiser & Tversky showed people read arrows as sequence, causation or motion [M]. Mixing those meanings in one figure is a coherence error.

### 4.4 `formula@1` specifics (from §0.6 measurements)
- KaTeX 0.19 with `throwOnError:true` (the error goes back to the spec-filler) and `trust:false`.
  - `\htmlClass` is allowed only through a trust function accepting `class` values matching `/^t-[a-z0-9]{1,16}$/`, which is used for highlight targets.
  - Also set `strict:"warn"` routed to the log, `maxExpand:200`, `maxSize:20`.
  - Advisories exist for `maxExpand` bypasses, `\htmlData` and `\includegraphics` [V]. Pin the probed 0.19.x, review GHSA-238p (2026-09-21, prototype pollution versus `trust`) [V], and keep the macro allowlist closed.
- **Macro allowlist:** `\frac \dfrac \tfrac \sqrt \times \div \pm \cdot \le \ge \ne \approx \angle \triangle \cong \sim \parallel \perp \degree ^\circ \pi \overline \text \ce \pu \left \right \,`, plus Greek letters.
- **Devanagari:** `.katex .text, .katex .mord.text { font-family: Mukta, KaTeX_Main, serif }` [X]. Without it, Hindi words render in the system serif.
- **₹:** write `\text{₹}`. It renders, but warns `unknownSymbol` [X].
- **Output:** `htmlAndMathml`. The MathML half gives screen readers the structure. The spoken form comes from the kit (`say`), not from MathML-to-speech, because Hindi maths speech ("तीन बटा चार") is a kit string [I].
- **Payload:**
  - 76 KB js + 3.5 KB css + 8.5 KB mhchem (gz) [X].
  - Fonts are 20 woff2 files, about 260 KB [X]. Ship only Main-Regular, Main-Bold, Math-Italic, Size1-2 and AMS-Regular (≈ 110 KB [U]), and bundle them in the APK.

### 4.5 Gates for every diagram (ms, no model call; the first failure returns a precise slot error)

| gate | check |
|---|---|
| D0 | strict zod parse; closed objects; lengths; no `<`, `>` or `{{` in strings |
| D1 | every `TermRef.term` resolves in the kit term bank for this objective; language complete for `lang` |
| D2 | structure: flow is connected; cycle has ≥ 3 nodes and one loop; tree has no cycles; label parts exist in the base's anchor manifest; contrast has exactly one correct answer |
| D3 | the KaTeX parse succeeds under the allowlist (server-side, the same version as the frame) |
| D4 | layout fits the band column at scale 1: no node or label overlap, every label ≥ band floor, hit targets ≥ band `hit.min` |
| D5 | contrast ≥ 4.5:1 for text and ≥ 3:1 for marks (token hex); ≤ 4 colour categories with meaning; CVD rule (visual-identity §3.4) |
| D6 | words on stage ≤ band max (8/20/40/60) |
| D7 | Content Safety on every free-text string (server) |
| D8 | the frame's post-paint `ready.overflow` is empty; otherwise unmount and fall back to voice + anchor |
| D9 | payload ≤ 40 KB per diagram (SVG/DOM) |

### 4.6 `svg-figure@1` assertion manifest (offline free SVG becomes a library asset)

A free SVG enters the library only with a manifest of **machine-checkable truths**. §1.1 is the proof: the ids made the luna errors visible.

```jsonc
{ "figure": "fig.sci7.light.concave-real-image", "v": 3, "objective_ids": ["c7-science-ch11-t03"],
  "svg_sha256": "…", "bytes": 6210, "viewBox": [0, 0, 400, 300],
  "parts": [ { "id": "mirror", "sel": "#mirror" }, { "id": "F", "sel": "#F" }, { "id": "object", "sel": "#obj" }, { "id": "image", "sel": "#img" } ],
  "asserts": [                                     // evaluated in Chromium on screen-space geometry (getScreenCTM)
    { "kind": "collinear", "sel": ["#P", "#F", "#C"], "tol_px": 1 },
    { "kind": "ratio", "a": "dist(#mirror,#F)", "b": "dist(#mirror,#C)", "value": 0.5, "tol": 0.02 },
    { "kind": "mirror_eq", "u": "#obj", "v": "#img", "f": "#F", "tol": 0.03 },
    { "kind": "inverted", "of": "#img" },
    { "kind": "min_font_px", "value": 16, "at_width": 380 },
    { "kind": "no_text_overlap" }, { "kind": "within_viewbox" }, { "kind": "no_unsafe" }
  ],
  "labels": "overlay",                              // figure text is either ids-only or kit-term overlays; never free words
  "review": { "author": "forge:sol", "reviewers": ["sme:physics:…", "pedagogy:…"], "signed": "2026-10-02" } }
```

The assert kinds are a closed set of pure functions: `angle parallel perpendicular collinear ratio equal_len on_circle · mirror_eq lens_eq · count bar_heights ticks_linear hand_angle · inverted min_font_px no_text_overlap within_viewbox no_unsafe`.

The Forge coder must add the ids the asserts need. If it cannot express a truth as an assert, the figure goes to `review: sme_required` and is never auto-promoted.

### 4.7 Cache and library records

```ts
interface VisualAsset {                // Neon table visual_asset; immutable rows; blob path forge/visual/<sha>/
  id: `fig.${string}` | `ast_${string}` | `spec.${string}`;
  kind: "spec" | "svg-figure" | "raster" | "photo";
  key: string;                         // sha256(kind | canonical JSON (sorted keys, no labels) | band | renderer@ver)
  objective_ids: string[]; topic_ids: string[]; band: Band | "any";
  anchors?: { part: string; x: number; y: number; r: number; verified_by: string; verified_on: string }[];  // normalised 0–1
  overlays_supported: ("en" | "hi" | "hi-Latn")[];    // labels come from the kit at render time
  provenance: { generator: "gpt-image-2" | "gpt-5.6-sol" | "human" | "wikimedia"; prompt_sha?: string; seed?: number;
                c2pa_manifest?: string /* blob path of the original PNG with its manifest */; licence?: string; attribution?: string };
  qa: { gates: Record<string, "pass" | "fail" | "n/a">; ocr_text?: string[]; hue_count?: number; reviewers: string[] };
  bytes: { webp?: number; svg?: number }; status: "draft" | "review" | "live" | "retired"; supersedes?: string;
}
```

- **Key discipline (MO5):**
  - Language, interest skin and band-only text sizes stay **out** of the raster key. One flower base serves English, Hindi and Hinglish.
  - Layout *is* language-dependent, because Devanagari labels are wider and wrap differently. The *laid-out* diagram is cached per `(spec key, lang, band)` on device; it is cheap to recompute (2-80 ms [X]).
  - Nothing is ever served on embedding similarity (CacheAttack, MO5).
- **Prefetch:** at lesson start the planner already knows the next 3-5 objectives (tech-and-market §3.5). It sends their diagram specs (≤ 5 KB each) and illustrations (≤ 60-120 KB WebP) to the device.

---

## 5. Raster images: when, how, and the verified-anchor method

### 5.1 When a raster is allowed
- **Allowed:** context and hooks ("a monsoon street with puddles"); story scenes (B1-B2 especially; F4 story frames); the concrete stage of concreteness fading; bases for `label-diagram@1`, only where no SVG part-figure exists or where a raster reads much better (a leaf's venation, a flower in section).
- **Never:** quantities, geometry, maps, procedures, anything a child must measure, or anything per child (MO4).

### 5.2 Pipeline (Forge job `raster.base` / `raster.context`)
1. **Brief:** the visual plan supplies the subject, objective, band, cast list (skin tokens), setting (from the rotation) and composition (`safe_zones` where overlay labels will sit, plus a 12% margin).
2. **Prompt:** compiled from the schema in §7.3. Content Safety runs on the compiled prompt.
3. **Generate:** 2-3 candidates at `low` ($0.0059, about 20 s [X]). Generate the winner again at `medium` ($0.0527, about 40 s [X]).
   - Use `images/edits` with the band's approved **style anchor images** (and character sheets, from the sibling asset-probe) as references; up to 16 inputs on Azure [V].
4. **Automatic gates** (cheapest first):

| gate | check | threshold |
|---|---|---|
| I0 | Azure output filter (`contentFilter`) | must pass |
| I1 | Content Safety `image:analyze` | severity 0 in all categories |
| I2 | **no-text OCR:** VLM transcription must return `NONE` | exact |
| I3 | palette: quantise to the band palette in CIELAB (§7.4) | hue count within the band limit; ΔE of outline to `kajal` < 10 |
| I4 | skin: sampled face and arm regions map to the cast's stated `skin-n` token | within ±1 step (G-VI-7) |
| I5 | VLM checklist, as a smoke test only | the parts asked for are visible; no banned motif; no extra people; no distorted hands or faces |

5. **Anchors:** a VLM proposes one interior point per part, in two independent runs. A part is flagged when the run-2 point falls in neither the same flood-fill region nor the same colour class as run 1 (4/20 flagged here, §5.3). Plain distance over-flags valid picks of another petal or chloroplast.
   - A person then confirms or moves every anchor in the review tool: one tap per part.
   - Only `verified_by` anchors are served (§5.3).
6. **Two-key review:**
   - **Subject truth:** a teacher checks "is every part drawn correctly; would NCERT accept this?"
   - **Identity and representation:** the G-VI-7 checklist.
   - Both keys are required.
7. **Publish:**
   - Serve WebP. Visual-identity critique G-VI-10 rules out AVIF because it needs a recent Chrome.
   - Keep the original PNG with its C2PA manifest in the archive: re-encoding drops the manifest, so `provenance.c2pa_manifest` points to the original [I].
   - Record the prompt hash, seed, model and version.

### 5.3 Why anchors are verified by a person (and what the VLM is for)

**I3, measured [X]:**
- On the 4 text-free bases, taxila-brain returned an interior point per part, in two independent runs (4.2-9.8 s each). One rater judged run 1 on the overlay PNGs (`*-anchors.png`).
- **Run 1: 20/20 points fell inside the named part.** One was borderline: "evaporation" sat on a vapour line.
- **Run 1 vs run 2,** using flood-fill regions on the flat-colour art (PIL `floodfill`, threshold 40):
  - 11/20 points fell in the *same connected region*;
  - 16/20 in the *same colour class* (RGB distance < 30).
  - Where the runs differ:
    - **thin parts:** the cell membrane, a 2-3% ring next to the wall;
    - **composite parts:** stamen = anther + filament; run 2 chose the anther;
    - **multi-instance parts:** a different petal or chloroplast, which is valid.

**Rules that follow:**
1. **The VLM proposes, a person confirms.** The review tool shows the proposed dots and the reviewer taps to accept or move each one, about 5 s per part. An anchor without `verified_by` is never served.
2. **Composite parts get a declared convention** in the kit term bank. Examples: `stamen → filament mid-point`; `ovary → centre of the swollen base`; `cell membrane → the inner line, labelled on the side with the widest gap`. The convention is what the VLM is asked for and what the reviewer checks.
3. **Thin parts need a minimum separation.** Where two anchors lie closer than the band's `hit.min` (64 dp on B1-B2), the base is rejected for `quiz_tap` and allowed only for `show` and `quiz_drag` with side labels. Alternatively, the figure is redrawn with the thin part exaggerated (an SVG part-figure). A child cannot tap a 2% ring on a phone.
4. **Hit regions come free from the flat style.** For `quiz_tap`, the flood-fill region at a verified anchor is the hit mask, stored as a simplified polygon (≤ 24 points) in the manifest.
   - This works because the style guide forbids gradients and textures (§7.2).
   - Regions under 0.5% of the image area are not tappable.

### 5.4 Indian context in diagrams and scenes (generation-side specifics; the principles are in visual-identity §6.4-6.6)

| subject area | use | avoid | why |
|---|---|---|---|
| plants | hibiscus (gudhal), mustard (sarson) field, neem, banyan, mango and banana trees, tulsi only as a plant (no worship scene), paddy, wheat | rose-only "generic flower"; tulips and maples as the default | NCERT examples; children recognise them [I] |
| animals | sparrow, crow, myna, squirrel, cow only as livestock in context, goat, buffalo, tortoise, rohu fish | owl as "clever", parrot for understanding, monkey as a comic stand-in for a person | visual-identity §6.3 idioms |
| home and kitchen | steel thali, katori, pressure cooker, matka, gas stove, chulha (rural, not "poverty"), ceiling fan | only-modular kitchens; only-rural huts | setting rotation (§6.4 there) |
| school and lab | government-school uniforms, slates, NCERT-style beakers, a torch bulb, dry cells as in NCERT figures | US-style lockers and school buses | agreement with the textbook |
| circuits and lab apparatus | NCERT symbol set (long/short cell lines, switch, bulb) drawn by `circuits@1`, not generated | generated circuit pictures | §2.1: 3/3 open switches when "closed" was asked |
| people | cast from the representation matrix; illustrated, never photoreal; ages read clearly (child vs adult) | photoreal children (also blocked by Azure [V]); fairness glow; caste-coded jobs | Qadri et al. 2023 and Ghosh et al. 2024 document an "outsider's gaze", exoticism and misappropriation in South-Asian T2I output [S] |
| text in the world | blank signboards, unlabelled packets | any script on signs, packets or books | the no-text gate (I2); wrong script is worse than none |

---

## 6. Learning-science rules that shape every diagram

### 6.1 Evidence → rule

| evidence | rule | tag |
|---|---|---|
| **Spatial contiguity:** words next to the picture they describe beat separated legends (Ginns 2006 meta-analysis; Schroeder & Cenkci 2018, g ≈ 0.6) | labels sit at the part with a leader line, never in a legend box; for colour keys, the key sits beside the marks (visual-identity §3.4) | [M] |
| **Temporal contiguity and signalling:** highlighting what the narration names helps, most for system-paced media (Noetel et al. 2022; Richter, Scheiter & Eitel 2016) | `highlight{part}` on the teacher's cue; `reveal: stepwise` for flows; at most one pulse at a time | [S via learning-science §2.4] / [M] |
| **Simplified diagrams beat detailed ones** for mental-model building (Butcher 2006, *J Educ Psych* 98:182) | diagrams show only the parts the objective needs; a raster base is "fewest details" (visual-identity §6.1) | [M] |
| **Perceptual richness can hurt children's learning and transfer** (Kaminski, Sloutsky & Heckler 2008; Menendez, Rosengren & Alibali 2020; Petersen & McNeil 2013 in maths-engines) | diagrams are flat and bland; rich illustration is for context only, kept apart from the diagram that carries the concept | [M] / [S] |
| **Seductive details hurt** (d = −0.30 to −0.48, learning-science) | no decorative characters inside a diagram canvas; `context` nodes never animate (scene@1 R6) | [S] |
| **Concreteness fading** (Fyfe et al. 2014) | sequence: illustration (concrete scene) → `label-diagram` or engine (pictorial) → `formula@1` (symbolic); the same `objective_id` links the three | [S] |
| **Arrows are read as sequence, causation or motion** (Heiser & Tversky 2006) | one arrow meaning per diagram; `edge.kind` styles it | [M] |
| **Textbook agreement** (NCERT colour semantics, maths-engines) | label language follows the child's medium (English-medium CBSE uses English terms, with Hindi on toggle: science-engines); NCERT symbol conventions in circuits and optics | [V via sibling docs] |
| **"Not to scale"** seeds misconceptions (solar system, science-engines) | an exaggerated figure carries a "not to scale" chip, and the teacher says it once | [S via science-engines] |

### 6.2 Diagram style tokens (for every engine above; extends the visual-identity tokens)

| token | B1 | B2 | B3 | B4 |
|---|---|---|---|---|
| `dg.stroke` (outline, `kajal`) | 3 dp | 2.5 dp | 2 dp | 1.5 dp |
| `dg.leader` (line) | 2 dp, dot 6 dp | 2 dp, dot 5 dp | 1.5 dp, dot 4 dp | 1.5 dp, dot 4 dp |
| label size (Latin / Devanagari) | 20 / 22 sp | 18 / 20 | 16 / 18 | 15 / 17 (16 / 18 floor in modules) |
| max nodes (flow · tree) | 4 · 5 | 5 · 7 | 7 · 12 | 8 · 15 |
| max labelled parts | 4 | 5 | 6 | 8 |
| fills | diagram core hues at 15-25% tint, full-strength outline | same | same | same |
| arrowhead | filled triangle 10 dp | 9 dp | 8 dp | 8 dp |

---

## 7. Illustration style guide (for Forge generation; the authority on look remains visual-identity §6)

### 7.1 The style anchors
- **One approved style anchor sheet per band** (B1-B4), commissioned or generated, then human-approved and frozen.
- Each sheet holds 6 objects (mango, steel tumbler, school bag, neem leaf, bicycle, matka), 2 children and 1 adult, drawn with the band's outline, shading and proportions (visual-identity §6.1).
- The anchors are passed as reference images on every `images/edits` call. Text style descriptions alone drift between batches [I]. The sibling asset-probe measures how well references hold a character and style at `input_fidelity: high` versus `low`; its numbers decide whether references are mandatory or advisory.
- Anchors are versioned (`style.B2@3`). A new anchor version re-baselines the hue lint; it does not re-generate the library.

### 7.2 Style blocks as data (compiled into prompts by code; never hand-written per job)
```jsonc
{ "style": "style.B2@1",
  "medium": "flat 2D vector-like illustration",
  "outline": { "color": "kajal #3A3631", "weight": "uniform, medium-thick", "corners": "rounded" },
  "shading": "flat fills plus one shade tone of the same hue; no gradients, textures, glow or blur",
  "palette": ["neel #2A72C6", "matka #C2410C", "neem #0B5E50", "baingan #3F2272", "haldi #946B0E", "cream #FFF8EE", "skin-1..6 per cast"],
  "proportion": { "head_to_body": "1:3.5", "eyes": "large, expressive" },
  "detail": "fewest details needed; at most 8 hues plus skin and neutrals",
  "background": "plain cream or very simple, 30% lower contrast than the subject",
  "negatives": ["text", "letters", "numbers", "logos", "signage script", "flags", "religious symbols", "weapons", "photorealism", "3D render", "gradients", "drop shadows"] }
```
- The repo law "sentence-shaped prompt text gets recited" was measured on chat personas. An image model does not recite. Even so, style blocks stay structured data, so that a drift can be diffed and attributed to one field [I].

### 7.3 Prompt schema (compiled; the order is fixed and the negatives come LAST, the repo's position-is-mechanism law, applied untested here)
```ts
interface IllustrationJob {
  job: "raster.context" | "raster.base"; objective_id: string; band: Band; style: `style.${Band}@${number}`;
  subject: string;                        // ≤ 200 chars, from the visual plan (structured: object, action, setting)
  parts_visible?: string[];               // raster.base only: every part that must be visibly separate (for anchoring)
  cast?: { role: string; age: "child" | "teen" | "adult" | "elder"; gender: "f" | "m"; skin: 1|2|3|4|5|6; clothing: string; aids?: ("glasses"|"hearing_aid"|"wheelchair")[] }[];
  setting: "village" | "small_town" | "metro_flat" | "hills" | "coast" | "desert" | "northeast" | "school_govt" | "school_private";
  composition: { aspect: "1:1" | "4:3" | "3:4"; subject_box: [number, number, number, number]; safe_zones?: [number, number, number, number][] };
  refs: string[];                          // style anchor (+ character sheet) blob ids
  quality: "low" | "medium"; candidates: 1 | 2 | 3;
}
// compile(job) → "<medium>. <outline>. <shading>. <palette>. Subject: <subject>. Cast: <role, age, skin-n as a plain colour
// description, clothing>. Setting: <setting>. Composition: subject inside the box, empty margins at the safe zones.
// No text of any kind, no letters, no numbers, no labels, no arrows. <negatives>."
```
- Skin tokens are converted to a plain description ("medium-brown, warm"). The image model cannot read our token names; the I4 gate checks the result against the hex values.
- **Never** name a living artist or a living folk tradition (visual-identity §6.6). Lint: a deny-list of artist names and of `Warli|Gond|Madhubani|Pattachitra|Kalamkari|Phad|Pithora|Kalighat`, matched against the compiled prompt.

### 7.4 Palette quantisation and lint (I3)
1. Convert to CIELAB. Map every pixel to the nearest colour in `{band palette tints and shades} ∪ {cast skin tokens and their shade tones} ∪ {cream, kajal}` by ΔE2000.
2. Keep the original where ΔE > 12 *and* the area is under 0.5%, so anti-aliasing survives. Otherwise snap.
3. **Lint:** hue clusters with more than 1% area, at most 6 for B1, 8 for B2 and 10 for B3-B4; outline pixels near `kajal`; no pixel within 12° of the `turn` hue with saturation > 0.6 inside a ring-like shape. That last check is a rough proxy for G-VI-1, the your-turn signal reservation [U: classifier to build].
4. Quantised WebP at q 80 should land at 40-120 KB at 1024², the multimodal-orchestration budget [U: measure in M-DI-4].

### 7.5 Consistency across a lesson pack
- Recurring characters (the protégé cousin, a classmate) appear only through the edit endpoint with their character sheet as a reference. Never by text alone.
- Recurring objects reuse the *same* sprite or illustration asset across modules. Do not generate a new "matka" per scene.
- A pack is reviewed **as a contact sheet**, all images of a chapter on one page, so drift across images is visible, not only within one.

---

## 8. Safety (predicates, not instructions)

| risk | predicate | where |
|---|---|---|
| harmful or unsafe prompt | Content Safety on the compiled prompt, plus the Azure prompt filter | Forge, before the call |
| unsafe output | Azure output filter (`contentFilter`) plus Content Safety `image:analyze` = 0 | I0, I1 |
| sexualised or romantic depiction of anyone, especially children or the teacher | VLM checklist flag ⇒ hard reject; illustrated children only; Azure blocks photoreal minors by default [V]; human key 2 | I5, review |
| a child's likeness | **no child photo, voice-derived avatar or child drawing is ever sent to an image or video model**; per-child images are banned (MO4) | architecture rule |
| wrong science taught by a picture | no baked labels; anchors verified by a person; figures carry asserts; teacher key 1 | §4.6, §5.3 |
| stereotype and colourism | cast spec plus I4 skin check plus G-VI-7 audit; quarterly 4-region parent and teacher panel (M-VI-6) | review |
| maps, flags, emblems, currency, deities | router ban plus a VLM motif check | §3, I5 |
| text in a raster (wrong script, gibberish, slurs) | OCR must return `NONE` | I2 |
| markup injection in diagrams | engines render text as text nodes; no Mermaid in the frame; KaTeX `trust:false` plus an allowlist; DOMPurify (SVG profile) on any library SVG at ingest, with `foreignObject`, `script`, `on*` and external `href` rejected | D0, §4.4, §4.6 |
| provenance and disclosure | C2PA manifest kept; the parent info page says illustrations are AI-made and teacher-reviewed | publish |

---

## 9. Costs and throughput

| item | unit cost | basis |
|---|---|---|
| raster, low (1024²) | **$0.0059**, about 20 s (16.3-22.0 s, n = 12) | [X] 196 output image tokens × $30/M |
| raster, medium | **$0.0527**, 38.6-42.8 s (n = 4) | [X] 1,756 output image tokens × $30/M |
| VLM OCR or anchor call | about $0.01 [U] | sol, one 1024² image at high detail |
| free SVG figure (sol, medium) | about 1-2.4k output tokens (incl. 0.4-1.5k reasoning), 8-25 s | [X] |
| diagram spec fill (luna) | about 0.3-0.6k tokens, 1-3 s | [U] (tech-and-market) |

**Library sizing.** The seed has 742 topics across 33 books: maths 304, science 146, English 118, SST 65, EVS 64, Hindi 45 [X, `data/curriculum`].
- **Assumptions:**
  - about 1.5 illustrations per science, EVS, SST and language topic (about 660), plus about 0.3 per maths topic (about 90), so about 750 rasters;
  - 3 low candidates and 1 medium final each.
- **Cost:** 750 × (3 × $0.0059 + $0.053 + 3 × $0.01) ≈ **$76**, plus about 400 offline SVG figures at about $0.03-0.05 ≈ $20. Even if rejections triple the raster attempts (§2.1), the total stays **≈ $110-250**.
- **Throughput:** at 4 RPM the rasters take about 3,000 calls ≈ 13 h of quota, run over nights.
- **The binding cost is review:** about 750 rasters × about 2 min for two keys and anchors, plus 400 figures × about 3 min ≈ **45 reviewer-hours** [I].
- This is why bases and figures are per *concept* and shared across bands where the band style allows. Band B3/B4 can share a base.

---

## 10. Measurements: done here, and next

| id | done or next | method | decides |
|---|---|---|---|
| M-DI-1 | **done** (§0.5-0.6, §4.3) | renderer probe: payload, KaTeX 26 expressions, 5 layout engines × 2 languages × font race | Mermaid/Graphviz out; dagre + polar + tidy tree; KaTeX CSS rule |
| M-DI-2 | **done** (§1.1); **next:** add ray diagram with a virtual image, food web, cross-section; Devanagari `<text>` inside SVG; n = 5 | svg probe | whether more figure kinds can be auto-promoted with asserts |
| M-DI-3 | **done** (§2.1, §5.3); **next:** n = 5 per subject, 3 more subjects (eye, leaf, volcano), two raters with a κ | image probe | baked-label ban (keep or relax for B4 English only) |
| M-DI-4 | next | quantise 50 Forge rasters; WebP bytes, hue counts, ΔE to tokens | §7.4 thresholds, the 120 KB budget |
| M-DI-5 | next | reference-anchored edits vs text-only style, 20 objects × 2 arms, rated blind for style match by 3 raters | §7.1 (uses the sibling asset-probe result) |
| M-DI-6 | next | label-diagram teach-then-quiz with child testers: anchor-dot vs arrowhead, labels left vs right, n ≥ 20 per band | §4.3 leader rules |
| M-DI-7 | next | KaTeX font subset on a budget Android device: bytes and first-render ms; MathML read-out in TalkBack | §4.4 |
| M-DI-8 | next | low-end Android render cost of dagre + measure for 8 nodes (median and p95 ms) | the generate-now budget |

---

## 11. Proposed `context/` entries (for the main loop to merge; this workstream writes only in `content/`)

**Decisions** (each with what would reverse it):
- `diagram-router-by-shape`: the renderer is chosen by the content shape (§3), never by the model.
  - *Reverse if* a 40-brief, two-teacher study shows model choice beats the table on fit at equal error.
- `no-baked-labels-in-rasters`: labels are overlays at human-verified anchors.
  - *Reverse if* n ≥ 40 labelled images per language show ≥ 99% spelling **and** ≥ 99% leader accuracy **and** zero science errors, with κ ≥ 0.8 between two raters.
- `free-svg-offline-only-with-asserts`: free SVG may enter the library only with an assertion manifest; it is never generated live.
  - *Reverse if* a model hits ≥ 99% on M-DI-2's extended set at p95 ≤ 3 s.
- `no-mermaid-graphviz-in-child-frame`: dagre, a polar layout and a tidy tree with font-measured text are used instead.
  - *Reverse if* Mermaid ships a sub-200 KB core with a closed, audited label path.
- `katex-devanagari-font-rule`: KaTeX `\text` uses the Mukta override, with the allowlist and trust function in §4.4.
  - *Reverse if* KaTeX ships Devanagari metrics.

**Measurements:**
- `renderer-probe-2026-10-02` (M-DI-1);
- `free-svg-accuracy-2026-10-02` (M-DI-2, n = 3 × 4 × 2);
- `labelled-raster-en-hi-2026-10-02` (M-DI-3, n = 1 per cell, one rater).

**Rejections** (what was tried → what broke):
- `baked-label-science-diagrams`: gpt-image-2 labelled diagrams, 12 images, EN and HI, low and medium → Hindi leaders on the wrong part 5/32 (English 1/32); one corrupted glyph that the VLM OCR gate passed; 3/3 "closed circuits" with open switches; fully correct EN 4/6, HI 1/6; medium quality did not fix Hindi.
- `mermaid-for-children`: Mermaid 12.1 → 1.58 MB gz, a run of sanitisation advisories, and a default 200 px wrapping width that makes tall, narrow phone diagrams.
- `graphviz-for-hindi`: Graphviz (viz.js) → Devanagari widths estimated without the font; every Hindi box ≥ 70 px wider than its text.
- `svg-bench-64-citation`: citing SVG-Bench → it is a single-row, display-only leaderboard, not evidence (`supersedes` the tech-and-market §4 claim).

---

## Sources
- Zou et al., VGBench, arXiv 2407.10972: https://arxiv.org/abs/2407.10972 [S]
- Qiu et al., Can LLMs understand symbolic graphics programs? (SGP-Bench), ICLR 2025, arXiv 2408.08313: https://arxiv.org/abs/2408.08313 [S]
- Nedungadi, Oehmcke & Lüdtke, Autoregressive Mosaics, arXiv 2608.30751: https://arxiv.org/abs/2608.30751 [S]
- Wang et al., SVGEval (ECCV 2026), arXiv 2608.01977: https://arxiv.org/abs/2608.01977 [S]
- Cipriano et al., SVG-Score, arXiv 2609.03806: https://arxiv.org/abs/2609.03806 [S]
- Zala et al., DiagrammerGPT (COLM 2024), arXiv 2310.12128: https://arxiv.org/abs/2310.12128 [S]
- Wei et al., From Words to Structured Visuals (DiagramGenBenchmark / DiagramAgent), arXiv 2411.11916: https://arxiv.org/abs/2411.11916 [S]
- MagicGeo, arXiv 2502.13855: https://arxiv.org/abs/2502.13855 · GeoLoom, arXiv 2512.08180 (via arXiv listing) [S]
- MermaidSeqBench, arXiv 2511.14967 (via arXiv listing) [S]
- SVG-Bench on BenchLM: https://benchlm.ai/benchmarks/svgbench [V]
- Luo et al., MMMG (NeurIPS 2025 D&B), arXiv 2506.10963: https://arxiv.org/abs/2506.10963 [S]
- OpenAI, Image generation guide: https://developers.openai.com/api/docs/guides/image-generation [V]
- Microsoft, Azure OpenAI image generation how-to: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/dall-e [V]
- Microsoft, Content Credentials in Azure OpenAI: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/content-credentials [V]
- OpenAI community, transparent backgrounds for gpt-image-2 (2026-08-20): https://community.openai.com/t/transparent-backgrounds-are-now-available-in-preview-for-gpt-image-2-in-the-api/1391541 [S]
- Mermaid security advisories: https://github.com/mermaid-js/mermaid/security/advisories [V]
- KaTeX security advisories: https://github.com/KaTeX/KaTeX/security/advisories [V]
- Qadri, Shelby, Bennett & Denton, AI's Regimes of Representation (FAccT 2023), arXiv 2305.11844: https://arxiv.org/abs/2305.11844 [S]
- Ghosh, Venkit, Gautam, Wilson & Caliskan, Do Generative AI Models Output Harm while Representing Non-Western Cultures (AIES 2024), arXiv 2407.14779: https://arxiv.org/abs/2407.14779 [S]
- Glyph-ByT5-v2, multilingual visual text rendering, arXiv 2406.10208 (10 languages; Indic not reported) [S]
- [M] Ginns 2006 (*Learning and Instruction* 16:511); Schroeder & Cenkci 2018 (*Educ Psych Rev* 30:679); Richter, Scheiter & Eitel 2016 (*Educ Res Rev* 17:19); Butcher 2006 (*J Educ Psych* 98:182); Kaminski, Sloutsky & Heckler 2008 (*Science* 320:454); Menendez, Rosengren & Alibali 2020 (*Applied Cognitive Psychology*); Heiser & Tversky 2006 (*Cognitive Science* 30:581). Re-read these before any parent-facing claim.
- Sibling documents: `tech-and-market.md` §3-4, `learning-science.md` §2.4, `content/genui-reliability.md` §5, `factory/multimodal-orchestration.md` MO4-MO5, `design/visual-identity.md` §3-6, `content/science-engines.md`, `content/maths-engines.md`, `content/language-sst-engines.md`.
- Raw data: `diagrams-images-renderer-probe-2026-10-02.json`, `diagrams-images-svg-probe-2026-10-02.json` (plus SVGs and PNGs), `diagrams-images-image-probe-2026-10-02.json` (plus PNGs and anchor overlays).

---

## Engineering review

Reviewer: senior frontend/game engineer, 2026-10-02. Scope: can each engine in §3-§5 be built in React/TS + SVG/canvas in 2 days or less, run at 60 fps on a 10k-rupee Android, be steered by an LLM through its params, be observed by the teacher through its events, and ship without a safety hole. I checked the doc against the shipped code: `shared/contracts.ts` (`ModuleToHost`, `HostToModule`), `src/modules/frame/protocol.ts`, `src/modules/host.tsx`, `vite.config.ts` (frame CSP) and `modules.html`. Verdict labels: **OK** (as written), **FIX** (build as written but change the spec), **BLOCKER** (will not work as specified).

Cost scale: **S** = at most 1.5 engineer-days, **M** = 2-3, **L** = 4-6, **XL** = more than 6. Days include the zod schema, Devanagari checks, a golden-snapshot test, a TalkBack pass and one run on a low-end device. They do not include review hours.

### E0. Findings that apply to every engine

1. **BLOCKER: the event and command contract in §4.2 is not the shipped one.** The doc says "the names are the shipped `ModuleToHost` kinds". They are not.
   - `ModuleToHost` has exactly six kinds: `ready`, `interaction{name,data}`, `answer{value,correct?}`, `goal_met{goal}`, `stuck{reason}`, `error{message}`.
   - `fl.step`, `cm.place`, `ld.drop`, `fx.step` and `tap` can only travel as `interaction` names.
   - `ready` carries no payload. `ready{overflow, fit_scale, min_label_px}` needs a contract change, and `toModuleEvent` currently drops `ready` and never forwards it. D8 would never fire.
   - `parseModuleToHost` rebuilds `answer` from `value` and `correct` only, and strips every other key. `answer{node, value, correct, misc}` loses `misc` and `node`. Put the fields in `interaction` data, or extend the parser and the test at `tests/client-runtime.test.mjs:460`.
   - `HostToModule` has `highlight{target:string}`, `reveal` with no index, and `reset`. There is no `cue{id}` and no `reveal{idx}`. Stepwise reveal needs `reveal{idx?}` (optional) or `set_param`.
   - Cost: S (1 day) for a contract v2 (`ready.meta`, `interaction` schema registry, `reveal{idx}`, `cue`), with the parser tests. It must land before any engine. Everything below depends on it.
2. **FIX: engines run in `sandbox="allow-scripts"` with no `allow-same-origin`, and the CSP is `default-src 'none'`, `img-src 'self' data: blob:`, `font-src 'self'`, `connect-src 'none'`.** Four consequences:
   - **Raster bases:** the frame cannot fetch them. The host must fetch and pass `data:` URLs or an ArrayBuffer by `postMessage`. A `blob:` URL minted by the parent origin is probably not loadable from an opaque-origin frame [U: test on Android WebView]. A 100 KB WebP as base64 is about 135 KB per message, and structured clone copies it. For `label-diagram@1` the host should pass the image once, with the anchor manifest.
   - **Fonts:** `font-src 'self'` means the opaque frame loads Mukta from the real origin as a cross-origin request. That needs `Access-Control-Allow-Origin` on the font files, including from the Capacitor `https://localhost` origin, or fonts inlined as `data:`. This is where a Devanagari fallback silently appears in the APK. Test it first (M-DI-7).
   - **Font cost:** each frame loads and decodes Mukta on its own (about 2 weights, 100-150 KB). `document.fonts.load` per frame, plus a re-layout on every mount, adds 150-400 ms on a slow phone [I]. Either keep one warm frame per lesson, or lay out in the host and send the frame a finished SVG.
   - **Better architecture [I]:** T1 engines are first-party code with no model-written script. They do not need the iframe at all. Render them as host React components, and keep the sandbox for the Forge-generated free-form modules. This removes the font, image and message-copy problems and halves mount time. I recommend it, but it is a decision for the owner, because `decisions.md:133` fixes the separate-origin iframe for generated code. A first-party exception needs an entry with its reversal condition.
3. **FIX: the 60 fps story is unwritten.** A static SVG diagram is trivially 60 fps. The risk is in four places.
   - **The highlight pulse:** animate only `transform` and `opacity`. No SVG `filter`, `drop-shadow`, `blur` or `mask`. Those repaint on the CPU on a Helio G36 / Unisoc class phone and drop to 15-25 fps [I, M]. Pulse with a ring element scaled by transform, not a glow.
   - **Drag in `quiz_drag`:** move only the dragged chip with `translate3d`. Update at most one leader line per frame. Set `touch-action:none` on the chip, or the parent column's vertical scroll steals the gesture. Use pointer capture. This is the most common Android WebView bug in drag UIs.
   - **Node budget:** cap at 300 SVG nodes per diagram (D9 already caps bytes at 40 KB; add a node count). Add `contain: layout paint` on the stage.
   - **Reduced motion and flashing:** respect `prefers-reduced-motion`. A pulse must stay below 2 Hz (WCAG 2.3.1 limits flashing to 3 per second). The doc's "at most one pulse at a time" is fine and should state the rate.
   - **Targets:** build against Chrome WebView 90 (low-end devices often lag on updates). `Intl.Segmenter`, `aspect-ratio` and `inset` need 87-88. Set Vite `build.target: "chrome87"` and verify.
4. **FIX: Devanagari wrapping "at akshara boundaries" is not reliable.** `Intl.Segmenter` grapheme mode only keeps conjuncts (`consonant + virama + consonant`) together in ICU 74+ / Unicode 15.1. Older WebViews split after the virama and the word breaks mid-conjunct. Do not rely on it. Wrap on spaces only. If one word is wider than the column, return a slot error (D4) rather than splitting it. Prefer DOM measurement or CSS (`overflow-wrap`, `word-break: keep-all`) over canvas `measureText`: it uses the same shaper that paints, and it returns line boxes.
   - **Clipping:** Devanagari needs `line-height` 1.5-1.6. Matras above and below the headline clip at the Latin-based 1.2 that SVG `<text>` uses. Node heights must come from font ascent and descent, not cap height. The §4.3 "16 sp Latin / 18 sp Devanagari" floor does not cover this, and it is the most likely cause of visible clipping.
5. **FIX: D4 is declared a server gate ("ms, no model") but needs the painted font.** Overlap and floor checks at the real glyph widths need either the device (D8) or a server-side shaper (harfbuzzjs, about 200 KB wasm, with the same Mukta file). Split the table: D0-D3, D5-D7, D9 on the server; D4 and D8 on the device; D4 on the server only if harfbuzzjs is added (M, 2 days). Otherwise the server passes a spec that the device then rejects, and the fallback costs a visible stall.
6. **FIX: free text in `TermRef` breaks the doc's own rule.** The pipeline says the LLM picks term ids and never types a technical term live. The `TermRef` type allows `{text: L10n}`, including `hi`, authored live by a model. LLM-written Hindi is the least reliable output we have. Make `text` available only for non-technical words in English; require `hi` to come from the kit; deny-list plus Content Safety on `text`; lint that `text` does not match a term-bank entry in another language. Also `say`, `title`, `detail` and `alt` should be kit strings or templated.
7. **Child-typed text is an injection path.** `answer.value` for blanks may be free text that returns to the teacher's context. Restrict blanks to choices or numerals. If typed text stays, cap it at 40 characters, escape it, and mark it `child_input` so it reaches the prompt as data. This is a safety predicate, not an instruction.
8. **FIX: the event set cannot support the teacher's questions "did she understand?", "is she stuck?", "which misconception?".** Shared additions for all engines:
   - `ms` on every answer (time from stimulus to action), `attempt` (1, 2, 3), `hint_used` (bool).
   - `idle{ms}` and the existing `stuck{reason}` kind, which the doc never uses. Emit it after 12 s without input on an active quiz.
   - `give_up` when the child taps "show me" (the learner model must separate a reveal from a success).
   - Wrong-answer attribution without a distractor tag: `{part, dropped_label_part}` (which part the dropped label really belongs to). The pair `(asked, chosen)` is the confusion matrix. The doc's `misc?` only exists when a distractor was authored.
   - Coalesce `tap` events (at most 5 per second) so a bored child does not flood the Director.
   - Per-engine gaps are listed below.
9. **Safety: other items.**
   - Replace `\htmlClass` in KaTeX with a pure id-to-class map. The trust function with a regex is one more thing to keep correct; no model-written class names are needed at all.
   - The advisory ids and dates in §4.4 were not re-read here. Verify before quoting.
   - `D0` bans `<` and `>` in all strings, which breaks `formula@1` for any comparison (class 2-5 "3 < 5") unless `tex` is exempt and uses `\lt` and `\gt`. Engines render text nodes, so `<` is harmless in plain labels. Ban markup patterns, not the characters.
   - `D7` (Content Safety) passes the live label strings, but a live-written `say` or `reveal` string is read out loud by TTS. Run the same gate on spoken strings.
   - **Truth of a formula is not checked.** D3 only checks that the TeX parses. A model can emit a well-formed, wrong lens formula. Named formulas must come from a kit bank by id (`F.*`). Free `tex` is allowed only for worked-example steps and must pass a numeric check (evaluate both sides with mathjs on random inputs). "A model never grades" applies to a model authoring the key too.
10. **Cost model gap (§9):** `images/edits` with 2-3 reference images bills input image tokens as well. The doc prices only output. The amount is probably small next to the output [U], but measure it in M-DI-5 before quoting $110-250. The review tool (anchors, two keys, contact sheet) is also missing from every estimate and is the largest build item (below).

### E1. Per-engine review

| engine | verdict | 2-day build? | fps on a 10k phone | LLM params enough? | events enough? | safety | cost |
|---|---|---|---|---|---|---|---|
| shared foundation (measure, wrap, font load, tokens, events, gates harness, golden snapshots) | not in the doc | no, this precedes every engine | n/a | n/a | n/a | n/a | **L** (5 days) |
| `flow@1` | FIX | chain + cycle: yes. Full spec: no | fine, static | mostly | no | OK after E0.6 | **M** (3 days) |
| `concept-map@1` | FIX | tree only: yes | fine | mostly | no | OK after E0.6 | **M** (2.5 days; radial dropped) |
| `label-diagram@1` | BLOCKER on phone layout | no | drag is the risk | mostly | no | anchors verified, OK | **L** (5 days) plus the review tool **L** (4-5 days) |
| `formula@1` | FIX | yes | fine | needs a blank field | no | needs the formula bank | **S** (1.5-2 days) |
| `contrast-pair@1` | FIX | only after `renderStatic()` exists | two live canvases are the risk | yes | thin | OK | **M** (2-3 days) |
| `svg-figure@1` runtime | OK | yes | fine | yes | thin | DOMPurify at ingest OK | **S** (1 day) |
| `svg-figure@1` Forge assertion harness | FIX | no | n/a | n/a | n/a | OK | **L** (5 days) |
| `illustration@1` runtime | OK | yes | fine, one decoded bitmap | yes | thin | OK | **S** (1 day) |
| Forge raster pipeline (I0-I5, quantise, anchors, review tool) | FIX | no | n/a | n/a | n/a | OK | **XL** (8-10 days) |
| router + spec-fill + D-gates + library table + prefetch | OK | no | n/a | n/a | n/a | OK | **M** (3 days) |

Total for engines and shared code: about 18 engineer-days. Total with the Forge tooling: about 35-40 days. Engines in the "≤2 days" frame are real only once the foundation and the contract v2 exist.

#### `flow@1` (M, 3 days)
- **Feasible:** dagre `chain`, `branch`, `merge` in 2-10 ms for at most 8 nodes. The `cycle` polar layout is about 60 lines. `@dagrejs/dagre` is the maintained fork; the old `dagre` package is unmaintained.
- **Cycle limit:** on a 380 dp column a 5-node cycle fits at B1-B2. Eight nodes with two-line Devanagari labels of about 110 dp wide overlap on the left and right arcs at a radius of about 140 dp (chord about 107 dp). Cap `cycle` at 6 nodes on phones. For 7-8 nodes fall back to a vertical chain with a return arrow. Put this in D4, not in the prose.
- **Stage height:** `direction:"down"` with 8 nodes at 64 dp targets plus gaps is about 700 dp, taller than the stage. Specify that the stage scrolls, or that nodes shrink the gap and not the label. The doc says scale 1 but gives no stage height.
- **Params missing:** `start` node and `rotation` for cycles (the arrow direction is fixed clockwise otherwise); initial `highlight`; `mode: "show" | "order" | "fill"`. The probe "sequence/construct" needs the child to put shuffled nodes into order, and `blanks` only covers fill-in. Add `shuffle_seed` for reproducible order tasks.
- **Events missing:** `fl.order {submitted: [ids], correct, first_wrong_idx}`, the E0.8 fields, `goal_met` when all blanks are right, `fl.replay` count (did she tap the cycle again?).
- **A11y:** nodes as real buttons for TalkBack, with the order read as a list.

#### `concept-map@1` (M, 2.5 days)
- **Feasible:** Reingold-Tilford is about 3 KB if the tree is small. 15 nodes at 380 dp is `tree-down` only. `tree-right` needs the labels to wrap in a width that no longer exists, and `radial` with 15 nodes and Devanagari does not fit. **Drop `radial` and `tree-right` for v1** (S) and add them after M-DI-8 shows the room. The "≤ 15 nodes" cap at B3-B4 on a 380 dp column is optimistic: 3 levels with 5 siblings at 64 dp targets need about 340 dp for one level alone, so siblings must stack, which makes it a list.
- **Sort probe:** `sortItems` is a drag task. It costs +1 day and shares the drag code with `label-diagram@1`. Build that once, as a shared `useDrag`.
- **Events missing:** `cm.place` without the E0.8 fields; `goal_met`; `cm.expand`/`cm.collapse` if branches can collapse (they should, to fit).

#### `label-diagram@1` (L, 5 days; plus the review tool L)
- **BLOCKER: the side-column layout does not fit a phone.** With `side:"both"` and Devanagari labels about 110 dp wide, two columns take 220 dp of a 380 dp column and leave a 160 dp image. With one column the image is 250 dp wide. A 4:3 landscape base loses its parts at that size, and the `hit.min` of 64 dp (B1-B2) cannot hold for thin parts. Specify instead:
  - one label column, at most 40% of the width;
  - bases generated at 3:4 portrait or 1:1 (the prompt schema allows 4:3; forbid it for `label-diagram` bases);
  - `side:"both"` only at 600 dp and wider;
  - an alternative `mode:"numbered"`: number dots on the image and a list below, for 7-8 parts.
- **Leader order:** sorting labels by anchor y gives no crossings only if all anchors lie on one side. For the general case use a non-crossing matching: start with y order and swap crossing pairs until none cross. A swap always shortens total length, so it terminates. About 40 lines (S). Leaders can still cross over other parts of the image, which is acceptable; label tags must not.
- **Hit masks:** polygons of at most 24 points are checked with point-in-polygon at runtime (cheap). Do the flood-fill offline, not on the device. A mask must be generated from the published (quantised) WebP, not from the candidate. Store `sha256` of the served bytes in the anchor record and assert it equals the bytes served. The §5.2 order (quantise at I3, then anchors) is right but nothing enforces it.
- **fps:** a single SVG overlay over a decoded bitmap. A 1024² bitmap decodes to 4 MB. Three prefetched bases are 12 MB, which is fine on 3 GB. Decode off-thread with `img.decode()`.
- **Params missing:** `attempts_max`, `hint_policy` (when does the part pulse itself), `shuffle_seed` for the chip order, `reveal_on_wrong: bool`, and `distractors` should be allowed only when each has a misconception id (already stated; add it to D2).
- **Events missing (this engine is the most observable one, so be generous):** `ld.drag_start {label}`, `ld.drop` plus `ms`, `attempt`, `dropped_label_part`, `ld.drop_miss` (dropped on nothing; abandonment is a signal), `ld.hint`, `goal_met`. **`quiz_voice` has no event at all.** The child's spoken answer arrives through ASR in the host and not from the frame. Define it: the host emits `answer{source:"voice", part, value, correct}` after the check, and the frame only sends `ld.voice_wait`. Otherwise the learner model records no evidence for voice quizzes.
- **Review tool (L, 4-5 days):** the doc treats "one tap per part" as free. It needs an authenticated reviewer UI, the proposed dots over the image, drag to move, the composite-part convention shown, a minimum-separation check, polygon preview, an immutable record, and the two-key sign-off. Budget it explicitly. Without it the ban on baked labels has no operational replacement.

#### `formula@1` (S, 1.5-2 days)
- **Feasible:** KaTeX 0.19 with the Mukta rule and a font subset. Lazy-load it (`import()`) only when a formula engine mounts: 76 KB gz parse costs 40-80 ms on a low-end phone [I], once. KaTeX's first-render median of 0.4 ms was measured on a server CPU; allow 5-10× on the phone.
- **Fonts:** subsetting to about 110 KB [U] is a drop of an unknown; the font files' `font-src 'self'` CORS issue in E0.2 applies.
- **Allowlist gaps** that class 1-9 will hit in the first week:
  - `\lt \gt` (see E0.9), `\%`, `\ldots`, `\quad`, `\;`, `\Rightarrow`, `\therefore`, `\because` (class 9 proofs), `\overrightarrow`, `\sqrt[3]{}`, `\boxed` and `\square` (the blank for "☐ + 3 = 7", class 1-3), `\underline`, `\mathrm`;
  - `\begin{array}` for column addition, subtraction and long division (class 2-5). Without it the engine cannot show the most common vertical arithmetic. Allow `array` only, with a size cap.
  - `\degree` is not guaranteed in KaTeX [U]. Use `^\circ`.
  - ₹ in Mukta: confirm U+20B9 is present in the shipped subset [U].
- **Params missing:** `steps[].blank?: { answer: string; choices?: string[] }`. The text says "fading = blank a step" but the type has no field for it. Add `fx.answer` to the events, with the same fields as E0.8. `size:"numeral"` is undefined; either define it (the font-size per band) or drop it.
- **Events:** only `fx.step`. Add `fx.answer`, `fx.reveal_all`.
- **Safety:** named formulas by id from the kit; numeric check for steps (E0.9).

#### `contrast-pair@1` (M, 2-3 days)
- **BLOCKER-ish dependency:** `PanelRef.snapshot {engine, params}` means mounting two live T1 engines in one 380 dp column. If those are canvas or WebGL engines, two live contexts on a phone drop below 30 fps and double the memory [I]. Require every T1 engine to export `renderStatic(params) → SVG|PNG`, and mount panels as static images, interactive only after the child picks. That is a cross-cutting requirement across the maths and science engine docs, and it is where the cost sits. Add it to those engines' definition of done.
- **Layout:** two panels side by side are 180 dp each. Stack them vertically on phones.
- **Events:** only `answer`. Add `ms`, `confidence` if asked, `reveal_viewed`.

#### `svg-figure@1` and `illustration@1`
- **Runtime (S each):** inline sanitised SVG with `highlight` and `tap` by selector, or an image with overlays. Both are small.
- **Assertion harness (L, 5 days):** about 20 assert kinds as pure functions over `getScreenCTM` geometry, the `dist(#a,#b)` mini-expression parser, a Chromium job, a manifest schema, and failure reports the Forge coder can act on. Plan for the harness to be reused by `geo-construct`.
- **Honest limit:** §1.1 is n = 3 on four trivial figures. Auto-promotion of free SVG with asserts is plausible, but "if the model cannot express a truth as an assert, `sme_required`" will send most real figures (ray diagrams, cross-sections) to a person. Budget for that: the 400 figures at 3 min is an optimistic review figure for a physics SME.
- **Events:** `tap{part}` only. Add `ms`, `attempt`, and a `highlight_done` echo so the teacher knows the pulse finished before it continues.

#### Forge raster pipeline (XL, 8-10 days)
- **I3 palette quantisation:** `culori` gives ΔE2000. Snap-to-palette with a 0.5% area exception is S (1 day). The hue-cluster lint (more than 1% area, at most 6/8/10 hues) is M. It needs a clustering choice that the doc leaves open.
- **I4 skin check is unbuilt and risky.** "Sampled face and arm regions" needs segmentation. With flat illustration art a VLM bounding box and a median colour are feasible, but the boxes are unreliable for arms [U]. Mark it `U: classifier to build` as the doc does for G-VI-1, and plan for the human key to catch it until measured.
- **I2 no-text gate:** a VLM `NONE` is a presence check only (the doc says so). Add a cheap non-model second check: a connected-component and edge-density pass for glyph-like clusters in the safe zones. It costs S and removes a single point of failure.
- **Throughput:** 4 RPM is a real constraint. 3,000 calls at 4 RPM is 12.5 hours of wall time, so jobs need a rate-limited queue with retry and a resume cursor (M). The doc has no queue.

### E2. Corrections to make in the document (summary)

1. Replace the "shipped `ModuleToHost` kinds" sentence in §4.2 with the contract v2 (E0.1) and move `fl.step` etc. to `interaction` names.
2. Add the E0.8 fields to every engine's event table, define `quiz_voice`, and use the existing `stuck` kind.
3. State the iframe, CSP, font and image-transport rules (E0.2) in §4.3, or take the first-party-engines decision.
4. Rewrite the Devanagari wrapping rule: spaces only, DOM-measured, line-height 1.5-1.6 (E0.4).
5. Split D4 into server and device halves (E0.5).
6. Limit `TermRef.text` (E0.6); restrict free-text blanks (E0.7).
7. Fix D0 for `<` `>` in `tex`, extend the KaTeX allowlist (E1 `formula@1`) and add a formula bank with a numeric check (E0.9).
8. `label-diagram@1`: one label column on phones, portrait bases, a `numbered` mode, and a non-crossing matching (E1).
9. `cycle` cap of 6 nodes on 380 dp; drop `radial` and `tree-right` in v1.
10. Require `renderStatic()` from every T1 engine for `contrast-pair@1`.
11. Add the review tool, the queue and the assertion harness to the §9 cost model, and measure edit-input token cost.
12. Add the reduced-motion and flash-rate rule, the 300-node cap, and the transform-and-opacity-only animation rule (E0.3).

### E3. Sources and evidence tags for this review

- **[V]** read in this repo this session: `shared/contracts.ts:155-170`, `src/modules/frame/protocol.ts`, `vite.config.ts` (frame CSP, lines 8-32), `src/modules/host.tsx` (sandbox attribute), `context/decisions.md:133`, `tests/client-runtime.test.mjs:457-460`.
- **[I]** inference from the code and the doc: all device timings, the 160 dp image width (380 dp minus two 110 dp columns), the 700 dp flow height, the frame-per-mount font cost.
- **[M]** from memory, not re-read: WCAG 2.3.1 flash threshold; Chrome 87-88 feature levels for `Intl.Segmenter` and `aspect-ratio`; Unicode 15.1 conjunct grapheme rule in ICU 74; paint cost of SVG filters on low-end GPUs.
- **[U]** not measured, and should be before a build decision: `blob:` image loading from an opaque-origin frame on Android WebView; font CORS from the Capacitor origin; KaTeX `\degree`; Mukta ₹ coverage; I4 skin-region reliability; edit-input token cost.
- No device was available here, so none of the fps statements is measured. M-DI-7 and M-DI-8 should be run on a real 2-3 GB Android before the S/M/L numbers above are treated as commitments.
