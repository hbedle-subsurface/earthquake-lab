/* Scenario generation and physics for the earthquake lab.
   Shared by index.html (the lab) and verify.html (instructor check).
   Everything is deterministic from the student's scenario number, so the
   same number always rebuilds the same earthquake. */

const EQ = (() => {
  const VP = 6.0;            // P-wave speed in the crust, km/s
  const VS = 3.5;            // S-wave speed in the crust, km/s
  const SP_KM = 1 / (1 / VS - 1 / VP);   // km of distance per second of S-P time (8.4)
  const T0 = 10;             // origin time on the record, s
  const REC_LEN = 120;       // record length, s
  const DT = 0.05;           // sample interval, s

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, f) => a + (b - a) * f;

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371, r = Math.PI / 180;
    const dlat = (lat2 - lat1) * r, dlon = (lon2 - lon1) * r;
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dlon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  function azimuth(lat1, lon1, lat2, lon2) {
    const r = Math.PI / 180;
    const y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r);
    const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r);
    return (Math.atan2(y, x) / r + 360) % 360;
  }

  // Approximate deformation front (trench) of the Cascadia subduction zone.
  const TRENCH = [[43.0, -124.9], [44.0, -125.0], [45.0, -125.1], [46.0, -125.2],
                  [47.0, -125.4], [48.0, -125.9], [48.8, -126.5], [49.6, -127.3]];
  function trenchLon(lat) {
    for (let i = 0; i < TRENCH.length - 1; i++) {
      const [la, lo] = TRENCH[i], [lb, lob] = TRENCH[i + 1];
      if (lat >= la && lat <= lb) return lerp(lo, lob, (lat - la) / (lb - la));
    }
    return lat < TRENCH[0][0] ? TRENCH[0][1] : TRENCH[TRENCH.length - 1][1];
  }
  // Simplified depth to the top of the subducting Juan de Fuca plate vs.
  // distance east of the trench (km). A teaching approximation of the
  // published slab models, not a research model.
  const SLAB = [[-60, 0], [0, 0], [50, 7], [100, 18], [150, 32], [200, 48], [250, 70], [300, 95], [350, 120], [400, 145], [500, 195]];
  function slabDepthAtX(x) {
    for (let i = 0; i < SLAB.length - 1; i++) {
      const [xa, za] = SLAB[i], [xb, zb] = SLAB[i + 1];
      if (x >= xa && x <= xb) return lerp(za, zb, (x - xa) / (xb - xa));
    }
    return x < SLAB[0][0] ? 0 : SLAB[SLAB.length - 1][1];
  }
  function xEastOfTrench(lat, lon) {
    return (lon - trenchLon(lat)) * 111.32 * Math.cos(lat * Math.PI / 180);
  }

  const STATIONS = [
    { name: 'Bellingham', lat: 48.75, lon: -122.48 },
    { name: 'Victoria', lat: 48.43, lon: -123.37 },
    { name: 'Port Angeles', lat: 48.12, lon: -123.43 },
    { name: 'Forks', lat: 47.95, lon: -124.39 },
    { name: 'Seattle', lat: 47.61, lon: -122.33 },
    { name: 'Wenatchee', lat: 47.42, lon: -120.31 },
    { name: 'Olympia', lat: 47.04, lon: -122.90 },
    { name: 'Aberdeen', lat: 46.98, lon: -123.82 },
    { name: 'Ellensburg', lat: 47.00, lon: -120.55 },
    { name: 'Yakima', lat: 46.60, lon: -120.51 },
    { name: 'Astoria', lat: 46.19, lon: -123.83 },
    { name: 'Longview', lat: 46.14, lon: -122.94 },
    { name: 'The Dalles', lat: 45.60, lon: -121.18 },
    { name: 'Portland', lat: 45.52, lon: -122.68 },
    { name: 'Tillamook', lat: 45.46, lon: -123.84 },
    { name: 'Salem', lat: 44.94, lon: -123.03 },
    { name: 'Newport', lat: 44.64, lon: -124.05 },
    { name: 'Bend', lat: 44.06, lon: -121.31 },
    { name: 'Eugene', lat: 44.05, lon: -123.09 },
    { name: 'Pendleton', lat: 45.67, lon: -118.79 }
  ];
  // Cities used for the early-warning question, largest first.
  const CITIES = ['Seattle', 'Portland', 'Victoria', 'Olympia', 'Salem', 'Bellingham', 'Eugene', 'Yakima', 'Longview', 'Astoria'];

  const REGIONS = [
    { key: 'seattle', type: 'crustal', where: 'near the Seattle fault zone', lat: [47.52, 47.62], lon: [-122.70, -122.15], depth: [6, 15] },
    { key: 'sthelens', type: 'crustal', where: 'in the St. Helens seismic zone', lat: [46.28, 46.50], lon: [-122.40, -122.20], depth: [5, 14] },
    { key: 'portland', type: 'crustal', where: 'near the Portland Hills fault', lat: [45.45, 45.62], lon: [-122.85, -122.62], depth: [8, 18] },
    { key: 'mollala', type: 'crustal', where: 'near Scotts Mills, east of Salem', lat: [44.95, 45.10], lon: [-122.75, -122.50], depth: [10, 18] },
    { key: 'puget', type: 'intraslab', where: 'deep beneath the southern Puget Sound', lat: [46.95, 47.40], lon: [-123.00, -122.50], depth: null },
    { key: 'puget2', type: 'intraslab', where: 'deep beneath the Puget Sound near Seattle', lat: [47.40, 47.75], lon: [-122.75, -122.35], depth: null }
  ];

  function chooseStations(lat, lon, rng) {
    const cand = STATIONS.map(s => ({ ...s, epi: haversineKm(lat, lon, s.lat, s.lon), az: azimuth(lat, lon, s.lat, s.lon) }))
      .filter(s => s.epi >= 70 && s.epi <= 320);
    const triples = [];
    for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) for (let k = j + 1; k < cand.length; k++) {
      const azs = [cand[i].az, cand[j].az, cand[k].az].sort((a, b) => a - b);
      const gaps = [azs[1] - azs[0], azs[2] - azs[1], 360 - azs[2] + azs[0]];
      const maxGap = Math.max(...gaps);
      const ds = [cand[i].epi, cand[j].epi, cand[k].epi].sort((a, b) => a - b);
      const spread = Math.min(ds[1] - ds[0], ds[2] - ds[1]);   // distinct distances read better
      triples.push({ t: [cand[i], cand[j], cand[k]], score: -maxGap + Math.min(spread, 40) * 0.5 });
    }
    triples.sort((a, b) => b.score - a.score);
    const pick = triples[Math.floor(rng() * Math.min(6, triples.length))];
    return pick.t.sort((a, b) => a.epi - b.epi);
  }

  function richterC(spSeconds) { return 3 * Math.log10(8 * spSeconds) - 2.92; }  // Richter nomogram as written out by Bolt

  function build(seed) {
    const rng = mulberry32(seed * 2654435761 >>> 0);
    const type = rng() < 0.5 ? 'crustal' : 'intraslab';
    const pool = REGIONS.filter(r => r.type === type);
    const reg = pool[Math.floor(rng() * pool.length)];
    const lat = +lerp(reg.lat[0], reg.lat[1], rng()).toFixed(3);
    const lon = +lerp(reg.lon[0], reg.lon[1], rng()).toFixed(3);
    let depth;
    if (reg.depth) depth = Math.round(lerp(reg.depth[0], reg.depth[1], rng()));
    else depth = Math.round(slabDepthAtX(xEastOfTrench(lat, lon)) + lerp(4, 9, rng()));
    const mag = Math.round((4.2 + rng() * 1.3) * 10) / 10;
    const stations = chooseStations(lat, lon, rng).map((s, i) => {
      const hypo = Math.sqrt(s.epi ** 2 + depth ** 2);
      const tp = T0 + hypo / VP, ts = T0 + hypo / VS;
      const sp = ts - tp;
      const amp = Math.pow(10, mag - richterC(sp));
      return { ...s, id: i, hypo, tp, ts, sp, amp };
    });
    const nearest = STATIONS.concat([]).map(s => ({ name: s.name, d: haversineKm(lat, lon, s.lat, s.lon) })).sort((a, b) => a.d - b.d)[0];
    let city = null;
    for (const c of CITIES) {
      const s = STATIONS.find(x => x.name === c);
      const d = haversineKm(lat, lon, s.lat, s.lon);
      if (d >= 40 && d <= 260) { city = { name: c, epi: d }; break; }
    }
    if (!city) city = { name: 'Seattle', epi: haversineKm(lat, lon, 47.61, -122.33) };
    city.warning = warningSeconds(city.epi, depth);
    return { seed, type, region: reg, lat, lon, depth, mag, stations, nearest, city };
  }

  function alertTime(depth) { return Math.sqrt(10 * 10 + depth * depth) / VP + 5; }
  function warningSeconds(epi, depth) { return Math.sqrt(epi * epi + depth * depth) / VS - alertTime(depth); }

  // Synthetic seismogram. Wiggles are a random-phase sum of sinusoids under
  // simple envelopes. Scaled so the largest S-wave peak equals `amp` (mm).
  function trace(tp, ts, amp, seedNum) {
    const rng = mulberry32(seedNum >>> 0);
    const n = Math.round(REC_LEN / DT) + 1;
    const pc = [], sc = [];
    for (let i = 0; i < 4; i++) pc.push([lerp(2.0, 4.5, rng()), rng() * 6.283, lerp(0.5, 1, rng())]);
    for (let i = 0; i < 4; i++) sc.push([lerp(0.8, 2.0, rng()), rng() * 6.283, lerp(0.5, 1, rng())]);
    const y = new Float32Array(n);
    let maxS = 0;
    for (let i = 0; i < n; i++) {
      const t = i * DT;
      let v = (rng() - 0.5) * 0.012 + Math.sin(t * 0.9 + 1) * 0.004;
      if (t > tp) {
        const e = (1 - Math.exp(-(t - tp) / 0.25)) * Math.exp(-(t - tp) / 7);
        let c = 0; for (const [f, ph, a] of pc) c += a * Math.sin(6.283 * f * (t - tp) + ph);
        v += 0.17 * e * c / 2.2;
      }
      if (t > ts) {
        const e = (1 - Math.exp(-(t - ts) / 0.5)) * Math.exp(-(t - ts) / 14);
        let c = 0; for (const [f, ph, a] of sc) c += a * Math.sin(6.283 * f * (t - ts) + ph);
        const s = e * c / 2.2;
        v += s;
      }
      y[i] = v;
      if (t > ts) maxS = Math.max(maxS, Math.abs(v));
    }
    const k = amp / (maxS || 1);
    for (let i = 0; i < n; i++) y[i] *= k;
    return y;
  }

  // Short code an instructor can check. Not secure, only a light deterrent.
  function verifyCode(name, seed) {
    const s = name.trim().toLowerCase().replace(/\s+/g, ' ') + '|' + seed + '|cascadia-eq-lab-v1';
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < s.length; i++) {
      h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
      h2 = Math.imul(h2 + s.charCodeAt(i) * 31, 2246822519) >>> 0;
    }
    const str = (h1.toString(36) + h2.toString(36)).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(8, 'X');
    return str.slice(0, 4) + '-' + str.slice(4, 8);
  }

  const TYPE_LABEL = { crustal: 'Shallow crustal earthquake', intraslab: 'Deep intraslab earthquake', megathrust: 'Megathrust earthquake' };

  return { VP, VS, SP_KM, T0, REC_LEN, DT, build, trace, haversineKm, trenchLon, TRENCH, slabDepthAtX, SLAB, xEastOfTrench,
           richterC, alertTime, warningSeconds, verifyCode, STATIONS, TYPE_LABEL, mulberry32 };
})();
