---
name: icon-libraries
description: Thousands of clean, consistent open-source SVG icons for HyperFrames videos — Lucide (ISC, ~2,100), Tabler (MIT, ~5,100 outline + filled) and Phosphor (MIT, ~1,500 in six weights) — inlined as recolourable SVG and optionally prepared for a draw-on stroke animation. Load whenever a video needs pictograms for list items, feature cards, process steps, roles, concepts (state, church, scales of justice, globe, money, people, documents), UI hints or infographics, or when the user asks for icons. Includes the verified search/inline helper and GSAP draw-on recipe.
metadata:
  internal: true
---

# Icon libraries (Lucide · Tabler · Phosphor)

## Install (in the video project)

```bash
npm i lucide-static @tabler/icons @phosphor-icons/core
```

Run the commands from the **video project directory** (where the packages are installed), with `HF_SKILLS` pointing at this repo's skills folder, e.g. `HF_SKILLS=/home/user/hyperframes/.claude/skills`.

## Find and inline

```bash
H=$HF_SKILLS/icon-libraries/scripts/icon.mjs
node $H search church            # lists matches per library: lucide / tabler / phosphor
node $H lucide:landmark tabler:building-church phosphor-light:scales lucide:globe \
  --size 170 --stroke 1.4 --color "#F0ECE5" --draw
```

- Prefixes: `lucide:`, `tabler:` (outline), `tabler-filled:`, `phosphor:` (regular),
  `phosphor-thin:` / `-light:` / `-bold:` / `-fill:` / `-duotone:`.
- Output is one inline `<svg class="ico ico-<lib>-<name>">` per icon, with the
  colour baked in (`--color`, default `currentColor` to inherit CSS `color`).
- `--draw` adds `pathLength="1"` to every stroke element (Lucide/Tabler) so the
  icon can draw itself on. Phosphor icons are filled shapes: fade/scale them in.

## Animate

```js
tl.set(S(".ico [pathLength]"), { strokeDasharray: 1, strokeDashoffset: 1 }, 0);
tl.to(
  S(".ico [pathLength]"),
  { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", stagger: 0.04 },
  0.2,
);
tl.fromTo(
  S(".ico-phosphor-light-scales"),
  { opacity: 0, scale: 0.8 },
  { opacity: 1, scale: 1, duration: 0.6 },
  0.4,
);
```

Reveal each icon on the narration cue that names it, like any other list item.

## Style rules

- **One library per video** (or per frame at minimum): mixing stroke styles looks
  amateur. Lucide/Tabler = line style; Phosphor = several weights incl. filled.
- Match stroke width to the type weight (≈1.25–1.75 at 120–200 px).
- Use the design's ink/accent tokens from `frame.md`; one accent icon per group.
- Avoid religious, national or party symbols unless the topic needs them, and
  never use brand logos from these sets as a stand-in for a real logo.
- Licences (ISC/MIT) permit use in videos; no attribution is required on screen.
