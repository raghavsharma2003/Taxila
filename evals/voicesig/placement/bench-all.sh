#!/bin/bash
# Runs every (model, runtime, input, threads) cell in its own process; appends JSON lines to results.jsonl.
cd "$(dirname "$0")"
W=${VS_WORK:-.work}
M=$W/models
OUT=${OUT:-$W/results.jsonl}
run() { timeout 900 node bench-one.mjs "$@" 2>/dev/null | grep '^{' >> $OUT || echo "{\"fail\":\"$*\"}" >> $OUT; }
for rt in node web; do
  run $rt $M/prosody-logit.fp32.onnx logit 1 200
  run $rt $M/prosody-gru.fp32.onnx prosody 1 100
  run $rt $M/smart-turn-v3.2-cpu.onnx mel800 1 30
  run $rt $M/smart-turn-v3.2-cpu.shared.onnx mel800 1 30
  run $rt $M/smart-turn-v3.2-gpu.onnx mel800 1 30
  run $rt $M/whisper-tiny-enc.int8.onnx mel800 1 30
  run $rt $M/whisper-base-enc.int8.onnx mel800 1 20
  run $rt $M/distilhubert.int8.onnx audio3 1 20
  run $rt $M/distilhubert.int8.onnx audio8 1 10
  for m in wav2vec2-base hubert-base wavlm-base-plus; do
    run $rt $M/$m.int8.onnx audio3 1 10
    run $rt $M/$m.int8.onnx audio8 1 5
  done
done
# Threads: 4-thread native for reference (wasm threads need crossOriginIsolated in a browser).
run node $M/smart-turn-v3.2-cpu.onnx mel800 4 30
run node $M/wav2vec2-base.int8.onnx audio3 4 10
run node $M/whisper-base-enc.int8.onnx mel800 4 20
# fp32 SSL reference on native (the int8 fidelity check showed wav2vec2-base int8 drifts: cos 0.84).
run node $M/wav2vec2-base.fp32.onnx audio3 1 5
run node $M/distilhubert.fp32.onnx audio3 1 10
