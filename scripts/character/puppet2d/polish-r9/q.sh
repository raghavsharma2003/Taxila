#!/bin/sh
# r8 quick loop: build, render a pose json to work/<tag>   sh q.sh <poses.json> <tag> [extra query]
set -e
cd /home/user/Taxila
node scripts/character/puppet2d/polish-r9/build.mjs >/dev/null 2>&1
P2D_POSEDIR=art/character/puppet2d/polish-r9/work/$2 P2D_Q="capture=1&px=1024&view=0,0,1024$3" node scripts/character/puppet2d/polish-r9/shoot.mjs poses $1 | grep -v "^pose" || true
