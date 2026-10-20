---
name: flowchart-diagrams
description: Turn a few lines of Mermaid text (mermaid-js/mermaid, MIT) into a styled, animatable SVG flowchart, process diagram, sequence diagram, timeline, mind map or state diagram for HyperFrames videos, rendered with the preinstalled Chromium and themed to the film's palette and font. Load whenever a video explains a process, causal chain, decision tree, hierarchy, workflow, algorithm, method or step sequence, or when the user asks for a flowchart/diagram/şema. Includes the verified generator (cloud-session safe), the id/styling gotchas, and GSAP recipes to reveal nodes and links in order.
metadata:
  internal: true
---

# Flowcharts and diagrams (Mermaid)

## Install (in the video project)

```bash
PUPPETEER_SKIP_DOWNLOAD=1 npm i @mermaid-js/mermaid-cli   # uses /opt/pw-browsers Chromium
```

Run the commands from the **video project directory** (where the packages are installed), with `HF_SKILLS` pointing at this repo's skills folder, e.g. `HF_SKILLS=/home/user/hyperframes/.claude/skills`.

## Write the diagram

```text
flowchart LR
  A[Teolojik kodlar] --> B[Örgütsel seferberlik]
  B --> C[Siyasal aktörler]
  C --> D[Politika tercihleri]
  D --> E[Yeni koşullar]
  E -. döngü .-> A
```

Any Mermaid type works: `flowchart TD/LR`, `sequenceDiagram`, `timeline`,
`mindmap`, `stateDiagram-v2`, `classDiagram`. Turkish labels render correctly.

## Render

```bash
node $HF_SKILLS/flowchart-diagrams/scripts/make-diagram.mjs chain.mmd assets/diagrams/chain.svg \
  --id dgchain --fonts assets/fonts --accent "#E85D26" --ink "#F0ECE5" --surface "#1A1A18"
```

- `--id` is **required per diagram** and must never be changed afterwards:
  Mermaid scopes its embedded `<style>` to that SVG id. Renaming or adding a second
  id on the `<svg>` makes every node render black. Wrap the SVG in your own div.
- `--fonts DIR` loads the project's woff2 files while Mermaid measures labels.
  Ship the **400 weight** of the font in the frame too: if only bold weights exist,
  labels render wider than measured and get clipped at the box edge.
- The script pads the viewBox (`--pad`, default 48) because Mermaid's own bounds can
  crop node tops, removes the inline `max-width`, and writes width/height so CSS
  can size it (`#wrap svg { width: 1700px; height: auto }`).
- Labels are SVG text (no `foreignObject`), so they scale crisply.

## Animate

```js
tl.fromTo(
  S("#wrap g.node"),
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.5, stagger: 0.45 },
  0.3,
);
tl.fromTo(
  S("#wrap path.flowchart-link"),
  { opacity: 0 },
  { opacity: 1, duration: 0.4, stagger: 0.45 },
  0.6,
);
tl.fromTo(S("#wrap .edgeLabels"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 2.8);
```

Nodes come out in source order, so write the Mermaid lines in the order the
narration introduces them. For a line-drawing effect on links, set
`pathLength="1"` on `path.flowchart-link` at build time and tween
`strokeDashoffset` 1 → 0 (keep their arrow markers hidden until the line lands).

## When to choose something else

Mermaid's auto-layout suits 3–12 boxes. For a bespoke composition (a ring,
strata, a hand-placed chain) lay it out by hand in HTML/SVG, or use the
`hand-drawn-style` skill for a sketched look.
