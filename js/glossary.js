/* Clickable glossary. Any element with class "term" and data-term="key"
   opens a short explainer. Works in the main page and in pop-out windows. */
const GLOSSARY = {
  'seismometer': ['Seismometer', 'An instrument that records how the ground moves. Modern seismometers can feel motions far smaller than a person ever could. A set of seismometers at one site is often called a station.'],
  'station': ['Seismic station', 'A site where one or more seismometers record ground motion all the time. Washington and Oregon have hundreds of stations, run by the Pacific Northwest Seismic Network and its partners.'],
  'seismogram': ['Seismogram', 'The record a seismometer makes: ground motion plotted against time. Quiet ground draws a nearly flat line, and seismic waves show up as wiggles.'],
  'seismic-wave': ['Seismic wave', 'A vibration that travels through the Earth. When a fault slips, it sends seismic waves out in all directions, a bit like ripples from a stone dropped in a pond.'],
  'p-wave': ['P wave (primary wave)', 'The fastest seismic wave, so it always arrives first. It is a push-pull (compressional) wave: the rock is squeezed and stretched in the same direction the wave travels. In the crust it moves about 6 km per second.'],
  's-wave': ['S wave (secondary wave)', 'The second seismic wave to arrive. It shakes the rock side to side or up and down, across the direction the wave travels (a shear wave). It is slower than the P wave, about 3.5 km per second in the crust, and it usually makes stronger shaking.'],
  'sp-time': ['S-P time', 'The time between the arrival of the P wave and the arrival of the S wave at a station. The farther the station is from the earthquake, the larger the S-P time, and so it can be turned into a distance.'],
  'travel-time': ['Travel-time curve', 'A graph of how long a seismic wave takes to travel a given distance. Seismologists built these curves from thousands of earthquakes.'],
  'epicenter': ['Epicenter', 'The point on the Earth\'s surface directly above where the earthquake started. News reports and maps give the epicenter.'],
  'hypocenter': ['Hypocenter (focus)', 'The point underground where the fault first started to slip. The epicenter is directly above it. The distance from the surface down to the hypocenter is the earthquake\'s depth.'],
  'triangulation': ['Triangulation', 'Finding a location from distances to three known points. Each distance gives a circle around a station, and the earthquake is where the three circles meet. (Strictly, using distances is called trilateration, but most textbooks call it triangulation.)'],
  'amplitude': ['Amplitude', 'How big the wiggles are on a seismogram, measured from the center line to the top of a peak. Bigger earthquakes and closer stations give larger amplitudes.'],
  'magnitude': ['Magnitude', 'A single number for the size of an earthquake at its source. Each step of 1 on the scale means about 10 times bigger wiggles on a seismogram and about 32 times more energy released.'],
  'richter': ['Richter magnitude (local magnitude, ML)', 'The first magnitude scale, published by Charles Richter in 1935 for earthquakes in southern California. It uses the largest amplitude on a standard seismometer, corrected for distance.'],
  'moment-magnitude': ['Moment magnitude (Mw)', 'The magnitude most often reported today. It is based on the area of the fault that slipped, how far it slipped, and how stiff the rock is. For moderate earthquakes it gives numbers close to the Richter magnitude, and it works for the very largest earthquakes too.'],
  'nomogram': ['Nomogram', 'A graph made of three number scales. A straight line through two known values crosses the third scale at the answer. Richter\'s magnitude nomogram does a logarithm calculation with a ruler.'],
  'plate': ['Tectonic plate', 'One of the large, rigid pieces of the Earth\'s outer shell (the lithosphere). Plates move a few centimeters per year, and most earthquakes and volcanoes happen where they meet.'],
  'subduction': ['Subduction zone', 'A plate boundary where one plate sinks beneath another into the mantle. Subduction zones make the largest earthquakes on Earth, and they make lines of volcanoes like the Cascades.'],
  'cascadia': ['Cascadia subduction zone', 'The subduction zone off the coast of northern California, Oregon, Washington and British Columbia, where the Juan de Fuca plate sinks beneath the North American plate. Its last great earthquake was on January 26, 1700.'],
  'juan-de-fuca': ['Juan de Fuca plate', 'A small ocean plate off the Pacific Northwest coast. It moves east-northeast toward North America and sinks beneath it at the Cascadia subduction zone.'],
  'north-american': ['North American plate', 'The large plate carrying most of North America, including Oklahoma and the Pacific Northwest.'],
  'trench': ['Trench (deformation front)', 'The line on the seafloor where the sinking plate first bends down beneath the other plate. At Cascadia it is about 100 km offshore and partly buried in sediment.'],
  'fault': ['Fault', 'A fracture in the rock where the two sides have moved past each other. An earthquake is sudden slip on a fault.'],
  'crust': ['Crust', 'The outermost rock layer of the Earth. Under the Pacific Northwest the North American crust is about 30 to 40 km thick.'],
  'crustal': ['Crustal earthquake', 'An earthquake on a fault in the upper plate, usually less than about 30 km deep. Shallow crustal faults like the Seattle fault run right beneath cities, and so even a moderate one can shake buildings hard.'],
  'intraslab': ['Intraslab earthquake', 'An earthquake inside the sinking plate (the slab), usually 40 to 70 km deep beneath the Puget Sound. The 2001 Nisqually earthquake, magnitude 6.8, was one of these.'],
  'megathrust': ['Megathrust earthquake', 'An earthquake on the boundary fault between the two plates at a subduction zone. These are the largest earthquakes on Earth, magnitude 9 and above, and they can lift the seafloor and make a tsunami.'],
  'induced': ['Induced earthquake', 'An earthquake caused by human activity. In Oklahoma, most induced earthquakes are linked to injecting large volumes of wastewater from oil and gas production deep underground, which raises the fluid pressure on existing faults.'],
  'tsunami': ['Tsunami', 'A series of ocean waves made when a large volume of water is suddenly moved, most often when a megathrust earthquake lifts or drops the seafloor.'],
  'early-warning': ['Earthquake early warning', 'A system that detects the first seismic waves near the epicenter and sends an alert before the stronger shaking arrives farther away. ShakeAlert is the system for California, Oregon and Washington, run by the USGS with its state and university partners.'],
  'logarithmic': ['Logarithmic scale', 'A scale where each step multiplies by the same amount. On the magnitude scale, going up by 1 multiplies the wiggle size by 10.'],
  'energy': ['Seismic energy', 'The energy carried away from the fault by seismic waves. Each step of 1 in magnitude releases about 32 times more energy, and each step of 2 about 1,000 times more.'],
  'volcanic-arc': ['Volcanic arc', 'A line of volcanoes above a subduction zone. Water released from the sinking plate helps melt the mantle above it, at roughly 100 km depth. The Cascade volcanoes - Mount Baker, Rainier, St. Helens, Hood and others - are the volcanic arc of Cascadia.'],
  'forecast': ['Earthquake forecast', 'The chance that an earthquake of a certain size will happen in a certain area within a span of time, like 10 percent in 50 years. Forecasts come from how often earthquakes have happened in the past. A prediction would give an exact date, place and size, and no one can do that for earthquakes.'],
  'turbidite': ['Turbidite', 'A layer of sand and mud left on the seafloor by a turbidity current, an underwater landslide that flows down a submarine canyon. Strong earthquake shaking can set off turbidity currents all along a coast at once, and so dated turbidites record past earthquakes.'],
  'mantle': ['Mantle', 'The thick layer of hot, solid rock beneath the crust. Over long times it flows very slowly.']
};

