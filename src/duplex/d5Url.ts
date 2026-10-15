// The D5 stereo worklet's module URL (Vite emits d5Worklet.ts as its own asset). Its own module, so cascadeLink.ts can
// import it lazily and Node tests can load the link without Vite's `?worker&url` handling.
import url from "./d5Worklet.ts?worker&url";
export default url;
