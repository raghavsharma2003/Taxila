#!/usr/bin/env python3
"""stt-v3 open-weight STT bench: the shortlisted self-hostable models on the SAME corpus the 2026-10-04 refresh used.

Build-time experiment only (decision aws-build-gpu); nothing here is product runtime. Runs on a throwaway AWS GPU
instance under scripts/gpu/run.py (see run.sh). Every model runs through transformers 5.x, one venv.

    python bench_open.py run   --arm N6hi --corpus corpus --out $OUT [--smoke] [--no-paced] [--no-load] [--no-soak]
    python bench_open.py arms                       # list arms
    python bench_open.py gen-nonspeech --corpus DIR # write the 18 extra non-speech + 4 babble clips (local, numpy)

What one `run` writes to <out>/<arm>/ (all text is model output on SYNTHETIC TTS clips; nothing child-identifying):
  rows.jsonl   one line per clip, unpaced. Text plus, for streaming arms, algorithmic timings in AUDIO time
               (when, measured on the audio clock, the text first appeared / last changed, relative to speech onset/end).
  paced.jsonl  streaming arms only: a subset re-run with audio fed at real time; WALL-clock first partial, last text
               change and stream-done times relative to speech onset/end, partial cadence. Batch arms: reqMs per clip.
  load.json    concurrency. Streaming arms: B synchronous streams batched per chunk step, unpaced (step time per
               chunk vs chunk duration = RTF), then a paced confirmation run at the largest sustainable B
               (lag of each chunk behind real time). Batch arms: B utterances per generate call, latency vs B.
  soak.json    streaming arms: one 10-minute always-on stream (corpus clips separated by 4-25 s of non-speech);
               every character emitted while no speech is present is counted.
  env.json     GPU, versions, model repo + revision, file sha256, load time, peak memory.
The scorer is NOT here: rows are scored locally by evals/stt-v3/analyze.mjs with the repo's existing STT scorer.
"""
import argparse
import gc
import hashlib
import json
import math
import os
import random
import sys
import threading
import time
import traceback
from pathlib import Path
from types import GeneratorType

import numpy as np

SR = 16000
HERE = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------------------------------------------------
# models (exact revisions; LICENCES.md records licence + sha256 of every weight file)
REPOS = {
    "nemotron": ("nvidia/nemotron-3.5-asr-streaming-0.6b", "ea30d66debe3740a08b573244286791d423d6b3e"),
    "voxtral": ("mistralai/Voxtral-Mini-4B-Realtime-2602", "2769294da9567371363522aac9bbcfdd19447add"),
    "qwen17": ("Qwen/Qwen3-ASR-1.7B-hf", "bcd2b5b7f32b480ab5790554cfa8347f246a14f3"),
    "qwen06": ("Qwen/Qwen3-ASR-0.6B-hf", "7f1569a48a89f3e3f4dc3a5c9d28bddd903bc76c"),
    "zero": ("shunyalabs/zero-stt-hinglish", "93b882ac4f1d470d910ef8e1e48d44d51a439cc6"),
}
# only what transformers needs (Voxtral also ships consolidated.safetensors for vLLM: not downloaded)
PATTERNS = {
    "nemotron": ["*.json", "model.safetensors"],
    "voxtral": ["*.json", "model.safetensors", "tekken.json"],
    "qwen17": ["*.json", "*.jinja", "model*.safetensors*"],
    "qwen06": ["*.json", "*.jinja", "model*.safetensors*"],
    "zero": ["*.json", "*.txt", "model.safetensors"],
}
HINTS = json.loads((HERE / "hints.json").read_text()) if (HERE / "hints.json").exists() else {"scriptPrompt": "", "keywords": []}

ARMS = {
    # Nemotron 3.5 ASR streaming (cache-aware FastConformer-RNNT). la = right-context frames: 0/3/6/13 -> 80/320/560/1120 ms
    "N3hi": dict(fam="nemo", model="nemotron", lang="hi-IN", la=3, label="nemotron-3.5 stream hi-IN 320 ms"),
    "N6hi": dict(fam="nemo", model="nemotron", lang="hi-IN", la=6, label="nemotron-3.5 stream hi-IN 560 ms"),
    "N13hi": dict(fam="nemo", model="nemotron", lang="hi-IN", la=13, label="nemotron-3.5 stream hi-IN 1120 ms"),
    "N6auto": dict(fam="nemo", model="nemotron", lang="auto", la=6, label="nemotron-3.5 stream auto-LID 560 ms"),
    "NOhi": dict(fam="nemo_off", model="nemotron", lang="hi-IN", label="nemotron-3.5 offline (full context) hi-IN"),
    # Voxtral Mini 4B Realtime (causal encoder + LM decoder); delay = transcription_delay_ms (80 ms multiples)
    "V480": dict(fam="vox", model="voxtral", delay=480, label="voxtral-realtime stream 480 ms"),
    "V960": dict(fam="vox", model="voxtral", delay=960, label="voxtral-realtime stream 960 ms"),
    "VO": dict(fam="vox_off", model="voxtral", label="voxtral-realtime offline"),
    # Qwen3-ASR (audio encoder + Qwen3 LM), batch; language None = auto
    "Q17": dict(fam="qwen", model="qwen17", lang=None, label="qwen3-asr-1.7b auto"),
    "Q17hi": dict(fam="qwen", model="qwen17", lang="hi", label="qwen3-asr-1.7b language=hi"),
    "Q17p": dict(fam="qwen", model="qwen17", lang=None, prompt="script", label="qwen3-asr-1.7b auto + script prompt"),
    "Q17pk": dict(fam="qwen", model="qwen17", lang=None, prompt="script+kw", label="qwen3-asr-1.7b auto + script prompt + vocabulary"),
    "Q06": dict(fam="qwen", model="qwen06", lang=None, label="qwen3-asr-0.6b auto"),
    "Q06hi": dict(fam="qwen", model="qwen06", lang="hi", label="qwen3-asr-0.6b language=hi"),
    # Shunya Zero STT Hinglish (Whisper-medium post-train), batch
    "Z0": dict(fam="whisper", model="zero", lang=None, label="zero-stt-hinglish auto"),
    "Z0hi": dict(fam="whisper", model="zero", lang="hi", label="zero-stt-hinglish language=hi"),
}
STREAMING = {"nemo", "vox"}


