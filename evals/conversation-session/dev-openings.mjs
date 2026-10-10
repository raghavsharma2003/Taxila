// DEV openings for the session-first intake (written by the stream 4A session to exercise the beat; tuned against). The held-out
// battery is openings.mjs (written blind, never tuned on). Same shape.
const ctx = (o) => ({ subjects: ["maths", "science"], pointer: {}, dueReviews: [], levelPathTopic: null, testWindow: null, ...o });
export const DEV_OPENINGS = [
  { id: "do-01", cls: 6, lang: "hinglish", ctx: ctx({ pointer: { maths: 7 }, levelPathTopic: "c6-maths-ch05-t01" }),
    turns: ["aaj fractions padhaya, ma'am ne equivalent fractions kiya", "1/2 aur 2/4 same hote hain"], expect: { purpose: "school_continue", topicPrefix: "c6-maths-ch07", maxTurns: 2 } },
  { id: "do-02", cls: 7, lang: "english", ctx: ctx({ testWindow: { subject: "science", when: "tomorrow" }, pointer: { science: 3 }, levelPathTopic: "c7-maths-ch02-t01" }),
    turns: ["nothing much today"], expect: { purpose: "test_revise", topicPrefix: "c7-science-ch03", maxTurns: 1 } },
  { id: "do-03", cls: 5, lang: "hinglish", ctx: ctx({ subjects: ["maths", "evs"], dueReviews: ["c5-maths-ch02-t01"], levelPathTopic: "c5-maths-ch06-t01" }),
    turns: ["pata nahi"], expect: { purpose: "review", topicPrefix: "c5-maths-ch02-t01", maxTurns: 1 } },
  { id: "do-04", cls: 4, lang: "hinglish", ctx: ctx({ subjects: ["maths", "evs"], levelPathTopic: "c4-maths-ch05-t01" }),
    turns: ["aaj humari team jeet gayi", "kuch nahi padhaya"], expect: { purpose: "level_path", topicPrefix: "c4-maths-ch05-t01", maxTurns: 2 } },
  { id: "do-05", cls: 8, lang: "hindi", ctx: ctx({ levelPathTopic: "c8-maths-ch01-t01" }),
    turns: ["मुझे बहुत डर लग रहा है, कोई मुझे रोज़ मारता है"], expect: { purpose: "safeguard", topicPrefix: null, maxTurns: 1 } },
  { id: "do-06", cls: 7, lang: "hinglish", ctx: ctx({ levelPathTopic: "c7-maths-ch02-t01" }),
    turns: ["LCM HCF ka homework mila hai, nahi aa raha"], expect: { purpose: "homework", topicPrefix: "c7-maths-ch11", maxTurns: 1 } },
  { id: "do-07", cls: 6, lang: "english", ctx: ctx({ levelPathTopic: "c6-maths-ch05-t01" }),
    turns: ["can you teach me about magnets"], expect: { purpose: "child_request", topicPrefix: "c6-science-ch04", maxTurns: 1 } },
  { id: "do-08", cls: 7, lang: "hinglish", ctx: ctx({ levelPathTopic: "c7-maths-ch02-t01" }),
    turns: ["acid base wala samajh nahi aaya"], expect: { purpose: "school_reteach", topicPrefix: "c7-science-ch02", maxTurns: 1 } },
];
