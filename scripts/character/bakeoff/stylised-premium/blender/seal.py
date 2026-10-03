"""procedural-v3: lip seal + G4 / G5 on any face object (used on the subdivided H face, whose Catmull-Clark smoothing
pulls the touching lips apart). Same method and bars as build_look.py's iteration-2 gates:
  seal  : every upper-lip vertex within 2.4 mm of the lower lip's SURFACE (and vice versa) moves half-way to it, spread
          with a 7 mm falloff over the lips, iterated to p95 <= 0.25 mm; basis (+ every key), viseme_PP, mouthClose.
  G5    : contact-vertex distance to the opposite lip surface, p95 <= 0.3 mm (rest, PP, jaw 0.3 + close 0.3 +/- corr.)
          AND 0% of rays from the mouth bag toward the lip line escaping between the lips.
  G4    : 0% of rays from the eyeball centre through the cornea cap escaping at blink (+ lookDown / squint + corr.).
"""
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from scipy.spatial import cKDTree
from mpfb_env import co, key_co, set_key_co, deltas, tris_of
import keys as K


def _attr(ob, nm):
    a = np.zeros(len(ob.data.vertices), np.float32)
    ob.data.attributes[nm].data.foreach_get("value", a)
    return a


def seal_and_gate(face, eyes, eyeC, eyeR, log=print):
    region = np.round(_attr(face, "region"))
    lipsW = _attr(face, "lipsW")
    skin = region == 0
    fb, FD = deltas(face)
    lipsel = np.nonzero((lipsW > 0.3) & skin)[0]
    jaw_m = np.linalg.norm(FD["jawOpen"], axis=1)
    upper = lipsel[jaw_m[lipsel] < 0.4 * jaw_m[lipsel].max()]
    lowerl = lipsel[jaw_m[lipsel] >= 0.4 * jaw_m[lipsel].max()]
    F_all = tris_of(face.data)
    up_s = np.zeros(len(fb), bool); up_s[upper] = True
    lo_s = np.zeros(len(fb), bool); lo_s[lowerl] = True
    UT = F_all[np.all(up_s[F_all], axis=1)]
    LT = F_all[np.all(lo_s[F_all], axis=1)]
    lips_reg = np.clip(lipsW * skin, 0, 1)

    def contacts(state, reach=0.0024):
        bu = BVHTree.FromPolygons([Vector(p) for p in state], UT.tolist())
        bl = BVHTree.FromPolygons([Vector(p) for p in state], LT.tolist())
        out = []
        for vs, b in ((upper, bl), (lowerl, bu)):
            for v in vs:
                loc, _, _, d = b.find_nearest(Vector(state[v]), reach)
                if loc is not None:
                    out.append((int(v), np.array(loc), float(d)))
        return out

    def fix_of(state, falloff=0.007):
        fix = np.zeros_like(state)
        src = []
        for v, loc, d in contacts(state):
            fix[v] = 0.5 * (loc - state[v])
            src.append(v)
        if not src:
            return fix
        return K._spread(state, fix, np.array(sorted(set(src))), lips_reg, radius=falloff)

    def p95(state):
        g = [d for _, _, d in contacts(state)]
        return float(np.percentile(g, 95)) if g else 0.0

    kbs = face.data.shape_keys.key_blocks

    def it_seal(state_fn, apply_fn, bar=0.00025, n=12):
        for it in range(n):
            st = state_fn()
            if p95(st) <= bar:
                return it
            apply_fn(fix_of(st))
        return n

    def _all(f):
        for kb in kbs:
            set_key_co(kb, key_co(kb) + f)

    its = {"rest": it_seal(lambda: key_co(kbs[0]), _all)}
    its["viseme_PP"] = it_seal(lambda: key_co(kbs["viseme_PP"]), lambda f: set_key_co(kbs["viseme_PP"], key_co(kbs["viseme_PP"]) + f))
    its["mouthClose"] = it_seal(lambda: key_co(kbs[0]) + (key_co(kbs["jawOpen"]) - key_co(kbs[0])) + (key_co(kbs["mouthClose"]) - key_co(kbs[0])),
                                lambda f: set_key_co(kbs["mouthClose"], key_co(kbs["mouthClose"]) + f))
    # stylised-premium: the gate also measures the PARTIAL close (jaw 0.3 + close 0.3); on the slimmer stylised lips the
    # contact slides non-linearly between rest and full close, so alternate a seal of the partial state (fix / 0.3 into
    # mouthClose) with a re-seal of the full state until both are under the bar
    _c = lambda a: key_co(kbs[0]) + a * ((key_co(kbs["jawOpen"]) - key_co(kbs[0])) + (key_co(kbs["mouthClose"]) - key_co(kbs[0])))
    for _r in range(4):
        its[f"partial{_r}"] = it_seal(lambda: _c(0.3), lambda f: set_key_co(kbs["mouthClose"], key_co(kbs["mouthClose"]) + f / 0.3 * 0.6), bar=0.00022, n=4)
        its[f"full{_r}"] = it_seal(lambda: _c(1.0), lambda f: set_key_co(kbs["mouthClose"], key_co(kbs["mouthClose"]) + f), n=4)
    fb, FD = deltas(face)

    def gap(state):
        g = np.array([d for _, _, d in contacts(state)]) * 1000
        return {"p95": round(float(np.percentile(g, 95)), 3), "max": round(float(g.max()), 3), "contacts": int(len(g))} if len(g) else None

    skin_tris = F_all[np.all(skin[F_all], axis=1)]

    def bvh_of(state):
        return BVHTree.FromPolygons([Vector(p) for p in state], skin_tris.tolist())

    dist, nn = cKDTree(fb[lowerl]).query(fb[upper])
    pair = dist < 0.0016
    pu, pl = upper[pair], lowerl[nn[pair]]

    def aperture(state):
        bvh = bvh_of(state)
        c = state[region == 3].mean(0)
        tgt = 0.5 * (state[pu] + state[pl])
        esc = 0
        for p in tgt:
            d = Vector(p - c)
            esc += bvh.ray_cast(Vector(c), d.normalized(), d.length + 0.02)[0] is None
        return round(100 * esc / max(1, len(tgt)), 1)

    S = {"rest": fb, "viseme_PP": fb + FD["viseme_PP"],
         "jawOpen0.3+mouthClose0.3": fb + 0.3 * FD["jawOpen"] + 0.3 * FD["mouthClose"],
         "jawOpen0.3+mouthClose0.3+corrective": fb + 0.3 * FD["jawOpen"] + 0.3 * FD["mouthClose"] + 0.09 * FD["jawOpen_mouthClose"]}
    g5 = {k: gap(v) for k, v in S.items()}
    ap = {k: aperture(v) for k, v in S.items()}
    E = co(eyes.data)

    def lid_escape(state):
        bvh = bvh_of(state)
        out = {}
        for side, sg in (("L", 1), ("R", -1)):
            c = eyeC[side]
            sel = E[(np.sign(E[:, 0]) == sg)]
            fwd = sel[(sel - c)[:, 1] < -0.85 * eyeR[side]]
            esc = 0
            for p in fwd:
                dv = Vector(p - c).normalized()
                esc += bvh.ray_cast(Vector(c) + dv * (eyeR[side] * 0.5), dv, 0.05)[0] is None
            out[side] = round(100 * esc / max(1, len(fwd)), 2)
        return out

    blink = fb + FD["eyeBlinkLeft"] + FD["eyeBlinkRight"]
    g4 = {"blink": lid_escape(blink),
          "blink+lookDown+corrective": lid_escape(blink + FD["eyeLookDownLeft"] + FD["eyeLookDownRight"]
                                                  + FD["eyeBlink_eyeLookDownLeft"] + FD["eyeBlink_eyeLookDownRight"]),
          "blink+squint+corrective": lid_escape(blink + FD["eyeSquintLeft"] + FD["eyeSquintRight"]
                                                + FD["eyeBlink_eyeSquintLeft"] + FD["eyeBlink_eyeSquintRight"])}
    ok = all(v is None or v["p95"] <= 0.3 for v in g5.values()) and all(v == 0 for v in ap.values()) \
        and all(x == 0 for v in g4.values() for x in v.values())
    return {"sealIters": its, "G5_lip_gap_mm": g5, "G5_aperture_pct": ap, "G4_lid_seal_escaped_pct": g4, "pass": bool(ok)}
