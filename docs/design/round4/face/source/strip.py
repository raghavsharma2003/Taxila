"""six-frame strip: front + expressions, full frame and a face crop row.  python3 -I strip.py out.png front [exprs...]"""
import sys, os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
out, front, *ex = sys.argv[1:]
ex = ex or ["speak", "listen", "think", "warm", "blink"]
ids = [front] + [f"{front}--{e}" for e in ex]
ims = []
for i in ids:
    p = f"{HERE}/raw/{i}.png"
    ims.append((i, Image.open(p).convert("RGB") if os.path.exists(p) else Image.new("RGB", (1024, 1024), (60, 50, 80))))
T = 300
S = Image.new("RGB", (len(ims) * (T + 8) + 8, 2 * T + 60), (23, 20, 46)); d = ImageDraw.Draw(S)
for k, (i, im) in enumerate(ims):
    x = 8 + k * (T + 8)
    S.paste(im.resize((T, T), Image.LANCZOS), (x, 8))
    S.paste(im.crop((312, 150, 712, 550)).resize((T, T), Image.LANCZOS), (x, T + 16))
    d.text((x, 2 * T + 22), i.split("--")[-1], fill=(255, 226, 161))
S.save(out)
