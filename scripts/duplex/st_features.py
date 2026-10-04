# TaxilaFDB acoustic features: Smart Turn v3.2 (pipecat-ai/smart-turn-v3, BSD-2) run on every rendered stream on a 100 ms
# grid over the CHILD-FLOOR window, causally (the window ends at the tick; nothing after t is read).
#   outputs per tick: p      Smart Turn's own end-of-turn probability (baseline B2 reads it)
#                     emb    the encoder's attention-pooled embedding (384-d, graph output sum_1) — stage B's audio branch
#                     h64    the classifier's hidden layer (64-d, gelu_7)
# Window = Pipecat's turn buffer: audio since the child floor opened (her hand-over, or 300 ms before a barge-in onset),
# the last 8 s of it, zero-padded at the beginning (smart-turn audio_utils.py). Grid: 100 ms where the child is not inside
# a scripted word, 300 ms inside words (consumers read the newest tick <= t, so voiced stretches are just sparser).
# The st32-emb.onnx graph is smart-turn-v3.2-cpu.onnx with two internal tensors exposed as outputs (voicesig placement
# expose.py method; logits identical). Output: FEAT/<streamId>.f32 (float32 rows [t, p, emb384, h64]) + FEAT/<id>.json.
#   python3 scripts/duplex/st_features.py [--workers 3] [--only substr]
import json, os, sys, glob, time
import numpy as np
from multiprocessing import Pool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stmel import logmel, window, SR

STREAMS = os.environ.get("TAXILA_FDB_STREAMS", "/tmp/taxila-fdb/streams")
FEAT = os.environ.get("TAXILA_FDB_FEAT", "/tmp/taxila-fdb/feat")
MODEL = os.environ.get("TAXILA_ST_EMB", "/tmp/taxila-fdb/models/st32-emb.onnx")
ROW = 2 + 384 + 64
_S = None


def sess():
    global _S
    if _S is None:
        import onnxruntime as ort
        so = ort.SessionOptions(); so.intra_op_num_threads = 1; so.inter_op_num_threads = 1
        _S = ort.InferenceSession(MODEL, so, providers=["CPUExecutionProvider"])
    return _S


def floor_window(g, end_ms):
    """(start_ms, from_ms): the child-floor window, or None for streams with no child floor."""
    if g.get("where") == "after_her":
        return g["herSpan"]["end"]
    if g.get("childOnset") is not None:
        return max(0, g["childOnset"] - 300)
    return None


def grid(g, start, end_ms):
    words = [(w["start"], w["end"]) for w in g.get("childWords", [])]
    ts, t = [], int(np.ceil((start + 100) / 100.0) * 100)
    while t <= end_ms:
        inside = any(a + 100 <= t <= b for a, b in words)
        if not inside or (t // 100) % 3 == 0:
            ts.append(t)
        t += 100
    return ts


def one(path):
    sid = os.path.basename(path)[:-5]
    out = os.path.join(FEAT, sid + ".f32")
    if os.path.exists(out):
        return sid, 0, 0.0
    d = json.load(open(path))
    g, end_ms = d["gold"], d["meta"]["endMs"]
    start = floor_window(g, end_ms)
    if start is None:
        json.dump({"id": sid, "rows": 0, "start": None}, open(os.path.join(FEAT, sid + ".json"), "w"))
        np.zeros((0, ROW), np.float32).tofile(out)
        return sid, 0, 0.0
    pcm = np.fromfile(path[:-5] + ".s16", dtype="<i2").astype(np.float32) / 32768.0
    ts = grid(g, start, end_ms)
    t0 = time.time()
    rows = np.zeros((len(ts), ROW), np.float32)
    s = sess()
    B = 8
    for i in range(0, len(ts), B):
        chunk = ts[i:i + B]
        mel = np.stack([logmel(window(pcm, int(t * SR / 1000), int(start * SR / 1000))) for t in chunk])
        lo, emb, h = s.run(None, {"input_features": mel})
        rows[i:i + len(chunk), 0] = chunk
        rows[i:i + len(chunk), 1] = lo[:, 0]
        rows[i:i + len(chunk), 2:386] = emb
        rows[i:i + len(chunk), 386:] = h
    rows.tofile(out + ".tmp"); os.replace(out + ".tmp", out)
    json.dump({"id": sid, "rows": len(ts), "start": start, "cols": ["t", "p", "emb384", "h64"], "model": os.path.basename(MODEL)}, open(os.path.join(FEAT, sid + ".json"), "w"))
    return sid, len(ts), time.time() - t0


if __name__ == "__main__":
    os.makedirs(FEAT, exist_ok=True)
    w = int(sys.argv[sys.argv.index("--workers") + 1]) if "--workers" in sys.argv else 3
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    files = sorted(glob.glob(os.path.join(STREAMS, "*.json")))
    if only:
        files = [f for f in files if only in f]
    t0, n, rows = time.time(), 0, 0
    with Pool(w) as pool:
        for sid, r, dt in pool.imap_unordered(one, files, chunksize=4):
            n += 1; rows += r
            if n % 100 == 0:
                print(f"{n}/{len(files)} streams, {rows} ticks, {time.time() - t0:.0f} s", flush=True)
    print(f"done: {n} streams, {rows} ticks in {time.time() - t0:.0f} s -> {FEAT}")
