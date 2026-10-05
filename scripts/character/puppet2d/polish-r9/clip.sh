#!/bin/sh
# r5/r6 review clip: the deterministic 45.2 s timeline at 30 fps, 1024 px, three segments rendered in parallel, voice at 5.0 s.
#   sh clip.sh <tag> [px=1024]
set -e
cd /home/user/Taxila
W=art/character/puppet2d/polish-r9/work/clip-$1
PX=${2:-1024}
rm -rf $W; mkdir -p $W
S=scripts/character/puppet2d/polish-r9/shoot.mjs
P2D_Q="capture=1&px=$PX" node $S frames 0 15 30 $W/a >$W/a.log 2>&1 &
P2D_Q="capture=1&px=$PX" node $S frames 15 30 30 $W/b >$W/b.log 2>&1 &
P2D_Q="capture=1&px=$PX" node $S frames 30 45.2 30 $W/c >$W/c.log 2>&1 &
wait
mkdir -p $W/all; i=0
for d in a b c; do for f in $(ls $W/$d/f*.png | sort); do ln -sf $(realpath $f) $W/all/$(printf "f%05d.png" $i); i=$((i+1)); done; done
ffmpeg -y -loglevel error -framerate 30 -i $W/all/f%05d.png -i art/character/puppet2d/polish-r9/audio/voice.mp3 \
  -filter_complex "[1:a]adelay=5000|5000,apad[a]" -map 0:v -map "[a]" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 128k -t 45.2 $W/clip.mp4
echo "$W/clip.mp4 frames=$i"
