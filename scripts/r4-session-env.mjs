// Round 4 parallel sessions: write this container's gitignored .env.local from the stream's own Neon TEST branch.
// The main session stashed the stream's least-privilege keys in table _r4_session_env on that branch, so no key is
// ever pasted into a prompt or committed. Prints key NAMES only, never values.
//   NODE_USE_ENV_PROXY=1 node scripts/r4-session-env.mjs '<your branch DATABASE_URL>'
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.argv[2] || process.env.R4_BRANCH_URL;
if (!url) throw new Error("usage: node scripts/r4-session-env.mjs '<branch url>'");
const host = new URL(url).hostname;
// The production compute. A stream session never connects to it.
if (host.startsWith("ep-jolly-resonance-")) throw new Error("refusing: that is the production database");

const rows = await neon(url).query("select k, v from _r4_session_env order by k");
if (!rows.length) throw new Error("no keys stashed on this branch; ask the main session");
const env = { DATABASE_URL: url, TEST_DATABASE_URL: url, CONDUCTOR_TEST_DATABASE_URL: url };
for (const { k, v } of rows) env[k] = v;

const file = new URL("../.env.local", import.meta.url);
if (existsSync(file) && !process.argv.includes("--force")) {
  const have = readFileSync(file, "utf8");
  if (have.trim()) throw new Error(".env.local already exists; re-run with --force to overwrite");
}
const quote = (v) => (/^[A-Za-z0-9_./:@?&=%+-]*$/.test(v) ? v : JSON.stringify(v));
writeFileSync(file, Object.entries(env).map(([k, v]) => `${k}=${quote(v)}`).join("\n") + "\n", { mode: 0o600 });
console.log(`.env.local written (${Object.keys(env).length} names): ${Object.keys(env).join(" ")}`);
