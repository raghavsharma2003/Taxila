# Stage B of the Continuous Conversational Engine (ARCHITECTURE.md v2 §5.2): a small multimodal floor model.
#
# Design (and why it departs from §5.2's sketch; see docs/research/duplex/ENGINE-MODEL.md):
#   audio branch   Smart Turn v3.2's Whisper-tiny-class encoder, FROZEN (BSD-2): its attention-pooled 384-d embedding of the
#                  last <= 8 s of the child's floor, plus Smart Turn's own end-of-turn logit. Not fine-tuned: the training
#                  audio is 4 Azure TTS voices with scripted prosody (rj-sig-tts-fillers-validate-a7); a fine-tuned encoder
#                  would learn those voices, and the test split holds out the voices to catch exactly that.
#   text/context   the engine's own feature vector (features.ts, cce-features/1: answer-form state, Hinglish markers,
#                  horizon, prosody, pace, context one-hots) — the code reads the words, the model weighs the evidence.
#                  No neural text encoder: no licence-checked Hinglish child text corpus to tune one, and the 20 MB budget.
#   fusion         late fusion MLP: Linear(384→32) on audio, Linear(F→64) on features, concat with the Smart Turn logit and
#                  an audio-missing flag → 64 → two heads (pComplete, pHoldWanted). Audio dropout 0.2 in training so the
#                  model stays sane when the audio branch is late or absent (the runtime then sends the missing flag).
#   sampling       silence-matched (§5.3 step 5): per silence bin, end and not-end ticks carry equal total weight, so the
#                  heads cannot use silence length as a crutch; the realistic prior enters only through calibration.
#   calibration    per-exchange Platt scaling fitted on OUT-OF-FOLD train predictions (GroupKFold by template family),
#                  folded into the exported graph as a per-context affine map on the logit.
#   splits         frozen by split.mjs: test = held-out template families AND held-out voices; dev = 4 more template
#                  families. Test is scored once, after every choice is frozen.
# Outputs: models/duplex/cce-stageb-<ver>.onnx (head), .json (manifest + weights for the JS replay), and
#          /tmp/taxila-fdb/models/cce-stageb-full.onnx (Smart Turn encoder + head merged, for the latency measurement).
#   python3 scripts/duplex/train_stageb.py [--epochs 10]
import json, os, sys, time, math
import numpy as np
import torch
import torch.nn as nn

TICKS = os.environ.get("TAXILA_FDB_TICKS", "/tmp/taxila-fdb/ticks")
FEAT = os.environ.get("TAXILA_FDB_FEAT", "/tmp/taxila-fdb/feat")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUTDIR = os.path.join(ROOT, "models/duplex")
VERSION = "2026-10-04.1"
EXCH = ["closed_answer", "open_explanation", "question_to_her", "chit_chat", "free"]
torch.set_num_threads(2)
torch.manual_seed(20261004); np.random.seed(20261004)

meta = json.load(open(os.path.join(TICKS, "meta.json")))
NAMES = meta["names"]; F = len(NAMES)
SIL = NAMES.index("child.silence.log")
VOI = NAMES.index("child.voicing")
EX0 = NAMES.index("exchange.closed_answer")

_fcache = {}
def feat_rows(sid):
    if sid in _fcache: return _fcache[sid]
    f = os.path.join(FEAT, sid + ".f32")
    a = np.fromfile(f, dtype=np.float32).reshape(-1, 450) if os.path.exists(f) else np.zeros((0, 450), np.float32)
    if len(_fcache) > 400: _fcache.clear()
    _fcache[sid] = a
    return a

def load(split):
    p = os.path.join(TICKS, split + ".jsonl")
    rows = [json.loads(l) for l in open(p) if l.strip()]
    # decisions are only ever taken while the child is silent: train and score on silent ticks (voicing ticks are a
    # trivially "not complete" mass that otherwise dominates the loss)
    rows = [r for r in rows if r["f"][NAMES.index("child.voicing")] < 0.5]
    X = np.array([r["f"] for r in rows], np.float32)
    E = np.zeros((len(rows), 384), np.float32); S = np.zeros((len(rows), 1), np.float32); M = np.ones((len(rows), 1), np.float32)
    for i, r in enumerate(rows):
        a = feat_rows(r["id"])
        if not len(a): continue
        k = np.searchsorted(a[:, 0], r["t"], side="right") - 1
        if k >= 0 and r["t"] - a[k, 0] <= 400:
            E[i] = a[k, 2:386]; p = float(np.clip(a[k, 1], 1e-4, 1 - 1e-4)); S[i, 0] = math.log(p / (1 - p)); M[i, 0] = 0.0
    yE = np.array([r["yEnd"] for r in rows], np.float32); yH = np.array([r["yHold"] for r in rows], np.float32)
    return rows, X, E, S, M, yE, yH

