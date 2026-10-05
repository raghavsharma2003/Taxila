#!/bin/sh
# r4: rebuild + shoot the articulation gate + strip.  sh gaterun.sh <tag>
set -e
cd /home/user/Taxila
node scripts/character/puppet2d/polish-r6/build.mjs >/dev/null
D=art/character/puppet2d/polish-r6/work/gate-$1
rm -rf $D
node scripts/character/puppet2d/polish-r6/shoot.mjs gate 30 $D
python3 scripts/character/puppet2d/polish-r6/gatestrip.py $D art/character/puppet2d/polish-r6/work/gatestrip-$1.png 1.2
