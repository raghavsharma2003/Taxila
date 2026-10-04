# Fetch first: curl -L -o .work/models/smart-turn-v3.2-cpu.onnx https://huggingface.co/pipecat-ai/smart-turn-v3/resolve/main/smart-turn-v3.2-cpu.onnx (and -gpu.onnx); sha256 in RESEARCH-PLACEMENT.md
# Graph surgery on Smart Turn v3.2: expose the encoder's frame sequence (layer_norm_8, [B, 400, 384]) and its
# attention-pooled embedding (sum_1, [B, 384]) as extra outputs, so ONE encoder pass can feed the end-of-turn head
# (unchanged) and a knowledge-state head. Adding outputs adds no compute; this checks that and the logits match.
import onnx, os, numpy as np, onnxruntime as ort
D = os.path.join(os.environ.get("VS_WORK", os.path.join(os.path.dirname(os.path.abspath(__file__)), ".work")), "models")
for src, dst in [("smart-turn-v3.2-cpu.onnx", "smart-turn-v3.2-cpu.shared.onnx"), ("smart-turn-v3.2-gpu.onnx", "smart-turn-v3.2-gpu.shared.onnx")]:
    m = onnx.load(os.path.join(D, src))
    names = {o for n in m.graph.node for o in n.output}
    # In the int8 graph the fp32 tensors keep their names unless a QDQ pair wraps them; find candidates by suffix.
    want = [t for t in ("layer_norm_8", "sum_1") if t in names]
    for t in want:
        m.graph.output.append(onnx.helper.make_tensor_value_info(t, onnx.TensorProto.FLOAT, None))
    onnx.save(m, os.path.join(D, dst))
    x = np.random.RandomState(0).randn(1, 80, 800).astype(np.float32)
    a = ort.InferenceSession(os.path.join(D, src)).run(None, {"input_features": x})[0]
    b = ort.InferenceSession(os.path.join(D, dst)).run(None, {"input_features": x})
    print(dst, "exposed", want, "logit diff", float(np.abs(a - b[0]).max()), "shapes", [o.shape for o in b])
