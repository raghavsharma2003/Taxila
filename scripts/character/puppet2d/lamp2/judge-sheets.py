"""Judge inputs from a 30 fps capture (capture.mjs), identical for every arm (lamp2 and the r8 calibration):
  moments  8 numbered frames of the desk window (375 x 405 CSS px at 412) at fixed scene times:
           0.80 idle | 2.48 speaking | 3.30 open vowel | 5.65 speaking | 10.75 listening | 12.60 thinking | 13.95 warm | 14.30 the eval turn
  seq      6 numbered consecutive frames at 15 fps (every 2nd capture frame) while she speaks, from 3.00 s
lamp1's own sheet builder lived in its scratch and is gone; these times follow its frame-sheet labels.
    python3 -I judge-sheets.py <capdir> <out-prefix> [slot=desk]"""
import sys, json
from PIL import Image, ImageDraw, ImageFont
cap, out = sys.argv[1], sys.argv[2]
slot = sys.argv[3] if len(sys.argv) > 3 else "desk"
L = json.load(open(f"{cap}/log.json"))
b = next(x for x in L["boxes"] if x["slot"] == slot)
fps = L["fps"]
MOMENTS = [0.80, 2.48, 3.30, 5.65, 10.75, 12.60, 13.95, 14.30]
SEQ0 = 3.00
def frame(t):
    im = Image.open(f"{cap}/f{round(t * fps):04d}.png").convert("RGB")
    return im.crop((round(b["x"]), round(b["y"]), round(b["x"] + b["w"]), round(b["y"] + b["h"])))
try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except OSError: font = ImageFont.load_default()
def sheet(ims, cols, path):
    w, h = ims[0].size; pad = 8
    G = Image.new("RGB", (cols * (w + pad) + pad, ((len(ims) + cols - 1) // cols) * (h + pad) + pad), (255, 255, 255))
    d = ImageDraw.Draw(G)
    for i, im in enumerate(ims):
        x, y = pad + (i % cols) * (w + pad), pad + (i // cols) * (h + pad)
        G.paste(im, (x, y)); d.rectangle((x + 4, y + 4, x + 32, y + 32), fill=(255, 255, 255)); d.text((x + 10, y + 6), str(i + 1), fill=(0, 0, 0), font=font)
    G.save(path)
sheet([frame(t) for t in MOMENTS], 4, f"{out}-moments.png")
sheet([frame(SEQ0 + i / 15) for i in range(6)], 3, f"{out}-seq.png")
print(out, b)
