// Shared ARM helper (same pattern as evals/build-plan/deployments.mjs). Prints no secrets.
const { AZURE_TENANT_ID: t, AZURE_SP_CLIENT_ID: c, AZURE_SP_SECRET: s, AZURE_SUBSCRIPTION_ID: sub, AZURE_RESOURCE_GROUP: rg } = process.env;
let tokCache = {};
export async function token(scope = "https://management.azure.com/.default") {
  if (tokCache[scope]) return tokCache[scope];
  const j = await (await fetch(`https://login.microsoftonline.com/${t}/oauth2/v2.0/token`, { method: "POST",
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: c, client_secret: s, scope }) })).json();
  if (!j.access_token) throw new Error("token failed: " + (j.error || "?"));
  return (tokCache[scope] = j.access_token);
}
export async function arm(method, path, body) {
  const r = await fetch(path.startsWith("http") ? path : `https://management.azure.com${path}`, { method,
    headers: { authorization: `Bearer ${await token()}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = { raw: txt.slice(0, 500) }; }
  return { status: r.status, body: j, headers: r.headers };
}
export const SUB = sub, RG = rg;
export const ACCT = "raghavsharma1729-compan-resource";
export const ACCT_ID = `/subscriptions/${sub}/resourceGroups/${rg}/providers/Microsoft.CognitiveServices/accounts/${ACCT}`;
