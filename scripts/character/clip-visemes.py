"""Viseme + word sidecars for her pre-rendered clips (round 7 face-prerendered-clip-visemes).

    HF_HOME=/tmp/claude-0/char/hf python3 scripts/character/clip-visemes.py public/audio/hello-*.mp3

For each clip: decode to 16 kHz mono (ffmpeg), run a letter CTC model (facebook/wav2vec2-base-960h, Apache-2.0) over
the clip's own audio, take the greedy letter path with frame times (no transcript needed: the Hindi and Hinglish clips
decode to rough Roman letters, which is all a viseme needs), split it into words at the model's word separator, and map
letters to the Azure viseme ids the live TTS path sends (the digraph rules of evals/face-puppet/ctc-align.py). Writes
<clip>.visemes.json {rev, durMs, model, visemes: [{ms, id}], words: [{ms, durMs, text}]}, every ms from the clip's first
sample, which src/face-puppet/clipBridge.ts anchors to the moment that sample sounds.
"""
import json, os, subprocess, sys
import numpy as np

os.environ.setdefault("HF_HOME", "/tmp/claude-0/char/hf")
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

MODEL = "facebook/wav2vec2-base-960h"
DIGRAPH = [("ch", 16), ("sh", 16), ("jh", 16), ("th", 19), ("dh", 19), ("kh", 20), ("gh", 20), ("bh", 21), ("ph", 18),
           ("aa", 2), ("ee", 6), ("oo", 7), ("ai", 11), ("au", 9)]
SINGLE = {"p": 21, "b": 21, "m": 21, "f": 18, "v": 18, "w": 7, "t": 19, "d": 19, "n": 19, "l": 14, "k": 20, "g": 20,
          "q": 20, "c": 20, "x": 20, "h": 12, "j": 16, "z": 15, "s": 15, "r": 13, "y": 6, "a": 1, "e": 4, "i": 6, "o": 8, "u": 7}


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768


def letters(x, proc, model):
    with torch.no_grad():
        logits = model(proc(x, sampling_rate=16000, return_tensors="pt").input_values).logits[0]
    ids = logits.argmax(-1).numpy()
    fr = len(x) / 16000 / len(ids)
    inv = {v: k for k, v in proc.tokenizer.get_vocab().items()}
    blank = proc.tokenizer.pad_token_id
    out, prev = [], None
    for t, i in enumerate(ids):  # collapse repeats; keep each letter's first frame and its run end
        if i != prev and i != blank:
            out.append([inv[int(i)].lower(), t * fr, (t + 1) * fr])
        elif i == prev and i != blank and out:
            out[-1][2] = (t + 1) * fr
        prev = i
    return out, fr


def sidecar(path, proc, model):
    x = decode(path)
    lets, fr = letters(x, proc, model)
    words, cur = [], []
    for ch, t0, t1 in lets + [["|", 0, 0]]:
        if ch == "|":
            if cur:
                words.append(cur)
            cur = []
        elif ch.isalpha():
            cur.append((ch, t0, t1))
    vis, wout = [], []
    for w in words:
        text = "".join(c for c, _, _ in w)
        w0, w1 = w[0][1], w[-1][2]
        wout.append({"ms": round(w0 * 1000), "durMs": round((w1 - w0) * 1000), "text": text})
        i = 0
        while i < len(w):
            two = text[i:i + 2]
            hit = next((v for d, v in DIGRAPH if d == two), None)
            if hit is not None:
                vis.append({"ms": round(w[i][1] * 1000), "id": hit}); i += 2; continue
            if text[i] in SINGLE:
                vis.append({"ms": round(w[i][1] * 1000), "id": SINGLE[text[i]]})
            i += 1
        vis.append({"ms": round(w1 * 1000 + 40), "id": 0})  # the mouth closes after each word
    vis.sort(key=lambda e: e["ms"])
    return {"rev": 1, "durMs": round(len(x) / 16), "model": MODEL, "secondsPerFrame": round(fr, 5), "visemes": vis, "words": wout}


if __name__ == "__main__":
    proc = Wav2Vec2Processor.from_pretrained(MODEL)
    model = Wav2Vec2ForCTC.from_pretrained(MODEL).eval()
    for p in sys.argv[1:]:
        s = sidecar(p, proc, model)
        out = os.path.splitext(p)[0] + ".visemes.json"
        json.dump(s, open(out, "w"), indent=1)
        print(out, len(s["words"]), "words", len(s["visemes"]), "visemes", s["durMs"], "ms:", " ".join(w["text"] for w in s["words"]))
