// Five Hinglish teacher lines used to MEASURE the expressive layer (2026-10-04). TEST STIMULI ONLY: never product
// prompt text, never shown to a model that writes teacher lines. Each carries the scene the Director would know
// (intent, the child's last turn, the moment) because the planner plans from the moment, not from the words.
export const LINES = [
  {
    id: "L1-think", intent: "think_aloud", band: "3-5", teacher: "asha",
    child: "सत्ताईस और पैंतीस कितना होगा?",
    scene: "The child asked a sum. The teacher works it out out loud together with the child, step by step, as if thinking.",
    text: "सत्ताईस और पैंतीस। पहले tens जोड़ते हैं, बीस और तीस, पचास। फिर सात और पाँच, बारह। तो total हुआ बासठ!",
  },
  {
    id: "L2-laugh", intent: "shared_laughter", band: "3-5", teacher: "asha", childLaughed: true,
    child: "पौधे cold drink पीते हैं! (laughing)",
    scene: "The child made a joke and is laughing. The teacher laughs along, plays with the joke, then brings the fact back.",
    text: "Cold drink? फिर तो सारे पौधे गमले में burp करते! नहीं, पौधे सिर्फ़ पानी पीते हैं, अपनी जड़ों से।",
  },
  {
    id: "L3-surprise", intent: "surprised_praise", band: "3-5", teacher: "asha",
    child: "बारह बटा सोलह मतलब तीन बटा चार!",
    scene: "The child solved a hard simplification on the first try. The teacher is genuinely surprised and delighted, specific about what was good.",
    text: "अरे! पहली बार में ही? तुमने ऊपर और नीचे दोनों को चार से divide किया, बिल्कुल सही। ये वाला तो बहुत लोग गलत करते हैं!",
  },
  {
    id: "L4-correct", intent: "gentle_correction", band: "3-5", teacher: "asha", childWrong: true,
    child: "तीन बटा चार छोटा है, दो बटा तीन बड़ा है।",
    scene: "The child gave a wrong answer and sounds unsure. The teacher is calm and kind, no disappointment, slows down to look at it together.",
    text: "अच्छा, यहाँ थोड़ा रुकते हैं। तीन बटा चार में हम चार में से तीन हिस्से लेते हैं, यानी लगभग पूरा pizza। अब दो बटा तीन को देखो।",
  },
  {
    id: "L5-wonder", intent: "wonder_hook", band: "5-7", teacher: "arjun",
    child: "दिल क्या करता है?",
    scene: "Start of a science topic. The teacher shares an amazing fact with quiet wonder that builds into excitement, inviting the child to imagine.",
    text: "पता है, तुम्हारे शरीर का सारा खून लगभग एक मिनट में पूरे शरीर का एक चक्कर लगा लेता है। सोचो, अभी इसी वक़्त भी!",
  },
];
