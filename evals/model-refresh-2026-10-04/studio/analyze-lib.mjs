const Z = 1.2816;
export function wilson(k, n) { if (!n) return [0, 0]; const p = k / n, d = 1 + Z * Z / n, c = (p + Z * Z / (2 * n)) / d, h = (Z * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; }
