// The station's background music: a 1984 broadcast music library, four pieces by the same imagined artist on the
// same album, synthesized in the browser. Berlin Express (marimba plucks over a Prophet pad), Olympic Horizon (CS-80
// brass and a rolling arpeggio over tympani), Local on the 8s (DX7 Rhodes, fretless bass, flute and a drum machine)
// and Night Terminal (a sub drone, string swells and felt tape piano). Each runs a 28-bar arc (intro, build, peak,
// breakdown, resolve) over its chord progression, through a delay, a low-pass like a set's coax that opens and
// closes with the arc, and a compressor. It's generated from the clock: every viewer hears the same sixteenth at the
// same moment. A channel plays one piece (the guide Local on the 8s; the airlines the four in turn); a change of
// channel cuts to static until the new picture is in, then that channel's piece comes in where it is.
// Muzak.start() after a click (browsers need one before sound); Muzak.stop(); Muzak.tune(ch) when the channel
// changes and Muzak.tunedIn() when its picture is in; Muzak.chime() under the station ID; Muzak.now() says what's
// playing.
(() => {
  // The arc's movements and the four scores (each chord with its scale and the lead's, bass's and counter's patterns
  // as steps of that scale, -1 a rest).
  const MOVEMENTS = [
    {
      name: 'INTRO',
      bars: 4,
      filterStart: 0.35,
      filterEnd: 0.48,
      drums: false,
      bass: false,
      chords: true,
      lead: true,
      leadSparse: true,
      counter: false,
      octaveLift: false,
    },
    {
      name: 'BUILD',
      bars: 8,
      filterStart: 0.48,
      filterEnd: 0.82,
      drums: true,
      bass: true,
      chords: true,
      lead: true,
      leadSparse: false,
      counter: false,
      octaveLift: false,
    },
    {
      name: 'PEAK',
      bars: 8,
      filterStart: 0.85,
      filterEnd: 1.00,
      drums: true,
      bass: true,
      chords: true,
      lead: true,
      leadSparse: false,
      counter: true,
      octaveLift: true,
    },
    {
      name: 'BREAKDOWN',
      bars: 4,
      filterStart: 0.42,
      filterEnd: 0.58,
      drums: false,
      bass: false,
      chords: true,
      lead: false,
      leadSparse: false,
      counter: true,
      octaveLift: false,
    },
    {
      name: 'RESOLVE',
      bars: 4,
      filterStart: 0.55,
      filterEnd: 0.38,
      drums: false,
      bass: true,
      chords: true,
      lead: true,
      leadSparse: true,
      counter: false,
      octaveLift: false,
    }
  ];

  const SCORES = {
    berlin_express: {
      tempo: 118,
      barsPerChord: 2,
      drumPattern: [],
      bassVoice: 'soft_sub',
      chordVoice: 'prophet_pad',
      leadVoice: 'marimba_pluck',
      counterVoice: 'lyrical_analog',
      delayTime: 0.381,
      delayWet: 0.52,
      baseCutoff: 3000,
      // Fmaj7 -> Dm7 -> Bbmaj7 -> Csus4
      progression: [
        {
          symbol: 'Fmaj7',
          chord: [174.61, 220.00, 261.63, 329.63],
          scale: [174.61, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
          leadPattern: [0, 3, 5, 4, 7, 5, 3, 4, 8, 5, 3, 2, 5, 3, 1, 3],
          bassPattern: [0, -1, -1, -1, 0, -1, 3, -1, 0, -1, -1, -1, 4, -1, 3, -1],
          counterPattern: [5, -1, -1, -1, -1, -1, 7, -1, 8, -1, -1, -1, 7, -1, 5, -1]
        },
        {
          symbol: 'Dm7',
          chord: [146.83, 174.61, 220.00, 261.63],
          scale: [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00],
          leadPattern: [0, 2, 4, 3, 6, 4, 2, 3, 7, 4, 2, 1, 4, 2, 0, 2],
          bassPattern: [0, -1, -1, -1, 0, -1, 2, -1, 0, -1, -1, -1, 3, -1, 2, -1],
          counterPattern: [4, -1, -1, -1, -1, -1, 6, -1, 7, -1, -1, -1, 6, -1, 4, -1]
        },
        {
          symbol: 'Bbmaj7',
          chord: [116.54, 174.61, 220.00, 293.66],
          scale: [116.54, 130.81, 146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23],
          leadPattern: [2, 3, 5, 7, 8, 7, 5, 3, 7, 5, 3, 2, 5, 3, 2, 3],
          bassPattern: [0, -1, -1, -1, 0, -1, 3, -1, 0, -1, -1, -1, 5, -1, 3, -1],
          counterPattern: [7, -1, -1, -1, -1, -1, 8, -1, 7, -1, -1, -1, 5, -1, 3, -1]
        },
        {
          symbol: 'Csus4',
          chord: [130.81, 174.61, 196.00, 293.66],
          scale: [130.81, 146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00],
          leadPattern: [0, 2, 3, 5, 6, 5, 3, 2, 7, 5, 3, 2, 5, 3, 1, 2],
          bassPattern: [0, -1, -1, -1, 3, -1, 3, -1, 0, -1, -1, -1, 3, -1, 1, -1],
          counterPattern: [6, -1, -1, -1, -1, -1, 7, -1, 8, -1, -1, -1, 6, -1, 5, -1]
        }
      ]
    },

    olympic_horizon: {
      tempo: 104,
      barsPerChord: 1,
      drumPattern: ['T', '', '', '', 'T', '', '', 'T', 'T', '', '', '', 'T', '', '', ''],
      bassVoice: 'soft_sub',
      chordVoice: 'cs80_hymn_brass',
      leadVoice: 'chariots_rolling_arp',
      counterVoice: 'chariots_portamento_lead',
      delayTime: 0.432,
      delayWet: 0.48,
      baseCutoff: 2900,
      // C -> F/C -> G/B -> C -> Am -> F -> Gsus4 -> G
      progression: [
        {
          symbol: 'C',
          chord: [130.81, 196.00, 261.63, 329.63],
          scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33],
          leadPattern: [0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2],
          bassPattern: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1],
          counterPattern: [0, -1, -1, -1, 3, -1, 4, -1, 5, -1, -1, -1, 4, -1, -1, -1]
        },
        {
          symbol: 'F/C',
          chord: [130.81, 174.61, 220.00, 349.23],
          scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33],
          leadPattern: [0, 3, 5, 3, 0, 3, 5, 3, 0, 3, 5, 3, 0, 3, 5, 3],
          bassPattern: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1],
          counterPattern: [2, -1, -1, -1, 3, -1, 4, -1, 3, -1, -1, -1, -1, -1, -1, -1]
        },
        {
          symbol: 'G/B',
          chord: [123.47, 196.00, 246.94, 293.66],
          scale: [246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
          leadPattern: [0, 2, 5, 2, 0, 2, 5, 2, 0, 2, 5, 2, 0, 2, 5, 2],
          bassPattern: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1],
          counterPattern: [2, -1, -1, -1, 4, -1, 5, -1, 6, -1, -1, -1, 5, -1, -1, -1]
        },
        {
          symbol: 'C',
          chord: [130.81, 196.00, 261.63, 329.63],
          scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33],
          leadPattern: [0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2],
          bassPattern: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1],
          counterPattern: [4, -1, -1, -1, -1, -1, -1, -1, 2, -1, -1, -1, -1, -1, -1, -1]
        },
        {
          symbol: 'Am',
          chord: [110.00, 164.81, 220.00, 261.63],
          scale: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25],
          leadPattern: [0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2],
          bassPattern: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1],
          counterPattern: [0, -1, -1, -1, 4, -1, 5, -1, 6, -1, -1, -1, 5, -1, -1, -1]
        },
        {
          symbol: 'F',
          chord: [130.81, 174.61, 220.00, 261.63],
          scale: [174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 440.00],
          leadPattern: [0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2],
          bassPattern: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1],
          counterPattern: [4, -1, -1, -1, 5, -1, 6, -1, 4, -1, -1, -1, -1, -1, -1, -1]
        },
        {
          symbol: 'Gsus4',
          chord: [146.83, 196.00, 261.63, 293.66],
          scale: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
          leadPattern: [0, 3, 4, 3, 0, 3, 4, 3, 0, 3, 4, 3, 0, 3, 4, 3],
          bassPattern: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1],
          counterPattern: [3, -1, -1, -1, 4, -1, 3, -1, 2, -1, -1, -1, -1, -1, -1, -1]
        },
        {
          symbol: 'G',
          chord: [146.83, 196.00, 246.94, 293.66],
          scale: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
          leadPattern: [0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2, 0, 2, 4, 2],
          bassPattern: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1],
          counterPattern: [2, -1, -1, -1, -1, -1, -1, -1, 1, -1, -1, -1, -1, -1, -1, -1]
        }
      ]
    },

    local_on_the_8s: {
      tempo: 92,
      barsPerChord: 2,
      drumPattern: ['K,H', 'H', 'H', 'H', 'R,H', 'H', 'K,H', 'O', 'K,H', 'H', 'H', 'K,H', 'R,H', 'H', 'H', 'O'],
      bassVoice: 'fretless_bass',
      chordVoice: 'dx7_rhodes',
      leadVoice: 'breathy_flute',
      counterVoice: 'shimmer_bells',
      delayTime: 0.326,
      delayWet: 0.32,
      baseCutoff: 3400,
      // Cmaj9 -> Am7 -> Dm9 -> G13
      progression: [
        {
          symbol: 'Cmaj9',
          chord: [261.63, 329.63, 392.00, 493.88, 587.33],
          scale: [261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 783.99],
          leadPattern: [4, -1, 6, 7, -1, 6, 4, 3, 2, -1, 4, 5, -1, 3, 2, 0],
          bassPattern: [0, -1, -1, 2, 3, -1, 4, -1, 0, -1, -1, 3, 2, -1, 1, -1],
          counterPattern: [8, -1, -1, -1, 7, -1, -1, -1, 6, -1, -1, -1, 7, -1, -1, -1]
        },
        {
          symbol: 'Am7',
          chord: [220.00, 261.63, 329.63, 392.00, 493.88],
          scale: [220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33],
          leadPattern: [4, -1, 5, 6, -1, 5, 4, 2, 3, -1, 4, 5, -1, 2, 1, 0],
          bassPattern: [0, -1, -1, 2, 4, -1, 5, -1, 0, -1, -1, 4, 3, -1, 2, -1],
          counterPattern: [7, -1, -1, -1, 8, -1, -1, -1, 6, -1, -1, -1, 5, -1, -1, -1]
        },
        {
          symbol: 'Dm9',
          chord: [146.83, 174.61, 220.00, 261.63, 329.63],
          scale: [146.83, 164.81, 174.61, 220.00, 261.63, 293.66, 329.63, 349.23, 440.00],
          leadPattern: [3, -1, 4, 6, -1, 4, 3, 2, 1, -1, 3, 4, -1, 2, 1, 0],
          bassPattern: [0, -1, -1, 2, 3, -1, 4, -1, 0, -1, -1, 3, 2, -1, 1, -1],
          counterPattern: [6, -1, -1, -1, 7, -1, -1, -1, 8, -1, -1, -1, 6, -1, -1, -1]
        },
        {
          symbol: 'G13',
          chord: [196.00, 246.94, 349.23, 440.00],
          scale: [196.00, 220.00, 246.94, 293.66, 349.23, 392.00, 440.00, 493.88, 587.33],
          leadPattern: [5, -1, 6, 7, -1, 6, 5, 3, 4, -1, 5, 6, -1, 3, 2, 1],
          bassPattern: [0, -1, -1, 2, 3, -1, 5, -1, 0, -1, -1, 3, 2, -1, 1, -1],
          counterPattern: [8, -1, -1, -1, 6, -1, -1, -1, 7, -1, -1, -1, 5, -1, -1, -1]
        }
      ]
    },

    night_terminal: {
      tempo: 68,
      barsPerChord: 2,
      drumPattern: [],
      bassVoice: 'sub_drone',
      chordVoice: 'eno_string_pad',
      leadVoice: 'felt_tape_piano',
      counterVoice: 'glass_harmonics',
      delayTime: 0.661,
      delayWet: 0.58,
      baseCutoff: 2300,
      // Abmaj7 -> Fm9 -> Dbmaj7 -> Ebsus4
      progression: [
        {
          symbol: 'Abmaj7',
          chord: [103.83, 155.56, 207.65, 261.63, 311.13],
          scale: [207.65, 233.08, 261.63, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
          leadPattern: [0, -1, -1, 3, -1, -1, -1, 4, -1, -1, 6, -1, -1, -1, -1, -1],
          bassPattern: [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          counterPattern: [6, -1, -1, -1, -1, -1, 8, -1, -1, -1, -1, -1, 4, -1, -1, -1]
        },
        {
          symbol: 'Fm9',
          chord: [87.31, 130.81, 174.61, 207.65, 261.63],
          scale: [174.61, 196.00, 207.65, 261.63, 311.13, 349.23, 392.00, 415.30, 523.25],
          leadPattern: [-1, 2, -1, -1, 4, -1, -1, -1, 5, -1, -1, 3, -1, -1, -1, -1],
          bassPattern: [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          counterPattern: [-1, -1, 7, -1, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1, 3, -1]
        },
        {
          symbol: 'Dbmaj7',
          chord: [138.59, 207.65, 261.63, 311.13, 349.23],
          scale: [138.59, 155.56, 174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 415.30],
          leadPattern: [2, -1, -1, -1, 5, -1, -1, 4, -1, -1, -1, 6, -1, -1, -1, -1],
          bassPattern: [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          counterPattern: [8, -1, -1, -1, -1, -1, 6, -1, -1, -1, -1, -1, 5, -1, -1, -1]
        },
        {
          symbol: 'Ebsus4',
          chord: [155.56, 207.65, 233.08, 311.13, 349.23],
          scale: [155.56, 174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 392.00, 466.16],
          leadPattern: [-1, -1, 3, -1, -1, 5, -1, -1, -1, 4, -1, -1, 2, -1, -1, -1],
          bassPattern: [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
          counterPattern: [-1, 7, -1, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1, 3, -1, -1]
        }
      ]
    }
  };
  // The guide plays Local on the 8s; the airline channels the four in turn.
  const ORDER = ['berlin_express', 'olympic_horizon', 'local_on_the_8s', 'night_terminal'];
  const scoreFor = (ch) => (ch === '0' ? 'local_on_the_8s' : ORDER[(Math.max(1, +ch || 1) - 1) % 4]);
  const ARC_BARS = MOVEMENTS.reduce((s, m) => s + m.bars, 0);

  const VOLUME = 0.78 * 0.36, AHEAD = 1.5; // seconds scheduled ahead (a background tab ticks once a second)
  let ctx = null, out = null, master = null, compressor = null, coax = null, delayIn = null, delay = null, delayTone = null, feedback = null, noise = null;
  let bed = null; // this channel's voices: its own gain into the coax and the delay, faded out on a change
  let id = 'berlin_express', score = SCORES[id], timer = null, waiting = true, next = 0, t0 = 0, wall0 = 0, last = null;
  let pads = []; // the chord now sounding, cut when the next one comes in

  const safe = (f) => Math.max(20, Math.min(18000, Number(f) || 220));
  const stepSec = () => 60 / score.tempo / 4;
  // A small hash for the pad's chorus drift, the same for every viewer.
  const drift = (n, i) => ((Math.sin(n * 12.9898 + i * 78.233) * 43758.5453) % 1) * 14 - 7;

  // Where bar b falls in the arc: its movement, its bar in the movement and the chord (the progression steps every
  // barsPerChord bars, holds through the resolve and starts over on the root there).
  function barState(b) {
    const arcBar = ((b % ARC_BARS) + ARC_BARS) % ARC_BARS;
    let prog = 0, acc = 0, mov = MOVEMENTS[0], inMov = 0;
    for (let k = 0; k <= arcBar; k++) {
      let m = 0, a = 0;
      while (k >= a + MOVEMENTS[m].bars) { a += MOVEMENTS[m].bars; m++; }
      mov = MOVEMENTS[m]; inMov = k - a; acc = a;
      if (mov.name === 'RESOLVE') { if (inMov === 0) prog = 0; } else if (inMov % (score.barsPerChord || 2) === 0) prog++;
    }
    const sweep = mov.filterStart + (mov.filterEnd - mov.filterStart) * Math.min(1, inMov / Math.max(1, mov.bars));
    return { mov, inMov, harm: score.progression[prog % score.progression.length], sweep, acc };
  }

  function setup(context = new (window.AudioContext || window.webkitAudioContext)()) {
    ctx = context;
    out = ctx.createGain(); out.connect(ctx.destination); // the chime and the static
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14; compressor.knee.value = 16; compressor.ratio.value = 4; compressor.attack.value = 0.01; compressor.release.value = 0.2;
    compressor.connect(out);
    master = ctx.createGain(); master.gain.value = VOLUME; master.connect(compressor);
    coax = ctx.createBiquadFilter(); coax.type = 'lowpass'; coax.Q.value = 1; coax.frequency.value = 1200; coax.connect(master);
    delayIn = ctx.createGain(); delay = ctx.createDelay(2); delayTone = ctx.createBiquadFilter(); feedback = ctx.createGain();
    delayTone.type = 'lowpass'; delayTone.frequency.value = 2100;
    delayIn.connect(delay); delay.connect(delayTone); delayTone.connect(feedback); feedback.connect(delay); delayTone.connect(coax);
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  // A fresh bed for the channel's piece, the delay set to the piece's.
  function newBed() {
    const g = ctx.createGain(), send = ctx.createGain();
    g.connect(coax); send.connect(delayIn);
    const now = ctx.currentTime;
    delay.delayTime.setTargetAtTime(Math.max(0.05, Math.min(1.8, score.delayTime)), now, 0.1);
    delayIn.gain.setTargetAtTime(Math.max(0, Math.min(1, score.delayWet)), now, 0.08);
    feedback.gain.setTargetAtTime(Math.min(0.68, score.delayWet * 0.85), now, 0.08);
    pads = [];
    return { g, send };
  }
  // A voice's output into the bed, and into the delay when it echoes.
  function voice(gain, echo) { gain.connect(bed.g); if (echo) gain.connect(bed.send); }
  function env(g, t, peak, attack, len, attackLinear = true) {
    g.gain.setValueAtTime(0.001, t);
    if (attackLinear) g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
  }

  // Pulse: tympani (T), kick (K), closed and open hats (H, O), rimshot (R).
  function drums(token, t) {
    for (const h of token.split(',')) {
      if (h === 'T') {
        const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(98, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.22);
        lp.type = 'lowpass'; lp.frequency.value = 180; env(g, t, 0.28, 0.025, 0.48);
        o.connect(lp).connect(g); voice(g, true); o.start(t); o.stop(t + 0.5);
      } else if (h === 'K') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.09);
        g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(g); voice(g); o.start(t); o.stop(t + 0.24);
      } else if (h === 'H' || h === 'O') {
        const open = h === 'O', len = open ? 0.18 : 0.04, src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = noise; hp.type = 'highpass'; hp.frequency.value = 7600;
        g.gain.setValueAtTime(open ? 0.09 : 0.055, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
        src.connect(hp).connect(g); voice(g); src.start(t, (t * 7.3) % 1); src.stop(t + len + 0.01);
      } else if (h === 'R') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(480, t); o.frequency.exponentialRampToValueAtTime(175, t + 0.03);
        g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
        o.connect(g); voice(g); o.start(t); o.stop(t + 0.05);
      }
    }
  }
  // Bass: fretless walking, a soft sub pulse or a sub drone, an octave under the scale.
  function bass(f, t) {
    const v = score.bassVoice, freq = safe(f * 0.5), o = ctx.createOscillator(), g = ctx.createGain();
    if (v === 'fretless_bass') {
      o.type = 'triangle'; o.frequency.setValueAtTime(freq * 0.99, t); o.frequency.linearRampToValueAtTime(freq, t + 0.06);
      env(g, t, 0.26, 0.03, 0.48); o.connect(g); voice(g); o.start(t); o.stop(t + 0.5);
    } else {
      const drone = v === 'sub_drone', len = drone ? 3.2 : 0.72;
      o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
      env(g, t, 0.24, drone ? 0.35 : 0.045, len); o.connect(g); voice(g); o.start(t); o.stop(t + len + 0.06);
    }
  }
  // The chord on each bar: a DX7 Rhodes (two-operator FM), CS-80 brass swells, Eno string swells or a Prophet pad.
  // A held pad gives way to the next chord.
  function chord(n, t, harm, mov) {
    const v = score.chordVoice;
    if (v !== 'dx7_rhodes') {
      for (const p of pads) { try { p.g.gain.setTargetAtTime(0.0005, t, 0.12); p.o.stop(t + 0.35); } catch {} }
      pads = [];
    }
    harm.chord.forEach((raw, i) => {
      const freq = safe(raw);
      if (v === 'dx7_rhodes') {
        const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
        car.type = 'sine'; car.frequency.setValueAtTime(freq, t);
        mod.type = 'sine'; mod.frequency.setValueAtTime(freq * 7, t);
        mg.gain.setValueAtTime(freq * 1.4, t); mg.gain.exponentialRampToValueAtTime(Math.max(0.5, freq * 0.05), t + 0.35);
        env(g, t, 0.072, 0.015, 2.1);
        mod.connect(mg).connect(car.frequency); car.connect(g); voice(g);
        car.start(t); mod.start(t); car.stop(t + 2.15); mod.stop(t + 2.15);
      } else if (v === 'cs80_hymn_brass' || v === 'eno_string_pad') {
        const brass = v === 'cs80_hymn_brass';
        for (const det of brass ? [-9, 9] : [-7, 7]) {
          const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
          o.type = brass ? 'sawtooth' : 'triangle'; o.frequency.setValueAtTime(freq, t); o.detune.value = det;
          lp.type = 'lowpass';
          if (brass) {
            lp.Q.value = 1.3; lp.frequency.setValueAtTime(240, t);
            lp.frequency.linearRampToValueAtTime(1450, t + 0.85); lp.frequency.linearRampToValueAtTime(480, t + 2.4);
            env(g, t, 0.044, 0.55, 2.5);
          } else { lp.frequency.value = 680; env(g, t, 0.068, 1.1, 3.6); }
          o.connect(lp).connect(g); voice(g);
          const len = brass ? 2.6 : 3.7;
          o.start(t); o.stop(t + len); pads.push({ o, g });
        }
      } else {
        const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), down = mov.name === 'BREAKDOWN';
        o.type = 'sawtooth'; o.frequency.setValueAtTime(freq, t); o.detune.value = drift(n, i);
        lp.type = 'lowpass'; lp.frequency.value = down ? 760 : 500;
        env(g, t, down ? 0.065 : 0.05, 0.45, 2.4);
        o.connect(lp).connect(g); voice(g); o.start(t); o.stop(t + 2.5); pads.push({ o, g });
      }
    });
  }
  // The lead: marimba plucks, a rolling arpeggio, a breathy flute or felt tape piano.
  function lead(raw, t, sweep) {
    const v = score.leadVoice, freq = safe(raw);
    if (v === 'marimba_pluck' || v === 'chariots_rolling_arp') {
      const marimba = v === 'marimba_pluck', o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(freq, t);
      if (marimba) { o.frequency.exponentialRampToValueAtTime(freq * 1.018, t + 0.014); o.frequency.exponentialRampToValueAtTime(freq, t + 0.045); }
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(marimba ? safe(score.baseCutoff * sweep + 400) : 1450, t);
      lp.frequency.exponentialRampToValueAtTime(marimba ? 280 : 340, t + (marimba ? 0.36 : 0.24));
      env(g, t, marimba ? 0.21 : 0.14, marimba ? 0.01 : 0.012, marimba ? 0.42 : 0.28);
      o.connect(lp).connect(g); voice(g, true); o.start(t); o.stop(t + (marimba ? 0.45 : 0.3));
    } else if (v === 'breathy_flute') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, t); env(g, t, 0.17, 0.06, 0.55);
      o.connect(g); voice(g, true); o.start(t); o.stop(t + 0.58);
    } else {
      const o = ctx.createOscillator(), ov = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), og = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
      ov.type = 'triangle'; ov.frequency.setValueAtTime(freq * 2, t); og.gain.value = 0.16;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(920, t); lp.frequency.exponentialRampToValueAtTime(260, t + 1.4);
      env(g, t, 0.16, 0.035, 1.85);
      ov.connect(og).connect(lp); o.connect(lp); lp.connect(g); voice(g, true);
      o.start(t); ov.start(t); o.stop(t + 1.9); ov.stop(t + 1.9);
    }
  }
  // The counter-melody, an octave up: a lyrical analog lead, a portamento lead, shimmer bells or glass harmonics.
  function counter(raw, t) {
    const v = score.counterVoice, freq = safe(raw);
    if (v === 'lyrical_analog' || v === 'chariots_portamento_lead') {
      const lyrical = v === 'lyrical_analog';
      for (const det of lyrical ? [-6, 6] : [-7, 7]) {
        const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'sawtooth'; o.detune.value = det;
        if (lyrical) o.frequency.setValueAtTime(freq * 2, t);
        else { o.frequency.setValueAtTime(freq * 1.94, t); o.frequency.exponentialRampToValueAtTime(freq * 2, t + 0.14); }
        lp.type = 'lowpass'; lp.Q.value = lyrical ? 1.8 : 1.4;
        lp.frequency.setValueAtTime(lyrical ? 2200 : 1650, t); lp.frequency.exponentialRampToValueAtTime(lyrical ? 850 : 620, t + (lyrical ? 0.85 : 1.15));
        env(g, t, lyrical ? 0.078 : 0.072, lyrical ? 0.08 : 0.12, lyrical ? 0.95 : 1.25);
        o.connect(lp).connect(g); voice(g, true); o.start(t); o.stop(t + (lyrical ? 1 : 1.3));
      }
    } else {
      const bells = v === 'shimmer_bells', o = ctx.createOscillator(), g = ctx.createGain();
      o.type = bells ? 'triangle' : 'sine'; o.frequency.setValueAtTime(freq * 2, t);
      env(g, t, bells ? 0.13 : 0.12, bells ? 0.01 : 0.04, bells ? 1.1 : 2.2);
      o.connect(g); voice(g, true); o.start(t); o.stop(t + (bells ? 1.15 : 2.25));
    }
  }

  // One sixteenth of the piece, step n of the clock, at audio time t.
  function play(n, t) {
    const b = Math.floor(n / 16), s = ((n % 16) + 16) % 16, { mov, inMov, harm, sweep } = barState(b);
    if (s === 0) {
      coax.frequency.setTargetAtTime(safe(score.baseCutoff * sweep), t, 0.25);
      chord(b, t, harm, mov);
    }
    if (mov.drums && score.drumPattern.length) { const k = score.drumPattern[s % score.drumPattern.length]; if (k) drums(k, t); }
    if (mov.bass) { const i = harm.bassPattern[s % harm.bassPattern.length]; if (i >= 0 && harm.scale[i]) bass(harm.scale[i], t); }
    if (mov.lead && (!mov.leadSparse || s % 4 === 0)) {
      const i = harm.leadPattern[s % harm.leadPattern.length];
      if (i >= 0 && harm.scale[i]) lead(harm.scale[i] * (mov.octaveLift && (s === 7 || s === 14) ? 2 : 1), t, sweep);
    }
    if (mov.counter) { const i = harm.counterPattern[s % harm.counterPattern.length]; if (i >= 0 && harm.scale[i]) counter(harm.scale[i], t); }
    last = { bar: (((b % ARC_BARS) + ARC_BARS) % ARC_BARS) + 1, section: mov.name.toLowerCase(), chord: harm.symbol };
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
  // Come in on the channel's piece where it is now: the chord already sounding, then on from the next step.
  function joinNow() {
    bed = newBed();
    next = Math.ceil((wall0 + ctx.currentTime + 0.03 - t0) / stepSec());
    const b = Math.floor(next / 16);
    if (next % 16) { const { harm, mov, sweep } = barState(b); coax.frequency.setValueAtTime(safe(score.baseCutoff * sweep), ctx.currentTime); chord(b, ctx.currentTime + 0.03, harm, mov); }
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
  function choose(ch) { id = scoreFor(String(ch)); score = SCORES[id]; }
  const NAMES = { berlin_express: 'Berlin Express', olympic_horizon: 'Olympic Horizon', local_on_the_8s: 'Local on the 8s', night_terminal: 'Night Terminal' };

  window.Muzak = {
    start() {
      if (ctx) { ctx.resume(); return; }
      setup();
      t0 = ctx.currentTime; wall0 = Date.now() / 1000;
      waiting = false;
      joinNow();
      timer = setInterval(tick, 100);
    },
    stop() { clearInterval(timer); timer = null; if (ctx) ctx.close(); ctx = null; bed = null; staticSrc = null; pads = []; },
    // The channel changes: the music cuts out (what's already scheduled fades with its bed) and static plays until
    // the new picture is in (tunedIn).
    tune(ch) {
      choose(ch);
      if (!ctx) return;
      if (bed) {
        const old = bed;
        old.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03); old.send.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
        setTimeout(() => { old.g.disconnect(); old.send.disconnect(); }, (AHEAD + 4) * 1000);
      }
      bed = null; waiting = true; pads = [];
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
      for (let n = Math.ceil(from / stepSec()); at(n) < seconds; n++) play(n, at(n));
      const done = ctx.startRendering();
      ctx = null; bed = null; pads = [];
      return done;
    },
    now: () => last && { piece: NAMES[id], score: 'ABCD'[ORDER.indexOf(id)], bar: last.bar, of: ARC_BARS, section: last.section, chord: last.chord },
  };
})();
