"""procedural-v3 skin micro-detail (CHARACTER-PIPELINE §10.4): everything a function of OUR mesh, no photo input.

  zones(Pt, L)       per-texel anatomical zone weights (nose, cheeks, forehead, chin, upper lip, lips, lids, under-eye,
                     perioral, neck, ears) from the rig's own landmarks
  height_v3(...)     the 2048 base height: multi-octave, zone-scaled pores (wider, deeper on the nose and inner cheeks,
                     fine on the forehead and lids, none on the vermilion), orange-peel, lip lines, a 34-year-old's faint
                     static lines (forehead, crow's feet, under-eye, two neck rings)
  albedo_v3(...)     melanin mottling at three scales, periorbital and perioral hyperpigmentation (MST 6-8 faces), alar
                     and cheek redness, a natural pigmented lip (darker border, lighter centre, lines), two small moles
  detail_map(...)    1024 RGBA: R peach-fuzz density, G subsurface tint weight, B moisture (lip centre, lid margins,
                     caruncle), A micro-normal strength
  micro_tile(...)    512 RGBA tile (shader-tiled): RG micro-normal (skin crosshatch + micro pores), B specular
                     breakup, A micro cavity
"""
import math
import numpy as np


def _g(P, c, s):
    return np.exp(-((np.linalg.norm(P - c, axis=1) / s) ** 2))


def _ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def zones(Pt, L):
    """L: dict of landmarks (Blender space): eyeL, eyeR, eyeR_, noseTip, lipC, mcL, mcR, chin, browZ."""
    eL, eR, r = L["eyeL"], L["eyeR"], L["eyeRad"]
    nose = _g(Pt, L["noseTip"] + np.array([0, 0.006, 0.006]), 0.016) + 0.6 * _g(Pt, L["noseTip"] + np.array([0, 0.012, 0.022]), 0.012)
    alar = sum(_g(Pt, L["noseTip"] + np.array([s * 0.014, 0.010, -0.002]), 0.007) for s in (1, -1))
    cheek = sum(_g(Pt, e + np.array([np.sign(e[0]) * 0.012, -0.004, -0.030]), 0.022) for e in (eL, eR))
    zf = Pt[:, 2] - L["browZ"]
    forehead = _ss(0.004, 0.016, zf) * (1 - _ss(0.07, 0.09, zf)) * (1 - _ss(0.05, 0.07, np.abs(Pt[:, 0])))
    chin = _g(Pt, L["chin"] + np.array([0, 0.004, 0.008]), 0.016)
    upl = _g(Pt, 0.5 * (L["noseTip"] + L["lipC"]) + np.array([0, 0.002, 0.002]), 0.011)
    lid_up = sum(_g(Pt, e + np.array([0, -0.006, r * 0.55]), 0.008) for e in (eL, eR))
    under = sum(_g(Pt, e + np.array([0, -0.004, -r * 0.95]), 0.010) for e in (eL, eR))
    perioral = sum(_g(Pt, m + np.array([np.sign(m[0]) * 0.003, 0.0, 0.0]), 0.010) for m in (L["mcL"], L["mcR"]))
    neck = _ss(0.0, 0.035, L["chin"][2] - Pt[:, 2])
    return dict(nose=np.clip(nose, 0, 1), alar=np.clip(alar, 0, 1), cheek=np.clip(cheek, 0, 1), forehead=forehead,
                chin=chin, upl=upl, lid=np.clip(lid_up, 0, 1), under=np.clip(under, 0, 1), perioral=np.clip(perioral, 0, 1),
                neck=neck)


