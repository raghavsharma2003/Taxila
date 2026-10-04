# stt-v3 open-weight STT: licences and model hashes

Date 2026-10-04. These are the weights the stt-v3 bench (`scripts/voice/stt-v3/bench_open.py`) ran. Each one was
downloaded on the GPU host at the exact Hugging Face revision below. Every file was sha256-hashed on that host, and the
hashes are written to each arm's `env.json` (`evals/stt-v3/results/raw/<arm>/env.json`).

- **[M]** = read from the repo or its model card on 2026-10-04.
- **[U]** = our reading, not legal advice. A lawyer should read the licence text before anything ships.

## 1. Benchmarked (weights hashed)

| model (repo @ revision) | licence | commercial use | conditions that matter to us | weights file: bytes, sha256 |
|---|---|---|---|---|
| `nvidia/nemotron-3.5-asr-streaming-0.6b` @ `ea30d66debe3740a08b573244286791d423d6b3e` | OpenMDW-1.1 (card: `license: other`, `license_name: openmdw-1.1`) [M] | yes [M]: the card says "ready for commercial use", and the licence grants rights "without restriction" | Keep the licence and notices when the weights are redistributed. Rights end if we sue over patents or copyright in the model. There are no use restrictions, and nothing restricts the outputs [M]. | `model.safetensors` 2,552,062,944 B, `9eebdd6590289cb3030f310858f3df93256600a800a3e8200c5993d5f967e174` |
| `mistralai/Voxtral-Mini-4B-Realtime-2602` @ `2769294da9567371363522aac9bbcfdd19447add` | Apache-2.0 [M] | yes [M] | Apache NOTICE and attribution. The card adds a line saying it must not be used to infringe third-party rights [M]. | `model.safetensors` 8,859,446,848 B, `e745e4902df6a4c48f29f2f8dc1f6d0fb4cc73c7156bc45923451a5bcdfcd1d6`. Also used: `tekken.json`, `8434af1d39eba99f0ef46cf1450bf1a63fa941a26933a1ef5dbbf4adf0d00e44`. `consolidated.safetensors` (the vLLM format) was not downloaded. |
| `Qwen/Qwen3-ASR-1.7B-hf` @ `bcd2b5b7f32b480ab5790554cfa8347f246a14f3` | Apache-2.0 [M] | yes [M] | Apache NOTICE | see `Q17/env.json` (QWEN17_HASH) |
| `Qwen/Qwen3-ASR-0.6B-hf` @ `7f1569a48a89f3e3f4dc3a5c9d28bddd903bc76c` | Apache-2.0 [M] | yes [M] | Apache NOTICE | `model.safetensors` 1,564,928,088 B, `d3f212dd20abecd315d830bc54ae3865e56ebfc3276484e57b771288ba27fd35` |
| `shunyalabs/zero-stt-hinglish` @ `93b882ac4f1d470d910ef8e1e48d44d51a439cc6` | `openrail` on the card [M]. The repo has **no LICENSE file** [M]. | Card says commercial use is allowed [U]. OpenRAIL licences permit commercial use but attach use restrictions. | The repo does not say which OpenRAIL text (-M, -S, …) applies, so the use restrictions cannot be read from it. **Blocker for shipping:** get the exact licence text from Shunya Labs in writing. The base model is openai/whisper-medium (MIT). Training data includes Vaani, Kathbath and Shrutilipi plus "proprietary datasets" [M]. | `model.safetensors` 1,527,827,760 B, `d45102deb636dc22cbced741bd896a7bbb28dd7ecea565904f458937e3447ca5` |

About the `-hf` repos: SCAN.md lists `Qwen/Qwen3-ASR-1.7B` @ `7278e1e7…` and `Qwen/Qwen3-ASR-0.6B` @ `5eb14417…`. Those are
the original-format checkpoints for the `qwen-asr` package and vLLM. The bench ran Qwen's own transformers-format repos
(`-hf`) instead, so that every arm uses one runtime, transformers 5.18. Same publisher, same licence. Treat the bench
numbers as those of the `-hf` weights [U: we did not check that the two formats give identical outputs].

## 2. Shortlisted but NOT benchmarked

| model (repo @ revision) | licence | why it was not run |
|---|---|---|
| `ARTPARK-IISc/SraVaani-0.5-live` @ `29a15303a55673367134eee9e1d18cb1a2dcaabf` | MIT on the card. The 1.0 paper says CC BY 4.0 [M]. | **Gated** (`gated: auto`): download needs a Hugging Face token from an account that accepted the terms. This environment has no `HF_TOKEN`, and anonymous requests return HTTP 401 [M]. |
| `ARTPARK-IISc/SraVaani-1.0` @ `f5dd5358325a5208775b91dad98918e079ea2b27` | MIT [M] | Gated, as above |
| `ai4bharat/indic-conformer-600m-multilingual` @ `e9b71b369c048e2c6b634d4c131061c34e441179` | MIT [M] | Gated, as above (anonymous request to `assets/encoder.onnx` returns 401) |
| `ai4bharat/indicconformer_stt_hi_hybrid_ctc_rnnt_large` @ `deada84ce880997c56ee933aa21571d768264700` | MIT [M] | Gated, as above (anonymous request to the `.nemo` returns 401) |
| `addyo07/nemotron-3.5-0.6b-hinglish` @ `276471451a8214e690a4c7061ad14a3bd727bb3f` | Apache-2.0 on the card. Training-data licence unknown [M]. | Research-only: it can never ship because its data provenance is unknown. Its weights are `.nemo` and ONNX only, with no transformers checkpoint, so it would need a second runtime (NeMo) and a second venv. Deferred. |

**To run the four gated arms:** an owner account must accept the terms on each of the four Hugging Face pages and
create a read token.

Do **not** pass that token with `run.py --env`. `run.py` writes every `--env` value into the instance user-data and into
`run.json`, both in S3 and locally. The token would be stored in plain text.

The safe route is to put the token in a SecureString SSM parameter. The job then reads it with the instance role at run
time, which needs one IAM permission added to `taxila-gpu-worker`.

## 3. Runtime software (bench host)

- `torch 2.8.0+cu128`, `transformers 5.18.0`, Python 3.11.13 under uv. The full hash-locked set is
  `scripts/voice/stt-v3/requirements.lock`. The freeze from each run is in `pins/freeze.txt` of the run.
- AMI: Deep Learning OSS Nvidia Driver AMI GPU PyTorch 2.7 (Ubuntu 22.04) 20260427 (`ami-012ba162b9cd2729c`).
- GPU: NVIDIA L4 24 GB (g6.xlarge / g6.2xlarge, us-east-1).
