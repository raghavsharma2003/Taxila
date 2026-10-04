"""Check that the front-end log-mel ring (src/voicesig/frontend/logmel.ts, dumped by a node script) equals Hugging Face's
WhisperFeatureExtractor(chunk_length=8) -- the Smart Turn v3 input -- on the same 8 s clip. Interior frames only (the
extractor reflect-pads the clip edges; the streaming ring sees real audio there).
usage: python3 check_whisper_mel.py <wav> <mel-js.json>"""
import json, sys
import numpy as np, soundfile as sf
from transformers import WhisperFeatureExtractor
x, sr = sf.read(sys.argv[1], dtype="float32")
j = json.load(open(sys.argv[2]))
c0 = j["c0"]
clip = x[c0 : c0 + 8 * 16000]
fe = WhisperFeatureExtractor(feature_size=80, sampling_rate=16000, hop_length=160, chunk_length=8, n_fft=400)
hf = fe(clip, sampling_rate=16000, return_tensors="np")["input_features"][0]
js = np.array(j["w"], dtype=np.float32).reshape(80, 800)
d = np.abs(hf[:, 3:-3] - js[:, 3:-3])
print(json.dumps({"frames": hf.shape[1], "interiorMaxAbsDiff": float(d.max()), "interiorMeanAbsDiff": float(d.mean()), "hfRange": [float(hf.min()), float(hf.max())]}))
