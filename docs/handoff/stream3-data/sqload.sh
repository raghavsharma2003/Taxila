S=/tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad
cd /home/user/Taxila
printf 'await import("/home/user/Taxila/tests/p2-face-player.test.mjs");\nawait import("/home/user/Taxila/tests/studio-qa.test.mjs");\nawait import("/home/user/Taxila/tests/voice-player-clock.test.mjs");\nawait import("%s/probe.mjs");\n' $S > $S/sqfixed2.mjs
pids=""; for i in 1 2 3 4; do sh -c 'while :; do :; done' & pids="$pids $!"; done
: > $S/sq.res
for i in $(seq 1 20); do timeout 600 node --test --test-name-pattern="player|gate \(browser\): goldens pass at|probe" $S/sqfixed2.mjs > $S/sq.last 2>&1; if grep -q '^# fail 0' $S/sq.last && ! grep -q '^not ok' $S/sq.last; then echo pass >> $S/sq.res; else echo fail >> $S/sq.res; grep '^not ok' $S/sq.last >> $S/sq.fails; fi; done
kill $pids
echo "pass=$(grep -c pass $S/sq.res) fail=$(grep -c fail $S/sq.res)"
