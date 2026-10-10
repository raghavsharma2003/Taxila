// r3-review local server/worker preload: Neon TEST branch only (never production), production's model routing.
const e = process.env;
e.AZURE_SPEECH_REGION ||= e.AZURE_SPEECH_REGION_SIN || e.AZURE_AI_CENTRALINDIA_REGION;
e.AZURE_SPEECH_KEY ||= e.AZURE_SPEECH_KEY_SIN || e.AZURE_AI_CENTRALINDIA_KEY;
e.TAXILA_DB = "test";
delete e.DATABASE_URL; delete e.DATABASE_URL_DIRECT; delete e.DATABASE_URL_SINGAPORE_OLD;
e.DEPLOY_CLASSIFY ||= "grok-4-1-fast-non-reasoning";
e.TAXILA_CLASSIFY_HEDGE_MS ||= "1500";
e.TAXILA_TURN_PREFETCH ||= "off";
e.TAXILA_DUPLEX ||= "shadow";
e.TAXILA_DUPLEX_LIVE_FOR ||= "r3review-owner@taxila.test,r3review-owner2@taxila.test";
