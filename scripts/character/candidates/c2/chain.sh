#!/bin/bash
# c2: one command, source -> shipped tiers.   bash scripts/character/candidates/c2/chain.sh [--solve-g9]
set -e
cd /home/user/Taxila
PY=/tmp/claude-0/char/bpyenv/bin/python
B=/tmp/claude-0/char/c2/build
OUT=public/assets/teacher-candidates/c2
$PY scripts/character/candidates/c2/build_c2.py --out $B 2>&1 | grep '^{'
$PY scripts/character/candidates/c2/texture_c2.py --look art/character/candidates/c2/look.json --build $B
node scripts/character/candidates/c2/finish.mjs $B c2 $OUT 2>&1 | grep finish
if [ "$1" = "--solve-g9" ]; then
  node scripts/character/candidates/c2/g9.mjs --solve --looks c2
  $PY scripts/character/candidates/c2/texture_c2.py --look art/character/candidates/c2/look.json --build $B
  node scripts/character/candidates/c2/finish.mjs $B c2 $OUT 2>&1 | grep finish
fi
cp $B/finish.json $B/*.stats.json $B/build.json $B/texture.json art/character/candidates/c2/ 2>/dev/null || true
echo CHAIN_OK
