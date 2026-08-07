/* ─────────────────────────────────────────────────────────────
   app.js — wires the script to the puppet and to the panel.
   ───────────────────────────────────────────────────────────── */

(() => {

  const log     = document.getElementById('log');
  const chips   = document.getElementById('chips');
  const form    = document.getElementById('form');
  const input   = document.getElementById('input');
  const composer = document.querySelector('.composer');
  const hudDot  = document.getElementById('hud-dot');
  const hudText = document.getElementById('hud-text');

  const state = { suspicion: 0, facts: {}, node: null, strikes: 0, over: false };

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

  function note(text, tone = '') {
    bubble('note ' + tone, text);
  }

  function setBusy(on) {
    composer.classList.toggle('locked', on);
    hudDot.className = 'hud-dot' + (on ? ' busy' : '');
    hudText.textContent = on ? 'BOOTH 4 · LANE B · SPEAKING' : 'BOOTH 4 · LANE B · OPEN';
    if (!on && !state.over) input.focus();
  }

  // One line, typed out, with the mouth moving in step.
  async function say(line) {
    const el = bubble('officer');
    el.classList.add('caret');
    await Officer.speak(line, s => { el.textContent = s; scroll(); });
    el.classList.remove('caret');
    await Officer.pause(260);
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

  /* ── the interview ───────────────────────────────────────── */

  async function enter(id, extraLines = []) {
    const node = Dialogue.NODES[id];
    state.node = node;
    state.strikes = 0;

    if (node.final) return finish();

    setBusy(true);
    if (node.mood) Officer.setMood(node.mood);

    for (const line of extraLines) await say(line);
    const asks = typeof node.ask === 'function' ? node.ask(state) : node.ask;
    for (const line of asks) await say(line);

    renderChips(node.intents || []);
    setBusy(false);
  }

  // Re-ask the current node without repeating the whole preamble.
  async function reask(extraLines) {
    const node = state.node;
    setBusy(true);
    for (const line of extraLines) await say(line);
    renderChips(node.intents || []);
    setBusy(false);
  }

  async function answer(shown, intent) {
    if (state.over || composer.classList.contains('locked')) return;

    chips.replaceChildren();
    bubble('you', shown);
    setBusy(true);

    const node = state.node;
    const picked = intent || Dialogue.match(node, shown);

    state.suspicion += picked.suspicion || 0;
    Object.assign(state.facts, picked.set || {});
    if (picked.mood) Officer.setMood(picked.mood);

    await Officer.pause(340);

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

  /* ── ending ──────────────────────────────────────────────── */

  async function finish() {
    state.over = true;
    setBusy(true);
    chips.replaceChildren();

    const result = Dialogue.verdict(state);
    Officer.setMood(result.mood);

    for (const line of result.lines) await say(line);

    Officer.lookAt('passport');
    await Officer.pause(320);
    await Officer.stamp(result.approved);

    note(result.label, result.approved ? 'pass' : 'fail');
    note(`flags raised · ${state.suspicion}`);

    hudDot.className = 'hud-dot' + (result.approved ? '' : ' closed');
    hudText.textContent = result.approved ? 'BOOTH 4 · LANE B · CLEARED' : 'BOOTH 4 · LANE B · HOLD';

    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'chip primary';
    again.textContent = 'Next traveller';
    again.addEventListener('click', restart);
    chips.appendChild(again);

    composer.classList.remove('locked');
    input.disabled = true;
    input.placeholder = 'The counter is closed.';
  }

  function restart() {
    state.suspicion = 0;
    state.facts = {};
    state.over = false;
    log.replaceChildren();
    chips.replaceChildren();
    input.disabled = false;
    input.placeholder = 'Say something…';
    Officer.reset();
    enter(Dialogue.start);
  }

  /* ── input ───────────────────────────────────────────────── */

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || state.over) return;
    input.value = '';
    answer(text, null);
  });

  Officer.init();
  enter(Dialogue.start);
})();
