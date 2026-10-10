"""Judge-at-size sheets: each front at 1x and at the real Prakash slot sizes, inside the jharokha arch with the world's
lamplight grade (approximated from docs/design/round4/world/source/src/style.css .jh-grade/.jh-rim).
  python3 -I slots.py out.png id1 id2 ...      (ids are files in webp/ or raw/)
Crops: crops.json {id: {"head": [x0,y0,w], "face": [x0,y0,w]}} in 1024 px; defaults below.
"""
import sys, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
DEF = {"head": [222, 8, 580], "face": [302, 110, 420]}

def bez(p0, p1, p2, p3, n=24):
    t = np.linspace(0, 1, n)[:, None]
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3

def arch_poly(w, h):
    # ARCH_PATH from world core.js in unit coords
    P = lambda x, y: np.array([x * w, y * h])
    pts = [P(0, 1), P(0, .40)]
    pts += list(bez(P(0, .40), P(0, .22), P(.22, .14), P(.38, .09)))
    pts += list(bez(P(.38, .09), P(.45, .07), P(.49, .035), P(.5, 0)))
    pts += list(bez(P(.5, 0), P(.51, .035), P(.55, .07), P(.62, .09)))
    pts += list(bez(P(.62, .09), P(.78, .14), P(1, .22), P(1, .40)))
    pts += [P(1, 1)]
    return [tuple(map(float, p)) for p in pts]

def load(i):
    for p in (f"{HERE}/raw/{i}.png", f"{HERE}/webp/{i}.webp", i):
        if os.path.exists(p):
            return Image.open(p).convert("RGB")
    raise FileNotFoundError(i)

def crop(im, box, aspect=1.3):
    x0, y0, w = box
    s = im.width / 1024
    return im.crop((int(x0 * s), int(y0 * s), int((x0 + w) * s), int((y0 + w * aspect) * s)))

def grade(img):
    """multiply warm vignette + screen rim, as .jh-grade / .jh-rim"""
    a = np.asarray(img).astype(np.float32) / 255
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    dx = (xx / w - .52) / .90; dy = (yy / h - .34) / .70
    r = np.sqrt(dx * dx + dy * dy)
    t = np.clip((r - .52) / (1 - .52), 0, 1)[..., None]
    vig = 1 - t * .55 * (1 - np.array([196, 120, 72]) / 255)
    t2 = np.clip((yy / h - .55) / .45, 0, 1)[..., None]
    vig2 = 1 - t2 * .35 * (1 - np.array([120, 60, 70]) / 255)
    a = a * vig * vig2
    rim = np.clip(1 - (xx / w) / .30, 0, 1)[..., None] * .32 * np.array([255, 170, 90]) / 255
    a = 1 - (1 - a) * (1 - rim)
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))

def jharokha(img, W, H, ss=4):
    big = grade(img.resize((W * ss, H * ss), Image.LANCZOS))
    m = Image.new("L", (W * ss, H * ss), 0)
    ImageDraw.Draw(m).polygon(arch_poly(W * ss, H * ss), fill=255)
    bg = Image.new("RGB", (W * ss, H * ss), (40, 26, 44))
    out = Image.composite(big, bg, m)
    d = ImageDraw.Draw(out)
    poly = arch_poly(W * ss, H * ss)
    d.line(poly, fill=(91, 51, 38), width=max(2, int(2.2 * ss)))
    d.line(poly, fill=(217, 165, 78), width=max(1, int(1.1 * ss)))
    return out.resize((W, H), Image.LANCZOS)

def sheet(ids, out):
    crops = json.load(open(f"{HERE}/crops.json")) if os.path.exists(f"{HERE}/crops.json") else {}
    rows = []
    for i in ids:
        im = load(i)
        c = {**DEF, **crops.get(i, {})}
        head = crop(im, c["head"]); face = crop(im, c["face"])
        tiles = [("1x (512)", im.resize((512, 512), Image.LANCZOS))]
        tiles.append(("lesson phone 90x117 @2x", jharokha(head, 180, 234)))
        tiles.append(("lesson phone 90x117 @1x", jharokha(head, 90, 117)))
        tiles.append(("home 150x190 @1x", jharokha(head, 150, 195)))
        tiles.append(("laptop 250 tall", jharokha(head, 192, 250)))
        tiles.append(("chip 38x48 @2x", jharokha(face, 76, 99)))
        tiles.append(("chip 38x48 @1x", jharokha(face, 38, 49)))
        rows.append((i, tiles))
    W = 20 + sum(t[1].width + 16 for t in rows[0][1]); H = 20 + len(rows) * (512 + 40)
    S = Image.new("RGB", (W, H), (23, 20, 46)); d = ImageDraw.Draw(S)
    y = 20
    for i, tiles in rows:
        x = 20; d.text((x, y), i, fill=(255, 226, 161))
        for lab, t in tiles:
            S.paste(t, (x, y + 16)); d.text((x, y + 20 + t.height), lab, fill=(211, 200, 224)); x += t.width + 16
        y += 512 + 40
    S.save(out)

if __name__ == "__main__":
    sheet(sys.argv[2:], sys.argv[1])
