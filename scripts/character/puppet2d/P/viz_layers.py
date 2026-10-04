import json, sys, numpy as np
from PIL import Image
L="art/character/puppet2d/P/layers"; g=json.load(open(f"{L}/geom.json"))
names=sys.argv[1].split(',')
box=tuple(map(int,sys.argv[2].split(','))) if len(sys.argv)>2 else (0,0,1024,1024)
S=float(sys.argv[3]) if len(sys.argv)>3 else 1
tiles=[]
for n in names:
  base=np.zeros((1024,1024,3),np.float32); base[...]=(255,0,255)
  x0,y0,x1,y1=g["rects"][n]; a=np.asarray(Image.open(f"{L}/{n}.png").convert('RGBA')).astype(np.float32)
  al=a[...,3:]/255; base[y0:y1,x0:x1]=base[y0:y1,x0:x1]*(1-al)+a[...,:3]*al
  t=Image.fromarray(base.astype(np.uint8)).crop(box); t=t.resize((int(t.size[0]*S),int(t.size[1]*S))); tiles.append(t)
w=sum(t.size[0]+4 for t in tiles); o=Image.new('RGB',(w,tiles[0].size[1]),'white'); x=0
for t in tiles: o.paste(t,(x,0)); x+=t.size[0]+4
o.save('/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/layers.png')
