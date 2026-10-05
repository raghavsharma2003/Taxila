// The partial-paint sanitiser (LIVE-STUDIO §3.5, §5.1; BUILD-PLAN W2-H #1). A build's streamed markup may be painted
// under the veil before the gate passes, as DECORATION ONLY: it renders in a script-less sandboxed frame
// (`sandbox=""`, CSP script-src 'none', no network) and, before that, goes through this allowlist. Defence in depth:
// either layer alone keeps a hostile partial inert.
//
// Allowlist, not a blocklist: known presentational HTML and SVG elements and attributes survive; everything else is
// dropped. Text nodes are dropped (shapes only: no unchecked model words are ever painted). No <script> (content dropped too), no on* attribute, no href / xlink:href except a same-document `#id`, no
// src / srcset / action, no url() / @import / expression() in styles, no comments or CDATA. Pure string code: tests run
// it under node against the XSS corpus (tests/studio-contracts.test.mjs).

const ALLOWED = new Set([
  "div", "span", "p", "section", "header", "footer", "main", "h1", "h2", "h3", "h4", "ul", "ol", "li", "b", "i", "strong", "em", "small", "br", "label", "button",
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs", "lineargradient", "radialgradient", "stop", "use",
  "clippath", "mask", "pattern", "desc", "symbol", "marker", "style",
]);
/** Elements dropped WITH their content (their text is code or a document of its own). */
const DROP_WITH_CONTENT = new Set(["script", "iframe", "object", "embed", "template", "noscript", "textarea", "xmp", "noembed", "noframes", "frameset", "frame",
  "foreignobject", "math", "plaintext", "title"]);
const VOID = new Set(["br", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "stop", "use"]);
const ATTR_OK = /^(?:class|id|style|role|aria-[\w-]+|data-[\w-]+|width|height|viewbox|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|d|points|fill|fill-opacity|fill-rule|stroke|stroke-width|stroke-opacity|stroke-linecap|stroke-linejoin|stroke-dasharray|stroke-dashoffset|opacity|transform|text-anchor|dominant-baseline|font-size|font-weight|font-family|offset|stop-color|stop-opacity|gradientunits|gradienttransform|preserveaspectratio|xmlns|href|xlink:href|clip-path|mask|marker-end|marker-start|refx|refy|markerwidth|markerheight|orient|dx|dy|patternunits|disabled|type|tabindex)$/;

/** CSS text with every network or script channel removed. */
export function cleanCss(css: string): string {
  return String(css)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@import[^;]*;?/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\([^)]*\)?/gi, "none")
    .replace(/-moz-binding|behavior\s*:/gi, "x:")
    .replace(/<\/?\s*style/gi, "");
}

const escAttr = (s: string) => s.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Decode the entities an attacker could use to hide `javascript:` (numeric and a few named). */
function decodeEntities(s: string): string {
  return s.replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&colon;/gi, ":").replace(/&tab;/gi, "\t").replace(/&newline;/gi, "\n");
}

function cleanAttrs(raw: string): string {
  const out: string[] = [];
  const re = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const m of raw.matchAll(re)) {
    const name = m[1].toLowerCase();
    let value = m[2] ?? m[3] ?? m[4] ?? "";
    if (name.startsWith("on") || !ATTR_OK.test(name)) continue;
    const plain = decodeEntities(value).replace(/[\u0000- ]/g, "").toLowerCase();
    if (name === "href" || name === "xlink:href") { if (!/^#[\w-]+$/.test(value.trim())) continue; }
    if (/javascript:|vbscript:|data:text\/html/.test(plain)) continue;
    if (name === "style") value = cleanCss(decodeEntities(value));
    out.push(`${name}="${escAttr(value)}"`);
  }
  return out.length ? " " + out.join(" ") : "";
}

/** Sanitise a partial build stream into inert presentational markup. */
export function sanitizePartial(html: string, { maxBytes = 120_000 }: { maxBytes?: number } = {}): string {
  let s = String(html ?? "").slice(0, maxBytes);
  s = s.replace(/<!--[\s\S]*?(?:-->|$)/g, "").replace(/<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/g, "").replace(/<\?[\s\S]*?(?:\?>|$)/g, "").replace(/<!doctype[^>]*>/gi, "");
  const out: string[] = [];
  const stack: string[] = [];
  let i = 0;
  const tagRe = /<\/?([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let dropping: string | null = null;
  for (let m = tagRe.exec(s); m; m = tagRe.exec(s)) {
    const text = s.slice(i, m.index);
    i = m.index + m[0].length;
    const closing = m[0][1] === "/";
    const name = m[1].toLowerCase();
    if (dropping) { if (closing && name === dropping) dropping = null; continue; }
    const inStyle = stack[stack.length - 1] === "style";
    // text nodes are never painted: the veil shows shapes only, so no model words reach the child before the gate checked them
    if (text && inStyle) out.push(cleanCss(text));
    if (DROP_WITH_CONTENT.has(name)) { if (!closing && !/\/\s*$/.test(m[2])) dropping = name; continue; }
    if (!ALLOWED.has(name)) continue;
    if (closing) {
      const at = stack.lastIndexOf(name);
      if (at < 0) continue;
      while (stack.length > at) out.push(`</${stack.pop()}>`);
      continue;
    }
    const selfClose = /\/\s*$/.test(m[2]) || VOID.has(name);
    out.push(`<${name}${cleanAttrs(m[2].replace(/\/\s*$/, ""))}${selfClose && !VOID.has(name) ? "></" + name : ""}>`);
    if (!selfClose) stack.push(name);
  }
  if (!dropping) {
    const tail = s.slice(i);
    const inStyle = stack[stack.length - 1] === "style";
    // an unterminated tag at the end of a stream chunk is dropped, never shown as text
    const cut = tail.lastIndexOf("<");
    const t = cut >= 0 ? tail.slice(0, cut) : tail;
    if (t && inStyle) out.push(cleanCss(t));
  }
  while (stack.length) out.push(`</${stack.pop()}>`);
  return out.join("");
}
