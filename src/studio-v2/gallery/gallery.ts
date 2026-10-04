// Studio v2 gallery: the engine catalogue as a page (publishable), plus a solo mode the Playwright tools drive:
//   index.html                      → catalogue + viewer (knobs, bad-spec, break-engine, live host grades)
//   index.html?engine=<archetype>   → one full-viewport stage, `window.__sv2` = the StudioHandle (QA seam)
//      &seed=7 &motion=reduce &dpr=1 &fault=boot|transient|permanent &mut=<n> (seeded bad spec n)
import "./gallery.css";
import { ENGINE_SPECS } from "../../../shared/studio-spec.ts";
import { ENGINES } from "../engines/index.ts";
import { mountStudio, type StudioHandle } from "../core/host.ts";
import { mutateSpec } from "../core/mutate.ts";
import { drawBoard, sanitizeBoard } from "../core/board.ts";
import { audioFor } from "./audio.ts";
import measuredRaw from "./measured.json";
import postersRaw from "./posters.json";

type Measured = Record<string, { fps?: number; p95?: number; bootMs?: number; fuzz?: string; video?: string }>;
const measured = measuredRaw as Measured;
const posters = postersRaw as Record<string, string>;
declare global { interface Window { __sv2?: StudioHandle; __SPEC?: unknown; __sv2Mount?: (a: string, o?: Record<string, unknown>) => StudioHandle } }

const qs = new URLSearchParams(location.search);
const app = document.getElementById("app")!;
const BLURB: Record<string, string> = {
  "catch-on-line@1": "Steer the dock to where each fraction lives before its pod lands. Equal fractions land on one spot.",
  "circuit-bench@1": "Build real circuits on a bench solved by nodal analysis. Charge flows at the speed of the current.",
  "orbital-explainer@1": "A narrated, scrubbable explainer: lit half, near half, Earth's shadow killed on screen. Ends hands-on.",
  "slice-at@1": "Bars fly through the air. Swipe the cut exactly where the fraction says, then cut equal shares.",
  "line-runner@1": "Tap to jump as the runner crosses the called number. Negatives, backwards runs, decimals.",
  "area-claim@1": "Stake plots on a grid before the drift takes them: exact area, exact perimeter, then the most area.",
  "vault-heist@1": "Grab blocks off a moving belt to load the vault to an exact number. Ten of a kind regroup.",
  "angle-cannon@1": "Turn a turret by estimate to hit cloaked threats at called angles. Copy turns; shoot only obtuse.",
  "food-web@1": "Draw who-eats-whom, predict a removal, then keep a forest alive through a drought.",
  "phase-shift@1": "Heat, cool, fan and lid a beaker of real particles. Watch 0 °C and 100 °C hold while the state changes.",
  "balance-beam@1": "Torque physics: level the beam, unmask a mystery crate, take the same off both sides.",
  "shadow-play@1": "Drag a torch along a bench: rays are traced exactly. Size a shadow, chase a band, sort materials.",
  "water-cycle@1": "Cinematic water cycle: invisible vapour, clouds as droplets, groundwater as a sponge. Ends with a tap test.",
  "scale-cinematic@1": "The solar system re-drawn to scale, the light-time ride out to Neptune, and why distance is not summer.",
  "angle-sum@1": "Tear off a triangle's corners and line them up: 180°. Stretch it; the sum never moves. Then you close it.",
  "data-rush@1": "Tally cars live as traffic streams past, then drag the line to the mean and watch the bars level.",
};

function specFromUrl(archetype: string): unknown {
  if (window.__SPEC !== undefined) return window.__SPEC;
  const mut = qs.get("mut");
  if (mut != null) return mutateSpec(ENGINE_SPECS[archetype].defaultSpec, +mut).spec;
  return undefined;
}
function mountSolo(archetype: string) {
  document.body.classList.add("solo");
  const slot = document.createElement("div"); slot.className = "solo-slot"; app.appendChild(slot);
  const def = ENGINES[archetype];
  if (!def) { slot.textContent = ""; return; }
  const h = mountStudio(slot, def, {
    spec: specFromUrl(archetype), seed: +(qs.get("seed") || 7), motion: qs.get("motion") === "reduce" ? "reduce" : "full",
    dpr: qs.get("dpr") ? +qs.get("dpr")! : undefined, fault: (qs.get("fault") as "boot" | "transient" | "permanent" | null) ?? undefined,
    audio: qs.get("audio") === "0" ? undefined : audioFor(archetype), sound: qs.get("sound") !== "off",
  });
  window.__sv2 = h;
}

