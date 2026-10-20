---
name: manim-video
description: Render 3Blue1Brown-style explanatory animations with Manim Community (ManimCommunity/manim, MIT) — morphing diagrams, causal chains, graphs, timelines, geometric metaphors, equations — as MP4 or transparent WebM clips, then drop them into a HyperFrames composition as a muted video clip. Load whenever a video needs a concept diagram that must transform smoothly (one shape becoming another, a network assembling, a graph drawing itself, an abstract idea visualised mathematically), or when the user asks for Manim. Covers the verified cloud-session install (pango/cairo system libs), Turkish/Unicode text, brand fonts, transparent output, and the HyperFrames embed contract.
metadata:
  internal: true
---

# Manim video clips

Manim is strongest where HTML/GSAP is weakest: **continuous transformations** —
`Transform`, `ReplacementTransform`, `Create`, `Write`, `GrowFromCenter`, path
morphs, graph plotting, camera moves over vector scenes. Use it for the _diagram
beat_ of a film and keep typography, layout and pacing in HyperFrames.

## Install (verified in a cloud session)

```bash
apt-get install -y libpango1.0-dev libcairo2-dev pkg-config   # manimpango needs pangocairo
python3 -m venv /tmp/manim-venv && . /tmp/manim-venv/bin/activate
pip install manim                                              # 0.22.x verified
```

`ffmpeg` is preinstalled. **No LaTeX** in the image: use `Text` / `MarkupText`,
not `MathTex` / `Tex` (or `apt-get install texlive-latex-base` first, slow).

## Render

```bash
manim -qh --format=mp4  -o clip       scene.py MyScene   # 1080p30 opaque
manim -qh -t --format=webm -o clip_a  scene.py MyScene   # transparent (VP9 + alpha)
manim -qk ...                                            # 4K60 when needed
```

Output lands in `media/videos/<file>/<quality>/`. Set
`config.frame_rate = 30` and `config.pixel_width/height = 1920/1080` in the file
for exact HyperFrames parity.

## Text, Turkish and fonts

- `Text("Nedensel zincir: şğıİçö")` renders all Turkish glyphs (verified).
- Default face is a system serif. For a brand face, install a TTF into
  `~/.fonts/` (fonts from npm, e.g. `npm pack @fontsource/barlow` ships woff2 only;
  convert or use a TTF source), run `fc-cache -f`, then `Text(..., font="Barlow")`.
- Keep colours in sync with the project's `frame.md` tokens (pass hex strings).

## Minimal scene

```python
from manim import *
config.frame_rate = 30
class Chain(Scene):
    def construct(self):
        self.camera.background_color = "#111111"
        labels = ["teoloji", "örgüt", "aktör", "politika"]
        nodes = VGroup(*[VGroup(Square(1.6, color="#F0ECE5"), Text(l, font_size=28)) for l in labels])
        nodes.arrange(RIGHT, buff=0.8)
        arrows = VGroup(*[Arrow(a.get_right(), b.get_left(), buff=0.1, color="#E85D26") for a, b in zip(nodes, nodes[1:])])
        self.play(LaggedStart(*[FadeIn(n, shift=UP * 0.3) for n in nodes], lag_ratio=0.25))
        self.play(LaggedStart(*[GrowArrow(a) for a in arrows], lag_ratio=0.3))
        dot = Dot(nodes[0].get_center(), color="#E85D26", radius=0.15)
        self.play(FadeIn(dot)); self.play(MoveAlongPath(dot, Line(nodes[0].get_center(), nodes[-1].get_center())), run_time=2)
        self.wait(0.5)
```

## Putting the clip into HyperFrames

Copy the render to `assets/clips/<name>.mp4` (or `.webm` for alpha) and mount it
as a **muted** timed video, a direct child of the frame root, never nested inside
another timed element:

```html
<video
  id="f05-chain"
  class="clip"
  src="../../assets/clips/chain.webm"
  muted
  playsinline
  data-start="1.2"
  data-duration="6"
  data-track-index="2"
></video>
```

The framework owns playback (seek-safe). Size/position it with CSS; animate a
wrapper, not the `.clip` element itself. Match the clip length to the beat it
illustrates — render with `self.wait()` padding instead of looping.

## When not to use it

Plain kinetic typography, cards, lists and UI mockups are faster and sharper in
HyperFrames/GSAP. Reach for Manim only when the motion _is_ a mathematical or
diagrammatic transformation.
