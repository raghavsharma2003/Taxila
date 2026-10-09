"""HiACC (Hinglish Adult & Children Code-switched corpus; Singh, Singh & Kadyan 2025, Data in Brief,
DOI 10.1016/j.dib.2025.111886; zenodo.org/records/15551669). EVALUATION ONLY. Licence as read 2026-10-09: the Zenodo record
says CC BY 4.0, the data article's specifications table says "academic/research use under a CC BY-NC 4.0 license"; the
stricter reading governs (never trained on, numbers only, every wav deleted after the front-end reduced it). Ethics: UPES
Research Ethics Committee REF-1002; "all participants ... gave their consent" (parental consent is not described: flagged).

What it can measure, and what it cannot. The transcripts do not mark fillers (checked: no um/uh/hmm-type tokens beyond
words that are also ordinary words), so this is NOT a precision measurement. It measures, for the same phone (Samsung
Galaxy M34, 16 kHz), the same tasks and the same language mix, how often the detector fires on CHILDREN's speech (20
children aged 10-14) vs ADULTS' speech (20 adults), per speech-minute, per utterance kind, and how often the thinking-pause
cue fires at utterance ends. A detector that fires far more on children than on adults under identical conditions is
over-firing on child voices (pitch / formants), which is the failure the pilot must rule out.

  python3 -I evals/voicesig/r3/hiacc_eval.py <Corpus.zip> <work> --models m1.onnx:thr1,m2.onnx:thr2 --out <json>
"""
import argparse, io, json, os, re, subprocess, sys, wave, zipfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
Q = re.compile(r"(आप|तुम|तुम्हारा|आपका|आपको|आपने|बताइए|बताओ|बता सकते|\?)")
QW = re.compile(r"(क्या|कैसे|कौन|किस|कहाँ|कहां|क्यों|कब|कितन)")


