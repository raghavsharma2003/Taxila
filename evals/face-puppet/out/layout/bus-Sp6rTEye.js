//#region src/avatar/faceCues.ts
var e = {
	delight: {
		emotion: "excited",
		intensity: 2
	},
	warm_pride: {
		emotion: "proud",
		intensity: 1
	},
	enthusiasm: {
		emotion: "curious",
		intensity: 2
	},
	gentle_concern: {
		emotion: "concerned",
		intensity: 1
	},
	playful: {
		emotion: "warm",
		intensity: 2
	},
	calm_curious: {
		emotion: "curious",
		intensity: 1
	},
	sheepish_own: {
		emotion: "warm",
		intensity: 1
	},
	neutral_warm: null,
	calm_steady: {
		emotion: "concerned",
		intensity: 1
	}
}, t = /* @__PURE__ */ new Set(["delight", "playful"]);
function n(n, r = "b2") {
	if (!n) return null;
	let i = e[n];
	if (!i) return null;
	let a = i.intensity;
	return r === "b3" && t.has(n) && --a, r === "b4" && n !== "gentle_concern" && n !== "calm_steady" && --a, {
		emotion: i.emotion,
		intensity: a >= 2 ? 2 : 1
	};
}
var r = /* @__PURE__ */ new Set(), i = {
	emit(e) {
		for (let t of [...r]) try {
			t(e);
		} catch (e) {
			console.warn("face: a cue listener failed", e);
		}
	},
	on(e) {
		return r.add(e), () => r.delete(e);
	}
};
function a(e, t) {
	let n = e.x + e.w / 2, r = e.y + e.h * .42, i = t.x + t.w / 2, a = t.y + t.h / 2, o = Math.max(80, e.w), s = Math.atan2(i - n, o) * 180 / Math.PI, c = -Math.atan2(a - r, o) * 180 / Math.PI, l = (e, t, n) => Math.max(t, Math.min(n, e));
	return [l(s, -25, 25), l(c, -25, 20)];
}
var o = {
	tray: ["[data-testid=\"studio-stage\"]", "[data-testid=\"tray\"]"],
	board: [
		"[data-testid=\"studio-stage\"][data-kind=\"whiteboard\"]",
		"[data-testid=\"board\"]",
		"[data-testid=\"studio-stage\"]",
		"[data-testid=\"tray\"]"
	]
};
function s(e, t) {
	for (let n of o[e]) {
		let e = t.querySelector(n);
		if (e && (typeof e.getBoundingClientRect != "function" || e.getBoundingClientRect().width > 0)) return e;
	}
	return null;
}
var c = "/face-puppet/r8/", l = (e = "medium") => `${c}rest-${e}.webp`, u = [
	251.4 / 255,
	229.4 / 255,
	188.6 / 255
], d = {
	medium: [
		60,
		8,
		904
	],
	close: [
		140,
		70,
		744
	]
}, f = /* @__PURE__ */ new Set(), p = {
	emit(e) {
		for (let t of [...f]) try {
			t(e);
		} catch (e) {
			console.warn("face-puppet: a bus listener failed", e);
		}
	},
	on(e) {
		return f.add(e), () => f.delete(e);
	},
	get listeners() {
		return f.size;
	}
};
//#endregion
export { l as a, a as c, d as i, s as l, c as n, n as o, u as r, i as s, p as t };
