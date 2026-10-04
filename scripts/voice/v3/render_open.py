#!/usr/bin/env python3
"""VOICE v3, round 2: render the 5 round-1 lines on open-weight TTS models, on a throwaway AWS GPU (build-time only,
never product code). One arm per invocation, each in its own venv (their pins conflict):

    python render_open.py <arm> --weights /opt/w --out $OUT/renders [--takes 3]

arms: veena | svara | voxcpm2 | chatterbox-hi | vibevoice-hindi-7b | vibevoice-hindi-1.5b

Per arm it writes <out>/<arm>/<clip>.wav (native sample rate, PCM16, no loudness change) and <out>/<arm>/manifest.json.
Rules (docs/research/voice/v3/SCAN.md section 1): the five lines unchanged from blind-test.html (numbers already
Hindi words, English in Latin script); one synthesis per line, never sentence-split; nothing spliced; 3 takes per cell
and nobody picks a take. Voices: the model's built-in voices where it has them (Veena, Svara). Models that only clone
(Chatterbox, VibeVoice) and VoxCPM2's own cloning path use a SYNTHETIC reference designed by VoxCPM2 from a text
description (no real person's voice, Apache-2.0 output). The VibeVoice-Hindi shipped prompt `hi-Priya_woman.wav` is NOT
used: its speaker provenance and consent are not stated.

Latency (take 1 of every cell runs alone on the GPU, after a warm-up; takes 2-3 may run batched and carry no latency):
  - rtf  = synthesis wall / audio seconds (single stream, bf16, no server, no compile unless stated)
  - ttfb = time to the first decodable audio. Codec LMs (Veena, Svara): time to 28 audio tokens (4 SNAC frames, the
    Orpheus streaming window) + the measured SNAC decode of that window. VoxCPM2: first chunk of generate_streaming.
    VibeVoice: first chunk put into its AudioStreamer. Chatterbox (this code has no streaming): ttfb = full wall.
"""
import argparse
import json
import os
import random
import sys
import time
import traceback
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
LINES = json.load(open(HERE / "lines.json", encoding="utf-8"))["lines"]

# Delivery notes are SHAPES (a band of adjectives), never a sentence she could recite (SCAN section 1).
DESIGN = {
    "F": "a young Indian woman school teacher in her mid twenties, warm, friendly, natural Hindi and Hinglish with one consistent Indian accent, conversational, talking to a nine year old child, unhurried, close microphone",
    "M": "a young Indian man school teacher in his late twenties, warm, friendly, natural Hindi and Hinglish with one consistent Indian accent, conversational, talking to a nine year old child, unhurried, close microphone",
}
# Reference text for the designed voices: not one of the five lines, so no test line is ever a clone of itself.
REF_TEXT = "चलो, आज हम कुछ नया सीखते हैं। कल तुमने जो सवाल पूछा था, वो बहुत अच्छा था, तो आज उसी से शुरू करते हैं।"
STYLE_NOTE = {   # VoxCPM2 parenthesised style control, per scene
    "L1-think": "thinking aloud, working it out step by step together, relaxed",
    "L2-laugh": "laughing along playfully, amused, then gently explaining",
    "L3-surprise": "genuinely surprised and delighted",
    "L4-correct": "calm, kind, gentle, a little slower",
    "L5-wonder": "quiet wonder that builds into excitement",
}
SVARA_TAG = {"L1-think": "chat", "L2-laugh": "happy", "L3-surprise": "surprise", "L4-correct": "chat", "L5-wonder": "happy"}
CB_EXAG = {"L1-think": 0.6, "L2-laugh": 0.9, "L3-surprise": 1.0, "L4-correct": 0.4, "L5-wonder": 0.8}

AUDIO_BASE = 128266            # SNAC code offset shared by Veena and Svara (Orpheus layout)
AUDIO_END = AUDIO_BASE + 7 * 4096


def log(*a):
    print(time.strftime("[%H:%M:%S]"), *a, flush=True)


def seed_all(s):
    import torch
    random.seed(s)
    np.random.seed(s)
    torch.manual_seed(s)
    torch.cuda.manual_seed_all(s)


def sync():
    import torch
    torch.cuda.synchronize()


