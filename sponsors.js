// The station's sponsors: invented 1985 businesses near each airline's hubs (never a real one, no real chain, brand or
// person; real places only as where they are), with phone numbers in 555-0100 to 0199, the range kept for fiction.
// And on every channel, Skyarium, looking up over that channel's hub. Each sponsor has a little picture drawn by
// the character generator (ICONS below).
window.SPONSORS = (() => {
  const S = (name, icon, lines, where, phone, bg, ink) => ({ name, icon, lines, where, phone, bg, ink });
  const skyarium = (city) => S('Skyarium', 'sky', [`Look up over ${city}.`, 'Every plane in the sky above you, named.'],
    'For your telephone. skyarium.app', null, '#141838', '#f7c98b');
  return {
    NWA: [
      S('Northstar Lanes', 'bowling', ['32 lanes. Leagues forming now.', 'Moonlight bowling Saturdays.'], 'Bloomington, by the airport', '555-0131', '#16324a', '#ffd23c'),
      S('Hiawatha TV & Radio', 'tv', ['Color sets fixed while you wait.', 'House calls in the Twin Cities.'], 'Hiawatha Avenue', '555-0156', '#3b2a1c', '#ffcf8a'),
      S('Loon Lake Supper Club', 'food', ['Friday fish fry. Walleye and a relish tray.', 'Prime rib every Saturday night.'], 'Forty minutes north', '555-0108', '#1f3a2a', '#e8f2c0'),
      S('Galaxy Arcade', 'arcade', ['Forty games. Tokens four for a dollar.', 'Open till midnight on weekends.'], 'At the mall by the river', '555-0177', '#1a1030', '#ff7ae0'),
      S('Snowbird Sled Rental', 'ski', ['Snowmobiles by the hour or the day.', 'Trail maps free.'], 'Up north, off the interstate', '555-0164', '#2a3c5a', '#cfe8ff'),
      skyarium('Minneapolis'),
    ],
    RC1979: [
      S('Motor City Motor Inn', 'motel', ['Color TV and free ice.', 'Five minutes from Metro.'], 'Romulus, Michigan', '555-0141', '#4a1a14', '#ffb070'),
      S('Riverbluff Bar-B-Q', 'food', ['Dry ribs and pulled pork.', 'Pick up a slab for the flight home.'], 'Memphis, off Airways', '555-0119', '#3a1a0e', '#ffcf6a'),
      S('Wolverine Video', 'video', ['VHS and Beta.', 'Rent two movies, the third one is free.'], 'Dearborn', '555-0185', '#122a4a', '#8ad4ff'),
      S('Roll-A-Rena', 'skate', ['Couples skate at eight.', 'Birthday parties our specialty.'], 'Eight Mile Road', '555-0127', '#3a1240', '#ff9ad8'),
      S('Bluff City Records', 'record', ['New and used LPs.', 'Every blues record you lost.'], 'Downtown Memphis', '555-0193', '#1a1a1a', '#ffd86a'),
      skyarium('Detroit'),
    ],
    EA1926: [
      S('Peachtree Pinball Parlor', 'arcade', ['Forty machines and a jukebox.', 'High score of the week wins a jacket.'], 'Midtown Atlanta', '555-0138', '#401a2a', '#ffa860'),
      S('Magnolia Motor Lodge', 'motel', ['Pool, color TV, airport shuttle.', 'Ask about the layover rate.'], 'Near Hartsfield', '555-0115', '#1e3a2a', '#f0e6b0'),
      S('Concourse Shine', 'shine', ['A shoeshine while you wait for your gate.', 'Out the door in five minutes.'], 'Inside the terminal, Concourse B', '555-0102', '#2a2018', '#e8c89a'),
      S('Biscayne Beach Rentals', 'beach', ['Umbrellas, chairs and floats.', 'By the day or the week.'], 'Miami Beach', '555-0166', '#0e3a52', '#9af0e8'),
      S('Dixie Twin Drive-In', 'film', ['Two features every night.', 'Car speakers or tune your AM radio.'], 'South of the airport', '555-0174', '#160e2a', '#ffe070'),
      skyarium('Atlanta'),
    ],
    WA1926: [
      S('Wasatch Ski & Sport', 'ski', ['Ski rentals and tune-ups.', 'Up the canyon in forty minutes.'], 'Salt Lake City', '555-0123', '#1c3048', '#e6f4ff'),
      S('Runway Car Wash', 'car', ['Hand wax while you fly.', 'Leave your keys at the counter.'], 'Century Boulevard, by LAX', '555-0152', '#3a2c0e', '#ffd84a'),
      S('Starlight Video Rentals', 'video', ['Over two thousand titles.', 'New releases every Tuesday.'], 'West Los Angeles', '555-0189', '#200e38', '#c8a0ff'),
      S('Desert Sands Motel', 'motel', ['Pool. Free coffee. Kids stay free.', 'A block off the Strip.'], 'Las Vegas', '555-0146', '#4a2a10', '#ffc48a'),
      S('Jet Age Coffee Shop', 'food', ['Open all night.', 'Pie and coffee for a dollar.'], 'Across from the airport', '555-0110', '#103a3a', '#ffe6a0'),
      skyarium('Salt Lake City'),
    ],
    PS1949: [
      S('Coast Highway Surf & Skate', 'surf', ['Boards, wax and wetsuits.', 'Skateboard ramp out back.'], 'Huntington Beach', '555-0135', '#0e3448', '#ffd06a'),
      S('Burbank Drive-In', 'film', ['Double features under the stars.', 'Tuesday is carload night.'], 'Five minutes from the airport', '555-0171', '#1a1030', '#ffe070'),
      S('Santa Clara Computer Mart', 'computer', ['Floppy disks, modems and printers.', 'Classes for beginners on Saturdays.'], 'In the valley', '555-0198', '#1a2a2a', '#9af08a'),
      S('Mission Taqueria', 'food', ['Burritos as big as your arm.', 'Open late on the weekend.'], 'San Diego', '555-0114', '#4a1c10', '#ffd07a'),
      S('Golden Hour Tanning', 'beach', ['Get a head start on your tan.', 'Ten visits, ten dollars.'], 'Next to the terminal parking', '555-0159', '#4a2a0a', '#ffb860'),
      skyarium('San Francisco'),
    ],
    OZ1950: [
      S('Gateway Lanes', 'bowling', ['40 lanes and a cocktail lounge.', 'Leagues every weeknight.'], 'St. Louis County', '555-0132', '#2a1c3a', '#ffd23c'),
      S('Riverfront Showboat', 'boat', ['Dinner cruises on the Mississippi.', 'Dixieland band Saturdays.'], 'On the levee', '555-0168', '#10283a', '#f0e6b0'),
      S('Route 66 Frozen Custard', 'cone', ['Concretes so thick we hand them upside down.', 'Open till eleven all summer.'], 'South St. Louis', '555-0120', '#3a1a24', '#ffe0a0'),
      S('Arch City TV Repair', 'tv', ['All makes. Most repairs in a day.', 'Antennas put up too.'], 'Near Lambert Field', '555-0145', '#2a2414', '#ffcf8a'),
      S('Ozark Mountain Cabins', 'cabin', ['Lakefront cabins with a fireplace.', 'Bring the boat.'], 'Down in the Ozarks', '555-0183', '#1e3018', '#d8f0b0'),
      skyarium('St. Louis'),
    ],
  };
})();

