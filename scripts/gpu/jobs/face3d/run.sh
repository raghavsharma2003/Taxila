#!/bin/bash
# face3d: reference portraits -> high-detail 3D head (Hunyuan3D-2.1 shape + PBR paint), de-lit albedo + normals per
# portrait (Marigold v1-1), and the identity target the CPU wrap consumes (lift.py). Everything pinned:
# git commit, hashed pip locks (req-*.lock, --require-hashes), sha256-verified weights (weights.lock.json).
# Runs as root on a Deep Learning AMI GPU instance under scripts/gpu/run.py; results go to $OUT.
set -euo pipefail
cd "$JOB_DIR"
T() { echo "[face3d $(date -u +%T)] $*"; }
STAGE() { T "=== $*"; echo "$* $(date -u +%s)" >> "$OUT/stages.txt"; }
LOOK=${FACE3D_LOOK:-teal}
SEEDS=${FACE3D_SEEDS:-0,1,2}
OCTREE=${FACE3D_OCTREE:-512}
STEPS=${FACE3D_STEPS:-50}
GUIDE=${FACE3D_GUIDANCE:-5.0}
PAINT_REFS=${FACE3D_PAINT_REFS:-front}
PAINT_VIEWS=${FACE3D_PAINT_VIEWS:-6}
PAINT_RES=${FACE3D_PAINT_RES:-512}
DELIGHT_VIEWS=${FACE3D_DELIGHT_VIEWS:-front,q3_left,q3_right,q45_left,q45_right,profile_left,profile90_left,profile90_right}
HY_COMMIT=$(python3 -c 'import json;print(json.load(open("weights.lock.json"))["git"]["Tencent-Hunyuan/Hunyuan3D-2.1"]["commit"])')
export HF_HOME=/opt/hf HY3DGEN_MODELS=/opt/hy3dgen WEIGHTS_DIR=/opt/weights U2NET_HOME=/opt/weights
export PIP_DISABLE_PIP_VERSION_CHECK=1 UV_CACHE_DIR=/opt/uv-cache UV_PYTHON_INSTALL_DIR=/opt/uv-python
mkdir -p "$OUT/pins" "$OUT/work" /opt/weights

STAGE "machine"
SMOKE=${FACE3D_SMOKE:-0}       # 1 = CPU smoke test: toolchain + locks + Hunyuan build + weights + imports, then stop
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv | tee "$OUT/pins/gpu.csv" || { [ "$SMOKE" = 1 ] || { T "no GPU"; exit 4; }; }
TOKEN=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 300')
for k in ami-id instance-type placement/availability-zone; do echo "$k $(curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/$k)"; done | tee "$OUT/pins/instance.txt"
CUDA_HOME=$(ls -d /usr/local/cuda-12.4 2>/dev/null || readlink -f /usr/local/cuda); export CUDA_HOME PATH=$CUDA_HOME/bin:$PATH
nvcc --version | tail -2 | tee "$OUT/pins/nvcc.txt"
export TORCH_CUDA_ARCH_LIST="8.6;8.9"            # A10G (g5) and L4 / L40S (g6, g6e)

STAGE "weights (background) + toolchain"
python3 fetch_weights.py weights.lock.json > "$OUT/work/fetch.log" 2>&1 &
FETCH=$!
printf 'uv==0.12.23 --hash=sha256:565c6e2874dbeae86c02f3dea97255e878fec672659a73d4930c6b93fcab2fff\n' > /tmp/uv.req
python3 -m pip install -q --require-hashes -r /tmp/uv.req
uv python install 3.10.22
for V in hy mg; do uv venv -q -p 3.10.22 /opt/venv-$V; done
# basicsr 1.4.2 is sdist-only and imports torch in setup.py: torch first, then the full hashed lock without isolation for it
uv pip install -q -p /opt/venv-hy --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu124 \
  torch==2.5.1+cu124 setuptools==75.8.0 wheel==0.45.1 numpy==1.24.4 cython==3.0.11