def write_wav(path, audio, sr):
    import soundfile as sf
    a = np.asarray(audio, dtype=np.float32).reshape(-1)
    a = np.clip(a, -1.0, 1.0)
    sf.write(str(path), a, int(sr), subtype="PCM_16")
    return round(len(a) / float(sr), 3)


class Arm:
    """Shared bookkeeping: clips list, manifest, deadline."""

    def __init__(self, name, out, takes, meta):
        self.name, self.dir, self.takes = name, Path(out) / name, takes
        self.dir.mkdir(parents=True, exist_ok=True)
        self.clips, self.meta, self.t0 = [], meta, time.time()
        self.deadline = float(os.environ.get("ARM_DEADLINE_EPOCH", "0") or 0)

    def out_of_time(self):
        return self.deadline and time.time() > self.deadline

    def add(self, **c):
        self.clips.append(c)
        self.save()

    def save(self, extra=None):
        import torch
        ok = [c for c in self.clips if c.get("ok")]
        timed = [c for c in ok if c.get("rtf") is not None]
        m = dict(self.meta)
        m.update({
            "v": "taxila-voice-v3-render/v1", "arm": self.name, "date": time.strftime("%Y-%m-%d"),
            "lines": "scripts/voice/v3/lines.json (= blind-test.html M.scenes, unchanged)",
            "runtime": runtime_info(),
            "peakVramGB": round(torch.cuda.max_memory_allocated() / 1e9, 2) if torch.cuda.is_available() else None,
            "armWallS": round(time.time() - self.t0, 1),
            "summary": {
                "clips": len(self.clips), "ok": len(ok), "failed": len(self.clips) - len(ok),
                "audioS": round(sum(c["audioS"] for c in ok), 1),
                "rtfMedian": med([c["rtf"] for c in timed]), "rtfMax": mx([c["rtf"] for c in timed]),
                "ttfbMedianS": med([c["ttfbS"] for c in timed if c.get("ttfbS") is not None]),
                "ttfbMaxS": mx([c["ttfbS"] for c in timed if c.get("ttfbS") is not None]),
                "nTimed": len(timed),
            },
            "clips": self.clips,
        })
        if extra:
            m.update(extra)
        tmp = self.dir / "manifest.json.tmp"
        tmp.write_text(json.dumps(m, ensure_ascii=False, indent=1))
        os.replace(tmp, self.dir / "manifest.json")


def med(x):
    return round(float(np.median(x)), 3) if x else None


def mx(x):
    return round(float(np.max(x)), 3) if x else None


_RT = None


def runtime_info():
    global _RT
    if _RT is None:
        import torch
        _RT = {"python": sys.version.split()[0], "torch": torch.__version__, "cuda": torch.version.cuda,
               "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
               "vramGB": round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1) if torch.cuda.is_available() else None,
               "instance": os.environ.get("INSTANCE_TYPE"), "az": os.environ.get("INSTANCE_AZ"),
               "lifecycle": os.environ.get("INSTANCE_LIFECYCLE"), "jobId": os.environ.get("JOB_ID")}
        try:
            import transformers
            _RT["transformers"] = transformers.__version__
        except Exception:
            pass
    return _RT


def clip_name(arm, voice, line, style, take):
    return f"{arm}__{voice}__{line}__{style}__t{take}.wav"


