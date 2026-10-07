import { readIntent } from "/home/user/Taxila/server/conversation/lexicon.js";
import { requestOf } from "/home/user/Taxila/server/director/requests.js";
import { wantsToStop } from "/home/user/Taxila/server/director/safety.js";
import { stopKind } from "/home/user/Taxila/server/relational/signals.js";
const P = ["bas, aaj ke liye itna hi","aaj ke liye itna hi","bas","bas karo ab","haan, bas karo","I'm done for today","lesson khatam karo","aaj ke liye bas","bas ho gaya","main thak gaya, bas","ab nahi padhna","kal karenge","bye","thak gayi hoon","mujhe neend aa rahi hai","haan","haan stop","stop for today","ok bye kal milte hain","aaj itna hi kaafi hai"];
for (const p of P) console.log(JSON.stringify(p).padEnd(30), "intent=", JSON.stringify(readIntent(p)), "req=", JSON.stringify(requestOf(p)), "stop=", wantsToStop(p), "kind=", stopKind(p));
