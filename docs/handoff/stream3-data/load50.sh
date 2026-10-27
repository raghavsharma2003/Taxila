S=/tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad
cd /home/user/Taxila
pids=""; for i in 1 2 3 4; do sh -c 'while :; do :; done' & pids="$pids $!"; done
: > $S/load50.res
for i in $(seq 1 50); do node --test $S/idx.mjs > $S/load50.last 2>&1; if grep -q '^# fail 0' $S/load50.last; then echo pass >> $S/load50.res; else echo fail >> $S/load50.res; grep '^not ok' $S/load50.last >> $S/load50.fails; fi; done
kill $pids
echo "pass=$(grep -c pass $S/load50.res) fail=$(grep -c fail $S/load50.res)"
