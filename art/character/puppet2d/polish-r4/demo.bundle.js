function e(e, t = 512) {
	let n = Math.max(0, e.length - t), r = 0;
	for (let t = n; t < e.length; t++) r += e[t] * e[t];
	let i = e.length - n;
	return i > 0 ? Math.sqrt(r / i) : 0;
}
function t(e, t, n = 1024) {
	let r = Math.max(0, e.length - n), i = 1 - Math.exp(-2 * Math.PI * 1200 / t), a = 0, o = 0, s = 0;
	for (let t = r; t < e.length; t++) {
		let n = e[t];
		a += i * (n - a);
		let r = n - a;
		o += a * a, s += r * r;
	}
	let c = o + s;
	return c > 1e-12 ? s / c : 0;
}
var n = (e) => e < 0 ? 0 : e > 1 ? 1 : e, r = class {
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
	step(r, i) {
		let a = this.lastT < 0 ? 1 / 30 : Math.max(0, Math.min(.25, i - this.lastT));
		this.lastT = i;
		let o = e(r), s = this.gate(), c = o > Math.max(s * 1.6, .006);
		if (c && (this.refRing.push(o), this.refRing.length > 300 && this.refRing.shift(), ++this.refDirty >= 15 && this.refRing.length >= 15)) {
			this.refDirty = 0;
			let e = [...this.refRing].sort((e, t) => e - t);
			this.ref = Math.max(.01, e[Math.floor(.9 * (e.length - 1))]);
		}
		this.voicedRun = c ? this.voicedRun + 1 : 0, c && (this.lastVoicedT = i);
		let l = c ? 0 : Math.max(0, (i - this.lastVoicedT) * 1e3);
		!this.speaking && this.voicedRun >= 2 ? this.speaking = !0 : this.speaking && !c && l >= 250 && (this.speaking = !1);
		let u = n((o - s) / Math.max(1e-4, this.ref * this.refScale - s)), d = this.ceiling * u ** +this.curve, f = 1 - Math.exp(-a / this.slowTau);
		this.speaking || c ? this.slow += f * (o - this.slow) : this.slow += f * (0 - this.slow);
		let p = c || this.nasalDark > 0 || this.expandDark > 0 ? t(r, this.sampleRate) : 0;
		if (this.expandRatio > 0 && this.slow > s) {
			let e = o / this.slow;
			(e < this.hardRatio || e < this.expandRatio && (this.expandDark <= 0 || p < this.expandDark)) && (d *= (e / this.expandRatio) ** +this.expandPow), this.nasalDark > 0 && c && p < this.nasalDark && e < .85 && (d *= .15);
		}
		let m = 1 - Math.exp(-a / (d < this.jaw ? this.closeTau : this.tau));
		this.jaw += m * (d - this.jaw), this.jaw < .005 && (this.jaw = 0);
		let h = n((this.jaw - .05) / .25), g = c ? n((p - .3) / .3) * h : 0, _ = c ? n((.12 - p) / .1) * h : 0, v = 1 - Math.exp(-a / .06);
		return this.wide += v * (g - this.wide), this.round += v * (_ - this.round), {
			t: i,
			rms: o,
			jaw: this.jaw,
			voiced: c,
			speaking: this.speaking,
			silenceMs: l,
			wide: this.wide * this.shapeGain,
			round: this.round * this.shapeGain
		};
	}
};
function i(e) {
	return {
		jawOpen: e.jaw,
		mouthClose: 0,
		mouthFunnel: e.round * .9,
		mouthPucker: e.round * .6,
		mouthStretchLeft: e.wide * .7,
		mouthStretchRight: e.wide * .7
	};
}
//#endregion
//#region shared/tutors.js
function a(e) {
	let t = e >>> 0;
	return () => {
		t = t + 1831565813 | 0;
		let e = Math.imul(t ^ t >>> 15, 1 | t);
		return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
	};
}
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
//#region src/avatar/behaviour.ts
var o = {
	idle: 17,
	speaking: 26,
	your_turn: 18,
	listening: 18,
	thinking: 22
}, s = 3, c = {
	close: 70,
	hold: 40,
	open: 140
}, l = {
	b1: 1,
	b2: .9,
	b3: .7,
	b4: .55
}, u = 120, d = .6, f = .004, p = (() => {
	let e = Math.sqrt(u), t = e * Math.sqrt(1 - d ** 2), n = Math.atan(t / (d * e)) / t;
	return Math.exp(-.6 * e * n) * Math.sin(t * n) / t;
})(), m = {
	warm: {
		bs: {
			mouthSmile: .28,
			cheekSquint: .12,
			eyeSquint: .1
		},
		tilt: 2,
		env: [
			600,
			1500,
			900
		]
	},
	curious: {
		bs: {
			browInnerUp: .28,
			browOuterUp: .22,
			mouthSmile: .08
		},
		tilt: 6,
		env: [
			350,
			1800,
			700
		]
	},
	excited: {
		bs: {
			mouthSmile: .55,
			cheekSquint: .35,
			eyeSquint: .2,
			browOuterUp: .25,
			eyeWide: .12
		},
		tilt: 3,
		env: [
			350,
			1200,
			900
		]
	},
	concerned: {
		bs: {
			browInnerUp: .3,
			browDown: .06,
			mouthPress: .12
		},
		tilt: 5,
		env: [
			700,
			2500,
			1200
		]
	},
	proud: {
		bs: {
			mouthSmile: .45,
			cheekSquint: .32,
			eyeSquint: .22
		},
		tilt: 3,
		env: [
			550,
			1600,
			1e3
		]
	}
}, h = /* @__PURE__ */ new Set([
	"mouthSmile",
	"cheekSquint",
	"mouthPress"
]);
function g(e, t) {
	let n = 2 * d * Math.sqrt(u), r = Math.min(t, .25);
	for (; r > 1e-6;) {
		let t = Math.min(f, r);
		e.v += (-120 * e.x - n * e.v) * t, e.x += e.v * t, r -= t;
	}
}
function _(e) {
	let t = 0, n = 0;
	for (; !t;) t = e();
	for (; !n;) n = e();
	return Math.sqrt(-2 * Math.log(t)) * Math.cos(2 * Math.PI * n);
}
var v = (e, [t, n], r = .05, i = Infinity) => Math.min(i, Math.max(r, t + n * _(e)));
function y(e, t, n) {
	let r = t - 1 / 3, i = 1 / Math.sqrt(9 * r);
	for (;;) {
		let t, a;
		do
			t = _(e), a = 1 + i * t;
		while (a <= 0);
		a = a * a * a;
		let o = e();
		if (o < 1 - .0331 * t ** 4 || Math.log(o) < .5 * t * t + r * (1 - a + Math.log(a))) return r * a * n;
	}
}
var b = (e) => e < 0 ? 0 : e > 1 ? 1 : e, x = (e, t, n) => e < t ? t : e > n ? n : e;
function S(e) {
	return e.status === "listening" ? "listening" : e.tapSpeaking ? "speaking" : e.status === "speaking" ? e.silenceMs < 1200 ? "speaking" : "your_turn" : e.status === "thinking" ? e.spokeSinceStatus ? "your_turn" : "thinking" : e.status === "your_turn" ? "your_turn" : "idle";
}
var C = class {
	r;
	scale;
	smileGain;
	headGain;
	browGain;
	reduced;
	gentle;
	asym;
	t = -1;
	state = "idle";
	stateT = 0;
	gaze = {
		mode: "child",
		yaw: 0,
		pitch: 0,
		until: 0,
		reason: "contact"
	};
	contactSince = 0;
	nextAvert = 0;
	nextMicro = 0;
	micro = [0, 0];
	thinkAvertAt = 0;
	blink = {
		next: 0,
		active: !1,
		t0: 0,
		lastEnd: -9,
		mean: 3.5,
		queueDouble: !1
	};
	nod = {
		x: 0,
		v: 0
	};
	tilt = 0;
	lean = 0;
	leanV = 0;
	headYaw = 0;
	drift;
	emo = {
		kind: null,
		I: 0,
		t0: 0,
		env: [
			1,
			0,
			1
		]
	};
	armed = null;
	brow = {
		t0: -9,
		amp: 0
	};
	rms = {
		fast: 0,
		slow: .02,
		lastAccent: -9
	};
	herVoiced = !1;
	herPauseT0 = -1;
	pauseHandled = !1;
	log = [];
	constructor(e = {}) {
		this.r = a(e.seed ?? 1), this.scale = l[e.band ?? "b2"] ?? .8, this.smileGain = e.faceStyle?.smile ?? .7, this.headGain = e.faceStyle?.headGain ?? 1, this.browGain = e.faceStyle?.browGain ?? 1, this.reduced = !!e.reducedMotion, this.gentle = !!e.gentle, this.asym = 1 + (this.r() - .5) * .12, this.drift = [
			this.r() * 99,
			this.r() * 99,
			this.r() * 99
		];
	}
	get faceState() {
		return this.state;
	}
	setMotion(e) {
		e.reduced !== void 0 && (this.reduced = e.reduced), e.gentle !== void 0 && (this.gentle = e.gentle);
	}
	ev(e, t) {
		this.log.push({
			t: this.t,
			type: e,
			detail: t
		}), this.log.length > 2e3 && this.log.splice(0, 500);
	}
	blinkMean() {
		return 60 / o[this.state];
	}
	scheduleBlink() {
		this.blink.mean = this.blinkMean(), this.blink.next = this.t + y(this.r, s, this.blink.mean / s);
	}
	rescaleBlink() {
		let e = this.blinkMean(), t = this.blink.mean || e;
		!this.blink.active && this.blink.next > this.t && (this.blink.next = this.t + (this.blink.next - this.t) * (e / t)), this.blink.mean = e;
	}
	blinkNow(e = .6) {
		this.t - this.blink.lastEnd < .6 || this.blink.active || this.blink.next - this.t > e * this.blink.mean || (this.blink.next = this.t);
	}
	look(e, t, n, r, i) {
		let a = Math.hypot(t - this.gaze.yaw, n - this.gaze.pitch) > 15;
		e === "child" && this.gaze.mode !== "child" && (this.contactSince = this.t), this.gaze = {
			mode: e,
			yaw: t,
			pitch: n,
			until: this.t + r,
			reason: i
		}, this.ev("gaze", i), a && this.r() < .6 && this.blinkNow(1);
	}
	lookChild(e) {
		this.look("child", 0, 0, 1e9, e);
	}
	avert(e, t) {
		let n = this.r(), r = e === "cognitive" ? n < .45 ? "up" : n < .8 ? "side" : "down" : n < .55 ? "side" : n < .8 ? "down" : "up", i = this.r() < .5 ? -1 : 1, [a, o] = r === "up" ? [i * 4, 10] : r === "side" ? [i * 12, 0] : [i * 3, -8];
		this.look("avert", a, o, t, `${e}:${r}`);
	}
	arm(e, t = 1) {
		this.state === "speaking" ? this.emote(e, t) : this.armed = {
			emotion: e,
			intensity: t
		};
	}
	lookAt(e, t, n, r = "work") {
		if (this.state === "listening" || this.state === "thinking") return;
		let i = this.t < 0 ? 0 : this.t;
		this.gaze = {
			mode: "avert",
			yaw: x(e, -40, 40),
			pitch: x(t, -25, 20),
			until: i + Math.max(.3, Math.min(3, n)),
			reason: `look:${r}`
		}, this.ev("gaze", `look:${r}`), this.nextAvert = Math.max(this.nextAvert, i + n + 1);
	}
	voiceEvent(e) {
		e === "breath" ? this.impulse(-1.2) : e === "laugh" ? (this.emote("warm", 2), this.impulse(2)) : e === "hum" && this.state !== "listening" && this.avert("cognitive", .9);
	}
	emote(e, t) {
		this.emo = {
			kind: e,
			I: Math.min(t, 3) / 3 * this.scale,
			t0: this.t,
			env: m[e].env
		}, this.ev("emote", e);
	}
	release(e) {
		this.emo = {
			kind: this.emo.kind,
			I: this.emoLevel(),
			t0: this.t,
			env: [
				1,
				0,
				e
			]
		};
	}
	emoLevel() {
		let { t0: e, env: [t, n, r], I: i } = this.emo, a = (this.t - e) * 1e3;
		return a < t ? i * (.5 - .5 * Math.cos(Math.PI * a / t)) : a < t + n ? i : a < t + n + r ? i * (.5 + .5 * Math.cos(Math.PI * (a - t - n) / r)) : 0;
	}
	impulse(e) {
		this.nod.v += e / p;
	}
	setState(e) {
		if (e === this.state) return;
		let t = this.state;
		this.ev("state", e), this.state = e, this.stateT = this.t;
		let n = this.r;
		e === "speaking" ? (this.armed &&= (this.emote(this.armed.emotion, this.armed.intensity), null), this.brow = {
			t0: this.t + .05,
			amp: .22
		}, this.gaze.mode === "avert" && (this.gaze.until = this.t + v(n, [.75, .3], .2, 1.5)), this.nextAvert = this.t + v(n, [4.75, 1.39], 1.5), t === "listening" && this.release(200)) : e === "your_turn" ? (this.lean = 1, this.lookChild("ring"), this.nextAvert = this.t + v(n, [7.21, 1.88], 3)) : e === "listening" ? (this.lean = .5, t === "speaking" && (this.release(200), this.brow = {
			t0: this.t,
			amp: .15
		}, this.nod.v = 0), this.lookChild("listen"), this.nextAvert = this.t + v(n, [7.21, 1.88], 3)) : e === "thinking" ? (this.lean = .2, this.release(300), this.thinkAvertAt = this.t + v(n, [.3, .1], .1, .6)) : this.lean = 0, this.rescaleBlink();
	}
	update(e, t = {}) {
		this.t < 0 && (this.t = e, this.contactSince = e, this.scheduleBlink(), this.nextAvert = e + 2 + this.r() * 2, this.nextMicro = e + 1);
		let n = Math.max(0, Math.min(.2, e - this.t));
		this.t = e;
		let r = this.r, i = t.herRms ?? 0, a = this.rms;
		a.fast += (1 - Math.exp(-n / .03)) * (i - a.fast), i > .01 && (a.slow += (1 - Math.exp(-n / 1.5)) * (i - a.slow));
		let o = t.herVoiced ?? a.fast > .012;
		this.state === "speaking" && (!o && this.herVoiced && (this.herPauseT0 = e), !o && this.herPauseT0 > 0 && e - this.herPauseT0 > .15 && !this.pauseHandled && (this.pauseHandled = !0, this.blinkNow(.6), this.gaze.mode === "child" && r() < .35 && this.avert("floor", v(r, [2.3, 1.1], .8, 3))), o && (this.pauseHandled = !1, this.gaze.reason.startsWith("floor") && !this.herVoiced && (this.gaze.until = e + v(r, [1.27, .51], .3, 2.5))), o && a.fast > a.slow * 1.6 && e - a.lastAccent > .35 && (a.lastAccent = e, this.impulse(Math.min(3, 1.5 * a.fast / a.slow / 1.6)), a.fast > a.slow * 2.2 && e - this.brow.t0 > 1.2 && r() < .35 && (this.brow = {
			t0: e,
			amp: .18
		}))), this.herVoiced = o;
		let s = this.gaze;
		if (this.state === "thinking" && this.thinkAvertAt && e >= this.thinkAvertAt && (this.thinkAvertAt = 0, this.avert("cognitive", Math.min(3.5, v(r, [3.54, 1.26], 1)))), s.mode !== "child" && e >= s.until && this.lookChild("return"), this.gaze.mode === "child" && this.state !== "thinking") {
			let t = e - this.contactSince >= 3.95;
			(e >= this.nextAvert || t) && (this.state === "speaking" ? (this.avert("intimacy", v(r, [1.96, .32], .6)), this.nextAvert = e + v(r, [4.75, 1.39], 1.5)) : (this.avert("intimacy", v(r, [1.14, .27], .5)), this.nextAvert = e + v(r, [7.21, 1.88], 3)));
		}
		if (!this.reduced && e >= this.nextMicro) {
			let t = v(r, [2, .6], 1.5, 3), n = r() * 2 * Math.PI;
			this.micro = [t * Math.cos(n), t * Math.sin(n) * .6], this.nextMicro = e + v(r, [1.2, .4], .4);
		}
		this.reduced && (this.micro = [0, 0]);
		let l = this.gaze.yaw + this.micro[0] * .5, u = this.gaze.pitch + this.micro[1] * .5, d = this.blink;
		!d.active && e >= d.next && (d.active = !0, d.t0 = e, this.ev("blink"));
		let f = 0;
		if (d.active) {
			let t = (e - d.t0) * 1e3;
			f = t < c.close ? t / c.close : t < c.close + c.hold ? 1 : b(1 - (t - c.close - c.hold) / c.open), t >= c.close + c.hold + c.open && (d.active = !1, d.lastEnd = e, !d.queueDouble && r() < .12 ? (d.queueDouble = !0, d.next = e + .12) : (d.queueDouble = !1, this.scheduleBlink()));
		}
		g(this.nod, n);
		let p = this.reduced ? .3 : this.gentle ? .5 : 1, _ = this.emoLevel(), y = this.state === "your_turn" ? .5 : this.state === "listening" ? .7 : 1, S = (this.state === "speaking" ? 1.5 : 1) * y * p * this.headGain, C = this.drift, w = [
			.31,
			.23,
			.17
		].map((t, n) => Math.sin(2 * Math.PI * t * e + C[n]) * .6 + Math.sin(2 * Math.PI * t * 2.71 * e + C[n] * 1.3) * .4), T = this.emo.kind ? m[this.emo.kind] : null, E = (this.state === "listening" ? 4 : 0) + (T && this.emo.I > 0 ? T.tilt * _ / this.emo.I : 0);
		this.tilt += (1 - Math.exp(-n / .4)) * (E * p - this.tilt), this.leanV += (1 - Math.exp(-n / .35)) * ((this.reduced ? .3 : 1) * this.lean - this.leanV);
		let D = x(l, -25, 25), O = x(u, -25, 20), k = l - D, A = Math.abs(D) > 15 ? D - Math.sign(D) * 10 : D * .3;
		this.headYaw += (1 - Math.exp(-n / .25)) * (A * p + k - this.headYaw);
		let j = (this.reduced ? .3 : this.gentle ? .5 : 1) * this.scale * this.headGain, M = [
			x(this.nod.x * j + w[0] * S - 3 * this.leanV - O * .2 * p, -20, 20),
			x(this.headYaw + w[1] * S, -20, 20),
			x(this.tilt + w[2] * S * .6, -20, 20)
		], N = this.brow, P = (e - N.t0) * 1e3, F = P < 0 ? 0 : P < 80 ? N.amp * P / 80 : P < 320 ? N.amp : P < 520 ? N.amp * (1 - (P - 320) / 200) : 0, ee = this.reduced ? .3 : 1, I = {}, te = (e, t) => {
			I[e + "Left"] = (I[e + "Left"] ?? 0) + t * this.asym, I[e + "Right"] = (I[e + "Right"] ?? 0) + t / this.asym;
		};
		if (T) for (let [e, t] of Object.entries(T.bs)) {
			let n = t * _ * ee;
			e === "mouthSmile" && (n *= this.smileGain / .7), this.gentle && h.has(e) && (n *= .5), e.startsWith("brow") && (n *= this.browGain), e === "browInnerUp" ? I.browInnerUp = (I.browInnerUp ?? 0) + n : te(e, n);
		}
		te("mouthSmile", (this.state === "thinking" ? .03 : this.state === "speaking" ? .06 : .1) * this.smileGain * (this.gentle ? .5 : 1)), te("browOuterUp", F * this.browGain), I.browInnerUp = (I.browInnerUp ?? 0) + (F * .8 + (this.state === "listening" ? .08 : 0)) * this.browGain;
		let ne = Math.max(I.eyeSquintLeft ?? 0, I.eyeSquintRight ?? 0) * .3, L = Math.max(f, ne);
		I.eyeBlinkLeft = L, I.eyeBlinkRight = L;
		for (let e in I) I[e] = b(I[e]);
		return {
			t: e,
			state: this.state,
			bs: I,
			head: M,
			gaze: [D, O],
			lean: this.leanV,
			gazeMode: this.gaze.mode
		};
	}
	inStateFor() {
		return this.t - this.stateT;
	}
}, w = /* @__PURE__ */ new Set([
	"jawOpen",
	"mouthClose",
	"mouthFunnel",
	"mouthPucker",
	"mouthStretchLeft",
	"mouthStretchRight",
	"mouthRollLower",
	"mouthRollUpper",
	"mouthUpperUpLeft",
	"mouthUpperUpRight",
	"mouthLowerDownLeft",
	"mouthLowerDownRight",
	"tongueOut"
]), T = /* @__PURE__ */ new Set(["eyeBlinkLeft", "eyeBlinkRight"]), E = .06, D = (e) => e < 0 ? 0 : e > 1 ? 1 : e, O = class {
	prev = {};
	closure = 0;
	jawCeiling;
	constructor(e = .85) {
		this.jawCeiling = e;
	}
	reset() {
		this.prev = {}, this.closure = 0;
	}
	compose(e, t, n) {
		let r = {};
		for (let [t, n] of Object.entries(e)) w.has(t) || (r[t] = n);
		for (let [e, n] of Object.entries(t)) r[e] = (r[e] ?? 0) + n;
		let i = Math.min(D(r.jawOpen ?? 0), this.jawCeiling);
		r.jawOpen = i, r.mouthClose = Math.min(D(r.mouthClose ?? 0), i);
		let a = +(t.jawOpen !== void 0 && i < .04 && (t.mouthClose ?? 0) > 0), o = a > this.closure ? .06 : .12;
		this.closure += (1 - Math.exp(-n / o)) * (a - this.closure);
		let s = 1 - .6 * this.closure;
		for (let e of ["mouthSmileLeft", "mouthSmileRight"]) r[e] !== void 0 && (r[e] *= s);
		for (let e of Object.keys(r)) {
			let t = D(r[e]);
			if (!w.has(e) && !T.has(e)) {
				let n = this.prev[e] ?? 0;
				t = Math.max(n - E, Math.min(n + E, t));
			}
			r[e] = t < .01 ? 0 : t;
		}
		for (let [e, t] of Object.entries(this.prev)) if (r[e] === void 0 && !w.has(e) && !T.has(e) && t > 0) {
			let n = Math.max(0, t - E);
			n >= .01 && (r[e] = n);
		}
		return this.prev = r, r;
	}
}, k = "#version 300 es\nin vec2 aPos; in vec2 aUv;\nuniform vec2 uView; uniform vec4 uCam; // cam: x0, y0, scale, flipY\nout vec2 vUv; out vec2 vRest;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vUv = aUv;\n}", A = "#version 300 es\nprecision mediump float;\nin vec2 vUv;\nuniform sampler2D uTex; uniform float uAlpha; uniform vec4 uShade; // shade: dirX, x0, x1, amount\nuniform vec4 uRect; // texture rect in rest space (x0,y0,w,h) for shading position\nuniform vec4 uTint; // debug: rgb, amount\nout vec4 o;\nvoid main(){\n  vec4 c = texture(uTex, vUv);\n  float x = uRect.x + vUv.x * uRect.z;\n  float s = clamp((x - uShade.y) / (uShade.z - uShade.y), 0.0, 1.0);\n  s = uShade.x > 0.0 ? s : 1.0 - s;\n  c.rgb *= 1.0 - uShade.w * s * s;\n  c.rgb = mix(c.rgb, uTint.rgb * c.a, uTint.a);\n  o = c * uAlpha;\n}", j = "#version 300 es\nin vec2 aPos; in vec2 aRest; in float aEdge; in float aTop;\nuniform vec2 uView; uniform vec4 uCam;\nout vec2 vRest; out float vEdge; out float vTop; out vec2 vScr;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vRest = aRest; vEdge = aEdge; vTop = aTop; vScr = aPos;\n}", M = "#version 300 es\nprecision highp float;\nin vec2 vRest; in float vEdge; in float vTop; in vec2 vScr;\nuniform vec2 uIrisScr; uniform vec2 uCatchScr; uniform float uIrisK; uniform vec2 uCatchC;\nuniform sampler2D uSclera; uniform vec4 uScleraRect;\nuniform sampler2D uIris; uniform vec4 uIrisRect;\nuniform sampler2D uCatch; uniform vec4 uCatchRect;\nuniform vec2 uIrisOff; uniform vec2 uIrisC; uniform vec2 uIrisScale; uniform vec2 uCatchOff; uniform float uCatchA;\nuniform float uLidShade; uniform float uTopY;\nout vec4 o;\nvec4 tex(sampler2D t, vec4 r, vec2 p){\n  vec2 uv = (p - r.xy) / r.zw;\n  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);\n  return texture(t, uv);\n}\nvoid main(){\n  vec4 s = tex(uSclera, uScleraRect, vRest);\n  vec3 col = s.a > 0.0 ? s.rgb / s.a : vec3(0.95);\n  // r3: the iris and the catchlight are placed in SCREEN space and scaled uniformly: they translate with the gaze and\n  // the turn but never squash anisotropically (r2's far eye at yaw 20 became a vertical oval)\n  vec2 ip = uIrisC + (vScr - uIrisScr) / (uIrisK * uIrisScale);\n  vec4 ir = tex(uIris, uIrisRect, ip);\n  col = col * (1.0 - ir.a) + ir.rgb;\n  // lid shadow: the band right under the upper lid darkens a little (wraps the eye)\n  // r2: per-column lid line (vTop), a soft wrap shadow ~10 px deep under the whole lid, as in c-front\n  float dl = clamp((vRest.y - vTop - 2.0) / 9.0, 0.0, 1.0);\n  col *= 1.0 - uLidShade * (1.0 - dl) * (1.0 - dl);\n  vec4 cl = tex(uCatch, uCatchRect, uCatchC + (vScr - uCatchScr) / uIrisK);\n  col = mix(col, vec3(1.0), cl.a * uCatchA);\n  float a = clamp(vEdge, 0.0, 1.0);\n  o = vec4(col * a, a);\n}", N = "#version 300 es\nin vec2 aPos; in vec2 aUv; in float aA; in float aL;\nuniform vec2 uView; uniform vec4 uCam;\nout vec2 vUv; out float vA; out float vL;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vUv = aUv; vA = aA; vL = aL;\n}", P = "#version 300 es\nprecision mediump float;\nin vec2 vUv; in float vA; in float vL;\nuniform sampler2D uTex; uniform vec4 uShade; uniform vec4 uRect;\nout vec4 o;\nvoid main(){\n  vec4 c = texture(uTex, vUv);\n  float x = uRect.x + vUv.x * uRect.z;\n  float s = clamp((x - uShade.y) / (uShade.z - uShade.y), 0.0, 1.0);\n  s = uShade.x > 0.0 ? s : 1.0 - s;\n  c.rgb *= (1.0 - uShade.w * s * s) * vL;\n  o = c * vA;\n}", F = "#version 300 es\nin vec2 aPos; in float aS; in float aDT; in float aGap;\nuniform vec2 uView; uniform vec4 uCam;\nout float vS; out float vDT; out float vGap;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vS = aS; vDT = aDT; vGap = aGap;\n}", ee = "#version 300 es\nprecision highp float;\nin float vS; in float vDT; in float vGap;\nuniform sampler2D uTex;\nuniform vec4 uTeeth;   // upper shown 0..1, lower shown 0..1, teeth height px, -\nuniform vec4 uTongue;  // body height share, tip, curl, -\nuniform float uShadeK;\nout vec4 o;\nvec3 rowc(float row, float u){ vec4 c = texture(uTex, vec2(u, (row + 0.5) / 64.0)); return c.rgb / max(c.a, 0.001); }\n// r4 (judge r3 fix 2): the teeth's free edge is the PAINTED contour's smooth fit (rows 12.9 - 2.7u^2 - 0.3u^4 of the\n// 16-row strip, interior-r4.py), drawn with an analytic coverage ramp one screen pixel wide: no ragged alpha, no shimmer\nfloat contourRows(float u){ return 12.9 - 2.7 * u * u - 0.3 * u * u * u * u; }\nvoid main(){\n  float gap = max(vGap, 0.001);\n  float dt = vDT, db = gap - vDT;\n  float a = abs(vS);\n  float u = clamp(vS * 0.5 + 0.5, 0.0, 1.0);\n  float px = max(fwidth(vDT), 0.35);          // one screen pixel in rest px\n  // cavity: roof (dark) to floor\n  vec3 col = rowc(32.0 + clamp(dt / gap, 0.0, 1.0) * 15.0, u);\n  col = col * 1.22 + vec3(0.035, 0.012, 0.01);   // r4: the refs' cavity is a warm brown, not a black-maroon hole\n  col *= 1.0 - 0.35 * pow(a, 3.0);\n  // ---- tongue: body mound on the floor; tip = a rounded LOBE that rises to the upper teeth (t d n l); curl = the\n  // retroflex underside up at the palate\n  float th = uTeeth.z, rp = 12.0 / th;\n  float upVis = th * uTeeth.x * contourRows(0.0) / 12.0;          // upper teeth hanging at the centre (px)\n  float mound = min(gap * uTongue.x, 7.0 + 0.12 * gap) * pow(max(0.0, 1.0 - pow(vS / 0.85, 2.0)), 0.8);\n  float lw = 0.40;                                                // lobe half-width (s units)\n  float lob = max(0.0, 1.0 - pow(vS / lw, 2.0));\n  // r4b: a soft DOME (wider at the base), not a flat-sided tombstone\n  float tipH = max(0.0, gap - upVis * 0.35) * uTongue.y * pow(lob, 0.85);\n  float curl = gap * 0.78 * uTongue.z * exp(-pow(vS / 0.3, 2.0));\n  float h = max(mound, max(tipH, curl));\n  if (h > 0.4) {\n    float cov = clamp((h - db) / px + 0.5, 0.0, 1.0);\n    bool isTip = tipH >= max(mound, curl) - 0.01 && uTongue.y > 0.05;\n    // r4b: the lobe samples the strip near its centre (the strip's column texture showed as vertical stripes on it)\n    vec3 t = rowc(48.0 + clamp(1.0 - db / max(h, 0.5), 0.0, 1.0) * 15.0, isTip ? 0.5 + vS * 0.15 : u);\n    // r4b: a pink-red tongue, distinct from the orange lip (it read as a second lower lip)\n    t *= 0.86 * vec3(1.0, 0.80, 0.86) * (1.0 - 0.3 * pow(a / 0.8, 2.0));\n    t *= mix(0.86, 1.04, smoothstep(0.0, 0.7 * max(h, 0.5), h - db));\n    if (isTip) {\n      // the lobe: lit on top, a soft groove down its middle, shadowed where it meets the cavity at the sides\n      // r4b: rounded like the Memoji shading: cylindrical falloff to the sides, a soft lit crown, a faint groove\n      float top = clamp((h - db) / 4.0, 0.0, 1.0);\n      t *= mix(1.08, 1.0, top) * mix(0.84, 1.03, sqrt(lob)) * (1.0 - 0.04 * exp(-pow(vS / 0.06, 2.0)) * top);\n    }\n    if (curl > max(mound, tipH) - 0.01 && uTongue.z > 0.05) {\n      vec3 under = t * vec3(0.72, 0.62, 0.68);\n      t = mix(under, t * 1.08, 1.0 - smoothstep(0.0, 1.4, h - db));\n    }\n    // a contact shadow just outside the tongue's edge keeps it legible against the cavity at 1x\n    col *= 1.0 - 0.25 * clamp(1.0 - abs(h - db) / 2.0, 0.0, 1.0) * (1.0 - cov);\n    col = mix(col, t, cov);\n  }\n  // ---- lower teeth (bottom-anchored on the lower lip), then upper teeth (hang from the upper lip, slide up as they hide)\n  float lwT = 0.52, uwT = 0.76;\n  float gapT = smoothstep(1.5, 4.0, gap);   // no teeth through a 1-2 px slit (it showed as a dotted sliver)     // the rows are narrower than the lip span: the corners recede into shadow\n  if (a < lwT && uTeeth.y > 0.01) {\n    float ul = clamp((vS / lwT) * 0.5 + 0.5, 0.0, 1.0);\n    float hL = th * 0.8 * smoothstep(0.2, 0.5, uTeeth.y) * contourRows(vS / lwT) / 12.0;       // visible height above the lower lip\n    float cov = clamp((hL - db) / px + 0.5, 0.0, 1.0) * (1.0 - smoothstep(lwT - 0.12, lwT, a)) * gapT;\n    float row = 31.0 - clamp(db * rp, 0.0, contourRows(vS / lwT) - 2.5);\n    vec3 lt = rowc(row, ul) * (1.0 - 0.3 * pow(a / lwT, 2.0));\n    col = mix(col, lt, cov);\n  }\n  if (a < uwT && uTeeth.x > 0.01) {\n    float uu = clamp((vS / uwT) * 0.5 + 0.5, 0.0, 1.0);\n    float cr = contourRows(vS / uwT);\n    float hU = th * cr / 12.0 - (1.0 - uTeeth.x) * th;                 // visible height below the upper lip\n    float cov = clamp((hU - dt) / px + 0.5, 0.0, 1.0) * (1.0 - smoothstep(uwT - 0.14, uwT, a)) * gapT;\n    float row = clamp((dt + (1.0 - uTeeth.x) * th) * rp, 0.0, cr - 2.5);\n    vec3 ut = rowc(row, uu) * 1.08 * (1.0 - 0.3 * pow(a / uwT, 2.0));\n    // the free edge catches a whisper of shadow (painted teeth have it), inside the coverage ramp only\n    ut *= 1.0 - 0.08 * clamp(1.0 - (hU - dt) / 1.6, 0.0, 1.0);\n    col = mix(col, ut, cov);\n  }\n  // the upper lip's shadow on whatever sits right under it\n  col *= mix(0.78, 1.0, smoothstep(0.0, 2.5, dt));\n  // r4b: a near-closed seam is the lip LINE (dark warm brown), fully opaque from gap 0.8 px, so the face layer never\n  // leaks through between the lip sheet's fading inner row and the interior (it showed as orange dots per mesh column)\n  col = mix(vec3(0.36, 0.17, 0.13), col, smoothstep(1.2, 3.5, gap));\n  float al = clamp((gap - 0.25) / 0.55, 0.0, 1.0);        // zero-gap columns (past the corners) still draw nothing\n  o = vec4(col * uShadeK * al, al);\n}";
function I(e, t, n) {
	let r = e.createProgram();
	for (let [i, a] of [[e.VERTEX_SHADER, t], [e.FRAGMENT_SHADER, n]]) {
		let t = e.createShader(i);
		if (e.shaderSource(t, a), e.compileShader(t), !e.getShaderParameter(t, e.COMPILE_STATUS)) throw Error(e.getShaderInfoLog(t));
		e.attachShader(r, t);
	}
	if (e.linkProgram(r), !e.getProgramParameter(r, e.LINK_STATUS)) throw Error(e.getProgramInfoLog(r));
	let i = {}, a = e.getProgramParameter(r, e.ACTIVE_UNIFORMS);
	for (let t = 0; t < a; t++) {
		let n = e.getActiveUniform(r, t);
		i[n.name] = e.getUniformLocation(r, n.name);
	}
	return {
		p: r,
		u: i
	};
}
var te = class {
	constructor(e, { clear: t = [
		.98,
		.9,
		.74
	], preserve: n = !1 } = {}) {
		let r = e.getContext("webgl2", {
			alpha: !1,
			antialias: !1,
			premultipliedAlpha: !0,
			preserveDrawingBuffer: n,
			powerPreference: "high-performance"
		});
		if (!r) throw Error("WebGL2 unavailable");
		this.gl = r, this.canvas = e, this.clear = t, this.paint = I(r, k, A), this.eye = I(r, j, M), this.lip = I(r, N, P), this.inner = I(r, F, ee), r.enable(r.BLEND), r.blendFunc(r.ONE, r.ONE_MINUS_SRC_ALPHA), r.disable(r.DEPTH_TEST), this.cam = [
			0,
			0,
			1,
			0
		], this.draws = 0, this.tris = 0;
	}
	texture(e, t = !0) {
		let n = this.gl, r = n.createTexture();
		return n.bindTexture(n.TEXTURE_2D, r), n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !0), n.texImage2D(n.TEXTURE_2D, 0, n.RGBA, n.RGBA, n.UNSIGNED_BYTE, e), t && n.generateMipmap(n.TEXTURE_2D), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, t ? n.LINEAR_MIPMAP_LINEAR : n.LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE), r;
	}
	mesh(e, t, n) {
		let r = this.gl, i = r.createVertexArray();
		r.bindVertexArray(i);
		let a = {};
		for (let [n, { data: i, size: o, dynamic: s }] of Object.entries(t)) {
			let t = r.getAttribLocation(e.p, n), c = r.createBuffer();
			r.bindBuffer(r.ARRAY_BUFFER, c), r.bufferData(r.ARRAY_BUFFER, i, s ? r.DYNAMIC_DRAW : r.STATIC_DRAW), t >= 0 && (r.enableVertexAttribArray(t), r.vertexAttribPointer(t, o, r.FLOAT, !1, 0, 0)), a[n] = c;
		}
		let o = r.createBuffer();
		return r.bindBuffer(r.ELEMENT_ARRAY_BUFFER, o), r.bufferData(r.ELEMENT_ARRAY_BUFFER, n, r.STATIC_DRAW), r.bindVertexArray(null), {
			vao: i,
			bufs: a,
			count: n.length
		};
	}
	update(e, t, n) {
		let r = this.gl;
		r.bindBuffer(r.ARRAY_BUFFER, e.bufs[t]), r.bufferSubData(r.ARRAY_BUFFER, 0, n);
	}
	begin() {
		let e = this.gl, t = this.dpr || 1, n = Math.round(this.canvas.clientWidth * t), r = Math.round(this.canvas.clientHeight * t);
		(this.canvas.width !== n || this.canvas.height !== r) && (this.canvas.width = n, this.canvas.height = r), e.viewport(0, 0, this.canvas.width, this.canvas.height), e.clearColor(this.clear[0], this.clear[1], this.clear[2], 1), e.clear(e.COLOR_BUFFER_BIT), this.draws = 0, this.tris = 0;
	}
	setCam(e, t, n) {
		this.cam = [
			e,
			t,
			this.canvas.width / n,
			0
		];
	}
	drawPaint(e, t, n, r = 1, i = [
		1,
		0,
		1,
		0
	], a = null) {
		if (r <= .001) return;
		let o = this.gl, s = this.paint;
		o.useProgram(s.p), o.uniform4fv(s.u.uTint, a || [
			0,
			0,
			0,
			0
		]), o.uniform2f(s.u.uView, this.canvas.width, this.canvas.height), o.uniform4fv(s.u.uCam, this.cam), o.uniform1f(s.u.uAlpha, r), o.uniform4fv(s.u.uShade, i), o.uniform4f(s.u.uRect, n[0], n[1], n[2] - n[0], n[3] - n[1]), o.activeTexture(o.TEXTURE0), o.bindTexture(o.TEXTURE_2D, t), o.uniform1i(s.u.uTex, 0), o.bindVertexArray(e.vao), o.drawElements(o.TRIANGLES, e.count, o.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
	drawLip(e, t, n, r = [
		1,
		0,
		1,
		0
	]) {
		let i = this.gl, a = this.lip;
		i.useProgram(a.p), i.uniform2f(a.u.uView, this.canvas.width, this.canvas.height), i.uniform4fv(a.u.uCam, this.cam), i.uniform4fv(a.u.uShade, r), i.uniform4f(a.u.uRect, n[0], n[1], n[2] - n[0], n[3] - n[1]), i.activeTexture(i.TEXTURE0), i.bindTexture(i.TEXTURE_2D, t), i.uniform1i(a.u.uTex, 0), i.bindVertexArray(e.vao), i.drawElements(i.TRIANGLES, e.count, i.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
	drawInner(e, t, n, r, i = 1) {
		let a = this.gl, o = this.inner;
		a.useProgram(o.p), a.uniform2f(o.u.uView, this.canvas.width, this.canvas.height), a.uniform4fv(o.u.uCam, this.cam), a.uniform4fv(o.u.uTeeth, n), a.uniform4fv(o.u.uTongue, r), a.uniform1f(o.u.uShadeK, i), a.activeTexture(a.TEXTURE0), a.bindTexture(a.TEXTURE_2D, t), a.uniform1i(o.u.uTex, 0), a.bindVertexArray(e.vao), a.drawElements(a.TRIANGLES, e.count, a.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
	drawEye(e, t) {
		let n = this.gl, r = this.eye;
		n.useProgram(r.p), n.uniform2f(r.u.uView, this.canvas.width, this.canvas.height), n.uniform4fv(r.u.uCam, this.cam);
		let i = (e, t, i, a, o) => {
			n.activeTexture(n.TEXTURE0 + e), n.bindTexture(n.TEXTURE_2D, i), n.uniform1i(r.u[t], e), n.uniform4f(r.u[o], a[0], a[1], a[2] - a[0], a[3] - a[1]);
		};
		i(0, "uSclera", t.sclera.tex, t.sclera.rect, "uScleraRect"), i(1, "uIris", t.iris.tex, t.iris.rect, "uIrisRect"), i(2, "uCatch", t.catch.tex, t.catch.rect, "uCatchRect"), n.uniform2fv(r.u.uIrisC, t.irisC), n.uniform2fv(r.u.uIrisScale, t.irisScale), n.uniform2fv(r.u.uIrisScr, t.irisScr), n.uniform2fv(r.u.uCatchScr, t.catchScr), n.uniform2fv(r.u.uCatchC, t.catchC), n.uniform1f(r.u.uIrisK, t.irisK), n.uniform1f(r.u.uCatchA, t.catchA), n.uniform1f(r.u.uLidShade, t.lidShade), n.uniform1f(r.u.uTopY, t.topY), n.bindVertexArray(e.vao), n.drawElements(n.TRIANGLES, e.count, n.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
}, ne = (e, t, n) => e < t ? t : e > n ? n : e, L = (e) => ne(e, 0, 1), R = (e, t, n) => {
	let r = L((n - e) / (t - e));
	return r * r * (3 - 2 * r);
}, re = 448, z = [
	585,
	584,
	584,
	587,
	589,
	592,
	594,
	596,
	597,
	599,
	600,
	601,
	602,
	603,
	604,
	604,
	605,
	605,
	606,
	606,
	606,
	606,
	606,
	605,
	605,
	604,
	603,
	602,
	601,
	600,
	598,
	597,
	596,
	594,
	592,
	589,
	587,
	584,
	580,
	576,
	576,
	575
], B = {
	cx: 530,
	hwL: 64,
	hwR: 66,
	tU: 13.5,
	tL: 21,
	cy: 606
};
function ie(e) {
	let t = (e - re) / 4;
	if (t <= 0) return z[0];
	if (t >= z.length - 1) return z[z.length - 1];
	let n = Math.floor(t), r = t - n;
	return z[n] * (1 - r) + z[n + 1] * r;
}
var ae = ie(B.cx + 4), V = (e) => (e - B.cx) / (e < B.cx ? B.hwL : B.hwR), oe = (e) => e >= 1 ? 0 : B.tU * (1 - e * e) ** .55, se = (e) => e >= 1 ? 0 : B.tL * Math.max(0, 1 - e ** 2.2) ** .75, H = {
	g: 0,
	up: .3,
	W: 1,
	flat: 0,
	round: 0,
	press: 0,
	T: .7,
	TL: .15,
	th: .25,
	tip: 0,
	curl: 0,
	tuck: 0
}, ce = {
	viseme_sil: { ...H },
	viseme_PP: {
		...H,
		W: .9,
		flat: .5,
		press: 1,
		T: 0
	},
	viseme_FF: {
		...H,
		g: 9,
		up: 0,
		W: 1,
		T: 1,
		TL: 0,
		tuck: 1
	},
	viseme_TH: {
		...H,
		g: 13,
		up: .35,
		W: 1,
		T: .8,
		TL: .5,
		tip: 1,
		th: .5
	},
	viseme_DD: {
		...H,
		g: 17,
		up: .3,
		W: .98,
		T: .55,
		TL: .1,
		tip: 1
	},
	viseme_kk: {
		...H,
		g: 19,
		up: .3,
		W: .96,
		T: .65,
		TL: .15,
		th: .72
	},
	viseme_CH: {
		...H,
		g: 10,
		up: .45,
		W: .8,
		flat: .55,
		round: .6,
		T: 1,
		TL: .95
	},
	viseme_SS: {
		...H,
		g: 6,
		up: .45,
		W: 1.06,
		T: 1,
		TL: 1
	},
	viseme_nn: {
		...H,
		g: 15,
		up: .3,
		W: .98,
		T: .55,
		TL: .1,
		tip: 1
	},
	viseme_RR: {
		...H,
		g: 12,
		up: .35,
		W: .82,
		flat: .5,
		round: .55,
		T: .5,
		TL: .15,
		tip: .5
	},
	viseme_aa: {
		...H,
		g: 56,
		up: .2,
		W: .97,
		flat: .25,
		round: .3,
		T: .95,
		TL: .15,
		th: .35
	},
	viseme_E: {
		...H,
		g: 17,
		up: .35,
		W: 1.1,
		T: 1,
		TL: .55
	},
	viseme_I: {
		...H,
		g: 9,
		up: .4,
		W: 1.08,
		T: 1,
		TL: .75
	},
	viseme_O: {
		...H,
		g: 28,
		up: .4,
		W: .7,
		flat: .85,
		round: 1,
		T: .35,
		TL: .05
	},
	viseme_U: {
		...H,
		g: 20,
		up: .45,
		W: .6,
		flat: .9,
		round: 1,
		T: 0,
		TL: 0,
		th: .3
	}
}, U = Object.keys(H), le = {
	g: .022,
	up: .03,
	W: .04,
	flat: .04,
	round: .04,
	press: .02,
	T: .03,
	TL: .03,
	th: .03,
	tip: .018,
	curl: .03,
	tuck: .02
}, ue = class {
	constructor() {
		this.p = { ...H }, this.side = {
			L: {
				wid: 0,
				dy: 0,
				crease: 1
			},
			R: {
				wid: 0,
				dy: 0,
				crease: 1
			}
		}, this.shift = 0, this.first = !0, this.t = 0, this.holdPP = -1, this.holdTip = -1;
	}
	solve(e, t) {
		this.t += t;
		let n = (t) => e[t] ?? 0, r = L(n("jawOpen") / .85), i = Math.max(n("mouthFunnel"), n("mouthPucker")), a = (n("mouthStretchLeft") + n("mouthStretchRight")) / 2, o = {
			...H,
			g: 44 * r,
			up: .24,
			W: 1 - .36 * i + .08 * a,
			flat: .85 * i,
			round: L(i * 1.2 + .2 * r),
			T: .4 + .55 * r,
			TL: .1 + .3 * a,
			th: .25
		}, s = 0, c = {};
		for (let e of U) c[e] = 0;
		for (let e in ce) {
			let t = n(e);
			if (!(t <= .01)) {
				s += t;
				for (let n of U) c[n] += t * ce[e][n];
			}
		}
		let l = {};
		if (s > 0) for (let e of U) c[e] /= s;
		let u = Math.min(1, s);
		for (let e of U) l[e] = s > 0 ? o[e] * (1 - u) + c[e] * u : o[e];
		s > 0 && (l.g *= .8 + .4 * L(r / .45));
		let d = n("viseme_PP"), f = n("viseme_FF"), p = R(.6, .92, d);
		p > 0 && (l.g *= 1 - p, l.press = Math.max(l.press, p), l.tuck *= 1 - p, l.W = l.W * (1 - p) + .9 * p, l.flat = l.flat * (1 - p) + .5 * p, l.round *= 1 - p);
		let m = R(.25, .7, f) * (1 - p);
		m > 0 && (l.g = l.g * (1 - m) + 9 * m, l.up *= 1 - m, l.tuck = Math.max(l.tuck, m), l.T = Math.max(l.T, m), l.TL *= 1 - m, l.round *= 1 - m, l.flat *= 1 - m), p > .85 && !this.inPP && (this.inPP = !0, this.holdPP = this.t + .067), p < .5 && (this.inPP = !1), this.t < this.holdPP && (l.g = 0, l.press = Math.max(l.press, .9));
		let h = (n("eyeWideLeft") + n("eyeWideRight")) / 2;
		if (this.surprised = s < .2 && h > .45 ? L((h - .45) / .3) : 0, this.surprised > 0) {
			let e = this.surprised;
			l.round = Math.max(l.round, e), l.flat = Math.max(l.flat, .95 * e), l.W = l.W * (1 - e) + .66 * e, l.T = l.T * (1 - e) + .35 * e, l.TL = 0, l.up = .36, l.g = Math.max(l.g, 40 * e * L(r / .3));
		}
		let g = L(((n("mouthSmileLeft") + n("mouthSmileRight")) / 2 - .35) / .4) * L(r / .18) * (1 - this.surprised);
		g > 0 && (l.g += 26 * g * (1 - Math.min(1, s)), l.up *= 1 - .65 * g, l.T = Math.max(l.T, .95 * g), l.th = Math.max(l.th, .35 * g), l.W = Math.max(l.W, 1.02 * g + l.W * (1 - g))), l.tip = L(Math.max(l.tip, n("tongueTipUp"))), l.curl = L(Math.max(l.curl, n("tongueCurl"))), l.tip > .5 && !this.inTip && (this.inTip = !0, this.holdTip = this.t + .045), l.tip < .3 && (this.inTip = !1), this.t < this.holdTip && p < .5 && (l.tip = Math.max(l.tip, .85)), l.tip > .3 && (l.TL = Math.min(l.TL, .1), l.T = Math.min(l.T, .45), l.g = Math.max(l.g, 15 * l.tip * (1 - p))), l.curl > .3 && (l.T = Math.min(l.T, .5), l.TL = 0, l.g = Math.max(l.g, 15), l.up = .38), n("tongueWide") > .2 && (l.th = Math.max(l.th, .35)), l.press = L(Math.max(l.press, (n("mouthPressLeft") + n("mouthPressRight")) / 2 * 1.4));
		let _ = this.p;
		for (let e of U) {
			if (this.first) {
				_[e] = l[e];
				continue;
			}
			let n = le[e];
			e === "g" && (l.g < _.g || l.tip > .5) && (n = .014), _[e] += (1 - Math.exp(-t / n)) * (l[e] - _[e]);
		}
		this.t < this.holdPP && (_.g = Math.min(_.g, .4));
		let v = {
			L: n("mouthSmileRight"),
			R: n("mouthSmileLeft")
		}, y = {
			L: n("mouthFrownRight"),
			R: n("mouthFrownLeft")
		}, b = L((n("mouthFrownLeft") + n("mouthFrownRight")) / 2 * 4 + Math.max(0, n("browInnerUp") - .5) * 1.2), x = (e) => .22 * (1 - b) + .23 * L(e / .045) + .6 * L((e - .045) / .8), S = n("mouthLeft") - n("mouthRight"), C = Math.max(_.round, _.flat);
		for (let e of ["L", "R"]) {
			let n = x(v[e]) * (1 - .5 * C), r = (e === "L" ? B.hwL : B.hwR) * (_.W - 1) + (n - .45) * 13 * (1 - .6 * C), i = -(n - .45) * 19 * (1 - .6 * C) * (1 - .7 * this.surprised) + y[e] * 9 + _.press * 1.5, a = L((n - .16) / .29) * (1 - .7 * C), o = this.side[e], s = this.first ? 1 : 1 - Math.exp(-t / .045);
			o.wid += s * (r - o.wid), o.dy += s * (i - o.dy), o.crease += s * (a - o.crease);
		}
		let w = ne(S * 1.6, -1, 1) * 13;
		return this.shift += (this.first ? 1 : 1 - Math.exp(-t / .08)) * (w - this.shift), this.first = !1, this.sideTilt = ne(S * 1.6, -1, 1), this;
	}
	lowerDrop() {
		return this.p.g * (1 - this.p.up);
	}
	jaw() {
		return .86 * this.lowerDrop();
	}
};
function de(e, t) {
	return R(606, 660, t) * Math.exp(-(((e - 530) / 128) ** 2));
}
var fe = class {
	constructor(e) {
		this.rect = e;
		let [t, n, r, i] = e, a = [];
		for (let e = t; e <= r + .01; e += 3) a.push(Math.min(e, r));
		this.cols = a;
		let o = [
			0,
			.9,
			3,
			6,
			9,
			12,
			15,
			19,
			24,
			30,
			37,
			45,
			55
		], s = [
			0,
			.9,
			3,
			6,
			10,
			14,
			18,
			22,
			27,
			33,
			40,
			48,
			57,
			67,
			78,
			90
		];
		this.sheets = {};
		for (let [e, c, l, u] of [[
			"U",
			o,
			-1,
			n
		], [
			"L",
			s,
			1,
			i
		]]) {
			let o = a.length, s = c.length, d = new Float32Array(o * s * 2), f = new Float32Array(o * s * 2), p = new Float32Array(o * s);
			for (let e = 0; e < o; e++) {
				let o = a[e], m = ie(o);
				for (let a = 0; a < s; a++) {
					let h = m + l * c[a];
					a === s - 1 && (h = u), h = l < 0 ? Math.max(u, h) : Math.min(u, h);
					let g = e * s + a;
					d[g * 2] = o, d[g * 2 + 1] = h, f[g * 2] = (o - t) / (r - t), f[g * 2 + 1] = (h - n) / (i - n), p[g] = Math.abs(h - m);
				}
			}
			let m = new Uint16Array((o - 1) * (s - 1) * 6), h = 0;
			for (let e = 0; e < o - 1; e++) for (let t = 0; t < s - 1; t++) {
				let n = e * s + t, r = n + 1, i = n + s, a = i + 1;
				m.set([
					n,
					i,
					r,
					r,
					i,
					a
				], h), h += 6;
			}
			this.sheets[e] = {
				C: o,
				R: s,
				rest: d,
				uv: f,
				uv0: new Float32Array(f),
				d: p,
				idx: m,
				pos: new Float32Array(o * s * 2),
				alpha: new Float32Array(o * s).fill(1),
				light: new Float32Array(o * s).fill(1),
				sign: l
			};
		}
		this.IC = 49, this.inner = {
			pos: /* @__PURE__ */ new Float32Array(196),
			s: /* @__PURE__ */ new Float32Array(98),
			dt: /* @__PURE__ */ new Float32Array(98),
			gap: /* @__PURE__ */ new Float32Array(98)
		};
		let c = /* @__PURE__ */ new Uint16Array(288);
		for (let e = 0; e < 48; e++) {
			let t = e * 2;
			c.set([
				t,
				t + 2,
				t + 1,
				t + 1,
				t + 2,
				t + 3
			], e * 6);
		}
		this.inner.idx = c;
		for (let e = 0; e < 49; e++) {
			let t = (-1 + 2 * e / 48) * .995;
			this.inner.s[e * 2] = this.inner.s[e * 2 + 1] = t;
		}
	}
	edge(e, t, n) {
		let r = e.p, i = V(t), a = Math.abs(i), o = i < 0 ? e.side.L : e.side.R, s = Math.min(1, a), c = (a <= 1 ? i : Math.sign(i)) * o.wid + e.shift, l = o.dy * s ** 1.8;
		l += r.flat * .9 * (ae - ie(t)) * (a <= 1.25 ? 1 : 1 - R(1.25, 1.6, a)), l -= (e.sideTilt || 0) * i * 3 * s;
		let u = a / (1 - .16 * Math.max(r.round, r.flat * .8)), d = 2 + 2.6 * (1 - r.round), f = .9 - .3 * r.round, p = u < 1 ? Math.max(0, 1 - u ** +d) ** +f : 0, m = r.g * p;
		return n < 0 ? l -= m * r.up : l += m * (1 - r.up) - r.tuck * 2 * p, [
			c,
			l,
			m
		];
	}
	deform(e, t, n, r) {
		let i = e.p, a = t.rest[n * 2], o = t.rest[n * 2 + 1], s = t.d[n], c = t.sign, l = Math.floor(n / t.R), u = c < 0 ? this.colU : this.colL, d = u[l * 3], f = u[l * 3 + 1], p = Math.abs(V(a)), m = c < 0 ? oe(p) : se(p), h = 1 + .55 * i.round - .72 * i.press - .3 * Math.max(0, i.W - 1) - (c > 0 ? .32 * i.tuck : 0), g = c > 0 ? e.jaw() * de(a, o) : 0, _, v;
		if (s <= m + .001) {
			let e = m > 0 ? s / m : 0;
			_ = d, v = f + c * e * (h - 1) * m;
		} else {
			let e = 1 - R(m, m + (c < 0 ? 26 : 40), s), t = i.press * 2.2 * Math.exp(-(((s - m - 4) / 5) ** 2)) * (p < 1 ? 1 - p * p : 0);
			_ = d * e, v = (f + c * (h - 1) * m) * e + g * (1 - e) + c * t;
		}
		if (p > 1.2) {
			let e = 1 - R(1.2, 1.6, p);
			_ *= e, v = v * e + g * (1 - e) * (s > m);
		}
		r[0] = a + _, r[1] = o + v;
	}
	alphaOf(e, t, n, r) {
		let i = n % t.R, a = t.rest[n * 2], o = 1;
		i === 0 && (o = 1 - L((r - 1) / 1.2));
		let s = V(a), c = s < 0 ? this.solCache.side.L : this.solCache.side.R;
		if (Math.abs(s) > .9 && t.d[n] < 20) {
			let e = R(.9, 1.08, Math.abs(s)) * (1 - R(8, 20, t.d[n]));
			o *= 1 - e * (1 - c.crease);
		}
		return o;
	}
	lightOf(e, t, n) {
		let r = e.p, i = t.d[n], a = t.rest[n * 2], o = Math.abs(V(a)), s = o < 1 ? 1 - o * o : 0, c = t.sign < 0 ? oe(o) : se(o), l = 1;
		return l -= r.press * .16 * Math.exp(-((i / 2.2) ** 2)) * s, l += r.press * .05 * Math.exp(-(((i - c - 4) / 5) ** 2)) * s, t.sign > 0 && (l -= r.tuck * .2 * Math.exp(-((i / 4) ** 2)) * s), l += .04 * r.round * (i < c ? Math.sin(Math.PI * i / Math.max(1, c)) : 0) * s, l;
	}
	update(e) {
		this.solCache = e;
		let t = [0, 0], n = this.cols.length;
		this.colU || (this.colU = new Float32Array(n * 3), this.colL = new Float32Array(n * 3));
		for (let t = 0; t < n; t++) {
			let n = this.edge(e, this.cols[t], -1), r = this.edge(e, this.cols[t], 1);
			this.colU.set(n, t * 3), this.colL.set(r, t * 3);
		}
		for (let n of ["U", "L"]) {
			let r = this.sheets[n];
			for (let n = 0; n < r.C * r.R; n++) {
				this.deform(e, r, n, t), r.pos[n * 2] = t[0], r.pos[n * 2 + 1] = t[1], r.alpha[n] = this.alphaOf(e, r, n, this.colL[Math.floor(n / r.R) * 3 + 2]), r.light[n] = this.lightOf(e, r, n);
				let i = n % r.R;
				if (i <= 2) {
					let e = this.colL[Math.floor(n / r.R) * 3 + 2], t = L(e / 3) * (r.sign > 0 ? 4 : 1.6) * (i === 2 ? .4 : 1);
					r.uv[n * 2 + 1] = r.uv0[n * 2 + 1] + r.sign * t / (this.rect[3] - this.rect[1]);
				}
				i === 0 && r.sign < 0 && (r.pos[n * 2 + 1] += .8 * (1 - L(this.colL[Math.floor(n / r.R) * 3 + 2] / 1.5)) * (1 - R(.95, 1.15, Math.abs(V(r.rest[n * 2])))));
			}
		}
		let r = this.inner;
		for (let t = 0; t < this.IC; t++) {
			let n = r.s[t * 2], i = B.cx + n * (n < 0 ? B.hwL : B.hwR), a = ie(i), [o, s] = this.edge(e, i, -1), [c, l] = this.edge(e, i, 1), u = a + s, d = a + l, f = Math.max(0, d - u);
			r.pos[t * 4] = i + o, r.pos[t * 4 + 1] = u - 2, r.pos[t * 4 + 2] = i + c, r.pos[t * 4 + 3] = d + 2, r.dt[t * 2] = -2, r.dt[t * 2 + 1] = f + 2, r.gap[t * 2] = r.gap[t * 2 + 1] = f;
		}
	}
}, W = (e, t, n) => e < t ? t : e > n ? n : e, G = (e) => W(e, 0, 1), K = (e, t, n) => {
	let r = G((n - e) / (t - e));
	return r * r * (3 - 2 * r);
}, q = Math.PI / 180, pe = {
	hairback: [
		0,
		0,
		1,
		.6
	],
	bun: [
		1,
		0,
		0,
		.6
	],
	body: [
		0,
		.7,
		0,
		.5
	],
	ears: [
		1,
		.6,
		0,
		.6
	],
	face: [
		1,
		1,
		0,
		.35
	],
	browL: [
		0,
		1,
		1,
		.6
	],
	browR: [
		0,
		1,
		1,
		.6
	],
	lockbed: [
		1,
		0,
		1,
		.6
	],
	hair: [
		.3,
		.3,
		1,
		.5
	],
	lockL: [
		0,
		1,
		.3,
		.7
	],
	lockR: [
		1,
		.3,
		.6,
		.7
	]
}, J = {
	cx: 512,
	cy: 420,
	rx: 322,
	ry: 392,
	A: 205,
	fcx: 530,
	fcy: 500,
	fsx: 128,
	fsy: 160,
	B: 95,
	gain: 1,
	pivot: [530, 728]
};
function Y(e, t) {
	let n = (e - J.cx) / J.rx, r = (t - J.cy) / J.ry, i = Math.max(0, 1 - n * n - r * r), a = J.A * i * i;
	a += J.B * Math.exp(-((e - J.fcx) ** 2) / (2 * J.fsx * J.fsx) - (t - J.fcy) ** 2 / (2 * J.fsy * J.fsy)), a += 26 * Math.exp(-((e - 530) ** 2 + (t - 532) ** 2) / 1152);
	for (let n of [452, 608]) a += 8 * Math.exp(-((e - n) ** 2 + (t - 585) ** 2) / 4050);
	return a;
}
function me(e, t) {
	let [n, r, i, a] = e, o = Math.max(1, Math.ceil((i - n) / t)), s = Math.max(1, Math.ceil((a - r) / t)), c = (o + 1) * (s + 1), l = new Float32Array(c * 2), u = new Float32Array(c * 2), d = 0;
	for (let e = 0; e <= s; e++) for (let t = 0; t <= o; t++) {
		let c = t / o, f = e / s;
		l[d * 2] = n + c * (i - n), l[d * 2 + 1] = r + f * (a - r), u[d * 2] = c, u[d * 2 + 1] = f, d++;
	}
	let f = new Uint16Array(o * s * 6);
	d = 0;
	for (let e = 0; e < s; e++) for (let t = 0; t < o; t++) {
		let n = e * (o + 1) + t, r = n + 1, i = n + o + 1, a = i + 1;
		f.set([
			n,
			r,
			i,
			r,
			a,
			i
		], d), d += 6;
	}
	return {
		rest: l,
		uv: u,
		idx: f,
		n: c
	};
}
function he(e, t) {
	let n = new Uint16Array((e - 1) * (t - 1) * 6), r = 0;
	for (let i = 0; i < e - 1; i++) for (let e = 0; e < t - 1; e++) {
		let a = i * t + e, o = a + 1, s = a + t, c = s + 1;
		n.set([
			a,
			s,
			o,
			o,
			s,
			c
		], r), r += 6;
	}
	return n;
}
function X(e, t, n) {
	let r = n - e;
	if (r <= 0) return t[0];
	if (r >= t.length - 1) return t[t.length - 1];
	let i = Math.floor(r), a = r - i;
	return t[i] * (1 - a) + t[i + 1] * a;
}
var ge = class {
	constructor(e, t) {
		this.k = e, this.c = 2 * t * Math.sqrt(e), this.x = 0, this.v = 0;
	}
	step(e, t) {
		let n = Math.min(t, .1);
		for (; n > 1e-6;) {
			let t = Math.min(.004, n);
			this.v += (e - this.k * this.x - this.c * this.v) * t, this.x += this.v * t, n -= t;
		}
		return this.x;
	}
}, _e = class e {
	static async load(t, n, r = {}) {
		let i = await ((e) => fetch(n + e).then((e) => e.json()))("geom.json"), a = Object.keys(i.rects).filter((e) => e !== "bg").concat(["interior"], ["L", "R"].filter((e) => i.plates && i.plates[e]).map((e) => "plate" + e)), o = {};
		return await Promise.all(a.map(async (e) => {
			let t = new Image();
			t.src = `${n}${e}.${r.ext || "png"}`, await t.decode(), o[e] = t;
		})), new e(t, i, null, o, r);
	}
	constructor(e, t, n, r, i) {
		this.g = t, this.M = n, this.R = new te(e, {
			clear: i.clear || [
				251.4 / 255,
				229.4 / 255,
				188.6 / 255
			],
			preserve: !!i.preserve
		}), this.R.dpr = i.dpr || Math.min(2, window.devicePixelRatio || 1), this.reduced = !!i.reducedMotion, this.view = i.view || [
			140,
			20,
			744
		], this.tex = {};
		for (let [e, t] of Object.entries(r)) this.tex[e] = this.R.texture(t, e !== "interior");
		this.solver = new ue(), this.clock = null, this.lastT = -1, this.layers = {};
		let a = this.R.paint, o = (e, n, r) => {
			let i = t.rects[e], o = me(i, n), s = new Float32Array(o.rest), c = new Float32Array(o.n);
			for (let e = 0; e < o.n; e++) c[e] = Y(o.rest[e * 2], o.rest[e * 2 + 1]);
			let l = this.R.mesh(a, {
				aPos: {
					data: s,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: o.uv,
					size: 2
				}
			}, o.idx);
			this.layers[e] = {
				name: e,
				rect: i,
				rest: o.rest,
				z: c,
				pos: s,
				mesh: l,
				kind: r,
				n: o.n
			};
		};
		o("hairback", 24, "head"), o("bun", 16, "bun"), o("body", 24, "body"), o("ears", 12, "head"), o("face", 14, "face");
		for (let e of ["L", "R"]) o("brow" + e, 6, "brow");
		o("lockbed", 8, "head"), o("hair", 16, "head"), o("lockL", 6, "lock"), o("lockR", 6, "lock");
		{
			let e = this.layers.bun;
			for (let t = 0; t < e.n; t++) e.z[t] = e.z[t] - 45;
		}
		{
			let e = this.layers.lockR;
			for (let t = 0; t < e.n; t++) e.z[t] -= 45 * K(585, 650, e.rest[t * 2 + 1]);
		}
		for (let e of ["L", "R"]) {
			let t = this.layers["lock" + e];
			t.y0 = t.rect[1] + 6, t.len = t.rect[3] - t.y0, t.spring = new ge(55, .22), t.springY = new ge(70, .3);
		}
		this.bunSpring = [new ge(90, .5), new ge(90, .5)], this.eyes = {};
		for (let e of ["L", "R"]) {
			let n = t.eyes[e], r = n.x[0], i = n.x[1], o = Math.floor((i - r) / 2) + 1, s = o * 4, c = new Float32Array(s * 2), l = new Float32Array(s * 2), u = new Float32Array(s), d = new Float32Array(s);
			for (let e = 0; e < o; e++) for (let t = 0; t < 4; t++) u[e * 4 + t] = t === 0 || t === 3 ? 0 : Math.min(1, e / 2, (o - 1 - e) / 2);
			let f = this.R.mesh(this.R.eye, {
				aPos: {
					data: c,
					size: 2,
					dynamic: !0
				},
				aRest: {
					data: l,
					size: 2,
					dynamic: !0
				},
				aEdge: {
					data: u,
					size: 1
				},
				aTop: {
					data: d,
					size: 1,
					dynamic: !0
				}
			}, he(o, 4)), p = n.lashX[0], m = n.lashX[1], h = Math.floor((m - p) / 3) + 1, g = new Float32Array(h * 8 * 2), _ = new Float32Array(h * 8 * 2), v = new Float32Array(h * 8), y = t.rects["lid" + e];
			for (let e = 0; e < h; e++) {
				let t = Math.min(m, p + e * 3), r = X(p, n.lashTop, t) - n.fall, i = X(p, n.lashBot, t) + 8.5;
				for (let n = 0; n < 8; n++) {
					let a = n / 7, o = r + a * (i - r), s = e * 8 + n;
					g[s * 2] = t, g[s * 2 + 1] = o, _[s * 2] = (t - y[0]) / (y[2] - y[0]), _[s * 2 + 1] = (o - y[1]) / (y[3] - y[1]), v[s] = K(.1, .55, a);
				}
			}
			let b = new Float32Array(g), x = this.R.mesh(a, {
				aPos: {
					data: b,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: _,
					size: 2
				}
			}, he(h, 8)), S = Math.floor((i - r) / 3) + 1, C = new Float32Array(S * 5 * 2), w = new Float32Array(S * 5 * 2), T = new Float32Array(S * 5), E = t.rects["lower" + e];
			for (let e = 0; e < S; e++) {
				let t = Math.min(i, r + e * 3), a = X(r, n.bot, t);
				for (let n = 0; n < 5; n++) {
					let r = n / 4, i = Math.max(E[1], a - 3) + r * (Math.min(E[3], a + 19) - Math.max(E[1], a - 3)), o = e * 5 + n;
					C[o * 2] = t, C[o * 2 + 1] = i, w[o * 2] = (t - E[0]) / (E[2] - E[0]), w[o * 2 + 1] = (i - E[1]) / (E[3] - E[1]), T[o] = r;
				}
			}
			let D = new Float32Array(C), O = this.R.mesh(a, {
				aPos: {
					data: D,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: w,
					size: 2
				}
			}, he(S, 5));
			this.eyes[e] = {
				e: n,
				xa: r,
				xb: i,
				C: o,
				R: 4,
				pos: c,
				restA: l,
				topA: d,
				mesh: f,
				LC: h,
				LR: 8,
				lrest: g,
				lpos: b,
				lv: v,
				lmesh: x,
				BC: S,
				BR: 5,
				brest: C,
				bpos: D,
				bv: T,
				bmesh: O,
				top: new Float32Array(i - r + 1),
				bot: new Float32Array(i - r + 1)
			};
		}
		if (this.lidKeyMesh = {}, t.lidKeys) for (let e of ["L", "R"]) for (let n of ["mid", "shut"]) {
			let r = `lid${n}${e}`, i = t.rects[r], o = me(i, 8), s = new Float32Array(o.rest), c = new Float32Array(o.n);
			for (let e = 0; e < o.n; e++) c[e] = Y(o.rest[e * 2], o.rest[e * 2 + 1]);
			this.lidKeyMesh[r] = {
				rect: i,
				rest: o.rest,
				z: c,
				pos: s,
				n: o.n,
				mesh: this.R.mesh(a, {
					aPos: {
						data: s,
						size: 2,
						dynamic: !0
					},
					aUv: {
						data: o.uv,
						size: 2
					}
				}, o.idx)
			};
		}
		this.shell = new fe(t.rects.mouth_rest), this.shellMesh = {};
		for (let e of ["U", "L"]) {
			let t = this.shell.sheets[e];
			this.shellMesh[e] = this.R.mesh(this.R.lip, {
				aPos: {
					data: t.pos,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: t.uv,
					size: 2,
					dynamic: !0
				},
				aA: {
					data: t.alpha,
					size: 1,
					dynamic: !0
				},
				aL: {
					data: t.light,
					size: 1,
					dynamic: !0
				}
			}, t.idx), t.z = new Float32Array(t.C * t.R);
			for (let e = 0; e < t.C * t.R; e++) t.z[e] = Y(t.rest[e * 2], t.rest[e * 2 + 1]);
		}
		let s = this.shell.inner;
		if (s.proj = new Float32Array(s.pos.length), this.innerMesh = this.R.mesh(this.R.inner, {
			aPos: {
				data: s.proj,
				size: 2,
				dynamic: !0
			},
			aS: {
				data: s.s,
				size: 1
			},
			aDT: {
				data: s.dt,
				size: 1,
				dynamic: !0
			},
			aGap: {
				data: s.gap,
				size: 1,
				dynamic: !0
			}
		}, s.idx), this.plates = {}, t.plates && t.yawKeys && t.yawKeys.norm) {
			let e = me([
				290,
				170,
				780,
				700
			], 8), n = t.yawKeys, r = n.grid.step, i = n.grid.n, a = t.plates.holes || [], o = (e, t) => {
				let n = 1;
				for (let r of a) {
					let i = Math.abs(e - r.c[0]) - (r.h[0] - r.r), a = Math.abs(t - r.c[1]) - (r.h[1] - r.r), o = Math.hypot(Math.max(i, 0), Math.max(a, 0)) + Math.min(Math.max(i, a), 0) - r.r;
					n *= K(-r.f, 0, o);
				}
				return n * (1 - K(640, 690, t));
			};
			for (let a of ["L", "R"]) {
				let s = n[a], c = n.norm[a], l = t.plates[a].rect, u = new Float32Array(e.n * 2), d = new Float32Array(e.n), f = new Float32Array(e.n);
				for (let t = 0; t < e.n; t++) {
					let n = e.rest[t * 2], a = e.rest[t * 2 + 1], p = W(n / r, 0, i - 1.001), m = W(a / r, 0, i - 1.001), h = Math.floor(p), g = Math.floor(m), _ = p - h, v = m - g, y = s[g][h], b = s[g][h + 1], x = s[g + 1][h], S = s[g + 1][h + 1], C = n + (y[0] * (1 - _) + b[0] * _) * (1 - v) + (x[0] * (1 - _) + S[0] * _) * v, w = a + (y[1] * (1 - _) + b[1] * _) * (1 - v) + (x[1] * (1 - _) + S[1] * _) * v, T = (C - c.fcx) / c.s + c.kcx, E = (w - c.fe) / c.s + c.ke;
					u[t * 2] = (T - l[0]) / (l[2] - l[0]), u[t * 2 + 1] = (E - l[1]) / (l[3] - l[1]), d[t] = o(n, a), f[t] = Y(n, a);
				}
				let p = new Float32Array(e.rest), m = new Float32Array(e.n), h = new Float32Array(e.n).fill(1), g = this.R.mesh(this.R.lip, {
					aPos: {
						data: p,
						size: 2,
						dynamic: !0
					},
					aUv: {
						data: u,
						size: 2
					},
					aA: {
						data: m,
						size: 1,
						dynamic: !0
					},
					aL: {
						data: h,
						size: 1
					}
				}, e.idx);
				this.plates[a] = {
					rect: l,
					rest: e.rest,
					n: e.n,
					pos: p,
					alpha: m,
					hole: d,
					z: f,
					mesh: g
				};
			}
		}
		this.prevAnchor = null, this.prevVel = {
			L: [0, 0],
			R: [0, 0],
			bun: [0, 0]
		}, this.st = null;
	}
	now() {
		return this.clock ?? performance.now() / 1e3;
	}
	apply(e, t, n, r, i) {
		let a = this.now(), o = this.lastT < 0 ? 1 / 60 : W(a - this.lastT, 0, .1);
		this.lastT = a, this.bs = e, this.gaze = n;
		let s = (t) => e[t] ?? 0, c = W(t[1], -20, 20), l = W(t[0], -10, 12), u = W(t[2], -12, 12), d = {
			sy: Math.sin(c * q) * J.gain,
			cy: Math.cos(c * q),
			sp: Math.sin(l * q) * J.gain,
			cp: Math.cos(l * q),
			sr: Math.sin(-u * q),
			cr: Math.cos(-u * q),
			yaw: c,
			pitch: l,
			roll: u,
			bob: -i * 1.4,
			leanS: 1 + .03 * r,
			leanY: 7 * r
		};
		if (this.g.yawKeys) {
			let e = this.g.yawKeys, t = W(c / e.keyDeg, -1, 1);
			d.yk = t >= 0 ? e.R : e.L, d.ykf = Math.abs(t), this.yawStep = e.grid.step, this.yawN = e.grid.n;
		}
		this.st = d;
		let f = (s("mouthSmileLeft") + s("mouthSmileRight")) / 2, p = (s("cheekSquintLeft") + s("cheekSquintRight")) / 2, m = G(s("jawOpen") / .85);
		this.expr = {
			smile: f,
			cheek: p,
			open: m
		}, this.browCh = {
			L: this.browChannels("L"),
			R: this.browChannels("R")
		}, this.solver.solve(e, o);
		let h = this.solver.p;
		this.mouth = {
			name: "shell",
			row: h.g > 3 ? "open" : "closed",
			jawGain: 1,
			p: h
		};
		let g = {
			L: "Right",
			R: "Left"
		}, _ = G(-n[1] / 25), v = G(n[1] / 20), y = this.blinkShape(a, o, s("eyeBlinkRight"));
		this.lid = {
			L: y,
			R: this.blinkShape2(s("eyeBlinkLeft"))
		};
		for (let e of ["L", "R"]) {
			let t = this.eyes[e], n = t.e, r = g[e], i = (e) => {
				let t = s(e + "Left"), n = s(e + "Right");
				return Math.abs(t - n) < .12 ? (t + n) / 2 : s(e + r);
			}, a = this.lid[e], o = i("eyeSquint"), c = s("eyeWide" + r), l = i("cheekSquint"), u = i("mouthSmile");
			for (let r = 0; r <= t.xb - t.xa; r++) {
				let i = n.top[r], s = n.bot[r], d = s - i, f = r / (t.xb - t.xa), p = Math.max(0, Math.sin(Math.PI * f)) ** .7, m = .16 * K(.25, .55, a), h = (o * .3 + l * .2 + u * .06 + m) * d * p ** 1.4, g = s - h + c * .05 * d * p, y = (_ * .14 - v * .02) * d * p, b = i + .72 * (s - i) - Math.min(h, .25 * d), x = i + y - c * .2 * d * p, S = this.g.lidKeys ? this.g.lidKeys[e].midLash : null, C = S ? S.y[Math.min(S.y.length - 1, r)] : b;
				x += (Math.max(x, C - 1) - x) * G(a / .34), x > g && (x = g), t.top[r] = x, t.bot[r] = g;
			}
			t.blink = a;
		}
		let b = this.project(530, 300, 120);
		if (this.prevAnchor) {
			let e = (b[0] - this.prevAnchor[0]) / Math.max(o, .001), t = (b[1] - this.prevAnchor[1]) / Math.max(o, .001), n = (e - this.prevVel.L[0]) / Math.max(o, .001), r = (t - this.prevVel.L[1]) / Math.max(o, .001);
			this.prevVel.L = [e, t];
			let i = this.reduced ? .3 : 1;
			for (let e of ["L", "R"]) {
				let t = this.layers["lock" + e];
				t.sx = t.spring.step(-W(n, -4e3, 4e3) * .02 * i + d.sr * 0, o), t.sy = t.springY.step(-W(r, -4e3, 4e3) * .01 * i, o);
			}
			this.bunOff = [this.bunSpring[0].step(-W(n, -4e3, 4e3) * .012 * i, o), this.bunSpring[1].step(-W(r, -4e3, 4e3) * .012 * i, o)];
		} else this.bunOff = [0, 0];
		this.prevAnchor = b;
	}
	blinkShape(e, t, n) {
		let r = this.bsh ||= {
			active: !1,
			t0: 0,
			base: 0,
			prev: n,
			settle: !1
		}, i = [
			.5,
			1,
			1,
			.5,
			.14,
			.04
		], a = t > 0 ? (n - r.prev) / t : 0;
		!r.active && a > 5 && n - r.prev > .06 && n > .15 && (r.active = !0, r.t0 = e, r.base = Math.min(r.prev, .5)), r.prev = n;
		let o = n;
		if (r.active) {
			let t = Math.floor((e - r.t0) * 30 + 1e-6);
			t < i.length ? (o = Math.max(r.base, i[t]), this.blinkDip = i[t]) : (r.active = !1, r.settle = !0);
		}
		return r.active || (this.blinkDip = 0, r.settle && (n <= r.base + .05 ? r.settle = !1 : o = Math.min(n, r.base))), this.lidShared = o, this.lidRaw = n, o;
	}
	blinkShape2(e) {
		return G(this.lidShared + (e - this.lidRaw));
	}
	project(e, t, n) {
		return this.projectTo(e, t, n, [0, 0]);
	}
	projectTo(e, t, n, r) {
		let i = this.st, a = e, o = t;
		if (i.yk) {
			let n = i.yk, r = this.yawStep, s = W(e / r, 0, this.yawN - 1.001), c = W(t / r, 0, this.yawN - 1.001), l = Math.floor(s), u = Math.floor(c), d = s - l, f = c - u, p = n[u][l], m = n[u][l + 1], h = n[u + 1][l], g = n[u + 1][l + 1], _ = i.ykf;
			a += _ * ((p[0] * (1 - d) + m[0] * d) * (1 - f) + (h[0] * (1 - d) + g[0] * d) * f), o += _ * ((p[1] * (1 - d) + m[1] * d) * (1 - f) + (h[1] * (1 - d) + g[1] * d) * f);
		}
		let s = o - J.cy;
		o = J.cy + s * i.cp + n * i.sp;
		let c = a - J.pivot[0], l = o - J.pivot[1];
		return a = J.pivot[0] + c * i.cr - l * i.sr, o = J.pivot[1] + c * i.sr + l * i.cr, a = J.pivot[0] + (a - J.pivot[0]) * i.leanS, o = J.pivot[1] + (o - J.pivot[1]) * i.leanS + i.bob * .6 + i.leanY, r[0] = a, r[1] = o, r;
	}
	faceOffset(e, t, n = !1) {
		let { smile: r, cheek: i } = this.expr, a = 0, o = 0;
		for (let n of [455, 605]) {
			let s = Math.exp(-((e - n) ** 2 + (t - 585) ** 2) / 3528);
			o -= (r * 4 + i * 3) * s, a += Math.sign(e - 530) * r * 1.5 * s;
		}
		return !n && this.solver && (o += this.solver.jaw() * de(e, t)), [a, o];
	}
	deformLayer(e) {
		let t = this.st, n = e.pos, r = e.rest, i = e.z, a = e.n;
		if (e.kind === "static") return !1;
		if (e.kind === "body") {
			for (let e = 0; e < a; e++) {
				let i = r[e * 2], a = r[e * 2 + 1], o = 1024 + (a - 1024) * (1 + .004 * t.bob / -1.4), s = i, c = K(772, 700, a) * (1 - K(110, 160, Math.abs(i - 527)));
				if (c > 0) {
					let [e, t] = this.project(i, a, Y(i, a));
					s += (e - i) * c, o += (t - a) * c;
				}
				n[e * 2] = s, n[e * 2 + 1] = o;
			}
			return !0;
		}
		let o = e.kind === "face", s = e.kind === "lock", c = e.kind === "bun";
		for (let t = 0; t < a; t++) {
			let a = r[t * 2], l = r[t * 2 + 1];
			if (o) {
				let [e, t] = this.faceOffset(a, l);
				a += e, l += t;
			} else if (e.kind === "brow") {
				let [t, n] = this.browOffset(e.name.slice(4), a, l);
				a += t, l += n;
			} else if (s) {
				let t = G((l - e.y0) / e.len) ** 1.4;
				a += (e.sx || 0) * t, l += (e.sy || 0) * t * .3;
			} else c && (a += this.bunOff ? this.bunOff[0] : 0, l += this.bunOff ? this.bunOff[1] : 0);
			let u = this.projectTo(a, l, i[t], this._tmp ||= [0, 0]);
			n[t * 2] = u[0], n[t * 2 + 1] = u[1];
		}
		return !0;
	}
	browChannels(e) {
		let t = this.bs, n = e === "L" ? "Right" : "Left", r = t.browInnerUp ?? 0, i = t["browOuterUp" + n] ?? 0, a = t["browDown" + n] ?? 0;
		return {
			lift: 10 * (t["eyeWide" + n] ?? 0) + 9 * i + 4 * r,
			inner: 40 * r,
			arch: 30 * i,
			knit: 16 * a
		};
	}
	browOffset(e, t, n) {
		let r = this.g.brows[e], i = r.x[0], a = r.x[1], o = this.browCh[e], s = (t) => {
			let n = G(e === "L" ? (a - t) / (a - i) : (t - i) / (a - i)), r = Math.exp(-(((n - .62) / .3) ** 2));
			return 3.2 * Math.max(this.blinkDip || 0, K(.3, .6, this.lidShared || 0) * (this.bsh && this.bsh.active ? 1 : .8)) - o.lift - o.inner * (1 - n) ** 1.3 - o.arch * (.35 + .65 * r) * n ** .5 + o.knit * (1 - .6 * n);
		}, c = s(t), l = Math.atan((s(t + 3) - s(t - 3)) / 6), u = r.cl, d = n - (u ? u.y[W(Math.round(t - u.x0), 0, u.y.length - 1)] : n);
		return [(e === "L" ? 1 : -1) * (o.knit * .3 + o.inner * .05) - d * Math.sin(l), c + d * (Math.cos(l) - 1)];
	}
	render() {
		let e = this.R, t = this.st;
		if (!t) return;
		e.begin(), e.setCam(this.view[0], this.view[1], this.view[2]);
		let n = [
			t.yaw >= 0 ? 1 : -1,
			t.yaw >= 0 ? 530 : 330,
			t.yaw >= 0 ? 730 : 530,
			.16 * Math.abs(t.yaw) / 20
		], r = [
			n[0],
			t.yaw >= 0 ? 400 : 200,
			t.yaw >= 0 ? 820 : 660,
			.1 * Math.abs(t.yaw) / 20
		], i = this.debug, a = (t, n) => {
			let r = this.layers[t];
			this.deformLayer(r) && e.update(r.mesh, "aPos", r.pos), !(i && i.only && !i.only.includes(t)) && e.drawPaint(r.mesh, this.tex[t], r.rect, 1, n, i && i.tint ? pe[t] : null);
		};
		a("hairback", r), a("bun", r), a("body"), a("ears", n), a("face", n);
		for (let e of ["L", "R"]) this.drawEye(e, n);
		a("browL"), a("browR"), this.drawMouth(n), this.drawPlate(), a("lockbed", n), a("hair", r), a("lockL"), a("lockR");
	}
	drawEye(e, t) {
		let n = this.eyes[e], r = n.e, i = this.R, a = this.st, o = (e, t) => Y(e, t), s = (r.top[Math.floor(r.top.length / 2)] + r.bot[Math.floor(r.bot.length / 2)]) / 2, c = this.project(n.xa, s, o(n.xa, s)), l = this.project(n.xb, s, o(n.xb, s)), u = (l[0] - c[0]) / (n.xb - n.xa), d = (c[0] + l[0]) / 2, f = u < .85 ? .85 / u : 1, p = (e) => (f !== 1 && (e[0] = d + (e[0] - d) * f), e);
		this.eyeFix = {
			ecx: d,
			em: f
		};
		let m = 0;
		for (let e = 0; e < n.C; e++) {
			let t = Math.min(n.xb, n.xa + e * 2), r = t - n.xa, i = n.top[r], a = n.bot[r], s = Math.min(t - n.xa, n.xb - t);
			if (s < 6) {
				let e = Math.sqrt(Math.max(0, 1 - (1 - s / 6) ** 2)), t = (i + a) / 2;
				i = t + (i - t) * e, a = t + (a - t) * e;
			}
			let c = [
				i - 2.1,
				i - .1,
				Math.max(i - .1, a - .6),
				Math.max(i - .1, a + 1.4)
			];
			for (let e = 0; e < 4; e++) {
				let r = a <= i + .05 ? i : c[e];
				n.restA[m * 2] = t, n.restA[m * 2 + 1] = r, n.topA[m] = i;
				let s = p(this.project(t, r, o(t, r)));
				n.pos[m * 2] = s[0], n.pos[m * 2 + 1] = s[1], m++;
			}
		}
		i.update(n.mesh, "aPos", n.pos), i.update(n.mesh, "aRest", n.restA), i.update(n.mesh, "aTop", n.topA);
		let h = this.gaze || [0, 0], g = h[0] / 25 * 18, _ = -(h[1] / 20) * 12 + (h[1] < 0 ? -h[1] / 25 * 2 : 0);
		Math.cos((h[0] + .2 * a.yaw) * q * 1.2);
		let [v, y] = r.iris, [b, x, S] = r.catch, C = X(n.xa, n.top, b), w = Math.max(0, C + S + 1.5 - (x + _ * .45)), T = _ * .45 + Math.min(w, 14), E = G((.92 - n.blink) / .2) * (1 - (this.g.lidKeys ? G((n.blink - .6) / .1) : 0)), D = p(this.project(v + g, y + _, o(v + g, y + _))), O = this.project(v - 12, y, o(v - 12, y)), k = this.project(v + 12, y, o(v + 12, y)), A = W(.55 + .45 * (Math.hypot(k[0] - O[0], k[1] - O[1]) / 24), .9, 1.06), j = p(this.project(b + g * .45, x + T, o(b, x)));
		i.drawEye(n.mesh, {
			sclera: {
				tex: this.tex["sclera" + e],
				rect: this.g.rects["sclera" + e]
			},
			iris: {
				tex: this.tex["iris" + e],
				rect: this.g.rects["iris" + e]
			},
			catch: {
				tex: this.tex["catch" + e],
				rect: this.g.rects["catch" + e]
			},
			irisC: [v, y],
			irisScr: D,
			irisK: A,
			irisScale: [1, n.blink > .85 ? .95 : 1],
			catchScr: j,
			catchC: [b, x],
			catchA: E,
			lidShade: .4,
			topY: X(n.xa, n.top, v)
		});
		for (let e = 0; e < n.BC; e++) for (let t = 0; t < n.BR; t++) {
			let i = e * n.BR + t, a = n.brest[i * 2], s = n.brest[i * 2 + 1], c = Math.round(a - n.xa), l = s - (r.bot[W(c, 0, r.bot.length - 1)] - n.bot[W(c, 0, n.bot.length - 1)]) * (1 - .75 * n.bv[i]), u = p(this.project(a, l, o(a, l)));
			n.bpos[i * 2] = u[0], n.bpos[i * 2 + 1] = u[1];
		}
		i.update(n.bmesh, "aPos", n.bpos), i.drawPaint(n.bmesh, this.tex["lower" + e], this.g.rects["lower" + e], 1, t);
		let M = n.LC * n.LR;
		for (let e = 0; e < M; e++) {
			let t = n.lrest[e * 2], i = n.lrest[e * 2 + 1], a = Math.round(t - n.xa), s = 1;
			a < 0 && (s = Math.max(.45, 1 + a / 30), a = 0), a > n.xb - n.xa && (s = Math.max(.45, 1 - (a - (n.xb - n.xa)) / 30), a = n.xb - n.xa);
			let c = i + (n.top[a] - r.top[a]) * s * n.lv[e], l = p(this.project(t, c, o(t, c)));
			n.lpos[e * 2] = l[0], n.lpos[e * 2 + 1] = l[1];
		}
		if (i.update(n.lmesh, "aPos", n.lpos), i.drawPaint(n.lmesh, this.tex["lid" + e], this.g.rects["lid" + e], 1, t), this.g.lidKeys) {
			let r = n.blink, a = K(.3, .36, r), o = K(.72, .82, r);
			for (let [n, r] of [["mid", a * (1 - (o >= 1))], ["shut", o]]) {
				if (r <= .003) continue;
				let a = this.lidKeyMesh[`lid${n}${e}`];
				for (let e = 0; e < a.n; e++) {
					let t = a.rest[e * 2], n = a.rest[e * 2 + 1], r = p(this.projectTo(t, n, a.z[e], this._tmp ||= [0, 0]));
					a.pos[e * 2] = r[0], a.pos[e * 2 + 1] = r[1];
				}
				i.update(a.mesh, "aPos", a.pos), i.drawPaint(a.mesh, this.tex[`lid${n}${e}`], a.rect, r, t);
			}
		}
	}
	drawMouth(e) {
		let t = this.R, n = this.solver, r = this.shell;
		r.update(n);
		for (let e of ["U", "L"]) {
			let t = r.sheets[e];
			for (let e = 0; e < t.C * t.R; e++) {
				let n = t.pos[e * 2], r = t.pos[e * 2 + 1], [i, a] = this.faceOffset(t.rest[e * 2], t.rest[e * 2 + 1], !0), o = this.projectTo(n + i, r + a, t.z[e], this._tmp ||= [0, 0]);
				t.pos[e * 2] = o[0], t.pos[e * 2 + 1] = o[1];
			}
		}
		let i = r.inner;
		for (let e = 0; e < i.pos.length / 2; e++) {
			let t = i.pos[e * 2], n = i.pos[e * 2 + 1], [r, a] = this.faceOffset(t, n, !0), o = this.project(t + r, n + a, Y(t, n));
			i.proj[e * 2] = o[0], i.proj[e * 2 + 1] = o[1];
		}
		t.update(this.innerMesh, "aPos", i.proj), t.update(this.innerMesh, "aDT", i.dt), t.update(this.innerMesh, "aGap", i.gap);
		let a = n.p;
		a.g > .05 && t.drawInner(this.innerMesh, this.tex.interior, [
			a.T,
			a.TL,
			8,
			0
		], [
			a.th,
			a.tip,
			a.curl,
			0
		], 1 - .5 * e[3]);
		for (let n of ["L", "U"]) {
			let i = r.sheets[n];
			t.update(this.shellMesh[n], "aPos", i.pos), t.update(this.shellMesh[n], "aA", i.alpha), t.update(this.shellMesh[n], "aL", i.light), t.update(this.shellMesh[n], "aUv", i.uv), t.drawLip(this.shellMesh[n], this.tex.mouth_rest, this.g.rects.mouth_rest, e);
		}
	}
	drawPlate() {
		let e = this.st;
		if (!e || !e.yk || this.debug && this.debug.noPlate) return;
		let t = e.yaw >= 0 ? "R" : "L", n = this.plates[t], r = K(.04, 1, e.ykf);
		if (!n || r <= .004) return;
		let i = this.solver, a = i.p, o = this._tmp ||= [0, 0], s = i.lowerDrop(), c = i.shift || 0, l = 64 * a.W + Math.max(0, i.side.L.wid) + 14, u = 66 * a.W + Math.max(0, i.side.R.wid) + 14;
		for (let e = 0; e < n.n; e++) {
			let t = n.rest[e * 2], i = n.rest[e * 2 + 1], [d, f] = this.faceOffset(t, i);
			this.projectTo(t + d, i + f, n.z[e], o), n.pos[e * 2] = o[0], n.pos[e * 2 + 1] = o[1];
			let p = r * n.hole[e];
			if (p > 0 && t > 420 && t < 650 && i > 540 && i < 720) {
				let e = t - 530 - c, n = e < 0 ? -e / l : e / u, r = ie(t), o = r - 20 - .3 * a.g, d = r + 30 + s, f = Math.max((n - 1) * 60, o - i, i - d);
				p *= K(-9, 0, f);
			}
			n.alpha[e] = p;
		}
		this.R.update(n.mesh, "aPos", n.pos), this.R.update(n.mesh, "aA", n.alpha), this.R.drawLip(n.mesh, this.tex["plate" + t], n.rect, [
			1,
			0,
			1,
			0
		]);
	}
	resetPhysics() {
		for (let e of ["L", "R"]) {
			let t = this.layers["lock" + e];
			t.spring.x = t.spring.v = t.springY.x = t.springY.v = 0;
		}
		for (let e of this.bunSpring) e.x = e.v = 0;
		this.bsh = null, this.blinkDip = 0, this.prevAnchor = null, this.prevVel.L = [0, 0];
	}
	frame(e, t, n, r, i) {
		this.apply(e, t, n, r, i), this.render();
	}
	stats() {
		return {
			triangles: Math.round(this.R.tris),
			meshes: this.R.draws
		};
	}
	dispose() {
		this.R.gl.getExtension("WEBGL_lose_context")?.loseContext();
	}
}, ve = {
	thinking: {
		bs: {
			browOuterUpLeft: .95,
			browInnerUp: .05,
			browDownRight: .55,
			eyeSquintRight: .25,
			eyeWideLeft: .04,
			mouthLeft: .7,
			mouthPressLeft: .35,
			mouthPressRight: .35,
			mouthPucker: .15,
			mouthFrownRight: .4,
			mouthFrownLeft: .15,
			mouthSmileLeft: -1,
			mouthSmileRight: -1
		},
		head: [
			-4,
			-7,
			8
		],
		gaze: [21, 20],
		env: [
			.35,
			0,
			.45
		]
	},
	listening: {
		bs: {
			mouthSmileLeft: -1,
			mouthSmileRight: -1,
			browInnerUp: .45,
			browOuterUpLeft: .32,
			browOuterUpRight: .32,
			eyeWideLeft: .2,
			eyeWideRight: .2,
			jawOpen: .13
		},
		head: [
			5,
			4,
			-11
		],
		gaze: [-3, 1],
		env: [
			.5,
			0,
			.5
		]
	},
	warm: {
		bs: {
			mouthSmileLeft: .4,
			mouthSmileRight: .4,
			cheekSquintLeft: .2,
			cheekSquintRight: .2,
			eyeSquintLeft: .12,
			eyeSquintRight: .12,
			browOuterUpLeft: .12,
			browOuterUpRight: .12
		},
		head: [
			0,
			0,
			3
		],
		gaze: [0, 0],
		env: [
			.4,
			0,
			.5
		]
	},
	delight: {
		bs: {
			mouthSmileLeft: 1,
			mouthSmileRight: 1,
			cheekSquintLeft: .75,
			cheekSquintRight: .75,
			eyeSquintLeft: .3,
			eyeSquintRight: .3,
			browOuterUpLeft: .7,
			browOuterUpRight: .7,
			browInnerUp: .35,
			jawOpen: .34
		},
		head: [
			-2,
			0,
			4
		],
		gaze: [0, 2],
		env: [
			.25,
			0,
			.45
		],
		bounce: 4
	},
	concern: {
		bs: {
			browInnerUp: 1,
			browDownLeft: .45,
			browDownRight: .45,
			eyeWideLeft: .15,
			eyeWideRight: .15,
			mouthPressLeft: .35,
			mouthPressRight: .35,
			mouthFrownLeft: .7,
			mouthFrownRight: .7,
			mouthSmileLeft: -1,
			mouthSmileRight: -1
		},
		head: [
			4,
			2,
			7
		],
		gaze: [0, 3],
		env: [
			.45,
			0,
			.6
		]
	},
	surprise: {
		bs: {
			eyeWideLeft: .9,
			eyeWideRight: .9,
			browInnerUp: .6,
			browOuterUpLeft: .85,
			browOuterUpRight: .85,
			jawOpen: .42,
			mouthSmileLeft: -1,
			mouthSmileRight: -1
		},
		head: [
			-5,
			0,
			0
		],
		gaze: [0, 2],
		env: [
			.12,
			0,
			.5
		]
	},
	playful: {
		bs: {
			mouthSmileLeft: .75,
			mouthSmileRight: .05,
			cheekSquintLeft: .5,
			browOuterUpLeft: 1,
			browDownRight: .45,
			eyeSquintRight: .3,
			eyeBlinkRight: .5,
			cheekSquintRight: .25,
			eyeSquintLeft: .05
		},
		head: [
			-2,
			7,
			-9
		],
		gaze: [-6, 3],
		env: [
			.25,
			0,
			.45
		]
	}
}, ye = (e) => e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e), be = class {
	constructor() {
		this.cur = null, this.bounce = {
			x: 0,
			v: 0
		};
	}
	emote(e, t, { hold: n = 1.6, intensity: r = 1 } = {}) {
		let i = ve[e];
		i && (this.cur = {
			name: e,
			t0: t,
			hold: n,
			I: r,
			rel: -1
		}, i.bounce && (this.bounce.v -= i.bounce * 14));
	}
	release(e) {
		this.cur && this.cur.rel < 0 && (this.cur.rel = e);
	}
	level(e) {
		let t = this.cur;
		if (!t) return 0;
		let [n, , r] = ve[t.name].env, i = ye((e - t.t0) / n), a = t.rel >= 0 ? t.rel : t.t0 + n + t.hold, o = e < a ? 1 : 1 - ye((e - a) / r);
		return o <= 0 && e > a ? (this.cur = null, 0) : i * o * t.I;
	}
	apply(e, t, n, r, i, a) {
		let o = t;
		for (; o > 1e-6;) {
			let e = Math.min(.004, o);
			this.bounce.v += (-160 * this.bounce.x - 1 * Math.sqrt(160) * this.bounce.v) * e, this.bounce.x += this.bounce.v * e, o -= e;
		}
		r[0] += this.bounce.x;
		let s = this.level(e);
		if (!this.cur || s <= 0) return 0;
		let c = ve[this.cur.name];
		for (let [e, t] of Object.entries(c.bs)) {
			if (e === "jawOpen") {
				a && (a.jawOpen = Math.max(a.jawOpen ?? 0, t * s));
				continue;
			}
			n[e] = t < 0 ? (n[e] ?? 0) * (1 - s) : Math.max(n[e] ?? 0, t * s);
		}
		for (let e = 0; e < 3; e++) r[e] += c.head[e] * s;
		return i[0] = i[0] * (1 - s) + c.gaze[0] * s, i[1] = i[1] * (1 - s) + c.gaze[1] * s, s;
	}
}, xe = class {
	constructor(e = 3) {
		this.s = {
			x: 0,
			v: 0
		}, this.voicedFor = 0, this.quietFor = 0, this.lastNod = -9, this.n = 0, this.smile = 0, this.seed = e, this.nods = [];
	}
	update(e, t, n, r) {
		let i = n && r > .12;
		i ? (this.voicedFor += t, this.quietFor = 0) : this.quietFor += t;
		let a = (t, n) => {
			this.s.v += t / .0468, this.lastNod = e, this.n++, this.voicedFor = 0, this.nods.push([+e.toFixed(2), n]);
		};
		n && !i && this.voicedFor >= .3 && this.quietFor > .12 && this.quietFor < .45 && e - this.lastNod > 1 ? a(this.n % 3 == 1 ? 5.5 : 3.5, "pause") : n && i && this.voicedFor > 1.8 && e - this.lastNod > 1.8 && a(2, "continuer"), n || (this.voicedFor = 0);
		let o = t;
		for (; o > 1e-6;) {
			let e = Math.min(.004, o);
			this.s.v += (-110 * this.s.x - 1.24 * Math.sqrt(110) * this.s.v) * e, this.s.x += this.s.v * e, o -= e;
		}
		let s = n ? i ? .12 : .06 : 0;
		return this.smile += (1 - Math.exp(-t / .5)) * (s - this.smile), {
			pitch: this.s.x,
			smile: this.smile
		};
	}
}, Z = new URLSearchParams(location.search), Se = Z.has("capture"), Ce = Z.get("base") || "./pack/", we = Z.get("ext") || (Ce.includes("pack") ? "webp" : "png"), Te = Z.has("facerig"), Q = 5, Ee = [
	{
		id: "idle",
		t0: 0,
		t1: 5,
		status: null
	},
	{
		id: "talking",
		t0: Q,
		t1: 17.9,
		status: "speaking"
	},
	{
		id: "listening",
		t0: 17.9,
		t1: 23.4,
		status: "listening",
		preset: "listening",
		child: [9.2, 14.7]
	},
	{
		id: "thinking",
		t0: 23.4,
		t1: 27.4,
		status: "thinking",
		preset: "thinking"
	},
	{
		id: "warm",
		t0: 27.4,
		t1: 29.6,
		status: "your_turn",
		preset: "warm"
	},
	{
		id: "delight",
		t0: 29.6,
		t1: 32,
		status: "your_turn",
		preset: "delight"
	},
	{
		id: "concern",
		t0: 32,
		t1: 34.6,
		status: "your_turn",
		preset: "concern"
	},
	{
		id: "surprise",
		t0: 34.6,
		t1: 36.8,
		status: "your_turn",
		preset: "surprise"
	},
	{
		id: "playful",
		t0: 36.8,
		t1: 39.2,
		status: "your_turn",
		preset: "playful"
	},
	{
		id: "turns",
		t0: 39.2,
		t1: 45.2,
		status: null,
		turn: !0
	}
], $ = 45.2;
function De(e) {
	for (let t of Ee) if (e >= t.t0 && e < t.t1) return t;
	return Ee[Ee.length - 1];
}
var Oe = { baanta: "t" };
function ke(e) {
	let t = [];
	for (let n of e.words) {
		let r = e.visemes.filter((e) => e.word === n.word && e.t0 >= n.t0 - .35 && e.t0 <= n.t1 + .05);
		r.forEach((e, i) => {
			let a = r[i + 1], o = e.t0, s = a ? a.t0 : Math.max(e.t1, n.t1) + .04, c = {};
			(e.viseme === "viseme_DD" || e.viseme === "viseme_nn") && (c.tongueTipUp = .8), e.letters === "l" && Object.assign(c, {
				tongueTipUp: .8,
				tongueWide: .6
			}), Oe[n.word] && e.letters === Oe[n.word] && Object.assign(c, {
				tongueCurl: .9,
				tongueTipUp: 0
			}), t.push({
				t0: o,
				t1: s,
				v: e.viseme,
				tongue: c,
				letters: e.letters,
				word: n.word
			});
		});
	}
	return t;
}
function Ae(e, t) {
	let n = {};
	for (let r of e) {
		if (t < r.t0 - .06 || t > r.t1 + .06) continue;
		let e = Math.max(0, Math.min(1, (t - (r.t0 - .05)) / .05, (r.t1 + .05 - t) / .05));
		n[r.v] = Math.max(n[r.v] ?? 0, e);
		for (let [t, i] of Object.entries(r.tongue)) n[t] = Math.max(n[t] ?? 0, i * e);
	}
	return n;
}
async function je() {
	let e = document.getElementById("c"), t = (Z.get("view") || "60,8,904").split(",").map(Number);
	Z.get("px") && (e.style.width = Z.get("px") + "px");
	let n = await _e.load(e, Ce, {
		ext: we,
		dpr: Se ? 1 : Math.min(2, devicePixelRatio || 1),
		view: t,
		preserve: Se,
		clear: Z.get("bg") ? Z.get("bg").split(",").map((e) => e / 255) : void 0
	});
	(Z.get("dbg") || Z.get("only")) && (n.debug = {
		tint: Z.get("dbg") === "tint",
		only: Z.get("only") ? Z.get("only").split(",") : null
	});
	let a = ke(await fetch("./audio/voice.align.json").then((e) => e.json())), o = await fetch("./audio/voice.mp3").then((e) => e.arrayBuffer()), s = await new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100).decodeAudioData(o.slice(0)), c = s.getChannelData(0), l = s.sampleRate, u = new r(l), d = new C({
		band: "b2",
		seed: 7,
		faceStyle: { smile: .7 }
	}), f = new O(.85), p = /* @__PURE__ */ new Float32Array(1024), m = -1, h = 0, g = null, _ = !1, v = "idle", y = new be(), b = new xe(), x = {
		work: [],
		rig: [],
		intervals: [],
		frames: 0,
		rows: []
	};
	function w(e) {
		let t = performance.now(), r = m < 0 ? 1 / 60 : Math.min(.25, e - m);
		m = e;
		let o = De(e);
		o.status !== g && (g = o.status, h = e, _ = !1);
		let s = e - Q, C = Math.floor(s * l);
		for (let e = 0; e < 1024; e++) {
			let t = C - 1024 + e;
			p[e] = t >= 0 && t < c.length ? c[t] : 0;
		}
		let w = u.step(p, e);
		w.speaking && (_ ||= e - h > .3);
		let T = S({
			status: o.status,
			tapSpeaking: w.speaking,
			silenceMs: w.silenceMs,
			spokeSinceStatus: _
		});
		v = T, d.setState(T);
		let E = d.update(e, {
			herRms: w.rms,
			herVoiced: w.voiced,
			childLevel: o.id === "listening" ? .4 : 0
		}), D = { ...E.bs }, O = [...E.head];
		o.preset && y.sceneId !== o.id && (y.sceneId = o.id, y.emote(o.preset, e, { hold: Math.max(.2, o.t1 - o.t0 - .9) })), o.preset || (y.sceneId = null);
		let k = 0;
		if (o.child) {
			let t = o.child[0] + (e - o.t0), n = Math.floor(t * l), r = 0;
			for (let e = 0; e < 1024; e++) {
				let t = c[n - 1024 + e] || 0;
				r += t * t;
			}
			k = Math.min(1, Math.sqrt(r / 1024) * 9);
		}
		let A = b.update(e, r, T === "listening", k);
		if (O[0] += A.pitch, D.mouthSmileLeft = (D.mouthSmileLeft ?? 0) + A.smile, D.mouthSmileRight = (D.mouthSmileRight ?? 0) + A.smile, o.turn) {
			let t = e - o.t0;
			O[1] = t < 1.5 ? -20 * Math.sin(t / 1.5 * Math.PI / 2) : t < 4 ? -20 + 40 * (.5 - .5 * Math.cos((t - 1.5) / 2.5 * Math.PI)) : 20 * Math.cos((t - 4) / 2 * Math.PI / 2), O[0] += t > 4.6 && t < 5.6 ? 8 * Math.sin((t - 4.6) / 1 * Math.PI) : 0;
		}
		let j = i(w), M = [...E.gaze];
		y.apply(e, r, D, O, M, j);
		let N = f.compose(D, j, r);
		o.id === "talking" && Object.assign(N, Ae(a, s));
		let P = Math.sin(e * 2 * Math.PI * .25), F = performance.now();
		Se && (n.clock = e), n.frame(N, O, M, E.lean, P);
		let ee = performance.now() - F;
		x.rig.push(ee);
		let I = performance.now() - t;
		return x.work.push(I), x.frames++, o.id === "talking" && x.rows.push({
			t: +s.toFixed(3),
			row: n.mouth.row,
			name: n.mouth.name,
			vis: Object.keys(N).filter((e) => e.startsWith("viseme_") && N[e] > .5)
		}), {
			t: e,
			scene: o.id,
			state: v,
			head: O,
			gaze: M,
			mouth: n.mouth.name,
			work: I
		};
	}
	let T = [
		["chalo", [
			[
				"CH",
				.09,
				"ch"
			],
			[
				"aa",
				.12,
				"a"
			],
			[
				"nn",
				.08,
				"l"
			],
			[
				"O",
				.17,
				"o"
			]
		]],
		[null, .22],
		["aao", [[
			"aa",
			.2,
			"aa"
		], [
			"O",
			.22,
			"o"
		]]],
		[null, .22],
		["mama", [
			[
				"PP",
				.1,
				"m"
			],
			[
				"aa",
				.14,
				"a"
			],
			[
				"PP",
				.1,
				"m"
			],
			[
				"aa",
				.17,
				"a"
			]
		]],
		[null, .22],
		["bubbly", [
			[
				"PP",
				.08,
				"b"
			],
			[
				"U",
				.12,
				"u"
			],
			[
				"PP",
				.08,
				"b"
			],
			[
				"nn",
				.08,
				"l"
			],
			[
				"I",
				.15,
				"ee"
			]
		]],
		[null, .35]
	], E = {
		CH: .25,
		aa: .55,
		nn: .28,
		O: .4,
		PP: 0,
		U: .2,
		I: .25
	}, D = [];
	{
		let e = .25;
		for (let [t, n] of T) {
			if (!t) {
				e += n;
				continue;
			}
			for (let [r, i, a] of n) {
				let n = r === "nn" ? {
					tongueTipUp: .8,
					tongueWide: .6
				} : {};
				D.push({
					t0: e,
					t1: e + i,
					v: "viseme_" + r,
					tongue: n,
					letters: a,
					word: t,
					jaw: E[r]
				}), e += i;
			}
		}
	}
	let k = D[D.length - 1].t1 + .4;
	function A(e) {
		let t = {
			mouthSmileLeft: .12,
			mouthSmileRight: .12,
			...Ae(D, e)
		}, r = 0;
		for (let t of D) {
			let n = Math.max(0, Math.min(1, (e - (t.t0 - .05)) / .05, (t.t1 + .05 - e) / .05));
			r = Math.max(r, t.jaw * n);
		}
		t.jawOpen = r, n.clock = 2e3 + e, n.frame(t, [
			0,
			0,
			0
		], [0, 0], 0, 0);
		let i = D.find((t) => e >= t.t0 && e < t.t1);
		return i ? `${i.word}:${i.letters}` : "";
	}
	if (window.P2D = {
		duration: $,
		scenes: Ee,
		stats: x,
		rig: n,
		listener: b,
		EXPRESSIONS: ve,
		gateAt: A,
		gateDur: k,
		gateSegs: D,
		renderAt: (e) => w(e),
		pose: (e) => {
			n.lastT = -1, n.solver.first = !0;
			let t = { ...e.bs || {} }, r = [...e.head || [
				0,
				0,
				0
			]], i = [...e.gaze || [0, 0]];
			if (e.expr) {
				let n = ve[e.expr];
				t = {
					mouthSmileLeft: .06,
					mouthSmileRight: .06,
					...t
				};
				for (let [e, r] of Object.entries(n.bs)) t[e] = r < 0 ? 0 : Math.max(t[e] ?? 0, r);
				r = r.map((e, t) => e + n.head[t]), i = [...n.gaze];
			}
			n.debug = e.debug || null;
			for (let a = 0; a < 6; a++) n.clock = 1e3 + a / 60, n.resetPhysics(), n.frame(t, r, i, e.lean || 0, 0);
			return n.debug = null, n.mouth.name;
		}
	}, Se) {
		window.P2D.ready = !0;
		return;
	}
	let j = new Audio("./audio/voice.mp3"), M = !1, N = performance.now() - (Z.get("start") || 0) * 1e3, P = -1, F = document.getElementById("hud");
	Te && document.body.classList.add("facerig");
	let ee = (() => {
		try {
			let e = document.createElement("canvas").getContext("webgl2"), t = e.getExtension("WEBGL_debug_renderer_info");
			return t ? e.getParameter(t.UNMASKED_RENDERER_WEBGL) : "renderer hidden";
		} catch {
			return "?";
		}
	})(), I = (t) => {
		let r = (t - N) / 1e3 % $;
		P > 0 && x.intervals.push(t - P), P = t, n.clock = r + Math.floor((t - N) / 1e3 / $) * $, r < m && (m = -1), !M && r >= Q && r < 17 && (M = !0, j.currentTime = Math.max(0, r - Q), j.play().catch(() => {})), r < Q && (M = !1);
		let i = w(r);
		if (F && x.frames % 15 == 0) {
			let t = x.intervals.slice(-180), r = t.length ? 1e3 / (t.reduce((e, t) => e + t, 0) / t.length) : 0, a = (e, t) => {
				let n = e.slice(-180).sort((e, t) => e - t);
				return n[Math.floor(n.length * t)] || 0;
			}, o = t.filter((e) => e > 20).length;
			Te ? F.innerHTML = `<b>${r.toFixed(0)} fps</b> · work p95 <b>${a(x.work, .95).toFixed(2)} ms</b> (p50 ${a(x.work, .5).toFixed(2)}) · rig p95 ${a(x.rig, .95).toFixed(2)} ms<br>slow frames ${o}/${t.length} · canvas ${e.width}x${e.height} @dpr ${(n.R.dpr || 1).toFixed(2)} · ${n.stats().meshes} draws · ${n.stats().triangles} tris<br><small>${ee}</small>` : F.textContent = `${i.scene} · ${i.state} · ${r.toFixed(0)} fps · work p95 ${a(x.work, .95).toFixed(2)} ms · ${n.stats().meshes} draws`;
		}
		requestAnimationFrame(I);
	};
	document.getElementById("start")?.addEventListener("click", () => {
		N = performance.now(), M = !1, m = -1;
	}), requestAnimationFrame(I), window.P2D.ready = !0;
}
je().catch((e) => {
	document.body.insertAdjacentHTML("beforeend", `<pre style="color:red">${e.stack}</pre>`), window.P2D = { error: String(e) };
});
//#endregion
export { $ as DURATION };