def log(*a):
    print(f"[bench {time.strftime('%H:%M:%S')}]", *a, flush=True)


# ---------------------------------------------------------------------------------------------------------------------
# corpus
def load_corpus(d):
    d = Path(d)
    meta = json.loads((d / "meta.json").read_text())
    clips = {}
    for cid in meta:
        raw = np.fromfile(d / f"{cid}.16k.pcm", dtype="<i2")
        clips[cid] = raw.astype(np.float32) / 32768.0
    return meta, clips


def smoke_ids(meta):
    want = ["m07-G-clean", "d01-Z-clean", "h03-Z-pink", "e04-G-white", "n01-N-silence", "n12-N-modpink"]
    return [c for c in want if c in meta]


def paced_ids(meta):
    # clean arm, both TTS families (60 clips) + 6 non-speech
    return [c for c in meta if c.endswith("-clean")] + [c for c in meta if c.startswith("n")][:6]


# ---------------------------------------------------------------------------------------------------------------------
# environment / weights
def sha256(p, bs=1 << 22):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        while True:
            b = f.read(bs)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def fetch(model, root):
    from huggingface_hub import snapshot_download
    repo, rev = REPOS[model]
    p = snapshot_download(repo, revision=rev, allow_patterns=PATTERNS[model], local_dir=str(Path(root) / model))
    files = {}
    for f in sorted(Path(p).rglob("*")):
        if f.is_file() and ".cache" not in f.parts:
            files[str(f.relative_to(p))] = {"bytes": f.stat().st_size, "sha256": sha256(f)}
    return p, {"repo": repo, "revision": rev, "files": files}


def env_info():
    import torch
    import transformers
    e = {"torch": torch.__version__, "transformers": transformers.__version__, "cuda": torch.version.cuda,
         "python": sys.version.split()[0]}
    if torch.cuda.is_available():
        e["gpu"] = torch.cuda.get_device_name(0)
        e["gpuMemGB"] = round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1)
    for k in ("INSTANCE_TYPE", "INSTANCE_LIFECYCLE", "INSTANCE_AZ"):
        if os.environ.get(k):
            e[k] = os.environ[k]
    return e


def dev_dtype(prefer):
    import torch
    if torch.cuda.is_available():
        return "cuda", prefer
    return "cpu", torch.float32


def sync():
    import torch
    if torch.cuda.is_available():
        torch.cuda.synchronize()


def peak_gb(reset=False):
    import torch
    if not torch.cuda.is_available():
        return None
    v = round(torch.cuda.max_memory_allocated() / 1e9, 2)
    if reset:
        torch.cuda.reset_peak_memory_stats()
    return v


# ---------------------------------------------------------------------------------------------------------------------
# streaming recorder: generate() calls put() from its own thread; the chunk generator updates `state`
class Recorder:
    def __init__(self, state):
        self.state, self.ev, self.ids, self.t_end = state, [], [], None

    def put(self, value):
        v = value.detach().cpu().reshape(-1).tolist()
        self.ids.extend(int(x) for x in v)
        self.ev.append((time.perf_counter(), self.state.get("audioMs", 0), len(self.ids)))

    def end(self):
        self.t_end = time.perf_counter()


def text_events(rec, decode):
    """[(wall, audioMs, text)] where the decoded text changed (non-empty, first change included)."""
    out, last = [], ""
    for t, a, n in rec.ev:
        s = decode(rec.ids[:n]).strip()
        if s != last:
            out.append((t, a, s))
            last = s
    return out


class Streamer:
    """Common driver for the two streaming families. Subclasses build first-chunk inputs and the chunk schedule."""

    def __init__(self, model, proc, device, dtype):
        self.model, self.proc, self.device, self.dtype = model, proc, device, dtype

    def run(self, audios, pace=False, record=True, max_new_tokens=None):
        """audios: list of equal-length float32 arrays (a batch of synchronous streams). Returns dict."""
        import torch
        state = {"audioMs": 0, "pulls": [], "avail": [], "t0": None}
        first_inputs, chunks = self.schedule(audios)          # chunks: list of (end_sample, fn -> input_features)
        rec = Recorder(state) if record and len(audios) == 1 else None

        def gen():
            for i, (end_sample, make) in enumerate(chunks):
                if pace:
                    due = state["t0"] + end_sample / SR
                    now = time.perf_counter()
                    if now < due:
                        time.sleep(due - now)
                feats = make()
                t = time.perf_counter()
                state["pulls"].append(t)
                state["avail"].append(state["t0"] + end_sample / SR)
                state["audioMs"] = round(end_sample * 1000 / SR)
                yield feats

        kw = self.gen_kwargs(first_inputs, gen())
        if rec is not None:
            kw["streamer"] = rec
        if max_new_tokens:
            kw["max_new_tokens"] = max_new_tokens
        res = {}

        def target():
            try:
                with torch.inference_mode():
                    res["out"] = self.model.generate(**kw)
            except Exception as e:      # noqa: BLE001
                res["err"] = f"{type(e).__name__}: {e}"[:400]
                res["tb"] = traceback.format_exc()[-2000:]
        state["t0"] = time.perf_counter()
        th = threading.Thread(target=target)
        th.start()
        th.join()
        sync()
        t_done = time.perf_counter()
        r = {"t0": state["t0"], "tDone": t_done, "pulls": state["pulls"], "avail": state["avail"], "rec": rec,
             "nChunks": len(chunks), "audioS": len(audios[0]) / SR}
        if "err" in res:
            r["err"], r["tb"] = res["err"], res.get("tb")
            return r
        r["texts"] = self.decode_out(res["out"])
        return r


