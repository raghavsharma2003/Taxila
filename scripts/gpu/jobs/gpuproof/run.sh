#!/bin/bash
# GPU harness proof: nvidia-smi + a CUDA matmul in the Deep Learning AMI's own PyTorch. Writes a JSON result.
set -euo pipefail
nvidia-smi | tee "$OUT/nvidia-smi.txt"
PY=$(ls /opt/pytorch/bin/python 2>/dev/null || command -v python3)
echo "python: $PY"
"$PY" - <<'PY'
import json, os, time, torch
assert torch.cuda.is_available(), "no CUDA"
d = torch.device("cuda"); n = 8192
a = torch.randn(n, n, device=d, dtype=torch.float16); b = torch.randn(n, n, device=d, dtype=torch.float16)
for _ in range(3): (a @ b); torch.cuda.synchronize()
t = time.time(); reps = 20
for _ in range(reps): c = a @ b
torch.cuda.synchronize(); dt = time.time() - t
tflops = 2 * n**3 * reps / dt / 1e12
# correctness on a small fp32 product against the CPU
x = torch.randn(256, 256); y = torch.randn(256, 256)
err = float((x.cuda() @ y.cuda()).cpu().sub(x @ y).abs().max())
r = {"torch": torch.__version__, "cuda": torch.version.cuda, "gpu": torch.cuda.get_device_name(0),
     "vramGB": round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1), "fp16MatmulN": n, "fp16TFLOPS": round(tflops, 1),
     "fp32MaxAbsErrVsCpu": err}
print(json.dumps(r)); json.dump(r, open(os.path.join(os.environ["OUT"], "cuda.json"), "w"), indent=1)
PY
