"""Profile (silhouette) term of the identity fit: VERDICT 'lower face too long at 3/4 -> true 90 deg references plus a
silhouette term'. MediaPipe cannot hold landmarks on a true profile, so this compares SILHOUETTES (profile.py) of the
generated 90 deg reference (refs/<look>/profile90_left.png) and of our neutral render from the profile camera
(profshot.mjs), and turns the difference into two smooth correction curves on our basis:
  front  : below the nose tip (subnasale .. pogonion): how far forward the face is at each height -> a forward/back
           move (Blender -y) of the face front, tapered across x (sigma 3.5 cm);
  under  : below the pogonion (chin underside .. throat): how high the jaw underside is at each forward distance -> an
           up/down move of the submental skin, tapered across x (sigma 4.5 cm). A soft, low underside is what made the
           chin landmark slide down at 3/4 (nose-chin / IOD +9% relative to the front, measured).
Scale and registration: the nose tip (the silhouette's most forward point) is the origin in both images; the vertical
scale of the reference comes from OUR eye-to-tip height (front-fitted, NME 0.96%) over the reference's eye-to-tip rows
(the eye row = MediaPipe's iris landmarks, whose y holds on a profile even where x slides).
    python3 profilefit.py measure --ref refs/teal/profile90_left.png --reflm refs/teal/landmarks.json --render prof/teal_profile.png
        --cam prof/teal_profile.json --corr refs/teal/profile_correction.json [--step 0.7]
    (build_look.py imports apply())"""
import json, os, sys
import numpy as np

ZF = np.round(np.arange(-0.004, -0.075, -0.002), 4)    # front grid: metres below the nose tip
XU = np.round(np.arange(-0.004, -0.09, -0.003), 4)     # under grid: metres behind the nose tip (forward distance)


def _curves(img, nose, bg, eye_row, m_per_px):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import profile as PF
    from PIL import Image
    R, fg, fs = PF.analyse(Image.open(img), nose, bg_hex=bg)
    tip = R["rows"]["tip"]
    h = len(fs)
    rows = np.arange(h)
    z = -(rows - tip) * m_per_px                         # metres below the tip (negative = lower)
    f = (fs - fs[tip]) * m_per_px                        # metres forward of the tip (negative = behind)
    # the pogonion and throat by metric bands (the extremum walk is unreliable on a smooth render whose lips have
    # little relief): the chin = most forward row 4-8 cm below the tip, the throat = least forward row in the 7 cm
    # below the chin
    band = np.nonzero((z <= -0.04) & (z >= -0.085))[0]
    pog = int(band[np.argmax(f[band])])
    band2 = np.nonzero((z < z[pog]) & (z >= z[pog] - 0.07))[0]
    th = int(band2[np.argmin(f[band2])]) if len(band2) else pog
    R["rows"]["pogonion"], R["rows"]["throat"] = pog, th
    # front curve: rows from the tip down to the pogonion
    fr = (rows > tip) & (rows <= pog)
    front = np.interp(ZF, z[fr][::-1], f[fr][::-1], left=np.nan, right=np.nan)
    # under curve: for each forward distance behind the pogonion, the lowest silhouette row at or in front of it, i.e.
    # the height of the jaw underside; walk rows below the pogonion until the throat
    ur = (rows > pog) & (rows <= th)
    under = np.full(len(XU), np.nan)
    if ur.any():
        zu, fu = z[ur], f[ur]
        for i, x in enumerate(XU):
            ok = fu >= x
            if ok.any() and x > fu.min():
                under[i] = zu[ok].min()
    return {"front": front, "under": under, "tipRow": int(tip), "pogRel": float(z[pog]), "throatRel": float(z[th]),
            "eyeToTip": float((tip - eye_row) * m_per_px), "eyeToPog": float((pog - eye_row) * m_per_px), "R": {k: v for k, v in R.items() if k != "curve"}}


