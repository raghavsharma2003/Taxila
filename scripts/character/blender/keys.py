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
    out["jawOpen_mouthClose"] = fix + 0.3 * (D["mouthPressLeft"] + D["mouthPressRight"]) * regions["lips"][:, None]
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
    ok = np.isfinite(delta).all() and m.max() <= lim and (rec["moved"] > 0 or name == "viseme_sil")
    rec["ok"] = bool(ok)
    return ok, rec


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
