import { visualAskOf } from "/home/user/Taxila/server/director/requests.js";
import * as R from "/home/user/Taxila/server/director/requests.js";
console.log(Object.keys(R).join(" "));
for (const t of ["Show me a picture", "Picture dikhao", "Tasveer dikhao", "तस्वीर दिखाओ", "चित्र दिखाओ", "Kahani ki tarah batao", "कहानी की तरह बताओ", "Tell it as a story", "Game khelte hain", "Play a game", "खेल खेलते हैं", "गेम खेलते हैं"]) {
  let r = null; try { r = R.requestOf ? R.requestOf(t) : null; } catch {}
  console.log(t, "| visual:", JSON.stringify(visualAskOf(t)), "| req:", JSON.stringify(r)?.slice(0, 120));
}
