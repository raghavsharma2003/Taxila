#!/usr/bin/env python3
"""Turn a reconstructed head mesh into the identity target the CPU wrap consumes (runs in /opt/venv-mg, or locally).

    python lift.py score --meshes a.ply,b.ply --ref-lm refs/landmarks.json --regions mp_regions.json --out DIR
    python lift.py final --shape best.ply [--textured head_textured.glb] --ref-lm ... --regions ... --out DIR

Renderer: Open3D RaycastingScene (Embree, CPU), orthographic, Y-up, a headlight Lambert term on the mesh's base colour
texture (or grey). Landmarks: MediaPipe Face Landmarker (Apache-2.0, the same float16 v1 model the CPU pipeline pins) on
the render; each landmark pixel is ray-cast back onto the mesh, so the 3D landmark is ON the reconstructed surface (the
CPU fallback's weak point was depth: an orthographic bundle adjustment over 2D portraits).

The front direction is found, not assumed: render at azimuth 0/90/180/270, keep the view where MediaPipe finds a face,
then refine the azimuth by minimising the nose-to-cheek asymmetry (1-234 vs 1-454), coarse 10 deg then fine 2 deg.

Outputs (the contract scripts/character/bakeoff/merged/identity/gpu_target.py reads):
  recon.gpu.json   {"X": 468 x 3 in front-render pixel units, y up, z toward the camera (recon.json's convention),
                    "iodPx", "views", "source", "frontAzimuthDeg", "hitRate"}
  target.npz       V (n x 3, same frame as X), F (m x 3): the dense surface for the wrap's shrink term
  views/*.png + landmarks.gpu.json   renders at yaw 0, +-45, +-90 (landmarks.json format) for optional projection
  likeness.json    per mesh: NME vs the portrait's front landmarks (likeness.py's metric) -> the seed choice
"""
import argparse
import json
import math
import os
import sys
import time

import numpy as np
from PIL import Image

W = 1024


def load_mesh(path):
    import trimesh
    sc = trimesh.load(path, process=False)
    m = sc.dump(concatenate=True) if hasattr(sc, "dump") else sc
    tex, uv = None, None
    vis = getattr(m, "visual", None)
    if vis is not None and getattr(vis, "uv", None) is not None:
        mat = getattr(vis, "material", None)
        img = getattr(mat, "baseColorTexture", None) or getattr(mat, "image", None)
        if img is not None:
            tex = np.asarray(img.convert("RGB")).astype(np.float32) / 255.0
            uv = np.asarray(vis.uv, np.float32)
    return np.asarray(m.vertices, np.float64), np.asarray(m.faces, np.int64), tex, uv


