#!/usr/bin/env node
// Render a Mermaid diagram (flowchart, sequence, timeline, mindmap…) to an animatable SVG.
// Usage: node make-diagram.mjs in.mmd out.svg [--id chain] [--pad 48] [--fonts assets/fonts] [--theme dark|light] [--font Barlow] [--bg transparent]
//        [--accent "#E85D26"] [--ink "#F0ECE5"] [--surface "#1A1A18"]
// Uses the preinstalled Chromium (no Puppeteer download) and flowchart SVG labels (no foreignObject),
// Give every diagram in a project its own --id: Mermaid scopes its embedded <style> to that
// SVG id, so never rename the id afterwards (the styles stop matching and nodes render black).
// The output stays a plain SVG that GSAP can animate node-by-node (g.node, path.flowchart-link).
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, readdirSync, existsSync, mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(join(process.cwd(), "noop.js"));
const [inp, out, ...rest] = process.argv.slice(2);
const opt = (k, d) => {
  const i = rest.indexOf(`--${k}`);
  return i >= 0 ? rest[i + 1] : d;
};
const chrome =
  process.env.CHROME_BIN ??
  (() => {
    const base = "/opt/pw-browsers";
    for (const d of existsSync(base) ? readdirSync(base) : [])
      for (const sub of ["chrome-linux", "chrome-linux64"]) {
        const p = join(base, d, sub, "chrome");
        if (existsSync(p)) return p;
      }
    return undefined;
  })();
const dir = mkdtempSync(join(tmpdir(), "mmd-"));
const font = opt("font", "Barlow, sans-serif"),
  accent = opt("accent", "#E85D26"),
  ink = opt("ink", "#F0ECE5"),
  surface = opt("surface", "#1A1A18");
writeFileSync(
  join(dir, "pup.json"),
  JSON.stringify({ executablePath: chrome, args: ["--no-sandbox"] }),
);
writeFileSync(
  join(dir, "cfg.json"),
  JSON.stringify({
    theme: opt("theme", "dark") === "dark" ? "base" : "default",
    flowchart: {
      htmlLabels: false,
      curve: "basis",
      padding: 18,
      nodeSpacing: 60,
      rankSpacing: 70,
      wrappingWidth: 900,
    },
    markdownAutoWrap: false,
    themeVariables:
      opt("theme", "dark") === "dark"
        ? {
            fontFamily: font,
            fontSize: "26px",
            background: "transparent",
            primaryColor: surface,
            primaryTextColor: ink,
            primaryBorderColor: ink,
            lineColor: accent,
            secondaryColor: surface,
            tertiaryColor: surface,
            clusterBkg: "transparent",
            clusterBorder: "#555",
            edgeLabelBackground: "#111111",
          }
        : { fontFamily: font, fontSize: "26px" },
  }),
);
const pkgDir = (require.resolve.paths("@mermaid-js/mermaid-cli") ?? [])
  .map((b) => join(b, "@mermaid-js", "mermaid-cli"))
  .find((p) => existsSync(p));
if (!pkgDir) throw new Error("npm i @mermaid-js/mermaid-cli (with PUPPETEER_SKIP_DOWNLOAD=1)");
const mmdc = join(pkgDir, "src", "cli.js");
// --fonts DIR: load the project's woff2 files while Mermaid measures labels, so boxes fit the real face.
const extra = [];
const fontDir = opt("fonts");
if (fontDir) {
  const family = font.split(",")[0].replace(/["']/g, "").trim();
  const css = readdirSync(fontDir)
    .filter((f) => f.endsWith(".woff2"))
    .map((f) => {
      const w = f.match(/-(\d{3})-/)?.[1] ?? "400";
      return `@font-face { font-family: "${family}"; font-weight: ${w}; src: url("file://${join(process.cwd(), fontDir, f)}") format("woff2"); }`;
    })
    .join("\n");
  writeFileSync(join(dir, "fonts.css"), css);
  extra.push("-C", join(dir, "fonts.css"));
}
execFileSync(
  process.execPath,
  [
    mmdc,
    "-i",
    inp,
    "-o",
    out,
    "-p",
    join(dir, "pup.json"),
    "-c",
    join(dir, "cfg.json"),
    "-b",
    opt("bg", "transparent"),
    "-I",
    opt("id", "mmd-diagram"),
    ...extra,
  ],
  { stdio: "inherit" },
);
// Drop Mermaid's inline max-width so CSS can size the diagram; give it real width/height from the viewBox.
let svg = readFileSync(out, "utf8");
const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
svg = svg
  .replace(/<svg([^>]*?) style="max-width:[^"]*"/, "<svg$1")
  .replace(/<svg([^>]*?) width="100%"/, "<svg$1");
// Mermaid measures with the headless browser's fonts and can crop node tops: pad the viewBox.
const pad = Number(opt("pad", "48"));
if (vb) {
  const [x, y, w, h] = vb.slice(1).map(Number);
  svg = svg.replace(vb[0], `viewBox="${x - pad} ${y - pad} ${w + 2 * pad} ${h + 2 * pad}"`);
  svg = svg.replace(
    "<svg",
    `<svg width="${Math.round(w + 2 * pad)}" height="${Math.round(h + 2 * pad)}"`,
  );
}
writeFileSync(out, svg);
console.log(`diagram → ${out}`);
