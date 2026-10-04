"""Rig-then-bake shape authoring (TECH-PLAN 5.1). A temporary procedural rig built on the template's NAMED loops:
spherical lid rotators about each eyeball centre, a jaw rotation about a fitted pivot, a lip-corner field, mouth-ring
scale / push / roll, cheek and nose falloffs, brow segment moves on the separate brow mesh, tongue bends. A pose table
(POSES, data) gives every contract key as channel values; each pose is baked to a morph delta. Correctives are exact by
construction: bake(a + b) - bake(a) - bake(b).

    rig = Rig(parts, meta); P = rig.evaluate({"jaw": 1.0, ...}) -> {part: (n,3)}
"""
import numpy as np

ARKIT = ["eyeBlinkLeft", "eyeLookDownLeft", "eyeLookInLeft", "eyeLookOutLeft", "eyeLookUpLeft", "eyeSquintLeft", "eyeWideLeft",
         "eyeBlinkRight", "eyeLookDownRight", "eyeLookInRight", "eyeLookOutRight", "eyeLookUpRight", "eyeSquintRight", "eyeWideRight",
         "jawForward", "jawLeft", "jawRight", "jawOpen", "mouthClose", "mouthFunnel", "mouthPucker", "mouthLeft", "mouthRight",
         "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft", "mouthFrownRight", "mouthDimpleLeft", "mouthDimpleRight",
         "mouthStretchLeft", "mouthStretchRight", "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
         "mouthPressLeft", "mouthPressRight", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthUpperUpLeft", "mouthUpperUpRight",
         "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight", "cheekPuff", "cheekSquintLeft",
         "cheekSquintRight", "noseSneerLeft", "noseSneerRight", "tongueOut"]
VISEMES = ["viseme_" + v for v in ["sil", "PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"]]
TONGUE = ["tongueTipUp", "tongueCurl", "tongueWide"]
CORRECTIVES = {"jawOpen_mouthClose": ("jawOpen", "mouthClose"), "mouthFunnel_jawOpen": ("mouthFunnel", "jawOpen"),
               "jawOpen_mouthSmileLeft": ("jawOpen", "mouthSmileLeft"), "jawOpen_mouthSmileRight": ("jawOpen", "mouthSmileRight"),
               "eyeBlink_eyeLookDownLeft": ("eyeBlinkLeft", "eyeLookDownLeft"), "eyeBlink_eyeLookDownRight": ("eyeBlinkRight", "eyeLookDownRight"),
               "eyeBlink_eyeSquintLeft": ("eyeBlinkLeft", "eyeSquintLeft"), "eyeBlink_eyeSquintRight": ("eyeBlinkRight", "eyeSquintRight"),
               "browInnerUp_browDownLeft": ("browInnerUp", "browDownLeft"), "browInnerUp_browDownRight": ("browInnerUp", "browDownRight"),
               "cheekSquint_eyeBlinkLeft": ("cheekSquintLeft", "eyeBlinkLeft"), "cheekSquint_eyeBlinkRight": ("cheekSquintRight", "eyeBlinkRight")}

# ----------------------------------------------------------------------------------- pose table (channel values)
# channels (per side S in L/R): lidUp_S (+ closes, fraction of the gap), lidUpDeg_S (+ down, degrees), lidLo_S (+ raises,
# fraction of gap), lidLoDeg_S (+ up, deg), lidYaw_S (deg), browIn_S / browMid_S / browOut_S (m, + up), browKnit_S (m),
# cheek_S (m up), jaw (fraction of JAW_DEG), jawX (m), jawZ (m), corner_S (dx out, dy up, dz fwd in mouth half-widths),
# upLip_S, loLip_S (half-widths, + up), pucker, funnel, rollU, rollL (0..1), shrugU, shrugL, press_S, mouthX (half-widths),
# close (0..1 re-closes the lips against jaw), puff, sneer_S, tongueOut, tipUp, curl, wide


def side_pose(S, **kw):
    return {f"{k}_{S}": v for k, v in kw.items()}


