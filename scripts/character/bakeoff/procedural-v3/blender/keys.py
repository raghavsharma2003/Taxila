"""Shape-key sets, the scripted extras (Hindi tongue keys, correctives) and the numeric key validators.

Names are the runtime contract (CHARACTER-PIPELINE.md §runtime): ARKit 52 exactly as Apple spells them, the 15
Oculus visemes with the `viseme_` prefix (TalkingHead / MPFB convention), three tongue extras, and correctives named
`<parentA>_<parentB>[Left|Right]` whose runtime weight is the product of their parents (glTF has no drivers).
"""
import numpy as np

ARKIT52 = """eyeBlinkLeft eyeLookDownLeft eyeLookInLeft eyeLookOutLeft eyeLookUpLeft eyeSquintLeft eyeWideLeft
eyeBlinkRight eyeLookDownRight eyeLookInRight eyeLookOutRight eyeLookUpRight eyeSquintRight eyeWideRight
jawForward jawLeft jawRight jawOpen mouthClose mouthFunnel mouthPucker mouthLeft mouthRight
mouthSmileLeft mouthSmileRight mouthFrownLeft mouthFrownRight mouthDimpleLeft mouthDimpleRight
mouthStretchLeft mouthStretchRight mouthRollLower mouthRollUpper mouthShrugLower mouthShrugUpper
mouthPressLeft mouthPressRight mouthLowerDownLeft mouthLowerDownRight mouthUpperUpLeft mouthUpperUpRight
browDownLeft browDownRight browInnerUp browOuterUpLeft browOuterUpRight cheekPuff cheekSquintLeft
cheekSquintRight noseSneerLeft noseSneerRight tongueOut""".split()
assert len(ARKIT52) == 52

VISEMES = ["viseme_" + v for v in "sil PP FF TH DD kk CH SS nn RR aa E I O U".split()]
TONGUE = ["tongueTipUp", "tongueCurl", "tongueWide"]

# (name, parents, sides) -- sides=True: one key per side, parents get Left/Right suffixes where sided.
CORRECTIVES = [
    ("jawOpen_mouthClose", ("jawOpen", "mouthClose"), False),
    ("jawOpen_mouthSmile", ("jawOpen", "mouthSmile{S}"), True),
    ("eyeBlink_eyeLookDown", ("eyeBlink{S}", "eyeLookDown{S}"), True),
    ("eyeBlink_eyeSquint", ("eyeBlink{S}", "eyeSquint{S}"), True),
    ("mouthFunnel_jawOpen", ("mouthFunnel", "jawOpen"), False),
    ("browInnerUp_browDown", ("browInnerUp", "browDown{S}"), True),
    ("cheekSquint_eyeBlink", ("cheekSquint{S}", "eyeBlink{S}"), True),
]
B_PLUS_CORRECTIVES = {"jawOpen_mouthClose", "jawOpen_mouthSmile", "eyeBlink_eyeLookDown"}


def corrective_keys(only=None):
    """[(keyName, [parentKeyNames])] expanded per side."""
    out = []
    for name, parents, sided in CORRECTIVES:
        if only is not None and name not in only:
            continue
        if sided:
            for S in ("Left", "Right"):
                out.append((name + S, [p.replace("{S}", S) for p in parents]))
        else:
            out.append((name, list(parents)))
    return out


def tier_keys(tier):
    if tier == "H":
        return ARKIT52 + VISEMES + TONGUE + [k for k, _ in corrective_keys()]
    return ARKIT52 + ["tongueTipUp"] + [k for k, _ in corrective_keys(B_PLUS_CORRECTIVES)]


# ------------------------------------------------------------------ tongue extras (region-weighted fields)
def _rot_x(v, ang):
    c, s = np.cos(ang), np.sin(ang)
    y = v[:, 1] * c - v[:, 2] * s
    z = v[:, 1] * s + v[:, 2] * c
    return np.stack([v[:, 0], y, z], 1)


