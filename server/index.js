// Assembles every route table into the router. Each route module exports `routes = { "METHOD /api/path": fn }`.
// Static imports on purpose: Vercel's bundler must see every module.
import { handle, register } from "./router.js";
import { routes as lesson } from "./routes/lesson.js";
import { routes as tts } from "./routes/tts.js";
import { routes as parent } from "./routes/parent.js";
import { routes as modules } from "./routes/modules.js";
import { routes as voice } from "./routes/voice.js";

register({ ...lesson, ...tts, ...parent, ...modules, ...voice });
export { handle, register };
