"""r3 turn keyforms, step 1: colour-based landmarks on c-front and the painted yaw key plates (keys/yawL-0, yawR-0),
normalised into c-front's frame (vertical scale + offset from the eye line and lip line, which a yaw preserves; horizontal
offset from the cranium silhouette's centre, which a turn about the neck axis also preserves).
    python3 scripts/character/puppet2d/polish-r10/landmarks.py   -> keys/landmarks.json + work/lm-<name>.png overlays
"""
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

K = "art/character/puppet2d/polish-r10/keys"
WK = "art/character/puppet2d/polish-r10/work"
FILES = {"front": "art/character/puppet2d/polish-r10/c-front.png", "yawL": f"{K}/yawL-0.png", "yawR": f"{K}/yawR-0.png"}


def comps(mask, minsz=20):
    lab, n = ndi.label(mask)
    out = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = lab[sl] == i
        if m.sum() < minsz:
            continue
        ys, xs = np.where(m)
        out.append({"n": int(m.sum()), "cx": float(xs.mean() + sl[1].start), "cy": float(ys.mean() + sl[0].start),
                    "x0": int(xs.min() + sl[1].start), "x1": int(xs.max() + sl[1].start), "y0": int(ys.min() + sl[0].start), "y1": int(ys.max() + sl[0].start),
                    "mask": (lab == i)})
    return out