class Scene:
    def __init__(self, V, F, tex=None, uv=None):
        import open3d as o3d
        self.V, self.F, self.tex, self.uv = V, F, tex, uv
        self.s = o3d.t.geometry.RaycastingScene()
        self.s.add_triangles(o3d.core.Tensor(V.astype(np.float32)), o3d.core.Tensor(F.astype(np.uint32)))
        self.c = (V.min(0) + V.max(0)) / 2
        self.R = float(np.linalg.norm(V - self.c, axis=1).max())
        self.o3d = o3d

    def frame(self, az_deg, el_deg=0.0):
        a, e = math.radians(az_deg), math.radians(el_deg)
        f = np.array([math.sin(a) * math.cos(e), math.sin(e), math.cos(a) * math.cos(e)])   # toward the camera
        up0 = np.array([0.0, 1.0, 0.0])
        r = np.cross(up0, f); r /= np.linalg.norm(r)
        u = np.cross(f, r)
        return r, u, f

    def cast(self, origins, d):
        rays = np.concatenate([origins, np.broadcast_to(d, origins.shape)], 1).astype(np.float32)
        out = self.s.cast_rays(self.o3d.core.Tensor(rays))
        return {k: out[k].numpy() for k in ("t_hit", "primitive_ids", "primitive_uvs", "primitive_normals")}

    def ppu(self, scale=1.1):
        return W / (2 * self.R * scale)        # pixels per mesh unit

    def pix_to_origin(self, px, py, az, el=0.0):
        r, u, f = self.frame(az, el)
        k = self.ppu()
        x = (px - W / 2) / k; y = (W / 2 - py) / k
        return self.c + np.outer(x, r) + np.outer(y, u) + f * (3 * self.R), -f

    def render(self, az, el=0.0):
        ys, xs = np.mgrid[0:W, 0:W]
        o, d = self.pix_to_origin(xs.ravel() + 0.5, ys.ravel() + 0.5, az, el)
        h = self.cast(o, d)
        hit = np.isfinite(h["t_hit"])
        n = h["primitive_normals"]
        n = n * np.sign((n * -d).sum(1, keepdims=True) + 1e-9)          # face the camera
        r_, u_, f_ = self.frame(az, el)
        key = f_ + 0.45 * u_ - 0.35 * r_; key /= np.linalg.norm(key)      # key light up-left: brow / nose / lid shadows
        lam = 0.55 * np.clip(n @ key, 0, 1) + 0.45 * np.clip((n * -d).sum(1), 0, 1)
        col = np.full((W * W, 3), 0.55, np.float32)
        if self.tex is not None and hit.any():
            pid = h["primitive_ids"][hit].astype(np.int64)
            b = h["primitive_uvs"][hit]
            tri = self.F[pid]
            w0 = 1 - b[:, 0] - b[:, 1]
            uvh = self.uv[tri[:, 0]] * w0[:, None] + self.uv[tri[:, 1]] * b[:, :1] + self.uv[tri[:, 2]] * b[:, 1:2]
            th, tw = self.tex.shape[:2]
            tx = np.clip((uvh[:, 0] % 1) * (tw - 1), 0, tw - 1).astype(int)
            ty = np.clip((1 - uvh[:, 1] % 1) * (th - 1), 0, th - 1).astype(int)
            base = self.tex[ty, tx]
        else:
            base = np.full((int(hit.sum()), 3), 0.78, np.float32)
        col[hit] = base * (0.3 + 0.7 * lam[hit, None])
        img = (np.clip(col, 0, 1) * 255).astype(np.uint8).reshape(W, W, 3)
        self.last_mask = hit.reshape(W, W)
        return img, float(hit.mean())

    def facing(self, lm2d, az, el=0.0):
        """Fraction of landmark rays that hit a surface whose (unflipped) normal faces the camera."""
        o, d = self.pix_to_origin(lm2d[:, 0], lm2d[:, 1], az, el)
        h = self.cast(o, d)
        ok = np.isfinite(h["t_hit"])
        return float(((h["primitive_normals"][ok] * -d).sum(1) > 0).mean()) if ok.any() else 0.0

    def lift(self, lm2d, az, el=0.0):
        o, d = self.pix_to_origin(lm2d[:, 0], lm2d[:, 1], az, el)
        h = self.cast(o, d)
        t = h["t_hit"]
        P = o + d * t[:, None]
        P[~np.isfinite(t)] = np.nan
        return P


class Landmarker:
    def __init__(self, model):
        import mediapipe as mp
        from mediapipe.tasks import python as mpt
        from mediapipe.tasks.python import vision
        self.mp = mp
        self.det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
            base_options=mpt.BaseOptions(model_asset_path=model), num_faces=1, output_facial_transformation_matrixes=True))

    def _detect(self, img):
        r = self.det.detect(self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=np.ascontiguousarray(img)))
        if not r.face_landmarks:
            return None
        h, w = img.shape[:2]
        return np.array([[p.x * w, p.y * h, p.z * w] for p in r.face_landmarks[0]])

    def __call__(self, img, mask=None):
        """Full frame first; then square crops of the mesh's own silhouette (whole, upper 70%, upper-middle), each
        resized to 768 px, because the face detector misses a face that fills too little of the frame. Landmarks are
        returned in full-frame pixels."""
        L = self._detect(img)
        if L is not None or mask is None or not mask.any():
            return L
        ys, xs = np.where(mask)
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        hgt = y1 - y0
        for top, bot in ((0.0, 1.0), (0.0, 0.7), (0.1, 0.6), (0.15, 0.5)):
            cy0, cy1 = y0 + top * hgt, y0 + bot * hgt
            cx = (x0 + x1) / 2; half = max(cy1 - cy0, (x1 - x0) * (bot - top)) / 2 * 1.15
            cyc = (cy0 + cy1) / 2
            bx0, by0 = int(max(0, cx - half)), int(max(0, cyc - half))
            bx1, by1 = int(min(img.shape[1], cx + half)), int(min(img.shape[0], cyc + half))
            if bx1 - bx0 < 32 or by1 - by0 < 32:
                continue
            crop = Image.fromarray(img[by0:by1, bx0:bx1]).resize((768, 768), Image.LANCZOS)
            Lc = self._detect(np.asarray(crop))
            if Lc is not None:
                sx, sy = (bx1 - bx0) / 768, (by1 - by0) / 768
                return np.stack([Lc[:, 0] * sx + bx0, Lc[:, 1] * sy + by0, Lc[:, 2] * sx], 1)
        return None