// ── catalogue
function cover(archetype: string): HTMLElement {
  const box = document.createElement("div"); box.className = "cover";
  if (posters[archetype]) { const img = document.createElement("img"); img.src = posters[archetype]; img.alt = ""; img.loading = "lazy"; box.appendChild(img); }
  else {
    const c = document.createElement("canvas"); c.width = 640; c.height = 400; box.appendChild(c);
    const g = c.getContext("2d")!; g.scale(0.64, 0.64);
    drawBoard(g, sanitizeBoard({ title: ENGINE_SPECS[archetype].title, lines: [] }, ENGINE_SPECS[archetype].title), 1);
  }
  const d = ENGINES[archetype], k = document.createElement("span"); k.className = "kind"; k.style.setProperty("--c", d.accent);
  k.innerHTML = "<i></i>"; k.append(d.label);
  box.appendChild(k);
  return box;
}
function catalogue() {
  const ids = Object.keys(ENGINES);
  const specs = ids.map((id) => ENGINE_SPECS[id]);
  const games = specs.filter((s) => s.kind === "game").length, sims = specs.filter((s) => s.kind === "simulation").length, expl = specs.filter((s) => s.kind === "explainer").length;
  const topics = new Set(specs.flatMap((s) => s.outcomes.topics)), miscs = new Set(specs.flatMap((s) => s.outcomes.misconceptions));
  const wrap = document.createElement("div"); wrap.className = "wrap";
  wrap.innerHTML = `
    <div class="top"><div class="brand"><svg viewBox="0 0 26 26" fill="none"><path d="M4 22V11a9 9 0 0 1 18 0v11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 22v-9a4 4 0 0 1 8 0v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="13" cy="5" r="2" fill="#CBFF4D"/></svg>Taxila · Studio v2</div>
    <button class="theme" type="button">Theme</button></div>
    <h1>Games and explainers that teach the act itself.</h1>
    <p class="lede">Every piece below is a hand-built engine driven by a small validated spec. The model chooses items, order and words; the engine owns physics, truth and feel. Bad specs play plainer, never broken; a crashing engine hands over to the board version of the same idea. Every answer is graded by the host from the spec, never by the frame.</p>
    <div class="stats">
      <div class="stat"><b>${ids.length}</b><span>engines</span></div>
      <div class="stat"><b>${games}</b><span>real-time games</span></div>
      <div class="stat"><b>${sims}</b><span>simulations</span></div>
      <div class="stat"><b>${expl}</b><span>cinematic explainers</span></div>
      <div class="stat"><b>${topics.size}</b><span>NCERT topics tagged</span></div>
      <div class="stat"><b>${miscs.size}</b><span>kit misconceptions</span></div>
    </div>
    <div class="filters" role="toolbar" aria-label="Filter"></div>
    <div class="grid"></div>
    <p class="foot">Open a card to play. The panel has knobs (harder, slower, again), a seeded bad spec to throw at the engine, and a fault switch that breaks the engine on purpose so you can watch the board take over. The teacher tile is the slot for the in-house 2D/3D teacher, shown here as an empty frame. Fonts: Bricolage Grotesque, Atkinson Hyperlegible Next, Geist Mono (SIL OFL).</p>`;
  app.appendChild(wrap);
  const filters = wrap.querySelector(".filters")!, grid = wrap.querySelector(".grid")!;
  const chips: [string, (id: string) => boolean][] = [
    ["All", () => true], ["Games", (id) => ENGINE_SPECS[id].kind === "game"], ["Simulations", (id) => ENGINE_SPECS[id].kind === "simulation"], ["Explainers", (id) => ENGINE_SPECS[id].kind === "explainer"],
    ["Maths", (id) => ENGINE_SPECS[id].subject === "maths"], ["Science", (id) => ENGINE_SPECS[id].subject === "science"],
    ...[4, 5, 6, 7].map((c) => [`Class ${c}`, (id: string) => ENGINE_SPECS[id].outcomes.classes.includes(c)] as [string, (id: string) => boolean]),
  ];
  let active = 0;
  const render = () => {
    grid.textContent = "";
    for (const id of ids.filter(chips[active][1])) {
      const s = ENGINE_SPECS[id], m = measured[id] ?? {};
      const card = document.createElement("button"); card.type = "button"; card.className = "card"; card.dataset.archetype = id;
      card.appendChild(cover(id));
      const body = document.createElement("div"); body.className = "body";
      const h3 = document.createElement("h3"); h3.textContent = s.title;
      const p = document.createElement("p"); p.textContent = BLURB[id] ?? "";
      const meta = document.createElement("div"); meta.className = "meta";
      meta.innerHTML = `<span class="tag m">Class ${s.outcomes.classes.join(", ")}</span>` + s.outcomes.topics.slice(0, 3).map((t) => `<span class="tag">${t}</span>`).join("");
      const nums = document.createElement("div"); nums.className = "numbers";
      if (m.fps) nums.innerHTML = `<span><b>${m.fps}</b> fps @4×</span><span>p95 <b>${m.p95}</b> ms</span>${m.fuzz ? `<span>fuzz <b>${m.fuzz}</b></span>` : ""}`;
      body.append(h3, p, meta, nums);
      card.appendChild(body);
      card.addEventListener("click", () => openViewer(id));
      grid.appendChild(card);
    }
  };
  chips.forEach(([name], i) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = name; b.setAttribute("aria-pressed", String(i === 0)); b.addEventListener("click", () => { active = i; filters.querySelectorAll(".chip").forEach((c, j) => c.setAttribute("aria-pressed", String(j === i))); render(); }); filters.appendChild(b); });
  render();
  const root = document.documentElement;
  try { const t = localStorage.getItem("sv2-theme"); if (t) root.dataset.theme = t; } catch { /* storage may be blocked */ }
  wrap.querySelector(".theme")!.addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("sv2-theme", root.dataset.theme); } catch { /* */ }
  });
}

