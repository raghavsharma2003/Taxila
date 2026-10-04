# Compose the stylised-teacher concept sheets: per direction a row (front large + 4-expression strip) and
# COMPARE.png = 2x2 grid of those rows (a top-left, b top-right, c bottom-left, d bottom-right), labelled only by a
# corner letter. No other text.  python3 scripts/character/stylised/compose.py
import os
from PIL import Image, ImageDraw, ImageFont

D = "docs/design/teacher/stylised/concepts"
EXPR = ["talking", "listening", "thinking", "happy"]
F, S, G = 640, 320, 12          # front size, strip cell size, gutter
W, H = F + G + 2 * S + G, F     # each cell: front | 2x2 expressions
BG = (250, 246, 238)


def font(px):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, px)
    return ImageFont.load_default()


def cell(s):
    c = Image.new("RGB", (W, H), BG)
    c.paste(Image.open(f"{D}/{s}-front.png").convert("RGB").resize((F, F), Image.LANCZOS), (0, 0))
    for i, e in enumerate(EXPR):
        p = f"{D}/{s}-{e}.png"
        if not os.path.exists(p):
            continue
        x, y = F + G + (i % 2) * (S + G // 2), (i // 2) * S
        c.paste(Image.open(p).convert("RGB").resize((S, S), Image.LANCZOS), (x, y))
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((14, 14, 84, 84), 14, fill=(30, 30, 30))
    d.text((49, 47), s, fill=(255, 255, 255), font=font(52), anchor="mm")
    c.save(f"{D}/{s}-sheet.png")
    return c


cells = [cell(s) for s in "abcd"]
M = 24
out = Image.new("RGB", (2 * W + 3 * M, 2 * H + 3 * M), (255, 255, 255))
for i, c in enumerate(cells):
    out.paste(c, (M + (i % 2) * (W + M), M + (i // 2) * (H + M)))
out.save(f"{D}/COMPARE.png", optimize=True)
print(f"{D}/COMPARE.png", out.size)
