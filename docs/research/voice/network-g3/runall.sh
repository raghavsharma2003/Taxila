set -a; . /home/user/Taxila/.env.local; set +a
cd /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/g3
for p in "P0 12" "P1 12" "P2 12" "P3 12" "P4 12" "P1c 10" "P5n 10" "P5p 10" "P6 10"; do timeout 1500 node netsim.mjs $p >> runall.out 2>&1 || echo "FAIL $p" >> runall.out; done
echo ALLDONE >> runall.out
