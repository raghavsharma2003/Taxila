"""Acoustic summary of P1 teacher replies (RELATIONAL-OS §14). PCM16 mono 24 kHz from taxila-realtime.

Per clip: duration, voiced F0 median (Hz), F0 spread (SD in semitones re the clip median), F0 range (p90-p10 st),
RMS energy (dBFS, voiced frames), and words/sec (transcript words / audio seconds).
F0 is a plain normalised-autocorrelation tracker (40 ms frames, 10 ms hop, 75-500 Hz, voicing threshold 0.5).
It is coarse; it is used only to compare ARMS on the same voice, never as an absolute measure.

    python3 evals/relational-os/acoustics.py evals/relational-os/results/p1-affect-<date>.json
"""
import json, sys, os, math
import numpy as np

SR = 24000

def f0_track(x):
    fl, hop = int(0.04 * SR), int(0.01 * SR)
    lo, hi = int(SR / 500), int(SR / 75)
    f0s, rms = [], []
    for s in range(0, len(x) - fl, hop):
        fr = x[s:s + fl] - np.mean(x[s:s + fl])
        e = np.sqrt(np.mean(fr ** 2))
        if e < 1e-3:
            continue
        ac = np.correlate(fr, fr, "full")[fl - 1:]
        ac = ac / (ac[0] + 1e-9)
        seg = ac[lo:hi]
        k = int(np.argmax(seg))
        if seg[k] > 0.5:
            f0s.append(SR / (k + lo)); rms.append(e)
    return np.array(f0s), np.array(rms)

def summarise(path, words):
    x = np.frombuffer(open(path, "rb").read(), dtype="<i2").astype(np.float64) / 32768.0
    dur = len(x) / SR
    f0, rms = f0_track(x)
    if len(f0) < 20:
        return None
    med = float(np.median(f0))
    st = 12 * np.log2(f0 / med)
    return {"dur": dur, "f0med": med, "f0sd_st": float(np.std(st)),
            "f0range_st": float(np.percentile(st, 90) - np.percentile(st, 10)),
            "rms_db": float(20 * np.log10(np.mean(rms) + 1e-9)), "wps": words / dur if dur else 0}

def main(fn):
    d = json.load(open(fn))
    adir = os.path.join(os.path.dirname(fn), "p1-audio-" + d["date"])
    rows = []
    for r in d["results"]:
        if r.get("err") or not r["out"]:
            continue
        last = r["out"][-1]
        if not last.get("audio"):
            continue
        s = summarise(os.path.join(adir, last["audio"]), len(last["text"].split()))
        if s:
            rows.append({"id": r["id"], "arm": r["arm"], "rep": r["rep"], **s})
    keys = ["f0med", "f0sd_st", "f0range_st", "rms_db", "wps", "dur"]
    print("scenario  arm  n  " + "  ".join(f"{k:>10}" for k in keys))
    for sid in dict.fromkeys(r["id"] for r in rows):
        for arm in "ABC":
            g = [r for r in rows if r["id"] == sid and r["arm"] == arm]
            if g:
                print(f"{sid:9} {arm:>3} {len(g):2}  " + "  ".join(f"{np.mean([x[k] for x in g]):10.2f}" for k in keys))
    print("\nall-scenario arm means")
    for arm in "ABC":
        g = [r for r in rows if r["arm"] == arm]
        print(f"{arm}: n={len(g)} " + " ".join(f"{k}={np.mean([x[k] for x in g]):.2f}" for k in keys))
    # spread BETWEEN scenarios per arm: does the tag differentiate delivery across moments?
    print("\nbetween-scenario spread of per-scenario means (higher = deliveries differ more by moment)")
    for arm in "ABC":
        for k in ["f0med", "f0sd_st", "rms_db", "wps"]:
            ms = [np.mean([x[k] for x in rows if x["id"] == sid and x["arm"] == arm]) for sid in dict.fromkeys(r["id"] for r in rows)]
            print(f"{arm} {k:8} sd={np.std(ms):.3f} range={max(ms)-min(ms):.3f}")
    json.dump(rows, open(fn.replace(".json", "-acoustics.json"), "w"), indent=1)

if __name__ == "__main__":
    main(sys.argv[1])