def asym(L):
    a, b = np.linalg.norm(L[1, :2] - L[234, :2]), np.linalg.norm(L[1, :2] - L[454, :2])
    return (a - b) / (a + b)


def find_front(sc, lmk, log):
    best = None
    for az in (0, 90, 180, 270):
        img, _ = sc.render(az)
        L = lmk(img, sc.last_mask)
        fr = sc.facing(L[:468], az) if L is not None else 0.0
        log(f"  probe az {az}: {'face' if L is not None else 'no face'}" + (f", asym {asym(L):+.3f}, front-facing hits {fr:.2f}" if L is not None else ""))
        # an open or inverted surface seen from behind shows a MIRRORED face; only outward-facing hits count
        if L is not None and fr >= 0.6 and (best is None or abs(asym(L)) < abs(best[1])):
            best = (az, asym(L))
    if best is None:
        raise RuntimeError("MediaPipe found no face at any azimuth (mesh up-axis not +Y?)")
    az0 = best[0]
    for step, span in ((10, 30), (2, 8)):
        cands = []
        for dz in np.arange(-span, span + 1e-9, step):
            img, _ = sc.render(az0 + dz)
            L = lmk(img, sc.last_mask)
            if L is not None:
                cands.append((abs(asym(L)), az0 + dz))
        if cands:
            az0 = min(cands)[1]
    return float(az0)


def nme(ref, q, oval):
    """likeness.py's metric: 2D similarity-aligned on interior points, % of the outer-eye-corner distance."""
    R, Q = ref[:468, :2], q[:468, :2]
    A, B = Q[~oval], R[~oval]
    ma, mb = A.mean(0), B.mean(0); A0, B0 = A - ma, B - mb
    U, S, Vt = np.linalg.svd(B0.T @ A0); D = np.eye(2); D[1, 1] = np.sign(np.linalg.det(U @ Vt)); Rm = U @ D @ Vt
    s = (S * np.diag(D)).sum() / (A0 ** 2).sum()
    e = np.linalg.norm(s * (Q - ma) @ Rm.T + mb - R, axis=1) / np.linalg.norm(R[33] - R[263]) * 100
    P = lambda X, i, j: float(np.linalg.norm(X[i] - X[j]) / np.linalg.norm(X[33] - X[263]))
    return {"interior": round(float(e[~oval].mean()), 3), "contour": round(float(e[oval].mean()), 3), "all": round(float(e.mean()), 3),
            "ratios": {k: [round(P(R, i, j), 3), round(P(Q, i, j), 3)] for k, (i, j) in
                       {"faceWidth234_454": (234, 454), "noseChin1_152": (1, 152), "mouth61_291": (61, 291), "eyeOpen159_145": (159, 145)}.items()}}


