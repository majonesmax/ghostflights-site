// What every channel's picture shares (the station's boards and the guide): its link to the set, the clock and the
// character generator.
//
// - The set (index.html) owns the knobs, its on-screen display and the music: a picture sends it keys, swipes and
//   activity, and tells it when it's ready and what went wrong. Opened on its own, a picture just plays.
// - The clock: now, or ?t= a given moment and ?speed= faster (for trying it out).
// - The character generator: about 480 lines, every pixel on or off, a black edge in step with the letters' size.
//   Draw with block() and text() after use(context); finish() snaps a canvas to on and off.
(() => {
  const toSet = (msg) => { if (parent !== window) parent.postMessage(msg, '*'); };
  addEventListener('error', (e) => toSet({ error: `${e.message} (${(e.filename || '').split('/').pop()}:${e.lineno})` }));
  addEventListener('unhandledrejection', (e) => toSet({ error: String(e.reason && (e.reason.message || e.reason)) }));
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey) return;
    toSet({ key: e.key });
    if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
  });
  let touchY = null, woke = 0;
  addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; toSet({ wake: true }); }, { passive: true });
  addEventListener('touchend', (e) => {
    if (touchY === null) return;
    const dy = e.changedTouches[0].clientY - touchY; touchY = null;
    if (Math.abs(dy) > 60) toSet({ swipe: dy < 0 ? 1 : -1 });
  });
  addEventListener('pointerdown', () => toSet({ wake: true }));
  addEventListener('mousemove', () => { if (Date.now() - woke > 500) { woke = Date.now(); toSet({ wake: true }); } });

  const params = new URLSearchParams(location.search);
  const SPEED = +(params.get('speed') || 1), START_REAL = Date.now();
  const START = params.get('t') ? Date.parse(params.get('t')) : START_REAL;

  let ctx = null;
  const cg = {
    WHITE: '#f6f2e8', AMBER: '#ffbf2e', BAND: '#16205a', DEEP: '#0a0c22',
    use(context) { ctx = context; return context; },
    block(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); },
    text(s, x, y, size, color, align = 'left') {
      ctx.font = `${size}px CG`;
      ctx.textAlign = align;
      ctx.lineWidth = Math.min(2, size / 8); // the black edge in step with the letters, so small ones keep their strokes
      ctx.strokeStyle = '#000';
      ctx.strokeText(s.toUpperCase(), x, y);
      ctx.fillStyle = color;
      ctx.fillText(s.toUpperCase(), x, y);
    },
    // Words broken into lines of a given width at a given size.
    wrap(s, size, width) {
      ctx.font = `${size}px CG`;
      const lines = [];
      let line = '';
      for (const word of s.toUpperCase().split(' ')) {
        const tryLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(tryLine).width > width && line) { lines.push(line); line = word; } else line = tryLine;
      }
      if (line) lines.push(line);
      return lines;
    },
    // Every pixel on or off: no smoothing anywhere (a canvas or its context).
    finish(target) {
      const g = target.getContext ? target.getContext('2d') : target, c = g.canvas;
      const img = g.getImageData(0, 0, c.width, c.height);
      for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
      g.putImageData(img, 0, 0);
    },
  };

  window.Channel = { toSet, params, SPEED, START, START_REAL, now: () => START + (Date.now() - START_REAL) * SPEED, cg };
})();
