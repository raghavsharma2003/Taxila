S=/tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad
cd /home/user/Taxila
pids=""; for i in 1 2 3 4; do sh -c 'while :; do :; done' & pids="$pids $!"; done
: > $S/g2.res; : > $S/g2.fails
for i in $(seq 1 20); do node --test --test-name-pattern="gate \(browser\): both goldens" tests/forge-g2.test.mjs > $S/g2.last 2>&1; if grep -q '^# fail 0' $S/g2.last; then echo pass >> $S/g2.res; else echo fail >> $S/g2.res; echo "=== run $i" >> $S/g2.fails; sed -n '/^not ok/,/stack/p' $S/g2.last | grep -v "^  *duration\|^  *type" | head -30 >> $S/g2.fails; fi; done
kill $pids
echo "pass=$(grep -c pass $S/g2.res) fail=$(grep -c fail $S/g2.res)"
