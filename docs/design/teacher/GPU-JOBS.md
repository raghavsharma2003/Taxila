# GPU-JOBS.md: build-time GPU jobs on AWS (harness, safety limits, costs, the face3d job)

Date 2026-10-03. Decision `aws-build-gpu`: AWS runs **build-time** GPU work only (teacher-face reconstruction and
texture synthesis), on the owner's AWS credits, while Azure refuses GPU quota. The product's runtime compute and AI stay
Azure-only. Nothing in `scripts/gpu/` is called by the product. Tags: **[M]** measured here, **[U]** judgement or estimate.

## 1. Run a job

```
python3 scripts/gpu/status.py                                   # instances, spend, budget, quota requests
python3 scripts/gpu/run.py <job-dir> --dry-run                  # pack + resolve the AMI, launch nothing
python3 scripts/gpu/run.py <job-dir> --cpu                      # CPU test run (t3.small, Ubuntu 22.04 unless job.json says otherwise)
python3 scripts/gpu/run.py <job-dir>                            # GPU run: job.json gpuTypes, spot first, on-demand fallback
python3 scripts/gpu/run.py <job-dir> --env K=V --max-minutes 90 --types g6.2xlarge --on-demand
python3 scripts/gpu/reaper.py [--dry-run] [--all]               # terminate anything past its lifetime (--all: everything tagged)
```

