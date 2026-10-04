import json, urllib.request
models = ["pipecat-ai/smart-turn-v3","openai/whisper-tiny","openai/whisper-base","facebook/wav2vec2-base","facebook/hubert-base-ls960",
 "microsoft/wavlm-base-plus","microsoft/wavlm-base","ntu-spml/distilhubert","ai4bharat/indicwav2vec-hindi","ai4bharat/indicwav2vec_v1_hindi",
 "facebook/mms-300m","facebook/mms-1b","facebook/wav2vec2-xls-r-300m","facebook/wav2vec2-base-960h","onnx-community/whisper-tiny","onnx-community/whisper-base",
 "Xenova/whisper-tiny","emotion2vec/emotion2vec_plus_base","audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim","TEN-framework/ten-vad","onnx-community/silero-vad",
 "facebook/data2vec-audio-base","speechbrain/spkrec-ecapa-voxceleb","pipecat-ai/smart-turn-v2","livekit/turn-detector","Wespeaker/wespeaker-voxceleb-resnet34-LM",
 "facebook/w2v-bert-2.0","usefulsensors/moonshine-tiny","UsefulSensors/moonshine-tiny","nvidia/parakeet-tdt-0.6b-v2","ai4bharat/IndicWav2Vec","ai4bharat/indic-conformer-600m-multilingual"]
for m in models:
    try:
        with urllib.request.urlopen(f"https://huggingface.co/api/models/{m}?blobs=true", timeout=30) as r:
            d=json.load(r)
        card=d.get("cardData") or {}
        lic=card.get("license") or [t for t in d.get("tags",[]) if t.startswith("license:")]
        gated=d.get("gated")
        files=[(s["rfilename"], s.get("size")) for s in d.get("siblings",[]) if s["rfilename"].endswith((".onnx",".bin",".safetensors",".pt",".onnx_data",".data"))]
        files=sorted(files,key=lambda x:-(x[1] or 0))[:8]
        print(json.dumps({"m":m,"license":lic,"gated":gated,"downloads":d.get("downloads"),"lastModified":d.get("lastModified"),"files":[(f,round((s or 0)/1e6,1)) for f,s in files]}))
    except Exception as e:
        print(json.dumps({"m":m,"error":str(e)[:120]}))
