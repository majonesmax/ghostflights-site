// Ghostflights' schedule engine and feed: which departed airlines' flights are in the air at a moment, by their real
// 1985 schedules, and the same as simple records anyone can use. The station, the guide and the feed page all fly
// from this one copy.
//
// In a page: <script src="feed-data.js"></script><script src="feed.js"></script>, then Ghostflights.feed().
// In Node: require('./feed-data.js'); require('./feed.js'); globalThis.Ghostflights.feed().
//
// Every record says it's simulated and from 1985. There's no ICAO address, and flight numbers appear only where a
// timetable printed them, so nothing here can pass for real traffic.
(function (root) {
  const DAY = 86400000;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // A timetable's date notes ("until November 14", "from November 15"); the timetables ran from October 1985 into 1986.
  const noteDate = (s) => {
    const [month, day] = s.split(' ');
    const m = MONTHS.indexOf(month);
    return Date.UTC(m < 9 ? 1986 : 1985, m, +day);
  };
  // Day number d (days since 1970, UTC) on the 1985 calendar: the same month and date, in 1985.
  const then1985 = (d) => {
    const date = new Date(d * DAY);
    return Date.UTC(1985, date.getUTCMonth(), Math.min(date.getUTCDate(), date.getUTCMonth() === 1 ? 28 : 31));
  };
  // Whether a schedule row flies on day d: its weekday in 1985, within its date notes.
  function flies(row, d) {
    const [, , , , , , mask, starts, ends] = row;
    const then = then1985(d);
    if (!((mask >> ((new Date(then).getUTCDay() + 6) % 7)) & 1)) return false;
    return !((starts && then < noteDate(starts)) || (ends && then > noteDate(ends)));
  }

  const rad = Math.PI / 180;
  function km([la1, lo1], [la2, lo2]) {
    const a = Math.sin((la2 - la1) * rad / 2) ** 2 + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin((lo2 - lo1) * rad / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(a));
  }
  // Cruise by distance for the jets; the Convair 580, a turboprop with a ceiling near 24,000 feet, flew lower.
  const cruiseFt = (nm, kind) => (kind === 'CV580'
    ? (nm < 100 ? 11000 : nm < 200 ? 15000 : 20000)
    : (nm < 150 ? 17000 : nm < 300 ? 25000 : nm < 700 ? 31000 : 35000));
  // Altitude along the way: a climb over the first eighth, cruise, a descent over the last sixth.
  const altitude = (cruise, along) => Math.round(Math.min(cruise, cruise * along / 0.12, cruise * (1 - along) / 0.15) / 1000) * 1000;

  function engine(data) {
    const pos = data.positions;
    // Every scheduled flight in the air at t (on the ground or taxiing, the first and last 4% of its block, it isn't).
    function airborne(t) {
      const out = [];
      const today = Math.floor(t / DAY);
      for (const [code, airline] of Object.entries(data.airlines)) {
        for (const row of airline.schedule || []) {
          const [num, from, to, leave, offset, block, , , , kind] = row;
          if (!pos[from] || !pos[to]) continue;
          for (const d of [today - 1, today, today + 1]) {
            const depart = d * DAY + (offset + leave) * 60000; // that day's local midnight, as UTC, plus the local time
            const blockMs = block * 60000;
            if (t < depart || t >= depart + blockMs) continue;
            const along = (t - depart) / blockMs;
            if (along < 0.04 || along > 0.96 || !flies(row, d)) continue;
            const nm = km(pos[from], pos[to]) / 1.852;
            const cruise = cruiseFt(nm, kind);
            out.push({ key: `${code}:${num}:${from}-${to}:${d}`, airline: code, number: num, from, to, kind, along, cruise,
              alt: altitude(cruise, along), depart, block, nm, d });
          }
        }
      }
      return out;
    }
    // Scheduled departures between two moments, optionally only from some airports.
    function departures(from, to, origins) {
      const out = [];
      const first = Math.floor(from / DAY) - 1, last = Math.floor(to / DAY) + 1;
      for (const [code, airline] of Object.entries(data.airlines)) {
        for (const row of airline.schedule || []) {
          const [num, origin, , leave, offset] = row;
          if (origins && !origins(origin)) continue;
          for (let d = first; d <= last; d++) {
            const depart = d * DAY + (offset + leave) * 60000;
            if (depart >= from && depart < to && flies(row, d)) out.push({ airline: code, number: num, origin, depart });
          }
        }
      }
      return out;
    }
    return { airborne, departures };
  }

  // Where along a great circle a fraction of the way is, and the heading there.
  function along([la1, lo1], [la2, lo2], f) {
    const p1 = [la1 * rad, lo1 * rad], p2 = [la2 * rad, lo2 * rad];
    const d = km([la1, lo1], [la2, lo2]) / 6371;
    const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(p1[0]) * Math.cos(p1[1]) + B * Math.cos(p2[0]) * Math.cos(p2[1]);
    const y = A * Math.cos(p1[0]) * Math.sin(p1[1]) + B * Math.cos(p2[0]) * Math.sin(p2[1]);
    const z = A * Math.sin(p1[0]) + B * Math.sin(p2[0]);
    const lat = Math.atan2(z, Math.hypot(x, y)), lon = Math.atan2(y, x);
    const dl = p2[1] - lon;
    const track = Math.atan2(Math.sin(dl) * Math.cos(p2[0]), Math.cos(lat) * Math.sin(p2[0]) - Math.sin(lat) * Math.cos(p2[0]) * Math.cos(dl));
    return { lat: lat / rad, lon: lon / rad, track: (track / rad + 360) % 360 };
  }

  // The feed: every scheduled flight in the air at t, as plain records.
  function feed(t = Date.now(), data = root.GHOSTFLIGHTS_DATA) {
    const run = engine(data);
    return run.airborne(t).map((f) => {
      const airline = data.airlines[f.airline];
      const at = along(data.positions[f.from], data.positions[f.to], f.along);
      const climbing = f.alt < f.cruise && f.along < 0.5, descending = f.alt < f.cruise && f.along >= 0.5;
      return {
        simulated: true,
        year: 1985,
        flight: `${airline.code} ${f.number}`,
        airline: airline.name,
        type: (airline.types && airline.types[f.kind]) || f.kind,
        from: f.from,
        to: f.to,
        departed1985: new Date(then1985(f.d) + (f.depart - f.d * DAY)).toISOString().slice(0, 16) + 'Z',
        lat: Math.round(at.lat * 1e4) / 1e4,
        lon: Math.round(at.lon * 1e4) / 1e4,
        track: Math.round(at.track),
        altitudeFt: f.alt,
        groundSpeedKt: Math.round(f.nm / ((f.block - Math.min(20, f.block * 0.35)) / 60) / 5) * 5, // the block's average, less taxi and climb-out
        phase: climbing ? 'climbing' : descending ? 'descending' : 'cruising',
        source: airline.source,
      };
    });
  }

  root.Ghostflights = { engine, feed, flies, then1985, noteDate, cruiseFt, altitude, km };
})(typeof globalThis !== 'undefined' ? globalThis : window);