def kind_of(text):
    """Heuristic (documented as such): a second-person question is the interviewer's PROMPT (who voiced it is not stated),
    anything else is the speaker's ANSWER / narration."""
    return "prompt" if Q.search(text) and QW.search(text) else "answer"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("zip")
    ap.add_argument("work")
    ap.add_argument("--models", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    z = zipfile.ZipFile(a.zip)
    meta, texts = {}, {}
    for grp, tdir in (("children", "transcript"), ("adult", "transcription")):
        for line in z.read(f"Corpus/{grp}/metadata/speaker_info.csv").decode("utf8", "replace").splitlines()[1:]:
            p = line.split(",")
            if len(p) >= 4:
                meta[p[0].strip()] = {"group": grp, "sex": p[1].strip(), "age": p[2].strip(), "l1": p[3].strip()}
        for n in z.namelist():
            if n.startswith(f"Corpus/{grp}/{tdir}/") and n.endswith(".txt"):
                for line in z.read(n).decode("utf8", "replace").splitlines():
                    if "," in line:
                        k, t = line.split(",", 1)
                        texts[k.strip()] = t.strip()
    wavs = sorted(n for n in z.namelist() if n.endswith(".wav"))
    by_spk = {}
    for n in wavs:
        b = os.path.basename(n)
        spk = b[:4]
        by_spk.setdefault(spk, []).append(n)
    rng = np.random.default_rng(5)
    results = []
    for spk, files in sorted(by_spk.items()):
        parts, segs, t = [(rng.standard_normal(8000) * 3e-4).astype(np.float32)], [], 500.0
        for n in sorted(files):
            w = wave.open(io.BytesIO(z.read(n)))
            if w.getframerate() != 16000 or w.getsampwidth() != 2:
                continue
            x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
            if w.getnchannels() > 1:
                x = x.reshape(-1, w.getnchannels()).mean(axis=1)
            b = os.path.basename(n)
            segs.append({"id": b, "startMs": round(t), "endMs": round(t + len(x) / 16), "kind": kind_of(texts.get(b, ""))})
            parts.append(x)
            gap = (rng.standard_normal(int(0.8 * 16000)) * 3e-4).astype(np.float32)
            parts.append(gap)
            t += len(x) / 16 + 800
        y = np.clip(np.concatenate(parts), -1, 1)
        wav = os.path.join(a.work, f"{spk}.wav")
        with wave.open(wav, "wb") as o:
            o.setnchannels(1); o.setsampwidth(2); o.setframerate(16000)
            o.writeframes((y * 32767).astype("<i2").tobytes())
        sp = os.path.join(a.work, f"{spk}.segs.json")
        json.dump(segs, open(sp, "w"))
        try:
            r = subprocess.run(["node", os.path.join(HERE, "hiacc_speaker.mjs"), wav, sp, *a.models.split(",")], capture_output=True, text=True, timeout=3600)
            for line in r.stdout.splitlines():
                if line.startswith("{"):
                    d = json.loads(line)
                    d["speaker"] = spk
                    d.update(meta.get(spk, {"group": "children" if spk.startswith("CH") else "adult"}))
                    results.append(d)
            if r.returncode != 0:
                print(spk, "node failed", r.stderr[-300:], flush=True)
        finally:
            os.remove(wav)
            os.remove(sp)
        print(spk, len(segs), "utterances", flush=True)

    def agg(rows):
        sp = sum(u["speechMs"] for r in rows for u in r["per"]) / 60000
        runs = sum(u["runs"] for r in rows for u in r["per"])
        utt = sum(len(r["per"]) for r in rows)
        withrun = sum(1 for r in rows for u in r["per"] if u["runs"] > 0)
        f0 = [u["f0Median"] for r in rows for u in r["per"] if u["f0Median"]]
        reads = sum(r["cue"]["reads"] for r in rows)
        fired = sum(r["cue"]["fired"] for r in rows)
        per_spk = [sum(u["runs"] for u in r["per"]) / max(1e-9, sum(u["speechMs"] for u in r["per"]) / 60000) for r in rows]
        return {"speakers": len({r["speaker"] for r in rows}), "utterances": utt, "speechMin": round(sp, 1), "runs": runs,
                "runsPerSpeechMin": round(runs / max(1e-9, sp), 3), "speakerRateIQR": [round(float(np.percentile(per_spk, q)), 2) for q in (25, 50, 75)] if per_spk else None,
                "utterancesWithRun": round(withrun / max(1, utt), 3), "f0MedianHz": round(float(np.median(f0)), 1) if f0 else None,
                "cueReads": reads, "cueFired": fired, "cueFiredPerRead": round(fired / max(1, reads), 3)}
    out = {"label": "HiACC (EVALUATION ONLY; CC BY 4.0 per Zenodo / CC BY-NC 4.0 per the article: the stricter reading applied). 20 children aged 10-14 and 20 adults, Hinglish, Samsung Galaxy M34, 16 kHz. NOT a precision: the transcripts do not mark fillers. Fire rates under identical conditions, children vs adults.",
           "models": {}}
    for spec in a.models.split(","):
        parts = spec.split(":")
        m, thr = parts[0], float(parts[1])
        mn = int(parts[2]) if len(parts) > 2 else 200
        rows = [r for r in results if r["model"] == m and abs(r["thr"] - thr) < 1e-9 and r.get("minMs", 200) == mn]
        out["models"][f"{os.path.relpath(m, ROOT)}@{thr}/{mn}ms"] = {"thr": thr, "minMs": mn,
            **{f"{g}.{k}": agg([{**r, "per": [u for u in r["per"] if k == "all" or u["kind"] == k]} for r in rows if r["group"] == g]) for g in ("children", "adult") for k in ("all", "answer", "prompt")}}
    json.dump({**out, "rows": results}, open(a.out, "w"), indent=1, ensure_ascii=False)
    print(json.dumps(out, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
