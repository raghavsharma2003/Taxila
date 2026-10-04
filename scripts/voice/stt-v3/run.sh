#!/bin/bash
# stt-v3 open-weight STT bench on one throwaway GPU instance under scripts/gpu/run.py (decision aws-build-gpu: build-time
# experiment only; nothing here is product runtime). Corpus = the 2026-10-04 refresh corpus (16 kHz PCM, synthetic TTS,
# no child audio) + 22 extra non-speech clips; it travels inside the job tarball (S3) and is sha256-checked here.
# Each arm runs in its own python process; a failing arm is recorded and the next one runs. Every finished arm is copied
# to s3://$BUCKET/${S3_PREFIX}arms/<arm>/ at once, so a lost spot instance does not lose finished arms.
#   env ARMS="N6hi V480 ..." (default: all of DEFAULT_ARMS)   SMOKE=1 (6 clips, tiny load test)
set -uo pipefail
cd "$JOB_DIR"
T() { echo "[stt-v3 $(date -u +%T)] $*"; }
export UV_CACHE_DIR=/opt/uv-cache UV_PYTHON_INSTALL_DIR=/opt/uv-python HF_HOME=/opt/hf HF_HUB_DISABLE_TELEMETRY=1 \
       PIP_DISABLE_PIP_VERSION_CHECK=1 TOKENIZERS_PARALLELISM=false PYTHONUNBUFFERED=1 WEIGHTS=/opt/w
DEFAULT_ARMS="N6hi N3hi N13hi N6auto NOhi Q17 Q17hi Q17p Q17pk Q06 Q06hi Z0 Z0hi V480 V960"
ARMS=${ARMS:-$DEFAULT_ARMS}
R=$OUT/results; P=$OUT/pins; LG=$OUT/logs
mkdir -p $R $P $LG /opt/w
echo "arm rc seconds" > $OUT/arms.txt

T "machine"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv | tee $P/gpu.csv || { T "no GPU"; exit 4; }
TOKEN=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 600')
md() { curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/$1; }
export INSTANCE_TYPE=$(md instance-type) INSTANCE_AZ=$(md placement/availability-zone) INSTANCE_LIFECYCLE=$(md instance-life-cycle)
printf 'instanceType %s\naz %s\nlifecycle %s\nami %s\n' "$INSTANCE_TYPE" "$INSTANCE_AZ" "$INSTANCE_LIFECYCLE" "$(md ami-id)" | tee $P/instance.txt
nproc; free -g | head -2; df -h / | tail -1

T "corpus check"
python3 - <<'PY' || { T "corpus sha256 mismatch"; exit 7; }
import hashlib, json, sys
m = json.load(open("corpus-manifest.json"))
bad = [c for c, h in m["files"].items() if hashlib.sha256(open(f"corpus/{c}.16k.pcm", "rb").read()).hexdigest() != h]
meta_ok = hashlib.sha256(open("corpus/meta.json", "rb").read()).hexdigest() == m["meta_sha256"]
print(len(m["files"]), "clips;", len(bad), "mismatched; meta", "ok" if meta_ok else "MISMATCH")
sys.exit(1 if bad or not meta_ok else 0)
PY

T "uv + python + venv"
printf 'uv==0.12.23 --hash=sha256:565c6e2874dbeae86c02f3dea97255e878fec672659a73d4930c6b93fcab2fff\n' > /tmp/uv.req
python3 -m pip install -q --require-hashes -r /tmp/uv.req || { T "uv install failed"; exit 5; }
uv python install -q 3.11.13 || uv python install -q 3.11
t=$(date +%s)
uv venv -q -p 3.11 /opt/venv && uv pip install -q -p /opt/venv --require-hashes --index-strategy unsafe-best-match \
   --extra-index-url https://download.pytorch.org/whl/cu128 -r requirements.lock > $LG/venv.log 2>&1 \
   || { T "venv failed"; tail -40 $LG/venv.log; exit 6; }
uv pip freeze -p /opt/venv > $P/freeze.txt
T "venv ok in $(( $(date +%s) - t )) s"
/opt/venv/bin/python -c "import torch, transformers; print('torch', torch.__version__, 'cuda', torch.cuda.is_available(), torch.cuda.get_device_name(0)); print('transformers', transformers.__version__)" | tee $P/torch.txt

# prefetch weights of the next model family in the background while the current one runs
prefetch() { /opt/venv/bin/python - "$1" <<'PY' >> $LG/prefetch.log 2>&1 &
import sys; sys.path.insert(0, ".")
import bench_open as B
p, info = B.fetch(sys.argv[1], "/opt/w")
print("prefetched", sys.argv[1], p)
PY
}
model_of() { /opt/venv/bin/python -c "import bench_open as B; print(B.ARMS['$1']['model'])"; }
for m in $(for a in $ARMS; do model_of $a; done | awk '!s[$0]++' | head -2); do prefetch $m; done

for arm in $ARMS; do
  now=$(date +%s); left=$(( (DEADLINE_EPOCH - now) / 60 ))
  if [ $left -lt 12 ]; then T "SKIP $arm: $left min left"; echo "$arm skipped-time 0" >> $OUT/arms.txt; continue; fi
  # every arm gets at most 40 min (and never past the job deadline minus 8 min)
  export ARM_DEADLINE_EPOCH=$(( now + 2400 < DEADLINE_EPOCH - 480 ? now + 2400 : DEADLINE_EPOCH - 480 ))
  T "=== $arm ($left min left in the job)"
  # prefetch the model after this one
  nxt=$(echo $ARMS | tr ' ' '\n' | awk -v a=$arm 'f{print; exit} $0==a{f=1}'); [ -n "$nxt" ] && prefetch $(model_of $nxt)
  timeout --kill-after=20 $(( ARM_DEADLINE_EPOCH - now + 120 )) /opt/venv/bin/python bench_open.py run --arm $arm --corpus corpus \
      --out $R ${SMOKE:+--smoke} 2>&1 | tee $LG/$arm.log | grep --line-buffered -v -E "it/s\]|s/it\]|^\s*$|Warning|warn\("
  rc=${PIPESTATUS[0]}
  echo "$arm $rc $(( $(date +%s) - now ))" >> $OUT/arms.txt
  T "$arm rc $rc"
  aws s3 cp --only-show-errors --recursive $R/$arm "s3://$BUCKET/${S3_PREFIX}arms/$arm/" 2>/dev/null || true
  aws s3 cp --only-show-errors $LG/$arm.log "s3://$BUCKET/${S3_PREFIX}arms/$arm.log" 2>/dev/null || true
  # free the disk of models no later arm needs
  for m in nemotron voxtral qwen17 qwen06 zero; do
    later=$(echo $ARMS | tr ' ' '\n' | awk -v a=$arm 'f{print} $0==a{f=1}' | while read x; do model_of $x; done | grep -c "^$m$")
    [ "$later" = 0 ] && [ -d /opt/w/$m ] && [ "$(model_of $arm)" = "$m" ] && rm -rf /opt/w/$m && T "freed $m"
  done
done
cat $OUT/arms.txt
df -h / | tail -1
exit 0
