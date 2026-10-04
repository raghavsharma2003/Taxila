#!/bin/bash
# VOICE v3 SCREEN pass 2 (docs/research/voice/v3/screen/align.py) on a throwaway GPU: CTC forced alignment + greedy
# decode (vakyansh-wav2vec2-hindi-him-4200, MIT) and WavLM-SV x-vectors (microsoft/wavlm-base-plus-sv) over all 440
# clips. Measurement only, no rendering, nothing product-facing. Weights pinned by HF revision inside align.py.
set -uo pipefail
cd "$JOB_DIR"
T() { echo "[screen-align $(date -u +%T)] $*"; }
export HF_HUB_DISABLE_TELEMETRY=1 PIP_DISABLE_PIP_VERSION_CHECK=1 PYTHONUNBUFFERED=1 UV_CACHE_DIR=/opt/uv-cache UV_PYTHON_INSTALL_DIR=/opt/uv-python
nvidia-smi -L || T "no GPU: CPU run"
printf 'uv==0.12.23 --hash=sha256:565c6e2874dbeae86c02f3dea97255e878fec672659a73d4930c6b93fcab2fff\n' > /tmp/uv.req
python3 -m pip install -q --require-hashes -r /tmp/uv.req || { T "uv install failed"; exit 5; }
uv python install -q 3.11 && uv venv -q -p 3.11 /opt/venv || exit 6
uv pip install -q -p /opt/venv --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu128 \
  "torch==2.7.1" "transformers>=4.44,<5" praat-parselmouth huggingface_hub numpy scipy soundfile || exit 7
uv pip freeze -p /opt/venv > $OUT/freeze.txt
export ALIGN_THREADS=$(nproc) ALIGN_SP=$JOB_DIR ALIGN_HF=/opt/hf CLIP_ROOT=$JOB_DIR
T "align"
/opt/venv/bin/python screen/align.py; rc=$?
mkdir -p $OUT/align && cp screen/align/*.json $OUT/align/ 2>/dev/null
T "rc $rc, $(ls $OUT/align | wc -l) clips"
exit $rc
