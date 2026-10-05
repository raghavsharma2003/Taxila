#!/bin/sh
# r7: the brow-mask pass for hairgate: the SAME deterministic 48.0 s timeline (r9: +concern B), drawing only the brows over pure green
# (every layer still deforms, so the timeline is identical to the review clip).  sh maskpass.sh <tag> [root]
set -e
cd /home/user/Taxila
ROOT=${2:-art/character/puppet2d/polish-r9}
W=art/character/puppet2d/polish-r9/work/mask-$1
rm -rf $W; mkdir -p $W
S=scripts/character/puppet2d/polish-r9/shoot.mjs
Q="capture=1&px=1024&only=browL,browR&bg=0,255,0"
P2D_ROOT=$ROOT P2D_Q="$Q" node $S frames 0 16 30 $W/a >$W/a.log 2>&1 &
P2D_ROOT=$ROOT P2D_Q="$Q" node $S frames 16 32 30 $W/b >$W/b.log 2>&1 &
P2D_ROOT=$ROOT P2D_Q="$Q" node $S frames 32 48 30 $W/c >$W/c.log 2>&1 &
wait
mkdir -p $W/all; i=0
for d in a b c; do for f in $(ls $W/$d/f*.png | sort); do ln -sf $(realpath $f) $W/all/$(printf "f%05d.png" $i); i=$((i+1)); done; done
ffmpeg -y -loglevel error -framerate 30 -i $W/all/f%05d.png -c:v libx264 -pix_fmt yuv444p -crf 4 -preset fast $W/mask.mp4
rm -rf $W/a $W/b $W/c $W/all
echo "$W/mask.mp4 frames=$i"
