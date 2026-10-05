"""Verify pass (2026-10-04): robustness of the filler detector to the capture chain a child's phone actually applies.
Re-downloads a few AMI TEST headset channels (CC BY 4.0, never trained on), applies one perturbation per condition, runs
the PRODUCT front-end (extract.mjs) and the shipped ONNX detector, and scores with train_filler.py's own metrics.
Every wav is deleted after extraction (numbers only).

Conditions (each a proxy, labelled as such; none is a real phone recording):
  clean        the original headset audio
  narrowband   300-3400 Hz, resampled through 8 kHz (Bluetooth HFP / GSM-like voice path)
  agc          fast AGC to -20 dBFS (attack 10 ms, release 300 ms, max +30 dB): browser/phone autoGainControl proxy
  ns           spectral-subtraction noise suppression after +15 dB SNR pink noise (noiseSuppression proxy)
  tv           another speaker (different meeting) mixed in at 10 dB below the owner: TV / sibling proxy
  phone        narrowband + agc + ns chain together

Metrics: word AUROC (oracle word boundaries), event precision/recall at the shipped threshold, and
interferenceRunsPerMin: detector runs in stretches where the channel owner is NOT talking (what TV/siblings cost).

usage: python3 perturb_eval.py <work_dir> <ami_feat_dir> <onnx> <thr>
"""
import json, os, subprocess, sys, urllib.request
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfiltfilt, resample_poly, stft, istft

sys.path.insert(0, os.path.dirname(__file__))
import train_filler as tf  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
BASE = "https://groups.inf.ed.ac.uk/ami/AMICorpusMirror/amicorpus"
CHANNELS = [("IS1008b", "A", 0), ("ES2005b", "B", 1), ("IS1009b", "C", 2), ("IS1000b", "B", 1)]
INTERFERER = ("IS1006b", 3)  # a different test meeting's speaker as the "TV"
RNG = np.random.default_rng(11)


def narrowband(x):
    y = resample_poly(x, 1, 2)
    y = sosfiltfilt(butter(6, [300, 3400], btype="band", fs=8000, output="sos"), y)
    return resample_poly(y, 2, 1).astype(np.float32)[: len(x)]


def agc(x, target_db=-20, attack=0.010, release=0.300, max_gain_db=30):
    # block AGC on 5 ms RMS blocks with asymmetric smoothing (sample-level loop is too slow in Python)
    B = 80
    n = len(x) // B * B
    r = np.sqrt((x[:n].reshape(-1, B) ** 2).mean(1) + 1e-12)
    a_a, a_r = np.exp(-B / (attack * 16000)), np.exp(-B / (release * 16000))
    env = np.empty_like(r); e = 1e-4
    for i, v in enumerate(r):
        c = a_a if v > e else a_r
        e = c * e + (1 - c) * v
        env[i] = e
    g = np.minimum(10 ** (max_gain_db / 20), 10 ** (target_db / 20) / np.maximum(env, 1e-6))
    gs = np.interp(np.arange(len(x)), np.arange(len(g)) * B + B / 2, g)
    return np.clip(x * gs, -1, 1).astype(np.float32)


def pink(n):
    w = RNG.standard_normal(n)
    f = np.fft.rfft(w)
    f /= np.sqrt(np.maximum(1, np.arange(len(f))))
    y = np.fft.irfft(f, n)
    return (y / np.std(y)).astype(np.float32)