class NemoStreamer(Streamer):
    def __init__(self, model, proc, device, dtype, lang, la):
        super().__init__(model, proc, device, dtype)
        self.lang = lang
        proc.set_num_lookahead_tokens(la)
        self.latency_ms = proc.streaming_latency_ms
        p = proc
        self.chunk_samples = p.num_mel_frames_per_audio_chunk * p.feature_extractor.hop_length
        self.chunk_ms = self.chunk_samples * 1000 / SR

    def pad_tail(self):
        # in an always-on session audio keeps arriving; give the last lookahead + 2 chunks of trailing audio
        return int(SR * (self.latency_ms / 1000) + 2 * self.chunk_samples)

    def schedule(self, audios):
        p, sr = self.proc, SR
        audios = [np.concatenate([a, np.zeros(self.pad_tail(), np.float32)]) for a in audios]
        n = len(audios[0])
        first = p([a[: p.num_samples_first_audio_chunk] for a in audios], sampling_rate=sr, is_streaming=True,
                  is_first_audio_chunk=True, language=self.lang, return_tensors="pt")
        first = first.to(self.device, dtype=self.dtype)
        chunks = [(p.num_samples_first_audio_chunk, lambda f=first: f.input_features[:, : p.num_mel_frames_first_audio_chunk, :])]
        hop, n_fft = p.feature_extractor.hop_length, p.feature_extractor.n_fft
        mel = p.num_mel_frames_first_audio_chunk
        start = mel * hop - n_fft // 2
        while (end := start + p.num_samples_per_audio_chunk) < n:
            def make(s=start, e=end):
                x = p([a[s:e] for a in audios], sampling_rate=sr, is_streaming=True, is_first_audio_chunk=False,
                      language=self.lang, return_tensors="pt")
                return x.to(self.device, dtype=self.dtype).input_features
            chunks.append((end, make))
            mel += p.num_mel_frames_per_audio_chunk
            start = mel * hop - n_fft // 2
        self._first = first
        return first, chunks

    def gen_kwargs(self, first, g):
        kw = {k: v for k, v in first.items() if k != "input_features"}
        kw["input_features"] = g
        return kw

    def decode_out(self, out):
        seq = out.sequences if hasattr(out, "sequences") else out
        return [clean_text(t) for t in self.proc.batch_decode(seq, skip_special_tokens=True)]

    def decode_ids(self, ids):
        return clean_text(self.proc.tokenizer.decode(ids, skip_special_tokens=True))


class VoxStreamer(Streamer):
    def __init__(self, model, proc, device, dtype):
        super().__init__(model, proc, device, dtype)
        p = proc
        self.chunk_samples = p.audio_length_per_tok * p.feature_extractor.hop_length
        self.chunk_ms = self.chunk_samples * 1000 / SR
        self.latency_ms = round(p.num_delay_tokens * self.chunk_ms)

    def pad_tail(self):
        p = self.proc
        return int(p.num_right_pad_tokens * p.raw_audio_length_per_tok + 2 * self.chunk_samples)

    def schedule(self, audios):
        p = self.proc
        audios = [np.concatenate([a, np.zeros(self.pad_tail(), np.float32)]) for a in audios]
        n = len(audios[0])
        first = p([a[: p.num_samples_first_audio_chunk] for a in audios], is_streaming=True, is_first_audio_chunk=True,
                  return_tensors="pt")
        first = first.to(self.device, dtype=self.dtype)
        chunks = [(p.num_samples_first_audio_chunk, lambda f=first: f.input_features)]
        hop, win = p.feature_extractor.hop_length, p.feature_extractor.win_length
        mel = p.num_mel_frames_first_audio_chunk
        start = mel * hop - win // 2
        while (end := start + p.num_samples_per_audio_chunk) < n:
            def make(s=start, e=end):
                x = p([a[s:e] for a in audios], is_streaming=True, is_first_audio_chunk=False, return_tensors="pt")
                return x.to(self.device, dtype=self.dtype).input_features
            chunks.append((end, make))
            mel += p.audio_length_per_tok
            start = mel * hop - win // 2
        return first, chunks

    def gen_kwargs(self, first, g):
        kw = {"input_ids": first.input_ids, "input_features": g, "num_delay_tokens": first.num_delay_tokens}
        if "attention_mask" in first:
            kw["attention_mask"] = first.attention_mask
        return kw

    def decode_out(self, out):
        seq = out.sequences if hasattr(out, "sequences") else out
        return [clean_text(t) for t in self.proc.batch_decode(seq, skip_special_tokens=True)]

    def decode_ids(self, ids):
        return clean_text(self.proc.tokenizer.decode(ids, skip_special_tokens=True))


def clean_text(s):
    s = s.replace("<blank>", " ")
    # Nemotron auto-LID tags (<hi-IN>) and any stray <...> special that survived
    import re
    s = re.sub(r"<[a-z]{2}(-[A-Za-z]{2})?>", " ", s)
    return " ".join(s.split())


