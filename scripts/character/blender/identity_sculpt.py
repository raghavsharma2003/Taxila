"""Identity sculpt layer: landmark-anchored smooth displacements on the MPFB basis, driven by a per-look `sculpt` block.

Why: MakeHuman modelling targets move whole regions by a fixed shape, so three looks built from targets alone share
one nose, one lip line and one eye shape (art-director review 2026-10-03, item 8). This layer moves named anatomical
regions by millimetres, anchored on landmarks found on OUR mesh, with a Gaussian (RBF) falloff, so each look gets its
own brow ridge, lid crease, alar width, philtrum, lip line, jaw angle, cheek fat pad and chin.

It runs after the identity targets are baked and before the head scale, the face units and the proxies, so every
key delta and every MHCLO proxy (brows, lashes, teeth) is fitted to the sculpted basis.

Look spec:  "sculpt": {"<region>": [dx, dy, dz] (mm) | {"d": [dx, dy, dz], "r": radius_mm}, ...}
Axes are the character's: dx + = outward (mirrored per side for paired regions), dy + = forward (towards the
viewer), dz + = up. Paired regions are applied to both sides symmetrically; the seeded asymmetry stays in the targets.

When the Codex turnarounds land, these parameters are meant to be FITTED to ~40 annotated landmarks (front +
profile JSON; MediaPipe Apache-2.0 allowed at build time, InsightFace not) instead of set by hand.
"""
import numpy as np

# region: (anchor function name, paired, default radius mm)
REGIONS = {
    "browRidge": ("brow", True, 13),
    "browInner": ("browInner", True, 8),
    "lidCrease": ("lidCrease", True, 7),
    "noseBridge": ("bridge", False, 9),
    "noseTip": ("noseTip", False, 8),
    "alar": ("alar", True, 7),
    "philtrum": ("philtrum", False, 6),
    "upperLip": ("upperLip", False, 9),
    "lowerLip": ("lowerLip", False, 9),
    "mouthCorner": ("mouthCorner", True, 7),
    "cheekPad": ("cheekPad", True, 16),
    "cheekBone": ("cheekBone", True, 14),
    "jawAngle": ("jawAngle", True, 18),
    "chin": ("chin", False, 13),
}


def landmarks(P, face_mask, eyeC, lips_w):
    """Anchors (Blender space: x = her left, -y = forward, +z up) found on the current basis."""
    eL, eR = eyeC["L"], eyeC["R"]
    ez = 0.5 * (eL[2] + eR[2])
    ey = 0.5 * (eL[1] + eR[1])
    lip = np.nonzero((lips_w > 0.3) & face_mask)[0]
    lipC = P[lip].mean(0)
    mcL = P[lip[np.argmax(P[lip, 0])]]
    mcR = P[lip[np.argmin(P[lip, 0])]]
    mid = face_mask & (np.abs(P[:, 0]) < 0.004) & (P[:, 2] > lipC[2]) & (P[:, 2] < ez)
    noseTip = P[np.nonzero(mid)[0][np.argmin(P[mid, 1])]]
    chs = face_mask & (np.abs(P[:, 0]) < 0.006) & (P[:, 2] < lipC[2] - 0.02) & (P[:, 1] < lipC[1] + 0.03)
    chin = P[np.nonzero(chs)[0][np.argmin(P[chs, 2] + 0.5 * P[chs, 1])]]

    def surf(q, wfront=1.0):
        """Nearest face-surface vertex to q, preferring the frontmost (so anchors sit on the skin, not inside)."""
        idx = np.nonzero(face_mask)[0]
        d = np.linalg.norm(P[idx] - q, axis=1) + 0.3 * wfront * np.maximum(0, P[idx, 1] - q[1])
        return P[idx[np.argmin(d)]]

    A = {}
    for s, e, sg in (("L", eL, 1), ("R", eR, -1)):
        A["brow" + s] = surf(e + np.array([sg * 0.004, -0.02, 0.019]))
        A["browInner" + s] = surf(e + np.array([-sg * 0.012, -0.02, 0.017]))
        A["lidCrease" + s] = surf(e + np.array([0, -0.02, 0.008]))
        A["alar" + s] = surf(noseTip + np.array([sg * 0.016, 0.012, 0.006]))
        A["mouthCorner" + s] = mcL if sg > 0 else mcR
        A["cheekPad" + s] = surf(e + np.array([sg * 0.01, -0.02, -0.03]))
        A["cheekBone" + s] = surf(e + np.array([sg * 0.024, -0.01, -0.016]))
        A["jawAngle" + s] = surf(np.array([sg * 0.055, ey + 0.055, ez - 0.085]), 0.0)
    A["bridge"] = surf(np.array([0, ey - 0.02, ez + 0.002]))
    A["noseTip"] = noseTip
    A["philtrum"] = surf(0.5 * (noseTip + lipC) + np.array([0, -0.01, 0.004]))
    A["upperLip"] = surf(lipC + np.array([0, -0.01, 0.004]))
    A["lowerLip"] = surf(lipC + np.array([0, -0.01, -0.006]))
    A["chin"] = chin
    return A


def apply(P, weight_mask, A, spec, log=None):
    """Return the displaced basis. weight_mask (N,) in [0,1] limits the layer to the head (1) and fades at the neck."""
    out = P.copy()
    done = []
    for name, v in (spec or {}).items():
        if name.startswith("_"):
            continue
        if name not in REGIONS:
            raise KeyError(f"identity_sculpt: unknown region {name!r} (known: {sorted(REGIONS)})")
        anchor, paired, r_mm = REGIONS[name]
        if isinstance(v, dict):
            d, r_mm = v["d"], v.get("r", r_mm)
        else:
            d = v
        d = np.array(d, float) / 1000.0
        r = r_mm / 1000.0
        sides = (("L", 1), ("R", -1)) if paired else (("", 1),)
        for s, sg in sides:
            c = A[anchor + s]
            disp = np.array([sg * d[0], -d[1], d[2]])           # character axes -> Blender (forward = -y)
            w = np.exp(-(np.linalg.norm(P - c, axis=1) / r) ** 2) * weight_mask
            out += w[:, None] * disp[None, :]
        done.append(f"{name}{tuple(np.round(d * 1000, 2))}")
    if log:
        log("sculpt: " + ", ".join(done))
    return out
