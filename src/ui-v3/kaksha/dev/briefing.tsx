// Kaksha Briefing dev page (never shipped; needs G1's engines and patches K-P3 / K-P4). The REAL PlayStudioRenderer
// renders a play artifact at a play-box size inside the Kaksha frame; the play API is answered in the page with a level
// the real generator builds here (as G1's dev harness does) and the base / a "model" dress. window.__k2 records the
// launch and the engine's first painted frame for the launch → first-frame bar (BUILD-SPEC K-P3: ≤ 1.2 s on the proxy).
//   ?class=4|6|7 &w=&h= (box px) &modelMs=600 (the model dress answers after this; -1 = never) &cos=1 (hull + trail)
//   &force3d=1 (let a software GPU through, as the cert harness does) &motion=reduced
import { createRoot } from "react-dom/client";
import "../../../styles/fonts.css";
import type { GenRequest, PlayArtifact, PlayLevel } from "../../../../shared/play.ts";
import { logicFor } from "../../../play/families/index.ts";
import { pickLevels } from "../../../play/core/pick.ts";
import { dressFor } from "../../../play/engines/core3d/api.ts";
import { baseDress } from "../../../play/engines/core3d/dress.ts";
import PlayStudioRenderer from "../../../play/PlayStudioRenderer.tsx";
import { PlayBriefingContext } from "../../../play/briefing.ts";
import { Briefing } from "../play/Briefing.tsx";
import { cosmeticsFor } from "../play/cosmetics.ts";
import { bandForClass, familyOf } from "../../../child/band.ts";
import { kakshaThemeFor } from "../tokens.ts";
import "../../tokens.css";
import "../tokens.css";
import "../kaksha.css";
import "../play/play.kaksha.css";

const q = new URLSearchParams(location.search);
const cls = Number(q.get("class") ?? 6);
const family = familyOf(bandForClass(cls));
const W = Number(q.get("w") ?? 328), H = Number(q.get("h") ?? 460);
const modelMs = Number(q.get("modelMs") ?? 600);
const reduced = q.get("motion") === "reduced";
if (q.get("force3d") === "1") (window as unknown as { __taxilaPlayRender: unknown }).__taxilaPlayRender = { render: "3d" };

const logic = logicFor("nishana", "place")!;
const req: GenRequest = { family: "nishana", mode: "place", topicId: `c${cls}-maths-ch07-t02`, skillId: `c${cls}-maths-ch07-t02-s1`, classLevel: cls, fade: 1,
  goal: undefined, mis: {}, misMap: Object.fromEntries(logic.malRules.map((m) => [m, `dev:${m}`])), grammar: { forms: ["fraction"], dens: [3, 4] }, recent: [], seed: 7, harder: false };
const level = pickLevels(logic, req)!.garam as PlayLevel;
const lang = cls <= 4 ? "hinglish" : "en";
const base = dressFor({ engine: "antariksh", base: baseDress({ engine: "antariksh", key: level.levelId, lang, firstLevel: false }), delta: null, classLevel: cls, secure: false, childMusicOn: false, lessonLang: lang, verb: "fire" });
const model = { ...base, dress: { ...base.dress, theme: "laal-grah", wrapper: "beacon-rescue" as const }, from: { ...base.from, theme: "model" as const, wrapper: "model" as const } };
const probe: { launchAt: number | null; frameAt: number | null } = ((window as unknown as { __k2: { launchAt: number | null; frameAt: number | null } }).__k2 = { launchAt: null, frameAt: null });

const of = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
  if (url.includes("/api/play/level")) { if (q.get("brief") === "0") probe.launchAt = performance.now(); return json({ sessionId: "dev-s1", level, art: { art: "kagaz", reason: "rotation" }, dress: base }); }
  if (url.includes("/api/play/dress")) {
    if (modelMs < 0) return new Promise(() => {});
    await new Promise((r) => setTimeout(r, modelMs));
    return json({ dress: model, source: "model", ms: modelMs });
  }
  if (url.includes("/api/play/act")) { try { ((window as unknown as { __k2acts: unknown[] }).__k2acts ??= []).push(JSON.parse(String(init?.body ?? "null"))); } catch { /* not json */ } return json({ sessionId: "dev-s1" }); }
  if (url.includes("/api/play/")) return json({ ok: true });
  return of(input, init);
};

// the engine's first painted frame after launch: a canvas appears in the box, then two frames
new MutationObserver(() => {
  if (probe.launchAt === null || probe.frameAt !== null) return;
  const cv = document.querySelector('[data-testid="play-studio"] canvas:not(.kx-warp)');
  if (cv) requestAnimationFrame(() => requestAnimationFrame(() => { if (probe.frameAt === null) probe.frameAt = performance.now(); }));
}).observe(document.body, { subtree: true, childList: true });

const items = [{ id: "hull-thirds", kind: "hull", hue: "plasma", open: true }, { id: "trail-green", kind: "trail", hue: "secure", open: true }];
const cosmetics = q.get("cos") === "1" ? cosmeticsFor({ hull: "hull-thirds", trail: "trail-green" }, items) : null;
const art: PlayArtifact = { kind: "play", play: { sessionId: "dev-s1", family: "nishana", mode: "place", skillId: req.skillId, topicId: req.topicId, art: "kagaz", levelId: level.levelId } };

function App() {
  return (
    <div className="v3 kx kx-lesson" data-ktheme={kakshaThemeFor(family)} data-motion={reduced ? "reduced" : undefined} style={{ minHeight: "100vh", padding: 16 }}>
      <PlayBriefingContext.Provider value={q.get("brief") === "0" ? null : { render: (p) => <Briefing {...p} launch={() => { probe.launchAt = performance.now(); p.launch(); }} />, cosmetics }}>
        <div style={{ width: W, height: H, margin: "0 auto", position: "relative", outline: "1px solid var(--k-line-2)" }}>
          <PlayStudioRenderer artifact={art as never} px={{ w: W, h: H }} design={{ w: W, h: H } as never} reducedMotion={reduced} young={family === "young"} lang={lang}
            onEvent={(e) => { (window as unknown as { __k2ev: unknown[] }).__k2ev ??= []; ((window as unknown as { __k2ev: unknown[] }).__k2ev).push(e); }} />
        </div>
      </PlayBriefingContext.Provider>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
