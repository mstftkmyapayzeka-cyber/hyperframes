---
name: video-toolkit
description: Owner's video playbook for this account — load alongside /hyperframes whenever the user asks to make a video (in any language, e.g. "video yap", "bir video hazırla"). Says which extra engines to combine with HyperFrames (Manim for mathematical/diagram morphs, Motion Canvas via Revideo for TypeScript-generated vector scenes, Whisper for word timings and captions), the narration workflow the owner prefers (Claude writes a per-scene script, the owner voices it in ElevenLabs and uploads one file per scene, Claude integrates it), and the cloud-environment fixes learned the hard way (GSAP and fonts from npm because jsdelivr is blocked, dark stage background to avoid seam flashes, Turkish glyph coverage).
metadata:
  internal: true
---

# Video toolkit — how to make this owner's videos

HyperFrames stays the **master**: brief, storyboard, frames, audio mix,
transitions, final render (`/hyperframes` → the routed workflow). The engines
below produce _clips_ that HyperFrames places on its timeline.

## Pick the engine per beat

| Beat needs…                                                                            | Use                                                        | Skill                                         |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| kinetic type, cards, lists, layouts, page-like scenes                                  | HyperFrames + GSAP                                         | `/hyperframes-core`, `/hyperframes-animation` |
| a shape/graph/equation that **transforms** (morph, plot, network build)                | Manim → MP4 / alpha WebM                                   | `manim-video`                                 |
| procedural vector animation authored as TS generators (node graphs, code walkthroughs) | Motion Canvas API rendered by Revideo                      | `revideo-motion-canvas`                       |
| captions, subtitles, word-synced reveals from a voice file                             | Whisper (faster-whisper / `hyperframes transcribe`)        | `whisper-transcribe`                          |
| named looks, charts, maps, glitch, grain, transitions                                  | HyperFrames registry (`npx hyperframes catalog --query …`) | `/hyperframes-registry`                       |
| countries, cities, routes, regions — any "where"                                       | d3-geo + Natural Earth map SVG, animated with GSAP         | `animated-maps`                               |
| pictograms for lists, cards, steps, concepts                                           | Lucide / Tabler / Phosphor inline SVG icons                | `icon-libraries`                              |
| a process, causal chain, decision tree, timeline from text                             | Mermaid → themed SVG, nodes revealed in order              | `flowchart-diagrams`                          |
| a warm whiteboard / notebook look, circling or underlining                             | Rough.js sketch SVG that draws itself on                   | `hand-drawn-style`                            |

Use an engine only where it clearly beats GSAP; one or two Manim/Revideo beats
per film is typical. Keep the palette and fonts from `frame.md` in every clip.

## The owner's narration workflow

1. Build the video first with on-screen text carrying the content.
2. Deliver a **per-scene narration script** (`SESLENDIRME.md` + a plain
   `seslendirme.txt`), one paragraph per scene, foreign names spelled the way
   they are pronounced (Baskar, Arçır…), recommending ElevenLabs _Multilingual v2_.
3. The owner uploads one file per scene. Upload limit is 5 files per message, so
   ask for a single **.zip**; unzip into a clean dir. File names vary
   (`sahne 5.mp3`, `sahne12.mp3`): take the number from the name **without the
   extension** (the `3` in `mp3` once corrupted every index).
4. Convert to `assets/voice/NN.wav` (mono 44.1k), prepend 0.4 s silence, set each
   frame to `voice + 0.9 s`, time-scale that frame's reveal timeline to fit (or
   word-sync with Whisper when models are reachable), list voices in
   `audio_meta.json`, drop BGM volume to ~0.2, re-assemble and render.

## Cloud-environment fixes (verified)

- **jsdelivr / unpkg / GitHub raw are blocked; npm and PyPI work.** Vendor GSAP:
  `npm pack gsap@3.14.2` → `assets/vendor/gsap.min.js`; point every frame's
  script tag and the assembled `index.html` at it (the assembler writes a CDN URL
  with an integrity hash — replace both).
- **Fonts:** `npm pack @fontsource/<family>` → copy the `latin` and `latin-ext`
  woff2 files to `assets/fonts/` and declare both subsets with their
  `unicode-range` in each frame (latin-ext carries ş ğ İ ı for Turkish).
- **Seam flash:** after assembling, make sure the index `#root` background is the
  film's own ground — `#111111` for a dark film, the paper colour (e.g. `#F4EEE2`)
  for a cream/academic one. Any mismatch flashes one frame at every transition;
  scan renders with an ffmpeg luma check.
- **Element ids must start with a letter** (`f01-…`), not the frame id's digits.
- **Background art** can be animated line art drawn in SVG/CSS (globe, strata,
  orbits, networks, archive sheets, outlined keywords) — give outlined text a
  faint fill colour and `data-layout-allow-overlap` on the art layer, or `check`
  reports it as unpainted/overlapping text.
- Renders are CPU-only: ~2.6× real time at 1080p30. Run them in the background.
- Music without a provider: synthesise an original ambient bed (numpy + ffmpeg
  `aecho`/`loudnorm`) sized to the film, or ask the owner for a licensed track.

## Accuracy

For academic or factual films, never invent findings, figures or dates. Mark any
added historical context in the delivery note so the owner can check it.
