---
name: whisper-transcribe
description: Transcribe narration or footage to word-level timestamps with open-source Whisper — faster-whisper (SYSTRAN/faster-whisper, MIT) in Python or whisper.cpp (ggml-org/whisper.cpp, MIT) via `hyperframes transcribe` — for subtitles/captions, SRT/VTT export, and syncing on-screen reveals to the exact spoken word. Load when a video has voice-over (TTS or a user-recorded/ElevenLabs file) and needs captions or word-synced animation, when the user uploads audio to be timed, or asks for Whisper. Covers install, Turkish and other non-English languages, the model-download network requirement (huggingface.co) of cloud sessions, and how to turn word timings into reveal cues.
metadata:
  internal: true
---

# Whisper word timings

## Two engines

| Engine                                              | Install                                   | Use                                                             |
| --------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| `hyperframes transcribe` (whisper.cpp, or Parakeet) | ships with the CLI; runtime auto-installs | writes `transcript.json` in a project, `--to srt/vtt` sidecars  |
| faster-whisper (CTranslate2)                        | `pip install faster-whisper` (verified)   | scripted control, per-word probabilities, batch over many files |

## Network requirement (cloud sessions)

Both engines download model weights from **huggingface.co** on first use. In a
default cloud environment that host is blocked (`ProxyError: 403`), so the install
succeeds but the first transcription fails. Ask the user to allow `huggingface.co`
(and `cdn-lfs.huggingface.co`) in the environment's network settings, then start a
new session. Never fake timings: without a model, fall back to proportional
timing (scale each scene's reveals to its audio length) and say so.

## Turkish and other languages

The CLI's `.en` models are English-only. For Turkish use a multilingual model:

```bash
npx hyperframes transcribe narration.wav --language tr --model large-v3 --json
npx hyperframes transcribe narration.wav --language tr --model large-v3 --to srt -o narration.srt
```

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3", device="cpu", compute_type="int8")   # "small" is faster, less accurate
segments, info = model.transcribe("assets/voice/03.wav", language="tr", word_timestamps=True, vad_filter=True)
words = [{"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
         for s in segments for w in s.words]
```

When the script is known (an ElevenLabs/TTS file read from our own text), trust
the script's spelling and use Whisper only for the times: align the transcript
words to the script words in order and copy the start/end across.

## Using the timings

- **Word-synced reveals:** for each on-screen item, find the first spoken word that
  names it and schedule its entrance at that word's `start` (minus ~0.15 s) inside
  the frame's timeline. Frame-local time = word start − the voice clip's offset.
- **Captions:** feed `[{id, text, start, end}]` words to the workflow's captions
  step (`captions.mjs build --audio-meta …`) or export SRT/VTT for players.
- **Scene durations:** a frame lasts its voice clip + a short tail; let the voice
  decide length, never stretch the voice to the picture.

## Per-scene files

Prefer one audio file per scene (`01.wav`, `02.wav`, …): no splitting needed and
timings stay frame-local. A single long file needs splitting on ≥0.8 s silences
(`ffmpeg -af silencedetect=n=-40dB:d=0.8`) checked against the script's scene
boundaries before any timing is trusted.