Credentials come from the gitignored `.env.local` (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_DEFAULT_REGION=us-east-1`, `AWS_BUILD_BUCKET`). `.env.local` **overrides** the process environment, because this
container exports unrelated `AWS_*` keys of its own. That cost one failed call before it was found. The agent proxy's
CA bundle is set as `AWS_CA_BUNDLE` automatically.

**Job directory contract.** `run.sh` is required. It runs as root under bash with cwd = the unpacked job, and writes its
results under `$OUT`. `job.json` is optional and holds:

- `name`, `gpuTypes`, `cpuTypes`, `maxMinutes`, `diskGb`;
- `amiSsm` (pins an AMI family) or `amiId` (pins one image); `cpuAmi` (`ubuntu` | `dlami`);
- `include` (`{"dest/in/tar": "repo/path"}`, which packs repo inputs without copying them), `exclude` globs, and `env`.

The instance gets `JOB_ID`, `OUT`, `JOB_DIR`, `BUCKET`, `S3_PREFIX`, `AWS_DEFAULT_REGION`, `MAX_MINUTES` and
`DEADLINE_EPOCH`, plus the `env` block. Everything in `$OUT` comes back to `<job-dir>/runs/<job-id>/` (gitignored),
together with `log.txt` and `run.json` (timings, cost, launch attempts, final state). S3 keeps
`s3://$AWS_BUILD_BUCKET/jobs/<id>/{job.tar.gz, manifest.json, log.txt, status.json, outputs.tar.gz, run.json}`.

**How it works without SSH.**
1. `run.py` uploads the job tarball.
2. It writes user-data that carries presigned S3 URLs: a GET for the job, and PUTs for the log, the status and the
   outputs. Presigned URLs work on any AMI, with or without the aws CLI.
3. The instance runs the job and PUTs its log every 30 s. When the job ends, it uploads the outputs, writes `status.json`
   with phase `done`, and powers off. Outputs larger than 5 GB need the aws CLI, which is present on the DLAMI.
4. `run.py` polls S3 and EC2, streams the log, downloads the outputs and terminates the instance.

The presigned URLs carry the IAM user's access key **id**, never the secret. They are readable only from inside our own
instance, which has no inbound rules, and they can only write this job's own keys.

## 2. Safety limits (each one proven, 2026-10-03)

| # | limit | where | proof [M] |
|---|---|---|---|
| 1 | `shutdown -h +MAX` is the first line of user-data; `InstanceInitiatedShutdownBehavior=terminate` | instance | `selftest-hard`: the harness hung after the job, and the runner was SIGKILLed 2 s after launch. Launched 17:43:49; at 17:49:28 it was seen `shutting-down` with *Client.InstanceInitiatedShutdown* (max 5 min, timed from boot, polled every 15 s) |
| 2 | `run.sh` runs under `timeout` = MAX − 4 min, which leaves time for the upload and shutdown | instance | by construction |
| 3 | an EventBridge Scheduler one-shot calls `ec2:TerminateInstances` at deadline + 10 min. Its role (`taxila-gpu-reaper-scheduler`) may terminate only `taxila=gpu-build` instances. The schedule deletes itself after it fires | AWS, independent of the instance and of this container | `selftest-backstop`: the job cancelled its own `shutdown`, the harness hung, and the runner was SIGKILLed. The schedule was due at 17:58:46; the instance was seen terminating at 17:59:19 with *Client.UserInitiatedShutdown* (the API call). Both schedules were gone afterwards |
| 4 | `run.py` terminates on every exit path: done, error, lost instance, Ctrl-C, SIGTERM/SIGHUP. It ignores a second Ctrl-C while cleaning up and waits for `terminated` | this container | every run below ended `terminated`; the run record stores `finalState` |
| 5 | `reaper.py` terminates any tagged instance older than its `taxila-max-minutes` + 5 min, and deletes orphan schedules | anywhere with the keys | dry run and live run: 0 stray instances, 0 orphan schedules |
| 6 | security group `taxila-gpu-build-noinbound` has **no inbound rules** (any rule found is revoked at every launch); IMDSv2 only; root volume gp3 with DeleteOnTermination; default VPC | launch | `ensure_sg` |
| 7 | `HARD_MAX_MINUTES = 480` per request; AWS Budget `taxila-build-gpu` ($100/month, alerts at 50% and 90%) | `common.py`, AWS | the budget was read back by `status.py` |

The two self-tests stay in the tree as `scripts/gpu/jobs/selftest-{hard,backstop}`. Each runs on a t3.small for about
$0.001, and should be re-run after any change to the user-data template in `run.py`. To reproduce the "this container
died" case, kill the runner with `pkill -9 -f run.py`.

## 3. Costs

All runs on 2026-10-03 [M]. Costs are estimates: price × instance life (60 s minimum) + gp3 GB-seconds.

| run | instance | timings | cost |
|---|---|---|---|
| `hello` (harness proof) | i-0866dc5aa0b27c9fd, t3.small spot, us-east-1a | launch call 2.2 s; user-data started 24 s after launch; job 62 s; outputs back 0.1 s after `done`; `terminated` 18 s after its own shutdown; instance life 105 s; wall 111 s | **$0.0002** |
| `selftest-hard` | i-0d00711239459f2dd, t3.small spot | about 5.6 min life (the limit under test) | ~$0.0007 |
| `selftest-backstop` | i-0fa19ee95125a01ab, t3.small spot | about 15.5 min life (deadline + 10 min grace) | ~$0.002 |
| `face3d` smoke 1 | i-05102414c27e44f3e, c6i.2xlarge spot, us-east-1b (1a: InsufficientInstanceCapacity, so the harness fell back) | failed in 189 s: the hashed locks did not carry the PyTorch index (fixed) | ~$0.01 |
| `face3d` smoke 2 (`FACE3D_SMOKE=1`) | i-0ccb11bea9114c3b7, c6i.2xlarge spot, us-east-1a | instance life 662 s; job 601 s: both venvs 4.5 min, Hunyuan clone + CUDA extensions, 61 weight files / ~25 GB verified in 500 s (from origin; 13 already in the S3 cache), imports 1.7 min | **$0.030** |
| `face3d` GPU 1 | i-04a86a5be7d539232, g6.2xlarge spot, us-east-1a | job 1083 s: setup 6 min, 3 shapes, scoring done; then **failed at paint**: `torchvision_fix` was not on `sys.path` from `face3d.py`, so basicsr's import broke (fixed; the smoke now imports through `face3d.py` itself); instance life 1453 s | **$0.387** |
| `face3d` GPU 2 (teal, complete) | i-0ddad9592b99d93e3, **g6.2xlarge on-demand**, us-east-1c. Spot was refused (MaxSpotInstanceCountExceeded: the previous spot instance, still shutting-down, held the spot quota); g6e.xlarge had no spot capacity in any AZ; on-demand g6.2xlarge had no capacity in 1a or 1b. 377 s of launch attempts | run.sh 1541 s (stages in §5.4); outputs 83 MB, 96 files; instance life 1909 s | **$0.530** |
| `gpuproof` 1 | none: g6.xlarge spot had no capacity in 1a, 1b, 1c, 1d or 1f (1e unsupported), and on-demand was VcpuLimitExceeded while face3d held all 8 vCPU | `not-launched`, nothing billed | $0 |
| `gpuproof` 2 (coordinator's GPU harness proof) | i-0aa341d204cfb05b2, **g6.xlarge spot**, us-east-1d (after capacity failures in 1a, 1b and 1c; 170 s of launch attempts) | user-data 41 s after launch; job 55 s: `nvidia-smi` showed an NVIDIA L4 (23.7 GB), DLAMI torch 2.7.0+cu128, fp16 8192² matmul **57.7 TFLOPS**, fp32 max error vs CPU 2.5e-5; `terminated` confirmed at 19:39 | **$0.069** |

**Session total: est. $1.04, of which GPU $0.99** [M, `status.py` ledger]. All 6 launched instances are `terminated`,
and the reaper removed the 3 leftover backstop schedules. **GPU instances stay `shutting-down` for 6-7 min** [M].
EC2 does not bill in that state, so the ledger's lives (LaunchTime → the runner's last check) slightly overstate. `run.py`
now waits up to 12 min for `terminated`, and keeps the backstop schedule if the instance never gets there.
**Spot capacity for g6 in us-east-1 was scarce all evening** [M]. Each `InsufficientInstanceCapacity` takes 40-70 s to
come back, so walking every AZ costs up to ~6 min before the on-demand fallback starts.

Prices from the Pricing API and the spot history, us-east-1, 2026-10-03 [M], USD/h:

| type | GPU | on-demand | spot |
|---|---|---|---|
| g6.2xlarge | L4 24 GB, 8 vCPU, 32 GB RAM | 0.978 | 0.87-0.94 |
| g5.2xlarge | A10G 24 GB, 8 vCPU, 32 GB RAM | 1.212 | 0.73-1.01 |
| g6e.xlarge | L40S 48 GB, 4 vCPU, 32 GB RAM | 1.861 | 1.84 |
| g6.xlarge | L4 24 GB, 4 vCPU, **16 GB RAM** | 0.805 | 0.57-0.60 |

g6.xlarge and g5.xlarge are not in the face3d list. Their 16 GB of RAM is too tight for a 7.4 GB DiT checkpoint plus
the paint models [U].

The S3 weight cache (`cache/weights/<sha256>`, 14 objects, 24.0 GB [M]) costs about $0.55/month. Delete it with
`aws s3 rm --recursive s3://$AWS_BUILD_BUCKET/cache/` if it is not wanted. Without it, every run pulls ~25 GB from
Hugging Face (about 8 min [M]).

## 4. Quota (us-east-1), at the end of this session

`status.py`, 19:39 UTC 2026-10-03 [M]. All four requests are CASE_CLOSED and granted:
- **Running On-Demand G and VT** (L-DB2E81BA): **8** (was 0)
- **All G and VT Spot** (L-3819A6DF): **8** (was 0). The API showed 0 for a while after the case closed, but a spot
  launch already succeeded at 18:24
- **Running On-Demand Standard** (L-1216C47A): **16** (was 5)
- **All Standard Spot** (L-34B43A08): 32

8 vCPU of each allows one 8-vCPU GPU instance (g6.2xlarge / g5.2xlarge) or two 4-vCPU ones, per market. A
shutting-down instance still counts against its market's quota [M: run 2's spot refusal].

