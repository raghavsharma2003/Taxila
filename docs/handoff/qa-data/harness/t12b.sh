#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t6common.sh
export QA_BASE=http://127.0.0.1:8098
run h3 H-BRIT1-3 $SC "वो cotton shirt, British लोग control करते होंगे price and all, क्योंकि वोही तो rule कर रहे थे."
run h4 H-BRIT2 $SC "इंडियन वीवर्स को लॉस हुआ ना। ब्रिटिश मशीन का माल सस्ता था…"
run h6 H-W2b $P "$LM||pata nahi"
echo DONE12B
