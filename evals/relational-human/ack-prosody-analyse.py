# Round 3, stream relational-human: the acknowledgement's pitch contour. For every clip ack-prosody.mjs wrote (s16le mono
# 24 kHz), a normalised-autocorrelation F0 track (10 ms hop, 40 ms window, 75-500 Hz, corr >= 0.45, median-5), then on voiced frames:
#   final_slope_st_s  linear slope (semitones per second) over the last 40% of voiced frames (the terminal contour)
#   final_vs_body_st  median F0 of the last 150 ms of voice minus the median of the rest (semitones): <-2 falling, >+2 rising
#   dur_ms            clip length; voiced_ms
# Usage: python3 -I evals/relational-human/ack-prosody-analyse.py DIR   → DIR/prosody.json + a table on stdout
import json, sys, os
import numpy as np

SR = 24000
def yin_track(x, sr=SR, hop=240, win=960, fmin=75, fmax=500, thr=0.45):
    """Normalised-autocorrelation F0 (clean TTS): voiced when the best peak in the lag range exceeds `thr` and RMS > 0.005;
    a 5-frame median filter removes octave flips."""
    tmin, tmax = int(sr / fmax), int(sr / fmin)
    out = []
    for start in range(0, len(x) - win - tmax, hop):
        a = x[start:start + win]
        if np.sqrt(np.mean(a ** 2)) < 0.005:
            out.append(np.nan); continue
        best, bt = 0.0, 0
        ea = np.dot(a, a)
        for t in range(tmin, tmax + 1):
            b = x[start + t:start + t + win]
            c = np.dot(a, b) / (np.sqrt(ea * np.dot(b, b)) + 1e-12)
            if c > best:
                best, bt = c, t
        out.append(sr / bt if best >= thr else np.nan)
    f = np.array(out)
    g = f.copy()
    for i in range(len(f)):
        w = f[max(0, i - 2):i + 3]
        w = w[~np.isnan(w)]
        if not np.isnan(f[i]) and len(w):
            g[i] = np.median(w)
    return g

def st(f, ref):
    return 12 * np.log2(f / ref)

def analyse(path):
    x = np.frombuffer(open(path, "rb").read(), dtype="<i2").astype(np.float64) / 32768.0
    f0 = yin_track(x)
    v = np.where(~np.isnan(f0))[0]
    r = {"dur_ms": int(len(x) / SR * 1000), "voiced_ms": int(len(v) * 10)}
    if len(v) < 8:
        return {**r, "final_slope_st_s": None, "final_vs_body_st": None}
    fv = f0[v]
    ref = np.median(fv)
    semis = st(fv, ref)
    k = max(4, int(len(v) * 0.4))
    tt = v[-k:] * 0.01
    slope = float(np.polyfit(tt, semis[-k:], 1)[0])
    last = semis[-15:] if len(semis) > 20 else semis[-max(3, len(semis) // 4):]
    body = semis[:-len(last)] if len(semis) > len(last) else semis
    return {**r, "f0_median_hz": round(float(ref), 1), "final_slope_st_s": round(slope, 2), "final_vs_body_st": round(float(np.median(last) - np.median(body)), 2)}

d = sys.argv[1]
meta = json.load(open(os.path.join(d, "renders.json")))
rows = []
for row in meta["rows"]:
    if not row["file"]:
        continue
    a = analyse(os.path.join(d, row["file"]))
    rows.append({**row, **a})
    print(f'{row["phrase"]:14s} {row["variant"]:9s} dur {a["dur_ms"]:5d} voiced {a["voiced_ms"]:4d}  slope {a["final_slope_st_s"]!s:>7} st/s  final-vs-body {a["final_vs_body_st"]!s:>6} st')
by = {}
for r in rows:
    if r["final_vs_body_st"] is None:
        continue
    by.setdefault(r["variant"], []).append(r)
summary = {}
for v, rs in by.items():
    e = np.array([r["final_vs_body_st"] for r in rs]); s = np.array([r["final_slope_st_s"] for r in rs])
    summary[v] = {"n": len(rs), "final_vs_body_st_median": round(float(np.median(e)), 2), "slope_st_s_median": round(float(np.median(s)), 2),
                  "falling_lt_minus2": int(np.sum(e < -2)), "rising_gt_plus2": int(np.sum(e > 2)), "level": int(np.sum(np.abs(e) <= 2)), "dur_ms_median": int(np.median([r["dur_ms"] for r in rs]))}
print(json.dumps(summary, indent=1))
json.dump({"method": "normalised autocorrelation F0, 10 ms hop, 40 ms win, 75-500 Hz, corr >= 0.45, 5-frame median; terminal = last 150 ms of voice vs the rest (semitones)", "summary": summary, "rows": rows},
          open(os.path.join(d, "prosody.json"), "w"), indent=1)
