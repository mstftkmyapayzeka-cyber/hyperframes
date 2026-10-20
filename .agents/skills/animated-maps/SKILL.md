---
name: animated-maps
description: Real, animatable world and regional maps for HyperFrames videos, built at authoring time from Natural Earth data (topojson/world-atlas, public domain) with d3-geo (ISC) — highlighted countries, city points with labels, routes/arcs that draw on, graticules, globe (orthographic) or flat projections. Load whenever a video mentions countries, regions, cities, migrations, trade or diplomatic routes, wars, borders, elections by state, or any "where" — history, politics, international relations, travel, business expansion — or when the user asks for a map. Includes the verified generator script, GSAP recipes for each element, and size/projection guidance.
metadata:
  internal: true
---

# Animated maps (d3-geo + Natural Earth)

The map is generated **once, at authoring time**, as a plain SVG whose countries,
points and arcs carry ids and classes. The frame then animates that SVG with GSAP —
no map library runs at render time, so it is deterministic and offline.

## Install (in the video project)

```bash
npm i d3-geo topojson-client world-atlas      # npm works in cloud sessions; CDNs do not
```

Run the commands from the **video project directory** (where the packages are installed), with `HF_SKILLS` pointing at this repo's skills folder, e.g. `HF_SKILLS=/home/user/hyperframes/.claude/skills`.

## Generate

```bash
node $HF_SKILLS/animated-maps/scripts/make-map.mjs map.json assets/maps/middle-east.svg
```

`map.json` (all keys optional except what you need):

```json
{
  "projection": "naturalEarth1",
  "center": [5, 38],
  "scale": 900,
  "resolution": "50m",
  "highlight": { "Israel": "#E85D26", "Turkey": "#7a4028" },
  "land": "#2a2a27",
  "border": "#4a4a45",
  "graticule": false,
  "points": [{ "id": "kudus", "lon": 35.21, "lat": 31.77, "label": "Kudüs" }],
  "arcs": [{ "id": "roma-kudus", "from": [12.5, 41.9], "to": [35.21, 31.77], "bend": -0.3 }]
}
```

- `projection`: `naturalEarth1` (world), `equalEarth`, `mercator` (regional),
  `orthographic` (globe; set `rotate: [-lon, -lat]` to face a region).
- Frame a set of countries with `"fit": ["Turkey", "Israel"]` instead of
  center/scale. Country names are Natural Earth English names
  (`"United States of America"`, `"Turkey"`, `"Israel"`, `"Iran"`…).
- `resolution`: `110m` (world views) or `50m` (regional close-ups — use only when
  zoomed in). The script clips every path to the frame (plus a 5 % margin) and rounds
  coordinates to one decimal (`digits`), so a regional 50m map is ~100–150 KB instead
  of ~1.7 MB; pass `"keepOffscreen": true` if you plan to pan far outside the frame.
- Labels are SVG text in `font` (default Barlow); Turkish letters work (verified with
  Kudüs). Per point: `r` (0 = label only, e.g. a country name), `size`, `color`,
  `labelColor`, and `dx`/`dy` to nudge a label that collides with a neighbour.

## What the SVG contains

| Selector                                        | What                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `.map-country`, `#c-<slug>` (e.g. `#c-turkey`)  | one path per country                                                   |
| `.map-hl`                                       | highlighted countries (their `fill` attribute is the highlight colour) |
| `.map-borders`, `.map-graticule`, `.map-sphere` | strokes                                                                |
| `#arc-<id>` / `.map-arc`                        | route with `stroke-dasharray = stroke-dashoffset = data-length`        |
| `#pt-<id>` / `.map-point`                       | point group (circle + label), positioned by `transform`                |

Inline the SVG in the frame (or load it into a wrapper), then animate:

```js
tl.fromTo(S(".map-country"), { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.002 }, 0.1);
tl.fromTo(
  S(".map-hl"),
  { fill: "#2a2a27" },
  { fill: (i, el) => el.getAttribute("fill"), duration: 0.8 },
  0.9,
);
gsap.utils
  .toArray(S(".map-arc"))
  .forEach((a, i) =>
    tl.to(a, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 1.4 + i * 0.6),
  );
tl.fromTo(
  S(".map-point"),
  { opacity: 0, scale: 0 },
  {
    opacity: 1,
    scale: 1,
    duration: 0.5,
    ease: "back.out(3)",
    stagger: 0.25,
    transformOrigin: "0 0",
  },
  1.2,
);
// camera push onto a region: scale/translate a wrapper <g> or div around the svg, never the .clip
```

A travelling dot along an arc: sample the arc once at build time
(`getPointAtLength` in a loop into an array), then move the dot from that array in
`onUpdate` — never measure inside the callback (`gsap_callback_dom_measurement`).

## Content rules

- Borders and names are politically sensitive: use Natural Earth's geometry as is,
  state disputed status in narration when relevant, and don't invent borders.
- Attribution: "Harita verisi: Natural Earth" in the end credits (public domain,
  credit appreciated).
