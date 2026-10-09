"""Round 3 (voicesig): retrain + re-evaluate the on-device filled-pause detector on the SAME harness as 2026-10-04.

Same as evals/voicesig/train/train_filler.py: the product front-end's 22-dim GRU input (vsgru-in/1), AMI speaker-disjoint
splits (test = the 8 Indian-L1 series, 32 held-out speakers, unchanged), event level = runs of p >= thr over speech frames
>= 200 ms that overlap an own labelled word; a run is a true positive when it overlaps a filler word (runs_eval, imported,
not copied). What changes (each one a candidate, chosen on VAL only, never on test):
  data       more AMI training speakers/hours (ami_prep_r3.py) and FLEURS read-speech hard negatives (CC BY 4.0), aimed at
             the shipped detector's 3.8 false runs per Hindi speech-minute (it never heard Hindi)
  arch       bi-GRU 32 (shipped) / bi-GRU 48
  operating  the threshold that maximises VAL recall subject to VAL precision >= --target (pre-registered 0.82, a margin
             over the 0.80 bar) and a minimum run length; the F1-optimal threshold is reported too
TEST is read once per candidate for the report; the chosen candidate is fixed by VAL before test is looked at (the
selection rule is in `choose()` and runs on val numbers only).

  python3 evals/voicesig/r3/train_r3.py --ami <work>/ami/feat --fleurs <work>/fleurs/feat --out <results.json> \
      --model-dir <dir> [--baseline models/voicesig/filler-gru.onnx] [--epochs 16] [--steps 150] [--target 0.82]
"""
import argparse, glob, json, os, sys, time
import numpy as np
import torch
import torch.nn as nn

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
sys.path.insert(0, os.path.join(ROOT, "evals/voicesig/train"))
import train_filler as T  # noqa: E402  (load, words_of, Det, Wrap, crops, predict, runs_eval, auroc, cluster_ci, platt, ece, word_table)

torch.set_num_threads(int(os.environ.get("VS_THREADS", "2")))
SEED = 1234


def load16(stem):
    """train_filler.load() for the round-3 float16 layout (ami_prep_r3.to_f16); identical arrays up to f16 rounding."""
    j = json.load(open(stem + ".json"))
    if j.get("dtype") != "f2+t":
        return T.load(stem)
    t = np.fromfile(stem + ".t.bin", dtype="<f4").astype(np.float64)
    a = np.fromfile(stem + ".bin", dtype="<f2").reshape(-1, j["width16"]).astype(np.float32)
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
    return {"meta": j, "t": t, "rms": a[:, 0], "f0": a[:, 1], "speech": a[:, 2], "x": a[:, 3:].astype(np.float32), "lab": lab, "seg": seg}


def load_any(stem):
    d = load16(stem)
    if d["meta"].get("split") in ("train_neg", "neg_holdout"):
        # read speech: every speech frame is a non-filler frame, silence ignored
        d["lab"] = np.where(d["speech"] > 0, 0, -1).astype(np.int8)
    return d


def runs_detail(files, preds, thr, min_frames=10):
    """runs_eval's counting, plus per-run rows for the error analysis (duration, mean p, label)."""
    rows = []
    for d, p in zip(files, preds):
        on = (p >= thr) & (d["speech"] > 0)
        lab, n, i = d["lab"], len(on), 0
        while i < n:
            if not on[i]:
                i += 1
                continue
            j = i
            while j < n and on[j] and (j == i or d["t"][j] - d["t"][j - 1] <= 25):
                j += 1
            if j - i >= min_frames:
                seg = lab[i:j]
                if (seg >= 0).any():
                    rows.append({"tp": int((seg == 1).any()), "ms": (j - i) * 20, "pMean": float(p[i:j].mean()), "spk": d["meta"].get("speaker", "")})
            i = j
    return rows


def fa_rate(files, preds, thr, min_frames=10):
    runs = 0
    sp = 0.0
    for d, p in zip(files, preds):
        on = (p >= thr) & (d["speech"] > 0)
        i = 0
        while i < len(on):
            if on[i]:
                j = i
                while j < len(on) and on[j]:
                    j += 1
                if j - i >= min_frames:
                    runs += 1
                i = j
            else:
                i += 1
        sp += float(d["speech"].sum()) * 0.02 / 60
    return {"speechMin": round(sp, 1), "falseRunsPerSpeechMin": round(runs / max(1e-9, sp), 3), "runs": runs}


def wilson(k, n, z=1.96):
    if n == 0:
        return [None, None]
    p = k / n
    den = 1 + z * z / n
    c = (p + z * z / (2 * n)) / den
    h = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return [round(c - h, 4), round(c + h, 4)]


