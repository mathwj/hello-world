# Border Control

An interactive customs officer. He asks the questions **out loud**, opens the
microphone, and waits for your answer. He decides whether you get in. Static
HTML, CSS and JavaScript, no dependencies.

```sh
npx http-server . -p 8080     # then open http://localhost:8080
```

Serve it rather than double-clicking it: browsers refuse microphone access on
`file://`, and without a microphone there is nothing to talk to.

`node build.mjs` writes `dist/border-control.html` — the same app inlined into
one self-contained file.

## Talking to him

There is no text box. He asks, the microphone opens, you answer out loud —
that is the whole interface.

The turn: **he speaks → the mic opens → you answer → he replies.** The mic is
only live while he is waiting for you, which the pulsing button and the
`LISTENING` sign in the booth both show; what it thinks it is hearing appears
as a dashed bubble before it commits.

**Hesitate and he prompts you.** After a few seconds of silence a cue appears —
`TRY SAYING “Here you go.”` — and you say that line back. Keep quiet and it
rotates through the other answers this question accepts. It is a prompt, not a
button: the way past it is to speak. Every cue is phrased to be said out loud
and is checked against the matcher, so the line he shows you is a line that
actually works.

Stay silent for four rounds and the mic parks itself rather than reopening
forever; tap it when you are ready.

Speech needs a click to start — browsers will not open a mic or a voice without
one — which is what the gate at the front is for. It also takes the single
microphone permission prompt and reports what it got.

- **His voice** is `speechSynthesis`. Where a browser has no voices installed
  he falls back to captions, and says so once.
- **Your voice** is `SpeechRecognition`: Chrome, Edge and Safari, on a secure
  origin. Firefox does not implement it.
- **If listening is impossible** — no support, permission refused, speech
  service unreachable — the cues stop being prompts and become answers you can
  click, with a note saying why. That is the only way to get through this
  without a microphone, and it is deliberately the fallback, not the interface.

He will not talk over you: the mic never opens until he has finished his line.

## How it looks

Painted flat colour on warm plaster: a cream room, a cyan uniform, thin warm
charcoal outlines, and a peaked cap. The officer is drawn tall and narrow —
small head, long neck, and a nose that hangs well past his silhouette — with
the booth pared back to a glass screen, a counter, and a window onto the apron.
A `feTurbulence` rect multiplied over the whole picture gives it paper grain,
and two blurred washes break up the flatness of the wall. The conversation
panel shares the palette so the page reads as one illustration.

Everything is drawn in the browser: one inline SVG, no images.

## What moves

Nothing here is a video or a sprite sheet — the officer is rigged and animated:

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
- **The stamp** — his right hand rests on the counter until the verdict, then
  hands off to a second arm holding the stamp: it swings *from the shoulder*,
  the counter jolts on impact, and the mark lands on the passport.

Everything respects `prefers-reduced-motion`: ambient animation stops and the
dialogue types out almost instantly.

## The conversation

`js/dialogue.js` holds the whole script as data. Each node is one question:

```js
purpose: {
  ask: ['Purpose of your visit?'],
  intents: [
    { id: 'tourism', label: 'Tourism',
      say: 'Tourism.',
      keys: ['holiday', 'vacation', 'sightseeing', ...],
      set: { purpose: 'tourism' }, reply: 'Sightseeing. Alright.',
      next: 'duration' },
    ...
  ],
  fallback: { reply: 'Shorter answer...', suspicion: 1, keep: true },
  escape: 'duration'
}
```

- `say` is the line the cue shows you — phrased to be spoken. `label` is the
  short form used when the answers have to be clickable. `keys` are what the
  transcript is matched against, scored by the weight of the keywords that hit.
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
| — | the artwork block near the top is the paint; the rigging block below it is the motion |
| `js/officer.js` | the puppet: mouth shapes, blinking, gaze, the stamp |
| `js/voice.js` | speech out, microphone in, and the failure paths |
| `js/dialogue.js` | the script and the free-text matcher |
| `js/app.js` | turn-taking: speak, listen, prompt, answer |
| `build.mjs` | inlines it all into `dist/border-control.html` |
