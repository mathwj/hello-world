# Border Control

An interactive customs officer. He asks the questions **out loud**, opens the
microphone, and waits for your answer. He decides whether you get in. Static
HTML, CSS and JavaScript, no dependencies.

```sh
npx http-server . -p 8080     # then open http://localhost:8080
```

Serve it rather than double-clicking it: browsers refuse microphone access on
`file://`, so opening the file directly gets you the typed interview only.

`node build.mjs` writes `dist/border-control.html` — the same app inlined into
one self-contained file.

## Talking to him

The turn is: **he speaks → the mic opens → you answer → he replies.** The mic is
only live while he is waiting for you, which the pulsing button and the
`LISTENING` sign in the booth both show; what it thinks it is hearing appears as
a dashed bubble before it commits.

Speech needs a click to start (browsers will not open a mic or a voice without
one), which is what the gate at the front is for. From there:

- **Voice out** is `speechSynthesis`. The caption and the mouth are driven from
  the utterance itself, so the lips match the audio rather than a typing
  animation — see below.
- **Voice in** is `SpeechRecognition`: Chrome, Edge and Safari, on a secure
  origin. Firefox does not implement it.
- **Every failure falls back to typing**, and says so in the log: no voice on
  this browser, permission refused, speech service unreachable, nothing heard
  twice in a row. The chips and the text box work at every point, and
  `VOICE OFF` in the header turns the whole thing back into a typed interview.

He will not talk over you: the mic never opens until he has finished his line,
and anything you type while he is speaking stays in the box rather than being
swallowed.

## What moves

Nothing here is a video or a sprite sheet — the officer is one inline SVG that
is rigged and animated:

- **Breathing** — the whole body scales a fraction from the waist on a 4.4s
  cycle, so the head rides up and down with the chest.
- **Idle sway** — the head rotates on a longer, deliberately non-matching cycle
  (7.3s) so the two motions drift in and out of phase instead of looking looped.
- **Blinking** — randomised every 2–6s, with an occasional quick double blink.
- **Gaze** — head and pupils follow your cursor across the booth; when the
  cursor goes quiet he starts glancing around on his own.
- **Mouth** — the lips are a path regenerated every frame from three numbers
  (open, wide, curve). Each character sets a rough viseme target — vowels open
  wide, `m`/`b`/`p` close it, punctuation shuts it — and the jaw eases toward
  that target.

  When he has a voice, the character position comes from the utterance rather
  than from a timer: `boundary` events re-anchor it, and the gap between them is
  filled by a chars-per-second rate the code *measures from the first events*
  instead of assuming, since every voice speaks at its own pace. Browsers that
  fire no boundary events fall back to the estimate alone. Silent, it is the
  same three calls driven by the typewriter.
- **Moods** — `neutral`, `stern`, `friendly` and `suspicious` change the brow
  height, the eye aperture and the curve of the mouth.
- **The stamp** — at the verdict, an arm swings down *from the shoulder*, the
  counter jolts on impact, and the mark lands on the passport.

Everything respects `prefers-reduced-motion`: ambient animation stops and the
dialogue types out almost instantly.

## The conversation

`js/dialogue.js` holds the whole script as data. Each node is one question:

```js
purpose: {
  ask: ['Purpose of your visit?'],
  intents: [
    { id: 'tourism', label: 'Tourism',
      keys: ['holiday', 'vacation', 'sightseeing', ...],
      set: { purpose: 'tourism' }, reply: 'Sightseeing. Alright.',
      next: 'duration' },
    ...
  ],
  fallback: { reply: 'Shorter answer...', suspicion: 1, keep: true },
  escape: 'duration'
}
```

- `label` becomes a clickable chip; `keys` are what free text is matched
  against, scored by the weight of the keywords that hit.
- `suspicion` accumulates across the interview and picks one of three endings:
  waved through, let in but flagged for a bag search, or sent to secondary.
- `keep: true` re-asks the same question. `escape` is the way out, so nobody
  can stonewall the same question forever — after two dodges he moves on.

Adding a question means adding one node and pointing a `next` at it.

## Files

| File | |
| --- | --- |
| `index.html` | the booth, drawn as inline SVG, plus the conversation panel |
| `css/styles.css` | palette, layout, and every ambient/keyframe animation |
| `js/officer.js` | the puppet: mouth shapes, blinking, gaze, the stamp |
| `js/voice.js` | speech out, microphone in, and the failure paths |
| `js/dialogue.js` | the script and the free-text matcher |
| `js/app.js` | turn-taking: speak, listen, answer, fall back |
| `build.mjs` | inlines it all into `dist/border-control.html` |
