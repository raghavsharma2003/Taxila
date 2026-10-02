# Science simulation engines for Taxila (EVS 3-5, Science 6-9)

Date 2026-10-02. Workstream: content / science-engines.
This document builds on `docs/research/tech-and-market.md` §3-4 (the T0/T1/T2 tiers, the ~25-engine recommendation, the sandbox bridge) and on `learning-science.md` (POE §1.6, seductive details, dual coding, concreteness fading). It does not repeat them.
Machine-readable companion: `docs/research/content/science-engine-map.json`. It maps all 210 EVS/science topics to an engine scene or a generic format, and it was generated and checked against `data/curriculum/*.json`.

Evidence tags follow `learning-science.md` §0:
- **[V]** checked this session against the primary text.
- **[S]** checked against a secondary summary or abstract snippet only.
- **[M]** from prior knowledge, not re-checked this session. Check it before it becomes a `context/` entry.
- **[U]** an unverified engineering estimate or local fact. Measure or verify it.

Note on method: the session-wide web-search budget ran out partway through this workstream. Most child-misconception citations below are therefore tagged [M]. They are the standard citations of the field, but each needs a 10-minute check before it goes into marketing or a `context/` entry.

---

## 0. TL;DR

1. **16 hand-built engines plus 2 harnesses cover 120 of the 210 EVS/science topics (57%) as a primary or supporting simulation.** For classes 6-9 the figure is 100/146 (68%).
   - Those 120 topics carry 148 of the curriculum file's 248 listed misconceptions (60%).
   - The other 90 topics are better served by generic formats (sorter, story, map, sequence, label-diagram, microscope, atom-builder) or by human-reviewed content (adolescence, reproduction, disease). Content-format fit beats forcing a simulation onto every topic (learning-science rule 9).
2. **The engine is not the product. The POE harness and the misconception detectors are.**
   - Every engine emits *semantic* state changes (for example `bulb_lit`, `phase=boiling`, `plateau=true`), not raw drags. The voice teacher "sees" the child through these.
   - Each engine declares detectors (JSONLogic rules over its events) that raise `misconception_signal` events keyed to an NCERT-aligned misconception ID. This is the misconception-library moat flagged in learning-science §1.13, built directly into the interactives.