def build_poses():
    P = {}
    for S, nm in (("L", "Left"), ("R", "Right")):
        P[f"eyeBlink{nm}"] = side_pose(S, lidUp=0.76, lidLo=0.24)
        P[f"eyeSquint{nm}"] = {**side_pose(S, lidLo=0.30, lidUp=0.10, cheek=0.0025)}
        P[f"eyeWide{nm}"] = side_pose(S, lidUpDeg=-9.0, lidLoDeg=-3.0)
        P[f"eyeLookUp{nm}"] = side_pose(S, lidUpDeg=-7.0, lidLoDeg=3.5)
        P[f"eyeLookDown{nm}"] = side_pose(S, lidUpDeg=11.0, lidLoDeg=-4.0)
        P[f"eyeLookIn{nm}"] = side_pose(S, lidYaw=2.5)
        P[f"eyeLookOut{nm}"] = side_pose(S, lidYaw=-2.5)
        P[f"mouthSmile{nm}"] = {**side_pose(S, corner=(0.22, 0.58, -0.14), cheek=0.0060, lidLo=0.16, upLip=0.06)}
        P[f"mouthFrown{nm}"] = side_pose(S, corner=(0.06, -0.30, -0.02), loLip=0.03)
        P[f"mouthDimple{nm}"] = side_pose(S, corner=(-0.05, 0.03, -0.10))
        P[f"mouthStretch{nm}"] = side_pose(S, corner=(0.24, -0.08, -0.06), loLip=-0.05)
        P[f"mouthPress{nm}"] = side_pose(S, press=1.0)
        P[f"mouthLowerDown{nm}"] = side_pose(S, loLip=-0.20)
        P[f"mouthUpperUp{nm}"] = side_pose(S, upLip=0.16)
        P[f"browDown{nm}"] = side_pose(S, browIn=-0.0045, browMid=-0.0035, browOut=-0.002, browKnit=0.0032)
        P[f"browOuterUp{nm}"] = side_pose(S, browOut=0.0075, browMid=0.0035)
        P[f"cheekSquint{nm}"] = side_pose(S, cheek=0.0045, lidLo=0.16)
        P[f"noseSneer{nm}"] = side_pose(S, sneer=1.0, upLip=0.05, browIn=-0.0015)
    P["browInnerUp"] = {**side_pose("L", browIn=0.0095, browMid=0.003, browKnit=0.0012), **side_pose("R", browIn=0.0095, browMid=0.003, browKnit=0.0012)}
    P["jawOpen"] = {"jaw": 1.0}
    P["jawForward"] = {"jawZ": 0.004}
    P["jawLeft"] = {"jawX": 0.005}
    P["jawRight"] = {"jawX": -0.005}
    P["mouthClose"] = {"close": 1.0}
    P["mouthFunnel"] = {"funnel": 1.0}
    P["mouthPucker"] = {"pucker": 1.0}
    P["mouthLeft"] = {"mouthX": 0.28}
    P["mouthRight"] = {"mouthX": -0.28}
    P["mouthRollLower"] = {"rollL": 1.0}
    P["mouthRollUpper"] = {"rollU": 1.0}
    P["mouthShrugLower"] = {"shrugL": 1.0}
    P["mouthShrugUpper"] = {"shrugU": 1.0}
    P["cheekPuff"] = {"puff": 1.0}
    P["tongueOut"] = {"tongueOut": 1.0, "jaw": 0.25}
    P["tongueTipUp"] = {"tipUp": 1.0}
    P["tongueCurl"] = {"curl": 1.0}
    P["tongueWide"] = {"wide": 1.0}

    def mix(*pairs):
        out = {}
        for key, w in pairs:
            for c, v in P[key].items():
                v = np.asarray(v, float) * w
                out[c] = out.get(c, 0) + v
        return {k: (tuple(v) if np.ndim(v) else float(v)) for k, v in out.items()}
    both = lambda k, w: [(k + "Left", w), (k + "Right", w)]
    # visemes = channel mixes of the ARKit keys (TECH-PLAN 5.3), so the B+ fold is exact
    P["viseme_sil"] = {}
    P["viseme_PP"] = mix(("mouthClose", 0.0), *both("mouthPress", 0.55), ("mouthRollLower", 0.18), ("mouthRollUpper", 0.1))
    P["viseme_FF"] = mix(("mouthRollLower", 0.62), ("jawOpen", 0.10), *both("mouthUpperUp", 0.25), *both("mouthStretch", 0.15))
    P["viseme_TH"] = mix(("jawOpen", 0.20), ("tongueOut", 0.35), *both("mouthUpperUp", 0.15))
    P["viseme_DD"] = mix(("jawOpen", 0.20), ("tongueTipUp", 1.0), *both("mouthStretch", 0.15))
    P["viseme_kk"] = mix(("jawOpen", 0.26), *both("mouthStretch", 0.2))
    P["viseme_CH"] = mix(("mouthFunnel", 0.5), ("jawOpen", 0.14), *both("mouthUpperUp", 0.2))
    P["viseme_SS"] = mix(*both("mouthStretch", 0.42), ("jawOpen", 0.05), *both("mouthUpperUp", 0.18), *both("mouthLowerDown", 0.2), *both("mouthSmile", 0.12))
    P["viseme_nn"] = mix(("jawOpen", 0.14), ("tongueTipUp", 0.8), *both("mouthStretch", 0.12))
    P["viseme_RR"] = mix(("mouthFunnel", 0.32), ("jawOpen", 0.14), ("tongueCurl", 0.6))
    P["viseme_aa"] = mix(("jawOpen", 0.62), *both("mouthLowerDown", 0.35), *both("mouthUpperUp", 0.18))
    P["viseme_E"] = mix(*both("mouthStretch", 0.5), *both("mouthSmile", 0.22), ("jawOpen", 0.24), *both("mouthUpperUp", 0.15), *both("mouthLowerDown", 0.25))
    P["viseme_I"] = mix(*both("mouthStretch", 0.38), ("jawOpen", 0.14), *both("mouthSmile", 0.12), *both("mouthLowerDown", 0.15))
    P["viseme_O"] = mix(("mouthFunnel", 0.62), ("mouthPucker", 0.3), ("jawOpen", 0.34))
    P["viseme_U"] = mix(("mouthPucker", 0.92), ("mouthFunnel", 0.2), ("jawOpen", 0.08))
    return P


