"""COMPARE.png with the merged row (fork of scripts/character/bakeoff/verdict/compare.py; the four bake-off rows are
unchanged, from their own renders and their own judge files). The merged row's scores are the merged emotion check
(two judges, n = 12 each): the cell shows judge A / judge B correct out of 12, red if EITHER is below 70%; encouraging is
judged on its 2 s nod clip (the cell shows the clip's middle frame). Same renderer, same stage light, teal only.
    python3 scripts/character/bakeoff/merged/compare.py"""
import json
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/Taxila/docs/design/teacher'
E = ['warm', 'encouraging', 'curious', 'thinking', 'listening', 'concerned', 'delighted', 'playful', 'surprised']
rows = [('baseline (it. 2)', f'{R}/renders/teal', f'{R}/bakeoff/ai-portrait-wrap/renders/emotion-check-baseline-pipeline-teal.json', None),
        ('procedural-v3', f'{R}/bakeoff/procedural-v3/renders/teal', f'{R}/bakeoff/procedural-v3/renders/emotion-check.json', None),
        ('ai-portrait-wrap', f'{R}/bakeoff/ai-portrait-wrap/renders/teal', f'{R}/bakeoff/ai-portrait-wrap/renders/emotion-check.json', None),
        ('stylised-premium', f'{R}/bakeoff/stylised-premium/renders/teal', f'{R}/bakeoff/stylised-premium/renders/emotion-check-main.json', None),
        ('MERGED', f'{R}/bakeoff/merged/renders/teal', f'{R}/bakeoff/merged/renders/emotion-check.json', 'merged')]
W, H = 240, 300; LW = 210; TOP = 56; HDR = 26
extra = [('3/4 turn (yaw090)', 'turntable/yaw090.png'), ('B+ tier', 'tier_Bplus.png')]
cols = len(E) + len(extra)
img = Image.new('RGB', (LW + cols * W, TOP + HDR + len(rows) * (H + 24)), (18, 18, 22))
d = ImageDraw.Draw(img)
try:
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16); fb = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception:
    f = fb = ImageFont.load_default()
d.text((10, 8), 'Teacher bake-off, look teal, H tier, same renderer + stage light. Rows 1-4: blind 9-way vision judge, correct/6 (bar 70%).', fill=(230, 230, 230), font=f)
d.text((10, 30), 'MERGED row: judge A (taxila-brain, bake-off prompt) / judge B (taxila-fast, held-out prompt), correct/12 each; red if either < 70%; encouraging on its 2 s nod clip.', fill=(160, 160, 170), font=f)
for i, n in enumerate(E + [x[0] for x in extra]):
    d.text((LW + i * W + 6, TOP), n, fill=(200, 200, 120), font=fb)
for r, (name, dirp, ck, kind) in enumerate(rows):
    y = TOP + HDR + r * (H + 24)
    J = json.load(open(ck))
    d.text((10, y + 10), name, fill=(240, 240, 240), font=fb)
    if kind == 'merged':
        ov = J['overallPct']
        d.text((10, y + 36), f"A {ov.get('A')}%  B {ov.get('B')}%", fill=(200, 200, 200), font=f)
        d.text((10, y + 58), f"pooled {ov.get('pooled')}%", fill=(200, 200, 200), font=f)
    else:
        d.text((10, y + 36), f"overall {J['overallPct']}%", fill=(200, 200, 200), font=f)
    for i, e in enumerate(E):
        p = f'{dirp}/emotions/{e}.png'
        if kind == 'merged' and e == 'encouraging':
            strip = Image.open(f'{dirp}/emotions/{e}_clip.png').convert('RGB')
            fw = strip.size[0] // 6
            im = strip.crop((3 * fw, 0, 4 * fw, strip.size[1])).resize((W, H))
        else:
            im = Image.open(p).convert('RGB').resize((W, H))
        img.paste(im, (LW + i * W, y))
        if kind == 'merged':
            a_, b_ = J['per']['A'][e], J['per']['B'][e]
            ok = a_['pct'] >= 70 and b_['pct'] >= 70
            lab = f"{a_['correct']}/{a_['n']} | {b_['correct']}/{b_['n']}" + (' clip' if e == 'encouraging' else '') + ('' if ok else ' FAIL')
        else:
            c, nn = J['per'][e]['correct'], J['per'][e]['n']; ok = c / nn >= 0.7
            lab = f'{c}/{nn}' + ('' if ok else '  FAIL')
        d.rectangle([LW + i * W, y + H, LW + i * W + W - 1, y + H + 22], fill=(30, 70, 40) if ok else (90, 30, 30))
        d.text((LW + i * W + 6, y + H + 2), lab, fill=(255, 255, 255), font=f)
    for j, (lab, p) in enumerate(extra):
        im = Image.open(f'{dirp}/{p}').convert('RGB')
        w, h = im.size; s = min(W / w, H / h); im = im.resize((int(w * s), int(h * s)))
        x = LW + (len(E) + j) * W; img.paste(im, (x + (W - im.size[0]) // 2, y + (H - im.size[1]) // 2))
img.save(f'{R}/bakeoff/COMPARE.png', optimize=True); print(img.size)
