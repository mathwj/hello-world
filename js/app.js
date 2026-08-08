/* ─────────────────────────────────────────────────────────────
   app.js — wires the script to the puppet, the voice and the panel.

   The interview is spoken, both ways. There is no text box: he asks,
   the microphone opens, you answer out loud. Stay quiet long enough
   and a cue appears with a line to say — a prompt, not a button.

   The one exception is a browser that cannot listen at all. Then the
   cues turn into something you can click, because the alternative is
   a conversation nobody can finish.
   ───────────────────────────────────────────────────────────── */

(() => {

  const log      = document.getElementById('log');
  const chips    = document.getElementById('chips');
  const cue      = document.getElementById('cue');
  const cueLabel = document.getElementById('cue-label');
  const cueLine  = document.getElementById('cue-line');
  const mic      = document.getElementById('mic');
  const listenState = document.getElementById('listen-state');
  const composer = document.querySelector('.composer');
  const hudDot   = document.getElementById('hud-dot');
  const hudText  = document.getElementById('hud-text');
  const gate     = document.getElementById('gate');
  const gateNote = document.getElementById('gate-note');

  const HINT_WAIT  = 3400;   // silence he will tolerate before prompting
  const HINT_CYCLE = 5600;   // then he offers a different answer
  const GIVE_UP    = 4;      // silent rounds before the mic parks itself

  const state = { suspicion: 0, facts: {}, node: null, strikes: 0, over: false };
  const voice = { out: false, in: false };

  let interimEl = null;
  let misses = 0;
  let hintTimer = null, hintCycle = null, hintIndex = 0;

  /* ── panel plumbing ──────────────────────────────────────── */

  function scroll() { log.scrollTop = log.scrollHeight; }

  function bubble(kind, text = '') {
    const el = document.createElement('div');
    el.className = 'msg ' + kind;
    el.textContent = text;
    log.appendChild(el);
    scroll();
    return el;
  }

  function note(text, tone = '') { bubble('note ' + tone, text); }

  function hud(label, tone = '') {
    hudDot.className = 'hud-dot' + (tone ? ' ' + tone : '');
    hudText.textContent = 'BOOTH 4 · LANE B · ' + label;
  }

  function setBusy(on) {
    composer.classList.toggle('locked', on);
    if (on) { hud('SPEAKING', 'busy'); say_state('He is speaking'); }
    else if (!state.over) hud('OPEN');
  }

  function say_state(text) { listenState.textContent = text; }

  function setListening(on) {
    mic.classList.toggle('listening', on);
    mic.setAttribute('aria-pressed', String(on));
    if (on) { hud('LISTENING', 'live'); say_state('Listening — answer out loud'); }
    else if (!state.over && !composer.classList.contains('locked')) hud('OPEN');
  }

  // One line, spoken aloud if he has a voice, typed out as a caption if not.
  async function say(line) {
    const el = bubble('officer');
    el.classList.add('caret');
    const render = s => { el.textContent = s; scroll(); };

    let spoken = false;
    if (voice.out) {
      spoken = await Voice.speak(line, render);
      if (!spoken) {
        voice.out = false;
        note('NO VOICE ON THIS BROWSER — CAPTIONS ONLY');
      }
    }
    if (!spoken) await Officer.speak(line, render);

    el.classList.remove('caret');
    await Officer.pause(spoken ? 120 : 260);
  }

  function showInterim(text) {
    if (!interimEl) interimEl = bubble('you interim');
    interimEl.textContent = text;
    scroll();
  }

  function clearInterim() {
    interimEl?.remove();
    interimEl = null;
  }

  /* ── the cue ─────────────────────────────────────────────── */

  // What this question could be answered with, phrased to be said.
  function suggestions() {
    return (state.node?.intents || [])
      .filter(i => i.label)
      .map(i => i.say || i.label);
  }

  function showCue(i) {
    const lines = suggestions();
    if (!lines.length) return;
    hintIndex = i % lines.length;
    cueLine.textContent = '“' + lines[hintIndex] + '”';
    cue.hidden = false;
    cue.classList.remove('pop');
    void cue.offsetWidth;
    cue.classList.add('pop');
  }

  function hideCue() {
    cue.hidden = true;
    cue.classList.remove('pop');
  }

  // The clock belongs to the question, not to one recognition attempt:
  // the mic reopens every few seconds while you are silent, and
  // re-arming each time would reset the wait and freeze the cue on its
  // first suggestion forever.
  function armHint() {
    if (hintTimer || hintCycle) return;
    if (!suggestions().length) return;
    hintTimer = setTimeout(() => {
      showCue(hintIndex);
      hintCycle = setInterval(() => showCue(hintIndex + 1), HINT_CYCLE);
    }, HINT_WAIT);
  }

  function disarmHint() {
    clearTimeout(hintTimer);
    clearInterval(hintCycle);
    hintTimer = hintCycle = null;
  }

  /* ── the interview ───────────────────────────────────────── */

  async function enter(id, extraLines = []) {
    const node = Dialogue.NODES[id];
    state.node = node;
    state.strikes = 0;
    misses = 0;
    hintIndex = 0;

    if (node.final) return finish();

    setBusy(true);
    if (node.mood) Officer.setMood(node.mood);

    for (const line of extraLines) await say(line);
    const asks = typeof node.ask === 'function' ? node.ask(state) : node.ask;
    for (const line of asks) await say(line);

    setBusy(false);
    openMic();
  }

  // Re-ask without repeating the whole preamble.
  async function reask(extraLines) {
    misses = 0;              // a fresh question deserves fresh patience
    setBusy(true);
    for (const line of extraLines) await say(line);
    setBusy(false);
    openMic();
  }

  async function answer(shown, intent) {
    if (!state.node || state.over || composer.classList.contains('locked')) return;

    Voice.stopListening();
    disarmHint();
    hintIndex = 0;
    hideCue();
    chips.replaceChildren();
    setListening(false);
    clearInterim();
    bubble('you', shown);
    setBusy(true);

    const node = state.node;
    const picked = intent || Dialogue.match(node, shown);

    state.suspicion += picked.suspicion || 0;
    Object.assign(state.facts, picked.set || {});
    if (picked.mood) Officer.setMood(picked.mood);

    await Officer.pause(300);

    const lines = picked.reply ? [picked.reply] : [];

    // Nobody gets to stonewall the same question forever.
    if (picked.keep) {
      state.strikes++;
      if (state.strikes >= 2 && node.escape) {
        state.suspicion += 1;
        return enter(node.escape, lines.concat(["We'll come back to that."]));
      }
      return reask(lines);
    }

    return enter(picked.next || 'verdict', lines);
  }

  /* ── the microphone ──────────────────────────────────────── */

  async function openMic() {
    if (state.over) return;
    if (!voice.in) return offerClickableCues();
    if (Voice.listening) return;

    setListening(true);
    armHint();

    const heard = await Voice.listen(showInterim, () => {
      disarmHint();          // they started talking; stop nagging
      hideCue();
    });

    setListening(false);

    if (state.over || !voice.in) return clearInterim();

    if (heard.transcript) {
      clearInterim();
      hideCue();
      return answer(heard.transcript, null);
    }

    switch (heard.error) {
      case 'aborted':
        if (heard.intentional) return clearInterim();
        return dropVoiceInput('THE MICROPHONE WAS CUT OFF');

      case 'not-allowed':
      case 'service-not-allowed':
      case 'unsupported':
      case 'start-failed':
        return dropVoiceInput('MICROPHONE UNAVAILABLE');

      case 'network':
        return dropVoiceInput('SPEECH SERVICE UNREACHABLE');

      default:                                  // no-speech, mostly
        clearInterim();
        armHint();                              // if a false start killed it
        if (++misses === 1 || misses === 3) {
          setBusy(true);
          await say(misses === 1 ? "I didn't catch that." : 'Any time you like.');
          setBusy(false);
        }
        if (misses >= GIVE_UP) {                // stop reopening on a dead room
          disarmHint();
          showCue(hintIndex);
          say_state('Tap the microphone when you are ready');
          return;
        }
        if (!cue.hidden) showCue(hintIndex + 1);
        return openMic();
    }
  }

  // Only reached when this browser cannot listen at all. The cues stop
  // being prompts and become the way through.
  function offerClickableCues() {
    hideCue();
    chips.replaceChildren();
    const lines = state.node?.intents?.filter(i => i.label) || [];
    for (const intent of lines) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = intent.say || intent.label;
      b.addEventListener('click', () => answer(intent.say || intent.label, intent));
      chips.appendChild(b);
    }
    say_state('No microphone — pick an answer');
  }

  function dropVoiceInput(message) {
    voice.in = false;
    clearInterim();
    disarmHint();
    setListening(false);
    mic.classList.add('dead');
    note(message + ' — PICK AN ANSWER INSTEAD');
    offerClickableCues();
  }

  mic.addEventListener('click', () => {
    if (Voice.listening) {
      Voice.stopListening();
      disarmHint();
      setListening(false);
      clearInterim();
      say_state('Tap the microphone when you are ready');
    } else if (!composer.classList.contains('locked') && !state.over) {
      misses = 0;
      openMic();
    }
  });

  /* ── ending ──────────────────────────────────────────────── */

  async function finish() {
    state.over = true;
    setBusy(true);
    disarmHint();
    hideCue();
    chips.replaceChildren();
    Voice.stopListening();
    setListening(false);

    const result = Dialogue.verdict(state);
    Officer.setMood(result.mood);

    for (const line of result.lines) await say(line);

    Officer.lookAt('passport');
    await Officer.pause(320);
    await Officer.stamp(result.approved);

    note(result.label, result.approved ? 'pass' : 'fail');
    note(`flags raised · ${state.suspicion}`);
    hud(result.approved ? 'CLEARED' : 'HOLD', result.approved ? '' : 'closed');

    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'chip primary';
    again.textContent = 'Next traveller';
    again.addEventListener('click', restart);
    chips.appendChild(again);

    composer.classList.remove('locked');
    mic.disabled = true;
    say_state('The counter is closed');
  }

  function restart() {
    Voice.shutUp();
    Voice.stopListening();
    state.suspicion = 0;
    state.facts = {};
    state.over = false;
    misses = 0;
    log.replaceChildren();
    chips.replaceChildren();
    clearInterim();
    hideCue();
    mic.disabled = false;
    Officer.reset();
    enter(Dialogue.start);
  }

  /* ── the gate ────────────────────────────────────────────── */

  async function begin() {
    const start = document.getElementById('gate-start');
    start.disabled = true;
    start.textContent = 'One moment…';

    const got = await Voice.unlock();
    voice.out = got.speak;
    voice.in  = got.listen;
    mic.classList.toggle('dead', !got.listen);

    if (!got.listen && got.reason) {
      gateNote.textContent = got.reason + ' You can still pick your answers.';
      await new Promise(r => setTimeout(r, 2200));
    }

    gate.classList.add('open');
    setTimeout(() => { gate.hidden = true; }, 400);
    enter(Dialogue.start);
  }

  document.getElementById('gate-start').addEventListener('click', begin);

  if (!Voice.support.listen) {
    gateNote.textContent = 'This browser has no speech recognition — Chrome, Edge or Safari do.';
  } else if (location.protocol === 'file:') {
    gateNote.textContent = 'Opened from a file — the microphone needs the page served over http://localhost.';
  }

  composer.classList.add('locked');
  Officer.init();
})();
