/*!
 * Portfolio interactions: header, menu, scroll reveals, magnetic CTAs,
 * refined cursor indicator, project previews and counters.
 * The hero image reveal itself lives in hero-reveal.js.
 */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  doc.classList.add('js');
  if (finePointer) doc.classList.add('has-cursor');

  /* ---------------------------------------------------------------- year */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* -------------------------------------------------------------- header */
  var header = $('[data-header]');
  var darkZone = $('#contact');
  function onScroll() {
    var overDark = !!darkZone && darkZone.getBoundingClientRect().top <= header.offsetHeight / 2;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    header.classList.toggle('is-dark', overDark);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active nav link
  var navLinks = $$('.nav__link');
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------------------------------------------------------------- menu */
  var menu = $('[data-menu]');
  var toggle = $('[data-menu-toggle]');
  var menuFocusTimer;
  function setMenu(open) {
    clearTimeout(menuFocusTimer);
    // Keep keyboard and screen-reader focus inside the open menu
    $$('.skip-link, #main').forEach(function (el) { el.inert = open; });
    doc.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) {
      var first = $('.menu__link', menu);
      if (first) menuFocusTimer = setTimeout(function () { first.focus(); }, 300);
    } else {
      toggle.focus({ preventScroll: true });
    }
  }
  toggle.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
  $$('a', menu).forEach(function (a) {
    a.addEventListener('click', function () { if (a.hash) setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && doc.classList.contains('menu-open')) setMenu(false);
  });

  /* ------------------------------------------------------------- marquee */
  var marquee = $('.marquee');
  var marqueeToggle = $('[data-marquee-toggle]');
  if (marquee && marqueeToggle) {
    marqueeToggle.addEventListener('click', function () {
      var paused = marquee.classList.toggle('is-paused');
      marqueeToggle.setAttribute('aria-pressed', String(paused));
      marqueeToggle.textContent = paused ? 'Play motion' : 'Pause motion';
    });
  }

  /* ------------------------------------------------------ scroll reveals */
  var revealEls = $$('[data-reveal-up], [data-reveal-line]');
  if ('IntersectionObserver' in window && !reduced) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var t = entry.target._revealTarget || entry.target;
        t.classList.add('is-in');
        if (t.hasAttribute('data-reveal-up')) {
          // Drop the reveal hook afterwards so the element's own hover transitions apply again
          t.addEventListener('transitionend', function done(e) {
            if (e.target !== t || e.propertyName !== 'transform') return;
            t.removeEventListener('transitionend', done);
            t.removeAttribute('data-reveal-up');
          });
        }
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    // Stagger siblings that enter together
    revealEls.forEach(function (el) {
      var group = el.closest('section, .hero__content, .contact__inner') || document.body;
      var index = $$('[data-reveal-up], [data-reveal-line]', group).indexOf(el);
      el.style.setProperty('--delay', Math.min(index, 8) * 70 + 'ms');
      // Line reveals start fully clipped by their .line wrapper, so watch the wrapper instead
      var watched = el.hasAttribute('data-reveal-line') ? el.parentElement : el;
      watched._revealTarget = el;
      revealObserver.observe(watched);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------ counters */
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var end = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = performance.now();
        var dur = reduced ? 0 : 1400;
        (function step(now) {
          var p = dur ? Math.min((now - start) / dur, 1) : 1;
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(step);
        })(start);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ------------------------------------------------------ magnetic CTAs */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(function (el) {
      var label = $('.btn__label', el);
      var icon = $('.btn__icon', el);
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        // Normalised offset from the centre (-1..1), so the pull is the same for any button size
        var nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
        var ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
        el.style.transform = 'translate3d(' + nx * 10 + 'px,' + ny * 7 + 'px,0)';
        if (label) label.style.transform = 'translate3d(' + nx * 3 + 'px,' + ny * 2 + 'px,0)';
        if (icon) icon.style.transform = 'translate3d(' + nx * 4 + 'px,' + ny * 3 + 'px,0)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
        if (label) label.style.transform = '';
        if (icon) icon.style.transform = '';
      });
    });
  }

  /* ---------------------------------------- refined cursor indicator */
  var cursor = $('[data-cursor]');
  var hero = $('[data-hero]');
  var stage = $('[data-reveal-stage]');
  if (finePointer && cursor && hero) {
    var pos = { x: -100, y: -100 };
    var cur = { x: -100, y: -100 };
    var cursorRunning = false;
    var inHero = false;

    function loop() {
      var k = reduced ? 1 : 0.28;
      cur.x = lerp(cur.x, pos.x, k);
      cur.y = lerp(cur.y, pos.y, k);
      cursor.style.transform = 'translate3d(' + cur.x + 'px,' + cur.y + 'px,0)';
      if (inHero || Math.abs(cur.x - pos.x) > 0.1 || Math.abs(cur.y - pos.y) > 0.1) {
        requestAnimationFrame(loop);
      } else {
        cursorRunning = false;
      }
    }
    function run() {
      if (!cursorRunning) { cursorRunning = true; requestAnimationFrame(loop); }
    }

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      pos.x = e.clientX; pos.y = e.clientY;
      if (!inHero) { cur.x = pos.x; cur.y = pos.y; }
      inHero = true;
      cursor.classList.add('is-visible');

      var magnet = e.target.closest && e.target.closest('[data-magnetic], a, button');
      cursor.classList.toggle('is-magnet', !!magnet);

      // "REVEAL" label only while the pointer is over the portrait
      var r = stage.getBoundingClientRect();
      var overPortrait = !magnet && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      cursor.classList.toggle('is-reveal', overPortrait);
      run();
    }, { passive: true });

    hero.addEventListener('pointerleave', function () {
      inHero = false;
      cursor.classList.remove('is-visible', 'is-reveal', 'is-magnet');
    });
  }

  /* ------------------------------------- hero background type parallax */
  var heroType = $('[data-hero-type]');
  if (finePointer && !reduced && heroType && hero) {
    var tp = { x: 0, y: 0 }, tc = { x: 0, y: 0 }, typeRunning = false;
    function typeLoop() {
      tc.x = lerp(tc.x, tp.x, 0.06);
      tc.y = lerp(tc.y, tp.y, 0.06);
      heroType.style.transform = 'translate3d(' + tc.x.toFixed(2) + 'px,' + tc.y.toFixed(2) + 'px,0)';
      if (Math.abs(tc.x - tp.x) > 0.05 || Math.abs(tc.y - tp.y) > 0.05) requestAnimationFrame(typeLoop);
      else typeRunning = false;
    }
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      tp.x = (e.clientX / window.innerWidth - 0.5) * -18;
      tp.y = (e.clientY / window.innerHeight - 0.5) * -10;
      if (!typeRunning) { typeRunning = true; requestAnimationFrame(typeLoop); }
    }, { passive: true });
  }

  /* ---------------------------------------------- project hover preview */
  var list = $('[data-projects]');
  var preview = $('[data-project-preview]');
  if (finePointer && list && preview) {
    var pp = { x: 0, y: 0 }, pc = { x: 0, y: 0 }, previewRunning = false, previewOn = false;
    function previewLoop() {
      pc.x = lerp(pc.x, pp.x, 0.16);
      pc.y = lerp(pc.y, pp.y, 0.16);
      preview.style.transform = 'translate3d(' + pc.x + 'px,' + pc.y + 'px,0)';
      if (previewOn || Math.abs(pc.x - pp.x) > 0.1) requestAnimationFrame(previewLoop);
      else previewRunning = false;
    }
    list.addEventListener('pointermove', function (e) {
      pp.x = e.clientX; pp.y = e.clientY;
      preview.classList.toggle('is-left', e.clientX > window.innerWidth * 0.55);
      if (!previewOn) { pc.x = pp.x; pc.y = pp.y; }
      previewOn = true;
      if (!previewRunning) { previewRunning = true; requestAnimationFrame(previewLoop); }
    });
    $$('.project__row', list).forEach(function (link) {
      link.addEventListener('pointerenter', function () {
        preview.setAttribute('data-active', link.getAttribute('data-cover'));
        preview.classList.add('is-visible');
      });
    });
    list.addEventListener('pointerleave', function () {
      previewOn = false;
      preview.classList.remove('is-visible');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') preview.classList.remove('is-visible');
    });
  }
})();
