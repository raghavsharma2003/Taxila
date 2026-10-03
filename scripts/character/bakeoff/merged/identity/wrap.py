"""Step 3: wrap OUR MakeHuman basis onto the shape reconstructed from the portraits (runs inside build_look.py, right
after the identity sculpt, before the head scale, face units, visemes, proxies and correctives).

Because the topology never changes, "wrapping" the rigged base is a change of the BASIS: every MakeHuman face unit,
viseme and MHCLO proxy binding is loaded AFTER this point, so all 82 keys are re-expressed on the wrapped basis by
the pipeline itself (their deltas ride on the new rest shape; the tongue extras and correctives are derived later from
the wrapped rig, and the lip seal runs on it). That is deformation transfer at its simplest: per-vertex deltas kept,
frames not rotated. The rotation term matters only where the surface turns a lot, which a <= 10 mm identity change
does not do [U].

Solve:
  1. landmarks on our mesh: S_k = barycentric point of corr.json (MediaPipe landmark k on our topology);
  2. target T_k = the reconstructed 3D landmark, similarity-aligned to S (scale, rotation, shift: our head keeps its size
     and place, the portrait gives the proportions);
  3. contour (face-oval) landmarks constrain only the frontal plane (their depth is a silhouette, not a point);
  4. displacement field d(x): thin-plate RBF through the landmark displacements (landmark-pinned: d(S_k) = T_k - S_k,
     up to a small smoothing), tapered to 0 with distance from the landmark hull and below the jaw (head_weight);
  5. iterate twice: re-sample S on the moved mesh and solve again (the pins close the residual).
"""
import json
import numpy as np
from scipy.interpolate import RBFInterpolator
from scipy.spatial import cKDTree


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def procrustes(A, B, w=None):
    w = np.ones(len(A)) if w is None else w
    w = w / w.sum()
    ma, mb = (A * w[:, None]).sum(0), (B * w[:, None]).sum(0)
    A0, B0 = A - ma, B - mb
    U, S, Vt = np.linalg.svd((B0 * w[:, None]).T @ A0)
    D = np.eye(3); D[2, 2] = np.sign(np.linalg.det(U @ Vt))
    R = U @ D @ Vt
    s = (S * np.diag(D)).sum() / ((A0 ** 2).sum(1) * w).sum()
    return s, R, mb - s * R @ ma


def apply(B, spec, headw, log=print, mir=None):
    """B: (V,3) basis (Blender axes, metres). headw: (V,) 1 on the head, 0 below the throat. Returns (B', report)."""
    C = json.load(open(spec["corr"]))["corr"]
    X = np.array(json.load(open(spec["recon"]))["X"])
    RG = json.load(open(spec["regions"]))
    idx = [k for k in range(468) if C[k] is not None]
    V = np.array([C[k]["vid"] for k in idx]); W = np.array([C[k]["w"] for k in idx])
    oval = np.isin(idx, RG["oval"])
    T0 = np.stack([X[idx, 0], -X[idx, 2], X[idx, 1]], 1)       # (x right=her left, y up, z to camera) -> Blender (x, -z, y)
    gain = float(spec.get("gain", 1.0))
    corr = np.array(json.load(open(spec["correction"]))["mm"])[idx] / 1000 if spec.get("correction") else np.zeros((len(idx), 3))
    rep = {"landmarks": len(idx), "iters": []}
    # The fitted displacement FIELD is symmetrised on the pipeline's topological mirror (keepAsym of its odd part is
    # kept): the portrait's asymmetry is partly generator noise; keys.expression_correctives picks the mouth corner as
    # the extreme-x lip vertex per side, so an asymmetric basis broke G3 (mouthSmile 6.6-7.0 mm, measured); the designed
    # 3-8% asymmetry lives in faceStyle.asym and the seeded identity targets.
    keep = float(spec.get("keepAsym", 0.0))
    Bc = B.copy()
    for it in range(int(spec.get("iters", 2))):
        S = (Bc[V] * W[:, :, None]).sum(1)
        s, R, t = procrustes(T0[~oval], S[~oval])
        T = s * T0 @ R.T + t + corr               # + the closed-loop correction (fitloop.py), metres
        d = (T - S) * gain
        d[oval, 1] = 0.0                                          # contour: frontal plane only
        lim = float(spec.get("maxMm", 12)) / 1000
        n = np.linalg.norm(d, axis=1)
        d *= np.minimum(1, lim / np.maximum(n, 1e-9))[:, None]
        if it == 0:
            RGN = {k: set(v) for k, v in RG.items() if k != "tess" and not k.endswith("_edges")}
            top = np.argsort(-n)[:25]
            rep["largestFirstPass"] = [{"lm": int(idx[j]), "mm": np.round(d[j] * 1000, 1).tolist(),
                                        "region": next((k for k, v in RGN.items() if idx[j] in v), "-")} for j in top]
            rep["meanDispMmByRegion"] = {k: np.round(d[np.isin(idx, list(v))].mean(0) * 1000, 2).tolist() for k, v in RGN.items() if np.isin(idx, list(v)).any()}
        # per-landmark smoothing: eyelids, lips and brows are pinned tighter (the features that read), the rest of the
        # face is a smooth fit (exact interpolation through 468 noisy depths folded the lower cheeks, measured)
        sm = np.full(len(idx), float(spec.get("smoothing", 1e-2)))
        tight = np.isin(idx, sum((RG[k] for k in ("leye", "reye", "lips", "lbrow", "rbrow")), []))
        sm[tight] = float(spec.get("smoothingFeatures", spec.get("smoothing", 1e-2)))
        rb = RBFInterpolator(S, d, kernel="thin_plate_spline", smoothing=sm, degree=1)
        dist, _ = cKDTree(S).query(Bc)
        fall = 1 - smoothstep(float(spec.get("fall0Mm", 8)) / 1000, float(spec.get("fall1Mm", 35)) / 1000, dist)
        wv = fall * headw
        sel = wv > 1e-4
        D = np.zeros_like(Bc)
        D[sel] = rb(Bc[sel]) * wv[sel, None]
        if mir is not None:
            Dm = D[mir] * np.array([-1, 1, 1])
            D = 0.5 * (D + Dm) + keep * 0.5 * (D - Dm)
        Bc = Bc + D
        S2 = (Bc[V] * W[:, :, None]).sum(1)
        res = np.linalg.norm((S2 - T)[~oval], axis=1)
        rep["iters"].append({"scale": round(float(s), 5), "dispMm": {"p50": round(float(np.median(n) * 1000), 2), "p95": round(float(np.percentile(n, 95) * 1000), 2), "max": round(float(n.max() * 1000), 2)},
                             "residualMm": {"p50": round(float(np.median(res) * 1000), 3), "p95": round(float(np.percentile(res, 95) * 1000), 3)},
                             "movedVerts": int(sel.sum()), "vertMoveMaxMm": round(float(np.linalg.norm(D, axis=1).max() * 1000), 2)})
        log(f"wrap iter {it}: landmark disp p50 {np.median(n) * 1000:.2f} mm p95 {np.percentile(n, 95) * 1000:.2f} mm; residual p95 {np.percentile(res, 95) * 1000:.3f} mm; {sel.sum()} verts")
    return Bc, rep
