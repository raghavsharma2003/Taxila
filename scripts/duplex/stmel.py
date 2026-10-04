# Whisper log-mel for Smart Turn v3.2, vectorised numpy (the transformers 5.x extractor takes ~560 ms per 8 s window on
# this box; this takes ~3 ms). Matches WhisperFeatureExtractor(chunk_length=8)(audio, padding="max_length",
# max_length=128000, truncation=True, do_normalize=True) to float32 tolerance; checked by `python3 stmel.py --check`.
# Preprocessing per pipecat-ai/smart-turn inference.py + audio_utils.py (BSD-2, read 2026-10-04): keep the LAST 8 s,
# zero-pad at the BEGINNING, then the extractor (zero-mean unit-variance over the padded 8 s, log-mel, max-8 clamp).
import os
import numpy as np

SR = 16000
N = 8 * SR
NFFT, HOP = 400, 160
_WIN = (0.5 - 0.5 * np.cos(2 * np.pi * np.arange(NFFT) / NFFT)).astype(np.float64)  # periodic hann (torch/whisper)
_MEL = None


def mel_filters():
    global _MEL
    if _MEL is None and os.environ.get("TAXILA_MEL_NPY"):
        _MEL = np.load(os.environ["TAXILA_MEL_NPY"]).astype(np.float64)  # the same matrix, saved once (no transformers needed)
    if _MEL is None:
        from transformers import WhisperFeatureExtractor
        _MEL = WhisperFeatureExtractor(chunk_length=8).mel_filters.astype(np.float64)  # [201, 80]
    return _MEL


def window(audio, t_end_samples, t_start_samples=0):
    """The Smart Turn input window: audio[max(start, end-8s):end], zero-padded at the beginning to 8 s."""
    a = audio[max(t_start_samples, t_end_samples - N):t_end_samples].astype(np.float64)
    if len(a) < N:
        a = np.concatenate([np.zeros(N - len(a)), a])
    return a


def logmel(x):
    """x: float64 [128000] -> float32 [80, 800]."""
    x = (x - x.mean()) / np.sqrt(x.var() + 1e-7)
    xp = np.pad(x, (NFFT // 2, NFFT // 2), mode="reflect")
    nfr = 1 + (len(xp) - NFFT) // HOP
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(nfr)[:, None]
    spec = np.fft.rfft(xp[idx] * _WIN[None, :], n=NFFT, axis=1)
    power = (spec.real ** 2 + spec.imag ** 2)[:-1]  # drop the last frame (whisper)
    mel = power @ mel_filters()  # [800, 80]
    lg = np.log10(np.maximum(mel, 1e-10))
    lg = np.maximum(lg, lg.max() - 8.0)
    return ((lg + 4.0) / 4.0).T.astype(np.float32)


if __name__ == "__main__":
    import sys, time
    if "--check" in sys.argv:
        from transformers import WhisperFeatureExtractor
        fe = WhisperFeatureExtractor(chunk_length=8)
        rs = np.random.RandomState(1)
        worst = 0.0
        for k in range(4):
            a = (rs.randn(SR * (3 + 2 * k)) * 0.05).astype(np.float32)
            w = window(a, len(a))
            ref = fe(w.astype(np.float32), sampling_rate=SR, return_tensors="np", padding="max_length", max_length=N, truncation=True, do_normalize=True).input_features[0]
            t = time.time(); mine = logmel(w); dt = (time.time() - t) * 1000
            worst = max(worst, float(np.abs(ref - mine).max()))
            print(f"window {k}: max abs diff {np.abs(ref - mine).max():.2e}  ({dt:.1f} ms)")
        print("OK" if worst < 1e-3 else "MISMATCH", worst)
