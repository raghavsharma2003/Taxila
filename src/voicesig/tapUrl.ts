// The shared tap's worklet module URL (Vite emits tapWorklet.ts as its own asset). Kept in its own module so lessonTap.ts
// can import it lazily: Node tests load lessonTap.ts without Vite's `?worker&url` handling.
import url from "./frontend/tapWorklet.ts?worker&url";
export default url;
