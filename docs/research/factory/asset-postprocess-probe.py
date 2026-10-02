#!/usr/bin/env python3
"""asset-postprocess-probe.py — the deterministic half of the sprite pipeline, measured on the asset-probe outputs.
Steps per image: (1) background -> alpha (native alpha: snap >=250 to 255; magenta: soft chroma key + despill),
(2) trim to alpha bbox + 4% pad, (3) palette quantise (k-means 12 colours, optional snap to tokens), (4) WebP at 256/512.
Measures: background flatness (std of border pixels), fringe = share of edge pixels still magenta-tinted,
alpha partial share, bytes per size, wall ms. Usage: python3 asset-postprocess-probe.py <dir-with-pngs>
Stdlib + Pillow only."""
import sys, os, json, time, math
from PIL import Image, ImageFilter

D = sys.argv[1] if len(sys.argv) > 1 else "/tmp/asset-probe"
OUT = os.path.join(D, "post"); os.makedirs(OUT, exist_ok=True)
KEY = (255, 0, 255)

def border_stats(im):
    w, h = im.size; px = im.load(); s = []
    for x in range(0, w, 4): s += [px[x, 2], px[x, h - 3]]
    for y in range(0, h, 4): s += [px[2, y], px[w - 3, y]]
    mean = [sum(p[i] for p in s) / len(s) for i in range(3)]
    sd = [math.sqrt(sum((p[i] - mean[i]) ** 2 for p in s) / len(s)) for i in range(3)]
    return [round(m) for m in mean], [round(v, 1) for v in sd]

def chroma_key(im, key):
    """soft key: distance in a magenta-specific space. magenta-ness m = min(R,B) - G (high for magenta, ~0 for most art)."""
    im = im.convert("RGB"); w, h = im.size; src = im.load()
    out = Image.new("RGBA", im.size); dst = out.load()
    kr, kg, kb = key; km = min(kr, kb) - kg
    for y in range(h):
        for x in range(w):
            r, g, b = src[x, y]; m = min(r, b) - g
            # alpha: 0 at full magenta-ness, 255 when m <= 25% of key's
            t = (m - 0.30 * km) / (0.50 * km)   # opaque at <=30% of the measured background's magenta-ness, clear at >=80%
            a = 255 if t <= 0 else (0 if t >= 1 else int(255 * (1 - t)))
            if 0 < a < 255 or (a == 255 and m > 20):  # despill: pull R and B down to G-relative level
                cap = g + 20; r = min(r, cap) if r > cap and b > cap else r; b = min(b, cap) if b > cap and r >= cap else b
            dst[x, y] = (r, g, b, a)
    return out

def snap_alpha(im):
    r, g, b, a = im.split(); a = a.point(lambda v: 255 if v >= 250 else (0 if v <= 5 else v))
    return Image.merge("RGBA", (r, g, b, a))

def fringe(im):
    """share of semi/opaque pixels touching transparency that are still magenta-tinted"""
    w, h = im.size; px = im.load(); edge = bad = 0
    for y in range(1, h - 1, 2):
        for x in range(1, w - 1, 2):
            r, g, b, a = px[x, y]
            if a < 64: continue
            if min(px[x - 1, y][3], px[x + 1, y][3], px[x, y - 1][3], px[x, y + 1][3]) < 64:
                edge += 1
                if min(r, b) - g > 40: bad += 1
    return round(bad / edge, 4) if edge else None

def alpha_hist(im):
    h = im.getchannel("A").histogram(); t = sum(h)
    return {"transparent": round(h[0] / t, 3), "opaque": round(h[255] / t, 3), "partial": round(1 - (h[0] + h[255]) / t, 3)}

def trim(im, pad=0.04):
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    if not bb: return im
    p = int(max(im.size) * pad); x0, y0, x1, y1 = bb
    return im.crop((max(0, x0 - p), max(0, y0 - p), min(im.width, x1 + p), min(im.height, y1 + p)))

def quantise(im, k=12):
    a = im.getchannel("A"); q = im.convert("RGB").quantize(colors=k, method=Image.Quantize.MAXCOVERAGE).convert("RGB")
    q.putalpha(a); return q

rows = []
for f in sorted(os.listdir(D)):
    if not f.endswith(".png") or f.startswith("F-") or f.startswith("G-rupee-unguided"): continue
    t0 = time.time(); im = Image.open(os.path.join(D, f)); row = {"file": f, "mode": im.mode}
    if im.mode == "RGBA":
        rgba = snap_alpha(im); row["path"] = "native-alpha"
    else:
        row["border_mean"], row["border_sd"] = border_stats(im.convert("RGB"))
        rgba = snap_alpha(chroma_key(im, tuple(row["border_mean"]))); row["path"] = "chroma-key(adaptive)"
    row["alpha"] = alpha_hist(rgba); row["fringe"] = fringe(rgba)
    t = trim(rgba); row["trim_px"] = list(t.size)
    qn = quantise(t)
    for s in (512, 256):
        sc = qn.copy(); sc.thumbnail((s, s), Image.LANCZOS)
        p = os.path.join(OUT, f"{f[:-4]}-{s}.webp"); sc.save(p, "WEBP", quality=82, method=6)
        row[f"webp{s}_bytes"] = os.path.getsize(p)
    # also a lossless 256 for comparison
    sc = t.copy(); sc.thumbnail((256, 256), Image.LANCZOS); p = os.path.join(OUT, f"{f[:-4]}-256-lossless.webp"); sc.save(p, "WEBP", lossless=True)
    row["webp256_lossless_bytes"] = os.path.getsize(p)
    row["ms"] = round((time.time() - t0) * 1000)
    # composite on dark green for eyeballing fringe
    bg = Image.new("RGBA", t.size, (30, 90, 50, 255)); bg.alpha_composite(t); bg.convert("RGB").save(os.path.join(OUT, f"{f[:-4]}-on-green.jpg"), quality=85)
    rows.append(row); print(json.dumps(row))

json.dump({"date": "2026-10-02", "dir": "asset-probe outputs", "rows": rows},
          open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "asset-postprocess-probe-2026-10-02.json"), "w"), indent=2)
