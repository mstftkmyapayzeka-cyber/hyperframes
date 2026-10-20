# Project-local Claude Code skills

Skills in this directory are auto-discovered by Claude Code when the
`hyperframes` repo is opened as the working directory. They are NOT part of
the marketplace-distributed plugin (that set lives under `skills/` and is
manifested by `.claude-plugin/`). Two separate namespaces, on purpose:

- `.claude/skills/` — **repo-native**, run only against this repo (weekly
  changelog videos, doctrine-heavy authoring flows). Claude Code's
  project-local skill dir.
- `skills/` — **marketplace-distributable**, installed into other projects
  via `npx hyperframes skills` or `npx skills add heygen-com/hyperframes`.

> **Warning:** Never run `npx skills add ... --all` from inside a HyperFrames checkout: it selects the OpenClaw target, whose `skills/` directory is the repo's own `skills/`, and removes each existing `skills/<name>` destination before linking. A fresh clone restores tracked source, but uncommitted work under `skills/` does not recover. Run it from an empty directory or from your own project root. This happens regardless of `metadata.internal`.

## Video engine skills (repo-native)

Four skills extend the video workflows with external open-source engines, each
verified in a cloud session:

- `video-toolkit` — the playbook: which engine to use per beat, the
  per-scene narration (ElevenLabs upload) workflow, and cloud-environment fixes.
- `manim-video` — Manim Community clips (diagram/graph morphs) as MP4 or alpha WebM.
- `revideo-motion-canvas` — Motion Canvas scenes rendered headlessly by Revideo.
- `whisper-transcribe` — faster-whisper / `hyperframes transcribe` word timings
  for captions and word-synced reveals (model download needs huggingface.co).

Visual skills that generate animatable SVG at authoring time (each ships its
generator in `scripts/`):

- `animated-maps` — d3-geo + Natural Earth maps: countries, points, routes.
- `icon-libraries` — Lucide / Tabler / Phosphor inline icons with draw-on.
- `flowchart-diagrams` — Mermaid text → themed, node-by-node animated SVG.
- `hand-drawn-style` — Rough.js sketch shapes that draw themselves on.

They are real directories (not links) and mirror byte-for-byte between
`.claude/skills/` and `.agents/skills/`.

## Published skills (symlinked)

The 21 marketplace skills under `skills/` are also symlinked here
(`<name>` → `../../skills/<name>`), so Claude Code auto-discovers the full
HyperFrames set when this repo is the working directory — including cloud
sessions, which load project skills but not plugins. `skills/` stays the
single source of truth; edit there, never through the link.

When you add or remove a published skill, update the links in both
`.claude/skills/` and `.agents/skills/` and the matching `!…` allowlist
entries in `.gitignore`:

```bash
for d in skills/*/; do n=$(basename "$d"); [ -f "$d/SKILL.md" ] || continue
  for base in .claude .agents; do ln -sfn "../../skills/$n" "$base/skills/$n"; done
done
```

`scripts/lint-skills.ts` skips the links (the targets are linted under
`skills/`).

## Weekly changelog video

The `changelog-video` skill turns a weekly changelog markdown into a
~45–60s branded 1080×1080 MP4 (motion-doctrine layout, Annie VO,
seam-gated cuts, caption rail). It ships pre-configured — fonts,
background pattern, house BGM, lexicon, and the align-captions script all
live inside `changelog-video/`. Its five dependency skills
(`motion-doctrine`, `cut-the-curve`, `captions-overlay`, `seam-craft`,
`oversized-cursor`) sit alongside so the router graph is complete on
clone.

Weekly usage:

1. Regenerate the digest markdown for the target range:
   `bun run changelog:weekly --from YYYY-MM-DD --to YYYY-MM-DD` (this
   only reads git; the `--write` variant is what the docs cron uses).
2. In Claude Code at the repo root, invoke `/changelog-video` with the
   generated markdown. The agent will present its script + visualization
   plan for review before rendering.
3. Accept, and the agent produces `weekly-changelog-<range>.mp4` gated by
   `hyperframes check` (0 errors) + `seam-gate verify` (0 fail/warn).

TTS uses the tracked `skills/hyperframes-media/scripts/heygen-tts.mjs`
(no extra install needed). Runtime dependencies you need on PATH:

- Node ≥ 22
- HeyGen CLI ≥ 0.3.0, authenticated via `heygen auth login --oauth`
- `ffmpeg` (for VO wav conversion + frame QA)
- A headless Chrome for HyperFrames rendering (`hyperframes doctor` will
  point out the exact ask if it's missing)

The parallel set at `.agents/skills/` is a byte-identical copy so Codex
CLI users get the same auto-discover behaviour — keep the two in sync
when editing. A `scripts/check-skill-mirror.mjs` check enforces this at
CI time.

Each repo-native skill declares `metadata.internal: true`. That excludes it from
normal `npx skills add` discovery and from `npx skills add ... --all`. A named
`npx skills add ... --skill <name>` still installs a matching skill regardless of
`metadata.internal`; no environment variable is needed. `INSTALL_INTERNAL_SKILLS=1`
opts internal skills into normal discovery and bulk installation. This does not
change local agent discovery.
