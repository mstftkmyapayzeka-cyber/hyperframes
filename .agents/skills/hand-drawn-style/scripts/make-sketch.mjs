#!/usr/bin/env node
// Hand-drawn (Rough.js, MIT) shapes → a static, deterministic SVG whose strokes can be drawn on.
// Usage: node make-sketch.mjs spec.json out.svg
// spec: { width, height, seed?, roughness?, stroke?, strokeWidth?, shapes: [
//   {id, type:"rect", x,y,w,h, fill?, fillStyle?:"hachure"|"cross-hatch"|"solid"|"zigzag"|"dots"},
//   {id, type:"ellipse"|"circle", x,y,w,h?},  {id, type:"line"|"arrow", x1,y1,x2,y2},
//   {id, type:"path", d},  {id, type:"text", x,y, text, size?, weight?, anchor?} ] }
// Every stroke path gets pathLength="1": draw it on with GSAP { strokeDashoffset: 1 → 0 }
// after setting stroke-dasharray: 1. The fixed seed makes the wobble identical on every render.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// Packages resolve from the directory you run the script in (the video project), not from this file.
const require = createRequire(join(process.cwd(), "noop.js"));
const load = async (m) => {
  try {
    return await import(pathToFileURL(require.resolve(m)).href);
  } catch {
    throw new Error(`missing package "${m}" — run in the project: npm i ${m}`);
  }
};
const roughMod = await load("roughjs");
const rough = roughMod.default ?? roughMod;

const [specPath, outPath] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const W = spec.width ?? 1920,
  H = spec.height ?? 1080;
const gen = rough.generator();
const base = {
  seed: spec.seed ?? 7,
  roughness: spec.roughness ?? 1.4,
  bowing: spec.bowing ?? 1.2,
  stroke: spec.stroke ?? "#F0ECE5",
  strokeWidth: spec.strokeWidth ?? 2.5,
  fillWeight: 1.6,
  hachureGap: 10,
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n`;
for (const [i, s] of spec.shapes.entries()) {
  const o = {
    ...base,
    ...s.options,
    seed: (spec.seed ?? 7) + i,
    ...(s.fill ? { fill: s.fill, fillStyle: s.fillStyle ?? "hachure" } : {}),
  };
  if (s.stroke) o.stroke = s.stroke;
  let ds = [];
  if (s.type === "text") {
    out += `<text id="${s.id}" class="sk-text" x="${s.x}" y="${s.y}" font-family="${s.font ?? "Barlow, sans-serif"}" font-size="${s.size ?? 40}" font-weight="${s.weight ?? 700}" text-anchor="${s.anchor ?? "middle"}" fill="${s.color ?? base.stroke}">${esc(s.text)}</text>\n`;
    continue;
  }
  if (s.type === "rect") ds = [gen.rectangle(s.x, s.y, s.w, s.h, o)];
  else if (s.type === "ellipse") ds = [gen.ellipse(s.x, s.y, s.w, s.h ?? s.w, o)];
  else if (s.type === "circle") ds = [gen.circle(s.x, s.y, s.w, o)];
  else if (s.type === "line") ds = [gen.line(s.x1, s.y1, s.x2, s.y2, o)];
  else if (s.type === "path") ds = [gen.path(s.d, o)];
  else if (s.type === "arrow") {
    const a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1),
      L = s.head ?? 26;
    const p = (da) => [s.x2 - L * Math.cos(a + da), s.y2 - L * Math.sin(a + da)];
    const [l, r] = [p(0.45), p(-0.45)];
    ds = [gen.line(s.x1, s.y1, s.x2, s.y2, o), gen.linearPath([l, [s.x2, s.y2], r], o)];
  }
  out += `<g id="${s.id}" class="sk-shape">`;
  for (const d of ds)
    for (const p of gen.toPaths(d)) {
      const isFill = p.fill && p.fill !== "none" && p.stroke === "none";
      out += `<path class="${isFill ? "sk-fill" : "sk-stroke"}" d="${p.d}" fill="${p.fill ?? "none"}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${isFill ? "" : ' pathLength="1"'}/>`;
    }
  out += `</g>\n`;
}
out += `</svg>\n`;
writeFileSync(outPath, out);
console.log(`sketch → ${outPath} (${spec.shapes.length} shapes)`);
