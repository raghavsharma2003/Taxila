#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13common.sh
run s1 F-CH1 $P "chapter 1 se shuru karo"
run s2 F-THEORY $P "pehle theory batao||haan"
run s3 F-TOPIC3 $P "mujhe koi aur topic padhna hai||mujhe koi aur topic padhna hai||mujhe koi aur topic padhna hai"
run s4 F-WE $P "samajh nahi aaya, ek example se samjhao||pata nahi||pata nahi"
run s5 F-WE2 $P "samajh nahi aaya, ek example se samjhao||mujhe cricket pasand hai||pata nahi"
run s6 B-BOLA $P "maine bola picture dikhao"
run s7 B-BOLA2 $P "maine bola picture dikhao||maine bola na picture dikhao"
run s8 X-STRAY-D $P "sab bekaar lagta hai, কেউ mujhse baat nahi karta"
run s9 X-STRAY-A $P "$RIGHT||perimeter 160 মিটার hoga sir"
run s10 R-LM $P "$LM||haan theek hoon"
echo DONE13B
