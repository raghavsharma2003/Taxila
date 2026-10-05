#!/bin/sh
# Full-size artefact battery: render the pose matrix at 1024 over cream and teal, then analyse (battery.py).
set -e
cd /home/user/Taxila
node scripts/character/puppet2d/polish-r10/build.mjs >/dev/null
python3 scripts/character/puppet2d/polish-r10/battery-poses.py >/dev/null
D=art/character/puppet2d/polish-r10/work/battery
P2D_POSEDIR=$D/cream P2D_Q="capture=1&px=1024&view=0,0,1024" node scripts/character/puppet2d/polish-r10/shoot.mjs poses art/character/puppet2d/polish-r10/work/battery-poses.json >/dev/null &
P2D_POSEDIR=$D/teal P2D_Q="capture=1&px=1024&view=0,0,1024&bg=30,128,128" node scripts/character/puppet2d/polish-r10/shoot.mjs poses art/character/puppet2d/polish-r10/work/battery-poses.json >/dev/null &
wait
python3 scripts/character/puppet2d/polish-r10/battery.py
