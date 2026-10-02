#!/usr/bin/env python3
"""EXPERIMENT ONLY (never product code): synthesise test passage (b) on public Hugging Face demo Spaces of
open-source TTS models, to get an ear-level sample of each candidate before paying for Azure GPU.
Reference clips are the vendors' own demo prompts (Resemble hi_f1.flac), never a real person we recorded.
Wall times include ZeroGPU queue + cold start, so they are NOT latency evidence.

  pip install gradio_client; SSL_CERT_FILE=/root/.ccr/ca-bundle.crt python3 oss-tts-samples.py [name ...]
"""
import json, os, shutil, subprocess, sys, time
from gradio_client import Client, handle_file

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "samples")
WORK = os.environ.get("WORK", "/tmp")
B = ("देखो, एक pizza लो और उसे दो बराबर हिस्सों में काटो। एक हिस्सा हुआ one by two, यानी आधा। अब उसी pizza को चार "
     "बराबर हिस्सों में काटो, तो दो हिस्से भी उतना ही pizza हैं, two by four. इसलिए one by two और two by four, "
     "equivalent fractions हैं। अच्छा, तुम बताओ, अगर pizza के आठ हिस्से हों, तो कितने हिस्से आधे के बराबर होंगे?")
# Same passage with the English words pre-transliterated to Devanagari (what a spoken-notation normaliser would emit
# for a model that cannot read Latin script inside Hindi).
B_DEV = (B.replace("pizza", "पिज़्ज़ा").replace("one by two", "वन बाय टू").replace("two by four", "टू बाय फ़ोर")
         .replace("equivalent fractions", "इक्विवेलेंट फ़्रैक्शन्स").replace("four.", "फ़ोर।"))
B1, B2 = B.split("इसलिए")
B2 = "इसलिए" + B2
REF = "https://storage.googleapis.com/chatterbox-demo-samples/mtl_prompts/hi_f1.flac"
REF_TEXT = "गांव में इतने आदमी तो हैं, किस पर बेदखली नहीं आई, किस पर कुड़की नहीं आई?"  # gpt-4o-transcribe of REF
DESIGN = "A warm, friendly young Indian woman school teacher speaking natural Hinglish to a 10-year-old, gentle and encouraging"


def path_of(r):
    if isinstance(r, (list, tuple)):
        r = r[0]
    if isinstance(r, dict):
        r = r.get("path") or r.get("value")
    return r


def to_mp3(srcs, name):
    dst = os.path.join(OUT, f"oss-{name}.mp3")
    if len(srcs) == 1:
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", srcs[0]]
    else:
        cmd = ["ffmpeg", "-y", "-loglevel", "error"]
        for s in srcs:
            cmd += ["-i", s]
        # 250 ms of silence between chunks
        cmd += ["-filter_complex", "".join(f"[{i}:a]aresample=24000,aformat=channel_layouts=mono[a{i}];" for i in range(len(srcs)))
                + "aevalsrc=0:d=0.25:s=24000[gap];" + "[a0][gap][a1]concat=n=3:v=0:a=1[o]", "-map", "[o]"]
    cmd += ["-ac", "1", "-ar", "24000", "-b:a", "64k", dst]
    subprocess.run(cmd, check=True)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst]))
    return dst, dur


def svara():
    c = Client("kenpath/svara-tts", verbose=False)
    return [path_of(c.predict("Hindi (हिन्दी)", "Female", B, 0.7, 0.8, 1.1, 2048, api_name="/generate_speech"))]


def chatterbox_hi():
    c = Client("ResembleAI/Chatterbox-Multilingual-TTS-hi", verbose=False)
    return [path_of(c.predict(t, handle_file(REF), 0.5, 0.8, 0, 0.5, api_name="/generate_tts_audio")) for t in (B1, B2)]


def chatterbox_v3():
    c = Client("ResembleAI/Chatterbox-Multilingual-TTS-V3", verbose=False)
    return [path_of(c.predict(t, handle_file(REF), "hi", 0.5, 0.8, 0, 0.5, api_name="/generate_tts_audio")) for t in (B1, B2)]


def voxcpm2():
    c = Client("openbmb/VoxCPM-Demo", verbose=False)
    info = c.view_api(return_format="dict", print_info=False)
    params = info["named_endpoints"]["/generate"]["parameters"]
    args = {"text_input": B, "control_instruction": DESIGN, "reference_wav_path_input": None, "use_prompt_text": False,
            "prompt_text_input": "", "cfg_value_input": 2.0, "do_normalize": True, "denoise": False}
    vals = [args.get(p["parameter_name"], p.get("parameter_default")) for p in params]
    return [path_of(c.predict(*vals, api_name="/generate"))]


