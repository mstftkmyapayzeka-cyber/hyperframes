#!/usr/bin/env node
// Inline SVG icons from Lucide (ISC), Tabler (MIT) and Phosphor (MIT), ready to animate.
// Usage:
//   node icon.mjs search <term>                      list matching names in all libraries
//   node icon.mjs lucide:landmark tabler:building-church phosphor:scales [--size 96] [--stroke 1.75]
//        [--color "#F0ECE5"] [--draw]                print one inline <svg> per icon
// --draw adds pathLength="1" to every stroke element, so GSAP can draw it on with
// strokeDasharray 1 / strokeDashoffset 1 → 0. Tabler: tabler:name (outline) or tabler-filled:name.
// Phosphor weights: phosphor:name (regular), phosphor-bold:, -light:, -thin:, -fill:, -duotone:.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(join(process.cwd(), "noop.js"));
const root = (pkg) => {
  for (const base of require.resolve.paths(pkg) ?? [])
    if (existsSync(join(base, pkg))) return join(base, pkg);
  throw new Error(`package not installed: ${pkg} (npm i ${pkg})`);
};
const LIBS = {
  lucide: () => join(root("lucide-static"), "icons"),
  tabler: () => join(root("@tabler/icons"), "icons", "outline"),
  "tabler-filled": () => join(root("@tabler/icons"), "icons", "filled"),
  phosphor: () => join(root("@phosphor-icons/core"), "assets", "regular"),
};
for (const w of ["bold", "light", "thin", "fill", "duotone"])
  LIBS[`phosphor-${w}`] = () => join(root("@phosphor-icons/core"), "assets", w);

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
if (args[0] === "search") {
  const term = (args[1] ?? "").toLowerCase();
  for (const lib of ["lucide", "tabler", "phosphor"]) {
    const names = readdirSync(LIBS[lib]())
      .filter((f) => f.endsWith(".svg") && f.includes(term))
      .map((f) => f.slice(0, -4));
    console.log(
      `${lib} (${names.length}): ${names.slice(0, 40).join(", ")}${names.length > 40 ? " …" : ""}`,
    );
  }
  process.exit(0);
}
const size = opt("size", "96"),
  stroke = opt("stroke"),
  color = opt("color", "currentColor"),
  draw = args.includes("--draw");
for (const spec of args.filter((a, i) => a.includes(":") && !args[i - 1]?.startsWith("--"))) {
  const [lib, name] = spec.split(":");
  const dir = LIBS[lib]?.();
  const file =
    dir &&
    join(
      dir,
      `${name}${lib.startsWith("phosphor") && lib !== "phosphor" ? "-" + lib.split("-")[1] : ""}.svg`,
    );
  if (!file || !existsSync(file)) {
    console.error(`not found: ${spec} (try: node icon.mjs search ${name})`);
    process.exitCode = 1;
    continue;
  }
  let svg = readFileSync(file, "utf8")
    .replace(/<!--.*?-->/gs, "")
    .replace(/\s+/g, " ")
    .trim();
  svg = svg
    .replace(/\sclass="[^"]*"/, "")
    .replace(/\swidth="[^"]*"/, "")
    .replace(/\sheight="[^"]*"/, "");
  svg = svg.replace(
    "<svg",
    `<svg class="ico ico-${lib}-${name}" width="${size}" height="${size}" aria-hidden="true"`,
  );
  if (stroke) svg = svg.replace(/stroke-width="[^"]*"/, `stroke-width="${stroke}"`);
  svg = svg.replace(/currentColor/g, color);
  if (draw)
    svg = svg.replace(
      /<(path|line|polyline|polygon|circle|rect|ellipse)\b(?![^>]*stroke="none")/g,
      '<$1 pathLength="1"',
    );
  console.log(svg);
}
