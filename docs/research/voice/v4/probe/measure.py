# measure.py — objective readout for the v4 capability probe (caps.mjs) and the line renders (lines.mjs), 2026-10-04.
# Per wav: edge-trim at -45 dBFS-relative, split at the longest internal silence (the 700 ms carrier break) into
# clause A (control) and clause B (the varied clause); per part: speech duration (s), f0 median (Hz) and SD (st),
# f0 slope over the last 35% of voiced frames (st), RMS (dB), and internal gaps >= 60 ms (ms).
# f0: normalised autocorrelation (octave-folded to +-6 st of the file median, 5-frame median filter), 40 ms frames / 10 ms hop, 110-480 Hz, voiced when peak >= 0.55 and frame energy
# within 30 dB of the loudest frame. A coarse tracker: good for medians and deltas of a few %, not for fine contours.
# Run: python3 docs/research/voice/v4/probe/measure.py caps   (or: lines)
import json, os, sys, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))

def load(p):
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
        return x, w.getframerate()

def frames(x, sr, win=0.04, hop=0.01):
    n, h = int(win * sr), int(hop * sr)
    idx = np.arange(0, max(1, len(x) - n), h)
    return np.stack([x[i:i + n] for i in idx]), h

def silences(db, thr, hop_s, min_s):
    out, run = [], None
    for i, s in enumerate(db < thr):
        if s and run is None: run = i
        if not s and run is not None:
            if (i - run) * hop_s >= min_s: out.append((run, i))
            run = None
    return out

def f0_track(fr, sr, db, top):
    res = []
    lo, hi = int(sr / 480), int(sr / 110)
    for f, d in zip(fr, db):
        if d < top - 30: res.append(np.nan); continue
        f = f - f.mean(); ac = np.correlate(f, f, "full")[len(f) - 1:]
        if ac[0] <= 0: res.append(np.nan); continue
        ac = ac / ac[0]; k = lo + int(np.argmax(ac[lo:hi]))
        res.append(sr / k if ac[k] >= 0.55 else np.nan)
    f0 = np.array(res)
    # octave correction: fold every value to within +-6 st of the file median, then a 5-frame median filter
    med = np.nanmedian(f0)
    for i, v in enumerate(f0):
        if np.isnan(v): continue
        while 12 * np.log2(v / med) > 6: v /= 2
        while 12 * np.log2(v / med) < -6: v *= 2
        f0[i] = v
    sm = f0.copy()
    for i in range(len(f0)):
        w = f0[max(0, i - 2):i + 3]; w = w[~np.isnan(w)]
        if not np.isnan(f0[i]) and len(w): sm[i] = np.median(w)
    return sm

def part_stats(f0, db, a, b, hop_s, top):
    seg_f0 = f0[a:b]; v = seg_f0[~np.isnan(seg_f0)]
    st = 12 * np.log2(v / np.median(v)) if len(v) > 5 else np.array([0.0])
    tail = v[int(len(v) * 0.65):] if len(v) > 10 else v
    slope = float(12 * np.log2(np.median(tail[-5:]) / np.median(tail[:5]))) if len(tail) >= 10 else None
    gaps = [round((e - s) * hop_s * 1000) for s, e in silences(db[a:b], top - 35, hop_s, 0.06)]
    rms = float(np.mean(db[a:b][db[a:b] > top - 30])) if np.any(db[a:b] > top - 30) else None
    return {"dur": round((b - a) * hop_s, 2), "f0_med": round(float(np.median(v)), 1) if len(v) else None, "f0_sd_st": round(float(np.std(st)), 2),
            "tail_slope_st": None if slope is None else round(slope, 2), "rms_db": None if rms is None else round(rms, 1), "gaps_ms": gaps}

def analyse(p, split=True):
    x, sr = load(p); fr, h = frames(x, sr); hop_s = h / sr
    db = 10 * np.log10(np.mean(fr ** 2, axis=1) + 1e-12); top = np.percentile(db, 98)
    voiced = np.where(db > top - 45)[0]; s0, s1 = voiced[0], voiced[-1] + 1
    f0 = f0_track(fr, sr, db, top)
    sil = [(a, b) for a, b in silences(db[s0:s1], top - 40, hop_s, 0.15)]
    out = {"total": round((s1 - s0) * hop_s, 2), "longest_gap_ms": round(max([b - a for a, b in sil], default=0) * hop_s * 1000)}
    if split and sil:
        a, b = max(sil, key=lambda t: t[1] - t[0]); a += s0; b += s0
        out["A"] = part_stats(f0, db, s0, a, hop_s, top); out["B"] = part_stats(f0, db, b, s1, hop_s, top)
    else:
        out["all"] = part_stats(f0, db, s0, s1, hop_s, top)
    return out

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "caps"
    man = json.load(open(os.path.join(HERE, f"{which}-renders.json")))
    for r in man["renders"]:
        if "file" in r: r["m"] = analyse(os.path.join(HERE, r["file"]), split=(which == "caps"))
    json.dump(man, open(os.path.join(HERE, f"{which}-renders.json"), "w"), ensure_ascii=False, indent=1)
    if which == "caps":
        by = {}
        for r in man["renders"]:
            if "m" in r: by.setdefault(r["id"], []).append(r["m"])
        def mean(vals): vals = [v for v in vals if v is not None]; return round(float(np.mean(vals)), 2) if vals else None
        print(f"{'variant':18s} {'A dur':>6s} {'B dur':>6s} {'B/A':>5s} {'A f0':>6s} {'B f0':>6s} {'B-A st':>6s} {'Bsd':>5s} {'Bslope':>6s} {'B-A dB':>6s} {'gap':>5s}  B gaps")
        rows = {}
        for k, ms in by.items():
            ms2 = [m for m in ms if "A" in m]
            if not ms2:
                print(f"{k:18s} total {mean([m['total'] for m in ms])} longest_gap {mean([m['longest_gap_ms'] for m in ms])}"); continue
            A = lambda f: mean([m["A"][f] for m in ms2]); B = lambda f: mean([m["B"][f] for m in ms2])
            ratio = mean([m["B"]["dur"] / m["A"]["dur"] for m in ms2])
            dst = mean([12 * np.log2(m["B"]["f0_med"] / m["A"]["f0_med"]) for m in ms2 if m["A"]["f0_med"] and m["B"]["f0_med"]])
            ddb = mean([m["B"]["rms_db"] - m["A"]["rms_db"] for m in ms2])
            rows[k] = {"B_over_A": ratio, "B_minus_A_st": dst, "B_minus_A_db": ddb}
            print(f"{k:18s} {A('dur'):6} {B('dur'):6} {ratio:5} {A('f0_med'):6} {B('f0_med'):6} {dst:6} {B('f0_sd_st'):5} {str(B('tail_slope_st')):>6} {ddb:6} {mean([m['longest_gap_ms'] for m in ms]):5}  {[m['B']['gaps_ms'] for m in ms2]}")
        json.dump(rows, open(os.path.join(HERE, "caps-summary.json"), "w"), indent=1)
