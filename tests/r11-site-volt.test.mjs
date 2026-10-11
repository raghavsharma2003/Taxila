// Release 11 · stream 2: the public site in Volt night (dc-r4-volt-everywhere; owner 2026-10-11 "revamp the whole
// thing"). Pure source checks, no browser: the rendered floors (360 / 412 / 1366, overflow, 14 px text, helplines on
// every page) are tests/prod/r11-site-sheets.mjs on a production build.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const landing = read("src/app/landing/Landing.tsx");
const site = read("src/app/landing/Site.tsx");
const pub = read("src/app/Public.tsx");
const css = read("src/styles/landing.css");

describe("r11: the public site in Volt night", () => {
  it("every public page is in K's own scope (.kx + Volt + night), not a palette of its own", () => {
    assert.match(site, /VOLT_NIGHT = \{ className: "kx sv", "data-klook": "volt", "data-ktheme": "night" \}/);
    assert.match(landing, /<div \{\.\.\.VOLT_NIGHT\}/, "the landing root");
    assert.match(site, /export function SitePage[\s\S]*?<div \{\.\.\.VOLT_NIGHT\}>/, "every Public.tsx page goes through SitePage");
    for (const f of ["../../ui-v3/kaksha/tokens.css", "../../ui-v3/kaksha/futurist.css", "../../ui-v3/kaksha/kaksha.css"]) assert.ok(site.includes(`import "${f}"`), f);
  });
  it("landing.css holds no colour literal and no font host: K's tokens or a color-mix of one", () => {
    const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(body, /#[0-9a-fA-F]{3,8}\b/);
    assert.doesNotMatch(body, /\brgba?\(|\bhsla?\(/);
    assert.doesNotMatch(body, /@import|@font-face|url\(http/);
    assert.doesNotMatch(body, /--k-(?!cut\b)[a-z0-9-]+\s*:/, "it never (re)defines a K token (--k-cut, the chamfer size, is set per element as K's own components do)");
  });
  it("one lime element per screen state: lime (--k-move) is only K's CTA, never in landing.css", () => {
    assert.doesNotMatch(css, /--k-move/);
    assert.match(site, /className=\{`kx-cta kx-cut sv-cta/);
  });
  it("the hero shows the product itself (real captures), not the old painted desk", () => {
    assert.doesNotMatch(landing, /bg\/landing-hero|HeroArt|HeroFallback/);
    for (const n of ["home", "desk", "game", "world", "turn"]) {
      assert.ok(landing.includes(`/site/${n}.webp`), n);
      const f = path.join(ROOT, "public", "site", `${n}.webp`);
      assert.ok(fs.existsSync(f), `${n}.webp is captured`);
      assert.ok(fs.statSync(f).size < 60_000, `${n}.webp is phone-sized (${fs.statSync(f).size} B)`);
    }
    assert.equal((landing.match(/loading=\{eager \? "eager" : "lazy"\}/g) ?? []).length, 1);
    assert.equal((landing.match(/<Shot[^>]*\beager\b/g) ?? []).length, 1, "only the hero's live lesson is eager (the LCP)");
  });
  it("the looped game capture: real recording, small, below the fold, never under reduced motion", () => {
    const f = path.join(ROOT, "public", "site", "game-loop.webm");
    assert.ok(fs.existsSync(f) && fs.statSync(f).size < 600_000, "game-loop.webm under 600 KB");
    assert.match(landing, /<LoopShot poster="\/site\/game\.webp" src="\/site\/game-loop\.webm"/);
    assert.match(landing, /prefers-reduced-motion: reduce\)"\)\.matches\) return;/, "reduced motion keeps the still");
    assert.match(landing, /new IntersectionObserver/, "mounted only near the viewport");
    const hero = landing.slice(landing.indexOf('className="sv-hero"'), landing.indexOf('id="lesson"'));
    assert.doesNotMatch(hero, /LoopShot|\.webm/, "the hero (the LCP) has no video");
  });
  it("the honest sections stay, word for word where they are claims", () => {
    for (const s of ["No points, no streaks, no leaderboards. Nothing shrinks if your child takes a day off.", "How do we know?", "Not started", "Practising", "Got it", "Secure",
      "If we cannot point to a check, we do not make the claim.", "That is why this page has no reviews, ratings or results.",
      "The teacher says so at the first meeting, an AI label sits next to the teacher on every screen, and the teacher never pretends to be a person.",
      "gives the Childline and Tele-MANAS numbers"]) assert.ok(landing.includes(s), s);
    assert.match(landing, /SITE_PROMISES\.map/);
  });
  it("the helplines are on every public page (footer) and first on /help, as tel: links", () => {
    assert.match(site, /href="tel:1098"[\s\S]*Childline[\s\S]*1098/);
    assert.match(site, /href="tel:14416"[\s\S]*Tele-MANAS[\s\S]*14416/);
    assert.match(site, /export function SiteFooter[\s\S]*<Helplines \/>/);
    assert.match(pub, /If a child needs help now[\s\S]*<Helplines \/>/);
    assert.match(site, /The teacher is an AI and always says so\./, "the footer's AI line is unchanged");
  });
  it("the header has Sign in and Start; the footer Help, Privacy, Promises", () => {
    assert.match(site, /to="\/start\/phone\?login=1">Sign in</);
    assert.match(site, /to="\/start\/class">Start</);
    for (const to of ["/help", "/privacy", "/promises"]) assert.ok(site.includes(`<Link to="${to}">`), to);
  });
  it("no exclamation marks in the site's words", () => {
    const words = (src) => [...src.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" ") + [...src.matchAll(/"([^"\n]{12,})"/g)].map((m) => m[1]).join(" ");
    assert.doesNotMatch(words(landing) + words(pub), /!(?!=)/);
  });
});