def event_ci(files, preds, thr, min_frames, B=1000, seed=7):
    """Speaker-clustered bootstrap CI on event precision (runs clustered by speaker)."""
    rows = runs_detail(files, preds, thr, min_frames)
    by = {}
    for r in rows:
        by.setdefault(r["spk"], []).append(r["tp"])
    keys = list(by)
    rng = np.random.default_rng(seed)
    reps = []
    for _ in range(B):
        pick = rng.integers(0, len(keys), len(keys))
        tp = sum(sum(by[keys[k]]) for k in pick)
        n = sum(len(by[keys[k]]) for k in pick)
        if n:
            reps.append(tp / n)
    k = sum(r["tp"] for r in rows)
    return {"precision": round(k / max(1, len(rows)), 4), "ci95Clustered": [round(float(np.percentile(reps, 2.5)), 4), round(float(np.percentile(reps, 97.5)), 4)], "wilson95": wilson(k, len(rows)), "runs": len(rows), "speakers": len(keys)}


def sweep(files, preds, min_frames_opts=(10, 12, 15)):
    out = []
    for mf in min_frames_opts:
        for thr in np.round(np.linspace(0.2, 0.95, 76), 3):
            r = T.runs_eval(files, preds, float(thr), mf)
            out.append({"thr": float(thr), "minFrames": mf, **r})
    return out


def choose(val_sweep, target):
    """Pre-registered: max VAL recall s.t. VAL precision >= target; ties -> higher precision. None if unreachable."""
    ok = [r for r in val_sweep if r["precision"] >= target and r["runs"] >= 50]
    if not ok:
        return None
    return max(ok, key=lambda r: (r["recall"], r["precision"]))


def f1_best(val_sweep, mf=10):
    rs = [r for r in val_sweep if r["minFrames"] == mf]
    f = lambda r: 0 if r["precision"] + r["recall"] == 0 else 2 * r["precision"] * r["recall"] / (r["precision"] + r["recall"])
    return max(rs, key=f)


