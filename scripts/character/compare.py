"""Before / after evidence for an iteration: per look, the previous contact sheet beside the new one, plus one compact
sheet (warm face, before | after, with the G9 numbers) for all three looks.

    python3 scripts/character/compare.py docs/design/teacher/renders [before_dir]
Outputs <renders>/before-after-<look>.png and <renders>/before-after.png.
"""
import json, os, sys
from PIL import Image, ImageDraw

R = sys.argv[1]
B = sys.argv[2] if len(sys.argv) > 2 else os.path.join(R, "before")
looks = ["teal", "slate", "plum"]
g9 = {}
for f in sorted(os.listdir(R)):
    if f.startswith("measure-") and f.endswith(".json"):
        g9 = json.load(open(os.path.join(R, f))).get("g9", g9)
MST = {6: (55.1, 27.9), 7: (42.5, 23.9), 8: (30.7, 17.7)}
BEFORE_LAB = {"teal": (78, None), "slate": (68, None), "plum": (54, None)}   # review item 1, sampled from warm.png


def label(im, text, xy=(8, 6), fill=(255, 255, 255)):
    ImageDraw.Draw(im).text(xy, text, fill=fill)


for look in looks:
    a = Image.open(os.path.join(B, f"contact-{look}.png")).convert("RGB")
    b = Image.open(os.path.join(R, look, "contact.png")).convert("RGB")
    W = 1100
    a = a.resize((W, int(a.height * W / a.width)))
    b = b.resize((W, int(b.height * W / b.width)))
    im = Image.new("RGB", (2 * W + 20, max(a.height, b.height) + 30), (16, 16, 18))
    im.paste(a, (0, 30))
    im.paste(b, (W + 20, 30))
    label(im, f"'{look}' BEFORE (iteration 1, 2026-10-03)", (8, 8), (255, 200, 160))
    label(im, f"'{look}' AFTER (iteration 2, 2026-10-03)", (W + 28, 8), (160, 255, 190))
    im.save(os.path.join(R, f"before-after-{look}.png"), optimize=True)

tw, th = 300, 375
im = Image.new("RGB", (len(looks) * (2 * tw + 20), th + 70), (16, 16, 18))
for i, look in enumerate(looks):
    x = i * (2 * tw + 20)
    a = Image.open(os.path.join(B, f"warm-{look}.png")).convert("RGB").resize((tw, th))
    b = Image.open(os.path.join(R, look, "emotions", "warm.png")).convert("RGB").resize((tw, th))
    im.paste(a, (x, 50))
    im.paste(b, (x + tw, 50))
    g = g9.get(look, {})
    label(im, f"{look}: before | after (emotion 'warm', H)", (x + 6, 6))
    if g:
        label(im, f"MST {g['mst']} target L*{g['target']['L']} C*{g['target']['C']}", (x + 6, 20), (200, 200, 200))
        label(im, f"before L*~{BEFORE_LAB[look][0]}   after L*{g['rendered']['L']} C*{g['rendered']['C']} ({'PASS' if g['pass'] else 'FAIL'})", (x + 6, 34), (160, 255, 190) if g["pass"] else (255, 140, 140))
im.save(os.path.join(R, "before-after.png"), optimize=True)
print("before/after written")
