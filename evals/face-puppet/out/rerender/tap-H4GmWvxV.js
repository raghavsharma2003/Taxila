//#region shared/tutors.js
var e = [
	{
		id: "asha",
		lookId: "teal",
		status: "live",
		displayName: {
			roman: "Asha",
			deva: "आशा"
		},
		roleChips: ["didi"],
		styleChip: {
			english: "step by step",
			hindi: "कदम-कदम पर",
			hinglish: "step by step"
		},
		styleNote: {
			english: "goes step by step, with pictures",
			hindi: "चित्रों के साथ, कदम-कदम पर",
			hinglish: "pictures ke saath, step by step"
		},
		fit: {
			offerClasses: [1, 4],
			wideOfferClasses: [1, 6],
			serveClasses: [1, 7]
		},
		look: {
			rev: 1,
			presentedGender: "F",
			apparentAge: 24,
			mst: 6,
			signatureColor: "#3E7C74",
			skin: "#C99366",
			skinShade: "#B07E55",
			hair: "#2A1C14",
			hairStyle: "ponytail",
			glasses: "none",
			top: "#3E7C74",
			topShade: "#32665F",
			accent: "#F2D9A6",
			accentBorder: "#C2410C",
			attire: "kurti-jacket",
			iris: "#4A2E1C",
			lip: "#9A4E44"
		},
		faceStyle: {
			smile: .8,
			headGain: 1.1,
			browGain: 1.1
		},
		voice: {
			cps: 13.5,
			speakerMeanHz: 220
		}
	},
	{
		id: "arjun",
		lookId: "slate",
		status: "live",
		displayName: {
			roman: "Arjun",
			deva: "अर्जुन"
		},
		roleChips: ["bhaiya"],
		styleChip: {
			english: "guess, then check",
			hindi: "पहले अंदाज़ा, फिर जाँच",
			hinglish: "guess, phir check"
		},
		styleNote: {
			english: "loves puzzles: guess first, then check",
			hindi: "पहेलियाँ पसंद: पहले अंदाज़ा, फिर जाँच",
			hinglish: "puzzles pasand: pehle guess, phir check"
		},
		fit: {
			offerClasses: [5, 9],
			wideOfferClasses: [1, 9],
			serveClasses: [1, 9]
		},
		look: {
			rev: 1,
			presentedGender: "M",
			apparentAge: 26,
			mst: 7,
			signatureColor: "#44607F",
			skin: "#A9744A",
			skinShade: "#93633D",
			hair: "#1F1712",
			hairStyle: "curls",
			glasses: "round",
			top: "#44607F",
			topShade: "#384F69",
			accent: "#E9E4D8",
			accentBorder: "#2E4257",
			attire: "shirt-tee",
			iris: "#3A2416",
			lip: "#7E4636"
		},
		faceStyle: {
			smile: .7,
			headGain: 1.2,
			browGain: 1
		},
		voice: {
			cps: 13.5,
			speakerMeanHz: 120
		}
	},
	{
		id: "uma",
		lookId: "plum",
		status: "draft",
		displayName: {
			roman: "Uma",
			deva: "उमा"
		},
		roleChips: ["maam"],
		styleChip: {
			english: "calm and clear",
			hindi: "शांत और साफ़",
			hinglish: "calm aur clear"
		},
		styleNote: {
			english: "calm and clear; recall first, then practice",
			hindi: "शांत और साफ़: पहले याद, फिर अभ्यास",
			hinglish: "calm aur clear: pehle yaad, phir practice"
		},
		fit: {
			offerClasses: [7, 9],
			wideOfferClasses: [7, 9],
			serveClasses: [7, 9]
		},
		look: {
			rev: 1,
			presentedGender: "F",
			apparentAge: 34,
			mst: 8,
			signatureColor: "#7A4A6E",
			skin: "#8A5634",
			skinShade: "#764829",
			hair: "#241812",
			hairStyle: "bun",
			glasses: "none",
			top: "#7A4A6E",
			topShade: "#653C5B",
			accent: "#EADFC8",
			accentBorder: "#C2410C",
			attire: "saree",
			iris: "#2E1C10",
			lip: "#6E3A30"
		},
		faceStyle: {
			smile: .55,
			headGain: .8,
			browGain: 1.2
		},
		voice: {
			cps: 12.5,
			speakerMeanHz: 200
		}
	}
], t = (t) => e.find((e) => e.id === t) ?? null;
function n(e) {
	let t = e >>> 0;
	return () => {
		t = t + 1831565813 | 0;
		let e = Math.imul(t ^ t >>> 15, 1 | t);
		return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
	};
}
var r = (e) => Number(e.class_level) <= 4 ? "asha" : "arjun";
Object.freeze({
	min: 2,
	max: 16,
	re: /^[A-Za-z]+(?:[ -][A-Za-z]+){0,2}$/
}), Object.freeze([
	"Asha",
	"Arjun",
	"Uma"
]);
//#endregion
//#region src/avatar/lip.ts
var i = 512, a = 1024, o = 2, s = 250, c = 300;
function l(e, t = i) {
	let n = Math.max(0, e.length - t), r = 0;
	for (let t = n; t < e.length; t++) r += e[t] * e[t];
	let a = e.length - n;
	return a > 0 ? Math.sqrt(r / a) : 0;
}
function u(e, t, n = a) {
	let r = Math.max(0, e.length - n), i = 1 - Math.exp(-2 * Math.PI * 1200 / t), o = 0, s = 0, c = 0;
	for (let t = r; t < e.length; t++) {
		let n = e[t];
		o += i * (n - o);
		let r = n - o;
		s += o * o, c += r * r;
	}
	let l = s + c;
	return l > 1e-12 ? c / l : 0;
}
var d = (e) => e < 0 ? 0 : e > 1 ? 1 : e, f = class {
	sampleRate;
	tau;
	ceiling;
	shapeGain;
	ref;
	gateFrac;
	refScale;
	curve;
	expandRatio;
	expandPow;
	slowTau;
	closeTau;
	nasalDark;
	expandDark;
	hardRatio;
	slow = 0;
	refRing = [];
	refDirty = 0;
	jaw = 0;
	wide = 0;
	round = 0;
	lastT = -1;
	voicedRun = 0;
	lastVoicedT = -Infinity;
	speaking = !1;
	constructor(e, t = {}) {
		this.sampleRate = e, this.tau = (t.tauMs ?? 50) / 1e3, this.ceiling = t.jawCeiling ?? .85, this.shapeGain = t.shapeGain ?? .35, this.ref = t.initialRef ?? .06, this.gateFrac = t.gateFrac ?? .06, this.refScale = t.refScale ?? .7, this.curve = t.curve ?? 1, this.expandRatio = t.expandRatio ?? .9, this.expandPow = t.expandPow ?? 4, this.slowTau = (t.slowMs ?? 120) / 1e3, this.closeTau = (t.closeTauMs ?? t.tauMs ?? 50) / 1e3, this.nasalDark = t.nasalDark ?? 0, this.expandDark = t.expandDark ?? .1, this.hardRatio = t.hardRatio ?? .35;
	}
	get reference() {
		return this.ref;
	}
	reset() {
		this.jaw = this.wide = this.round = this.slow = 0, this.voicedRun = 0, this.speaking = !1, this.lastT = -1, this.lastVoicedT = -Infinity;
	}
	gate() {
		return Math.max(.004, this.ref * this.gateFrac);
	}
	step(e, t) {
		let n = this.lastT < 0 ? 1 / 30 : Math.max(0, Math.min(.25, t - this.lastT));
		this.lastT = t;
		let r = l(e), i = this.gate(), a = r > Math.max(i * 1.6, .006);
		if (a && (this.refRing.push(r), this.refRing.length > c && this.refRing.shift(), ++this.refDirty >= 15 && this.refRing.length >= 15)) {
			this.refDirty = 0;
			let e = [...this.refRing].sort((e, t) => e - t);
			this.ref = Math.max(.01, e[Math.floor(.9 * (e.length - 1))]);
		}
		this.voicedRun = a ? this.voicedRun + 1 : 0, a && (this.lastVoicedT = t);
		let f = a ? 0 : Math.max(0, (t - this.lastVoicedT) * 1e3);
		!this.speaking && this.voicedRun >= o ? this.speaking = !0 : this.speaking && !a && f >= s && (this.speaking = !1);
		let p = d((r - i) / Math.max(1e-4, this.ref * this.refScale - i)), m = this.ceiling * p ** +this.curve, h = 1 - Math.exp(-n / this.slowTau);
		this.speaking || a ? this.slow += h * (r - this.slow) : this.slow += h * (0 - this.slow);
		let g = a || this.nasalDark > 0 || this.expandDark > 0 ? u(e, this.sampleRate) : 0;
		if (this.expandRatio > 0 && this.slow > i) {
			let e = r / this.slow;
			(e < this.hardRatio || e < this.expandRatio && (this.expandDark <= 0 || g < this.expandDark)) && (m *= (e / this.expandRatio) ** +this.expandPow), this.nasalDark > 0 && a && g < this.nasalDark && e < .85 && (m *= .15);
		}
		let _ = 1 - Math.exp(-n / (m < this.jaw ? this.closeTau : this.tau));
		this.jaw += _ * (m - this.jaw), this.jaw < .005 && (this.jaw = 0);
		let v = d((this.jaw - .05) / .25), y = a ? d((g - .3) / .3) * v : 0, b = a ? d((.12 - g) / .1) * v : 0, x = 1 - Math.exp(-n / .06);
		return this.wide += x * (y - this.wide), this.round += x * (b - this.round), {
			t,
			rms: r,
			jaw: this.jaw,
			voiced: a,
			speaking: this.speaking,
			silenceMs: f,
			wide: this.wide * this.shapeGain,
			round: this.round * this.shapeGain
		};
	}
};
function p(e) {
	return {
		jawOpen: e.jaw,
		mouthClose: 0,
		mouthFunnel: e.round * .9,
		mouthPucker: e.round * .6,
		mouthStretchLeft: e.wide * .7,
		mouthStretchRight: e.wide * .7
	};
}
var m = class {
	ring = [];
	size;
	constructor(e = 64) {
		this.size = e;
	}
	push(e) {
		this.ring.push(e), this.ring.length > this.size && this.ring.shift();
	}
	flush() {
		this.ring = [];
	}
	read(e, t) {
		let n = e - t / 1e3;
		for (let e = this.ring.length - 1; e >= 0; e--) if (this.ring[e].t <= n + 1e-6) return this.ring[e];
		return this.ring[0] ?? null;
	}
}, h = class {
	slots = [];
	fresh = !1;
	constructor(e) {
		for (let t of e) {
			let e = {
				own: null,
				upstream: null,
				buf: null,
				off: () => {},
				src: t
			};
			t.onTap && (e.off = t.onTap((t) => this.attach(e, t))), this.slots.push(e);
		}
	}
	attach(e, t) {
		if (e.own && e.upstream) try {
			e.upstream.disconnect(e.own);
		} catch {}
		if (e.own = null, e.upstream = null, e.buf = null, !t) return;
		let n = t.context.createAnalyser();
		n.fftSize = 2048, n.smoothingTimeConstant = 0, t.connect(n), e.own = n, e.upstream = t, e.buf = new Float32Array(n.fftSize), this.fresh = !0;
	}
	get attached() {
		return this.slots.some((e) => e.own);
	}
	read() {
		let e = null, t = -1, n = 0;
		for (let r of this.slots) {
			if (n = Math.max(n, r.src.value), !r.own || !r.buf) continue;
			r.own.getFloatTimeDomainData(r.buf);
			let i = 0;
			for (let e = r.buf.length - 512; e < r.buf.length; e++) i += r.buf[e] * r.buf[e];
			i > t && (t = i, e = r);
		}
		let r = this.fresh;
		if (this.fresh = !1, !e || !e.own) return {
			buf: null,
			sampleRate: 48e3,
			t: performance.now() / 1e3,
			level: n,
			fresh: r
		};
		let i = e.own.context;
		return {
			buf: e.buf,
			sampleRate: i.sampleRate,
			t: performance.now() / 1e3,
			level: n,
			fresh: r
		};
	}
	dispose() {
		for (let e of this.slots) e.off(), this.attach(e, null);
		this.slots = [];
	}
};
function g(e, t) {
	let n = (e > 0 ? 10 ** ((e * 50 - 60) / 20) : 0) * Math.SQRT2;
	for (let e = 0; e < t.length; e++) t[e] = n * Math.sin(e * .2);
	return t;
}
//#endregion
export { p as a, t as c, m as i, g as n, r as o, f as r, n as s, h as t };
