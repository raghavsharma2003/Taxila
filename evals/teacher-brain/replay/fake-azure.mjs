// server/azure.js for the replay harness (see loader.mjs): every real export, with chat() replaced by a deterministic
// stub, so a turn's classification and reply are a pure function of the prompt. The stub reads the classify prompt the
// way a careful labeller would (the key in the child's reply → key; "pata nahi" → dont_know; else other_wrong), so the
// real Director walks realistic paths (correct, wrong, don't-know, why-probes, teach-back). Unknown schemas fail like
// an outage, which exercises the callers' fallbacks deterministically.
export * from "../../../server/azure.js?real";
import { AzureError } from "../../../server/azure.js?real";

const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}/]+/gu, " ").trim();

const REPLIES = [
  "Achha, dhyan se dekho. Isme kitne barabar hisse hain?",
  "Theek hai, ek baar phir socho. Tumhara jawab kya hai?",
  "Bahut accha socha. Ab batao, aage kya karenge?",
  "Chalo is tarah dekhte hain. Kya tum ek example de sakte ho?",
  "Okay, let us look again. What do you notice first?",
];

export const STATS = globalThis.__replayAzure ??= { calls: 0, bySchema: {}, byDeployment: {}, failed: 0 };

function classifyJson(schemaName, user) {
  const reply = norm(/CHILD'S REPLY: ([\s\S]*)$/.exec(user)?.[1] ?? "");
  const flags = { off_topic: /cricket|cartoon/.test(reply), distress: false, asks_for_answer: /bata do|tell me/.test(reply), wants_to_stop: /\bbye\b|jaana hai/.test(reply) };
  if (schemaName === "classify_teachback") {
    const n = reply.split(" ").length;
    return { covered: n > 8 ? ["e1", "e2"] : n > 4 ? ["e1"] : [], misconceptions: ["none"], confidence: 0.9, ...flags };
  }
  if (schemaName === "classify_none") return { belief: "none", ...flags };
  if (schemaName === "classify_why") {
    return { match: reply.split(" ").length >= 4 ? "key" : /pata/.test(reply) ? "dont_know" : "other_wrong", confidence: 0.85, ...flags };
  }
  const key = norm(/KEY: ([^;\n]*)/.exec(user)?.[1] ?? "");
  const also = (/also counts as key: ([^\n]*)/.exec(user)?.[1] ?? "").split(";").map(norm).filter(Boolean);
  const hit = [key, ...also].some((k) => k && (` ${reply} `).includes(` ${k} `));
  const match = hit ? "key" : /pata|nahi aata|don t know/.test(reply) ? "dont_know" : /cricket|pasand/.test(reply) ? "no_attempt" : "other_wrong";
  return { match, ...(/reason/.test(user) ? { reason: hit && /kyunki|because/.test(reply) ? "right" : "none" } : {}), confidence: 0.9, ...flags };
}

export async function chat(deployment, messages, opts = {}) {
  STATS.calls += 1;
  const name = opts.schema ? opts.schemaName || "result" : "text";
  STATS.bySchema[name] = (STATS.bySchema[name] ?? 0) + 1;
  STATS.byDeployment[deployment] = (STATS.byDeployment[deployment] ?? 0) + 1;
  // the failure drill (BUILD-PLAN W2-E): a deployment that is gone answers 404 at once
  if (process.env.REPLAY_KILL_DEPLOY && process.env.REPLAY_KILL_DEPLOY === deployment) {
    STATS.failed += 1;
    throw new AzureError(`chat ${deployment} HTTP 404: DeploymentNotFound (replay drill)`, 404, "");
  }
  // the hang drill: a deployment that accepts the call and never answers, until the caller's own timeout
  if (process.env.REPLAY_HANG_DEPLOY && process.env.REPLAY_HANG_DEPLOY === deployment) {
    STATS.hung = (STATS.hung ?? 0) + 1;
    await new Promise((r) => setTimeout(r, opts.timeoutMs ?? 7000));
    throw new AzureError(`chat ${deployment} timed out after ${opts.timeoutMs ?? 7000} ms (replay hang drill)`, 0, "timeout");
  }
  const user = String(messages.at(-1)?.content ?? "");
  if (opts.schema) {
    let json;
    if (/^classify_/.test(name)) json = classifyJson(name, user);
    else if (name === "distress") json = { distress: false };
    else throw new AzureError(`chat ${deployment} replay stub: no answer for schema ${name}`, 503);
    return { text: JSON.stringify(json), json, finishReason: "stop", usage: { prompt_tokens: 1, completion_tokens: 1 } };
  }
  const rewrite = messages.some((m) => m.role === "system" && /^Rewrite that turn/.test(String(m.content)));
  const h = fnv(JSON.stringify(messages.map((m) => [m.role, m.content])));
  const text = rewrite ? REPLIES[(h % 2) + 1] : REPLIES[h % REPLIES.length];
  return { text, finishReason: "stop", usage: { prompt_tokens: 1, completion_tokens: 1 } };
}