## 5. The face3d job (`scripts/gpu/jobs/face3d/`): run for real on teal

**Purpose.** Replace the CPU fallback's identity input. That fallback was an orthographic bundle adjustment of MediaPipe
landmarks over 2D portraits. Its known weakness is depth: the 3/4 lower face reads too long, and the profile could not
be used (ai-portrait-wrap §Likeness). The job swaps it for a reconstructed 3D head, plus de-lit per-portrait albedo,
consumed by the existing wrap and projection steps.

### 5.1 Model choice and licence evidence

Every licence text below was fetched from its primary source this session and hashed. `sha256[:12]` refers to the
fetched text.

| component | role | licence (evidence) | verdict |
|---|---|---|---|
| **Hunyuan3D-2.1** (Tencent), repo commit `82920d64`, weights `tencent/Hunyuan3D-2.1@0b946776` | image → 3D shape (DiT flow matching, 512³ octree), then PBR texture (multiview diffusion) | Tencent Hunyuan 3D 2.1 Community Licence (`LICENSE`, `b79ac5e11ce0`):<br>- **Territory** = worldwide excluding the EU, UK and South Korea, so India, and the build in us-east-1, are inside it;<br>- §4: a separate Tencent licence is needed only if MAU exceeded **1 M on the release date (2025-06-13)**. Taxila had none;<br>- §6.d: Tencent claims no rights in Outputs;<br>- §5.b: Outputs must not be used to improve another AI model;<br>- §3.e: a provider disclosure applies only if the Works themselves are deployed to provide a service. We ship outputs (a mesh and textures), not the model;<br>- AUP 6: never to harm minors, which our use does not do.<br>Its Notice lists Stable Diffusion (CreativeML Open RAIL++-M) and HunyuanDiT. No nvdiffrast, kaolin or Inria code is imported (grep of the pinned tree) | **USE**. Keep `LICENSE`/`Notice.txt` with the build records (the job copies both to `pins/`). Re-check §4 if the owner's group ever passes 1 M MAU before a re-licence |
| facebook/dinov2-giant `@611a9d42` | Hunyuan paint image encoder | Apache-2.0 (model card) | USE |
| Real-ESRGAN x4plus (`RealESRGAN_x4plus.pth`, sha256 `4fa0d389…`) + `realesrgan==0.3.0` + `basicsr==1.4.2` | Hunyuan paint's view super-resolution | BSD-3-Clause (`4a699ec4863d`); basicsr Apache-2.0. `realesrgan` pulls in `gfpgan` (Apache-2.0) and `facexlib` (MIT) as package dependencies; neither is called | USE |
| rembg 2.0.65 + U-2-Net `u2net.onnx` (sha256 `8d10d2f3…`) | portrait matting before shape | rembg MIT; U-2-Net Apache-2.0 | USE |
| **Marigold-IID appearance v1-1** `@e7280a0a`, **Marigold-Normals v1-1** `@09cfdd25` (prs-eth), via diffusers 0.33.1 | de-lit albedo / roughness / metallicity, and normals, per portrait | weights: CreativeML **Open RAIL++-M** (model cards: `license: openrail++`). This allows commercial use under use-based restrictions (Attachment A, which includes no harm to minors). Code: Apache-2.0 (`0cec06e0e55f`) | USE. This is the "texture synthesis" step: it replaces project.py's low-pass de-light, which left baked lip-line shading (defect 5) |
| MediaPipe Face Landmarker float16 v1 (sha256 `64184e22…`), `mediapipe==0.10.21` | landmarks on renders of the reconstructed head (the lift) | Apache-2.0 (already pinned by the pipeline) | USE |
| Open3D 0.18 (MIT), trimesh (MIT), xatlas (MIT), pymeshlab (GPL-3, used as a build tool only, not shipped) | ray casting, I/O, UV unwrap, remesh | as listed | USE |
| TRELLIS (MIT, `c2cfccb812fe`) | candidate | the code is MIT, but its GLB export (`postprocessing_utils.to_glb`) bakes textures with **nvdiffrast** (NVIDIA Source Code Licence §3.3, "non-commercially … research or evaluation purposes only", `ce20436c2730`) and renders through **diff-gaussian-rasterization** (Inria/MPII, "THE USER CANNOT USE … FOR COMMERCIAL PURPOSES", `cd5c95b3cfff`) | **REJECT** for the textured path. Shape-only through FlexiCubes (Apache-2.0) would be clean, but it would need its own exporter, and TRELLIS's 64³ structured latent has less face detail [U] |
| TRELLIS.2 (MIT, `d9a1b1e30d63`, 2026-06 commit `75fbf018`) | candidate | `o_voxel.postprocess.to_glb` and its texturing pipeline import **nvdiffrast** (non-commercial). Its DINOv3 encoder is under Meta's gated DINOv3 licence | **REJECT** until the export avoids nvdiffrast |
| TripoSR (MIT, `ade0a66629bd`) | candidate | licence fine | not chosen: single image at 256³, less face detail than the landmark fit (ai-portrait-wrap) [U] |
| Face-specific reconstruction | candidate | DECA, EMOCA, SMIRK, RingNet and Pixel3DMM sit on **FLAME** (non-commercial). Deep3DFaceRecon and 3DDFA need **BFM** (non-commercial) plus nvdiffrast. FaceLift: code Apache-2.0, but **weights under the Adobe Research Licence** (non-commercial). VRN: MIT code, but trained on BFM-derived 300W-LP. Sapiens normals: CC-BY-NC-4.0. CodeFormer: S-Lab Licence (non-commercial, `cfd654022bdc`) | **none qualifies.** The face-specific part stays MediaPipe (Apache-2.0) landmarks on the reconstructed surface, plus our own wrap |
| Hunyuan3D-2.0 / 2mv | candidate (multi-view) | 2.0 Community Licence: same territory and MAU terms | not needed now. 2mv could take our front/side views directly, so it is the next candidate if single-image depth is not good enough |

