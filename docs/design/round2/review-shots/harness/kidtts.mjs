// Child-voice clips for the fake mic (Azure Speech, the India resource from .env.local; never printed).
export async function kidClip(text, { voice = "en-IN-NeerjaNeural", pitch = "+22%", rate = "-4%" } = {}) {
  const region = process.env.AZURE_AI_CENTRALINDIA_REGION, key = process.env.AZURE_AI_CENTRALINDIA_KEY;
  const esc = String(text).replace(/[<&>]/g, (c) => ({ "<": "&lt;", "&": "&amp;", ">": "&gt;" })[c]);
  const ssml = `<speak version="1.0" xml:lang="en-IN"><voice name="${voice}"><prosody pitch="${pitch}" rate="${rate}">${esc}</prosody></voice></speak>`;
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-review" }, body: ssml });
  if (!r.ok) throw new Error(`kid tts ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
if (process.argv[1]?.endsWith("kidtts.mjs")) {
  const b = await kidClip(process.argv[2] ?? "haan, saat");
  (await import("node:fs")).writeFileSync(new URL("./kid-test.wav", import.meta.url), b);
  console.log("bytes", b.length, "sec", ((b.length - 44) / 48000).toFixed(2));
}
