#!/bin/sh
set -e
cd /home/user/Taxila
node scripts/character/puppet2d/polish-r8/build.mjs >/dev/null
D=art/character/puppet2d/polish-r8/work/iou; P=art/character/puppet2d/polish-r8/work/iou-poses.json; Q="capture=1&px=1024&view=0,0,1024"
P2D_POSEDIR=$D/cream P2D_Q="$Q" node scripts/character/puppet2d/polish-r8/shoot.mjs poses $P >/dev/null &
P2D_POSEDIR=$D/teal P2D_Q="$Q&bg=30,128,128" node scripts/character/puppet2d/polish-r8/shoot.mjs poses $P >/dev/null &
P2D_POSEDIR=$D/cream_face P2D_Q="$Q&only=face" node scripts/character/puppet2d/polish-r8/shoot.mjs poses $P >/dev/null &
P2D_POSEDIR=$D/teal_face P2D_Q="$Q&only=face&bg=30,128,128" node scripts/character/puppet2d/polish-r8/shoot.mjs poses $P >/dev/null &
wait
python3 scripts/character/puppet2d/polish-r8/iou.py