def tongue_extras(P):
    """P: (N,3) tongue rest positions (Blender space: face looks to -Y, +Z up). Returns {key: delta}."""
    yb, yt = P[:, 1].max(), P[:, 1].min()          # back (+y) .. tip (-y)
    L = yb - yt
    s = (yb - P[:, 1]) / L                          # 0 back .. 1 tip
    zc = np.median(P[:, 2])
    out = {}

    def bend(s0, ang, lift, back):
        w = np.clip((s - s0) / (1 - s0), 0, 1)
        w = w * w * (3 - 2 * w)
        piv = np.array([0.0, yb - s0 * L, zc + 0.002])
        rel = P - piv
        # progressive bend: each vertex rotates by ang * w about the x axis through the pivot (tip up = -ang)
        res = np.empty_like(P)
        for i in range(len(P)):
            res[i] = _rot_x(rel[i:i + 1], -ang * w[i])[0]
        res = res + piv
        res[:, 2] += lift * w
        res[:, 1] += back * w
        return res - P

    out["tongueTipUp"] = bend(0.62, np.radians(26), 0.003, -0.001)      # dental: blade up to the upper incisors
    out["tongueCurl"] = bend(0.74, np.radians(70), 0.003, 0.004)        # retroflex: tip curls up and back
    w = np.clip((s - 0.15) / 0.6, 0, 1)
    d = np.zeros_like(P)
    d[:, 0] = P[:, 0] * 0.2 * w                                          # open aa / e: wide and flat
    d[:, 2] = -0.0018 * w * np.exp(-((P[:, 0] / (0.4 * L)) ** 2))
    out["tongueWide"] = d
    return out


# ------------------------------------------------------------------ correctives from the base rig's own deltas
def correctives(base, D, regions):
    """Derive the 12 corrective keys (7 logical) from the face-unit deltas themselves.

    regions: dict of boolean/float per-vertex masks: 'lidUpper{L,R}', 'lidLower{L,R}', 'lips', 'lipSealUpper',
    'lipSealLower' (index arrays, paired), 'browInner', 'mouthCorner{L,R}'.
    Every field is bounded (validated later) and lives only where its parents both move.
    """
    out = {}
    mag = lambda k: np.linalg.norm(D[k], axis=1)
    # 1. jawOpen x mouthClose: seal the lips under an open jaw. Pairs (upper, lower) that touch at rest are pulled
    #    to their midpoint at the combined pose; a smooth falloff spreads the fix to the neighbouring lip ring.
    S = base + D["jawOpen"] + D["mouthClose"]
    up, lo = regions["lipSealUpper"], regions["lipSealLower"]
    fix = np.zeros_like(base)
    mid = 0.5 * (S[up] + S[lo])
    fix[up] = mid - S[up]
    fix[lo] = mid - S[lo]
    fix = _spread(base, fix, np.concatenate([up, lo]), regions["lips"], radius=0.006)
    # With the basis and mouthClose sealed upstream the seal term is ~0; what remains real is the thinning of
    # lips held closed over an open jaw: 30% of the press shape on the lip ring.
    # (A press term was tried here and measured: it re-opened 8-16% of the lip aperture at jaw 0.3 + close 0.3.)
    out["jawOpen_mouthClose"] = fix
    for S_ in ("Left", "Right"):
        # 2. jawOpen x mouthSmile: the jaw drags the smiling corner down and in; give back 40% of the jaw's motion at
        #    the corner region (weighted by how much the smile moves the vertex).
        ms = mag("mouthSmile" + S_)
        w = np.clip(ms / max(ms.max(), 1e-9), 0, 1) ** 1.5 * regions["mouthCorner" + S_]
        out["jawOpen_mouthSmile" + S_] = -0.4 * D["jawOpen"] * w[:, None]
        # 3. eyeBlink x eyeLookDown: the lid already follows the gaze down; blink + follow overshoots. Remove the
        #    look-down lid motion where the blink moves the upper lid, so the sum lands on the blink pose.
        bl = mag("eyeBlink" + S_)
        wl = np.clip(bl / max(bl.max(), 1e-9), 0, 1) ** 0.5 * regions["lidUpper" + S_]
        out["eyeBlink_eyeLookDown" + S_] = -D["eyeLookDown" + S_] * wl[:, None]
        # 4. eyeBlink x eyeSquint: squint lowers the upper lid too; remove it under a full blink.
        out["eyeBlink_eyeSquint" + S_] = -D["eyeSquint" + S_] * (wl * regions["lidUpper" + S_])[:, None]
        # 6. browInnerUp x browDown: the worry knot. Inner brow heads pulled toward the midline and up a little.
        bi = regions["browInner"] * (np.sign(base[:, 0]) == (1 if S_ == "Left" else -1))
        k = np.zeros_like(base)
        k[:, 0] = -base[:, 0] * 0.06 * bi
        k[:, 2] = 0.0012 * bi
        out["browInnerUp_browDown" + S_] = k
        # 7. cheekSquint x eyeBlink: both raise the lower lid; remove 60% of the cheek's lower-lid raise.
        out["cheekSquint_eyeBlink" + S_] = -0.6 * D["cheekSquint" + S_] * regions["lidLower" + S_][:, None]
    # 5. mouthFunnel x jawOpen: the open jaw flattens the funnel ring; restore 35% of the funnel shape on the lips.
    out["mouthFunnel_jawOpen"] = 0.35 * D["mouthFunnel"] * regions["lips"][:, None]
    return out