def detect(path):
    im = np.asarray(Image.open(path).convert("RGB")).astype(float)
    R, G, B = im[..., 0], im[..., 1], im[..., 2]
    lum = 0.299 * R + 0.587 * G + 0.114 * B
    H, W = lum.shape
    yy, xx = np.mgrid[0:H, 0:W]
    bg = (lum > 205) & (R > 235) & (B > 150) & ((R - B) < 80)
    hair = (lum < 90) & (np.abs(R - B) < 40) & (yy < 800)
    skin = (R > 150) & (R - B > 70) & (G > 80) & (G < 190) & (yy < 760)
    lm = {}
    # eyes: openings = white sclera blobs (+ iris) inside the face band
    white = (R > 210) & (G > 195) & (B > 180) & (yy > 330) & (yy < 560) & (xx > 250) & (xx < 800)
    W0 = sorted(comps(white, 60), key=lambda c: -c["n"])
    W0 = [c for c in W0 if c["n"] < 20000][:6]
    # group white blobs into two eyes by x (an iris splits each eye's white in two)
    xs_ = sorted(W0, key=lambda c: c["cx"])
    mid = np.median([c["cx"] for c in xs_]) if xs_ else 512
    eyes = {}
    for s, grp in (("L", [c for c in W0 if c["cx"] < mid + 0]), ("R", [c for c in W0 if c["cx"] >= mid])):
        if not grp:
            continue
        m = np.zeros((H, W), bool)
        for c in grp:
            m |= c["mask"]
        ys, xs = np.where(m)
        bx = (xs.min() - 6, ys.min() - 25, xs.max() + 6, ys.max() + 12)
        # iris: dark-brown disk between/next to the whites
        box = (xx >= bx[0]) & (xx <= bx[2]) & (yy >= bx[1]) & (yy <= bx[3])
        iris = box & (lum < 120) & (R > B + 15) & ~ndi.binary_dilation(hair & ~box, iterations=2)
        op = ndi.binary_closing(m | iris, iterations=3) & box
        lab, n = ndi.label(op)
        if n:
            big = lab == (1 + int(np.argmax(ndi.sum(op, lab, range(1, n + 1)))))
        else:
            big = m
        ys2, xs2 = np.where(big)
        # corners: extreme columns of the opening, at that column's mean y
        def corner(x):
            c = np.where(big[:, x])[0]
            return [float(x), float(c.mean())]
        ic = comps(iris & big, 40)
        ic = max(ic, key=lambda c: c["n"]) if ic else None
        eyes[s] = {"in": corner(xs2.max() if s == "L" else xs2.min()), "out": corner(xs2.min() if s == "L" else xs2.max()),
                   "iris": [ic["cx"], ic["cy"]] if ic else None, "top": float(ys2.min()), "bot": float(ys2.max()), "w": float(xs2.max() - xs2.min())}
    lm["eyes"] = eyes
    eye_y = np.mean([eyes[s]["iris"][1] for s in eyes if eyes[s]["iris"]])
    # brows: dark blobs 25-90 px above the eye line, inside the face (not hair-connected)
    dark = (lum < 95) & (yy > eye_y - 120) & (yy < eye_y - 20)
    br = [c for c in comps(dark, 150) if c["x1"] - c["x0"] > 50 and c["x1"] - c["x0"] < 200 and (c["y1"] - c["y0"]) < 60]
    br = sorted(br, key=lambda c: c["cx"])
    lm["brows"] = [[c["x0"], float(np.where(c["mask"][:, c["x0"]])[0].mean()), c["x1"], float(np.where(c["mask"][:, c["x1"]])[0].mean()), c["cx"], c["cy"]] for c in br]
    # bindi: small dark-red blob between the brows
    bd = [c for c in comps((lum < 110) & (R > G + 25) & (yy > eye_y - 140) & (yy < eye_y - 40) & (xx > 400) & (xx < 680), 30) if c["n"] < 900]
    lm["bindi"] = [max(bd, key=lambda c: c["n"])["cx"], max(bd, key=lambda c: c["n"])["cy"]] if bd else None
    # mouth: the lip line (darkest per column) between 70 and 200 px below the eye line, where it is dark enough
    y0, y1 = int(eye_y + 90), int(eye_y + 200)
    sm = ndi.gaussian_filter(lum, 0.8)
    xsl, ysl = [], []
    for x in range(380, 700):
        col = sm[y0:y1, x]
        j = int(np.argmin(col))
        if col[j] < 75 and skin[y0 + j - 8, x]:
            xsl.append(x); ysl.append(y0 + j)
    xsl, ysl = np.array(xsl), np.array(ysl)
    # the longest run of consecutive columns
    runs = np.split(np.arange(len(xsl)), np.where(np.diff(xsl) > 3)[0] + 1)
    run = max(runs, key=len)
    mx, my = xsl[run], ysl[run]
    lm["mouth"] = {"l": [float(mx[0]), float(my[0])], "r": [float(mx[-1]), float(my[-1])], "c": [float(mx[len(mx) // 2]), float(my[len(my) // 2])], "low": float(my.max())}
    # nostrils: the two darkest small blobs between eyes and mouth
    ny0, ny1 = int(eye_y + 40), int(lm["mouth"]["low"] - 15)
    nz = (sm < np.percentile(sm[ny0:ny1, 430:650], 3)) & (yy > ny0) & (yy < ny1) & (xx > 420) & (xx < 660)
    nc = sorted(comps(nz, 4), key=lambda c: -c["n"])[:2]
    lm["nostrils"] = sorted([[c["cx"], c["cy"]] for c in nc])
    # earrings: gold blobs
    gold = (R > 170) & (G > 120) & (B < 90) & (R - B > 110) & (G - B > 60) & (yy > eye_y + 40) & (yy < eye_y + 190) & ((xx < 380) | (xx > 640))
    ge = sorted(comps(gold, 25), key=lambda c: -c["n"])[:2]
    lm["earrings"] = sorted([[c["cx"], c["cy"]] for c in ge])
    # head silhouette (hair + face vs background) per row in the cranium, and the face (skin) silhouette per row
    fg = ~bg
    head_rows = {}
    for y in range(60, int(eye_y) + 1, 20):
        r = np.where(fg[y, 150:880])[0]
        if len(r):
            head_rows[y] = [float(r.min() + 150), float(r.max() + 150)]
    lm["head_rows"] = head_rows
    lab, n = ndi.label(skin & (yy > eye_y - 150) & (yy < lm["mouth"]["low"] + 70))
    face = lab == lab[int(eye_y) + 60, int(np.mean([eyes[s]["iris"][0] for s in eyes]))]
    face = ndi.binary_fill_holes(face)
    face_rows = {}
    for y in range(int(eye_y - 100), int(lm["mouth"]["low"] + 60), 20):
        r = np.where(face[y])[0]
        if len(r) > 50:
            face_rows[y] = [float(r.min()), float(r.max())]
    lm["face_rows"] = face_rows
    lm["eye_y"] = float(eye_y)
    lm["mouth_y"] = float(np.mean([lm["mouth"]["l"][1], lm["mouth"]["r"][1], lm["mouth"]["c"][1]]))
    # cranium centre: mean of the head silhouette centre over the rows above the brows
    ctr = [0.5 * (v[0] + v[1]) for y, v in head_rows.items() if y < eye_y - 120]
    lm["cranium_cx"] = float(np.mean(ctr))
    lm["crown_y"] = float(np.where(fg[:, int(lm["cranium_cx"]) - 5:int(lm["cranium_cx"]) + 5].any(1))[0].min())
    return im, lm


def draw(im, lm, path):
    I = Image.fromarray(im.astype(np.uint8))
    d = ImageDraw.Draw(I)
    def pt(p, c=(255, 0, 0), r=4):
        if p is None: return
        d.ellipse((p[0] - r, p[1] - r, p[0] + r, p[1] + r), outline=c, width=2)
    for s, e in lm["eyes"].items():
        pt(e["in"], (0, 255, 0)); pt(e["out"], (255, 0, 255)); pt(e["iris"], (0, 255, 255))
    for b in lm["brows"]:
        pt(b[0:2], (255, 255, 0)); pt(b[2:4], (255, 128, 0))
    pt(lm["bindi"], (255, 255, 255))
    for k in ("l", "r", "c"): pt(lm["mouth"][k], (0, 0, 255))
    for p in lm["nostrils"]: pt(p, (128, 0, 255))
    for p in lm["earrings"]: pt(p, (255, 0, 0), 7)
    for y, (a, b) in lm["head_rows"].items():
        pt([a, int(y)], (0, 128, 255), 3); pt([b, int(y)], (0, 128, 255), 3)
    for y, (a, b) in lm["face_rows"].items():
        pt([a, int(y)], (255, 64, 64), 3); pt([b, int(y)], (255, 64, 64), 3)
    d.line([(lm["cranium_cx"], 0), (lm["cranium_cx"], 1024)], fill=(255, 0, 0))
    I.save(path)


if __name__ == "__main__":
    out = {}
    for name, p in FILES.items():
        im, lm = detect(p)
        draw(im, lm, f"{WK}/lm-{name}.png")
        out[name] = lm
        print(name, "eye_y %.1f mouth_y %.1f cranium_cx %.1f crown %.1f" % (lm["eye_y"], lm["mouth_y"], lm["cranium_cx"], lm["crown_y"]),
              {s: (round(e["w"]), e["iris"] and [round(v) for v in e["iris"]]) for s, e in lm["eyes"].items()}, "brows", len(lm["brows"]))
    json.dump(out, open(f"{K}/landmarks.json", "w"), indent=1, default=float)
