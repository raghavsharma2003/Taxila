"""Owner review: lamp2 (LEFT) and r8 (RIGHT) side by side, the lesson desk window (375 x 405 CSS px at 412 wide) on top
and the 80 px speech-row circle under each, rendered at 2x (a phone's density), from two deterministic screenshot-
sequence captures of the SAME scene and the same driver (capture.mjs --dsf 2: a virtual 60 Hz clock, one screenshot per
1/30 s; no headless video recording). No text in the frames. Writes frames for ffmpeg and a still sheet.
    python3 -I owner-review.py <lamp2 capdir> <r8 capdir> <frames-out-dir> <still.webp>"""
import sys, os, json
from PIL import Image
a_dir, b_dir, out, still = sys.argv[1:5]
os.makedirs(out, exist_ok=True)
L = json.load(open(f"{a_dir}/log.json"))
box = {b["slot"]: b for b in L["boxes"]}
D = 2
crop = lambda im, b: im.crop((round(b["x"] * D), round(b["y"] * D), round((b["x"] + b["w"]) * D), round((b["y"] + b["h"]) * D)))
PAPER = (246, 243, 236)
G, dw, dh, rw = 48, round(box["desk"]["w"] * D), round(box["desk"]["h"] * D), round(box["row"]["w"] * D)
W, H = 3 * G + 2 * dw, 3 * G + dh + rw
n = len([f for f in os.listdir(a_dir) if f.startswith("f") and f.endswith(".png")])
def compose(i):
    F = Image.new("RGB", (W, H), PAPER)
    for j, d in enumerate((a_dir, b_dir)):
        im = Image.open(f"{d}/f{i:04d}.png").convert("RGB")
        x = G + j * (dw + G)
        F.paste(crop(im, box["desk"]), (x, G))
        F.paste(crop(im, box["row"]), (x + (dw - rw) // 2, 2 * G + dh))
    return F
for i in range(n):
    compose(i).save(f"{out}/o{i:04d}.png")
# still sheet: four moments (her line, a bilabial, listening, thinking), each a side-by-side frame, no text
T = [2.48, 5.65, 10.75, 12.60]
ims = [compose(round(t * 30)).resize((W // 2, H // 2), Image.LANCZOS) for t in T]
S_ = Image.new("RGB", (2 * (W // 2), 2 * (H // 2)), PAPER)
for k, im in enumerate(ims): S_.paste(im, ((k % 2) * (W // 2), (k // 2) * (H // 2)))
S_.save(still, "WEBP", quality=90)
print(n, "frames", W, H)
