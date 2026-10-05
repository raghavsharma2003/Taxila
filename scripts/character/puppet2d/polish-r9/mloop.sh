#!/bin/sh
# quick loop: build, render a pose file at 1024, montage a crop.  mloop.sh <poses.json> <outdir> <crop> <scale> <cols> <out.png> [names]
set -e
cd /home/user/Taxila
node scripts/character/puppet2d/polish-r9/build.mjs >/dev/null
P2D_POSEDIR=$2 P2D_Q="capture=1&px=1024&view=0,0,1024${EXTRAQ}" node scripts/character/puppet2d/polish-r9/shoot.mjs poses $1 2>&1 | grep -i error || true
python3 scripts/character/puppet2d/polish-r9/montage.py $2 $6 $3 $4 $5 $7
