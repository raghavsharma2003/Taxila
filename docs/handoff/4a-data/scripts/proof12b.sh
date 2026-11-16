#!/bin/sh
S=/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad
B=$S/base; T=$S/p12b
cd $B && node evals/safety-robust/fingerprint.mjs --out $S/fpB061.json 2>&1 | tail -1
cd $T && node evals/safety-robust/fingerprint.mjs --out $S/fp12b.json 2>&1 | tail -1
cd $T && node evals/safety-robust/fingerprint.mjs --diff $S/fpB061.json $S/fp12b.json 2>&1 | head -6
cd $B && node evals/safety-robust/run.mjs --quiet > $S/srB061.txt 2>&1; git -C $B checkout -q -- evals/safety-robust/results 2>/dev/null
cd $T && node evals/safety-robust/run.mjs --quiet > $S/sr12b.txt 2>&1; git -C $T checkout -q -- evals/safety-robust/results 2>/dev/null
diff <(tail -n +2 $S/srB061.txt) <(tail -n +2 $S/sr12b.txt) > /dev/null && echo "safety-robust identical" || diff <(tail -n +2 $S/srB061.txt) <(tail -n +2 $S/sr12b.txt)
node $S/kithits.mjs $B/server/director/safety.js $S/hits-B061.txt; node $S/kithits.mjs $T/server/director/safety.js $S/hits-12b.txt; diff <(sort $S/hits-B061.txt) <(sort $S/hits-12b.txt) && echo "kit hits identical"
cd $T && node --input-type=module -e 'const a=(await import("'$T'/server/safety/lexicon.js")).__lexicon.VOCAB, b=(await import("'$B'/server/safety/lexicon.js")).__lexicon.VOCAB; console.log("VOCAB", b.size, "->", a.size, "new:", [...a].filter(w=>!b.has(w)).join(" "))'
cd $T && node --test tests/safety*.test.mjs tests/relational-policy.test.mjs tests/round2-safety-floor.test.mjs tests/lesson-safety.test.mjs tests/r4-conversation-no-request-safeguard.test.mjs docs/design/round3/adversarial/r4-scan-*.test.mjs 2>&1 | grep -E "^# (pass|fail)|^not ok"
cd $T && node --test docs/design/round3/adversarial/r3-adversarial.test.mjs 2>&1 | grep -E "^# (pass|fail)|^    not ok"
cd $T && node --test docs/design/round2/adversarial/r2-adversarial.test.mjs 2>&1 | grep -E "^# (pass|fail)"
cd $T && node evals/persona-invariants.mjs 2>&1 | tail -1
cd $T && node $S/armdiff2.mjs $B $T /home/user/Taxila 2>&1 | cut -c1-400
echo PROOF-DONE