def _spread(base, fix, src, region, radius):
    """Blend sparse fixes at `src` vertices into nearby `region` vertices with a Gaussian falloff."""
    out = fix.copy()
    sel = np.nonzero(region > 0)[0]
    sel = np.setdiff1d(sel, src)
    if len(sel) == 0:
        return out
    d = np.linalg.norm(base[sel][:, None, :] - base[src][None, :, :], axis=2)
    w = np.exp(-(d / radius) ** 2)
    ws = w.sum(1)
    contrib = (w @ fix[src]) / np.maximum(ws, 1e-9)[:, None]
    out[sel] = contrib * np.clip(ws, 0, 1)[:, None] * region[sel][:, None]
    return out


# ------------------------------------------------------------------ validation
def validate(name, delta, base, limits):
    """Bounded displacement + finite + non-empty. Returns (ok, record)."""
    m = np.linalg.norm(delta, axis=1)
    lim = limits.get(name, limits["default"])
    rec = {"key": name, "maxMm": round(float(m.max() * 1000), 2), "moved": int((m > 2e-4).sum()), "limitMm": lim * 1000}
    # a corrective may be legitimately empty: its parents do not overlap on this face, or the seal is already exact
    may_be_empty = name == "viseme_sil" or "_" in name
    if rec["moved"] == 0 and may_be_empty:
        rec["note"] = "empty by construction (parents do not overlap / already sealed)"
    ok = np.isfinite(delta).all() and m.max() <= lim and (rec["moved"] > 0 or may_be_empty)
    rec["ok"] = bool(ok)
    return ok, rec


def mirror_map(P, tol=2e-4):
    """Topological mirror on the SYMMETRIC MakeHuman base (before any one-sided target): index of x -> -x twin."""
    from scipy.spatial import cKDTree
    d, idx = cKDTree(P).query(P * np.array([-1, 1, 1]))
    ok = d < tol
    idx = np.where(ok, idx, np.arange(len(P)))
    return idx, int((~ok).sum())


def _M(d, mir):
    return d[mir] * np.array([-1, 1, 1])


def partner(name):
    if name.endswith("Left"):
        return name[:-4] + "Right"
    if name.endswith("Right"):
        return name[:-5] + "Left"
    return None


def symmetrize(D, mir):
    """Make every key mirror-exact on the face topology: a sided pair becomes (avg, mirror of avg); a bilateral key
    becomes the average of itself and its mirror. The faceunits01 L/R units differ by up to 6.5 mm (G3, 2026-10-03),
    which swamped the designed 3-8% asymmetry; the designed asymmetry is applied at runtime (faceStyle.asym)."""
    out = {}
    for k, d in D.items():
        p = partner(k)
        if p and p in D:
            if k.endswith("Left"):
                L = 0.5 * (d + _M(D[p], mir))
                out[k] = L
                out[p] = _M(L, mir)
        elif k not in out:
            out[k] = 0.5 * (d + _M(d, mir))
    return out


