#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13common.sh
run x1 T-OTHER-1 $P "mujhe koi aur topic padhna hai"; cls T-OTHER-1 | grep TURN
run x2 T-OTHER-2 $P "mujhe koi aur topic padhna hai||mujhe koi aur topic padhna hai"; cls T-OTHER-2 | grep TURN
run x3c5 T-GEO-C5 "" "geometry padhao"; cls T-GEO-C5 | grep TURN
run x4 T-WE-1 $P "samajh nahi aaya, ek example se samjhao||pata nahi||pata nahi"; cls T-WE-1 | grep TURN
run x5 T-WE-2 $P "samajh nahi aaya, ek example se samjhao||pata nahi||pata nahi"; cls T-WE-2 | grep TURN
run x6 T-CH1 $P "chapter 1 se shuru karo"; cls T-CH1 | grep TURN
run x7 T-BOLA $P "maine bola picture dikhao||maine bola na picture dikhao"; cls T-BOLA | grep -E "TURN|BOARD page|slot"
run x8 T-TRI-1 $P "triangle ki picture dikhao||board par rocket engine ka diagram banao||theek hai"; cls T-TRI-1 | grep -E "TURN|BOARD page|slot|board_"
run x9 T-TRI-2 $P "triangle ki picture dikhao||board par rocket engine ka diagram banao||theek hai"; cls T-TRI-2 | grep -E "TURN|BOARD page|slot|board_"
run x10 T-OFFER-1 $P "pehle theory batao||haan"; cls T-OFFER-1 | grep -E "TURN|classify"
run x11 T-OFFER-2 $P "kisi aur tareeke se samjhao||haan"; cls T-OFFER-2 | grep -E "TURN|classify"
echo DONE16B
