import json, os
from PIL import Image, ImageDraw, ImageFont
R='/home/user/Taxila/docs/design/teacher'
E=['warm','encouraging','curious','thinking','listening','concerned','delighted','playful','surprised']
rows=[('baseline (it. 2)',f'{R}/renders/teal',f'{R}/bakeoff/ai-portrait-wrap/renders/emotion-check-baseline-pipeline-teal.json'),
('procedural-v3',f'{R}/bakeoff/procedural-v3/renders/teal',f'{R}/bakeoff/procedural-v3/renders/emotion-check.json'),
('ai-portrait-wrap',f'{R}/bakeoff/ai-portrait-wrap/renders/teal',f'{R}/bakeoff/ai-portrait-wrap/renders/emotion-check.json'),
('stylised-premium',f'{R}/bakeoff/stylised-premium/renders/teal',f'{R}/bakeoff/stylised-premium/renders/emotion-check-main.json')]
# gnm (E-GNM1, 2026-10-03): Google GNM Head v3.0 base; judged by the merged-style emotion-check (judges A + C pooled,
# n = 12 per judge per emotion, encouraging on the 6-frame nod clip), so its cells read correct/24
# two-judge rows (merged-style emotion-check: A = taxila-brain + bake-off prompt, C = same model + held-out prompt,
# n = 12 each): the cell shows A | C correct/12, red if either is below 70%. The merged row is read from the merged
# run's own outputs (that run owns them; scripts/character/bakeoff/merged/compare.py writes the same sheet WITHOUT the
# gnm row, so whichever script ran last decides the sheet)
for nm, a in (('MERGED', 'merged'), ('gnm (GNM Head)', 'gnm')):
  if os.path.exists(f'{R}/bakeoff/{a}/renders/emotion-check.json'):
    rows.append((nm,f'{R}/bakeoff/{a}/renders/teal',f'{R}/bakeoff/{a}/renders/emotion-check.json'))
# gnm round 2 (2026-10-04): GNM Head is the adopted identity base, so the other two designs are built on it too: slate
# (Arjun design) and plum (Uma design), each judged n = 24 per judge per emotion like teal's round-2 row
for lk, nm in (('slate', 'gnm slate (Arjun)'), ('plum', 'gnm plum (Uma)')):
  ck_ = f'{R}/bakeoff/gnm/renders/emotion-check-{lk}.json'
  if os.path.exists(ck_):
    rows.append((nm,f'{R}/bakeoff/gnm/renders/{lk}',ck_))
W,H=240,300; LW=210; TOP=56; HDR=26
extra=[('3/4 turn (yaw090)','turntable/yaw090.png'),('B+ tier','tier_Bplus.png')]
cols=len(E)+len(extra)
img=Image.new('RGB',(LW+cols*W,TOP+HDR+len(rows)*(H+24)),(18,18,22))
d=ImageDraw.Draw(img)
try:
  f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16); fb=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',18)
except Exception: f=fb=ImageFont.load_default()
d.text((10,8),'Teacher bake-off, look teal (Asha design) + gnm slate / plum, H tier, same renderer + stage light. Score = blind 9-way vision judge, correct/6 (bar 70% = 5/6).',fill=(230,230,230),font=f)
d.text((10,30),'baseline score is the same-day re-run (43%); the original iteration-2 run was 37%. MERGED / gnm rows: judges A | C, correct/n each (gnm rows n = 24; red if either < 70%); encouraging judged on its 2 s nod clip.',fill=(160,160,170),font=f)
for i,(n,_) in enumerate([(e,0) for e in E]+extra):
  d.text((LW+i*W+6,TOP),n,fill=(200,200,120),font=fb)
for r,(name,dirp,ck) in enumerate(rows):
  y=TOP+HDR+r*(H+24)
  per=json.load(open(ck))['per']; ov=json.load(open(ck))['overallPct']
  two='A' in per and 'C' in per
  if two: ovs=f"A {ov['A']}%  C {ov['C']}%"; ov=None
  d.text((10,y+10),name,fill=(240,240,240),font=fb); d.text((10,y+36),ovs if two else f'overall {ov}%',fill=(200,200,200),font=f)
  for i,e in enumerate(E):
    im=Image.open(f'{dirp}/emotions/{e}.png').convert('RGB').resize((W,H))
    img.paste(im,(LW+i*W,y))
    if two:
      ca,na,cc,nc=per['A'][e]['correct'],per['A'][e]['n'],per['C'][e]['correct'],per['C'][e]['n']; ok=ca/na>=0.7 and cc/nc>=0.7; lab=f'A {ca}/{na} | C {cc}/{nc}'
    else:
      c,nn=per[e]['correct'],per[e]['n']; ok=c/nn>=0.7; lab=f'{c}/{nn}'
    d.rectangle([LW+i*W,y+H,LW+i*W+W-1,y+H+22],fill=(30,70,40) if ok else (90,30,30))
    d.text((LW+i*W+6,y+H+2),lab+('' if ok else '  FAIL'),fill=(255,255,255),font=f)
  for j,(lab,p) in enumerate(extra):
    im=Image.open(f'{dirp}/{p}').convert('RGB')
    w,h=im.size; s=min(W/w,H/h); im=im.resize((int(w*s),int(h*s)))
    x=LW+(len(E)+j)*W; img.paste(im,(x+(W-im.size[0])//2,y+(H-im.size[1])//2))
img.save(f'{R}/bakeoff/COMPARE.png',optimize=True); print(img.size)