def side_of(D, key, P):
    """Which x-sign a sided key moves (the packs' Left/Right convention, read from the data, not assumed)."""
    m = np.linalg.norm(D[key], axis=1)
    return 1 if (m * (P[:, 0] > 0)).sum() >= (m * (P[:, 0] < 0)).sum() else -1


def expression_correctives(P, D, lips_w, eyeC, head_w):
    """Scripted deltas on top of the CC0 units so runtime calibration gains go back to 1.0 (review item 10).
    mouthSmile: the corner goes up AND back (zygomaticus), plus a nasolabial bulge lateral to the fold;
    cheekSquint: lower-lid raise + cheek-pad lift (the Duchenne marker); browInnerUp / browOuterUp: x1.3 (the pack is
    soft there). Every field is a smooth Gaussian, bounded, and validated by G2 afterwards."""
    out = {k: v.copy() for k, v in D.items()}
    lip = np.nonzero(lips_w > 0.3)[0]
    g = lambda c, r: np.exp(-(np.linalg.norm(P - c, axis=1) / r) ** 2) * head_w
    up_back = np.array([0.0, 0.45, 0.89])                  # Blender: +y = back, +z = up
    for S in ("Left", "Right"):
        sg = side_of(D, "mouthSmile" + S, P)
        c = P[lip[np.argmax(sg * P[lip, 0])]]
        amp = 0.6 * float(np.linalg.norm(D["mouthSmile" + S][np.argmin(np.linalg.norm(P - c, axis=1))]))
        corner = g(c, 0.011)
        bulge_c = c + np.array([sg * 0.009, -0.003, 0.013])
        outward = np.array([sg * 0.55, -0.83, 0.0])
        out["mouthSmile" + S] = D["mouthSmile" + S] + corner[:, None] * (amp * up_back)[None, :] \
            + (g(bulge_c, 0.009) * 0.0011)[:, None] * outward[None, :]
        sq = side_of(D, "cheekSquint" + S, P)
        e = eyeC["L"] if sq > 0 else eyeC["R"]
        lowlid = g(e + np.array([0, -0.009, -0.009]), 0.007)
        pad = g(e + np.array([sq * 0.006, -0.012, -0.024]), 0.013)
        out["cheekSquint" + S] = D["cheekSquint" + S] + (lowlid * 0.0010 + pad * 0.0012)[:, None] * np.array([0, 0, 1.0])[None, :]
    for k in ("browInnerUp", "browOuterUpLeft", "browOuterUpRight"):
        out[k] = D[k] * 1.3
    return out


