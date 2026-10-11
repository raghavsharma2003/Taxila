// duplex bake-off 2026-10: cost per conversation-MINUTE for an enterprise voice-calling SaaS (BAKEOFF.md §5b).
// Unit prices: Azure Retail Prices API read 2026-10-11 (meter names in BAKEOFF.md); PSTN from the ACS pricing page + rates CSV.
//   node evals/duplex-2026-10/cost-per-minute.mjs
const M = 1e6;
// assumptions per conversation-minute [E]
const A = { callerSec: 30, agentSec: 30, turns: 4, inTokPerSec: 10, outTokPerSec: 20, ttsChars: 450, ctxTok: 2000, ctxCachedShare: 0.75, llmOut: 60, rtTextOut: 280, histCachedAudio: 8000 };
const callerAudio = A.callerSec * A.inTokPerSec, agentAudio = A.agentSec * A.outTokPerSec, streamTok = 60 * A.inTokPerSec;
const ctxCached = A.turns * A.ctxTok * A.ctxCachedShare, ctxNew = A.turns * A.ctxTok * (1 - A.ctxCachedShare);
const P = {
  s1stt: 1 / 60, // S1 Speech To Text $1/h
  hdTts: 22 / M, neuralTts: 15 / M,
  terra: { cin: 0.2 / M, in: 2 / M, out: 12 / M }, luna: { cin: 0.02 / M, in: 0.2 / M, out: 1.2 / M },
  rt21: { ain: 32 / M, aout: 64 / M, acin: 0.4 / M, tin: 4 / M, tcin: 0.4 / M, tout: 24 / M },
  rtmini: { ain: 10 / M, aout: 20 / M, acin: 0.3 / M, tin: 0.6 / M, tcin: 0.06 / M, tout: 2.4 / M },
  liveTranscribe: 1.02 / 60, live1: 3 / 60,
  vlProSpeechOut: 31 / M, vlProLlmTextOut: 16 / M, vlProLlmTextIn: 4 / M, vlProTextCached: 0.4 / M,
  vlStdSpeechIn: 15 / M, vlStdSpeechOut: 26 / M, vlStdTextIn: 0.66 / M, vlStdTextCached: 0.33 / M, vlStdTextOut: 2.64 / M,
};
const llm = (m) => ctxCached * m.cin + ctxNew * m.in + A.turns * A.llmOut * m.out;
const rt = (m) => ({ rt: (callerAudio + agentAudio) * m.ain + agentAudio * m.aout + A.histCachedAudio * m.acin + ctxCached * m.tcin + ctxNew * m.tin + A.rtTextOut * m.tout });
const arms = {
  "(a) cascade: S1 STT + 5.6 terra + Neural HD TTS": { stt: P.s1stt, llm: llm(P.terra), tts: A.ttsChars * P.hdTts },
  "(a′) cascade budget: S1 STT + 5.6 luna + Neural TTS": { stt: P.s1stt, llm: llm(P.luna), tts: A.ttsChars * P.neuralTts },
  "(b) duplex engine on (a): + gpt-live-transcribe stream": { stt: P.s1stt + P.liveTranscribe, llm: llm(P.terra), tts: A.ttsChars * P.hdTts },
  "(c1) Voice Live Pro, gpt-realtime-2.1 native voice": rt(P.rt21),
  "(c2) Voice Live Pro, gpt-realtime-2.1 + Azure HD voice": { rt: callerAudio * P.rt21.ain + ctxCached * P.vlProTextCached + ctxNew * P.vlProLlmTextIn + 100 * P.vlProLlmTextOut + agentAudio * P.vlProSpeechOut },
  "(c3) Voice Live Std, cascade-class LLM (gpt-4.1-mini tier) + Azure voice": { stt: streamTok * P.vlStdSpeechIn, llm: ctxCached * P.vlStdTextCached + ctxNew * P.vlStdTextIn + A.turns * A.llmOut * P.vlStdTextOut, tts: agentAudio * P.vlStdSpeechOut },
  "(d) gpt-realtime-2.1 alone": rt(P.rt21),
  "(d′) gpt-realtime-2.1-mini alone": rt(P.rtmini),
  "GPT-Live-1 (full duplex, $3/h unit)": { rt: P.live1 },
  "(e) Voice Live front end + cascade (a)": { stt: streamTok * P.vlStdSpeechIn, llm: llm(P.terra), tts: A.ttsChars * P.hdTts },
};
const tel = { "US inbound geo": 0.0085, "US inbound toll-free": 0.022, "US outbound": 0.013, "India (Direct Routing; carrier extra)": 0.004, "US number → India mobile": 0.035 };
const STREAM = 0.004; // ACS Unmixed Audio Streaming $0.004/min
const f = (x) => (x ? "$" + x.toFixed(4) : "—");
console.log(JSON.stringify({ A, callerAudio, agentAudio, streamTok }));
console.log("| arm | STT | LLM | TTS | realtime model | AI total /min | + US inbound geo | + India DR | ×3 (US in) |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const [k, v] of Object.entries(arms)) {
  const ai = (v.stt || 0) + (v.llm || 0) + (v.tts || 0) + (v.rt || 0);
  const us = ai + tel["US inbound geo"] + STREAM, inn = ai + tel["India (Direct Routing; carrier extra)"] + STREAM;
  console.log(`| ${k} | ${f(v.stt)} | ${f(v.llm)} | ${f(v.tts)} | ${f(v.rt)} | ${f(ai)} | ${f(us)} | ${f(inn)} | ${f(us * 3)} |`);
}
