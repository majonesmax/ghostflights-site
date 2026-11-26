// Ghostflights' schedule engine and feed: which departed airlines' flights are in the air at a moment, by their real
// 1985 schedules, and the same as simple records anyone can use. The station, the guide and the feed page all fly
// from this one copy.
//
// In a page: <script src="feed-data.js"></script><script src="feed.js"></script>, then Ghostflights.feed() (everything in the
// air now) or Ghostflights.query({ lat, lon, radius }) and the rest (api.html says how).
// In Node: require('./feed-data.js'); require('./feed.js'); globalThis.Ghostflights.feed().
//
// Every record says it's simulated and its year (1985, or 1979 for Hughes Airwest). There's no ICAO address, and flight numbers appear only where a
// timetable printed them, so nothing here can pass for real traffic.
(function (root) {
  const DAY = 86400000;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // A timetable's date notes ("until November 14", "from November 15"): a bare date is from an autumn 1985 timetable
  // running into 1986; one with its year says it ("March 31 1985", Pan Am's of February 1985).
  const noteDate = (s) => {
    const [month, day, year] = s.split(' ');
    const m = MONTHS.indexOf(month);
    return Date.UTC(year ? +year : m < 9 ? 1986 : 1985, m, +day);
  };
  // Day number d (days since 1970, UTC) on an airline's calendar: the same month and date, in its year (1985, or 1979
  // for an airline that was gone by 1985).
  const thenIn = (d, year = 1985) => {
    const date = new Date(d * DAY);
    return Date.UTC(year, date.getUTCMonth(), Math.min(date.getUTCDate(), date.getUTCMonth() === 1 ? 28 : 31));
  };
  const then1985 = (d) => thenIn(d, 1985);
  // Whether a schedule row flies on day d: its weekday in its airline's year, within its date notes.
  function flies(row, d, year = 1985) {
    const [, , , , , , mask, starts, ends] = row;
    const then = thenIn(d, year);
    if (!((mask >> ((new Date(then).getUTCDay() + 6) % 7)) & 1)) return false;
    return !((starts && then < noteDate(starts)) || (ends && then > noteDate(ends)));
  }

  const rad = Math.PI / 180;
  function km([la1, lo1], [la2, lo2]) {
    const a = Math.sin((la2 - la1) * rad / 2) ** 2 + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin((lo2 - lo1) * rad / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(a));
  }
  // Cruise level: a band by distance and type, then the hemispheric rule of the day (eastbound odd thousands, westbound
  // even, and above 29,000 feet only 29, 33, 37 or 41 eastbound and 31, 35 or 39 westbound), the level within the band
  // picked from the flight's number and route, so a flight always cruises where it did yesterday. The Convair 580, a
  // turboprop with a ceiling near 24,000 feet, flew lower; the wide-bodies on the longest legs, higher.
  const HEAVY = new Set(['B747', 'B74S', 'DC10', 'L101', 'L15']);
  function cruiseFt(nm, kind, east = true, seed = '') {
    const [lo, hi] = kind === 'CV580' ? (nm < 100 ? [9, 13] : nm < 200 ? [13, 17] : [17, 23])
      : nm < 150 ? [15, 21] : nm < 300 ? [21, 28] : nm < 700 ? [27, 35]
      : HEAVY.has(kind) ? (nm < 2500 ? [31, 39] : [33, 39]) : [31, 37];
    const levels = [];
    for (let k = lo; k <= hi; k++) {
      const ok = k < 29 ? (k % 2 === 1) === east : east ? (k - 29) % 4 === 0 : (k - 31) % 4 === 0;
      if (ok) levels.push(k * 1000);
    }
    let h = 0;
    for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return levels[h % levels.length];
  }
  // Whether a route heads east (its first heading 0 to 179 degrees).
  const eastbound = ([la1, lo1], [la2, lo2]) => {
    const y = Math.sin((lo2 - lo1) * rad) * Math.cos(la2 * rad);
    const x = Math.cos(la1 * rad) * Math.sin(la2 * rad) - Math.sin(la1 * rad) * Math.cos(la2 * rad) * Math.cos((lo2 - lo1) * rad);
    return ((Math.atan2(y, x) / rad) + 360) % 360 < 180;
  };
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
            if (along < 0.04 || along > 0.96 || !flies(row, d, airline.year)) continue;
            const nm = km(pos[from], pos[to]) / 1.852;
            const cruise = cruiseFt(nm, kind, eastbound(pos[from], pos[to]), `${code}${num}${from}${to}`);
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
            if (depart >= from && depart < to && flies(row, d, airline.year)) out.push({ airline: code, number: num, origin, depart });
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

  // One flight in the air as a plain record.
  function record(f, data) {
    const airline = data.airlines[f.airline];
    const at = along(data.positions[f.from], data.positions[f.to], f.along);
    const climbing = f.alt < f.cruise && f.along < 0.5, descending = f.alt < f.cruise && f.along >= 0.5;
    return {
      simulated: true,
      year: airline.year || 1985,
      flight: `${airline.code} ${f.number}`,
      airline: airline.name,
      airlineCode: f.airline,
      type: (airline.types && airline.types[f.kind]) || f.kind,
      typeCode: f.kind,
      from: f.from,
      to: f.to,
      departedThen: new Date(thenIn(f.d, airline.year) + (f.depart - f.d * DAY)).toISOString().slice(0, 16) + 'Z',
      lat: Math.round(at.lat * 1e4) / 1e4,
      lon: Math.round(at.lon * 1e4) / 1e4,
      track: Math.round(at.track),
      altitudeFt: f.alt,
      groundSpeedKt: Math.round(f.nm / ((f.block - Math.min(20, f.block * 0.35)) / 60) / 5) * 5, // the block's average, less taxi and climb-out
      phase: climbing ? 'climbing' : descending ? 'descending' : 'cruising',
      source: airline.source,
    };
  }

  // The feed: every flight in the air at moment t (now, unless given), as plain records. A few hundred to a thousand.
  function feed(t = Date.now(), data = root.GHOSTFLIGHTS_DATA) {
    return engine(data).airborne(t).map((f) => record(f, data));
  }

  // A moment, as a number, a Date or an ISO string.
  const when = (t) => (t == null ? Date.now() : typeof t === 'number' ? t : Date.parse(t));
  // Whether a flight in the engine's terms matches a query's filters.
  function matches(f, q, data) {
    const a = data.airlines[f.airline];
    if (q.airline) {
      const want = String(q.airline).toLowerCase();
      if (![f.airline, a.code, a.name].some((v) => v && (v.toLowerCase() === want || (want.length > 3 && v.toLowerCase().includes(want))))) return false;
    }
    if (q.flight != null) {
      const want = String(q.flight).toUpperCase().replace(/\s+/g, '');
      if (!(want === `${a.code}${f.number}` || want === String(f.number))) return false;
    }
    if (q.type && ![f.kind, a.types && a.types[f.kind]].some((v) => v && v.toUpperCase() === String(q.type).toUpperCase())) return false;
    if (q.from && f.from !== q.from.toUpperCase()) return false;
    if (q.to && f.to !== q.to.toUpperCase()) return false;
    return true;
  }

  // Ask the feed like a receiver: the flights in the air at q.at (now, unless given) that match, nearest first when
  // given a place.
  //   query({ lat, lon, radius })        within radius nautical miles of a point (radius 100 if not given)
  //   query({ airline, flight, type })   airline: its code (PA1927), its designator (PA) or its name (Pan Am);
  //                                      flight: "NW 17", "NW17" or 17; type: "B742" or "747"
  //   query({ from, to, phase, minAltFt, maxAltFt, limit, at })
  // Each record as feed() has it, with distanceNm when given a place.
  function query(q = {}, data = root.GHOSTFLIGHTS_DATA) {
    const near = q.lat != null && q.lon != null, radius = q.radius != null ? +q.radius : 100;
    let out = engine(data).airborne(when(q.at)).filter((f) => matches(f, q, data)).map((f) => record(f, data));
    if (q.phase) out = out.filter((r) => r.phase === q.phase);
    if (q.minAltFt != null) out = out.filter((r) => r.altitudeFt >= +q.minAltFt);
    if (q.maxAltFt != null) out = out.filter((r) => r.altitudeFt <= +q.maxAltFt);
    if (near) {
      for (const r of out) r.distanceNm = Math.round(km([+q.lat, +q.lon], [r.lat, r.lon]) / 1.852);
      out = out.filter((r) => r.distanceNm <= radius).sort((x, y) => x.distanceNm - y.distanceNm);
    }
    return q.limit ? out.slice(0, +q.limit) : out;
  }

  // The legs in the air at any time between q.start and q.end (an hour from now, unless given), with the same
  // filters as query() except place and phase: when each leaves and lands, not where it is.
  function flights(q = {}, data = root.GHOSTFLIGHTS_DATA) {
    const start = when(q.start), end = q.end != null ? when(q.end) : start + 3600000, out = [];
    for (const [code, airline] of Object.entries(data.airlines)) {
      for (const row of airline.schedule || []) {
        const [num, from, to, leave, offset, block, , , , kind] = row;
        if (!data.positions[from] || !data.positions[to]) continue;
        for (let d = Math.floor(start / DAY) - 1; d <= Math.floor(end / DAY) + 1; d++) {
          const depart = d * DAY + (offset + leave) * 60000, arrive = depart + block * 60000;
          if (arrive <= start || depart >= end || !flies(row, d, airline.year)) continue;
          const f = { airline: code, number: num, from, to, kind, d };
          if (!matches(f, q, data)) continue;
          out.push({ simulated: true, year: airline.year || 1985, flight: `${airline.code} ${num}`, airline: airline.name, airlineCode: code,
            type: (airline.types && airline.types[kind]) || kind, typeCode: kind, from, to,
            departs: new Date(depart).toISOString().slice(0, 16) + 'Z', arrives: new Date(arrive).toISOString().slice(0, 16) + 'Z',
            departedThen: new Date(thenIn(d, airline.year) + (depart - d * DAY)).toISOString().slice(0, 16) + 'Z', source: airline.source });
        }
      }
    }
    out.sort((x, y) => x.departs.localeCompare(y.departs) || x.flight.localeCompare(y.flight));
    return q.limit ? out.slice(0, +q.limit) : out;
  }

  // One flight's positions every q.every seconds (60, unless given) between q.start and q.end (the next hour,
  // unless given), like a track log: its records from query(), with the moment each was at.
  function track(flight, q = {}, data = root.GHOSTFLIGHTS_DATA) {
    const start = when(q.start), end = q.end != null ? when(q.end) : start + 3600000, step = Math.max(10, +(q.every || 60)) * 1000, out = [];
    for (let t = start; t <= end && out.length < 2000; t += step) {
      const r = query({ ...q, flight, at: t, start: undefined, end: undefined }, data)[0];
      if (r) out.push({ at: new Date(t).toISOString().slice(0, 19) + 'Z', ...r });
    }
    return out;
  }

  // The same as an ADS-B receiver's JSON (the field names of adsb.lol and ADS-B Exchange's v2): { now, total, ac }.
  // Still marked simulated, and still no ICAO address ("hex"): nothing here can pass for real traffic.
  function adsb(q = {}, data = root.GHOSTFLIGHTS_DATA) {
    const now = when(q.at), ac = query({ ...q, at: now }, data).map((r) => ({
      flight: r.flight.replace(' ', ''), t: r.typeCode, lat: r.lat, lon: r.lon, alt_baro: r.altitudeFt, gs: r.groundSpeedKt, track: r.track,
      ...(r.distanceNm != null ? { dst: r.distanceNm } : {}), from: r.from, to: r.to, airline: r.airline, year: r.year, simulated: true,
    }));
    return { now, total: ac.length, simulated: true, ac };
  }

  root.Ghostflights = { engine, feed, query, flights, track, adsb, flies, thenIn, then1985, noteDate, cruiseFt, altitude, km };
})(typeof globalThis !== 'undefined' ? globalThis : window);
