// One run of the voicesig consent backstop (server/voicesig/lesson.js sweep): delete every stored answering-pace subject
// whose child's latest voice_pace_memory consent is not a grant. The worker's ticker leader runs the same function every
// 6 h (docs/design/ship5/p3-voicesig/patches/11-worker-consent-sweep.diff); this script is for an operator or an ACA job.
//   DATABASE_URL=... node scripts/voicesig/sweep.mjs        (prints the number deleted; exit 1 if it could not run)
import { q } from "../../server/db.js";
import { sweep } from "../../server/voicesig/lesson.js";

if (!process.env.DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
const n = await sweep(q);
console.log(n < 0 ? "voicesig sweep: could not run (see warning)" : `voicesig sweep: ${n} subject(s) deleted`);
process.exit(n < 0 ? 1 : 0);
