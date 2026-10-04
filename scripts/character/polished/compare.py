# Builds docs/design/teacher/polished/COMPARE.png: one row per polished candidate (c1-c4) + the current GNM teal
# as a reference row, 6 columns (front neutral, warm, delighted, concerned, viseme aa, 3/4). Same viewer, same stage
# light for every row. Each row is labelled with its source, licence and cost.
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/Taxila/docs/design/teacher'
P = f'{R}/polished'
G = f'{R}/bakeoff/gnm/renders/teal'
rows = [
  ('c1', 'Rocketbox Female_Adult_11', 'MIT (Microsoft) - $0', 'face tex from Female_Adult_10', P + '/c1',
   ['portraits/front_neutral.png', 'emotions/warm.png', 'emotions/delighted.png', 'emotions/concerned.png',
    'visemes/viseme_aa.png', 'portraits/q34_neutral.png']),
  ('c2', 'Rocketbox Business_Female_01', 'MIT (Microsoft) - $0', 'stand-in for ThreeDee ($48-68)', P + '/c2',
   ['portraits/front_face.png', 'emotions/warm.png', 'emotions/delighted.png', 'emotions/concerned.png',
    'visemes/viseme_aa.png', 'portraits/q3_face.png']),
  ('c3', 'VRoid sample (pixiv), toon', 'VRM Public License 1.0 - $0', 'stand-in for Avaturn', P + '/c3',
   ['portraits/front_face.png', 'emotions/warm.png', 'emotions/delighted.png', 'emotions/concerned.png',
    'visemes/viseme_aa.png', 'portraits/q3_face.png']),
  ('c4', 'Rocketbox Female_Adult_07', 'MIT (Microsoft) - $0', 'stand-in for MetaPerson', P + '/c4',
   ['portraits/front_neutral.png', 'emotions/warm.png', 'emotions/delighted.png', 'emotions/concerned.png',
    'visemes/viseme_aa.png', 'portraits/q34_neutral.png']),
  ('REF', 'GNM teal (current, rejected)', 'GNM Head v3 + own textures - $0', 'owner: "scary, cheap"', G,
   ['states/idle.png', 'emotions/warm.png', 'emotions/delighted.png', 'emotions/concerned.png',
    'visemes/viseme_aa.png', 'turntable/yaw090.png']),
]
cols = ['front neutral', 'warm', 'delighted', 'concerned', "viseme 'aa'", '3/4 view']
W, H = 320, 400; LW = 300; TOP = 64; HDR = 30; GAP = 14
img = Image.new('RGB', (LW + len(cols) * W, TOP + HDR + len(rows) * (H + GAP)), (18, 18, 22))
d = ImageDraw.Draw(img)
try:
  f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
  fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
  fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
except Exception:
  f = fb = fs = ImageFont.load_default()
d.text((10, 8), 'Polished-teacher round (2026-10-04): free licence-clean fallbacks built because every scout pick is owner-gated '
       '(MetaHuman login, ThreeDee purchase, Avaturn/MetaPerson sign-up). H tier, our viewer + rig + stage light.',
       fill=(230, 230, 230), font=f)
d.text((10, 34), 'Bottom row = the current GNM teal the owner rejected. REF front = face crop of its idle bust; REF 3/4 cell is the yaw090 profile (no 3/4 render exists). c2/c3 face camera is tighter than c1/c4.',
       fill=(160, 160, 170), font=f)
for i, c in enumerate(cols):
  d.text((LW + i * W + 8, TOP), c, fill=(200, 200, 120), font=fb)
for r, (tag, name, lic, note, base, files) in enumerate(rows):
  y = TOP + HDR + r * (H + GAP)
  d.text((10, y + 8), tag, fill=(240, 240, 240), font=fb)
  yy = y + 42
  for line, col, fo in ((name, (235, 235, 235), f), (lic, (140, 210, 150), f), (note, (170, 170, 180), fs)):
    # wrap at ~28 chars
    words, cur = line.split(), ''
    for w_ in words:
      if len(cur) + len(w_) + 1 > 28:
        d.text((10, yy), cur, fill=col, font=fo); yy += 22; cur = w_
      else:
        cur = (cur + ' ' + w_).strip()
    d.text((10, yy), cur, fill=col, font=fo); yy += 28
  for i, p in enumerate(files):
    im = Image.open(f'{base}/{p}').convert('RGB')
    if tag == 'REF' and p == 'states/idle.png':
      im = im.crop((120, 0, 480, 450))  # idle is a bust shot; crop to the face so it matches the other rows' framing
    w, h = im.size; s = max(W / w, H / h)
    im = im.resize((int(w * s + 0.5), int(h * s + 0.5)), Image.LANCZOS)
    l = (im.size[0] - W) // 2; t = (im.size[1] - H) // 2
    img.paste(im.crop((l, t, l + W, t + H)), (LW + i * W, y))
img.save(f'{P}/COMPARE.png', optimize=True)
print(img.size)
