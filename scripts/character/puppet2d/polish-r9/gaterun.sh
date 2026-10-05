#!/bin/sh
# r4: rebuild + shoot the articulation gate + strip.  sh gaterun.sh <tag>
set -e
cd /home/user/Taxila
node scripts/character/puppet2d/polish-r9/build.mjs >/dev/null
D=art/character/puppet2d/polish-r9/work/gate-$1
rm -rf $D
node scripts/character/puppet2d/polish-r9/shoot.mjs gate 30 $D
python3 scripts/character/puppet2d/polish-r9/gatestrip.py $D art/character/puppet2d/polish-r9/work/gatestrip-$1.png 1.2
