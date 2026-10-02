set -a; . /home/user/Taxila/.env.local; set +a
cd /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/g3
node ekey.mjs > ekey.out 2>&1; node ekey2.mjs > ekey2.out 2>&1
for p in "P3 12" "P4 12" "P1c 10" "P5n 10" "P5p 10" "P6 10"; do timeout 1500 node netsim.mjs $p >> runall2.out 2>&1 || echo "FAIL $p" >> runall2.out; done
echo ALLDONE >> runall2.out
