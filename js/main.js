/* Il Collega — Tezze sul Brenta (VI) — loader, sfondo generato, fisarmonica a ventaglio, hotspot, lightbox */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var lenis = null;
  var animReady = false;      // true dopo la fine del loader
  var bgTriggers = [];

  /* ============================================================
     SFONDO: sbarre di legno (da sinistra e da destra, mai a contatto,
     più fitte in alto e più rade scendendo) + corten su nero:
     quadrati → cerchi → crepe
     ============================================================ */
  /* posizioni verticali della texture legno con le fasce più chiare: le fasce scure (poco visibili) non si usano */
  var BRIGHT = [0, 8, 17, 25, 33, 42, 50, 58, 67, 75, 83, 92, 100, 108, 117, 125, 133, 142, 150, 158, 167, 175, 183, 192, 200, 208, 217, 225, 233, 242, 250, 258, 267, 275, 283, 292, 300, 308, 317, 325, 333, 342, 350, 483, 500, 508];
  function brightPos(r) { return '-' + Math.round(r() * 280) + 'px -' + BRIGHT[Math.floor(r() * BRIGHT.length)] + 'px'; }
  var bgW = 0;
  function buildBg() {
    var bg = $('#bg'), page = $('#page');
    if (!bg || !page) return;
    bgTriggers.forEach(function (t) { t.kill(); });
    bgTriggers = [];
    bg.innerHTML = '';
    $$('.opere > .bar').forEach(function (n) { n.parentNode.removeChild(n); });

    var W = page.clientWidth, H = page.offsetHeight;
    bgW = window.innerWidth;
    var small = W < 760;
    var rnd = mulberry32(20261114);
    var NS = 'http://www.w3.org/2000/svg';

    var maxLen = (small ? 0.2 : 0.3) * W;   // 2 x 33% < 100%: le sbarre non si toccano mai
    var minLen = (small ? 0.06 : 0.09) * W;
    var bars = [], shapes = [];
    var frag = document.createDocumentFragment();

    var dove = $('#dove'), pr = page.getBoundingClientRect();
    var bigStart = (dove ? dove.getBoundingClientRect().top - pr.top : H * 0.86) - 90;

    /* zona delle righe della fisarmonica (testi): lì niente sbarre che coprono le scritte */
    var accEl = $('.acc'), accTop = -1, accBot = -1;
    if (accEl) { var ar = accEl.getBoundingClientRect(); accTop = ar.top - pr.top; accBot = ar.bottom - pr.top; }

    /* sezione "Chiama per parlarne": niente legno né corten pieno, solo le crepe color corten */
    var chEl = $('#chiama'), chTop = -1, chBot = -1;
    if (chEl) { var cr0 = chEl.getBoundingClientRect(); chTop = cr0.top - pr.top; chBot = cr0.bottom - pr.top; }

    /* --- sbarre grandi: 20% legno, 40% corten, 40% acciaio (ogni gruppo di 5 ha esattamente 1 legno, 2 corten, 2 acciaio, in ordine mescolato) --- */
    var matQueue = [], barIdx = 0;
    function matFor() {
      if (!matQueue.length) {
        matQueue = ['wood', 'corten', 'corten', 'steel', 'steel'];
        for (var i = matQueue.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = matQueue[i]; matQueue[i] = matQueue[j]; matQueue[j] = t; }
      }
      return matQueue.pop();
    }
    var y = small ? 72 : 64, side = rnd() < 0.5 ? 'l' : 'r';
    while (y < Math.min(H - 140, bigStart - 70)) {
      if (accTop >= 0 && y < accBot + 230 && y + 160 > accTop - 20) { y = accBot + 240; continue; }   // spazio libero per la coppia di lastre sotto le categorie
      if (chTop >= 0 && y < chBot + 20 && y + 160 > chTop - 20) { y = chBot + 30; continue; }
      var t = y / H;
      var th = Math.round(((small ? 15 : 22) + rnd() * (small ? 16 : 26)) * 3);   // altezza x3
      var len = Math.round(minLen + rnd() * (maxLen - minLen) * (1 - 0.3 * t));
      if (rnd() < 0.62) side = side === 'l' ? 'r' : 'l';
      var el = document.createElement('i');
      var mat = matFor(barIdx++);
      el.className = 'bar ' + mat + ' ' + side;
      el.style.top = y + 'px';
      el.style.height = th + 'px';
      el.style.width = len + 'px';
      if (mat === 'wood') el.style.backgroundPosition = brightPos(rnd);
      else if (mat === 'corten') el.style.backgroundPosition = '-' + Math.round(rnd() * 500) + 'px -' + Math.round(rnd() * 300) + 'px';
      frag.appendChild(el);
      bars.push({ el: el, side: side, y: y, th: th, len: len });
      var gap = (24 + 380 * Math.pow(t, 1.12)) * 2.4 * (0.6 + rnd() * 0.85) * (small ? 0.8 : 1);   // spazi più ampi per tenere il nero all'80%
      y += th + gap;
    }

    /* zona della sezione "Le opere": lì niente quadrati/cerchi in corten, solo il legno (con margine per la fisarmonica aperta) */
    var opSec = $('#opere'), opTop = -1, opBot = -1;
    if (opSec) { opTop = opSec.getBoundingClientRect().top - pr.top - 40; opBot = opTop + 40 + opSec.offsetHeight + 650; }

    /* --- quadrati e cerchi --- */
    function hits(x, yy, s) {
      if (opTop >= 0 && yy + s > opTop && yy < opBot) return true;
      if (chTop >= 0 && yy + s > chTop - 30 && yy < chBot + 30) return true;
      for (var i = 0; i < bars.length; i++) {
        var b = bars[i];
        if (yy + s + 24 < b.y || yy - 24 > b.y + b.th) continue;
        var bx0 = b.side === 'l' ? 0 : W - b.len, bx1 = b.side === 'l' ? b.len : W;
        if (x + s + 24 > bx0 && x - 24 < bx1) return true;
      }
      return false;
    }
    /* quadrati e cerchi alternati in parti uguali su tutta la zona; i cerchi sono sempre pieni */
    function zone(from, to) {
      var y0 = from * H, y1 = to * H, n = Math.round((y1 - y0) / (small ? 430 : 330));
      for (var i = 0; i < n; i++) {
        if (i % 2 === 0) continue;   // niente più quadrati in corten: restano solo i cerchi pieni
        var cls = 'ci';
        for (var tries = 0; tries < 40; tries++) {
          /* solo nelle fasce laterali, vicino al legno: mai al centro della pagina */
          var bandW = small ? 44 : Math.max(70, (W - Math.min(1180, W - 2 * 40)) / 2 - 12);
          var s = Math.round((small ? 18 : 26) + rnd() * (small ? 14 : 70));
          s = Math.min(s, bandW - 10);
          var onLeft = rnd() < 0.5;
          var x = onLeft ? Math.round(6 + rnd() * Math.max(1, bandW - s - 6)) : Math.round(W - bandW + rnd() * Math.max(1, bandW - s - 6));
          var yy = Math.round(y0 + 40 + rnd() * (y1 - y0 - s - 80));
          if (hits(x, yy, s)) continue;
          var e = document.createElement('i');
          e.className = cls + (cls === 'sq' && rnd() < 0.3 ? ' hollow' : '');
          e.style.cssText = 'left:' + x + 'px;top:' + yy + 'px;width:' + s + 'px;height:' + s + 'px;background-position:-' + Math.round(rnd() * 500) + 'px -' + Math.round(rnd() * 300) + 'px';
          frag.appendChild(e);
          shapes.push({ el: e, rot: cls === 'sq' ? (rnd() * 40 - 20) : 0, drift: (rnd() - 0.5) * 120 });
          break;
        }
      }
    }
    /* niente più quadrati né cerchi (corten o acciaio): sfondo solo con sbarre e crepe */

    bg.appendChild(frag);

    /* legno, corten, ferro, legno sotto la mappa (solo a destra): stessa animazione delle sbarre */
    $$('.dove .slab').forEach(function (sl) { bars.push({ el: sl, side: 'r', y: -1e9, th: 0, len: 0 }); });

    /* coppia simmetrica di lastre di legno sotto le categorie (nello spazio nero, stessa altezza, stessa misura) */
    var opS = $('#opere');
    if (opS) {
      ['l', 'r'].forEach(function (sd) {
        var pe = document.createElement('i');
        pe.className = 'bar pair ' + sd;
        pe.style.backgroundPosition = '-60px -' + BRIGHT[Math.floor(BRIGHT.length / 2)] + 'px';
        opS.appendChild(pe);
        bars.push({ el: pe, side: sd, y: -1e9, th: 0, len: 0 });
      });
    }

    /* --- crepe in corten sull'ultimo terzo --- */
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'cracks');
    svg.innerHTML = '<defs><linearGradient id="cg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + W + '" y2="0"><stop offset="0" stop-color="#d4753a"/><stop offset=".5" stop-color="#9a4318"/><stop offset="1" stop-color="#cf6a2c"/></linearGradient></defs>';
    var cracks = [];
    /* le scritte rosse non devono mai essere toccate dalle crepe: area vietata attorno a ogni titolo/etichetta rossa */
    var redBoxes = [];
    $$('h2,h3,.eyebrow,.acc-t,.acc-n,.tel-big,.contatti span,.alert,.hero .hl').forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) redBoxes.push([r.left - 20, r.top - pr.top - 20, r.right + 20, r.bottom - pr.top + 20]);
    });
    function blocked(x, yy) {
      for (var i = 0; i < redBoxes.length; i++) {
        var b = redBoxes[i];
        if (x > b[0] && x < b[2] && yy > b[1] && yy < b[3]) return true;
      }
      return false;
    }
    function segBlocked(x0, y0, x1, y1) {
      var n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 5));
      for (var k = 0; k <= n; k++) { if (blocked(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)) return true; }
      return false;
    }
    function grow(x, yy, ang, segs, w, depth) {
      if (blocked(x, yy)) return;
      var d = 'M' + x.toFixed(1) + ' ' + yy.toFixed(1), n = 0;
      for (var i = 0; i < segs; i++) {
        ang += (rnd() - 0.5) * 0.95;
        var l = 14 + rnd() * 36;
        var nx = x + Math.cos(ang) * l, ny = yy + Math.sin(ang) * l;
        if (segBlocked(x, yy, nx, ny)) break;     // la crepa si ferma prima di toccare una scritta rossa
        x = nx; yy = ny; n++;
        d += ' L' + x.toFixed(1) + ' ' + yy.toFixed(1);
        if (depth < 2 && rnd() < 0.2) grow(x, yy, ang + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.8), Math.max(3, Math.floor(segs * 0.55)), w * 0.62, depth + 1);
      }
      if (n > 0) cracks.push({ d: d, w: w });
    }
    var cy0 = chTop >= 0 ? Math.min(H * 0.68, chTop - 30) : H * 0.68, cy1 = H * 0.975, nc = Math.round((cy1 - cy0) / (small ? 300 : 240));
    var zt = Math.max(0, Math.floor(cy0 - 80));
    svg.setAttribute('viewBox', '0 ' + zt + ' ' + W + ' ' + (H - zt));
    svg.style.height = (H - zt) + 'px';
    for (var c = 0; c < nc; c++) {
      grow(rnd() * W, cy0 + rnd() * (cy1 - cy0 - 160), Math.PI / 2 + (rnd() - 0.5) * 2.6, 6 + Math.floor(rnd() * 9), 1.6 + rnd() * 1.6, 0);
    }
    /* crepe in più dietro i lati della sezione "Chiama per parlarne" */
    if (chTop >= 0) {
      for (var cc = 0; cc < (small ? 3 : 6); cc++) {
        var cxx = (cc % 2 === 0 ? 0.04 + rnd() * 0.22 : 0.74 + rnd() * 0.22) * W;
        grow(cxx, chTop + 30 + rnd() * Math.max(40, chBot - chTop - 260), Math.PI / 2 + (rnd() - 0.5) * 2.2, 7 + Math.floor(rnd() * 8), 1.6 + rnd() * 1.6, 0);
      }
    }
    var paths = [];
    cracks.forEach(function (k) {
      var glow = document.createElementNS(NS, 'path');
      glow.setAttribute('d', k.d); glow.setAttribute('stroke', '#c2602a'); glow.setAttribute('stroke-opacity', '.14'); glow.setAttribute('stroke-width', (k.w * 4).toFixed(1));
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', k.d); p.setAttribute('stroke', 'url(#cg)'); p.setAttribute('stroke-width', k.w.toFixed(1));
      svg.appendChild(glow); svg.appendChild(p);
      paths.push(glow, p);
    });
    bg.appendChild(svg);

    /* stato iniziale (sempre via GSAP, mai via CSS) */
    if (hasGsap && !reduce) {
      bars.forEach(function (b) { gsap.set(b.el, { xPercent: b.side === 'l' ? -102 : 102 }); });
      shapes.forEach(function (s) { gsap.set(s.el, { rotation: s.rot, scale: 0.4, opacity: 0 }); });
      paths.forEach(function (p) {
        var L = p.getTotalLength ? p.getTotalLength() : 400;
        p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p._len = L;
      });
      if (animReady) startBgAnim(bars, shapes, paths);
      bg._data = { bars: bars, shapes: shapes, paths: paths };
    }
  }

  function startBgAnim(bars, shapes, paths) {
    var barEls = bars.map(function (b) { return b.el; });
    bgTriggers = bgTriggers.concat(ScrollTrigger.batch(barEls, {
      start: 'clamp(top 50%)', once: true,
      onEnter: function (b) { gsap.to(b, { xPercent: 0, duration: 1.25, ease: 'circ.out', stagger: 0.07 }); }
    }));
    var shEls = shapes.map(function (s) { return s.el; });
    bgTriggers = bgTriggers.concat(ScrollTrigger.batch(shEls, {
      start: 'clamp(top 50%)', once: true,
      onEnter: function (b) { gsap.to(b, { scale: 1, opacity: function (i, el) { return parseFloat(el.getAttribute('data-op')) || 0.55; }, duration: 1.1, ease: 'back.out(1.8)', stagger: 0.08 }); }
    }));
    shapes.forEach(function (s) {
      var tw = gsap.to(s.el, { y: s.drift, ease: 'none', scrollTrigger: { trigger: s.el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      bgTriggers.push(tw.scrollTrigger);
    });
    paths.forEach(function (p) {
      var st = ScrollTrigger.create({
        trigger: p, start: 'clamp(top 50%)', once: true,
        onEnter: function () { gsap.to(p, { strokeDashoffset: 0, duration: 1.8, ease: 'sine.inOut' }); }
      });
      bgTriggers.push(st);
    });
  }

  /* ============================================================
     LOGO ANIMATO IN TESTATA: la C cade sulla trave in ferro e rimbalza,
     poi compaiono O L L E G A e IL; infine entrano le altre scritte
     ============================================================ */
  function runHeroLogo() {
    var logo = $('.hl');
    var heroRv = $$('.hero .rv');
    if (!logo || !hasGsap || reduce) return;
    var c = $('.hl-c', logo), rest = $$('.hl-rest i', logo), il = $$('.hl-il i', logo), sparks = $('.hl-sparks', logo), beam = $('.hl-beam', logo);

    var cr = c.getBoundingClientRect(), h = cr.height;
    var fall = cr.top + h + 60;
    gsap.set(c, { y: -fall, rotation: -14 });
    gsap.set(rest.concat(il), { autoAlpha: 0 });

    function impact(power) {
      var lr = logo.getBoundingClientRect(), br = beam.getBoundingClientRect(), r = c.getBoundingClientRect();
      var cx = r.left + r.width / 2 - lr.left, n = Math.round(9 * power);
      for (var i = 0; i < n; i++) {
        var s = document.createElement('b');
        s.style.left = (cx + (Math.random() - 0.5) * r.width * 0.9) + 'px';
        s.style.top = (br.top - lr.top - 2) + 'px';
        sparks.appendChild(s);
        gsap.to(s, {
          x: (Math.random() - 0.5) * 260 * power, y: -(40 + Math.random() * 120) * power,
          opacity: 0, scale: 0.2, duration: 0.5 + Math.random() * 0.5, ease: 'power2.out',
          onComplete: function () { if (this.targets()[0].parentNode) this.targets()[0].remove(); }
        });
      }
    }

    var tl = gsap.timeline({ delay: 0.3 });
    tl.to(c, { y: 0, rotation: 0, duration: 0.5, ease: 'power2.in' })
      .add(function () { impact(1); })
      .to(c, { scaleY: 0.8, scaleX: 1.15, duration: 0.07, ease: 'power1.out' })
      .to(c, { y: -h * 0.44, scaleY: 1.04, scaleX: 0.97, rotation: 5, duration: 0.34, ease: 'power2.out' })
      .to(c, { y: 0, scaleY: 0.9, scaleX: 1.07, rotation: 0, duration: 0.3, ease: 'power2.in' })
      .add(function () { impact(0.6); })
      .to(c, { y: -h * 0.17, scaleY: 1.03, scaleX: 0.99, duration: 0.2, ease: 'power2.out' })
      .to(c, { y: 0, scaleY: 0.95, scaleX: 1.03, duration: 0.17, ease: 'power2.in' })
      .add(function () { impact(0.3); })
      .to(c, { y: -h * 0.05, scaleX: 1, scaleY: 1, duration: 0.1, ease: 'power2.out' })
      .to(c, { y: 0, duration: 0.1, ease: 'power2.in' })
      /* a C ferma: compaiono O L L E G A come metallo incandescente che si raffredda, poi IL */
      .addLabel('letters', '+=0.12')
      .fromTo(rest, { autoAlpha: 0, y: 22, scale: 1.14, color: '#ff8c3c' },
        { autoAlpha: 1, y: 0, scale: 1, color: '#b23a2e', duration: 0.5, ease: 'back.out(2.2)', stagger: 0.15, clearProps: 'color' }, 'letters')
      .fromTo(il, { autoAlpha: 0, y: 22, scale: 1.14, color: '#ff8c3c' },
        { autoAlpha: 1, y: 0, scale: 1, color: '#b23a2e', duration: 0.5, ease: 'back.out(2.2)', stagger: 0.12, clearProps: 'color' }, '>-0.05')
      /* poi le altre scritte della testata */
      .to(heroRv, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', stagger: 0.14,
        onComplete: function () { gsap.set(heroRv, { clearProps: 'transform,opacity,filter' }); } }, '>-0.1');

    /* paracadute: se qualcosa va storto le scritte compaiono comunque */
    setTimeout(function () { gsap.set(heroRv, { opacity: 1, y: 0, filter: 'none' }); gsap.set(rest.concat(il), { autoAlpha: 1 }); }, 9000);
  }

  /* ============================================================
     AVVIO SITO
     ============================================================ */
  var started = false;
  function startSite() {
    if (started) return; started = true;
    animReady = true;

    if (!reduce && window.Lenis && hasGsap) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    if (hasGsap && !reduce) {
      /* sfondo */
      var d = $('#bg')._data;
      if (d) startBgAnim(d.bars, d.shapes, d.paths);

      /* titoli a maschera */
      ScrollTrigger.batch($$('.rv-line > span'), {
        start: 'clamp(top 50%)', once: true,
        onEnter: function (b) { gsap.to(b, { yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: 0.12 }); }
      });
      /* testi: dissolvenza con sfocatura (blur) */
      ScrollTrigger.batch($$('.rv').filter(function (e) { return !e.closest('.hero'); }), {
        start: 'clamp(top 50%)', once: true,
        onEnter: function (b) {
          gsap.to(b, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power2.out', stagger: 0.1,
            onComplete: function () { gsap.set(b, { clearProps: 'transform,opacity,filter' }); } });
        }
      });
      /* immagini: tendina in clip-path */
      $$('.wipe').forEach(function (el) {
        ScrollTrigger.create({
          trigger: el, start: 'clamp(top 50%)', once: true,
          onEnter: function () {
            gsap.to(el, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power3.inOut', onComplete: function () { gsap.set(el, { clearProps: 'clipPath' }); } });
          }
        });
      });
      ScrollTrigger.refresh();
    }
  }

  /* stato iniziale delle rivelazioni (sempre via GSAP) */
  function prepReveals() {
    if (!hasGsap || reduce) return;
    $$('[data-rvgroup] > *').forEach(function (el) { el.classList.add('rv'); });
    gsap.set('.rv-line > span', { yPercent: 112 });
    gsap.set('.rv', { opacity: 0, y: 28, filter: 'blur(8px)' });
    $$('.prova-fig, .hs-stage, .map, .hero-photo').forEach(function (el) { el.classList.add('wipe'); });
    gsap.set('.wipe', { clipPath: 'inset(0 100% 0 0)' });
  }

  /* ============================================================
     HEADER + NAV
     ============================================================ */
  var header = $('#siteHeader'), toggle = $('#navToggle'), nav = $('#siteNav');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('scrolled', y > 40);
    var navOpen = nav.classList.contains('is-open');
    header.classList.toggle('hide', y > lastY && y > 320 && !navOpen);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle) {
    toggle.addEventListener('click', function () {
      var o = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', o);
    });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = $(id); if (!t) return;
      e.preventDefault();
      nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', false);
      if (lenis) lenis.scrollTo(t, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
      else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ============================================================
     FISARMONICA + MAZZI A VENTAGLIO
     ============================================================ */
  var accItems = $$('.acc-item');
  function closeItem(item) {
    item.classList.remove('open');
    $('.acc-head', item).setAttribute('aria-expanded', 'false');
    $$('.deck', item).forEach(function (d) { d.classList.remove('is-open'); });
  }
  function openItem(item) {
    item.classList.add('open');
    $('.acc-head', item).setAttribute('aria-expanded', 'true');
    setTimeout(function () {
      if (hasGsap) ScrollTrigger.refresh();
      var r = item.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 20) {
        var target = item;
        if (lenis) lenis.scrollTo(target, { offset: -90, duration: 0.9 });
        else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    }, 860);
  }
  accItems.forEach(function (item) {
    $('.acc-head', item).addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      accItems.forEach(closeItem);
      if (!wasOpen) openItem(item);
    });
  });

  /* ============================================================
     LIGHTBOX (con zoom al click e pan col cursore)
     ============================================================ */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  var lbList = [], lbIdx = 0, lastFocus = null;
  function lbShow() {
    var it = lbList[lbIdx];
    lbImg.src = it.src; lbImg.alt = it.alt || '';
    lbCap.textContent = it.cap || '';
    lb.classList.remove('zoomed');
    lbImg.style.transform = '';
  }
  function openLb(list, idx) {
    lbList = list; lbIdx = idx; lastFocus = document.activeElement;
    lb.classList.toggle('single', list.length < 2);
    lbShow(); lb.hidden = false;
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
    $('.lb-x', lb).focus();
  }
  function closeLb() {
    lb.hidden = true; lbImg.removeAttribute('src');
    if (lenis) lenis.start(); else document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function step(d) { if (lbList.length < 2) return; lbIdx = (lbIdx + d + lbList.length) % lbList.length; lbShow(); }
  $('.lb-x', lb).addEventListener('click', closeLb);
  $('.lb-prev', lb).addEventListener('click', function () { step(-1); });
  $('.lb-next', lb).addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-fig')) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Tab') {
      var f = $$('button', lb).filter(function (b) { return b.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  /* zoom: click = ingrandisce, il cursore sposta l'inquadratura */
  lb.classList.add('zoomable');
  lbImg.addEventListener('click', function (e) {
    var z = lb.classList.toggle('zoomed');
    if (z) panTo(e); else lbImg.style.transform = '';
  });
  function panTo(e) {
    var r = lbImg.getBoundingClientRect();
    var ox = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
    var oy = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100));
    lbImg.style.transformOrigin = ox + '% ' + oy + '%';
    lbImg.style.transform = 'scale(2.6)';
  }
  lbImg.addEventListener('mousemove', function (e) { if (lb.classList.contains('zoomed')) panTo(e); });

  /* foto dei mazzi */
  $$('.deck').forEach(function (deck) {
    var item = deck.closest('.acc-item'), group = item ? item.getAttribute('data-group') : '';
    var btns = $$('.dc', deck);
    var list = btns.map(function (b) {
      var im = $('img', b);
      return { src: b.getAttribute('data-src'), alt: im.alt, cap: group + ' — ' + im.alt };
    });
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var wide = window.matchMedia('(min-width:761px)').matches && !deck.classList.contains('deck-grid');
        if (wide && !deck.classList.contains('is-open') && !deck.matches(':hover')) { deck.classList.add('is-open'); return; }
        openLb(list, i);
      });
    });
  });
  var provaBtn = $('.prova-btn');
  if (provaBtn) provaBtn.addEventListener('click', function () {
    openLb([{ src: provaBtn.getAttribute('data-src'), alt: $('img', provaBtn).alt, cap: 'Recinzione in corten che scende lungo la strada' }], 0);
  });

  /* hotspot: hover = anteprima ingrandita, click = zoom a tutto schermo */
  var dots = $$('.hs-dot');
  function unpin() { dots.forEach(function (d) { d.classList.remove('is-pinned'); }); }
  dots.forEach(function (dot) {
    dot.addEventListener('click', function (e) {
      e.stopPropagation();
      var was = dot.classList.contains('is-pinned');
      unpin();
      if (!was) dot.classList.add('is-pinned');
    });
  });
  document.addEventListener('click', unpin);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') unpin(); });

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    buildBg();
    prepReveals();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (Math.abs(window.innerWidth - bgW) > 40) buildBg();
        if (hasGsap) ScrollTrigger.refresh();
      }, 250);
    });
    var fontsReady = (document.fonts && document.fonts.load)
      ? Promise.race([document.fonts.load('900 100px "Big Shoulders Display"'), new Promise(function (r) { setTimeout(r, 2500); })])
      : Promise.resolve();
    fontsReady.then(function () {
      // ricostruisco lo sfondo con i font caricati (l'altezza pagina può cambiare)
      buildBg();
      startSite();
      runHeroLogo();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