def to_cam(P, sc, az):
    """Mesh units -> recon.json's frame: front-render pixels, y up, z toward the camera."""
    r, u, f = sc.frame(az)
    k = sc.ppu()
    Q = P - sc.c
    return np.stack([W / 2 + (Q @ r) * k, -(W / 2) + (Q @ u) * k, (Q @ f) * k], 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["score", "final"])
    ap.add_argument("--meshes"); ap.add_argument("--shape"); ap.add_argument("--textured")
    ap.add_argument("--ref-lm", required=True); ap.add_argument("--ref-view", default="front")
    ap.add_argument("--regions", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--model", default=os.path.join(os.environ.get("WEIGHTS_DIR", "/opt/weights"), "face_landmarker.task"))
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    log = lambda m: print(f"[lift {time.strftime('%H:%M:%S')}] {m}", flush=True)
    RG = json.load(open(a.regions))
    oval = np.isin(np.arange(468), RG["oval"])
    ref = np.array(json.load(open(a.ref_lm))[a.ref_view]["lm"])
    lmk = Landmarker(a.model)

    if a.mode == "score":
        res = {}
        for mp_ in a.meshes.split(","):
            t0 = time.time()
            sc = Scene(*load_mesh(mp_)[:2])
            try:
                az = find_front(sc, lmk, log)
                img, cov = sc.render(az)
                L = lmk(img, sc.last_mask)
                row = {"frontAzimuthDeg": az, **nme(ref, L, oval)}
                Image.fromarray(img).save(os.path.join(a.out, os.path.basename(mp_).rsplit(".", 1)[0] + "_front.png"))
            except Exception as e:
                row = {"error": str(e)[:200]}
            row["seconds"] = round(time.time() - t0, 1)
            res[os.path.basename(mp_)] = row
            log(f"{os.path.basename(mp_)}: {row}")
        ok = {k: v for k, v in res.items() if "interior" in v}
        best = min(ok, key=lambda k: ok[k]["interior"] + 0.25 * ok[k]["contour"]) if ok else None
        json.dump({"meshes": res, "best": best, "criterion": "front interior NME + 0.25 x contour NME (likeness.py metric)"},
                  open(os.path.join(a.out, "likeness.json"), "w"), indent=1)
        log(f"best: {best}")
        if not best:
            sys.exit(2)
        open(os.path.join(a.out, "best.txt"), "w").write(best)
        return

    # ---- final: geometry target from the raw shape, views from the textured mesh
    V, F, _, _ = load_mesh(a.shape)
    sc = Scene(V, F)
    az = find_front(sc, lmk, log)
    img, cov = sc.render(az)
    L = lmk(img, sc.last_mask)
    P = sc.lift(L[:468], az)
    hit = np.isfinite(P).all(1)
    for k in np.where(~hit)[0]:                       # a landmark ray that missed (silhouette): nearest surface point
        o, d = sc.pix_to_origin(L[k:k + 1, 0], L[k:k + 1, 1], az)
        q = sc.s.compute_closest_points(sc.o3d.core.Tensor((o + d * 3 * sc.R).astype(np.float32)))["points"].numpy()
        P[k] = q[0]
    X = to_cam(P, sc, az)
    rec = {"X": np.round(X, 3).tolist(), "iodPx": round(float(np.linalg.norm(X[33, :2] - X[263, :2])), 2), "views": ["gpu_front"],
           "source": {"shape": os.path.basename(a.shape), "method": "MediaPipe on an orthographic render, ray-cast onto the mesh"},
           "frontAzimuthDeg": az, "hitRate": round(float(hit.mean()), 4), "likenessFront": nme(ref, L, oval),
           "convention": "front-render pixel units, y up, z toward the camera (recon.json)"}
    json.dump(rec, open(os.path.join(a.out, "recon.gpu.json"), "w"))
    np.savez_compressed(os.path.join(a.out, "target.npz"), V=to_cam(V, sc, az).astype(np.float32), F=F.astype(np.int32),
                        ppu=np.float32(sc.ppu()))
    log(f"recon.gpu.json: {hit.sum()}/468 rays hit; front NME {rec['likenessFront']['interior']}% interior")
    # views (textured if given) for optional extra projection views
    if a.textured:
        Vt, Ft, tex, uv = load_mesh(a.textured)
        st = Scene(Vt, Ft, tex, uv)
        azt = find_front(st, lmk, log)
    else:
        st, azt = sc, az
    os.makedirs(os.path.join(a.out, "views"), exist_ok=True)
    lmj = {}
    for name, dz in (("gpu_front", 0), ("gpu_q45_left", 45), ("gpu_q45_right", -45), ("gpu_profile90_left", 90), ("gpu_profile90_right", -90)):
        im, _ = st.render(azt + dz)
        Image.fromarray(im).save(os.path.join(a.out, "views", f"{name}.png"))
        Lv = lmk(im, st.last_mask)
        lmj[name] = None if Lv is None else {"w": W, "h": W, "lm": np.round(Lv, 3).tolist(), "M": None, "blend": {}}
    json.dump(lmj, open(os.path.join(a.out, "views", "landmarks.gpu.json"), "w"))
    log(f"views: {[k for k, v in lmj.items() if v]} with landmarks")


if __name__ == "__main__":
    main()
