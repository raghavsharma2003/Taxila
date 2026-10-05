import { s as e } from "./tap-H4GmWvxV.js";
//#region src/avatar/behaviour.ts
var t = {
	idle: 17,
	speaking: 26,
	your_turn: 18,
	listening: 18,
	thinking: 22
}, n = 3, r = {
	close: 70,
	hold: 40,
	open: 140
}, i = {
	b1: 1,
	b2: .9,
	b3: .7,
	b4: .55
}, a = 120, o = .6, s = .004, c = (() => {
	let e = Math.sqrt(a), t = e * Math.sqrt(1 - o ** 2), n = Math.atan(t / (o * e)) / t;
	return Math.exp(-.6 * e * n) * Math.sin(t * n) / t;
})(), l = {
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
}, u = /* @__PURE__ */ new Set([
	"mouthSmile",
	"cheekSquint",
	"mouthPress"
]);
function d(e, t) {
	let n = 2 * o * Math.sqrt(a), r = Math.min(t, .25);
	for (; r > 1e-6;) {
		let t = Math.min(s, r);
		e.v += (-120 * e.x - n * e.v) * t, e.x += e.v * t, r -= t;
	}
}
function f(e) {
	let t = 0, n = 0;
	for (; !t;) t = e();
	for (; !n;) n = e();
	return Math.sqrt(-2 * Math.log(t)) * Math.cos(2 * Math.PI * n);
}
var p = (e, [t, n], r = .05, i = Infinity) => Math.min(i, Math.max(r, t + n * f(e)));
function m(e, t, n) {
	let r = t - 1 / 3, i = 1 / Math.sqrt(9 * r);
	for (;;) {
		let t, a;
		do
			t = f(e), a = 1 + i * t;
		while (a <= 0);
		a = a * a * a;
		let o = e();
		if (o < 1 - .0331 * t ** 4 || Math.log(o) < .5 * t * t + r * (1 - a + Math.log(a))) return r * a * n;
	}
}
var h = (e) => e < 0 ? 0 : e > 1 ? 1 : e, g = (e, t, n) => e < t ? t : e > n ? n : e;
function _(e) {
	return e.status === "listening" ? "listening" : e.tapSpeaking ? "speaking" : e.status === "speaking" ? e.silenceMs < 1200 ? "speaking" : "your_turn" : e.status === "thinking" ? e.spokeSinceStatus ? "your_turn" : "thinking" : e.status === "your_turn" ? "your_turn" : "idle";
}
var v = class {
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
	constructor(t = {}) {
		this.r = e(t.seed ?? 1), this.scale = i[t.band ?? "b2"] ?? .8, this.smileGain = t.faceStyle?.smile ?? .7, this.headGain = t.faceStyle?.headGain ?? 1, this.browGain = t.faceStyle?.browGain ?? 1, this.reduced = !!t.reducedMotion, this.gentle = !!t.gentle, this.asym = 1 + (this.r() - .5) * .12, this.drift = [
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
		return 60 / t[this.state];
	}
	scheduleBlink() {
		this.blink.mean = this.blinkMean(), this.blink.next = this.t + m(this.r, n, this.blink.mean / n);
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
			yaw: g(e, -40, 40),
			pitch: g(t, -25, 20),
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
			env: l[e].env
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
		this.nod.v += e / c;
	}
	setState(e) {
		if (e === this.state) return;
		let t = this.state;
		this.ev("state", e), this.state = e, this.stateT = this.t;
		let n = this.r;
		e === "speaking" ? (this.armed &&= (this.emote(this.armed.emotion, this.armed.intensity), null), this.brow = {
			t0: this.t + .05,
			amp: .22
		}, this.gaze.mode === "avert" && (this.gaze.until = this.t + p(n, [.75, .3], .2, 1.5)), this.nextAvert = this.t + p(n, [4.75, 1.39], 1.5), t === "listening" && this.release(200)) : e === "your_turn" ? (this.lean = 1, this.lookChild("ring"), this.nextAvert = this.t + p(n, [7.21, 1.88], 3)) : e === "listening" ? (this.lean = .5, t === "speaking" && (this.release(200), this.brow = {
			t0: this.t,
			amp: .15
		}, this.nod.v = 0), this.lookChild("listen"), this.nextAvert = this.t + p(n, [7.21, 1.88], 3)) : e === "thinking" ? (this.lean = .2, this.release(300), this.thinkAvertAt = this.t + p(n, [.3, .1], .1, .6)) : this.lean = 0, this.rescaleBlink();
	}
	update(e, t = {}) {
		this.t < 0 && (this.t = e, this.contactSince = e, this.scheduleBlink(), this.nextAvert = e + 2 + this.r() * 2, this.nextMicro = e + 1);
		let n = Math.max(0, Math.min(.2, e - this.t));
		this.t = e;
		let i = this.r, a = t.herRms ?? 0, o = this.rms;
		o.fast += (1 - Math.exp(-n / .03)) * (a - o.fast), a > .01 && (o.slow += (1 - Math.exp(-n / 1.5)) * (a - o.slow));
		let s = t.herVoiced ?? o.fast > .012;
		this.state === "speaking" && (!s && this.herVoiced && (this.herPauseT0 = e), !s && this.herPauseT0 > 0 && e - this.herPauseT0 > .15 && !this.pauseHandled && (this.pauseHandled = !0, this.blinkNow(.6), this.gaze.mode === "child" && i() < .35 && this.avert("floor", p(i, [2.3, 1.1], .8, 3))), s && (this.pauseHandled = !1, this.gaze.reason.startsWith("floor") && !this.herVoiced && (this.gaze.until = e + p(i, [1.27, .51], .3, 2.5))), s && o.fast > o.slow * 1.6 && e - o.lastAccent > .35 && (o.lastAccent = e, this.impulse(Math.min(3, 1.5 * o.fast / o.slow / 1.6)), o.fast > o.slow * 2.2 && e - this.brow.t0 > 1.2 && i() < .35 && (this.brow = {
			t0: e,
			amp: .18
		}))), this.herVoiced = s;
		let c = this.gaze;
		if (this.state === "thinking" && this.thinkAvertAt && e >= this.thinkAvertAt && (this.thinkAvertAt = 0, this.avert("cognitive", Math.min(3.5, p(i, [3.54, 1.26], 1)))), c.mode !== "child" && e >= c.until && this.lookChild("return"), this.gaze.mode === "child" && this.state !== "thinking") {
			let t = e - this.contactSince >= 3.95;
			(e >= this.nextAvert || t) && (this.state === "speaking" ? (this.avert("intimacy", p(i, [1.96, .32], .6)), this.nextAvert = e + p(i, [4.75, 1.39], 1.5)) : (this.avert("intimacy", p(i, [1.14, .27], .5)), this.nextAvert = e + p(i, [7.21, 1.88], 3)));
		}
		if (!this.reduced && e >= this.nextMicro) {
			let t = p(i, [2, .6], 1.5, 3), n = i() * 2 * Math.PI;
			this.micro = [t * Math.cos(n), t * Math.sin(n) * .6], this.nextMicro = e + p(i, [1.2, .4], .4);
		}
		this.reduced && (this.micro = [0, 0]);
		let f = this.gaze.yaw + this.micro[0] * .5, m = this.gaze.pitch + this.micro[1] * .5, _ = this.blink;
		!_.active && e >= _.next && (_.active = !0, _.t0 = e, this.ev("blink"));
		let v = 0;
		if (_.active) {
			let t = (e - _.t0) * 1e3;
			v = t < r.close ? t / r.close : t < r.close + r.hold ? 1 : h(1 - (t - r.close - r.hold) / r.open), t >= r.close + r.hold + r.open && (_.active = !1, _.lastEnd = e, !_.queueDouble && i() < .12 ? (_.queueDouble = !0, _.next = e + .12) : (_.queueDouble = !1, this.scheduleBlink()));
		}
		d(this.nod, n);
		let y = this.reduced ? .3 : this.gentle ? .5 : 1, b = this.emoLevel(), x = this.state === "your_turn" ? .5 : this.state === "listening" ? .7 : 1, S = (this.state === "speaking" ? 1.5 : 1) * x * y * this.headGain, C = this.drift, w = [
			.31,
			.23,
			.17
		].map((t, n) => Math.sin(2 * Math.PI * t * e + C[n]) * .6 + Math.sin(2 * Math.PI * t * 2.71 * e + C[n] * 1.3) * .4), T = this.emo.kind ? l[this.emo.kind] : null, E = (this.state === "listening" ? 4 : 0) + (T && this.emo.I > 0 ? T.tilt * b / this.emo.I : 0);
		this.tilt += (1 - Math.exp(-n / .4)) * (E * y - this.tilt), this.leanV += (1 - Math.exp(-n / .35)) * ((this.reduced ? .3 : 1) * this.lean - this.leanV);
		let D = g(f, -25, 25), O = g(m, -25, 20), k = f - D, A = Math.abs(D) > 15 ? D - Math.sign(D) * 10 : D * .3;
		this.headYaw += (1 - Math.exp(-n / .25)) * (A * y + k - this.headYaw);
		let j = (this.reduced ? .3 : this.gentle ? .5 : 1) * this.scale * this.headGain, M = [
			g(this.nod.x * j + w[0] * S - 3 * this.leanV - O * .2 * y, -20, 20),
			g(this.headYaw + w[1] * S, -20, 20),
			g(this.tilt + w[2] * S * .6, -20, 20)
		], N = this.brow, P = (e - N.t0) * 1e3, F = P < 0 ? 0 : P < 80 ? N.amp * P / 80 : P < 320 ? N.amp : P < 520 ? N.amp * (1 - (P - 320) / 200) : 0, I = this.reduced ? .3 : 1, L = {}, R = (e, t) => {
			L[e + "Left"] = (L[e + "Left"] ?? 0) + t * this.asym, L[e + "Right"] = (L[e + "Right"] ?? 0) + t / this.asym;
		};
		if (T) for (let [e, t] of Object.entries(T.bs)) {
			let n = t * b * I;
			e === "mouthSmile" && (n *= this.smileGain / .7), this.gentle && u.has(e) && (n *= .5), e.startsWith("brow") && (n *= this.browGain), e === "browInnerUp" ? L.browInnerUp = (L.browInnerUp ?? 0) + n : R(e, n);
		}
		R("mouthSmile", (this.state === "thinking" ? .03 : this.state === "speaking" ? .06 : .1) * this.smileGain * (this.gentle ? .5 : 1)), R("browOuterUp", F * this.browGain), L.browInnerUp = (L.browInnerUp ?? 0) + (F * .8 + (this.state === "listening" ? .08 : 0)) * this.browGain;
		let z = Math.max(L.eyeSquintLeft ?? 0, L.eyeSquintRight ?? 0) * .3, B = Math.max(v, z);
		L.eyeBlinkLeft = B, L.eyeBlinkRight = B;
		for (let e in L) L[e] = h(L[e]);
		return {
			t: e,
			state: this.state,
			bs: L,
			head: M,
			gaze: [D, O],
			lean: this.leanV,
			gazeMode: this.gaze.mode
		};
	}
	inStateFor() {
		return this.t - this.stateT;
	}
}, y = /* @__PURE__ */ new Set([
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
]), b = /* @__PURE__ */ new Set(["eyeBlinkLeft", "eyeBlinkRight"]), x = .06, S = (e) => e < 0 ? 0 : e > 1 ? 1 : e, C = class {
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
		for (let [t, n] of Object.entries(e)) y.has(t) || (r[t] = n);
		for (let [e, n] of Object.entries(t)) r[e] = (r[e] ?? 0) + n;
		let i = Math.min(S(r.jawOpen ?? 0), this.jawCeiling);
		r.jawOpen = i, r.mouthClose = Math.min(S(r.mouthClose ?? 0), i);
		let a = +(t.jawOpen !== void 0 && i < .04 && (t.mouthClose ?? 0) > 0), o = a > this.closure ? .06 : .12;
		this.closure += (1 - Math.exp(-n / o)) * (a - this.closure);
		let s = 1 - .6 * this.closure;
		for (let e of ["mouthSmileLeft", "mouthSmileRight"]) r[e] !== void 0 && (r[e] *= s);
		for (let e of Object.keys(r)) {
			let t = S(r[e]);
			if (!y.has(e) && !b.has(e)) {
				let n = this.prev[e] ?? 0;
				t = Math.max(n - x, Math.min(n + x, t));
			}
			r[e] = t < .01 ? 0 : t;
		}
		for (let [e, t] of Object.entries(this.prev)) if (r[e] === void 0 && !y.has(e) && !b.has(e) && t > 0) {
			let n = Math.max(0, t - x);
			n >= .01 && (r[e] = n);
		}
		return this.prev = r, r;
	}
};
//#endregion
export { v as n, _ as r, C as t };
