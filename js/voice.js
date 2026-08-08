/* ─────────────────────────────────────────────────────────────
   voice.js — the officer's voice, and your microphone.

   Output is speechSynthesis; the caption and the mouth are driven
   from the utterance itself (boundary events where the browser
   fires them, a learned chars-per-second estimate where it does
   not), so the lips match what you actually hear.

   Input is SpeechRecognition — Chrome, Edge and Safari only, and
   only on a secure origin. Where it is missing the caller falls back
   to pickable answers; there is no typing.
   ───────────────────────────────────────────────────────────── */

const Voice = (() => {

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const TTS = 'speechSynthesis' in window;

  const support = { speak: TTS, listen: !!SR };

  let voice = null;         // chosen SpeechSynthesisVoice
  let recogniser = null;    // live SpeechRecognition, if any
  let listening = false;
  let aborting = false;     // did *we* stop it, or did the browser?

  /* ── picking a voice ─────────────────────────────────────── */

  // Nothing is guaranteed here: the voice list differs per OS and
  // loads asynchronously. Prefer something deep and English, then
  // settle for whatever English exists.
  const PREFERRED = [
    'google uk english male', 'daniel', 'microsoft guy', 'microsoft david',
    'alex', 'fred', 'google us english', 'microsoft mark'
  ];

  function pickVoice() {
    if (voice) return voice;
    const all = speechSynthesis.getVoices();
    if (!all.length) return null;

    for (const want of PREFERRED) {
      const hit = all.find(v => v.name.toLowerCase().includes(want));
      if (hit) return (voice = hit);
    }
    return (voice = all.find(v => /^en/i.test(v.lang)) || all[0]);
  }

  if (TTS) {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener?.('voiceschanged', () => { voice = null; pickVoice(); });
  }

  /* ── unlocking (needs a user gesture) ────────────────────── */

  // Browsers want a click before they will speak, and the mic needs
  // one permission prompt. Do both from the same gesture.
  async function unlock() {
    const out = { speak: false, listen: false, reason: '' };

    if (TTS) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        speechSynthesis.speak(u);
        pickVoice();
        out.speak = true;
      } catch { /* stay silent, keep typing */ }
    }

    if (SR && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());   // we only wanted the permission
        out.listen = true;
      } catch (err) {
        out.reason = err && err.name === 'NotAllowedError'
          ? (location.protocol === 'file:'
              ? 'The microphone is blocked on file:// — serve the page over http://localhost to talk.'
              : 'Microphone permission was declined.')
          : 'No microphone available.';
      }
    } else {
      out.reason = SR
        ? 'This browser will not hand over a microphone here.'
        : 'This browser has no speech recognition — Chrome, Edge or Safari do.';
    }

    return out;
  }

  /* ── speaking ────────────────────────────────────────────── */

  // Resolves true once the line has been spoken, false if the
  // browser refused — the caller then falls back to typing it out.
  function speak(text, onProgress) {
    if (!TTS) return Promise.resolve(false);

    return new Promise(resolve => {
      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        clearInterval(timer);
        clearTimeout(watchdog);
        Officer.endSpeech();
        if (ok) onProgress(text);
        resolve(ok);
      };

      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 0.97;
      u.pitch = 0.82;      // he is not a cheerful man

      let started = 0;
      let cursor = 0;      // characters revealed so far
      let anchor = 0;      // last position the browser confirmed
      let anchorAt = 0;
      let cps = 14.5;      // chars per second, corrected as we go
      let timer = null;

      const tick = () => {
        const est = anchor + ((performance.now() - anchorAt) / 1000) * cps;
        cursor = Math.min(text.length, Math.max(cursor, est));
        const shown = Math.floor(cursor);
        onProgress(text.slice(0, shown));
        Officer.shape(text[Math.min(shown, text.length - 1)] || ' ');
      };

      u.onstart = () => {
        started = anchorAt = performance.now();
        Officer.beginSpeech();
        timer = setInterval(tick, 55);
      };

      // Chrome reports word boundaries; use them to re-anchor the
      // caption and to learn this voice's real speaking rate.
      u.onboundary = e => {
        if (typeof e.charIndex !== 'number') return;
        const elapsed = (performance.now() - started) / 1000;
        if (elapsed > 0.4 && e.charIndex > 6) cps = e.charIndex / elapsed;
        anchor = Math.max(anchor, e.charIndex);
        anchorAt = performance.now();
      };

      u.onend = () => finish(true);
      u.onerror = () => finish(false);

      // If onstart never arrives the utterance was swallowed.
      const watchdog = setTimeout(() => { if (!started) finish(false); }, 1400);

      try {
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch { finish(false); }
    });
  }

  function shutUp() {
    if (TTS) { try { speechSynthesis.cancel(); } catch { /* ignore */ } }
  }

  /* ── listening ───────────────────────────────────────────── */

  // Resolves { transcript } on speech, or { error } — 'no-speech',
  // 'not-allowed', 'aborted', 'network', 'unsupported'.
  // `onSpeech` fires the moment a voice is detected, before any words
  // are recognised, so the caller can stop prompting.
  function listen(onInterim, onSpeech) {
    if (!SR) return Promise.resolve({ error: 'unsupported' });

    return new Promise(resolve => {
      const rec = new SR();
      rec.lang = document.documentElement.lang || 'en-US';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      let final = '';
      let settled = false;
      aborting = false;
      const done = out => {
        if (settled) return;
        settled = true;
        clearTimeout(cap);
        listening = false;
        recogniser = null;
        resolve(out);
      };

      let announced = false;
      const speechStarted = () => {
        if (announced) return;
        announced = true;
        onSpeech?.();
      };
      rec.onspeechstart = speechStarted;
      rec.onsoundstart = speechStarted;

      rec.onresult = e => {
        speechStarted();          // some builds skip onspeechstart
        let interim = '';
        for (const r of e.results) {
          if (r.isFinal) final += r[0].transcript;
          else interim += r[0].transcript;
        }
        onInterim((final + interim).trim());
      };

      rec.onerror = e => done({ error: e.error || 'error', intentional: aborting });
      rec.onend = () => {
        const t = final.trim();
        done(t ? { transcript: t } : { error: 'no-speech' });
      };

      // Don't hold the mic open forever if the browser forgets to stop.
      const cap = setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } }, 15000);

      recogniser = rec;
      listening = true;
      try { rec.start(); }
      catch (err) { done({ error: 'start-failed' }); }
    });
  }

  function stopListening() {
    if (!recogniser) return;
    aborting = true;
    try { recogniser.abort(); } catch { /* ignore */ }
    recogniser = null;
    listening = false;
  }

  return { support, unlock, speak, shutUp, listen, stopListening,
           get listening() { return listening; } };
})();
