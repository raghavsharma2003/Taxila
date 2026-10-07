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
// ship5 p2-face: the face's runtime kill switches (GET /api/face/config). One-line seam; the route lives in p2-face's module.
import { routes as face } from "./face-puppet/config.js";
// ship5 p1-duplex: the hands-free duplex kill switch (GET /api/duplex/config). One-line seam; the route lives in server/duplex.
import { duplexConfigRoutes as duplex } from "./duplex/config.js";
// duplex-real (round 2): the duplex engine's content-blind shadow summaries (POST /api/duplex/shadow → one stdout line).
import { duplexShadowRoutes as duplexShadow } from "./duplex/shadowLog.js";
// ship5 p3-voicesig: the client kill switch and the status page's per-state table (GET /api/voicesig/config|status).
import { routes as voicesig } from "./voicesig/routes.js";
// Round 2 latency: POST /api/lesson/turn-prefetch (the device's stable partial starts the turn's perceive stage). One line.
import { routes as latency } from "./latency/routes.js";

register({ ...lesson, ...tts, ...parent, ...modules, ...voice, ...tutor, ...forge, ...child, ...testClock, ...studio, ...voicesig, ...duplex, ...duplexShadow, ...face, ...latency, ...lane });
export { handle, register };
