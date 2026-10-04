import json, sys, numpy as np
from PIL import Image, ImageDraw
L="art/character/puppet2d/P/layers"; g=json.load(open(f"{L}/geom.json"))
order=["hairback","bun","body","ears","face","scleraL","scleraR","lowerL","lowerR","lidL","lidR","browL","browR","mouth_rest","hair","lockL","lockR"]
cols=np.array([(40,40,40),(255,0,255),(0,200,200),(255,0,0),(255,200,0),(255,255,255),(255,255,255),(0,255,0),(0,255,0),(0,0,255),(0,0,255),(120,60,0),(120,60,0),(255,120,120),(60,60,255),(0,140,0),(0,140,0)])
top=np.full((1024,1024),-1)
for i,n in enumerate(order):
  x0,y0,x1,y1=g["rects"][n]; a=np.asarray(Image.open(f"{L}/{n}.png"))[...,3]>128
  t=top[y0:y1,x0:x1]; t[a]=i
img=np.where(top[...,None]>=0,cols[np.maximum(top,0)],[200,230,200]).astype(np.uint8)
box=tuple(map(int,sys.argv[1].split(',')))
Image.fromarray(img).crop(box).resize(((box[2]-box[0])*2,(box[3]-box[1])*2),Image.NEAREST).save('/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/which.png')