def silence_weights(X, y):
    sil_ms = np.where(X[:, VOI] > 0.5, -1, np.expm1(np.maximum(X[:, SIL], 0)) * 1000)
    edges = [-0.5, 1, 200, 400, 700, 1000, 1500, 2500, 1e9]
    w = np.ones(len(y), np.float32)
    b = np.digitize(sil_ms, edges)
    for k in np.unique(b):
        m = b == k; pos = (y[m] == 1).sum(); neg = (y[m] == 0).sum()
        if pos and neg:
            w[m & (y == 1)] = 0.5 * m.sum() / pos; w[m & (y == 0)] = 0.5 * m.sum() / neg
    return w / w.mean()

class Fusion(nn.Module):
    def __init__(self, F, use_audio=True, use_feat=True):
        super().__init__()
        self.use_audio, self.use_feat = use_audio, use_feat
        self.a = nn.Sequential(nn.Linear(384, 32), nn.GELU())
        self.f = nn.Sequential(nn.Linear(F, 64), nn.GELU())
        self.mu = nn.Parameter(torch.zeros(F), requires_grad=False); self.sd = nn.Parameter(torch.ones(F), requires_grad=False)
        self.h = nn.Sequential(nn.Linear(64 + 32 + 2, 64), nn.GELU(), nn.Linear(64, 2))
        self.cal_a = nn.Parameter(torch.ones(len(EXCH), 2), requires_grad=False); self.cal_b = nn.Parameter(torch.zeros(len(EXCH), 2), requires_grad=False)
    def logits(self, x, e, s, m):
        xf = (x - self.mu) / self.sd
        hf = self.f(xf) if self.use_feat else torch.zeros(x.shape[0], 64)
        if self.use_audio:
            ha = self.a(e) * (1 - m); sa = s * (1 - m); mm = m
        else:
            ha = torch.zeros(x.shape[0], 32); sa = torch.zeros_like(s); mm = torch.ones_like(m)
        return self.h(torch.cat([hf, ha, sa, mm], 1))
    def forward(self, x, e, s, m):
        z = self.logits(x, e, s, m)
        oh = x[:, EX0:EX0 + len(EXCH)]
        a = oh @ self.cal_a; b = oh @ self.cal_b
        a = torch.where(oh.sum(1, keepdim=True) > 0, a, torch.ones_like(a));
        return torch.sigmoid(z * a + b)

def train(d, use_audio=True, use_feat=True, epochs=10):
    rows, X, E, S, M, yE, yH = d
    model = Fusion(F, use_audio, use_feat)
    model.mu.data = torch.tensor(X.mean(0)); model.sd.data = torch.tensor(X.std(0) + 1e-3)
    wE = silence_weights(X, yE)
    opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
    t = lambda a: torch.tensor(a)
    Xt, Et, St, Mt, yEt, yHt, wt = t(X), t(E), t(S), t(M), t(yE), t(yH), t(wE)
    n = len(X); bce = nn.BCEWithLogitsLoss(reduction="none")
    for ep in range(epochs):
        perm = torch.randperm(n)
        for i in range(0, n, 512):
            idx = perm[i:i + 512]
            m = Mt[idx].clone()
            if use_audio: m = torch.maximum(m, (torch.rand(len(idx), 1) < 0.2).float())  # audio dropout
            z = model.logits(Xt[idx], Et[idx], St[idx], m)
            loss = (bce(z[:, 0], yEt[idx]) * wt[idx]).mean() + 0.5 * bce(z[:, 1], yHt[idx]).mean()
            opt.zero_grad(); loss.backward(); opt.step()
    return model

def raw_logits(model, d):
    rows, X, E, S, M, yE, yH = d
    with torch.no_grad():
        return model.logits(torch.tensor(X), torch.tensor(E), torch.tensor(S), torch.tensor(M)).numpy()

def auc(y, p):
    o = np.argsort(p); y = y[o]; n1 = y.sum(); n0 = len(y) - n1
    if n1 == 0 or n0 == 0: return None
    r = np.arange(1, len(y) + 1)
    return float((r[y == 1].sum() - n1 * (n1 + 1) / 2) / (n1 * n0))

