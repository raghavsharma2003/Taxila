"""Train + evaluate the on-device filled-pause detector (SPEC F3 acoustic; the stage-2 audio component trainable on
licence-clean public data today). Input = the PRODUCT front-end's per-frame GRU vector (src/voicesig/frontend/gruInput.ts,
22 dims, 20 ms hop, extracted by evals/voicesig/train/extract.mjs). Output = per-frame P(filled pause).

Data: AMI (CC BY 4.0) train/val/test speaker-disjoint by meeting series (ami_prep.py); test = every series with an
Indian-L1 speaker. Cross-corpus: ICSI (CC BY 4.0, never trained on). Hindi false-alarm check: FLEURS hi_in read speech
(CC BY 4.0, no fillers by construction of the task) vs en_us. No child speech is available under a commercial licence:
this model is ADULT-trained and that gap is reported, not hidden.

usage: python3 train_filler.py --ami <dir>/feat [--icsi <dir>/feat] [--fleurs <dir>/feat] --out <results.json> --model <models dir>
"""
import argparse, glob, json, math, os, random, sys, time
import numpy as np
import torch
import torch.nn as nn

torch.set_num_threads(int(os.environ.get("VS_THREADS", "2")))
SEED = 1234
CROP = 400  # 8 s of 20 ms frames


def load(stem):
    j = json.load(open(stem + ".json"))
    a = np.fromfile(stem + ".bin", dtype="<f4").reshape(-1, j["width"])
    t = a[:, 0].astype(np.float64)
    lab = np.full(len(t), -1, np.int8)
    for s, e, l, _ in j.get("words", []):
        i0, i1 = np.searchsorted(t, s * 1000), np.searchsorted(t, e * 1000, "right")
        if i1 > i0:
            cur = lab[i0:i1]
            if l == 1:
                cur[:] = 1
            elif l == 0:
                cur[cur != 1] = 0
    seg = np.concatenate([[0], np.nonzero(np.diff(t) > 25)[0] + 1, [len(t)]])
    return {"meta": j, "t": t, "rms": a[:, 1], "f0": a[:, 2], "speech": a[:, 3], "x": a[:, 4:].astype(np.float32), "lab": lab, "seg": seg}


def words_of(d):
    """Own words (lab 0/1, >= 100 ms) as (i0, i1, lab) frame spans."""
    out = []
    for s, e, l, _ in d["meta"].get("words", []):
        if l < 0 or e - s < 0.1:
            continue
        i0, i1 = np.searchsorted(d["t"], s * 1000), np.searchsorted(d["t"], e * 1000, "right")
        if i1 - i0 >= 3:
            out.append((i0, i1, l))
    return out


class Det(nn.Module):
    def __init__(self, dim, hidden, bi):
        super().__init__()
        self.gru = nn.GRU(dim, hidden, batch_first=True, bidirectional=bi)
        self.out = nn.Linear(hidden * (2 if bi else 1), 1)

    def forward(self, x):
        h, _ = self.gru(x)
        return self.out(h).squeeze(-1)


class Wrap(nn.Module):
    """Export wrapper: x [1, T, 22] -> p [1, T] (sigmoid inside the graph)."""
    def __init__(self, m):
        super().__init__()
        self.m = m

    def forward(self, x):
        return torch.sigmoid(self.m(x))


def crops(files, n, rng):
    X = np.zeros((n, CROP, files[0]["x"].shape[1]), np.float32)
    Y = np.full((n, CROP), -1, np.float32)
    k = 0
    pool = [(fi, a, b) for fi, d in enumerate(files) for a, b in zip(d["seg"][:-1], d["seg"][1:]) if (d["lab"][a:b] >= 0).sum() > 10]
    w = np.array([max(1, (files[fi]["lab"][a:b] == 1).sum() * 4 + (files[fi]["lab"][a:b] == 0).sum()) for fi, a, b in pool], np.float64)
    w /= w.sum()
    while k < n:
        fi, a, b = pool[rng.choice(len(pool), p=w)]
        d = files[fi]
        s = a if b - a <= CROP else rng.integers(a, b - CROP + 1)
        e = min(b, s + CROP)
        X[k, : e - s] = d["x"][s:e]
        Y[k, : e - s] = d["lab"][s:e]
        k += 1
    return torch.from_numpy(X), torch.from_numpy(Y)


