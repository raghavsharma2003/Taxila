# Compose the evidence sheets next to the concept: python sheets.py <render_dir> <out_dir>
import sys, os
from PIL import Image, ImageDraw, ImageFont
R, O = sys.argv[1], sys.argv[2]
os.makedirs(O, exist_ok=True)
C = '/home/user/Taxila/docs/design/teacher/stylised/concepts/'
REF = '/home/user/Taxila/docs/design/teacher/stylised/build/refs/'
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
except Exception:
    F = ImageFont.load_default()


def tile(path, s, label):
    im = Image.open(path).convert('RGB').resize((s, s), Image.LANCZOS)
    d = ImageDraw.Draw(im); d.rectangle((0, s - 34, s, s), fill=(255, 255, 255)); d.text((10, s - 30), label, fill=(30, 30, 30), font=F)
    return im


def grid(rows, s, out):
    W = max(len(r) for r in rows) * s
    img = Image.new('RGB', (W, len(rows) * s), (255, 255, 255))
    for y, r in enumerate(rows):
        for x, (p, l) in enumerate(r):
            img.paste(tile(p, s, l), (x * s, y * s))
    img.save(out, quality=88)
    return img


s = 512
grid([[(C + 'c-front.webp', 'concept c-front'), (f'{R}/front.png', 'Arm A front'), (f'{R}/q3L.png', 'Arm A 3/4'),
       (f'{R}/profile.png', 'Arm A profile'), (f'{R}/close.png', 'Arm A close-up')],
      [(REF + 'q3-left.webp', 'ref 3/4 (soft guide)'), (f'{R}/q3R.png', 'Arm A 3/4 other side'), (REF + 'profile-left.webp', 'ref profile'),
       (f'{R}/back.png', 'Arm A back'), (f'{R}/eyes.png', 'Arm A eyes')]], s, f'{O}/contact-sheet.webp')
ex = ['neutral', 'talking', 'listening', 'thinking', 'happy', 'surprised', 'concerned', 'blink']
vis = ['viseme_PP', 'viseme_FF', 'viseme_TH', 'viseme_DD', 'viseme_kk', 'viseme_CH', 'viseme_SS', 'viseme_nn', 'viseme_RR', 'viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U']
s2 = 384
rows = [[(C + 'c-front.webp', 'concept')] + [(f'{R}/pose_{e}.png', e) for e in ex[:4]],
        [(C + 'c-happy.webp', 'concept happy')] + [(f'{R}/pose_{e}.png', e) for e in ex[4:]],
        [(f'{R}/pose_{v}.png', v.replace('viseme_', 'vis ')) for v in vis[:7]],
        [(f'{R}/pose_{v}.png', v.replace('viseme_', 'vis ')) for v in vis[7:]]]
grid(rows, s2, f'{O}/expressions-sheet.webp')
# thumbnail check: concept and render at 96 px
th = Image.new('RGB', (96 * 2 + 8, 96), (255, 255, 255))
th.paste(Image.open(C + 'c-front.webp').convert('RGB').resize((96, 96), Image.LANCZOS), (0, 0))
th.paste(Image.open(f'{R}/front.png').convert('RGB').resize((96, 96), Image.LANCZOS), (104, 0))
th.resize((400, 192), Image.NEAREST).save(f'{O}/thumb-compare.webp', quality=90)
print('ok')
