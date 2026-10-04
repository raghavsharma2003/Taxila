import sys
from PIL import Image, ImageDraw, ImageFont
src,x0,y0,x1,y1,s,out=sys.argv[1],*map(int,sys.argv[2:7]),sys.argv[7]
step=int(sys.argv[8]) if len(sys.argv)>8 else 10
im=Image.open(src).convert('RGB').crop((x0,y0,x1,y1)).resize(((x1-x0)*s,(y1-y0)*s),Image.LANCZOS)
d=ImageDraw.Draw(im)
for x in range((x0//step+1)*step,x1,step):
  c=(0,255,255) if x%(step*5)==0 else (120,200,255)
  d.line([((x-x0)*s,0),((x-x0)*s,im.height)],fill=c,width=1)
  if x%(step*5)==0: d.text(((x-x0)*s+2,2),str(x),fill=(0,0,255))
for y in range((y0//step+1)*step,y1,step):
  c=(255,0,255) if y%(step*5)==0 else (255,170,220)
  d.line([(0,(y-y0)*s),(im.width,(y-y0)*s)],fill=c,width=1)
  if y%(step*5)==0: d.text((2,(y-y0)*s+2),str(y),fill=(255,0,0))
im.save(out)
