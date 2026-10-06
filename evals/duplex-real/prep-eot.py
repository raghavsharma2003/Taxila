# duplex-real: unpack LiveKit EOT-Bench (livekit/eot-bench-data, CC BY 4.0, public validation sample, seed 20260603) Hindi
# rows into <out>/<id>.s16 (16 kHz mono s16le, the real recorded turn) + <out>/index.json (silence spans, word times from the
# dataset's own transcript, the agent's previous line). REAL ADULT SPEECH (human-to-agent task conversations, Hindi with
# some English), not children. Every silence span but the last is a HOLD (the speaker went on); the last is the turn end.
#   python3 -I evals/duplex-real/prep-eot.py <eot-hi.parquet> <out_dir>
import sys, os, io, json, wave
import pyarrow.parquet as pq

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
rows = pq.read_table(src).to_pylist()
index = []
for r in rows:
    w = wave.open(io.BytesIO(r["audio"]["bytes"]))
    assert w.getframerate() == 16000 and w.getnchannels() == 1 and w.getsampwidth() == 2
    pcm = w.readframes(w.getnframes())
    with open(os.path.join(out, r["id"] + ".s16"), "wb") as f:
        f.write(pcm)
    prev = [m.get("content") for m in (r.get("messages") or []) if m.get("role") == "assistant" and m.get("content")]
    index.append({
        "id": r["id"], "durationMs": round(len(pcm) / 32), "language": r["language"],
        "spans": [[round(s["start"] * 1000), round(s["end"] * 1000)] for s in r["silence_spans"]],
        "words": [[round(x["start"] * 1000), round(x["end"] * 1000), x["word"].strip()] for x in (r.get("words") or [])],
        "herPrev": prev[-1] if prev else None,
    })
with open(os.path.join(out, "index.json"), "w") as f:
    json.dump({"corpus": "LiveKit EOT-Bench public sample (livekit/eot-bench-data, CC BY 4.0)", "language": "hi", "rows": index}, f, ensure_ascii=False)
print(len(index), "rows")
