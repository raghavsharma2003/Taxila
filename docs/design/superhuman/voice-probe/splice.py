#!/usr/bin/env python3
"""splice.py — clip bank trimming, gap filling (DragonHD expressive arm) and objective prosody metrics.

  python3 splice.py bank      # trim bank/*.wav -> bank/<persona>-<kind>-0.trim.wav (best take per kind)
  python3 splice.py fill      # wav/dhd-*__expressive.wav: find each planned <break> gap, mix the same-persona clip in
  python3 splice.py metrics   # metrics.json: f0 range/sd (semitones), pause count/var, speech rate, duration

Gap filling: the SSML carried an exact-length <break> where the plan wants a non-verbal (the paralinguistic TAG
is spoken aloud on en-IN DragonHD, cap-probe 2026-10-04). We locate the silence whose length best matches the
planned gap, in order, and mix the trimmed clip into it at a level matched to the surrounding speech (-8 dB re
speech RMS for breath/hum/sigh, -3 dB for laugh/chuckle), with 15 ms in / 60 ms out fades. Clip shaping follows
Meera's shapeAck idea (core at -30 dB, edges to -55 dB), simplified.
"""
import json, sys, os, glob, wave
import numpy as np

SR = 24000

def rd(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1, path
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0

def wr(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def frames_db(x, hop=240, win=480):
    n = max(1, (len(x) - win) // hop + 1)
    e = np.array([np.sqrt(np.mean(x[i*hop:i*hop+win] ** 2) + 1e-12) for i in range(n)])
    return 20 * np.log10(e + 1e-9), hop

def trim(x, floor_db=-50, pad_ms=30):
    db, hop = frames_db(x)
    peak = db.max()
    idx = np.where(db > max(floor_db, peak - 40))[0]
    if not len(idx): return x
    a = max(0, idx[0] * hop - int(SR * pad_ms / 1000)); b = min(len(x), (idx[-1] + 2) * hop + int(SR * pad_ms / 1000))
    y = x[a:b].copy()
    fi, fo = int(0.015 * SR), int(0.06 * SR)
    y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
    return y

TARGET = {"breath": 0.55, "laugh": 0.8, "chuckle": 0.55, "hum": 0.6, "sigh_relief": 0.9}

def bank():
    for p in ("diya", "arjun"):
        for k, tgt in TARGET.items():
            src = "laugh" if k == "chuckle" else k  # "chuckle" takes contained a spoken word; use the shortest laugh
            takes = []
            for f in sorted(glob.glob(f"bank/{p}-{src}-[0-9].wav")):
                y = trim(rd(f)); takes.append((abs(len(y) / SR - tgt), f, y))
            if not takes: continue
            takes.sort(key=lambda t: t[0])
            _, f, y = takes[0]
            wr(f"bank/{p}-{k}-0.trim.wav", y)
            print(p, k, os.path.basename(f), f"{len(y)/SR:.2f}s")

def silences(x, thr_db=-45, min_ms=150):
    db, hop = frames_db(x)
    sil = db < thr_db
    out, start = [], None
    for i, s in enumerate(sil):
        if s and start is None: start = i
        if (not s or i == len(sil) - 1) and start is not None:
            end = i if not s else i + 1
            if (end - start) * hop * 1000 / SR >= min_ms: out.append((start * hop, end * hop))
            start = None
    return out

def fill():
    T = json.load(open("timings.json"))
    for f in sorted(glob.glob("wav/dhd-*__expressive.wav")):
        key = os.path.basename(f)[:-4]; t = T.get(key, {})
        gaps = t.get("gaps") or []; persona = t.get("persona")
        x = rd(f); speech_rms = np.sqrt(np.mean(x[np.abs(x) > 0.01] ** 2) + 1e-12)
        sil = silences(x); used = []; cursor = 0; log = []
        for g in gaps:
            want = g["ms"] / 1000 * SR
            cands = [(abs((b - a) - want), a, b) for a, b in sil if a >= cursor and (a, b) not in used and (b - a) > 0.5 * want]
            if not cands: log.append(f"{g['kind']}:NOGAP"); continue
            # earliest candidate within 35% of the wanted length, else the best match
            near = [c for c in cands if c[0] < 0.35 * want]
            _, a, b = min(near, key=lambda c: c[1]) if near else min(cands)
            used.append((a, b)); cursor = b
            clip = rd(f"bank/{persona}-{g['kind']}-0.trim.wav")
            rel = -3 if g["kind"] in ("laugh", "chuckle") else -8
            clip = clip / (np.sqrt(np.mean(clip ** 2)) + 1e-9) * speech_rms * (10 ** (rel / 20))
            start = a + max(0, ((b - a) - len(clip)) // 2)
            end = min(len(x), start + len(clip)); x[start:end] += clip[: end - start]
            log.append(f"{g['kind']}@{start/SR:.2f}s")
        wr(f.replace(".wav", ".spliced.wav"), x)
        print(key, " ".join(log))

def f0_track(x, fmin=75, fmax=400, hop=240, win=960):
    f0 = []
    for i in range(0, len(x) - win, hop):
        fr = x[i:i+win] * np.hanning(win)
        if np.sqrt(np.mean(fr ** 2)) < 0.02: continue
        ac = np.correlate(fr, fr, "full")[win-1:]
        lo, hi = int(SR / fmax), int(SR / fmin)
        k = lo + np.argmax(ac[lo:hi])
        if ac[k] / (ac[0] + 1e-9) > 0.45: f0.append(SR / k)
    return np.array(f0)

def metrics():
    out = {}
    for f in sorted(glob.glob("wav/*.wav")):
        key = os.path.basename(f)[:-4]
        if "__expressive" in key and key.startswith("dhd-") and not key.endswith(".spliced"): key += ".unspliced"
        x = rd(f); dur = len(x) / SR
        f0 = f0_track(x)
        st = 12 * np.log2(f0 / np.median(f0)) if len(f0) > 10 else np.array([0.0])
        sil = [(b - a) / SR for a, b in silences(x, min_ms=180)]
        inner = [s for (a, b), s in zip(silences(x, min_ms=180), sil) if a > 0.05 * SR and b < len(x) - 0.05 * SR]
        out[key] = {"dur": round(dur, 2), "f0_median": round(float(np.median(f0)), 1) if len(f0) else None,
                    "f0_range_st": round(float(np.percentile(st, 95) - np.percentile(st, 5)), 2), "f0_sd_st": round(float(np.std(st)), 2),
                    "pauses": len(inner), "pause_total_s": round(sum(inner), 2), "pause_sd_s": round(float(np.std(inner)), 3) if len(inner) > 1 else 0.0,
                    "max_pause_s": round(max(inner), 2) if inner else 0.0}
    json.dump(out, open("metrics.json", "w"), indent=1)
    print(f"{len(out)} clips")

if __name__ == "__main__":
    {"bank": bank, "fill": fill, "metrics": metrics}[sys.argv[1]]()
