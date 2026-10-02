import { WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, AmbientLight } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
const r = new WebGLRenderer(); const s = new Scene(); const c = new PerspectiveCamera();
s.add(new DirectionalLight(), new AmbientLight());
const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder); l.load("a.glb", g => s.add(g.scene)); r.render(s, c);
