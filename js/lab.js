/* Find the Earthquake - lab logic.
   Panel drawing keeps references to its own elements (no getElementById inside
   the panel), so the whole panel can move into a pop-out window and keep working. */
(() => {
  'use strict';
  const SVGNS = 'http://www.w3.org/2000/svg';
  const STORE = 'eqlab-v1';
  const ST_COLORS = ['#0f8b8d', '#8e44ad', '#c48a00'];
  const CP = '#1f6fd1', CS = '#e0531f', CA = '#7b3fbf', RED = '#841617', SLATE = '#5C6670';

  const panelWrap = document.getElementById('panelWrap');
  const panel = document.getElementById('panel');
  const placeholder = document.getElementById('panelPlaceholder');
  const tabsEl = document.getElementById('tabs');
  const stepEl = document.getElementById('step');

  // ---------- state ----------
  const blank = () => ({ name: '', seed: null, step: 0, done: {}, picks: [{}, {}, {}], dists: [null, null, null],
    radii: [null, null, null], epi: null, amps: [null, null, null], mags: [null, null, null], answers: {}, completedAt: null });
  let S = blank();
  try { const raw = localStorage.getItem(STORE); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
  const storageOK = (() => { try { localStorage.setItem('eqlab-test', '1'); const ok = localStorage.getItem('eqlab-test') === '1'; localStorage.removeItem('eqlab-test'); return ok; } catch (e) { return false; } })();
  let saveFailed = !storageOK;
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { if (!saveFailed) { saveFailed = true; showStorageWarning(); } } };
  function showStorageWarning() {
    const col = document.getElementById('stepCol'); if (!col || document.getElementById('storeWarn')) return;
    const w = document.createElement('div'); w.id = 'storeWarn'; w.className = 'warn-banner';
    w.innerHTML = '<strong>Warning: this browser is not saving your work.</strong> If you close or reload this page, you will have to start over. Finish the lab in one sitting, or open it in a regular (not private or incognito) window of Chrome, Edge, Firefox or Safari.';
    col.insertBefore(w, col.firstChild);
  }
  window.addEventListener('beforeunload', e => { if (saveFailed && S.seed != null && !S.completedAt) { e.preventDefault(); e.returnValue = ''; } });

  let SC = null, TR = null;
  const REF = {};   // links panel figures and the typed-entry boxes
  function loadScenario() {
    if (S.seed == null) { SC = null; TR = null; return; }
    SC = EQ.build(S.seed);
    TR = SC.stations.map(st => EQ.trace(st.tp, st.ts, st.amp, S.seed * 7 + st.id * 13 + 1));
  }
  loadScenario();

  // ---------- helpers ----------
  const T = (key, txt) => `<span class="term" data-term="${key}" tabindex="0">${txt}</span>`;
  const fmt = (v, d = 1) => (v == null || isNaN(v)) ? '-' : (+v).toFixed(d);
  function svg(tag, attrs = {}, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs = {}) { const t = svg('text', Object.assign({ x, y }, attrs), parent); t.textContent = s; return t; }
  function svgPoint(s, evt) {
    const pt = s.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(s.getScreenCTM().inverse());
  }
  function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function niceCeil(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p;
    const n = m <= 1 ? 1 : m <= 1.5 ? 1.5 : m <= 2 ? 2 : m <= 3 ? 3 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 6 ? 6 : m <= 8 ? 8 : 10;
    return n * p;
  }
  function slider(label, min, max, step, value, unit, oninput) {
    const wrap = h('label');
    wrap.innerHTML = `${label} `;
    const r = document.createElement('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = value;
    const out = h('span', 'readout');
    const upd = () => { out.textContent = ` ${(+r.value).toFixed(step < 1 ? 1 : 0)} ${unit}`; oninput(+r.value); };
    r.addEventListener('input', upd);
    wrap.append(r, out);
    setTimeout(upd, 0);
    return { wrap, input: r, out };
  }
  const stName = i => SC.stations[i].name;
  const stChip = i => `<span class="chip" style="background:${ST_COLORS[i]}"></span>${stName(i)}`;

  // ---------- map ----------
  const MAP = { lon0: -126.6, lon1: -118.4, lat0: 43.5, lat1: 49.5, kx: 68.8, ky: 100 };
  MAP.W = (MAP.lon1 - MAP.lon0) * MAP.kx; MAP.H = (MAP.lat1 - MAP.lat0) * MAP.ky;
  const proj = (lat, lon) => [(lon - MAP.lon0) * MAP.kx, (MAP.lat1 - lat) * MAP.ky];
  const unproj = (x, y) => [MAP.lat1 - y / MAP.ky, MAP.lon0 + x / MAP.kx];
  const MAINLAND = [[43.5, -124.27], [44.0, -124.13], [44.64, -124.07], [45.0, -124.01], [45.46, -123.97], [45.9, -123.97], [46.0, -123.93], [46.24, -124.02],
    [46.6, -124.06], [46.9, -124.14], [47.2, -124.22], [47.6, -124.4], [47.95, -124.66], [48.38, -124.73], [48.17, -124.0], [48.13, -123.45], [48.08, -122.95], [48.13, -122.77],
    [47.85, -122.68], [47.6, -122.68], [47.35, -122.75], [47.15, -122.85], [47.05, -122.92], [47.2, -122.55], [47.32, -122.42], [47.6, -122.38], [47.85, -122.33],
    [48.05, -122.22], [48.4, -122.5], [48.75, -122.52], [49.0, -122.82], [49.12, -123.12], [49.38, -123.3], [49.5, -123.9], [49.5, -118.4], [43.5, -118.4]];
  const VANISLAND = [[49.5, -126.7], [49.15, -125.95], [48.95, -125.55], [48.6, -124.8], [48.38, -123.95], [48.32, -123.55], [48.42, -123.28], [48.7, -123.45],
    [49.0, -123.75], [49.2, -123.95], [49.5, -124.75]];
  const COLUMBIA = [[46.25, -124.0], [46.2, -123.6], [46.15, -123.2], [46.1, -122.93], [45.85, -122.78], [45.6, -122.7], [45.57, -122.3], [45.65, -121.9],
    [45.7, -121.5], [45.6, -121.18], [45.72, -120.6], [45.9, -119.6], [46.06, -118.92], [46.25, -119.1], [46.6, -119.35]];
  const VOLCANOES = [['Mt. Baker', 48.78, -121.81], ['Glacier Peak', 48.11, -121.11], ['Mt. Rainier', 46.85, -121.76], ['Mt. St. Helens', 46.19, -122.19],
    ['Mt. Adams', 46.2, -121.49], ['Mt. Hood', 45.37, -121.7], ['Mt. Jefferson', 44.67, -121.8], ['Three Sisters', 44.1, -121.77]];
  const CITYDOTS = [['Seattle', 47.61, -122.33], ['Portland', 45.52, -122.68], ['Vancouver', 49.26, -123.1], ['Victoria', 48.43, -123.37], ['Salem', 44.94, -123.03],
    ['Olympia', 47.04, -122.9], ['Eugene', 44.05, -123.09], ['Seaside', 45.99, -123.92]];
  const pts = arr => arr.map(([la, lo]) => proj(la, lo).map(v => v.toFixed(1)).join(',')).join(' ');

  function geoCircle(lat, lon, rKm) {
    const out = [], R = 6371, d = rKm / R, r = Math.PI / 180;
    const la1 = lat * r, lo1 = lon * r;
    for (let a = 0; a <= 360; a += 4) {
      const b = a * r;
      const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(b));
      const lo2 = lo1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
      out.push([la2 / r, lo2 / r]);
    }
    return out;
  }

  function drawMap(parent, opts = {}) {
    const s = svg('svg', { viewBox: `0 0 ${MAP.W.toFixed(0)} ${MAP.H}`, class: 'fig', role: 'img', 'aria-label': 'Map of the Pacific Northwest' }, parent);
    svg('rect', { x: 0, y: 0, width: MAP.W, height: MAP.H, fill: '#cfe6f5' }, s);
    // lat/lon grid
    const g = svg('g', { stroke: '#ffffff', 'stroke-width': 0.7, opacity: 0.7 }, s);
    for (let la = 44; la <= 49; la++) { const [, y] = proj(la, 0); svg('line', { x1: 0, x2: MAP.W, y1: y, y2: y }, g); }
    for (let lo = -126; lo <= -119; lo++) { const [x] = proj(45, lo); svg('line', { x1: x, x2: x, y1: 0, y2: MAP.H }, g); }

    svg('polygon', { points: pts(MAINLAND), fill: '#f3ead7', stroke: '#b9a77f', 'stroke-width': 1 }, s);
    svg('polygon', { points: pts(VANISLAND), fill: '#f3ead7', stroke: '#b9a77f', 'stroke-width': 1 }, s);
    svg('polyline', { points: pts(COLUMBIA), fill: 'none', stroke: '#6fa8d6', 'stroke-width': 2 }, s);
    const gl = { 'font-size': 10, fill: '#3d6f96', 'font-weight': 600, 'paint-order': 'stroke', stroke: '#ffffff', 'stroke-width': 2.5 };
    for (let la = 44; la <= 49; la++) { const [, y] = proj(la, 0); txt(s, 3, y - 3, la + '\u00b0N', gl); }
    for (let lo = -126; lo <= -121; lo++) { const [x] = proj(45, lo); txt(s, x + 2, MAP.H - 5, Math.abs(lo) + '\u00b0W', gl); }
    // borders
    const bd = { fill: 'none', stroke: '#9a8f7a', 'stroke-width': 1, 'stroke-dasharray': '5 4' };
    svg('polyline', Object.assign({ points: pts([[48.3, -124.73], [48.25, -123.6], [48.42, -123.18], [48.75, -123.02], [49.0, -123.05], [49.0, -118.4]]) }, bd), s);
    svg('polyline', Object.assign({ points: pts([[46.0, -118.92], [46.0, -118.4]]) }, bd), s);
    const lab = { 'font-size': 13, fill: '#8a7a5a', 'font-style': 'italic', 'text-anchor': 'middle' };
    txt(s, ...proj(48.35, -119.5), 'WASHINGTON', lab);
    txt(s, ...proj(45.25, -119.9), 'OREGON', lab);
    txt(s, ...proj(49.3, -120.4), 'BRITISH COLUMBIA', lab);
    txt(s, ...proj(44.2, -125.9), 'Pacific Ocean', Object.assign({}, lab, { fill: '#4a7fa8' }));
    // trench with teeth on the overriding plate side
    const tr = EQ.TRENCH.filter(p => p[0] >= 43.3);
    svg('polyline', { points: pts(tr), fill: 'none', stroke: RED, 'stroke-width': 2.2 }, s);
    for (let la = 43.7; la < 49.4; la += 0.45) {
      const lo = EQ.trenchLon(la); const [x, y] = proj(la, lo);
      svg('polygon', { points: `${x},${y - 6} ${x},${y + 6} ${x + 8},${y}`, fill: RED }, s);
    }
    txt(s, ...proj(45.75, -126.55), 'Cascadia', { 'font-size': 12, fill: RED, 'font-weight': 700 });
    txt(s, ...proj(45.6, -126.55), 'subduction', { 'font-size': 12, fill: RED, 'font-weight': 700 });
    txt(s, ...proj(45.45, -126.55), 'zone', { 'font-size': 12, fill: RED, 'font-weight': 700 });
    txt(s, ...proj(46.82, -126.35), 'Juan de Fuca', { 'font-size': 11, fill: '#2c5d85', 'text-anchor': 'start' });
    txt(s, ...proj(46.69, -126.35), 'plate', { 'font-size': 11, fill: '#2c5d85', 'text-anchor': 'start' });
    const [ax, ay] = proj(46.4, -126.4);
    svg('line', { x1: ax, y1: ay, x2: ax + 34, y2: ay - 10, stroke: '#2c5d85', 'stroke-width': 2.5, 'marker-end': 'url(#arr)' }, s);
    const defs = svg('defs', {}, s);
    const mk = svg('marker', { id: 'arr', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, defs);
    svg('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#2c5d85' }, mk);
    txt(s, ...proj(44.6, -119.5), 'North American plate', { 'font-size': 11, fill: '#7a6a4a', 'text-anchor': 'middle' });
    // volcanoes
    for (const [n, la, lo] of VOLCANOES) {
      const [x, y] = proj(la, lo);
      svg('polygon', { points: `${x},${y - 6} ${x - 5.5},${y + 4} ${x + 5.5},${y + 4}`, fill: '#c0392b', stroke: '#fff', 'stroke-width': 0.8 }, s);
      if (opts.volcLabels !== false && ['Mt. Baker', 'Mt. Rainier', 'Mt. St. Helens', 'Mt. Hood'].includes(n))
        txt(s, n === 'Mt. St. Helens' ? x - 7 : x + 7, y + 4, n, { 'font-size': 10, fill: '#8e2c20', 'text-anchor': n === 'Mt. St. Helens' ? 'end' : 'start' });
    }
    // cities
    for (const [n, la, lo] of CITYDOTS) {
      if (opts.hideCity && opts.hideCity.includes(n)) continue;
      const [x, y] = proj(la, lo);
      svg('circle', { cx: x, cy: y, r: 2.6, fill: '#333' }, s);
      txt(s, x - 4, y - 4, n, { 'font-size': 10, fill: '#333', 'text-anchor': 'end' });
    }
    // scale bar
    const sb = svg('g', {}, s); const km100 = 100 / 111.32 * MAP.ky;
    svg('rect', { x: MAP.W - 140, y: MAP.H - 34, width: km100 + 20, height: 26, fill: '#fff', opacity: 0.8, rx: 4 }, sb);
    svg('line', { x1: MAP.W - 130, x2: MAP.W - 130 + km100, y1: MAP.H - 16, y2: MAP.H - 16, stroke: '#333', 'stroke-width': 3 }, sb);
    txt(sb, MAP.W - 130 + km100 / 2, MAP.H - 21, '100 km', { 'font-size': 10, 'text-anchor': 'middle' });
    return s;
  }
  function drawStations(s, labels = true) {
    SC.stations.forEach((st, i) => {
      const [x, y] = proj(st.lat, st.lon);
      svg('polygon', { points: `${x - 7},${y - 6} ${x + 7},${y - 6} ${x},${y + 7}`, fill: ST_COLORS[i], stroke: '#fff', 'stroke-width': 1.2 }, s);
      if (labels) {
        const east = st.lon > -119.6;
        const t = txt(s, east ? x - 9 : x + 9, y + 4, st.name, { 'font-size': 12, 'font-weight': 700, fill: ST_COLORS[i], 'text-anchor': east ? 'end' : 'start' });
        t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', '#fff'); t.setAttribute('stroke-width', 3);
      }
    });
  }
  function star(s, x, y, r, fill) {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1)); }
    return svg('polygon', { points: p.join(' '), fill, stroke: '#fff', 'stroke-width': 1.2 }, s);
  }

  // ---------- seismograms ----------
  // traces: [{y, color, label, scale, scaleLabel}], picks: [{p,s}], amps: [a]
  function drawSeis(parent, cfg) {
    const W = 760, L = 128, R = 14, top = 8, H = cfg.rowH || 112, n = cfg.traces.length, bottom = 36;
    const totalH = top + n * H + bottom;
    const s = svg('svg', { viewBox: `0 0 ${W} ${totalH}`, class: 'fig', role: 'img', 'aria-label': 'Seismograms' }, parent);
    const pxs = (W - L - R) / EQ.REC_LEN;
    const X = t => L + t * pxs;
    // grid
    const g = svg('g', {}, s);
    for (let t = 0; t <= EQ.REC_LEN; t += 5) {
      svg('line', { x1: X(t), x2: X(t), y1: top, y2: top + n * H, stroke: t % 10 ? '#eef0f2' : '#d6d9dd', 'stroke-width': 1 }, g);
      if (t % 10 === 0) txt(g, X(t), top + n * H + 15, String(t), { 'font-size': 11, 'text-anchor': 'middle', fill: SLATE });
    }
    txt(g, L + (W - L - R) / 2, totalH - 4, 'Time after the record starts (seconds)', { 'font-size': 12, 'text-anchor': 'middle', fill: SLATE });
    const overlays = [];
    cfg.traces.forEach((tr, i) => {
      const y0 = top + i * H + H / 2, ys = (H / 2 - 9) / tr.scale;
      svg('rect', { x: L, y: top + i * H + 2, width: W - L - R, height: H - 4, fill: i % 2 ? '#fbfbfc' : '#ffffff', stroke: '#e3e5e8' }, s);
      svg('line', { x1: L, x2: W - R, y1: y0, y2: y0, stroke: '#e3e5e8' }, s);
      let d = '';
      const step = 1;
      for (let k = 0; k < tr.y.length; k += step) {
        const yy = Math.max(top + i * H + 3, Math.min(top + (i + 1) * H - 3, y0 - tr.y[k] * ys));
        d += (k ? 'L' : 'M') + X(k * EQ.DT).toFixed(1) + ' ' + yy.toFixed(1);
      }
      svg('path', { d, fill: 'none', stroke: '#222', 'stroke-width': 0.8 }, s);
      svg('rect', { x: 6, y: y0 - 22, width: 8, height: 44, fill: tr.color, rx: 2 }, s);
      txt(s, 20, y0 - 6, tr.label, { 'font-size': 13, 'font-weight': 700, fill: tr.color });
      if (tr.scaleLabel) txt(s, 20, y0 + 12, tr.scaleLabel, { 'font-size': 10.5, fill: SLATE });
      // amplitude ticks
      svg('line', { x1: L - 4, x2: L, y1: y0 - tr.scale * ys, y2: y0 - tr.scale * ys, stroke: SLATE }, s);
      svg('line', { x1: L - 4, x2: L, y1: y0 + tr.scale * ys, y2: y0 + tr.scale * ys, stroke: SLATE }, s);
      const ov = svg('g', {}, s); overlays.push({ g: ov, y0, ys, i });
      const hit = svg('rect', { x: L, y: top + i * H, width: W - L - R, height: H, fill: 'transparent', style: cfg.onTap ? 'cursor:crosshair' : '' }, s);
      if (cfg.onTap) hit.addEventListener('pointerdown', e => {
        const p = svgPoint(s, e);
        const t = Math.max(0, Math.min(EQ.REC_LEN, (p.x - L) / pxs));
        const v = (y0 - p.y) / ys;
        cfg.onTap(i, t, v);
      });
    });
    function redraw() {
      overlays.forEach(o => {
        while (o.g.firstChild) o.g.removeChild(o.g.firstChild);
        const yt = o.y0 - H / 2 + 6, yb = o.y0 + H / 2 - 6;
        const pk = cfg.picks ? cfg.picks[o.i] : null;
        if (pk && pk.p != null) {
          svg('line', { x1: X(pk.p), x2: X(pk.p), y1: yt, y2: yb, stroke: CP, 'stroke-width': 2.2 }, o.g);
          txt(o.g, X(pk.p) - 3, yt + 10, 'P', { 'font-size': 12, 'font-weight': 700, fill: CP, 'text-anchor': 'end' });
        }
        if (pk && pk.s != null) {
          svg('line', { x1: X(pk.s), x2: X(pk.s), y1: yt, y2: yb, stroke: CS, 'stroke-width': 2.2 }, o.g);
          txt(o.g, X(pk.s) + 3, yt + 10, 'S', { 'font-size': 12, 'font-weight': 700, fill: CS });
        }
        if (pk && pk.p != null && pk.s != null && pk.s > pk.p) {
          const yy = yb - 4;
          svg('line', { x1: X(pk.p), x2: X(pk.s), y1: yy, y2: yy, stroke: '#333', 'stroke-width': 1, 'stroke-dasharray': '3 2' }, o.g);
          const lb = txt(o.g, (X(pk.p) + X(pk.s)) / 2, yy - 3, `S-P = ${(pk.s - pk.p).toFixed(1)} s`, { 'font-size': 11, 'text-anchor': 'middle', fill: '#333', 'font-weight': 600 });
          lb.setAttribute('paint-order', 'stroke'); lb.setAttribute('stroke', '#fff'); lb.setAttribute('stroke-width', 3);
        }
        if (cfg.markers && cfg.markers[o.i]) {
          const m = cfg.markers[o.i];
          [[m.tp, 'P wave arrives', CP, 'end'], [m.ts, 'S wave arrives', CS, 'start']].forEach(([t, l, c, an]) => {
            svg('line', { x1: X(t), x2: X(t), y1: yt, y2: yb, stroke: c, 'stroke-width': 2 }, o.g);
            const tt = txt(o.g, X(t) + (an === 'end' ? -4 : 4), yt + 12, l, { 'font-size': 12, 'font-weight': 700, fill: c, 'text-anchor': an });
            tt.setAttribute('paint-order', 'stroke'); tt.setAttribute('stroke', '#fff'); tt.setAttribute('stroke-width', 3);
          });
          const yy = yb - 6;
          svg('line', { x1: X(m.tp), x2: X(m.ts), y1: yy, y2: yy, stroke: '#333', 'stroke-width': 1.2, 'marker-start': 'url(#ab)', 'marker-end': 'url(#ab)' }, o.g);
          const lb = txt(o.g, (X(m.tp) + X(m.ts)) / 2, yy - 4, `S-P time = ${(m.ts - m.tp).toFixed(1)} s`, { 'font-size': 12, 'text-anchor': 'middle', 'font-weight': 700 });
          lb.setAttribute('paint-order', 'stroke'); lb.setAttribute('stroke', '#fff'); lb.setAttribute('stroke-width', 3);
        }
        const a = cfg.amps ? cfg.amps[o.i] : null;
        if (a != null) {
          [1, -1].forEach(sg => svg('line', { x1: L, x2: W - R, y1: o.y0 - sg * a * o.ys, y2: o.y0 - sg * a * o.ys, stroke: RED, 'stroke-width': 1.4, 'stroke-dasharray': '6 3' }, o.g));
          const lb = txt(o.g, W - R - 4, o.y0 - a * o.ys - 4, `amplitude ${a < 10 ? a.toFixed(1) : a.toFixed(0)} mm`, { 'font-size': 11.5, fill: RED, 'text-anchor': 'end', 'font-weight': 700 });
          lb.setAttribute('paint-order', 'stroke'); lb.setAttribute('stroke', '#fff'); lb.setAttribute('stroke-width', 3);
        }
      });
    }
    const defs = svg('defs', {}, s);
    const mk = svg('marker', { id: 'ab', viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
    svg('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#333' }, mk);
    redraw();
    return { svg: s, redraw };
  }
  function stationTraces(withScale) {
    return SC.stations.map((st, i) => {
      const sc = niceCeil(st.amp * 1.25);
      return { y: TR[i], color: ST_COLORS[i], label: st.name, scale: sc, scaleLabel: withScale ? `scale ±${sc} mm` : 'station' };
    });
  }

  // ---------- step registry ----------
  const STEPS = [];
  const def = o => STEPS.push(o);

  function checkRow(onCheck, nextLabel) {
    const row = h('div', 'check-row');
    const b = h('button', 'btn', 'Check my answers'); b.type = 'button';
    const st = h('span', 'status');
    const nx = h('button', 'btn secondary', nextLabel || 'Next step →'); nx.type = 'button'; nx.hidden = true;
    b.onclick = () => {
      const ok = onCheck();
      st.className = 'status ' + (ok ? 'ok' : 'no');
      st.textContent = ok ? 'All correct - this step is complete.' : 'Not quite yet. Check the notes above, use a hint, and try again.';
      if (ok) { S.done[S.step] = true; save(); renderTabs(); nx.hidden = false; }
    };
    nx.onclick = () => go(S.step + 1);
    if (S.done[S.step]) { nx.hidden = false; st.className = 'status ok'; st.textContent = 'This step is complete.'; }
    row.append(b, st, nx);
    const wrap = h('div'); wrap.append(row, h('div', '', stuckBox()));
    return wrap;
  }
  // multiple-choice question
  function mcq(key, prompt, options, correct, right, wrong) {
    const q = h('div', 'q');
    q.innerHTML = `<div class="prompt">${prompt}</div>` + options.map((o, k) =>
      `<label class="opt"><input type="radio" name="${key}" value="${k}" ${S.answers[key] == k ? 'checked' : ''}> ${o}</label>`).join('') + '<div class="fb"></div>';
    q.addEventListener('change', e => { if (e.target.name === key) { S.answers[key] = +e.target.value; save(); } });
    q.check = () => {
      const v = S.answers[key];
      const ok = v === correct;
      q.className = 'q ' + (ok ? 'good' : 'bad');
      q.querySelector('.fb').innerHTML = v == null ? 'Choose an answer.' : (ok ? right : wrong);
      return ok;
    };
    return q;
  }
  function stuckBox() {
    return `<details class="hint stuck"><summary>Stuck, or something not working?</summary><div>
      <p><strong>Stuck on the science?</strong> Open the hints above, and click any underlined word for a short explanation. Each check tells you which answer to look at again, so change one thing at a time and check again.</p>
      <p><strong>Lost your progress?</strong> Your work is saved in this browser on this computer. A private or incognito window, a different browser or a different computer starts fresh. Go back to the same browser and it will be there.</p>
      <p><strong>Pop-out button does nothing?</strong> Your browser is blocking pop-ups. The lab works fine without them.</p>
      <p><strong>Still stuck?</strong> Send your instructor a Canvas message with your scenario number (${S.seed ?? '-'}), the step, and a screenshot.</p>
    </div></details>`;
  }
  function hint(html, title = 'Need a hint?') { return `<details class="hint poptext"><summary>${title}</summary><div>${html}</div></details>`; }

  // ===== Step 0: Start =====
  def({
    tab: 'Start',
    panel(p) {
      p.append(h('p', 'panel-title', 'The Pacific Northwest'));
      drawMap(p);
    },
    content(c) {
      c.innerHTML = `<h2>Find the Earthquake</h2>
      <div class="poptext">
      <p>The Pacific Northwest has earthquakes every day, and most are too small to feel. The region is above the ${T('cascadia', 'Cascadia subduction zone')}, the red line offshore on the map, where the ${T('juan-de-fuca', 'Juan de Fuca plate')} sinks beneath North America.</p>
      <p>In this lab we work one earthquake the way a seismologist does: read the ${T('seismogram', 'seismograms')} from three stations, find the ${T('epicenter', 'epicenter')}, and measure the ${T('magnitude', 'magnitude')}. Then we look at what kind of earthquake it was and what it means for the people nearby.</p>
      <p>Your earthquake is made from your name, so your numbers are different from everyone else's. Each step checks your answers and has hints. It takes about an hour to an hour and a half, and at the end you get a certificate to upload to Canvas.</p>
      <p class="small">Click any word with a dotted underline for a short explanation.</p>
      </div>
      <div class="warn-box">
        <strong>Before you start</strong>
        <ul>
          <li>Use a laptop or desktop computer with Chrome, Edge, Firefox or Safari.</li>
          <li><strong>Do not use a private or incognito window.</strong> Your work will not be saved.</li>
          <li>Your work saves automatically, so you can stop and come back. Come back on the <strong>same computer and the same browser</strong>.</li>
          <li>When you get your <strong>scenario number</strong>, write it down. It is your backup if anything goes wrong.</li>
        </ul>
      </div>`;
      const box = h('div', 'q');
      if (S.seed == null) {
        box.innerHTML = `<div class="prompt">New to the lab? Type your first and last name the way it appears in Canvas</div>`;
        const inp = document.createElement('input'); inp.className = 'name-in'; inp.type = 'text'; inp.placeholder = 'First and last name'; inp.setAttribute('aria-label', 'Your first and last name');
        const b = h('button', 'btn', 'Make my earthquake'); b.type = 'button'; b.style.marginLeft = '8px';
        const fb = h('div', 'fb');
        b.onclick = () => {
          const nm = inp.value.trim().replace(/\s+/g, ' ');
          if (nm.length < 3 || !/\s/.test(nm)) { fb.textContent = 'Please enter your first and last name.'; box.className = 'q bad'; return; }
          S = blank(); S.name = nm; S.seed = 10000 + Math.floor(Math.random() * 89999); S.done[0] = true; save(); loadScenario();
          alert(`Your scenario number is ${S.seed}.\n\nWrite it down now. If you switch computers or browsers, or lose your work, you can use it with your name on the Start page to get the same earthquake back.`);
          go(1);
        };
        box.append(inp, b, fb);
        const rbox = h('div', 'q');
        rbox.innerHTML = `<div class="prompt">Already started on another computer or browser?</div>
          <p class="small" style="margin:0 0 6px">Type the same name and your scenario number to get the same earthquake back. You will go through the steps again, but with the same numbers, so it goes faster.</p>`;
        const rn = document.createElement('input'); rn.className = 'name-in'; rn.type = 'text'; rn.placeholder = 'First and last name'; rn.setAttribute('aria-label', 'Your first and last name');
        const rs = document.createElement('input'); rs.type = 'number'; rs.placeholder = 'Scenario number'; rs.setAttribute('aria-label', 'Your scenario number');
        rs.style.cssText = 'font:inherit;padding:8px 10px;width:170px;border:1px solid #aab;border-radius:6px;margin-left:8px';
        const rb = h('button', 'btn secondary', 'Continue my earthquake'); rb.type = 'button'; rb.style.marginLeft = '8px';
        const rfb = h('div', 'fb');
        rb.onclick = () => {
          const nm = rn.value.trim().replace(/\s+/g, ' '), sd = parseInt(rs.value, 10);
          if (nm.length < 3 || !/\s/.test(nm)) { rfb.textContent = 'Please enter your first and last name.'; rbox.className = 'q bad'; return; }
          if (!(sd >= 10000 && sd <= 99999)) { rfb.textContent = 'The scenario number has five digits.'; rbox.className = 'q bad'; return; }
          S = blank(); S.name = nm; S.seed = sd; S.done[0] = true; save(); loadScenario(); go(1);
        };
        rbox.append(rn, rs, rb, rfb);
        c.append(box); box.after(rbox); return;
      } else {
        box.innerHTML = `<div class="prompt">Welcome back, ${escapeHtml(S.name)}.</div><p>Your earthquake is scenario number <strong>${S.seed}</strong>. Your work so far is saved.</p>`;
        const b = h('button', 'btn', 'Continue where I left off'); b.type = 'button'; b.onclick = () => go(firstOpen());
        const r = h('button', 'btn secondary', 'Start over'); r.type = 'button'; r.style.marginLeft = '8px';
        r.onclick = () => { if (confirm('Are you sure? Starting over ERASES your work in this browser and gives you a NEW earthquake.\n\nIf you just want to keep going, click Cancel, then "Continue where I left off".')) { S = blank(); save(); loadScenario(); go(0); } };
        box.append(b, r);
      }
      c.append(box);
    }
  });

  // ===== Step 1: Two waves =====
  def({
    tab: '1. Two waves',
    panel(p) {
      p.append(h('p', 'panel-title', 'One seismic station - move it away from the earthquake'));
      const holder = h('div');
      const ctr = h('div', 'controls');
      const rngSeed = 424242;
      const draw = d => {
        holder.innerHTML = '';
        const hypo = Math.sqrt(d * d + 100);
        const tp = EQ.T0 + hypo / EQ.VP, ts = EQ.T0 + hypo / EQ.VS;
        const y = EQ.trace(tp, ts, 1, rngSeed);
        drawSeis(holder, { traces: [{ y, color: '#333', label: 'Station', scale: 1.25, scaleLabel: 'height scaled' }], rowH: 150, markers: [{ tp, ts }] });
      };
      const sl = slider('Distance from the earthquake:', 20, 400, 5, 60, 'km', draw);
      ctr.append(sl.wrap);
      p.append(ctr, holder);
    },
    content(c) {
      c.innerHTML = `<h2>Two kinds of seismic waves</h2>
      <div class="poptext">
      <p>When a ${T('fault', 'fault')} slips, it sends ${T('seismic-wave', 'seismic waves')} out through the Earth in all directions. Two of them matter most for us here.</p>
      <p>The ${T('p-wave', 'P wave')} (primary wave) is a push-pull wave - it squeezes and stretches the rock as it goes - and it's the fastest, about 6 km per second in the crust. The ${T('s-wave', 'S wave')} (secondary wave) shakes the rock side to side and travels slower, about 3.5 km per second. So the P wave always shows up first, and the S wave comes later with bigger shaking.</p>
      <p>The panel shows a ${T('seismogram', 'seismogram')}, the record of ground motion at one station. The flat part at the start is the quiet ground before the earthquake waves arrive. As we move the slider, the station gets farther from the earthquake, and we can watch what happens to the gap between the two arrivals - the ${T('sp-time', 'S-P time')}.</p>
      <p class="small">For this step the wiggles are scaled to the same height at every distance, so we can focus on timing. In step 5 we'll see how they shrink with distance.</p>
      </div>`;
      const q1 = mcq('s1q1', 'Which wave arrives first at the station, no matter how far away it is?',
        ['The S wave', 'The P wave', 'They arrive at the same time', 'It depends on the distance'], 1,
        'Right. The P wave is faster, so it always wins the race.', 'Look at the labels on the seismogram as you move the slider from one end to the other.');
      const q2 = mcq('s1q2', 'What happens to the S-P time as the station gets farther from the earthquake?',
        ['It gets shorter', 'It stays the same', 'It gets longer', 'It disappears'], 2,
        'Right. Both waves leave the fault at the same moment, and the slower S wave falls farther behind with every kilometer. So the S-P time tells us how far away the earthquake is.',
        'Move the slider all the way left, then all the way right, and watch the number on the bracket between the two arrivals.');
      const q3 = mcq('s1q3', 'At about 100 km from the earthquake, what is the S-P time? (Set the slider to 100 km.)',
        ['About 3 seconds', 'About 12 seconds', 'About 30 seconds', 'About 60 seconds'], 1,
        'Right, about 12 seconds. A quick rule of thumb from these wave speeds: each second of S-P time is about 8 km of distance.',
        'Set the slider to 100 km and read the S-P time on the bracket.');
      c.append(q1, q2, q3, checkRow(() => [q1.check(), q2.check(), q3.check()].every(Boolean)));
    }
  });

  // ===== Step 2: Read the seismograms =====
  let pickMode = 'p';
  def({
    tab: '2. Read the seismograms',
    panel(p) {
      p.append(h('p', 'panel-title', 'Your three stations - click to mark the P and S arrivals'));
      const ctr = h('div', 'controls');
      const seg = h('div', 'seg');
      const bp = h('button', '', 'Marking: P wave'), bs = h('button', '', 'Marking: S wave');
      [bp, bs].forEach(b => b.type = 'button');
      const setMode = m => { pickMode = m; bp.className = m === 'p' ? 'on-p' : ''; bs.className = m === 's' ? 'on-s' : ''; };
      bp.onclick = () => setMode('p'); bs.onclick = () => setMode('s'); setMode(pickMode);
      seg.append(bp, bs);
      const clr = h('button', 'btn secondary', 'Clear my marks'); clr.type = 'button'; clr.style.padding = '5px 10px';
      ctr.append(seg, clr, h('span', 'small', 'Each seismogram has its own vertical scale. Time is the same for all three.'));
      p.append(ctr);
      const fig = REF.seis = drawSeis(p, {
        traces: stationTraces(false), picks: S.picks,
        onTap: (i, t) => {
          S.picks[i][pickMode] = Math.round(t * 10) / 10;
          if (pickMode === 'p' && S.picks[i].s == null) { /* stay in P mode until the student switches */ }
          save(); fig.redraw(); updateTable();
        }
      });
      clr.onclick = () => { S.picks = [{}, {}, {}]; save(); fig.redraw(); updateTable(); };
    },
    content(c) {
      c.innerHTML = `<h2>Read the seismograms</h2>
      <div class="poptext">
      <p>Here are the seismograms from your three stations, ${SC.stations.map((s, i) => stChip(i)).join(', ')}. Each one records two minutes of ground motion, and time zero is the same moment for all three, so we can compare them directly.</p>
      <p>Our job is to mark when the P wave arrived and when the S wave arrived at each station. The lab then works out the S-P time for us.</p>
      <div class="how"><strong>How:</strong> choose <em>Marking: P wave</em> above the seismograms, then click where the P wave begins on each station. Then switch to <em>Marking: S wave</em> and do the same. Click again to move a mark. You can also type the times in the table.</div>
      ${hint('Before the P wave, the line is quiet with only tiny wiggles - that\'s background noise. The P wave is the first place where the wiggles clearly start to grow. Mark that first change, not the biggest peak.', 'Hint: finding the P wave')}
      ${hint('After the P wave, the wiggles settle down a little. The S wave is where the shaking suddenly gets much bigger. Mark the start of the big wiggles, not the tallest peak.', 'Hint: finding the S wave')}
      ${hint('The stations are listed from nearest to farthest, so the S-P time should get bigger from the top seismogram to the bottom one. If it doesn\'t, one of the marks is probably off.', 'Hint: a quick check')}
      </div>
      <table class="data" id="pickTable"></table>`;
      const q = h('div', 'q fbonly'); q.innerHTML = '<div class="fb"></div>';
      c.append(q, checkRow(() => {
        const msgs = []; let ok = true;
        SC.stations.forEach((st, i) => {
          const pk = S.picks[i];
          if (pk.p == null || pk.s == null) { ok = false; msgs.push(`${st.name}: mark both the P and the S arrival.`); return; }
          const dp = pk.p - st.tp, ds = pk.s - st.ts;
          if (Math.abs(dp) > 1.5) { ok = false; msgs.push(`${st.name}: the P mark looks ${dp > 0 ? 'a little late - the P wave starts earlier, where the quiet line first changes' : 'too early - that part is still background noise'}.`); }
          if (Math.abs(ds) > 2.0) { ok = false; msgs.push(`${st.name}: the S mark looks ${ds > 0 ? 'late - look a bit earlier, where the big wiggles begin' : 'too early - the big jump in shaking comes a little later'}.`); }
        });
        q.className = 'q ' + (ok ? 'good' : 'bad');
        q.querySelector('.fb').innerHTML = ok ? 'Nice work - all six arrivals are marked well. These S-P times carry forward into the next step.' : msgs.join('<br>');
        return ok;
      }));
      updateTable();
    }
  });
  function updateTable() {
    const t = stepEl.querySelector('#pickTable'); if (!t) return;
    if (!t.dataset.built) {
      t.dataset.built = '1';
      t.innerHTML = '<tr><th>Station</th><th>P arrival (s)</th><th>S arrival (s)</th><th>S-P time (s)</th></tr>' +
        SC.stations.map((st, i) => `<tr><td>${stChip(i)}</td>` +
          ['p', 's'].map(w => `<td><input type="number" class="pk" step="0.1" min="0" max="120" data-i="${i}" data-w="${w}" aria-label="${st.name} ${w.toUpperCase()} arrival in seconds"></td>`).join('') +
          `<td class="sp${i}">-</td></tr>`).join('');
      t.addEventListener('input', e => {
        const el = e.target; if (!el.classList.contains('pk')) return;
        S.picks[+el.dataset.i][el.dataset.w] = el.value === '' ? null : +el.value;
        save(); if (REF.seis) REF.seis.redraw(); updateTable();
      });
    }
    SC.stations.forEach((st, i) => {
      const pk = S.picks[i];
      t.querySelectorAll(`input[data-i="${i}"]`).forEach(inp => {
        if (inp !== document.activeElement) inp.value = pk[inp.dataset.w] == null ? '' : (+pk[inp.dataset.w]).toFixed(1);
      });
      t.querySelector('.sp' + i).textContent = pk.p != null && pk.s != null ? (pk.s - pk.p).toFixed(1) : '-';
    });
  }
  const pickSP = i => S.picks[i].s - S.picks[i].p;

  // ===== Step 3: S-P time to distance =====
  def({
    tab: '3. Time to distance',
    panel(p) {
      p.append(h('p', 'panel-title', 'Travel-time curves - how long each wave takes to travel a distance'));
      const row = h('div', 'panel-row'); const left = h('div', 'grow'), side = h('div', 'side');
      row.append(left, side); p.append(row);
      const W = 640, H = 380, L = 58, R = 18, Tp = 14, B = 46, DMAX = 400, TMAX = 120;
      const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig' }, left);
      const X = d => L + d / DMAX * (W - L - R), Y = t => H - B - t / TMAX * (H - B - Tp);
      for (let d = 0; d <= DMAX; d += 50) { svg('line', { x1: X(d), x2: X(d), y1: Y(0), y2: Y(TMAX), stroke: d % 100 ? '#eef0f2' : '#d6d9dd' }, s); if (d % 100 === 0) txt(s, X(d), H - B + 16, d, { 'font-size': 11, 'text-anchor': 'middle', fill: SLATE }); }
      for (let t = 0; t <= TMAX; t += 10) { svg('line', { x1: X(0), x2: X(DMAX), y1: Y(t), y2: Y(t), stroke: t % 20 ? '#eef0f2' : '#d6d9dd' }, s); if (t % 20 === 0) txt(s, L - 6, Y(t) + 4, t, { 'font-size': 11, 'text-anchor': 'end', fill: SLATE }); }
      txt(s, X(DMAX / 2), H - 8, 'Distance from the earthquake (km)', { 'font-size': 12, 'text-anchor': 'middle', fill: SLATE });
      const yl = txt(s, 14, Y(TMAX / 2), 'Travel time (seconds)', { 'font-size': 12, 'text-anchor': 'middle', fill: SLATE }); yl.setAttribute('transform', `rotate(-90 14 ${Y(TMAX / 2)})`);
      svg('line', { x1: X(0), y1: Y(0), x2: X(DMAX), y2: Y(DMAX / EQ.VP), stroke: CP, 'stroke-width': 2.5 }, s);
      svg('line', { x1: X(0), y1: Y(0), x2: X(DMAX), y2: Y(DMAX / EQ.VS), stroke: CS, 'stroke-width': 2.5 }, s);
      txt(s, X(330), Y(330 / EQ.VP) + 18, 'P wave', { 'font-size': 13, fill: CP, 'font-weight': 700 });
      txt(s, X(300), Y(300 / EQ.VS) - 10, 'S wave', { 'font-size': 13, fill: CS, 'font-weight': 700, 'text-anchor': 'end' });
      const ov = svg('g', {}, s);
      const ro = h('div', 'readout');
      const draw = d => {
        while (ov.firstChild) ov.removeChild(ov.firstChild);
        const tp = d / EQ.VP, ts = d / EQ.VS;
        svg('line', { x1: X(d), x2: X(d), y1: Y(0), y2: Y(TMAX), stroke: '#333', 'stroke-dasharray': '4 3' }, ov);
        svg('line', { x1: X(d), x2: X(d), y1: Y(tp), y2: Y(ts), stroke: '#111', 'stroke-width': 4 }, ov);
        svg('circle', { cx: X(d), cy: Y(tp), r: 4.5, fill: CP }, ov); svg('circle', { cx: X(d), cy: Y(ts), r: 4.5, fill: CS }, ov);
        const lb = txt(ov, X(d) + (d > 300 ? -8 : 8), (Y(tp) + Y(ts)) / 2 + 4, `gap = ${(ts - tp).toFixed(1)} s`, { 'font-size': 13, 'font-weight': 700, 'text-anchor': d > 300 ? 'end' : 'start' });
        lb.setAttribute('paint-order', 'stroke'); lb.setAttribute('stroke', '#fff'); lb.setAttribute('stroke-width', 4);
        ro.innerHTML = `At <strong>${d.toFixed(0)} km</strong> the S wave arrives <strong>${(ts - tp).toFixed(1)} s</strong> after the P wave.`;
      };
      const ctr = h('div', 'controls'); const sl = slider('Distance:', 0, 400, 1, 100, 'km', draw); ctr.append(sl.wrap);
      side.append(ctr, ro);
      const list = h('div'); list.style.marginTop = '10px';
      list.innerHTML = '<p class="small" style="margin:0 0 4px">Your S-P times from step 2:</p>' + SC.stations.map((st, i) => `<div>${stChip(i)}: <strong>${pickSP(i).toFixed(1)} s</strong></div>`).join('');
      side.append(list);
    },
    content(c) {
      c.innerHTML = `<h2>Turn each S-P time into a distance</h2>
      <div class="poptext">
      <p>The graph shows ${T('travel-time', 'travel-time curves')} for the P wave and the S wave. Each line shows how long that wave takes to travel a given distance. The two lines spread apart with distance, and so the gap between them at any distance is the S-P time we'd measure there.</p>
      <div class="how"><strong>How:</strong> move the slider until the gap matches the S-P time for one of your stations, then type that distance in the table. Do this for all three stations.</div>
      ${hint('Here\'s an example. If a station had an S-P time of 20.0 s, we\'d slide until the gap reads about 20.0 s, which happens near 168 km.')}
      ${hint('A shortcut to check your answers: with these wave speeds, every second of S-P time is about 8.4 km. So distance is roughly S-P time × 8.4.', 'Hint: a shortcut to check')}
      <p class="small">This distance is from the station to the point underground where the earthquake started, the ${T('hypocenter', 'hypocenter')}. For shallow earthquakes that's nearly the same as the distance to the epicenter on the surface.</p>
      </div>`;
      const tb = h('table', 'data');
      tb.innerHTML = '<tr><th>Station</th><th>S-P time (s)</th><th>Distance (km)</th></tr>' + SC.stations.map((st, i) =>
        `<tr><td>${stChip(i)}</td><td>${pickSP(i).toFixed(1)}</td><td><input type="number" min="0" max="500" step="1" data-i="${i}" value="${S.dists[i] ?? ''}"></td></tr>`).join('');
      tb.addEventListener('input', e => { const i = +e.target.dataset.i; S.dists[i] = e.target.value === '' ? null : +e.target.value; S.radii[i] = S.dists[i]; save(); });
      const q = h('div', 'q fbonly'); q.innerHTML = '<div class="fb"></div>';
      c.append(tb, q, checkRow(() => {
        const msgs = []; let ok = true;
        SC.stations.forEach((st, i) => {
          const exp = pickSP(i) * EQ.SP_KM, v = S.dists[i];
          if (v == null) { ok = false; msgs.push(`${st.name}: enter a distance.`); return; }
          if (Math.abs(v - exp) > Math.max(8, 0.06 * exp)) { ok = false; msgs.push(`${st.name}: not quite. Slide until the gap reads ${pickSP(i).toFixed(1)} s, then read the distance.`); }
        });
        q.className = 'q ' + (ok ? 'good' : 'bad');
        q.querySelector('.fb').innerHTML = ok ? 'Good. Now we know how far the earthquake was from each station, but not which direction.' : msgs.join('<br>');
        if (ok) { S.radii = S.dists.slice(); save(); }
        return ok;
      }));
    }
  });

  // ===== Step 4: Triangulate =====
  def({
    tab: '4. Find the epicenter',
    panel(p) {
      p.append(h('p', 'panel-title', 'Draw a circle around each station, then click where they meet'));
      const row = h('div', 'panel-row keep'); const left = h('div', 'grow'), side = h('div', 'side');
      left.style.maxWidth = '620px'; row.append(left, side); p.append(row);
      const s = drawMap(left);
      const cg = svg('g', {}, s); drawStations(s);
      const eg = svg('g', {}, s);
      const ro = h('div', 'readout');
      const draw = () => {
        while (cg.firstChild) cg.removeChild(cg.firstChild);
        SC.stations.forEach((st, i) => {
          const r = S.radii[i];
          if (r > 0) svg('polygon', { points: pts(geoCircle(st.lat, st.lon, r)), fill: ST_COLORS[i], 'fill-opacity': 0.07, stroke: ST_COLORS[i], 'stroke-width': 2.2 }, cg);
        });
        while (eg.firstChild) eg.removeChild(eg.firstChild);
        if (S.epi) { const [x, y] = proj(S.epi.lat, S.epi.lon); star(eg, x, y, 11, RED); }
        if (S.done[4]) { const [x, y] = proj(SC.lat, SC.lon); svg('circle', { cx: x, cy: y, r: 6, fill: 'none', stroke: '#111', 'stroke-width': 2 }, eg); txt(eg, x + 9, y + 16, 'actual epicenter', { 'font-size': 11, 'font-weight': 700 }); }
        ro.innerHTML = S.epi ? `Your epicenter: ${S.epi.lat.toFixed(2)}°N, ${Math.abs(S.epi.lon).toFixed(2)}°W` : 'Click the map to place your epicenter.';
      };
      s.addEventListener('pointerdown', e => {
        const pt = svgPoint(s, e); const [lat, lon] = unproj(pt.x, pt.y);
        S.epi = { lat, lon }; save(); draw(); if (REF.syncEpi) REF.syncEpi();
      });
      REF.mapDraw = draw;
      s.style.cursor = 'crosshair';
      const ctr = h('div'); ctr.style.display = 'grid'; ctr.style.gap = '6px';
      SC.stations.forEach((st, i) => {
        const sl = slider(`<span class="chip" style="background:${ST_COLORS[i]}"></span>${st.name}:<br>`, 0, 400, 1, S.radii[i] ?? S.dists[i] ?? 100, 'km', v => { S.radii[i] = v; save(); draw(); });
        sl.input.style.width = '190px'; ctr.append(sl.wrap);
      });
      side.append(ctr, h('div', 'small', '<br>The sliders start at your distances from step 3.'), ro);
      draw();
    },
    content(c) {
      c.innerHTML = `<h2>Find the epicenter</h2>
      <div class="poptext">
      <p>One distance tells us the earthquake happened somewhere on a circle around that station, but not where on the circle. Two circles usually cross in two places. The third circle picks between them, and so where all three circles meet is the ${T('epicenter', 'epicenter')}, the point on the surface above where the fault slipped. This is ${T('triangulation', 'triangulation')}, and seismologists still use the same idea today with many more stations and a computer.</p>
      <div class="how"><strong>How:</strong> the circles are already drawn from your distances. Click the map where all three circles meet to place the red star, then check your answer. You can also type the location below, using the latitude and longitude numbers on the edges of the map.</div>
      ${hint('If the three circles don\'t meet at exactly one point, click in the middle of the small area where all three overlap.')}
      ${hint('When the circles overlap a lot and never meet at a single point, that\'s a clue the earthquake was deep. Our distances are measured to the hypocenter underground, so the circles on the surface come out a little too big. We\'ll come back to this in step 6.', 'Hint: circles that overlap too much')}
      </div>`;
      const ll = h('div', 'q');
      ll.innerHTML = `<div class="prompt">Epicenter location</div>
        Latitude <input type="number" step="0.01" min="43.5" max="49.5" class="lat" aria-label="Epicenter latitude in degrees north"> \u00b0N &nbsp;
        Longitude <input type="number" step="0.01" min="118" max="127" class="lon" aria-label="Epicenter longitude in degrees west"> \u00b0W`;
      const latIn = ll.querySelector('.lat'), lonIn = ll.querySelector('.lon');
      REF.syncEpi = () => { if (S.epi) { if (latIn !== document.activeElement) latIn.value = S.epi.lat.toFixed(2); if (lonIn !== document.activeElement) lonIn.value = Math.abs(S.epi.lon).toFixed(2); } };
      ll.addEventListener('input', () => {
        const la = parseFloat(latIn.value), lo = parseFloat(lonIn.value);
        if (la >= 43.5 && la <= 49.5 && lo >= 118 && lo <= 127) { S.epi = { lat: la, lon: -lo }; save(); if (REF.mapDraw) REF.mapDraw(); }
      });
      REF.syncEpi();
      c.append(ll);
      const q = h('div', 'q fbonly'); q.innerHTML = '<div class="fb"></div>';
      const rv = h('div', 'reveal'); rv.hidden = !S.done[4];
      const fillReveal = () => {
        const err = S.epi ? EQ.haversineKm(S.epi.lat, S.epi.lon, SC.lat, SC.lon) : 0;
        rv.innerHTML = `<strong>Your earthquake:</strong> the epicenter was at ${SC.lat.toFixed(2)}°N, ${Math.abs(SC.lon).toFixed(2)}°W, ${SC.region.where}, about ${Math.round(SC.nearest.d)} km from ${SC.nearest.name}. Your star was ${err.toFixed(0)} km away. The ${T('hypocenter', 'hypocenter')} was <strong>${SC.depth} km</strong> below the surface.`;
      };
      if (S.done[4]) fillReveal();
      c.append(q, checkRow(() => {
        if (!S.epi) { q.className = 'q bad'; q.querySelector('.fb').textContent = 'Click the map, or type a latitude and longitude, to place your epicenter first.'; return false; }
        const err = EQ.haversineKm(S.epi.lat, S.epi.lon, SC.lat, SC.lon);
        const tol = 25 + 0.4 * SC.depth;
        const ok = err <= tol;
        q.className = 'q ' + (ok ? 'good' : 'bad');
        q.querySelector('.fb').innerHTML = ok ? 'Nice work - that\'s the epicenter.' :
          (err < tol * 2.5 ? 'Close, but not quite. Look for the spot where all three circles overlap, not just two.' : 'Not quite. Check that each circle uses the right distance from step 3, then find where all three meet.');
        if (ok) { S.done[4] = true; fillReveal(); rv.hidden = false; renderPanel(); }
        return ok;
      }), rv);
    }
  });

  // ===== Step 5: Magnitude =====
  def({
    tab: '5. How big?',
    panel(p) {
      p.append(h('p', 'panel-title', 'Measure the biggest wiggle, then read the magnitude off the nomogram'));
      const row = h('div', 'panel-row'); const left = h('div', 'grow'), side = h('div', 'side nomo');
      row.append(left, side); p.append(row);
      const nomo = h('div');
      const fig = REF.seis5 = drawSeis(left, {
        traces: stationTraces(true), amps: S.amps, rowH: 170,
        onTap: (i, t, v) => { S.amps[i] = Math.abs(v); save(); fig.redraw(); drawNomo(); if (REF.syncAmps) REF.syncAmps(); }
      });
      REF.nomo = () => drawNomo();
      side.append(nomo);
      function drawNomo() {
        nomo.innerHTML = '';
        const W = 330, H = 612, xl = 62, xm = 165, xr = 262, top = 24, k = 50, VMAX = 9.8;
        const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig', role: 'img', 'aria-label': 'Magnitude nomogram' }, nomo);
        const Y = v => top + (VMAX - v) * k;
        const uOf = d => 2 * EQ.richterC(d / EQ.SP_KM), vOf = a => 2 * Math.log10(a);
        txt(s, xl, 14, 'Distance', { 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle' });
        txt(s, xm, 14, 'Magnitude', { 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', fill: RED });
        txt(s, xr, 14, 'Amplitude', { 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle' });
        svg('line', { x1: xl, x2: xl, y1: Y(uOf(400)), y2: Y(uOf(20)), stroke: '#333', 'stroke-width': 2 }, s);
        [20, 30, 50, 70, 100, 150, 200, 300, 400].forEach(d => { const y = Y(uOf(d)); svg('line', { x1: xl - 6, x2: xl, y1: y, y2: y, stroke: '#333' }, s); txt(s, xl - 9, y + 4, d + ' km', { 'font-size': 10.5, 'text-anchor': 'end' }); });
        svg('line', { x1: xr, x2: xr, y1: Y(vOf(2000)), y2: Y(vOf(0.2)), stroke: '#333', 'stroke-width': 2 }, s);
        [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].forEach(a => { const y = Y(vOf(a)); svg('line', { x1: xr, x2: xr + 6, y1: y, y2: y, stroke: '#333' }, s); txt(s, xr + 9, y + 4, a + ' mm', { 'font-size': 10.5 }); });
        svg('line', { x1: xm, x2: xm, y1: Y(7), y2: Y(2), stroke: RED, 'stroke-width': 2 }, s);
        for (let m = 20; m <= 70; m++) {
          const y = Y(m / 10), major = m % 5 === 0;
          svg('line', { x1: xm - (major ? 9 : 5), x2: xm + (major ? 9 : 5), y1: y, y2: y, stroke: RED, 'stroke-width': major ? 1.6 : 0.8 }, s);
          if (major) { const t = txt(s, xm - 13, y + 4, (m / 10).toFixed(1), { 'font-size': 12, 'text-anchor': 'end', fill: RED, 'font-weight': 700 }); t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', '#fff'); t.setAttribute('stroke-width', 3); }
        }
        if (S.showExample) {
          const y1 = Y(uOf(100)), y2 = Y(vOf(10));
          svg('line', { x1: xl, y1, x2: xr, y2, stroke: '#555', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, s);
          svg('circle', { cx: xm, cy: Y(4.0), r: 6, fill: 'none', stroke: '#555', 'stroke-width': 2 }, s);
          const t = txt(s, xm + 12, Y(4.0) + 18, 'example: M 4.0', { 'font-size': 12, 'font-weight': 700, fill: '#444' });
          t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', '#fff'); t.setAttribute('stroke-width', 3);
        }
        SC.stations.forEach((st, i) => {
          const d = S.dists[i], a = S.amps[i];
          if (d == null || a == null || a <= 0) return;
          const y1 = Y(uOf(Math.max(20, Math.min(400, d)))), y2 = Y(vOf(Math.max(0.2, Math.min(2000, a))));
          svg('line', { x1: xl, y1, x2: xr, y2, stroke: ST_COLORS[i], 'stroke-width': 2 }, s);
          svg('circle', { cx: xl, cy: y1, r: 4, fill: ST_COLORS[i] }, s); svg('circle', { cx: xr, cy: y2, r: 4, fill: ST_COLORS[i] }, s);
        });
        txt(s, W / 2, H - 4, 'Richter nomogram (after Bolt)', { 'font-size': 10, fill: SLATE, 'text-anchor': 'middle' });
      }
      drawNomo();
    },
    content(c) {
      c.innerHTML = `<h2>How big was it?</h2>
      <div class="poptext">
      <p>${T('magnitude', 'Magnitude')} is the size of the earthquake at its source. Charles ${T('richter', 'Richter')} made the first magnitude scale in 1935. He measured the biggest wiggle on a seismogram, the ${T('amplitude', 'amplitude')}, and corrected it for distance, because seismic waves get smaller as they spread out. Look at the scales beside the seismograms - the nearest station has much bigger wiggles than the farthest one, from the same earthquake.</p>
      <p>The ${T('nomogram', 'nomogram')} on the right does Richter's math with a straight line. A line from the distance (left scale) to the amplitude (right scale) crosses the red middle scale at the magnitude.</p>
      <div class="how"><strong>How:</strong> on each seismogram, click at the height of the tallest S-wave peak. The red dashed lines show what you measured, and the nomogram draws a line for that station. You can also type the amplitude in the table. Then read where each line crosses the red scale and type that magnitude in the table.</div>
      <p><button type="button" class="btn secondary" id="exBtn">${S.showExample ? 'Hide the example' : 'Show me an example'}</button></p>
      <div class="how" id="exText" ${S.showExample ? '' : 'hidden'}><strong>Example:</strong> a station 100 km away records a biggest wiggle of 10 mm. The gray dashed line on the nomogram runs from 100 km on the left scale to 10 mm on the right scale, and it crosses the red scale at <strong>4.0</strong>. So that earthquake is about magnitude 4.0. Your stations work the same way.</div>
      ${hint('The top and bottom edges of each seismogram box are the plus and minus scale values. So a peak halfway up a box marked \u00b1200 mm is about 100 mm.')}
      ${hint('All three stations should give nearly the same magnitude, within a few tenths. If one is way off, check its amplitude.', 'Hint: a quick check')}
      <p class="small">Today most earthquakes are reported with ${T('moment-magnitude', 'moment magnitude')}, which is based on the size of the fault that slipped. For earthquakes this size it gives about the same number.</p>
      </div>`;
      c.querySelector('#exBtn').onclick = e => {
        S.showExample = !S.showExample; save();
        e.target.textContent = S.showExample ? 'Hide the example' : 'Show me an example';
        c.querySelector('#exText').hidden = !S.showExample;
        if (REF.nomo) REF.nomo();
      };
      const tb = h('table', 'data');
      tb.innerHTML = '<tr><th>Station</th><th>Distance (km)</th><th>Amplitude (mm)</th><th>Magnitude from nomogram</th></tr>' + SC.stations.map((st, i) =>
        `<tr><td>${stChip(i)}</td><td>${fmt(S.dists[i], 0)}</td><td><input type="number" class="ampin" min="0" step="0.1" data-i="${i}" aria-label="${st.name} amplitude in millimeters"></td><td><input type="number" class="magin" min="0" max="9" step="0.1" data-i="${i}" value="${S.mags[i] ?? ''}" aria-label="${st.name} magnitude"></td></tr>`).join('')
        + '<tr><td colspan="3" style="text-align:right"><strong>Average magnitude</strong></td><td class="avgm">-</td></tr>';
      const upAvg = () => {
        const v = S.mags.filter(x => x != null && !isNaN(x));
        tb.querySelector('.avgm').textContent = v.length === 3 ? (v.reduce((a, b) => a + b, 0) / 3).toFixed(1) : '-';
        SC.stations.forEach((st, i) => {
          const inp = tb.querySelector(`.ampin[data-i="${i}"]`);
          if (inp && inp !== document.activeElement) inp.value = S.amps[i] != null ? (S.amps[i] < 10 ? S.amps[i].toFixed(1) : S.amps[i].toFixed(0)) : '';
        });
      };
      REF.syncAmps = upAvg;
      tb.addEventListener('input', e => {
        const i = +e.target.dataset.i;
        if (e.target.classList.contains('magin')) { S.mags[i] = e.target.value === '' ? null : +e.target.value; save(); upAvg(); }
        if (e.target.classList.contains('ampin')) {
          const v = parseFloat(e.target.value); S.amps[i] = v > 0 ? v : null; save();
          if (REF.seis5) REF.seis5.redraw(); if (REF.nomo) REF.nomo(); upAvg();
        }
      });
      upAvg();
      const q = h('div', 'q fbonly'); q.innerHTML = '<div class="fb"></div>';
      c.append(tb, q, checkRow(() => {
        upAvg();
        const msgs = []; let ok = true;
        SC.stations.forEach((st, i) => {
          const a = S.amps[i], m = S.mags[i];
          if (a == null) { ok = false; msgs.push(`${st.name}: click the seismogram, or type a value in the table, to measure the amplitude.`); return; }
          const r = a / st.amp;
          if (r < 0.75 || r > 1.3) { ok = false; msgs.push(`${st.name}: the amplitude looks ${r < 1 ? 'too small - find the tallest S-wave peak' : 'too big - set it at the top of the tallest peak, not above it'}.`); }
          if (m == null) { ok = false; msgs.push(`${st.name}: enter the magnitude where its line crosses the red scale.`); return; }
          const mLine = Math.log10(a) + EQ.richterC(S.dists[i] / EQ.SP_KM);
          if (Math.abs(m - mLine) > 0.25) { ok = false; msgs.push(`${st.name}: read the red scale again where the ${st.name} line crosses it.`); }
        });
        if (ok) {
          const avg = S.mags.reduce((a, b) => a + b, 0) / 3;
          if (Math.abs(avg - SC.mag) > 0.3) { ok = false; msgs.push('The average is a little off. Check each amplitude mark against the tallest peak.'); }
        }
        q.className = 'q ' + (ok ? 'good' : 'bad');
        q.querySelector('.fb').innerHTML = ok ? `Nice work. The catalog magnitude for your earthquake is <strong>${SC.mag.toFixed(1)}</strong>.` : msgs.join('<br>');
        return ok;
      }));
    }
  });

  // ===== Step 6: What kind of earthquake? =====
  let zoneOn = null;
  def({
    tab: '6. What kind?',
    panel(p) {
      p.append(h('p', 'panel-title', `Cross section through Cascadia at ${SC.lat.toFixed(1)}°N, looking north`));
      const ctr = h('div', 'controls'); const seg = h('div', 'seg');
      const zones = [['crustal', 'Shallow crustal'], ['megathrust', 'Megathrust'], ['intraslab', 'Deep intraslab']];
      const btns = zones.map(([k, l]) => { const b = h('button', '', l); b.type = 'button'; b.onclick = () => { zoneOn = zoneOn === k ? null : k; draw(); }; seg.append(b); return [k, b]; });
      ctr.append(h('span', '', 'Highlight a zone:'), seg); p.append(ctr);
      const W = 760, H = 330, L = 50, R = 16, Tp = 30, B = 40, X0 = -60, X1 = 420, ZMAX = 130;
      const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig' }, p);
      const X = x => L + (x - X0) / (X1 - X0) * (W - L - R), Y = z => Tp + z / ZMAX * (H - Tp - B);
      const slabTop = []; for (let x = X0; x <= X1; x += 5) slabTop.push([x, EQ.slabDepthAtX(x)]);
      const P = arr => arr.map(([x, z]) => X(x).toFixed(1) + ',' + Y(z).toFixed(1)).join(' ');
      const cp = svg('clipPath', { id: 'xsclip' }, svg('defs', {}, s));
      svg('rect', { x: X(X0), y: 0, width: X(X1) - X(X0), height: Y(ZMAX) }, cp);
      const g0c = svg('g', { 'clip-path': 'url(#xsclip)' }, s);
      const g0 = svg('g', {}, s), gz = svg('g', { 'clip-path': 'url(#xsclip)' }, s), g1 = svg('g', {}, s);
      // mantle background
      svg('rect', { x: X(X0), y: Y(0), width: X(X1) - X(X0), height: Y(ZMAX) - Y(0), fill: '#f6e3cf' }, g0c);
      // ocean water (thin)
      svg('rect', { x: X(X0), y: Y(0) - 8, width: X(40) - X(X0), height: 8, fill: '#9fcbe8' }, g0);
      // subducting slab, 45 km thick
      const slabBot = slabTop.map(([x, z]) => [x, z + 45]).reverse();
      svg('polygon', { points: P(slabTop.concat(slabBot)), fill: '#9bb3c9', stroke: '#2c5d85', 'stroke-width': 1.5 }, g0c);
      // North American crust above slab, 35 km thick
      const crust = []; for (let x = X0; x <= X1; x += 5) { const zt = EQ.slabDepthAtX(x); if (x >= 0) crust.push([x, Math.min(35, zt)]); }
      svg('polygon', { points: P([[0, 0]].concat(crust).concat([[X1, 0]])), fill: '#e7d7b5', stroke: '#a08c62', 'stroke-width': 1 }, g0c);
      txt(g0, X(365), Y(17), 'North American plate (crust)', { 'font-size': 12, 'text-anchor': 'middle', fill: '#6b5a35' });
      txt(g0, X(300), Y(60), 'mantle', { 'font-size': 12, 'text-anchor': 'middle', fill: '#9a6b3a' });
      const lt = txt(g0, X(10), Y(28), 'Juan de Fuca plate', { 'font-size': 12, fill: '#1e4a70', 'font-weight': 700 }); lt.setAttribute('transform', `rotate(9 ${X(10)} ${Y(28)})`);
      // trench & arc
      svg('polygon', { points: `${X(0) - 7},${Y(0) - 18} ${X(0) + 7},${Y(0) - 18} ${X(0)},${Y(0) - 6}`, fill: RED }, g0);
      txt(g0, X(0), Y(0) - 21, 'trench', { 'font-size': 11, 'text-anchor': 'middle', fill: RED, 'font-weight': 700 });
      const arcX = 275;
      svg('polygon', { points: `${X(arcX) - 12},${Y(0)} ${X(arcX) + 12},${Y(0)} ${X(arcX)},${Y(0) - 16}`, fill: '#c0392b' }, g0);
      txt(g0, X(arcX), Y(0) - 20, 'Cascade volcanoes', { 'font-size': 11, 'text-anchor': 'middle', fill: '#8e2c20' });
      txt(g0, X(-55), Y(0) - 12, 'Pacific Ocean', { 'font-size': 11, fill: '#2c5d85' });
      txt(g0, X(X0) + 2, H - 6, 'West', { 'font-size': 11, fill: SLATE }); txt(g0, X(X1) - 2, H - 6, 'East', { 'font-size': 11, fill: SLATE, 'text-anchor': 'end' });
      // axes
      for (let z = 0; z <= ZMAX; z += 20) { svg('line', { x1: L - 5, x2: L, y1: Y(z), y2: Y(z), stroke: '#333' }, g0); txt(g0, L - 8, Y(z) + 4, z, { 'font-size': 11, 'text-anchor': 'end', fill: SLATE }); }
      const yl = txt(g0, 12, Y(ZMAX / 2), 'Depth (km)', { 'font-size': 12, 'text-anchor': 'middle', fill: SLATE }); yl.setAttribute('transform', `rotate(-90 12 ${Y(ZMAX / 2)})`);
      for (let x = 0; x <= 400; x += 100) txt(g0, X(x), H - 22, x + ' km', { 'font-size': 10.5, 'text-anchor': 'middle', fill: SLATE });
      txt(g0, X(180), H - 6, 'distance east of the trench', { 'font-size': 11, 'text-anchor': 'middle', fill: SLATE });
      // your earthquake
      const ex = EQ.xEastOfTrench(SC.lat, SC.lon);
      function draw() {
        btns.forEach(([k, b]) => b.className = zoneOn === k ? 'on' : '');
        while (gz.firstChild) gz.removeChild(gz.firstChild);
        while (g1.firstChild) g1.removeChild(g1.firstChild);
        const zs = { fill: '#ffd400', 'fill-opacity': 0.45, stroke: '#b38f00', 'stroke-width': 2 };
        if (zoneOn === 'crustal') svg('polygon', Object.assign({ points: P([[130, 2], [X1, 2], [X1, 30], [130, 30]]) }, zs), gz);
        if (zoneOn === 'megathrust') { const top = slabTop.filter(([x]) => x >= 0 && x <= 130); svg('polygon', Object.assign({ points: P(top.map(([x, z]) => [x, Math.max(0, z - 3)]).concat(top.slice().reverse().map(([x, z]) => [x, z + 4]))) }, zs), gz); }
        if (zoneOn === 'intraslab') { const top = slabTop.filter(([x]) => x >= 150 && x <= 300); svg('polygon', Object.assign({ points: P(top.map(([x, z]) => [x, z + 2]).concat(top.slice().reverse().map(([x, z]) => [x, z + 20]))) }, zs), gz); }
        const cx = X(ex), cy = Y(SC.depth);
        star(g1, cx, cy, 12, RED);
        const lb = txt(g1, cx - 14, cy + 18, `your earthquake, ${SC.depth} km deep`, { 'font-size': 12, 'font-weight': 700, fill: RED, 'text-anchor': 'end' });
        lb.setAttribute('paint-order', 'stroke'); lb.setAttribute('stroke', '#fff'); lb.setAttribute('stroke-width', 4);
      }
      draw();
    },
    content(c) {
      c.innerHTML = `<h2>What kind of earthquake was it?</h2>
      <div class="poptext">
      <p>At the ${T('cascadia', 'Cascadia subduction zone')} the ${T('juan-de-fuca', 'Juan de Fuca plate')} sinks beneath North America a few centimeters per year, about as fast as our fingernails grow. The cross section is a slice through the plates at your earthquake, and the red star is your hypocenter. The buttons highlight the three places earthquakes happen here.</p>
      <p><strong>Shallow ${T('crustal', 'crustal')}</strong> - faults in the North American plate, less than about 30 km deep, like the Seattle fault right under the city.</p>
      <p><strong>${T('megathrust', 'Megathrust')}</strong> - the boundary between the two plates, offshore. This fault can make a magnitude 9 earthquake and a large ${T('tsunami', 'tsunami')}. The last one was on January 26, 1700.</p>
      <p><strong>Deep ${T('intraslab', 'intraslab')}</strong> - inside the sinking plate, about 40 to 70 km down. The 2001 Nisqually earthquake, magnitude 6.8, was one of these.</p>
      ${hint('Start with the depth of your earthquake and where the star falls. Is it in the brown North American crust, on the boundary between the plates, or inside the blue sinking plate?')}
      </div>`;
      const ans = { crustal: 0, megathrust: 1, intraslab: 2 }[SC.type];
      const q1 = mcq('s6q1', `Based on its depth (${SC.depth} km) and where it falls on the cross section, what kind of earthquake is yours?`,
        ['A shallow crustal earthquake in the North American plate', 'A megathrust earthquake on the plate boundary', 'A deep intraslab earthquake inside the sinking Juan de Fuca plate'], ans,
        SC.type === 'crustal' ? 'Right. Shallow crustal faults are close to the surface, and so even a moderate earthquake can shake the ground hard right above it.' : 'Right. Intraslab earthquakes are deep, so the shaking is spread over a wide area but is usually a bit gentler right above them than a shallow earthquake of the same magnitude.',
        'Not quite. Compare the depth of your earthquake with the depths of the three zones, using the buttons to highlight each one.');
      const q2 = mcq('s6q2', 'Which of the three kinds of Cascadia earthquakes can reach magnitude 9 and make a large tsunami?',
        ['Shallow crustal', 'Megathrust', 'Deep intraslab', 'All three equally'], 1,
        'Right. The megathrust is a fault more than 1,000 km long, and when it slips it can lift the seafloor several meters, which moves the whole column of ocean water above it.',
        'Think about which fault is the longest and which one is under the ocean.');
      const q3 = mcq('s6q3', 'In step 4, why did the circles overlap more for deep earthquakes than for shallow ones?',
        ['The seismometers were broken', 'Our distances were measured to the hypocenter underground, so they were longer than the distances along the surface', 'Seismic waves travel faster at depth', 'Deep earthquakes have no epicenter'], 1,
        'Right. The S-P time gives the straight-line distance to the hypocenter. For a deep earthquake that\'s longer than the distance along the surface to the epicenter, so the circles come out too big and overlap.',
        'Think about where the distance from the S-P time is measured to - the epicenter on the surface, or the hypocenter underground?');
      c.append(q1, q2, q3, checkRow(() => [q1.check(), q2.check(), q3.check()].every(Boolean)));
    }
  });

  // ===== Step 7: Seconds of warning =====
  def({
    tab: '7. Seconds of warning',
    panel(p) {
      p.append(h('p', 'panel-title', 'Earthquake early warning - when the alert goes out vs. when the S wave arrives'));
      const row = h('div', 'panel-row'); const left = h('div', 'grow'), side = h('div', 'side');
      row.append(left, side); p.append(row);
      const W = 640, H = 360, L = 58, R = 18, Tp = 14, B = 46, DMAX = 300, TMAX = 100, dep = SC.depth;
      const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig' }, left);
      const X = d => L + d / DMAX * (W - L - R), Y = t => H - B - t / TMAX * (H - B - Tp);
      for (let d = 0; d <= DMAX; d += 50) { svg('line', { x1: X(d), x2: X(d), y1: Y(0), y2: Y(TMAX), stroke: '#e3e5e8' }, s); txt(s, X(d), H - B + 16, d, { 'font-size': 11, 'text-anchor': 'middle', fill: SLATE }); }
      for (let t = 0; t <= TMAX; t += 10) { svg('line', { x1: X(0), x2: X(DMAX), y1: Y(t), y2: Y(t), stroke: '#e3e5e8' }, s); if (t % 20 === 0) txt(s, L - 6, Y(t) + 4, t, { 'font-size': 11, 'text-anchor': 'end', fill: SLATE }); }
      txt(s, X(DMAX / 2), H - 8, 'Distance from your epicenter (km)', { 'font-size': 12, 'text-anchor': 'middle', fill: SLATE });
      const yl = txt(s, 14, Y(TMAX / 2), 'Seconds after the earthquake starts', { 'font-size': 12, 'text-anchor': 'middle', fill: SLATE }); yl.setAttribute('transform', `rotate(-90 14 ${Y(TMAX / 2)})`);
      const curve = v => { let d = ''; for (let x = 0; x <= DMAX; x += 3) d += (x ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(Math.sqrt(x * x + dep * dep) / v).toFixed(1); return d; };
      svg('path', { d: curve(EQ.VP), fill: 'none', stroke: CP, 'stroke-width': 2.5 }, s);
      svg('path', { d: curve(EQ.VS), fill: 'none', stroke: CS, 'stroke-width': 2.5 }, s);
      const ta = EQ.alertTime(dep);
      svg('line', { x1: X(0), x2: X(DMAX), y1: Y(ta), y2: Y(ta), stroke: CA, 'stroke-width': 2.5, 'stroke-dasharray': '7 4' }, s);
      txt(s, X(DMAX) - 4, Y(ta) - 6, `alert sent at ${ta.toFixed(0)} s`, { 'font-size': 12, fill: CA, 'font-weight': 700, 'text-anchor': 'end' });
      txt(s, X(250), Y(Math.sqrt(250 * 250 + dep * dep) / EQ.VP) + 18, 'P wave', { 'font-size': 12, fill: CP, 'font-weight': 700 });
      txt(s, X(200), Y(Math.sqrt(200 * 200 + dep * dep) / EQ.VS) - 10, 'S wave (strong shaking)', { 'font-size': 12, fill: CS, 'font-weight': 700, 'text-anchor': 'end' });
      const ov = svg('g', {}, s);
      const ro = h('div', 'readout');
      const draw = d => {
        while (ov.firstChild) ov.removeChild(ov.firstChild);
        const tsd = Math.sqrt(d * d + dep * dep) / EQ.VS, w = tsd - ta;
        svg('line', { x1: X(d), x2: X(d), y1: Y(0), y2: Y(TMAX), stroke: '#333', 'stroke-dasharray': '4 3' }, ov);
        if (w > 0) svg('rect', { x: X(d) - 6, y: Y(tsd), width: 12, height: Y(ta) - Y(tsd), fill: '#2fb36a', opacity: 0.8 }, ov);
        svg('circle', { cx: X(d), cy: Y(tsd), r: 4.5, fill: CS }, ov);
        ro.innerHTML = w > 0 ? `At <strong>${d.toFixed(0)} km</strong>, the alert arrives about <strong>${w.toFixed(0)} seconds</strong> before the S wave.` :
          `At <strong>${d.toFixed(0)} km</strong>, the S wave arrives before the alert can go out - no warning.`;
      };
      const ctr = h('div', 'controls'); const sl = slider('Distance:', 0, 300, 1, 120, 'km', draw); ctr.append(sl.wrap);
      side.append(ctr, ro, h('div', 'small', `<br>The green bar is the warning time. This model assumes the nearest station is 10 km from the epicenter and the system takes about 5 seconds to detect the earthquake and send the alert. Your earthquake was ${dep} km deep.`));
    },
    content(c) {
      const city = SC.city;
      c.innerHTML = `<h2>Seconds of warning</h2>
      <div class="poptext">
      <p>The gap between the P wave and the S wave has a very practical use. Stations near the epicenter feel the fast P wave first, and a computer can work out where the earthquake is and how big it is within a few seconds. An alert sent by phone travels much faster than the seismic waves, so it can arrive before the strong shaking of the S wave reaches places farther away. This is ${T('early-warning', 'earthquake early warning')}, and ShakeAlert is the system for Washington, Oregon and California.</p>
      <p>The graph shows when the alert goes out (purple) and when the S wave arrives at each distance (orange). The space between them is the warning time. A few seconds is enough to drop, cover and hold on, for a surgeon to stop, for trains to slow down and for fire station doors to open.</p>
      ${hint(`Slide to the distance of ${city.name} and read the warning time.`)}
      </div>`;
      const q1 = h('div', 'q');
      q1.innerHTML = `<div class="prompt">${city.name} is about <strong>${Math.round(city.epi)} km</strong> from your epicenter. About how many seconds of warning would people there get before the S wave arrives?</div>
        <input type="number" step="1" value="${S.answers.s7w ?? ''}"> seconds <div class="fb"></div>`;
      q1.querySelector('input').addEventListener('input', e => { S.answers.s7w = e.target.value === '' ? null : +e.target.value; save(); });
      q1.check = () => {
        const v = S.answers.s7w, exp = Math.max(0, city.warning);
        const ok = v != null && Math.abs(v - exp) <= 2.5;
        q1.className = 'q ' + (ok ? 'good' : 'bad');
        q1.querySelector('.fb').innerHTML = v == null ? 'Enter a number.' : ok ? `Right, about ${Math.round(exp)} seconds.` : `Set the slider to ${Math.round(city.epi)} km and read the warning time.`;
        return ok;
      };
      const q2 = mcq('s7q2', 'Close to the epicenter the warning time drops to zero. Why?',
        ['The P wave doesn\'t reach places that close', 'The S wave arrives there before the system can detect the earthquake and send the alert', 'Phones don\'t work near earthquakes', 'Shaking is weaker near the epicenter'], 1,
        'Right. Right above the earthquake there is no time to spare, and so people nearest the fault get the least warning. That\'s why knowing to drop, cover and hold on matters even with an alert system.',
        'Look at the graph near 0 km. Which comes first there, the purple alert line or the orange S wave?');
      c.append(q1, q2, checkRow(() => [q1.check(), q2.check()].every(Boolean)));
    }
  });

  // ===== Step 8: Magnitude and energy =====
  def({
    tab: '8. How big is big?',
    panel(p) {
      p.append(h('p', 'panel-title', 'Seismic energy released, compared with your earthquake'));
      const ctr = h('div', 'controls'); p.append(ctr);
      const W = 760, H = 300, L = 230, R = 40, Tp = 10, B = 40, EMIN = -3, EMAX = 8;
      const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig' }, p);
      const X = e => L + (e - EMIN) / (EMAX - EMIN) * (W - L - R);
      const TICK = { '-2': '1/100', '0': '1', '2': '100', '4': '10,000', '6': '1 million', '8': '100 million' };
      for (let e = EMIN; e <= EMAX; e++) {
        svg('line', { x1: X(e), x2: X(e), y1: Tp, y2: H - B, stroke: e === 0 ? '#999' : '#e3e5e8' }, s);
        if (TICK[e] != null) txt(s, X(e), H - B + 15, TICK[e], { 'font-size': 10.5, 'text-anchor': 'middle', fill: SLATE });
      }
      txt(s, (X(EMIN) + X(EMAX)) / 2, H - 6, 'times the energy of your earthquake (each grid line is 10 times more)', { 'font-size': 12, 'text-anchor': 'middle', fill: SLATE });
      const bars = svg('g', {}, s);
      const rows = [
        ['Your earthquake', SC.mag, RED, 'fixed'],
        ['Slider earthquake', null, '#1f6fd1', 'slider'],
        ['Pawnee, Oklahoma, 2016', 5.8, '#c48a00', 'fixed'],
        ['Nisqually, Washington, 2001', 6.8, '#0f8b8d', 'fixed'],
        ['Cascadia megathrust, 1700', 9.0, '#8e44ad', 'fixed']
      ];
      const ro = h('div', 'readout');
      const fmtX = r => r >= 1 ? (r < 10 ? r.toFixed(1) : Math.round(r).toLocaleString('en-US')) : '1/' + Math.round(1 / r).toLocaleString('en-US');
      const draw = mSl => {
        while (bars.firstChild) bars.removeChild(bars.firstChild);
        const rh = (H - Tp - B) / rows.length;
        rows.forEach(([lab, m, col], k) => {
          const mm = m == null ? mSl : m;
          const e = 1.5 * (mm - SC.mag), y = Tp + k * rh + rh * 0.2;
          txt(bars, L - 8, y + rh * 0.42, `${lab} (M${mm.toFixed(1)})`, { 'font-size': 12.5, 'text-anchor': 'end', 'font-weight': k < 2 ? 700 : 400, fill: col });
          const x0 = X(EMIN), x1 = X(Math.max(EMIN, Math.min(EMAX, e)));
          svg('rect', { x: x0, y, width: Math.max(2, x1 - x0), height: rh * 0.6, fill: col, rx: 3 }, bars);
        });
        const r = Math.pow(10, 1.5 * (mSl - SC.mag));
        ro.innerHTML = `A magnitude <strong>${mSl.toFixed(1)}</strong> earthquake releases about <strong>${fmtX(r)}</strong> times the energy of your magnitude ${SC.mag.toFixed(1)}.`;
      };
      const sl = slider('Slider earthquake magnitude:', 3, 9.5, 0.1, Math.min(9.5, SC.mag + 1), '', draw);
      ctr.append(sl.wrap, ro);
    },
    content(c) {
      c.innerHTML = `<h2>How big is big?</h2>
      <div class="poptext">
      <p>Because magnitude is ${T('logarithmic', 'logarithmic')}, small changes in the number mean big changes in the earthquake. Each step of 1 in magnitude means wiggles 10 times bigger on a seismometer, and about 32 times more ${T('energy', 'seismic energy')} released. So a magnitude 6 releases about 32 times the energy of a magnitude 5, and about 1,000 times the energy of a magnitude 4.</p>
      <p>The bars compare your earthquake with a few real ones. The 2016 Pawnee earthquake, magnitude 5.8, is the largest recorded in Oklahoma, and it was an ${T('induced', 'induced earthquake')} linked to wastewater injection. The 2001 Nisqually earthquake was a deep intraslab earthquake beneath the Puget Sound. The 1700 Cascadia earthquake was a megathrust earthquake of about magnitude 9, and we know its date because its tsunami reached Japan, where people wrote it down.</p>
      <p>The bar axis uses a logarithmic scale, where each grid line is 10 times the one before it. On an ordinary scale, the Cascadia bar would be millions of times longer than yours.</p>
      ${hint('Use the slider: set it to one magnitude, read the energy, then move it up by exactly 1.0 and see how many times bigger the number gets.')}
      </div>`;
      const q1 = mcq('s8q1', 'Going up by 1 in magnitude releases about how many times more energy?',
        ['2 times', '10 times', '32 times', '1,000 times'], 2,
        'Right, about 32 times. The wiggles on the seismogram get 10 times bigger, and the energy grows faster than that.',
        'Set the slider to your magnitude, then move it up by exactly 1.0 and read the readout.');
      const q2 = mcq('s8q2', 'About how many times more energy did the 1700 Cascadia earthquake (about M9.0) release than the 2001 Nisqually earthquake (M6.8)?',
        ['About 20 times', 'About 200 times', 'About 2,000 times', 'About 20,000 times'], 2,
        'Right, about 2,000 times. A Cascadia megathrust earthquake would also shake the ground much longer, several minutes, because the fault that slips is hundreds of kilometers long.',
        'That\'s 2.2 steps of magnitude. Two steps is about 32 × 32, which is about 1,000, and the extra 0.2 roughly doubles it.');
      const q3 = mcq('s8q3', `Could your magnitude ${SC.mag.toFixed(1)} earthquake have made a damaging tsunami?`,
        ['Yes, any earthquake near the ocean makes a tsunami', 'No - it was too small and didn\'t lift a large area of seafloor', 'Yes, because it happened in the Pacific Northwest', 'Only if it happened at night'], 1,
        'Right. Damaging tsunamis come from large earthquakes, usually above magnitude 7 or so, that move a big area of the seafloor up or down. Our earthquake was much smaller than that.',
        'Think back to step 6. Which kind of earthquake makes large tsunamis, and how big does it need to be?');
      c.append(q1, q2, q3, checkRow(() => [q1.check(), q2.check(), q3.check()].every(Boolean), 'Get my certificate →'));
    }
  });

  // ===== Step 9: Certificate =====
  def({
    tab: 'Certificate',
    panel(p) {
      p.append(h('p', 'panel-title', 'Your earthquake'));
      const wrap = h('div'); wrap.style.maxWidth = '560px'; wrap.style.margin = '0 auto'; p.append(wrap);
      const s = drawMap(wrap); drawStations(s);
      SC.stations.forEach((st, i) => { if (S.radii[i]) svg('polygon', { points: pts(geoCircle(st.lat, st.lon, S.radii[i])), fill: 'none', stroke: ST_COLORS[i], 'stroke-width': 1.5, opacity: 0.8 }, s); });
      const [x, y] = proj(SC.lat, SC.lon); star(s, x, y, 12, RED);
    },
    content(c) {
      if (!S.completedAt) { S.completedAt = new Date().toISOString(); save(); }
      const when = new Date(S.completedAt);
      const code = EQ.verifyCode(S.name, S.seed);
      const err = S.epi ? EQ.haversineKm(S.epi.lat, S.epi.lon, SC.lat, SC.lon) : null;
      const avg = S.mags.reduce((a, b) => a + (b || 0), 0) / 3;
      c.innerHTML = `<h2 class="no-print">Your certificate</h2>
      <div class="warn-box no-print"><strong>You are not done until the certificate is in Canvas.</strong>
        <ol style="margin:4px 0 0 18px;padding:0">
          <li>Check that your name is spelled right. <button type="button" class="linkbtn" id="fixName">Fix my name</button></li>
          <li>Click <em>Print or save as PDF</em> below and save the PDF, or take a screenshot that shows the whole certificate, including the verification code at the bottom.</li>
          <li>Upload it to the Canvas assignment, and check that the upload went through.</li>
        </ol></div>
      <div class="cert">
        <h3>Certified Virtual Seismologist</h3>
        <p class="sub">Find the Earthquake - A Cascadia Seismology Lab</p>
        <p class="who">${escapeHtml(S.name)}</p>
        <p class="sub">completed all eight steps on ${when.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
        <div class="cert-grid"><table class="data">
          <tr><th>Station</th><th>S-P time (s)</th><th>Distance (km)</th><th>Amplitude (mm)</th><th>Magnitude</th></tr>
          ${SC.stations.map((st, i) => `<tr><td>${st.name}</td><td>${fmt(pickSP(i))}</td><td>${fmt(S.dists[i], 0)}</td><td>${S.amps[i] < 10 ? fmt(S.amps[i]) : fmt(S.amps[i], 0)}</td><td>${fmt(S.mags[i])}</td></tr>`).join('')}
        </table>
        <table class="data">
          <tr><th>Epicenter found</th><td>${S.epi ? S.epi.lat.toFixed(2) + '°N, ' + Math.abs(S.epi.lon).toFixed(2) + '°W' : '-'}</td></tr>
          <tr><th>Distance to true epicenter</th><td>${err != null ? err.toFixed(0) + ' km' : '-'}</td></tr>
          <tr><th>Depth</th><td>${SC.depth} km</td></tr>
          <tr><th>Magnitude found</th><td>${avg.toFixed(1)} (catalog ${SC.mag.toFixed(1)})</td></tr>
          <tr><th>Type of earthquake</th><td>${EQ.TYPE_LABEL[SC.type]}</td></tr>
          <tr><th>Warning time at ${SC.city.name}</th><td>${fmt(S.answers.s7w, 0)} s</td></tr>
        </table></div>
        <p class="code"><span class="small">Scenario</span> ${S.seed} &nbsp; <span class="small">Verification code</span> ${code}</p>
      </div>`;
      const fx = c.querySelector('#fixName');
      if (fx) fx.onclick = () => {
        const nm = (prompt('Type your first and last name the way it appears in Canvas:', S.name) || '').trim().replace(/\s+/g, ' ');
        if (nm.length >= 3 && /\s/.test(nm)) { S.name = nm; save(); go(S.step); }
      };
      const row = h('div', 'check-row');
      const pb = h('button', 'btn', 'Print or save as PDF'); pb.type = 'button'; pb.onclick = () => window.print();
      row.append(pb); c.append(row);
    }
  });

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

  // ---------- navigation ----------
  const lastIdx = STEPS.length - 1;
  function unlocked(i) {
    if (i === 0) return true;
    if (S.seed == null) return false;
    if (i === lastIdx) { for (let k = 1; k < lastIdx; k++) if (!S.done[k]) return false; return true; }
    return !!S.done[i - 1];
  }
  function firstOpen() { for (let i = 1; i <= lastIdx; i++) if (!S.done[i] && unlocked(i)) return i; return lastIdx; }
  function renderTabs() {
    tabsEl.innerHTML = '';
    STEPS.forEach((st, i) => {
      const b = h('button', '', st.tab); b.type = 'button';
      if (i === S.step) b.classList.add('active');
      if (S.done[i] && i > 0 && i < lastIdx) b.classList.add('done');
      b.disabled = !unlocked(i);
      b.onclick = () => go(i);
      tabsEl.append(b);
    });
  }
  function renderPanel() {
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    STEPS[S.step].panel(panel);
  }
  function go(i) {
    if (!unlocked(i)) i = 0;
    S.step = i; save();
    document.querySelector('main').classList.toggle('certmode', i === lastIdx);
    renderTabs(); renderPanel();
    stepEl.innerHTML = '';
    STEPS[i].content(stepEl);
    if (i > 0 && i < lastIdx && S.seed != null) {
      const bar = h('div', 'scen-bar', `${escapeHtml(S.name)} - scenario number <strong>${S.seed}</strong> (write it down). ${saveFailed ? 'This browser is not saving your work.' : 'Your work saves automatically in this browser.'}`);
      stepEl.insertBefore(bar, stepEl.firstChild);
    }
    if (saveFailed) showStorageWarning();
    broadcast();
    const col = document.getElementById('stepCol'); if (col) col.scrollTop = 0;
    if (i > 0 && window.innerWidth < 1000) { const top = tabsEl.getBoundingClientRect().top; if (top < 0) tabsEl.scrollIntoView({ behavior: 'smooth' }); }
  }

  // ---------- pop-outs ----------
  let bc = null; try { bc = new BroadcastChannel('eqlab'); } catch (e) { /* not supported */ }
  function broadcast() {
    if (!bc) return;
    const parts = [...stepEl.querySelectorAll('h2, .poptext')].map(n => n.outerHTML).join('');
    bc.postMessage({ type: 'text', html: parts.replace(/<details class="hint poptext">/g, '<details class="hint poptext" open>'), title: STEPS[S.step].tab });
  }
  if (bc) bc.onmessage = e => { if (e.data && e.data.type === 'hello') broadcast(); };
  document.getElementById('btnPopText').onclick = () => {
    const w = window.open('instructions.html', 'eqlabText', 'width=560,height=760');
    if (!w) alert('Your browser blocked the pop-out window. Please allow pop-ups for this page.');
    else setTimeout(broadcast, 600);
  };
  let panelWin = null;
  function panelBack() {
    if (!panelWin) return;
    panelWrap.insertBefore(document.adoptNode(panel), placeholder);
    placeholder.hidden = true; panelWin = null;
  }
  document.getElementById('btnPopPanel').onclick = () => {
    if (panelWin && !panelWin.closed) { panelWin.focus(); return; }
    const w = window.open('', 'eqlabPanel', 'width=1000,height=760');
    if (!w) { alert('Your browser blocked the pop-out window. Please allow pop-ups for this page.'); return; }
    const css = new URL('css/style.css', location.href).href;
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Panel - Find the Earthquake</title><link rel="stylesheet" href="${css}"></head><body class="popwin"><div id="host"></div><div id="glossaryPop" class="gloss-pop" hidden></div></body></html>`);
    w.document.close();
    w.document.getElementById('host').appendChild(w.document.adoptNode(panel));
    Glossary.attach(w.document);
    placeholder.hidden = false; panelWin = w;
    w.addEventListener('pagehide', panelBack);
    w.addEventListener('beforeunload', panelBack);
  };
  document.getElementById('btnPanelBack').onclick = () => { const w = panelWin; panelBack(); if (w) w.close(); };
  window.addEventListener('beforeunload', () => { if (panelWin) panelWin.close(); });
  document.getElementById('btnGlossary').onclick = () => {
    const w = window.open('', 'eqlabGloss', 'width=520,height=760');
    if (!w) return;
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Glossary - Find the Earthquake</title><link rel="stylesheet" href="${new URL('css/style.css', location.href).href}"></head><body class="popwin"><h2 style="color:#841617">Glossary</h2>${Glossary.listHTML()}</body></html>`);
    w.document.close();
  };

  Glossary.attach(document);
  go(S.seed == null ? 0 : S.step);
})();
