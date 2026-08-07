/* ─────────────────────────────────────────────────────────────
   dialogue.js — the script Officer Vance is working from.

   A node = one thing he asks. Each intent is a way you might
   answer it: chips are the shortcuts, `keys` catch free text.
   `suspicion` accumulates and decides how the interview ends.
   ───────────────────────────────────────────────────────────── */

const Dialogue = (() => {

  const NODES = {

    /* ── documents ─────────────────────────────────────────── */
    greet: {
      mood: 'stern',
      ask: ['Next. Step up to the line.', 'Passport and travel documents, please.'],
      intents: [
        { id: 'hand', label: 'Hand over your passport',
          keys: ['here you go', 'here', 'passport', 'sure', 'of course', 'okay', 'ok', 'yes', 'take it'],
          reply: 'Thank you.', next: 'purpose' },

        { id: 'hello', label: 'Good morning',
          keys: ['hello', 'hi', 'hey', 'morning', 'evening', 'afternoon'],
          reply: 'Morning. Documents.', keep: true },

        { id: 'missing', label: "I can't find it",
          keys: ["can't find", 'cant find', 'lost', 'forgot', "don't have", 'dont have', 'no passport'],
          reply: 'Then this becomes a much longer morning. Check your pockets.',
          suspicion: 2, keep: true }
      ],
      fallback: { reply: 'Passport first. Then we talk.', keep: true },
      escape: 'purpose'
    },

    /* ── purpose ───────────────────────────────────────────── */
    purpose: {
      mood: 'neutral',
      ask: ['Purpose of your visit?'],
      intents: [
        { id: 'tourism', label: 'Tourism',
          keys: ['tourism', 'tourist', 'holiday', 'vacation', 'sightseeing', 'travel', 'fun', 'leisure'],
          set: { purpose: 'tourism' }, reply: 'Sightseeing. Alright.', next: 'duration' },

        { id: 'business', label: 'Business',
          keys: ['business', 'work', 'conference', 'meeting', 'client', 'job'],
          set: { purpose: 'business' }, reply: 'Business.', next: 'business_probe' },

        { id: 'family', label: 'Visiting family',
          keys: ['family', 'friend', 'visiting', 'wedding', 'mother', 'father', 'brother', 'sister', 'partner'],
          set: { purpose: 'family' }, reply: 'Family. Nice this time of year.', next: 'duration' },

        { id: 'study', label: 'Studying',
          keys: ['study', 'student', 'school', 'university', 'exchange', 'course'],
          set: { purpose: 'study' }, reply: 'Studying. Noted.', next: 'duration' },

        { id: 'vague',
          keys: ['personal', 'private', 'secret', 'not sure', 'dunno', "don't know", 'none of your'],
          set: { purpose: 'unstated' },
          reply: "'Personal.' That's not a category I have a box for. Try again.",
          suspicion: 3, keep: true }
      ],
      fallback: { reply: 'Shorter answer. Business, tourism, or family?', suspicion: 1, keep: true },
      escape: 'duration'
    },

    business_probe: {
      mood: 'neutral',
      ask: ['Who are you meeting with?'],
      intents: [
        { id: 'named', label: 'A client, I have the address',
          keys: ['client', 'company', 'office', 'address', 'colleague', 'supplier', 'partner', 'team'],
          reply: 'Good. Keep the address handy.', next: 'duration' },

        { id: 'evasive', label: "I'd rather not say",
          keys: ['rather not', 'confidential', 'nda', "can't say", 'cant say', 'private', 'secret'],
          reply: 'Confidential. Of course it is.', suspicion: 3, next: 'duration' }
      ],
      fallback: { reply: 'A name will do.', next: 'duration' }
    },

    /* ── stay ──────────────────────────────────────────────── */
    duration: {
      mood: 'neutral',
      ask: ['How long are you staying?'],
      intents: [
        { id: 'short', label: 'About a week',
          keys: ['week', 'day', 'days', 'weekend', 'short', 'brief', 'few'],
          set: { duration: 'about a week' }, reply: 'A week. Fine.', next: 'stay' },

        { id: 'long', label: 'A few months',
          keys: ['month', 'months', 'year', 'long', 'while', 'season'],
          set: { duration: 'a few months' },
          reply: "That's a long holiday. Return ticket?", suspicion: 2, next: 'stay' },

        { id: 'open', label: "I haven't decided",
          keys: ["haven't decided", 'havent decided', 'not sure', 'open', 'one way', 'one-way', 'depends', 'indefinite'],
          set: { duration: 'undecided' },
          reply: 'One-way and undecided. I do love a mystery.', suspicion: 3, next: 'stay' }
      ],
      fallback: { reply: 'A number, please.', suspicion: 1, next: 'stay' }
    },

    stay: {
      mood: 'neutral',
      ask: ['And where will you be staying?'],
      intents: [
        { id: 'hotel', label: 'A hotel downtown',
          keys: ['hotel', 'hostel', 'airbnb', 'apartment', 'rental', 'booked', 'reservation'],
          set: { stay: 'a hotel' }, reply: 'Booked in advance. Refreshing.', next: 'luggage' },

        { id: 'friends', label: 'With friends',
          keys: ['friend', 'family', 'cousin', 'relatives', 'someone i know', 'my brother', 'my sister'],
          set: { stay: 'with friends' }, reply: 'With friends. Address on the form, then.', next: 'luggage' },

        { id: 'nowhere', label: "I'll figure it out",
          keys: ['figure it out', 'no idea', "don't know", 'dont know', 'nowhere', 'wherever', 'car', 'not sure'],
          set: { stay: 'undecided' },
          reply: 'No address. You are making this interesting.', suspicion: 3, next: 'luggage' }
      ],
      fallback: { reply: 'An address, or the name of a hotel.', suspicion: 1, next: 'luggage' }
    },

    /* ── bags ──────────────────────────────────────────────── */
    luggage: {
      mood: 'stern',
      ask: ['Did you pack your bags yourself?'],
      intents: [
        { id: 'self', label: 'Yes, myself',
          keys: ['yes', 'myself', 'i did', 'me', 'own'],
          reply: 'Good.', next: 'declare' },

        { id: 'other', label: 'Someone helped me',
          keys: ['helped', 'someone', 'my partner', 'my mother', 'wife', 'husband', 'roommate', 'no'],
          reply: 'Someone else touched your bags. Remember that answer.',
          suspicion: 3, next: 'declare' },

        { id: 'favour', label: "I'm carrying something for a friend",
          keys: ['carrying', 'favour', 'favor', 'package', 'parcel', 'for a friend', 'deliver'],
          reply: 'A parcel. For a friend. You cannot possibly be serious.',
          suspicion: 5, mood: 'suspicious', next: 'declare' }
      ],
      fallback: { reply: "I'll take that as a yes.", next: 'declare' }
    },

    /* ── declaration ───────────────────────────────────────── */
    declare: {
      mood: 'stern',
      ask: ['Anything to declare? Food, plants, animal products,',
            'currency above ten thousand.'],
      intents: [
        { id: 'nothing', label: 'Nothing to declare',
          keys: ['nothing', 'no', 'none', 'nope', 'clean', 'empty'],
          set: { declare: 'nothing' }, reply: 'Nothing at all.', next: 'verdict' },

        { id: 'food', label: 'Some food from home',
          keys: ['food', 'cheese', 'meat', 'sausage', 'fruit', 'honey', 'chocolate', 'snack', 'sandwich', 'plant', 'seeds'],
          set: { declare: 'food' }, reply: 'Food. Show me.', suspicion: 1, next: 'probe_food' },

        { id: 'cash', label: 'Cash, a fair amount',
          keys: ['cash', 'money', 'currency', 'euro', 'dollar', 'notes', 'gold'],
          set: { declare: 'currency' }, reply: 'Currency. How much, exactly?', suspicion: 1, next: 'probe_cash' },

        { id: 'gift', label: 'Just souvenirs',
          keys: ['gift', 'souvenir', 'present', 'shopping', 'perfume', 'watch'],
          set: { declare: 'souvenirs' }, reply: 'Souvenirs. Keep the receipts.', next: 'verdict' },

        { id: 'contraband', label: 'A live parrot',
          keys: ['parrot', 'drugs', 'gun', 'weapon', 'knife', 'bomb', 'snake', 'lizard', 'animal', 'ivory'],
          set: { declare: 'something alarming' },
          reply: 'Say that again slowly, and think about it first.',
          suspicion: 7, mood: 'suspicious', next: 'verdict' }
      ],
      fallback: { reply: "That's a yes or a no.", suspicion: 1, keep: true },
      escape: 'verdict'
    },

    probe_food: {
      mood: 'neutral',
      ask: ['Is it sealed, commercially packaged?'],
      intents: [
        { id: 'sealed', label: 'Sealed, from a shop',
          keys: ['sealed', 'shop', 'packaged', 'store', 'yes', 'factory', 'wrapped'],
          reply: 'Then it stays with you.', next: 'verdict' },
        { id: 'homemade', label: "It's homemade",
          keys: ['homemade', 'home', 'grandma', 'mother', 'no', 'open', 'fresh', 'raw'],
          reply: 'Homemade. That goes in the bin on your left.', suspicion: 2, next: 'verdict' }
      ],
      fallback: { reply: 'We will look at it either way.', suspicion: 1, next: 'verdict' }
    },

    probe_cash: {
      mood: 'stern',
      ask: ['A number, please.'],
      intents: [
        { id: 'under', label: 'Under ten thousand',
          keys: ['under', 'less', 'thousand', 'hundred', 'small', 'few', 'below'],
          reply: 'Under the limit. Nothing to file.', next: 'verdict' },
        { id: 'over', label: 'More than ten thousand',
          keys: ['over', 'more', 'above', 'lot', 'million', 'fifty', 'twenty', 'hundred thousand'],
          reply: 'Then you fill out a form. A long one.', suspicion: 3, next: 'verdict' },
        { id: 'coy', label: "I'd rather not say",
          keys: ['rather not', "won't say", 'wont say', 'private', 'none of', 'secret'],
          reply: 'Declining to count it is itself an answer.', suspicion: 4, next: 'verdict' }
      ],
      fallback: { reply: 'I will assume it is more than you should carry.', suspicion: 2, next: 'verdict' }
    },

    /* ── verdict ───────────────────────────────────────────── */
    verdict: { final: true }
  };

  /* ── free-text matching ──────────────────────────────────── */

  function hits(text, key) {
    if (key.length <= 3) {
      return new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text) ? key.length : 0;
    }
    return text.includes(key) ? key.length : 0;
  }

  // Best intent wins by total weight of matched keywords; ties go to
  // the intent declared first, which is why the safe answers lead.
  function match(node, text) {
    const t = ' ' + text.toLowerCase().trim() + ' ';
    let best = null, bestScore = 0;

    for (const intent of node.intents || []) {
      let score = 0;
      for (const key of intent.keys || []) score += hits(t, key);
      if (score > bestScore) { best = intent; bestScore = score; }
    }
    return best || Object.assign({ id: '_fallback', fallback: true }, node.fallback);
  }

  /* ── the ending ──────────────────────────────────────────── */

  function recap(facts) {
    const bits = [];
    if (facts.purpose)  bits.push(facts.purpose === 'unstated' ? 'purpose unstated' : facts.purpose);
    if (facts.duration) bits.push(facts.duration);
    if (facts.stay)     bits.push(facts.stay);
    if (facts.declare)  bits.push('declaring ' + facts.declare);
    return bits.join(', ');
  }

  function verdict(state) {
    const s = state.suspicion;
    const line = recap(state.facts);

    if (s <= 2) {
      return {
        approved: true, mood: 'friendly', label: 'ENTRY GRANTED',
        lines: [
          line ? `So: ${line}.` : 'So: nothing out of the ordinary.',
          'Everything checks out.',
          'Welcome. Enjoy your stay — and keep the passport dry.'
        ]
      };
    }
    if (s <= 6) {
      return {
        approved: true, mood: 'stern', label: 'ENTRY GRANTED — FLAGGED',
        lines: [
          line ? `So: ${line}.` : 'So: a great deal left unsaid.',
          'A few of your answers I did not care for.',
          "I'm letting you through. Your bags go through the scanner first.",
          'Welcome to the country. Behave.'
        ]
      };
    }
    return {
      approved: false, mood: 'suspicious', label: 'REFERRED TO SECONDARY',
      lines: [
        line ? `So: ${line}.` : 'So: nothing I can write down.',
        'No. I have heard enough.',
        'Take your documents and follow the red line to the room with no windows.',
        'Someone will be with you. Eventually.'
      ]
    };
  }

  return { NODES, match, verdict, start: 'greet' };
})();
