// Assembles every route table into the router. Each route module exports `routes = { "METHOD /api/path": fn }`.
// Static imports on purpose: Vercel's bundler must see every module.
// First: outbound keep-alive for every fetch below (server/net.js; a turn's model and database calls ride warm connections).
import "./net.js";
import { handle, register } from "./router.js";
import { routes as lesson } from "./routes/lesson.js";
import { routes as tts } from "./routes/tts.js";
import { routes as parent } from "./routes/parent.js";
import { routes as modules } from "./routes/modules.js";
import { routes as voice } from "./routes/voice.js";
import { routes as tutor } from "./routes/tutor.js";
import { routes as forge } from "./routes/forge.js";
import { routes as child } from "./routes/child.js";

register({ ...lesson, ...tts, ...parent, ...modules, ...voice, ...tutor, ...forge, ...child });
export { handle, register };