def train(files_tr, files_va, hidden, bi, epochs, steps, log, neg_weight=1.0):
    torch.manual_seed(SEED)
    rng = np.random.default_rng(SEED)
    m = T.Det(files_tr[0]["x"].shape[1], hidden, bi)
    opt = torch.optim.Adam(m.parameters(), lr=3e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    lab = np.concatenate([d["lab"] for d in files_tr if d["meta"].get("corpus") == "ami"])
    pos_w = torch.tensor(min(20.0, (lab == 0).sum() / max(1, (lab == 1).sum())) / 4)
    ami = [d for d in files_tr if d["meta"].get("corpus") == "ami"]
    neg = [d for d in files_tr if d["meta"].get("corpus") != "ami"]
    best, best_state, hist = -1, None, []
    for ep in range(epochs):
        m.train()
        t0 = time.time()
        tot = 0
        for _ in range(steps):
            if neg:
                X1, Y1 = T.crops(ami, 26, rng)
                X2, Y2 = T.crops(neg, 6, rng)
                X, Y = torch.cat([X1, X2]), torch.cat([Y1, Y2])
                W = torch.ones_like(Y)
                W[26:] = neg_weight
            else:
                X, Y = T.crops(ami, 32, rng)
                W = torch.ones_like(Y)
            logit = m(X)
            mask = Y >= 0
            loss = (nn.functional.binary_cross_entropy_with_logits(logit[mask], Y[mask], pos_weight=pos_w, reduction="none") * W[mask]).mean()
            opt.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(m.parameters(), 1.0)
            opt.step()
            tot += float(loss.detach())
        sched.step()
        pv = [T.predict(m, d) for d in files_va]
        wt = T.word_table(files_va, pv)
        a = T.auroc([r["p"] for r in wt], [r["y"] for r in wt])
        hist.append({"epoch": ep, "loss": round(tot / steps, 4), "valWordAuroc": round(a, 4), "s": round(time.time() - t0, 1)})
        log(json.dumps(hist[-1]))
        if a > best:
            best, best_state = a, {k: v.clone() for k, v in m.state_dict().items()}
    m.load_state_dict(best_state)
    return m, best, hist


def evaluate(name, pred, S, fleurs, target, log):
    """All the numbers for one predictor; operating point chosen on VAL only."""
    pv = [pred(d) for d in S["val"]]
    vs = sweep(S["val"], pv)
    op = choose(vs, target)
    f1 = f1_best(vs)
    pt = [pred(d) for d in S["test"]]
    wt = T.word_table(S["test"], pt)
    units = [(r["spk"], r) for r in wt]
    st = lambda rs: T.auroc([r["p"] for r in rs], [r["y"] for r in rs])
    res = {"name": name, "val": {"opAtTarget": op, "f1Best": f1}, "test": {"wordAuroc": T.cluster_ci(units, st)}}
    for key, o in (("atTarget", op), ("atF1", f1)):
        if o is None:
            res["test"][key] = None
            continue
        thr, mf = o["thr"], o["minFrames"]
        ev = T.runs_eval(S["test"], pt, thr, mf)
        ci = event_ci(S["test"], pt, thr, mf)
        ind = [d for d in S["test"] if d["meta"].get("l1") in {"Hindi", "Telugu", "Tamil", "Malayalam", "Konkani"}]
        evi = T.runs_eval(ind, [p for d, p in zip(S["test"], pt) if d in ind], thr, mf)
        fa = {}
        for role in ("dev15", "devall"):
            for lang in ("hi_in", "en_us"):
                fs = [d for d in fleurs if d["meta"].get("role") == role and d["meta"].get("l1") == lang]
                if fs:
                    fa[f"{lang}.{role}"] = fa_rate(fs, [pred(d) for d in fs], thr, mf)
        hold = [d for d in fleurs if d["meta"].get("split") == "neg_holdout"]
        res["test"][key] = {"thr": thr, "minFrames": mf, "event": ev, "eventCi": ci, "eventIndianL1": evi, "fleursFalseAlarms": fa,
                            "negHoldout": fa_rate(hold, [pred(d) for d in hold], thr, mf) if hold else None}
    log(json.dumps({"name": name, "val": res["val"], "test": res["test"]}, default=float)[:1500])
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ami", required=True)
    ap.add_argument("--fleurs")
    ap.add_argument("--out", required=True)
    ap.add_argument("--model-dir", required=True)
    ap.add_argument("--baseline", default=os.path.join(ROOT, "models/voicesig/filler-gru.onnx"))
    ap.add_argument("--epochs", type=int, default=16)
    ap.add_argument("--steps", type=int, default=150)
    ap.add_argument("--target", type=float, default=0.82)
    ap.add_argument("--cands", default="base,bi32-more,bi32-more-neg,bi48-more-neg")
    ap.add_argument("--baseline-only", action="store_true")
    ap.add_argument("--base-from", help="reuse the 'base' block of an earlier --baseline-only run on the same splits (saves the slow re-evaluation)")
    a = ap.parse_args()
    log = lambda s: print(s, flush=True)
    stems = sorted(f[:-5] for f in glob.glob(os.path.join(a.ami, "*.json")) if not f.endswith(".regions.json"))
    files = [d for d in (load_any(s) for s in stems) if "split" in d["meta"]]
    S = {k: [d for d in files if d["meta"]["split"] == k] for k in ("train", "val", "test")}
    spk = {k: {d["meta"]["speaker"] for d in v} for k, v in S.items()}
    assert not (spk["train"] & spk["test"]) and not (spk["val"] & spk["test"]) and not (spk["train"] & spk["val"]), "speaker leakage"
    fleurs = []
    if a.fleurs:
        fs = sorted(f[:-5] for f in glob.glob(os.path.join(a.fleurs, "*.json")))
        fleurs = [load_any(s) for s in fs]
        # the LAST train chunk of each language is held out from training (selection checks), never trained on
        for lang in ("hi_in", "en_us"):
            tr = sorted([d for d in fleurs if d["meta"].get("split") == "train_neg" and d["meta"].get("l1") == lang], key=lambda d: d["meta"]["meeting"])
            if len(tr) >= 2:
                tr[-1]["meta"]["split"] = "neg_holdout"
                tr[-1]["lab"] = np.where(tr[-1]["speech"] > 0, 0, -1).astype(np.int8)
    neg_tr = [d for d in fleurs if d["meta"].get("split") == "train_neg"]
    def counts(fs):
        lab = np.concatenate([d["lab"] for d in fs]) if fs else np.zeros(0)
        w = [r for d in fs for r in T.words_of(d)]
        return {"channels": len(fs), "speakers": len({d["meta"]["speaker"] for d in fs}), "hours": round(sum(len(d["t"]) for d in fs) * 0.02 / 3600, 2),
                "fillerFrames": int((lab == 1).sum()), "wordFrames": int((lab == 0).sum()), "fillerWords": sum(1 for x in w if x[2] == 1), "otherWords": sum(1 for x in w if x[2] == 0)}
    res = {"date": time.strftime("%Y-%m-%d"), "harness": "evals/voicesig/r3/train_r3.py (runs_eval / word_table imported from evals/voicesig/train/train_filler.py)",
           "data": {k: counts(v) for k, v in S.items()}, "fleursNegTrain": {"chunks": len(neg_tr), "speechMin": round(sum(float(d["speech"].sum()) for d in neg_tr) * 0.02 / 60, 1)},
           "target": a.target, "seed": SEED, "candidates": {}}
    log(json.dumps(res["data"]))
    import onnxruntime as ort
    if a.base_from:
        prev = json.load(open(a.base_from))
        assert prev["data"]["test"] == res["data"]["test"] and prev["data"]["val"] == res["data"]["val"], "base-from was measured on other splits"
        res["candidates"]["base"] = prev["candidates"]["base"]
        res["candidates"]["base"]["reusedFrom"] = os.path.basename(a.base_from)
    # BEFORE: the shipped model, re-measured on today's regenerated features (same harness)
    sess0 = ort.InferenceSession(a.baseline, providers=["CPUExecutionProvider"]) if not a.base_from else None
    def pred0(d):
        p = np.zeros(len(d["t"]), np.float32)
        for s0, s1 in zip(d["seg"][:-1], d["seg"][1:]):
            p[s0:s1] = sess0.run(None, {"x": d["x"][s0:s1][None]})[0][0]
        return p
    if a.base_from:
        base = res["candidates"]["base"]
    else:
        base = evaluate("shipped filler-gru/1-bi32", pred0, S, fleurs, a.target, log)
    # the shipped operating point (thr 0.44, 200 ms) on the same test: must reproduce 0.7526 / 0.6012 / 1241
    if not a.base_from:
        pt0 = [pred0(d) for d in S["test"]]
        base["test"]["shippedOp"] = {"thr": 0.44, "minFrames": 10, "event": T.runs_eval(S["test"], pt0, 0.44, 10), "eventCi": event_ci(S["test"], pt0, 0.44, 10)}
        fa0 = {}
        for role in ("dev15", "devall"):
            for lang in ("hi_in", "en_us"):
                fs = [d for d in fleurs if d["meta"].get("role") == role and d["meta"].get("l1") == lang]
                if fs:
                    fa0[f"{lang}.{role}"] = fa_rate(fs, [pred0(d) for d in fs], 0.44, 10)
        base["test"]["shippedOp"]["fleursFalseAlarms"] = fa0
        res["candidates"]["base"] = base
    log("BASELINE shippedOp " + json.dumps(base["test"].get("shippedOp")))
    json.dump(res, open(a.out, "w"), indent=1, default=float)
    if a.baseline_only:
        return
    os.makedirs(a.model_dir, exist_ok=True)
    plan = {"bi32-more": (32, True, False), "bi32-more-neg": (32, True, True), "bi48-more-neg": (48, True, True), "bi32-more-neg2": (32, True, "x2")}
    for name in a.cands.split(","):
        if name not in plan:
            continue
        hid, bi, neg = plan[name]
        tr = S["train"] + (neg_tr if neg else [])
        m, best, hist = train(tr, S["val"], hid, bi, a.epochs, a.steps, lambda s, n=name: log(n + " " + s), neg_weight=2.0 if neg == "x2" else 1.0)
        pred = lambda d, m=m: T.predict(m, d)
        r = evaluate(name, pred, S, fleurs, a.target, log)
        r["params"] = sum(p.numel() for p in m.parameters())
        r["valWordAurocBest"] = round(best, 4)
        r["history"] = hist
        # export every candidate (the chosen one is copied into models/ by hand after review)
        w = T.Wrap(m).eval()
        path = os.path.join(a.model_dir, f"{name}.onnx")
        dummy = torch.from_numpy(S["test"][0]["x"][:250][None])
        torch.onnx.export(w, dummy, path, input_names=["x"], output_names=["p"], dynamic_axes={"x": {1: "T"}, "p": {1: "T"}}, opset_version=17, dynamo=False)
        s = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
        xs = S["test"][1]["x"][:1500][None]
        r["export"] = {"path": path, "bytes": os.path.getsize(path), "maxAbsDiffTorchVsOrt": float(np.abs(w(torch.from_numpy(xs)).detach().numpy() - s.run(None, {"x": xs})[0]).max())}
        # Platt on val words (calibrated word probability, as the card ships)
        pv = [T.predict(m, d) for d in S["val"]]
        wv = T.word_table(S["val"], pv)
        r["platt"] = T.platt(np.array([x["p"] for x in wv]), np.array([x["y"] for x in wv]))
        res["candidates"][name] = r
        json.dump(res, open(a.out, "w"), indent=1, default=float)
    # SELECTION (val only): among candidates whose val operating point reaches the target, the highest val recall;
    # a Hindi negative-holdout false-alarm rate above the shipped model's is a veto.
    def val_key(n):
        op = res["candidates"][n]["val"]["opAtTarget"]
        return -1 if op is None else op["recall"]
    names = [n for n in res["candidates"] if n != "base"]
    res["chosen"] = max(names, key=val_key) if names else None
    res["selectionRule"] = "max VAL recall at VAL precision >= target (min 50 runs); test read only for the report"
    json.dump(res, open(a.out, "w"), indent=1, default=float)
    log("CHOSEN " + str(res["chosen"]))


if __name__ == "__main__":
    main()