Stable Diffusion 2.1's own Hugging Face repo is gone (it answers *Invalid username or password*). Hunyuan paint does
not need it at inference: its pipeline is self-contained in `hunyuan3d-paintpbr-v2-1`.

### 5.2 Stages

`run.sh` writes each stage's epoch to `$OUT/stages.txt`.

1. machine (`nvidia-smi`, IMDS, `nvcc`);
2. weights in the background (`fetch_weights.py`: every LFS file sha256-checked and every small file git-blob-oid
   checked, served from the S3 cache when present), while the toolchain builds: uv 0.12.23 (hash-pinned), CPython
   3.10.22, two venvs from **hashed** locks (`req-hy.lock`, 167 pins; `req-mg.lock`, 129 pins; `--require-hashes`),
   the Hunyuan checkout at the pinned commit, and its CUDA rasteriser and inpaint extension (`TORCH_CUDA_ARCH_LIST=8.6;8.9`);
3. `matte` (rembg) on front, q3_left, q3_right;
4. `shape`: Hunyuan3D-2.1 on the front portrait. Seeds 0,1,2; octree 512; 50 steps; guidance 5.0. Floater and
   degenerate faces are removed; the raw high-res mesh is kept;
5. `score` (`lift.py`): each seed is rendered (Open3D ray cast, key light, Y-up), MediaPipe runs on the render, and the
   **front NME against the portrait** uses likeness.py's metric. Best = interior + 0.25 × contour. The front direction is
   searched for, not assumed, and a mirrored back-face view is rejected (front-facing hit fraction ≥ 0.6);
