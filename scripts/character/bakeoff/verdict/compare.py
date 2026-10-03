import json, os
from PIL import Image, ImageDraw, ImageFont
R='/home/user/Taxila/docs/design/teacher'
E=['warm','encouraging','curious','thinking','listening','concerned','delighted','playful','surprised']
rows=[('baseline (it. 2)',f'{R}/renders/teal',f'{R}/bakeoff/ai-portrait-wrap/renders/emotion-check-baseline-pipeline-teal.json'),
('procedural-v3',f'{R}/bakeoff/procedural-v3/renders/teal',f'{R}/bakeoff/procedural-v3/renders/emotion-check.json'),
('ai-portrait-wrap',f'{R}/bakeoff/ai-portrait-wrap/renders/teal',f'{R}/bakeoff/ai-portrait-wrap/renders/emotion-check.json'),
('stylised-premium',f'{R}/bakeoff/stylised-premium/renders/teal',f'{R}/bakeoff/stylised-premium/renders/emotion-check-main.json')]
W,H=240,300; LW=210; TOP=56; HDR=26
extra=[('3/4 turn (yaw090)','turntable/yaw090.png'),('B+ tier','tier_Bplus.png')]
cols=len(E)+len(extra)
img=Image.new('RGB',(LW+cols*W,TOP+HDR+len(rows)*(H+24)),(18,18,22))
d=ImageDraw.Draw(img)
try:
  f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16); fb=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',18)
except Exception: f=fb=ImageFont.load_default()
d.text((10,8),'Teacher bake-off, look teal (Asha design), H tier, same renderer + stage light. Score = blind 9-way vision judge, correct/6 (bar 70% = 5/6).',fill=(230,230,230),font=f)
d.text((10,30),'baseline score is the same-day re-run (43%); the original iteration-2 run was 37%.',fill=(160,160,170),font=f)
for i,(n,_) in enumerate([(e,0) for e in E]+extra):
  d.text((LW+i*W+6,TOP),n,fill=(200,200,120),font=fb)
for r,(name,dirp,ck) in enumerate(rows):
  y=TOP+HDR+r*(H+24)
  per=json.load(open(ck))['per']; ov=json.load(open(ck))['overallPct']
  d.text((10,y+10),name,fill=(240,240,240),font=fb); d.text((10,y+36),f'overall {ov}%',fill=(200,200,200),font=f)
  for i,e in enumerate(E):
    im=Image.open(f'{dirp}/emotions/{e}.png').convert('RGB').resize((W,H))
    img.paste(im,(LW+i*W,y))
    c,nn=per[e]['correct'],per[e]['n']; ok=c/nn>=0.7
    d.rectangle([LW+i*W,y+H,LW+i*W+W-1,y+H+22],fill=(30,70,40) if ok else (90,30,30))
    d.text((LW+i*W+6,y+H+2),f'{c}/{nn}'+('' if ok else '  FAIL'),fill=(255,255,255),font=f)
  for j,(lab,p) in enumerate(extra):
    im=Image.open(f'{dirp}/{p}').convert('RGB')
    w,h=im.size; s=min(W/w,H/h); im=im.resize((int(w*s),int(h*s)))
    x=LW+(len(E)+j)*W; img.paste(im,(x+(W-im.size[0])//2,y+(H-im.size[1])//2))
img.save(f'{R}/bakeoff/COMPARE.png',optimize=True); print(img.size)