uv pip install -q -p /opt/venv-hy --require-hashes --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu124 \
  --no-build-isolation-package basicsr -r req-hy.lock
uv pip install -q -p /opt/venv-mg --require-hashes --index-strategy unsafe-best-match --extra-index-url https://download.pytorch.org/whl/cu124 \
  -r req-mg.lock
for V in hy mg; do uv pip freeze -p /opt/venv-$V > "$OUT/pins/freeze-$V.txt"; done

STAGE "hunyuan3d-2.1 @ $HY_COMMIT"
git clone -q --filter=blob:none https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git /opt/hy21
git -C /opt/hy21 checkout -q "$HY_COMMIT"
git -C /opt/hy21 rev-parse HEAD > "$OUT/pins/hunyuan-commit.txt"
cp /opt/hy21/LICENSE "$OUT/pins/HUNYUAN-LICENSE.txt"; cp /opt/hy21/Notice.txt "$OUT/pins/HUNYUAN-NOTICE.txt"
( source /opt/venv-hy/bin/activate
  cd /opt/hy21/hy3dpaint/custom_rasterizer && uv pip install -q --no-build-isolation -e . 2>&1 | tail -3
  cd /opt/hy21/hy3dpaint/DifferentiableRenderer && bash compile_mesh_painter.sh )
wait $FETCH || { cat "$OUT/work/fetch.log"; exit 3; }
cat "$OUT/work/fetch.log" | tail -3
cp /opt/weights/fetch-report.json "$OUT/pins/"
cp weights.lock.json req-hy.lock req-mg.lock "$OUT/pins/"
export HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 DIFFUSERS_OFFLINE=1

if [ "$SMOKE" = 1 ]; then
  STAGE "smoke: imports in both venvs (no GPU)"
  ( cd /opt/hy21 && /opt/venv-hy/bin/python - <<'PY'
import sys, types
sys.modules.setdefault("bpy", types.ModuleType("bpy")); sys.path[:0] = ["./hy3dshape", "./hy3dpaint"]
from torchvision_fix import apply_fix; apply_fix()
import torch, custom_rasterizer, diffusers, transformers, rembg, realesrgan, pymeshlab, xatlas, open3d
from DifferentiableRenderer import mesh_inpaint_processor
from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline
from textureGenPipeline import Hunyuan3DPaintPipeline, Hunyuan3DPaintConfig
print("hy venv ok: torch", torch.__version__, "cuda build", torch.version.cuda, "diffusers", diffusers.__version__)
PY
  ) 2>&1 | grep -v Warning | tail -5
  /opt/venv-mg/bin/python -c "import torch, diffusers, mediapipe, open3d; from diffusers import MarigoldIntrinsicsPipeline, MarigoldNormalsPipeline; print('mg venv ok: diffusers', diffusers.__version__, 'mediapipe', mediapipe.__version__, 'open3d', open3d.__version__)"
  /opt/venv-mg/bin/python lift.py --help > /dev/null && T "lift.py imports ok"
  ( cd /opt/hy21 && FACE3D_IMPORT_CHECK=1 /opt/venv-hy/bin/python "$JOB_DIR/face3d.py" matte --out /tmp/ic )
  ( cd /opt/hy21 && /opt/venv-hy/bin/python "$JOB_DIR/face3d.py" matte --refs "$JOB_DIR/inputs/refs" --views front --lm "$JOB_DIR/inputs/refs/landmarks.json" --out "$OUT/smoke-matte" )
  du -sh /opt/hy3dgen /opt/hf /opt/weights /opt/venv-hy /opt/venv-mg 2>/dev/null | tee "$OUT/pins/disk.txt"
  T "smoke ok"; exit 0
fi