# ---------------------------------------------------------------------------------------------------------------------
# loaders. TINY=1 builds random-weight 2-layer models from the real configs (CPU API test, no weights downloaded).
def tiny_cfg(cfg):
    for sub in ("encoder_config", "audio_config", "text_config"):
        c = getattr(cfg, sub, None)
        if c is not None:
            for k in ("num_hidden_layers", "encoder_layers", "decoder_layers"):
                if hasattr(c, k):
                    setattr(c, k, 2)
            if hasattr(c, "layer_types") and isinstance(c.layer_types, list):
                c.layer_types = c.layer_types[:2]
    for k in ("encoder_layers", "decoder_layers", "num_hidden_layers"):
        if hasattr(cfg, k) and isinstance(getattr(cfg, k), int):
            setattr(cfg, k, 2)
    return cfg


def load_model(arm, wroot):
    import torch
    a = ARMS[arm]
    tiny = os.environ.get("TINY") == "1"
    info = {}
    if tiny:
        path = str(Path(wroot) / a["model"])
        info = {"repo": REPOS[a["model"]][0], "revision": REPOS[a["model"]][1], "tiny": True}
    else:
        path, info = fetch(a["model"], wroot)
    t = time.time()
    fam = a["fam"]
    if fam in ("nemo", "nemo_off"):
        from transformers import AutoModelForRNNT, AutoProcessor, AutoConfig
        dev, dt = dev_dtype(torch.bfloat16 if os.environ.get("NEMO_BF16") == "1" else torch.float32)
        proc = AutoProcessor.from_pretrained(path)
        if tiny:
            model = AutoModelForRNNT.from_config(tiny_cfg(AutoConfig.from_pretrained(path)))
        else:
            model = AutoModelForRNNT.from_pretrained(path, dtype=dt)
    elif fam in ("vox", "vox_off"):
        from transformers import VoxtralRealtimeForConditionalGeneration, VoxtralRealtimeProcessor, AutoConfig
        dev, dt = dev_dtype(torch.bfloat16)
        proc = VoxtralRealtimeProcessor.from_pretrained(path)
        if a.get("delay"):
            ac = proc.mistral_common_audio_config
            try:
                ac.transcription_delay_ms = a["delay"]
            except Exception as e:      # noqa: BLE001
                info["delayError"] = str(e)[:200]
        if tiny:
            model = VoxtralRealtimeForConditionalGeneration._from_config(tiny_cfg(AutoConfig.from_pretrained(path)))
        else:
            model = VoxtralRealtimeForConditionalGeneration.from_pretrained(path, dtype=dt)
        info["numDelayTokens"] = proc.num_delay_tokens
    elif fam == "qwen":
        from transformers import AutoProcessor, AutoModelForMultimodalLM, AutoConfig
        dev, dt = dev_dtype(torch.bfloat16)
        proc = AutoProcessor.from_pretrained(path)
        if tiny:
            model = AutoModelForMultimodalLM.from_config(tiny_cfg(AutoConfig.from_pretrained(path)))
        else:
            model = AutoModelForMultimodalLM.from_pretrained(path, dtype=dt)
    elif fam == "whisper":
        from transformers import WhisperForConditionalGeneration, WhisperProcessor, AutoConfig
        dev, dt = dev_dtype(torch.float16)
        proc = WhisperProcessor.from_pretrained(path)
        if tiny:
            model = WhisperForConditionalGeneration(tiny_cfg(AutoConfig.from_pretrained(path)))
            from transformers import GenerationConfig
            model.generation_config = GenerationConfig.from_pretrained(path)
        else:
            model = WhisperForConditionalGeneration.from_pretrained(path, dtype=dt)
    else:
        raise ValueError(fam)
    model = model.to(dev, dtype=dt).eval()
    sync()
    info.update(loadS=round(time.time() - t, 1), device=dev, dtype=str(dt), paramsM=round(sum(p.numel() for p in model.parameters()) / 1e6, 1),
                weightsGB=peak_gb())
    return model, proc, dev, dt, info


# ---------------------------------------------------------------------------------------------------------------------
# batch families
class Batch:
    def __init__(self, arm, model, proc, dev, dt):
        self.a, self.model, self.proc, self.dev, self.dt = ARMS[arm], model, proc, dev, dt

    def prompt(self):
        p = self.a.get("prompt")
        if not p:
            return None
        s = HINTS["scriptPrompt"]
        if p == "script+kw":
            s += " Vocabulary: " + ", ".join(HINTS["keywords"]) + "."
        return s

    def transcribe(self, audios, max_new_tokens=200):
        import torch
        fam = self.a["fam"]
        with torch.inference_mode():
            if fam == "qwen":
                n = len(audios)
                kw = {}
                if self.a.get("lang"):
                    kw["language"] = [self.a["lang"]] * n
                pr = self.prompt()
                if pr:
                    kw["prompt"] = [pr] * n
                inp = self.proc.apply_transcription_request(audio=list(audios), **kw)
                inp = inp.to(self.dev, self.dt)
                out = self.model.generate(**inp, max_new_tokens=max_new_tokens, do_sample=False)
                gen = out[:, inp["input_ids"].shape[1]:]
                return [clean_text(t) for t in self.proc.decode(gen, return_format="transcription_only")]
            if fam == "whisper":
                feats = self.proc.feature_extractor(list(audios), sampling_rate=SR, return_tensors="pt")
                x = feats.input_features.to(self.dev, self.dt)
                kw = {"task": "transcribe"}
                if self.a.get("lang"):
                    kw["language"] = self.a["lang"]
                out = self.model.generate(x, max_new_tokens=max_new_tokens, do_sample=False, **kw)
                return [clean_text(t) for t in self.proc.batch_decode(out, skip_special_tokens=True)]
            if fam == "nemo_off":
                inp = self.proc(list(audios), sampling_rate=SR, language=self.a["lang"], return_tensors="pt")
                inp = inp.to(self.dev, dtype=self.dt)
                out = self.model.generate(**inp, return_dict_in_generate=True)
                return [clean_text(t) for t in self.proc.batch_decode(out.sequences, skip_special_tokens=True)]
            if fam == "vox_off":
                inp = self.proc(list(audios), return_tensors="pt").to(self.dev, dtype=self.dt)
                out = self.model.generate(**inp)
                return [clean_text(t) for t in self.proc.batch_decode(out, skip_special_tokens=True)]
        raise ValueError(fam)


