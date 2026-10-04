#!/usr/bin/env python3
"""Arm B build: our topology wrapped onto the AI sculpt target, plus eyes, lids, brows, lashes, mouth interior, ears,
hair, bust; then the shape rig bake (shapes.py) and the GLB export.

    python build.py --target BUILD/target.npz --out BUILD/stage.blend [--cfg cfg.json]

Every shipped vertex is ours: skin = our template (template.py) placed by rays onto the sculpt; hair / bust = remeshed
(voxel + decimate) from the sculpt's labelled regions, i.e. new vertices fitted to the target surface (TECH-PLAN 1.3:
QuadriFlow / remesh fallback for hair). The AI mesh itself never ships.
"""
import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import lib as L  # noqa: E402
import skin as SK  # noqa: E402
from template import Skin  # noqa: E402

DEG = np.pi / 180
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))


def load_target(path, lm2_path):
    z = np.load(path)
    meta = json.load(open(path.replace(".npz", ".json")))
    lm2 = json.load(open(lm2_path))
    T = {k: z[k] for k in ("V", "F", "C", "label")}
    T["V"] = T["V"].astype(float)
    T["K"] = meta["K"]
    T["lm2raw"] = lm2
    T["lm2"], xm = SK.symmetric_lm2(lm2)
    # recentre the sculpt on the face midline (x = 0)
    dx = (xm - 512) * T["K"]
    T["V"][:, 0] -= dx
    T["x0"] = dx
    T["xm"] = xm
    T["bvh0"] = L.bvh_from_np(T["V"], T["F"])
    T["bvh"] = T["bvh0"]
    # per-face label = majority of its vertex labels
    lab = T["label"][T["F"]]
    T["flabel"] = np.array([np.bincount(r, minlength=6).argmax() for r in lab])
    return T


def warp_target(T, cfg):
    """concept-matching space warp of the target's lower face (measured on the c-front overlay): the AI sculpt's jaw is
    longer and its lower cheeks narrower than the concept. Chin up by cfg chin_up (m), lower cheeks wider by cheek_wide."""
    lm2 = T["lm2"]
    W0 = SK.Wrap(T, {"axis_y": 0, "axis_z": 0})
    P, ok, _ = W0.front_hit(np.array([lm2["mouth"]["line"], lm2["chin"], lm2["nose"]["tip"]]))
    zm, zc, zn = P[0, 2], P[1, 2], P[2, 2]
    V = T["V"]
    yfront = np.percentile(V[:, 1], 1)
    front = L.smoothstep(yfront + 0.085, yfront + 0.035, V[:, 1])
    t = (zm - V[:, 2]) / max(zm - zc, 1e-6)
    up = cfg["chin_up"] * L.smoothstep(-0.6, 1.0, t) * (1 - L.smoothstep(1.2, 2.4, t)) * front
    zmid = 0.5 * (zn + zc)
    bump = np.exp(-((V[:, 2] - zmid) / 0.035) ** 2) * front
    V = V.copy()
    V[:, 2] += up
    V[:, 0] *= 1 + cfg["cheek_wide"] * bump
    V[:, 1] -= cfg["cheek_full"] * bump * L.smoothstep(0.02, 0.05, np.abs(V[:, 0]))
    tip = P[2]
    dn = np.linalg.norm(V - tip, axis=1)
    V[:, 1] += cfg["nose_back"] * np.exp(-(dn / 0.013) ** 2) * front
    T["V"] = V
    T["bvh"] = L.bvh_from_np(V, T["F"])


def default_cfg(T, W0):
    """cfg derived from the target: the head axis, the face rows."""
    lm2 = T["lm2"]
    Pe, ok, _ = W0.front_hit(np.array([lm2["eyeL"]["iris"], lm2["chin"], lm2["nose"]["tip"]]))
    eye_z = Pe[0, 2]
    V = T["V"]
    band = (np.abs(V[:, 2] - eye_z) < 0.006) & (np.abs(V[:, 0]) < 0.01)
    y_front, y_back = V[band, 1].min(), V[band, 1].max()
    return {
        "axis_y": float(y_front + 0.47 * (y_back - y_front)), "axis_z": float(eye_z - 0.012),
        "nu": 60, "eye_block": [10, 8], "mouth_block": [12, 6], "eye_rings": 4, "mouth_rings": 5,
        "e_rows": [84, 76, 68, 61, 54, 48, 43] + list(np.round(np.arange(39.0, -58.0, -2.7), 2)),
        "n_bridge": 3, "n_neck": 6,
        "eye_scales": [[1.75, 1.95, 3.0], [1.42, 1.55, 3.5], [1.16, 1.22, 2.0], [1.0, 1.0, 0.0]],
        "mouth_spec": [[1.9, 1.75, 14.0], [1.0, 1.0, 5.0], [0.62, 0.66, 3.0], [0.28, 0.3, 1.5], [0.0, 0.0, 0.0]],
        "chin_up": 0.010, "cheek_wide": 0.085, "cheek_full": 0.004, "nose_back": 0.0035,
        "eyeball_r_frac": 0.60, "eyeball_back": 0.80, "hair_in": 0.010, "cloth_in": 0.008,
    }


