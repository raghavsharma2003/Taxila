import { readIntent } from "/home/user/Taxila/server/conversation/lexicon.js";
import { requestOf } from "/home/user/Taxila/server/director/requests.js";
import { wantsToStop } from "/home/user/Taxila/server/director/safety.js";
const P = ["Hindi mein samjhao","हिंदी में समझाओ","हिंदी में समझाओ।","example do","एग्जांपल दो","एग्जांपल दो।","story ki tarah samjhao","स्टोरी की तरह समझाओ","slowly please","स्लोली प्लीज़","something else karte hain","समथिंग एल्स करते हैं","diagram bana ke samjhao na","डायग्राम बनाके समझाओ ना।","animation dikhao","एनिमेशन दिखाओ","बस आज के लिए इतना ही।","हाँ, बस करो.","ओके बाय, कल मिलते हैं।","पता नहीं, आप बताओ।"];
for (const p of P) console.log(p.padEnd(28), "intent=", JSON.stringify(readIntent(p))?.slice(0,60), "| req=", JSON.stringify(requestOf(p))?.slice(0,70), "| stop=", wantsToStop(p));