@torch.no_grad()
def predict(m, d):
    m.eval()
    p = np.zeros(len(d["t"]), np.float32)
    for a, b in zip(d["seg"][:-1], d["seg"][1:]):
        x = torch.from_numpy(d["x"][a:b][None])
        p[a:b] = torch.sigmoid(m(x))[0].numpy()
    return p


def auroc(s, y):
    s, y = np.asarray(s, float), np.asarray(y, int)
    if y.min() == y.max():
        return float("nan")
    order = np.argsort(s, kind="mergesort")
    ranks = np.empty(len(s))
    ss = s[order]
    i = 0
    while i < len(s):
        j = i
        while j + 1 < len(s) and ss[j + 1] == ss[i]:
            j += 1
        ranks[order[i : j + 1]] = (i + j) / 2 + 1
        i = j + 1
    npos = y.sum()
    return float((ranks[y == 1].sum() - npos * (npos + 1) / 2) / (npos * (len(y) - npos)))


def cluster_ci(units, stat, B=1000, seed=7):
    """units: list of (cluster, payload); stat(list of payload) -> float. Speaker-clustered percentile bootstrap."""
    rng = np.random.default_rng(seed)
    cl = {}
    for c, p in units:
        cl.setdefault(c, []).append(p)
    keys = list(cl)
    est = stat([p for _, p in units])
    reps = []
    for _ in range(B):
        pick = rng.integers(0, len(keys), len(keys))
        v = stat([p for k in pick for p in cl[keys[k]]])
        if np.isfinite(v):
            reps.append(v)
    return {"est": round(est, 4), "lo": round(float(np.percentile(reps, 2.5)), 4), "hi": round(float(np.percentile(reps, 97.5)), 4), "clusters": len(keys), "n": len(units)}


def flat_heuristic(d, i0, i1):
    """Shipped dsp.ts flatVoicedRuns rule inside a span: a voiced run >= 300 ms with p90-p10 spread < 1 st.
    Returns (fires, score) where score = longest flat-enough voiced run in frames (continuous version for AUROC)."""
    f0 = d["f0"][i0:i1]
    best, run = 0, []
    def close(r):
        if len(r) >= 3:
            st = 12 * np.log2(np.array(r) / 100)
            if np.percentile(st, 90) - np.percentile(st, 10) < 1.0:
                return len(r)
        return 0
    for v in f0:
        if np.isfinite(v):
            run.append(v)
        else:
            best = max(best, close(run)); run = []
    best = max(best, close(run))
    return best >= 15, best


def word_table(files, preds):
    rows = []
    for d, p in zip(files, preds):
        for i0, i1, l in words_of(d):
            fires, hs = flat_heuristic(d, i0, i1)
            rows.append({"spk": d["meta"]["speaker"], "l1": d["meta"].get("l1", ""), "sex": d["meta"].get("sex", ""), "y": l,
                         "p": float(p[i0:i1].mean()), "pmax": float(p[i0:i1].max()), "heur": int(fires), "heurScore": hs, "dur": (i1 - i0) * 0.02})
    return rows