# ---------------------------------------------------------------------------------------------------------------------
def make_streamer(arm, model, proc, dev, dt):
    a = ARMS[arm]
    if a["fam"] == "nemo":
        return NemoStreamer(model, proc, dev, dt, a["lang"], a["la"])
    return VoxStreamer(model, proc, dev, dt)


def stream_row(r, st, m, paced):
    """Turn one single-stream run into a row (timings relative to the clip's speech onset/end)."""
    row = {}
    if r.get("err"):
        return {"err": r["err"], "tb": r.get("tb")}
    row["text"] = r["texts"][0]
    row["computeS"] = round(r["tDone"] - r["t0"], 3)
    row["rtf"] = round((r["tDone"] - r["t0"]) / r["audioS"], 4)
    rec = r["rec"]
    if rec is None:
        return row
    ev = text_events(rec, st.decode_ids)
    on, end = m["onMs"], m["endMs"]
    if paced:
        ms = lambda t: (t - r["t0"]) * 1000          # noqa: E731
        if ev:
            row["firstPartialMs"] = round(ms(ev[0][0]) - on)
            row["lastTextMs"] = round(ms(ev[-1][0]) - end)
            gaps = [ms(b[0]) - ms(a[0]) for a, b in zip(ev, ev[1:])]
            row["partials"] = len(ev)
            row["partialGapP50Ms"] = round(float(np.median(gaps))) if gaps else None
        row["doneMs"] = round(ms(r["tDone"]) - end)
        lags = [(p - a) * 1000 for p, a in zip(r["pulls"], r["avail"])]
        row["chunkLagP50Ms"], row["chunkLagMaxMs"] = round(float(np.median(lags)), 1), round(max(lags), 1)
    else:
        if ev:
            row["algoFirstPartialMs"] = ev[0][1] - on
            row["algoLastTextMs"] = ev[-1][1] - end
            row["partials"] = len(ev)
    row["events"] = [[round((t - r["t0"]) * 1000), a, s[-60:]] for t, a, s in ev][:80]
    return row


def run_accuracy(arm, model, proc, dev, dt, meta, clips, ids, out):
    a = ARMS[arm]
    f = open(out / "rows.jsonl", "w")
    if a["fam"] in STREAMING:
        st = make_streamer(arm, model, proc, dev, dt)
        st.run([clips[ids[0]]])                         # warm-up
        for i, cid in enumerate(ids):
            t = time.time()
            r = st.run([clips[cid]])
            row = {"clip": cid, "cfg": cfg_name(arm), "arm": arm, **stream_row(r, st, meta[cid], paced=False)}
            row["ms"] = round((time.time() - t) * 1000)
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            f.flush()
            if i % 20 == 0:
                log(f"{arm} {i}/{len(ids)} {cid}: {row.get('text', row.get('err'))!r}"[:200])
        info = {"chunkMs": st.chunk_ms, "latencyMs": st.latency_ms}
    else:
        b = Batch(arm, model, proc, dev, dt)
        b.transcribe([clips[ids[0]]])                   # warm-up
        for i, cid in enumerate(ids):
            sync()
            t = time.perf_counter()
            try:
                txt = b.transcribe([clips[cid]])[0]
                sync()
                row = {"clip": cid, "cfg": cfg_name(arm), "arm": arm, "text": txt, "reqMs": round((time.perf_counter() - t) * 1000)}
            except Exception as e:      # noqa: BLE001
                row = {"clip": cid, "cfg": cfg_name(arm), "arm": arm, "text": "", "err": f"{type(e).__name__}: {e}"[:300],
                       "tb": traceback.format_exc()[-1500:]}
            row["rtf"] = round(row.get("reqMs", 0) / 1000 / (len(clips[cid]) / SR), 4)
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            f.flush()
            if i % 20 == 0:
                log(f"{arm} {i}/{len(ids)} {cid}: {row.get('text')!r} {row.get('reqMs')} ms {row.get('err', '')}"[:220])
        info = {}
    f.close()
    return info


def run_paced(arm, model, proc, dev, dt, meta, clips, ids, out):
    st = make_streamer(arm, model, proc, dev, dt)
    with open(out / "paced.jsonl", "w") as f:
        for cid in ids:
            r = st.run([clips[cid]], pace=True)
            row = {"clip": cid, "cfg": cfg_name(arm), "arm": arm, **stream_row(r, st, meta[cid], paced=True)}
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            f.flush()
    log(f"{arm} paced {len(ids)} clips done")


def long_audio(clips, ids, seconds, rng):
    parts, n = [], 0
    while n < seconds * SR:
        c = clips[rng.choice(ids)]
        parts.append(c)
        n += len(c)
    return np.concatenate(parts)[: int(seconds * SR)].astype(np.float32)


