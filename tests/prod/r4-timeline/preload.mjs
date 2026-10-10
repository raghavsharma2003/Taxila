// r3-review local server/worker preload: Neon TEST branch only (never production), production's model routing.
import { readFileSync } from "node:fs";

const e = process.env;
e.AZURE_SPEECH_REGION ||= e.AZURE_SPEECH_REGION_SIN || e.AZURE_AI_CENTRALINDIA_REGION;
e.AZURE_SPEECH_KEY ||= e.AZURE_SPEECH_KEY_SIN || e.AZURE_AI_CENTRALINDIA_KEY;
e.TAXILA_DB = "test";
delete e.DATABASE_URL; delete e.DATABASE_URL_DIRECT; delete e.DATABASE_URL_SINGAPORE_OLD;
// r4-latency (main session, 2026-10-10): production's routing comes from its non-secret snapshot, tests/prod/prod-routing.env
// (prefetch ON, ACK_AT_MS 1200, the classify deployment and hedge, the STT model, ...). A variable already set wins, so a
// measurement arm (e.g. TAXILA_ACK_AT_MS=1000) is set explicitly on the command line and labelled in its run.
for (const line of readFileSync(new URL("../prod-routing.env", import.meta.url), "utf8").split("\n")) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
  if (m && !line.trimStart().startsWith("#")) e[m[1]] ||= m[2];
}
e.TAXILA_DUPLEX_LIVE_FOR ||= "r3review-owner@taxila.test,r3review-owner2@taxila.test";
