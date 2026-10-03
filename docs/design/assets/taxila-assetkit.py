#!/usr/bin/env python3
"""Taxila asset kit: fit, key, stitch, wrap, composite, check and record images for the Codex image run.
Needs Pillow (pip install pillow); numpy is optional (faster checks). Run from the repo root.
  init  LIST.md                         create/merge public/assets/gen/INDEX.json from the prompt's ASSET LIST
  show  LIST.md ID                      print one expanded entry (path, size, flags, refs, subject)
  status                                counts + the next 10 pending ids
  fit   SRC DST WxH [--alpha] [--q 92] [--gravity center|top|bottom|left|right]
  key   SRC DST [--hex FF00FF] [--tol 70]   chroma key a flat background to real alpha
  stitch DST P1 P2 P3 --w 4800 --h 1200 [--overlap 96]
  wrap  SRC DST [--band 96] [--both]      make left/right (and with --both, top/bottom) edges tile
  solid DST WxH HEX [--grain]
  place SRC DST WxH HEX SIZE              SRC (alpha) centred at SIZE px on a flat HEX canvas
  mono  SRC DST                           alpha silhouette -> flat white on transparency
  check PATH WxH [--alpha] [--lint lamp-hue|skin-review|reference-only] [--wrap]
  record ID STATUS [--notes TEXT] [--model M] [--attempts N] [--ocr visual|tesseract]
  prov  ID --prompt-file F [--tool T] [--model M] [--attempts N]   append the provenance row for a done image
"""
import sys, os, re, json, hashlib, argparse, datetime, colorsys, subprocess, warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
from PIL import Image, ImageFilter
try:
    import numpy as np
except Exception:
    np = None

INDEX = "public/assets/gen/INDEX.json"
LAMP_H, LAMP_TOL = 39.5, 12.0


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_index():
    if os.path.exists(INDEX):
        with open(INDEX) as f:
            return json.load(f)
    return {"version": 1, "manifestVersion": 1, "branch": "claude/blissful-mayer-icwe2j", "startedAt": now(), "items": {}}


def save_index(ix):
    ix["updatedAt"] = now()
    items = ix["items"].values()
    ix["summary"] = {s: sum(1 for i in items if i["status"] == s) for s in ("pending", "done", "skipped", "failed")}
    ix["skipped"] = sorted(k for k, v in ix["items"].items() if v["status"] in ("skipped", "failed"))
    os.makedirs(os.path.dirname(INDEX), exist_ok=True)
    tmp = INDEX + ".tmp"
    with open(tmp, "w") as f:
        json.dump(ix, f, indent=2, sort_keys=False)
        f.write("\n")
    os.replace(tmp, INDEX)


def ramp(w, h):
    m = Image.new("L", (w, 1))
    m.putdata([round(255 * i / max(w - 1, 1)) for i in range(w)])
    return m.resize((w, h))


def size(s):
    w, h = s.lower().split("x")
    return int(w), int(h)


def save(img, dst, q=92):
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    ext = dst.rsplit(".", 1)[-1].lower()
    if ext == "webp":
        if img.mode == "RGBA":
            img.save(dst, "WEBP", quality=q, method=6, exact=True)
        else:
            img.convert("RGB").save(dst, "WEBP", quality=q, method=6)
    elif ext == "png":
        img.save(dst, "PNG", optimize=True)
    else:
        raise SystemExit("unsupported extension " + ext)


