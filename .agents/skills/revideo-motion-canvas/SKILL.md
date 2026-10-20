---
name: revideo-motion-canvas
description: Build code-driven animated explainer clips with the Motion Canvas API (motion-canvas/motion-canvas, MIT) and render them headlessly to MP4 with Revideo (redotvideo/revideo, MIT, the Motion Canvas fork that adds a programmatic renderer). Load when a video needs generator-timed vector animation — signals, tweened layouts, node graphs, code walkthroughs, Latex-free diagrams, procedural scenes — that is easier to express as TypeScript scene generators than as GSAP timelines, or when the user asks for Motion Canvas or Revideo. Covers the verified cloud-session setup (npm packages, JSX tsconfig, FFmpeg exporter because headless Chromium has no H.264 WebCodecs encoder, preinstalled Chromium, telemetry off) and how to hand the clip to HyperFrames.
metadata:
  internal: true
---

# Motion Canvas scenes, rendered by Revideo

Write scenes with the **Motion Canvas** API (`makeScene2D`, `yield*` generators,
signals, `all`/`sequence`/`chain`, refs). Motion Canvas itself renders only from
its browser editor, so in an agent session render with **Revideo**, which keeps
the same scene API (`@revideo/2d`, `@revideo/core`) and adds `renderVideo()`.

## Setup (verified in a cloud session)

```bash
mkdir clipproj && cd clipproj && npm init -y
PUPPETEER_SKIP_DOWNLOAD=1 npm i @revideo/core @revideo/2d @revideo/renderer \
  @revideo/vite-plugin @revideo/ffmpeg @revideo/ui typescript      # 0.11.x verified
```

`@revideo/ui` is required at render time even headless (the vite plugin imports it).
npm works through the proxy; jsdelivr/unpkg do not, so never load Revideo from a CDN.

`tsconfig.json` — without the JSX import source the scene fails with
"The thread is not available in the current context":

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "@revideo/2d/lib",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## Scene and project

```tsx
// src/scenes/example.tsx
import { Circle, Txt, makeScene2D } from "@revideo/2d";
import { all, createRef, waitFor } from "@revideo/core";

export default makeScene2D("example", function* (view) {
  view.fill("#111111");
  const title = createRef<Txt>();
  const dot = createRef<Circle>();
  view.add(
    <Txt
      ref={title}
      text="Nedensel zincir: şğıİçö"
      fill="#F0ECE5"
      fontSize={80}
      opacity={0}
      y={-120}
    />,
  );
  view.add(<Circle ref={dot} size={0} fill="#E85D26" y={120} />);
  yield* all(title().opacity(1, 0.8), title().y(-160, 0.8));
  yield* dot().size(160, 0.6);
  yield* dot().x(500, 1);
  yield* waitFor(0.5);
});
```

```ts
// src/project.ts
import { makeProject } from "@revideo/core";
import example from "./scenes/example?scene";
export default makeProject({
  scenes: [example],
  settings: { shared: { size: { x: 1920, y: 1080 } } },
});
```

## Render

```js
// render.mjs
import { renderVideo } from "@revideo/renderer";
const file = await renderVideo({
  projectFile: "./src/project.ts",
  settings: {
    outFile: "clip.mp4",
    outDir: "./out",
    logProgress: true,
    // headless Chromium lacks an H.264 WebCodecs encoder ("Encoder creation error"):
    projectSettings: { exporter: { name: "@revideo/core/ffmpeg", options: { format: "mp4" } } },
    puppeteer: { executablePath: process.env.CHROME_BIN, args: ["--no-sandbox"] },
  },
});
console.log("done", file);
```

```bash
DISABLE_TELEMETRY=true CHROME_BIN=$(ls -d /opt/pw-browsers/chromium*/chrome-linux*/chrome | head -1) node render.mjs
```

`DISABLE_TELEMETRY=true` is mandatory here: otherwise the process hangs after the
render, retrying a blocked analytics host. Turkish glyphs render with the default
font (verified); for a brand face add an `@font-face` via a CSS import or set
`fontFamily` to an installed family.

## Handing the clip to HyperFrames

Copy `out/clip.mp4` to the HyperFrames project's `assets/clips/` and mount it as a
muted timed `<video class="clip">` that is a direct child of the frame root (same
contract as the `manim-video` skill). For transparency, use the image-sequence
exporter (`@revideo/core/image-sequence`) and encode a VP9-alpha WebM with ffmpeg.

## When to choose it

- Motion Canvas / Revideo: procedural, signal-driven vector animation authored in
  TypeScript (graphs that re-layout, code highlighting, step-by-step diagram builds).
- Manim (`manim-video`): mathematical morphs and plotting.
- HyperFrames + GSAP: typography, layout, page-like scenes, the master timeline,
  audio and final render.
