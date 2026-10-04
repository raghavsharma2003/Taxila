"""Expression stills (top) over the c-* concepts where one exists (bottom)."""
import sys
from PIL import Image, ImageDraw
D = sys.argv[1]; out = sys.argv[2]
C = "docs/design/teacher/stylised/concepts/"
names = ["rest", "thinking", "listening", "warm", "delight", "concern", "surprise", "playful"]
ref = {"rest": "c-front", "thinking": "c-thinking", "listening": "c-listening", "delight": "c-happy", "surprise": "c-talking"}
s = 300
W = Image.new("RGB", (s * len(names), 2 * s + 20), "white")
d = ImageDraw.Draw(W)
for i, n in enumerate(names):
    W.paste(Image.open(f"{D}/{n}.png").convert("RGB").resize((s, s), Image.LANCZOS), (i * s, 20))
    d.text((i * s + 6, 4), n, fill=(0, 0, 0))
    if n in ref:
        W.paste(Image.open(C + ref[n] + ".webp").convert("RGB").resize((s, s), Image.LANCZOS), (i * s, 20 + s))
W.save(out, quality=90)
