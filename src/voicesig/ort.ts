// The filler detector's runtime (ship5 p3-voicesig; onnxruntime-web approved by the owner, decision owner-ship-five-2026-10-05).
// Loaded LAZILY, once, after the shared tap is live: the WASM build of onnxruntime-web (no WebGPU, one thread: the page is
// not cross-origin isolated) and the 45 KB AMI-trained graph (models/voicesig/filler-gru.onnx, CC BY 4.0; attribution in
// the model card). Both are same-origin assets of this build: no CDN, no third-party AI API, nothing leaves the device.
// Skipped on Save-Data / 2G (the runtime is ~3.7 MB gzip): the head then runs at stage 0, which is the shadow-safe floor.
import * as ort from "onnxruntime-web/wasm";
import fillerUrl from "../../models/voicesig/filler-gru.onnx?url";
import card from "../../models/voicesig/filler-gru.json";
import { loadFillerModel, type FillerModel } from "./head.ts";
import type { OrtLike } from "./frontend/encoder.ts";

let once: Promise<FillerModel | null> | null = null;

/** Whether this device should fetch the runtime at all (Save-Data, 2G → no). */
export function detectorAllowed(nav: { connection?: { saveData?: boolean; effectiveType?: string } } | undefined = typeof navigator !== "undefined" ? (navigator as never) : undefined): boolean {
  const c = nav?.connection;
  if (c?.saveData) return false;
  return !(c?.effectiveType && /(^|-)2g$/.test(c.effectiveType));
}

export function loadFillerDetector(): Promise<FillerModel | null> {
  if (once) return once;
  once = (async () => {
    if (!detectorAllowed()) return null;
    try {
      ort.env.wasm.numThreads = 1;
      const res = await fetch(fillerUrl);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      return await loadFillerModel(ort as unknown as OrtLike, bytes, card.threshold, card.ver);
    } catch {
      return null;
    }
  })();
  return once;
}
