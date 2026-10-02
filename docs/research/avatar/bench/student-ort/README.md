# Streaming student micro-bench (graphics review, 2026-10-02)

Synthetic, random-weight causal TCN (5 layers, kernel 3, dilations 1-2-4-8-16, explicit conv-state I/O) + 1 GRU + linear(26),
one 10 ms frame per `session.run`, onnxruntime-web 1.30.0 `wasm` EP, 1 thread, SIMD, Node 22, Intel Xeon @ 2.1 GHz (cloud VM).
300 warm-up runs, n = 2000 timed runs per model.

    pip install onnx numpy && npm i onnxruntime-web@1.30.0
    python3 mk.py 8 8 t00.onnx; python3 mk.py 96 96 s03.onnx; python3 mk.py 160 128 s05.onnx; python3 mk.py 224 192 s10.onnx
    node b.mjs t00.onnx s03.onnx s05.onnx s10.onnx

| model | params | median ms/frame | p95 ms/frame |
|---|---|---|---|
| t00 (overhead probe) | 3.5 k | 0.078 | 0.210 |
| s03 | 194 k | 0.315 | 0.515 |
| s05 | 463 k | 0.49-0.64 | 0.79-0.82 |
| s10 | 905 k | 1.113 | 1.485 |

This is a desktop server core. It is NOT a phone number; see audio-to-face-ml.md "Graphics review" G-2 for the extrapolation.
