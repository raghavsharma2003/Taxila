import json, sys
from PIL import Image, ImageDraw
F = json.load(open('scripts/character/puppet2d/V/features.json'))
im = Image.open('art/character/puppet2d/V/work/cfront.png').convert('RGB')
def crop(box, s, name, draw):
    x0, y0, x1, y1 = box
    c = im.crop(box).resize(((x1-x0)*s, (y1-y0)*s), Image.LANCZOS)
    d = ImageDraw.Draw(c)
    T = lambda p: ((p[0]-x0)*s, (p[1]-y0)*s)
    draw(d, T, s)
    c.save(name)
def eyes(d, T, s):
    for k, e in F['eyes'].items():
        for key, col in (('up', (0,255,0)), ('lo', (0,0,255)), ('lashTop', (255,0,255))):
            pts = ([e['inner']] if key != 'lashTop' else []) + e[key] + ([e['outer']] if key != 'lashTop' else [])
            d.line([T(p) for p in pts], fill=col, width=2)
        d.line([T(p) for p in e['flick']], fill=(255,255,0), width=2)
        cx, cy, r = e['iris']
        d.ellipse([T((cx-r, cy-r)), T((cx+r, cy+r))], outline=(255,0,0), width=2)
        pr = e['pupil']; d.ellipse([T((cx+pr[0]-pr[2], cy+pr[1]-pr[2])), T((cx+pr[0]+pr[2], cy+pr[1]+pr[2]))], outline=(0,255,255), width=2)
        k_ = e['catch']; d.ellipse([T((cx+k_[0]-k_[2], cy+k_[1]-k_[2])), T((cx+k_[0]+k_[2], cy+k_[1]+k_[2]))], outline=(255,128,0), width=2)
crop((345, 395, 480, 505), 6, 'art/character/puppet2d/V/work/ov_eyeL.png', eyes)
crop((575, 385, 715, 495), 6, 'art/character/puppet2d/V/work/ov_eyeR.png', eyes)
