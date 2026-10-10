// Play render tier (core3d@1, CORE-API §6). Pure: detectTier() decides from facts; tierFacts() is the only DOM-touching
// function. Known-bad GPUs go to the 2D board twin; lite GPUs get the lite budget; everything else gets the full engine.
import type { PlayTier, TierFacts } from "./api.ts";

/** Software rasterisers and pre-2017 mobile GPUs: the 2D view of the same law. */
export const BAD_GPU = /SwiftShader|llvmpipe|softpipe|Microsoft Basic Render|Mali-4\d\d|Mali-T[678]\d\d|Adreno \(TM\) [345]\d\d\b|PowerVR SGX|PowerVR Rogue G[56]\d{3}\b|GE8100|GE8300/i;
/** GPUs that run the engine at the lite budget (DPR 1, fewer particles). */
export const LITE_GPU = /GE8320|Mali-G52 MC1|Mali-G31|Mali-G51|Adreno \(TM\) 6(?:0\d|1[0-3])\b/i;

export function detectTier(f: TierFacts): { tier: PlayTier; why: string } {
  if (f.force === "2d") return { tier: "2d", why: "forced 2d" };
  if (!f.webgl2) return { tier: "2d", why: "no WebGL2" };
  if (f.contextLosses >= 2) return { tier: "2d", why: "context lost twice" };
  if (f.force === "3d" || f.force === "3d-lite") return { tier: f.force, why: `forced ${f.force} (harness)` };
  if (f.majorCaveat) return { tier: "2d", why: "failIfMajorPerformanceCaveat" };
  if (BAD_GPU.test(f.renderer)) return { tier: "2d", why: `known-bad GPU: ${f.renderer}` };
  if (LITE_GPU.test(f.renderer)) return { tier: "3d-lite", why: `lite GPU: ${f.renderer}` };
  if (f.saveData) return { tier: "3d-lite", why: "data saver" };
  if (f.contextLosses === 1) return { tier: "3d-lite", why: "context lost once" };
  return { tier: "3d", why: "default" };
}

let losses = 0;
/** play's WebGL context losses this page session (the stage reports each one) */
export const noteContextLoss = () => { losses++; };
export const contextLosses = () => losses;

/** Facts from this browser (one throwaway WebGL2 context). Never throws. */
export function tierFacts(force: PlayTier | null = null): TierFacts {
  const out: TierFacts = { webgl2: false, majorCaveat: false, renderer: "", saveData: false, contextLosses: losses, force };
  if (typeof document === "undefined") return out;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") as WebGL2RenderingContext | null;
    out.webgl2 = !!gl;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      out.renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) ?? "");
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      const strict = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true }) as WebGL2RenderingContext | null;
      out.majorCaveat = !strict;
      strict?.getExtension("WEBGL_lose_context")?.loseContext();
    }
    out.saveData = !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
  } catch { /* 2d */ }
  return out;
}
