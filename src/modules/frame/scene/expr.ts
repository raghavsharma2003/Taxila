// EXPR@1 for the frame: a typed port of docs/research/content/genui-scene-dsl.mjs (scene@1 validator v1.3)
// parseExpr / evalExpr / identsOf, token for token, so the frame evaluates goals and probes exactly as the
// server validator did when it passed the scene (tests/scene-runtime.test.mjs checks the two agree on the
// template corpora). No eval, no Function.
export type Ast =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "bool"; v: boolean }
  | { k: "id"; v: string }
  | { k: "un"; op: string; a: Ast }
  | { k: "bin"; op: string; a: Ast; b: Ast }
  | { k: "tern"; c: Ast; a: Ast; b: Ast }
  | { k: "call"; f: string; args: Ast[] };
export type Val = number | string | boolean;
export interface StateFns {
  count(zone: string, tag?: string): number;
  has(zone: string, id: string): boolean;
  at(id: string): string;
  order(list: string): string;
}
export interface Env {
  vals: Record<string, Val>;
  state: StateFns;
}

const MAX_LEN = 160;
const EPS = 1e-9;
const FUNCS: Record<string, (...a: number[]) => number> = {
  min: Math.min, max: Math.max, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, sqrt: (x) => Math.sqrt(Math.max(0, x)),
  round: (x, d = 0) => { const f = 10 ** d; return Math.round(x * f) / f; },
  sind: (d) => Math.sin((d * Math.PI) / 180), cosd: (d) => Math.cos((d * Math.PI) / 180), tand: (d) => Math.tan((d * Math.PI) / 180),
  atand: (x) => (Math.atan(x) * 180) / Math.PI, clamp: (x, a, b) => Math.min(b, Math.max(a, x)), lerp: (a, b, t) => a + (b - a) * t,
};
const STATE_FUNCS = new Set(["count", "has", "at", "order"]);

