// The station's background music: a 1984 broadcast music library, four pieces by the same imagined artist on the
// same album, synthesized in the browser. A Berlin-school pluck sequence (A), an inspirational synth hymn (B), a
// smooth DX7 weather-segment fusion (C) and a late-night ambient tape loop (D). Each runs a 28-bar arc (intro, build,
// peak, breakdown, resolve) over a four-chord progression, through a shared delay and a low-pass like a set's coax.
// It's generated from the clock: every viewer hears the same sixteenth at the same moment. A channel plays one piece
// (the guide C; the airlines A, B, C, D in turn); a change of channel cuts to static until the new picture is in,
// then that channel's piece comes in where it is.
// Muzak.start() after a click (browsers need one before sound); Muzak.stop(); Muzak.tune(ch) when the channel
// changes and Muzak.tunedIn() when its picture is in; Muzak.chime() under the station ID; Muzak.now() says what's
// playing.
(() => {
  // The arc every piece runs, in bars: which voices play and how open the filter is.
  const ARC = [
    { name: 'intro', bars: 4, stems: { drums: 0, bass: 0.4, chords: 1, lead: 0, counter: 0 }, filter: 0.55 },
    { name: 'build', bars: 8, stems: { drums: 0.7, bass: 0.85, chords: 1, lead: 0.8, counter: 0.4 }, filter: 0.85 },
    { name: 'peak', bars: 8, stems: { drums: 1, bass: 1, chords: 1, lead: 1, counter: 1 }, filter: 1.15 },
    { name: 'breakdown', bars: 4, stems: { drums: 0, bass: 0.3, chords: 1, lead: 0.3, counter: 0.85 }, filter: 0.65 },
    { name: 'resolve', bars: 4, stems: { drums: 0.5, bass: 0.75, chords: 1, lead: 0.65, counter: 0.5 }, filter: 0.8 },
  ];
  const ARC_BARS = ARC.reduce((s, a) => s + a.bars, 0);

  // The four pieces: tempo, delay, filter, four chords (a bass root and four voices, in Hz) two bars each, the lead's
  // pattern (a voice of the chord per sixteenth, -1 a rest) and the counter-melody.
  const SCORES = {
    A: { name: 'Berlin Express', bpm: 114, delay: 0.394, feedback: 0.48, cutoff: 1450, style: 'berlin',
      chords: [[87.31, [174.61, 220.0, 261.63, 329.63]], [73.42, [146.83, 174.61, 220.0, 261.63]],
        [116.54, [174.61, 233.08, 293.66, 349.23]], [130.81, [196.0, 261.63, 349.23, 392.0]]],
      lead: [0, 2, 3, 1, 3, 2, 0, 1, 2, 3, 1, 2, 0, 3, 2, 1],
      counter: [659.25, 587.33, 523.25, 440.0, 523.25, 587.33, 659.25, 783.99] },
    B: { name: 'Olympic Horizon', bpm: 102, delay: 0.441, feedback: 0.42, cutoff: 1650, style: 'hymn',
      chords: [[65.41, [130.81, 196.0, 261.63, 329.63]], [65.41, [130.81, 174.61, 261.63, 349.23]],
        [61.74, [123.47, 196.0, 246.94, 392.0]], [65.41, [130.81, 196.0, 261.63, 329.63]]],
      lead: [0, 1, 2, 3, 2, 1, 0, 1, 0, 1, 2, 3, 2, 1, 2, 3],
      counter: [523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 523.25, 392.0] },
    C: { name: 'Local on the 8s', bpm: 92, delay: 0.489, feedback: 0.35, cutoff: 1300, style: 'fusion',
      chords: [[65.41, [164.81, 196.0, 246.94, 293.66]], [55.0, [130.81, 164.81, 196.0, 246.94]],
        [73.42, [146.83, 174.61, 220.0, 261.63]], [98.0, [174.61, 220.0, 246.94, 329.63]]],
      lead: [0, -1, 2, 3, -1, 1, 2, -1, 3, 2, 1, -1, 2, 0, -1, 1],
      counter: [587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88, 587.33] },
    D: { name: 'Night Terminal', bpm: 68, delay: 0.661, feedback: 0.56, cutoff: 1050, style: 'ambient',
      chords: [[51.91, [155.56, 207.65, 261.63, 311.13]], [43.65, [130.81, 174.61, 207.65, 261.63]],
        [69.3, [138.59, 174.61, 207.65, 261.63]], [77.78, [155.56, 207.65, 233.08, 311.13]]],
      lead: [0, -1, -1, 2, -1, -1, 3, -1, 1, -1, -1, 2, -1, -1, 0, -1],
      counter: [622.25, 523.25, 466.16, 415.3, 466.16, 523.25, 622.25, 830.61] },
  };
  // The guide is the weather-segment piece; the airline channels take the four in turn.
  const scoreFor = (ch) => (ch === '0' ? 'C' : 'ABCD'[(Math.max(1, +ch || 1) - 1) % 4]);

  const VOLUME = 0.28, AHEAD = 1.5; // seconds scheduled ahead (a background tab ticks once a second)
  let ctx = null, out = null, master = null, coax = null, delay = null, feedback = null, noise = null;
  let bed = null; // this channel's voices: its own gain into the coax and the delay, faded out on a change
  let score = SCORES.A, scoreId = 'A', timer = null, waiting = true, next = 0, t0 = 0, wall0 = 0, last = null;

  const stepSec = () => 60 / score.bpm / 4;
  // Where a step falls in the piece: its bar, the step in the bar, the arc's section and the chord.
  function state(n) {
    const bar = Math.floor(n / 16), arcBar = ((bar % ARC_BARS) + ARC_BARS) % ARC_BARS;
    let acc = 0, section = ARC[0];
    for (const s of ARC) { if (arcBar < acc + s.bars) { section = s; break; } acc += s.bars; }
    const [root, notes] = score.chords[((Math.floor(bar / 2) % 4) + 4) % 4];
    return { bar, s: ((n % 16) + 16) % 16, section, root, notes };
  }
  // A small hash for the pads' chorus drift, the same for every viewer.
  const drift = (n, i) => ((Math.sin(n * 12.9898 + i * 78.233) * 43758.5453) % 1) * 14 - 7;

  function setup(context = new (window.AudioContext || window.webkitAudioContext)()) {
    ctx = context;
    out = ctx.createGain(); out.connect(ctx.destination); // the chime and the static
    master = ctx.createGain(); master.gain.value = VOLUME; master.connect(out);
    coax = ctx.createBiquadFilter(); coax.type = 'lowpass'; coax.frequency.value = 3400; coax.connect(master);
    delay = ctx.createDelay(2); feedback = ctx.createGain();
    delay.connect(feedback); feedback.connect(delay); delay.connect(coax);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  // A fresh bed for the channel's piece, its delay set to the piece's.
  function newBed() {
    const g = ctx.createGain(), send = ctx.createGain();
    g.connect(coax); send.connect(delay);
    delay.delayTime.setTargetAtTime(score.delay, ctx.currentTime, 0.08);
    feedback.gain.setTargetAtTime(score.feedback, ctx.currentTime, 0.08);
    return { g, send };
  }

  // The voices.
  function pluck(f, t, dur, amp, type, cutoff, echo = false) {
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.012, t + 0.015); // a marimba's attack
    o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(cutoff, t);
    lp.frequency.exponentialRampToValueAtTime(240, t + dur);
    g.gain.setValueAtTime(0.0008, t);
    g.gain.linearRampToValueAtTime(amp, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(lp).connect(g).connect(bed.g);
    if (echo) g.connect(bed.send);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function pad(n, notes, t, dur, amp, cutoff) {
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.detune.value = drift(n, i);
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(cutoff * 0.6, t);
      lp.frequency.linearRampToValueAtTime(cutoff, t + dur * 0.5);
      lp.frequency.linearRampToValueAtTime(cutoff * 0.6, t + dur);
      g.gain.setValueAtTime(0.0008, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.8);
      g.gain.setValueAtTime(amp, t + dur - 0.9);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(lp).connect(g).connect(bed.g);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }
  function drum(t, amp, type, from, to, fall, len, attack = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + fall);
    if (attack) { g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(amp, t + attack); } else g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + len);
    o.connect(g).connect(bed.g);
    o.start(t); o.stop(t + len + 0.05);
  }
  const tympani = (t, amp) => drum(t, amp, 'sine', 98, 48, 0.35, 0.55, 0.02);
  const kick = (t, amp) => drum(t, amp, 'sine', 115, 42, 0.14, 0.22);
  const rimshot = (t, amp) => drum(t, amp, 'triangle', 420, 160, 0.04, 0.06);

  // One sixteenth of the piece, step n of the clock, at audio time t.
  function play(n, t) {
    const S = stepSec(), { bar, s, section, root, notes } = state(n), st = section.stems, cutoff = score.cutoff * section.filter;
    if (st.drums > 0) {
      if (score.style === 'hymn' && (s === 0 || s === 8)) tympani(t, 0.14 * st.drums);
      if (score.style === 'fusion') {
        if (s === 0 || s === 10) kick(t, 0.12 * st.drums);
        if (s === 4 || s === 12) rimshot(t, 0.06 * st.drums);
      }
    }
    if (st.bass > 0) {
      if (score.style === 'fusion') {
        if (s === 0 || s === 6 || s === 10) pluck(s === 6 ? root * 1.5 : root, t, 0.45, 0.18 * st.bass, 'triangle', 420);
      } else if (s === 0 || (score.style === 'hymn' && s === 8)) pluck(root, t, S * 7, 0.16 * st.bass, 'sine', 340);
    }
    if (st.chords > 0 && s === 0 && bar % 2 === 0) pad(bar, notes, t, S * 30, 0.055 * st.chords, cutoff * 0.75);
    if (st.lead > 0) {
      const v = score.lead[s];
      if (v !== -1 && notes[v]) {
        const octave = score.style === 'berlin' && s % 7 === 3 ? 2 : 1;
        pluck(notes[v] * octave, t, score.style === 'ambient' ? 1.4 : 0.36, 0.14 * st.lead, score.style === 'berlin' ? 'triangle' : 'sine', cutoff, true);
      }
    }
    if (st.counter > 0 && s % 4 === 0) {
      const f = score.counter[(((bar * 4 + s / 4) % score.counter.length) + score.counter.length) % score.counter.length];
      pluck(f, t, S * 3.6, 0.09 * st.counter, 'sine', cutoff * 1.1, true);
    }
    last = { n, bar, section: section.name };
  }

  // Schedule every step from the next one up to AHEAD seconds out. Step n starts at wall-clock time n · step: the
  // audio clock was lined up with the wall clock once, at start.
  const at = (n) => t0 + n * stepSec() - wall0;
  function tick() {
    if (waiting || !bed) return;
    while (at(next) < ctx.currentTime + AHEAD) {
      if (at(next) >= ctx.currentTime) play(next, at(next));
      next++;
    }
  }
  // Come in on the channel's piece where it is now: from the next step, nothing before this moment.
  function joinNow() {
    bed = newBed();
    next = Math.ceil((wall0 + ctx.currentTime + 0.03 - t0) / stepSec());
    tick();
  }
  let staticSrc = null;
  // Static: noise, a little band-limited, as long as the snow lasts.
  function staticOn() {
    if (staticSrc) return;
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise; src.loop = true; hp.type = 'highpass'; hp.frequency.value = 250; lp.type = 'lowpass'; lp.frequency.value = 6500;
    g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.03);
    src.connect(hp).connect(lp).connect(g).connect(out); src.start();
    staticSrc = { src, g };
  }
  function staticOff() {
    if (!staticSrc) return;
    const { src, g } = staticSrc; staticSrc = null;
    g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04); src.stop(ctx.currentTime + 0.3);
  }
  function choose(ch) { scoreId = scoreFor(String(ch)); score = SCORES[scoreId]; }

  window.Muzak = {
    start() {
      if (ctx) { ctx.resume(); return; }
      setup();
      t0 = ctx.currentTime; wall0 = Date.now() / 1000;
      waiting = false;
      joinNow();
      timer = setInterval(tick, 100);
    },
    stop() { clearInterval(timer); timer = null; if (ctx) ctx.close(); ctx = null; bed = null; staticSrc = null; },
    // The channel changes: the music cuts out (the steps already scheduled fade with their bed) and static plays
    // until the new picture is in (tunedIn).
    tune(ch) {
      choose(ch);
      if (!ctx) return;
      if (bed) {
        const old = bed;
        old.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03); old.send.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
        setTimeout(() => { old.g.disconnect(); old.send.disconnect(); }, (AHEAD + 1) * 1000);
      }
      bed = null; waiting = true;
      staticOn();
    },
    tunedIn() {
      if (!ctx) return;
      staticOff();
      waiting = false;
      joinNow();
    },
    // The station's chime under its ID: four rising bells, on top of the music.
    chime() {
      if (!ctx) return;
      const now = ctx.currentTime + 0.05;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const t = now + i * 0.14, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.14, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.9);
        o.connect(g).connect(out); o.start(t); o.stop(t + 0.95);
      });
    },
    playing: () => !!timer,
    // Whether the browser is holding the sound until the viewer's next key or click (after a channel change).
    held: () => !!ctx && ctx.state !== 'running',
    // The same music rendered offline, faster than real time, from wall-clock second `from` on (for listening tests).
    render(seconds, from = Date.now() / 1000, rate = 32000, ch = null) {
      if (ch !== null) choose(ch);
      setup(new OfflineAudioContext(2, Math.ceil(seconds * rate), rate));
      t0 = 0.05; wall0 = from; bed = newBed();
      const first = Math.ceil(from / stepSec());
      for (let n = first; at(n) < seconds; n++) play(n, at(n));
      const done = ctx.startRendering();
      ctx = null; bed = null;
      return done;
    },
    now: () => last && { piece: score.name, score: scoreId, bar: last.bar % ARC_BARS + 1, of: ARC_BARS, section: last.section },
  };
})();