6. `paint`: Hunyuan PBR paint of the best seed (6 views, 512, Real-ESRGAN), front reference → `head.glb` + maps;
7. `delight` (Marigold): albedo / roughness / metallicity / normal per portrait view. The portrait's pixel grid is kept,
   so its existing landmarks still apply;
8. `final` lift: `recon.gpu.json`, `target.npz`, and views at yaw 0 / ±45 / ±90 with landmarks.

**Outputs** (`runs/<id>/`):
- `head.glb` (textured), `head_shape.ply` (the chosen raw shape), `maps/` (albedo, metallic and roughness textures);
- `recon.gpu.json` and `target.npz`;
- `refs_delit/` and `views/`;
- `likeness.json` (per-seed scores), `face3d.json` (manifest), `report-*.json`;
- `pins/`: GPU, AMI, nvcc, both `pip freeze`s, the Hunyuan commit, its LICENSE and Notice, the weights lock, the fetch report.

### 5.3 Readiness [M unless marked]

- **Proven on the real AMI** (CPU smoke, `FACE3D_SMOKE=1`, DLAMI `ami-012ba162b9cd2729c`, PyTorch 2.7 Ubuntu 22.04
  family): both hashed locks install; the Hunyuan checkout and both compiled extensions import; `hy3dshape.pipelines`
  and `textureGenPipeline` import with the `bpy` stub; diffusers' Marigold pipelines, mediapipe and open3d import;
  all 61 weight files verified.
