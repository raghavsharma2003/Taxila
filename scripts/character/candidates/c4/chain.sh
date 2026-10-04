#!/bin/bash
# c4 chain: [build] -> tex -> finish.   bash scripts/character/candidates/c4/chain.sh [build]
# Source: Microsoft Rocketbox Female_Adult_07 (MIT). Inputs fetched to $C4_SRC (sha256 in art/character/LICENSES.md).
set -e
cd /home/user/Taxila
SRC=${C4_SRC:-/tmp/claude-0/char/c4/src}
B=${C4_BUILD:-/tmp/claude-0/char/c4/build}
PY=${BPY:-/tmp/claude-0/char/bpyenv/bin/python}
[ "$1" = "build" ] && $PY scripts/character/candidates/c4/build.py --fbx $SRC/Female_Adult_07_facial.fbx --tex $SRC --out $B 2>&1 | grep -E "CLS|missing|Error|error" || true
python3 scripts/character/candidates/c4/tex.py --tex $SRC --build $B --look art/character/candidates/c4/looks/c4.json
CHAR_TOOLS=/tmp/claude-0/char/tools node scripts/character/candidates/c4/finish.mjs $B c4 public/assets/teacher-candidates/c4 2>&1 | grep "\[finish"
cp $B/finish.json $B/*.stats.json art/character/candidates/c4/reports/ 2>/dev/null || true
echo CHAIN_OK
