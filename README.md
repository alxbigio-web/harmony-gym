# Harmony Gym

Ear, voicing and singing trainer built around a 12-week plan, for playing and hearing harmony the way Jacob Collier does.

Live: https://alxbigio-web.github.io/harmony-gym/

## What's in it

- **Ear:** scale degrees heard against a cadence (eight levels, from 1–3–5 up to all twelve degrees, minor keys, two notes at once and short melodies), chord qualities, and four-chord progressions as Roman numerals.
- **Voicings:** shell, guide tones, rootless A/B, drop 2, extensions and alterations, upper structures, borrowed chords and negative harmony. Played on a MIDI keyboard or the on-screen keys, checked instantly and timed per key.
- **Sing:** degrees and chord tones with live pitch detection, and a drone with a pitch trace and patterns to follow.
- **Plan and progress:** the 12-week plan, today's session, accuracy and speed per degree, chord and key, and common mix-ups.

## Using it

- **Mac:** open the site in Chrome and click *Connect keyboard*. To hear the app on your Logic instruments, follow the IAC Driver steps under Settings → MIDI keyboard.
- **Android:** open the site in Chrome and use *Add to Home screen*. Allow the microphone for the singing exercises.
- Progress is saved in each browser. Settings → Progress & sync makes a code that combines progress between devices.

## Building

The site is one self-contained page. Edit the files in `src/`, then run:

```sh
node src/build.mjs
```

This regenerates `index.html` (the page GitHub Pages serves), plus `dist/standalone.html` (the same app as one file for opening from disk) and `dist/artifact.html` (a version for publishing inside Claude). Node 18 or newer.

| File | What it holds |
| --- | --- |
| `src/core.js` | Music theory, storage and sync, audio engine, MIDI, pitch detection |
| `src/components.js` | Shared UI: degree pad, on-screen keyboard, controls |
| `src/ear.js` | Degree, chord-quality and progression drills |
| `src/voicings.js` | Voicing definitions, checking and the voicing trainer |
| `src/sing.js` | Singing drills, drone and pitch trace |
| `src/ui.js` | 12-week plan, Today, Progress, Settings and the app shell |
| `src/styles.css` | Styles and colour tokens for light and dark |
| `src/samples/` | Piano samples, one every minor third from A1 to C7 |

## Credits

- Piano: Salamander Grand Piano by Alexander Holm, licensed [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/). The samples here are trimmed copies of the versions in the [Tone.js audio repository](https://github.com/Tonejs/audio).
- Fonts: Bricolage Grotesque, Figtree, JetBrains Mono and Noto Music, from Google Fonts.
