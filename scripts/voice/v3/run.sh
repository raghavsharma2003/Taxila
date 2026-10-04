#!/bin/bash
# VOICE v3 round 2, open-weight arms: render the 5 round-1 lines on Veena, VoxCPM2, Svara, Chatterbox-hi and
# VibeVoice-Hindi (7B, then 1.5B if time is left) on one throwaway GPU instance under scripts/gpu/run.py.
# Build-time experiment only (decision aws-build-gpu); nothing here is product runtime.
# Pins: HF repos at exact revisions (weights.expected.json; sha256 re-checked here into pins/weights-sha256.json),
# hashed uv locks per venv (req-*.lock), the Chatterbox Space and the VibeVoice code at exact commits.
# Each arm is isolated: a failing arm is recorded and the next one runs. Every finished arm is copied to
# s3://$BUCKET/${S3_PREFIX}renders/<arm>/ at once, so a lost spot instance does not lose finished arms.
set -uo pipefail
cd "$JOB_DIR"
T() { echo "[voice-v3 $(date -u +%T)] $*"; }
export UV_CACHE_DIR=/opt/uv-cache UV_PYTHON_INSTALL_DIR=/opt/uv-python HF_HOME=/opt/hf HF_HUB_DISABLE_TELEMETRY=1 \
       PIP_DISABLE_PIP_VERSION_CHECK=1 TOKENIZERS_PARALLELISM=false PYTHONUNBUFFERED=1
SPACE_REPO=ResembleAI/Chatterbox-Multilingual-TTS-hi
SPACE_REV=449843a7ac17ba81773f2880577142e0c5f778c3
export VIBEVOICE_COMMIT=952326ddb264062466a888cf32a5b2f4e803e16e
W=/opt/w; R=$OUT/renders; P=$OUT/pins; LG=$OUT/logs
mkdir -p $W /opt/refs /opt/src $R $P $LG
echo "arm rc seconds" > $OUT/arms.txt

T "machine"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv | tee $P/gpu.csv || { T "no GPU"; exit 4; }
TOKEN=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 600')
md() { curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/$1; }
export INSTANCE_TYPE=$(md instance-type) INSTANCE_AZ=$(md placement/availability-zone) INSTANCE_LIFECYCLE=$(md instance-life-cycle)
printf 'instanceType %s\naz %s\nlifecycle %s\nami %s\n' "$INSTANCE_TYPE" "$INSTANCE_AZ" "$INSTANCE_LIFECYCLE" "$(md ami-id)" | tee $P/instance.txt
nproc; free -g | head -2; df -h / | tail -1

# ffmpeg shared libs for torchcodec (VoxCPM2); apt may be held by unattended-upgrades right after boot
( for i in $(seq 1 30); do DEBIAN_FRONTEND=noninteractive apt-get install -y -q ffmpeg >/dev/null 2>&1 && { echo ok > /opt/ffmpeg.ok; break; }; sleep 10; done ) > $LG/apt.log 2>&1 &

T "uv + python"
printf 'uv==0.12.23 --hash=sha256:565c6e2874dbeae86c02f3dea97255e878fec672659a73d4930c6b93fcab2fff\n' > /tmp/uv.req
python3 -m pip install -q --require-hashes -r /tmp/uv.req || { T "uv install failed"; exit 5; }
uv --version | tee $P/uv.txt
uv python install -q 3.11.13 || uv python install -q 3.11
PYV=$(uv python find 3.11); echo "python $PYV" | tee -a $P/uv.txt

mkvenv() {   # mkvenv <name> <lock>
  local t=$(date +%s)
  uv venv -q -p 3.11 /opt/venv-$1 && \
  uv pip install -q -p /opt/venv-$1 --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu128 -r $2 \
    > $LG/venv-$1.log 2>&1
  local rc=$?
  uv pip freeze -p /opt/venv-$1 > $P/freeze-$1.txt 2>/dev/null
  echo "venv $1 rc $rc $(( $(date +%s) - t )) s" | tee -a $LG/venvs.txt
  [ $rc = 0 ] && touch /opt/venv-$1.ok || touch /opt/venv-$1.failed
}

T "fetch weights (background), then verify sha256"
mkvenv dl req-dl.lock
[ -f /opt/venv-dl.ok ] || { T "download venv failed"; cat $LG/venv-dl.log; exit 6; }
( /opt/venv-dl/bin/python fetch_open.py weights.expected.json $W ${FETCH_ONLY:+--only $FETCH_ONLY}
  /opt/venv-dl/bin/python fetch_open.py weights.expected.json $W ${FETCH_ONLY:+--only $FETCH_ONLY} --verify $P/weights-sha256.json ) > $LG/fetch.log 2>&1 &
FETCH=$!
/opt/venv-dl/bin/python - <<PY 2>&1 | tail -2
from huggingface_hub import snapshot_download
p = snapshot_download(repo_id="$SPACE_REPO", repo_type="space", revision="$SPACE_REV", local_dir="/opt/src/chatterbox-space")
print("space", p)
PY
echo "$SPACE_REPO $SPACE_REV" > $P/chatterbox-space.txt

