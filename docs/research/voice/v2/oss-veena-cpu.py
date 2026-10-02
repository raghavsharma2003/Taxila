#!/usr/bin/env python3
"""EXPERIMENT ONLY: run maya-research/Veena (Apache-2.0, 3B Llama + SNAC 24 kHz) on CPU to hear passage (b),
because no public GPU demo of Veena was reachable. CPU speed says nothing about GPU latency; only the audio matters.
Veena's context is 2048 tokens and ~84 SNAC tokens/s of audio, so the passage is synthesised sentence by sentence
(that is also how a streaming cascade would feed it) and joined with 200 ms gaps.

  pip install torch --index-url https://download.pytorch.org/whl/cpu; pip install transformers snac soundfile
  python3 oss-veena-cpu.py [speaker]
"""
import os, sys, time, json, re
import numpy as np, torch, soundfile as sf
from transformers import AutoModelForCausalLM, AutoTokenizer
from snac import SNAC

HERE = os.path.dirname(os.path.abspath(__file__))
SPK = sys.argv[1] if len(sys.argv) > 1 else "kavya"
B = ("देखो, एक pizza लो और उसे दो बराबर हिस्सों में काटो। एक हिस्सा हुआ one by two, यानी आधा। अब उसी pizza को चार "
     "बराबर हिस्सों में काटो, तो दो हिस्से भी उतना ही pizza हैं, two by four. इसलिए one by two और two by four, "
     "equivalent fractions हैं। अच्छा, तुम बताओ, अगर pizza के आठ हिस्से हों, तो कितने हिस्से आधे के बराबर होंगे?")
SENTS = [s.strip() for s in re.split(r"(?<=[।?.])\s+", B) if s.strip()]
SOS, EOS, SOH, EOH, SOA, EOA, BASE = 128257, 128258, 128259, 128260, 128261, 128262, 128266

torch.set_num_threads(os.cpu_count())
tok = AutoTokenizer.from_pretrained("maya-research/Veena")
model = AutoModelForCausalLM.from_pretrained("maya-research/Veena", torch_dtype=torch.bfloat16).eval()
snac = SNAC.from_pretrained("hubertsiuzdak/snac_24khz").eval()


def decode(codes):
    codes = codes[: len(codes) // 7 * 7]
    off = [BASE + i * 4096 for i in range(7)]
    l0, l1, l2 = [], [], []
    for i in range(0, len(codes), 7):
        c = [codes[i + j] - off[j] for j in range(7)]
        l0.append(c[0]); l1 += [c[1], c[4]]; l2 += [c[2], c[3], c[5], c[6]]
    t = [torch.tensor(x, dtype=torch.int32).unsqueeze(0) for x in (l0, l1, l2)]
    with torch.no_grad():
        return snac.decode(t).squeeze().clamp(-1, 1).numpy()


pieces, stats = [], []
for s in SENTS:
    ids = [SOH, *tok.encode(f"<spk_{SPK}> {s}", add_special_tokens=False), EOH, SOA, SOS]
    t0 = time.time()
    with torch.no_grad():
        out = model.generate(torch.tensor([ids]), max_new_tokens=min(int(len(s) * 1.3) * 7 + 21, 1400), do_sample=True,
                             temperature=0.4, top_p=0.9, repetition_penalty=1.05, eos_token_id=[EOS, EOA])
    gen = [x for x in out[0][len(ids):].tolist() if BASE <= x < BASE + 7 * 4096]
    wav = decode(gen)
    stats.append({"sentence": s, "tokens": len(gen), "audio_s": round(len(wav) / 24000, 2), "cpu_s": round(time.time() - t0, 1)})
    print(json.dumps(stats[-1], ensure_ascii=False), flush=True)
    pieces += [wav, np.zeros(int(0.2 * 24000), dtype=np.float32)]

wavp = os.path.join(os.environ.get("WORK", "/tmp"), f"veena-{SPK}.wav")
sf.write(wavp, np.concatenate(pieces), 24000)
mp3 = os.path.join(HERE, "samples", f"oss-veena-{SPK}.mp3")
os.system(f"ffmpeg -y -loglevel error -i {wavp} -ac 1 -ar 24000 -b:a 64k {mp3}")
log = os.path.join(HERE, "oss-tts-samples.json")
res = json.load(open(log)) if os.path.exists(log) else {}
res[f"veena-{SPK}"] = {"ok": True, "file": os.path.relpath(mp3, HERE), "runtime": "local CPU bf16, 4 vCPU (not latency evidence)",
                       "sentences": stats, "date": time.strftime("%Y-%m-%d")}
json.dump(res, open(log, "w"), ensure_ascii=False, indent=1)
