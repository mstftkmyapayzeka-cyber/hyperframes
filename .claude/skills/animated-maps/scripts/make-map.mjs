#!/usr/bin/env node
// Build an animatable SVG map from Natural Earth (world-atlas) with d3-geo.
// Usage: node make-map.mjs spec.json out.svg
// spec: { width, height, projection: "naturalEarth1"|"mercator"|"orthographic"|"equalEarth",
//         rotate?: [lon,lat], center?: [lon,lat], scale?, fit?: ["Turkey","Israel"] (country names to frame),
//         resolution?: "110m"|"50m", highlight?: {"Turkey":"#E85D26"}, land?: "#2a2a27", border?: "#555",
//         points?: [{id,lon,lat,label}], arcs?: [{id,from:[lon,lat],to:[lon,lat],bend?:0.25}], graticule?: true }
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
const d3 = await load("d3-geo");
const { feature, mesh } = await load("topojson-client");
const [specPath, outPath] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const W = spec.width ?? 1920,
  H = spec.height ?? 1080;
const topo = require(`world-atlas/countries-${spec.resolution ?? "110m"}.json`);
const countries = feature(topo, topo.objects.countries).features;
const byName = new Map(countries.map((f) => [f.properties.name, f]));

const ctor = {
  naturalEarth1: d3.geoNaturalEarth1,
  mercator: d3.geoMercator,
  orthographic: d3.geoOrthographic,
  equalEarth: d3.geoEqualEarth,
}[spec.projection ?? "naturalEarth1"];
const proj = ctor();
if (spec.rotate) proj.rotate(spec.rotate);
if (spec.fit) {
  const fc = {
    type: "FeatureCollection",
    features: spec.fit.map((n) => byName.get(n)).filter(Boolean),
  };
  proj.fitExtent(
    [
      [W * 0.12, H * 0.12],
      [W * 0.88, H * 0.88],
    ],
    fc,
  );
} else {
  if (spec.center) proj.center(spec.center);
  proj.scale(spec.scale ?? W / 5.6).translate([W / 2, H / 2]);
}
const path = d3.geoPath(proj);
const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const land = spec.land ?? "#2a2a27",
  border = spec.border ?? "#4a4a45";
let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n`;
if (spec.graticule)
  out += `<path class="map-graticule" d="${path(d3.geoGraticule10())}" fill="none" stroke="${border}" stroke-opacity="0.35" stroke-width="1"/>\n`;
if (spec.projection === "orthographic")
  out += `<path class="map-sphere" d="${path({ type: "Sphere" })}" fill="none" stroke="${border}" stroke-width="1.5"/>\n`;
out += `<g class="map-countries">\n`;
for (const f of countries) {
  const d = path(f);
  if (!d) continue;
  const name = f.properties.name,
    hl = spec.highlight?.[name];
  out += `<path id="c-${slug(name)}" class="map-country${hl ? " map-hl" : ""}" data-name="${name}" d="${d}" fill="${hl ?? land}"/>\n`;
}
out += `</g>\n<path class="map-borders" d="${path(mesh(topo, topo.objects.countries, (a, b) => a !== b))}" fill="none" stroke="${border}" stroke-width="0.8"/>\n`;
for (const a of spec.arcs ?? []) {
  const [x0, y0] = proj(a.from),
    [x1, y1] = proj(a.to);
  const mx = (x0 + x1) / 2,
    my = (y0 + y1) / 2,
    dx = x1 - x0,
    dy = y1 - y0,
    b = a.bend ?? 0.25;
  const cx = mx - dy * b,
    cy = my + dx * b;
  const len = Math.round(Math.hypot(dx, dy) * 1.15);
  out += `<path id="arc-${a.id}" class="map-arc" d="M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${a.color ?? "#E85D26"}" stroke-width="${a.width ?? 3}" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len}" data-length="${len}"/>\n`;
}
for (const p of spec.points ?? []) {
  const [x, y] = proj([p.lon, p.lat]);
  out +=
    `<g id="pt-${p.id}" class="map-point" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="${p.r ?? 9}" fill="${p.color ?? "#E85D26"}"/>` +
    (p.label
      ? `<text x="16" y="7" font-family="Barlow, sans-serif" font-size="${p.size ?? 30}" font-weight="700" fill="${p.labelColor ?? "#F0ECE5"}">${p.label}</text>`
      : "") +
    `</g>\n`;
}
out += `</svg>\n`;
writeFileSync(outPath, out);
console.log(
  `map → ${outPath} (${countries.length} countries, ${(out.length / 1024).toFixed(0)} KB)`,
);
