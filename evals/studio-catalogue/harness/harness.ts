// QA harness for the extension engines (evals/studio-catalogue). Solo mode mounts one engine full-viewport and exposes
// the StudioHandle as window.__sv2 (the seam the Playwright tools drive), exactly like the RS-4 gallery:
//   ?engine=<archetype> &seed=7 &motion=reduce &dpr=1 &fault=boot|transient|permanent &mut=<n> &sound=off
//   &topic=<topicId>&slot=game|explainer   → mounts the catalogue spec for that topic (data/studio-catalogue)
import "./harness.css";
import { registerExtSpecs, ENGINE_SPECS_EXT } from "../../../shared/studio-spec-ext/index.ts";
import { ENGINE_SPECS } from "../../../shared/studio-spec.ts";
import { ENGINES } from "../../../src/studio-v2/engines/index.ts";
import { ENGINES_EXT } from "../../../src/studio-v2/engines/ext/index.ts";
import { mountStudio, type StudioHandle } from "../../../src/studio-v2/core/host.ts";
import { mutateSpec } from "../../../src/studio-v2/core/mutate.ts";

registerExtSpecs();
declare global { interface Window { __sv2?: StudioHandle; __SPEC?: unknown; __CAT?: Record<string, unknown> } }
const qs = new URLSearchParams(location.search);
const app = document.getElementById("app")!;
const ALL = { ...ENGINES, ...ENGINES_EXT };

async function specFor(archetype: string): Promise<unknown> {
  if (window.__SPEC !== undefined) return window.__SPEC;
  const topic = qs.get("topic"), slot = qs.get("slot") || "game";
  if (topic) {
    try { const r = await fetch(`./catalogue/${topic}.json`); if (r.ok) { const j = await r.json(); const piece = j[slot]; if (piece?.spec) return piece.spec; } } catch { /* fall through to default */ }
  }
  const mut = qs.get("mut");
  const base = (ENGINE_SPECS_EXT[archetype] ?? ENGINE_SPECS[archetype])?.defaultSpec;
  if (mut != null) return mutateSpec(base, +mut).spec;
  return undefined;
}
async function solo(archetype: string) {
  document.body.classList.add("solo");
  const slot = document.createElement("div"); slot.className = "solo-slot"; app.appendChild(slot);
  const def = ALL[archetype];
  if (!def) return;
  const spec = await specFor(archetype);
  window.__sv2 = mountStudio(slot, def, {
    spec, seed: +(qs.get("seed") || 7), motion: qs.get("motion") === "reduce" ? "reduce" : "full",
    dpr: qs.get("dpr") ? +qs.get("dpr")! : undefined, fault: (qs.get("fault") as "boot" | "transient" | "permanent" | null) ?? undefined,
    sound: qs.get("sound") !== "off",
  });
}
const eng = qs.get("engine");
if (eng) void solo(eng);
else {
  const d = document.createElement("div"); d.className = "list";
  for (const id of Object.keys(ENGINES_EXT)) { const a = document.createElement("a"); a.href = `?engine=${encodeURIComponent(id)}`; a.textContent = id; a.className = "card"; a.dataset.archetype = id; d.appendChild(a); }
  app.appendChild(d);
}
