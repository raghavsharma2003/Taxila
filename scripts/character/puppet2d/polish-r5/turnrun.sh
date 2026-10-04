#!/bin/sh
# r4: rebuild + shoot the turn poses + montage.  sh turnrun.sh <tag>
set -e
cd /home/user/Taxila
W=art/character/puppet2d/polish-r5/work
node scripts/character/puppet2d/polish-r5/build.mjs >/dev/null
P2D_POSEDIR=$W/tposes-$1 node scripts/character/puppet2d/polish-r5/shoot.mjs poses $W/turn-poses.json >/dev/null
python3 - "$1" <<'PY'
import sys
from PIL import Image
W="art/character/puppet2d/polish-r5/work"; t=sys.argv[1]
names='yL20np,yL20,yL10,y0,yR10,yR20,yR20np,yR20talk,yL14talk'.split(',')
M=Image.new('RGB',(440*5,540*2),'white')
for i,n in enumerate(names): M.paste(Image.open(f'{W}/tposes-{t}/{n}.png').convert('RGB').crop((140,100,580,640)),((i%5)*440,(i//5)*540))
M.save(f'{W}/turnsheet-{t}.png')
PY
