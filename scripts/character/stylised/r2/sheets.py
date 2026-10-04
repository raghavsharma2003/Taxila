# Compose the evidence sheets next to the concept (polish r2: every tile is a three.js TaxilaToon render):
#   python sheets.py <render_dir> <out_dir>
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
    img.save(out, quality=86, method=6)
    return img


s = 512
grid([[(C + 'c-front.webp', 'concept c-front'), (f'{R}/front.png', 'r2 front'), (f'{R}/q3L.png', 'r2 3/4'),
       (f'{R}/profile.png', 'r2 profile'), (f'{R}/close.png', 'r2 close-up')],
      [(REF + 'q3-left.webp', 'ref 3/4 (soft guide)'), (f'{R}/q3R.png', 'r2 3/4 other side'), (REF + 'profile-left.webp', 'ref profile'),
       (f'{R}/back.png', 'r2 back'), (f'{R}/eyes.png', 'r2 eyes')]], s, f'{O}/contact-sheet.webp')
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

# owner sheet (TECH-PLAN §8.3): row 1 c-front | render at 128 px (upscaled, nearest) and full size; row 2 the four
# expression pairs; row 3 a turntable strip
s3 = 384
def thumb(p, label):
    im = Image.open(p).convert('RGB').resize((128, 128), Image.LANCZOS).resize((s3, s3), Image.NEAREST)
    d = ImageDraw.Draw(im); d.rectangle((0, s3 - 34, s3, s3), fill=(255, 255, 255)); d.text((10, s3 - 30), label, fill=(30, 30, 30), font=F)
    return im
W = 8 * s3
sheet = Image.new('RGB', (W, 3 * s3), (255, 255, 255))
row1 = [thumb(C + 'c-front.webp', 'concept @128'), thumb(f'{R}/pose_j_neutral.png', 'r2 @128'),
        tile(C + 'c-front.webp', s3, 'concept'), tile(f'{R}/pose_j_neutral.png', s3, 'r2 neutral'),
        thumb(C + 'c-happy.webp', 'concept happy @128'), thumb(f'{R}/pose_j_smile.png', 'r2 smile @128'),
        tile(C + 'c-happy.webp', s3, 'concept happy'), tile(f'{R}/pose_j_smile.png', s3, 'r2 smile')]
row2 = [tile(C + 'c-talking.webp', s3, 'concept talking'), tile(f'{R}/pose_j_aa.png', s3, 'r2 talking (aa)'),
        tile(C + 'c-listening.webp', s3, 'concept listening'), tile(f'{R}/pose_j_listen.png', s3, 'r2 listening'),
        tile(C + 'c-thinking.webp', s3, 'concept thinking'), tile(f'{R}/pose_j_think.png', s3, 'r2 thinking'),
        tile(REF + 'q3-left.webp', s3, 'ref 3/4'), tile(f'{R}/pose_j_q3.png', s3, 'r2 3/4')]
row3 = [tile(f'{R}/tt_{a:03d}.png', s3, f'turntable {a}') for a in (0, 45, 90, 135, 180, 225, 270, 315)]
for y, row in enumerate((row1, row2, row3)):
    for x, im in enumerate(row):
        sheet.paste(im, (x * s3, y * s3))
sheet.save(f'{O}/owner-sheet.webp', quality=86, method=6)
print('owner sheet ok')
