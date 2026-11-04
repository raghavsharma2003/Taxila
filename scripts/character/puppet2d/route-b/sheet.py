"""Compose the route (b) comparison sheet: rows = faces, columns = the same instants of one Diya line, a mouth crop strip
under each row so the lip shapes can be compared at a glance.  python3 sheet.py <framesDir> <out.png>"""
import json, sys
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1], sys.argv[2]
meta = json.load(open(f"{d}/sheet.json"))
n = len(meta["times"]); W = 200
font = ImageFont.load_default()
rows = []
for r in meta["rows"]:
    ims = [Image.open(f"{d}/{r['file']}-{i:02d}.png").convert("RGB") for i in range(n)]
    face = [im.resize((W, W)) for im in ims]
    w, h = ims[0].size
    # the mouth crop per look (close framing, square canvas): r8 sits lower in its view than lamp2
    box = (.3, .55, .7, .8) if r["file"].startswith("r8") else (.3, .7, .7, .95)
    mouth = [im.crop((int(w * box[0]), int(h * box[1]), int(w * box[2]), int(h * box[3]))).resize((W, int(W * .25 / .4))) for im in ims]
    rows.append((r["label"], face, mouth))
mh = rows[0][2][0].height
H = 40 + len(rows) * (W + mh + 34)
sheet = Image.new("RGB", (120 + n * W, H), "white"); dr = ImageDraw.Draw(sheet)
dr.text((10, 8), f"Diya line {meta['line']}: {meta['text'][:110]}", fill="black", font=font)
for i, (t, wd) in enumerate(zip(meta["times"], meta["words"])):
    dr.text((120 + i * W + 6, 24), f"{t} ms  '{wd}'", fill="black", font=font)
y = 40
for label, face, mouth in rows:
    dr.text((6, y + W // 2), label, fill="black", font=font)
    for i in range(n):
        sheet.paste(face[i], (120 + i * W, y)); sheet.paste(mouth[i], (120 + i * W, y + W))
    y += W + mh + 34
sheet.save(out)
