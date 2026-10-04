# Stage B inference latency on CPU (DX-8 proxy): one engine inference = Whisper log-mel of the 8 s window (numpy, stmel.py)
# + the Smart Turn v3.2 encoder (st32-emb.onnx, int8) + the fusion head (cce-stageb-*.onnx). Measured with onnxruntime on
# this sandbox's x86 CPU at 1 and 2 intra-op threads (ACA 2 vCPU proxy), n=200 after 20 warm-up runs. The sandbox is SHARED
# with other workstreams (load average is logged): numbers are an upper bound for an idle 2-vCPU ACA replica [M, contended].
# Output: evals/duplex/results/taxilafdb-stageb-latency-2026-10-04.json (merged with the wasm numbers from latency_wasm.mjs).
import json, os, sys, time
import numpy as np
import onnxruntime as ort
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stmel import logmel, window

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
ENC = os.environ.get("TAXILA_ST_EMB", "/tmp/taxila-fdb/models/st32-emb.onnx")
HEAD = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "models/duplex/cce-stageb-2026-10-04.1.onnx")
OUT = os.path.join(ROOT, "evals/duplex/results/taxilafdb-stageb-latency-2026-10-04.json")
F = json.load(open(HEAD.replace(".onnx", ".json")))["featureNames"].__len__()
rs = np.random.RandomState(0)
audio = (rs.randn(16000 * 10) * 0.05).astype(np.float32)
res = {"date": "2026-10-04", "loadavg": os.getloadavg(), "cpu": os.cpu_count(), "encoderBytes": os.path.getsize(ENC), "headBytes": os.path.getsize(HEAD), "runs": {}}
for th in (1, 2):
    so = ort.SessionOptions(); so.intra_op_num_threads = th; so.inter_op_num_threads = 1
    enc = ort.InferenceSession(ENC, so, providers=["CPUExecutionProvider"])
    head = ort.InferenceSession(HEAD, so, providers=["CPUExecutionProvider"])
    def once():
        t0 = time.perf_counter()
        mel = logmel(window(audio, 16000 * 9))[None]
        t1 = time.perf_counter()
        p, emb, _ = enc.run(None, {"input_features": mel})
        t2 = time.perf_counter()
        pp = float(np.clip(p[0, 0], 1e-4, 1 - 1e-4))
        head.run(None, {"features": np.zeros((1, F), np.float32), "emb": emb.astype(np.float32), "st_logit": np.array([[np.log(pp / (1 - pp))]], np.float32), "audio_missing": np.zeros((1, 1), np.float32)})
        t3 = time.perf_counter()
        return (t1 - t0) * 1000, (t2 - t1) * 1000, (t3 - t2) * 1000, (t3 - t0) * 1000
    for _ in range(20): once()
    r = np.array([once() for _ in range(200)])
    q = lambda c, p: round(float(np.percentile(r[:, c], p)), 2)
    res["runs"][f"threads{th}"] = {"n": 200, "melMs": {"p50": q(0, 50), "p95": q(0, 95)}, "encoderMs": {"p50": q(1, 50), "p95": q(1, 95)},
                                   "headMs": {"p50": q(2, 50), "p95": q(2, 95)}, "totalMs": {"p50": q(3, 50), "p95": q(3, 95)}}
    print(th, json.dumps(res["runs"][f"threads{th}"]))
prev = json.load(open(OUT)) if os.path.exists(OUT) else {}
prev.update({"cpu_ort": res})
json.dump(prev, open(OUT, "w"), indent=1)
