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
// W1-C: the test clock (GET/POST /api/test/clock; @taxila.test accounts only). Seam applied by W1-D, owner of this file.
import { routes as testClock } from "./comprehension/testclock.js";
// W2-D: the mid-sitting realtime → cascade lane switch (POST /api/lesson/lane). One-line seam; the route lives in W2-D's module.
import { routes as lane } from "./voice/realtimeSession.js";
// W2-H: the Studio channel (SSE stream, slot, build, host-graded answers, the Made for you feed). One-line seam; the routes
// live in W2-H's module.
import { routes as studio } from "./routes/studio.js";

register({ ...lesson, ...tts, ...parent, ...modules, ...voice, ...tutor, ...forge, ...child, ...testClock, ...lane, ...studio });
export { handle, register };
