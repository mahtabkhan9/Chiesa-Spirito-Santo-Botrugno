/* Chiesa dello Spirito Santo - 360 tour. Content lives in js/scenes.js. */
(function () {
  'use strict';

  var T = window.TOUR;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var svgEl = function (tag, attrs, parent) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  var rad = Marzipano.util.degToRad, deg = function (r) { return r * 180 / Math.PI; };
  var wrap = function (a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  var mq = function (q) { return window.matchMedia(q).matches; };

  var scenes = T.scenes, byId = {};
  scenes.forEach(function (s, i) { s.index = i; byId[s.id] = s; });

  var EDIT = /[?&]edit=1/.test(location.search);
  var seen = {};
  var current = null;       // scene data on screen
  var cache = {};           // id -> { data, scene, els }
  var drawerFor = null;
  var busy = false;

  /* ============================================================ language */
  var UI = {
    it: {
      title: 'Tour virtuale 360°', home: "Torna all'inizio", places: 'Luoghi', placesAria: 'Elenco dei luoghi',
      details: 'Galleria', seeDetails: 'Apri la galleria', closeDetails: 'Chiudi la galleria', closeList: "Chiudi l'elenco",
      prev: 'Luogo precedente', next: 'Luogo successivo', stop: function (n, t) { return 'Punto ' + n + ' di ' + t; },
      zoomIn: 'Ingrandisci', zoomOut: 'Riduci', rotOn: 'Ferma la rotazione automatica', rotOff: 'Avvia la rotazione automatica',
      full: 'Schermo intero', play: 'Riproduci', pause: 'Pausa', mute: 'Disattiva audio', unmute: 'Attiva audio', seek: 'Posizione del video', replay: 'Rivedi',
      video: 'Video', photo: 'Foto', items: function (n) { return n === 1 ? '1 contenuto' : n + ' contenuti'; },
      pano: 'Panorama a 360°. Trascina per guardarti intorno.', homeAlt: 'Veduta aerea della chiesa e del centro storico di Botrugno',
      prevItem: 'Contenuto precedente', nextItem: 'Contenuto successivo',
      menu: 'Menu', menuPlan: 'Pianta della chiesa', menuPlaces: 'Tutti i luoghi', menuGallery: 'Galleria', menuHome: 'Home', back: 'Indietro', closeMenu: 'Chiudi il menu',
      planNote: 'Pianta indicativa, non in scala. Tocca un punto per andarci.', youAreHere: 'Sei qui',
      other: 'EN', otherLabel: 'Switch to English'
    },
    en: {
      title: '360° virtual tour', home: 'Back to the start', places: 'Places', placesAria: 'List of places',
      details: 'Gallery', seeDetails: 'Open the gallery', closeDetails: 'Close the gallery', closeList: 'Close the list',
      prev: 'Previous place', next: 'Next place', stop: function (n, t) { return 'Stop ' + n + ' of ' + t; },
      zoomIn: 'Zoom in', zoomOut: 'Zoom out', rotOn: 'Stop automatic rotation', rotOff: 'Start automatic rotation',
      full: 'Full screen', play: 'Play', pause: 'Pause', mute: 'Mute', unmute: 'Unmute', seek: 'Video position', replay: 'Watch again',
      video: 'Video', photo: 'Photo', items: function (n) { return n === 1 ? '1 item' : n + ' items'; },
      pano: '360° panorama. Drag to look around.', homeAlt: 'Aerial view of the church and the old town of Botrugno',
      prevItem: 'Previous item', nextItem: 'Next item',
      menu: 'Menu', menuPlan: 'Church plan', menuPlaces: 'All places', menuGallery: 'Gallery', menuHome: 'Home', back: 'Back', closeMenu: 'Close the menu',
      planNote: 'Indicative plan, not to scale. Select a point to go there.', youAreHere: 'You are here',
      other: 'IT', otherLabel: "Passa all'italiano"
    }
  };
  var lang = 'it';
  try { var q = /[?&]lang=(it|en)/.exec(location.search); lang = (q && q[1]) || localStorage.getItem('lang') || 'it'; } catch (e) { }
  if (!UI[lang]) lang = 'it';
  var L = function (k) { return UI[lang][k]; };
  var nm = function (d) { return lang === 'en' ? d.nameEn : d.name; };
  var lb = function (m) { return lang === 'en' ? m.labelEn : m.label; };
  var gn = function (g) { return lang === 'en' ? g.nameEn : g.name; };
  var labelled = [];   // { node, attr, fn, text }: re-evaluated on language change

  function setText(sel, txt) { $(sel).textContent = txt; }
  function setAria(sel, txt) { $(sel).setAttribute('aria-label', txt); }

  function applyLang() {
    var tx = lang === 'en' ? T.en : T;
    document.documentElement.lang = lang;
    document.title = T.name + ' - ' + L('title');
    (function () {   // the client's title, broken after the second dash so it sits on two lines
      var m = /^(.*? - .*?) - (.*)$/.exec(T.name), t = $('#homeTitle');
      t.textContent = '';
      if (m) { t.appendChild(document.createTextNode(m[1] + ' -')); t.appendChild(document.createElement('br')); t.appendChild(document.createTextNode(m[2])); }
      else t.textContent = T.name;
    })();
    setText('#homeBiblio', tx.bibliography); setText('#homeCredit span', T.credit.text);
    $('#homeCredit').href = T.credit.url;
    setText('#enterText', tx.enter); setText('#enterLabel', tx.enter);
    $('#homeImg').alt = L('homeAlt');
    setText('#menuLabel', L('menu')); setText('#menuTitle', L('menu')); setText('#planTitle', L('menuPlan'));
    setText('#mnPlan .mn-t', L('menuPlan')); setText('#mnPlaces .mn-t', L('menuPlaces')); setText('#mnHome .mn-t', L('menuHome'));
    setText('#mnBiblio', tx.bibliography); setText('#mnCredit span', T.credit.text); $('#mnCredit').href = T.credit.url;
    setAria('#btnMenu', L('menu')); setAria('#menuClose', L('closeMenu')); setAria('#planClose', L('closeMenu')); setAria('#planBack', L('back'));
    $('#menu').setAttribute('aria-label', L('menu'));
    $$('#mnLang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-l') === lang)); });
    refreshPlanText();
    setText('#sideLabel', L('places')); setText('#sideName', T.name);
    setAria('#btnHome', L('home')); setAria('#btnSide', L('placesAria')); setAria('#sideClose', L('closeList'));
    $('#side').setAttribute('aria-label', L('placesAria'));
    setText('#btnDetail span', L('details')); setAria('#btnDetail', L('details'));
    setAria('#btnPrev', L('prev')); setAria('#btnNext', L('next'));
    setAria('#btnZoomIn', L('zoomIn')); setAria('#btnZoomOut', L('zoomOut')); setAria('#btnFull', L('full'));
    setAria('#drawerClose', L('closeDetails')); setAria('#mPrev', L('prevItem')); setAria('#mNext', L('nextItem'));
    $('#pano').setAttribute('aria-label', L('pano'));
    $$('.js-lang').forEach(function (b) { b.textContent = L('other'); b.setAttribute('aria-label', L('otherLabel')); b.setAttribute('lang', lang === 'en' ? 'it' : 'en'); });
    labelled.forEach(function (h) { var t = h.fn(); h.node.setAttribute(h.attr, t); if (h.texts) h.texts.forEach(function (x) { x.textContent = t; }); });
    buildSide();
    if (current) renderPlace(); else hint(null);
    rotateLabel();
    if (drawerFor) { var at = $$('#stageList button').findIndex(function (b) { return b.getAttribute('aria-current') === 'true'; }); fillDrawer(drawerFor, Math.max(0, at)); }
    placeDoor();
  }
  function setLang(l) { lang = l; try { localStorage.setItem('lang', l); } catch (e) { } applyLang(); }
  $$('.js-lang').forEach(function (b) { b.addEventListener('click', function () { setLang(lang === 'it' ? 'en' : 'it'); }); });

  /* ============================================================ home: the pin sits on the central door */
  var homeImg = $('#homeImg'), clip = $('.home-photo'), doorBtn = $('#btnEnter');
  function placeDoor() {
    var iw = homeImg.naturalWidth, ih = homeImg.naturalHeight;
    if (!iw || !clip.clientWidth) return;
    var W = clip.clientWidth, H = clip.clientHeight, wide = window.innerWidth > 900 || window.innerWidth > window.innerHeight * 1.2;
    // Enlarge the photo so the church is the subject, but never so much that the church is cut off:
    // the church spans roughly x .35-.68 and y .32-.87 of the photograph.
    var cover = Math.max(W / iw, H / ih);
    var room = wide ? H * 0.74 : H * 0.88;                      // height the church may use
    var s = Math.max(cover, Math.min(cover * 1.5, room / (0.55 * ih), 0.86 * W / (0.36 * iw))), w = iw * s, h = ih * s;
    var cx = 0.5, cy = wide ? 0.5 : 0.52;                        // where the middle of the church sits in its frame
    var left = Math.min(0, Math.max(W - w, W * cx - 0.515 * w));
    var top = Math.min(0, Math.max(H - h, H * cy - 0.595 * h));
    homeImg.style.width = w + 'px'; homeImg.style.height = h + 'px'; homeImg.style.left = left + 'px'; homeImg.style.top = top + 'px';
    var x = left + T.homeDoor.x * w, y = top + T.homeDoor.y * h;
    doorBtn.style.setProperty('--door-x', x + 'px');
    doorBtn.style.setProperty('--door-y', y + 'px');
    var half = $('.door-tag').offsetWidth / 2 + 10;
    doorBtn.style.setProperty('--tag-x', Math.max(half - x, Math.min(0, W - half - x)) + 'px');
  }
  if (homeImg.complete) placeDoor(); else homeImg.addEventListener('load', placeDoor);
  window.addEventListener('resize', placeDoor);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeDoor);

  /* ============================================================ viewer */
  var LEVELS = [{ tileSize: 512, size: 512, fallbackOnly: false }, { tileSize: 1536, size: 1536 }, { tileSize: 1536, size: 3072 }];
  var MAX_FOV = rad(120);
  var viewer = new Marzipano.Viewer($('#pano'), { stage: { progressive: true } });
  var geometry = new Marzipano.CubeGeometry(LEVELS);
  var limiter = Marzipano.RectilinearView.limit.traditional(3072, MAX_FOV, MAX_FOV);

  function startFov() {
    var aspect = window.innerWidth / window.innerHeight, f = 1.4386;
    return Math.min(MAX_FOV, aspect < 1 ? f * Math.min(1.5, 1 / aspect) : f);
  }

  function getScene(id) {
    if (cache[id]) return cache[id];
    var d = byId[id];
    var source = Marzipano.ImageUrlSource.fromString('assets/tiles/' + id + '/{z}/{f}/{y}/{x}.jpg');
    var view = new Marzipano.RectilinearView({ yaw: d.view.yaw, pitch: d.view.pitch, fov: startFov() }, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
    var entry = { data: d, scene: scene, els: [] };
    d.links.forEach(function (l) {
      if (!byId[l.to]) return;
      var h = linkHotspot(l);
      scene.hotspotContainer().createHotspot(h, { yaw: l.yaw, pitch: l.pitch });
      entry.els.push(h);
    });
    if (d.detail && d.media.length) {
      var h = detailHotspot(d);
      scene.hotspotContainer().createHotspot(h, { yaw: d.detail.yaw, pitch: d.detail.pitch });
      entry.els.push(h);
    }
    view.addEventListener('change', function () { if (current && current.id === id) { updateCone(); queueLabels(); } });
    return (cache[id] = entry);
  }

  /* ---------- hotspots: arch-shaped markers ---------- */
  function hotspot(kind, labelFn, icon, thumb, onActivate) {
    var h = el('div', 'hs hs-' + kind);
    var b = el('button', 'hs-btn');
    b.type = 'button';
    b.innerHTML = '<span class="hs-dot"><i class="' + icon + '"></i></span><span class="hs-name"></span>' +
      (thumb ? '<span class="hs-card"><img alt="" src="' + thumb + '"><b></b></span>' : '');
    var texts = $$('.hs-name, b', b), t = labelFn();
    b.setAttribute('aria-label', t); texts.forEach(function (x) { x.textContent = t; });
    labelled.push({ node: b, attr: 'aria-label', fn: labelFn, texts: texts });
    b.addEventListener('click', onActivate);
    h.appendChild(b);
    ['pointerdown', 'mousedown', 'touchstart', 'wheel'].forEach(function (ev) { h.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    return h;
  }
  function linkHotspot(l) { return hotspot('link', function () { return nm(byId[l.to]); }, 'i-up', 'assets/thumbs/' + l.to + '.jpg', function () { go(l.to, { link: l }); }); }
  function detailHotspot(d) { return hotspot('detail', function () { return L('seeDetails'); }, 'i-detail', null, function () { openDrawer(d); }); }

  /* ---------- loading effect: the middle of the previous/next bar fills while a new place loads ---------- */
  var mid = $('.st-mid'), loadP = 0, loadTimer = 0, loadTick = 0, stableWaiters = [];
  viewer.stage().addEventListener('renderComplete', function (stable) {
    if (!stable) return;
    var w = stableWaiters; stableWaiters = [];
    w.forEach(function (fn) { fn(); });
  });
  function waitStable(maxMs) {      // resolves when the viewer has finished loading what it shows (or after maxMs)
    return new Promise(function (res) {
      var done = false;
      function fin() { if (!done) { done = true; res(); } }
      stableWaiters.push(fin);
      setTimeout(fin, maxMs);
    });
  }
  function loadSet(p) { loadP = Math.max(loadP, Math.min(1, p)); mid.style.setProperty('--p', loadP.toFixed(3)); }
  function loadStart() {
    clearTimeout(loadTimer); clearInterval(loadTick);
    loadP = 0;
    mid.classList.remove('loading');
    mid.style.setProperty('--p', 0);
    void mid.offsetWidth;
    mid.classList.add('loading');
    mid.setAttribute('aria-busy', 'true');
    loadSet(.06);
    loadTick = setInterval(function () { loadSet(loadP + (.92 - loadP) * .07); }, 120);   // creeps forward until the tiles are in
  }
  function loadDone() {
    clearInterval(loadTick);
    loadSet(1);
    mid.removeAttribute('aria-busy');
    clearTimeout(loadTimer);
    loadTimer = setTimeout(function () {
      mid.classList.remove('loading');
      loadTimer = setTimeout(function () { loadP = 0; mid.style.setProperty('--p', 0); }, 800);
    }, 450);
  }

  /* On touch screens the name is always visible, so it goes above the marker when the marker is low on the screen and below it
     when it is high, and slides sideways just enough to stay inside the screen. */
  var labelFrame = 0;
  function placeLabels() {
    labelFrame = 0;
    if (!current || !cache[current.id]) return;
    var W = window.innerWidth, H = window.innerHeight, safeBottom = H - 96;
    cache[current.id].els.forEach(function (hs) {
      var b = hs.firstChild, name = $('.hs-name', b), r = b.getBoundingClientRect();
      if (!name || !r.width) return;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2, nw = name.offsetWidth;
      var shown = cx > 0 && cx < W && cy > 0 && cy < H;           // the name only exists while its marker is on screen
      hs.classList.toggle('off', !shown);
      var shift = 0;
      if (cx - nw / 2 < 6) shift = 6 - (cx - nw / 2); else if (cx + nw / 2 > W - 6) shift = W - 6 - (cx + nw / 2);
      shift = Math.max(-nw / 2 + 12, Math.min(nw / 2 - 12, shift));   // never slide so far that it stops sitting over its marker
      name.style.setProperty('--nx', shift.toFixed(0) + 'px');
      hs.classList.toggle('up', cy > H * 0.5 || cy + r.height / 2 + 40 > safeBottom);
    });
  }
  function queueLabels() { if (!labelFrame) labelFrame = requestAnimationFrame(placeLabels); }
  window.addEventListener('resize', queueLabels);

  /* ---------- moving between places ---------- */
  var tweenId = 0;
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function tween(ms, step, done) {
    var id = ++tweenId, t0 = null;
    function frame(now) {
      if (id !== tweenId) return;
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / ms);
      step(ease(t));
      if (t < 1) requestAnimationFrame(frame); else if (done) done();
    }
    requestAnimationFrame(frame);
  }
  function moveView(view, to, ms, done) {
    var p = view.parameters(), dy = wrap(to.yaw - p.yaw);
    tween(ms, function (k) { view.setParameters({ yaw: p.yaw + dy * k, pitch: p.pitch + (to.pitch - p.pitch) * k, fov: p.fov + (to.fov - p.fov) * k }); }, done);
  }

  /* Moving between places is one continuous camera move, not two steps:
     - walking through a hotspot: the old view keeps pushing towards the marker while the new place fades in underneath it,
       already facing the way you were walking and settling out from a slight zoom, so the two views overlap like a dolly shot;
     - jumping from the list or the plan: a slower cross-fade with a gentle zoom on the incoming place. */
  var sm = function (t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  function goNow(id, opts) {
    opts = opts || {};
    var d = byId[id];
    if (!d || busy) return;
    var fromHome = !current || document.body.classList.contains('is-home');
    var from = current, link = opts.link, walking = !!(from && link && !fromHome);
    var instant = !!opts.instant || fromHome;
    closeDrawer(true);
    viewer.stopMovement();
    tweenId++;

    var s = getScene(id), view = s.scene.view(), fov = startFov();
    var yaw = walking ? wrap(rad(from.heading) + link.yaw - rad(d.heading)) : d.view.yaw;
    var pitch = walking ? Math.max(-0.1, Math.min(0.1, d.view.pitch)) : d.view.pitch;
    var oldEntry = (!instant && from && cache[from.id]) ? cache[from.id] : null;

    function finish() {
      busy = false;
      view.setParameters({ yaw: view.yaw(), pitch: view.pitch(), fov: view.fov() });
      s.scene.hotspotContainer().domElement().style.opacity = '';
      applyRotate(); queueLabels();
    }

    if (instant || !oldEntry) {
      view.setParameters({ yaw: yaw, pitch: pitch, fov: fov });
      s.scene.switchTo({ transitionDuration: 0 });
      s.scene.hotspotContainer().domElement().style.opacity = '';
    } else {
      var ov = oldEntry.scene.view(), op = ov.parameters();
      var oTo = walking ? { yaw: op.yaw + wrap(link.yaw - op.yaw), pitch: Math.min(link.pitch, 0.1) * 0.5, fov: op.fov * 0.42 }
                        : { yaw: op.yaw, pitch: op.pitch, fov: op.fov * 0.9 };
      var nFrom = fov * (walking ? 0.6 : 0.82);
      var dur = walking ? 1500 : 1100;
      view.setParameters({ yaw: yaw, pitch: pitch, fov: nFrom });
      s.scene.hotspotContainer().domElement().style.opacity = '0';
      busy = true;
      s.scene.switchTo({
        transitionDuration: dur,
        transitionUpdate: function (val, newScene, oldScene) {
          var e = ease(val);
          // old place: carries on moving towards the marker (or eases back), and its markers vanish quickly
          ov.setParameters({ yaw: op.yaw + (oTo.yaw - op.yaw) * e, pitch: op.pitch + (oTo.pitch - op.pitch) * e, fov: op.fov + (oTo.fov - op.fov) * e });
          oldScene.hotspotContainer().domElement().style.opacity = String(1 - sm(val * 5));
          // new place: fades in over the middle of the move and settles out to the normal view
          var fade = sm((val - 0.12) / 0.62);
          newScene.listLayers().forEach(function (l) { l.mergeEffects({ opacity: fade }); });
          view.setParameters({ yaw: yaw, pitch: pitch, fov: nFrom + (fov - nFrom) * ease(sm((val - 0.1) / 0.9)) });
          newScene.hotspotContainer().domElement().style.opacity = String(sm((val - 0.72) / 0.28));
        }
      }, finish);
      setTimeout(function () { if (busy) finish(); }, dur + 400);      // safety: never stay locked
    }
    if (!opts.preloaded) loadStart();
    waitStable(6000).then(loadDone);
    current = d; seen[id] = true;
    document.body.classList.remove('is-home');
    $('#tour').hidden = false;
    renderPlace();
    s.els.forEach(function (h) { h.classList.remove('live'); void h.offsetWidth; h.classList.add('live'); });
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// */ }
    if (mq('(max-width:720px)')) setSide(false);
  }

  /* ---------- never show a place before its picture is in ----------
     The next place is fetched first (its two lowest tile levels, which is what the viewer needs to draw a sharp first frame).
     While that happens the bar (or the welcome button) fills with the real progress, the current markers fade away, and nothing
     of the new place is shown. Only when the picture is here does the move start, and the new markers arrive with it. */
  var loadedIds = {};
  var FACES = ['f', 'b', 'l', 'r', 'u', 'd'];
  function preload(id, onProgress) {
    return new Promise(function (resolve) {
      if (loadedIds[id]) { resolve(); return; }
      var urls = [];
      FACES.forEach(function (f) { urls.push('assets/tiles/' + id + '/0/' + f + '/0/0.jpg'); urls.push('assets/tiles/' + id + '/1/' + f + '/0/0.jpg'); });
      var done = 0, finished = false;
      function fin() { if (finished) return; finished = true; loadedIds[id] = true; resolve(); }
      urls.forEach(function (u) {
        var im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = im.onerror = function () { done++; onProgress(done / urls.length); if (done >= urls.length) fin(); };
        im.src = u;
      });
      setTimeout(fin, 20000);          // a stalled request must not lock the tour forever
    });
  }
  function go(id, opts) {
    opts = opts || {};
    if (!byId[id] || busy) return;
    if (loadedIds[id]) { goNow(id, opts); return; }
    var fromHome = !current || document.body.classList.contains('is-home');
    var cta = $('#btnEnterText'), hideTimer = 0, cur = current && cache[current.id];
    busy = true;
    if (fromHome) { cta.classList.add('loading'); cta.style.setProperty('--p', 0.04); } else { loadStart(); }
    hideTimer = setTimeout(function () {            // only if it is actually slow: the markers of the place you are leaving fade out
      if (cur) { var hc = cur.scene.hotspotContainer().domElement(); hc.style.transition = 'opacity .25s'; hc.style.opacity = '0'; }
    }, 350);
    preload(id, function (p) { if (fromHome) cta.style.setProperty('--p', Math.max(0.04, p).toFixed(3)); else loadSet(Math.max(.06, p * .92)); }).then(function () {
      clearTimeout(hideTimer);
      cta.classList.remove('loading'); cta.style.removeProperty('--p');
      if (cur) { var hc = cur.scene.hotspotContainer().domElement(); hc.style.transition = ''; hc.style.opacity = ''; }
      busy = false;
      goNow(id, { link: opts.link, instant: opts.instant, preloaded: !fromHome });
    });
  }

  function goHome() {
    closeDrawer(true); setSide(false); if (menuOpen) setMenu(false);
    document.body.classList.add('is-home');
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
  }

  /* ============================================================ floor plan + menu */
  // Plan units are metres: x from the axis of the nave, y from the entrance towards the altar.
  var K = 12.8;
  var P = function (x, y) { return [100 + x * K, 232 - (y + 1.6) * K]; };
  var pt = function (x, y) { var p = P(x, y); return p[0].toFixed(1) + ' ' + p[1].toFixed(1); };
  var planSvg = $('#planSvg'), coneG, coneEl;

  (function drawPlan() {
    var g = function (tag, attrs, parent) { return svgEl(tag, attrs, parent || planSvg); };
    // outline: three aisles (nave + two side aisles), a short presbytery with a round apse
    var outline = 'M' + pt(-6.6, -1.6) + 'L' + pt(6.6, -1.6) + 'L' + pt(6.6, 11.8) + 'L' + pt(3.4, 11.8) + 'L' + pt(3.4, 12) +
      'A' + (3.4 * K) + ' ' + (3.4 * K) + ' 0 0 0 ' + pt(-3.4, 12) + 'L' + pt(-3.4, 11.8) + 'L' + pt(-6.6, 11.8) + 'Z';
    g('path', { 'class': 'pl-floor', d: outline });
    // pews: one plain block either side of the central walkway
    [[-3.0, -0.55], [0.55, 3.0]].forEach(function (r) {
      var a = P(r[0], 7.0), b = P(r[1], 0.9);
      g('rect', { 'class': 'pl-pew', x: a[0], y: a[1], width: b[0] - a[0], height: b[1] - a[1], rx: 3 });
    });
    // side-altar niches along both aisle walls, and at the end of each aisle
    [-1, 1].forEach(function (s) {
      [0.7, 4.2, 8.0].forEach(function (y) {
        var a = P(s > 0 ? 6.6 : -7.5, y + 1.0), b = P(s > 0 ? 7.5 : -6.6, y - 1.0);
        g('rect', { 'class': 'pl-niche', x: a[0], y: a[1], width: b[0] - a[0], height: b[1] - a[1] });
      });
      var a2 = P(s * 4.9 - 1.1, 12.8), b2 = P(s * 4.9 + 1.1, 11.8);
      g('rect', { 'class': 'pl-niche', x: a2[0], y: a2[1], width: b2[0] - a2[0], height: b2[1] - a2[1] });
    });
    g('path', { 'class': 'pl-wall', d: outline });
    // arcades between the nave and the two aisles, with their piers
    [-3.4, 3.4].forEach(function (x) {
      var a = P(x, -1.6), b = P(x, 11.8);
      g('line', { 'class': 'pl-arcade', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
    });
    // doors in the entrance wall: the central door and one at the end of each aisle
    [[0, 2.4], [-4.9, 1.5], [4.9, 1.5]].forEach(function (d) {
      var a = P(d[0] - d[1] / 2, -1.6), b = P(d[0] + d[1] / 2, -1.6);
      g('line', { 'class': 'pl-gap', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
    });
    // high altar
    var h1 = P(-1.3, 14.0), h2 = P(1.3, 12.9);
    g('rect', { 'class': 'pl-altar', x: h1[0], y: h1[1], width: h2[0] - h1[0], height: h2[1] - h1[1], rx: 1.5 });
    g('text', { 'class': 'pl-text', x: 100, y: 242, id: 'plLabelEntrance' });
    g('text', { 'class': 'pl-text', x: 100, y: 9, id: 'plLabelAltar' });
    // walkable links, from the hotspots
    var drawn = {};
    scenes.forEach(function (a) {
      a.links.forEach(function (l) {
        var b = byId[l.to]; if (!b) return;
        var key = [a.id, b.id].sort().join('|'); if (drawn[key]) return; drawn[key] = 1;
        var p = P(a.plan.x, a.plan.y), q = P(b.plan.x, b.plan.y);
        g('line', { 'class': 'pl-edge', x1: p[0], y1: p[1], x2: q[0], y2: q[1] });
      });
    });
    // what you are looking at
    coneG = g('g', { id: 'cone' });
    coneEl = g('path', { 'class': 'pl-cone' }, coneG);
    // one hotspot per place
    scenes.forEach(function (d) {
      var c = P(d.plan.x, d.plan.y);
      var n = g('g', { 'class': 'pl-stop', tabindex: 0, role: 'button', 'data-id': d.id });
      g('circle', { 'class': 'hit', cx: c[0], cy: c[1], r: 14 }, n);
      g('circle', { 'class': 'ring', cx: c[0], cy: c[1], r: 10.5 }, n);
      g('circle', { 'class': 'dot', cx: c[0], cy: c[1], r: 6.2 }, n);
      function pick() { go(d.id); if (mq('(max-width:720px)')) setMenu(false); }
      n.addEventListener('click', pick);
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      n.addEventListener('pointerenter', function () { hint(nm(d)); });
      n.addEventListener('focus', function () { hint(nm(d)); });
      n.addEventListener('pointerleave', function () { hint(null); });
      n.addEventListener('blur', function () { hint(null); });
    });
  })();

  function refreshPlanText() {
    $('#plLabelEntrance').textContent = nm(byId.ingresso);
    $('#plLabelAltar').textContent = nm(byId.altare);
    planSvg.setAttribute('aria-label', L('menuPlan'));
    $$('.pl-stop').forEach(function (n) { n.setAttribute('aria-label', nm(byId[n.getAttribute('data-id')])); });
  }
  function hint(t) { $('#planHint').textContent = t || L('planNote'); }

  function updateCone() {
    if (!current || !cache[current.id]) return;
    var view = cache[current.id].scene.view();
    var aspect = Math.max(0.5, Math.min(2.4, window.innerWidth / window.innerHeight));
    var half = Math.min(80, deg(Math.atan(Math.tan(view.fov() / 2) * aspect)));       // fov is the vertical angle
    var r = 30, a = rad(half);
    var c = P(current.plan.x, current.plan.y);
    var x1 = -r * Math.sin(a), y1 = -r * Math.cos(a), x2 = r * Math.sin(a);
    coneEl.setAttribute('d', 'M0 0L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'A' + r + ' ' + r + ' 0 0 1 ' + x2.toFixed(1) + ' ' + y1.toFixed(1) + 'Z');
    coneG.setAttribute('transform', 'translate(' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ') rotate(' + (current.heading + deg(view.yaw())).toFixed(1) + ')');
  }

  /* ---------- the menu ---------- */
  var menuOpen = false;
  function setMenuView(v) { $('#menu').setAttribute('data-view', v); }
  function setMenu(open, view) {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    var m = $('#menu'); m.setAttribute('aria-hidden', String(!open)); m.inert = !open;
    $('#btnMenu').setAttribute('aria-expanded', String(open));
    if (open) { setMenuView(view || 'main'); if (sideOpen) setSide(false); }
  }
  $('#btnMenu').addEventListener('click', function () { setMenu(!menuOpen); if (menuOpen) $('#mnPlan').focus(); });
  $('#menuClose').addEventListener('click', function () { setMenu(false); $('#btnMenu').focus(); });
  $('#planClose').addEventListener('click', function () { setMenu(false); $('#btnMenu').focus(); });
  $('#planBack').addEventListener('click', function () { setMenuView('main'); $('#mnPlan').focus(); });
  $('#mnPlan').addEventListener('click', function () { setMenuView('plan'); $('#planBack').focus(); });
  $('#mnPlaces').addEventListener('click', function () { setMenu(false); setSide(true); $('#sideClose').focus(); });
  $('#mnHome').addEventListener('click', function () { setMenu(false); goHome(); });
  $$('#mnLang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-l')); }); });

  /* ============================================================ sidebar */
  var sideOpen = false;
  function buildSide() {
    var list = $('#sideList'); list.innerHTML = '';
    T.groups.forEach(function (g) {
      var items = scenes.filter(function (s) { return s.group === g.id; });
      var h = el('h3', 'group-title'); h.textContent = gn(g);
      list.appendChild(h);
      items.forEach(function (d) {
        var b = el('button', 'place'); b.type = 'button'; b.setAttribute('data-id', d.id);
        b.innerHTML = '<img alt="" loading="lazy" width="112" height="63"><span><b></b></span>';
        b.querySelector('img').src = 'assets/thumbs/' + d.id + '.jpg';
        b.querySelector('b').textContent = nm(d);
        if (current && current.id === d.id) b.setAttribute('aria-current', 'true');
        b.addEventListener('click', function () { go(d.id); });
        list.appendChild(b);
      });
    });
  }
  function setSide(open) {
    sideOpen = open;
    if (open && menuOpen) setMenu(false);
    document.body.classList.toggle('side-open', open);
    $('#side').setAttribute('aria-hidden', String(!open));
    $('#side').inert = !open;
    $('#btnSide').setAttribute('aria-expanded', String(open));
    if (typeof syncMobile === 'function') syncMobile();
  }
  var midBox = $('.st-mid');
  function syncMobile() {
    var m = mq('(max-width:720px)');
    if (m) { midBox.setAttribute('role', 'button'); midBox.tabIndex = 0; midBox.setAttribute('aria-label', L('placesAria')); midBox.setAttribute('aria-expanded', String(sideOpen)); }
    else { midBox.removeAttribute('role'); midBox.removeAttribute('tabindex'); midBox.removeAttribute('aria-label'); midBox.removeAttribute('aria-expanded'); }
  }
  midBox.addEventListener('click', function () { if (mq('(max-width:720px)')) { setSide(true); $('#sideClose').focus(); } });
  midBox.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && mq('(max-width:720px)')) { e.preventDefault(); setSide(true); $('#sideClose').focus(); } });
  window.addEventListener('resize', syncMobile);
  $('#btnSide').addEventListener('click', function () { setSide(true); $('#sideClose').focus(); });
  $('#sideClose').addEventListener('click', function () { setSide(false); $('#btnSide').focus(); });
  $('#sideBrand').addEventListener('click', goHome);
  $('#btnHome').addEventListener('click', goHome);

  /* ============================================================ current place: stepper and list */
  function renderPlace() {
    $('#placeName').textContent = nm(current);
    $('#btnDetail').hidden = !current.media.length;
    var ticks = $('#ticks');
    if (!ticks.children.length) scenes.forEach(function () { ticks.appendChild(el('li')); });
    $$('li', ticks).forEach(function (li, i) { li.className = i === current.index ? 'here' : (seen[scenes[i].id] ? 'seen' : ''); });
    $$('.pl-stop').forEach(function (n) {
      var id = n.getAttribute('data-id');
      n.classList.toggle('here', id === current.id);
      n.classList.toggle('seen', !!seen[id] && id !== current.id);
      if (id === current.id) n.setAttribute('aria-current', 'true'); else n.removeAttribute('aria-current');
    });
    $('#planNow').textContent = L('youAreHere') + ': ' + nm(current);
    hint(null); updateCone(); queueLabels();
    $$('.place').forEach(function (b) {
      if (b.getAttribute('data-id') === current.id) { b.setAttribute('aria-current', 'true'); if (sideOpen && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      else b.removeAttribute('aria-current');
    });
  }
  $('#btnPrev').addEventListener('click', function () { go(scenes[(current.index + scenes.length - 1) % scenes.length].id); });
  $('#btnNext').addEventListener('click', function () { go(scenes[(current.index + 1) % scenes.length].id); });
  $('#btnEnter').addEventListener('click', function () { go(T.start); });
  $('#btnEnterText').addEventListener('click', function () { go(T.start); });

  /* ============================================================ zoom, rotation, fullscreen */
  function zoom(factor) {
    if (!current || busy) return;
    var view = cache[current.id].scene.view(), p = view.parameters();
    var target = Math.max(rad(24), Math.min(MAX_FOV, p.fov * factor));
    tween(320, function (k) { view.setParameters({ yaw: p.yaw, pitch: p.pitch, fov: p.fov + (target - p.fov) * k }); });
  }
  $('#btnZoomIn').addEventListener('click', function () { zoom(0.7); });
  $('#btnZoomOut').addEventListener('click', function () { zoom(1.4); });

  var auto = Marzipano.autorotate({ yawSpeed: 0.04, targetPitch: null, targetFov: null });
  var rotateOn = true;
  function rotateLabel() {
    var b = $('#btnRotate');
    b.setAttribute('aria-pressed', String(rotateOn));
    b.setAttribute('aria-label', rotateOn ? L('rotOn') : L('rotOff'));
    b.title = b.getAttribute('aria-label');
    b.firstElementChild.className = rotateOn ? 'i-pause' : 'i-play';
  }
  function applyRotate() {
    var active = rotateOn && !drawerFor && !busy && !document.body.classList.contains('is-home');
    viewer.stopMovement();
    viewer.setIdleMovement(active ? 3500 : Infinity, auto);
    rotateLabel();
    if (active) viewer.startMovement(auto);
  }
  $('#btnRotate').addEventListener('click', function () { rotateOn = !rotateOn; applyRotate(); });
  $('#pano').addEventListener('pointerdown', function () { tweenId++; busy = false; viewer.stopMovement(); });

  var fsBtn = $('#btnFull'), root = document.documentElement;
  if (!root.requestFullscreen) fsBtn.hidden = true;
  fsBtn.addEventListener('click', function () { if (document.fullscreenElement) document.exitFullscreen(); else root.requestFullscreen().catch(function () { }); });

  /* ============================================================ details drawer + video player */
  var drawer = $('#drawer'), stage = $('#stage'), lastTrigger = null;
  var fmt = function (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };

  function buildPlayer(m) {
    var box = el('div', 'player');
    var v = el('video'); v.playsInline = true; v.preload = 'metadata'; v.poster = 'assets/media/' + m.photo; v.src = 'assets/media/' + m.video;
    v.setAttribute('aria-label', lb(m));
    var big = el('button', 'p-big', '<i class="i-play"></i>'); big.type = 'button';
    var bar = el('div', 'p-bar');
    bar.innerHTML = '<div class="p-seek"><input type="range" min="0" max="1000" step="1" value="0"><span class="p-track"><span class="p-fill"></span></span><span class="p-knob"></span></div>' +
      '<div class="p-row"><button type="button" class="p-btn p-play"><i class="i-play"></i></button><span class="p-time"><span class="p-cur">0:00</span> / <span class="p-dur">0:00</span></span><span class="grow"></span>' +
      '<button type="button" class="p-btn p-mute"><i class="i-sound"></i></button></div>';
    box.appendChild(v); box.appendChild(big); box.appendChild(bar);
    var play = $('.p-play', bar), mute = $('.p-mute', bar), seek = $('input', bar), seekBox = $('.p-seek', bar), cur = $('.p-cur', bar), dur = $('.p-dur', bar);
    var idleT = 0;

    function labels() {
      var ended = v.ended, playing = !v.paused && !ended;
      var l = ended ? L('replay') : (playing ? L('pause') : L('play'));
      big.setAttribute('aria-label', l); play.setAttribute('aria-label', l);
      big.firstChild.className = ended ? 'i-replay' : 'i-play';
      play.firstChild.className = playing ? 'i-pause' : (ended ? 'i-replay' : 'i-play');
      mute.setAttribute('aria-label', v.muted ? L('unmute') : L('mute'));
      mute.firstChild.className = v.muted ? 'i-mute' : 'i-sound';
      seek.setAttribute('aria-label', L('seek'));
      box.classList.toggle('playing', playing);
    }
    function wake() { drawer.classList.remove('idle'); box.classList.remove('idle'); clearTimeout(idleT); if (!v.paused) idleT = setTimeout(function () { box.classList.add('idle'); drawer.classList.add('idle'); }, 2600); }
    function toggle() { if (v.paused || v.ended) { if (v.ended) v.currentTime = 0; v.play().catch(function () { }); } else v.pause(); }
    function progress() {
      var d = v.duration || 0, p = d ? v.currentTime / d : 0;
      seekBox.style.setProperty('--p', (p * 100).toFixed(2) + '%');
      seek.value = Math.round(p * 1000); cur.textContent = fmt(v.currentTime); dur.textContent = fmt(d);
    }
    big.addEventListener('click', toggle); play.addEventListener('click', toggle); v.addEventListener('click', toggle);
    mute.addEventListener('click', function () { v.muted = !v.muted; });
    seek.addEventListener('input', function () { if (v.duration) { v.currentTime = v.duration * seek.value / 1000; progress(); } });
    ['play', 'pause', 'ended', 'volumechange'].forEach(function (e) { v.addEventListener(e, function () { labels(); wake(); }); });
    ['timeupdate', 'loadedmetadata', 'durationchange'].forEach(function (e) { v.addEventListener(e, progress); });
    ['pointermove', 'pointerdown', 'focusin', 'keydown'].forEach(function (e) { box.addEventListener(e, wake); });
    labels(); progress();
    return box;
  }

  var curItem = 0;
  function showItem(d, i) {
    var m = d.media[i];
    curItem = i;
    var old = $('video', stage); if (old) old.pause();
    stage.innerHTML = '';
    drawer.setAttribute('data-kind', m.video ? 'video' : 'photo');
    drawer.style.setProperty('--bg', 'url("../assets/media/' + m.photo + '")');
    var frame = el('div', 'frame');
    if (m.video) frame.appendChild(buildPlayer(m));
    else { var img = el('img'); img.src = 'assets/media/' + m.photo; img.alt = lb(m); frame.appendChild(img); }
    var tag = el('span', 'frame-label'); tag.textContent = lb(m);
    frame.appendChild(tag);
    stage.appendChild(frame);
    $$('#stageList button').forEach(function (b, k) { if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  }
  function step(dir) { if (drawerFor && drawerFor.media.length > 1) showItem(drawerFor, (curItem + dir + drawerFor.media.length) % drawerFor.media.length); }
  function fillDrawer(d, active) {
    setText('#drawerTitle', nm(d));
    drawer.classList.toggle('single', d.media.length < 2);
    var list = $('#stageList'); list.innerHTML = '';
    d.media.forEach(function (m, i) {
      var li = el('li'), b = el('button'); b.type = 'button';
      b.innerHTML = '<img alt=""><span><span class="t"></span><span class="k"></span></span>';
      b.querySelector('img').src = 'assets/media/' + m.photo;
      b.querySelector('.t').textContent = lb(m);
      b.querySelector('.k').textContent = m.video ? L('video') : L('photo');
      b.addEventListener('click', function () { showItem(d, i); });
      li.appendChild(b); list.appendChild(li);
    });
    showItem(d, active || 0);
  }
  function openDrawer(d) {
    lastTrigger = document.activeElement; drawerFor = d;
    $('#tour').inert = true;
    fillDrawer(d, 0);
    drawer.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('open'); $('#drawerClose').focus(); });
    applyRotate();
  }
  function closeDrawer(silent) {
    if (!drawerFor) return;
    drawerFor = null;
    $('#tour').inert = false;
    drawer.classList.remove('open');
    var v = $('video', stage); if (v) v.pause();
    setTimeout(function () { if (!drawerFor) { drawer.hidden = true; stage.innerHTML = ''; } }, 520);
    if (!silent && lastTrigger && lastTrigger.focus) lastTrigger.focus();
    applyRotate();
  }
  $('#btnDetail').addEventListener('click', function () { if (current) openDrawer(current); });
  $('#drawerClose').addEventListener('click', function () { closeDrawer(); });
  $('#mPrev').addEventListener('click', function () { step(-1); });
  $('#mNext').addEventListener('click', function () { step(1); });

  document.addEventListener('visibilitychange', function () { if (document.hidden) { var v = $('video', stage); if (v) v.pause(); } });

  /* ============================================================ keyboard */
  var controls = viewer.controls(), FRICTION = 0.06, VEL = 0.7;
  [[37, 'x', -VEL], [39, 'x', VEL], [38, 'y', -VEL], [40, 'y', VEL], [187, 'zoom', -VEL], [189, 'zoom', VEL]].forEach(function (k, n) {
    controls.registerMethod('key' + n, new Marzipano.KeyControlMethod(k[0], k[1], k[2], FRICTION), true);
  });
  drawer.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(1); }
    else if (e.key === 'Tab') {      // keep focus inside the modal
      var f = $$('button, input, video, [tabindex="0"]', drawer).filter(function (n) { return n.offsetParent !== null && !n.disabled; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawerFor) closeDrawer(); else if (menuOpen) { if ($('#menu').getAttribute('data-view') === 'plan') setMenuView('main'); else { setMenu(false); $('#btnMenu').focus(); } } else if (sideOpen) { setSide(false); $('#btnSide').focus(); }
  });

  if (EDIT) {
    $('#pano').addEventListener('click', function (e) {
      if (!current) return;
      var c = cache[current.id].scene.view().screenToCoordinates({ x: e.clientX, y: e.clientY });
      console.log('{ yaw: ' + c.yaw.toFixed(4) + ', pitch: ' + c.pitch.toFixed(4) + ' }');
    });
  }

  /* ============================================================ start */
  // show a clean address (/ instead of /index.html) when served over http(s)
  try { if (/^https?:$/.test(location.protocol) && /\/index\.html$/.test(location.pathname)) history.replaceState(null, '', location.pathname.replace(/index\.html$/, '') + location.search + location.hash); } catch (e) { }
  var hash = location.hash.replace('#', '');
  setSide(false);
  syncMobile();
  applyLang();
  if (byId[hash]) go(hash, { instant: true }); else getScene(T.start);
  applyRotate();
  window.addEventListener('hashchange', function () {
    var h = location.hash.replace('#', '');
    if (byId[h] && (!current || current.id !== h || document.body.classList.contains('is-home'))) go(h);
  });
  new MutationObserver(applyRotate).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