- **`lift.py` proven locally** on a synthetic textured relief built from the real teal front portrait and its CPU
  recon depths:
  - crop retries find the face, and the guard rejects the mirrored back view;
  - the 3D landmarks come back in recon.json's frame. Against the CPU recon they give a proper rotation (det +1, 6.6°,
    matching the refined azimuth) and a depth correlation of 0.93;
  - this is a plumbing test, not a quality number.
- **Run end to end on a GPU**: run `face3d-20261003-184935-92c5` on a g6.2xlarge (L4). Results are in §5.6.
- The A10G (g5) path is untested. `TORCH_CUDA_ARCH_LIST` includes 8.6.

### 5.4 GPU hours [M, run face3d-20261003-184935-92c5, g6.2xlarge L4, one run]

| stage | seconds |
|---|---|
| toolchain: uv, Python, both hashed venvs | 234 |
| Hunyuan clone + CUDA extensions, waiting on the weights (343 s; 16 of 61 files from the S3 cache) | 116 |
| matte (3 views, rembg) | 70 |
| shape: 3 seeds at octree 512, 50 steps (190-200 s per seed; 0.8-1.4 M vertices) | 635 |
| score: 4 candidates, Open3D + MediaPipe | 36 |
| paint: PBR, 6 views at 512 (remesh to 40 k faces; peak VRAM 14.5 GB) | 226 |
| Marigold IID + normals on 8 views (about 4 s per model per view after load) | 204 |
| lift (recon.gpu.json, target.npz, views) | 19 |
| **run.sh total** | **1541 (25.7 min)**; instance life 31.8 min, $0.53 on-demand |

Per look ≈ 0.5 GPU-h ≈ $0.50. Two seeds would save ~3 min. `maxMinutes` 120 leaves 4× headroom. Slate and plum,
plus one re-run each: about 2 GPU-h, ~$2.

### 5.5 Running it and using the result

```
python3 scripts/gpu/status.py                                   # quota: G/VT 8 on-demand + 8 spot (granted)
python3 scripts/gpu/run.py scripts/gpu/jobs/face3d              # teal; ~30 min
TAXILA_IDENTITY_TARGET=scripts/gpu/jobs/face3d/runs/<job-id> node scripts/character/bakeoff/merged/build.mjs --looks teal
```

The flag lives in `scripts/character/bakeoff/merged/identity/gpu_target.py`, with one hook line each in `wrap.py` and
`project.py`. **Unset, both hooks return their input unchanged.** A standalone test showed the flag-off wrap identical to
the pre-hook function (max difference 0.0 m).

Set, the flag does four things:
- with `TAXILA_GPU_LANDMARKS=gpu` only: `recon` becomes `recon.gpu.json`, and the fit-loop and profile corrections are
  dropped, because they were fitted to the old recon. Re-run fitloop.py and profilefit.py on the new basis;
  `TAXILA_GPU_KEEP_CORRECTIONS=1` keeps them;
- a dense shrink term moves each face vertex along its normal toward `target.npz`. It is clamped (3 mm), smoothed over
  6 mm, cleared around the eye and lip openings, and symmetrised on the topological mirror. A synthetic 2 mm offset
  test recovered +2.00 mm, mirror-exact. Turn it off with `TAXILA_GPU_DENSE=0`;
- `TAXILA_GPU_LANDMARKS=cpu` (**default**) keeps the CPU landmark recon and the corrections. The GPU surface is
  brought into the CPU recon's frame by a 468-landmark similarity, and only the dense term uses it. `=gpu` swaps the
  landmark target, with the consequences above. A synthetic test with the GPU frame rotated 20°, scaled 3× and
  shifted recovered +2.00 mm in both modes;