def runs_eval(files, preds, thr, min_frames=10):
    """Event level, as the product uses it: runs of p >= thr over speech frames, >= 200 ms. A run counts only if it
    overlaps an own labelled word (so crosstalk regions are not scored). TP run = overlaps a filler word."""
    tp = fp = 0
    hit = tot = 0
    for d, p in zip(files, preds):
        on = (p >= thr) & (d["speech"] > 0)
        lab = d["lab"]
        i, n = 0, len(on)
        fill_hit = set()
        fw = [(i0, i1) for i0, i1, l in words_of(d) if l == 1 and i1 - i0 >= min_frames]
        while i < n:
            if not on[i]:
                i += 1; continue
            j = i
            while j < n and on[j] and (j == i or d["t"][j] - d["t"][j - 1] <= 25):
                j += 1
            if j - i >= min_frames:
                seg = lab[i:j]
                if (seg >= 0).any():
                    if (seg == 1).any():
                        tp += 1
                    else:
                        fp += 1
                for k, (a, b) in enumerate(fw):
                    if a < j and b > i:
                        fill_hit.add(k)
            i = j
        hit += len(fill_hit); tot += len(fw)
    return {"precision": round(tp / max(1, tp + fp), 4), "recall": round(hit / max(1, tot), 4), "runs": tp + fp, "fillerWords": tot}


def heur_runs_eval(files, min_frames=15):
    tp = fp = hit = tot = 0
    for d in files:
        f0 = d["f0"]; lab = d["lab"]; n = len(f0)
        fw = [(i0, i1) for i0, i1, l in words_of(d) if l == 1 and i1 - i0 >= 10]
        got = set()
        i = 0
        while i < n:
            if not np.isfinite(f0[i]):
                i += 1; continue
            j = i
            while j < n and np.isfinite(f0[j]) and (j == i or d["t"][j] - d["t"][j - 1] <= 25):
                j += 1
            if j - i >= min_frames:
                st = 12 * np.log2(f0[i:j] / 100)
                if np.percentile(st, 90) - np.percentile(st, 10) < 1.0:
                    seg = lab[i:j]
                    if (seg >= 0).any():
                        if (seg == 1).any(): tp += 1
                        else: fp += 1
                    for k, (a, b) in enumerate(fw):
                        if a < j and b > i: got.add(k)
            i = j
        hit += len(got); tot += len(fw)
    return {"precision": round(tp / max(1, tp + fp), 4), "recall": round(hit / max(1, tot), 4), "runs": tp + fp, "fillerWords": tot}