REFS=$JOB_DIR/inputs/refs
W=$OUT/work
STAGE "matte"
( cd /opt/hy21 && /opt/venv-hy/bin/python "$JOB_DIR/face3d.py" matte --refs "$REFS" --views "front,q3_left,q3_right" --crop "${FACE3D_CROP:-head}" \
    --lm "$REFS/landmarks.json" --out "$W" )
STAGE "shape seeds $SEEDS octree $OCTREE steps $STEPS"
( cd /opt/hy21 && /opt/venv-hy/bin/python "$JOB_DIR/face3d.py" shape --image "$W/front_rgba.png" --seeds "$SEEDS" --octree "$OCTREE" \
    --steps "$STEPS" --guidance "$GUIDE" --out "$W" )
STAGE "score seeds (likeness vs the front portrait)"
# shapes from an earlier run (job input inputs/prev_shapes/*.ply) compete in the same scoring, so a setting change is measured
if ls inputs/prev_shapes/*.ply >/dev/null 2>&1; then for f in inputs/prev_shapes/*.ply; do cp "$f" "$W/prev_$(basename "$f")"; done; fi
MESHES=$(ls "$W"/shape_s*.ply "$W"/prev_*.ply 2>/dev/null | paste -sd,)
/opt/venv-mg/bin/python lift.py score --meshes "$MESHES" --ref-lm "$REFS/landmarks.json" --regions inputs/mp_regions.json --out "$W/score"
BEST=$(cat "$W/score/best.txt")
T "best shape: $BEST"
STAGE "paint (PBR) on $BEST with refs $PAINT_REFS"
PIMG=$(for v in ${PAINT_REFS//,/ }; do printf '%s,' "$W/${v}_rgba.png"; done | sed 's/,$//')
( cd /opt/hy21 && /opt/venv-hy/bin/python "$JOB_DIR/face3d.py" paint --mesh "$W/$BEST" --images "$PIMG" --views "$PAINT_VIEWS" \
    --res "$PAINT_RES" --out "$W/paint" )
STAGE "delight + normals"
/opt/venv-mg/bin/python delight.py --refs "$REFS" --views "$DELIGHT_VIEWS" --out "$OUT"
STAGE "lift (identity target)"
/opt/venv-mg/bin/python lift.py final --shape "$W/$BEST" --textured "$W/paint/head_textured.glb" --ref-lm "$REFS/landmarks.json" \
    --regions inputs/mp_regions.json --out "$OUT"

STAGE "collect"
cp "$W/$BEST" "$OUT/head_shape.ply"
cp "$W/paint/head_textured.glb" "$OUT/head.glb"
mkdir -p "$OUT/maps"; cp "$W"/paint/head_textured*.{jpg,png,mtl,obj} "$OUT/maps/" 2>/dev/null || true
cp "$W"/score/*.png "$W"/score/likeness.json "$OUT/" 2>/dev/null || true
cp "$W"/report-*.json "$W"/paint/report-*.json "$OUT/" 2>/dev/null || true
cp "$REFS/landmarks.json" "$OUT/refs_landmarks.json"
python3 - <<PY
import json, os
out = os.environ["OUT"]
m = {"look": "$LOOK", "best": "$BEST", "seeds": "$SEEDS", "octree": $OCTREE, "steps": $STEPS, "guidance": $GUIDE,
     "paint": {"refs": "$PAINT_REFS", "views": $PAINT_VIEWS, "res": $PAINT_RES}, "delightViews": "$DELIGHT_VIEWS",
     "files": sorted(os.path.relpath(os.path.join(d, f), out) for d, _, fs in os.walk(out) for f in fs if "/work/" not in os.path.join(d, f))}
json.dump(m, open(os.path.join(out, "face3d.json"), "w"), indent=1)
PY
rm -rf "$W"/shape_s*.ply "$W"/prev_*.ply "$W"/paint/*.obj 2>/dev/null || true     # keep the bundle small: the chosen shape is head_shape.ply
du -sh "$OUT"; T "done"
