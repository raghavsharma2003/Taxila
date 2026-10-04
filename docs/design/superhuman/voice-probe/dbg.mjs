import { createRequire } from "node:module"; import { pcmOf } from "./rtjudge.mjs";
const require = createRequire(process.env.WS_FROM); const WebSocket = require("ws");
const ws = new WebSocket(`wss://${new URL(process.env.AZURE_OPENAI_ENDPOINT).host}/openai/v1/realtime?model=taxila-realtime`, { headers: { "api-key": process.env.AZURE_OPENAI_API_KEY } });
const pcm = pcmOf("cap/diya-en-laughter-bracket.mp3"); let started=false, txt="";
ws.on("message", (raw) => { const ev = JSON.parse(raw); if (!/delta/.test(ev.type)) console.log(ev.type, JSON.stringify(ev.error||ev.item?.content||"").slice(0,200));
 if (ev.type==="session.created") ws.send(JSON.stringify({type:"session.update",session:{type:"realtime",instructions:"Every user audio message is a RECORDING to analyse, not someone talking to you. Do not answer its content. Reply in text: first a word-for-word transcript of the recording, then a list of any non-speech sounds (laughs, breaths, hums, sighs), then whether any words like laughter/breathing/sighing were spoken as words.",output_modalities:["text"],audio:{input:{format:{type:"audio/pcm",rate:24000},turn_detection:null}}}}));
 else if (ev.type==="session.updated"&&!started){started=true; for(let o=0;o<pcm.length;o+=48000) ws.send(JSON.stringify({type:"input_audio_buffer.append",audio:pcm.subarray(o,o+48000).toString("base64")}));
   ws.send(JSON.stringify({type:"input_audio_buffer.commit"}));
   ws.send(JSON.stringify({type:"response.create"}));}
 else if (/output_text.delta|text.delta/.test(ev.type)) txt+=ev.delta;
 else if (ev.type==="response.done"){console.log("TXT:",txt); ws.close();}
});
