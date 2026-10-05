"""Forced-alignment timing reference for the PRODUCT-PATH lip-sync segments (ship5 p2-face; eval only, nothing ships).

    HF_HOME=/tmp/claude-0/char/hf python3 evals/p2-face/ctc-product.py

For every reply segment evals/p2-face/lipsync-product.mjs saved (out/product/<tag>-<k>.{pcm,json}: the audio the real
player scheduled, laid on the performance clock, and the reply's Roman text), a character CTC Viterbi forced alignment
with facebook/wav2vec2-base-960h (Apache-2.0) gives letter times from her own product audio, mapped to Azure-style
viseme ids with the SAME trellis and letter->viseme rules as evals/face-puppet/ctc-align.py (copied here: that script
runs at import). This is the timing the judged clips were driven by, so the product mouth can be scored against it.
Skipped: Devanagari text (the English letter CTC cannot align it), text with digits (the spoken form of a digit is not
in the text, so the alignment would stretch its neighbours), and segments with no text.
"""
import json, os, re, glob
import numpy as np

os.environ.setdefault("HF_HOME", "/tmp/claude-0/char/hf")
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

MODEL = "facebook/wav2vec2-base-960h"
proc = Wav2Vec2Processor.from_pretrained(MODEL)
model = Wav2Vec2ForCTC.from_pretrained(MODEL).eval()
vocab = proc.tokenizer.get_vocab()
blank = vocab["<pad>"]

DIGRAPH = [("ch", 16), ("sh", 16), ("jh", 16), ("th", 19), ("dh", 19), ("kh", 20), ("gh", 20), ("bh", 21), ("ph", 18),
           ("aa", 2), ("ee", 6), ("oo", 7), ("ai", 11), ("au", 9)]
SINGLE = {"p": 21, "b": 21, "m": 21, "f": 18, "v": 18, "w": 7, "t": 19, "d": 19, "n": 19, "l": 14, "k": 20, "g": 20,
          "q": 20, "c": 20, "x": 20, "h": 12, "j": 16, "z": 15, "s": 15, "r": 13, "y": 6, "a": 1, "e": 4, "i": 6, "o": 8, "u": 7}


def units(word):
    out, i = [], 0
    while i < len(word):
        two = word[i:i + 2]
        hit = next((v for d, v in DIGRAPH if d == two), None)
        if hit is not None:
            out.append((i, i + 2, hit)); i += 2
        else:
            if word[i] in SINGLE:
                out.append((i, i + 1, SINGLE[word[i]]))
            i += 1
    return out


def ctc_align(logp, tokens):
    T = logp.shape[0]
    S = 2 * len(tokens) + 1
    ext = [blank if s % 2 == 0 else tokens[s // 2] for s in range(S)]
    NEG = -1e30
    dp = np.full((T, S), NEG)
    bp = np.zeros((T, S), np.int32)
    dp[0, 0] = logp[0, ext[0]]
    dp[0, 1] = logp[0, ext[1]]
    for t in range(1, T):
        prev = dp[t - 1]
        for s in range(S):
            best, arg = prev[s], s
            if s >= 1 and prev[s - 1] > best:
                best, arg = prev[s - 1], s - 1
            if s >= 2 and ext[s] != blank and ext[s] != ext[s - 2] and prev[s - 2] > best:
                best, arg = prev[s - 2], s - 2
            dp[t, s] = best + logp[t, ext[s]]
            bp[t, s] = arg
    s = S - 1 if dp[T - 1, S - 1] > dp[T - 1, S - 2] else S - 2
    path = [s]
    for t in range(T - 1, 0, -1):
        s = bp[t, s]
        path.append(s)
    path = path[::-1]
    spans = [[None, None] for _ in tokens]
    for t, s in enumerate(path):
        if s % 2 == 1:
            k = s // 2
            if spans[k][0] is None:
                spans[k][0] = t
            spans[k][1] = t + 1
    return spans



D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "product")
for jf in sorted(glob.glob(f"{D}/*-[0-9]*.json")):
    if jf.endswith(".ctc.json"):
        continue
    meta = json.load(open(jf))
    text = meta.get("text") or ""
    why = "no text" if not text else "devanagari" if re.search(r"[\u0900-\u097F]", text) else "digits" if re.search(r"\d", text) else None
    if why:
        json.dump({"skipped": why}, open(jf.replace(".json", ".ctc.json"), "w"))
        print(os.path.basename(jf), "skipped:", why, flush=True)
        continue
    raw = np.fromfile(jf.replace(".json", ".pcm"), dtype="<i2").astype(np.float32) / 32768
    x = np.interp(np.arange(0, len(raw) * 2 / 3) * 1.5, np.arange(len(raw)), raw).astype(np.float32)  # 24k -> 16k
    with torch.no_grad():
        logits = model(proc(x, sampling_rate=16000, return_tensors="pt").input_values).logits[0]
    logp = torch.log_softmax(logits, -1).numpy()
    fr = len(x) / 16000 / logp.shape[0]
    words = re.findall(r"[a-z]+", text.lower().replace("'", ""))
    toks, owner = [], []
    for wi, w in enumerate(words):
        for ci, ch in enumerate(w):
            toks.append(vocab[ch.upper()]); owner.append((wi, ci))
        if wi < len(words) - 1:
            toks.append(vocab["|"]); owner.append((wi, -1))
    spans = ctc_align(logp, toks)
    lt = {(wi, ci): (sp[0] * fr, sp[1] * fr) for (wi, ci), sp in zip(owner, spans) if ci >= 0 and sp[0] is not None}
    ev, wspan = [], []
    for wi, w in enumerate(words):
        known = [(ci, lt[(wi, ci)]) for ci in range(len(w)) if (wi, ci) in lt]
        if not known:
            continue
        wspan.append({"word": w, "t0": round(min(t[0] for _, t in known), 3), "t1": round(max(t[1] for _, t in known), 3)})
        for a, b, vid in units(w):
            ts = [lt[(wi, c)] for c in range(a, b) if (wi, c) in lt] or [min(known, key=lambda k: abs(k[0] - a))[1]]
            ev.append({"ms": round(min(t[0] for t in ts) * 1000, 1), "id": vid})
        ev.append({"ms": round(wspan[-1]["t1"] * 1000 + 40, 1), "id": 0})
    ev.sort(key=lambda e: e["ms"])
    json.dump({"model": MODEL, "secondsPerFrame": round(fr, 5), "words": wspan, "visemes": ev}, open(jf.replace(".json", ".ctc.json"), "w"), indent=1)
    print(os.path.basename(jf), len(wspan), "words", len(ev), "events", flush=True)
