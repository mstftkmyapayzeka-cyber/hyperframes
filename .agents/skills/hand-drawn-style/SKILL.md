---
name: hand-drawn-style
description: Sketchy, hand-drawn (whiteboard / notebook) graphics for HyperFrames videos with Rough.js (rough-stuff/rough, MIT) — wobbly boxes, circles, arrows, underlines, hachure and cross-hatch fills — generated at authoring time as a deterministic SVG whose strokes draw themselves on. Load when a video should feel warm, explanatory or classroom-like (lectures, explainers, storytelling, "back of the napkin" reasoning), for whiteboard-style diagrams, circling or underlining a key word, or when the user asks for hand-drawn / el çizimi / sketch / doodle visuals. Includes the verified generator script and GSAP draw-on recipe.
metadata:
  internal: true
---

# Hand-drawn style (Rough.js)

## Install (in the video project)

```bash
npm i roughjs
```

Run the commands from the **video project directory** (where the packages are installed), with `HF_SKILLS` pointing at this repo's skills folder, e.g. `HF_SKILLS=/home/user/hyperframes/.claude/skills`.

## Describe the shapes

```json
{
  "seed": 11,
  "roughness": 1.4,
  "stroke": "#F0ECE5",
  "strokeWidth": 2.5,
  "shapes": [
    {
      "id": "b1",
      "type": "rect",
      "x": 160,
      "y": 380,
      "w": 420,
      "h": 200,
      "fill": "#E85D26",
      "fillStyle": "hachure"
    },
    { "id": "t1", "type": "text", "x": 370, "y": 495, "text": "kültürel yapı" },
    {
      "id": "a1",
      "type": "arrow",
      "x1": 610,
      "y1": 480,
      "x2": 880,
      "y2": 480,
      "stroke": "#E85D26"
    },
    { "id": "b2", "type": "ellipse", "x": 1130, "y": 480, "w": 440, "h": 230 },
    { "id": "t2", "type": "text", "x": 1130, "y": 495, "text": "siyasal faillik" },
    { "id": "u1", "type": "path", "d": "M 300 700 C 600 760, 1000 640, 1400 700" }
  ]
}
```

Types: `rect`, `ellipse`, `circle`, `line`, `arrow`, `path` (any SVG path — use it
for underlines, brackets, circling a word), `text`. Fill styles: `hachure`,
`cross-hatch`, `solid`, `zigzag`, `dots`. Coordinates are frame pixels (1920×1080).

## Generate

```bash
node $HF_SKILLS/hand-drawn-style/scripts/make-sketch.mjs sketch.json assets/sketch/s1.svg
```

The **seed** fixes the wobble, so every render is identical (determinism rule);
change the seed to get a different hand. Each shape is `<g id="<id>" class="sk-shape">`
with `path.sk-stroke` (all carry `pathLength="1"`); text is `text.sk-text`.

## Animate (draw-on)

```js
tl.set(S(".sk-stroke"), { strokeDasharray: 1, strokeDashoffset: 1 }, 0);
tl.to(
  S("#b1 .sk-stroke"),
  { strokeDashoffset: 0, duration: 0.9, ease: "power1.inOut", stagger: 0.05 },
  0.2,
);
tl.fromTo(S("#t1"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.0);
tl.to(S("#a1 .sk-stroke"), { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, 1.4);
```

Draw each shape when the narration reaches it; hachure fills read best drawn
right after their outline.

## Style rules

- Pair with a friendly face (the project's display font, or a handwriting font
  from `@fontsource`, e.g. Caveat or Patrick Hand — check Turkish glyph coverage
  in its `latin-ext` subset).
- Keep `roughness` 1–1.8; above 2 looks messy at 1080p. Stroke 2–3 px.
- Use it for emphasis and diagrams, not for every element: one sketch layer per
  frame on top of clean type reads as intentional.
