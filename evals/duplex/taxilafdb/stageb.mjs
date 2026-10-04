// Stage B in the TaxilaFDB simulator: the trained fusion head (scripts/duplex/train_stageb.py → models/duplex/cce-stageb-*.json)
// run in plain JS over the LIVE tick's feature vector (features.ts) plus the Smart Turn v3.2 encoder embedding of the audio
// window ending at the tick (computed once per stream on ACA by scripts/duplex/st_features.py, read causally: the newest
// grid tick <= t, at most 400 ms old, else the model gets the audio-missing flag). Numerically the same graph as the
// exported ONNX head (parity checked by tests/duplex-engine-model.test.mjs on 64 held-out ticks).
// It plugs into the shipped adapter unchanged: a FloorModel → TrainedEngine (adapter.ts) → the same governor.
import fs from "node:fs";
import path from "node:path";
import { FEATURE_SPEC } from "../../../src/duplex/features.ts";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
export const STAGEB_VERSION = "2026-10-04.1";
export const stagebPath = (v = STAGEB_VERSION) => path.join(ROOT, `models/duplex/cce-stageb-${v}.json`);

// erf (Abramowitz & Stegun 7.1.26, |error| < 1.5e-7) for PyTorch's exact GELU
function erf(x) {
  const s = x < 0 ? -1 : 1; const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
const gelu = (x) => 0.5 * x * (1 + erf(x / Math.SQRT2));
const sig = (z) => 1 / (1 + Math.exp(-z));

function dense(W, b, x, act) {
  const out = new Float64Array(W.length);
  for (let i = 0; i < W.length; i++) { let s = b[i]; const w = W[i]; for (let j = 0; j < x.length; j++) s += w[j] * x[j]; out[i] = act ? gelu(s) : s; }
  return out;
}

/** The fusion head as a pure function: (features, emb|null, stLogit, missing) → [pComplete, pHold]. */
export function makeHead(manifest) {
  const W = manifest.weights, names = manifest.featureNames, EX = manifest.exchanges;
  const ex0 = names.indexOf("exchange.closed_answer");
  const mu = W.mu, sd = W.sd;
  return function head(features, emb, stLogit, missing) {
    const F = features.length;
    const xf = new Float64Array(F);
    for (let i = 0; i < F; i++) xf[i] = (features[i] - mu[i]) / sd[i];
    const hf = dense(W["f.0.weight"], W["f.0.bias"], xf, true);
    const ha = missing ? new Float64Array(32) : dense(W["a.0.weight"], W["a.0.bias"], emb, true);
    const cat = new Float64Array(64 + 32 + 2);
    cat.set(hf, 0); cat.set(ha, 64); cat[96] = missing ? 0 : stLogit; cat[97] = missing ? 1 : 0;
    const h1 = dense(W["h.0.weight"], W["h.0.bias"], cat, true);
    const z = dense(W["h.2.weight"], W["h.2.bias"], h1, false);
    let any = 0; const a = [0, 0], b = [0, 0];
    for (let k = 0; k < EX.length; k++) { const o = features[ex0 + k]; any += o; for (let h = 0; h < 2; h++) { a[h] += o * W.cal_a[k][h]; b[h] += o * W.cal_b[k][h]; } }
    if (!any) { a[0] = a[1] = 1; }
    return [sig(z[0] * a[0] + b[0]), sig(z[1] * a[1] + b[1])];
  };
}

export function loadManifest(v = STAGEB_VERSION) {
  const m = JSON.parse(fs.readFileSync(stagebPath(v), "utf8"));
  if (m.featureSpec !== FEATURE_SPEC) throw new Error(`stage B ${v}: feature spec ${m.featureSpec} != ${FEATURE_SPEC}`);
  return m;
}

/**
 * The arm's model factory for world.mjs: one FloorModel per stream; `rec.now` is the world clock at the tick that asked.
 * Inference cost is modelled by the adapter (the result lands on the next tick).
 */
export function loadStageB({ store, version = STAGEB_VERSION } = {}) {
  const manifest = loadManifest(version);
  const head = makeHead(manifest);
  return ({ d, rec }) => ({
    id: "cce-stageb", version: manifest.version, featureSpec: manifest.featureSpec, audioMs: 0,
    async run(features) {
      const e = store && manifest.useAudio !== false ? store.emb(d.id, rec.now ?? 0) : null;
      const stLogit = e ? Math.log(Math.min(0.9999, Math.max(1e-4, e.p)) / (1 - Math.min(0.9999, Math.max(1e-4, e.p)))) : 0;
      const [pComplete, pHoldWanted] = head(features, e ? e.v : null, stLogit, !e);
      return { pComplete, pHoldWanted };
    },
  });
}