def run_load(arm, model, proc, dev, dt, meta, clips, out, deadline, smoke=False):
    import torch
    a = ARMS[arm]
    rng = random.Random(7)
    sp = [c for c in meta if not c.startswith("n")]
    res = {"arm": arm, "mode": None, "levels": []}
    if a["fam"] in STREAMING:
        st = make_streamer(arm, model, proc, dev, dt)
        res.update(mode="batched-synchronous-streams", chunkMs=st.chunk_ms, latencyMs=st.latency_ms,
                   method="B equal-length streams (concatenated corpus clips) advanced one chunk per generate step; "
                          "unpaced; step = interval between successive chunk pulls by generate(); RTF = step / chunk")
        secs = 6 if smoke else 20
        ref = None
        best = None
        for B in ([1, 2, 4] if smoke else [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]):
            if time.time() > deadline:
                res["stoppedAt"] = f"deadline before B={B}"
                break
            auds = [long_audio(clips, sp, secs, rng) for _ in range(B)]
            if ref is None:
                ref_audio = auds[0]
            else:
                auds[0] = ref_audio
            peak_gb(reset=True)
            try:
                r = st.run(auds, record=False)
            except torch.cuda.OutOfMemoryError as e:
                res["levels"].append({"B": B, "err": "OOM " + str(e)[:120]})
                torch.cuda.empty_cache()
                break
            if r.get("err"):
                res["levels"].append({"B": B, "err": r["err"], "tb": r.get("tb")})
                if "out of memory" in r["err"].lower():
                    torch.cuda.empty_cache()
                break
            steps = np.diff(np.array(r["pulls"])) * 1000
            steps = steps[2:] if len(steps) > 4 else steps                 # drop warm-up steps
            lvl = {"B": B, "chunks": r["nChunks"], "stepP50Ms": round(float(np.median(steps)), 2),
                   "stepP95Ms": round(float(np.percentile(steps, 95)), 2), "stepMaxMs": round(float(steps.max()), 2),
                   "rtfP50": round(float(np.median(steps)) / st.chunk_ms, 4), "rtfP95": round(float(np.percentile(steps, 95)) / st.chunk_ms, 4),
                   "wallS": round(r["tDone"] - r["t0"], 2), "audioS": secs, "peakGB": peak_gb()}
            if ref is None:
                ref = r["texts"][0]
            else:
                lvl["stream0SameAsB1"] = r["texts"][0] == ref
            lvl["stream0Text"] = r["texts"][0][:160]
            res["levels"].append(lvl)
            log(f"{arm} load B={B}: step p50 {lvl['stepP50Ms']} p95 {lvl['stepP95Ms']} ms (chunk {st.chunk_ms:.0f}) peak {lvl['peakGB']} GB")
            if lvl["rtfP95"] <= 1.0:
                best = B
            if lvl["rtfP50"] > 1.5:
                break
        res["maxBAtRtfP95le1"] = best
        # paced confirmation at the largest sustainable B: every chunk is fed only when its audio exists
        if best and time.time() < deadline:
            B, secs2 = best, (8 if smoke else 30)
            auds = [long_audio(clips, sp, secs2, rng) for _ in range(B)]
            r = st.run(auds, pace=True, record=False)
            if not r.get("err"):
                lags = np.array([(p - av) * 1000 for p, av in zip(r["pulls"], r["avail"])])
                th = max(1, len(lags) // 3)
                res["pacedAtBest"] = {"B": B, "seconds": secs2, "lagP50Ms": round(float(np.median(lags)), 1),
                                      "lagP95Ms": round(float(np.percentile(lags, 95)), 1), "lagMaxMs": round(float(lags.max()), 1),
                                      "lagFirstThirdP50": round(float(np.median(lags[:th])), 1),
                                      "lagLastThirdP50": round(float(np.median(lags[-th:])), 1),
                                      "finishAfterAudioEndMs": round((r["tDone"] - r["t0"] - len(auds[0]) / SR) * 1000)}
            else:
                res["pacedAtBest"] = {"B": B, "err": r["err"]}
    else:
        b = Batch(arm, model, proc, dev, dt)
        res.update(mode="batched-utterances", method="B different ~5 s corpus utterances in one generate() call; 3 reps; "
                   "latency = wall time of the call; throughput = B x mean utterance seconds / latency")
        best = None
        for B in ([1, 2] if smoke else [1, 2, 4, 8, 16, 32, 64, 128]):
            if time.time() > deadline:
                res["stoppedAt"] = f"deadline before B={B}"
                break
            lat = []
            try:
                for rep in range(3):
                    ids = [rng.choice(sp) for _ in range(B)]
                    auds = [clips[c] for c in ids]
                    peak_gb(reset=True)
                    sync()
                    t = time.perf_counter()
                    b.transcribe(auds)
                    sync()
                    lat.append((time.perf_counter() - t) * 1000)
                    mean_s = float(np.mean([len(x) / SR for x in auds]))
            except torch.cuda.OutOfMemoryError as e:
                res["levels"].append({"B": B, "err": "OOM " + str(e)[:120]})
                torch.cuda.empty_cache()
                break
            except Exception as e:      # noqa: BLE001
                res["levels"].append({"B": B, "err": f"{type(e).__name__}: {e}"[:300]})
                break
            lvl = {"B": B, "latP50Ms": round(float(np.median(lat))), "latMaxMs": round(max(lat)), "meanUttS": round(mean_s, 2),
                   "throughputAudioSPerS": round(B * mean_s / (np.median(lat) / 1000), 1), "peakGB": peak_gb()}
            res["levels"].append(lvl)
            log(f"{arm} load B={B}: {lvl}")
            if lvl["latP50Ms"] > 4000:
                break
    (out / "load.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))


def ns_bank(meta, clips):
    return [clips[c] for c in meta if c.startswith("n") and "babble" not in c]


def run_soak(arm, model, proc, dev, dt, meta, clips, out, minutes, deadline):
    """One always-on stream: [gap 4-25 s non-speech][utterance] ... Counts characters emitted outside speech windows."""
    rng = random.Random(11)
    sp = [c for c in meta if not c.startswith("n")]
    bank = ns_bank(meta, clips)
    parts, windows, n, k = [], [], 0, 0
    while n < minutes * 60 * SR:
        g = rng.uniform(4, 25)
        src = bank[rng.randrange(len(bank))]
        reps = int(math.ceil(g * SR / len(src)))
        gap = np.tile(src, reps)[: int(g * SR)] * rng.choice([0.25, 0.5, 1.0])
        parts.append(gap.astype(np.float32))
        n += len(gap)
        cid = rng.choice(sp)
        m = meta[cid]
        windows.append([(n + m["onMs"] * SR // 1000) / SR, (n + m["endMs"] * SR // 1000) / SR, cid])
        parts.append(clips[cid])
        n += len(clips[cid])
        k += 1
    audio = np.concatenate(parts)
    st = make_streamer(arm, model, proc, dev, dt)
    log(f"{arm} soak: {len(audio) / SR / 60:.1f} min, {k} utterances")
    r = st.run([audio], record=True)
    res = {"arm": arm, "minutes": round(len(audio) / SR / 60, 2), "utterances": k, "computeS": round(r["tDone"] - r["t0"], 1)}
    if r.get("err"):
        res["err"] = r["err"]
        res["tb"] = r.get("tb")
    else:
        rec = r["rec"]
        # character deltas attributed to the audio time of the chunk most recently pulled when they appeared
        TAIL = st.latency_ms / 1000 + 1.5
        prev, outside, inside, pieces = "", 0, 0, []
        for t, am, nids in rec.ev:
            s = st.decode_ids(rec.ids[:nids])
            d = len(s.replace(" ", "")) - len(prev.replace(" ", ""))
            if d > 0:
                at = am / 1000
                ins = any(w[0] - 0.3 <= at <= w[1] + TAIL for w in windows)
                if ins:
                    inside += d
                else:
                    outside += d
                    pieces.append([round(at, 2), s[len(prev):][:80]])
            prev = s
        res.update(charsInsideSpeech=inside, charsOutsideSpeech=outside, outsidePieces=pieces[:60], tailS=TAIL,
                   textChars=len(r["texts"][0]), textHead=r["texts"][0][:400])
    (out / "soak.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    log(f"{arm} soak: outside-speech chars {res.get('charsOutsideSpeech')} / inside {res.get('charsInsideSpeech')}")


def cfg_name(arm):
    return f"O-{arm} {ARMS[arm]['label']}"


def cmd_run(a):
    import torch
    out = Path(a.out) / a.arm
    out.mkdir(parents=True, exist_ok=True)
    deadline = float(os.environ.get("ARM_DEADLINE_EPOCH", time.time() + 3 * 3600))
    meta, clips = load_corpus(a.corpus)
    ids = smoke_ids(meta) if a.smoke else list(meta)
    t0 = time.time()
    model, proc, dev, dt, info = load_model(a.arm, a.weights)
    env = {"arm": a.arm, "cfg": cfg_name(a.arm), "spec": ARMS[a.arm], "model": info, "env": env_info(), "clips": len(ids)}
    log(f"{a.arm}: loaded in {info.get('loadS')} s, {info.get('paramsM')} M params, {info.get('weightsGB')} GB")
    try:
        torch.manual_seed(0)
        env["accuracy"] = run_accuracy(a.arm, model, proc, dev, dt, meta, clips, ids, out)
        env["accuracyS"] = round(time.time() - t0, 1)
        fam = ARMS[a.arm]["fam"]
        if fam in STREAMING and not a.no_paced:
            run_paced(a.arm, model, proc, dev, dt, meta, clips, smoke_ids(meta) if a.smoke else paced_ids(meta), out)
        if not a.no_load and time.time() < deadline:
            run_load(a.arm, model, proc, dev, dt, meta, clips, out, deadline, smoke=a.smoke)
        if fam in STREAMING and not a.no_soak and time.time() < deadline:
            run_soak(a.arm, model, proc, dev, dt, meta, clips, out, 1 if a.smoke else a.soak_minutes, deadline)
    finally:
        env["peakGB"] = peak_gb()
        env["totalS"] = round(time.time() - t0, 1)
        (out / "env.json").write_text(json.dumps(env, indent=1, ensure_ascii=False, default=str))
        del model
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


# ---------------------------------------------------------------------------------------------------------------------
# extra non-speech (n13-n30) and reversed babble (b01-b04), deterministic, written next to the corpus as 16 kHz PCM
def cmd_gen_nonspeech(a):
    d = Path(a.corpus)
    meta = json.loads((d / "meta.json").read_text())
    rng = np.random.default_rng(20261004)
    def white(n):
        return rng.uniform(-1, 1, n)
    def pink(n):
        b = np.zeros(3)
        w = white(n)
        y = np.empty(n)
        for i in range(n):
            b = np.array([0.99765 * b[0] + w[i] * 0.099046, 0.963 * b[1] + w[i] * 0.2965164, 0.57 * b[2] + w[i] * 1.0526913])
            y[i] = (b.sum() + w[i] * 0.1848) / 4
        return y
    def brown(n):
        y = np.cumsum(white(n) * 0.02)
        y -= np.convolve(y, np.ones(SR // 10) / (SR // 10), mode="same")
        return np.clip(y, -1, 1)
    def lowpass(x, k):
        return np.convolve(x, np.ones(k) / k, mode="same")
    t = lambda s: np.arange(int(s * SR)) / SR          # noqa: E731
    def fan(s, lvl):
        x = lowpass(white(int(s * SR)), 24) * lvl + lvl * 0.15 * np.sin(2 * np.pi * 24 * t(s)) * (1 + 0.2 * np.sin(2 * np.pi * 0.7 * t(s)))
        return x
    def whistle(s, bursts):
        tt = t(s)
        f = 2600 + 120 * np.sin(2 * np.pi * 5 * tt)
        x = 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.03 * white(len(tt))
        if bursts:
            x *= (np.sin(2 * np.pi * 0.8 * tt) > 0).astype(float)
        return x
    def clicks(s, rate):
        n = int(s * SR)
        x = 0.002 * white(n)
        for _ in range(int(s * rate)):
            i = int(rng.integers(0, n - 800))
            x[i:i + 800] += 0.4 * white(800) * np.exp(-np.arange(800) / 90)
        return x
    def impulses(s):
        n = int(s * SR)
        x = 0.003 * white(n)
        for i in (int(0.6 * SR), int(2.3 * SR), int(3.9 * SR)):
            x[i:i + 4000] += 0.8 * lowpass(white(4000), 6) * np.exp(-np.arange(4000) / 700)
        return x
    def tones(s):
        tt = t(s)
        x = np.zeros_like(tt)
        notes = [261.6, 329.6, 392.0, 523.3, 392.0, 329.6]
        seg = len(tt) // len(notes)
        for k, f in enumerate(notes):
            sl = slice(k * seg, (k + 1) * seg)
            x[sl] = 0.2 * (np.sin(2 * np.pi * f * tt[sl]) + 0.5 * np.sin(2 * np.pi * 2 * f * tt[sl])) * np.hanning(seg)
        return x
    def hum60(s):
        return 0.05 * np.sin(2 * np.pi * 60 * t(s)) + 0.02 * np.sin(2 * np.pi * 180 * t(s)) + 0.002 * white(int(s * SR))
    new = {
        "n13-N-zeros5s": np.zeros(5 * SR), "n14-N-zeros1s": np.zeros(SR), "n15-N-dither10s": white(10 * SR) * 2 / 32768,
        "n16-N-white100": white(4 * SR) * 100 / 32768, "n17-N-white6000": white(4 * SR) * 6000 / 32768,
        "n18-N-pink600": pink(4 * SR) * 600 / 32768 * 4, "n19-N-pinkloud": pink(4 * SR) * 0.9,
        "n20-N-brownlow": brown(4 * SR) * 0.05, "n21-N-brownhigh": brown(4 * SR) * 0.4,
        "n22-N-fanlow": fan(6, 0.03), "n23-N-fanhigh": fan(6, 0.2), "n24-N-whistle": whistle(5, False),
        "n25-N-whistleburst": whistle(5, True), "n26-N-clicksslow": clicks(5, 2), "n27-N-clicksfast": clicks(5, 9),
        "n28-N-hum60": hum60(4), "n29-N-impulses": impulses(5), "n30-N-tones": tones(5),
    }
    sp = [c for c in meta if not c.startswith("n") and c.endswith("-clean")]
    def rev(cid):
        return (np.fromfile(d / f"{cid}.16k.pcm", dtype="<i2").astype(np.float64) / 32768)[::-1]
    def babble(k, s):
        n = int(s * SR)
        x = np.zeros(n)
        for j in range(k):
            r = rev(sp[(7 * j + 3) % len(sp)])
            r = np.tile(r, int(np.ceil(n / len(r))))[:n]
            x += r
        return x / max(1, k) * 0.8
    new.update({"b01-N-babblerev1": babble(1, 5), "b02-N-babblerev2": babble(2, 5), "b03-N-babblerev4": babble(4, 6),
                "b04-N-babblerev6": babble(6, 6)})
    for cid, x in new.items():
        pcm = np.clip(np.round(x * 32768), -32768, 32767).astype("<i2")
        pcm.tofile(d / f"{cid}.16k.pcm")
        ms = round(len(pcm) * 1000 / SR)
        meta[cid] = {"onMs": 0, "endMs": ms, "durMs": ms, "extra": "stt-v3"}
    (d / "meta.json").write_text(json.dumps(meta, indent=1))
    print(len(new), "clips added;", len(meta), "total")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--arm", required=True, choices=list(ARMS))
    r.add_argument("--corpus", required=True)
    r.add_argument("--out", required=True)
    r.add_argument("--weights", default=os.environ.get("WEIGHTS", "/opt/w"))
    r.add_argument("--smoke", action="store_true")
    r.add_argument("--no-paced", action="store_true")
    r.add_argument("--no-load", action="store_true")
    r.add_argument("--no-soak", action="store_true")
    r.add_argument("--soak-minutes", type=float, default=10)
    sub.add_parser("arms")
    g = sub.add_parser("gen-nonspeech")
    g.add_argument("--corpus", required=True)
    a = ap.parse_args()
    if a.cmd == "arms":
        for k, v in ARMS.items():
            print(k, json.dumps(v))
    elif a.cmd == "gen-nonspeech":
        cmd_gen_nonspeech(a)
    else:
        cmd_run(a)


if __name__ == "__main__":
    main()
