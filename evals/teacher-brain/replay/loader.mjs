// ESM resolve hook for the turn replay harness (BUILD-PLAN W2-E acceptance "30 recorded lessons replay byte-identical
// through server/brain/turn.js"). It swaps exactly two modules for in-memory fakes, so the REAL turn code runs with no
// database and no network:
//   server/db.js     → fake-db.mjs    (an in-memory lesson/child row and a transaction recorder)
//   server/azure.js  → fake-azure.mjs (every real export, with chat() replaced by a deterministic stub)
// fake-azure imports the real module with a `?real` query, which this hook lets through untouched.
const FAKES = {
  "/server/db.js": new URL("./fake-db.mjs", import.meta.url).href,
  "/server/azure.js": new URL("./fake-azure.mjs", import.meta.url).href,
};

export async function resolve(specifier, context, next) {
  const r = await next(specifier, context);
  if (r.url.includes("?real")) return r;
  for (const [suffix, fake] of Object.entries(FAKES)) {
    if (r.url.endsWith(suffix) && !context.parentURL?.startsWith(fake)) return { ...r, url: fake, shortCircuit: true };
  }
  return r;
}
