#!/bin/bash
# stylised3d: style C refs -> Hunyuan3D-2.1 (single view) + Hunyuan3D-2mv (front/left/right/back) shape targets, a
# silhouette score of every seed, and Hunyuan paint on the best of each family (for hair/skin/kurta region labels and a
# colour transfer source). Toolchain = face3d's pinned one (hashed lock, sha256 weights, commit pins). TECH-PLAN section 4.
set -euo pipefail
cd "$JOB_DIR"
T() { echo "[stylised3d $(date -u +%T)] $*"; }
STAGE() { T "=== $*"; echo "$* $(date -u +%s)" >> "$OUT/stages.txt"; }
OCT=${S3D_OCTREE:-512}; STEPS=${S3D_STEPS:-50}; GUIDE=${S3D_GUIDANCE:-5.0}
HY_COMMIT=$(python3 -c 'import json;print(json.load(open("weights.lock.json"))["git"]["Tencent-Hunyuan/Hunyuan3D-2.1"]["commit"])')
HY2_COMMIT=$(python3 -c 'import json;print(json.load(open("weights.lock.json"))["git"]["Tencent-Hunyuan/Hunyuan3D-2"]["commit"])')
export HF_HOME=/opt/hf HY3DGEN_MODELS=/opt/hy3dgen WEIGHTS_DIR=/opt/weights U2NET_HOME=/opt/weights
export PIP_DISABLE_PIP_VERSION_CHECK=1 UV_CACHE_DIR=/opt/uv-cache UV_PYTHON_INSTALL_DIR=/opt/uv-python
mkdir -p "$OUT/pins" "$OUT/work" /opt/weights
W=$OUT/work

STAGE "machine"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv | tee "$OUT/pins/gpu.csv"
TOKEN=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 300')
for k in ami-id instance-type placement/availability-zone; do echo "$k $(curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/$k)"; done | tee "$OUT/pins/instance.txt"
CUDA_HOME=$(ls -d /usr/local/cuda-12.4 2>/dev/null || readlink -f /usr/local/cuda); export CUDA_HOME PATH=$CUDA_HOME/bin:$PATH
export TORCH_CUDA_ARCH_LIST="8.6;8.9"

STAGE "weights (background) + toolchain"
python3 fetch_weights.py weights.lock.json > "$W/fetch.log" 2>&1 &
FETCH=$!
printf 'uv==0.12.23 --hash=sha256:565c6e2874dbeae86c02f3dea97255e878fec672659a73d4930c6b93fcab2fff\n' > /tmp/uv.req
python3 -m pip install -q --require-hashes -r /tmp/uv.req
uv python install 3.10.22
uv venv -q -p 3.10.22 /opt/venv-hy
uv pip install -q -p /opt/venv-hy --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu124 \
  torch==2.5.1+cu124 setuptools==75.8.0 wheel==0.45.1 numpy==1.24.4 cython==3.0.11
uv pip install -q -p /opt/venv-hy --require-hashes --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu124 \
  --no-build-isolation-package basicsr -r req-hy.lock
uv pip freeze -p /opt/venv-hy > "$OUT/pins/freeze-hy.txt"

STAGE "hunyuan3d-2.1 @ $HY_COMMIT + hunyuan3d-2 @ $HY2_COMMIT"
git clone -q --filter=blob:none https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git /opt/hy21
git -C /opt/hy21 checkout -q "$HY_COMMIT"
git clone -q --filter=blob:none https://github.com/Tencent-Hunyuan/Hunyuan3D-2.git /opt/hy2
git -C /opt/hy2 checkout -q "$HY2_COMMIT"
{ git -C /opt/hy21 rev-parse HEAD; git -C /opt/hy2 rev-parse HEAD; } > "$OUT/pins/commits.txt"
cp /opt/hy21/LICENSE "$OUT/pins/HUNYUAN21-LICENSE.txt"; cp /opt/hy2/LICENSE "$OUT/pins/HUNYUAN2-LICENSE.txt"
sha256sum /opt/hy21/LICENSE /opt/hy2/LICENSE | tee "$OUT/pins/licence-sha256.txt"
( source /opt/venv-hy/bin/activate
  cd /opt/hy21/hy3dpaint/custom_rasterizer && uv pip install -q --no-build-isolation -e . 2>&1 | tail -3
  cd /opt/hy21/hy3dpaint/DifferentiableRenderer && bash compile_mesh_painter.sh )
wait $FETCH || { cat "$W/fetch.log"; exit 3; }
tail -3 "$W/fetch.log"
cp /opt/weights/fetch-report.json weights.lock.json "$OUT/pins/"
sha256sum /opt/hy3dgen/tencent/Hunyuan3D-2mv/LICENSE /opt/hy3dgen/tencent/Hunyuan3D-2.1/LICENSE >> "$OUT/pins/licence-sha256.txt" || true
export HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 DIFFUSERS_OFFLINE=1
PY=/opt/venv-hy/bin/python
S=$JOB_DIR/stylised3d.py

STAGE "matte"
( cd /opt/hy21 && $PY $S matte --refs "$JOB_DIR/inputs/refs" --views front-ortho,neutral,profile-left,profile-right,back,q3-left,q3-right --out "$W" )

STAGE "hunyuan3d-2mv shapes: $S3D_MV"
IFS=';' read -ra MVS <<< "$S3D_MV"
for spec in "${MVS[@]}"; do
  IFS=':' read -r tag L R seeds <<< "$spec"
  ( cd /opt/hy2 && PYTHONPATH=/opt/hy2 $PY $S shapemv --front "$W/front-ortho_rgba.png" --left "$W/${L}_rgba.png" --right "$W/${R}_rgba.png" \
      --back "$W/back_rgba.png" --tag "$tag" --seeds "$seeds" --octree $OCT --steps $STEPS --guidance $GUIDE --out "$W" ) || T "mv $tag FAILED (continuing)"
done

STAGE "hunyuan3d-2.1 shapes: $S3D_H21"
IFS=';' read -ra H21 <<< "$S3D_H21"
for spec in "${H21[@]}"; do
  IFS=':' read -r view tag seeds <<< "$spec"
  ( cd /opt/hy21 && $PY $S shape21 --image "$W/${view}_rgba.png" --tag "$tag" --seeds "$seeds" --octree $OCT --steps $STEPS --guidance $GUIDE --out "$W" )
done

STAGE "score"
MESHES=$(ls "$W"/h21_*.ply "$W"/hmv_*.ply 2>/dev/null | paste -sd,)
$PY $S score --meshes "$MESHES" --mattes "$W" --out "$OUT/score.json"
if [ "${S3D_PAINT:-auto}" != "none" ]; then
  PICKS=$(python3 - <<'PY'
import json, os
s = json.load(open(os.environ["OUT"] + "/score.json"))
for fam in ("h21_", "hmv_"):
    c = sorted((v["score"], k) for k, v in s.items() if k.startswith(fam))
    if c: print(c[-1][1])
PY
)
  for m in $PICKS; do
    STAGE "paint $m"
    ( cd /opt/hy21 && $PY $S paint --mesh "$W/$m" --images "$W/front-ortho_rgba.png" --out "$OUT/paint_${m%.ply}" ) || T "paint $m FAILED (continuing)"
  done
fi

STAGE "collect"
mkdir -p "$OUT/shapes" "$OUT/mattes"
mv "$W"/h21_*.ply "$W"/hmv_*.ply "$OUT/shapes/" 2>/dev/null || true
mv "$W"/*_rgba.png "$OUT/mattes/"
cp "$W"/report-*.json "$OUT/" 2>/dev/null || true
du -sh "$OUT"/*; T "done"
