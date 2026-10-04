# align.py: listen-proxy pass 2 (local CPU, no API, no cost), 2026-10-04.
# Per clip:
#   ctc  : LM-free greedy decode with a Hindi-native acoustic model (Harveenchadha/vakyansh-wav2vec2-hindi-him-4200, MIT,
#          @ e2568c3f). No language model, so unlike gpt-transcribe it cannot "repair" a mispronounced word: its CER on
#          the Hindi words is an accent/articulation proxy, not a transcription score.
#   fa   : CTC forced alignment of the reference line (English words given as their Indian Devanagari spelling, e.g.
#          total -> टोटल) -> per-word start/end and a goodness-of-pronunciation score
#          gop = mean over the word's frames of (log p(aligned label) - max log p) (0 = the Hindi model is certain).
#   spk  : microsoft/wavlm-base-plus-sv x-vectors (@ feb593a6): cosine(English-word audio, Hindi-word audio) in the
#          same clip, cosine(first half, second half), and the clip embedding (for cross-line consistency per voice)
#   f0   : praat (parselmouth) median F0 of English-word vs Hindi-word frames, in semitones apart
# Output: align/<clip id>.json.  Run: python3 docs/research/voice/v3/screen/align.py
import json, os, re, sys, unicodedata, time
import numpy as np, torch
SP = os.environ.get("ALIGN_SP", "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad")
sys.path.insert(0, SP + "/py")
DEV = "cuda" if torch.cuda.is_available() else "cpu"
import parselmouth
from transformers import Wav2Vec2ForCTC, Wav2Vec2FeatureExtractor, WavLMForXVector
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from collect import clips, pcm16k as _pcm16k_ffmpeg
import shutil


