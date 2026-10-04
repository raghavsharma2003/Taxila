"""Contact sheet for one look's renders: turntable, emotions, states, visemes, tiers, lip-sync frames (labelled)."""
import json, os, sys
from PIL import Image, ImageDraw

d, look = sys.argv[1], sys.argv[2]


def tile(paths, labels, w, h, cols):
    rows = (len(paths) + cols - 1) // cols
    im = Image.new("RGB", (cols * w, rows * (h + 18)), (24, 24, 26))
    dr = ImageDraw.Draw(im)
    for i, (p, l) in enumerate(zip(paths, labels)):
        if not os.path.exists(p):
            continue
        t = Image.open(p).convert("RGB")
        t.thumbnail((w, h))
        x, y = (i % cols) * w, (i // cols) * (h + 18)
        im.paste(t, (x + (w - t.width) // 2, y + 18))
        dr.text((x + 4, y + 3), l, fill=(235, 220, 160))
    return im


sec = []
PR = ["front_neutral", "front_warm", "q34_neutral", "q34_warm", "bust_front", "bust_q34"]
if os.path.isdir(os.path.join(d, "portraits")):  # c1: portraits row first
    sec.append(("portraits (H): front / 3/4, neutral / warm, bust", tile([os.path.join(d, "portraits", p + ".png") for p in PR], PR, 300, 375, 6)))
tt = sorted(f for f in os.listdir(os.path.join(d, "turntable")) if f.endswith(".png"))
sec.append(("turntable (H)", tile([os.path.join(d, "turntable", f) for f in tt], [f[:-4] for f in tt], 220, 275, 8)))
E = ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"]
sec.append(("9 emotions (H, intensity 1)", tile([os.path.join(d, "emotions", e + ".png") for e in E], E, 196, 245, 9)))
S = ["idle", "listening", "thinking", "speaking", "your_turn", "celebrating", "concerned"]
sec.append(("7 owner states (H)", tile([os.path.join(d, "states", s + ".png") for s in S], S, 250, 312, 7)))
V = ["viseme_" + v for v in "sil PP FF TH DD kk CH SS nn RR aa E I O U".split()] + ["tongueTipUp", "tongueCurl", "tongueWide"]
sec.append(("15 visemes + Hindi tongue keys (H)", tile([os.path.join(d, "visemes", v + ".png") for v in V], [v.replace("viseme_", "") for v in V], 196, 245, 9)))
sec.append(("tiers: H / B+ / B-lite (same pose)", tile([os.path.join(d, f"tier_{t}.png") for t in ("H", "Bplus", "Blite")], ["H", "B+", "B-lite"], 300, 375, 3)))
lp = [os.path.join(d, f"lip_{i}.png") for i in range(8)]
meta = json.load(open(os.path.join(d, "render.json"))) if os.path.exists(os.path.join(d, "render.json")) else {}
strip = meta.get("lipStrip")
if strip:
    labels = [f"{s['t']}s {s['viseme'].replace('viseme_', '')} '{s['word']}'" for s in strip]
    title = "lip-sync clip frames (real TTS; forced-aligned visemes on H + real Behaviour/Compositor): 4 on /p b m/, 4 on vowels"
else:
    labels, title = [f"{(i + 1) * 10}%" for i in range(8)], "lip-sync clip frames (real TTS, real src/avatar driver)"
sec.append((title, tile(lp, labels, 220, 275, 8)))
W = max(s[1].width for s in sec)
H = sum(s[1].height + 30 for s in sec) + 40
sheet = Image.new("RGB", (W, H), (16, 16, 18))
dr = ImageDraw.Draw(sheet)
dr.text((10, 10), f"candidate c4 (fallback for SCOUT pick D MetaPerson: Microsoft Rocketbox Female_Adult_07, MIT; re-toned to MST 6 + polish pass 2026-10-04; re-rigged to the Taxila contract): OUR three.js renderer + rig, SwiftShader (software GL) renders", fill=(255, 255, 255))
y = 40
for title, im in sec:
    dr.text((10, y + 8), title, fill=(160, 210, 255))
    sheet.paste(im, (0, y + 28))
    y += im.height + 30
sheet.save(os.path.join(d, "contact.png"), optimize=True)
print("contact", sheet.size)

# lossless re-encode of every still (Playwright writes unoptimised PNGs)
for root, _, files in os.walk(d):
    for f in files:
        if f.endswith(".png") and f != "contact.png":
            p = os.path.join(root, f)
            Image.open(p).convert("RGB").save(p, optimize=True)
