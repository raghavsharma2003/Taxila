import json, numpy as np
from PIL import Image, ImageDraw
g=json.load(open('art/character/puppet2d/P/layers/geom.json'))
im=Image.open('art/character/puppet2d/P/c-front.png')
S=4
out=[]
for side,bx in (('L',(340,395,490,510)),('R',(570,385,720,500))):
  e=g['eyes'][side]
  c=im.crop(bx).resize(((bx[2]-bx[0])*S,(bx[3]-bx[1])*S))
  d=ImageDraw.Draw(c)
  xa,xb=e['x']
  for i,x in enumerate(range(xa,xb+1)):
    for arr,col in ((e['top'],(0,255,0)),(e['bot'],(255,0,255))):
      y=arr[i]; d.point(((x+0.5-bx[0])*S,(y-bx[1])*S),fill=col)
  cx,cy,r=e['iris']; d.ellipse(((cx-r-bx[0])*S,(cy-r-bx[1])*S,(cx+r-bx[0])*S,(cy+r-bx[1])*S),outline=(0,200,255))
  cx,cy,r=e['catch']; d.ellipse(((cx-r-bx[0])*S,(cy-r-bx[1])*S,(cx+r-bx[0])*S,(cy+r-bx[1])*S),outline=(255,0,0))
  out.append(c)
w=sum(o.size[0] for o in out); h=max(o.size[1] for o in out)
s=Image.new('RGB',(w,h)); x=0
for o in out: s.paste(o,(x,0)); x+=o.size[0]
s.save('/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/eyes_fit.png')