type Tok = { t: "num"; v: number } | { t: "id" | "str" | "op"; v: string };

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = src.slice(i).match(/^\d*\.?\d+(e[-+]?\d+)?/i);
      if (!m) throw new Error(`bad number at ${i}`);
      out.push({ t: "num", v: +m[0] });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)!;
      out.push({ t: "id", v: m[0] });
      i += m[0].length;
      continue;
    }
    if (c === "'" || c === '"') {
      const j = src.indexOf(c, i + 1);
      if (j < 0) throw new Error("unterminated string");
      out.push({ t: "str", v: src.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (["==", "!=", "<=", ">=", "&&", "||"].includes(two)) { out.push({ t: "op", v: two }); i += 2; continue; }
    if ("+-*/%^<>!?:(),".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    throw new Error(`unexpected '${c}' at ${i}`);
  }
  return out;
}

export function parseExpr(src: string): Ast {
  if (src.length > MAX_LEN) throw new Error("expression too long");
  const toks = lex(src);
  let p = 0;
  let depth = 0;
  const peek = () => toks[p];
  const eat = (v?: string): Tok => {
    const t = toks[p];
    if (!t || (v && t.v !== v)) throw new Error(`expected ${v ?? "token"}`);
    p++;
    return t;
  };
  const BIN = [["||"], ["&&"], ["==", "!=", "<", "<=", ">", ">="], ["+", "-"], ["*", "/", "%"]];
  function prim(): Ast {
    if (++depth > 24) throw new Error("expression too deep");
    const t = eat();
    let node: Ast;
    if (t.t === "num") node = { k: "num", v: t.v };
    else if (t.t === "str") node = { k: "str", v: t.v };
    else if (t.t === "id") {
      if (peek()?.v === "(") {
        eat("(");
        const args: Ast[] = [];
        if (peek()?.v !== ")") {
          do args.push(ternary());
          while (peek()?.v === "," && eat(","));
        }
        eat(")");
        if (!(t.v in FUNCS) && !STATE_FUNCS.has(t.v)) throw new Error(`unknown function ${t.v}`);
        node = { k: "call", f: t.v, args };
      } else if (t.v === "true" || t.v === "false") node = { k: "bool", v: t.v === "true" };
      else if (t.v === "PI") node = { k: "num", v: Math.PI };
      else node = { k: "id", v: t.v };
    } else if (t.v === "(") {
      node = ternary();
      eat(")");
    } else if (t.v === "-" || t.v === "!") node = { k: "un", op: t.v, a: unaryPow() };
    else throw new Error(`unexpected ${t.v}`);
    depth--;
    return node;
  }
  function unaryPow(): Ast {
    const a = prim();
    if (peek()?.v === "^") {
      eat("^");
      return { k: "bin", op: "^", a, b: unaryPow() };
    }
    return a;
  }
  function level(n: number): Ast {
    if (n >= BIN.length) return unaryPow();
    let a = level(n + 1);
    while (peek() && BIN[n].includes(String(peek()!.v))) {
      const op = String(eat().v);
      a = { k: "bin", op, a, b: level(n + 1) };
    }
    return a;
  }
  function ternary(): Ast {
    const c = level(0);
    if (peek()?.v === "?") {
      eat("?");
      const a = ternary();
      eat(":");
      return { k: "tern", c, a, b: ternary() };
    }
    return c;
  }
  const ast = ternary();
  if (p !== toks.length) throw new Error(`trailing '${toks[p].v}'`);
  return ast;
}

export function evalExpr(ast: Ast, env: Env): Val {
  switch (ast.k) {
    case "num":
    case "str":
    case "bool":
      return ast.v;
    case "id":
      if (!(ast.v in env.vals)) throw new Error(`unknown name ${ast.v}`);
      return env.vals[ast.v];
    case "un": {
      const a = evalExpr(ast.a, env);
      return ast.op === "-" ? -(a as number) : !a;
    }
    case "tern":
      return evalExpr(ast.c, env) ? evalExpr(ast.a, env) : evalExpr(ast.b, env);
    case "call": {
      if (STATE_FUNCS.has(ast.f)) {
        const raw = ast.args.map((a) => (a.k === "id" || a.k === "str" ? a.v : evalExpr(a, env)));
        const fn = env.state[ast.f as keyof StateFns] as (...x: unknown[]) => Val;
        return fn(...raw);
      }
      const v = FUNCS[ast.f](...ast.args.map((a) => evalExpr(a, env) as number));
      if (typeof v === "number" && !Number.isFinite(v)) throw new Error(`${ast.f} not finite`);
      return v;
    }
    case "bin": {
      const a = evalExpr(ast.a, env);
      if (ast.op === "&&") return a && evalExpr(ast.b, env);
      if (ast.op === "||") return a || evalExpr(ast.b, env);
      const b = evalExpr(ast.b, env);
      const n = typeof a === "number" && typeof b === "number";
      switch (ast.op) {
        case "+": return (a as number) + (b as number);
        case "-": return (a as number) - (b as number);
        case "*": return (a as number) * (b as number);
        case "/": if (b === 0) throw new Error("division by zero"); return (a as number) / (b as number);
        case "%": return (a as number) % (b as number);
        case "^": return (a as number) ** (b as number);
        case "==": return n ? Math.abs((a as number) - (b as number)) < 1e-9 : a === b;
        case "!=": return !(n ? Math.abs((a as number) - (b as number)) < 1e-9 : a === b);
        case "<": return typeof a === "number" ? a < (b as number) - EPS : a < b;
        case "<=": return typeof a === "number" ? a <= (b as number) + EPS : a <= b;
        case ">": return typeof a === "number" ? a > (b as number) + EPS : a > b;
        case ">=": return typeof a === "number" ? a >= (b as number) - EPS : a >= b;
      }
    }
  }
  throw new Error("bad ast");
}

/** Parse once, evaluate many: a cache keyed by source text. */
const cache = new Map<string, Ast>();
export function evalSrc(src: string, env: Env): Val {
  let ast = cache.get(src);
  if (!ast) {
    ast = parseExpr(src);
    if (cache.size > 500) cache.clear();
    cache.set(src, ast);
  }
  return evalExpr(ast, env);
}
