"""Offline forced alignment of the evidence TTS sentence -> a viseme timeline (build-time only; nothing ships).

    python3 scripts/character/align.py [--looks teal,slate,plum]

Why: the M0 RMS lip driver cannot close for p / b / m, so a clip driven by it measures the driver, not the rig. This
emits the visemes the rig already has (PP / FF / O ...) from the sentence actually spoken, so the evidence clip
exercises them. Method: character-level CTC forced alignment (Viterbi over the CTC trellis, our own ~40 lines) with
facebook/wav2vec2-base-960h (Apache-2.0, English letters). Hinglish is written in Latin letters here, so the letter
CTC aligns it acceptably for viseme timing [U: not a phonetician's alignment; no ground truth was measured].
Romanised letters -> visemes by digraph rules below. Output: docs/design/teacher/renders/audio/<look>.align.json.
Model cache: $HF_HOME (default /tmp/claude-0/char/hf).
"""
import json, os, re, subprocess, sys
import numpy as np

os.environ.setdefault("HF_HOME", "/tmp/claude-0/char/hf")
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

AUD = "docs/design/teacher/renders/audio"
MODEL = "facebook/wav2vec2-base-960h"
looks = sys.argv[sys.argv.index("--looks") + 1].split(",") if "--looks" in sys.argv else ["teal", "slate", "plum"]
sent = json.load(open(os.path.join(AUD, "sentence.json")))["sentence"]

proc = Wav2Vec2Processor.from_pretrained(MODEL)
model = Wav2Vec2ForCTC.from_pretrained(MODEL).eval()
vocab = proc.tokenizer.get_vocab()
blank = vocab["<pad>"]

# ------------------------------------------------------------------ romanised Hinglish -> visemes (Oculus 15)
DIGRAPH = [("ch", "CH"), ("sh", "CH"), ("jh", "CH"), ("th", "DD"), ("dh", "DD"), ("kh", "kk"), ("gh", "kk"),
           ("bh", "PP"), ("ph", "FF"), ("aa", "aa"), ("ee", "I"), ("oo", "U"), ("ai", "E"), ("au", "O")]
SINGLE = {"p": "PP", "b": "PP", "m": "PP", "f": "FF", "v": "FF", "w": "U", "t": "DD", "d": "DD", "n": "nn", "l": "nn",
          "k": "kk", "g": "kk", "q": "kk", "c": "kk", "x": "kk", "h": "kk", "j": "CH", "z": "SS", "s": "SS", "r": "RR",
          "y": "I", "a": "aa", "e": "E", "i": "I", "o": "O", "u": "U"}


def units(word):
    out, i = [], 0
    while i < len(word):
        two = word[i:i + 2]
        hit = next((v for d, v in DIGRAPH if d == two), None)
        if hit:
            out.append((i, i + 2, hit)); i += 2
        else:
            if word[i] in SINGLE:
                out.append((i, i + 1, SINGLE[word[i]]))
            i += 1
    return out


def ctc_align(logp, tokens):
    """Viterbi forced alignment over the CTC trellis. logp (T, V), tokens list of ids. Returns frame span per token."""
    T = logp.shape[0]
    S = 2 * len(tokens) + 1
    ext = [blank if s % 2 == 0 else tokens[s // 2] for s in range(S)]
    NEG = -1e30
    dp = np.full((T, S), NEG)
    bp = np.zeros((T, S), np.int32)
    dp[0, 0] = logp[0, ext[0]]
    dp[0, 1] = logp[0, ext[1]]
    for t in range(1, T):
        for s in range(S):
            best, arg = dp[t - 1, s], s
            if s >= 1 and dp[t - 1, s - 1] > best:
                best, arg = dp[t - 1, s - 1], s - 1
            if s >= 2 and ext[s] != blank and ext[s] != ext[s - 2] and dp[t - 1, s - 2] > best:
                best, arg = dp[t - 1, s - 2], s - 2
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


for look in looks:
    mp3 = os.path.join(AUD, f"{look}.mp3")
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, np.float32)
    with torch.no_grad():
        inp = proc(x, sampling_rate=16000, return_tensors="pt")
        logits = model(inp.input_values).logits[0]
    logp = torch.log_softmax(logits, -1).numpy()
    fr = len(x) / 16000 / logp.shape[0]                       # seconds per CTC frame (~20 ms)
    words = re.findall(r"[a-z]+", sent.lower())
    toks, owner = [], []
    for wi, w in enumerate(words):
        for ci, ch in enumerate(w):
            toks.append(vocab[ch.upper()]); owner.append((wi, ci))
        if wi < len(words) - 1:
            toks.append(vocab["|"]); owner.append((wi, -1))
    spans = ctc_align(logp, toks)
    # letter times; letters the trellis skipped interpolate from neighbours
    lt = {}
    for (wi, ci), sp in zip(owner, spans):
        if ci >= 0 and sp[0] is not None:
            lt[(wi, ci)] = (sp[0] * fr, sp[1] * fr)
    ev = []
    for wi, w in enumerate(words):
        known = [(ci, lt[(wi, ci)]) for ci in range(len(w)) if (wi, ci) in lt]
        if not known:
            continue
        for a, b, vis in units(w):
            ts = [lt[(wi, c)] for c in range(a, b) if (wi, c) in lt]
            if not ts:
                ci0 = min(known, key=lambda k: abs(k[0] - a))[1]
                ts = [ci0]
            t0, t1 = min(t[0] for t in ts), max(t[1] for t in ts)
            ev.append({"word": w, "letters": w[a:b], "viseme": "viseme_" + vis, "t0": round(t0, 3), "t1": round(max(t1, t0 + 0.04), 3)})
    # word spans (start of first letter .. end of last letter)
    wspan = []
    for wi, w in enumerate(words):
        ts = [lt[(wi, c)] for c in range(len(w)) if (wi, c) in lt]
        if ts:
            wspan.append({"word": w, "t0": round(min(t[0] for t in ts), 3), "t1": round(max(t[1] for t in ts), 3)})
    out = {"look": look, "model": MODEL, "modelLicence": "Apache-2.0", "method": "CTC Viterbi forced alignment, romanised letters",
           "secondsPerFrame": round(fr, 5), "duration": round(len(x) / 16000, 3), "words": wspan, "visemes": ev}
    json.dump(out, open(os.path.join(AUD, f"{look}.align.json"), "w"), indent=1)
    nb = sum(e["viseme"] == "viseme_PP" for e in ev)
    print(f"[align] {look}: {len(wspan)}/{len(words)} words, {len(ev)} visemes ({nb} bilabial), {out['duration']} s", flush=True)
