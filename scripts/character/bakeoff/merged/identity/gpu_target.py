"""GPU identity target for the merged build, behind a flag (scripts/gpu/jobs/face3d -> docs/design/teacher/GPU-JOBS.md).

OFF unless the environment names a downloaded face3d run:

    TAXILA_IDENTITY_TARGET=scripts/gpu/jobs/face3d/runs/<job-id> node scripts/character/bakeoff/merged/build.mjs --looks teal

build.mjs passes its environment to every Blender stage, so nothing else changes. With the flag set:

  shape (wrap.py hook)
    - TAXILA_GPU_LANDMARKS=cpu (default): the landmark target stays the CPU recon (measured better at landmark level,
      GPU-JOBS.md §5.6); the GPU surface is brought into its frame by a 468-landmark similarity and used for the dense
      term only. TAXILA_GPU_LANDMARKS=gpu: `recon` -> <run>/recon.gpu.json (landmarks ray-cast onto the Hunyuan head),
      and the closed-loop `correction` / `profileCorrection` (fitted against the OLD recon) are dropped
      (TAXILA_GPU_KEEP_CORRECTIONS=1 keeps them; re-run fitloop.py / profilefit.py on the new basis);
    - a dense shrink term (`dense_pass`): every skin vertex under the landmark field moves along its normal toward the
      reconstructed surface (<run>/target.npz), clamped (TAXILA_GPU_DENSE_MAX_MM, default 3), smoothed over 6 mm,
      kept off the eye and lip openings, symmetrised on the topological mirror like the landmark field.
      TAXILA_GPU_DENSE=0 turns this term off (landmark target only); TAXILA_GPU_DENSE_WEIGHT (default 1.0) scales it.
  texture (project.py hook), TAXILA_GPU_TEXTURE:
    - `delit` (default): project <run>/refs_delit/<view>.png (Marigold-IID albedo, same pixel grid as the portrait, so
      the portraits' own landmarks.json still applies) instead of the raw portraits;
    - `delit+views` / `raw+views`: also add the GPU renders gpu_q45_* / gpu_profile90_* at TAXILA_GPU_VIEW_WEIGHT (0.3);
    - `raw` or `off`: the portraits as before.

Nothing here runs when TAXILA_IDENTITY_TARGET is unset: both hooks return their input unchanged.
"""
import json
import os

import numpy as np

ENV = "TAXILA_IDENTITY_TARGET"


def active():
    d = os.environ.get(ENV, "").strip()
    if not d:
        return None
    d = os.path.abspath(d)
    if not os.path.exists(os.path.join(d, "recon.gpu.json")):
        raise FileNotFoundError(f"{ENV}={d}: no recon.gpu.json (is this a face3d run directory?)")
    return d


def wrap_spec(spec, log=print):
    """Called at the top of wrap.apply. Mutates and returns `spec` (look['wrap']): build_look.py reads
    profileCorrection from the same dict after the wrap, so dropping it here also disables that stage."""
    d = active()
    if not d:
        return spec
    lm_mode = os.environ.get("TAXILA_GPU_LANDMARKS", "cpu")
    pre = None
    if lm_mode == "gpu":
        spec["recon"] = os.path.join(d, "recon.gpu.json")
    else:
        # keep the CPU landmark recon (it reprojects better onto the portraits, held-out views included: GPU-JOBS.md
        # §5.6) and bring the GPU surface into ITS frame by a similarity over the 468 shared landmark ids
        Xc = np.array(json.load(open(spec["recon"]))["X"])
        Xg = np.array(json.load(open(os.path.join(d, "recon.gpu.json")))["X"])
        pre = _similarity(Xg, Xc, np.ones(len(Xc), bool) if not spec.get("regions") else
                          ~np.isin(np.arange(len(Xc)), json.load(open(spec["regions"]))["oval"]))
    if lm_mode == "gpu" and os.environ.get("TAXILA_GPU_KEEP_CORRECTIONS") != "1":
        for k in ("correction", "profileCorrection"):
            if spec.get(k):
                log(f"gpu target: dropping {k} (fitted against the CPU recon)")
                spec[k] = None
    if os.environ.get("TAXILA_GPU_DENSE", "1") != "0" and os.path.exists(os.path.join(d, "target.npz")):
        spec["dense"] = {"target": os.path.join(d, "target.npz"), "weight": float(os.environ.get("TAXILA_GPU_DENSE_WEIGHT", "1.0")),
                         "maxMm": float(os.environ.get("TAXILA_GPU_DENSE_MAX_MM", "3")), "smoothMm": 6.0, "featureClearMm": 5.0,
                         "tangentialMaxMm": 3.0, "preSimilarity": pre}
    spec["_gpuTarget"] = d
    spec["_gpuLandmarks"] = lm_mode
    log(f"gpu target: landmarks {lm_mode} ({spec['recon']}); dense {'on' if spec.get('dense') else 'off'}")
    return spec


