# Export candidate speech encoders to ONNX (fp32) and dynamic-int8, then delete the torch weights.
# Usage: python3 export.py <name>
import os, sys, time, json, shutil
os.environ.setdefault("HF_HOME", os.path.join(os.environ.get("VS_WORK", os.path.join(os.path.dirname(os.path.abspath(__file__)), ".work")), "hf"))
import torch
from onnxruntime.quantization import quantize_dynamic, QuantType

OUT = os.path.join(os.environ.get("VS_WORK", os.path.join(os.path.dirname(os.path.abspath(__file__)), ".work")), "models")
os.makedirs(OUT, exist_ok=True)
name = sys.argv[1]

SPECS = {
    "wav2vec2-base": ("facebook/wav2vec2-base", "w2v"),
    "hubert-base": ("facebook/hubert-base-ls960", "w2v"),
    "wavlm-base-plus": ("microsoft/wavlm-base-plus", "w2v"),
    "distilhubert": ("ntu-spml/distilhubert", "w2v"),
    "whisper-tiny-enc": ("openai/whisper-tiny", "whisper"),
    "whisper-base-enc": ("openai/whisper-base", "whisper"),
}
repo, kind = SPECS[name]
t0 = time.time()

class W2V(torch.nn.Module):
    def __init__(self, m):
        super().__init__(); self.m = m
    def forward(self, x):
        o = self.m(x, output_hidden_states=False)
        h = o.last_hidden_state
        return h, h.mean(dim=1)

class WEnc(torch.nn.Module):
    def __init__(self, m):
        super().__init__(); self.m = m
    def forward(self, feats):
        h = self.m(feats).last_hidden_state
        return h, h.mean(dim=1)

if kind == "w2v":
    from transformers import AutoModel
    base = AutoModel.from_pretrained(repo, attn_implementation="eager")
    base.eval()
    mod = W2V(base)
    dummy = torch.randn(1, 16000 * 3)
    nparams = sum(p.numel() for p in base.parameters())
    inp_names, dyn = ["audio"], {"audio": {1: "samples"}, "hidden": {1: "frames"}}
else:
    from transformers import WhisperModel
    wm = WhisperModel.from_pretrained(repo, attn_implementation="eager")
    enc = wm.encoder
    # Smart Turn-style 8 s window: 800 mel frames. Whisper's positional table is 1500; slice it to 400.
    enc.embed_positions.weight.data = enc.embed_positions.weight.data[:400].clone()
    enc.embed_positions.num_embeddings = 400
    enc.config.max_source_positions = 400
    enc.eval()
    mod = WEnc(enc)
    nmel = wm.config.num_mel_bins
    dummy = torch.randn(1, nmel, 800)
    nparams = sum(p.numel() for p in enc.parameters())
    inp_names, dyn = ["input_features"], None

fp32 = os.path.join(OUT, f"{name}.fp32.onnx")
with torch.no_grad():
    ref = mod(dummy)
    torch.onnx.export(mod, (dummy,), fp32, input_names=inp_names, output_names=["hidden", "pooled"],
                      dynamic_axes=dyn, opset_version=17, dynamo=False)
int8 = os.path.join(OUT, f"{name}.int8.onnx")
quantize_dynamic(fp32, int8, weight_type=QuantType.QInt8, op_types_to_quantize=["MatMul", "Gemm"])

# Fidelity of int8 vs torch on the dummy input (cosine of pooled embedding).
import onnxruntime as ort
s = ort.InferenceSession(int8, providers=["CPUExecutionProvider"])
o = s.run(None, {inp_names[0]: dummy.numpy()})
import numpy as np
a, b = ref[1].numpy().ravel(), o[1].ravel()
cos = float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
res = {"name": name, "repo": repo, "params_M": round(nparams / 1e6, 2),
       "fp32_MB": round(os.path.getsize(fp32) / 1e6, 1), "int8_MB": round(os.path.getsize(int8) / 1e6, 1),
       "int8_vs_torch_pooled_cos": round(cos, 4), "export_s": round(time.time() - t0, 1)}
print(json.dumps(res))
with open(os.path.join(OUT, "export-results.jsonl"), "a") as f:
    f.write(json.dumps(res) + "\n")
# Free disk: drop the HF download.
shutil.rmtree(os.path.join(os.environ["HF_HOME"], "hub"), ignore_errors=True)
