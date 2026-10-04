import sys, glob
from PIL import Image, ImageDraw
d=sys.argv[1]; box=tuple(map(int,sys.argv[2].split(','))); step=int(sys.argv[3]); n=int(sys.argv[4]); cols=int(sys.argv[5]) if len(sys.argv)>5 else 8
fs=sorted(glob.glob(d+'/f*.png'))[::step][:n]
w,h=box[2]-box[0],box[3]-box[1]
rows=(len(fs)+cols-1)//cols
o=Image.new('RGB',(cols*w,rows*h),'white')
for i,f in enumerate(fs):
  o.paste(Image.open(f).convert('RGB').crop(box),((i%cols)*w,(i//cols)*h))
o.save(sys.argv[6] if len(sys.argv)>6 else '/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/strip.png')
