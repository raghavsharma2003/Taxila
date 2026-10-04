# A small knowledge-state head over handcrafted prosodic contours (the dsp.ts front-end) plus utterance scalars.
# Untrained (random init): this file exists to measure size and latency, not accuracy.
import os, json, torch
torch.manual_seed(0)
OUT = os.path.join(os.environ.get("VS_WORK", os.path.join(os.path.dirname(os.path.abspath(__file__)), ".work")), "models")

FRAME_FEATS = 10   # per 10 ms frame: st re child median F0, voicing p, energy dB re utterance p90, dF0, dE, voiced flag,
                   # flat-run flag, spectral-flux proxy, zero-cross rate, time-to-end (0..1)
SCALARS = 16       # onset z, content-onset z, pause count/longest/frac z, rate z, duration, words, filler count, ...
HEADS = 7          # fluent_recall, effortful_recall, searching (tip-of-tongue), guessing, reasoning_aloud, unsure_correct_risk, no_evidence

class ProsodyNet(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = torch.nn.Sequential(
            torch.nn.Conv1d(FRAME_FEATS, 32, 5, padding=2), torch.nn.GELU(),
            torch.nn.Conv1d(32, 32, 5, padding=2, stride=2), torch.nn.GELU())
        self.gru = torch.nn.GRU(32, 48, batch_first=True, bidirectional=True)
        self.att = torch.nn.Linear(96, 1)
        self.mlp = torch.nn.Sequential(torch.nn.Linear(96 + SCALARS, 64), torch.nn.GELU(), torch.nn.Linear(64, HEADS))
    def forward(self, frames, scalars):       # frames [B, T, F], scalars [B, S]
        h = self.conv(frames.transpose(1, 2)).transpose(1, 2)
        h, _ = self.gru(h)
        w = torch.softmax(self.att(h), dim=1)
        pooled = (w * h).sum(dim=1)
        return self.mlp(torch.cat([pooled, scalars], dim=1))

m = ProsodyNet().eval()
n = sum(p.numel() for p in m.parameters())
f, s = torch.randn(1, 800, FRAME_FEATS), torch.randn(1, SCALARS)
path = os.path.join(OUT, "prosody-gru.fp32.onnx")
torch.onnx.export(m, (f, s), path, input_names=["frames", "scalars"], output_names=["logits"],
                  dynamic_axes={"frames": {1: "T"}}, opset_version=17, dynamo=False)
print(json.dumps({"name": "prosody-gru", "params": n, "fp32_KB": round(os.path.getsize(path) / 1e3, 1)}))

# A logistic baseline over the same scalars plus 12 contour summaries: 29 inputs x 7 heads.
lin = torch.nn.Linear(SCALARS + 12, HEADS).eval()
p2 = os.path.join(OUT, "prosody-logit.fp32.onnx")
torch.onnx.export(lin, (torch.randn(1, SCALARS + 12),), p2, input_names=["x"], output_names=["logits"], opset_version=17, dynamo=False)
print(json.dumps({"name": "prosody-logit", "params": sum(p.numel() for p in lin.parameters()), "fp32_KB": round(os.path.getsize(p2) / 1e3, 1)}))
