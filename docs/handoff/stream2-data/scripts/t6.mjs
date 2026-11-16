const m = await import(process.argv[2]);
const t6 = "didi aapne triangle ka drawing nahi dikhaya? aapne toh bola picture dikhao to geometry mode on... par yahan kuch bhi nahi hai blank hai! aise kaise corners count karoon? aap pehle draw karo na pleeeease, main bhi apni copy mein saath mein banaungi, mera favourite shape hai triangle, kal maine ek ice cream cone banaya tha triangle jaisa...";
const t10 = "didi maine dot ko apex bol diya... par aapne toh abhi tak draw hi nahi kiya screen pe! aapka triangle kahan hai? maine toh bola tha aap bhi banao! geometry padha rahe ho par picture nahi dikha rahe, ye kaisa geometry hai?";
for (const t of [t6, t10]) console.log(JSON.stringify(m.visualAskOf(t)), JSON.stringify(m.freeSubjectOf(t)), JSON.stringify(m.requestOf(t)));
