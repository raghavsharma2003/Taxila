import { chat } from "/home/user/Taxila/server/azure.js";
import { systemPrompt, stateMessage, TURN_SCHEMA } from "/home/user/Taxila/server/agent/prompt.js";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
const kit = kitFromFile(getTopic("c4-maths-ch05-t01")) ?? kitFromFile(getTopic("c1-maths-ch01-t02"));
const state = { turn: 3, phase: "teach", ctx: { firstName: "Riya", classLevel: 4, lang: "hinglish" }, itemsDone: [], skipped: [] };
const msgs = [{ role: "system", content: systemPrompt(state.ctx) }, { role: "user", content: stateMessage({ state, kit, event: 'the child said (speech recognition confidence 0.91): "mujhe samajh nahi aaya, phir se batao"', onScreen: [], lane: "voice" }) }];
for (const effort of ["low"]) {
  const ms = [];
  for (let i = 0; i < 8; i++) { const t = Date.now(); try { const r = await chat("taxila-gpt6", msgs, { schema: TURN_SCHEMA, schemaName: "teacher_turn", effort, maxTokens: 1200, timeoutMs: 15000, retries: 0, quotaLane: "hot" }); ms.push(Date.now() - t); if (i === 0) console.log(effort, r.json?.say); } catch (e) { ms.push(`err ${e.message.slice(0, 40)}`); } }
  console.log(effort, JSON.stringify(ms));
}