def height_v3(Pt, NZ, Z, lipT, earT, age_years, eyeC, eyeR, browZ, scalp):
    face = 1 - scalp
    lip = lipT
    # pore density/size by zone: nose and inner cheeks wide and deep, forehead and chin medium, lids/lips fine/none
    pore_scale = 900 + 400 * Z["forehead"] + 700 * Z["lid"] + 500 * Z["neck"] - 250 * Z["nose"] - 150 * Z["cheek"]
    depth = (0.55 + 0.6 * Z["nose"] + 0.35 * Z["cheek"] + 0.2 * Z["chin"] + 0.15 * Z["forehead"]
             - 0.4 * Z["lid"] - 0.35 * Z["under"]) * (1 - 0.95 * lip) * face
    q = Pt * pore_scale[:, None]
    n1 = NZ(q)
    n2 = NZ(q * 1.9 + 7.3)
    pits = -np.clip(n1 - 0.28, 0, 1) * 1.0 - 0.45 * np.clip(n2 - 0.38, 0, 1)
    h = 0.00011 * pits * depth
    # orange peel + soft undulation
    h += 0.00004 * NZ.fbm(Pt * 420.0 + 2.1, 2) * face * (1 - lip)
    h += 0.00010 * NZ.fbm(Pt * 120.0, 3)
    # lip lines: vertical, broken, deepest at the centre of each lip
    ll = np.clip(np.abs(np.sin(Pt[:, 0] * 2300 + NZ(Pt * 300) * 2.2)) ** 7, 0, 1) * (0.6 + 0.4 * NZ(Pt * 900))
    h += -0.000045 * lip * ll
    # static lines (age): appear from ~30, faint at 34
    a = float(np.clip((age_years - 28) / 20, 0, 1))
    if a > 0:
        zf = Pt[:, 2] - browZ + 2.2 * Pt[:, 0] ** 2
        fh = _ss(0.014, 0.022, zf) * (1 - _ss(0.04, 0.055, zf)) * (1 - _ss(0.035, 0.055, np.abs(Pt[:, 0])))
        brk = np.clip(NZ(Pt * 140) * 1.6 + 0.5, 0, 1)
        h += -0.00016 * a * fh * brk * np.clip(np.sin(zf * 2 * math.pi / 0.0105 + NZ(Pt * 50) * 1.4), 0, 1) ** 4
        for side, sg in (("L", 1), ("R", -1)):
            c = eyeC[side] + np.array([sg * (eyeR + 0.005), 0.004, -0.002])
            rel = Pt - c
            r = np.sqrt(rel[:, 0] ** 2 + rel[:, 2] ** 2)
            ang = np.arctan2(rel[:, 2], sg * rel[:, 0])
            m = _ss(0.003, 0.006, r) * (1 - _ss(0.012, 0.018, r)) * (sg * rel[:, 0] > -0.001)
            h += -0.00012 * a * m * np.clip(np.sin(ang * 7 + NZ(Pt * 70) * 1.5), 0, 1) ** 5
            m2 = _g(Pt, eyeC[side] + np.array([0, -0.004, -eyeR * 1.05]), 0.007) * (rel[:, 2] < -eyeR * 0.7)
            h += -0.00008 * a * m2 * np.clip(np.sin(rel[:, 2] * 2 * math.pi / 0.0018 + NZ(Pt * 160)), 0, 1) ** 3
        # neck rings (two soft horizontal lines)
        for zc in (0.022, 0.042):
            h += -0.00025 * a * Z["neck"] * np.exp(-(((browZ - 0.12) - Pt[:, 2] - zc + 0.004 * NZ(Pt * 40)) / 0.0016) ** 2)
    return h


def albedo_v3(A, Pt, NZ, Z, lipT, base, shade, lip_col, sk):
    """Modulate the iteration-2 albedo A (linear RGB). Returns the new albedo."""
    mst = int(sk["mst"])
    k = float(np.clip((mst - 4) / 4, 0.3, 1.0))
    # melanin mottling at three scales (large patches, freckle scale, fine)
    m = NZ.fbm(Pt * 22.0 + 4.4, 3) * 0.6 + NZ.fbm(Pt * 160.0 + 1.7, 2) * 0.3 + NZ(Pt * 700.0) * 0.1
    A = A * (1 + 0.07 * m[:, None] * np.array([1.0, 1.05, 1.12]))
    # periorbital and perioral hyperpigmentation: darker, slightly cooler/mauve (common on MST 6-8 faces)
    dark = np.clip(0.55 * Z["under"] + 0.4 * Z["lid"] + 0.45 * Z["perioral"] + 0.15 * Z["upl"], 0, 1) * k
    A = A * (1 - dark[:, None] * np.array([0.22, 0.26, 0.24]))
    # forehead edge and temples a touch darker (sun), the T-zone slightly lighter
    A = A * (1 + 0.04 * Z["nose"][:, None] - 0.04 * Z["forehead"][:, None] * (1 - Z["nose"][:, None]))
    # redness: alar wings, nose tip, cheeks (haemoglobin shows less on darker MST; kept subtle)
    red = np.clip(0.5 * Z["alar"] + 0.25 * Z["nose"] + 0.2 * Z["cheek"], 0, 1) * 0.10
    A = A * (1 - red[:, None]) + A * np.array([1.35, 0.82, 0.80]) * red[:, None]
    # natural lip: darker, mauve-brown border; lighter, rosier centre; vertical lines in the colour too
    lt = _ss(0.12, 0.9, lipT)
    border = np.clip(lt * (1 - _ss(0.45, 0.85, lipT)), 0, 1)
    centre = _ss(0.75, 0.98, lipT)
    lines = np.clip(np.abs(np.sin(Pt[:, 0] * 2300 + NZ(Pt * 300) * 2.2)) ** 7, 0, 1)
    A = A * (1 - 0.18 * border[:, None] * np.array([1.0, 1.15, 1.05]))
    A = A * (1 + 0.10 * centre[:, None] * np.array([1.1, 0.95, 0.95])) * (1 - 0.05 * (lines * lt)[:, None])
    # two small moles (seeded positions on the face; 1-1.4 mm)
    for c, r in sk.get("moles", []):
        mo = _g(Pt, np.array(c), r)
        A = A * (1 - 0.55 * mo[:, None] * np.array([0.9, 1.0, 1.05]))
    return A