def _similarity(A, B, m):
    """(s, R, t) with s R A + t ~ B over rows m (Umeyama, proper rotation)."""
    A0, B0 = A[m] - A[m].mean(0), B[m] - B[m].mean(0)
    U, S, Vt = np.linalg.svd(B0.T @ A0)
    D = np.eye(3); D[2, 2] = np.sign(np.linalg.det(U @ Vt))
    R = U @ D @ Vt
    s = (S * np.diag(D)).sum() / (A0 ** 2).sum()
    return [float(s), R.tolist(), (B[m].mean(0) - s * R @ A[m].mean(0)).tolist()]


def _normals(P, k=16):
    """Per-point normals from the k-nearest-neighbour PCA, oriented away from the cloud's centroid (face front is
    convex enough for that; the dense term only acts on the face front)."""
    from scipy.spatial import cKDTree
    _, nn = cKDTree(P).query(P, k=k)
    Q = P[nn] - P[nn].mean(1, keepdims=True)
    C = np.einsum("nki,nkj->nij", Q, Q)
    _, vec = np.linalg.eigh(C)
    n = vec[:, :, 0]
    c = P.mean(0)
    n *= np.sign(((P - c) * n).sum(1, keepdims=True) + 1e-12)
    return n


def dense_pass(Bc, spec, sim, S_idx, region_w, mir=None, log=print, feature_pts=None):
    """Bc (V,3) Blender metres after the landmark wrap; sim = (s, R, t) from the last landmark iteration (recon frame
    with the (x, -z, y) axis map -> Blender); region_w (V,) the landmark field's own falloff x head weight.
    Returns (B', report)."""
    from scipy.spatial import cKDTree
    ds = spec["dense"]
    s, R, t = sim
    Z = np.load(ds["target"])
    V0 = Z["V"].astype(np.float64)
    if ds.get("preSimilarity"):                             # GPU frame -> the CPU recon's frame (landmarks = cpu)
        ps, pR, pt = ds["preSimilarity"]
        V0 = ps * V0 @ np.array(pR).T + np.array(pt)
    T0 = np.stack([V0[:, 0], -V0[:, 2], V0[:, 1]], 1)
    Tg = s * T0 @ R.T + t                                   # the reconstructed surface in our frame
    w = region_w * float(ds.get("weight", 1.0))
    if feature_pts is not None and len(feature_pts):        # keep the eye / lip openings to the landmark fit
        dfeat, _ = cKDTree(feature_pts).query(Bc)
        clr = float(ds.get("featureClearMm", 5)) / 1000
        w = w * np.clip((dfeat - clr) / clr, 0, 1)
    sel = np.where(w > 1e-3)[0]
    rep = {"targetVerts": int(len(Tg)), "candidates": int(len(sel))}
    if len(sel) < 50:
        rep["skipped"] = "too few vertices under the field"
        return Bc, rep
    n = _normals(Bc)[sel]
    dist, j = cKDTree(Tg).query(Bc[sel])
    off = Tg[j] - Bc[sel]
    dn = (off * n).sum(1)
    tang = np.linalg.norm(off - dn[:, None] * n, axis=1)
    lim = float(ds.get("maxMm", 3)) / 1000
    ok = tang < float(ds.get("tangentialMaxMm", 3)) / 1000
    dn = np.where(ok, np.clip(dn, -lim, lim), 0.0)
    # smooth the normal offset over the mesh neighbourhood (a Gaussian-weighted average in 3D)
    sm = float(ds.get("smoothMm", 6)) / 1000
    tree = cKDTree(Bc[sel])
    nb = tree.query_ball_point(Bc[sel], sm)
    dsm = np.array([np.average(dn[q], weights=np.exp(-(np.linalg.norm(Bc[sel][q] - Bc[sel][i], axis=1) / (0.5 * sm)) ** 2) * ok[q] + 1e-9)
                    for i, q in enumerate(nb)])
    D = np.zeros_like(Bc)
    D[sel] = dsm[:, None] * n * w[sel, None]
    if mir is not None:
        D = 0.5 * (D + D[mir] * np.array([-1, 1, 1]))
    mv = np.linalg.norm(D, axis=1)
    rep.update({"accepted": int(ok.sum()), "rejectedTangential": int((~ok).sum()),
                "rawNormalOffsetMm": {"p50": round(float(np.median(np.abs((off * n).sum(1)))) * 1000, 2),
                                      "p95": round(float(np.percentile(np.abs((off * n).sum(1)), 95)) * 1000, 2)},
                "moveMm": {"p50": round(float(np.median(mv[sel])) * 1000, 3), "p95": round(float(np.percentile(mv[sel], 95)) * 1000, 3),
                           "max": round(float(mv.max()) * 1000, 3)}})
    log(f"gpu dense pass: {ok.sum()}/{len(sel)} verts accepted; move p95 {rep['moveMm']['p95']} mm, max {rep['moveMm']['max']} mm")
    return Bc + D, rep


