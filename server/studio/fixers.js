// Deterministic post-stream fixers (LIVE-STUDIO §1 item 3, §3.0; v0 AutoFix / GenUI post-processors). They run after
// the stream guard and before the gate, in well under 250 ms, and they fix SHAPE only: never params, grading or strings
// (truth). Each fix is recorded so the router bench can count how often a model needs it.
//
//   unfence        a markdown fence or prose before the first tag
//   unwrap         <!doctype>, <html>, <head>, <body> wrappers (the gate supplies the document)
//   one_script     several <script> blocks merged into ONE at the end, in order (stream order: style → markup → script)
//   hoist_style    <style> blocks after markup moved to the front (so the partial paint is styled)
//   close_script   a final <script> left unclosed by a clean stream end gets its </script>
//   seam_spelling  data_part / dataPart= / data-Part spellings normalised to the archetype's data-* names
//   ready          Studio.ready() appended when the script never calls it (after first paint, so the frame boots)
//
// A script that does not parse (oxc) is reported, not "fixed": a guess at code is a model's job (repair), not a fixer's.
import { parseAst } from "rolldown/parseAst";

const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;

/** Strip a markdown fence and any prose before the first tag / after the last one. */
export function unfence(s) {
  let t = String(s ?? "");
  t = t.replace(/^\s*```[a-zA-Z]*\s*\n/, "").replace(/\n?```\s*$/, "");
  const first = t.indexOf("<");
  if (first > 0) t = t.slice(first);
  // prose after the last closing tag (only when every script is closed: inside a script, ">" is an operator)
  const opens = (t.match(/<script\b/gi) ?? []).length, closes = (t.match(/<\/script\s*>/gi) ?? []).length;
  const last = t.lastIndexOf(">");
  if (opens === closes && last >= 0 && /\S/.test(t.slice(last + 1))) t = t.slice(0, last + 1);
  return t.trim();
}

/** Does `code` parse as a classic script? → null when it does, else the message (≤ 200 chars). */
export function parseError(code) {
  try {
    const ast = parseAst(code, { lang: "js", sourceType: "script" });
    const err = ast?.errors?.[0];
    return err ? String(err.message ?? err).slice(0, 200) : null;
  } catch (e) {
    return String(e?.message ?? e).slice(0, 200);
  }
}

/**
 * Apply every fixer. `seam` is the archetype's data-* attribute names (e.g. ["data-part", "data-shaded"]).
 * @returns {{ html: string, fixes: string[], scriptError: string | null, bytes: number }}
 */
export function fixFragment(raw, { seam = [] } = {}) {
  const fixes = [];
  let h = String(raw ?? "");
  const u = unfence(h);
  if (u !== h.trim()) fixes.push("unfence");
  h = u;
  const before = h;
  h = h.replace(/<!doctype[^>]*>/gi, "").replace(/<\/?(?:html|head|body)\b[^>]*>/gi, "").replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");
  if (h !== before) fixes.push("unwrap");
  // a clean stream end with an unclosed final script: close it (a truncated stream is caught by the parse check)
  const opens = (h.match(/<script\b[^>]*>/gi) ?? []).length, closes = (h.match(/<\/script\s*>/gi) ?? []).length;
  if (opens === closes + 1 && /<script\b[^>]*>(?![\s\S]*<script\b)[\s\S]*$/i.test(h)) { h += "\n</script>"; fixes.push("close_script"); }
  // styles first, then markup, then ONE script
  const styles = h.match(STYLE_RE) ?? [];
  const scripts = [...h.matchAll(SCRIPT_RE)].map((m) => m[1]);
  let markup = h.replace(STYLE_RE, "").replace(SCRIPT_RE, "").trim();
  const styleFirst = styles.length && h.trimStart().toLowerCase().startsWith("<style");
  if (styles.length > 1 || (styles.length && !styleFirst)) fixes.push("hoist_style");
  if (scripts.length > 1 || (scripts.length && !/<\/script\s*>\s*$/i.test(h.trim()))) fixes.push("one_script");
  let code = scripts.join("\n;\n");
  // seam spellings: data_part= / dataPart= / data-Part= → data-part= (only for names the archetype declares)
  for (const name of seam) {
    const bare = name.replace(/^data-/, "");
    const camel = bare.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
    const variants = new Set([`data_${bare.replace(/-/g, "_")}`, `data${camel[0].toUpperCase()}${camel.slice(1)}`]);
    for (const v of variants) {
      const re = new RegExp(`\\b${v}(\\s*=)`, "g");
      if (re.test(markup)) { markup = markup.replace(re, `${name}$1`); fixes.push("seam_spelling"); }
      const reJs = new RegExp(`(setAttribute\\(\\s*["'])${v}(["'])`, "g");
      if (reJs.test(code)) { code = code.replace(reJs, `$1${name}$2`); fixes.push("seam_spelling"); }
    }
    const caseRe = new RegExp(`\\b(${name})(\\s*=)`, "gi");
    markup = markup.replace(caseRe, (m, n, eq) => (n === name ? m : (fixes.push("seam_spelling"), `${name}${eq}`)));
  }
  let scriptError = code.trim() ? parseError(code) : "no_script";
  if (!scriptError && !/\bStudio\s*\.\s*ready\s*\(/.test(code)) {
    code += "\n;try{Studio.ready()}catch(e){}";
    fixes.push("ready");
  }
  const html = `${styles.join("\n")}\n${markup}\n<script>\n${code}\n</script>`.trim();
  return { html, fixes: [...new Set(fixes)], scriptError, bytes: Buffer.byteLength(html) };
}

/** The single script and the markup of a fixed fragment (for the static gate and the CSP hash). */
export function splitFragment(html) {
  const scripts = [...String(html).matchAll(SCRIPT_RE)].map((m) => m[1]);
  return { scripts, markup: String(html).replace(SCRIPT_RE, "").replace(STYLE_RE, "") };
}