# ------------------------------------------------------------------ codec LMs (Veena, Svara): Orpheus/SNAC layout
class CodecLM:
    def __init__(self, model_dir, snac_dir):
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from snac import SNAC
        self.torch = torch
        self.tok = AutoTokenizer.from_pretrained(model_dir)
        self.model = AutoModelForCausalLM.from_pretrained(model_dir, torch_dtype=torch.bfloat16).cuda().eval()
        self.snac = SNAC.from_pretrained(snac_dir).cuda().eval()

    def decode(self, codes):
        torch = self.torch
        codes = codes[: (len(codes) // 7) * 7]
        if not codes:
            return None
        l1, l2, l3 = [], [], []
        for i in range(0, len(codes), 7):
            c = [codes[i + j] - AUDIO_BASE - j * 4096 for j in range(7)]
            l1.append(c[0]); l2 += [c[1], c[4]]; l3 += [c[2], c[3], c[5], c[6]]
        t = [torch.tensor(x, dtype=torch.int32, device="cuda").unsqueeze(0) for x in (l1, l2, l3)]
        for x in t:
            if bool(((x < 0) | (x > 4095)).any()):
                raise ValueError("SNAC code out of range")
        with torch.inference_mode():
            return self.snac.decode(t).squeeze().float().clamp(-1, 1).cpu().numpy()

    def generate(self, input_ids, n, eos, temperature, top_p, rep, max_new, timed):
        torch = self.torch
        from transformers import StoppingCriteria, StoppingCriteriaList
        L = input_ids.shape[1]

        class FirstAudio(StoppingCriteria):
            def __init__(self):
                self.t = None

            def __call__(self, ids, scores, **kw):
                if self.t is None:
                    g = ids[0, L:]
                    if int(((g >= AUDIO_BASE) & (g < AUDIO_END)).sum()) >= 28:
                        sync()
                        self.t = time.time()
                return torch.zeros(ids.shape[0], dtype=torch.bool, device=ids.device)

        rec = FirstAudio()
        ids = input_ids.cuda()
        sync()
        t0 = time.time()
        with torch.inference_mode():
            out = self.model.generate(ids, attention_mask=torch.ones_like(ids), max_new_tokens=max_new, do_sample=True,
                                      temperature=temperature, top_p=top_p, repetition_penalty=rep, num_return_sequences=n,
                                      eos_token_id=eos, pad_token_id=eos[0],
                                      stopping_criteria=StoppingCriteriaList([rec]) if timed else None)
        res = []
        for r in range(out.shape[0]):
            g = out[r, L:].tolist()
            for k, v in enumerate(g):
                if v in eos:
                    g = g[:k]
                    break
            hit_cap = len(out[r, L:]) >= max_new and not any(v in eos for v in out[r, L:].tolist())
            codes = [v for v in g if AUDIO_BASE <= v < AUDIO_END]
            res.append((codes, hit_cap))
        audios = [self.decode(c) for c, _ in res]
        sync()
        wall = time.time() - t0
        ttfb = None
        if timed and rec.t is not None and res[0][0]:
            sync()
            td = time.time()
            self.decode(res[0][0][:28])
            sync()
            ttfb = (rec.t - t0) + (time.time() - td)
        return audios, [h for _, h in res], wall, ttfb


def run_codec(arm, a, lm, voices, build_ids, eos, styles, temperature, top_p, rep, settings):
    # warm-up (excluded)
    lm.generate(build_ids(voices[0][0], "नमस्ते, कैसे हो?", None), 1, eos, temperature, top_p, rep, 300, False)
    for vi, (voice, gender) in enumerate(voices):
        for li, line in enumerate(LINES):
            for style, tag in styles(line["id"]):
                if a.out_of_time():
                    log(f"{arm}: arm deadline reached; stopping")
                    return
                ids = build_ids(voice, line["text"], tag)
                sent = lm.tok.decode(ids[0], skip_special_tokens=False)
                plan = [(1, True)] + ([(a.takes - 1, False)] if a.takes > 1 else [])
                take = 0
                for n, timed in plan:
                    seed = 1000 * (vi + 1) + 100 * li + 10 * take + (7 if style != "plain" else 0)
                    seed_all(seed)
                    try:
                        audios, caps, wall, ttfb = lm.generate(ids, n, eos, temperature, top_p, rep, 2048, timed)
                        for j, au in enumerate(audios):
                            take += 1
                            f = clip_name(arm, voice, line["id"], style, take)
                            if au is None:
                                a.add(file=f, line=line["id"], voice=voice, gender=gender, style=style, styleControl=tag, take=take,
                                      ok=False, error="no audio tokens", seed=seed)
                                continue
                            dur = write_wav(a.dir / f, au, 24000)
                            a.add(file=f, line=line["id"], voice=voice, gender=gender, style=style, styleControl=tag, take=take,
                                  ok=True, sampleRate=24000, audioS=dur, seed=seed, hitTokenCap=caps[j],
                                  wallS=round(wall, 3) if timed else None, batch=n,
                                  batchWallS=None if timed else round(wall, 3),
                                  rtf=round(wall / dur, 3) if timed and dur else None,
                                  ttfbS=round(ttfb, 3) if timed and ttfb is not None else None,
                                  textSent=sent)
                            log(f"{arm} {voice} {line['id']} {style} t{take}: {dur:.2f}s audio, wall {wall:.2f}s" + (f", ttfb {ttfb:.3f}s" if timed and ttfb else ""))
                    except Exception as e:
                        traceback.print_exc()
                        for _ in range(n):
                            take += 1
                            a.add(file=None, line=line["id"], voice=voice, gender=gender, style=style, styleControl=tag, take=take,
                                  ok=False, error=f"{type(e).__name__}: {str(e)[:300]}", seed=seed)


def arm_veena(a, W):
    lm = CodecLM(W / "veena", W / "snac")

    def build(voice, text, tag):
        p = lm.tok.encode(f"<spk_{voice}> {text}", add_special_tokens=False)
        return lm.torch.tensor([[128259, *p, 128260, 128261, 128257]])
    voices = [("kavya", "F"), ("maitri", "F"), ("agastya", "M"), ("vinaya", "M")]
    settings = {"temperature": 0.4, "top_p": 0.9, "repetition_penalty": 1.05, "max_new_tokens": 2048, "dtype": "bf16",
                "note": "model card sampling; the card's 700-token cap would truncate an 8 s line, so 2048"}
    a.meta["settings"] = settings
    a.meta["styleControl"] = "none: Veena has no emotion/style tokens (card: 'planned'); plain only"
    run_codec("veena", a, lm, voices, build, [128258, 128262], lambda lid: [("plain", None)], 0.4, 0.9, 1.05, settings)


def arm_svara(a, W):
    lm = CodecLM(W / "svara", W / "snac")

    def build(voice, text, tag):
        prompt = f"Hindi ({voice}): {text}" + (f" <{tag}>" if tag else "")
        ids = lm.tok(prompt, return_tensors="pt").input_ids
        return lm.torch.cat([lm.torch.tensor([[128259]]), ids, lm.torch.tensor([[128009, 128260]])], dim=1)
    voices = [("Female", "F"), ("Male", "M")]
    settings = {"temperature": 0.7, "top_p": 0.8, "repetition_penalty": 1.1, "max_new_tokens": 2048, "dtype": "bf16",
                "note": "the official Space's defaults and prompt format"}
    a.meta["settings"] = settings
    a.meta["styleControl"] = "sentence-end emotion tag (Svara card); per scene: " + json.dumps(SVARA_TAG)
    run_codec("svara", a, lm, voices, build, [128258], lambda lid: [("plain", None), ("styled", SVARA_TAG[lid])],
              0.7, 0.8, 1.1, settings)


# ------------------------------------------------------------------ VoxCPM2 (also designs the synthetic references)
def arm_voxcpm2(a, W, refs_dir):
    import torch
    from voxcpm import VoxCPM
    t = time.time()
    try:
        model = VoxCPM.from_pretrained(str(W / "voxcpm2"), load_denoiser=False, optimize=True)
        model.generate(text="नमस्ते, कैसे हो?", cfg_value=2.0, inference_timesteps=10)
        compiled = True
    except Exception as e:
        log(f"voxcpm2 optimize=True failed ({type(e).__name__}: {str(e)[:200]}); retrying without torch.compile")
        model = VoxCPM.from_pretrained(str(W / "voxcpm2"), load_denoiser=False, optimize=False)
        model.generate(text="नमस्ते, कैसे हो?", cfg_value=2.0, inference_timesteps=10)
        compiled = False
    sr = model.tts_model.sample_rate
    a.meta["settings"] = {"cfg_value": 2.0, "inference_timesteps": 10, "torchCompile": compiled, "denoiser": False,
                          "sampleRate": sr, "loadAndWarmS": round(time.time() - t, 1)}
    a.meta["styleControl"] = "parenthesised style note before the text, with the designed voice as reference_wav_path: " + json.dumps(STYLE_NOTE)
    refs_dir.mkdir(parents=True, exist_ok=True)
    refs = {}
    for g in ("F", "M"):
        seed_all(4242 if g == "F" else 4343)
        wav = model.generate(text=f"({DESIGN[g]}){REF_TEXT}", cfg_value=2.0, inference_timesteps=10)
        p = refs_dir / f"voxcpm2-design-{g}.wav"
        dur = write_wav(p, wav, sr)
        write_wav(a.dir / f"voxcpm2__design-{g}__REF__design.wav", wav, sr)
        refs[g] = str(p)
        log(f"voxcpm2 designed reference {g}: {dur:.2f}s")
    a.meta["references"] = {g: {"file": f"voxcpm2__design-{g}__REF__design.wav", "design": DESIGN[g], "text": REF_TEXT,
                                "seed": 4242 if g == "F" else 4343,
                                "origin": "synthetic, designed by VoxCPM2 from the description; no real person"} for g in refs}
    json.dump({"refs": refs, "design": DESIGN, "text": REF_TEXT}, open(refs_dir / "refs.json", "w"), ensure_ascii=False, indent=1)
    for vi, g in enumerate(("F", "M")):
        voice = f"design-{g}"
        for li, line in enumerate(LINES):
            for style in ("plain", "styled"):
                text = line["text"] if style == "plain" else f"({STYLE_NOTE[line['id']]}){line['text']}"
                for take in range(1, a.takes + 1):
                    if a.out_of_time():
                        log("voxcpm2: arm deadline reached")
                        return
                    seed = 1000 * (vi + 1) + 100 * li + 10 * take + (7 if style != "plain" else 0)
                    seed_all(seed)
                    f = clip_name("voxcpm2", voice, line["id"], style, take)
                    try:
                        timed = take == 1
                        sync()
                        t0 = time.time()
                        ttfb = None
                        if timed:
                            chunks = []
                            for ch in model.generate_streaming(text=text, reference_wav_path=refs[g], cfg_value=2.0, inference_timesteps=10):
                                if ttfb is None:
                                    ttfb = time.time() - t0
                                chunks.append(np.asarray(ch).reshape(-1))
                            wav = np.concatenate(chunks) if chunks else np.zeros(0)
                        else:
                            wav = model.generate(text=text, reference_wav_path=refs[g], cfg_value=2.0, inference_timesteps=10)
                        sync()
                        wall = time.time() - t0
                        dur = write_wav(a.dir / f, wav, sr)
                        a.add(file=f, line=line["id"], voice=voice, gender=g, style=style,
                              styleControl=STYLE_NOTE[line["id"]] if style != "plain" else None, take=take, ok=True,
                              sampleRate=sr, audioS=dur, seed=seed, wallS=round(wall, 3), batch=1,
                              rtf=round(wall / dur, 3) if timed and dur else None,
                              ttfbS=round(ttfb, 3) if ttfb is not None else None, textSent=text,
                              mode="generate_streaming" if timed else "generate")
                        log(f"voxcpm2 {voice} {line['id']} {style} t{take}: {dur:.2f}s, wall {wall:.2f}s" + (f", ttfb {ttfb:.3f}s" if ttfb else ""))
                    except Exception as e:
                        traceback.print_exc()
                        a.add(file=None, line=line["id"], voice=voice, gender=g, style=style, take=take, ok=False,
                              error=f"{type(e).__name__}: {str(e)[:300]}", seed=seed)


def load_refs(refs_dir):
    p = refs_dir / "refs.json"
    if not p.exists():
        raise SystemExit("no designed references (voxcpm2 must run first)")
    return json.load(open(p))["refs"]


# ------------------------------------------------------------------ Chatterbox Multilingual, Hindi pack
def arm_chatterbox(a, W, refs_dir, space_dir):
    sys.path.insert(0, str(space_dir))
    from chatterbox.src.chatterbox.tts import ChatterboxTTS
    refs = load_refs(refs_dir)
    ck = W / "chatterbox-ckpt"
    ck.mkdir(exist_ok=True)
    for src in [W / "chatterbox-base" / "ve.pt", W / "chatterbox-base" / "conds.pt", W / "chatterbox-hi" / "t3_hi.safetensors",
                W / "chatterbox-hi" / "s3gen_v3.pt", W / "chatterbox-hi" / "grapheme_mtl_merged_expanded_v1.json"]:
        d = ck / src.name
        if not d.exists():
            os.symlink(src, d)
    model = ChatterboxTTS.from_local(ck, "cuda", t3_filename="t3_hi.safetensors", s3gen_filename="s3gen_v3.pt")
    sr = model.sr
    model.generate("नमस्ते, कैसे हो?", audio_prompt_path=refs["F"], language_id="hi")       # warm-up
    a.meta["settings"] = {"plain": {"exaggeration": 0.5, "cfg_weight": 0.5, "temperature": 0.8},
                          "styled": {"exaggeration": CB_EXAG, "cfg_weight": 0.3, "temperature": 0.8},
                          "language_id": "hi", "sampleRate": sr, "watermark": "Resemble PerTh (on by default in this code)"}
    a.meta["styleControl"] = "emotion exaggeration knob per scene (Chatterbox), lower cfg_weight for the expressive arm"
    a.meta["references"] = {g: "VoxCPM2-designed synthetic voice (see the voxcpm2 manifest); no real person" for g in refs}
    a.meta["ttfbNote"] = "this Chatterbox code has no streaming path: ttfbS = full synthesis wall"
    for vi, g in enumerate(("F", "M")):
        voice = f"vox-design-{g}"
        for li, line in enumerate(LINES):
            for style in ("plain", "styled"):
                ex = 0.5 if style == "plain" else CB_EXAG[line["id"]]
                cfg = 0.5 if style == "plain" else 0.3
                for take in range(1, a.takes + 1):
                    if a.out_of_time():
                        log("chatterbox: arm deadline reached")
                        return
                    seed = 1000 * (vi + 1) + 100 * li + 10 * take + (7 if style != "plain" else 0)
                    seed_all(seed)
                    f = clip_name("chatterbox-hi", voice, line["id"], style, take)
                    try:
                        sync()
                        t0 = time.time()
                        wav = model.generate(line["text"], audio_prompt_path=refs[g], exaggeration=ex, cfg_weight=cfg,
                                             temperature=0.8, language_id="hi")
                        sync()
                        wall = time.time() - t0
                        dur = write_wav(a.dir / f, wav.squeeze(0).cpu().numpy(), sr)
                        timed = take == 1
                        a.add(file=f, line=line["id"], voice=voice, gender=g, style=style,
                              styleControl={"exaggeration": ex, "cfg_weight": cfg}, take=take, ok=True, sampleRate=sr,
                              audioS=dur, seed=seed, wallS=round(wall, 3), batch=1,
                              rtf=round(wall / dur, 3) if timed and dur else None,
                              ttfbS=round(wall, 3) if timed else None, textSent=line["text"])
                        log(f"chatterbox {voice} {line['id']} {style} t{take}: {dur:.2f}s, wall {wall:.2f}s")
                    except Exception as e:
                        traceback.print_exc()
                        a.add(file=None, line=line["id"], voice=voice, gender=g, style=style, take=take, ok=False,
                              error=f"{type(e).__name__}: {str(e)[:300]}", seed=seed)


# ------------------------------------------------------------------ VibeVoice-Hindi (community fine-tune)
def arm_vibevoice(a, W, refs_dir, size):
    import torch
    from vibevoice.modular.modeling_vibevoice_inference import VibeVoiceForConditionalGenerationInference
    from vibevoice.processor.vibevoice_processor import VibeVoiceProcessor
    from vibevoice.modular.streamer import AudioStreamer
    refs = load_refs(refs_dir)
    src = W / f"vibevoice-hindi-{size}"
    wd = W / f"vibevoice-hindi-{size}-work"           # same weights, preprocessor pointed at the PINNED Qwen tokenizer
    wd.mkdir(exist_ok=True)
    for p in src.iterdir():
        if p.is_file() and p.name != "preprocessor_config.json" and not (wd / p.name).exists():
            os.symlink(p, wd / p.name)
    if (src / "preprocessor_config.json").exists():
        pc = json.load(open(src / "preprocessor_config.json"))
    else:   # the 1.5B repo ships none: use the 7B card's (identical audio settings), naming the 1.5B's base tokenizer
        pc = {"processor_class": "VibeVoiceProcessor", "speech_tok_compress_ratio": 3200, "db_normalize": True,
              "audio_processor": {"feature_extractor_type": "VibeVoiceTokenizerProcessor", "sampling_rate": 24000,
                                  "normalize_audio": True, "target_dB_FS": -25, "eps": 1e-06},
              "language_model_pretrained_name": "Qwen/Qwen2.5-1.5B", "_note": "taken from tarun7r/vibevoice-hindi-7b (repo has none)"}
    a.meta["tokenizerOriginal"] = pc.get("language_model_pretrained_name")
    pc["language_model_pretrained_name"] = str(W / "qwen2.5-7b-tok")
    json.dump(pc, open(wd / "preprocessor_config.json", "w"), indent=1)
    proc = VibeVoiceProcessor.from_pretrained(str(wd))
    model = VibeVoiceForConditionalGenerationInference.from_pretrained(str(wd), torch_dtype=torch.bfloat16, device_map="cuda",
                                                                       attn_implementation="sdpa")
    model.eval()
    model.set_ddpm_inference_steps(num_steps=10)
    CFG = 1.3

    class FirstChunk(AudioStreamer):
        def __init__(self):
            super().__init__(batch_size=1)
            self.t = None

        def put(self, audio_chunks, sample_indices):
            if self.t is None:
                self.t = time.time()
            return super().put(audio_chunks, sample_indices)

    def synth(text, ref, timed):
        inputs = proc(text=[f"Speaker 1: {text}"], voice_samples=[[ref]], padding=True, return_tensors="pt", return_attention_mask=True)
        for k, v in inputs.items():
            if torch.is_tensor(v):
                inputs[k] = v.to("cuda")
        st = FirstChunk() if timed else None
        sync()
        t0 = time.time()
        with torch.inference_mode():
            out = model.generate(**inputs, max_new_tokens=None, cfg_scale=CFG, tokenizer=proc.tokenizer,
                                 generation_config={"do_sample": False}, verbose=False, is_prefill=True, audio_streamer=st)
        sync()
        wall = time.time() - t0
        sp = out.speech_outputs[0]
        wav = sp.float().reshape(-1).cpu().numpy() if sp is not None else None
        return wav, wall, (st.t - t0) if (st and st.t) else None

    synth("नमस्ते, कैसे हो?", refs["F"], False)          # warm-up
    a.meta["settings"] = {"cfg_scale": CFG, "ddpm_steps": 10, "do_sample": False, "attn": "sdpa (flash_attention_2 not installed; upstream says only FA2 is fully tested)",
                          "dtype": "bf16", "sampleRate": 24000, "repoCode": "vibevoice-community/VibeVoice@" + os.environ.get("VIBEVOICE_COMMIT", "?"),
                          "tokenizer": f"Qwen/Qwen2.5-7B tokenizer @ pinned revision (the model's own preprocessor names {a.meta['tokenizerOriginal']}; Qwen2.5 shares one tokenizer)"}
    a.meta["styleControl"] = "none native (no tags); prosody comes from text + reference. Plain only."
    a.meta["references"] = {g: "VoxCPM2-designed synthetic voice (see the voxcpm2 manifest); the shipped hi-Priya_woman.wav is NOT used (speaker provenance/consent unstated)" for g in refs}
    arm = f"vibevoice-hindi-{size}"
    for vi, g in enumerate(("F", "M")):
        voice = f"vox-design-{g}"
        for li, line in enumerate(LINES):
            for take in range(1, a.takes + 1):
                if a.out_of_time():
                    log(f"{arm}: arm deadline reached")
                    return
                seed = 1000 * (vi + 1) + 100 * li + 10 * take
                seed_all(seed)
                f = clip_name(arm, voice, line["id"], "plain", take)
                try:
                    timed = take == 1
                    wav, wall, ttfb = synth(line["text"], refs[g], timed)
                    if wav is None or not len(wav):
                        a.add(file=None, line=line["id"], voice=voice, gender=g, style="plain", take=take, ok=False, error="no audio", seed=seed)
                        continue
                    dur = write_wav(a.dir / f, wav, 24000)
                    a.add(file=f, line=line["id"], voice=voice, gender=g, style="plain", styleControl=None, take=take, ok=True,
                          sampleRate=24000, audioS=dur, seed=seed, wallS=round(wall, 3), batch=1,
                          rtf=round(wall / dur, 3) if timed and dur else None,
                          ttfbS=round(ttfb, 3) if timed and ttfb is not None else None, textSent=f"Speaker 1: {line['text']}")
                    log(f"{arm} {voice} {line['id']} t{take}: {dur:.2f}s, wall {wall:.2f}s" + (f", ttfb {ttfb:.3f}s" if ttfb else ""))
                except Exception as e:
                    traceback.print_exc()
                    a.add(file=None, line=line["id"], voice=voice, gender=g, style="plain", take=take, ok=False,
                          error=f"{type(e).__name__}: {str(e)[:300]}", seed=seed)


LICENCE = {
    "veena": {"model": "maya-research/Veena", "licence": "Apache-2.0", "commercial": True,
              "notes": "Llama-architecture 3B + SNAC 24 kHz (hubertsiuzdak/snac_24khz, MIT). Voices are 4 professional artists; production use of a stock voice needs Maya Research's written confirmation of the artists' commercial consent."},
    "svara": {"model": "kenpath/svara-tts-v1", "licence": "Apache-2.0 (card)", "commercial": True,
              "notes": "fine-tune of canopylabs/3b-hi-ft-research_release (Orpheus, Llama 3.2 base => Llama 3.2 Community Licence chain); training data SYSPIN/RASA/IndicTTS/SPICOR, data terms [U]. SNAC MIT."},
    "voxcpm2": {"model": "openbmb/VoxCPM2", "licence": "Apache-2.0", "commercial": True,
                "notes": "voices are designed from a text description (no reference person)."},
    "chatterbox-hi": {"model": "ResembleAI/Chatterbox-Multilingual-hi (+ ResembleAI/chatterbox ve.pt/conds.pt)", "licence": "MIT", "commercial": True,
                      "notes": "cloning only; reference = VoxCPM2-designed synthetic voice. Inference code = the official HF Space ResembleAI/Chatterbox-Multilingual-TTS-hi at a pinned commit. PerTh watermark on."},
    "vibevoice-hindi-7b": {"model": "tarun7r/vibevoice-hindi-7b", "licence": "MIT", "commercial": True,
                           "notes": "community LoRA fine-tune of VibeVoice-7B (MIT, Qwen2.5-7B backbone Apache-2.0). Card's responsible-use text says research use and that VibeVoice is not recommended for commercial use without further testing; Hindi training data provenance unstated [U]."},
    "vibevoice-hindi-1.5b": {"model": "tarun7r/vibevoice-hindi-1.5B", "licence": "MIT", "commercial": True,
                             "notes": "as the 7B; VibeVoice-1.5B base (Qwen2.5-1.5B)."},
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("arm", choices=list(LICENCE))
    ap.add_argument("--weights", default="/opt/w")
    ap.add_argument("--out", required=True)
    ap.add_argument("--refs", default="/opt/refs")
    ap.add_argument("--space", default="/opt/src/chatterbox-space")
    ap.add_argument("--takes", type=int, default=3)
    x = ap.parse_args()
    W = Path(x.weights)
    exp = json.load(open(HERE / "weights.expected.json"))["repos"]
    keys = {"veena": ["veena", "snac"], "svara": ["svara", "snac"], "voxcpm2": ["voxcpm2"],
            "chatterbox-hi": ["chatterbox-hi", "chatterbox-base"], "vibevoice-hindi-7b": ["vibevoice-hindi-7b", "qwen2.5-7b-tok"],
            "vibevoice-hindi-1.5b": ["vibevoice-hindi-1.5b", "qwen2.5-7b-tok"]}[x.arm]
    meta = dict(LICENCE[x.arm])
    meta["repos"] = {k: {"repo": exp[k]["repo"], "revision": exp[k]["revision"], "licence": exp[k]["license"]} for k in keys}
    meta["weightsSha256"] = "pins/weights-sha256.json (computed on the instance, compared against weights.expected.json)"
    a = Arm(x.arm, x.out, x.takes, meta)
    import torch
    assert torch.cuda.is_available(), "no CUDA"
    torch.backends.cuda.matmul.allow_tf32 = True
    log(f"arm {x.arm} on {torch.cuda.get_device_name(0)}")
    try:
        if x.arm == "veena":
            arm_veena(a, W)
        elif x.arm == "svara":
            arm_svara(a, W)
        elif x.arm == "voxcpm2":
            arm_voxcpm2(a, W, Path(x.refs))
        elif x.arm == "chatterbox-hi":
            arm_chatterbox(a, W, Path(x.refs), Path(x.space))
        elif x.arm.startswith("vibevoice"):
            arm_vibevoice(a, W, Path(x.refs), x.arm.rsplit("-", 1)[1])
    except BaseException as e:
        traceback.print_exc()
        a.save({"armError": f"{type(e).__name__}: {str(e)[:500]}"})
        raise
    a.save()
    s = json.load(open(a.dir / "manifest.json"))["summary"]
    log(f"arm {x.arm} done: {s}")
    return 0 if s["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