def pcm16k(f):
    # the GPU job has no ffmpeg (apt is locked right after boot); every clip is WAV, so decode + polyphase resample there
    if shutil.which("ffmpeg"): return _pcm16k_ffmpeg(f)
    import soundfile as sf
    from math import gcd
    from scipy.signal import resample_poly
    y, sr = sf.read(f, dtype="float32", always_2d=True); y = y.mean(1)
    if sr != 16000: g = gcd(sr, 16000); y = resample_poly(y, 16000 // g, sr // g)
    return np.clip(y * 32768, -32768, 32767).astype(np.int16)
OUT = os.path.join(HERE, "align"); os.makedirs(OUT, exist_ok=True)
HF = os.environ.get("ALIGN_HF", SP + "/hf")
from huggingface_hub import snapshot_download
CTC = snapshot_download("Harveenchadha/vakyansh-wav2vec2-hindi-him-4200", revision="e2568c3f7868d8aa3aaabcf28fa100d10d54c170", cache_dir=HF, allow_patterns=["*.json", "pytorch_model.bin"])
SV = snapshot_download("microsoft/wavlm-base-plus-sv", revision="feb593a6c23c1cc3d9510425c29b0a14d2b07b1e", cache_dir=HF, allow_patterns=["*.json", "pytorch_model.bin"])
torch.set_num_threads(4)
ctc = Wav2Vec2ForCTC.from_pretrained(CTC).eval().to(DEV); fe = Wav2Vec2FeatureExtractor.from_pretrained(CTC)
VOC = json.load(open(CTC + "/vocab.json")); INV = {v: k for k, v in VOC.items()}; BLANK = VOC["<s>"]; SEP = VOC["|"]  # this fairseq-exported model emits <s> (id 0) as the CTC blank, not its config's pad id
sv = WavLMForXVector.from_pretrained(SV).eval().to(DEV); sfe = Wav2Vec2FeatureExtractor.from_pretrained(SV)
EN = {"tens": "टेंस", "total": "टोटल", "cold": "कोल्ड", "drink": "ड्रिंक", "burp": "बर्प", "divide": "डिवाइड", "pizza": "पिज़्ज़ा"}
PUNCT = "।,!?.;:"


def ref_words(text):
    out = []
    for raw in text.split():
        core = raw.strip(PUNCT + "\"'")
        if not core: continue
        lat = bool(re.search(r"[A-Za-z]", core))
        dev = EN[core.lower()] if lat else core
        out.append({"ref": core, "en": lat, "dev": dev, "clause_end": raw[-1] in PUNCT, "punct": raw[-1] if raw[-1] in PUNCT else ""})
    return out


def toks(dev):
    return [VOC[ch] for ch in unicodedata.normalize("NFD", dev) if ch in VOC]


def viterbi_fast(lp, labels):
    # standard CTC forced alignment over the blank-interleaved label sequence
    T = lp.shape[0]; S = 2 * len(labels) + 1
    ext = np.array([BLANK if i % 2 == 0 else labels[i // 2] for i in range(S)])
    skip = np.zeros(S, bool)
    for s in range(2, S):
        skip[s] = ext[s] != BLANK and ext[s] != ext[s - 2]
    NEG = -1e30; dp = np.full(S, NEG); dp[0] = lp[0, ext[0]]
    if S > 1: dp[1] = lp[0, ext[1]]
    bp = np.zeros((T, S), dtype=np.int8)
    for t in range(1, T):
        a = dp; b = np.concatenate([[NEG], dp[:-1]]); c = np.concatenate([[NEG, NEG], dp[:-2]]); c = np.where(skip, c, NEG)
        st = np.stack([a, b, c]); arg = st.argmax(0); dp = st.max(0) + lp[t, ext]; bp[t] = arg
    s = S - 1 if S == 1 or dp[S - 1] >= dp[S - 2] else S - 2
    path = np.zeros(T, int)
    for t in range(T - 1, -1, -1):
        path[t] = s; s -= int(bp[t, s])
    return path, ext


def emb(x):
    if len(x) < 16000 * 0.25: return None
    with torch.no_grad():
        i = sfe(x.astype(np.float32) / 32768, sampling_rate=16000, return_tensors="pt")
        e = sv(**{k: v.to(DEV) for k, v in i.items()}).embeddings[0].cpu()
    return torch.nn.functional.normalize(e, dim=-1).numpy()


def cos(a, b): return None if a is None or b is None else round(float(np.dot(a, b)), 4)


def one(c):
    p = os.path.join(OUT, c["id"] + ".json")
    if os.path.exists(p): return
    x = pcm16k(c["file"]); xf = x.astype(np.float32) / 32768
    with torch.no_grad():
        iv = fe(xf, sampling_rate=16000, return_tensors="pt").input_values
        lp = torch.log_softmax(ctc(iv.to(DEV)).logits[0].float(), -1).cpu().numpy()
    T = lp.shape[0]; fps = T / (len(x) / 16000)
    g = lp.argmax(-1); dec = []; last = -1
    for k in g:
        if k != last and k != BLANK: dec.append(INV[int(k)])
        last = k
    greedy = unicodedata.normalize("NFC", "".join(dec).replace("|", " ")).strip()
    W = ref_words(c["text"])
    labels, owner = [], []
    for i, w in enumerate(W):
        if i: labels.append(SEP); owner.append(-1)
        for t in toks(w["dev"]): labels.append(t); owner.append(i)
    path, ext = viterbi_fast(lp, labels)
    mx = lp.max(-1)
    frames = {i: [] for i in range(len(W))}
    for t, s in enumerate(path):
        if s % 2 == 1:
            o = owner[s // 2]
            if o >= 0: frames[o].append(t)
    for i, w in enumerate(W):
        f = frames[i]
        if f:
            w["s"] = round(f[0] / fps, 3); w["e"] = round((f[-1] + 1) / fps, 3)
            w["gop"] = round(float(np.mean([lp[t, ext[path[t]]] - mx[t] for t in f])), 3)
        else: w["s"] = w["e"] = None; w["gop"] = None
    # speaker / pitch
    def cat(sel):
        segs = [x[int(w["s"] * 16000):int(w["e"] * 16000)] for w in W if w["s"] is not None and sel(w)]
        return np.concatenate(segs) if segs else np.zeros(0, np.int16)
    en_a, hi_a = cat(lambda w: w["en"]), cat(lambda w: not w["en"])
    sp_lo = int(W[0]["s"] * 16000) if W[0]["s"] is not None else 0
    sp_hi = int(W[-1]["e"] * 16000) if W[-1]["e"] is not None else len(x)
    mid = (sp_lo + sp_hi) // 2
    e_all = emb(x[sp_lo:sp_hi]); e_en = emb(en_a); e_hi = emb(hi_a); e_h1 = emb(x[sp_lo:mid]); e_h2 = emb(x[mid:sp_hi])
    snd = parselmouth.Sound(xf.astype(np.float64), 16000); pt = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=500)
    f0 = pt.selected_array["frequency"]; ts = pt.xs()
    def med(sel):
        v = [f0[k] for k, t in enumerate(ts) if f0[k] > 0 and any(w["s"] is not None and w["s"] <= t < w["e"] and sel(w) for w in W)]
        return float(np.median(v)) if len(v) >= 5 else None
    fe_, fh_ = med(lambda w: w["en"]), med(lambda w: not w["en"])
    voiced = f0[f0 > 0]
    r = {"id": c["id"], "greedy": greedy, "words": W, "fps": round(fps, 2),
         "spk": {"en_vs_hi": cos(e_en, e_hi), "half1_vs_half2": cos(e_h1, e_h2), "en_s": round(len(en_a) / 16000, 2)},
         "emb": None if e_all is None else [round(float(v), 5) for v in e_all],
         "f0": {"en_hz": fe_, "hi_hz": fh_, "en_minus_hi_st": None if not (fe_ and fh_) else round(12 * np.log2(fe_ / fh_), 2),
                "median_hz": float(np.median(voiced)) if len(voiced) else None,
                "range_st": float(12 * np.log2(np.percentile(voiced, 95) / np.percentile(voiced, 5))) if len(voiced) > 10 else None}}
    json.dump(r, open(p, "w"), ensure_ascii=False)


if __name__ == "__main__":
    C = clips(); t = time.time()
    if os.environ.get("CLIP_ROOT"):  # GPU job: same clip list, files re-rooted under the unpacked job (scripts in screen/gpu-job/)
        RR = os.environ["CLIP_ROOT"]
        for c in C:
            c["file"] = os.path.join(RR, "r1", os.path.basename(c["file"])) if c["src"] == "round1" else os.path.join(RR, "renders", c["file"].split("/renders/", 1)[1])
    if len(sys.argv) > 1: C = [c for c in C if sys.argv[1] in c["id"]]
    for i, c in enumerate(C):
        one(c)
        if i % 20 == 0: print(i, round(time.time() - t), flush=True)
    print("done", len(C))
