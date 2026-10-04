// Reference animation for the stage slot (1000×1000 canvas): white light meets a leaf; red and blue are used, green
// bounces back. Pure vector (no raster, no text inside pictures beyond canvas labels ≥ 38 units). Stand-in for RS-4's
// cinematic animation engines; it shows the stage contract (meet-fit, label sizes, PiP zone clear).
export function LeafLight({ settled }: { settled?: boolean }) {
  return (
    <svg className={`v3-leaf${settled ? " is-settled" : ""}`} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" role="img"
      aria-label="White light hits the leaf; red and blue are absorbed, green bounces back">
      <defs>
        <radialGradient id="v3-leaf-body" cx="58%" cy="58%" r="62%">
          <stop offset="0" stopColor="#2c8a4b" /><stop offset=".55" stopColor="#17532e" /><stop offset="1" stopColor="#0a2414" />
        </radialGradient>
        <radialGradient id="v3-leaf-sun"><stop offset="0" stopColor="#fff6d6" stopOpacity=".26" /><stop offset=".55" stopColor="#fff6d6" stopOpacity="0" /></radialGradient>
        <marker id="v3-ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5BE37D" /></marker>
      </defs>
      {/* the glow fades to nothing before any canvas edge, so letterbox bands never show a seam */}
      <circle cx="320" cy="300" r="500" fill="url(#v3-leaf-sun)" />
      <path d="M210 900 C240 560 520 300 920 250 C900 600 660 900 210 900Z" fill="url(#v3-leaf-body)" />
      <path d="M230 880 C420 720 640 500 900 262" stroke="#8fe0a8" strokeOpacity=".5" strokeWidth="5" fill="none" />
      <g stroke="#8fe0a8" strokeOpacity=".24" strokeWidth="3" fill="none">
        <path d="M420 720 L380 560" /><path d="M520 630 L500 450" /><path d="M620 540 L620 380" /><path d="M720 450 L740 320" />
        <path d="M480 670 L640 700" /><path d="M580 580 L760 600" /><path d="M680 490 L840 480" />
      </g>
      <path className="v3-ray" pathLength={1} d="M90 170 L470 520" stroke="#fff" />
      <text className="v3-rlab" x="90" y="140" style={{ animationDelay: ".6s" }}>sunlight</text>
      <path className="v3-ray v3-ray--absorb" pathLength={1} d="M470 520 L590 640" stroke="#FF5A5A" style={{ animationDelay: "1.3s" }} />
      <path className="v3-ray v3-ray--absorb" pathLength={1} d="M470 520 L520 680" stroke="#5A8BFF" style={{ animationDelay: "1.5s" }} />
      <path className="v3-ray" pathLength={1} d="M470 520 L760 356" stroke="#5BE37D" markerEnd="url(#v3-ah)" style={{ animationDelay: "2.1s" }} />
      <text className="v3-rlab" x="300" y="790" style={{ animationDelay: "2s" }}>red + blue: used</text>
      <text className="v3-rlab v3-rlab--green" x="520" y="470" style={{ animationDelay: "2.8s" }}>green: bounced</text>
    </svg>
  );
}