T "venvs: orph now, the rest in the background"
mkvenv orph req-orph.lock
( mkvenv voxcpm req-voxcpm.lock; mkvenv cb req-chatterbox.lock; mkvenv vv req-vibevoice.lock ) &

waitfor() {  # waitfor <marker-ok> <marker-failed> <max-s>
  local n=0; while [ ! -e "$1" ] && [ ! -e "$2" ] && [ $n -lt $3 ]; do sleep 5; n=$((n+5)); done; [ -e "$1" ]
}

run_arm() {  # run_arm <arm> <venv> "<weight keys>" <budget-min>
  local arm=$1 venv=$2 keys=$3 budget=$4 t=$(date +%s)
  local left=$(( (DEADLINE_EPOCH - t) / 60 ))
  if [ $left -lt $(( budget / 2 + 12 )) ]; then T "SKIP $arm: $left min left"; echo "$arm skipped-time 0" >> $OUT/arms.txt; return; fi
  waitfor /opt/venv-$venv.ok /opt/venv-$venv.failed 1500 || { T "SKIP $arm: venv $venv failed"; tail -30 $LG/venv-$venv.log; echo "$arm venv-failed 0" >> $OUT/arms.txt; return; }
  for k in $keys; do waitfor $W/$k.done $W/$k.failed 2400 || { T "SKIP $arm: weights $k missing"; echo "$arm weights-failed 0" >> $OUT/arms.txt; return; }; done
  export ARM_DEADLINE_EPOCH=$(( t + budget * 60 < DEADLINE_EPOCH - 600 ? t + budget * 60 : DEADLINE_EPOCH - 600 ))
  T "=== $arm (budget $budget min, $left min left in the job)"
  /opt/venv-$venv/bin/python render_open.py $arm --weights $W --out $R --refs /opt/refs --space /opt/src/chatterbox-space --takes 3 2>&1 \
    | tee $LG/$arm.log | grep --line-buffered -v -E "it/s\]|s/it\]|^\s*$"
  local rc=${PIPESTATUS[0]}
  echo "$arm $rc $(( $(date +%s) - t ))" >> $OUT/arms.txt
  T "$arm rc $rc after $(( $(date +%s) - t )) s; $(ls $R/$arm 2>/dev/null | grep -c wav) wav"
  aws s3 cp --recursive --only-show-errors $R/$arm "s3://$BUCKET/${S3_PREFIX}renders/$arm/" || T "partial upload of $arm failed"
  aws s3 cp --only-show-errors $LG/$arm.log "s3://$BUCKET/${S3_PREFIX}renders/logs/$arm.log" || true
}

# ARMS (env) limits a re-run to some arms, e.g. ARMS="chatterbox-hi vibevoice-hindi-1.5b". A re-run that skips voxcpm2
# takes the designed references from inputs/refs/voxcpm2-design-{F,M}.wav (the earlier job's voxcpm2 outputs).
ARMS=${ARMS:-"veena voxcpm2 svara chatterbox-hi vibevoice-hindi-7b vibevoice-hindi-1.5b"}
want() { case " $ARMS " in *" $1 "*) return 0;; esac; return 1; }
if [ -f inputs/refs/voxcpm2-design-F.wav ] && [ -f inputs/refs/voxcpm2-design-M.wav ]; then
  cp inputs/refs/voxcpm2-design-*.wav /opt/refs/
  printf '{"refs": {"F": "/opt/refs/voxcpm2-design-F.wav", "M": "/opt/refs/voxcpm2-design-M.wav"}, "from": "inputs/refs (earlier job)"}' > /opt/refs/refs.json
  sha256sum /opt/refs/*.wav | tee $P/refs-sha256.txt
fi
want veena && run_arm veena orph "veena snac" 25
waitfor /opt/ffmpeg.ok /nonexistent 300 || T "WARNING: ffmpeg not installed; torchcodec may fail"
want voxcpm2 && run_arm voxcpm2 voxcpm "voxcpm2" 25
want svara && run_arm svara orph "svara snac" 25
if [ -f /opt/refs/refs.json ]; then
  want chatterbox-hi && run_arm chatterbox-hi cb "chatterbox-hi chatterbox-base" 20
  want vibevoice-hindi-7b && run_arm vibevoice-hindi-7b vv "vibevoice-hindi-7b qwen2.5-7b-tok" 30
  want vibevoice-hindi-1.5b && run_arm vibevoice-hindi-1.5b vv "vibevoice-hindi-1.5b qwen2.5-7b-tok" 15
else
  T "no designed references (voxcpm2 failed): Chatterbox and VibeVoice have no consented voice to clone, so they are NOT rendered"
  echo "chatterbox-hi no-reference 0" >> $OUT/arms.txt; echo "vibevoice-hindi-7b no-reference 0" >> $OUT/arms.txt
fi

T "wait for weight verification (max 10 min)"
n=0; while kill -0 $FETCH 2>/dev/null && [ $n -lt 600 ]; do sleep 10; n=$((n+10)); done
kill $FETCH 2>/dev/null
cp $LG/fetch.log $P/fetch.log 2>/dev/null
ls $W/*.done 2>/dev/null | xargs -n1 basename | tee $P/fetched.txt
cat $W/*.done 2>/dev/null
cat $OUT/arms.txt
df -h / | tail -1
T "done"