- texture: `TAXILA_GPU_TEXTURE=raw` (**default**: the portraits, unchanged). `delit` (Marigold albedo) and
  `delit+views` (also the GPU renders at weight 0.3) are experimental; see §5.6.

**Bars the result must clear** before it replaces the CPU recon (VERDICT.md):
- front NME ≤ 1.2% (now 0.96%);
- yaw-24 NME at most 1.5× the front value (the GPU target exists for this);
- G1-G6, G9, budgets, and the emotion re-score at ≥ 70% on n ≥ 12.

Reversal: if the GPU target fails the yaw-24 bar, or costs front likeness, the CPU recon stays and the flag stays off.

### 5.6 What the first real teal run showed

Run `face3d-20261003-184935-92c5`, one look, [M] unless marked.

- **Shape: good.** The Hunyuan3D-2.1 bust from the front portrait is a recognisable likeness: front-facing, Y-up, with
  ears, hair mass and the kurta neckline. Front interior NME of the untextured render against the portrait, by
  likeness.py's metric:
  - bust matte: seeds 0 / 1 / 2 = 2.56 / **1.52** / 2.23 %;
  - head-crop matte: 2.78 / 1.97 / no face found.

  So the **bust matte wins** and is the default (`FACE3D_CROP=none`). The unwrapped MakeHuman teal is at 2.03 %; the
  CPU wrap, fitted to this view, reaches 0.96 %.
- **Landmark target: the CPU recon is better at landmark level.** Each 3D landmark set was fitted with its best
  orthographic camera to each portrait's MediaPipe landmarks (interior; visible half on turned views), and the mean
  reprojection error taken in % IOD:

  | view | CPU recon | GPU (bust s1) |
  |---|---|---|
  | front | 0.62 | 1.48 |
  | q3 | 0.65-0.91 | 1.31-1.64 |
  | **held out:** q45 L/R | 1.03 / 1.29 | 1.65 / 2.01 |
  | **held out:** profile90 L/R | 1.86 / 2.43 | 2.50 / 2.66 |

  The metric favours the CPU recon, which was solved from the same photo detections, and the GPU set also carries
  MediaPipe-on-CG-render noise. But the GPU set wins **no** view, held-out views included. Hence
  `TAXILA_GPU_LANDMARKS=cpu` by default: the GPU mesh feeds only the dense term (cheeks, jaw, forehead, silhouette:
  what 468 landmarks do not constrain). Whether that dense term moves the yaw-24 NME bar is **not measured yet**. It
  needs a merged build with the flag set.
- The image generator's "q45" views measure 16-26° yaw, and its "profile90" views 56-63° [M, from the camera fits].
  The references are less turned than their names say.
- **Hunyuan paint: usable as a preview only** [U, by eye]. Recognisable, but the eyes and brows look painted on and the
  under-eyes are too dark. Not used as a texture source.
- **Marigold-IID albedo: not a drop-in projection source** [U, by eye, one look]. It flattens the skin to a uniform
  pastel, loses the skin detail, and turns the lips purple. Its means are cool (profile90 RGB ≈ 163/174/175). Hence
  `TAXILA_GPU_TEXTURE=raw` by default. Its normals and roughness maps are unexamined, and are the likelier use.

## 6. Open items

- Build merged teal with `TAXILA_IDENTITY_TARGET=scripts/gpu/jobs/face3d/runs/face3d-20261003-184935-92c5` (dense term,
  CPU landmarks), then measure front NME, yaw-24 NME, G1-G6 and G9 against the current merged teal. This is the only
  test of whether the GPU surface earns its place.
- If the dense term does not help, try Hunyuan3D-2mv (same licence family) with the front and side references as
  multi-view input, before giving up on GPU geometry.
- `art/character/LICENSES.md` should gain the §5.1 rows when a GPU output is first used in a shipped asset. Not edited
  here: no GPU output is used in a shipped asset yet, and this change stays additive.
- A likeness / reverse-image review per generated identity is still owed before any child sees her (VERDICT licence row).
  Reconstruction does not change it.
