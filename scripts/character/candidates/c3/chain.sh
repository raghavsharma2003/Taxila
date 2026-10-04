#!/bin/bash
# c3: one command, source -> shipped tiers.   bash scripts/character/candidates/c3/chain.sh
set -e
cd /home/user/Taxila
PY=/tmp/claude-0/char/bpyenv/bin/python
B=/tmp/claude-0/char/c3/build
OUT=public/assets/teacher-candidates/c3
$PY scripts/character/candidates/c3/build_c3.py --out $B 2>&1 | grep '^{'
python3 scripts/character/candidates/c3/texture_c3.py --look art/character/candidates/c3/look.json --build $B
node scripts/character/candidates/c3/finish_c3.mjs $B c3 $OUT 2>&1 | grep finish
cp $B/finish.json $B/*.stats.json $B/build.json $B/texture.json $B/atlas.json art/character/candidates/c3/ 2>/dev/null || true
echo CHAIN_OK
