import sys
from PIL import Image
a=Image.open(sys.argv[1]).convert('RGB'); b=Image.open(sys.argv[2]).convert('RGB')
boxes=[tuple(map(int,s.split(','))) for s in sys.argv[4:]]
S=int(sys.argv[3])
rows=[]
for bx in boxes:
  w,h=(bx[2]-bx[0])*S,(bx[3]-bx[1])*S
  r=Image.new('RGB',(w*2+6,h),'red'); r.paste(a.crop(bx).resize((w,h)),(0,0)); r.paste(b.crop(bx).resize((w,h)),(w+6,0)); rows.append(r)
W=max(r.size[0] for r in rows); Ht=sum(r.size[1]+6 for r in rows)
o=Image.new('RGB',(W,Ht),'white'); y=0
for r in rows: o.paste(r,(0,y)); y+=r.size[1]+6
o.save('/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/cmp.png')
