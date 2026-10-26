/* =========================================================
   HoneyDip — scroll scenes, smooth scrolling, micro-interactions
   ========================================================= */
(function () {
  'use strict';

  /* ---- EDIT HERE: your order contacts ---- */
  var WHATSAPP = '';                       // e.g. '923001234567' (country code, no + or spaces)
  var EMAIL = 'khalil.operation@gmail.com';

  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(pointer: fine)').matches;
  var W = innerWidth, H = innerHeight;

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function c01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eout(t) { return 1 - Math.pow(1 - t, 3); }
  function eio(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function range(p, a, b) { return c01((p - a) / (b - a)); }

  /* ---------- contact links ---------- */
  var msg = encodeURIComponent('Hi! I would like to order HoneyDip (10 spoons, Rs 399).');
  var wa = $('#waBtn'), mail = $('#mailBtn');
  if (wa) wa.href = WHATSAPP ? 'https://wa.me/' + WHATSAPP + '?text=' + msg : 'mailto:' + EMAIL + '?subject=HoneyDip%20order&body=' + msg;
  if (mail) mail.href = 'mailto:' + EMAIL + '?subject=HoneyDip';

  /* ---------- split text into chars ---------- */
  $$('[data-split]').forEach(function (el) {
    var i = 0;
    function walk(node, parent) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { parent.appendChild(doc.createTextNode(' ')); return; }
          var w = doc.createElement('span'); w.className = 'word';
          Array.from(part).forEach(function (ch) {
            var c = doc.createElement('span'); c.className = 'char'; c.textContent = ch; c.style.setProperty('--ci', i++); w.appendChild(c);
          });
          parent.appendChild(w);
        });
      } else if (node.nodeType === 1) {
        var clone = node.cloneNode(false);
        Array.prototype.slice.call(node.childNodes).forEach(function (n) { walk(n, clone); });
        parent.appendChild(clone);
      }
    }
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var frag = doc.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (n) { walk(n, frag); });
    el.textContent = ''; el.appendChild(frag); el.setAttribute('aria-label', label);
    Array.prototype.slice.call(el.children).forEach(function (c) { c.setAttribute('aria-hidden', 'true'); });
  });

  /* ---------- smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  }
  $$('[data-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (!id || id.charAt(0) !== '#') return;
      var t = id === '#top' ? 0 : $(id); if (t === null) return;
      e.preventDefault(); closeNav();
      if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.6, easing: function (x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); } });
      else if (t === 0) scrollTo({ top: 0, behavior: 'smooth' }); else t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
    });
  });

  /* ---------- mobile nav ---------- */
  var toggle = $('#navToggle');
  function closeNav() { root.classList.remove('nav-open'); if (toggle) toggle.setAttribute('aria-expanded', 'false'); if (lenis) lenis.start(); }
  if (toggle) toggle.addEventListener('click', function () {
    var open = root.classList.toggle('nav-open'); toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  /* ---------- reveal on view ---------- */
  var counted = new WeakSet();
  function countUp(el) {
    if (counted.has(el)) return; counted.add(el);
    var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = performance.now(), dur = 1600;
    (function step(t) { var p = c01((t - t0) / dur); el.textContent = Math.round(eout(p) * to) + suf; if (p < 1) requestAnimationFrame(step); })(t0);
  }
  if ('IntersectionObserver' in window && !RM) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('.count', en.target).forEach(countUp); if (en.target.classList.contains('count')) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    $$('.rv, #anat').forEach(function (el) { io.observe(el); });
  } else {
    $$('.rv, #anat').forEach(function (el) { el.classList.add('in'); });
    $$('.count').forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
  }

  /* ---------- scenes ---------- */
  var scenes = $$('[data-scene]').map(function (el) { return { el: el, name: el.getAttribute('data-scene'), top: 0, len: 1, p: 0 }; });
  function measure() {
    W = innerWidth; H = innerHeight;
    var y = scrollY;
    scenes.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.top = r.top + y; s.len = Math.max(1, s.el.offsetHeight - H); });
    if (track) trackMax = Math.max(0, track.scrollWidth - W + 40);
    setFall();
  }

  // hero
  var heroCopy = $('#heroCopy'), heroPack = $('#heroPack'), heroGlow = $('#heroGlow'), tagA = $('#tagA'), tagB = $('#tagB'), cue = $('#scrollCue');
  var mx = 0, my = 0, smx = 0, smy = 0;
  function renderHero(p) {
    var a = eio(range(p, 0, 1));
    var k = W < 960 ? .5 : 1;
    if (heroPack) heroPack.style.transform = 'translate3d(' + ((-a * 18 + smx * 18) * k) + 'px,' + (a * 70 + smy * 14) + 'px,0) rotateY(' + (smx * 8 - a * 10) + 'deg) rotateX(' + (-smy * 6) + 'deg) scale(' + (1 + a * .12) + ')';
    if (heroCopy) { heroCopy.style.transform = 'translate3d(0,' + (-a * 90) + 'px,0)'; heroCopy.style.opacity = (1 - range(p, .45, .95)).toFixed(3); }
    if (heroGlow) heroGlow.style.transform = 'translate3d(' + (smx * 30) + 'px,' + (smy * 30) + 'px,0) scale(' + (1 + a * .3) + ')';
    var ta = range(p, .08, .4), tb = range(p, .2, .55);
    if (tagA) { tagA.style.opacity = eout(ta).toFixed(3); tagA.style.transform = 'translate3d(' + ((1 - eout(ta)) * -40) + 'px,' + (-a * 30) + 'px,0)'; }
    if (tagB) { tagB.style.opacity = eout(tb).toFixed(3); tagB.style.transform = 'translate3d(' + ((1 - eout(tb)) * 40) + 'px,' + (a * 30) + 'px,0)'; }
    if (cue) cue.style.opacity = (1 - range(p, 0, .1)).toFixed(3);
  }

  // jar
  var jar = $('#jar'), drop = $('#drop'), fillPct = $('#fillPct'), fillBar = $('#fillBar'), stages = $$('.stage');
  var CAV_TOP = 57.35, CAV_BOT = 97.06;
  function setFall() {
    if (!jar || !drop) return;
    var lvl = parseFloat(jar.style.getPropertyValue('--lvl')) || 94;
    var hpx = jar.getBoundingClientRect().height;
    drop.style.setProperty('--fall', Math.max(20, (lvl - 13 - 4) / 100 * hpx) + 'px');
  }
  var lastLvl = -1;
  function renderJar(p) {
    var f = .05 + .95 * eio(range(p, .03, .95));
    var lvl = CAV_BOT - f * (CAV_BOT - CAV_TOP);
    if (Math.abs(lvl - lastLvl) > .01) { jar.style.setProperty('--lvl', lvl.toFixed(2)); lastLvl = lvl; setFall(); }
    var pct = Math.round(f * 100);
    if (fillPct) fillPct.textContent = pct + '%';
    if (fillBar) fillBar.style.transform = 'scaleX(' + f.toFixed(3) + ')';
    var n = stages.length;
    stages.forEach(function (st, i) {
      var c = (i + .5) / n, w = .5 / n, dist = p - c;
      if ((i === 0 && dist < 0) || (i === n - 1 && dist > 0)) dist = 0;
      var vis = c01(1 - (Math.abs(dist) - w * .45) / (w * .5));
      var y = (dist > 0 ? -1 : 1) * 40;
      st.style.opacity = eout(vis).toFixed(3);
      st.style.transform = 'translate3d(0,' + (y * (1 - vis)).toFixed(1) + 'px,0)';
      st.style.filter = vis < .98 ? 'blur(' + ((1 - vis) * 8).toFixed(1) + 'px)' : '';
      st.style.pointerEvents = vis > .5 ? 'auto' : 'none';
    });
  }

  // horizontal track
  var track = $('#track'), trackMax = 0, panelImg = $('.panel-img img');
  function renderHow(p) {
    var e = eio(range(p, .05, .95));
    track.style.transform = 'translate3d(' + (-e * trackMax).toFixed(1) + 'px,0,0)';
    if (panelImg) panelImg.style.transform = 'translate3d(' + ((1 - e) * 120).toFixed(1) + 'px,0,0) rotate(' + ((1 - e) * -6).toFixed(2) + 'deg)';
  }

  // quality ring
  var ring = $('#ring'), qItems = $$('#qList li'), qs = $$('.q');
  var lastQ = -1;
  function renderQuality(p) {
    var rot = -p * 270;
    ring.style.transform = 'rotate(' + rot.toFixed(2) + 'deg)';
    qs.forEach(function (q) { q.style.transform = 'rotate(' + (-rot).toFixed(2) + 'deg)'; });
    var k = Math.min(3, Math.floor(c01(p * 1.05) * 4));
    if (k !== lastQ) { qItems.forEach(function (li, i) { li.classList.toggle('on', i === k); }); lastQ = k; }
  }

  var R = { hero: renderHero, jar: renderJar, how: renderHow, quality: renderQuality };

  /* ---------- header + progress ---------- */
  var header = $('#header'), prog = $('#progress'), lastY = 0;
  function chrome(y) {
    var max = doc.documentElement.scrollHeight - H;
    prog.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
    header.classList.toggle('solid', y > 40);
    if (Math.abs(y - lastY) > 6) { header.classList.toggle('hide', y > lastY && y > 300 && !root.classList.contains('nav-open')); lastY = y; }
  }

  /* ---------- cursor + magnetic + tilt ---------- */
  var cursor = $('#cursor'), cx = W / 2, cy = H / 2, tx = cx, ty = cy;
  if (FINE && !RM) {
    addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; mx = e.clientX / W - .5; my = e.clientY / H - .5; cursor.classList.add('on'); }, { passive: true });
    doc.addEventListener('mouseleave', function () { cursor.classList.remove('on'); });
    doc.addEventListener('mouseover', function (e) { cursor.classList.toggle('hover', !!e.target.closest('a,button,.tilt')); });
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .25) + 'px'); b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .35) + 'px'); });
      b.addEventListener('mouseleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
    $$('.tilt').forEach(function (c) {
      var shine = $('.shine', c);
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transition = 'transform .25s var(--ease), opacity 1s, filter 1s';
        c.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 8) + 'deg) rotateY(' + ((x - .5) * 10) + 'deg) translateZ(0)';
        if (shine) { c.style.setProperty('--sx', x * 100 + '%'); c.style.setProperty('--sy', y * 100 + '%'); }
      });
      c.addEventListener('mouseleave', function () { c.style.transition = 'transform .8s var(--ease)'; c.style.transform = ''; });
    });
  } else if (cursor) cursor.style.display = 'none';

  /* ---------- embers (gold dust) ---------- */
  var cv = $('#embers'), ctx = cv && cv.getContext('2d'), parts = [], DPR = Math.min(2, devicePixelRatio || 1);
  function sizeCanvas() { if (!cv) return; cv.width = W * DPR; cv.height = H * DPR; }
  if (ctx && !RM) {
    for (var i = 0; i < (W < 760 ? 22 : 46); i++) parts.push({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, s: .00025 + Math.random() * .0007, w: Math.random() * 6.28, a: .25 + Math.random() * .5 });
  }
  function drawEmbers(dt, vel) {
    if (!ctx || !parts.length) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.y -= p.s * dt * .06 + vel * .00004 * p.r; p.w += dt * .001;
      if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); } if (p.y > 1.06) p.y = -.04;
      var x = (p.x + Math.sin(p.w) * .01) * cv.width, y = p.y * cv.height, rr = p.r * DPR;
      var g = ctx.createRadialGradient(x, y, 0, x, y, rr * 4);
      g.addColorStop(0, 'rgba(255,214,120,' + p.a + ')'); g.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr * 4, 0, 6.283); ctx.fill();
    }
  }

  /* ---------- main loop ---------- */
  var sy = scrollY, lastT = performance.now(), prevY = sy;
  function frame(t) {
    var dt = Math.min(64, t - lastT); lastT = t;
    if (lenis) lenis.raf(t);
    var y = scrollY;
    sy = (RM || lenis) ? y : lerp(sy, y, 1 - Math.pow(1 - .2, dt / 16.7));   // smoothing on touch / native scroll
    if (Math.abs(sy - y) < .05) sy = y;
    smx = lerp(smx, mx, .06); smy = lerp(smy, my, .06);
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i], p = c01((sy - s.top) / s.len);
      if (sy + H < s.top - 200 || sy > s.top + s.len + H + 200) continue;   // off-screen
      R[s.name] && R[s.name](p);
    }
    chrome(y);
    if (cursor && FINE) { cx = lerp(cx, tx, .2); cy = lerp(cy, ty, .2); cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; }
    drawEmbers(dt, y - prevY); prevY = y;
    requestAnimationFrame(frame);
  }

  var rT; addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { measure(); sizeCanvas(); }, 120); });
  addEventListener('load', measure);

  /* ---------- loader ---------- */
  var loader = $('#loader'), word = $('#loaderWord'), lc = $('#loaderCount');
  function start() { root.classList.add('ready'); }
  measure(); sizeCanvas();
  if (RM || !loader) { if (loader) loader.style.display = 'none'; start(); }
  else {
    if (lenis) lenis.stop();
    var ls = performance.now(), dur = 1500;
    (function tick(t) {
      var p = eio(c01((t - ls) / dur));
      word.style.setProperty('--p', (p * 100).toFixed(1) + '%'); lc.textContent = Math.round(p * 100) + '%';
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(function () {
        loader.classList.add('done'); start(); if (lenis) lenis.start(); measure();
        setTimeout(function () { loader.style.display = 'none'; }, 1200);
      }, 250);
    })(ls);
  }
  requestAnimationFrame(frame);
})();