def indicf5():
    c = Client("ai4bharat/IndicF5", verbose=False)
    return [path_of(c.predict(B, handle_file(REF), REF_TEXT, api_name="/synthesize_speech"))]


def cosyvoice3():
    c = Client("FunAudioLLM/Fun-CosyVoice3-0.5B", verbose=False)
    return [path_of(c.predict(B, "zero_shot", "You are a helpful assistant.<|endofprompt|>" + REF_TEXT, handle_file(REF),
                              handle_file(REF), "You are a helpful assistant. 请用广东话表达。<|endofprompt|>", 0, False, "En",
                              api_name="/generate_audio"))]


def parler():
    c = Client("ai4bharat/indic-parler-tts", verbose=False)
    desc = "Divya speaks in a warm, expressive tone at a moderate pace, very clear audio, close recording, no background noise."
    return [path_of(c.predict(B, desc, api_name="/gen_tts"))]


def raw_gradio(host, api, data, timeout=1500):
    """Gradio HTTP API without gradio_client (some Spaces return a schema gradio_client cannot parse)."""
    import httpx
    with httpx.Client(timeout=timeout) as h:
        ev = h.post(f"{host}/gradio_api/call/{api}", json={"data": data}).json()["event_id"]
        with h.stream("GET", f"{host}/gradio_api/call/{api}/{ev}") as r:
            kind = None
            for line in r.iter_lines():
                if line.startswith("event:"):
                    kind = line[6:].strip()
                elif line.startswith("data:") and kind in ("complete", "error"):
                    if kind == "error":
                        raise RuntimeError(line[5:300])
                    out = json.loads(line[5:])
                    f = out[0]
                    url = f.get("url") or f"{host}/gradio_api/file={f['path']}"
                    dst = os.path.join(WORK, f"raw-{int(time.time()*1000)}" + os.path.splitext(f.get("path", ".wav"))[1])
                    open(dst, "wb").write(h.get(url).content)
                    return dst


def upload(host, local):
    import httpx
    return httpx.post(f"{host}/gradio_api/upload", files={"files": open(local, "rb")}, timeout=120).json()[0]


def indicf5_cpu():
    # community CPU mirror of the same ai4bharat/IndicF5 weights (the ZeroGPU Space was out of anonymous quota)
    host = "https://yashmachinelearning-indicf5-1.hf.space"
    ref = os.path.join(WORK, "hi_f1.wav")
    if not os.path.exists(ref):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", REF, ref], check=True)
    sp = upload(host, ref)
    return [raw_gradio(host, "synthesize_speech", [B, {"path": sp, "meta": {"_type": "gradio.FileData"}}, REF_TEXT])]


def indicf5_dev():
    c = Client("ai4bharat/IndicF5", verbose=False)
    return [path_of(c.predict(B_DEV, handle_file(REF), REF_TEXT, api_name="/synthesize_speech"))]


RUNS = {"indicf5-devanagari": indicf5_dev, "indicf5-cpu": indicf5_cpu, "svara": svara, "chatterbox-hi": chatterbox_hi, "chatterbox-v3": chatterbox_v3, "voxcpm2": voxcpm2,
        "indicf5": indicf5, "cosyvoice3": cosyvoice3, "indic-parler": parler}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    names = sys.argv[1:] or list(RUNS)
    log = os.path.join(HERE, "oss-tts-samples.json")
    res = json.load(open(log)) if os.path.exists(log) else {}
    for n in names:
        t0 = time.time()
        try:
            srcs = RUNS[n]()
            dst, dur = to_mp3(srcs, n)
            res[n] = {"ok": True, "file": os.path.relpath(dst, HERE), "audio_s": round(dur, 2),
                      "wall_s_incl_queue": round(time.time() - t0, 1), "date": time.strftime("%Y-%m-%d")}
        except Exception as e:  # record the failure; it is evidence too
            res[n] = {"ok": False, "error": f"{type(e).__name__}: {str(e)[:300]}", "wall_s": round(time.time() - t0, 1),
                      "date": time.strftime("%Y-%m-%d")}
        print(n, json.dumps(res[n], ensure_ascii=False), flush=True)
        json.dump(res, open(log, "w"), ensure_ascii=False, indent=1)
