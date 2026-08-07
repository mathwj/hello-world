/* ─────────────────────────────────────────────────────────────
   app.js — wires the script to the puppet, the voice and the panel.

   Turn order with voice on:
     officer speaks aloud  →  mic opens  →  you answer  →  repeat.
   Typing and the chips keep working at every point, and every
   voice failure falls back to them rather than dead-ending.
   ───────────────────────────────────────────────────────────── */

(() => {

  const log      = document.getElementById('log');
  const chips    = document.getElementById('chips');
  const form     = document.getElementById('form');
  const input    = document.getElementById('input');
  const mic      = document.getElementById('mic');
  const toggle   = document.getElementById('voice-toggle');
  const composer = document.querySelector('.composer');
  const hudDot   = document.getElementById('hud-dot');
  const hudText  = document.getElementById('hud-text');
  const gate     = document.getElementById('gate');
  const gateNote = document.getElementById('gate-note');

  const state = { suspicion: 0, facts: {}, node: null, strikes: 0, over: false };
  const voice = { out: false, in: false };   // speaking / listening enabled

  let interimEl = null;
  let misses = 0;

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
    if (on) hud('SPEAKING', 'busy');
    else if (!state.over) { hud('OPEN'); if (!voice.in) input.focus(); }
  }

  function setListening(on) {
    mic.classList.toggle('listening', on);
    mic.setAttribute('aria-pressed', String(on));
    if (on) hud('LISTENING', 'live');
    else if (!state.over && !composer.classList.contains('locked')) hud('OPEN');
  }

  // One line: spoken aloud if we have a voice, typed out if not.
  // Either way the same callback draws the caption and the same
  // three Officer calls drive the mouth.
  async function say(line) {
    const el = bubble('officer');
    el.classList.add('caret');
    const render = s => { el.textContent = s; scroll(); };

    let spoken = false;
    if (voice.out) {
      spoken = await Voice.speak(line, render);
      // A browser that claims speech support but never actually starts
      // would stall on every line. Ask once, then stop asking.
      if (!spoken) {
        voice.out = false;
        syncVoiceUI();
        note('NO VOICE AVAILABLE HERE — CAPTIONS ONLY');
      }
    }
    if (!spoken) await Officer.speak(line, render);

    el.classList.remove('caret');
    await Officer.pause(spoken ? 120 : 260);
  }

  function renderChips(intents) {
    chips.replaceChildren();
    for (const intent of intents) {
      if (!intent.label) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = intent.label;
      b.addEventListener('click', () => answer(intent.label, intent));
      chips.appendChild(b);
    }
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

  /* ── the interview ───────────────────────────────────────── */

  async function enter(id, extraLines = []) {
    const node = Dialogue.NODES[id];
    state.node = node;
    state.strikes = 0;
    misses = 0;

    if (node.final) return finish();

    setBusy(true);
    if (node.mood) Officer.setMood(node.mood);

    for (const line of extraLines) await say(line);
    const asks = typeof node.ask === 'function' ? node.ask(state) : node.ask;
    for (const line of asks) await say(line);

    renderChips(node.intents || []);
    setBusy(false);
    openMic();
  }

  // Re-ask the current node without repeating the whole preamble.
  async function reask(extraLines) {
    const node = state.node;
    setBusy(true);
    for (const line of extraLines) await say(line);
    renderChips(node.intents || []);
    setBusy(false);
    openMic();
  }

  async function answer(shown, intent) {
    // No question on the table yet (the gate is still up, or he is
    // mid-sentence) — there is nothing to answer.
    if (!state.node || state.over || composer.classList.contains('locked')) return;

    Voice.stopListening();
    setListening(false);
    clearInterim();
    chips.replaceChildren();
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
    if (!voice.in || state.over || Voice.listening) return;

    setListening(true);
    const heard = await Voice.listen(showInterim);
    setListening(false);

    if (state.over || !voice.in) return clearInterim();

    if (heard.transcript) {
      clearInterim();
      return answer(heard.transcript, null);
    }

    switch (heard.error) {
      case 'aborted':
        // Ours, or the browser refusing to run recognition at all.
        if (heard.intentional) return clearInterim();
        return dropVoiceInput('MICROPHONE UNAVAILABLE — TYPE YOUR ANSWER INSTEAD');

      case 'not-allowed':
      case 'service-not-allowed':
      case 'unsupported':
      case 'start-failed':
        return dropVoiceInput('MICROPHONE UNAVAILABLE — TYPE YOUR ANSWER INSTEAD');

      case 'network':
        return dropVoiceInput('SPEECH SERVICE UNREACHABLE — TYPE YOUR ANSWER INSTEAD');

      default:                               // no-speech, and anything else
        clearInterim();
        if (++misses >= 2) {
          note('NO ANSWER HEARD — TYPE IT, OR TAP THE MICROPHONE');
          input.focus();
          return;
        }
        setBusy(true);
        await say(misses === 1 ? "I didn't catch that." : 'Speak up, please.');
        setBusy(false);
        return openMic();
    }
  }

  function dropVoiceInput(message) {
    voice.in = false;
    clearInterim();
    setListening(false);
    mic.hidden = true;
    note(message);
    input.focus();
  }

  mic.addEventListener('click', () => {
    if (Voice.listening) { Voice.stopListening(); setListening(false); clearInterim(); }
    else if (!composer.classList.contains('locked')) { voice.in = true; openMic(); }
  });

  toggle.addEventListener('click', () => {
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    setVoice(on, on && Voice.support.listen && voice.allowedIn);
    if (!on) { Voice.shutUp(); Voice.stopListening(); setListening(false); clearInterim(); }
    else openMic();
  });

  function syncVoiceUI() {
    const on = voice.out || voice.in;
    toggle.hidden = !(Voice.support.speak || Voice.support.listen);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'VOICE ON' : 'VOICE OFF';
    mic.hidden = !voice.in;
    if (!state.over) input.placeholder = voice.in ? '…or type it' : 'Say something…';
  }

  function setVoice(out, listen) {
    voice.out = out && Voice.support.speak;
    voice.in  = !!listen;
    syncVoiceUI();
  }

  /* ── ending ──────────────────────────────────────────────── */

  async function finish() {
    state.over = true;
    setBusy(true);
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
    input.disabled = true;
    input.placeholder = 'The counter is closed.';
    mic.disabled = true;
  }

  function restart() {
    Voice.shutUp();
    Voice.stopListening();
    state.suspicion = 0;
    state.facts = {};
    state.over = false;
    log.replaceChildren();
    chips.replaceChildren();
    clearInterim();
    input.disabled = false;
    input.placeholder = 'Say something…';
    mic.disabled = false;
    Officer.reset();
    enter(Dialogue.start);
  }

  /* ── input ───────────────────────────────────────────────── */

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    // If he is still talking, keep what you typed rather than eating it.
    if (!text || state.over || composer.classList.contains('locked')) return;
    input.value = '';
    answer(text, null);
  });

  input.addEventListener('focus', () => {
    if (Voice.listening) { Voice.stopListening(); setListening(false); clearInterim(); }
  });

  /* ── the gate ────────────────────────────────────────────── */

  async function begin(withVoice) {
    const start = document.getElementById('gate-start');
    if (withVoice) {
      start.disabled = true;
      start.textContent = 'One moment…';
      const got = await Voice.unlock();
      voice.allowedIn = got.listen;
      setVoice(got.speak, got.listen);
      if (!got.listen && got.reason) gateNote.textContent = got.reason;
      if (!got.listen && got.reason) await new Promise(r => setTimeout(r, 1800));
    } else {
      voice.allowedIn = false;
      setVoice(false, false);
    }

    gate.classList.add('open');
    setTimeout(() => { gate.hidden = true; }, 400);
    enter(Dialogue.start);
  }

  document.getElementById('gate-start').addEventListener('click', () => begin(true));
  document.getElementById('gate-silent').addEventListener('click', () => begin(false));

  if (!Voice.support.speak && !Voice.support.listen) {
    gateNote.textContent = 'This browser has no speech support — the interview will be typed.';
  } else if (location.protocol === 'file:') {
    gateNote.textContent = 'Opened from a file — if the microphone is refused, serve the page over http://localhost.';
  }

  // Nothing is accepted until the gate is cleared and a question is up.
  composer.classList.add('locked');
  Officer.init();
})();
