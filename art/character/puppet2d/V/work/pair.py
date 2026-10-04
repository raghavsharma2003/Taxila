import sys
from PIL import Image
a=Image.open(sys.argv[1]).convert('RGB'); b=Image.open('/home/user/Taxila/art/character/puppet2d/V/work/cfront.png')
x0,y0,x1,y1,s=map(int,sys.argv[2:7]); out=sys.argv[7]
w,h=x1-x0,y1-y0
im=Image.new('RGB',(w*s*2+10,h*s),'white')
im.paste(b.crop((x0,y0,x1,y1)).resize((w*s,h*s),Image.LANCZOS),(0,0)); im.paste(a.crop((x0,y0,x1,y1)).resize((w*s,h*s),Image.LANCZOS),(w*s+10,0)); im.save(out)
