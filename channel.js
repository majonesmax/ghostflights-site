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

  // The key look (a station's character generator over its picture: the letters a little smeared, red shifted right,
  // blue left) baked into a canvas three times the size, once, instead of an SVG filter rerun on every frame (Safari
  // runs those on the processor: a scrolling list under one crawled). From the station's keyInto.
  const tints = {};
  const offscreen = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h }).getContext('2d');
  function keyInto(src, sx, sy, sw, sh, out) {
    const w = sw * 3, h = sh * 3, k = `${w}x${h}`;
    const tint = (tints[k] ||= offscreen(w, h));
    out.clearRect(0, 0, w, h);
    for (const [color, dx] of [['#ff0000', 2], ['#00ff00', 0], ['#0000ff', -1.5]]) {
      tint.globalCompositeOperation = 'copy';
      tint.imageSmoothingEnabled = false;
      tint.filter = 'blur(0.6px)';
      tint.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
      tint.filter = 'none';
      tint.globalCompositeOperation = 'multiply';
      tint.fillStyle = color;
      tint.fillRect(0, 0, w, h);
      tint.globalCompositeOperation = 'destination-in';
      tint.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
      out.globalCompositeOperation = 'lighter';
      out.drawImage(tint.canvas, dx, 0);
    }
    out.globalCompositeOperation = 'source-over';
  }

  // The weather, from the site's own daily files (tools/build_weather.py: Open-Meteo's archive of ERA5, CC BY 4.0), not
  // a request to the archive from every viewer. weatherDay(year, 'YYYY-MM-DD', tz, cities) gives each city's 24 hours of
  // that local date in tz, as the archive's hourly lists (temperature_2m, weather_code, is_day), or null without them.
  const wxDays = {};
  const loadDay = (date) => (wxDays[date] ||= new Promise((ok) => {
    if (window.WEATHER && window.WEATHER[date]) return ok(window.WEATHER[date]);
    const el = Object.assign(document.createElement('script'), { src: `weather/${date.slice(0, 4)}/${date.slice(5)}.js` });
    el.onload = () => ok((window.WEATHER || {})[date] || null);
    el.onerror = () => { delete wxDays[date]; ok(null); };
    document.head.append(el);
  }));
  // Minutes tz is ahead of UTC at a moment (the 1985 rules, from the browser's time zone data).
  const tzAhead = (tz, ms) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(new Date(ms)).map((x) => [x.type, +x.value]));
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - ms) / 60000;
  };
  async function weatherDay(year, date, tz, cities) {
    const [y, m, d] = date.split('-').map(Number);
    const hours = [...Array(24).keys()].map((h) => { const guess = Date.UTC(y, m - 1, d, h); return guess - tzAhead(tz, guess) * 60000; });
    const files = await Promise.all([...new Set(hours.map((ms) => new Date(ms).toISOString().slice(0, 10)))].map(async (k) => [k, await loadDay(k)]));
    const byDate = Object.fromEntries(files);
    if (files.some(([, f]) => !f)) return null;
    return cities.map((code) => {
      const out = { temperature_2m: [], weather_code: [], is_day: [] };
      for (const ms of hours) {
        const f = byDate[new Date(ms).toISOString().slice(0, 10)], i = f.cities.indexOf(code), h = new Date(ms).getUTCHours();
        out.temperature_2m.push(i < 0 ? null : f.t[i][h]);
        out.weather_code.push(i < 0 ? null : f.code[i][h]);
        out.is_day.push(i < 0 ? 1 : +f.day[i][h]);
      }
      return out;
    });
  }

  window.Channel = { toSet, params, SPEED, START, START_REAL, now: () => START + (Date.now() - START_REAL) * SPEED, cg, keyInto, weatherDay };
})();
