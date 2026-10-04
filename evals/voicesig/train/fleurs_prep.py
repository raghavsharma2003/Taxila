"""FLEURS (google/fleurs on Hugging Face, NOT gated, CC BY 4.0 per the dataset card read 2026-10-04) -> Hindi vs English
READ speech streams for a false-alarm check of the filler detector: read sentences carry essentially no filled pauses, so
every detector run on them is (to a first approximation) a false alarm. The question it answers: do Hindi long vowels /
phrase-final lengthening (RS §4.3) fire the detector more than English does? Evaluation only.

usage: python3 fleurs_prep.py <work_dir> [--minutes 15]
"""
import io, json, os, subprocess, sys, tarfile, urllib.request
import numpy as np
import soundfile as sf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
URL = "https://huggingface.co/datasets/google/fleurs/resolve/main/data/{lang}/audio/dev.tar.gz"


def main():
    work = sys.argv[1]
    minutes = float(sys.argv[sys.argv.index("--minutes") + 1]) if "--minutes" in sys.argv else 15
    os.makedirs(os.path.join(work, "feat"), exist_ok=True)
    for lang in ("hi_in", "en_us"):
        stem = os.path.join(work, "feat", lang)
        if os.path.exists(stem + ".json"):
            continue
        tgz = os.path.join(work, f"{lang}.dev.tar.gz")
        if not os.path.exists(tgz):
            urllib.request.urlretrieve(URL.format(lang=lang), tgz)
        rng = np.random.default_rng(1)
        parts, total = [], 0
        with tarfile.open(tgz) as tf:
            for m in tf:
                if not m.isfile() or not m.name.endswith(".wav"):
                    continue
                x, sr = sf.read(io.BytesIO(tf.extractfile(m).read()), dtype="float32")
                if x.ndim > 1:
                    x = x.mean(axis=1)
                if sr != 16000:
                    from scipy.signal import resample_poly
                    x = resample_poly(x, 16000, sr).astype(np.float32)
                parts.append(x)
                parts.append((rng.standard_normal(int(0.8 * 16000)) * 3e-4).astype(np.float32))
                total += len(x) / 16000
                if total >= minutes * 60:
                    break
        y = np.concatenate([(rng.standard_normal(16000) * 3e-4).astype(np.float32)] + parts)
        wav = stem + ".wav"
        sf.write(wav, np.clip(y, -1, 1), 16000, subtype="PCM_16")
        r = subprocess.run(["node", os.path.join(ROOT, "evals/voicesig/train/extract.mjs"), wav, stem], capture_output=True, text=True, timeout=3600)
        print(lang, r.stdout.strip() or r.stderr[-300:], flush=True)
        os.remove(wav)
        os.remove(tgz)
        j = json.load(open(stem + ".json"))
        j.update({"corpus": "fleurs", "meeting": lang, "speaker": lang, "sex": "", "l1": lang, "split": "falsealarm", "words": [], "speechS": round(total, 1)})
        json.dump(j, open(stem + ".json", "w"))


if __name__ == "__main__":
    main()