const Glossary = (() => {
  function show(term, anchor) {
    const doc = anchor.ownerDocument;
    const entry = GLOSSARY[term];
    if (!entry) return;
    let pop = doc.getElementById('glossaryPop');
    if (!pop) { pop = doc.createElement('div'); pop.id = 'glossaryPop'; pop.className = 'gloss-pop'; doc.body.appendChild(pop); }
    pop.innerHTML = '';
    const close = doc.createElement('button'); close.className = 'close'; close.type = 'button'; close.textContent = '×';
    close.setAttribute('aria-label', 'Close'); close.onclick = () => { pop.hidden = true; };
    const h = doc.createElement('h4'); h.textContent = entry[0];
    const p = doc.createElement('div'); p.textContent = entry[1];
    pop.append(close, h, p);
    pop.hidden = false;
    const r = anchor.getBoundingClientRect();
    const w = doc.defaultView.innerWidth, hgt = doc.defaultView.innerHeight;
    const pw = Math.min(340, w - 20);
    pop.style.left = Math.max(10, Math.min(r.left, w - pw - 10)) + 'px';
    const below = r.bottom + 8;
    pop.style.top = (below + 160 > hgt ? Math.max(10, r.top - 170) : below) + 'px';
  }
  function attach(doc) {
    doc.addEventListener('click', e => {
      const t = e.target.closest ? e.target.closest('.term') : null;
      const pop = doc.getElementById('glossaryPop');
      if (t) { e.preventDefault(); show(t.dataset.term, t); return; }
      if (pop && !pop.hidden && !pop.contains(e.target)) pop.hidden = true;
    });
    doc.addEventListener('keydown', e => {
      if (e.key === 'Escape') { const pop = doc.getElementById('glossaryPop'); if (pop) pop.hidden = true; }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('term')) { e.preventDefault(); show(e.target.dataset.term, e.target); }
    });
  }
  function listHTML() {
    return '<dl class="gloss-list">' + Object.keys(GLOSSARY).sort((a, b) => GLOSSARY[a][0].localeCompare(GLOSSARY[b][0]))
      .map(k => `<dt>${GLOSSARY[k][0]}</dt><dd>${GLOSSARY[k][1]}</dd>`).join('') + '</dl>';
  }
  return { attach, show, listHTML };
})();