def ece(p, y, bins=10):
    p, y = np.asarray(p), np.asarray(y)
    o = np.argsort(p); n = len(p); e = 0.0
    for b in range(bins):
        idx = o[b * n // bins:(b + 1) * n // bins]
        if len(idx):
            e += abs(p[idx].sum() - y[idx].sum()) / n
    return float(e)


def platt(s, y):
    s = torch.tensor(np.log(np.clip(s, 1e-6, 1 - 1e-6) / (1 - np.clip(s, 1e-6, 1 - 1e-6))), dtype=torch.float64)
    y = torch.tensor(y, dtype=torch.float64)
    a = torch.ones(1, dtype=torch.float64, requires_grad=True); b = torch.zeros(1, dtype=torch.float64, requires_grad=True)
    opt = torch.optim.LBFGS([a, b], max_iter=100)
    def cl():
        opt.zero_grad(); l = nn.functional.binary_cross_entropy_with_logits(a * s + b, y); l.backward(); return l
    opt.step(cl)
    return float(a), float(b)


def apply_platt(ab, s):
    s = np.log(np.clip(s, 1e-6, 1 - 1e-6) / (1 - np.clip(s, 1e-6, 1 - 1e-6)))
    return 1 / (1 + np.exp(-(ab[0] * s + ab[1])))


def train(files_tr, files_va, hidden, bi, epochs, steps, log):
    torch.manual_seed(SEED); rng = np.random.default_rng(SEED)
    m = Det(files_tr[0]["x"].shape[1], hidden, bi)
    opt = torch.optim.Adam(m.parameters(), lr=3e-3)
    lab = np.concatenate([d["lab"] for d in files_tr])
    pos_w = torch.tensor(min(20.0, (lab == 0).sum() / max(1, (lab == 1).sum())) / 4)
    best, best_state, hist = -1, None, []
    for ep in range(epochs):
        m.train(); t0 = time.time(); tot = 0
        for _ in range(steps):
            X, Y = crops(files_tr, 32, rng)
            logit = m(X)
            mask = Y >= 0
            loss = nn.functional.binary_cross_entropy_with_logits(logit[mask], Y[mask], pos_weight=pos_w)
            opt.zero_grad(); loss.backward(); nn.utils.clip_grad_norm_(m.parameters(), 1.0); opt.step()
            tot += float(loss)
        pv = [predict(m, d) for d in files_va]
        wt = word_table(files_va, pv)
        a = auroc([r["p"] for r in wt], [r["y"] for r in wt])
        hist.append({"epoch": ep, "loss": round(tot / steps, 4), "valWordAuroc": round(a, 4), "s": round(time.time() - t0, 1)})
        log(json.dumps(hist[-1]))
        if a > best:
            best, best_state = a, {k: v.clone() for k, v in m.state_dict().items()}
    m.load_state_dict(best_state)
    return m, best, hist


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ami", required=True)
    ap.add_argument("--icsi")
    ap.add_argument("--fleurs")
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--epochs", type=int, default=14)
    ap.add_argument("--steps", type=int, default=120)
    a = ap.parse_args()
    random.seed(SEED); np.random.seed(SEED)
    log = lambda s: print(s, flush=True)
    stems = sorted(f[:-5] for f in glob.glob(os.path.join(a.ami, "*.json")) if not f.endswith(".regions.json"))
    files = [load(s) for s in stems]
    files = [d for d in files if "split" in d["meta"]]
    S = {k: [d for d in files if d["meta"]["split"] == k] for k in ("train", "val", "test")}
    spk = {k: {d["meta"]["speaker"] for d in v} for k, v in S.items()}
    assert not (spk["train"] & spk["test"]) and not (spk["val"] & spk["test"]) and not (spk["train"] & spk["val"]), "speaker leakage"
    def counts(fs):
        lab = np.concatenate([d["lab"] for d in fs]); w = [r for d in fs for r in words_of(d)]
        return {"channels": len(fs), "speakers": len({d["meta"]["speaker"] for d in fs}), "hours": round(sum(len(d["t"]) for d in fs) * 0.02 / 3600, 2),
                "fillerFrames": int((lab == 1).sum()), "wordFrames": int((lab == 0).sum()), "fillerWords": sum(1 for x in w if x[2] == 1), "otherWords": sum(1 for x in w if x[2] == 0)}
    res = {"date": time.strftime("%Y-%m-%d"), "task": "filled-pause (um/uh/er) per-frame detection on the product front-end",
           "featuresVer": files[0]["meta"]["ver"], "data": {k: counts(v) for k, v in S.items()},
           "split": "speaker-disjoint by AMI meeting series; test = all series with an Indian-L1 speaker", "seed": SEED}
    log(json.dumps(res["data"]))
    cands = {}
    for name, hid, bi in (("uni48", 48, False), ("bi32", 32, True)):
        m, best, hist = train(S["train"], S["val"], hid, bi, a.epochs, a.steps, lambda s, n=name: log(n + " " + s))
        cands[name] = (m, best, hist)
    name = max(cands, key=lambda k: cands[k][1])
    m = cands[name][0]
    res["candidates"] = {k: {"valWordAuroc": round(v[1], 4), "params": sum(p.numel() for p in v[0].parameters()), "history": v[2]} for k, v in cands.items()}
    res["chosen"] = name
    # Threshold on VAL: best word-level F1, and the Platt map for calibrated word probabilities.
    pv = [predict(m, d) for d in S["val"]]
    wv = word_table(S["val"], pv)
    ab = platt(np.array([r["p"] for r in wv]), np.array([r["y"] for r in wv]))
    ths = np.linspace(0.05, 0.95, 91)
    def f1(th, files, preds):
        r = runs_eval(files, preds, th); p, rc = r["precision"], r["recall"]
        return 0 if p + rc == 0 else 2 * p * rc / (p + rc)
    thr = float(max(ths, key=lambda t: f1(t, S["val"], pv)))
    res["threshold"] = {"frame": round(thr, 3), "chosenOn": "val, event-level F1"}
    # TEST
    pt = [predict(m, d) for d in S["test"]]
    wt = word_table(S["test"], pt)
    lab = np.concatenate([d["lab"] for d in S["test"]]); pp = np.concatenate(pt); mk = lab >= 0
    units = [(r["spk"], r) for r in wt]
    st_model = lambda rs: auroc([r["p"] for r in rs], [r["y"] for r in rs])
    st_heur = lambda rs: auroc([r["heurScore"] for r in rs], [r["y"] for r in rs])
    st_diff = lambda rs: st_model(rs) - st_heur(rs)
    cal = apply_platt(ab, np.array([r["p"] for r in wt]))
    res["test"] = {
        "frameAuroc": round(auroc(pp[mk], lab[mk]), 4),
        "wordAurocModel": cluster_ci(units, st_model),
        "wordAurocFlatRunHeuristic": cluster_ci(units, st_heur),
        "wordAurocDelta": cluster_ci(units, st_diff),
        "eventModel": runs_eval(S["test"], pt, thr),
        "eventFlatRunHeuristic": heur_runs_eval(S["test"]),
        "wordEceCalibrated": round(ece(cal, [r["y"] for r in wt]), 4),
        "wordEceRaw": round(ece([r["p"] for r in wt], [r["y"] for r in wt]), 4),
    }
    groups = {}
    for key, f in (("indianL1", lambda r: r["l1"] in {"Hindi", "Telugu", "Tamil", "Malayalam", "Konkani"}), ("otherL1", lambda r: r["l1"] not in {"Hindi", "Telugu", "Tamil", "Malayalam", "Konkani"}),
                   ("female", lambda r: r["sex"] == "F"), ("male", lambda r: r["sex"] == "M")):
        rs = [(r["spk"], r) for r in wt if f(r)]
        groups[key] = cluster_ci(rs, st_model) if len({c for c, _ in rs}) >= 2 else {"n": len(rs), "est": None}
    tf = [d for d in S["test"] if d["meta"].get("l1") in {"Hindi", "Telugu", "Tamil", "Malayalam", "Konkani"}]
    groups["indianL1Event"] = runs_eval(tf, [p for d, p in zip(S["test"], pt) if d in tf], thr)
    res["test"]["groups"] = groups
    # CROSS-CORPUS: ICSI
    if a.icsi:
        ist = sorted(f[:-5] for f in glob.glob(os.path.join(a.icsi, "*.json")))
        ifs = [load(s) for s in ist]
        ip = [predict(m, d) for d in ifs]
        iw = word_table(ifs, ip)
        iu = [(r["spk"] + str(i // 200), r) for i, r in enumerate(iw)]  # mix audio: cluster by meeting x 200-word blocks
        res["xcorpusICSI"] = {"meetings": [d["meta"]["meeting"] for d in ifs], "hours": round(sum(len(d["t"]) for d in ifs) * 0.02 / 3600, 2),
                              "fillerWords": sum(r["y"] for r in iw), "wordAurocModel": cluster_ci(iu, st_model), "wordAurocFlatRunHeuristic": cluster_ci(iu, st_heur),
                              "eventModel": runs_eval(ifs, ip, thr), "eventFlatRunHeuristic": heur_runs_eval(ifs),
                              "note": "headset-MIX audio (all speakers), overlaps ignored; clusters = meeting x 200-word blocks (no per-speaker channels)"}
    # HINDI false alarms (read speech, no fillers expected)
    if a.fleurs:
        fa = {}
        for lang in ("hi_in", "en_us"):
            fs = [load(s[:-5]) for s in sorted(glob.glob(os.path.join(a.fleurs, lang + "*.json")))]
            if not fs:
                continue
            runs = 0; speech_min = 0
            for d in fs:
                p = predict(m, d)
                on = (p >= thr) & (d["speech"] > 0)
                i = 0
                while i < len(on):
                    if on[i]:
                        j = i
                        while j < len(on) and on[j]:
                            j += 1
                        if j - i >= 10:
                            runs += 1
                        i = j
                    else:
                        i += 1
                speech_min += d["speech"].sum() * 0.02 / 60
            fa[lang] = {"speechMin": round(float(speech_min), 1), "falseRunsPerSpeechMin": round(runs / max(1e-9, speech_min), 3), "runs": runs}
        res["fleursFalseAlarms"] = fa
    # EXPORT
    os.makedirs(a.model, exist_ok=True)
    w = Wrap(m).eval()
    onnx_path = os.path.join(a.model, "filler-gru.onnx")
    dummy = torch.from_numpy(S["test"][0]["x"][:250][None])
    torch.onnx.export(w, dummy, onnx_path, input_names=["x"], output_names=["p"], dynamic_axes={"x": {1: "T"}, "p": {1: "T"}}, opset_version=17, dynamo=False)
    import onnxruntime as ort
    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    xs = S["test"][1]["x"][:1500][None]
    ref = w(torch.from_numpy(xs)).detach().numpy()
    got = sess.run(None, {"x": xs})[0]
    res["export"] = {"path": "models/voicesig/filler-gru.onnx", "bytes": os.path.getsize(onnx_path), "params": sum(p.numel() for p in m.parameters()),
                     "maxAbsDiffTorchVsOrt": float(np.abs(ref - got).max()), "opset": 17}
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
        q_path = os.path.join(a.model, "filler-gru.int8.onnx")
        quantize_dynamic(onnx_path, q_path, weight_type=QuantType.QInt8)
        qs = ort.InferenceSession(q_path, providers=["CPUExecutionProvider"])
        qgot = qs.run(None, {"x": xs})[0]
        res["export"]["int8"] = {"bytes": os.path.getsize(q_path), "maxAbsDiffVsFp32": float(np.abs(qgot - got).max())}
        qp = []
        for d in S["test"]:
            p = np.zeros(len(d["t"]), np.float32)
            for s0, s1 in zip(d["seg"][:-1], d["seg"][1:]):
                p[s0:s1] = qs.run(None, {"x": d["x"][s0:s1][None]})[0][0]
            qp.append(p)
        qwt = word_table(S["test"], qp)
        res["export"]["int8"]["testWordAuroc"] = round(auroc([r["p"] for r in qwt], [r["y"] for r in qwt]), 4)
    except Exception as e:  # noqa: BLE001
        res["export"]["int8"] = {"error": str(e)[:200]}
    card = {"name": "filler-gru", "ver": f"filler-gru/1-{name}", "task": res["task"], "input": "x [1, T, 22] float32 (src/voicesig/frontend/gruInput.ts, " + res["featuresVer"] + ")",
            "output": "p [1, T] per-frame P(filled pause)", "threshold": res["threshold"]["frame"], "platt": ab,
            "trainingData": "AMI Meeting Corpus individual headsets (University of Edinburgh et al.), CC BY 4.0, commercial use permitted with attribution",
            "notCovered": ["child speech (any language)", "Hindi or Hinglish spontaneous speech", "phone microphones / AGC-processed capture", "Hindi fillers 'aaa' / 'matlab' / 'woh'"],
            "metrics": {k: res["test"][k] for k in ("frameAuroc", "wordAurocModel", "eventModel")}, "date": res["date"]}
    json.dump(card, open(os.path.join(a.model, "filler-gru.json"), "w"), indent=1)
    json.dump(res, open(a.out, "w"), indent=1)
    log(json.dumps(res["test"], indent=1))


if __name__ == "__main__":
    main()