def measure(a):
    cam = json.load(open(a.cam))
    LM = json.load(open(a.reflm))["profile90_left"]
    ref_eye_row = float(np.mean(np.array(LM["lm"])[468:478, 1]))
    rend = _curves(a.render, "right", "auto", cam["eyeRow"], 1.0 / cam["pxPerM"])
    import profile as PF
    from PIL import Image
    Rr, _, _ = PF.analyse(Image.open(a.ref), "right")
    # vertical scale: the reference's eye-to-chin (pogonion) height is set equal to ours, because the front view (where
    # the fit is exact, NME 0.96%) says the face lengths agree within 4.5%; the profile term then corrects the SHAPE
    # (the depth along the face and the jaw underside), not the length. (Scaling by eye-to-nose-tip instead made the
    # reference 30% shorter, because our soft nose puts its most forward point high: measured.)
    s_ref = rend["eyeToPog"] / max(Rr["rows"]["pogonion"] - ref_eye_row, 1)
    ref = _curves(a.ref, "right", None, ref_eye_row, s_ref)
    dF = ref["front"] - rend["front"]                   # + = the reference is further forward there
    dU = ref["under"] - rend["under"]                   # + = the reference's underside is higher there
    old = json.load(open(a.corr)) if os.path.exists(a.corr) else {"front": [0.0] * len(ZF), "under": [0.0] * len(XU)}
    lim = 0.006
    nF = np.clip(np.nan_to_num(dF), -lim, lim) * a.step
    nU = np.clip(np.nan_to_num(dU), -lim, lim) * a.step
    parts = a.parts.split(",")
    if "front" not in parts:
        nF = nF * 0
    if "under" not in parts:
        nU = nU * 0
    # smooth the update along its grid (three taps), so a noisy silhouette row cannot carve a groove
    k = np.array([0.25, 0.5, 0.25])
    nF = np.convolve(np.pad(nF, 1, mode="edge"), k, "valid"); nU = np.convolve(np.pad(nU, 1, mode="edge"), k, "valid")
    out = {"zf": ZF.tolist(), "xu": XU.tolist(), "front": (np.array(old["front"]) + nF).round(5).tolist(),
           "under": (np.array(old["under"]) + nU).round(5).tolist(),
           "residualMm": {"frontMeanAbs": round(float(np.nanmean(np.abs(dF)) * 1000), 2), "underMeanAbs": round(float(np.nanmean(np.abs(dU)) * 1000), 2)},
           "ratios": {"ref": ref["R"], "render": rend["R"]}, "refMetresPerPx": s_ref, "eyeToTipMm": {"ref": round(ref["eyeToTip"] * 1000, 1), "render": round(rend["eyeToTip"] * 1000, 1)}, "note": __doc__.split("\n")[0]}
    json.dump(out, open(a.corr, "w"), indent=1)
    print(json.dumps(out["residualMm"]), "ref lowerFace", ref["R"]["lowerFace"], "render lowerFace", rend["R"]["lowerFace"])


def apply(B, corr, headw, body, scale=1.0, log=print):
    """B (V,3) Blender axes (x her left, -y forward, z up), before the head scale. Returns (B', report)."""
    C = json.load(open(corr))
    zf, fr = np.array(C["zf"]), np.array(C["front"])
    xu, un = np.array(C["xu"]), np.array(C["under"])
    ez = B[body][:, 2]
    # the nose tip: the most forward (min y) skin vertex near the midline in the nose band
    mid = body & (np.abs(B[:, 0]) < 0.004)
    zc = np.median(B[mid & (headw > 0.9), 2])
    cand = np.nonzero(mid & (headw > 0.9))[0]
    tip = cand[np.argmin(B[cand, 1])]
    ty, tz = B[tip, 1], B[tip, 2]
    zr = (B[:, 2] - tz) * scale
    xr = (ty - B[:, 1]) * scale                          # forward distance relative to the tip (negative = behind)
    front_side = (B[:, 1] < ty + 0.06)                   # the face half, never the back of the head
    D = np.zeros_like(B)
    # front: forward move by height, below the tip only
    wF = np.exp(-(B[:, 0] / 0.035) ** 2) * body * headw * front_side * (zr < 0) * (zr > zf.min())
    dF = np.interp(zr, zf[::-1], fr[::-1], left=0.0, right=0.0)
    taperF = np.clip(-zr / 0.006, 0, 1)                  # 0 at the tip, full from 6 mm below it
    D[:, 1] -= dF * wF * taperF / scale
    # under: up/down move of the underside by forward distance (only below the chin's front: zr < -0.04)
    wU = np.exp(-(B[:, 0] / 0.045) ** 2) * body * (zr < -0.035) * front_side
    dU = np.interp(xr, xu[::-1], un[::-1], left=0.0, right=0.0)
    under_side = np.clip((-0.035 - zr) / 0.01, 0, 1)
    D[:, 2] += dU * wU * under_side / scale
    rep = {"tipVid": int(tip), "maxMoveMm": round(float(np.linalg.norm(D, axis=1).max() * 1000), 2),
           "movedVerts": int((np.linalg.norm(D, axis=1) > 1e-5).sum())}
    log(f"profile fit: max move {rep['maxMoveMm']} mm on {rep['movedVerts']} verts")
    return B + D, rep


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("mode")
    ap.add_argument("--ref"); ap.add_argument("--reflm"); ap.add_argument("--render"); ap.add_argument("--cam")
    ap.add_argument("--corr", required=True); ap.add_argument("--step", type=float, default=0.7); ap.add_argument("--parts", default="front,under")
    a = ap.parse_args()
    measure(a)
