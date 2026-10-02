// TEST STIMULI ONLY (listening material for voice probes). Never prompt text, never product copy.
// Copied VERBATIM from docs/research/voice/v2/azure-speech-voices.mjs (P[], segments joined with a space) so the
// OpenRouter reference clips and the Azure sweep are rated on identical text. If that file changes, re-copy.
export const PASSAGES = {
  "a-greet": { label: "Hinglish greeting + memory callback", lang: "hinglish",
    text: "अरे Aarav, नमस्ते! कैसे हो? पिछली बार तुमने बताया था ना कि Sunday को तुम्हारा cricket match था? तो बताओ, match जीते क्या? चलो, आज हम कुछ बहुत मज़ेदार सीखते हैं।" },
  "b-fractions": { label: "Hinglish equivalent fractions with a pizza + gentle question", lang: "hinglish",
    text: "देखो, एक pizza लो और उसे दो बराबर हिस्सों में काटो। एक हिस्सा हुआ one by two, यानी आधा। अब उसी pizza को चार बराबर हिस्सों में काटो, तो दो हिस्से भी उतना ही pizza हैं, two by four. इसलिए one by two और two by four, equivalent fractions हैं। अच्छा, तुम बताओ, अगर pizza के आठ हिस्से हों, तो कितने हिस्से आधे के बराबर होंगे?" },
  "c-hindi": { label: "Pure Hindi for a class-3 child", lang: "hindi",
    text: "चलो बच्चों, आज हम पेड़-पौधों के बारे में बात करेंगे। क्या तुमने कभी सोचा है कि पौधे पानी कैसे पीते हैं? उनकी जड़ें मिट्टी से पानी खींचती हैं, बिल्कुल वैसे ही जैसे तुम नली से दूध पीते हो। बताओ, जड़ें पौधे के किस हिस्से में होती हैं?" },
  "d-english": { label: "English with Indian teacher warmth", lang: "english",
    text: "Very good, beta. You took your time and thought it through, and that is exactly what good learners do. Now let us try one more, okay? Read the question slowly, and tell me what you notice first." },
  "e-praise-correct": { label: "Excited shabash praise + gentle correction", lang: "hinglish",
    text: "अरे वाह! शाबाश! बिल्कुल सही जवाब, तुमने तो कमाल कर दिया! अच्छा, अगले वाले में एक छोटी सी गलती हुई है, कोई बात नहीं। तीन बटा चार, दो बटा तीन से बड़ा होता है, छोटा नहीं। चलो, एक बार साथ में देखते हैं।" },
};