def speech_rms(x):
    fr = x[: len(x) // 320 * 320].reshape(-1, 320)
    r = np.sqrt((fr ** 2).mean(1) + 1e-12)
    return float(np.percentile(r, 90))


def ns(x, snr_db=15):
    y = x + pink(len(x)) * speech_rms(x) / 10 ** (snr_db / 20)
    f, t, Z = stft(y, 16000, nperseg=512)
    mag = np.abs(Z)
    noise = np.percentile(mag, 10, axis=1, keepdims=True)
    g = np.maximum(0.1, 1 - 1.5 * noise / np.maximum(mag, 1e-9))
    _, out = istft(Z * g, 16000, nperseg=512)
    return out[: len(x)].astype(np.float32)


def get(meeting, ch, work):
    p = os.path.join(work, f"{meeting}.{ch}.wav")
    if not os.path.exists(p):
        urllib.request.urlretrieve(f"{BASE}/{meeting}/audio/{meeting}.Headset-{ch}.wav", p)
    x, sr = sf.read(p, dtype="float32")
    assert sr == 16000
    return x


def run(work, feat, onnx, thr):
    import onnxruntime as ort
    sess = ort.InferenceSession(onnx, providers=["CPUExecutionProvider"])
    inter = get(*INTERFERER, work)
    conds = {"clean": lambda x: x, "narrowband": narrowband, "agc": agc, "ns": ns,
             "tv": lambda x: x + np.resize(inter, len(x)) * (speech_rms(x) / max(1e-6, speech_rms(inter))) / 10 ** (10 / 20),
             "phone": lambda x: ns(agc(narrowband(x)))}
    out = {c: {"files": [], "preds": []} for c in conds}
    for meeting, agent, ch in CHANNELS:
        x = get(meeting, ch, work)
        src = os.path.join(feat, f"{meeting}.{agent}")
        meta = json.load(open(src + ".json"))
        for c, fn in conds.items():
            y = fn(x.copy())
            wav = os.path.join(work, f"p_{c}.wav")
            sf.write(wav, np.clip(y, -1, 1), 16000, subtype="PCM_16")
            stem = os.path.join(work, f"{meeting}.{agent}.{c}")
            r = subprocess.run(["node", os.path.join(ROOT, "evals/voicesig/train/extract.mjs"), wav, stem, src + ".regions.json"], capture_output=True, text=True)
            os.remove(wav)
            assert r.returncode == 0, r.stderr[-400:]
            j = json.load(open(stem + ".json"))
            j.update({k: meta[k] for k in ("corpus", "meeting", "speaker", "sex", "l1", "split", "words")})
            json.dump(j, open(stem + ".json", "w"))
            d = tf.load(stem)
            p = np.zeros(len(d["t"]), np.float32)
            for s0, s1 in zip(d["seg"][:-1], d["seg"][1:]):
                p[s0:s1] = sess.run(None, {"x": d["x"][s0:s1][None]})[0][0]
            out[c]["files"].append(d); out[c]["preds"].append(p)
            print(meeting, agent, c, flush=True)
        os.remove(os.path.join(work, f"{meeting}.{ch}.wav"))
    os.remove(os.path.join(work, f"{INTERFERER[0]}.{INTERFERER[1]}.wav"))
    res = {}
    for c, v in out.items():
        wt = tf.word_table(v["files"], v["preds"])
        ev = tf.runs_eval(v["files"], v["preds"], thr)
        # runs where the owner has no labelled word within +-1 s: interference / crosstalk fires
        ir = 0; mins = 0
        for d, p in zip(v["files"], v["preds"]):
            own = np.zeros(len(d["t"]), bool)
            for s, e, l, _ in d["meta"]["words"]:
                i0, i1 = np.searchsorted(d["t"], s * 1000 - 1000), np.searchsorted(d["t"], e * 1000 + 1000)
                own[i0:i1] = True
            on = (p >= thr) & (d["speech"] > 0) & ~own
            mins += (~own).sum() * 0.02 / 60
            i = 0
            while i < len(on):
                if on[i]:
                    j = i
                    while j < len(on) and on[j]:
                        j += 1
                    ir += (j - i) >= 10
                    i = j
                else:
                    i += 1
        res[c] = {"wordAuroc": round(tf.auroc([r["p"] for r in wt], [r["y"] for r in wt]), 4), "event": ev,
                  "interferenceRunsPerMin": round(ir / max(1e-9, mins), 3), "nonOwnMin": round(float(mins), 1)}
        print(c, json.dumps(res[c]), flush=True)
    return res


if __name__ == "__main__":
    work, feat, onnx, thr = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
    os.makedirs(work, exist_ok=True)
    r = run(work, feat, onnx, thr)
    json.dump({"date": "2026-10-04", "channels": CHANNELS, "interferer": INTERFERER, "thr": thr, "results": r}, open(os.path.join(work, "perturb.json"), "w"), indent=1)
