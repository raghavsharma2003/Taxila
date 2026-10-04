"""r3 blink rebuild (judge r2 fix 4): cut the PAINTED mid-lid and closed-lid keys (keys/mid-0.png, keys/closed-0.png,
gpt-image-2 masked edits of c-front) into per-eye layers. No stretched smear: the half-lid and the closed lid are
painted lids with a real crease.
  lidmid{L,R}    opaque lid skin + lash down to the painted lash's lower edge, transparent in the opening (the live
                 sclera / iris show below it), the edit ellipse's border feathered into c-front's skin
  lidshut{L,R}   the whole closed eye, opaque, border feathered
Each layer is colour-matched to c-front on a ring just outside the edit ellipse (per-channel gain), so the feather
never shows a tone step. geom.json gets the rects and the mid lid's lash-bottom curve (rest px) per eye.
    python3 scripts/character/puppet2d/polish-r4/lidkeys.py
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

K = "art/character/puppet2d/polish-r4/keys"
L = "art/character/puppet2d/polish-r4/layers"
front = np.asarray(Image.open("art/character/puppet2d/polish-r4/c-front.png").convert("RGB")).astype(np.float32)
import os
MIDF = os.environ.get("P2D_MID", "mid62-0.png")   # r4: the ~0.62 squeeze key (judge r3 fix 5)
mid = np.asarray(Image.open(f"{K}/{MIDF}").convert("RGB")).astype(np.float32)
shut = np.asarray(Image.open(f"{K}/closed-0.png").convert("RGB")).astype(np.float32)
H, W = front.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]
g = json.load(open(f"{L}/geom.json"))
# the edit ellipses (gen-keys.mjs eyemask.png)
ELL = {"L": (340, 392, 488, 510), "R": (566, 380, 716, 502)}


def ell(b, shrink=0):
    cx, cy, rx, ry = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2, (b[2] - b[0]) / 2 - shrink, (b[3] - b[1]) / 2 - shrink
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1


def save(name, rgb, a, pad=2):
    ys, xs = np.where(a > 0.004)
    x0, y0, x1, y1 = max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + 1 + pad), min(H, ys.max() + 1 + pad)
    Image.fromarray(np.dstack([rgb.clip(0, 255), a * 255])[y0:y1, x0:x1].round().astype(np.uint8), "RGBA").save(f"{L}/{name}.png", optimize=True)
    return [int(x0), int(y0), int(x1), int(y1)]


def lum(c):
    return 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]


g.setdefault("lidKeys", {})
for s, b in ELL.items():
    inside = ell(b, 3)
    ring = ell(b, -6) & ~ell(b, 1)
    border = np.clip(ndi.distance_transform_edt(ell(b, 0)) / 9.0, 0, 1)   # 0 at the ellipse edge -> 1 9 px inside
    border = border * border * (3 - 2 * border)
    e = g["eyes"][s]
    xa, xb = e["x"]
    out = {}
    for key, img in (("mid", mid), ("shut", shut)):
        # colour match on the ring (outside the editable area the edit kept c-front, but its tone drifts slightly)
        gain = (front[ring].mean(0) + 1) / (img[ring].mean(0) + 1)
        im2 = img * gain[None, None, :]
        if key == "shut":
            a = border.copy()
            out["shut"] = save(f"lidshut{s}", im2, a)
        elif os.environ.get("P2D_MIDFROM", "shut") == "shut":
            # r4c (judge r3 fix 5): the ~0.62 squeeze key built from the PAINTED CLOSED key (clean lid skin + a clean
            # crease-arc lash; the mid62 edit's skin remap left a two-tone band and smeared lash ends). Per column the
            # shut lid is compressed vertically so its lash lands on the target arc: skin rows [Y0, sb - lt] -> [Y0, tg - lt]
            # (squash), the lash band [sb - lt, sb] -> [tg - lt, tg] (1:1, same weight). Below the lash: transparent.
            MID_CLOSE = float(os.environ.get("P2D_MIDCLOSE", "0.62"))
            gs = (front[ring].mean(0) + 1) / (shut[ring].mean(0) + 1)
            S = shut * gs[None, None, :]
            Ls = lum(S)
            dark = (Ls < 80) & inside
            sb = np.full(W, np.nan); st = np.full(W, np.nan)
            for x in range(b[0], b[2] + 1):
                ys = np.where(dark[:, x])[0]
                if len(ys) < 2:
                    continue
                # the bottom-most run of lash pixels (the closed lid's crease arc)
                r1 = ys[-1]; r0 = r1
                for y in ys[::-1][1:]:
                    if r0 - y > 2:
                        break
                    r0 = y
                if r1 - r0 >= 2:
                    sb[x] = r1 + 1.0; st[x] = r0
            xs_ok = np.where(~np.isnan(sb))[0]
            sx0, sx1 = xs_ok.min(), xs_ok.max()
            lt = float(np.median((sb - st)[xs_ok])) + 1.0
            sbS = ndi.gaussian_filter1d(np.interp(np.arange(W), xs_ok, sb[xs_ok]), 1.2)
            et, eb = np.array(e["top"], float), np.array(e["bot"], float)
            xs_e = np.arange(xa, xb + 1)
            want = et + MID_CLOSE * (eb - et)
            m = (xs_e > xa + 0.1 * (xb - xa)) & (xs_e < xb - 0.1 * (xb - xa))
            cf = np.polyfit(xs_e[m], want[m], 2)
            # the target lash bottom: the fitted arc across the opening; toward the lash ends it eases onto the shut arc's
            # own end heights (the canthi do not move)
            tg = np.polyval(cf, np.arange(W).astype(float))
            # a lid wraps the eyeball: a slight arch (the flat fit read as a bored, level bar in a still)
            ARCH = float(os.environ.get("P2D_MIDARCH", "3.0"))
            uu = (np.arange(W) - (xa + xb) / 2) / ((xb - xa) / 2)
            tg = tg - ARCH * np.clip(1 - uu * uu, 0, 1)
            ease = np.clip(np.minimum(np.arange(W) - sx0, sx1 - np.arange(W)) / 14.0, 0, 1)
            ease = ease * ease * (3 - 2 * ease)
            tg = sbS + (tg - sbS) * ease
            Y0 = float(b[1])
            src_y = yy.astype(np.float32).copy()
            for x in range(sx0, sx1 + 1):
                ys = np.arange(H, dtype=np.float32)
                k = (sbS[x] - lt - Y0) / max(1.0, tg[x] - lt - Y0)
                sy = np.where(ys <= tg[x] - lt, Y0 + (ys - Y0) * k, ys + (sbS[x] - tg[x]))
                sy = np.where(ys < Y0, ys, sy)
                src_y[:, x] = sy
            im2 = np.stack([ndi.map_coordinates(S[..., c], [src_y, xx.astype(np.float32)], order=1, mode="nearest") for c in range(3)], -1)
            cov = np.clip(tg[None, :] + 0.5 - yy, 0, 1)
            endf = np.clip(np.minimum(xx - sx0, sx1 - xx) / 5.0, 0, 1)
            a_mid = border * cov * endf * ((xx >= sx0) & (xx <= sx1))
            out["mid"] = save(f"lidmid{s}", im2, a_mid)
            out["midLash"] = {"x0": int(xa), "y": [round(float(tg[x]), 2) for x in range(xa, xb + 1)]}
            print(s, "mid-from-shut: lash", round(lt, 1), "px; bottom at iris", round(float(tg[int(e["iris"][0])]), 1), "open", e["top"][int(e["iris"][0]) - xa], e["bot"][int(e["iris"][0]) - xa])
            continue
        else:
            # lash bottom per column: last neutral-dark (lash) row below the lash's top, above the opening
            Lm = lum(img)
            R, B = img[..., 0], img[..., 2]
            lash = (Lm < 70) & (np.abs(R - B) < 30) & inside
            bot = np.full(W, np.nan)
            for x in range(b[0] + 4, b[2] - 4):
                ys = np.where(lash[:, x])[0]
                if len(ys) < 3:
                    continue
                # the lash band is the topmost run of lash pixels
                run_end = ys[0]
                for y in ys[1:]:
                    if y - run_end > 2:
                        break
                    run_end = y
                if run_end - ys[0] >= 2:
                    bot[x] = run_end + 1.0
            # across the iris the pupil (also near-black) merges with the lash: fit the lash bottom from the columns
            # either side of the iris (a quadratic, the lid edge is a smooth arc) and use it across the iris
            icx, icy, ir = e["iris"]
            xs_all = np.where(~np.isnan(bot))[0]
            okc = xs_all[np.abs(xs_all - icx) > ir + 3]
            okc = okc[(okc > xa + 2) & (okc < xb - 2)]
            top = np.full(W, np.nan)
            for x in xs_all:
                top[x] = np.where(lash[:, x])[0][0]
            runs = bot[xs_all] - top[xs_all]
            tmed = float(np.median(runs[runs <= 9])) if (runs <= 9).sum() >= 4 else float(np.median(bot[okc] - top[okc]))
            topS = ndi.gaussian_filter1d(np.interp(np.arange(W), xs_all, top[xs_all]), 1.5)
            over = (np.abs(np.arange(W) - icx) <= ir + 3) & (np.arange(W) >= xa) & (np.arange(W) <= xb)
            # r4: the squeeze key's opening is dark across most of the width (pupil / shadow under the low lid): any column
            # whose dark run is clearly longer than a lash takes the lash top + the measured lash thickness
            longrun = np.zeros(W, bool); longrun[xs_all] = runs > tmed + 3
            over |= longrun
            bot[over] = topS[over] + tmed
            print(s, "lash thickness", round(tmed, 1))
            xs = np.where(~np.isnan(bot))[0]
            bs = np.interp(np.arange(W), xs, bot[xs])
            bs = ndi.gaussian_filter1d(ndi.median_filter(bs, 5), 1.5)
            # r4 (judge r3 fix 5): the squeeze key. The edit painted its lash ~0.85 closed and wavy; the judge wants a ~0.6
            # squeeze still. Build it from two painted sources: the mid edit's LID SKIN (remapped so it ends on the target
            # arc) and c-front's OWN lash band (with its flick), carried rigidly per column onto a smooth target arc at
            # MID_CLOSE of the live opening. Nothing is drawn procedurally; the lash keeps c-front's exact weight.
            MID_CLOSE = float(os.environ.get("P2D_MIDCLOSE", "0.62"))
            et, eb = np.array(e["top"], float), np.array(e["bot"], float)
            lx0, lx1 = e["lashX"]
            lT, lB = np.array(e["lashTop"], float), np.array(e["lashBot"], float)
            xs_e = np.arange(xa, xb + 1)
            # the canthi are fixed: a closing lid margin flattens from the open arch toward the lower lid's curve (r4b tried
            # translating the arch down and clipping it at the corners: it made a W-shaped lash with spikes at both ends)
            want = et + MID_CLOSE * (eb - et)                      # where the lash's lower edge should sit
            lbx = lB[xs_e - lx0]
            dy_e = want - lbx
            # smooth: a quadratic in x over the middle 80% of the opening (the ends' top/bot meet, so they are noisy)
            m = (xs_e > xa + 0.1 * (xb - xa)) & (xs_e < xb - 0.1 * (xb - xa))
            cf = np.polyfit(xs_e[m], dy_e[m], 2)
            xl = np.arange(lx0, lx1 + 1)
            dyl = np.polyval(cf, np.clip(xl, xa, xb))              # the flick beyond the opening rides rigidly with the end
            # lash band of c-front: dark pixels between lashTop-3 and lashBot+2 (soft alpha from darkness)
            Lf = lum(front)
            lash_rgb = np.zeros_like(front); lash_a = np.zeros((H, W), np.float32)
            for i, x in enumerate(xl):
                y0, y1 = int(np.floor(lT[i] - 4)), int(np.ceil(lB[i] + 3))
                d = dyl[i]
                for y in range(y0, y1 + 1):
                    yd = y + d
                    # sample source at y (integer), place at yd with linear split between the two target rows
                    # r4b: tighter: the brown corner shadows (lum 100-125) were carried along as chips at both ends
                    if y < lT[i] - 2 or y > lB[i] + 1.5:
                        continue
                    al = float(np.clip((105 - Lf[y, x]) / 40.0, 0, 1))
                    if al <= 0:
                        continue
                    yi = int(np.floor(yd)); fr = yd - yi
                    for yy2, ww in ((yi, 1 - fr), (yi + 1, fr)):
                        if 0 <= yy2 < H and ww > 0:
                            lash_rgb[yy2, x] += front[y, x] * al * ww
                            lash_a[yy2, x] += al * ww
            lash_a = np.clip(lash_a, 0, 1)
            lash_rgb = np.where(lash_a[..., None] > 1e-3, lash_rgb / np.maximum(lash_a[..., None], 1e-3), 0)
            # target lash bottom per column (for the skin cover and the runtime's midLash)
            tgt = np.full(W, np.nan)
            tgt[xl] = lB[xl - lx0] + dyl
            tgtS = np.interp(np.arange(W), xl, tgt[xl])
            # skin: the edit's lid skin, remapped per column from [ellipse top, its lash TOP] onto [top, target lash top]
            src_y = yy.astype(np.float32).copy()
            y0e = b[1]
            for x in range(b[0], b[2] + 1):
                ptop = topS[x] if not np.isnan(topS[x]) else bs[x] - tmed      # painted lash top (skin ends there)
                ttop = tgtS[x] - (lB[min(max(x, lx0), lx1) - lx0] - lT[min(max(x, lx0), lx1) - lx0]) - 1.0
                ys = np.arange(y0e, H, dtype=np.float32)
                f = (ys - y0e) / max(1.0, ttop - y0e)
                src_y[y0e:, x] = np.where(ys <= ttop, y0e + f * (ptop - 1.5 - y0e), ptop - 1.5)
            skin = np.stack([ndi.map_coordinates(im2[..., c], [src_y, xx.astype(np.float32)], order=1, mode="nearest") for c in range(3)], -1)
            # r4b: low-frequency tone match of the lid skin to c-front's own lid skin (above c-front's lash, where both are
            # skin), extended down by normalised convolution: the edit's lid was lighter and showed as a pale oval
            lt_full = np.full(W, np.nan); lt_full[lx0:lx1 + 1] = lT
            ltS = np.interp(np.arange(W), np.arange(lx0, lx1 + 1), lT)
            okm = inside & (yy < ltS[None, :] - 3) & (lum(front) > 110) & (lum(skin) > 110)
            sg = 7.0
            wv = ndi.gaussian_filter(okm.astype(np.float32), sg) + 1e-4
            lf = np.stack([ndi.gaussian_filter(front[..., c] * okm, sg) for c in range(3)], -1) / wv[..., None]
            ls = np.stack([ndi.gaussian_filter(skin[..., c] * okm, sg) for c in range(3)], -1) / wv[..., None]
            # far from valid samples, fall back to the mean ratio
            mr = (front[okm].mean(0) + 1) / (skin[okm].mean(0) + 1)
            rr = np.where(wv[..., None] > 0.05, (lf + 1) / (ls + 1), mr[None, None, :])
            skin = skin * np.clip(rr, 0.8, 1.2)
            print(s, "lid skin tone ratio", mr.round(3))
            im2 = skin * (1 - lash_a[..., None]) + lash_rgb * lash_a[..., None]
            bs = tgtS
            span_lo, span_hi = lx0, lx1
            covS = np.clip(tgtS[None, :] - 1.0 - yy, 0, 1)        # skin, opaque above the lash
            a_mid = np.maximum(covS * ((xx >= span_lo) & (xx <= span_hi)), lash_a)
            a_mid = a_mid * border
            out["mid"] = save(f"lidmid{s}", im2, a_mid)
            out["midLash"] = {"x0": int(xa), "y": [round(float(bs[x]), 2) for x in range(xa, xb + 1)]}
            print(s, "mid lash bottom at iris x", round(float(bs[int(e["iris"][0])]), 1), "open", e["top"][int(e["iris"][0]) - xa], e["bot"][int(e["iris"][0]) - xa])
            continue
            # opaque above the lash bottom (+0.5 px AA), only across the eye's opening span; outside it the lid layer is
            # the painted skin (opaque) so the lid continues to the corners
            cov = np.clip(bs[None, :] + 0.5 - yy, 0, 1)
            span = (xx >= xs.min()) & (xx <= xs.max())
            # below the lash and outside the opening (corners, lower lid) keep c-front's own surface: transparent
            # soft ends: the painted lid fades into the live lid over 8 px at each end of its span (a hard vertical cut
            # showed as a white notch in a squinted playful eye)
            endf = np.clip(np.minimum(xx - xs.min(), xs.max() - xx) / 8.0, 0, 1)
            a = border * np.where(span, cov, 0.0) * endf
            # above the lash: everywhere in the ellipse (crease, lid skin)
            a = np.maximum(a, border * (yy < bs[None, :] - 1) * ((xx < xs.min()) | (xx > xs.max())) * 0)
            out["mid"] = save(f"lidmid{s}", im2, a)
            out["midLash"] = {"x0": int(xa), "y": [round(float(bs[x]), 2) for x in range(xa, xb + 1)]}
            print(s, "mid lash bottom at iris x", round(float(bs[int(e["iris"][0])]), 1), "open top", e["top"][int(e["iris"][0]) - xa])
    g["lidKeys"][s] = out
    g["rects"][f"lidmid{s}"] = out["mid"]
    g["rects"][f"lidshut{s}"] = out["shut"]
json.dump(g, open(f"{L}/geom.json", "w"), indent=1)
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != "midLash"} for k, v in g["lidKeys"].items()}))
