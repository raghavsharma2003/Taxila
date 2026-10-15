"""Frame sheets (as lamp1's evidence/frames-*.webp): one row per app slot, one column per scene moment, from a 30 fps
capture (capture.mjs). The blink column is the first fully closed frame in the log.
    python3 -I frames-sheet.py <capdir> <out.webp>"""
import sys, json
from PIL import Image, ImageDraw, ImageFont
cap, out = sys.argv[1], sys.argv[2]
L = json.load(open(f"{cap}/log.json"))
fps = L["fps"]
shown = lambda s: s[1] if s[2] >= 0.5 else s[0]
blink = next((e["st"] for e in L["log"] if e["eyes"] and shown(e["eyes"]) == "closed" and e["st"] > 1), 5.0)
M = [(0.80, "idle"), (2.48, "speaking"), (3.30, "open vowel"), (5.65, "speaking"), (6.30, "speaking"), (10.75, "listening"),
     (12.60, "thinking"), (13.95, "warm"), (14.30, "eval turn (clamped)"), (round(round(blink * fps) / fps, 2), "blink")]
try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13); bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
except OSError: font = bold = ImageFont.load_default()
boxes = L["boxes"]
cw = max(b["w"] for b in boxes) + 12
rows = [(b, b["h"] + 26) for b in boxes]
W = 150 + cw * len(M); H = 30 + sum(h for _, h in rows)
G = Image.new("RGB", (int(W), int(H)), (246, 243, 236)); d = ImageDraw.Draw(G)
frames = {t: Image.open(f"{cap}/f{round(t * fps):04d}.png").convert("RGB") for t, _ in M}
for j, (t, lab) in enumerate(M): d.text((150 + j * cw, 8), f"{t:.2f} s {lab}", fill=(30, 30, 30), font=font)
y = 30
for b, h in rows:
    d.text((8, y + 4), f"{b['slot']} {int(b['w'])}x{int(b['h'])}", fill=(20, 20, 20), font=bold)
    for j, (t, _) in enumerate(M):
        G.paste(frames[t].crop((round(b["x"]), round(b["y"]), round(b["x"] + b["w"]), round(b["y"] + b["h"]))), (150 + j * cw, y))
    y += h
G.save(out, "WEBP", quality=88)
print(out, G.size)