def detail_map(Pt, NZ, Z, lipT, earT, scalp, eyeC, eyeR):
    """RGBA: R fuzz, G subsurface tint, B moisture, A micro strength (all 0..1)."""
    face = 1 - scalp
    lip = lipT
    fuzz = np.clip(0.55 * Z["cheek"] + 0.45 * Z["forehead"] + 0.5 * Z["upl"] + 0.4 * Z["chin"] + 0.3 * Z["neck"]
                   + 0.25, 0, 1) * (1 - lip) * face * (1 - 0.6 * Z["lid"])
    sss = np.clip(0.6 * Z["cheek"] + 0.6 * Z["nose"] + 0.7 * earT + 0.8 * lip + 0.5 * Z["lid"] + 0.4 * Z["under"] + 0.2, 0, 1)
    # moisture: the vermilion centre, the lid margins (a thin ring at the lash line), the inner corners
    wet = 0.85 * _ss(0.55, 0.95, lip)
    for side in ("L", "R"):
        c = eyeC[side]
        d = np.linalg.norm(Pt - c, axis=1) / eyeR
        front = Pt[:, 1] < c[1] - 0.45 * eyeR
        ring = np.exp(-((d - 1.06) / 0.05) ** 2) * front
        inner = _g(Pt, c + np.array([-np.sign(c[0]) * eyeR * 0.95, -0.004, -0.0005]), 0.0028)
        wet = wet + 0.9 * ring + 0.8 * inner
    wet = np.clip(wet, 0, 1)
    micro = np.clip(face * (1 - 0.7 * lip) * (1 - 0.5 * earT) * (0.6 + 0.4 * (1 - Z["neck"])), 0, 1)
    return np.stack([fuzz, sss, wet, micro], 1)


def micro_tile(seed=5, N=512):
    """Tileable 512 RGBA micro tile. Height = skin crosshatch (two families of shallow grooves bounding rhombic
    plateaus, the dermatoglyphic micro-relief) + micro pores; RG = tangent normal xy (0.5 = flat), B = specular breakup,
    A = micro cavity."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:N, 0:N] / N

    def tnoise(f, s):
        # tileable value noise via random Fourier modes with integer frequencies
        h = np.zeros((N, N))
        r2 = np.random.default_rng(s)
        for _ in range(24):
            kx, ky = r2.integers(-f, f + 1, 2)
            if kx == 0 and ky == 0:
                continue
            ph = r2.uniform(0, 2 * math.pi)
            h += np.cos(2 * math.pi * (kx * x + ky * y) + ph) / math.hypot(kx, ky)
        return h / np.abs(h).max()

    warp = tnoise(4, seed + 1) * 0.05
    g1 = np.abs(np.sin(math.pi * (14 * (x + warp) + 9 * y)))
    g2 = np.abs(np.sin(math.pi * (-11 * x + 15 * (y + warp))))
    groove = -(np.clip(1 - g1 / 0.18, 0, 1) ** 2 * (0.6 + 0.4 * tnoise(6, seed + 2)) +
               np.clip(1 - g2 / 0.18, 0, 1) ** 2 * (0.6 + 0.4 * tnoise(6, seed + 3)))
    # micro pores at the groove crossings + random
    pores = np.zeros((N, N))
    for _ in range(140):
        cx, cy = rng.uniform(0, 1, 2)
        rr = rng.uniform(0.004, 0.009)
        dx = (x - cx + 0.5) % 1 - 0.5
        dy = (y - cy + 0.5) % 1 - 0.5
        pores -= np.exp(-(dx * dx + dy * dy) / (rr * rr)) * rng.uniform(0.6, 1.2)
    h = 0.6 * groove + 0.8 * pores + 0.25 * tnoise(24, seed + 4)
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    s = 1.2
    n = np.stack([-gx * s, -gy * s, np.ones_like(h)], 2)
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    spec = np.clip(0.75 + 0.35 * tnoise(10, seed + 5) + 0.15 * tnoise(40, seed + 6), 0, 1)
    cav = np.clip(1 + 0.8 * np.minimum(h, 0), 0, 1)
    out = np.zeros((N, N, 4), np.float32)
    out[:, :, 0] = n[:, :, 0] * 0.5 + 0.5
    out[:, :, 1] = n[:, :, 1] * 0.5 + 0.5
    out[:, :, 2] = spec
    out[:, :, 3] = cav
    return out
