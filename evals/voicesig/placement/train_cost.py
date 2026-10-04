# CPU training-cost probes (4 vCPU Xeon 2.1 GHz, shared with other jobs: upper bounds).
# (1) ProsodyNet head: one epoch over 3,200 synthetic answers (E1 size) and the per-sample rate.
# (2) Whisper-tiny encoder fine-tune: fwd+bwd per batch of 8 x 8 s mel (the Smart Turn input), i.e. what a
#     full encoder fine-tune on E1-scale audio would cost without a GPU.
import os, time, json, torch
os.environ.setdefault("HF_HOME", os.path.join(os.environ.get("VS_WORK", os.path.join(os.path.dirname(os.path.abspath(__file__)), ".work")), "hf"))
torch.set_num_threads(4); torch.manual_seed(0)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "prosody_net.py")).read().split("m = ProsodyNet()")[0])
res = {}
m = ProsodyNet(); opt = torch.optim.AdamW(m.parameters(), 1e-3)
N, B = 3200, 32
X = torch.randn(N, 400, FRAME_FEATS); S = torch.randn(N, SCALARS); Y = torch.randint(0, HEADS, (N,))
t = time.time()
for i in range(0, N, B):
    loss = torch.nn.functional.cross_entropy(m(X[i:i+B], S[i:i+B]), Y[i:i+B]); opt.zero_grad(); loss.backward(); opt.step()
res["prosody_gru_epoch_3200_s"] = round(time.time() - t, 2)

from transformers import WhisperModel
enc = WhisperModel.from_pretrained("openai/whisper-tiny").encoder
enc.embed_positions.weight.data = enc.embed_positions.weight.data[:400].clone(); enc.embed_positions.num_embeddings = 400; enc.config.max_source_positions = 400
head = torch.nn.Linear(384, HEADS)
opt = torch.optim.AdamW(list(enc.parameters()) + list(head.parameters()), 1e-5)
x = torch.randn(8, 80, 800); y = torch.randint(0, HEADS, (8,))
times = []
for k in range(6):
    t = time.time()
    h = enc(x).last_hidden_state.mean(1); loss = torch.nn.functional.cross_entropy(head(h), y)
    opt.zero_grad(); loss.backward(); opt.step(); times.append(time.time() - t)
times = sorted(times[1:])
res["whisper_tiny_ft_fwd_bwd_batch8_s_min"] = round(times[0], 2)
res["whisper_tiny_ft_fwd_bwd_batch8_s_median"] = round(times[len(times) // 2], 2)
res["whisper_tiny_ft_clip_passes_per_s"] = round(8 / times[0], 1)
# Frozen-encoder embedding extraction in torch (no grad), batch 8.
with torch.no_grad():
    t = time.time(); enc(x); res["whisper_tiny_embed_batch8_s"] = round(time.time() - t, 2)
print(json.dumps(res))