def projection_spec(spec, log=print):
    """Called at the top of project.apply with look['projection']; returns a (copied) spec pointing at a merged view
    directory under the run, or `spec` unchanged when the flag is off."""
    d = active()
    mode = os.environ.get("TAXILA_GPU_TEXTURE", "delit")
    if not d or mode in ("raw", "off"):
        return spec
    out = os.path.join(d, f"_proj_{mode.replace('+', '_')}")
    os.makedirs(out, exist_ok=True)
    LM = json.load(open(spec["landmarks"]))
    views = dict(spec["views"])
    used = {}
    for v in views:
        src = os.path.join(spec["dir"], f"{v}.png")
        if mode.startswith("delit") and os.path.exists(os.path.join(d, "refs_delit", f"{v}.png")):
            src = os.path.join(d, "refs_delit", f"{v}.png")
        dst = os.path.join(out, f"{v}.png")
        if os.path.lexists(dst):
            os.remove(dst)
        os.symlink(os.path.abspath(src), dst)
        used[v] = "delit" if "refs_delit" in src else "portrait"
    if mode.endswith("+views"):
        G = json.load(open(os.path.join(d, "views", "landmarks.gpu.json")))
        vw = float(os.environ.get("TAXILA_GPU_VIEW_WEIGHT", "0.3"))
        for v, L in G.items():
            if L and v != "gpu_front":
                dst = os.path.join(out, f"{v}.png")
                if os.path.lexists(dst):
                    os.remove(dst)
                os.symlink(os.path.join(d, "views", f"{v}.png"), dst)
                LM[v] = L
                views[v] = vw
                used[v] = "gpu-render"
    json.dump(LM, open(os.path.join(out, "landmarks.json"), "w"))
    new = dict(spec)
    new.update(dir=out, landmarks=os.path.join(out, "landmarks.json"), views=views, _gpuTexture={"mode": mode, "views": used})
    log(f"gpu target texture ({mode}): {used}")
    return new
