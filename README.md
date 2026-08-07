# Border Control

An interactive customs officer. He asks the questions, you answer — with the
suggested replies or by typing whatever you like — and he decides whether you
get in. Static HTML, CSS and JavaScript: no build step, no dependencies.

Open `index.html` in a browser, or serve the folder:

```sh
npx http-server . -p 8080     # then open http://localhost:8080
```

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
  (open, wide, curve). While he talks, each character sets a rough viseme
  target — vowels open wide, `m`/`b`/`p` close it, punctuation shuts it — and
  the jaw eases toward that target, so the mouth is in sync with the text as it
  types out.
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
| `js/dialogue.js` | the script and the free-text matcher |
| `js/app.js` | wires answers to the puppet and to the panel |
