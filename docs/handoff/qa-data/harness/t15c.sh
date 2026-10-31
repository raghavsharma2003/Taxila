#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13common.sh
FADE='[["35 ones|35 ÷ 7|35 ko 7","5","o"],["7 hundreds|7 ÷ 7|7 ko 7","1","h"],["3 tens|3 ÷ 7|3 ko 7","0","t"]]'
for i in 1 2; do QA_REPEAT=1 QA_NUDGES='["735 ko 7 se divide karna example se samjhao","haan","haan","pata nahi","haan"]' agrun vf$i V-FADE-$i c5-maths-ch09-t01 "$FADE" 12; cls V-FADE-$i | grep -E "CHILD|classify|item=|worked"; done
export QA_BASE=http://127.0.0.1:8099
run vp1 V-PIC-1 $P "sher ki photo dikhao||board par perimeter ka formula likho"; cls V-PIC-1
run vp2 V-PIC-2 $P "sher ki photo dikhao||board par mere ghar ka naksha banao jismein mera kamra ho||theek hai"; cls V-PIC-2
run vp3 V-PIC-3 $P "taj mahal ki photo dikhao||board par ek bahut lamba rocket diagram banao jismein sau parts hon||theek hai"; cls V-PIC-3
echo DONE15C