def build_skin(T, cfg):
    W = SK.Wrap(T, cfg)
    lm2 = T["lm2"]
    e_face = np.array(cfg["e_rows"]) * DEG
    nf = len(e_face)
    nrows = nf + cfg["n_bridge"] + cfg["n_neck"]
    S = Skin([(0, 0)] * nrows, nu=cfg["nu"], eye_block=tuple(cfg["eye_block"]), mouth_block=tuple(cfg["mouth_block"]))
    eW, eH = cfg["eye_block"]; mW, mH = cfg["mouth_block"]

    def col_of(u):
        k = int(np.argmin(np.abs(((S.u - u) + np.pi) % (2 * np.pi) - np.pi)))
        return k if k <= S.nu // 2 else k - S.nu

    row_of = lambda e: int(np.argmin(np.abs(e_face - e)))
    PiL, _, _ = W.front_hit(np.array([lm2["eyeL"]["iris"]]))
    uL, eL = W.dom_of(PiL)
    k0L = col_of(uL[0]) - eW // 2
    j0e = row_of(eL[0]) - eH // 2
    rings, removed, tgt = {}, set(), {}
    nE = 2 * eW + 2 * eH
    for side, k0 in (("L", k0L), ("R", -(k0L + eW))):
        bnd = S.block_boundary(k0, j0e, eW, eH)
        removed |= S.block_cells(k0, j0e, eW, eH)
        rr = S.make_rings(bnd, cfg["eye_rings"])
        rr.append(S.extrude_ring(rr[-1], "lining"))
        rr.append(S.extrude_ring(rr[-1], "lining"))
        rings["eye" + side] = rr
        tg, split = SK.ring_targets_eye(lm2["eye" + side], nE, eW, eH, cfg["eye_scales"])
        tgt["eye" + side] = tg
        rings["eye" + side + "_split"] = split
    Pm, _, _ = W.front_hit(np.array([lm2["mouth"]["line"]]))
    um, em = W.dom_of(Pm)
    k0m = -(mW // 2); j0m = row_of(em[0]) - mH // 2
    bnd = S.block_boundary(k0m, j0m, mW, mH)
    removed |= S.block_cells(k0m, j0m, mW, mH)
    rr = S.make_rings(bnd, cfg["mouth_rings"])
    for _ in range(4):
        rr.append(S.extrude_ring(rr[-1], "bag"))
    rings["mouth"] = rr
    rings["mouth_cap"] = S.cap_ring(rr[-1], "bag")
    nM = 2 * mW + 2 * mH
    tg, split = SK.ring_targets_mouth(lm2["mouth"], nM, mW, mH, cfg["mouth_spec"])
    tgt["mouth"] = tg
    rings["mouth_split"] = split
    S.finalize_grid(removed)
    nv = len(S.verts)
    F = S.faces
    nb = SK.adjacency(nv, F)
    kind = np.array(S.kind)

    # ---------------- domain coords: grid (u, e) for face rows; ring targets from their px via front rays
    D = np.zeros((nv, 2)); fixed = np.zeros(nv, bool)
    P = np.zeros((nv, 3)); placed = np.zeros(nv, bool)
    for j in range(nf):
        for i in range(S.nu):
            D[S.gid[i, j]] = (S.u[i], e_face[j])
    pxT = {}
    for name in ("eyeL", "eyeR", "mouth"):
        for m, R in enumerate(tgt[name], start=1):
            ids = rings[name][m]
            Ph, ok, _ = W.front_hit(R)
            if not ok.all():
                raise RuntimeError(f"{name} ring {m}: {int((~ok).sum())} front rays missed")
            u, e = W.dom_of(Ph)
            D[ids] = np.stack([u, e], 1); fixed[ids] = True
            P[ids] = Ph; placed[ids] = True
            for q, p in zip(ids, R):
                pxT[q] = p
    face_grid = np.zeros(nv, bool)
    for j in range(1, nf - 1):
        for i in range(S.nu):
            if abs(S.u[i]) < 100 * DEG:
                face_grid[S.gid[i, j]] = True
    used = np.array([len(x) > 0 for x in nb])
    free = face_grid & ~fixed & used
    D = SK.laplacian_relax(D, nb, free, 60, 0.5)

    # ---------------- 3D: rays from the axis for every face-grid vertex
    gid_face = np.array([S.gid[i, j] for j in range(nf) for i in range(S.nu)])
    Ph, ok, fi, Dir = W.ray_dom(D[gid_face, 0], D[gid_face, 1])
    if not ok.all():
        print(f"[skin] {int((~ok).sum())} face rays missed (filled from neighbours)")
    P[gid_face[ok]] = Ph[ok]; placed[gid_face[ok]] = True
    hitlab = np.full(nv, -1)
    hitlab[gid_face[ok]] = T["flabel"][fi[ok]]
    _, _, fr = W.front_hit(np.array(list(pxT.values())))
    hitlab[list(pxT.keys())] = T["flabel"][fr]
    S.pole_dir = None
    P[S.pole] = W.c + np.array([0, 0, 1.0]) * np.linalg.norm(P[S.gid[:, 0]] - W.c, axis=1).mean()
    placed[S.pole] = True; hitlab[S.pole] = 1

    # ---------------- eyeballs (mirror-symmetric): radius from the opening width, centre behind the sculpt's eye surface
    eyes = {}
    for side in ("L", "R"):
        E2 = lm2["eye" + side]
        a3 = np.array([(E2["outer"][0] - 512) * T["K"] - T["x0"], 0, (1024 - E2["outer"][1]) * T["K"]])
        b3 = np.array([(E2["inner"][0] - 512) * T["K"] - T["x0"], 0, (1024 - E2["inner"][1]) * T["K"]])
        w_open = abs(a3[0] - b3[0])
        r = cfg["eyeball_r_frac"] * w_open
        Pi, ok, _ = W.front_hit(np.array([E2["iris"]]))
        ctr = np.array([Pi[0, 0], Pi[0, 1] + r * cfg["eyeball_back"], Pi[0, 2]])
        eyes[side] = {"C": ctr, "r": r}
    cL, cR = eyes["L"]["C"], eyes["R"]["C"]
    cs = (cL + cR * np.array([-1, 1, 1])) / 2
    eyes["L"]["C"] = cs; eyes["R"]["C"] = cs * np.array([-1, 1, 1])
    for side in ("L", "R"):
        E = eyes[side]; C, r = E["C"], E["r"]
        rr = rings["eye" + side]
        lm_, rm_, upper, lower = rings["eye" + side + "_split"]
        nR = len(rr[0])
        # margin (ring 4): front rays onto the ball at 1.03 r (closest approach if a ray passes outside)
        tg = tgt["eye" + side]
        def onto_sphere(px, rad):
            xz = np.stack([(px[:, 0] - 512) * T["K"] - T["x0"], (1024 - px[:, 1]) * T["K"]], 1)
            dx = xz[:, 0] - C[0]; dz = xz[:, 1] - C[2]
            q = rad ** 2 - dx ** 2 - dz ** 2
            y = C[1] - np.sqrt(np.maximum(q, 0))
            Pq = np.stack([xz[:, 0], y, xz[:, 1]], 1)
            far = q < 0
            if far.any():                        # outside the silhouette: put it on the sphere's rim, slightly back
                v = Pq[far] - C; v[:, 1] = 0
                v = v / np.linalg.norm(v, axis=1)[:, None]
                Pq[far] = C + v * rad
            return Pq
        Pm4 = onto_sphere(tg[-1], r * 1.03)
        P[rr[4]] = Pm4
        # rings 3..1 keep their sculpt hits but stay outside the ball
        for m, mult in ((3, 1.075), (2, 1.11), (1, 1.12)):
            ids = np.array(rr[m]); v = P[ids] - C; d = np.linalg.norm(v, axis=1)
            push = d < r * mult
            P[ids[push]] = C + v[push] / d[push, None] * r * mult
        # ring 3 = the lid rim: ride the ball just outside the margin, so the lid reads as a thick soft roll
        Pm3 = onto_sphere(tg[-2], r * 1.075)
        P[rr[3]] = 0.65 * Pm3 + 0.35 * P[rr[3]]
        # lining rings 5, 6: rotate the margin away from the opening, along the ball (hidden under the lid)
        opening = Pm4.mean(0) - C; opening /= np.linalg.norm(opening)
        for m, deg, rad in ((5, 5.0, 1.006), (6, 18.0, 0.965)):
            v = Pm4 - C
            vn = v / np.linalg.norm(v, axis=1)[:, None]
            axis = np.cross(opening, vn); axis /= np.maximum(np.linalg.norm(axis, axis=1)[:, None], 1e-9)
            a = np.radians(deg)
            rot = vn * np.cos(a) + np.cross(axis, vn) * np.sin(a) + axis * (axis * vn).sum(1)[:, None] * (1 - np.cos(a))
            P[rr[m]] = C + rot * r * rad
            placed[rr[m]] = True
        E["axis"] = np.array([1.0, 0, 0])
        E["rings"] = rr; E["split"] = (lm_, rm_, upper, lower)

    # ---------------- mouth interior: inner lip, then the bag (3D-placed, behind the lip line)
    rr = rings["mouth"]
    lm_, rm_, upper, lower = rings["mouth_split"]
    L5 = P[rr[5]].copy()
    ax = 0.5 * abs(L5[rm_, 0] - L5[lm_, 0])
    sgn = np.zeros(len(L5)); sgn[upper] = 1; sgn[lower] = -1
    P[rr[5]] = L5 + np.stack([np.zeros(len(L5)), np.zeros(len(L5)), sgn * 0.00012], 1)
    ctr = L5.mean(0)
    for m, back, spread, xs in ((6, 0.12, 0.05, 1.0), (7, 0.45, 0.30, 0.88), (8, 0.95, 0.48, 0.72), (9, 1.35, 0.36, 0.45)):
        Q = L5.copy()
        Q[:, 0] = ctr[0] + (Q[:, 0] - ctr[0]) * xs
        Q[:, 1] += back * ax
        Q[:, 2] = ctr[2] + (Q[:, 2] - ctr[2]) * 0.6 + sgn * spread * ax
        P[rr[m]] = Q; placed[rr[m]] = True
    P[rings["mouth_cap"]] = ctr + np.array([0, 1.5 * ax, 0]); placed[rings["mouth_cap"]] = True
    fwd = np.array([0, -1.0, 0])
    for m_, f_up, f_lo in ((2, 0.0003, 0.0005), (3, 0.0008, 0.0013), (4, 0.0007, 0.0011)):
        ids = np.asarray(rr[m_])
        sg_ = np.zeros(len(ids)); sg_[upper] = f_up; sg_[lower] = f_lo; sg_[[lm_, rm_]] = 0.0
        P[ids] += fwd * sg_[:, None]
    mouth = {"ax": ax, "line": L5, "split": rings["mouth_split"], "rings": rr, "cap": rings["mouth_cap"]}

    # ---------------- hair: the skin under the sculpt's hair dives inward (hidden scalp), blended across the hairline
    hair = (hitlab == 1).astype(float)
    hair[hitlab < 0] = 0
    h = hair.copy()
    gridmask = (kind == "grid") | (kind == "pole")
    for _ in range(3):
        h = np.where(gridmask, np.array([h[nb[i]].mean() if len(nb[i]) else h[i] for i in range(nv)]) * 0.5 + h * 0.5, h)
    # smooth skull under the hair and over the ears: Laplacian fill of the ray radius with the clean skin fixed
    ear = np.zeros(nv, bool)
    for j in range(nf):
        for i in range(S.nu):
            if 62 * DEG < abs(S.u[i]) < 125 * DEG and -45 * DEG < e_face[j] < 22 * DEG:
                ear[S.gid[i, j]] = True
    soft = gridmask & used & ((h > 0.05) | ear) & np.isin(np.arange(nv), gid_face)
    rad = np.linalg.norm(P - W.c, axis=1)
    rfill = rad.copy()
    idx = np.nonzero(soft)[0]
    for _ in range(300):
        rfill[idx] = np.array([rfill[nb[i]].mean() for i in idx])
    rfill[idx] = np.minimum(rfill[idx], rad[idx])
    dn0 = (P - W.c) / np.maximum(rad[:, None], 1e-9)
    P[idx] = W.c + dn0[idx] * rfill[idx, None]
    dirs = P - W.c
    dn = dirs / np.maximum(np.linalg.norm(dirs, axis=1)[:, None], 1e-9)
    inw = cfg["hair_in"] * L.smoothstep(0.3, 0.8, h) * gridmask
    P = P - dn * inw[:, None]

    # ---------------- neck rows (horizontal rays from the neck axis) and bridge rows (under the chin)
    V = T["V"]; lab = T["label"]
    chin3, _, _ = W.front_hit(np.array([lm2["chin"]]))
    zc = chin3[0, 2]
    nbr, nnk = cfg["n_bridge"], cfg["n_neck"]
    z_top, z_bot = zc - 0.022, zc - 0.075
    slab = (np.abs(V[:, 2] - (z_top - 0.01)) < 0.004) & (lab == 0)
    sl2 = slab & (np.abs(V[:, 0]) < 0.01)
    ncy = float(V[sl2, 1].min() + 0.92 * cfg.get("neck_a", 0.040)) if sl2.sum() > 5 else W.c[1]
    neck_rows = list(range(nf + nbr, nf + nbr + nnk))
    for r_i, j in enumerate(neck_rows):
        z = z_top + (z_bot - z_top) * r_i / max(1, nnk - 1)
        Dn = np.stack([np.sin(S.u), -np.cos(S.u), np.zeros(S.nu)], 1)
        O = np.tile([0, ncy, z], (S.nu, 1))
        Ph, ok, fi = L.raycast(W.bvh, O, Dn)
        rad = np.linalg.norm((Ph - O)[:, :2], axis=1)
        good = ok & (T["flabel"][np.maximum(fi, 0)] == 0)
        # neck = an ellipse (the sculpt's neck is fused with the bun and collar): half-width from the front-ortho refs
        a_ = cfg.get("neck_a", 0.040) * (1 + 0.10 * r_i / max(1, nnk - 1)); b_ = a_ * 0.92
        ell = 1 / np.sqrt((Dn[:, 0] / a_) ** 2 + (Dn[:, 1] / b_) ** 2)
        use = ell.copy()
        inside = T["flabel"][np.maximum(fi, 0)] >= 2
        use = np.where(inside & ok, np.minimum(use, rad) - cfg["cloth_in"], use)
        for i in range(S.nu):
            P[S.gid[i, j]] = O[i] + Dn[i] * use[i]
            placed[S.gid[i, j]] = True
    last = nf - 1; first_neck = nf + nbr
    for i in range(S.nu):
        A = P[S.gid[i, last]]; B = P[S.gid[i, first_neck]]
        tA = A - P[S.gid[i, last - 1]]; tA = tA / max(np.linalg.norm(tA), 1e-9)
        tB = P[S.gid[i, first_neck + 1]] - B; tB = tB / max(np.linalg.norm(tB), 1e-9)
        Ls = np.linalg.norm(B - A)
        for k in range(nbr):
            t = (k + 1) / (nbr + 1)
            h00, h10, h01, h11 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t, -2 * t**3 + 3 * t**2, t**3 - t**2
            Q = h00 * A + h10 * tA * Ls + h01 * B + h11 * tB * Ls
            P[S.gid[i, nf + k]] = Q; placed[S.gid[i, nf + k]] = True
    br = np.array([S.gid[i, nf + k] for k in range(nbr) for i in range(S.nu)])
    Qn, Nn, fi_b, _ = L.nearest(W.bvh, P[br])
    keep = T["flabel"][fi_b] == 0
    P[br[keep]] = 0.5 * P[br[keep]] + 0.5 * Qn[keep]

    # ---------------- twins + exact mirror symmetry (G3)
    twin = np.arange(nv)
    for j in range(S.nr):
        for i in range(S.nu):
            twin[S.gid[i, j]] = S.gid[(-i) % S.nu, j]
    def mirror_map(split, n):
        lm_, rm_, upper, lower = split
        mp = np.arange(n)
        mp[lm_], mp[rm_] = rm_, lm_
        mp[upper] = upper[::-1]; mp[lower] = lower[::-1]
        return mp
    rL, rR = rings["eyeL"], rings["eyeR"]
    mp = mirror_map(rings["eyeL_split"], len(rL[0]))
    for m in range(1, len(rL)):
        for p in range(len(mp)):
            twin[rL[m][p]] = rR[m][mp[p]]; twin[rR[m][mp[p]]] = rL[m][p]
    rm = rings["mouth"]
    mp = mirror_map(rings["mouth_split"], len(rm[0]))
    for m in range(1, len(rm)):
        for p in range(len(mp)):
            twin[rm[m][p]] = rm[m][mp[p]]
    assert (twin[twin] == np.arange(nv)).all(), "twin map is not an involution"
    Pm = P[twin] * np.array([-1, 1, 1])
    P = 0.5 * (P + Pm)
    mid = twin == np.arange(nv)
    P[mid, 0] = 0.0

    # neck + bridge rows: relax the creases left by the ellipse / Hermite rows
    nk = np.array([S.gid[i, j] for j in range(nf - 2, S.nr - 1) for i in range(S.nu)])
    for _ in range(10):
        P[nk] = 0.5 * P[nk] + 0.5 * np.array([P[nb[i]].mean(0) for i in nk])
    # the sculpt carries its painted brows as bumps: smooth them away (our brows are their own meshes)
    xm_, K_ = T["xm"], T["K"]
    pxy = np.stack([(P[:, 0] + T["x0"]) / K_ + 512, 1024 - P[:, 2] / K_], 1)
    band = np.zeros(nv, bool)
    for S_ in ("L", "R"):
        Bq = lm2["brow" + S_]
        cen = SK.resample(SK.through3(Bq["inner"], Bq["peak"], Bq["outer"], 60), 60)
        dmin = np.min(np.linalg.norm(pxy[:, None, :] - cen[None, :, :], axis=2), axis=1)
        band |= dmin < Bq["thick"] * 1.6
    band &= (P[:, 1] < W.c[1]) & used & gridmask
    for m_ in range(2, 7):
        for S_ in ("L", "R"):
            band[np.asarray(rings["eye" + S_][m_])] = False
    idx = np.nonzero(band)[0]
    for _ in range(12):
        P[idx] = 0.5 * P[idx] + 0.5 * np.array([P[nb[i]].mean(0) for i in idx])
    P[~used] = W.c
    out = dict(hidden=(inw > 0.85 * cfg["hair_in"]), used=used, twin=twin, eyes=eyes, mouth=mouth, S=S, W=W, P=P, placed=placed, hitlab=hitlab, rings=rings, nb=nb, kind=kind, D=D, pxT=pxT, nf=nf,
               e_face=e_face, F=F, j0e=j0e, k0L=k0L, j0m=j0m)
    return out


SKIN = np.array([232, 140, 78]) / 255
LIP = np.array([196, 104, 76]) / 255
BAG = np.array([70, 22, 20]) / 255


def skin_colours(R):
    """vertex colours: skin, lips by mouth ring, dark bag, soft blush on the cheeks, darker lower lash line."""
    P = R["P"]; n = len(P)
    C = np.tile(SKIN, (n, 1))
    rr = R["mouth"]["rings"]
    for m, w in ((2, 0.55), (3, 1.0), (4, 1.0), (5, 1.0), (6, 0.8)):
        C[rr[m]] = C[rr[m]] * (1 - w) + LIP * w
    for m in range(7, len(rr)):
        C[rr[m]] = BAG
    C[R["mouth"]["cap"]] = BAG
    for side in ("L", "R"):
        E = R["eyes"][side]
        lm_, rm_, upper, lower = E["split"]
        for m, w in ((4, 0.55), (3, 0.25)):
            ids = np.array(E["rings"][m])[lower]
            C[ids] = C[ids] * (1 - w) + np.array([0.33, 0.16, 0.10]) * w
        for m in (5, 6):
            C[E["rings"][m]] = np.array([0.55, 0.28, 0.2])
        cc = E["C"] + np.array([0.012 * (1 if side == "L" else -1), -0.01, -0.03])
        d = np.linalg.norm(P - cc, axis=1)
        b = np.exp(-(d / 0.018) ** 2) * 0.22
        C = C * (1 - b[:, None]) + np.array([0.93, 0.45, 0.38]) * b[:, None]
    return C


def make_skin_object(R):
    ob = L.mesh_from_np("face", R["P"], R["F"])
    L.shade_smooth(ob)
    L.set_vcol(ob, skin_colours(R))
    return ob


def make_eyes(R, iris_png, seg=(24, 18), cseg=24):
    from parts import eyeball, cornea
    Vs, Fs, UVs, Vc, Fc = [], [], [], [], []
    for side in ("L", "R"):
        E = R["eyes"][side]
        V, F, UV = eyeball(E["C"], E["r"], nseg=seg[0], nring=seg[1])
        off = sum(len(v) for v in Vs)
        Vs.append(V); Fs += [[q + off for q in f] for f in F]; UVs.append(UV)
        V2, F2 = cornea(E["C"], E["r"], nseg=cseg, nr=5 if cseg < 24 else 7)
        off = sum(len(v) for v in Vc)
        Vc.append(V2); Fc += [[q + off for q in f] for f in F2]
    eyes = L.mesh_from_np("eyes", np.concatenate(Vs), Fs)
    L.shade_smooth(eyes)
    uvl = eyes.data.uv_layers.new(name="UVMap")
    UV = np.concatenate(UVs)
    lv = np.array([lp.vertex_index for lp in eyes.data.loops])
    uvl.data.foreach_set("uv", UV[lv].ravel())
    img = bpy.data.images.load(iris_png)
    eyes.data.materials.append(L.new_material("eye", rough=0.35, image=img, spec=0.4))
    cor = L.mesh_from_np("cornea", np.concatenate(Vc), Fc)
    L.shade_smooth(cor)
    cor.data.materials.append(L.new_material("cornea", base=(1, 1, 1), rough=0.03, transmission=1.0, ior=1.336, spec=0.9))
    return eyes, cor


def fix_normals(ob, inside=False):
    import bmesh
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if inside:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(ob.data); bm.free()


def stage_lights(c, h):
    L.area_light("key", c + np.array([-0.9, -1.6, 1.1]) * h, c, 70 * h * h, 1.6 * h, color=(1.0, 0.97, 0.92))
    L.area_light("fill", c + np.array([1.3, -1.4, 0.2]) * h, c, 28 * h * h, 2.0 * h, color=(0.95, 0.97, 1.0))
    L.area_light("rim", c + np.array([1.2, 1.5, 0.9]) * h, c, 45 * h * h, 1.0 * h, color=(1.0, 0.9, 0.8))
    L.area_light("catch", c + np.array([-0.25, -2.2, 0.35]) * h, c, 5 * h * h, 0.25 * h)


def front_on(bvh, T, px, off=0.0):
    """image px -> point on a surface (front ray) + its normal, pushed `off` along the normal."""
    px = np.asarray(px, float).reshape(-1, 2)
    O = np.stack([(px[:, 0] - 512) * T["K"] - T["x0"], np.full(len(px), -5.0), (1024 - px[:, 1]) * T["K"]], 1)
    out = np.zeros((len(px), 3)); nrm = np.zeros((len(px), 3))
    from mathutils import Vector
    for k in range(len(px)):
        loc, n, idx, d = bvh.ray_cast(Vector(O[k]), Vector((0, 1, 0)), 10)
        out[k] = loc; nrm[k] = n
        if not np.isfinite(nrm[k]).all() or np.linalg.norm(nrm[k]) < 0.5:
            nrm[k] = (0, -1, 0)
    return out + nrm * off, nrm


def make_brows_lashes(R, T, skin_bvh):
    """brow pillows (front-view outline from the refs, projected on our skin) + upper lash rims with the flick."""
    from parts import tube_strip
    lm2 = T["lm2"]
    V_all, F_all, side_of, t_all, kind = [], [], [], [], []
    meta_brow = {}
    for S in ("L", "R"):
        B = lm2["brow" + S]
        cen = SK.resample(SK.through3(B["inner"], B["peak"], B["outer"], 80), 22)
        t = np.linspace(0, 1, len(cen))
        tang = np.gradient(cen, axis=0); tang /= np.linalg.norm(tang, axis=1)[:, None]
        nrm2 = np.stack([tang[:, 1], -tang[:, 0]], 1)
        if (nrm2[:, 1] > 0).mean() > 0.5:
            nrm2 = -nrm2                                      # point up in the image (y decreasing)
        half = B["thick"] * 0.5 * 1.85 * (1.0 - 0.22 * t ** 2.0) * np.sin(np.clip(t, 0.0, 1.0) * np.pi * 0.92 + 0.25) ** 0.35
        across = np.array([-1.0, -0.7, -0.3, 0.0, 0.3, 0.7, 1.0])
        height = np.array([0.05, 0.6, 0.92, 1.0, 0.92, 0.6, 0.05]) * 0.0021 + 0.0006
        rows = []
        for k, a in enumerate(across):
            px = cen + nrm2 * (half * a)[:, None]
            # round the ends: pull the outer rows toward the centre line near t = 0 and 1
            endf = np.minimum(1, np.minimum(t, 1 - t) / 0.08)
            px = cen + (px - cen) * (0.35 + 0.65 * np.sqrt(np.clip(endf, 0, 1)))[:, None]
            P3, N3 = front_on(skin_bvh, T, px)
            rows.append(P3 + N3 * (height[k] * (0.6 + 0.4 * np.sin(np.pi * np.clip(t, 0.02, 0.98))))[:, None])
        n = len(cen); m = len(across)
        V = np.concatenate(rows)
        off = sum(len(v) for v in V_all)
        F = []
        for k in range(m - 1):
            for i in range(n - 1):
                a_ = off + k * n + i
                F.append([a_, a_ + 1, a_ + n + 1, a_ + n])
        V_all.append(V); F_all += F
        side_of += [S] * len(V); t_all += list(np.tile(t, m)); kind += ["brow"] * len(V)
    nb_brow = sum(len(v) for v in V_all)
    # lashes: along the upper margin (ring 4) + both corners, plus the flick toward the outer landmark
    lash_attach = []
    for S in ("L", "R"):
        E = R["eyes"][S]
        lm_, rm_, upper, lower = E["split"]
        ring4 = np.array(E["rings"][4])
        order = [lm_] + list(upper) + [rm_]
        base = R["P"][ring4[order]]
        C = E["C"]
        radial = base - C; radial /= np.linalg.norm(radial, axis=1)[:, None]
        base = C + radial * E["r"] * 1.045
        tng = np.gradient(base, axis=0); tng /= np.linalg.norm(tng, axis=1)[:, None]
        upd = np.cross(radial, tng)
        if upd[len(upd) // 2, 2] < 0:
            upd = -upd
        # flick: extend beyond the outer corner (outer = larger |x|)
        outer_first = abs(base[0, 0]) > abs(base[-1, 0])
        Fl = T["lm2"]["eye" + S]["flick"]
        tipP, _ = front_on(skin_bvh, T, [Fl], off=0.0012)
        if outer_first:
            base = base[::-1]; radial = radial[::-1]; upd = upd[::-1]; order = order[::-1]
        end = base[-1]
        ext = [end + (tipP[0] - end) * f + upd[-1] * 0.0006 * np.sin(np.pi * f) for f in (0.35, 0.7, 1.0)]
        path = np.concatenate([base, np.array(ext)])
        rad_e = np.concatenate([radial, np.tile(radial[-1], (3, 1))])
        up_e = np.concatenate([upd, np.tile(upd[-1], (3, 1))])
        nb = len(base)
        thick = np.concatenate([0.45 + 0.6 * np.linspace(0, 1, nb) ** 0.8, [0.95, 0.6, 0.2]])
        thick[-4:-3] = np.maximum(thick[-4:-3], 0.95)
        V, F = tube_strip(path, 0.0030, 0.0012, rad_e, up_e, taper=thick)
        off = sum(len(v) for v in V_all)
        V_all.append(V); F_all += [[q + off for q in f] for f in F]
        side_of += [S] * len(V); t_all += [0.0] * len(V); kind += ["lash"] * len(V)
        att = list(order) + [order[-2]] * 3
        lash_attach += [(S, att[k // 4], 1.0 if k // 4 < nb else 0.55) for k in range(len(V))]
    V = np.concatenate(V_all)
    ob = L.mesh_from_np("brows", V, F_all)
    fix_normals(ob)
    L.shade_smooth(ob)
    return ob, np.array(side_of), np.array(t_all), np.array(kind), nb_brow, lash_attach


def make_mouth_parts(R, T):
    """teeth arches + tongue in the mouth frame; returns object + per-vertex part tags."""
    from parts import teeth_arch, ellipsoid
    mo = R["mouth"]
    M = mo["line"].mean(0)
    ex, ey, ez = np.array([1.0, 0, 0]), np.array([0, 0, 1.0]), np.array([0, -1.0, 0])
    Rm = np.stack([ex, ey, ez], 1)
    ax = mo["ax"]
    zf = ((mo["line"] - M) @ Rm)[:, 2].min() - 0.0036
    Vu, Fu, gu = teeth_arch(M, Rm, ax, 0.0085, -0.0004, zf, 0.0032, 0.78 * ax, 0.0095)
    Vl, Fl, gl = teeth_arch(M, Rm, ax, -0.0090, -0.0016, zf - 0.0006, 0.003, 0.68 * ax, 0.0085)
    tz0, tlen = zf - 0.024, 0.021
    Vt, Ft = ellipsoid(M + Rm @ np.array([0, -0.0048, tz0 + tlen / 2]), 0.6 * ax, 0.012, 0.0035, nu=20, nv=10,
                       R=np.stack([ex, ez, ey], 1))
    V = np.concatenate([Vu, Vl, Vt])
    F = Fu + [[q + len(Vu) for q in f] for f in Fl] + [[q + len(Vu) + len(Vl) for q in f] for f in Ft]
    tag = np.array(["teethUp"] * len(Vu) + ["teethLo"] * len(Vl) + ["tongue"] * len(Vt))
    col = np.concatenate([np.where(gu[:, None] > 0.5, [0.78, 0.42, 0.40], [0.95, 0.93, 0.88]),
                          np.where(gl[:, None] > 0.5, [0.78, 0.42, 0.40], [0.95, 0.93, 0.88]),
                          np.tile([0.72, 0.32, 0.30], (len(Vt), 1))])
    ob = L.mesh_from_np("mouth", V, F)
    fix_normals(ob)
    L.shade_smooth(ob)
    L.set_vcol(ob, col)
    tq = (Vt - M) @ Rm
    tongue = {"t": np.clip((tq[:, 2] - tz0) / tlen, 0, 1), "z0": tz0, "len": tlen, "y0": float(tq[:, 1].mean()), "out": 0.016}
    return ob, tag, tongue, {"M": M, "ex": ex, "ey": ey, "ez": ez, "ax": ax}


def rig_meta(R, T, brow_info, mouth_info, tongue, skin_P, brow_P):
    side_of, t_b, kind_b, nb_brow, lash_attach = brow_info
    mo = R["mouth"]
    lm_, rm_, upper, lower = mo["split"]
    M = mouth_info["M"]
    ex, ey, ez = mouth_info["ex"], mouth_info["ey"], mouth_info["ez"]
    Rm = np.stack([ex, ey, ez], 1)
    cornerL = (mo["line"][rm_] - M) @ Rm
    # jaw pivot: behind and above the mouth, at the ear line (stylised: about 0.85 of the way to the ear, 0.3 up to the eye)
    eyeC = R["eyes"]["L"]["C"]
    pivot = np.array([0.0, eyeC[1] + 0.035, M[2] + 0.45 * (eyeC[2] - M[2])])
    meta = {"mouth": {"M": M, "ex": ex, "ey": ey, "ez": ez, "ax": mo["ax"], "split": mo["split"],
                      "rings": [np.asarray(r) for r in mo["rings"]], "cap": mo["cap"], "pivot": pivot,
                      "pivotLocalZ": float((pivot - M) @ ez), "cornerLocal": cornerL}}
    nose = T["lm2"]["nose"]
    sb = R["skin_bvh"]
    wl, _ = front_on(sb, T, [nose["wingL"]]); wr, _ = front_on(sb, T, [nose["wingR"]])
    meta["nose"] = {"wingL": wl[0], "wingR": wr[0]}
    meta["cheek"] = {}
    meta["eye"] = {}
    meta["brow"] = {}
    fall = {1: 0.15, 2: 0.45, 3: 0.85, 4: 1.0, 5: 1.0, 6: 1.0}
    for S in ("L", "R"):
        E = R["eyes"][S]
        C, r = E["C"], E["r"]
        sg = 1 if S == "L" else -1
        cc = C + np.array([sg * 0.55 * r, -1.2 * r, -1.55 * r])
        k = np.argmin(np.linalg.norm(skin_P - cc, axis=1))
        meta["cheek"][S] = skin_P[k]
        lm_, rm_, up, lo = E["split"]
        ring4 = np.asarray(E["rings"][4])
        v = skin_P[ring4] - C
        th = np.arctan2(v[:, 2], -v[:, 1])
        n = len(ring4)
        gap = np.zeros(n); upM = np.zeros(n); loM = np.zeros(n)
        for a_, b_ in zip(up, lo):
            g = max(th[a_] - th[b_], 0.0)
            gap[a_] = gap[b_] = g
        upM[up] = 1; loM[lo] = 1
        partner = np.arange(n)
        partner[np.asarray(up)] = np.asarray(lo); partner[np.asarray(lo)] = np.asarray(up)
        ids, ps, fs = [], [], []
        for lev in range(1, 7):
            ring = np.asarray(E["rings"][lev])
            ids += list(ring); ps += list(range(n)); fs += [fall[lev]] * n
        la = [(q, w) for (s_, q, w) in lash_attach if s_ == S]
        lash_ids = np.array([nb_brow + k for k, (s_, q, w) in enumerate(lash_attach) if s_ == S]) if False else None
        lid = [k for k, (s_, q, w) in enumerate(lash_attach) if s_ == S]
        meta["eye"][S] = {"r": r, "C": C, "axis": np.array([1.0, 0, 0]), "gap": gap, "upMask": upM, "loMask": loM, "partner": partner,
                          "skinIds": np.array(ids), "skinP": np.array(ps), "skinFall": np.array(fs),
                          "lashIds": np.array(lid) + nb_brow, "lashP": np.array([lash_attach[k][1] for k in lid]),
                          "lashFall": np.array([lash_attach[k][2] for k in lid])}
        # brows
        mask = np.nonzero((side_of == S) & (kind_b == "brow"))[0]
        Pb = brow_P[mask]
        upv = np.array([0, 0, 1.0])
        nrm = Pb - np.array([0, R["W"].c[1], R["W"].c[2]]); nrm /= np.linalg.norm(nrm, axis=1)[:, None]
        upT = upv - (nrm @ upv)[:, None] * nrm; upT /= np.linalg.norm(upT, axis=1)[:, None]
        inv = np.array([-sg, 0, 0.0])
        inward = inv - (nrm @ inv)[:, None] * nrm
        # skin follow weights: forehead between the brow and the hairline, falling off into the lid
        bc = Pb.reshape(7, -1, 3)[3]
        d = np.min(np.linalg.norm(skin_P[:, None, :] - bc[None, :, :], axis=2), axis=1)
        tt = np.linspace(0, 1, bc.shape[0])[np.argmin(np.linalg.norm(skin_P[:, None, :] - bc[None, :, :], axis=2), axis=1)]
        w = np.exp(-(d / 0.016) ** 2) * (skin_P[:, 0] * sg > -0.004)
        lev_mask = np.zeros(len(skin_P), bool)
        for lev in (3, 4, 5, 6):
            lev_mask[np.asarray(E["rings"][lev])] = True
        w[lev_mask] = 0
        below = skin_P[:, 2] < C[2] - 0.2 * r
        w[below] = 0
        meta["brow"][S] = {"t": np.asarray(t_b)[mask], "mask": mask, "upT": upT, "inward": inward,
                           "skinW": w, "skinT": tt, "inwardSkin": inv}
    meta["tongue"] = tongue
    return meta


def preview(T, R, a, tag=""):
    tgt = L.mesh_from_np("target", T["V"], T["F"])
    tgt.data.materials.append(L.new_material("tgt", base=(0.5, 0.5, 0.55), rough=0.7))
    tgt.hide_render = not a.show_target
    L.setup_render(res=a.res, samples=24)
    hc = np.array([0, R["W"].c[1], R["W"].c[2] - 0.02])
    stage_lights(hc, 0.6)
    os.makedirs(a.preview, exist_ok=True)
    for nm, yaw, dist in (("front", 0, 1.3), ("q3", 35, 1.3), ("profile", 90, 1.3), ("close", 0, 0.6)):
        r_ = np.radians(yaw)
        cam = L.camera("cam_" + nm, hc + np.array([np.sin(r_) * dist, -np.cos(r_) * dist, 0]), hc, lens=85)
        L.render_to(os.path.join(a.preview, tag + nm + ".png"), cam)
    bpy.data.objects.remove(tgt)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", required=True)
    ap.add_argument("--lm", default=os.path.join(ROOT, "art/character/stylised/armB/landmarks-front-ortho.json"))
    ap.add_argument("--out", required=True)
    ap.add_argument("--cfg")
    ap.add_argument("--preview")
    ap.add_argument("--res", type=int, default=512)
    ap.add_argument("--show-target", action="store_true")
    ap.add_argument("--skin-only", action="store_true")
    ap.add_argument("--tier", default="H", choices=["H", "Bplus"])
    a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    T = load_target(a.target, a.lm)
    W0 = SK.Wrap(T, {"axis_y": 0, "axis_z": 0})
    cfg = default_cfg(T, W0)
    if a.cfg:
        cfg.update(json.load(open(a.cfg)))
    cfg.update({"H": {"hair_tris": 7600, "garment_tris": 3400}, "Bplus": {"hair_tris": 3000, "garment_tris": 1400}}[a.tier])
    warp_target(T, cfg)
    R = build_skin(T, cfg)
    R["F_full"] = list(R["F"])
    if a.tier != "H":
        hid = R["hidden"]
        R["F"] = [f for f in R["F"] if not all(hid[q] for q in f)]
    print("[build] skin verts", len(R["P"]), "faces", len(R["F"]), "placed", int(R["placed"].sum()))
    L.clear_scene()
    import extras
    R["skin_bvh"] = L.bvh_from_np(R["P"], R["F_full"])
    nskin = len(R["P"])
    if a.skin_only:
        XV, XF, XC, xtag, xmat, ears = np.zeros((0, 3)), [], np.zeros((0, 3)), np.array([]), np.array([], int), {}
    else:
        XV, XF, XC, xtag, xmat, ears = extras.head_extras(T, R, front_on)
    face = L.mesh_from_np("face", np.concatenate([R["P"], XV]), R["F"] + [[q + nskin for q in f] for f in XF])
    L.shade_smooth(face)
    L.set_vcol(face, np.concatenate([skin_colours(R), XC]))
    face.data.materials.append(L.new_material("skin", base=(1, 1, 1), vcol="Col", rough=0.5, sss=0.08, spec=0.35))
    face.data.materials.append(L.new_material("gold", base=(0.85, 0.6, 0.25), metallic=1.0, rough=0.25))
    mi = np.concatenate([np.zeros(len(R["F"]), int), xmat])
    face.data.polygons.foreach_set("material_index", mi)
    ftag = np.array(["skin"] * nskin + list(xtag))
    iris = os.path.join(os.path.dirname(os.path.abspath(a.out)), "iris.png")
    os.system(f"{sys.executable} {os.path.dirname(os.path.abspath(__file__))}/iris.py {iris} --size 256 > /dev/null")
    eyes, cor = make_eyes(R, iris, *(((24, 18), 24) if a.tier == "H" else ((16, 12), 16)))
    fix_normals(eyes); fix_normals(cor)
    if a.preview:
        preview(T, R, a)
    if a.skin_only:
        bpy.ops.wm.save_as_mainfile(filepath=a.out)
        sys.stdout.flush(); os._exit(0)
    brows, side_b, t_b, kind_b, nb_brow, lash_attach = make_brows_lashes(R, T, R["skin_bvh"])
    brows.data.materials.append(L.new_material("brow", base=(0.035, 0.028, 0.025), rough=0.7, spec=0.2))
    mouth, tag, tongue, minfo = make_mouth_parts(R, T)
    mouth.data.materials.append(L.new_material("mouth", base=(1, 1, 1), vcol="Col", rough=0.4, spec=0.4))
    hair, garment, more = extras.build(T, R, cfg, a)
    more.update(nskin=nskin, ftag=ftag)
    meta = rig_meta(R, T, (side_b, t_b, kind_b, nb_brow, lash_attach), minfo, tongue, R["P"], L.co(brows.data))
    import shapes as SH
    Pm = L.co(mouth.data)
    parts = {"skin": R["P"], "brows": L.co(brows.data), "teethUp": Pm[tag == "teethUp"],
             "teethLo": Pm[tag == "teethLo"], "tongue": Pm[tag == "tongue"]}
    # brow projection data: rest offset of each brow vertex above the skin
    bm_ids = np.nonzero(kind_b == "brow")[0]
    Pbr = L.co(brows.data)[bm_ids]
    Qb, Nb, _, db = L.nearest(R["skin_bvh"], Pbr)
    offs = ((Pbr - Qb) * Nb).sum(1)
    meta["brow_proj"] = {"faces": [tuple(f) for f in R["F_full"]], "ids": bm_ids, "off": offs}
    rig = SH.Rig(parts, meta)
    keys = SH.all_keys()
    if a.tier != "H":
        keys = SH.ARKIT + ["tongueTipUp", "jawOpen_mouthClose", "eyeBlink_eyeLookDownLeft", "eyeBlink_eyeLookDownRight",
                           "eyeBlink_eyeSquintLeft", "eyeBlink_eyeSquintRight"]
    D = SH.bake(rig, keys)
    if os.environ.get("ARMB_DEBUG"):
        print("[dbg] brows rest nan", int(np.isnan(parts["brows"]).sum()), np.nonzero(np.isnan(parts["brows"]).any(1))[0][:20])
        print("[dbg] brow mask", len(meta["brow"]["L"]["mask"]), "skinW", float(meta["brow"]["L"]["skinW"].sum()), "lash", len(meta["eye"]["L"]["lashIds"]), "parts", {k: len(v) for k, v in parts.items()})
        [print("[dbg] pose", kk, int(np.isnan(rig.evaluate(SH.POSES[kk])["skin"]).sum())) for kk in ("jawOpen", "eyeBlinkLeft", "mouthSmileLeft", "browDownLeft")]; print("[dbg] rest", int(np.isnan(rig.evaluate({})["skin"]).sum()), [kk for kk, vv in meta["brow"]["L"].items() if np.isnan(np.asarray(vv, float)).any()]); Pq = rig.evaluate(SH.POSES["browInnerUp"]); print("[dbg] nan skin", int(np.isnan(Pq["skin"]).sum()), "nan brows", int(np.isnan(Pq["brows"]).sum()), "nan offs", int(np.isnan(meta["brow_proj"]["off"]).sum()), "nan rest skin", int(np.isnan(parts["skin"]).sum()))
        E = R["eyes"]["L"]; lm_, rm_, up_, lo_ = E["split"]; r4 = np.asarray(E["rings"][4])
        for lab, ps in (("blink", ["eyeBlinkLeft"]), ("squint", ["eyeSquintLeft"]), ("both", ["eyeBlinkLeft", "eyeSquintLeft"])):
            Pp = rig.evaluate(SH.merge_pose(*[SH.POSES[k] for k in ps]))["skin"]
            g = np.linalg.norm(Pp[r4[up_]] - Pp[r4[lo_]], axis=1)
            Ps = R["P"] + sum(D[k]["skin"] for k in ps) + (D["eyeBlink_eyeSquintLeft"]["skin"] if len(ps) == 2 else 0)
            g2 = np.linalg.norm(Ps[r4[up_]] - Ps[r4[lo_]], axis=1)
            print("[dbg]", lab, "rig gap max mm", round(g.max() * 1000, 2), "sum gap", round(g2.max() * 1000, 2))
    for k in keys:
        mx = {p: float(np.linalg.norm(D[k][p], axis=1).max() * 1000) for p in D[k]}
        print(f"[keys] {k:28s} " + " ".join(f"{p}={v:5.1f}" for p, v in mx.items() if v > 0.05))
    extras.add_shape_keys(face, brows, mouth, tag, D, keys, more)
    rep = extras.finish(R, T, cfg, a, face, eyes, cor, brows, mouth, hair, garment, more, D, keys)
    json.dump(rep, open(a.out.replace(".blend", ".report.json"), "w"), indent=1, default=float)
    gm = {"nskin": nskin, "used": np.nonzero(R["used"])[0].tolist(), "eye": {}, "mouth": {}}
    for S_ in ("L", "R"):
        E = R["eyes"][S_]
        lm_, rm_, up_, lo_ = E["split"]
        r4 = np.asarray(E["rings"][4])
        lid = np.concatenate([np.asarray(E["rings"][m]) for m in (3, 4, 5)])
        gm["eye"][S_] = {"upper": r4[up_].tolist(), "lower": r4[lo_].tolist(), "C": E["C"].tolist(), "r": float(E["r"]),
                         "lidIds": lid.tolist()}
    lm_, rm_, up_, lo_ = R["mouth"]["split"]
    r5 = np.asarray(R["mouth"]["rings"][5])
    gm["mouth"] = {"upper": r5[up_].tolist(), "lower": r5[lo_].tolist()}
    json.dump(gm, open(a.out.replace(".blend", ".meta.json"), "w"))
    bpy.ops.wm.save_as_mainfile(filepath=a.out)
    sys.stdout.flush()
    os._exit(0)
