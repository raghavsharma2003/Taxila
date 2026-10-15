#!/bin/sh
# One blind round: lamp2 (the given capture tag) and the r8 calibration in the SAME run, n = 3 gpt-5.6-sol + 2 Kimi K2.6
# each, lamp1's judge-live.mjs (prompt verbatim). Usage: judge-round.sh <round> <lamp2 sheet prefix> [r8 sheet prefix]
#   NODE_USE_ENV_PROXY=1 sh judge-round.sh J2 j2
R=$1; P=$2; R8=${3:-r8}
S=${L2_SCRATCH:-/tmp/claude-0/-home-user-Taxila/4f5bd6cc-5f93-53a8-934d-4a29dc9ad564/scratchpad/l2}/judge
E=/home/user/Taxila/docs/design/round4/asha/rig2/evidence
J=/home/user/Taxila/scripts/character/puppet2d/lamp1/judge-live.mjs
node $J $E/judge-$R-brain.json taxila-brain 3 $S/ref-lamp2.png $S/$P-moments.png $S/$P-seq.png &
node $J $E/judge-$R-kimi.json taxila-kimi26 2 $S/ref-lamp2.png $S/$P-moments.png $S/$P-seq.png &
node $J $E/judge-${R}r8-brain.json taxila-brain 3 $S/ref-r8.png $S/$R8-moments.png $S/$R8-seq.png &
node $J $E/judge-${R}r8-kimi.json taxila-kimi26 2 $S/ref-r8.png $S/$R8-moments.png $S/$R8-seq.png &
wait
python3 -I /home/user/Taxila/scripts/character/puppet2d/lamp2/tally.py $E $R ${R}r8