// ── viewer
let viewerEl: HTMLDivElement | null = null, current: StudioHandle | null = null, mutSeed = 1;
function openViewer(id: string, spec?: unknown, fault?: "permanent") {
  if (!viewerEl) {
    viewerEl = document.createElement("div"); viewerEl.className = "viewer"; viewerEl.hidden = true;
    viewerEl.innerHTML = `<div class="stagebox"><div class="slot"></div></div><aside class="side"></aside><button class="x" type="button" aria-label="Close">×</button>`;
    document.body.appendChild(viewerEl);
    viewerEl.querySelector(".x")!.addEventListener("click", closeViewer);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && viewerEl && !viewerEl.hidden) closeViewer(); });
  }
  current?.dispose();
  const slot = viewerEl.querySelector<HTMLDivElement>(".slot")!, side = viewerEl.querySelector<HTMLElement>(".side")!;
  viewerEl.hidden = false; document.body.style.overflow = "hidden";
  const s = ENGINE_SPECS[id];
  side.innerHTML = `<h2></h2><p class="sub"></p>
    <div class="row"><button data-k="harder">Harder</button><button data-k="slower">Slower</button><button data-k="again">Again</button></div>
    <div class="row"><button data-a="bad">Throw a bad spec</button><button data-a="break">Break the engine</button><button data-a="reset">Reset</button></div>
    <div><div class="lbl">Outcomes</div><pre class="out"></pre></div>
    <div><div class="lbl">Spec repairs</div><pre class="rep"></pre></div>
    <div><div class="lbl">Host grades and events</div><pre class="log"></pre></div>
    <div><div class="lbl">Spec as played</div><pre class="spec"></pre></div>
    <button class="primary" data-a="close" type="button">Close</button>`;
  side.querySelector("h2")!.textContent = s.title;
  side.querySelector(".sub")!.textContent = BLURB[id] ?? "";
  side.querySelector(".out")!.textContent = `classes ${s.outcomes.classes.join(", ")}\n${s.outcomes.topics.join("\n")}\n\n${s.outcomes.misconceptions.join("\n")}`;
  const logEl = side.querySelector(".log")!;
  const lines: string[] = [];
  current = mountStudio(slot, ENGINES[id], {
    spec, seed: 7, fault, audio: audioFor(id),
    onMessage: (m) => {
      if (m.k === "answer") lines.unshift(`${m.itemId}  →  ${m.grade?.verdict}${m.grade?.detail ? " · " + m.grade.detail : ""}  (truth ${JSON.stringify(m.grade?.truth)?.slice(0, 40)})`);
      else if (m.k !== "say") lines.unshift(`${m.k}${m.name ? " " + m.name : ""}`);
      logEl.textContent = lines.slice(0, 60).join("\n");
    },
  });
  side.querySelector(".rep")!.textContent = current.repairs.length ? current.repairs.join("\n") + (current.fellBack ? "\n→ reviewed default plays" : "") : "none";
  side.querySelector(".spec")!.textContent = JSON.stringify(current.spec, null, 1).slice(0, 6000);
  side.querySelectorAll<HTMLButtonElement>("button[data-k]").forEach((b) => b.addEventListener("click", () => current?.knob(b.dataset.k as "harder")));
  side.querySelector('[data-a="bad"]')!.addEventListener("click", () => { const m = mutateSpec(s.defaultSpec, mutSeed++); openViewer(id, m.spec); });
  side.querySelector('[data-a="break"]')!.addEventListener("click", () => openViewer(id, spec, "permanent"));
  side.querySelector('[data-a="reset"]')!.addEventListener("click", () => openViewer(id));
  side.querySelector('[data-a="close"]')!.addEventListener("click", closeViewer);
}
function closeViewer() { current?.dispose(); current = null; if (viewerEl) viewerEl.hidden = true; document.body.style.overflow = ""; }

const solo = qs.get("engine");
if (solo) mountSolo(solo); else catalogue();
window.__sv2Mount = (a, o = {}) => { const slot = document.createElement("div"); slot.className = "solo-slot"; app.appendChild(slot); return mountStudio(slot, ENGINES[a], o); };
