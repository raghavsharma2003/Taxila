# Release 11 stream 5: the before/after contact sheets from tests/prod/r11-asha-setup-shots.mjs (one webp per side per
# viewport, every set-up surface in order, labelled). python3 tests/prod/r11-asha-sheets.py <shots dir> <out dir>
import sys, os
from PIL import Image, ImageDraw, ImageFont
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
ORDER = ["signin", "signin-error", "forgot", "01-class", "01-class-filled", "02-promises", "03-phone", "04-consent", "04-consent-filled", "05-child", "05-child-filled", "99-handoff"]
COLW = {360: 300, 412: 300, 1366: 560}
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
except OSError:
    font = ImageFont.load_default()
for side in ("before", "after"):
    for vw, cw in COLW.items():
        tiles = []
        for name in ORDER:
            p = f"{SRC}/{side}-{vw}-{name}.png"
            if not os.path.exists(p):
                continue
            im = Image.open(p).convert("RGB")
            h = round(im.height * cw / im.width)
            tiles.append((name, im.resize((cw, h), Image.LANCZOS)))
        per_row = 6
        rows = [tiles[i:i + per_row] for i in range(0, len(tiles), per_row)]
        pad, lab = 16, 34
        row_h = [max(t.height for _, t in r) + lab for r in rows]
        W = per_row * (cw + pad) + pad
        H = sum(row_h) + pad * (len(rows) + 1) + 50
        sheet = Image.new("RGB", (W, H), (24, 24, 28))
        d = ImageDraw.Draw(sheet)
        d.text((pad, 14), f"{side.upper()} · {vw}px · set-up and sign-in (release 11, stream 5)", fill=(240, 240, 240), font=font)
        y = 50 + pad
        for r, rh in zip(rows, row_h):
            x = pad
            for name, t in r:
                d.text((x, y), name, fill=(200, 200, 200), font=font)
                sheet.paste(t, (x, y + lab))
                x += cw + pad
            y += rh + pad
        sheet.save(f"{OUT}/sheet-{side}-{vw}.webp", "WEBP", quality=62, method=6)
        print(side, vw, sheet.size)
