/**
 * Pacific Star — Interactive Route Map
 * Shows Russia + APR with city markers, animated trade routes,
 * and tooltips. Uses an inline SVG approach.
 */
(function () {
  'use strict';

  /* ── City data ──────────────────────────────────────────────────────── */
  /* Coordinates as [lat, lon] → mapped to SVG viewBox 0 0 1000 440      */
  /* Map extent: lon 19E–190E (171°), lat 40N–77N (37°)                  */
  var W = 1000, H = 440;
  var LON0 = 19, LON1 = 190, LAT0 = 77, LAT1 = 40;

  function toXY(lat, lon) {
    return {
      x: Math.round((lon - LON0) / (LON1 - LON0) * W),
      y: Math.round((LAT0 - lat) / (LAT0 - LAT1) * H)
    };
  }

  var CITIES = [
    /* ── Megacities (1M+) ── type: "mega" */
    { id:'msc',  name:'Москва',            lat:55.75, lon:37.62,  type:'mega',  port:false },
    { id:'spb',  name:'Санкт‑Петербург',   lat:59.95, lon:30.32,  type:'mega',  port:false },
    { id:'nsk',  name:'Новосибирск',        lat:54.99, lon:82.92,  type:'mega',  port:false },
    { id:'ekb',  name:'Екатеринбург',       lat:56.84, lon:60.63,  type:'mega',  port:false },
    { id:'kzn',  name:'Казань',             lat:55.79, lon:49.12,  type:'mega',  port:false },
    { id:'nnov', name:'Нижний Новгород',    lat:56.33, lon:44.00,  type:'mega',  port:false },
    { id:'chel', name:'Челябинск',          lat:55.15, lon:61.40,  type:'mega',  port:false },
    { id:'sam',  name:'Самара',             lat:53.20, lon:50.15,  type:'mega',  port:false },
    { id:'ufa',  name:'Уфа',               lat:54.74, lon:55.97,  type:'mega',  port:false },
    { id:'rnd',  name:'Ростов‑на‑Дону',    lat:47.23, lon:39.70,  type:'mega',  port:false },
    { id:'omsk', name:'Омск',              lat:54.98, lon:73.37,  type:'mega',  port:false },
    { id:'krsk', name:'Красноярск',        lat:56.01, lon:92.87,  type:'mega',  port:false },
    { id:'vrn',  name:'Воронеж',           lat:51.67, lon:39.21,  type:'mega',  port:false },
    { id:'prm',  name:'Пермь',             lat:58.00, lon:56.25,  type:'mega',  port:false },
    { id:'vlg',  name:'Волгоград',         lat:48.71, lon:44.51,  type:'mega',  port:false },
    /* ── Far East ports & border crossings ── type: "port" */
    { id:'vvo',  name:'Владивосток',                   lat:43.12, lon:131.87, type:'port', port:true },
    { id:'khv',  name:'Хабаровск',                     lat:48.48, lon:135.08, type:'port', port:true },
    { id:'nkh',  name:'Находка',                       lat:42.82, lon:132.87, type:'port', port:true },
    { id:'blg',  name:'Благовещенск',                  lat:50.28, lon:127.53, type:'port', port:true },
    { id:'yta',  name:'Южно‑Сахалинск',                lat:46.96, lon:142.73, type:'port', port:true },
    { id:'krs',  name:'Корсаков (Сахалин)',             lat:46.63, lon:142.78, type:'port', port:true },
    { id:'hms',  name:'Холмск (Сахалин)',               lat:47.04, lon:142.06, type:'port', port:true },
    { id:'pkc',  name:'Петропавловск‑Камчатский',      lat:53.01, lon:158.65, type:'port', port:true },
    { id:'mgd',  name:'Магадан',                       lat:59.57, lon:150.79, type:'port', port:true },
    { id:'dyr',  name:'Анадырь',                       lat:64.73, lon:177.51, type:'port', port:true },
    { id:'pvk',  name:'Певек',                         lat:69.70, lon:170.27, type:'port', port:true },
    { id:'egv',  name:'Эгвекинот',                     lat:66.32, lon:179.17, type:'port', port:true },
    /* ── Special: Yakutsk ── type: "special" */
    { id:'ykt',  name:'Якутск',            lat:62.04, lon:129.73, type:'special', port:false }
  ];

  /* ── Trade route lines ─────────────────────────────────────────────── */
  var ROUTES = [
    { from:'msc',  to:'nsk',  label:'Трансиб' },
    { from:'nsk',  to:'vvo',  label:'Трансиб' },
    { from:'vvo',  to:'krs',  label:'Сахалин' },
    { from:'vvo',  to:'pkc',  label:'Камчатка' },
    { from:'vvo',  to:'mgd',  label:'Магадан' },
    { from:'mgd',  to:'pvk',  label:'Арктика' },
    { from:'pvk',  to:'dyr',  label:'Чукотка' },
    { from:'dyr',  to:'egv',  label:'Чукотка' },
    { from:'vvo',  to:'blg',  label:'Приамурье' },
    { from:'blg',  to:'khv',  label:'Амур' }
  ];

  /* ── Build SVG ─────────────────────────────────────────────────────── */
  function buildMap(container) {
    /* Compute positions */
    CITIES.forEach(function (c) { var p = toXY(c.lat, c.lon); c.x = p.x; c.y = p.y; });

    var cityById = {};
    CITIES.forEach(function (c) { cityById[c.id] = c; });

    var svgNS = 'http://www.w3.org/2000/svg';

    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Интерактивная карта маршрутов Pacific Star');
    svg.classList.add('route-map-svg');

    /* ── Defs: gradient + glow filter ── */
    var defs = document.createElementNS(svgNS, 'defs');

    /* Ocean gradient */
    var grad = document.createElementNS(svgNS, 'linearGradient');
    grad.id = 'oceanGrad';
    grad.setAttribute('x1','0%'); grad.setAttribute('y1','0%');
    grad.setAttribute('x2','100%'); grad.setAttribute('y2','100%');
    [['0%','#0a1628'],['100%','#0d2b5e']].forEach(function(s) {
      var stop = document.createElementNS(svgNS, 'stop');
      stop.setAttribute('offset', s[0]);
      stop.setAttribute('stop-color', s[1]);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);

    /* Glow filter for ports */
    var filter = document.createElementNS(svgNS, 'filter');
    filter.id = 'glow';
    var fe = document.createElementNS(svgNS, 'feGaussianBlur');
    fe.setAttribute('in','SourceGraphic'); fe.setAttribute('stdDeviation','3');
    filter.appendChild(fe);
    defs.appendChild(filter);

    /* Route dash animation */
    var style = document.createElementNS(svgNS, 'style');
    style.textContent = [
      '@keyframes dashFlow{to{stroke-dashoffset:0}}',
      '.route-line{stroke-dasharray:8 5;stroke-dashoffset:400;animation:dashFlow 6s linear infinite;}',
      '.city-pulse{transform-origin:center center;}',
      '@keyframes pulse{0%,100%{r:5;opacity:1}50%{r:8;opacity:0.5}}',
      '.pulse-ring{animation:pulse 2.5s ease-in-out infinite;transform-box:fill-box;}',
      '.map-tooltip{pointer-events:none;opacity:0;transition:opacity .2s;}',
      '.city-group:hover .map-tooltip{opacity:1;}',
      '.city-group{cursor:pointer;}'
    ].join('');
    defs.appendChild(style);

    svg.appendChild(defs);

    /* ── Background ocean ── */
    var bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('width', W); bg.setAttribute('height', H);
    bg.setAttribute('fill', 'url(#oceanGrad)');
    svg.appendChild(bg);

    /* ── Russia landmass (simplified polygon) ── */
    /* Key waypoints: [lon, lat] pairs for a recognizable Russia outline */
    var borderPoints = [
      [28,54.5],  /* Kaliningrad W */
      [22,55],    /* Baltic coast  */
      [27,60],    /* Finland border*/
      [29,65],    /* Murmansk area */
      [33,69.5],  /* Kola N coast  */
      [41,71],    /* Kola E coast  */
      [53,68.5],  /* W Siberia coast*/
      [60,67.5],  /* Polar Urals   */
      [65,72],    /* Yamal W       */
      [73,73],    /* Yamal N       */
      [80,73],    /* Ob Bay N      */
      [88,72],    /* W Taimyr      */
      [100,76],   /* Taimyr tip N  */
      [113,75],   /* E Taimyr      */
      [119,73],   /* Laptev Sea W  */
      [130,72],   /* Lena Delta    */
      [140,72],   /* E Siberia N   */
      [160,68],   /* Chukotka W    */
      [165,66],   /* Chukotka SW   */
      [170,68],   /* Chukotka      */
      [180,66],   /* Chukotka E (edge)*/
      [190,66],   /* right edge max */
      [190,42],   /* SE corner      */
      [134,42],   /* Vladivostok lat*/
      [131,42.5], /* Vladivostok    */
      [131,47],   /* Primorye N     */
      [127,49.5], /* Amur bend      */
      [121,53],   /* Trans-Baikal   */
      [96,50],    /* Tuva           */
      [87,49],    /* Altai          */
      [59,51],    /* Kazakhstan border E */
      [50,51],    /* Kazakhstan border  */
      [46,47],    /* Caspian N      */
      [46,44],    /* Caspian coast  */
      [44,43],    /* Dagestan       */
      [40,43],    /* N Caucasus     */
      [39,47],    /* Krasnodar      */
      [38,48],    /* Azov N coast   */
      [37,47],    /* Black Sea N    */
      [34,46],    /* Crimea area    */
      [33,46],    /* Ukraine border */
      [27,52],    /* W border       */
      [28,54.5]   /* close          */
    ];

    var pts = borderPoints.map(function(p) {
      var c = toXY(p[1], p[0]);
      return c.x + ',' + c.y;
    }).join(' ');

    var land = document.createElementNS(svgNS, 'polygon');
    land.setAttribute('points', pts);
    land.setAttribute('fill', '#1a3a6b');
    land.setAttribute('stroke', '#2a5298');
    land.setAttribute('stroke-width', '1.5');
    svg.appendChild(land);

    /* ── Siberia/Far East highlight band ── */
    var highlight = document.createElementNS(svgNS, 'rect');
    var vvoCity = cityById['vvo'];
    highlight.setAttribute('x', String(toXY(40, 110).x));
    highlight.setAttribute('y', '0');
    highlight.setAttribute('width', String(W - toXY(40, 110).x));
    highlight.setAttribute('height', String(H));
    highlight.setAttribute('fill', 'rgba(245,166,35,0.06)');
    highlight.setAttribute('rx', '0');
    svg.appendChild(highlight);

    /* ── Labels: region names ── */
    var regionLabels = [
      { text: 'ЕВРОПЕЙСКАЯ РОССИЯ', x: 110, y: 280, size: 9 },
      { text: 'ЗАПАДНАЯ СИБИРЬ', x: 320, y: 220, size: 9 },
      { text: 'ВОСТОЧНАЯ СИБИРЬ', x: 540, y: 200, size: 9 },
      { text: 'ДАЛЬНИЙ ВОСТОК', x: 760, y: 240, size: 9 },
      { text: 'АРКТИКА', x: 550, y: 80, size: 8 }
    ];
    regionLabels.forEach(function (rl) {
      var t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', rl.x); t.setAttribute('y', rl.y);
      t.setAttribute('fill', 'rgba(255,255,255,0.18)');
      t.setAttribute('font-size', rl.size);
      t.setAttribute('font-family', 'Roboto,sans-serif');
      t.setAttribute('font-weight', '700');
      t.setAttribute('letter-spacing', '2');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('pointer-events', 'none');
      t.textContent = rl.text;
      svg.appendChild(t);
    });

    /* ── Trade route lines ── */
    ROUTES.forEach(function (r) {
      var a = cityById[r.from], b = cityById[r.to];
      if (!a || !b) return;
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.setAttribute('stroke', '#f5a623');
      line.setAttribute('stroke-width', '1.2');
      line.setAttribute('stroke-opacity', '0.5');
      line.classList.add('route-line');
      svg.appendChild(line);
    });

    /* ── City markers ── */
    CITIES.forEach(function (c) {
      var g = document.createElementNS(svgNS, 'g');
      g.classList.add('city-group');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', c.name);

      /* Pulse ring (ports only) */
      if (c.port) {
        var ring = document.createElementNS(svgNS, 'circle');
        ring.setAttribute('cx', c.x); ring.setAttribute('cy', c.y);
        ring.setAttribute('r', '5');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#f5a623');
        ring.setAttribute('stroke-width', '1.5');
        ring.setAttribute('stroke-opacity', '0.7');
        ring.classList.add('pulse-ring');
        g.appendChild(ring);
      }

      /* Dot */
      var dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('cx', c.x); dot.setAttribute('cy', c.y);
      var r = c.type === 'mega' ? '5' : (c.type === 'port' ? '6' : '5');
      dot.setAttribute('r', r);
      var fill = c.type === 'mega' ? '#4a90d9' : (c.type === 'port' ? '#f5a623' : '#50e3c2');
      dot.setAttribute('fill', fill);
      dot.setAttribute('stroke', '#fff');
      dot.setAttribute('stroke-width', '1.5');
      g.appendChild(dot);

      /* Tooltip */
      var ttg = document.createElementNS(svgNS, 'g');
      ttg.classList.add('map-tooltip');

      /* Position tooltip — flip if near edges */
      var ttx = c.x + 10, tty = c.y - 8;
      var anchor = 'start';
      if (c.x > W - 120) { ttx = c.x - 10; anchor = 'end'; }
      if (c.y < 30) tty = c.y + 20;

      var ttbg = document.createElementNS(svgNS, 'rect');
      var labelLen = c.name.length * 6.5 + 16;
      var bx = anchor === 'end' ? ttx - labelLen : ttx - 8;
      ttbg.setAttribute('x', bx); ttbg.setAttribute('y', tty - 14);
      ttbg.setAttribute('width', labelLen); ttbg.setAttribute('height', '22');
      ttbg.setAttribute('rx', '4');
      ttbg.setAttribute('fill', 'rgba(13,43,94,0.92)');
      ttbg.setAttribute('stroke', c.type === 'port' ? '#f5a623' : '#2a5298');
      ttbg.setAttribute('stroke-width', '1');
      ttg.appendChild(ttbg);

      var ttt = document.createElementNS(svgNS, 'text');
      ttt.setAttribute('x', ttx);
      ttt.setAttribute('y', tty);
      ttt.setAttribute('fill', '#fff');
      ttt.setAttribute('font-size', '11');
      ttt.setAttribute('font-family', 'Roboto,sans-serif');
      ttt.setAttribute('font-weight', '500');
      ttt.setAttribute('text-anchor', anchor);
      ttt.textContent = c.name + (c.port ? ' ⚓' : '');
      ttg.appendChild(ttt);
      g.appendChild(ttg);

      svg.appendChild(g);
    });

    /* ── Legend ── */
    var lgX = 20, lgY = H - 70;
    var legendData = [
      { color:'#4a90d9', label:'Города 1 млн+' },
      { color:'#f5a623', label:'Морские порты / КПП' },
      { color:'#50e3c2', label:'Якутск (важный узел)' }
    ];
    legendData.forEach(function (ld, i) {
      var lg = document.createElementNS(svgNS, 'g');
      var lc = document.createElementNS(svgNS, 'circle');
      lc.setAttribute('cx', lgX + 7); lc.setAttribute('cy', lgY + i * 18);
      lc.setAttribute('r', '5');
      lc.setAttribute('fill', ld.color);
      lc.setAttribute('stroke', '#fff'); lc.setAttribute('stroke-width', '1');
      lg.appendChild(lc);
      var lt = document.createElementNS(svgNS, 'text');
      lt.setAttribute('x', lgX + 18); lt.setAttribute('y', lgY + i * 18 + 4);
      lt.setAttribute('fill', 'rgba(255,255,255,0.75)');
      lt.setAttribute('font-size', '10');
      lt.setAttribute('font-family', 'Roboto,sans-serif');
      lt.textContent = ld.label;
      lg.appendChild(lt);
      svg.appendChild(lg);
    });

    /* ── Route legend ── */
    var rl = document.createElementNS(svgNS, 'g');
    var rlLine = document.createElementNS(svgNS, 'line');
    rlLine.setAttribute('x1', lgX); rlLine.setAttribute('y1', lgY + 62);
    rlLine.setAttribute('x2', lgX + 28); rlLine.setAttribute('y2', lgY + 62);
    rlLine.setAttribute('stroke','#f5a623');
    rlLine.setAttribute('stroke-width','1.5');
    rlLine.setAttribute('stroke-dasharray','6 4');
    rl.appendChild(rlLine);
    var rlt = document.createElementNS(svgNS, 'text');
    rlt.setAttribute('x', lgX + 34); rlt.setAttribute('y', lgY + 66);
    rlt.setAttribute('fill','rgba(255,255,255,0.75)');
    rlt.setAttribute('font-size','10');
    rlt.setAttribute('font-family','Roboto,sans-serif');
    rlt.textContent = 'Торговые маршруты';
    rl.appendChild(rlt);
    svg.appendChild(rl);

    container.appendChild(svg);
  }

  /* ── Init ────────────────────────────────────────────────────────────── */
  function init() {
    var container = document.getElementById('routeMapContainer');
    if (!container) return;
    buildMap(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
