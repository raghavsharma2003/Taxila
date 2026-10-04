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
		this.sampleRate = e, this.tau = (t.tauMs ?? 50) / 1e3, this.ceiling = t.jawCeiling ?? .85, this.shapeGain = t.shapeGain ?? .35, this.ref = t.initialRef ?? .06, this.gateFrac = t.gateFrac ?? .06, this.refScale = t.refScale ?? .7, this.curve = t.curve ?? 1;
	}
	get reference() {
		return this.ref;
	}
	reset() {
		this.jaw = this.wide = this.round = 0, this.voicedRun = 0, this.speaking = !1, this.lastT = -1, this.lastVoicedT = -Infinity;
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
		let u = n((o - s) / Math.max(1e-4, this.ref * this.refScale - s)), d = this.ceiling * u ** +this.curve, f = 1 - Math.exp(-a / this.tau);
		this.jaw += f * (d - this.jaw), this.jaw < .005 && (this.jaw = 0);
		let p = n((this.jaw - .05) / .25), m = c ? t(r, this.sampleRate) : 0, h = c ? n((m - .3) / .3) * p : 0, g = c ? n((.12 - m) / .1) * p : 0, _ = 1 - Math.exp(-a / .06);
		return this.wide += _ * (h - this.wide), this.round += _ * (g - this.round), {
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
		], N = this.brow, P = (e - N.t0) * 1e3, F = P < 0 ? 0 : P < 80 ? N.amp * P / 80 : P < 320 ? N.amp : P < 520 ? N.amp * (1 - (P - 320) / 200) : 0, ee = this.reduced ? .3 : 1, I = {}, L = (e, t) => {
			I[e + "Left"] = (I[e + "Left"] ?? 0) + t * this.asym, I[e + "Right"] = (I[e + "Right"] ?? 0) + t / this.asym;
		};
		if (T) for (let [e, t] of Object.entries(T.bs)) {
			let n = t * _ * ee;
			e === "mouthSmile" && (n *= this.smileGain / .7), this.gentle && h.has(e) && (n *= .5), e.startsWith("brow") && (n *= this.browGain), e === "browInnerUp" ? I.browInnerUp = (I.browInnerUp ?? 0) + n : L(e, n);
		}
		L("mouthSmile", (this.state === "thinking" ? .03 : this.state === "speaking" ? .06 : .1) * this.smileGain * (this.gentle ? .5 : 1)), L("browOuterUp", F * this.browGain), I.browInnerUp = (I.browInnerUp ?? 0) + (F * .8 + (this.state === "listening" ? .08 : 0)) * this.browGain;
		let te = Math.max(I.eyeSquintLeft ?? 0, I.eyeSquintRight ?? 0) * .3, R = Math.max(f, te);
		I.eyeBlinkLeft = R, I.eyeBlinkRight = R;
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
}, k = "#version 300 es\nin vec2 aPos; in vec2 aUv;\nuniform vec2 uView; uniform vec4 uCam; // cam: x0, y0, scale, flipY\nout vec2 vUv; out vec2 vRest;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vUv = aUv;\n}", A = "#version 300 es\nprecision mediump float;\nin vec2 vUv;\nuniform sampler2D uTex; uniform float uAlpha; uniform vec4 uShade; // shade: dirX, x0, x1, amount\nuniform vec4 uRect; // texture rect in rest space (x0,y0,w,h) for shading position\nuniform vec4 uTint; // debug: rgb, amount\nout vec4 o;\nvoid main(){\n  vec4 c = texture(uTex, vUv);\n  float x = uRect.x + vUv.x * uRect.z;\n  float s = clamp((x - uShade.y) / (uShade.z - uShade.y), 0.0, 1.0);\n  s = uShade.x > 0.0 ? s : 1.0 - s;\n  c.rgb *= 1.0 - uShade.w * s * s;\n  c.rgb = mix(c.rgb, uTint.rgb * c.a, uTint.a);\n  o = c * uAlpha;\n}", j = "#version 300 es\nin vec2 aPos; in vec2 aRest; in float aEdge; in float aTop;\nuniform vec2 uView; uniform vec4 uCam;\nout vec2 vRest; out float vEdge; out float vTop;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vRest = aRest; vEdge = aEdge; vTop = aTop;\n}", M = "#version 300 es\nprecision highp float;\nin vec2 vRest; in float vEdge; in float vTop;\nuniform sampler2D uSclera; uniform vec4 uScleraRect;\nuniform sampler2D uIris; uniform vec4 uIrisRect;\nuniform sampler2D uCatch; uniform vec4 uCatchRect;\nuniform vec2 uIrisOff; uniform vec2 uIrisC; uniform vec2 uIrisScale; uniform vec2 uCatchOff; uniform float uCatchA;\nuniform float uLidShade; uniform float uTopY;\nout vec4 o;\nvec4 tex(sampler2D t, vec4 r, vec2 p){\n  vec2 uv = (p - r.xy) / r.zw;\n  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);\n  return texture(t, uv);\n}\nvoid main(){\n  vec4 s = tex(uSclera, uScleraRect, vRest);\n  vec3 col = s.a > 0.0 ? s.rgb / s.a : vec3(0.95);\n  vec2 ip = uIrisC + (vRest - uIrisC - uIrisOff) / uIrisScale;\n  vec4 ir = tex(uIris, uIrisRect, ip);\n  col = col * (1.0 - ir.a) + ir.rgb;\n  // lid shadow: the band right under the upper lid darkens a little (wraps the eye)\n  // r2: per-column lid line (vTop), a soft wrap shadow ~10 px deep under the whole lid, as in c-front\n  float dl = clamp((vRest.y - vTop) / 10.0, 0.0, 1.0);\n  col *= 1.0 - uLidShade * (1.0 - dl) * (1.0 - dl);\n  vec4 cl = tex(uCatch, uCatchRect, vRest - uCatchOff);\n  col = mix(col, vec3(1.0), cl.a * uCatchA);\n  float a = clamp(vEdge, 0.0, 1.0);\n  o = vec4(col * a, a);\n}";
function N(e, t, n) {
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
var P = class {
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
		this.gl = r, this.canvas = e, this.clear = t, this.paint = N(r, k, A), this.eye = N(r, j, M), r.enable(r.BLEND), r.blendFunc(r.ONE, r.ONE_MINUS_SRC_ALPHA), r.disable(r.DEPTH_TEST), this.cam = [
			0,
			0,
			1,
			0
		], this.draws = 0, this.tris = 0;
	}
	texture(e) {
		let t = this.gl, n = t.createTexture();
		return t.bindTexture(t.TEXTURE_2D, n), t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !0), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, t.RGBA, t.UNSIGNED_BYTE, e), t.generateMipmap(t.TEXTURE_2D), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR_MIPMAP_LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE), n;
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
	drawEye(e, t) {
		let n = this.gl, r = this.eye;
		n.useProgram(r.p), n.uniform2f(r.u.uView, this.canvas.width, this.canvas.height), n.uniform4fv(r.u.uCam, this.cam);
		let i = (e, t, i, a, o) => {
			n.activeTexture(n.TEXTURE0 + e), n.bindTexture(n.TEXTURE_2D, i), n.uniform1i(r.u[t], e), n.uniform4f(r.u[o], a[0], a[1], a[2] - a[0], a[3] - a[1]);
		};
		i(0, "uSclera", t.sclera.tex, t.sclera.rect, "uScleraRect"), i(1, "uIris", t.iris.tex, t.iris.rect, "uIrisRect"), i(2, "uCatch", t.catch.tex, t.catch.rect, "uCatchRect"), n.uniform2fv(r.u.uIrisOff, t.irisOff), n.uniform2fv(r.u.uIrisC, t.irisC), n.uniform2fv(r.u.uIrisScale, t.irisScale), n.uniform2fv(r.u.uCatchOff, t.catchOff), n.uniform1f(r.u.uCatchA, t.catchA), n.uniform1f(r.u.uLidShade, t.lidShade), n.uniform1f(r.u.uTopY, t.topY), n.bindVertexArray(e.vao), n.drawElements(n.TRIANGLES, e.count, n.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
}, F = {
	viseme_sil: "closed",
	viseme_PP: "PP",
	viseme_FF: "FF",
	viseme_TH: "TH",
	viseme_DD: "DD",
	viseme_kk: "kk",
	viseme_CH: "CH",
	viseme_SS: "SS",
	viseme_nn: "DD",
	viseme_RR: "RR",
	viseme_aa: "aa",
	viseme_E: "E",
	viseme_I: "I",
	viseme_O: "O",
	viseme_U: "U"
}, ee = {
	closed: 0,
	PP: 0,
	FF: .08,
	TH: .15,
	DD: .2,
	RETRO: .35,
	LL: .2,
	kk: .3,
	CH: .12,
	SS: .08,
	RR: .25,
	aa: .75,
	E: .4,
	I: .15,
	O: .5,
	U: .15,
	small: .2
}, I = {
	warm: {
		closed: "rest",
		small: "open_sm"
	},
	delight: {
		closed: "grin",
		small: "grin_sm",
		aa: "laugh",
		E: "grin_E",
		I: "grin_E",
		kk: "laugh",
		SS: "grin_E",
		DD: "grin_sm",
		open_sm: "grin_sm"
	},
	concern: {
		closed: "concern",
		small: "concern_sm",
		aa: "concern_aa",
		O: "concern_O",
		U: "concern_O",
		kk: "concern_sm",
		E: "concern_sm",
		I: "concern_sm"
	},
	neutral: {
		closed: "neutral",
		small: "open_sm"
	}
}, L = .045, te = class {
	constructor(e) {
		this.have = new Set(e), this.from = "rest", this.to = "rest", this.t = 1, this.row = "closed";
	}
	pickRow(e) {
		let t = (t) => e[t] ?? 0, n = null, r = .22;
		for (let e in F) t(e) > r && (r = t(e), n = F[e]);
		let i = Math.min(1, t("jawOpen") / .85);
		if (n) {
			if ((n === "DD" || n === "RR" || n === "kk") && t("tongueCurl") > .3 ? n = "RETRO" : n === "DD" && t("tongueTipUp") > .3 && t("tongueWide") > .3 && (n = "LL"), n === "closed" && i > .12) n = null;
			else return n;
		}
		let a = Math.max(t("mouthFunnel"), t("mouthPucker")), o = (t("mouthStretchLeft") + t("mouthStretchRight")) / 2, s = (e, t) => this.row === e ? t - .04 : t + 0;
		return i < (this.row === "closed" ? .09 : .06) ? "closed" : a > s("O", .12) || a > s("U", .12) ? i < .35 ? "U" : "O" : o > s("E", .12) || o > s("I", .12) ? i < .3 ? "I" : "E" : i < (this.row === "small" ? .32 : .28) ? "small" : i < (this.row === "kk" ? .6 : .55) ? "kk" : "aa";
	}
	solve(e, t) {
		let n = (t) => e[t] ?? 0, r = n("mouthSmileLeft"), i = n("mouthSmileRight"), a = (r + i) / 2 - (n("mouthFrownLeft") + n("mouthFrownRight")) / 2, o = (n("mouthPressLeft") + n("mouthPressRight")) / 2, s = a < .12 ? Math.max(n("browInnerUp") > .18 && o > .04 ? .5 + o : 0, -a * 2) : 0, c = Math.min(1, n("jawOpen") / .85), l = this.pickRow(e);
		this.row = l;
		let u, d = n("mouthLeft") - n("mouthRight");
		u = l === "closed" && Math.abs(d) > .18 && a < .3 ? "aside" : n("eyeWideLeft") + n("eyeWideRight") > .5 && c > .2 && a < .3 && (l === "aa" || l === "O" || l === "kk") ? "surprise" : l === "closed" && Math.abs(r - i) > .14 && a > .18 ? "playful" : I[a > .33 ? "delight" : s > .3 ? "concern" : "warm"][l] ?? l, this.have.has(u) || (u = I.warm[l] ?? l), this.have.has(u) || (u = "rest"), u !== this.to && (this.from = this.t > .5 ? this.to : this.from, this.to = u, this.t = 0), this.t = Math.min(1, this.t + t / L);
		let f = this.t >= 1 || this.from === this.to ? [[this.to, 1]] : [[this.from, 1], [this.to, this.t]], p = Math.max(n("mouthFunnel"), n("mouthPucker")), m = (n("mouthStretchLeft") + n("mouthStretchRight")) / 2, h = ee[l] ?? .2;
		return {
			draw: f,
			name: u,
			row: l,
			wide: Math.min(1, m * 1.5),
			round: Math.min(1, p),
			skew: d * .8 + (r - i) * .6,
			shift: Math.max(-1, Math.min(1, d * 1.6)) * 16 * (a < .3 ? 1 : .4),
			liftR: Math.max(0, r - i) * 7,
			liftL: Math.max(0, i - r) * 7,
			scale: u === "laugh" || u === "grin_E" ? .9 : 1,
			tilt: u === "aside" ? Math.max(-1, Math.min(1, d * 1.6)) * 9 : 0,
			narrow: u === "aside" ? .16 * Math.min(1, Math.abs(d) * 1.6) : 0,
			lowerDrop: Math.max(-2, Math.min(3, (c - h) * 6)),
			jawGain: l === "closed" || l === "PP" ? .2 : 1
		};
	}
}, R = (e, t, n) => e < t ? t : e > n ? n : e, z = (e) => R(e, 0, 1), B = (e, t, n) => {
	let r = z((n - e) / (t - e));
	return r * r * (3 - 2 * r);
}, V = Math.PI / 180, ne = {
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
}, H = {
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
function U(e, t) {
	let n = (e - H.cx) / H.rx, r = (t - H.cy) / H.ry, i = Math.max(0, 1 - n * n - r * r), a = H.A * i * i;
	a += H.B * Math.exp(-((e - H.fcx) ** 2) / (2 * H.fsx * H.fsx) - (t - H.fcy) ** 2 / (2 * H.fsy * H.fsy)), a += 26 * Math.exp(-((e - 530) ** 2 + (t - 532) ** 2) / 1152);
	for (let n of [452, 608]) a += 8 * Math.exp(-((e - n) ** 2 + (t - 585) ** 2) / 4050);
	return a;
}
function W(e, t) {
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
function G(e, t) {
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
function K(e, t, n) {
	let r = n - e;
	if (r <= 0) return t[0];
	if (r >= t.length - 1) return t[t.length - 1];
	let i = Math.floor(r), a = r - i;
	return t[i] * (1 - a) + t[i + 1] * a;
}
var q = class {
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
}, re = class e {
	static async load(t, n, r = {}) {
		let i = (e) => fetch(n + e).then((e) => e.json()), [a, o] = await Promise.all([i("geom.json"), i("mouths.json")]), s = Object.keys(a.rects).concat(["mouths"]), c = {};
		return await Promise.all(s.map(async (e) => {
			let t = new Image();
			t.src = `${n}${e}.png`, await t.decode(), c[e] = t;
		})), new e(t, a, o, c, r);
	}
	constructor(e, t, n, r, i) {
		this.g = t, this.M = n, this.R = new P(e, {
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
		for (let [e, t] of Object.entries(r)) this.tex[e] = this.R.texture(t);
		this.solver = new te(Object.keys(n.patches)), this.clock = null, this.lastT = -1, this.layers = {};
		let a = this.R.paint, o = (e, n, r) => {
			let i = t.rects[e], o = W(i, n), s = new Float32Array(o.rest), c = new Float32Array(o.n);
			for (let e = 0; e < o.n; e++) c[e] = U(o.rest[e * 2], o.rest[e * 2 + 1]);
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
			for (let t = 0; t < e.n; t++) e.z[t] -= 45 * B(585, 650, e.rest[t * 2 + 1]);
		}
		for (let e of ["L", "R"]) {
			let t = this.layers["lock" + e];
			t.y0 = t.rect[1] + 6, t.len = t.rect[3] - t.y0, t.spring = new q(55, .22), t.springY = new q(70, .3);
		}
		this.bunSpring = [new q(90, .5), new q(90, .5)], this.eyes = {};
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
			}, G(o, 4)), p = n.lashX[0], m = n.lashX[1], h = Math.floor((m - p) / 3) + 1, g = new Float32Array(h * 8 * 2), _ = new Float32Array(h * 8 * 2), v = new Float32Array(h * 8), y = t.rects["lid" + e];
			for (let e = 0; e < h; e++) {
				let t = Math.min(m, p + e * 3), r = K(p, n.lashTop, t) - n.fall, i = K(p, n.lashBot, t) + 8.5;
				for (let n = 0; n < 8; n++) {
					let a = n / 7, o = r + a * (i - r), s = e * 8 + n;
					g[s * 2] = t, g[s * 2 + 1] = o, _[s * 2] = (t - y[0]) / (y[2] - y[0]), _[s * 2 + 1] = (o - y[1]) / (y[3] - y[1]), v[s] = B(.1, .55, a);
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
			}, G(h, 8)), S = Math.floor((i - r) / 3) + 1, C = new Float32Array(S * 5 * 2), w = new Float32Array(S * 5 * 2), T = new Float32Array(S * 5), E = t.rects["lower" + e];
			for (let e = 0; e < S; e++) {
				let t = Math.min(i, r + e * 3), a = K(r, n.bot, t);
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
			}, G(S, 5));
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
		let [s, c] = n.cell, [l, u] = n.origin;
		this.mouthRect = [
			l,
			u,
			l + s,
			u + c
		];
		let d = W(this.mouthRect, 14);
		this.mouthRest = d.rest, this.mouthPos = new Float32Array(d.rest), this.mouthZ = new Float32Array(d.n);
		for (let e = 0; e < d.n; e++) this.mouthZ[e] = U(d.rest[e * 2], d.rest[e * 2 + 1]);
		let f = r.mouths.width, p = r.mouths.height;
		this.mouthMesh = {};
		for (let [e, t] of Object.entries(n.patches)) {
			let n = new Float32Array(d.n * 2);
			for (let e = 0; e < d.n; e++) n[e * 2] = (t.cell[0] + d.uv[e * 2] * s) / f, n[e * 2 + 1] = (t.cell[1] + d.uv[e * 2 + 1] * c) / p;
			this.mouthMesh[e] = this.R.mesh(a, {
				aPos: {
					data: this.mouthPos,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: n,
					size: 2
				}
			}, d.idx);
		}
		this.mouthN = d.n, this.prevAnchor = null, this.prevVel = {
			L: [0, 0],
			R: [0, 0],
			bun: [0, 0]
		}, this.st = null;
	}
	now() {
		return this.clock ?? performance.now() / 1e3;
	}
	apply(e, t, n, r, i) {
		let a = this.now(), o = this.lastT < 0 ? 1 / 60 : R(a - this.lastT, 0, .1);
		this.lastT = a, this.bs = e, this.gaze = n;
		let s = (t) => e[t] ?? 0, c = R(t[1], -20, 20), l = R(t[0], -10, 12), u = R(t[2], -12, 12), d = {
			sy: Math.sin(c * V) * H.gain,
			cy: Math.cos(c * V),
			sp: Math.sin(l * V) * H.gain,
			cp: Math.cos(l * V),
			sr: Math.sin(-u * V),
			cr: Math.cos(-u * V),
			yaw: c,
			pitch: l,
			roll: u,
			bob: -i * 1.4,
			leanS: 1 + .03 * r,
			leanY: 7 * r
		};
		this.st = d;
		let f = (s("mouthSmileLeft") + s("mouthSmileRight")) / 2, p = (s("cheekSquintLeft") + s("cheekSquintRight")) / 2, m = z(s("jawOpen") / .85);
		this.expr = {
			smile: f,
			cheek: p,
			open: m
		}, this.browCh = {
			L: this.browChannels("L"),
			R: this.browChannels("R")
		}, this.mouth = this.solver.solve(e, o);
		let h = {
			L: "Right",
			R: "Left"
		}, g = z(-n[1] / 25), _ = z(n[1] / 20);
		for (let e of ["L", "R"]) {
			let t = this.eyes[e], n = t.e, r = h[e], i = (e) => {
				let t = s(e + "Left"), n = s(e + "Right");
				return Math.abs(t - n) < .12 ? (t + n) / 2 : s(e + r);
			}, a = s("eyeBlink" + r), o = i("eyeSquint"), c = s("eyeWide" + r), l = i("cheekSquint"), u = i("mouthSmile");
			for (let e = 0; e <= t.xb - t.xa; e++) {
				let r = n.top[e], i = n.bot[e], s = i - r, d = e / (t.xb - t.xa), f = Math.max(0, Math.sin(Math.PI * d)) ** .7, p = (o * .3 + l * .2 + u * .06) * s * f ** 1.4, m = i - p, h = (g * .14 - _ * .02) * s * f, v = r + .72 * (i - r) - Math.min(p, .25 * s), y = r + h - c * .13 * s * f, b = a * a * (3 - 2 * a);
				y += (v - y) * b, m += (v - m) * Math.max(0, (b - .35) / .65), y > m && (y = m), t.top[e] = y, t.bot[e] = m;
			}
			t.blink = a;
		}
		let v = this.project(530, 300, 120);
		if (this.prevAnchor) {
			let e = (v[0] - this.prevAnchor[0]) / Math.max(o, .001), t = (v[1] - this.prevAnchor[1]) / Math.max(o, .001), n = (e - this.prevVel.L[0]) / Math.max(o, .001), r = (t - this.prevVel.L[1]) / Math.max(o, .001);
			this.prevVel.L = [e, t];
			let i = this.reduced ? .3 : 1;
			for (let e of ["L", "R"]) {
				let t = this.layers["lock" + e];
				t.sx = t.spring.step(-R(n, -4e3, 4e3) * .02 * i + d.sr * 0, o), t.sy = t.springY.step(-R(r, -4e3, 4e3) * .01 * i, o);
			}
			this.bunOff = [this.bunSpring[0].step(-R(n, -4e3, 4e3) * .012 * i, o), this.bunSpring[1].step(-R(r, -4e3, 4e3) * .012 * i, o)];
		} else this.bunOff = [0, 0];
		this.prevAnchor = v;
	}
	project(e, t, n) {
		let r = this.st, i = e - H.cx, a = t - H.cy, o = i * r.cy + n * r.sy, s = -i * Math.sin(r.yaw * V) + n * r.cy, c = a * r.cp + s * r.sp, l = H.cx + o, u = H.cy + c, d = l - H.pivot[0], f = u - H.pivot[1];
		return l = H.pivot[0] + d * r.cr - f * r.sr, u = H.pivot[1] + d * r.sr + f * r.cr, l = H.pivot[0] + (l - H.pivot[0]) * r.leanS, u = H.pivot[1] + (u - H.pivot[1]) * r.leanS + r.bob * .6 + r.leanY, [l, u];
	}
	faceOffset(e, t) {
		let { smile: n, cheek: r, open: i } = this.expr, a = 0, o = 0;
		for (let i of [455, 605]) {
			let s = Math.exp(-((e - i) ** 2 + (t - 585) ** 2) / 3528);
			o -= (n * 4 + r * 3) * s, a += Math.sign(e - 530) * n * 1.5 * s;
		}
		let s = B(615, 700, t) * Math.exp(-(((e - 530) / 115) ** 2));
		return o += i * 7 * s * (this.mouth ? this.mouth.jawGain : 1), [a, o];
	}
	deformLayer(e) {
		let t = this.st, n = e.pos, r = e.rest, i = e.z, a = e.n;
		if (e.kind === "static") return !1;
		if (e.kind === "body") {
			for (let e = 0; e < a; e++) {
				let i = r[e * 2], a = r[e * 2 + 1], o = 1024 + (a - 1024) * (1 + .004 * t.bob / -1.4), s = i, c = B(752, 655, a) * Math.exp(-(((i - 530) / 125) ** 2));
				if (c > 0) {
					let [e, t] = this.project(i, a, U(i, a));
					s += (e - i) * .55 * c, o += (t - a) * .55 * c;
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
				let t = z((l - e.y0) / e.len) ** 1.4;
				a += (e.sx || 0) * t, l += (e.sy || 0) * t * .3;
			} else c && (a += this.bunOff ? this.bunOff[0] : 0, l += this.bunOff ? this.bunOff[1] : 0);
			let u = this.project(a, l, i[t]);
			n[t * 2] = u[0], n[t * 2 + 1] = u[1];
		}
		return !0;
	}
	browChannels(e) {
		let t = this.bs, n = e === "L" ? "Right" : "Left", r = t.browInnerUp ?? 0, i = t["browOuterUp" + n] ?? 0, a = t["browDown" + n] ?? 0;
		return {
			lift: 10 * (t["eyeWide" + n] ?? 0) + 9 * i + 4 * r,
			inner: 28 * r,
			arch: 30 * i,
			knit: 16 * a
		};
	}
	browOffset(e, t, n) {
		let r = this.g.brows[e], i = r.x[0], a = r.x[1], o = z(e === "L" ? (a - t) / (a - i) : (t - i) / (a - i)), s = this.browCh[e], c = Math.exp(-(((o - .62) / .3) ** 2)), l = -s.lift - s.inner * (1 - o) ** 1.3 - s.arch * (.35 + .65 * c) * o ** .5 + s.knit * (1 - .6 * o);
		return [(e === "L" ? 1 : -1) * (s.knit * .45 + s.inner * .08) * (1 - o) ** 1.5, l];
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
			this.deformLayer(r) && e.update(r.mesh, "aPos", r.pos), !(i && i.only && !i.only.includes(t)) && e.drawPaint(r.mesh, this.tex[t], r.rect, 1, n, i && i.tint ? ne[t] : null);
		};
		a("hairback", r), a("bun", r), a("body"), a("ears", n), a("face", n);
		for (let e of ["L", "R"]) this.drawEye(e, n);
		a("browL"), a("browR"), this.drawMouth(n), a("lockbed", n), a("hair", r), a("lockL"), a("lockR");
	}
	drawEye(e, t) {
		let n = this.eyes[e], r = n.e, i = this.R, a = this.st, o = (e, t) => U(e, t), s = 0;
		for (let e = 0; e < n.C; e++) {
			let t = Math.min(n.xb, n.xa + e * 2), r = t - n.xa, i = n.top[r], a = n.bot[r], c = [
				i - 2.1,
				i - .1,
				Math.max(i - .1, a - .6),
				Math.max(i - .1, a + 1.4)
			];
			for (let e = 0; e < 4; e++) {
				let r = a <= i + .05 ? i : c[e];
				n.restA[s * 2] = t, n.restA[s * 2 + 1] = r, n.topA[s] = i;
				let l = this.project(t, r, o(t, r));
				n.pos[s * 2] = l[0], n.pos[s * 2 + 1] = l[1], s++;
			}
		}
		i.update(n.mesh, "aPos", n.pos), i.update(n.mesh, "aRest", n.restA), i.update(n.mesh, "aTop", n.topA);
		let c = this.gaze || [0, 0], l = c[0] / 25 * 17, u = -(c[1] / 20) * 8 + (c[1] < 0 ? -c[1] / 25 * 2 : 0), d = Math.cos((c[0] + .2 * a.yaw) * V * 1.2), [f, p] = r.iris;
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
			irisOff: [l, u],
			irisC: [f + l, p + u],
			irisScale: [Math.max(.82, d), n.blink > .85 ? .95 : 1],
			catchOff: [l * .45, u * .45],
			catchA: 1,
			lidShade: .16,
			topY: K(n.xa, n.top, f)
		});
		for (let e = 0; e < n.BC; e++) for (let t = 0; t < n.BR; t++) {
			let i = e * n.BR + t, a = n.brest[i * 2], s = n.brest[i * 2 + 1], c = Math.round(a - n.xa), l = s - (r.bot[R(c, 0, r.bot.length - 1)] - n.bot[R(c, 0, n.bot.length - 1)]) * (1 - .75 * n.bv[i]), u = this.project(a, l, o(a, l));
			n.bpos[i * 2] = u[0], n.bpos[i * 2 + 1] = u[1];
		}
		i.update(n.bmesh, "aPos", n.bpos), i.drawPaint(n.bmesh, this.tex["lower" + e], this.g.rects["lower" + e], 1, t);
		let m = n.LC * n.LR;
		for (let e = 0; e < m; e++) {
			let t = n.lrest[e * 2], i = n.lrest[e * 2 + 1], a = Math.round(t - n.xa), s = 1;
			a < 0 && (s = Math.max(.45, 1 + a / 30), a = 0), a > n.xb - n.xa && (s = Math.max(.45, 1 - (a - (n.xb - n.xa)) / 30), a = n.xb - n.xa);
			let c = i + (n.top[a] - r.top[a]) * s * n.lv[e], l = this.project(t, c, o(t, c));
			n.lpos[e * 2] = l[0], n.lpos[e * 2 + 1] = l[1];
		}
		i.update(n.lmesh, "aPos", n.lpos), i.drawPaint(n.lmesh, this.tex["lid" + e], this.g.rects["lid" + e], 1, t);
	}
	drawMouth(e) {
		let t = this.mouth, n = this.R, r = this.mouthRest, i = this.mouthPos;
		for (let e = 0; e < this.mouthN; e++) {
			let n = r[e * 2], a = r[e * 2 + 1], [o, s] = this.faceOffset(n, a);
			n += o, a += s;
			let c = Math.exp(-(((a - 628) / 50) ** 2)), l = 1 + .1 * this.expr.open;
			n = 530 + (n - 530) * l, a = 628 + (a - 628) * l, n += (n - 530) * (t.wide * .05 - t.round * .04) * c + t.skew * 6 * c * Math.exp(-(((n - 530) / 90) ** 2)), n += (t.shift || 0) * Math.exp(-(((a - 628) / 70) ** 2));
			let u = z((Math.abs(n - 530) - 30) / 60);
			a -= (n > 530 ? t.liftR || 0 : t.liftL || 0) * u * u * c, a -= (t.tilt || 0) * ((n - 530) / 90) * c, n = 530 + (n - 530) * (1 - (t.narrow || 0) * c);
			let d = t.scale ?? 1;
			n = 530 + (n - 530) * d, a = 628 + (a - 628) * d, a += t.lowerDrop * B(623, 668, a) * Math.exp(-(((n - 530) / 90) ** 2));
			let f = this.project(n, a, this.mouthZ[e]);
			i[e * 2] = f[0], i[e * 2 + 1] = f[1];
		}
		for (let [r, a] of t.draw) n.update(this.mouthMesh[r], "aPos", i), n.drawPaint(this.mouthMesh[r], this.tex.mouths, this.mouthRect, a, e);
	}
	resetPhysics() {
		for (let e of ["L", "R"]) {
			let t = this.layers["lock" + e];
			t.spring.x = t.spring.v = t.springY.x = t.springY.v = 0;
		}
		for (let e of this.bunSpring) e.x = e.v = 0;
		this.prevAnchor = null, this.prevVel.L = [0, 0];
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
}, J = {
	thinking: {
		bs: {
			browOuterUpLeft: .95,
			browInnerUp: .05,
			browDownRight: .55,
			eyeSquintRight: .25,
			eyeWideLeft: .04,
			mouthLeft: .6,
			mouthPressLeft: .3,
			mouthPressRight: .3,
			mouthSmileLeft: .1,
			mouthSmileRight: -1
		},
		head: [
			-3,
			-6,
			7
		],
		gaze: [15, 17],
		env: [
			.35,
			0,
			.45
		]
	},
	listening: {
		bs: {
			mouthSmileLeft: .3,
			mouthSmileRight: .3,
			cheekSquintLeft: .12,
			cheekSquintRight: .12,
			eyeSquintLeft: .1,
			eyeSquintRight: .1,
			browInnerUp: .28,
			browOuterUpLeft: .18,
			browOuterUpRight: .18
		},
		head: [
			2.5,
			3,
			-6
		],
		gaze: [0, 0],
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
			mouthSmileLeft: .8,
			mouthSmileRight: .8,
			cheekSquintLeft: .35,
			cheekSquintRight: .35,
			eyeSquintLeft: .22,
			eyeSquintRight: .22,
			browOuterUpLeft: .35,
			browOuterUpRight: .35,
			browInnerUp: .15,
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
			browDownLeft: .3,
			browDownRight: .3,
			eyeBlinkLeft: .22,
			eyeBlinkRight: .22,
			mouthPressLeft: .25,
			mouthPressRight: .25,
			mouthFrownLeft: .2,
			mouthFrownRight: .2,
			mouthSmileLeft: -1,
			mouthSmileRight: -1
		},
		head: [
			4,
			2,
			7
		],
		gaze: [0, -4],
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
			mouthSmileLeft: .7,
			mouthSmileRight: .08,
			cheekSquintLeft: .45,
			browOuterUpLeft: .95,
			browDownRight: .35,
			eyeSquintRight: .55,
			cheekSquintRight: .25,
			eyeSquintLeft: .05
		},
		head: [
			-1,
			6,
			-8
		],
		gaze: [-5, 2],
		env: [
			.25,
			0,
			.45
		]
	}
}, ie = (e) => e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e), ae = class {
	constructor() {
		this.cur = null, this.bounce = {
			x: 0,
			v: 0
		};
	}
	emote(e, t, { hold: n = 1.6, intensity: r = 1 } = {}) {
		let i = J[e];
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
		let [n, , r] = J[t.name].env, i = ie((e - t.t0) / n), a = t.rel >= 0 ? t.rel : t.t0 + n + t.hold, o = e < a ? 1 : 1 - ie((e - a) / r);
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
		let c = J[this.cur.name];
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
}, oe = class {
	constructor(e = 3) {
		this.s = {
			x: 0,
			v: 0
		}, this.voicedFor = 0, this.quietFor = 0, this.lastNod = -9, this.n = 0, this.smile = 0, this.seed = e, this.nods = [];
	}
	update(e, t, n, r) {
		let i = n && r > .12;
		if (i ? (this.voicedFor += t, this.quietFor = 0) : this.quietFor += t, n && !i && this.voicedFor >= .6 && this.quietFor > .18 && this.quietFor < .45 && e - this.lastNod > 1.6) {
			let t = this.n % 3 == 1;
			this.s.v += (t ? 5.5 : 3.5) / .0468, this.lastNod = e, this.n++, this.voicedFor = 0, this.nods.push(+e.toFixed(2));
		}
		n || (this.voicedFor = 0);
		let a = t;
		for (; a > 1e-6;) {
			let e = Math.min(.004, a);
			this.s.v += (-110 * this.s.x - 1.24 * Math.sqrt(110) * this.s.v) * e, this.s.x += this.s.v * e, a -= e;
		}
		let o = n ? i ? .12 : .06 : 0;
		return this.smile += (1 - Math.exp(-t / .5)) * (o - this.smile), {
			pitch: this.s.x,
			smile: this.smile
		};
	}
}, Y = new URLSearchParams(location.search), X = Y.has("capture"), se = Y.get("base") || "./layers/", Z = 5, Q = [
	{
		id: "idle",
		t0: 0,
		t1: 5,
		status: null
	},
	{
		id: "talking",
		t0: Z,
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
function ce(e) {
	for (let t of Q) if (e >= t.t0 && e < t.t1) return t;
	return Q[Q.length - 1];
}
var le = { baanta: "t" };
function ue(e) {
	let t = [];
	for (let n of e.words) {
		let r = e.visemes.filter((e) => e.word === n.word && e.t0 >= n.t0 - .35 && e.t0 <= n.t1 + .05);
		r.forEach((e, i) => {
			let a = r[i + 1], o = e.t0, s = a ? a.t0 : Math.max(e.t1, n.t1) + .04, c = {};
			(e.viseme === "viseme_DD" || e.viseme === "viseme_nn") && (c.tongueTipUp = .8), e.letters === "l" && Object.assign(c, {
				tongueTipUp: .8,
				tongueWide: .6
			}), le[n.word] && e.letters === le[n.word] && Object.assign(c, {
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
function de(e, t) {
	let n = {};
	for (let r of e) {
		if (t < r.t0 - .06 || t > r.t1 + .06) continue;
		let e = Math.max(0, Math.min(1, (t - (r.t0 - .05)) / .05, (r.t1 + .05 - t) / .05));
		n[r.v] = Math.max(n[r.v] ?? 0, e);
		for (let [t, i] of Object.entries(r.tongue)) n[t] = Math.max(n[t] ?? 0, i * e);
	}
	return n;
}
async function fe() {
	let e = document.getElementById("c"), t = (Y.get("view") || "60,8,904").split(",").map(Number);
	Y.get("px") && (e.style.width = Y.get("px") + "px");
	let n = await re.load(e, se, {
		dpr: X ? 1 : Math.min(2, devicePixelRatio || 1),
		view: t,
		preserve: X
	});
	(Y.get("dbg") || Y.get("only")) && (n.debug = {
		tint: Y.get("dbg") === "tint",
		only: Y.get("only") ? Y.get("only").split(",") : null
	});
	let a = ue(await fetch("./audio/voice.align.json").then((e) => e.json())), o = await fetch("./audio/voice.mp3").then((e) => e.arrayBuffer()), s = await new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100).decodeAudioData(o.slice(0)), c = s.getChannelData(0), l = s.sampleRate, u = new r(l), d = new C({
		band: "b2",
		seed: 7,
		faceStyle: { smile: .7 }
	}), f = new O(.85), p = /* @__PURE__ */ new Float32Array(1024), m = -1, h = 0, g = null, _ = !1, v = "idle", y = new ae(), b = new oe(), x = {
		work: [],
		intervals: [],
		frames: 0,
		rows: []
	};
	function w(e) {
		let t = performance.now(), r = m < 0 ? 1 / 60 : Math.min(.25, e - m);
		m = e;
		let o = ce(e);
		o.status !== g && (g = o.status, h = e, _ = !1);
		let s = e - Z, C = Math.floor(s * l);
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
		o.id === "talking" && Object.assign(N, de(a, s));
		let P = Math.sin(e * 2 * Math.PI * .25);
		n.frame(N, O, M, E.lean, P);
		let F = performance.now() - t;
		return x.work.push(F), x.frames++, o.id === "talking" && x.rows.push({
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
			work: F
		};
	}
	if (window.P2D = {
		duration: $,
		scenes: Q,
		stats: x,
		rig: n,
		listener: b,
		EXPRESSIONS: J,
		renderAt: (e) => w(e),
		pose: (e) => {
			n.lastT = -1;
			let t = { ...e.bs || {} }, r = [...e.head || [
				0,
				0,
				0
			]], i = [...e.gaze || [0, 0]];
			if (e.expr) {
				let n = J[e.expr];
				t = {
					mouthSmileLeft: .06,
					mouthSmileRight: .06,
					...t
				};
				for (let [e, r] of Object.entries(n.bs)) t[e] = r < 0 ? 0 : Math.max(t[e] ?? 0, r);
				r = r.map((e, t) => e + n.head[t]), i = [...n.gaze];
			}
			for (let a = 0; a < 6; a++) n.clock = 1e3 + a / 60, n.resetPhysics(), n.frame(t, r, i, e.lean || 0, 0);
			return n.mouth.name;
		}
	}, X) {
		window.P2D.ready = !0;
		return;
	}
	let T = new Audio("./audio/voice.mp3"), E = !1, D = performance.now() - (Y.get("start") || 0) * 1e3, k = -1, A = document.getElementById("hud"), j = (e) => {
		let t = (e - D) / 1e3 % $;
		k > 0 && x.intervals.push(e - k), k = e, n.clock = t + Math.floor((e - D) / 1e3 / $) * $, t < m && (m = -1), !E && t >= Z && t < 17 && (E = !0, T.currentTime = Math.max(0, t - Z), T.play().catch(() => {})), t < Z && (E = !1);
		let r = w(t);
		if (A && x.frames % 15 == 0) {
			let e = x.intervals.slice(-120), t = e.length ? 1e3 / (e.reduce((e, t) => e + t, 0) / e.length) : 0, i = x.work.slice(-120).sort((e, t) => e - t);
			A.textContent = `${r.scene} · ${r.state} · mouth ${r.mouth} · ${t.toFixed(0)} fps · work p95 ${(i[Math.floor(i.length * .95)] || 0).toFixed(2)} ms · ${n.stats().meshes} draws`;
		}
		requestAnimationFrame(j);
	};
	document.getElementById("start")?.addEventListener("click", () => {
		D = performance.now(), E = !1, m = -1;
	}), requestAnimationFrame(j), window.P2D.ready = !0;
}
fe().catch((e) => {
	document.body.insertAdjacentHTML("beforeend", `<pre style="color:red">${e.stack}</pre>`), window.P2D = { error: String(e) };
});
//#endregion
export { $ as DURATION };
