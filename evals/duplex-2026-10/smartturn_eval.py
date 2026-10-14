# duplex bake-off 2026-10: Pipecat Smart Turn v3.2 (BSD-2, Whisper-Tiny encoder, ONNX CPU) on the bake-off's child-like
# Hinglish TaxilaFDB TEST audio (assemble.mjs `<id>.child.s16`, 16 kHz). Samples, cut at gold points:
#   complete    the audio up to the child's true end + 200 ms (the turn is over)
#   incomplete  the audio up to a gold THINKING pause's start + 200 ms (the child is still going)
# The model reads the last 8 s (zero-padded at the front, Whisper log-mel), as in Pipecat's reference inference.
# Accuracy against the gold label; CPU ms per inference (single thread and default). Simulated TTS children, not children.
#   python -I evals/duplex-2026-10/smartturn_eval.py <bake dir> <smart-turn-v3.2-cpu.onnx> [out.json]
import json, os, sys, time
import numpy as np
import onnxruntime as ort
from transformers import WhisperFeatureExtractor

bake, model = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else None
SR = 16000
THINK = {"filler", "hesitation", "hold_request", "word_search", "repair_open", "mid_explanation", "drift_pause"}  # TaxilaFDB: word_search_long / hold_long allow a CUT_IN
fe = WhisperFeatureExtractor(chunk_length=8)

def feats(x):
    x = x[-8 * SR:]
    x = np.pad(x, (8 * SR - len(x), 0))
    f = fe(x, sampling_rate=SR, return_tensors="np", padding="max_length", max_length=8 * SR, truncation=True, do_normalize=True)
    return np.expand_dims(f.input_features.squeeze(0).astype(np.float32), 0)

res = {}
for threads in (1, 0):
    so = ort.SessionOptions()
    if threads: so.intra_op_num_threads = threads; so.inter_op_num_threads = 1
    sess = ort.InferenceSession(model, sess_options=so, providers=["CPUExecutionProvider"])
    rows, ms = [], []
    for f in sorted(os.listdir(bake)):
        if not f.endswith(".json") or f == "index.json":
            continue
        m = json.load(open(os.path.join(bake, f)))
        if not m.get("child") or m["child"]["start"]["mode"] != "after_her" or m["gold"].get("trueEnd") is None:
            continue
        x = np.frombuffer(open(os.path.join(bake, m["id"] + ".child.s16"), "rb").read(), dtype="<i2").astype(np.float32) / 32768.0
        start = int(m["gold"]["childStart"] * SR / 1000)
        points = [("complete", m["gold"]["trueEnd"] + 200)]
        for p in m["gold"].get("pauses", []):
            if p.get("cls") in THINK:
                points.append(("incomplete", p["start"] + 200))
        for label, at in points:
            seg = x[max(0, start - SR // 2): int(at * SR / 1000)]
            t0 = time.perf_counter()
            prob = float(sess.run(None, {"input_features": feats(seg)})[0].reshape(-1)[0])
            ms.append((time.perf_counter() - t0) * 1000)
            rows.append({"id": m["id"], "family": m["family"], "lang": m.get("lang"), "label": label, "prob": round(prob, 4), "pred": "complete" if prob > 0.5 else "incomplete"})
    acc = lambda rs: (sum(r["pred"] == r["label"] for r in rs), len(rs))
    comp = [r for r in rows if r["label"] == "complete"]; inc = [r for r in rows if r["label"] == "incomplete"]
    res["threads=%s" % (threads or "default")] = {
        "n": len(rows), "accuracy": acc(rows), "complete_recall": acc(comp), "incomplete_recall(cut-off guard)": acc(inc),
        "ms_p50": round(float(np.percentile(ms, 50)), 1), "ms_p90": round(float(np.percentile(ms, 90)), 1),
    }
    res["rows"] = rows
print(json.dumps({k: v for k, v in res.items() if k != "rows"}, indent=1))
if out:
    json.dump(res, open(out, "w"), indent=1)