def fit(a):
    w, h = size(a.size)
    img = Image.open(a.src)
    img = img.convert("RGBA") if a.alpha else img.convert("RGB")
    sw, sh = img.size
    r = w / h
    cw, ch = (sw, round(sw / r)) if sw / sh < r else (round(sh * r), sh)
    cw, ch = min(cw, sw), min(ch, sh)
    g = a.gravity
    x = {"left": 0, "right": sw - cw}.get(g, (sw - cw) // 2)
    y = {"top": 0, "bottom": sh - ch}.get(g, (sh - ch) // 2)
    img = img.crop((x, y, x + cw, y + ch)).resize((w, h), Image.LANCZOS)
    save(img, a.dst, a.q)
    print(json.dumps({"fit": a.dst, "from": [sw, sh], "crop": [cw, ch], "scale": round(max(w / cw, h / ch), 2)}))


def key(a):
    img = Image.open(a.src).convert("RGBA")
    kr, kg, kb = (int(a.hex[i:i + 2], 16) for i in (0, 2, 4))
    px = img.load()
    W, H = img.size
    tol = a.tol
    for yy in range(H):
        for xx in range(W):
            r, g, b, al = px[xx, yy]
            d = ((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) ** 0.5
            if d < tol:
                px[xx, yy] = (r, g, b, 0)
            elif d < tol * 2:
                t = (d - tol) / tol
                # despill: pull the key colour out of edge pixels
                r2 = int(max(0, min(255, (r - kr * (1 - t)) / max(t, 1e-3))))
                g2 = int(max(0, min(255, (g - kg * (1 - t)) / max(t, 1e-3))))
                b2 = int(max(0, min(255, (b - kb * (1 - t)) / max(t, 1e-3))))
                px[xx, yy] = (r2, g2, b2, int(al * t))
    save(img, a.dst)
    print(json.dumps({"keyed": a.dst}))


def stitch(a):
    ov = a.overlap
    n = len(a.panels)
    pw = (a.w + ov * (n - 1)) // n
    panels = []
    for p in a.panels:
        im = Image.open(p).convert("RGB")
        sw, sh = im.size
        r = pw / a.h
        cw, ch = (sw, round(sw / r)) if sw / sh < r else (round(sh * r), sh)
        x, y = (sw - cw) // 2, (sh - ch) // 2
        panels.append(im.crop((x, y, x + cw, y + ch)).resize((pw, a.h), Image.LANCZOS))
    out = Image.new("RGB", (a.w, a.h))
    x = 0
    for i, im in enumerate(panels):
        if i == 0:
            out.paste(im, (0, 0))
        else:
            mask = ramp(ov, a.h)  # 0 (keep what is there) -> 255 (new panel), left to right
            base = out.crop((x, 0, x + ov, a.h))
            blend = Image.composite(im.crop((0, 0, ov, a.h)), base, mask)
            out.paste(im, (x, 0))
            out.paste(blend, (x, 0))
        x += pw - ov
    out = out.crop((0, 0, a.w, a.h))
    save(out, a.dst)
    print(json.dumps({"stitched": a.dst, "panelWidth": pw}))


def wrap_lr(im, b):
    W, H = im.size
    L = im.crop((0, 0, b, H))
    R = im.crop((W - b, 0, W, H))
    half = ramp(b, H).point(lambda v: v // 2)  # 0 at the inner side -> 127 at the outer edge
    # right strip drifts toward the left strip at its outer edge, and vice versa
    newR = Image.composite(L, R, half)
    newL = Image.composite(R, L, half.transpose(Image.FLIP_LEFT_RIGHT))
    im.paste(newR, (W - b, 0))
    im.paste(newL, (0, 0))
    return im


def wrap(a):
    im = Image.open(a.src).convert("RGB")
    im = wrap_lr(im, a.band)
    if a.both:
        im = wrap_lr(im.transpose(Image.ROTATE_90), a.band).transpose(Image.ROTATE_270)
    save(im, a.dst)
    print(json.dumps({"wrapped": a.dst, "both": bool(a.both)}))


def solid(a):
    w, h = size(a.size)
    c = tuple(int(a.hex.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    im = Image.new("RGB", (w, h), c)
    if a.grain:
        noise = Image.effect_noise((w, h), 6).convert("L")
        im = Image.composite(Image.new("RGB", (w, h), tuple(min(255, v + 6) for v in c)), im, noise.point(lambda v: 40 if v > 128 else 0))
    save(im, a.dst)


def place(a):
    w, h = size(a.size)
    c = tuple(int(a.hex.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    canvas = Image.new("RGBA", (w, h), c + (255,))
    src = Image.open(a.src).convert("RGBA")
    src.thumbnail((a.px, a.px), Image.LANCZOS)
    canvas.alpha_composite(src, ((w - src.width) // 2, (h - src.height) // 2))
    save(canvas.convert("RGB"), a.dst)


def mono(a):
    src = Image.open(a.src).convert("RGBA")
    alpha = src.getchannel("A")
    white = Image.new("RGBA", src.size, (255, 255, 255, 255))
    white.putalpha(alpha)
    save(white, a.dst)


def lamp_share(img):
    im = img.convert("RGBA")
    im.thumbnail((768, 768))
    if np is not None:
        arr = np.asarray(im).astype(np.float32) / 255.0
        rgb, al = arr[..., :3], arr[..., 3]
        mx, mn = rgb.max(-1), rgb.min(-1)
        l = (mx + mn) / 2
        d = mx - mn
        s = np.where(d == 0, 0, d / (1 - np.abs(2 * l - 1) + 1e-9))
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        h = np.zeros_like(l)
        m = d > 0
        rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
        h[rm] = ((g - b)[rm] / d[rm]) % 6
        h[gm] = ((b - r)[gm] / d[gm]) + 2
        h[bm] = ((r - g)[bm] / d[bm]) + 4
        h = h * 60
        vis = al > 0.5
        hit = vis & (s >= 0.35) & (l >= 0.20) & (l <= 0.85) & (np.abs(h - LAMP_H) <= LAMP_TOL)
        n = int(vis.sum())
        return round(float(hit.sum()) / max(n, 1) * 100, 2)
    hit = n = 0
    for r, g, b, al in im.getdata():
        if al < 128:
            continue
        n += 1
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s >= 0.35 and 0.20 <= l <= 0.85 and abs(h * 360 - LAMP_H) <= LAMP_TOL:
            hit += 1
    return round(hit / max(n, 1) * 100, 2)


def checkerboard(img):
    """True if a corner looks like a painted fake-transparency checkerboard."""
    im = img.convert("L")
    W, H = im.size
    for (x, y) in ((0, 0), (W - 64, 0), (0, H - 64), (W - 64, H - 64)):
        c = im.crop((x, y, x + 64, y + 64))
        vals = sorted(set(c.getdata()))
        if 2 <= len(vals) <= 6 and vals[-1] - vals[0] > 12 and vals[0] > 150:
            return True
    return False


def check(a):
    w, h = size(a.size)
    res = {"path": a.path, "ok": True, "problems": []}
    if not os.path.exists(a.path):
        res.update(ok=False, problems=["missing"]); print(json.dumps(res)); return res
    img = Image.open(a.path)
    img.load()
    res["size"] = list(img.size); res["mode"] = img.mode; res["bytes"] = os.path.getsize(a.path)
    if img.size != (w, h):
        res["problems"].append(f"size {img.size[0]}x{img.size[1]} != {w}x{h}")
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    if a.alpha:
        if not has_alpha:
            res["problems"].append("no alpha channel")
        else:
            al = img.convert("RGBA").getchannel("A")
            corners = [al.crop(b) for b in ((0, 0, 16, 16), (w - 16, 0, w, 16), (0, h - 16, 16, h), (w - 16, h - 16, w, h))]
            if max(max(c.getdata()) for c in corners) > 8:
                res["problems"].append("corners not transparent")
            clear = sum(1 for v in al.getdata() if v == 0) / (w * h)
            res["transparentShare"] = round(clear * 100, 1)
            if clear < 0.10:
                res["problems"].append("less than 10% fully transparent")
    else:
        if has_alpha and min(img.convert("RGBA").getchannel("A").getdata()) < 255:
            res["problems"].append("opaque asset has transparent pixels")
    if checkerboard(img):
        res["problems"].append("fake checkerboard transparency painted in")
    if a.lint and "lamp-hue" in a.lint:
        share = lamp_share(img)
        res["lampHueShare"] = share
        if share > 1.5:
            if "skin-review" in a.lint:
                res["note"] = "lamp-hue share above 1.5%; skin-review item: report, a human reviews"
            else:
                res["problems"].append(f"lamp-hue pixels {share}% > 1.5%")
    if a.wrap:
        im = img.convert("RGB")
        lc = im.crop((0, 0, 4, h)).resize((1, 64)); rc = im.crop((w - 4, 0, w, h)).resize((1, 64))
        diff = sum(sum(abs(p - q) for p, q in zip(x, y)) for x, y in zip(lc.getdata(), rc.getdata())) / (64 * 3)
        res["edgeWrapDiff"] = round(diff, 1)
        if diff > 18:
            res["problems"].append(f"left/right edges do not tile (mean diff {diff:.1f})")
    try:
        out = subprocess.run(["tesseract", a.path, "-", "--psm", "11"], capture_output=True, text=True, timeout=60)
        txt = "".join(ch for ch in out.stdout if ch.isalnum())
        res["ocr"] = "tesseract"; res["ocrChars"] = len(txt)
        if len(txt) >= 3:
            res["problems"].append(f"OCR found characters: {txt[:20]!r} (inspect visually)")
    except Exception:
        res["ocr"] = "visual"
    res["ok"] = not res["problems"]
    print(json.dumps(res))
    return res


def record(a):
    ix = load_index()
    it = ix["items"].get(a.id)
    if it is None:
        raise SystemExit(f"unknown id {a.id}: run init first")
    it["status"] = a.status
    it["date"] = now()
    if a.notes: it["notes"] = a.notes
    if a.model: it["model"] = a.model
    if a.attempts: it["attempts"] = a.attempts
    if a.ocr: it["ocr"] = a.ocr
    p = it["path"]
    if a.status == "done":
        if not os.path.exists(p):
            raise SystemExit("cannot mark done: file missing " + p)
        img = Image.open(p)
        it["width"], it["height"] = img.size
        it["bytes"] = os.path.getsize(p)
        it["sha256"] = hashlib.sha256(open(p, "rb").read()).hexdigest()
        if "lamp-hue" in it.get("lint", ""):
            it["lampHueShare"] = lamp_share(img)
    save_index(ix)
    print(json.dumps({a.id: it["status"]}))


CHAR_BATCH = {"asha": ("B11", "young"), "arjun": ("B12", "older"), "uma": ("B13", "older")}
LINE = re.compile(r"^- (\S+) \| (\d+x\d+) (png|webp)((?: [a-z]+)*) \| ref: ([^|]*) \| (.*)$")


def path_of(i, ext):
    if i.startswith("teacher-ref/"):
        return "art/gen/teacher/" + i[len("teacher-ref/"):] + "." + ext
    return "public/assets/gen/" + i + "." + ext


def parse_list(fn):
    out, batch = [], None
    for raw in open(fn, encoding="utf-8"):
        raw = raw.rstrip("\n")
        m = re.match(r"^### (B\d\d)", raw)
        if m:
            batch = m.group(1)
            continue
        m = LINE.match(raw)
        if not m:
            continue
        i, sz, ext, fl, refs, subj = m.groups()
        fl = fl.split()
        refs = [] if refs.strip() == "-" else [r.strip() for r in refs.split(",")]
        chars = CHAR_BATCH.items() if "{c}" in i else [(None, (batch, None))]
        for c, (b, stage) in chars:
            sub = lambda t: t.replace("{c}", c).replace("{stage}", stage) if c else t
            ii = sub(i)
            owner = ii.split("/")[1] if ii.startswith("teacher-ref/") else None
            if owner in CHAR_BATCH:
                c_batch = CHAR_BATCH[owner][0]
            else:
                c_batch = b if c else batch
            lint = "reference-only" if ii.startswith("teacher-ref/") else ("lamp-hue, skin-review" if "skin" in fl else "lamp-hue")
            out.append({"id": ii, "path": path_of(ii, ext), "size": sz, "alpha": "alpha" in fl, "flags": fl, "lint": lint,
                        "batch": c_batch, "references": [sub(r) for r in refs], "subject": sub(subj)})
    return out


def prov_file(p):
    parts = p.split("/")
    if p.startswith("art/gen/teacher/"):
        return "/".join(parts[:4]) + "/provenance.json"
    return "/".join(parts[:4]) + "/provenance.json"   # public/assets/gen/<category>/provenance.json


def prov(a):
    ix = load_index()
    it = ix["items"].get(a.id)
    if it is None:
        raise SystemExit("unknown id " + a.id)
    pf = prov_file(it["path"])
    rows = json.load(open(pf)) if os.path.exists(pf) else []
    rows = [r for r in rows if r.get("id") != a.id]
    rows.append({"file": os.path.relpath(it["path"], os.path.dirname(pf)), "id": a.id, "prompt": open(a.prompt_file, encoding="utf-8").read().strip(),
                 "references": it.get("references", []), "date": now(), "tool": a.tool, "model": a.model, "attempts": a.attempts})
    os.makedirs(os.path.dirname(pf), exist_ok=True)
    with open(pf, "w") as f:
        json.dump(rows, f, indent=2); f.write("\n")
    print(json.dumps({"provenance": pf, "rows": len(rows)}))


def init(a):
    ix = load_index()
    items = parse_list(a.items)
    added = 0
    for it in items:
        if it["id"] not in ix["items"]:
            ix["items"][it["id"]] = {k: it[k] for k in ("path", "size", "alpha", "flags", "lint", "batch", "references")} | {"status": "pending"}
            added += 1
    save_index(ix)
    print(json.dumps({"added": added, "total": len(ix["items"])}))


def show(a):
    for it in parse_list(a.items):
        if it["id"] == a.id:
            print(json.dumps(it, indent=1)); return
    raise SystemExit("not in list: " + a.id)


def status(a):
    ix = load_index()
    items = ix["items"]
    # a done item whose file vanished goes back to pending
    for k, v in items.items():
        if v["status"] == "done" and not os.path.exists(v["path"]):
            v["status"] = "pending"
    save_index(ix)
    order = ["B00","B01","B02","B03","B04","B05","B06","B07","B08","B09","B10","B11","B12","B13"]
    pend = sorted((k for k, v in items.items() if v["status"] == "pending"), key=lambda k: order.index(items[k]["batch"]))
    print(json.dumps({"summary": ix["summary"], "next": pend[:10], "nextBatch": items[pend[0]]["batch"] if pend else None}, indent=1))


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("init"); p.add_argument("items"); p.set_defaults(f=init)
    p = sp.add_parser("prov"); p.add_argument("id"); p.add_argument("--prompt-file", required=True); p.add_argument("--tool", default="codex image tool"); p.add_argument("--model", default="unknown"); p.add_argument("--attempts", type=int, default=1); p.set_defaults(f=prov)
    p = sp.add_parser("show"); p.add_argument("items"); p.add_argument("id"); p.set_defaults(f=show)
    p = sp.add_parser("status"); p.set_defaults(f=status)
    p = sp.add_parser("fit"); p.add_argument("src"); p.add_argument("dst"); p.add_argument("size"); p.add_argument("--alpha", action="store_true"); p.add_argument("--q", type=int, default=92); p.add_argument("--gravity", default="center"); p.set_defaults(f=fit)
    p = sp.add_parser("key"); p.add_argument("src"); p.add_argument("dst"); p.add_argument("--hex", default="FF00FF"); p.add_argument("--tol", type=float, default=70); p.set_defaults(f=key)
    p = sp.add_parser("stitch"); p.add_argument("dst"); p.add_argument("panels", nargs=3); p.add_argument("--w", type=int, default=4800); p.add_argument("--h", type=int, default=1200); p.add_argument("--overlap", type=int, default=96); p.set_defaults(f=stitch)
    p = sp.add_parser("wrap"); p.add_argument("src"); p.add_argument("dst"); p.add_argument("--band", type=int, default=96); p.add_argument("--both", action="store_true"); p.set_defaults(f=wrap)
    p = sp.add_parser("solid"); p.add_argument("dst"); p.add_argument("size"); p.add_argument("hex"); p.add_argument("--grain", action="store_true"); p.set_defaults(f=solid)
    p = sp.add_parser("place"); p.add_argument("src"); p.add_argument("dst"); p.add_argument("size"); p.add_argument("hex"); p.add_argument("px", type=int); p.set_defaults(f=place)
    p = sp.add_parser("mono"); p.add_argument("src"); p.add_argument("dst"); p.set_defaults(f=mono)
    p = sp.add_parser("check"); p.add_argument("path"); p.add_argument("size"); p.add_argument("--alpha", action="store_true"); p.add_argument("--lint", default=""); p.add_argument("--wrap", action="store_true"); p.set_defaults(f=check)
    p = sp.add_parser("record"); p.add_argument("id"); p.add_argument("status", choices=["pending", "done", "skipped", "failed"]); p.add_argument("--notes"); p.add_argument("--model"); p.add_argument("--attempts", type=int); p.add_argument("--ocr"); p.set_defaults(f=record)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