POSES = build_poses()
JAW_DEG = 22.0


def rot_about(P, C, axis, ang):
    """rotate points P (n,3) about axis (unit, 3) through C by per-point angles ang (n,) rad (Rodrigues)."""
    v = P - C
    k = axis / np.linalg.norm(axis)
    c = np.cos(ang)[:, None]; s = np.sin(ang)[:, None]
    return C + v * c + np.cross(k, v) * s + k * (v @ k)[:, None] * (1 - c)


def smoothstep(e0, e1, x):
    t = np.clip((np.asarray(x, float) - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


class Rig:
    """parts: {name: rest positions (n,3)}; meta: everything the channels need (see build.py rig_meta())."""

    def __init__(self, parts, meta):
        self.rest = {k: np.asarray(v, float) for k, v in parts.items()}
        self.m = meta
        self._prep()

    # ------------------------------------------------------------------ precomputed fields
    def _prep(self):
        m = self.m
        mo = m["mouth"]
        self.R = np.stack([mo["ex"], mo["ey"], mo["ez"]], 1)       # world <- local
        self.local = {k: (P - mo["M"]) @ self.R for k, P in self.rest.items()}
        ax = mo["ax"]
        f = {}
        for k, Q in self.local.items():
            X, Y, Z = Q[:, 0] / ax, Q[:, 1] / ax, Q[:, 2] / ax
            d = np.hypot(np.maximum(np.abs(X) - 1, 0), Y)            # distance to the lip-line segment (half-widths)
            f[k] = dict(X=X, Y=Y, Z=Z, d=d)
        self.f = f
        # upper / lower / corner flags by topology for the mouth rings + bag (skin only)
        n = len(self.rest["skin"])
        self.lipside = np.zeros(n)          # +1 upper half, -1 lower half, 0 corner, nan = not a mouth ring vertex
        self.lipside[:] = np.nan
        self.ringlevel = np.full(n, -1)
        lm_, rm_, upper, lower = mo["split"]
        for lev, ring in enumerate(mo["rings"]):
            ring = np.asarray(ring)
            self.lipside[ring[upper]] = 1; self.lipside[ring[lower]] = -1
            self.lipside[ring[[lm_, rm_]]] = 0
            self.ringlevel[ring] = lev
        self.lipside[mo["cap"]] = 0; self.ringlevel[mo["cap"]] = len(mo["rings"])

    def _jaw_weight(self, part):
        F = self.f[part]
        mo = self.m["mouth"]
        if part == "skin":
            w = smoothstep(0.30, -0.42, F["Y"])
            ls = self.lipside
            ring = ~np.isnan(ls)
            oval = 1 - 0.5 * smoothstep(0.45, 1.05, np.abs(F["X"]))
            w = np.where(ring, np.where(ls > 0, 0.0, np.where(ls < 0, oval, 0.4)), w)
            # rings 0-2 (skin around the lips): blend topology with position so the cheeks stretch smoothly
            lev = self.ringlevel
            outer = ring & (lev <= 1)
            w = np.where(outer, 0.5 * w + 0.5 * smoothstep(0.30, -0.42, F["Y"]), w)
            zb = mo["pivotLocalZ"] / mo["ax"]
            w = w * smoothstep(zb + 0.25, zb + 1.6, F["Z"])
            w = w * (1 - smoothstep(1.6, 2.6, np.abs(F["X"]) - 0.0) * smoothstep(-0.2, 0.6, F["Y"] + 0.6))
            return w
        if part in ("teethLo", "tongue"):
            return np.ones(len(F["X"]))
        return np.zeros(len(F["X"]))

    def _corner_w(self, part, S):
        mo = self.m["mouth"]
        Q = self.local[part]
        cx = mo["cornerLocal"][0] * (1 if S == "L" else -1)
        dx = (Q[:, 0] - cx) / mo["ax"]; dy = Q[:, 1] / mo["ax"]
        # wider toward the cheek (outside), tighter across the midline
        sx = np.where(dx * (1 if S == "L" else -1) > 0, 0.95, 0.75)
        w = np.exp(-((dx / sx) ** 2 + (dy / np.where(dy > 0, 0.9, 0.62)) ** 2))
        w *= smoothstep(-2.0, -0.6, Q[:, 2] / mo["ax"])                # not the back of the head
        return w

    def _lip_w(self, part):
        F = self.f[part]
        return 1 - smoothstep(0.08, 0.75, F["d"])

    # ------------------------------------------------------------------ evaluate
    def evaluate(self, pose):
        g = lambda k, d=0.0: pose.get(k, d)
        m = self.m
        mo = m["mouth"]
        ax = mo["ax"]
        R = self.R
        out = {}
        for part, P0 in self.rest.items():
            F = self.f[part]
            Q = self.local[part].copy()                               # local (x out-left, y up, z forward)
            dQ = np.zeros_like(Q)
            lipw = self._lip_w(part)
            up = np.where(np.isnan(self.lipside), (F["Y"] > 0).astype(float), (self.lipside > 0).astype(float)) if part == "skin" \
                else (F["Y"] > 0).astype(float)
            lo = 1 - up
            if part == "teethUp":
                up = np.ones(len(Q)); lo = np.zeros(len(Q))
            if part in ("teethLo", "tongue"):
                up = np.zeros(len(Q)); lo = np.ones(len(Q))
            mouthpart = part in ("skin", "teethUp", "teethLo", "tongue")
            if mouthpart:
                soft = part == "skin"
                for S, sg in (("L", 1), ("R", -1)):
                    c = g(f"corner_{S}", None)
                    if c is not None and soft:
                        w = self._corner_w(part, S)
                        dQ += w[:, None] * np.array([c[0] * sg, c[1], c[2]]) * ax
                    side = smoothstep(-0.25, 0.35, F["X"] * sg)
                    if soft:
                        ul = g(f"upLip_{S}"); ll = g(f"loLip_{S}")
                        if ul:
                            dQ[:, 1] += ul * ax * lipw * up * side * (1 - 0.4 * smoothstep(0.4, 1.0, np.abs(F["X"])))
                        if ll:
                            dQ[:, 1] += ll * ax * lipw * lo * side * (1 - 0.4 * smoothstep(0.4, 1.0, np.abs(F["X"])))
                        pr = g(f"press_{S}")
                        if pr:
                            dQ[:, 1] += pr * ax * 0.05 * lipw * (lo - up) * side
                            dQ[:, 2] -= pr * ax * 0.04 * lipw * side
                        sn = g(f"sneer_{S}")
                        if sn:
                            nose = m["nose"]
                            dn = np.linalg.norm(P0 - nose["wing" + S], axis=1) / ax
                            dQ[:, 1] += sn * 0.16 * ax * np.exp(-(dn / 0.55) ** 2)
                            dQ[:, 2] += sn * 0.03 * ax * np.exp(-(dn / 0.55) ** 2)
                if soft:
                    pk, fu = g("pucker"), g("funnel")
                    if pk or fu:
                        w = 1 - smoothstep(0.2, 1.25, F["d"])
                        sq = (0.50 * pk + 0.30 * fu)
                        dQ[:, 0] -= Q[:, 0] * sq * w
                        dQ[:, 2] += (0.26 * pk + 0.20 * fu) * ax * w * (1 - smoothstep(0.0, 1.2, np.abs(F["X"])) * 0.5)
                        if fu:
                            ow = (1 - smoothstep(0.0, 0.5, F["d"])) * (1 - smoothstep(0.2, 1.0, np.abs(F["X"])) * 0.7)
                            dQ[:, 1] += fu * 0.13 * ax * ow * (up - lo * 1.15)
                    for key, sgn, mask in (("rollU", 1, up), ("rollL", -1, lo)):
                        v = g(key)
                        if v:
                            w = (1 - smoothstep(0.0, 0.6, F["d"])) * mask
                            # roll the lip about the lip-line axis: in toward the teeth and toward the line
                            dQ[:, 2] -= v * 0.12 * ax * w
                            dQ[:, 1] -= sgn * v * 0.10 * ax * w * (1 - smoothstep(0.0, 0.2, F["d"]) * 0.6)
                    for key, mask, dy, dz in (("shrugU", up, 0.07, 0.05), ("shrugL", lo, 0.10, 0.05)):
                        v = g(key)
                        if v:
                            w = (1 - smoothstep(0.1, 1.3, F["d"])) * mask
                            dQ[:, 1] += v * dy * ax * w; dQ[:, 2] += v * dz * ax * w
                    mx = g("mouthX")
                    if mx:
                        w = 1 - smoothstep(0.3, 1.8, F["d"])
                        dQ[:, 0] += mx * ax * w
                    pf = g("puff")
                    if pf:
                        for S, sg in (("L", 1), ("R", -1)):
                            dc = np.hypot((F["X"] - 1.7 * sg) / 0.9, (F["Y"] + 0.1) / 1.0)
                            w = np.exp(-dc ** 2) * smoothstep(-1.8, -0.2, F["Z"])
                            dQ[:, 0] += pf * 0.28 * ax * w * sg; dQ[:, 2] += pf * 0.12 * ax * w
                        dQ[:, 2] += pf * 0.05 * ax * (1 - smoothstep(0.0, 0.5, F["d"]))
            # cheeks (skin): up + forward under each eye; pushes the lower lid via lidLo in the pose table
            if part == "skin":
                for S in ("L", "R"):
                    ch = g(f"cheek_{S}")
                    if ch:
                        cc = m["cheek"][S]
                        dc = np.linalg.norm(P0 - cc, axis=1) / ax
                        w = np.exp(-(dc / 1.25) ** 2)
                        dW = np.array([0, 0, 1.0]) * ch + np.array([0, -1.0, 0]) * ch * 0.35
                        dQ += (w[:, None] * dW) @ R
            Pn = P0 + dQ @ R.T
            # ---------------- brows (brow mesh + forehead skin follow)
            for S in ("L", "R"):
                bi, bm, bo, bk = g(f"browIn_{S}"), g(f"browMid_{S}"), g(f"browOut_{S}"), g(f"browKnit_{S}")
                if not (bi or bm or bo or bk):
                    continue
                B = m["brow"][S]
                if part == "brows":
                    t = B["t"]; sel = B["mask"]
                    w_in = (1 - smoothstep(0.0, 0.55, t)); w_out = smoothstep(0.45, 1.0, t); w_mid = 1 - w_in - w_out
                    dy = bi * w_in + bm * w_mid + bo * w_out
                    dz = np.zeros_like(t)
                    Pn[sel] += B["upT"] * dy[:, None]
                    Pn[sel] += B["inward"] * (bk * w_in)[:, None]
                    Pn[sel] += B["upT"] * (-0.35 * bk * w_in)[:, None]
                elif part == "skin":
                    # forehead + upper lid skin follow (30% under the brow, falling off toward hairline and lid)
                    d = B["skinW"]
                    tt = B["skinT"]
                    w_in = (1 - smoothstep(0.0, 0.55, tt)); w_out = smoothstep(0.45, 1.0, tt); w_mid = 1 - w_in - w_out
                    dy = (bi * w_in + bm * w_mid + bo * w_out) * 0.32 * d
                    Pn += np.array([0, 0, 1.0]) * dy[:, None]
                    Pn += B["inwardSkin"] * (bk * w_in * 0.25 * d)[:, None]
            # ---------------- lids (rotation about each eyeball centre: the lid wraps the ball by construction)
            for S in ("L", "R"):
                E = m["eye"][S]
                a_up = g(f"lidUp_{S}"); a_lo = g(f"lidLo_{S}"); d_up = g(f"lidUpDeg_{S}"); d_lo = g(f"lidLoDeg_{S}"); yw = g(f"lidYaw_{S}")
                if not (a_up or a_lo or d_up or d_lo or yw):
                    continue
                gap = E["gap"]                                          # per ring index p (rad, >= 0)
                ang_up = a_up * gap + np.radians(d_up) * E["upMask"]
                ang_lo = a_lo * gap + np.radians(d_lo) * E["loMask"]
                ang_up = ang_up * E["upMask"]; ang_lo = ang_lo * E["loMask"]
                pr = E["partner"]                                       # upper p <-> lower p of the same column
                au = np.where(E["upMask"] > 0, ang_up, ang_up[pr]); al = np.where(E["loMask"] > 0, ang_lo, ang_lo[pr])
                over = (au + al) - gap * 0.995                          # never past the meeting line (seal, not overlap)
                fix = np.maximum(over, 0)
                tot = np.maximum(au + al, 1e-9)
                au = au - fix * au / tot; al = al - fix * al / tot
                ang_up = au * E["upMask"]; ang_lo = al * E["loMask"]
                per_p = ang_up - ang_lo                                 # + rotates down (closing for the upper lid)
                if part == "skin":
                    ids, p_idx, fall = E["skinIds"], E["skinP"], E["skinFall"]
                elif part == "brows":
                    ids, p_idx, fall = E["lashIds"], E["lashP"], E["lashFall"]
                else:
                    ids = None
                if ids is not None and len(ids):
                    a = per_p[p_idx] * fall
                    P0 = Pn[ids].copy()
                    Pr = rot_about(P0, E["C"], E["axis"], a)
                    # linear morphs travel the CHORD: push the closed position out so the half-way point of every
                    # visible lid vertex stays outside the eyeball (G-partial; the closed lid reads as a soft puffy lid)
                    r0 = np.linalg.norm(P0 - E["C"], axis=1)
                    vis = r0 > E["r"] * 1.02
                    rt = E["r"] * 1.03
                    ca = np.cos(np.abs(a))
                    need = -r0 * ca + np.sqrt(np.maximum(r0 ** 2 * ca ** 2 - r0 ** 2 + 4 * rt ** 2, 0))
                    v = Pr - E["C"]; rr_ = np.linalg.norm(v, axis=1)
                    scale = np.where(vis & (need > rr_), need / np.maximum(rr_, 1e-9), 1.0)
                    Pn[ids] = E["C"] + v * scale[:, None]
                    if yw:
                        Pn[ids] = rot_about(Pn[ids], E["C"], np.array([0, 0, 1.0]), np.full(len(ids), np.radians(yw) * 0.5) * fall)
            # ---------------- tongue bends (local mouth frame, before the jaw)
            if part == "tongue":
                Tg = m["tongue"]
                t = Tg["t"]
                Qn = (Pn - mo["M"]) @ R
                for key, piv, deg in (("tipUp", 0.45, 55.0), ("curl", 0.55, 95.0)):
                    v = g(key)
                    if v:
                        pz = Tg["z0"] + piv * Tg["len"]
                        w = smoothstep(piv, 1.0, t)
                        a = np.radians(deg) * v * w
                        y0 = Tg["y0"]
                        yy, zz = Qn[:, 1] - y0, Qn[:, 2] - pz
                        c, s = np.cos(a), np.sin(a)
                        Qn[:, 1] = y0 + yy * c + zz * s
                        Qn[:, 2] = pz + zz * c - yy * s
                        Qn[:, 1] += v * 0.0015 * w
                v = g("wide")
                if v:
                    w = smoothstep(0.2, 0.6, t)
                    Qn[:, 0] *= 1 + 0.32 * v * w
                    Qn[:, 1] = Tg["y0"] + (Qn[:, 1] - Tg["y0"]) * (1 - 0.25 * v * w)
                v = g("tongueOut")
                if v:
                    w = smoothstep(0.1, 1.0, t)
                    Qn[:, 2] += v * Tg["out"] * w
                    Qn[:, 1] -= v * 0.004 * w ** 2
                Pn = mo["M"] + Qn @ R.T
            # ---------------- jaw (last: rotation composes non-linearly with the shapes above -> correctives)
            jw = g("jaw"); jx = g("jawX"); jz = g("jawZ"); cl = g("close")
            wj = self._jaw_weight(part)
            if jw or cl:
                ang = np.radians(JAW_DEG) * jw * wj
                if cl and part == "skin":
                    # mouthClose: the lips re-close against the jaw (lower lip rotates back up, upper lip comes down)
                    lipc = (1 - smoothstep(0.0, 0.85, F["d"])) * wj
                    ang = ang - np.radians(JAW_DEG) * cl * lipc * 0.92
                    Pn = Pn + np.array([0, 0, -1.0]) * (cl * 0.06 * ax * (1 - smoothstep(0.0, 0.5, F["d"])) * up)[:, None]
                if cl and part == "teethLo":
                    pass
                Pn = rot_about(Pn, mo["pivot"], mo["ex"], ang)
            if jx or jz:
                Pn = Pn + (mo["ex"] * jx + mo["ez"] * jz)[None, :] * wj[:, None]
            out[part] = Pn
        bp = self.m.get("brow_proj")
        if bp is not None and "brows" in out and pose:
            # brows ride the posed skin: nearest point on the deformed skin + the rest offset along its normal
            from mathutils.bvhtree import BVHTree
            from mathutils import Vector
            Ps = out["skin"]
            bvh = BVHTree.FromPolygons([tuple(v) for v in Ps], bp["faces"], all_triangles=False)
            Pb = out["brows"]
            for i, off in zip(bp["ids"], bp["off"]):
                loc, nor, idx, d = bvh.find_nearest(Vector(Pb[i]))
                if loc is not None:
                    Pb[i] = np.array(loc) + np.array(nor) * off
        return out


def merge_pose(*ps):
    out = {}
    for p in ps:
        for c, v in p.items():
            if np.ndim(v):
                out[c] = tuple(np.add(out.get(c, (0.0, 0.0, 0.0)), v))
            else:
                out[c] = out.get(c, 0.0) + v
    return out


def all_keys():
    return ARKIT + VISEMES + TONGUE + list(CORRECTIVES)


def bake(rig, keys=None):
    """{key: {part: delta (n,3)}} at weight 1; correctives by the product rule."""
    rest = rig.evaluate({})
    D = {}
    keys = keys or all_keys()
    for k in keys:
        if k in CORRECTIVES:
            a, b = CORRECTIVES[k]
            pa, pb = POSES[a], POSES[b]
            ab = merge_pose(pa, pb)
            Pab, Pa, Pb = rig.evaluate(ab), rig.evaluate(pa), rig.evaluate(pb)
            D[k] = {p: Pab[p] - Pa[p] - Pb[p] + rest[p] for p in rest}
        else:
            Pk = rig.evaluate(POSES[k])
            D[k] = {p: Pk[p] - rest[p] for p in rest}
    return D
