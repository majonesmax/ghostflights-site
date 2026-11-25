// The station's background music: new wave meets muzak, synthesized in the browser. A soft drum machine, a sequenced
// synth bass, chorused string pads, chord stabs, an arpeggiated bell and now and then a lead with a dotted echo, over
// pop progressions. It's generated from the clock, bar by bar from a seed, so it never loops and every viewer hears
// the same bar at the same moment. Each channel has its own flavor of it (tempo, keys, lead, bass, textures); a
// change of channel cuts to static until the new picture is in, then that channel's music comes in where it is.
// Muzak.start() after a click (browsers need one before sound); Muzak.stop(); Muzak.tune(ch) when the channel
// changes and Muzak.tunedIn() when its picture is in; Muzak.now() says what's playing.
(() => {
  // Each channel's music: its tempo, where in the run of keys it is, its seed, its lead's wave, its bass pattern (in
  // semitones over the root, eighths), its bell's brightness and the textures its sections take turns with. The guide
  // (0) is the gentle one.
  const FLAVORS = {
    0: { bpm: 96, keyShift: 2, seed: 0, lead: 'triangle', bass: [0, 7, 12, 7, 0, 7, 12, 7], bell: 2.0, textures: ['arp', 'arp', 'lead'] },
    1: { bpm: 112, keyShift: 0, seed: 101, lead: 'square', bass: [0, 0, 12, 0, 0, 12, 0, 7], bell: 3.5, textures: ['arp', 'lead', 'stabs'] },
    2: { bpm: 104, keyShift: 3, seed: 202, lead: 'sawtooth', bass: [0, 12, 0, 12, 0, 12, 0, 12], bell: 3.0, textures: ['lead', 'stabs', 'stabs'] },
    3: { bpm: 118, keyShift: 1, seed: 303, lead: 'square', bass: [0, 0, 7, 0, 12, 0, 7, 10], bell: 4.0, textures: ['arp', 'arp', 'stabs'] },
    4: { bpm: 100, keyShift: 4, seed: 404, lead: 'triangle', bass: [0, 0, 0, 12, 0, 0, 7, 12], bell: 2.5, textures: ['lead', 'lead', 'arp'] },
    5: { bpm: 120, keyShift: 5, seed: 505, lead: 'sawtooth', bass: [0, 12, 7, 12, 0, 12, 7, 5], bell: 3.5, textures: ['stabs', 'arp', 'lead'] },
    6: { bpm: 108, keyShift: 3, seed: 606, lead: 'square', bass: [0, 7, 0, 12, 0, 7, 10, 12], bell: 3.0, textures: ['arp', 'stabs', 'lead'] },
    7: { bpm: 116, keyShift: 1, seed: 707, lead: 'sawtooth', bass: [0, 0, 12, 0, 7, 0, 12, 10], bell: 3.5, textures: ['stabs', 'lead', 'arp'] },
    8: { bpm: 102, keyShift: 4, seed: 808, lead: 'triangle', bass: [0, 12, 7, 12, 0, 12, 7, 12], bell: 2.5, textures: ['arp', 'lead', 'lead'] },
    9: { bpm: 110, keyShift: 2, seed: 909, lead: 'square', bass: [0, 0, 7, 12, 0, 0, 7, 5], bell: 3.0, textures: ['lead', 'arp', 'stabs'] },
    10: { bpm: 122, keyShift: 5, seed: 1010, lead: 'square', bass: [0, 12, 0, 7, 0, 12, 0, 10], bell: 4.0, textures: ['stabs', 'arp', 'arp'] },
    11: { bpm: 98, keyShift: 3, seed: 1111, lead: 'triangle', bass: [0, 7, 12, 7, 0, 7, 10, 7], bell: 2.5, textures: ['arp', 'lead', 'arp'] },
    12: { bpm: 124, keyShift: 0, seed: 1212, lead: 'sawtooth', bass: [0, 0, 12, 0, 0, 12, 7, 12], bell: 4.0, textures: ['stabs', 'stabs', 'lead'] },
    13: { bpm: 114, keyShift: 4, seed: 1313, lead: 'square', bass: [0, 12, 7, 0, 0, 12, 7, 10], bell: 3.0, textures: ['lead', 'arp', 'stabs'] },
    14: { bpm: 106, keyShift: 2, seed: 1414, lead: 'triangle', bass: [0, 0, 7, 12, 0, 0, 5, 7], bell: 3.5, textures: ['arp', 'stabs', 'lead'] },
  };
  let F = FLAVORS[1], BEAT = 60 / F.bpm, BAR = BEAT * 4;
  function flavor(ch) { F = FLAVORS[ch] || FLAVORS[1]; BEAT = 60 / F.bpm; BAR = BEAT * 4; }
  const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const QUAL = {
    maj: { name: '', tones: [0, 4, 7] }, add9: { name: 'add9', tones: [0, 4, 7, 14] }, maj7: { name: 'maj7', tones: [0, 4, 7, 11] },
    min: { name: 'm', tones: [0, 3, 7] }, m7: { name: 'm7', tones: [0, 3, 7, 10] }, sus2: { name: 'sus2', tones: [0, 2, 7] },
  };
  // Four-bar progressions, a chord a bar, as [degree in semitones from the key, quality].
  const PROGS = [
    [[0, 'add9'], [7, 'maj'], [9, 'm7'], [5, 'maj7']], // I V vi IV
    [[9, 'm7'], [5, 'maj7'], [0, 'add9'], [7, 'sus2']], // vi IV I V
    [[0, 'maj7'], [4, 'm7'], [5, 'maj7'], [7, 'maj']], // I iii IV V
    [[5, 'maj7'], [7, 'maj'], [4, 'm7'], [9, 'm7']], // IV V iii vi
    [[9, 'min'], [5, 'maj'], [0, 'maj'], [7, 'sus2']], // vi IV I V, the darker way round
    [[2, 'm7'], [7, 'sus2'], [0, 'add9'], [0, 'maj7']], // ii V I
  ];
  const KEYS = [9, 4, 0, 7, 2, 5]; // A, E, C, G, D, F: a new key every 32 bars
  const SCALE = [0, 2, 4, 5, 7, 9, 11];

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

  // What bar n plays: its key, chord, the section's texture and the seed for its details. Sections are eight bars;
  // every fourth one is a breakdown (no drums, pads and bells), and the textures in between take turns.
  function barAt(n) {
    const section = Math.floor(n / 8);
    const key = KEYS[(Math.floor(n / 32) + F.keyShift) % KEYS.length];
    const r = rng(section * 7919 + 13 + F.seed);
    const half = Math.floor((n % 8) / 4);
    const prog = PROGS[Math.floor(r() * PROGS.length + half * 2) % PROGS.length];
    const [deg, q] = prog[n % 4];
    const root = (key + deg) % 12;
    const texture = section % 4 === 3 ? 'breakdown' : F.textures[Math.floor(r() * F.textures.length)];
    return { n, key, root, q: QUAL[q], name: `${NAMES[root]}${QUAL[q].name}`, texture, fill: n % 8 === 7, r: rng(n * 104729 + 7 + F.seed) };
  }

  let ctx = null, timer = null, out = null, noise = null, buses = null, t0 = 0, wall0 = 0, nextBar = 0, last = null;
  // The channel's own mix (faded out when the channel changes), whether it's waiting for the picture, nothing earlier
  // than this plays (when a channel comes in mid-bar), and the static between channels.
  let bed = null, waiting = false, cutoff = 0, staticSrc = null;
  let padVoicing = [57, 60, 64, 69], leadNote = 76;

  function setup(given) {
    ctx = given || new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01;
    const top = ctx.createBiquadFilter(); top.type = 'lowpass'; top.frequency.value = 11000;
    out = ctx.createGain(); out.gain.value = 1.0;
    out.connect(top).connect(comp).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }

  const lfo = (hz, depth, param) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = hz; g.gain.value = depth; o.connect(g).connect(param); o.start();
  };
  function impulse(seconds, shape) {
    const len = Math.floor(ctx.sampleRate * seconds), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * shape(i / len); }
    return ir;
  }
  // The buses: a hall for the pads and bells, the gated room for the snare, a dotted-eighth echo, a chorus for pads.
  function makeBuses(dest) {
    const hall = ctx.createConvolver(); hall.buffer = impulse(2.6, (x) => (1 - x) ** 3);
    const hallOut = ctx.createGain(); hallOut.gain.value = 0.28; hall.connect(hallOut).connect(dest);
    const gate = ctx.createConvolver(); gate.buffer = impulse(0.32, (x) => (x < 0.85 ? 0.9 - 0.3 * x : 0)); // the 80s gated snare
    const gateOut = ctx.createGain(); gateOut.gain.value = 0.5; gate.connect(gateOut).connect(dest);
    const echo = ctx.createDelay(2), fb = ctx.createGain(), tone = ctx.createBiquadFilter(), echoOut = ctx.createGain();
    echo.delayTime.value = BEAT * 0.75; fb.gain.value = 0.38; tone.type = 'lowpass'; tone.frequency.value = 3200; echoOut.gain.value = 0.3;
    echo.connect(tone).connect(fb).connect(echo); tone.connect(echoOut).connect(dest);
    const chorusIn = ctx.createGain(), pan = ctx.createStereoPanner(), cd = ctx.createDelay(0.05), cg = ctx.createGain();
    cd.delayTime.value = 0.012; lfo(0.6, 0.004, cd.delayTime); lfo(0.25, 0.5, pan.pan); cg.gain.value = 0.6;
    chorusIn.connect(pan); chorusIn.connect(cd).connect(cg).connect(pan); pan.connect(dest);
    const send = (dest, amounts) => { const g = ctx.createGain(); g.connect(dest); for (const [bus, a] of amounts) { const s = ctx.createGain(); s.gain.value = a; g.connect(s).connect(bus); } return g; };
    return {
      drums: send(dest, [[hall, 0.05]]), snare: send(dest, [[gate, 0.9]]), bass: send(dest, []),
      pad: send(chorusIn, [[hall, 0.5]]), stab: send(chorusIn, [[hall, 0.25], [echo, 0.2]]),
      bell: send(dest, [[hall, 0.4], [echo, 0.45]]), lead: send(dest, [[hall, 0.3], [echo, 0.55]]),
    };
  }

  function env(g, t, peak, hold, decay, end, release, attack = 0.005) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.setTargetAtTime(hold, t + attack + 0.002, decay);
    g.gain.setTargetAtTime(0.0001, end, release);
  }

  // A sequenced bass: a sawtooth and a sine an octave down, through a resonant filter that snaps shut on each note.
  function bass(t, m, d, v) {
    if (t < cutoff) return;
    const f = mtof(m), o = ctx.createOscillator(), sub = ctx.createOscillator(), sg = ctx.createGain(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; sub.frequency.value = f / 2; sg.gain.value = 0.6;
    lp.type = 'lowpass'; lp.Q.value = 7;
    lp.frequency.setValueAtTime(300 + 1500 * v, t); lp.frequency.setTargetAtTime(260, t, 0.07);
    env(g, t, 0.22 * v, 0.14 * v, 0.2, t + d, 0.04);
    o.connect(lp); sub.connect(sg).connect(lp); lp.connect(g).connect(buses.bass);
    for (const x of [o, sub]) { x.start(t); x.stop(t + d + 0.3); }
  }
  // String pads: two detuned saws a voice, a slow filter, through the chorus.
  function pad(t, ms, d, level = 1) {
    if (t < cutoff) { d -= cutoff - t; t = cutoff; if (d < 0.2) return; }
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.Q.value = 0.4;
    lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(2000, t + d * 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.016 * level, t + 0.35); g.gain.setTargetAtTime(0.0001, t + d, 0.25);
    lp.connect(g).connect(buses.pad);
    for (const m of ms) for (const cents of [-11, 9]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = cents;
      o.connect(lp); o.start(t); o.stop(t + d + 1.5);
    }
  }
  // A chord stab: bright saws whose filter falls fast.
  function stab(t, ms, v) {
    if (t < cutoff) return;
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(4200, t); lp.frequency.setTargetAtTime(700, t, 0.06);
    env(g, t, 0.03 * v, 0.008 * v, 0.08, t + 0.18, 0.06, 0.003);
    lp.connect(g).connect(buses.stab);
    for (const m of ms) for (const cents of [-6, 6]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = cents;
      o.connect(lp); o.start(t); o.stop(t + 0.5);
    }
  }
  // A bell: two-operator FM, the modulator at 3.5 times the pitch, its depth dying away (a DX7's glassy tine).
  function bell(dest, t, m, d, v) {
    if (t < cutoff) return;
    const f = mtof(m), car = ctx.createOscillator(), mod = ctx.createOscillator(), depth = ctx.createGain(), g = ctx.createGain();
    car.frequency.value = f; mod.frequency.value = f * F.bell;
    depth.gain.setValueAtTime(f * 2.2 * v, t); depth.gain.setTargetAtTime(f * 0.15, t, 0.18);
    mod.connect(depth).connect(car.frequency);
    env(g, t, 0.05 * v, 0.0001, 0.45, t + d, 0.2, 0.002);
    car.connect(g).connect(dest);
    for (const o of [car, mod]) { o.start(t); o.stop(t + d + 1.5); }
  }
  // The lead: a square wave, softened, gliding up or down from the note before, vibrato coming in late.
  function lead(t, m, from, d, v) {
    if (t < cutoff) return;
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = F.lead;
    o.frequency.setValueAtTime(mtof(from), t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.06);
    const vib = ctx.createOscillator(), vg = ctx.createGain();
    vib.frequency.value = 5.5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(12, t + Math.min(d, 0.5));
    vib.connect(vg).connect(o.detune);
    lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 1;
    env(g, t, 0.035 * v, 0.028 * v, 0.2, t + d, 0.07, 0.015);
    o.connect(lp).connect(g).connect(buses.lead);
    for (const x of [o, vib]) { x.start(t); x.stop(t + d + 0.4); }
  }

  // The drum machine, kept low as muzak keeps it.
  function kick(t, v) {
    if (t < cutoff) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.11);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.42 * v, t + 0.004); g.gain.setTargetAtTime(0.0001, t + 0.01, 0.09);
    o.connect(g).connect(buses.drums); o.start(t); o.stop(t + 0.5);
  }
  function hiss(dest, t, type, freq, q, gain, len, attack = 0.001) {
    if (t < cutoff) return;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.setTargetAtTime(0.0001, t + attack, len / 3);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(t + len + 0.1);
  }
  function snare(t, v) {
    if (t < cutoff) return;
    hiss(buses.snare, t, 'bandpass', 1900, 0.8, 0.14 * v, 0.14);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(170, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1 * v, t + 0.002); g.gain.setTargetAtTime(0.0001, t + 0.004, 0.03);
    o.connect(g).connect(buses.snare); o.start(t); o.stop(t + 0.2);
    // A clap layered on: three quick bursts.
    for (const k of [0, 0.011, 0.022]) hiss(buses.snare, t + k, 'bandpass', 1300, 1.2, 0.05 * v, 0.03);
  }
  const hat = (t, v, open) => hiss(buses.drums, t, 'highpass', 8000, 0.7, (open ? 0.03 : 0.022) * v, open ? 0.22 : 0.035);

  // The voicing nearest the last one: each tone in the octave closest to where the hand already is.
  function voice(b, around) {
    const center = around.reduce((s, m) => s + m, 0) / around.length;
    return b.q.tones.map((iv) => {
      const pc = (b.root + iv) % 12;
      let m = 48 + pc;
      while (m + 12 <= center + 6) m += 12;
      return Math.abs(m + 12 - center) < Math.abs(m - center) ? m + 12 : m;
    }).sort((a, c) => a - c);
  }

  function play(b, t) {
    if (!buses) { bed = ctx.createGain(); bed.connect(out); buses = makeBuses(bed); }
    const r = b.r, S = BEAT / 4; // a sixteenth
    const touch = (v) => v * (0.85 + 0.3 * r());
    const down = b.texture === 'breakdown';
    padVoicing = voice(b, padVoicing);
    pad(t, padVoicing, BAR, down ? 1.4 : 1);

    // The bass: eighths, the root with octave jumps (the new wave pulse); held long notes in a breakdown.
    const root = 33 + ((b.root + 3) % 12); // between A1 and G#2
    if (down) bass(t, root, BAR * 0.95, 0.5);
    else {
      F.bass.forEach((s, i) => bass(t + i * BEAT / 2, root + s, BEAT / 2 * 0.8, touch(i % 2 ? 0.7 : 1)));
    }

    if (!down) {
      // Drums: kick on one and three (and sometimes the and of three), the gated snare and clap on two and four,
      // closed hats on the eighths with a sixteenth now and then, an open hat into the next bar; a fill to end a section.
      kick(t, 1); kick(t + 2 * BEAT, 0.9);
      if (r() < 0.35) kick(t + 2.5 * BEAT, 0.6);
      snare(t + BEAT, 1); snare(t + 3 * BEAT, 1);
      for (let i = 0; i < 8; i++) hat(t + i * BEAT / 2, i % 2 ? 0.7 : 1, false);
      for (let i = 0; i < 16; i++) if (i % 2 && r() < 0.25) hat(t + i * S, 0.45, false);
      if (r() < 0.5) hat(t + 3.5 * BEAT, 1, true);
      if (b.fill) for (const k of [13, 14, 15]) snare(t + k * S, 0.45 + k * 0.03);
    }

    const chord = padVoicing.map((m) => m + 12);
    if (b.texture === 'stabs') {
      // Chord stabs on the offbeats, the and of two and of four.
      for (const at of [1.5, 3.5]) stab(t + at * BEAT, chord.slice(0, 3), touch(1));
      if (r() < 0.4) stab(t + 2.75 * BEAT, chord.slice(0, 3), 0.6);
    }
    if (b.texture === 'arp' || down) {
      // The bell, arpeggiating the chord in sixteenths (eighths in a breakdown), up and back down.
      const tones = chord.concat(chord[0] + 12);
      const order = tones.concat(tones.slice(1, -1).reverse());
      const step = down ? BEAT / 2 : S;
      for (let i = 0; i * step < BAR - 0.01; i++) bell(buses.bell, t + i * step, order[i % order.length], step * 1.5, touch(down ? 0.8 : 0.55));
    }
    if (b.texture === 'lead' && r() < 0.85) {
      // The lead in phrases with room between: chord tones on the beat, the scale between, mostly steps.
      const shapes = [[0, 1, 1.5, 2, 3], [0.5, 1, 2, 2.5], [0, 1.5, 2, 3, 3.5], [1, 1.5, 2.5, 3]];
      const shape = shapes[Math.floor(r() * shapes.length)];
      const chordPcs = b.q.tones.map((iv) => (b.root + iv) % 12);
      const scalePcs = SCALE.map((s) => (b.key + s) % 12);
      shape.forEach((beat, i) => {
        const pcs = beat % 1 === 0 ? chordPcs : scalePcs;
        const cands = [];
        for (let m = 69; m <= 84; m++) if (pcs.includes(m % 12)) cands.push(m);
        cands.sort((a, c) => Math.abs(a - leadNote) - Math.abs(c - leadNote));
        const from = leadNote;
        leadNote = cands[Math.min(cands.length - 1, Math.floor(r() * 3))];
        const len = (shape[i + 1] ?? 4) - beat;
        lead(t + beat * BEAT, leadNote, from, Math.min(len, 1.5) * BEAT * 0.9, touch(1));
      });
    }
  }

  function tick() {
    if (waiting) return;
    while (t0 + nextBar * BAR - wall0 < ctx.currentTime + 0.6) {
      const at = t0 + nextBar * BAR - wall0;
      if (at + BAR > ctx.currentTime) { last = barAt(nextBar); play(last, at); } // a bar already begun plays from the cutoff
      nextBar++;
    }
  }
  // Come in on the channel's music where it is now: from this bar, nothing before this moment.
  function joinNow() {
    cutoff = ctx.currentTime + 0.05;
    nextBar = Math.floor((wall0 + ctx.currentTime - t0) / BAR);
    tick();
  }
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

  window.Muzak = {
    start() {
      if (ctx) { ctx.resume(); return; }
      setup();
      // Bar n starts at wall-clock time n * BAR: the audio clock is lined up with the wall clock once, here.
      t0 = ctx.currentTime; wall0 = Date.now() / 1000;
      waiting = false;
      joinNow();
      timer = setInterval(tick, 100);
    },
    stop() { clearInterval(timer); timer = null; if (ctx) ctx.close(); ctx = null; buses = null; bed = null; staticSrc = null; },
    // The channel changes: the music cuts out and static plays until the new picture is in (tunedIn).
    tune(ch) {
      flavor(ch);
      if (!ctx) return;
      if (bed) { const old = bed; old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03); setTimeout(() => old.disconnect(), 1500); }
      bed = null; buses = null; waiting = true;
      staticOn();
    },
    tunedIn() {
      if (!ctx) return;
      staticOff();
      waiting = false;
      joinNow();
    },
    // The station's chime under its ID: a rising bell arpeggio, our own (not a network's three notes).
    chime() {
      if (!ctx || !buses) return;
      const at = ctx.currentTime + 0.05;
      [[69, 0], [73, 0.24], [76, 0.48], [81, 0.72], [85, 0.72]].forEach(([m, d]) => bell(buses.bell, at + d, m, 1.8, 1));
    },
    playing: () => !!timer,
    // Whether the browser is holding the sound until the viewer's next key or click (after a channel change).
    held: () => !!ctx && ctx.state !== 'running',
    // The same music rendered offline, faster than real time, from bar n on (for listening tests and checks).
    render(seconds, n = Math.ceil(Date.now() / 1000 / BAR), rate = 32000, ch = null) {
      if (ch !== null) flavor(String(ch));
      setup(new OfflineAudioContext(2, Math.ceil(seconds * rate), rate));
      buses = null; cutoff = 0;
      for (let k = 0; k * BAR < seconds; k++) { last = barAt(n + k); play(last, k * BAR + 0.05); }
      const done = ctx.startRendering();
      ctx = null; buses = null; bed = null;
      return done;
    },
    now: () => last && { key: NAMES[last.key], chord: last.name, bar: last.n, texture: last.texture },
  };
})();
