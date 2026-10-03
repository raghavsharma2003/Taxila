#!/bin/bash
# Harness proof job: writes a file and a log, reports the box it ran on. No GPU needed.
set -eu
echo "hello from $(hostname) job=$JOB_ID at $(date -u +%FT%TZ)"
echo "kernel $(uname -r); $(nproc) vCPU; $(free -m | awk '/Mem/{print $2}') MB RAM"
echo "imds instance type: $(TOKEN=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60'); curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-type)"
echo "input says: $(cat input.txt)"
sha256sum input.txt | tee "$OUT/input.sha256"
for i in 1 2 3; do echo "tick $i"; sleep 20; done
printf '{"job":"%s","host":"%s","deadlineEpoch":%s,"nproc":%s}\n' "$JOB_ID" "$(hostname)" "$DEADLINE_EPOCH" "$(nproc)" > "$OUT/result.json"
mkdir -p "$OUT/sub" && echo "nested output ok" > "$OUT/sub/nested.txt"
echo "done"