3. **Use guided simulations, not discovery.**
   - High instructional support beat low support on misconception reduction at a 1-year follow-up (Hardy et al. 2006, n=161 3rd graders) **[V]**.
   - Teaching the control-of-variables strategy (CVS): g = 0.61 across 72 studies. Demonstrations raise it (g 0.69 vs 0.48), and so does cognitive conflict (g 0.80 vs 0.53) (Schwichow et al. 2016) **[V]**.
   - Simulations vs no simulation: g = 0.67 (D'Angelo et al. 2014, 33 studies). Enhanced simulations add a further g = 0.43 **[S]**.
4. **Hands-on still matters for some concepts, so every engine declares a "physical twin".**
   - Floating and sinking: g = 0.85 over 69 studies, and **hands-on beat virtual** (Schwichow et al. 2024) **[S]**.
   - For preschool floating/sinking, virtual was better (Pavlou et al. 2024) **[S]**.
   - For beam balances, children with wrong prior beliefs needed physical materials (Zacharia et al. 2012) **[S]**.
   - Each engine therefore names a safe Indian-household experiment that the teacher can ask for, with the simulation making the invisible part visible (particles, current, rays, upthrust).
5. **PhET: borrow design patterns only. Do not embed and do not copy code.**
   - New simulations have been CC BY-NC since 2026-03-29, and PhET says the *entire library* was relicensed. Commercial use "now requires a commercial license and partnership agreement" **[V]**.
   - Historical files were published under CC BY 4.0, with the logo kept and attribution given **[V]**.
   - Simulation repositories are GPL-3.0. The scenery, axon and scenery-phet libraries are MIT **[S]**.
   - Clean-room the engines.
6. **Fix PhET's known modelling gap.** PhET's States of Matter computes temperature from total energy, so "the temperature does not plateau at the phase interfaces" **[V]**. Indian class 6 and 8 boiling and melting lessons need the plateau. `particles@1` therefore runs a macroscopic enthalpy model with latent heat, and the particle view is slaved to it.
7. **Borrow PhET's Voicing taxonomy for the teacher channel.** It has four response kinds: *name*, *object* (state), *context* (what changed), and *hint* **[V]**. Engines expose exactly these as key=value facts, never as sentences. This applies the inherited html-portfolio rule that sentence-shaped prompt text gets recited.
8. **Three representation levels per engine (concreteness fading).** `repr = concrete | bridge | abstract`, for example a matka photo, then a matka with a particle lens, then a pure particle box. There are also three age bands: A = classes 3-5, B = 6-8, C = 9.
9. **Build order, by topic count times misconception load:**
   - first, `motion-lab`, `sky`, `circuits`, `particles` and `optics`, together with both harnesses;
   - then the rest.
   Rough total: about 40 engineer-weeks **[U]**.

---

## 1. Design patterns borrowed from PhET, CK-12, Gizmos and Keeley (patterns, not assets)

| source | pattern | how Taxila uses it |
|---|---|---|
| PhET: implicit scaffolding (Podolefsky, Moore & Perkins) **[S]** | guide "without feeling guided" through scope, object placement, feedback, and sequencing across screens | each engine ships a few **scenes** (Intro → Compare → Lab), not one mega-sim; params not needed for the current objective are hidden (`editable[]`) |
| PhET "Basics" variants | younger-age versions with fewer controls | `band` A/B/C changes the controls, numerals and units shown, not the physics |
| PhET Density: Compare and Mystery screens **[V]** | "same mass / same volume / same density" blocks; identify a mystery material | `float-sink@1` compare mode; "mystery" challenges in several engines |
| PhET CCK: wires with nonzero resistance; ideal meters; household objects with fixed resistances **[V]** | a numerically safe MNA solver; real household test objects | `circuits@1` solver and the conductor tray |
| PhET Geometric Optics: thin-lens equation; mirror f = R/2; flat mirror = huge f; object kept ≥ 40 cm from the optic **[V]** | clamp the geometry to avoid degenerate rays | `optics@1` clamps; virtual and real image classification |
| PhET Sound: speaker in a box with a pressure slider; intensity linear in pressure **[V]** | bell-jar vacuum demonstration | `sound@1` bell-jar scene |
| PhET pH Scale: mixing by H₃O⁺/OH⁻ mole balance **[V]** | neutralisation by drops | `indicator-lab@1` neutralise scene |
| PhET Energy Skate Park: KE + PE + thermal bars; heuristics that keep total energy conserved **[V]** | energy bars beside the motion | `motion-lab@1` swing-energy scene |
| PhET `doc/model.md` per simulation **[V]** | an honest note of simplifications for teachers | every Taxila engine ships `MODEL.md` (simplifications, constants, known lies-to-children) |
| PhET Voicing: name / object / context / hint responses **[V]** | speech for non-visual users | the `facts` + `context` event + `hint` channel to the voice teacher (§2.4) |
| PhET-iO: events typed user/model/wrapper, nested child events for causality, JSON state keyed by ID **[V]** | analytics and replay | `src` and `cause` fields on events; `snapshot()` / `restore()` per engine |
| CK-12 simulations: everyday examples rather than lab models; sliders and responsive graphs **[S]** | context first | Indian concrete scenes (matka, pressure cooker, torch, Marina beach) as the `concrete` representation |
| CK-12 PLIX: one concept, a follow-up question with hints, an open discussion question **[S]** | micro-interactive | each POE hook is one concept, with a hint ladder |
| Gizmos exploration sheet: vocabulary, prior-knowledge questions, warm-up, activities, assessment questions **[S]**; Gizmos Investigations (2025): phenomenon-driven guided sensemaking for grades 6-8 **[S]** | lesson arc around a simulation | lesson planner arc: hook phenomenon → prior-knowledge probe → warm-up (learn the controls) → POE or CVS activity → transfer question |
| Keeley *Uncovering Student Ideas* probes: "justified list" (tick every true property, then explain) and "friendly talk" **[V, vol. 3 sample]** | elicit macro-vs-micro confusions (for example "atoms are shiny or cold") | POE `capture.mode = "multi"` (tick all that apply) plus a spoken "why" |

**What not to copy.**
- PhET's free-play-first stance is not right for a voice tutor. It is a desktop pattern for older students.
- The Hardy (2006) and CVS evidence says that classes 3-5 need structure.
- Taxila's teacher supplies the structure in speech, so the simulation itself can stay uncluttered.

---

## 2. Shared engine contract (TypeScript)

Every engine is a T0 bundle served from the sandbox origin (tech-and-market §3.4). The LLM fills only the T1 spec, which is validated by the engine's zod schema and then exported to JSON Schema for structured output.

### 2.1 Manifest

```ts
export type Band = "A" | "B" | "C";                  // A: classes 3-5, B: 6-8, C: 9
export type Repr = "concrete" | "bridge" | "abstract"; // concreteness fading
export type L10n = { en: string; hi: string; "hi-Latn"?: string };
export type Prim = string | number | boolean;

export interface EngineManifest<P extends object> {
  id: `${string}@${number}`;                 // "circuits@1"; params additive within a major version
  title: L10n;
  scenes: Record<string, SceneSpec<P>>;      // presets; T1 picks scene + overrides
  paramSchema: object;                       // JSON Schema generated from zod
  editable: Record<Band, (keyof P)[]>;       // which params the CHILD may touch per band
  facts: FactSpec[];                         // <= 12 keys; queryable at any time (2.4)
  events: Record<string, EventSpec>;         // engine-namespaced, e.g. "circuit.bulb_state"
  misconceptions: MisconceptionSpec[];       // 2.5
  poe: PoeHook<P>[];                         // 3.1
  physicalTwin: PhysicalTwin[];
  safety: string[];                          // invariants; tested in golden tests
  perf: { maxBodies: number; fpsCap: 30 | 60; lowEnd: Partial<P> }; // low-end Android preset
  glossary: Record<string, L10n>;            // NCERT terms; hi verified vs Hindi edition [U]
}
export interface SceneSpec<P> { title: L10n; defaults: Partial<P>; bands: Band[]; topicIds: string[]; repr: Repr[] }
export interface FactSpec { key: string; type: "num" | "bool" | "enum"; unit?: string; values?: string[] }
export interface PhysicalTwin { id: string; materials: L10n; minBand: Band; adultNeeded: boolean; what: L10n }
```

Common params that every engine accepts: `scene`, `band`, `repr`, `lang`, `showLabels`, `seed`, `timeScale`, `poe` (a hook ID to start), and `goals[]`.

Goals use the existing `goals` format (tech-and-market §3.2), extended so that checks can read facts as well as params:

```ts
{ id: "g1", check: { fact: "bulbs_lit", op: ">=", value: 2 } }
```

### 2.2 Events (extends `ModuleEvent` v1 from tech-and-market §3.4; v1 consumers ignore the new fields)

```ts
type ModuleEventV2 = {
  v: 2; kind: "taxila:event"; module_id: string; nonce: string;
  seq: number;                 // monotonic per mount
  cause?: number;              // seq of the parent event (PhET-iO-style causality)
  src: "user" | "model" | "harness";
  event: string;               // e.g. "particles.phase_change", "poe.predicted", "mc.signal"
  payload: Record<string, Prim>;  // flat, as in v1
  salience: 0 | 1 | 2;         // 0 log only; 1 fold into the next debounced observation; 2 milestone
  t_ms: number;
};
```

**Salience maps to the §1.7 observation rules.**
- **2** marks milestones: a prediction committed, a reveal, a goal met, `mc.signal` at weight ≥ 0.6, a safety event such as a short circuit, or 20 s idle.
  - The host requests a teacher response only for salience 2, and only when the child is not speaking.
  - Rate limit: one salience-2 response per 4 s **[U]**.
- **1** marks state transitions. The host debounces these every 1.5-3 s into one bracketed key=value line.
- **0** marks raw drags and frames. These are logged for replay and analytics only and never reach the model.

### 2.3 Host commands (extends `HostCmd.cmd` from tech-and-market §3.4)

New commands:
- `"set_scene"`
- `"start_poe"`, with args `{poe}`
- `"reveal"`
- `"ghost"`: overlays the child's prediction on the outcome
- `"freeze"`
- `"snapshot"`
- `"restore"`
- `"focus"`: highlights an object for the teacher's deixis ("yeh wala bulb dekho")

The realtime model's tool set stays as in §1.7. `show_module(engine, params, goal_id)` carries `scene`, `band`, `repr` and `poe` inside `params`, and `set_module_param` moves sliders. One new tool is proposed:
- `module_cmd(module_id, cmd, args)` covers reveal, ghost and focus.

### 2.4 What the teacher "sees": facts, not prose

`getFacts()` returns at most 12 keys. The host serialises them as one line:

```
[module m_3 particles] scene=boil T_C=100 phase=boiling plateau=true bubbles=vapour pred=air match=false
```

Never pass sentence templates to the teacher. html-portfolio measured that sentence-shaped prompt text gets recited (4/5 recited → 0 after removal). Facts are data, and the voice model phrases them itself in Hinglish.

Voicing categories map onto this channel as follows:
- **name** = the object ID;
- **object** = the facts;
- **context** = a salience-1 transition event;
- **hint** = the next step on the engine's hint ladder (`hints[]` per goal, released only by `reveal_hint`).

### 2.5 Misconception detectors

```ts
export interface MisconceptionSpec {
  id: string;                     // "mc.elec.unipolar" (global namespace shared with the item bank)
  label: L10n;                    // dashboard noun phrase, never spoken verbatim
  sources: string[];              // citation keys (Sources section)
  curriculumRefs: string[];       // topic ids whose misconception text this is
  detectors: Detector[];
  remediation: { poe?: string; contrast?: string; scene?: string };
}
type Detector =
  | { kind: "prediction"; poe: string; option: string; weight: number }  // chose the distractor
  | { kind: "pattern"; rule: object /* JSONLogic over the event window */; weight: number }
  | { kind: "utterance"; cues: L10n[]; weight: number };                // run by the text model on the child's explanation
```

- **Detectors are evidence, not verdicts.** The knowledge layer (learning-science §8) marks a misconception "likely" only after at least 2 independent signals, for example a prediction plus an explanation utterance, or two different POEs.
- Signals feed the knowledge-tracing state. They are never shown to parents as a diagnosis.
- JSONLogic is used because rules are serialisable, sandbox-safe and LLM-authorable for T2. Rules are evaluated over a 30-event sliding window.

### 2.6 Rendering, performance and i18n

- **Rendering.** Canvas2D for particles, rays and fields; SVG for diagrams and labels.
  - No WebGL is required. three.js is used only for `sky@1`'s optional 3D view, with a 2D top-down fallback.
- **Low-end budget.** Target: Android WebView, 3 GB RAM, Mali-class GPU, 30 fps cap, frame time ≤ 8 ms **[U, measure on a ₹8-10k phone]**.
  - Pause on `visibilitychange`.
  - Cap devicePixelRatio at 2.
- **Physics.** Fixed `dt` (1/120 s, sub-stepped) with deterministic seeds, so a `snapshot` replays identically. Golden tests rely on this.
- **Labels.**
  - Labels are bilingual: technical English plus Hindi on toggle, because CBSE English-medium exams use English terms.
  - Devanagari uses a bundled Noto Sans Devanagari subset.
  - Numerals: Western digits in all bands **[U, check against the Hindi-medium book convention]**.
- **Concrete scenes.** Illustrations (matka, kitchen, Marina beach) are pre-generated offline with gpt-image-2 and served as sprites. Labels are SVG overlays, never baked in (tech-and-market §4 rule).
- **No decorative motion or sound.** Celebrations are a quiet tick only (seductive-details rule). The "game" is the phenomenon itself.

---

## 3. Cross-cutting harnesses

### 3.1 `poe-harness@1`: predict, observe, explain

State machine:

`setup → ask → capture (engine locked) → confidence? → reveal → ghost (prediction vs outcome side by side) → explain (voice) → resolve (mandatory) → transfer?`

```ts
export interface PoeHook<P> {
  id: string; scene: string; setup: Partial<P>; bands: Band[];
  ask: L10n;                                  // on-screen caption (short); the teacher phrases it aloud from `intent`
  intent: string;                             // e.g. "predict bubble contents" — key-phrase, not a line
  capture:
    | { mode: "choice" | "multi"; options: { id: string; label: L10n; icon: string; mc?: string }[] }
    | { mode: "slider"; min: number; max: number; unit: string; mcIf?: { op: "<" | ">"; value: number; mc: string }[] }
    | { mode: "draw"; target: "ray" | "shadow" | "graph" | "path" | "level" }  // scored by error vs truth
    | { mode: "voice" };                      // free answer, classified by the text model
  lock: true;                                 // play/run disabled until the prediction is committed
  reveal: { cmd: string; args?: Record<string, unknown> }[];
  observe: string[];                          // fact keys to read after reveal
  resolve: { keyIdea: L10n };                 // the teacher MUST close the loop (learning-science §1.6)
  transfer?: { setup: Partial<P>; ask: L10n };
}
```

Harness events (all salience 2 except `explained`):
- `poe.predicted {option|value|draw_err, latency_ms, confidence}`
- `poe.revealed`
- `poe.matched {bool}`
- `poe.explained {chars}`
- `poe.resolved`

Rules from the evidence:
- **Band A and low-executive-function children.** The prediction is a probe. The teacher resolves the conflict explicitly (Brod et al. 2020; learning-science §1.6).
- **After 2 consecutive wrong POEs in one session**, switch to a worked demonstration rather than a third surprise.
- **Pictorial options are always offered alongside voice capture.** Child ASR is unreliable (learning-science §1.10), and a tap is clean evidence.

### 3.2 `investigation-harness@1`: fair tests (CVS)

- **What it wraps.** Any engine that exposes numeric or enum params. The harness reads `paramSchema` and lets the child assign roles: changed (independent), measured (dependent), kept-same (control).
- **Trials.** It adds a trial table, repeats (n), engine-seeded noise, a mean, and an auto-graph: a bar chart for a categorical variable, a line for a continuous one.
- **Topics.** Used for `c6-ch01-t02`, `c8-ch01-t01/t02` and `c6-ch10-t02` (germination), and as a mode in pendulum, evaporation, electromagnet and solubility.
- **Events.**
  - `cvs.trial {changed: "L", n}`
  - `cvs.confounded {vars: "L,mass"}` (salience 2): more than one variable changed between the compared trials
  - `cvs.conclusion {claim, supported}`
  - `cvs.single_trial_claim`: a claim made from n = 1 (curriculum: "one experiment is enough")
- **Modes** (from the CVS moderators **[V]**):
  - `demo`: the teacher runs a confounded and an unconfounded comparison and asks "can we tell?";
  - `conflict`: the child's own confounded design yields an ambiguous result;
  - `guided`: explicit instruction first. Klahr & Nigam 2004 found direct instruction beat discovery for CVS in grades 3-4 **[M]**.

---

## 4. Engine specifications

Format per engine: topics → model → params → interactions, events and facts → misconceptions (ID, source, detector) → POE hooks → physical twin and safety.
- Topic IDs are abbreviated, so `c6-ch08-t01` means `c6-science-ch08-t01`.
- The full list is in the JSON map.
- "(cur)" marks a misconception that appears in our curriculum file.

### E1 `particles@1`: particle model of matter (states, change of state, evaporation, diffusion)

**Topics.** c6-ch08-t01/t02/t03, c8-ch07-t01/t02. Also supports c7-ch05-t01 (physical change) and c8-ch09-t01 (dissolving inset).

**Model.**
- A macroscopic controller integrates enthalpy H under heat input Q.
  - Temperature follows c_p in single phases.
  - Temperature is **held at the melting or boiling point while latent heat accrues**.
  - This fixes PhET's no-plateau limitation **[V]**.
- A 2D micro view is slaved to it: 20-150 soft discs.
  - Solid: harmonic lattice that vibrates about fixed sites.
  - Liquid: weak short-range attraction.
  - Gas: free flight with elastic walls.
  - Mean speed ∝ √T (in K).
  - The phase mix comes from the latent-heat fraction.
- Boiling point vs pressure uses a two-point Clausius-Clapeyron fit: 100 °C at 1 atm, about 120 °C at 2 atm (the pressure-cooker hook).
- Evaporation below boiling: rate E = k·A·(p_sat(T) − RH·p_sat(T_amb))·(1 + w·wind).
- Matka: seepage plus evaporation, which gives T_water < T_amb at steady state.

```ts
interface ParticlesParams {
  scene: "states" | "boil" | "evap-condense" | "matka" | "diffusion" | "expansion";
  substance: "water" | "wax" | "ghee" | "camphor" | "air";   // camphor sublimes (c9 link)
  heat_W: number;            // -200..200, stove (+) or ice bath (-)
  pressure_atm: number;      // 0.5..2, lid or pressure cooker
  container: "open" | "lid" | "sealed" | "balloon" | "syringe";
  particles: number;         // 20..150 (lowEnd 40)
  view: "macro" | "lens" | "split" | "micro";                // lens = draggable magnifier (bridge)
  ambient_C: number; humidity: number; wind: 0 | 1 | 2; surface_cm2: number;
  showThermometer: boolean; showSpeedColour: boolean; trackOne: boolean;
}
```

**Interactions, events and facts.**
- Interactions: heat slider; drag the magnifier lens over the pot, glass or balloon; tap to track one particle; add or remove the lid; syringe compress; place a cold glass; toggle food colour.
- Events:
  - `phase_change {from, to, T}` (salience 1)
  - `plateau {on, T}` (salience 1)
  - `droplets_formed {outside: true, colour: false}` (salience 2)
  - `particle_tracked`
  - `lens_over {target}`
- Facts: `T_C`, `phase`, `plateau`, `bubbles` (vapour), `mean_speed`, `gap_contents` (always "nothing"), `mass_g` (constant in sealed containers), `evap_rate`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.part.expand | particles get bigger or melt when heated (cur) | Kind 2004 **[S via Keeley]**; Driver et al. 1994 **[M]** | multi-select option "particles grow" in poe.heat |
| mc.part.stuff-between | air or "something" fills the gaps (cur) | Novick & Nussbaum 1978, 1981 **[M]** | choice "air" for gap contents |
| mc.part.solid-still | particles in a solid do not move (cur) | Driver et al. 1994 **[M]** | prediction of a static lattice |
| mc.part.gas-massless | gases weigh nothing (cur) | Séré 1985 **[S, chapter]** | slider: predicted mass of the sealed balloon after heating < actual |
| mc.state.bubbles-air | bubbles in boiling water are air (cur) | Osborne & Cosgrove 1983 **[M]** | poe.bubbles choice |
| mc.state.glass-leak | droplets leak through the glass (cur) | Osborne & Cosgrove 1983 **[M]** | poe.coldglass "coloured" |
| mc.state.evap-boil-only | evaporation needs boiling (cur) | Bar & Galili 1994 **[M]** | poe.clothes "no drying in the shade" |
| mc.state.matka-cold-clay | the clay is cold (cur) | (cur) | poe.matka explanation cue "mitti thandi" |
| mc.part.macro-to-micro | atoms are shiny, hard or cold | Keeley vol. 3 "Pennies" **[V]** | multi-select of macroscopic properties |

**POE hooks.**
- `bubbles`: pressure cooker. "What is inside the bubbles?" Options: air / nothing / water vapour / oxygen. Reveal: lens on a bubble.
- `plateau`: slider. "Temperature after 5 more minutes of boiling?" Reveal: the plateau line.
- `coldglass`: ice and coloured water. "Will the outside drops be coloured?"
- `heat` (multi-select): "When heated, each particle...": gets bigger / moves faster / melts / spreads out.
- `matka`: matka vs steel lota after 2 h in the sun. Which is colder? Reveal: an evaporation arrow field.

**Physical twin and safety.**
- Steel glass with ice, with food colour inside (twin minBand A).
- Wet hanky in sun vs shade.
- Agarbatti diffusion: band B, adult needed.
- Safety: no stove, boiling or steam twins without an adult; never a sealed container on heat.

### E2 `circuits@1`: circuits, conductors, electromagnet, heating effect, lemon cell

**Topics.** c7-ch03-t01/t02/t03, c8-ch04-t01/t02/t03. Also supports c7-ch04-t01, c9-ch09-t02 (salt vs sugar water) and c5-ch07-t02.

**Model.**
- Modified nodal analysis (as PhET CCK **[V]**), re-solved only when the topology or a value changes.
  - Minimum wire resistance 1e-4 Ω; cell internal resistance 0.1 Ω.
  - Bulb: 2.5 V torch bulb, ohmic in bands A and B; band C may enable a filament curve.
  - Brightness = clamp(P/P_rated).
  - LED: forward voltage 1.8 V (red), 3.0 V (white), no conduction in reverse.
- Household test objects. Resistances are lesson-tuned, after PhET's table **[V]**, and listed in MODEL.md:
  - Conductors: steel spoon, ₹ coin, safety pin, key, aluminium foil, pencil graphite.
  - Insulators: eraser, plastic scale, wood, rubber band, glass bangle, dry cloth.
  - Solutions: salt water (conducts: bulb dim, LED bright), tap water (bulb off, LED faint), sugar and distilled water (off).
- Electromagnet: pins lifted = floor(k·N·I·μ_core), saturating. Core: none, iron nail, aluminium, or wood.
- Heating: the wire is in series with a load, at fixed current.
  - Heating per length ∝ I²·ρ/A, so **thinner and nichrome get hotter**.
  - A fuse melts at I > I_rated.
  - The fixed-current framing is deliberate: the "thicker heats more" misconception is only wrong in that framing, and MODEL.md says so.
- Lemon cell: Cu-Zn 0.9 V per lemon, high internal resistance. One lemon lights nothing; 2-3 in series light a red LED.

```ts
interface CircuitsParams {
  scene: "build" | "diagram" | "conductor-test" | "electromagnet" | "heating" | "lemon-cell" | "energy-meter";
  tray: ("cell" | "bulb" | "switch" | "wire" | "led" | "fuse" | "resistor" | "ammeter" | "compass")[];
  cells: number;                 // 1..4 in series
  currentView: "off" | "dots" | "dots+arrow"; flow: "conventional" | "electron";  // electron: band C only
  symbols: "pictures" | "symbols" | "both";   // concreteness fading for c7-ch03-t02
  coilTurns: number; core: "none" | "iron" | "aluminium" | "wood";
  wire: { material: "copper" | "nichrome"; thickness_mm: number };
  lemons: number; electrodes: "cu-zn" | "cu-fe" | "zn-zn";
  testItem?: string;             // conductor-test tray item id
}
```

**Interactions, events and facts.**
- Interactions:
  - drag components from the tray; terminals snap within 24 px;
  - tap a switch to toggle it;
  - drop an ammeter probe anywhere in a loop;
  - drop a test item into the gap;
  - toggle the pictures↔symbols morph;
  - drag pins to the electromagnet.
- Events:
  - `circuit_changed {closed, loops, n_wires_to_bulb}` (salience 1)
  - `bulb_state {id, lit, brightness}` (salience 1)
  - `short_circuit` (salience 2, plus a warm-cell warning and no flames)
  - `ammeter_read {where: "before"|"after", I}`
  - `item_tested {item, conducts}` (salience 1)
  - `pins_lifted {n}`
  - `fuse_blown`
  - `led_reversed`
- Facts: `closed`, `bulbs_lit`, `I_A` (band C), `same_current_everywhere` (true in series), `short`, `pins`, `led_on`, `lemons`, `last_item`, `last_item_conducts`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.elec.unipolar | one wire from the cell to the bulb is enough (cur) | Osborne 1983 **[S]**; Keeley "Batteries, Bulbs, and Wires" **[S]** | poe.onewire choice; pattern: child builds a 1-wire circuit and then taps "glow?" |
| mc.elec.clashing | current flows out of both terminals and meets at the bulb | Osborne 1983 **[S]**; Shipstone 1984 **[S]** | choice of arrow-pattern option |
| mc.elec.attenuation | the bulb uses up current, so less returns (cur) | Shipstone 1984 **[S]** | slider: predicted ammeter "after" < "before" |
| mc.elec.sequential | the first bulb in series is brighter | Shipstone 1984 **[S]** | poe.series choice "first brighter" |
| mc.elec.switch-makes | the switch makes electricity (cur) | (cur) | utterance cue |
| mc.elec.battery-tank | a battery stores current like a tank (cur) | Cohen, Eylon & Ganiel 1983 **[M]** | poe.lemon slider; utterance cues |
| mc.elec.water-body-insulate | water and the body never conduct (cur) | (cur) | item_tested prediction for tap water |
| mc.em.coil-always-magnet | a coil is a magnet without current (cur) | (cur) | poe.coil-off choice |
| mc.heat.thick-hotter | thicker wires heat more (cur) | (cur) | poe.fuse choice |

**POE hooks.**
- `onewire`: four pictorial configurations. "Which ones light?" This is a Keeley-style probe.
- `ammeter`: before vs after the bulb (slider).
- `series`: add a second bulb. Same / dimmer / brighter, and which one is brighter?
- `graphite`: will a pencil lead light the bulb?
- `coil-double`: double the turns, how many pins?
- `lemon`: how many lemons will light the LED?

**Physical twin and safety.**
- Twin: torch cell + torch bulb + wire, or open up a torch (c7 hook); LED + coin cell.
- **Safety invariant (golden-tested): no twin, hint or teacher line ever involves mains sockets, switchboards, or wet-hand experiments.** `short_circuit` always produces the "cell gets hot, unplug" rule.

### E3 `magnets@1`: magnetic materials, poles, fields, compass, Earth's field

**Topics.** c6-ch04-t01/t02/t03. Also supports c8-ch04-t01 (the electromagnet field view) and c8-ch13-t01 (Earth's field).

**Model.**
- 2D magnetic field from bar, horseshoe and ring magnets, each modelled as a pair of monopoles ±q at the pole faces (good enough qualitatively).
- Field lines are integrated with RK4 from seeds at the poles. Iron filings are 400 short segments aligned to B (lowEnd 150).
- Compass needles are damped rotors. A uniform Earth-field term can be toggled.
- Magnet-magnet forces use pole-pole inverse-square terms, with damping, on a table or floating on a cork.
- **Cutting a magnet always yields two dipoles.**
- Materials: iron nail, steel pin, needle (magnetic); aluminium, copper, brass, plastic, wood, paper (not).
  - "Steel tumbler" and "coin" are **flagged [U]**: Indian kitchen stainless steel is often a non-magnetic austenitic grade, and coin behaviour varies by series. Verify each object with a real magnet before shipping.
- Making a needle compass: strokes ≥ 30 in one direction magnetise the needle; it then floats on a leaf in a bowl and turns to N-S.

```ts
interface MagnetsParams {
  scene: "test-tray" | "poles" | "field" | "compass" | "cut" | "strength" | "earth";
  magnets: { type: "bar" | "horseshoe" | "ring"; strength: number /*0.2..2*/; x: number; y: number; angle: number }[];
  fieldView: "off" | "compasses" | "filings" | "lines";
  earthField: boolean; barrier?: "paper" | "cloth" | "wood" | "steel-sheet";
  items: string[];               // test-tray objects
}
```

**Interactions, events and facts.**
- Interactions: drag and rotate magnets; drop objects onto the tray; cut tool; hang the magnet on a thread; stroke a needle; slide a barrier between magnet and pin.
- Events:
  - `item_tested {item, attracted}` (salience 1)
  - `pole_interaction {pair: "N-N"|"N-S"|"S-S", result}` (salience 1)
  - `magnet_cut {pieces, each_has_two_poles: true}` (salience 2)
  - `compass_settled {heading_deg}`
  - `pins_count {magnet, n}`
- Facts: `last_item`, `attracted`, `interaction`, `pieces`, `heading`, `pins`, `barrier`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.mag.all-metals | magnets attract all metals (cur) | Barrow 1987 **[M]** | tray prediction "aluminium sticks" |
| mc.mag.bigger-stronger | a bigger magnet is stronger (cur) | Hickey & Schibeci 1999 **[M]** | poe.strength choice |
| mc.mag.split-poles | breaking a magnet separates N and S (cur) | (cur) | poe.cut choice |
| mc.mag.north-cold | the compass points to the North Pole because it is cold (cur) | (cur) | utterance cue |
| mc.mag.no-through | magnetism cannot act through paper or cloth | Barrow 1987 **[M]** | poe.barrier choice |
| mc.mag.middle-strongest | attraction is strongest in the middle of a bar magnet | Barrow 1987 **[M]** | poe.filings draw-where-most |

**POE hooks.**
- `cut`: what does each piece have?
- `strength`: a big weak magnet vs a small strong one, counting pins.
- `barrier`: notebook page between magnet and pin.
- `filings`: tap where the most filings will gather.
- `tray`: sort 8 kitchen items before testing them.

**Physical twin.** Fridge magnet + pins + a kitchen hunt (c6 hook); a needle compass in a bowl.

### E4 `optics@1`: sources, materials, shadows, plane and spherical mirrors, lenses, pinhole, vision

**Topics.** c3-ch10-t02, c7-ch11-t01/t02/t03/t04, c8-ch10-t01/t02. Also supports c9-ch05-t03 (Tyndall beam, shared with mixtures).

**Model.**
- 2D ray tracer with up to 64 rays (lowEnd 24) from point, extended or parallel (Sun) sources.
- Segments have a material:
  - opaque: absorbs;
  - translucent: transmits 30% with diffuse scatter;
  - transparent: transmits;
  - plane mirror: specular.
- Spherical mirrors and thin lenses are paraxial. Image position from the thin-lens equation; mirror f = R/2 (PhET conventions **[V]**). Object clamped to ≥ 2 cm from the optic and to finite heights.
- Shadows are computed regions (umbra and penumbra for an extended source). **The shadow is drawn as an absence of light on the screen, never as an object.**
- An `eye` object counts as "seeing" X only if a ray from X (direct or reflected) enters the pupil. Vision is made explicit.
- Pinhole: an inverted image; sharpness falls as the hole widens.
- Periscope: two 45° mirrors.

```ts
interface OpticsParams {
  scene: "materials" | "shadows" | "plane-mirror" | "pinhole" | "periscope" | "spherical-mirror" | "lens" | "vision";
  source: { kind: "point" | "extended" | "sun"; x: number; y: number; size_cm?: number; colour?: "white" | "red" };
  objects: { shape: "ball" | "hand" | "card" | "letters"; material: "opaque" | "translucent" | "transparent"; colour?: string; x: number; y: number }[];
  screen_x: number; mirror?: "plane" | "concave" | "convex"; lens?: "convex" | "concave";
  focal_cm: number; object_cm: number; pinhole_mm: number;
  rays: "none" | "few" | "principal" | "many"; showNormal: boolean; protractor: boolean; eye?: { x: number; y: number };
  text?: string;                 // lateral inversion ("AMBULANCE")
}
```

**Interactions, events and facts.**
- Interactions: drag source, object, screen and eye; rotate the mirror; draw a predicted ray or shadow outline (ghosted); a protractor that snaps to the normal.
- Events:
  - `shadow_changed {size_ratio, sharp}` (salience 1)
  - `eye_sees {object, via: "direct"|"mirror"}` (salience 1)
  - `angle_measured {i, r, from: "normal"|"surface"}` (salience 2 if `from` is surface)
  - `image_formed {real, inverted, m}` (salience 1)
  - `prediction_drawn {kind, err_px}`
- Facts: `shadow_size_ratio`, `penumbra`, `sees`, `i_deg`, `r_deg`, `image_real`, `image_inverted`, `magnification`, `image_behind_mirror_cm`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.light.shadow-substance | a shadow is darkness that comes out of the object, or a reflection (cur) | Feher & Rice 1988 **[M]** | utterance cue; draw: shadow placed toward the source |
| mc.light.shadow-colour | the shadow has the object's colour (cur) | (cur) | poe.redball choice |
| mc.light.moon-source | the Moon is a source of light (cur) | (cur) | sort of luminous vs non-luminous |
| mc.light.vision-active | we see without light entering the eye; light "fills" a room | Guesne 1985 **[S, chapter]** | poe.dark-room choice; pattern: eye-ray arrows drawn eye→object |
| mc.light.image-on-surface | the image is on the mirror surface (cur) | Goldberg & McDermott 1986 **[M]** | draw: image placed at the mirror |
| mc.light.angle-surface | angles are measured from the surface (cur) | (cur) | `angle_measured.from = surface` |
| mc.light.pinhole-upright | the pinhole image is upright (cur) | (cur) | poe.pinhole choice |
| mc.light.only-glass | only glass is transparent (c3, cur) | (cur) | tray sort |

**POE hooks.**
- `torch-closer`: a hand shadow on the wall; the torch moves closer. Bigger / smaller / same?
- `redball`: the colour of a red ball's shadow.
- `dark-room`: in a totally dark room, can you see your hand?
- `see-in-mirror`: draw where you must stand to see the ball.
- `pinhole`: upright or inverted?
- `rearview`: a convex mirror makes the image bigger / smaller / same?

**Physical twin and safety.**
- Twin: torch shadow puppets; a shoebox pinhole camera; writing AMBULANCE in front of a mirror.
- Safety: never look at the Sun, even through a pinhole (golden-tested phrasing rule); no lens-burning twins below band C, and only with an adult.

### E5 `plant-lab@1`: germination, photosynthesis inputs, gas exchange, transport, starch test

**Topics.** c6-ch10-t02, c7-ch10-t01/t02/t03, c5-ch01-t02. Also supports c3-ch04-t01 and c8-ch13-t03 (cuttings).

**Model.**
- Daily time-lapse: 1 simulated day = 3 s.
- Gross photosynthesis P = P_max·f_L(L)·f_C(CO₂)·f_T(T)·f_W(water).
  - f_L and f_C saturate (Michaelis-Menten).
  - f_T is a bell curve with optimum about 25-30 °C.
  - Limiting factors are made visible as a "bottleneck bar".
- **Respiration R runs day and night**, so net O₂ release = P − R. It goes negative in the dark.
- Biomass is tracked as carbon from the air. A van Helmont mass ledger shows tree +74 kg, soil −57 g over 5 years **[M, historical figures]**, and asks "where from?"
- Stomata open with light and water and close under water stress. Gas arrows reverse at night.
- Xylem dye front speed ∝ transpiration, which rises with wind, light and low humidity.
- Starch test: iodine turns blue-black only where light reached during the last N days. A black-paper strip makes the pattern.
- Germination: requires water, O₂ and 15-35 °C. **Soil and light are not required.** Each jar is a CVS trial in the investigation harness.

```ts
interface PlantParams {
  scene: "germination" | "photosynthesis" | "leaf-gas" | "transport" | "starch-test" | "vanhelmont";
  plant: "moong" | "tulsi" | "hydrilla" | "money-plant" | "white-flower";
  light: number /*0..100 %*/; co2_ppm: number /*0..1000*/; temp_C: number /*5..45*/; water: number /*0..1*/;
  dayNight: boolean; days: number; coverFraction: number; wind: 0 | 1 | 2;
  jars?: { water: boolean; air: boolean; temp: "fridge" | "room" | "warm"; soil: boolean; light: boolean }[]; // up to 6
  show: { bubbles: boolean; gasArrows: boolean; massLedger: boolean; bottleneck: boolean };
}
```

**Interactions, events and facts.**
- Interactions: sliders; cover a leaf with black paper; apply iodine; set up jars; run days; count bubbles with a tap counter (the child counts while the engine also counts).
- Events:
  - `germinated {jar, conditions}` (salience 1)
  - `bubble_rate {per_min}` (salience 1)
  - `starch_result {covered: false, positive: true}`
  - `wilted`
  - `net_o2_negative {night: true}` (salience 2 the first time)
  - `ledger_viewed`
- Facts: `net_o2`, `respiring` (always true), `limiting`, `bubbles_per_min`, `stomata_open`, `soil_mass_change_g`, `biomass_change_kg`, `jars_sprouted`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.plant.food-from-soil | plants get food from the soil (cur) | Wandersee 1983 **[M]**; Simpson & Arnold 1982 **[M]** | poe.vanhelmont slider (predicted soil loss ≫ 0.1 kg) |
| mc.plant.no-respire / night-only | plants respire only at night, or not at all (cur) | Haslam & Treagust 1987 **[M]**; Keeley "Respiration" probe **[S]** | poe.night choice |
| mc.plant.co2-only | plants take in only CO₂, never O₂ (cur) | (cur) | leaf-gas arrow-drawing prediction |
| mc.germ.soil-light | seeds need soil and light to germinate (cur) | (cur) | jar predictions |
| mc.plant.water-down | water moves down from leaves to roots (cur) | (cur) | draw: arrow direction |
| mc.plant.drink-leaves | plants drink through their leaves (c5, cur) | (cur) | poe.wilt choice |
| mc.plant.seed-not-alive | seeds are not alive (c6, cur) | (cur) | link to the generic sorter |

**POE hooks.**
- `vanhelmont`: how much soil disappears in 5 years? (slider)
- `night`: a Hydrilla in the dark; will the bubbles stop, and is it still breathing?
- `covered-leaf`: where will iodine turn blue-black?
- `jars`: which of 6 moong jars sprout?
- `dye`: will a fan make the colour climb faster?

**Physical twin.** Moong in a wet cloth for 2 days (band A); a white flower in coloured water; a leaf half-covered for 3 days (the starch test needs an adult for hot alcohol, so twin it at band C only, with an adult).

### E6 `ecosystem@1`: food chains and webs, interdependence, decomposers, population effects

**Topics.** c3-ch05-t01/t02, c3-ch06-t01, c4-ch03-t02, c6-ch02-t04, c8-ch12-t01/t02. Also supports c8-ch13-t02.

**Model.**
- A typed graph (producer, herbivore, carnivore, omnivore, scavenger, decomposer, pollinator).
- Population ODEs:
  - producers are logistic, with carrying capacity limited by a soil nutrient pool;
  - consumers use a Holling type II functional response;
  - decomposers return nutrients from dead biomass.
  - Up to 12 species, integrated with RK4 at 1 step per simulated week.
- An energy pyramid shows about 10% transfer per level **[M]**.
- Indian scenes:
  - pond: algae, Hydrilla, zooplankton, small fish, frog, kingfisher, bacteria;
  - paddy/mustard farm: grasshopper, frog, snake, eagle, bees pollinating mustard;
  - forest: grass, deer, tiger, vulture;
  - village vulture case: Gyps vultures crashed by more than 95% after diclofenac in cattle carcasses, and carcasses and feral dogs increased (Green et al. 2004 **[M]**). This is the c6-ch02-t04 hook.
- Perturbations: remove or add a species, drought, pesticide (band C, optional).

```ts
interface EcoParams {
  scene: "tree-survey" | "soil-life" | "depend" | "farm-chain" | "farm-web" | "pond" | "vulture";
  species: { id: string; role: string; n0: number }[]; links?: [string, string][];  // [eaten, eater]
  arrowMeaning: "energy" ;      // fixed: arrow points to the eater (energy flow)
  mode: "build" | "run" | "perturb" | "pyramid"; weeks: number; showGraph: boolean;
}
```

**Interactions, events and facts.**
- Interactions: drag organism cards; draw arrows; run or pause; remove a species (tap and hold); read the population graph; a tally counter for the "count creatures on one neem tree" survey (c3 hook).
- Events:
  - `arrow_drawn {from, to, direction_ok}` (salience 1; salience 2 on a repeated wrong direction)
  - `chain_complete {length}`
  - `species_removed {id}` (salience 2)
  - `population_change {id, pct}` (salience 1 when |pct| > 30)
  - `web_validated {errors}`
- Facts: `chain_len`, `wrong_arrows`, `removed`, `biggest_change_species`, `biggest_change_pct`, `indirect_effects` (count of species changed that are not adjacent to the removed one), `decomposers_present`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.eco.arrow-eats | arrows point to the eater's food (cur) | Griffiths & Grant 1985 **[M]** | `arrow_drawn.direction_ok = false` twice |
| mc.eco.no-ripple | removing one organism affects nothing, or only its direct neighbours (cur) | Griffiths & Grant 1985 **[M]**; AAAS: 84% know the predator effect **[S]** | poe.remove-frog predictions on non-adjacent species |
| mc.eco.big-important | only big animals matter (c4, cur) | (cur) | poe.bees choice |
| mc.eco.no-decomposers | decomposers are omitted, or nutrients just vanish | Driver et al. 1994 **[M]** | web built without decomposers when asked "complete" |
| mc.eco.predators-more | there are more predators than prey | Driver et al. 1994 **[M]** | poe.pyramid slider |

**POE hooks.**
- `remove-frog`: predict grasshoppers, snakes and paddy (up, down or same for each).
- `vulture`: vultures vanish. What happens to carcasses and dogs?
- `bees`: no bees in the mustard field. What happens to the mustard?
- `pyramid`: snakes vs grasshoppers, which is more numerous?

**Physical twin.** The 10-minute neem-tree survey (c3 hook); a garden "who eats what" diary.

### E7 `body-systems@1`: digestion, breathing and respiration, circulation (light), joints and muscles, levels of organisation

**Topics.** c7-ch09-t01/t03, c8-ch02-t02, c9-ch03-t03. Also supports c7-ch09-t02 (animal comparisons).

**Model.**
- Layered SVG anatomy that is clothed and non-sexualised. **Reproduction and adolescence are excluded and go to human-reviewed content** (see the map).
- Digestion: a "bite" token (roti, dal, ghee, apple) travels through mouth → oesophagus → stomach → small intestine → large intestine. It carries a nutrient vector (starch, protein, fat, fibre, water) and stage rules:
  - salivary amylase: starch → sugar (the "roti tastes sweet" hook);
  - stomach: protein starts digesting;
  - small intestine: most digestion and absorption via villi into the blood;
  - large intestine: water absorption.
  - Peristalsis is animated.
- Breathing: inhaled air 21% O₂ / 0.04% CO₂; exhaled about 16% O₂ / 4% CO₂ **[M]**, shown as composition bars.
  - Breathing rate rises with exercise level.
  - **Cellular respiration in muscle is shown separately** from breathing.
- Circulation (band B and C, light): a double loop. Deoxygenated blood is rendered dark red, never blue.
- Joints: hinge (elbow, knee), ball-and-socket (shoulder, hip), pivot (neck), each with a range of motion. The biceps-triceps pair **only pulls**.
- Levels of organisation: zoom organism → system → organ → tissue → cell.

```ts
interface BodyParams {
  scene: "digestion" | "respiration" | "circulation" | "musculoskeletal" | "levels";
  food: "roti" | "rice" | "dal" | "ghee" | "apple"; exercise: 0 | 1 | 2 | 3;
  zoom: "organism" | "system" | "organ" | "tissue" | "cell"; labels: "show" | "quiz" | "off";
  joint?: "elbow" | "shoulder" | "neck" | "knee";
}
```

**Interactions, events and facts.**
- Interactions: drag the bite token stage by stage (child-paced) or auto; drag labels onto organs (quiz); scrub the zoom; flex the joint by dragging the forearm (muscles shorten and lengthen).
- Events:
  - `token_stage {organ, starch_pct, sugar_pct, protein_pct}` (salience 1)
  - `label_dropped {label, target, correct}`
  - `zoom_changed {level}`
  - `breath_rate {bpm}`
  - `joint_moved {joint, angle, muscle_contracting}`
- Facts: `organ`, `nutrients_remaining`, `absorbed`, `exhaled_o2_pct`, `bpm`, `contracting_muscle`, `zoom`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.dig.straight-to-stomach | food reaches the stomach unchanged (cur) | (cur) | poe.chew choice |
| mc.dig.stomach-all | the stomach does all the digestion (cur) | (cur) | poe.where-absorbed tap |
| mc.resp.breathing=respiration | breathing and respiration are the same (cur) | AAAS lungs item, 75% correct **[S]** | utterance cue; sort task |
| mc.resp.pure-gases | we inhale only O₂ and exhale only CO₂ (cur) | (cur) | poe.exhale bars slider |
| mc.body.bag-of-organs | organs are unconnected; organ systems are missing | Reiss & Tunnicliffe 2001 **[M]** | draw-the-path task fails to connect organs |
| mc.circ.blue-blood | veins carry blue blood | **[M]** | poe.blood-colour choice |
| mc.musc.push | muscles can push (c9, cur) | (cur) | poe.elbow choice |
| mc.lev.organ-of-organisms | organs are made of organisms (c8, cur) | (cur) | levels ordering task |

**POE hooks.**
- `chew`: chew roti for a minute; what happens to the taste?
- `exhale`: slider for the % O₂ in breathed-out air.
- `where-absorbed`: tap the organ where most food enters the blood.
- `elbow`: which muscle works to straighten the arm?
- `run`: breaths per minute after running (the child measures this physically).

**Physical twin and safety.**
- Twin: count breaths at rest vs after 30 jumping jacks (band A+, a safe exertion level); chew roti or rice slowly.
- Safety: no weight, BMI or body-image content; no diagnosis or medical advice.

### E8 `sky@1`: day and night, sun shadows, seasons, Moon phases, eclipses, stars, solar system, uneven heating

**Topics.** c4-ch10-t01/t02, c5-ch09-t01/t02, c6-ch12-t01/t02, c7-ch12-t01/t02/t03, c8-ch11-t01, c9-ch13-t01. Also supports c6-ch12-t03, c8-ch11-t02 and c8-ch13-t01.

**Model.**
- Geometric astronomy.
  - Earth's orbit has eccentricity 0.0167. **Perihelion is about 3 January**, when Earth is closest to the Sun during India's winter, and the distance varies by about 3%.
  - Obliquity is 23.44°, with a counterfactual slider from 0 to 90°.
  - Sidereal rotation is shown.
- Observer view. The observer is at a latitude preset: Srinagar 34°N, Delhi 28.6°N, Chennai 13°N, Kanyakumari 8°N, Sydney 34°S (for the "Australian winter" hook).
  - The engine computes solar altitude and azimuth, day length, and insolation ∝ sin(altitude), shown with a "torch on card" beam-spread inset.
  - It also computes gnomon shadow length and direction by hour.
- Moon:
  - synodic month 29.53 d;
  - the phase is set by the Sun-Moon-Earth angle;
  - orbital inclination is 5.1°, so eclipses happen only near the nodes.
  - Three views: top-down, the view from Earth, and a concrete "lamp and ball" view.
- Sky dome: Saptarishi and Dhruva. A day toggle shows the stars are still there but outshone.
- Solar system: true order; a size-only or distance-only scale toggle, because no single scale fits on a phone. **Exaggerated drawings are labelled "not to scale"**, since book diagrams exaggerate the ellipse and seed the distance misconception.

```ts
interface SkyParams {
  scene: "daynight" | "shadow-stick" | "seasons" | "phases" | "eclipse" | "stars" | "solarsystem" | "uneven-heating";
  dayOfYear: number; hour: number; observer: "srinagar" | "delhi" | "chennai" | "kanyakumari" | "sydney";
  tilt_deg: number; ecc: "true" | "exaggerated"; moonInclination: 0 | 5.1;
  view: "space" | "ground" | "split" | "lamp-ball"; timeSpeed: number; showDistance: boolean; scale: "size" | "distance";
}
```

**Interactions, events and facts.**
- Interactions: scrub the date and hour; drag Earth along its orbit; drag the Moon; spin the globe; place a stick and mark the shadow tip (as on the c4 worksheet); pick a Moon-shape icon from 8 choices.
- Events:
  - `date_changed`
  - `shadow_marked {hour, len_ratio, dir}` (salience 1)
  - `phase_predicted {pred, actual}` (salience 2)
  - `tilt_changed {deg, seasons_present}` (salience 1)
  - `eclipse {type}` (salience 2)
  - `distance_read {month, Mkm}`
- Facts: `month`, `earth_sun_Mkm`, `season_here`, `sun_alt_noon`, `day_len_h`, `shadow_len_ratio`, `moon_phase`, `eclipse_possible`, `tilt`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.sky.seasons-distance | summer comes because Earth is nearer the Sun (cur ×2) | Sadler; *A Private Universe* (cited by Keeley **[S]**) **[M]** | poe.closest-month choice; utterance cue "paas" |
| mc.sky.sun-moves / behind-mountains | the Sun goes around Earth, or behind the mountains at night (cur) | Vosniadou & Brewer 1994 **[M]** | poe.night choice |
| mc.moon.earth-shadow | Earth's shadow causes the phases (cur ×2) | Baxter 1989 **[M]**; Trundle et al. 2002 **[M]** | poe.half-moon choice |
| mc.moon.changes-shape | the Moon really changes shape (c4, cur) | (cur) | utterance cue |
| mc.ecl.every-month | eclipses happen at every new and full moon (cur) | (cur) | poe.eclipse-month choice |
| mc.star.day-gone | stars disappear in the day (cur) | Keeley "Where Do Stars Go?" **[S]** | poe.day-stars |
| mc.earth.equator-closer | it is hotter at the equator because it is closer to the Sun (c9, cur) | (cur) | poe.chennai-srinagar choice |

**POE hooks.**
- `closest-month`: in which month is Earth closest to the Sun? Reveal: January, which is winter in Delhi.
- `tilt0`: with tilt 0, would Delhi have summer?
- `half-moon`: with the lamp and ball, where must the ball be for a half Moon?
- `eclipse-month`: will next month's full Moon bring an eclipse?
- `noon-shadow`: shadow length at 12 noon vs 3 pm (c4).
- `day-stars`: where are the stars at noon?

**Physical twin and safety.**
- Twin: stick shadow at 9 am, 12 noon and 3 pm (c4 hook); torch on card at two angles; ball and lamp in a dark room; a Moon diary for 2 weeks.
- Safety: never look at the Sun; eclipse viewing only by pinhole projection (shared rule with optics).

### E9 `mixtures-lab@1`: separation, dissolving, solubility, concentration, colloids

**Topics.** c6-ch09-t01/t02, c8-ch08-t01, c8-ch09-t01/t02, c9-ch05-t01/t02/t03. Also supports c8-ch08-t02.

**Model.**
- A mixture is a list of components with properties: grain size, density, solubility(T) in g/100 g water, magnetic, boiling point, sublimes, colour, and particle class (solution, colloid or suspension).
  - Solubility curves **[M]**: salt about 36 g at 20 °C, nearly flat; sugar about 200 g at 20 °C, rising steeply.
- **Methods are operators** with preconditions:
  - handpick: visible size;
  - winnow: density difference plus wind, with husk trajectories;
  - sieve: mesh vs grain size;
  - magnet: magnetic;
  - sediment: settling time ∝ 1/(Δρ·d²);
  - decant;
  - filter: pore ≫ solute, so **dissolved solute always passes**;
  - evaporate: leaves the solute;
  - crystallise: purer than evaporation to dryness;
  - separating funnel: immiscible liquids;
  - sublime: camphor;
  - chromatography: Rf by affinity.
- An electronic balance makes mass conservation visible during dissolving.
- A particle inset reuses the `particles@1` renderer for solute dispersal.
- Tyndall: a torch beam is visible in colloids (dilute milk, fog) and suspensions, and not in true solutions.

```ts
interface MixParams {
  scene: "kitchen-separation" | "water-separation" | "classify" | "dissolve" | "solubility-T" | "concentration" | "advanced-separation" | "tyndall";
  preset: "dal-stones" | "rice-husk" | "sand-salt-water" | "chai-leaves" | "muddy-water" | "salt-water" | "oil-water" | "ink" | "milk" | "sherbet" | "bhel";
  tools: ("hand" | "winnow" | "sieve" | "magnet" | "settle" | "decant" | "filter" | "evaporate" | "crystallise" | "funnel" | "sublime" | "chromatography")[];
  temp_C: number; water_mL: number; addSpoons: number; stir: boolean; balance: boolean; particleInset: boolean;
}
```

**Interactions, events and facts.**
- Interactions: drag a tool onto the mixture (the engine applies the operator or shows why it fails); add spoonfuls; stir; heat; pour; shine a torch.
- Events:
  - `method_applied {method, removed, remaining}` (salience 1)
  - `method_failed {method, reason}` (salience 2; the reason is a fact key such as `dissolved_passes_filter`)
  - `saturated {g_per_100, T}` (salience 1)
  - `mass_reading {before, after}` (salience 2 if the child predicted a loss)
  - `tyndall {sample, beam_visible}`
- Facts: `components_left`, `last_method`, `last_method_worked`, `dissolved_g`, `saturated`, `mass_before_g`, `mass_after_g`, `beam_visible`, `T`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.sep.one-method | one method can separate any mixture (cur) | (cur) | sequencing task |
| mc.sol.salt-gone | dissolved salt disappears and cannot be recovered (cur) | Ebenezer & Erickson 1996 **[M]** | poe.evaporate choice |
| mc.sep.filter-salt | filtration removes salt (cur) | (cur) | poe.filter choice |
| mc.sol.mass-lost | sugar loses mass or vanishes on dissolving (cur) | Driver et al. 1994 **[M]** | poe.balance slider |
| mc.sol.unlimited | unlimited salt will dissolve (cur) | (cur) | poe.nimbu-paani slider |
| mc.sol.dissolve=melt | dissolving is melting | Driver et al. 1994 **[M]** | utterance cue "pighal" |
| mc.sol.gas-no-dissolve | gases do not dissolve (cur) | (cur) | poe.soda choice |
| mc.sol.conc=sat | concentrated means saturated (c9, cur) | (cur) | classification task |
| mc.coll.milk-solution | milk is a solution (c9, cur) | (cur) | poe.tyndall |
| mc.mix.air-single | air is one substance (c8, cur) | (cur) | sort |

**POE hooks.**
- `filter`: salt water through filter paper. Does salt come out on the other side? The check is to evaporate a few drops on a steel plate. **No tasting in any POE.**
- `balance`: 200 g water + 20 g sugar, total after stirring?
- `nimbu-paani`: how many spoons of sugar until it stops dissolving, and then what if we warm it?
- `tyndall`: torch through milk vs salt water.
- `winnow`: where will husk vs grain land?

**Physical twin.** Salt water evaporated on a steel plate in the sun (the Gujarat salt-pan hook); a chai strainer; a torch through diluted milk; winnowing dal on a plate (band A).

### E10 `motion-lab@1`: motion, forces, friction, pendulum, speed and graphs, Newton's laws, work, energy, machines, pressure

**Topics (20).** c4-ch07-t02, c5-ch07-t01, c6-ch05-t03, c7-ch08-t01/t02/t03, c8-ch05-t01/t02, c8-ch06-t01, c9-ch04-t01..t04, c9-ch06-t01..t03, c9-ch07-t01..t04.

**Model.**
- Point masses and rigid boxes in 1D or 2D, semi-implicit Euler at 1/120 s.
- Forces: applied, gravity, normal, static and kinetic friction (μ_s, μ_k; static friction holds until the applied force exceeds μ_s·N, as in PhET **[V]**), optional linear and quadratic drag, and springs.
- Tug of war, PhET pattern **[V]**: pullers of 50, 100 and 150 N.
- Pendulum: exact nonlinear motion, plus a small-angle reference T = 2π√(L/g), independent of mass.
- Sling: circular motion; release goes along the tangent.
- Swing energy bars: KE, PE and thermal, with total conserved (Energy Skate Park pattern **[V]**).
- Lever and pulley: torque balance; ideal work-in = work-out, with an optional friction loss.
- Pressure scene: F/A comparisons (knife edge vs flat, school-bag straps, nail board).
- Free fall: air on or off (feather and coin in a vacuum tube); g Earth or Moon.
- Live, synchronised x-t, v-t and a-t graphs (the microcomputer-based-lab tradition, Thornton & Sokoloff 1990 **[M]**).
- Stroboscope: a dot every Δt, for uniform vs non-uniform motion.

```ts
interface MotionParams {
  scene: "spinner" | "energy-chain" | "motion-types" | "push-cart" | "friction-surfaces" | "pendulum" | "speed" | "strobe"
       | "track" | "freefall" | "graphs" | "sling" | "tugofwar" | "bus-brake" | "recoil" | "work" | "swing-energy" | "lever" | "pressure";
  mass_kg: number; force_N: number; surface: "ice" | "cement" | "grass" | "sand" | "carpet"; mu_s?: number; mu_k?: number;
  L_m: number; amp_deg: number; bobMass_g: number; g: "earth" | "moon"; air: boolean;
  vectors: { forces: boolean; velocity: boolean; net: boolean }; graphs: ("x-t" | "v-t" | "a-t")[];
  strobe_s: number; tools: ("stopwatch" | "ruler" | "speedometer")[]; reactionNoise_s: number; // stopwatch human error ~0.2 s [M]
}
```

**Interactions, events and facts.**
- Interactions: drag to push (force ∝ drag, capped); set sliders; release the pendulum; use the stopwatch (a timer for 1 swing vs 20 swings); draw-your-graph prediction then run; place pullers; tap brake (bus).
- Events:
  - `motion_state {moving, v, a}` (salience 1 on a start or stop)
  - `friction_regime {static|kinetic}`
  - `oscillations_timed {n, t, T}` (salience 1)
  - `graph_predicted {kind, rmse}` (salience 2)
  - `object_stopped {d}`
  - `energy {KE, PE, TH}` (salience 0)
  - `net_force {F}` (salience 1 on a sign change)
- Facts: `v`, `a`, `F_net`, `moving`, `friction`, `T_period`, `bob_mass`, `KE_pct`, `PE_pct`, `work_J`, `MA`.

**Misconceptions** (all from the curriculum file unless noted):

| id | idea | source | detector |
|---|---|---|---|
| mc.f.motion-needs-force | a moving object needs a force to keep moving; constant velocity needs a net force | Clement 1982 **[M]**; McCloskey 1983 **[M]** | poe.ice-push; graph prediction showing v decaying with F = 0 |
| mc.f.rest-no-forces | a still object has no forces on it | Minstrell 1982 **[M]** | poe.book-on-table vector drawing |
| mc.f.used-up | force is "used up" as an object moves | (cur) | utterance cue |
| mc.f.heavy-falls-faster | heavier objects fall faster even without air | (cur) | poe.vacuum choice |
| mc.f.action-cancels | action and reaction cancel | (cur) | poe.recoil choice |
| mc.f.friction-bad | friction is always harmful | (cur) | sort task |
| mc.g.only-falling | gravity acts only on falling objects | Watts 1983 **[M]** | vector task |
| mc.pend.heavy-faster | a heavier bob swings faster | (cur) | poe.bob slider |
| mc.kin.farther-faster | the vehicle that went farther is faster; speed confused with distance | (cur) | poe.trains choice |
| mc.graph.picture | an x-t graph is a picture of the path | McDermott, Rosenquist & van Zee 1987 **[M]** | draw: hill-shaped graph for a ramp |
| mc.kin.disp=dist | displacement always equals distance | (cur) | poe.lap slider |
| mc.kin.zero-v-no-a | zero velocity means zero acceleration | (cur) | poe.ball-top choice |
| mc.kin.circle-no-a | uniform circular motion has no acceleration | (cur) | poe.sling |
| mc.w.holding-work | holding a bag still is doing work | (cur) | poe.coolie choice |
| mc.e.used-up | energy is used up and disappears | (cur) | swing-energy prediction |
| mc.m.reduce-work | machines reduce the work done | (cur) | poe.ramp |
| mc.m.mass=weight | mass and weight are the same | (cur) | Moon-g task |

**POE hooks.**
- `bob`: double the bob mass. Period: shorter / same / longer?
- `vacuum`: feather and coin.
- `ice-push`: push a block on ice, then let go.
- `ball-top`: acceleration at the top of a throw.
- `trains`: Vande Bharat vs a passenger train, from a table of distances and times.
- `auto-graph`: draw the auto ride to school (c9 hook).
- `coolie`: work done carrying luggage on a flat platform.
- `ramp`: is the work less with a ramp?

**Physical twin.** A thread-and-stone pendulum timed for 20 swings with a phone stopwatch; a toy car on floor vs carpet; book-pushing; a pressure demonstration with a pencil point vs the flat end on the palm (gentle).

### E11 `sound@1`: vibration, propagation, frequency and amplitude, echo

**Topics.** c9-ch10-t01/t02/t03.

**Model.**
- A 1D mass-spring chain of 60 particles drawn as a 2D band of dots. It shows compressions and rarefactions; a pressure-vs-x graph is synchronised to it.
- **One tracked particle oscillates about a fixed home and never travels.**
- Medium speeds: air 343, water about 1480, steel about 5960 m/s **[M, NCERT table values]**.
- Bell-jar scene: amplitude ∝ air pressure, going to 0 in a vacuum (PhET Sound pressure-screen pattern **[V]**).
- String: f = (1/2L)·√(T/μ); veena thick vs thin strings.
- Echo: delay = 2d/v. An echo is audible if the delay ≥ 0.1 s, so d ≥ about 17.2 m in air. Reverberation decays with the surface absorption coefficient. SONAR depth = v·t/2.
- Audio (WebAudio): frequency 100-2000 Hz, sine; gain ≤ −18 dBFS with a 50 ms ramp; maximum 3 s per play; muted by default until the teacher says so **[U, set with an audiologist]**.

```ts
interface SoundParams {
  scene: "chain" | "medium" | "belljar" | "string" | "echo" | "reverb" | "sonar";
  f_Hz: number; amp: number /*0..1*/; medium: "air" | "water" | "steel" | "vacuum"; pressure_atm: number;
  string?: { L_cm: number; tension: number; thickness: "thin" | "thick" };
  wall_m: number; room: "hall-hard" | "hall-soft" | "gol-gumbaz"; trackParticle: boolean; graph: "none" | "pressure-x" | "disp-t"; audio: boolean;
}
```

**Interactions, events and facts.**
- Interactions: pluck or strike the source; sliders; pump the bell jar; drag the wall; track a particle; hear the tone.
- Events:
  - `particle_tracked {net_displacement_mm: 0}` (salience 1)
  - `vacuum_level {p, amp}` (salience 2 at amplitude 0)
  - `echo {delay_s, audible}` (salience 1)
  - `pitch_change {f}`
  - `string_plucked {f}`
- Facts: `f_Hz`, `amp`, `v_ms`, `medium`, `audible`, `echo_delay_s`, `echo_audible`, `tracked_particle_net_move`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.snd.vacuum | sound travels through a vacuum (cur) | (cur) | poe.belljar choice |
| mc.snd.air-travels | air particles travel from the source to the ear (cur) | Eshach & Schwartz 2006 **[M]** | poe.track: where will the particle be after 10 waves? |
| mc.snd.loud=high | louder sounds have a higher pitch (cur) | (cur) | poe.amp choice |
| mc.snd.echo-anywhere | an echo can be heard in any room (cur) | (cur) | poe.echo-room |
| mc.snd.air-fastest | sound is fastest in air | **[M]** | poe.ear-on-table choice |

**POE hooks.**
- `belljar`: pump the air out. What happens to the ringing?
- `track`: where will the tracked particle be after 10 waves?
- `amp`: make it louder. Does the pitch change?
- `veena`: does the thick string sound higher or lower?
- `gol-gumbaz`: what is the minimum wall distance for an echo?

**Physical twin and safety.** Ear on a table while a friend taps; a thread telephone; a rubber band on a box. Safety: volume caps are golden-tested; no tones above 8 kHz.

### E12 `water-cycle@1`: water cycle, groundwater, rivers, convection winds, sea breeze, monsoon, distribution

**Topics.** c3-ch07-t01, c5-ch01-t01, c5-ch02-t01, c7-ch07-t04, c8-ch06-t02, c9-ch13-t02. Also supports c3-ch07-t02, c5-ch02-t02, c5-ch10-t01 and c9-ch13-t03.

**Model.**
- Compartments: ocean, vapour, cloud droplets, ice, surface, soil, aquifer, river. Fluxes are driven by sun, temperature, wind, land cover and pumping.
- Cross-section scenes:
  - Western Ghats and Kerala coast (monsoon);
  - a village with borewells: the water table drops when pumping exceeds recharge;
  - a city vs a forest: the runoff fraction depends on how paved the ground is (flood hook);
  - Godavari, from source to sea.
- **Clouds are droplets, not vapour.** Rain falls when droplet radius exceeds a threshold.
- **The aquifer is drawn as water in pores and cracks of rock**, never as a lake.
- Land and sea breeze: land heats about 3× faster than water by day. A convection cell forms; H and L labels show pressure; **wind blows from high to low pressure.**
- Tracer: "follow one drop" picks a stochastic path through the compartments, with weights from the fluxes.
- Distribution scene: a bucket of Earth's water vs the spoonful of accessible fresh water (c5 hook; about 97% salt water **[M]**).

```ts
interface WaterParams {
  scene: "home-supply" | "cycle" | "distribution" | "river" | "landcover" | "groundwater" | "seabreeze" | "monsoon" | "winds-currents";
  sun: number; hour: number; season: "summer" | "monsoon" | "winter"; landCover: "forest" | "farm" | "city";
  pumping: number /*0..3*/; rain_mm: number; showTracer: boolean; showPressure: boolean; particleZoom: boolean; years: number;
}
```

**Interactions, events and facts.**
- Interactions: sliders; tap a drop to follow it; drill a borewell; pave land with a brush; scrub the hour (sea breeze); ask "zoom into the cloud".
- Events:
  - `tracer_step {from, to}` (salience 0, with a salience-1 summary)
  - `water_table {depth_m}` (salience 1)
  - `borewell_dry` (salience 2)
  - `breeze {dir: "sea→land"|"land→sea", hour}` (salience 1)
  - `runoff_ratio {r}`
  - `cloud_zoom {contents: "droplets"}`
- Facts: `water_table_m`, `wells_dry`, `breeze_dir`, `land_T`, `sea_T`, `high_pressure_over`, `runoff_pct`, `drop_location`, `cloud_is`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.gw.lake | underground water is a big lake (cur) | (cur) | draw: aquifer as a cavity |
| mc.wc.cloud-vapour | clouds are vapour, smoke or cotton | Bar 1989 **[M]**; Keeley "What Are Clouds Made Of?" **[S]** | poe.cloud choice |
| mc.wc.rain-squeeze | rain falls because clouds are squeezed or melt | Bar 1989 **[M]** | utterance cue |
| mc.wind.low-to-high | wind blows from low to high pressure (cur) | (cur) | poe.marina arrow |
| mc.heat.only-up | heat only moves upward (cur) | (cur) | link to E16 |
| mc.air.weightless | air has no weight or pressure (cur) | (cur) | link to motion-lab pressure |
| mc.water.drinkable | most of Earth's water can be drunk (c5, cur) | (cur) | poe.bucket slider |
| mc.river.from-sea | rivers start at the sea (c5, cur) | (cur) | river ordering |
| mc.river.self-clean | a river cleans itself whatever we throw in (c5, cur) | (cur) | landcover pollution toggle |

**POE hooks.**
- `marina`: at 3 pm at Marina beach, which way does the breeze blow?
- `borewell`: 10 summers of pumping; what happens to the water level?
- `city-forest`: the same rain falls on both; which floods?
- `cloud`: zoom into a cloud. What will we see?
- `bucket`: how much of the bucket can we drink?

**Physical twin.** A cold steel plate over a steaming kettle (adult); a glass-jar terrarium; a sponge-and-gravel aquifer in a cut bottle.

### E13 `indicator-lab@1`: acids, bases, natural indicators, neutralisation, chemical vs physical change, rusting, combustion, mass conservation

**Topics.** c6-ch03-t02 (food tests variant), c7-ch02-t01/t02, c7-ch04-t02, c7-ch05-t01/t02, c9-ch09-t01.

**Model.**
- Substance library with approximate pH **[M]**: lemon 2.2, vinegar 2.8, imli about 3, tomato 4.3, curd 4.5, milk 6.6, tap water 7, baking-soda solution 8.3, soap 9-10, antacid 10.5, washing soda 11.5, chuna water 12.4.
- **Band B shows no pH numbers by default**, matching the class 7 qualitative framing. Band C may show them.
- Indicator colour functions **[M; colour swatches to be verified by photographing real extracts, U]**:
  - litmus: red below about 4.5, blue above about 8.3;
  - turmeric: yellow, turning red-brown above about pH 8.6 (the "haldi stain turns red with soap" hook);
  - china rose (hibiscus): magenta in acid, green in base;
  - red cabbage: full range (band C);
  - phenolphthalein (band C).
- Neutralisation: mixing by H₃O⁺/OH⁻ mole balance (PhET pH Scale method **[V]**), with a drop counter and a "slightly warm" cue.
- Change sorter with an evidence checklist (new substance, gas, colour, heat or light, reversibility). **Reversibility is shown as weak evidence**: some physical changes are hard to reverse, and melting ice is physical.
- Three-tube rusting set over 7 simulated days: dry air with a drying agent; boiled water under an oil layer; water plus air.
- Candle under jars of three sizes: burn time ∝ jar volume.
- Mass balance: an open flask vs a sealed bottle of vinegar + baking soda (c9 hook). Open loses CO₂ mass; sealed is unchanged.
- Food tests: iodine on starch turns blue-black; oil on paper leaves a translucent patch; biuret (band C, adult) turns violet.

```ts
interface IndicatorParams {
  scene: "indicators" | "neutralise" | "change-sort" | "rusting" | "combustion" | "mass-conservation" | "food-tests";
  substances: string[]; indicator: "litmus-red" | "litmus-blue" | "turmeric" | "china-rose" | "red-cabbage" | "phenolphthalein";
  drops: number; showPH: boolean; sealed: boolean; jarSize_mL?: number; days?: number; particleInset: boolean;
}
```

**Interactions, events and facts.**
- Interactions: drop an indicator onto a substance on a spotting tile; sort results into acidic, basic and neutral columns; add base drop by drop; drag a change card into physical or chemical; set up tubes; run days; cover the candle; seal the bottle and tilt it to mix.
- Events:
  - `tested {substance, indicator, colour, class}` (salience 1)
  - `sorted {substance, column, correct}`
  - `neutral_reached {drops}` (salience 2)
  - `change_classified {item, choice, correct}`
  - `rust {tube, day, amount}`
  - `flame_out {t}` (salience 1)
  - `mass {sealed, before, after}` (salience 2)
- Facts: `last_colour`, `last_class`, `drops`, `neutral`, `rusted_tubes`, `flame_time_s`, `mass_change_g`, `sealed`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.ab.all-dangerous | all acids are dangerous and burn (cur) | (cur) | sort of kitchen acids |
| mc.ab.sour-only | sour taste is the only acid test (cur) | (cur) | utterance cue; the **teacher must state "never taste"** |
| mc.ab.mix-harmful | acid + base always gives something harmful (cur) | (cur) | poe.antacid |
| mc.ch.rust-dirt | rust is just dirt (cur) | (cur) | poe.rub-off choice |
| mc.ch.burn-destroys | burning destroys matter; mass is lost (cur ×2) | Driver 1985, "Beyond appearances" **[S, chapter]** | poe.sealed-bottle slider |
| mc.ch.all-reversible / melt-chemical | all changes reverse; melting ice is chemical (cur) | (cur) | sorter errors |
| mc.food.one-nutrient | a food has only one nutrient (c6, cur) | (cur) | poe.groundnut multi-select |

**POE hooks.**
- `haldi`: a turmeric-stained hanky dipped in soap water. What colour?
- `sealed-bottle`: vinegar + baking soda in a sealed bottle on a balance. Mass after?
- `tubes`: which of 3 nails rusts in a week?
- `candle-jars`: which candle goes out first?
- `antacid`: how many drops to make the hibiscus extract change back?

**Physical twin and safety.**
- Twin: turmeric paper with soap water; a hibiscus petal rubbed on paper with lemon juice and with soap.
- **Safety invariants (golden-tested):** never taste; never mix household cleaners (bleach plus acid releases chlorine); no chuna or washing-soda handling below band B; candles and flames only with an adult.

### E14 `measure-lab@1`: length, curved length, temperature, time, mass, units, material properties

**Topics.** c6-ch05-t01/t02, c6-ch06-t01, c6-ch07-t01/t02, c9-ch01-t02. It also hosts the investigation harness's instruments.

**Model.** Virtual instruments with realistic error physics:
- Ruler: mm graduations; a broken-zero option; parallax error = scale thickness × tan(eye angle).
- Thread: laid along a curve (a river on a map) and then straightened onto the ruler.
- Clinical thermometer: 35-42 °C; holds its reading thanks to the kink until shaken. In water above 42 °C it shows a **"would break" refusal state** (curriculum misconception).
- Laboratory thermometer: −10 to 110 °C, with read-at-eye-level guidance.
- Stopwatch with human reaction noise.
- Pan balance with standard weights (the sabziwala hook) and a spring balance.
- Measuring cylinder: read the bottom of the meniscus.
- Three-bowls scene (Locke): perceived warmth = f(T_water − T_hand_adapted) vs the thermometer reading.
- Material tester: hardness scratch, lustre, transparency, magnet and conductivity probes (delegated to the magnets and circuits models).

```ts
interface MeasureParams {
  scene: "ruler" | "thread" | "three-bowls" | "thermometers" | "units" | "material-tester" | "balance" | "cylinder";
  object: string; zeroBroken: boolean; eyeAngle_deg: number; unit: "mm" | "cm" | "m" | "handspan" | "foot";
  thermometer: "clinical" | "lab"; ambient_C: number; trials: number;
}
```

**Interactions, events and facts.**
- Interactions: slide the ruler; move the eye; say or type a reading; lay the thread; shake the thermometer; dip it; place weights.
- Events:
  - `reading {value, unit, truth, err, errType: "zero"|"parallax"|"unit"|"scale"|"none"}` (salience 1; salience 2 on a repeated errType)
  - `misuse {kind}` (salience 2), for example a clinical thermometer in boiling water
  - `converted {from, to, ok}`
  - `bowl_feel {hand, felt, T}`
- Facts: `last_reading`, `last_err_type`, `true_value`, `unit`, `felt_vs_measured`, `therm_range_ok`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.len.edge-or-one | measuring from the scale's edge or from 1 (cur) | Bragg & Outhred 2000 **[M]** | errType zero, ×2 |
| mc.len.m=ft | 1 metre equals 1 foot (cur) | (cur) | conversion task |
| mc.len.curve | curved lines cannot be measured (cur) | (cur) | poe.river |
| mc.temp.metal-colder | metal is colder than wood at room temperature (cur ×2) | Erickson 1979 **[M]** | poe.spoons slider |
| mc.temp.heat=temp | heat and temperature are the same (cur) | Erickson & Tiberghien 1985 **[S, chapter]** | poe.bucket-vs-cup |
| mc.therm.clinical-boil | a clinical thermometer can measure boiling water (cur) | (cur) | misuse event |
| mc.unit.optional | the unit is optional (c9, cur) | (cur) | reading without a unit |

**POE hooks.**
- `three-bowls`: what will lukewarm water feel like to each hand?
- `spoons`: steel vs wooden spoon on the same table; what will the thermometer say?
- `river`: how long is the Godavari on this map?
- `one-vs-twenty`: is timing 1 swing or 20 swings more accurate?

**Physical twin.** Three bowls of water (warm, not hot); measuring a cricket pitch or a room with handspans vs a tape.

### E15 `float-sink@1`: floating and sinking, upthrust, density (classes 4, 8 and 9 link)

**Topics.** c4-ch07-t01, c8-ch05-t03, c8-ch09-t03. Also supports c6-ch06-t01 (the float-sink property).

**Model.**
- Blocks and objects with mass and volume, so density is derived. Upthrust = ρ_fluid·g·V_submerged. Damped vertical dynamics and a flat liquid surface (PhET simplifications **[V]**).
- Fluids: fresh water, salt water, oil (about 920 kg/m³, the tadka hook).
- Compare mode: same mass / same volume / same density (PhET **[V]**).
- Clay lump vs a clay boat of the same mass: the iron-ship hook.
- Spring-balance reading in air vs water: "the mug feels lighter".
- Kitchen library **[M densities; U per-item behaviour, verify each with a real tub]**: potato sinks in fresh water and floats in very salty water; egg likewise; lemon floats; steel spoon sinks; steel katori floats when upright; wooden spoon floats.
- **The physical twin is mandatory for this engine.** Evidence: hands-on beats virtual (Schwichow 2024 **[S]**); high support wins (Hardy 2006 **[V]**).

```ts
interface FloatParams {
  scene: "kitchen-tub" | "compare" | "upthrust" | "density" | "boat" | "mystery";
  objects: { id: string; mass_g?: number; vol_cm3?: number; material?: string; shape?: "lump" | "boat" }[];
  fluid: "fresh" | "salt" | "oil"; saltSpoons?: number; compareBy?: "mass" | "volume" | "density";
  showForces: boolean; showDensity: boolean; springBalance: boolean;
}
```

**Interactions, events and facts.**
- Interactions: drag objects into the tub; add salt; reshape clay into a boat; hang an object on the spring balance.
- Events:
  - `settled {id, floats, pct_submerged}` (salience 1)
  - `prediction {id, floats}`
  - `balance_reading {air_g, water_g}` (salience 1)
- Facts: `floats`, `density`, `fluid_density`, `upthrust_N`, `weight_N`, `apparent_weight_N`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.fs.heavy-sinks | heavy things sink and light things float (cur ×2) | Smith, Carey & Wiser 1985 **[M]**; Schwichow 2024 **[S]** | compare-by-mass prediction |
| mc.fs.big-denser | bigger objects are denser (cur) | (cur) | compare-by-volume prediction |
| mc.fs.mass=weight | mass and weight are the same (cur) | (cur) | spring balance in water |
| mc.fs.floaters-no-weight | floating objects have no weight, or water pushes only floaters | **[M]** | upthrust vector drawing |

**POE hooks.**
- `ship-nail`: an iron nail vs an iron katori.
- `potato-salt`: add spoons of salt until the potato floats.
- `same-mass`: a big wooden block and a small steel block of equal mass.
- `mug`: the reading under water.

**Physical twin.** A bucket and 8 kitchen objects, predicted first and then tested (band A); a potato in salt water.

### E16 `heat-flow@1`: conduction, convection and radiation (class 7)

**Topics.** c7-ch07-t01/t02/t03.

**Model.**
- 1D conduction rods: steel, copper, aluminium, wood, plastic. Wax-stuck pins drop in sequence as the local temperature passes the wax melting point; diffusivities are lesson-scaled.
- Convection: a heated beaker with a potassium-permanganate-style dye tracer (rendered only), using a 2D Boussinesq-lite grid of 24×32 cells.
- Radiation: black vs white cloth patches in the sun, with absorptance 0.9 vs 0.3; also a mirror-in-vacuum "space" panel.
- Insulation: wool traps air cells. **Wool produces no heat**; the sweater-on-a-thermometer test shows it.

```ts
interface HeatParams {
  scene: "conduction" | "convection" | "radiation" | "insulation";
  rods?: ("steel" | "copper" | "aluminium" | "wood" | "plastic")[]; source_C: number;
  dye: boolean; cloth?: ("black" | "white")[]; wrap?: "none" | "wool" | "cotton"; object?: "body" | "ice" | "thermometer";
}
```

**Interactions, events and facts.**
- Interactions: heat one end of the rods; drop dye; place cloth in the sun; wrap a thermometer or an ice block.
- Events:
  - `pin_dropped {rod, order}`
  - `dye_rises {t}`
  - `cloth_T {colour, T}`
  - `wrapped_T {wrap, object, T}` (salience 1)
- Facts: `first_pin_rod`, `rod_ranking`, `dye_pattern`, `black_T`, `white_T`, `wrapped_object_T`.

**Misconceptions.**

| id | idea | source | detector |
|---|---|---|---|
| mc.heat.wool-produces | woollen clothes produce heat (cur) | Erickson & Tiberghien 1985 **[S, chapter]** | poe.wrapped-ice choice |
| mc.heat.metal-colder | metals feel cold because they are colder (cur) | Erickson 1979 **[M]** | shared with E14 |
| mc.heat.only-up | heat only moves upward (cur) | (cur) | poe.rod-side |
| mc.heat.no-vacuum | heat cannot travel through empty space (cur) | (cur) | poe.sun-space |
| mc.heat.cold-flows | "cold" flows into things | Erickson 1979 **[M]** | utterance cue |

**POE hooks.**
- `wrapped-ice`: ice wrapped in wool vs unwrapped. Which melts first?
- `rods`: which pin falls first?
- `rod-side`: does heat move sideways along a horizontal rod?
- `sun-space`: how does the Sun's heat cross space?

**Physical twin.** Steel vs wooden spoon in hot chai (adult); black vs white cloth on a sunny ledge, felt by hand after 15 minutes.

---

## 5. T1 example (what the LLM fills, live)

```jsonc
{ "engine": "particles@1", "module_id": "m_12", "lang": "hi-Latn+en",
  "params": { "scene": "matka", "band": "B", "repr": "bridge", "ambient_C": 38, "humidity": 0.3, "wind": 1,
              "view": "lens", "poe": "matka" },
  "goals": [ { "id": "g1", "check": { "fact": "evap_rate", "op": ">", "value": 0 } } ],
  "objective_ids": ["c6-science-ch08-t03"] }
// harness then emits: poe.predicted {option:"steel_colder"} -> poe.revealed -> ghost -> poe.explained
// if the child's explanation contains the cue "mitti thandi", the detector emits mc.signal {id:"mc.state.matka-cold-clay", w:0.5}
// -> poe.resolved (the teacher states the key idea: evaporation takes heat from the water)
```

Validation: zod `safeParse`, then the engine clamps any range, then the scene's `bands` must include `band`, and finally `poe ∈ manifest.poe[*].id` with `scene` matching. On failure the request is re-asked once (tech-and-market §3.3).

---

## 6. Coverage: topics → engines (from `science-engine-map.json`, verified against curriculum IDs)

| class | topics | engine (primary or support) | share |
|---|---|---|---|
| 3 (EVS) | 24 | 6 | 25% |
| 4 (EVS) | 20 | 5 | 25% |
| 5 (EVS) | 20 | 9 | 45% |
| 6 | 33 | 21 | 64% |
| 7 | 36 | 29 | 81% |
| 8 | 34 | 26 | 76% |
| 9 | 43 | 24 | 56% |
| **all** | **210** | **120** | **57%** |

**Topics per engine:**

| engine | topics |
|---|---|
| motion-lab | 20 |
| sky | 14 |
| water-cycle | 10 |
| circuits | 9 |
| mixtures-lab | 9 |
| ecosystem | 8 |
| optics | 7 |
| indicator-lab | 7 |
| measure-lab | 6 |
| particles | 5 |
| plant-lab | 5 |
| body-systems | 5 |
| float-sink | 3 |
| heat-flow | 3 |
| magnets | 3 |
| sound | 3 |
| investigation-harness | 3 |

Particles and magnets have low topic counts but very high misconception density, so their priority stays high.

**Generic formats needed (90 topics; another workstream's engines):**

| format | topics | notes |
|---|---|---|
| sorter | 18 | |
| story | 16 | |
| map | 9 | India official boundaries |
| sequence | 8 | life cycles, paper making |
| scenario | 8 | |
| reviewed-content | 8 | adolescence, reproduction, disease: **never generated live** |
| microscope | 4 | cells and tissues, c8/c9 |
| atom-builder | 4 | c9-ch08 |
| label-diagram | 3 | |
| classification-key | 2 | c9-ch12 |
| thali-builder | 2 | |
| time-lapse | 2 | |
| spot-the-hazard | 2 | |
| one-off types | 1 each | formula-builder, pattern, label-reader, habitat-match |

**Not simulated on purpose.**
- Lightning safety (c8-ch06-t03) is a rule to state, not a phenomenon to play with.
- Disease and vaccines (c8-ch03) carry too much risk of an oversimplified mental model.

**Suggested curriculum change (for the owner of `data/curriculum`).** Add an optional `modules: [{engine, scene, role}]` field to topics, filled from the JSON map. Ownership of `data/curriculum` belongs to another workstream, so this document does not edit it.

---

## 7. Build plan, tests and what to measure first

**Order:**
1. **Contract + harnesses + `circuits` + `particles`.** Strongest misconception literature; class 6-8 core.
2. **`optics` + `sky` + `motion-lab`.** Largest topic share; `sky` needs the 3D fallback.
3. **`mixtures-lab` + `water-cycle` + `indicator-lab` + `measure-lab`.**
4. **`plant-lab` + `ecosystem` + `float-sink` + `magnets` + `heat-flow` + `body-systems` + `sound`.**

Rough effort **[U]**:

| engines | engineer-weeks each |
|---|---|
| motion-lab, sky | 4 |
| circuits, optics, particles | 3 |
| plant-lab, ecosystem, mixtures-lab, water-cycle, indicator-lab, body-systems | 2.5 |
| measure-lab, magnets, sound, float-sink, heat-flow | 1.5-2 |
| harnesses | 3 |
| **total** | **about 40** |

Plus science review of each `MODEL.md` and a Hindi terminology review.

**Golden tests per engine** (extends tech-and-market §3.3):
- (a) Every scene × band renders without console errors.
- (b) Every POE reaches `poe.resolved` using scripted inputs.
- (c) Every misconception detector fires on its scripted wrong path and **does not** fire on the scripted correct path. This is a precision/recall harness per `mc.*`.
- (d) Physics invariants:
  - mass conserved in sealed containers;
  - energy conserved in the swing within 1%;
  - the same current at every point of a series loop;
  - pendulum period independent of mass within 0.5%;
  - the temperature plateau holds during a phase change.
- (e) Safety strings: grep the engine's hints and twins for banned patterns (mains, socket, taste, bleach, look at the Sun).
- (f) Determinism: snapshot → replay gives identical facts.

**Measurements to run first:**

| # | measurement | method | pass bar |
|---|---|---|---|
| 1 | low-end frame time | `particles` (150 bodies) and `optics` (64 rays) on 3 Indian low-end Android phones in the Capacitor WebView | p95 ≤ 33 ms **[U]** |
| 2 | detector precision against teachers | 2 science teachers label 40 recorded POE sessions per engine | κ ≥ 0.6 before signals feed knowledge tracing |
| 3 | live POE latency | `show_module` → interactive | ≤ 3 s (tech-and-market §3.5 budget) |
| 4 | voice-loop observation quality | does the teacher's next utterance reference the right fact after a salience-2 event? | blind-rated, n = 30 turns |
| 5 | physical-twin uptake | share of children who actually do the home experiment when asked | DPDP: no video; self-report only |

---

## 8. Risks and open questions

- **Licensing.**
  - PhET's two statements disagree. The substack says the *whole library* is relicensed; the historical page keeps pre-2026-03-29 files under CC BY 4.0.
  - Copies obtained under CC BY 4.0 stay usable under that grant, but Taxila should still **not embed PhET at all**: the brand, logo and attribution requirements plus partnership expectations do not fit a commercial voice product.
  - Get counsel before anyone ports *design documents* verbatim. Design ideas are not copyrightable, but text is.
- **"Lies to children" must be documented.** Examples: the 2D particle model; magnets as monopole pairs; ohmic bulbs. Every engine's `MODEL.md` lists them, and band C scenes say "model" aloud. Class 9 ch01-t01 makes this explicit as curriculum.
- **Hindi terminology.** NCERT's Hindi-medium terms (for example चालक/विद्युतरोधी, वाष्पन/संघनन, प्रकाश संश्लेषण, उदासीनीकरण, उत्प्लावन बल) must be checked against the Hindi editions of *Curiosity* and *Exploration* before glossaries ship **[U]**.
- **Indian object facts.** Steel tumblers, coins, indicator colours of real haldi and hibiscus extracts, and potato and egg buoyancy are all **[U]** until verified by a 1-day "kitchen bench" test with photos. This is cheap and should be done before build.
- **Detector false positives.** A child who taps randomly looks like a misconception holder. Mitigations: a confidence capture, the ≥ 2-signal rule, and response latency below 800 ms treated as low-weight evidence (learning-science §1.10).
- **Not yet researched (next workstream):**
  - HBCSE (Mumbai) studies of Indian students' science conceptions, to localise the misconception list beyond our curriculum file;
  - OLabs (Amrita/CDAC) class 9 simulations, as an Indian design comparator;
  - AAAS Project 2061 item-level misconception percentages. The site blocked automated fetches this session.

---

## Sources

PhET (patterns, licence, model documentation):
- PhET historical licence page **[V]**: https://phet.colorado.edu/en/licensing/html
- PhET relicensing announcement, 2026-03-30 **[V]**: https://phetsims.substack.com/p/a-small-change-to-support-a-big-mission
- Code licences **[S]**: scenery (MIT) https://github.com/phetsims/scenery/blob/main/LICENSE ; simulation repositories (GPL-3.0), for example https://github.com/phetsims/forces-and-motion-basics
- Model documents read **[V]**, each at `https://github.com/phetsims/<repo>/blob/main/doc/model.md`:
  - `states-of-matter`
  - `circuit-construction-kit-common`
  - `geometric-optics`
  - `density-buoyancy-common`
  - `forces-and-motion-basics`
  - `sound-waves`
  - `acid-base-solutions`
  - `ph-scale`
  - `energy-skate-park`
- PhET Voicing (four response categories) **[V]**: https://github.com/phetsims/scenery/blob/main/js/accessibility/voicing/Voicing.ts
- PhET-iO data stream structure **[V]**: https://phet-io.colorado.edu/devguide/
- Implicit scaffolding **[S]**: https://www.per-central.org/items/detail.cfm?ID=12838 ; https://www.researchgate.net/publication/242331426

Gizmos, CK-12 and Keeley:
- Gizmos exploration sheets **[S]**: https://help.explorelearning.com/en/articles/9000601-using-student-exploration-sheets
- Gizmos Investigations **[S]**: https://gizmos.explorelearning.com/resources/insights/coming-soon-gizmos-investigations
- CK-12 simulations and PLIX **[S]**: https://www.gettingsmart.com/2016/08/09/learn-your-way-ck-12-adds-free-sims-and-interactive/ ; https://www.ck12info.org/features/
- Keeley, *Uncovering Student Ideas in Science* vol. 3 (NSTA 2008), sample chapter and index **[V]**: https://static.nsta.org/pdfs/samples/PB193X3web.pdf

Children's ideas in science:
- Driver, Squires, Rushworth & Wood-Robinson (1994), *Making Sense of Secondary Science* **[S]**: https://www.taylorfrancis.com/books/edit/10.4324/9780203978016
- Driver, Guesne & Tiberghien (1985), *Children's Ideas in Science*, chapter list (Guesne on light, Shipstone on circuits, Erickson & Tiberghien on heat, Séré and Nussbaum on gases and particles, Driver on conservation, Nussbaum on the Earth) **[S]**: https://wellcomecollection.org/works/fe7w5cb5
- Osborne (1983) and Shipstone (1984) circuit models, summarised **[S]**: https://www.per-central.org/document/servefile.cfm?ID=11585&DocID=2500
- AAAS Project 2061 assessment findings **[S]**: https://www.aaas.org/news/aaas-testing-web-site-probes-students-misconceptions-about-science

Evidence on simulations and instruction:
- Hardy, Jonen, Möller & Stern (2006), *J Educ Psych* 98:307 **[V abstract]**: https://eric.ed.gov/?id=EJ742176
- Schwichow et al. (2016), CVS meta-analysis, *Developmental Review* 39:37 **[V]**: https://www.pedocs.de/volltexte/2017/12696/pdf/Schwichow_et_al_2016_Teaching_the_control_of_variables_strategy.pdf
- Schwichow et al. (2024), floating and sinking meta-analysis, *JRST* **[S]**: https://onlinelibrary.wiley.com/doi/abs/10.1002/tea.21909
- Pavlou, Zacharia et al. (2024), *Science Education* 108:1162 **[S]**: https://ui.adsabs.harvard.edu/abs/2024SciEd.108.1162P/abstract
- Zacharia, Loizou & Papaevripidou (2012), *ECRQ* **[S]**: https://eric.ed.gov/?id=EJ974448
- D'Angelo et al. (2014), SRI simulations meta-analysis **[S]**: https://www.sri.com/publication/education-learning-pubs/simulations-for-stem-learning-systematic-review-and-meta-analysis-executive-summary/
- Rutten, van Joolingen & van der Veen (2012), *Computers & Education* **[S]**: https://eric.ed.gov/?id=EJ947482

From memory, not re-checked this session **[M]**. Verify each before a `context/` entry:
- *Particles and states:* Novick & Nussbaum 1978 (*Sci Ed* 62:273) and 1981 (*Sci Ed* 65:187); Osborne & Cosgrove 1983 (*JRST* 20:825); Bar 1989 (*Sci Ed* 73:481); Bar & Galili 1994 (*IJSE* 16:157); Kind 2004 *Beyond Appearances* (RSC; cited in Keeley **[S]**); Ebenezer & Erickson 1996.
- *Heat:* Erickson 1979 (*Sci Ed* 63:221).
- *Light:* Feher & Rice 1988 (*Sci Ed* 72:637); Goldberg & McDermott 1986.
- *Earth and sky:* Vosniadou & Brewer 1992, 1994; Baxter 1989 (*IJSE* 11:502); Trundle, Atwood & Christopher 2002; Sadler 1987 and *A Private Universe* (cited in Keeley **[S]**).
- *Living things:* Griffiths & Grant 1985 (*JRST* 22:421); Wandersee 1983; Simpson & Arnold 1982; Haslam & Treagust 1987; Arnaudin & Mintzes 1985; Reiss & Tunnicliffe 2001 (*Res Sci Ed* 31:383).
- *Forces, motion and graphs:* Clement 1982 (*AJP* 50:66); McCloskey 1983; Minstrell 1982; Watts 1983; McDermott, Rosenquist & van Zee 1987; Thornton & Sokoloff 1990.
- *Sound, magnets, electricity:* Eshach & Schwartz 2006 (*IJSE* 28:733); Barrow 1987; Hickey & Schibeci 1999; Cohen, Eylon & Ganiel 1983.
- *Density, measurement, instruction:* Smith, Carey & Wiser 1985 (*Cognition* 21:177); Bragg & Outhred 2000; Klahr & Nigam 2004 (*Psych Sci* 15:661).
- *Vultures:* Green et al. 2004 (diclofenac).
- *Finkelstein et al. 2005* (*PRST-PER* 1:010103): the ERIC snippet confirms the design (a DC-circuit lab replaced by a simulation) **[S]**; the outcome is from memory.


---

## Engineering review

Reviewer: senior frontend/game engineer pass, 2026-10-02. Scope: feasibility in React/TS + Canvas2D/SVG, low-end Android, LLM parameter sufficiency, observability of learning, safety. Evidence tags as in the header: **[Me]** measured in this repo (cited file), **[M]** prior knowledge, not re-checked, **[U]** estimate. No new web measurements were made in this pass; every performance figure below is a reasoned estimate until the device pass (measurement 1) runs.

### R0. Verdict

1. **No engine as specified fits "≤ 2 days".** One *scene* (a vertical slice: one scene, one POE, facts, 2-3 detectors, golden test) fits 2 days for most engines. A full engine does not. The doc's own total (about 40 engineer-weeks) already implies 2.5 weeks per engine; its own table sums to 42.5-45 weeks, not 40.
2. **The 40-week total is low, about 60-75 engineer-weeks [U]**, because it omits:
   - **Shared engine kit (3-4 weeks):** touch drag/snap/hit-test toolkit, label and i18n layer, graph/plot widget, particle renderer (reused by E1, E9, E11, E12, E13), geometry helpers, fixed-step loop with render-on-demand, snapshot/restore, postMessage batching.
   - **POE hook authoring:** 82 hooks across the 16 engines (E1 5, E2 6, E3 5, E4 6, E5 5, E6 4, E7 5, E8 6, E9 5, E10 8, E11 5, E12 5, E13 5, E14 4, E15 4, E16 4). Each needs option icons, bilingual labels, a scripted reveal, a `ghost` overlay, detectors and a test. At 0.5-1 day each that is 8-16 weeks.
   - **Detector precision/recall harness (golden test c):** about 130 `mc.*` rows at 1-2 h each, roughly 4-5 weeks.
   - **Art:** body-systems, plant-lab, water-cycle and sky need illustration. Art is the critical path for E7 and E12, and is not engineering time.
3. **60 fps on a ₹10k phone is the wrong target and the doc already does not claim it** (cap 30 fps, p95 ≤ 33 ms in §2.6 and measurement 1). Keep 30 fps for continuous sims, and make the other engines **render on demand with no loop at all** (see R1.1). That is cheaper, and better for battery and heat.
4. **Two engines are mis-scoped.** `motion-lab` is 19 scenes in one manifest, which is really four engines (XL). `sky` should drop three.js (R2 E8).
5. **Strongest part of the design:** semantic facts plus salience plus detectors. Keep it. The gaps are in capture modes, a missing `variables` declaration for the investigation harness, free-string params (a safety hole), and audio/mic interaction.

### R1. Cross-cutting corrections

**R1.1 Rendering and performance**
- **Render on demand, not rAF-always.** E2, E4, E9, E13, E14, E15 (after settling), E3 (static field) are state-driven. Redraw only on input or state change and stop the loop when idle. Continuous loop only for E1, E5 (time-lapse), E6 (run), E8 (when `timeSpeed > 0`), E10, E11, E12 (tracer), E16 (convection).
- **Layered canvases.** Static background (illustration, labels as SVG), one dynamic canvas, one overlay (ghost, highlight). Never redraw illustrations per frame.
- **Backing-store cap.** DPR cap of 2 on a 1080 x 2400 screen is a large fill area on Mali-G52-class GPUs. Cap the backing store to about 1.5 x the CSS size, or 720 px wide, whichever is smaller. Avoid `shadowBlur`, `ctx.filter = "blur()"` (pinhole sharpness: use stacked translucent copies instead), per-frame gradients, and full-screen alpha layers **[M]**.
- **Fixed dt 1/120 at a 30 fps cap means 4 substeps per frame.** That is fine for 150 discs (about 22k pair tests x 4, roughly 1 ms on a flagship, so about 4-6 ms on a low-end CPU at 4-6x slowdown **[U]**), but use a cell grid above about 200 bodies and make `timeScale` change steps-per-frame, not `dt`, or replay breaks.
- **Determinism (golden test f).** V8 is the same engine in Node CI and Android WebView, so IEEE results match for `+ - * /` and `Math.*` in practice **[M]**. Replay must be driven by **step counts and logged inputs**, never wall time. Do not store salience-0 events for replay (see R1.3).
- **Sandbox constraint already measured:** on WebView the module shares the host main thread, and a busy loop froze the host timer for about 1,500 ms (P12 in `sandbox-telemetry.md`) **[Me]**. So a heavy engine freezes the *voice UI*, not just itself. Each engine needs a per-frame budget guard (skip sim substeps when a frame exceeds 25 ms) and `freeze` on teacher speech must actually stop the loop.
- **Bundle budget:** per-engine lazy chunk about 120 kB gzip (the P0 budget in `sandbox-telemetry.md`, V10). Noto Sans Devanagari subset must be packaged in the APK assets, not fetched. `show_module` to interactive in ≤ 3 s is realistic only with engine chunks preloaded or bundled in the Capacitor assets.
- **Validation location:** run zod host-side, not in each engine iframe (saves about 50 kB per chunk). Engines receive already-validated params and only clamp.

**R1.2 Parameters and LLM control**
- **Measured limits now exist** **[Me, `genui-reliability.md`, `genui-azure-limits-*.json`]**: Azure strict structured output accepted 400 properties and rejects nesting beyond 10 levels and more than 1000 enum values in total, and strict mode costs a null-tax of about 24.5% of payload. So the doc's `Partial<P>` / optional-field style must be converted to strict-wire (optional becomes nullable) and enums hoisted into `$defs`.
- **Shrink the LLM surface.** The T1 call should choose `engine + scene + poe` and at most about 4 overrides. Today E10 `MotionParams` exposes about 20 unrelated fields across 19 scenes, E2 about 15, E1 about 14. Mark each param `llm: true | false`. Most params (`showLabels`, `strobe_s`, `reactionNoise_s`, `eyeAngle_deg`) should be scene-internal. A wide sparse param object also raises the odds of invalid combinations.
- **Make params per-scene discriminated unions** (`anyOf` keyed by `scene`) so a scene only exposes the fields it uses.
- **Free strings are a safety hole.** These accept arbitrary LLM text: `substances: string[]` (E13), `testItem` (E2), `items: string[]` (E3), `objects[].id` and `material` (E15), `species[].id` and `role` (E6), `object: string` (E14), `source.colour`, `text` (E4). Required: replace each with an enum from a **registry with `safe: true`**, and reject unknown IDs. The registry must exclude bleach, toilet cleaner, phenyl, pesticide, medicines and anything not intended for children. Free `text` (E4 "AMBULANCE") must be length-capped (about 16 chars), allowlisted charset, and drawn with `fillText` or SVG `textContent`, never `innerHTML`.
- **Cross-field constraints need `refine()` and a "safe state" rather than a crash.** Examples: E1 `container: "sealed"` + `heat_W > 0` must render a valve or "stop" state, never an explosion. E5 `temp_C` and `water` extremes. E10 `mu_s < mu_k` swapped values. E8 `tilt_deg` 90 is allowed but sunlight geometry degenerate (sin(alt) = 0), clamp. E4 `object_cm < focal` for real images.
- **`goals[].check` on facts** needs fact type information at validation time, so the manifest's `facts` must be machine-readable (it is) and the checker must reject comparisons on the wrong type.
- **Missing manifest field: `variables`.** The investigation harness "reads `paramSchema` and lets the child assign roles". That cannot work by reflection: `heat_W` is a variable, `showLabels` is not, and there is no dependent measure. Add `variables: { id, kind: "ind"|"dep"|"ctl", range, unit, measure?: () => number }[]` and a seeded-noise function per engine. Cost: 0.5 day per engine that supports CVS (E1 evaporation, E2 electromagnet, E5 germination, E9 solubility, E10 pendulum). Budget the harness at 4 weeks, not 3.

**R1.3 Events and what the teacher can observe**
- **Capture modes are too few for the hooks that rely on them.** `PoeHook.capture` has choice, multi, slider, draw (ray/shadow/graph/path/level) and voice. Hooks in the doc need, and cannot express:
  - **per-item matrix** (E6 remove-frog: up/same/down for each of 3 species; E5 jars: sprout yes/no for 6 jars; E3 tray sorting; E13 sorting);
  - **tap-target** (E7 where-absorbed, E3 filings where-most);
  - **vector/arrow draw** (E10 book-on-table forces, E4 eye-ray direction, E15 upthrust, E5 water direction);
  - **region draw** (E12 aquifer cavity, E4 image position);
  - **ordering** (E7 levels, E12 river);
  - **numeric entry** (E6 tally of creatures, E14 readings).
  Add `matrix`, `tap`, `arrow`, `region`, `order`, `number` modes. On a 360 dp screen avoid freehand: use waypoint placement and snap-to-target scoring (`err_px` tolerance of about 24 dp, not px).
- **Several detectors cite UI that is not specced:** "taps 'glow?'" (E2), "sort" and "classification task" (E3, E9, E13, E15, depends on the generic sorter from another workstream), "sequencing task" (E9). Either spec them or mark the detector as blocked on that engine.
- **Event volume.** `energy` (E10), `tracer_step` (E12), per-frame `drag` are salience 0. Require engines to sample salience-0 at ≤ 10 Hz and batch postMessage per frame, otherwise 60 msg/s x a 30-min session is over 100k messages for no model benefit.
- **Add generic facts to every engine** (they are cheap and are the best "is the child lost" signal): `idle_s`, `interactions_30s`, `undo_count`, `random_tap_flag` (more than N taps with no state change). The doc's random-tap mitigation exists only in prose (§8).
- **Constant facts waste the 12-key budget:** E1 `gap_contents` (always "nothing"), E5 `respiring` (always true). Put them in the scene notes or detector, not the fact line.
- **Event integrity:** the same child taps while the teacher is speaking. Events during `freeze` must be queued or dropped consistently, and the host must know the sequence number at which the freeze took effect, otherwise `poe.predicted` can race `reveal`.
- **Detector rule 2-signal minimum** is good. Add that `utterance` detectors return an **enum + confidence** (never free text) and are given the child's transcript as quoted data, so a child saying "ignore your rules" cannot steer the classifier.

**R1.4 Safety (cross-cutting)**
- **Audio vs voice call (E11 and any songs).** Playing WebAudio tones through the speaker while the realtime mic is open triggers VAD barge-in and contaminates ASR. Needs host protocol: `audio_begin`/`audio_end` events, host mutes or ducks the mic and suppresses barge-in, and `mediaPlaybackRequiresUserGesture` / iframe `allow="autoplay"` configured in the Capacitor WebView. Default `audio: false` is right.
- **Cheap phone speakers do not reproduce below about 300-400 Hz [M].** E11 allows 100-2000 Hz: restrict to 400-2000 Hz, and do not rely on audible pitch difference for the veena thick/thin POE. Show the pitch visually as well.
- **Photosensitivity:** E10 strobe and any flashing (E2 short circuit, E4 lamp) must obey ≤ 3 flashes/s (WCAG 2.3.1; the sandbox gate V9 already encodes this).
- **Burns and heat in twins.** Replace "steel vs wooden spoon in hot chai" (E16) and "boiling/steam" twins with warm tap water at ≤ 45 °C poured by an adult, or a fridge-cold spoon comparison. Cap the E14 three-bowls twin at 45 °C. Pressure cookers (E1 hook) are fine in simulation, but the teacher must never suggest opening or watching one at home.
- **Sharp objects:** replace E10's "pencil point on the palm" with pencil point vs eraser end pressed into dough or soft clay.
- **Water and drowning:** E15 twin stays "bucket or basin, adult nearby"; the teacher must never suggest ponds, wells or rivers.
- **Small magnets:** add to E3 safety strings: button and neodymium magnets are swallowing hazards, keep magnets away from phones, cards and pacemakers (fridge magnets only, never in the mouth).
- **Mercury thermometers (E14):** many Indian homes still have them. Add "if it breaks, do not touch the silver, tell an adult". Never frame readings as a diagnosis of the child's fever (already excluded as "no medical advice").
- **Maps (E12 river scene, `Godavari`):** political boundaries must come from a vetted Survey-of-India-compliant asset, or the scene should be a schematic profile without borders (legal and product risk for India).
- **Illustrations (gpt-image-2):** E7 is clothed and non-sexualised, but a generated anatomy sprite can still produce anatomy errors or disturbing renderings. Anatomy must be hand-authored SVG or artist-made and reviewed, not model-generated.
- **Golden test (e) safety greps** should also cover E13 `substances` registry contents, E11 volume and frequency caps, and E4 "look at the Sun" phrasing. Greps cover strings only: add a registry test that no unsafe item ID exists.

### R2. Per-engine review and build cost

Scale (one experienced engineer, working engine plus tests, **excluding** art, Hindi review, and the shared kit): **S** ≤ 1 week, **M** 1-2 weeks, **L** 2-4 weeks, **XL** > 4 weeks. "Slice" = one scene + one POE + facts + 2-3 detectors, which is what the 2-day budget can buy.

| engine | doc estimate | review estimate | slice in 2 days? | perf on ₹10k | verdict |
|---|---|---|---|---|---|
| E1 particles | 3 w | **L** (2.5-3 w) | yes (`boil` plateau) | fine at 40-80 particles | scope down the micro model |
| E2 circuits | 3 w | **L** (3 w) | yes (series + 1 POE), editor is the cost | fine, render on demand | solver easy, editor UX is the work |
| E3 magnets | 1.5-2 w | **M** (1.5 w) | yes (`test-tray`) | fine, static field | add safety strings |
| E4 optics | 3 w | **L** (3 w) | yes (`shadows`) | fine at 24-64 rays | 8 scenes, not one tracer |
| E5 plant-lab | 2.5 w | **L** (3 w, plus art) | slice yes (`jars`) | fine | use parametric SVG plants |
| E6 ecosystem | 2.5 w | **M** (2 w) | yes (`farm-chain` build) | trivial CPU | needs auto-balancing |
| E7 body-systems | 2.5 w | **L** (3 w, **art-blocked**) | `digestion` slice only if art exists | fine | art is the critical path |
| E8 sky | 4 w | **L** (3-4 w, 2D only) | yes (`shadow-stick`) | 2D fine, three.js risky | drop three.js |
| E9 mixtures-lab | 2.5 w | **L** (3 w) | yes (`dissolve`) | fine | many tool animations |
| E10 motion-lab | 4 w | **XL** (7-9 w; split in four) | yes (`pendulum`) | fine | split; fix integrator and tests |
| E11 sound | 1.5-2 w | **M** (1.5 w) | yes (`belljar`) | fine | audio and mic protocol |
| E12 water-cycle | 2.5 w | **L** (3 w, plus art) | yes (`seabreeze`) | fine if kinematic | 9 scenes; avoid fluid solver |
| E13 indicator-lab | 2.5 w | **M** (2 w) | yes (`indicators`) | trivial | registry and swatches |
| E14 measure-lab | 1.5-2 w | **M** (2 w) | yes (`ruler`) | trivial | no voice readings |
| E15 float-sink | 1.5-2 w | **S-M** (1 w) | yes | trivial | cheapest engine |
| E16 heat-flow | 1.5-2 w | **M** (1.5 w) | yes (`conduction`) | fine with prescribed flow | skip real fluid solver |
| poe-harness | in 3 w | **L** (3 w) | no | n/a | ghost needs per-engine work |
| investigation-harness | in 3 w | **L** (4 w) | no | n/a | needs `variables` |
| engine kit | not counted | **L** (3-4 w) | no | n/a | build first |

Sum of review estimates: about 43-50 w for engines + harnesses + kit, plus about 12 w of hook authoring and detector tests, i.e. **60-75 w** with art and review extra. With 3 engineers this is about 6 months, in line with the doc's own recommended first four-engine order.

**E1 `particles@1`: L.**
- Feasible, but the micro model is the trap. "Soft discs with weak attraction slaved to a macro enthalpy model" invites a Lennard-Jones tuning project in 2D (liquids crystallise or evaporate, thermostat drift). **Do not simulate real MD.** Use a *behavioural* model: lattice springs for the solid fraction, cohesive random-walk for the liquid fraction, free flight for the gas fraction, with per-particle state flips driven by the latent-heat fraction. This is deterministic, cheap, always looks right, and honours the plateau by construction.
- Four views (macro, lens, split, micro) are three renderers (pot with bubbles, particles, magnifier). Bubble rendering in the macro view is separate from the particle view. The matka scene (seepage plus evaporation heat balance, T_water < T_amb) is its own small model and needs a parameter pass to give a believable 5-8 °C difference **[U]**.
- Physics checks pass: water boils at about 120 °C at 2 atm **[M]**. The macro model is trivial CPU. 40 particles on low end is enough for every POE except `gas-massless` and diffusion, so keep lowEnd at 40-60.
- Params: sufficient, but `container: "sealed"` with positive `heat_W` needs the safe-state rule (R1.2). `substance: "camphor"` should be gated to band C.
- Events: sufficient. `bubbles` and `gap_contents` POEs are choice captures, so cheap and clean.

**E2 `circuits@1`: L.**
- The MNA solver is S (a day) for ≤ 12 components. LED needs a diode companion model with a few Newton or state-guess iterations: cap at 20 iterations and fall back to "off". Reverse LED `led_reversed` is fine.
- **The cost is the circuit editor**: free wiring, terminal snap, junction handling, delete and undo, pictures vs symbols morph (two sprite sets per part), on touch. A 24 px snap radius is too small for a child's finger: use at least 48 dp hit targets with a visible snap preview. Consider a **constrained editor** (tray plus fixed sockets and wire-by-tap-two-terminals) for band A and free wiring only for B/C. This halves the cost and avoids the worst UX failures.
- **Heating scene model conflict:** "fixed-current framing" contradicts `cells` and the series loop the child can edit. Lock the topology in that scene (non-editable) and say so in `MODEL.md`, or the child who adds a second bulb sees inconsistent heating.
- `same_current_everywhere` and `I_A` should be band-gated facts (hidden for A and B).
- Events sufficient. Add `loop_count` and `wire_to_bulb_count` as facts (needed for `mc.elec.unipolar` and `mc.elec.clashing`). `circuit_changed` is salience 1 but must fire on **drop/commit**, not per drag frame.

**E3 `magnets@1`: M.**
- Monopole-pair model is adequate for filings, compasses and pole interactions. Clamp 1/r² with a softening length or magnets snap and jitter. Magnets floating on cork need torque from pole forces (free from the pair model).
- Pins are induced dipoles: use a heuristic chain model (pins hang from the nearest pole, `pins_count` from strength and area), not real induction.
- Filings: 400 segments is fine as static render, recompute only on magnet move (150 on low end).
- Add safety strings (R1.4 small magnets). `items: string[]` becomes a registry enum.
- Params sufficient. Events good: `magnet_cut` and `pole_interaction` are exactly the facts the teacher needs.

**E4 `optics@1`: L.**
- A 64-ray tracer is trivial, but this is eight scenes with different geometry: shadow regions (analytic umbra/penumbra), plane-mirror eye visibility (use the image-point method, not search), pinhole image with blur (stacked translucent copies, not `ctx.filter`), periscope, thin lens and mirror principal rays, vision.
- Principal-ray drawing through an "ideal" lens is not real refraction: that is fine for classes 7-8, but state it in `MODEL.md`.
- Prediction capture by freehand `draw` is the weak point on touch (R1.3): use waypoints with a ghost and tolerance.
- Safety wording is consistent: "never look at the Sun" and projection-only eclipse viewing. Add: no lens or mirror scenes that aim sunlight at the viewer's eye or at paper in the sim as an instruction to try at home.
- Params sufficient; `text` needs charset and length limits (R1.2).

**E5 `plant-lab@1`: L (plus art).**
- Model maths is cheap. Art is not: a plant at several growth stages under several conditions (wilted, etiolated, flowering) across five species is a lot of sprites, and gpt-image-2 (about 23 s per image) will not give consistent stage-to-stage art. **Build plants as parametric SVG** (stem, leaves, roots from a few parameters), which also makes `coverFraction` and wilting free.
- Van Helmont figures check out against the historical record **[M]**: willow about 5 lb to about 169 lb (about 74 kg), soil lost about 2 oz (about 57 g).
- Time-lapse of 3 s per simulated day: 30 days is 90 s, so cap `days` and let the child skip or scrub.
- Bubble counting: the child's tap count and the engine count can differ. Give the child a counter but do not grade it. Use only the engine count as the fact.
- Starch test is a band C twin with an adult (hot alcohol), correctly flagged.

**E6 `ecosystem@1`: M.**
- RK4 on 12 species is trivial CPU. The risk is **instability and arbitrary LLM input**: Holling II with logistic producers oscillates, collapses or explodes for arbitrary `n0` and `links`. Fix: derive rate constants from `role` so the scene starts at (or near) equilibrium, clamp populations, and **golden-test the sign of every scripted perturbation** (remove frog: grasshoppers up, snake down, paddy down; remove vultures: carcasses and dogs up). Directional correctness is the pedagogical product, not quantitative fidelity.
- Check the vulture hook sources before use **[M]**: the more-than-95% Gyps decline is Prakash et al. (2003), diclofenac as the cause is Oaks et al./Green et al. (2004), and the feral-dog rise with rabies cost is Markandya et al. (2008). Keep the child-facing version to carcasses and dogs, with no dog-bite or rabies imagery.
- Missing: a numeric capture for the neem-tree tally (R1.3).
- Events good; `indirect_effects` is the best fact in the doc for observing understanding.

**E7 `body-systems@1`: L, art-blocked.**
- The logic (token through stages, nutrient vector, breath bars, joint angle) is S-M (1 week). The layered anatomy art at five zoom levels is the real cost. Commission or hand-author SVG; do not generate anatomy with a model.
- Colour rule (dark red, never blue) and exclusion of reproduction are right.
- Joints: biceps and triceps "only pulls" must be enforced visually (a muscle cannot lengthen actively). Add a test that a muscle never shows a push force.
- Facts fine. The `run` hook (child counts breaths physically) is voice or tap input; do not use the camera or microphone to measure it.

**E8 `sky@1`: L (3-4 w) if 2D only.**
- **Drop three.js.** About 170 kB gzip, WebGL context-loss and driver variance on Mali WebViews, and a heavy path for little gain. A 2D oblique orbit (ellipse plus shaded Earth with analytic terminator), a top-down view, an observer sky dome, and a lamp-and-ball view cover every POE. Phase view from Earth is a circle with an elliptical terminator arc.
- Astronomy numbers check out **[M]**: perihelion about 3 January, about 3% distance variation (147.1 to 152.1 million km), obliquity 23.44 degrees, synodic month 29.53 d, lunar inclination 5.1 degrees, observer latitudes plausible.
- Scales: solar-system size and distance need separate toggles and a log or segmented view. Keep "not to scale" labels.
- `tilt_deg` slider to 90 is fine as a counterfactual but clamp near-degenerate day lengths.
- Events good, `phase_predicted {pred, actual}` is exactly what the teacher needs.

**E9 `mixtures-lab@1`: L.**
- The operator model (properties and preconditions) is a data-driven S-M job. The cost is **animation per tool**: winnow trajectories, sieve, filter paper, funnel, sublime, chromatography Rf, crystallise. About 0.5 day each is 5-6 days. Treat `method_failed` reasons as authored data.
- Solubility values are plausible **[M]** (salt about 36 g per 100 g water at 20 degrees, nearly flat; sugar about 200 g per 100 g, steeply rising).
- Depends on the shared particle renderer (build the kit first).
- Safety: no tasting (already stated), no heating hazard instructions, no sublimation twin.

**E10 `motion-lab@1`: XL, split into four.**
- 19 scenes with unrelated state is four engines: (1) kinematics and graphs (spinner, speed, strobe, track, graphs, auto-graph), (2) forces (push-cart, friction, tug of war, bus-brake, recoil, freefall), (3) pendulum and energy (pendulum, swing-energy, sling), (4) machines and pressure (lever, pulley, work, pressure). Ship in that order. One shared `params` object with 20 mixed fields is also bad for strict LLM output (R1.2).
- **Integrator:** semi-implicit Euler at 1/120 s has bounded energy error, but test (d) "energy conserved within 1%" is **vacuous if thermal is computed as `E0 − KE − PE`**. Use velocity-Verlet, or RK4 for the pendulum, and compute TH from friction work independently so the test can fail. Pendulum "period independent of mass within 0.5%" holds only with drag off. Large-amplitude period grows (about 7% at 60 degrees) so default `amp_deg` ≤ 20 and compare measured T against the small-angle formula only in that range.
- **Static to kinetic friction chatter** near v = 0 needs an explicit sticking clamp.
- **Graph prediction** (`graph_predicted {rmse}`) requires a curve-drawing capture; use control points, not freehand.
- Params: too many; make per-scene sub-schemas. Events are good and some of the best in the doc (`net_force` sign change, `friction_regime`).
- Safety: replace the pencil-point-on-palm twin (R1.4). Bus-brake scene must not show injury.

**E11 `sound@1`: M.**
- 60-particle chain is trivial. WebAudio needs the gesture and mic protocol above (R1.4), and frequency floor of about 400 Hz.
- Volume cap −18 dBFS with a 50 ms ramp is a good default, but device volume is not under our control: also cap session audio time.
- Keep the tracked-particle `net_displacement_mm: 0` fact: it is the cleanest observation of understanding in the doc.

**E12 `water-cycle@1`: L (plus art).**
- Nine scenes. The compartment fluxes are cheap. **Do not build a fluid solver for the sea breeze or monsoon:** use a kinematic convection cell with temperature-driven strength and H/L labels. The groundwater table is a single-bucket ODE (recharge minus pumping).
- Illustrated cross-sections (Western Ghats, borewell village, city vs forest) are art work.
- Map scenes: boundary compliance (R1.4).
- "Follow one drop" stochastic path needs a seeded RNG so replay is deterministic.

**E13 `indicator-lab@1`: M.**
- All logic is data and simple functions: indicator colour from pH thresholds, mole-balance neutralisation, rust and candle timers, mass balance. Checked against standard ranges **[M]**: litmus about 4.5-8.3, turmeric turns red-brown at alkaline pH, phenolphthalein about 8.2-10, saturated lime water about 12.4.
- The real work is the **substance registry and swatch calibration** (photograph real extracts as already noted in §8). Hard-exclude bleach, drain and toilet cleaners from the registry (R1.2). Keep chuna and washing soda visible only as sim items with a "do not handle" tag, band B and up.
- Particle inset reuses E1's renderer.

**E14 `measure-lab@1`: M.**
- Eight small instruments, each S, with parallax and zero-error physics being simple geometry. Total 1.5-2 weeks is right.
- **Do not use voice or free typing for readings.** Hindi number words ("saadhe teen", "dhai", "derh") break numeric ASR. Use a stepper or number pad tap, with unit chosen from a list (also needed for `mc.unit.optional`).
- "Shake the thermometer" must be a swipe gesture; do not use device motion permissions in WebView.
- Mercury note (R1.4).

**E15 `float-sink@1`: S-M.**
- Cheapest engine: damped vertical dynamics and Archimedes. Hull volume for katori vs lump needs a `shape` parameter and displaced-volume calculation, nothing more. Clay-boat reshaping is a single "boat-ness" slider.
- Kitchen object behaviour stays [U] until the 1-day bench test. Do the bench test before art.
- Mandatory physical twin is correct and cheap. Safety line about water (R1.4).

**E16 `heat-flow@1`: M.**
- Conduction rods are a 1D diffusion with wax thresholds: S. Radiation patches and wool tests are lumped thermal models: S.
- **Convection:** a 24 x 32 stable-fluids Boussinesq grid is feasible CPU-wise (well under 1 ms per step) but tuning a plume that looks right takes days and is fragile. A **prescribed stream function** with buoyancy-scaled amplitude and advected dye particles is robust and deterministic, and good enough for class 7.
- Safety: twin change (R1.4).

### R3. Corrections to the document (summary)

1. §7 effort table: engines total 42.5-45 w, not 40, and the review estimate is 60-75 w with kit, hooks and detectors (R0.2).
2. §2.6: keep 30 fps for continuous sims, and add **render-on-demand** for state-driven engines; cap the backing store; list banned canvas features (R1.1).
3. §2.1 manifest: add `variables`, `llm: boolean` per param, per-scene param sub-schemas, scene-scoped `facts` (≤ 12 each), and registries instead of free strings.
4. §3.1 `PoeHook.capture`: add `matrix`, `tap`, `arrow`, `region`, `order`, `number` modes; waypoint-based draw.
5. §3.2: the investigation harness cannot reflect on `paramSchema`; it consumes `variables` (R1.2).
6. §2.2: salience-0 sampling ≤ 10 Hz and no replay from events (replay from inputs and step counts).
7. §2.4: remove constant facts; add `idle_s`, `interactions_30s`, `undo_count`, `random_tap_flag`.
8. E1: use a behavioural particle model, not MD (R2).
9. E2: constrained editor for band A; lock topology in the heating scene; 48 dp targets.
10. E8: drop three.js.
11. E10: split into four engines; fix the energy test; sticking clamp.
12. E11: tone floor 400 Hz; host mute/duck protocol for the live voice session.
13. E14: no voice readings.
14. E13 and others: unsafe substances excluded from registries by construction.
15. Twins: E10 pencil point, E16 hot chai, E14 bowls above 45 degrees, E3 small magnets, E15 water bodies (R1.4).
16. E12: political boundaries from a vetted asset only.
17. Art as a named dependency for E5, E7, E8 (sky illustrations), E12.

### R4. Recommended build order (engineering, revised)

1. **Engine kit + contract + poe-harness skeleton** (3-4 w), with `float-sink` as the first engine to prove the contract end to end (S-M, 1 w, low risk).
2. `circuits` (constrained editor first) and `particles` (behavioural model), with real-device frame-time measurement 1 on `particles` at 40-80 bodies as the first gate.
3. `motion-lab` part 1 (kinematics and graphs) and part 2 (pendulum and energy), `sky` (2D), `optics`.
4. The rest in the doc's order, with `plant-lab`, `body-systems`, `water-cycle` started only after art is delivered.
5. Run the **kitchen bench test** (objects, indicator swatches, magnet behaviour) before E3, E13, E15 asset work.

### R5. Measurements to add to §7

| # | measurement | method | pass bar |
|---|---|---|---|
| 6 | render-on-demand idle cost | rAF count and CPU on an idle `circuits` scene, 3 phones | 0 frames while idle |
| 7 | host freeze under engine load | `freeze` honoured within 100 ms with `particles` at 150 bodies, WebView on a ₹8-10k phone | no host timer gap > 200 ms (P12 baseline was 1,500 ms) |
| 8 | tone audibility | E11 400 Hz, 800 Hz, 2 kHz on 3 cheap phones at max media volume | audible at 400 Hz on all three, else raise the floor |
| 9 | mic contamination | tone playback during a live voice turn, count of false barge-ins | 0 in 20 plays with the mute/duck protocol |
| 10 | strict-schema fit | each engine's per-scene T1 schema through Azure strict mode | accepted, ≤ 400 properties, nesting ≤ 10, null tax reported |
| 11 | ecosystem direction tests | scripted perturbations over 50 random `n0` draws | sign correct in 100% of runs |
