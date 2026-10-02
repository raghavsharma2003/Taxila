const pairs = [
 ['बहुत बढ़िया! अब सोचो, अगर पौधे को धूप न मिले तो क्या होगा?', 'Bahut badhiya! Ab socho, agar paudhe ko dhoop na mile to kya hoga?'],
 ['शाबाश, तुमने बिल्कुल सही जवाब दिया। चलो अगला सवाल देखते हैं।', 'Shabash, tumne bilkul sahi jawab diya. Chalo agla sawaal dekhte hain.'],
 ['प्रकाश संश्लेषण में पत्तियाँ क्षेत्र के अनुसार ऊर्जा बनाती हैं।', 'Prakash sanshleshan mein pattiyaan kshetra ke anusaar oorja banaati hain.'],
];
const seg = new Intl.Segmenter('hi', { granularity: 'grapheme' });
for (const [d, l] of pairs) { const cp = s => [...s].length, g = s => [...seg.segment(s)].length;
  console.log(`dev cp ${cp(d)} graphemes ${g(d)} | latin ${cp(l)} | ratio latin/dev-cp ${(cp(l)/cp(d)).toFixed(2)} latin/dev-graph ${(cp(l)/g(d)).toFixed(2)}`); }
