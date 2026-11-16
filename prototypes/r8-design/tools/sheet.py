import sys
from PIL import Image
out=sys.argv[1]; names=sys.argv[2:]
ims=[Image.open(n) for n in names]
sc=2 if ims[0].width>=700 else 1
ims=[i.resize((i.width//sc,i.height//sc)) for i in ims]
w=sum(i.width+10 for i in ims); h=max(i.height for i in ims)
c=Image.new('RGB',(w,h),'white'); x=0
for i in ims: c.paste(i,(x,0)); x+=i.width+10
c.save(out)