// Each sponsor's little picture, drawn by the character generator in a 40-unit box around (0, 0): block shapes and
// strokes, as a 1985 station's graphics could.
window.SPONSOR_ICONS = {
  // A pin and a ball: the pin's head, its thin neck with a stripe, its wide body; the ball beside it.
  bowling(g, ink) { g.fillStyle = ink; g.beginPath(); g.moveTo(-6, 20); g.bezierCurveTo(-16, 8, -10, -2, -4, -6); g.bezierCurveTo(-6, -12, -10, -22, -1, -22); g.bezierCurveTo(8, -22, 4, -12, 2, -6); g.bezierCurveTo(8, -2, 14, 8, 4, 20); g.fill(); g.fillStyle = '#c03020'; g.fillRect(-5, -9, 9, 3); g.fillStyle = '#111'; g.beginPath(); g.arc(15, 12, 8, 0, 7); g.fill(); g.fillStyle = ink; g.fillRect(12, 8, 2, 2); g.fillRect(16, 7, 2, 2); },
  tv(g, ink) { g.strokeStyle = ink; g.lineWidth = 3; g.strokeRect(-18, -12, 36, 26); g.fillStyle = ink; g.fillRect(-13, -7, 22, 16); g.fillRect(-10, 16, 4, 4); g.fillRect(6, 16, 4, 4); g.beginPath(); g.moveTo(-6, -12); g.lineTo(-12, -22); g.moveTo(6, -12); g.lineTo(12, -22); g.stroke(); },
  food(g, ink) { g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.arc(0, 2, 15, 0, 7); g.stroke(); g.fillStyle = ink; g.fillRect(-26, -14, 3, 30); g.fillRect(23, -14, 3, 30); g.fillRect(-29, -14, 2, 9); g.fillRect(-23, -14, 2, 9); },
  arcade(g, ink) { g.fillStyle = ink; g.fillRect(-14, -20, 28, 40); g.fillStyle = '#000'; g.fillRect(-10, -15, 20, 14); g.fillStyle = ink; g.fillRect(-1, 4, 3, 9); g.beginPath(); g.arc(0, 3, 4, 0, 7); g.fillStyle = '#e03030'; g.fill(); },
  ski(g, ink) { g.strokeStyle = ink; g.lineWidth = 4; g.beginPath(); g.moveTo(-20, 14); g.lineTo(20, -14); g.moveTo(-14, 18); g.lineTo(22, -8); g.stroke(); g.fillStyle = ink; g.beginPath(); g.moveTo(-18, -16); g.lineTo(-2, -16); g.lineTo(-10, -2); g.fill(); },
  motel(g, ink) { g.fillStyle = ink; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 17, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r - 4); } g.fill(); g.fillRect(-2, 10, 4, 12); },
  video(g, ink) { g.fillStyle = ink; g.fillRect(-20, -12, 40, 24); g.fillStyle = '#000'; g.beginPath(); g.arc(-8, 0, 5, 0, 7); g.arc(8, 0, 5, 0, 7); g.fill(); g.fillRect(-8, -2, 16, 4); },
  skate(g, ink) { g.fillStyle = ink; g.beginPath(); g.moveTo(-12, -18); g.lineTo(0, -18); g.lineTo(0, 0); g.lineTo(16, 4); g.lineTo(16, 10); g.lineTo(-12, 10); g.fill(); g.beginPath(); g.arc(-8, 16, 4, 0, 7); g.arc(10, 16, 4, 0, 7); g.fill(); },
  record(g, ink) { g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill(); g.strokeStyle = ink; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); },
  shine(g, ink) { g.fillStyle = ink; g.beginPath(); g.moveTo(-20, 8); g.lineTo(-20, -6); g.lineTo(-4, -6); g.lineTo(2, 0); g.lineTo(18, 4); g.lineTo(20, 12); g.lineTo(-20, 12); g.fill(); g.fillStyle = '#fff'; g.fillRect(-14, -2, 6, 2); },
  beach(g, ink) { g.fillStyle = ink; g.beginPath(); g.arc(0, -2, 20, Math.PI, 0); g.fill(); g.fillRect(-1, -2, 3, 22); g.fillStyle = '#ffffff'; g.fillRect(-20, -3, 40, 2); },
  film(g, ink) { g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.arc(-8, -6, 10, 0, 7); g.arc(12, -6, 8, 0, 7); g.stroke(); g.fillStyle = ink; g.fillRect(-20, 6, 30, 14); g.beginPath(); g.moveTo(10, 10); g.lineTo(22, 4); g.lineTo(22, 22); g.lineTo(10, 16); g.fill(); },
  car(g, ink) { g.fillStyle = ink; g.beginPath(); g.moveTo(-22, 8); g.lineTo(-20, -2); g.lineTo(-10, -4); g.lineTo(-4, -12); g.lineTo(10, -12); g.lineTo(16, -3); g.lineTo(22, 0); g.lineTo(22, 8); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(-11, 9, 5, 0, 7); g.arc(12, 9, 5, 0, 7); g.fill(); },
  surf(g, ink) { g.fillStyle = ink; g.beginPath(); g.ellipse(0, 0, 7, 22, 0.5, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-9, 15); g.lineTo(9, -15); g.stroke(); },
  computer(g, ink) { g.strokeStyle = ink; g.lineWidth = 3; g.strokeRect(-16, -18, 32, 22); g.fillStyle = ink; g.fillRect(-11, -13, 10, 2); g.fillRect(-11, -8, 16, 2); g.fillRect(-20, 8, 40, 9); g.fillStyle = '#000'; for (let i = 0; i < 6; i++) g.fillRect(-16 + i * 6, 11, 4, 3); },
  boat(g, ink) { g.fillStyle = ink; g.beginPath(); g.moveTo(-22, 6); g.lineTo(22, 6); g.lineTo(16, 14); g.lineTo(-16, 14); g.fill(); g.fillRect(-14, -4, 26, 10); g.fillRect(-6, -14, 4, 10); g.fillRect(4, -14, 4, 10); g.beginPath(); g.arc(-18, 0, 7, 0, 7); g.lineWidth = 2; g.strokeStyle = ink; g.stroke(); },
  cone(g, ink) { g.fillStyle = ink; g.beginPath(); g.arc(0, -8, 11, Math.PI, 0); g.fill(); g.fillStyle = '#c88a40'; g.beginPath(); g.moveTo(-11, -8); g.lineTo(11, -8); g.lineTo(0, 20); g.fill(); },
  cabin(g, ink) { g.fillStyle = ink; g.beginPath(); g.moveTo(-20, -2); g.lineTo(0, -18); g.lineTo(20, -2); g.fill(); g.fillRect(-16, -2, 32, 20); g.fillStyle = '#000'; g.fillRect(-4, 6, 8, 12); g.fillStyle = ink; g.fillRect(8, -16, 5, 10); },
  // Skyarium: a night sky over a hill, a star and a plane's light.
  sky(g, ink) { g.fillStyle = ink; g.beginPath(); g.moveTo(-34, 22); g.quadraticCurveTo(-6, 6, 34, 18); g.lineTo(34, 24); g.lineTo(-34, 24); g.fill(); for (const [x, y] of [[-24, -14], [14, -20], [4, -6], [26, -6], [-12, -2]]) g.fillRect(x, y, 3, 3); g.fillRect(-30, -18, 22, 2.5); g.fillStyle = '#ff6b5b'; g.beginPath(); g.arc(-6, -17, 4.5, 0, 7); g.fill(); },
};