def ece(y, p, bins=10):
    e = 0.0
    for b in range(bins):
        m = (p >= b / bins) & ((p < (b + 1) / bins) if b < bins - 1 else (p <= 1))
        if m.sum(): e += m.mean() * abs(p[m].mean() - y[m].mean())
    return float(e)

def platt(z, y, iters=300):
    a, b = 1.0, 0.0
    for _ in range(iters):  # Newton steps on the logistic loss
        p = 1 / (1 + np.exp(-(a * z + b))); g_a = ((p - y) * z).mean(); g_b = (p - y).mean()
        w = p * (1 - p) + 1e-6; h_aa = (w * z * z).mean(); h_ab = (w * z).mean(); h_bb = w.mean()
        det = h_aa * h_bb - h_ab * h_ab
        if abs(det) < 1e-12: break
        a -= (h_bb * g_a - h_ab * g_b) / det; b -= (h_aa * g_b - h_ab * g_a) / det
    return float(a), float(b)

def subset(d, mask):
    rows, X, E, S, M, yE, yH = d
    return ([r for r, k in zip(rows, mask) if k], X[mask], E[mask], S[mask], M[mask], yE[mask], yH[mask])

def silence_only(d):
    return d[1][:, VOI] < 0.5

def report(name, d, p):
    rows, X, E, S, M, yE, yH = d
    s = silence_only(d)
    out = {"ticks": int(len(yE)), "silentTicks": int(s.sum()), "aucEnd_silent": auc(yE[s], p[s, 0]), "aucHold_silent": auc(yH[s], p[s, 1]),
           "eceEnd_silent": ece(yE[s], p[s, 0]), "eceByExchange": {}}
    ex = np.array([r["exchange"] for r in rows])
    for k in EXCH:
        m = s & (ex == k)
        if m.sum() > 50: out["eceByExchange"][k] = {"n": int(m.sum()), "ece": round(ece(yE[m], p[m, 0]), 4), "auc": auc(yE[m], p[m, 0])}
    print(name, json.dumps({k: (round(v, 4) if isinstance(v, float) else v) for k, v in out.items() if k != "eceByExchange"}), flush=True)
    return out

