// r5 blind panel: REF (c-front), the labelled frames sheet, and one full-size turn frame; no builder notes.
//   node judge-blind.mjs <dir> <model> > out.json
import fs from "node:fs";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const [S, model = "taxila-brain"] = process.argv.slice(2);
const b = (f) => ({ type: "image_url", image_url: { url: "data:image/jpeg;base64," + fs.readFileSync(S + "/" + f).toString("base64"), detail: "high" } });
const P = `You are a harsh art director for a premium children's learning app, judging against the standard of a top studio 2D puppet (Duolingo's Lily, a professional VTuber rig). REF is the approved concept of a cartoon teacher (soft Memoji-style 3D cartoon). SHEET is a labelled sheet of frames rendered by an animated 2D puppet meant to be the SAME character (first cell is REF itself). FULL is one frame at full size (head turned). Judge: same character? premium enough to ship (owner's bar: side by side with REF a person says "that is her, animated, premium")? Look hard at full size for seams, creases, warps and uncanny frames. Score 1-5 strictly, decimals allowed, never round up (4 = ship it, 4.5 = premium-studio polish, 5 = indistinguishable from a top studio puppet, 3 = recognisable but not shippable). Reply JSON only: {"same":bool,"score":n,"per_frame_issues":{"label":"issue"},"top_defects":["5 most damaging, with frame and location"],"top_fix":"..."}`;
const body = { model, max_completion_tokens: 12000, response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: P }, { type: "text", text: "REF:" }, b("ref.jpg"), { type: "text", text: "SHEET:" }, b("sheet.jpg"), { type: "text", text: "FULL:" }, b("turn_full.jpg")] }] };
if (/brain|gpt/.test(model)) body.reasoning_effort = "medium";
const r = await fetch(E + "/chat/completions", { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body) });
const j = await r.json();
console.log(j.choices?.[0]?.message?.content || JSON.stringify(j).slice(0, 500));