def expression_correctives_v3(P, D, lips_w, eyeC, head_w, cfg=None):
    """procedural-v3: emotion legibility built into the face units (CHARACTER-PIPELINE §10.1). On top of the iteration-2
    deltas (corner up and back, nasolabial bulge, lower-lid raise, brow x1.3), the muscles that make an expression READ
    in a still are added as smooth fields, all scaled at unit weight 1 and bounded by G2:
      mouthSmile  : the cheek 'apple' rides up and forward (zygomaticus major bunches the malar fat), the fold deepens
                    (a bigger bulge lateral to it), the lower lid is pushed up (the smile's own Duchenne carry-over);
      cheekSquint : a stronger lower-lid raise and cheek lift, and crow's-feet bunching (skin lateral to the outer
                    canthus slides toward it), the Duchenne marker;
      eyeSquint   : extra lower-lid raise (the focused 'listening' squint);
      browDown    : corrugator: the inner brow heads pulled toward the midline (the knit), procerus at the nasal root;
      browInnerUp : the inner third raised more than the middle (the oblique 'concern' brow)."""
    c = dict(apple=0.0030, appleFwd=0.0016, fold=0.0019, smileLid=0.0009, lid=0.0016, pad=0.0024, crow=0.0010,
             squintLid=0.0007, knit=0.0018, knitDown=0.0008, procerus=0.0009, innerUp=0.0016)
    c.update(cfg or {})
    out = expression_correctives(P, D, lips_w, eyeC, head_w)
    g = lambda q, r: np.exp(-(np.linalg.norm(P - q, axis=1) / r) ** 2) * head_w
    up, fwd = np.array([0, 0, 1.0]), np.array([0, -1.0, 0])
    eR = abs(eyeC["L"][0] - eyeC["R"][0]) * 0.26          # ~ eye radius from the eye spacing
    for S in ("Left", "Right"):
        sg = side_of(D, "mouthSmile" + S, P)
        e = eyeC["L"] if sg > 0 else eyeC["R"]
        apple = g(e + np.array([sg * 0.012, -0.016, -0.031]), 0.015)
        lid = g(e + np.array([sg * 0.002, -0.010, -0.010]), 0.006)
        fold = g(e + np.array([sg * 0.020, -0.020, -0.052]), 0.010)
        side_out = np.array([sg * 1.0, 0, 0])
        out["mouthSmile" + S] = out["mouthSmile" + S] + apple[:, None] * (up * c["apple"] + fwd * c["appleFwd"] + side_out * 0.0004) \
            + fold[:, None] * (fwd * c["fold"] * 0.8 + side_out * c["fold"] * 0.5) + lid[:, None] * up * c["smileLid"]
        sq = side_of(D, "cheekSquint" + S, P)
        e2 = eyeC["L"] if sq > 0 else eyeC["R"]
        lowlid = g(e2 + np.array([0, -0.009, -0.009]), 0.007)
        pad = g(e2 + np.array([sq * 0.008, -0.013, -0.026]), 0.014)
        crow = g(e2 + np.array([sq * (eR + 0.009), -0.001, -0.001]), 0.008)
        out["cheekSquint" + S] = out["cheekSquint" + S] + lowlid[:, None] * up * c["lid"] + pad[:, None] * (up * c["pad"] + fwd * 0.0008) \
            + crow[:, None] * (np.array([-sq * c["crow"], 0, c["crow"] * 0.4]))
        es = side_of(D, "eyeSquint" + S, P)
        e3 = eyeC["L"] if es > 0 else eyeC["R"]
        out["eyeSquint" + S] = out["eyeSquint" + S] + g(e3 + np.array([0, -0.009, -0.009]), 0.006)[:, None] * up * c["squintLid"]
        bd = side_of(D, "browDown" + S, P)
        e4 = eyeC["L"] if bd > 0 else eyeC["R"]
        inner = g(e4 + np.array([-bd * 0.012, -0.019, 0.016]), 0.009)
        mid = 0.5 * (eyeC["L"] + eyeC["R"])
        proc = g(mid + np.array([0, -0.024, 0.006]), 0.008) * 0.5
        out["browDown" + S] = out["browDown" + S] + inner[:, None] * np.array([-bd * c["knit"], 0, -c["knitDown"]]) \
            + proc[:, None] * np.array([0, 0, -c["procerus"]])
    mid = 0.5 * (eyeC["L"] + eyeC["R"])
    innerL = g(eyeC["L"] + np.array([-0.011, -0.019, 0.018]), 0.008)
    innerR = g(eyeC["R"] + np.array([0.011, -0.019, 0.018]), 0.008)
    out["browInnerUp"] = out["browInnerUp"] + (innerL + innerR)[:, None] * up * c["innerUp"]
    return out


def mirror_error_topo(dL, dR, mir_idx, valid):
    """Max |L - mirror(R)| over vertices whose topological twin is known (mir_idx >= 0)."""
    sel = np.nonzero(valid & (mir_idx >= 0))[0]
    if not len(sel):
        return 0.0
    err = np.linalg.norm(dL[sel] - dR[mir_idx[sel]] * np.array([-1, 1, 1]), axis=1)
    return float(err.max())


def mirror_error(base, dL, dR, tol=0.0008):
    """Max distance between the Left key and the mirrored Right key (x -> -x), matched by nearest mirrored vertex."""
    from scipy.spatial import cKDTree
    mb = base * np.array([-1, 1, 1])
    tree = cKDTree(base)
    dist, idx = tree.query(mb)
    ok = dist < tol
    mdR = dR[idx] * np.array([-1, 1, 1])
    err = np.linalg.norm(dL[ok] - mdR[ok], axis=1)
    return float(err.max()) if len(err) else 0.0