if __name__ == "__main__":
    epochs = int(sys.argv[sys.argv.index("--epochs") + 1]) if "--epochs" in sys.argv else 10
    t0 = time.time()
    tr, dv, te = load("train"), load("dev"), load("test")
    print(f"train {len(tr[0])} ticks, dev {len(dv[0])}, test {len(te[0])}; audio present train {1 - tr[4].mean():.2f} test {1 - te[4].mean():.2f}", flush=True)
    # out-of-fold predictions grouped by template family (calibration + ablations), 5 folds
    tf = np.array([r["tfam"] for r in tr[0]]); fams = sorted(set(tf)); rng = np.random.RandomState(7); rng.shuffle(fams)
    folds = [set(fams[i::5]) for i in range(5)]
    res = {"version": VERSION, "date": "2026-10-04", "featureSpec": meta["featureSpec"], "ablations": {}}
    variants = {"fused": (True, True), "features_only": (False, True), "audio_only": (True, False)}
    oof = {}
    for vname, (ua, uf) in variants.items():
        z = np.zeros((len(tr[0]), 2), np.float32)
        for k, fs in enumerate(folds):
            m = np.array([x in fs for x in tf])
            mdl = train(subset(tr, ~m), ua, uf, epochs)
            z[m] = raw_logits(mdl, subset(tr, m))
        oof[vname] = z
        print(f"{vname}: OOF done ({time.time() - t0:.0f} s)", flush=True)
    # Smart Turn alone (its own probability) as a reference on the same ticks
    def st_only(d):
        p = 1 / (1 + np.exp(-d[3][:, 0])); p = np.where(d[4][:, 0] > 0.5, 0.5, p); return np.stack([p, 1 - p], 1)
    def stageA(d):
        return np.stack([np.array([r["pc"] for r in d[0]]), np.array([r["ph"] for r in d[0]])], 1)
    # calibrate per exchange on OOF, then train each variant on all train and evaluate on dev and test
    ex_tr = np.array([r["exchange"] for r in tr[0]])
    final = {}
    for vname, (ua, uf) in variants.items():
        cal = np.ones((len(EXCH), 2)), np.zeros((len(EXCH), 2))
        for j, k in enumerate(EXCH):
            m = ex_tr == k
            if m.sum() < 100: continue
            for h, y in ((0, tr[5]), (1, tr[6])):
                a, b = platt(oof[vname][m, h], y[m]); cal[0][j, h] = a; cal[1][j, h] = b
        mdl = train(tr, ua, uf, epochs)
        mdl.cal_a.data = torch.tensor(cal[0], dtype=torch.float32); mdl.cal_b.data = torch.tensor(cal[1], dtype=torch.float32)
        final[vname] = mdl
        def pred(d):
            with torch.no_grad():
                return mdl(torch.tensor(d[1]), torch.tensor(d[2]), torch.tensor(d[3]), torch.tensor(d[4])).numpy()
        oofp = 1 / (1 + np.exp(-oof[vname]))
        res["ablations"][vname] = {"oof_train_uncalibrated": report(f"{vname} OOF", tr, oofp), "dev": report(f"{vname} dev", dv, pred(dv)), "test": report(f"{vname} test", te, pred(te))}
    res["ablations"]["smart_turn_alone"] = {"dev": report("smart-turn dev", dv, st_only(dv)), "test": report("smart-turn test", te, st_only(te))}
    res["ablations"]["stage_a"] = {"dev": report("stage-A dev", dv, stageA(dv)), "test": report("stage-A test", te, stageA(te))}
    # export the variant that wins on DEV (selection never looks at test): AUC of pComplete on silent ticks
    os.makedirs(OUTDIR, exist_ok=True)
    pick = max(variants, key=lambda v: res["ablations"][v]["dev"]["aucEnd_silent"] or 0)
    res["exported_variant"] = pick
    print("exporting variant", pick, flush=True)
    mdl = final[pick].eval()
    use_audio = variants[pick][0]
    name = f"cce-stageb-{VERSION}"
    dummy = (torch.zeros(1, F), torch.zeros(1, 384), torch.zeros(1, 1), torch.ones(1, 1))
    class Export(nn.Module):
        def __init__(self, m): super().__init__(); self.m = m
        def forward(self, features, emb, st_logit, audio_missing):
            p = self.m(features, emb, st_logit, audio_missing); return p[:, 0:1], p[:, 1:2]
    onnx_path = os.path.join(OUTDIR, name + ".onnx")
    torch.onnx.export(Export(mdl), dummy, onnx_path, input_names=["features", "emb", "st_logit", "audio_missing"], output_names=["p_complete", "p_hold"],
                      dynamic_axes={k: {0: "b"} for k in ["features", "emb", "st_logit", "audio_missing", "p_complete", "p_hold"]}, opset_version=17, dynamo=False)
    sd = {k: v.detach().numpy().round(6).tolist() for k, v in mdl.state_dict().items()}
    manifest = {"id": "cce-stageb", "version": VERSION, "variant": pick, "useAudio": bool(use_audio), "featureSpec": meta["featureSpec"], "featureNames": NAMES, "audioMs": 8000 if use_audio else 0,
                "audio": {"encoder": "smart-turn-v3.2-cpu.onnx (BSD-2) with sum_1 exposed (st32-emb.onnx)", "window": "last <= 8 s of the child floor, zero-padded at the start", "embDim": 384},
                "exchanges": EXCH, "inputs": ["features", "emb", "st_logit", "audio_missing"], "outputs": ["p_complete", "p_hold"],
                "trained": {"ticks": int(len(tr[0])), "streams": len(set(r["id"] for r in tr[0])), "epochs": epochs}, "weights": sd}
    json.dump(manifest, open(os.path.join(OUTDIR, name + ".json"), "w"))
    res["export"] = {"onnx": os.path.relpath(onnx_path, ROOT), "onnxBytes": os.path.getsize(onnx_path), "json": os.path.relpath(os.path.join(OUTDIR, name + ".json"), ROOT)}
    # parity samples for the JS replay test (first 64 test ticks)
    with torch.no_grad():
        pp = mdl(torch.tensor(te[1][:64]), torch.tensor(te[2][:64]), torch.tensor(te[3][:64]), torch.tensor(te[4][:64]) if use_audio else torch.ones(64, 1)).numpy()
    json.dump({"features": te[1][:64].round(5).tolist(), "emb": te[2][:64].round(5).tolist(), "st": te[3][:64].round(5).tolist(), "missing": (te[4][:64] if use_audio else np.ones((64, 1), np.float32)).tolist(), "p": pp.round(6).tolist()},
              open(os.path.join(ROOT, "evals/duplex/taxilafdb/data/stageb-parity.json"), "w"))
    res["seconds"] = round(time.time() - t0)
    json.dump(res, open(os.path.join(ROOT, "evals/duplex/results/taxilafdb-stageb-train-2026-10-04.json"), "w"), indent=1)
    print("exported", res["export"], f"{res['seconds']} s")
