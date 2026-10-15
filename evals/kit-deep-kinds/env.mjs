// Imported FIRST by classify.mjs, before any server module: audit traffic stays off production and off every store.
// Run with: NODE_USE_ENV_PROXY=1 node --env-file=<.env.local> evals/kit-deep-kinds/classify.mjs --dir <work dir> < /dev/null
process.env.DATABASE_URL = "";
process.env.DATABASE_URL_DIRECT = "";
process.env.TEST_DATABASE_URL = "";
process.env.CONDUCTOR_TEST_DATABASE_URL = "";
process.env.DATABASE_URL_SINGAPORE_OLD = "";
process.env.TAXILA_DB = "";
process.env.TAXILA_TRACE = "off";
process.env.AZURE_STORAGE_ACCOUNT = "";
process.env.AZURE_STORAGE_KEY = "";
process.env.TAXILA_TRACE_BLOB_DIR = "";
process.env.TAXILA_OVERFLOW_DEPLOYMENTS = "";
// test traffic on the southindia (SIN) account, never production's eastus2 one
process.env.AZURE_OPENAI_ENDPOINT_CHAT = process.env.AZURE_OPENAI_ENDPOINT_SIN;
process.env.AZURE_OPENAI_API_KEY_CHAT = process.env.AZURE_OPENAI_API_KEY_SIN;
if (!process.env.AZURE_OPENAI_ENDPOINT_CHAT || !process.env.AZURE_OPENAI_API_KEY_CHAT) throw new Error("AZURE_OPENAI_ENDPOINT_SIN / AZURE_OPENAI_API_KEY_SIN missing");
