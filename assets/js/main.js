/* =============================================================================
   K G Harish Patel — Portfolio interactions (dependency-free).
   Content comes from data.js. With JS off, only the noscript summary shows.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PORTFOLIO;
  if (!D) return;
  var doc = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function pad(n) { return ('0' + n).slice(-2); }
  function lockBody(on) { body.classList.toggle('is-locked', on); }

  /* ------------------------------------------------------------ render from data */
  // loader pills
  var stack = $('#loader-stack');
  var pillColors = ['ink', 'blue', 'mauve', 'sage', 'orange'];
  var pillLabels = [D.profile.name].concat(D.categories.map(function (d) { return d.plate; }));
  pillLabels.forEach(function (t, i) {
    var p = el('div', 'lpill lpill--' + pillColors[i], t);
    p.style.setProperty('--k', i);
    stack.appendChild(p);
  });

  // skills
  var sg = $('#skills-grid');
  D.skills.forEach(function (g) {
    var r = el('div', 'tb-row rv');
    r.appendChild(el('h3', null, g.group));
    var ul = el('ul', 'chips');
    g.items.forEach(function (i) { ul.appendChild(el('li', null, i)); });
    r.appendChild(ul);
    sg.appendChild(r);
  });

  // story
  var sl = $('#story-list');
  D.story.forEach(function (s) {
    var li = el('li', 'st');
    li.appendChild(el('p', 'st__p', s.period));
    li.appendChild(el('h3', 'st__t', s.title));
    li.appendChild(el('p', 'st__o', s.org));
    var ul = el('ul');
    s.points.forEach(function (p) { ul.appendChild(el('li', null, p)); });
    li.appendChild(ul);
    sl.appendChild(li);
  });

  // research card
  $('#card-sum').textContent = D.profile.summary;
  $('#card-method').textContent = D.profile.method;
  D.profile.interests.forEach(function (i) { $('#card-int').appendChild(el('li', null, i)); });

  /* ------------------------------------------------------------ loader / start */
  var started = false;
  function startPage() {
    if (started) return;
    started = true;
    doc.classList.add('is-ready');
    try { sessionStorage.setItem('hp-loaded', '1'); } catch (e) {}
  }
  /* ------------------------------------------------------------ entrance door */
  var gate = $('#gate');
  var gateState = 'idle';
  function showGate() {
    gate.hidden = false;
    doc.classList.add('gate-closed');
    lockBody(true);
    setTimeout(function () { $('#gate-btn').focus({ preventScroll: true }); }, 900);
  }
  function openGate(skip) {
    if (gateState !== 'idle') return;
    gateState = 'grab';
    var finish = function () {
      gate.classList.add('is-done');
      setTimeout(function () { gate.hidden = true; lockBody(false); }, 650);
    };
    if (skip) {
      doc.classList.remove('gate-closed');
      startPage(); finish(); return;
    }
    gate.classList.add('is-grab');                              // handles react, light slips through the seam
    setTimeout(function () {
      gate.classList.add('is-open');                            // panels swing on their hinges
      doc.classList.remove('gate-closed');                      // the page behind comes into focus
      setTimeout(startPage, 900);                               // hero text rises while the door is still moving
      setTimeout(finish, parseFloat(getComputedStyle(gate).getPropertyValue('--dur')) * 1000 + 400);
    }, 520);
  }
  if (gate) {
    $('#gate-btn').addEventListener('click', function () { openGate(false); });
    $('#gate-skip').addEventListener('click', function () { openGate(true); });
  }

  var loader = $('#loader');
  if (loader && doc.classList.contains('has-loader')) {
    var num = $('#loader-num'), bar = $('#loader-bar');
    var pills = $$('.lpill', loader);
    var t0 = performance.now(), dur = reduced ? 300 : 3200;
    var loaded = document.readyState === 'complete';
    window.addEventListener('load', function () { loaded = true; });
    var timer = setInterval(function () {
      var e = performance.now() - t0;
      var p = Math.min(e / dur, 1) * (loaded ? 1 : 0.92);
      var shown = Math.round(p * 100);
      num.textContent = ('00' + shown).slice(-3);
      bar.style.transform = 'scaleX(' + p + ')';
      pills.forEach(function (pl, i) { if (p > (i + 0.3) / (pills.length + 1)) pl.classList.add('on'); });
      if (p >= 1 || e > 6000) {
        clearInterval(timer);
        if (gate && !reduced) showGate(); else setTimeout(startPage, reduced ? 0 : 500);
        loader.classList.add('is-done');
        setTimeout(function () { loader.style.display = 'none'; }, 1100);
      }
    }, 40);
  } else {
    setTimeout(startPage, 30);
  }

  /* ------------------------------------------------------------ clock, year */
  var clockEls = [$('#clock')].concat($$('[data-clock-copy]'));
  var dateEl = $('#date');
  var tf, df;
  try {
    tf = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    df = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  } catch (e) { tf = df = null; }
  function tick() {
    if (!tf) return;
    var t = tf.format(new Date()).replace(' AM', 'am').replace(' PM', 'pm');
    clockEls.forEach(function (c) { if (c) c.textContent = t; });
    if (dateEl) dateEl.textContent = df.format(new Date());
  }
  tick(); setInterval(tick, 20000);
  $$('[data-footer-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ menu */
  var menu = $('#menu'), menuBtn = $('#menu-btn'), menuOpen = false;
  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    menuBtn.setAttribute('aria-expanded', String(open));
    lockBody(open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
      setTimeout(function () { var f = $('a', menu); if (menuOpen && f) f.focus({ preventScroll: true }); }, 100);
    } else {
      menu.classList.remove('is-open');
      setTimeout(function () { if (!menuOpen) menu.hidden = true; }, reduced ? 0 : 800);
      menuBtn.focus({ preventScroll: true });
    }
  }
  $$('.navm__nav a', menu).forEach(function (a, i) { a.style.setProperty('--i', i); });
  menuBtn.addEventListener('click', function () { setMenu(true); });
  $('#menu-close').addEventListener('click', function () { setMenu(false); });
  menu.addEventListener('click', function (e) { if (e.target.closest('.navm__nav a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (!menuOpen) return;
    if (e.key === 'Escape') { setMenu(false); return; }
    if (e.key === 'Tab') {
      var items = $$('a, button', menu);
      var idx = items.indexOf(document.activeElement);
      if (e.shiftKey && idx <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && idx === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  window.matchMedia('(min-width: 1000px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ------------------------------------------------------------ anchors, active nav, back-to-top */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      if (menuOpen) { setTimeout(function () { go(t, id); }, 350); } else go(t, id);
    });
  });
  function go(t, id) {
    var y = id === '#top' ? 0 : t.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  }

  var navLinks = $$('[data-nav] a');
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        navLinks.forEach(function (l) {
          if (l.getAttribute('href') === '#' + id) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'works', 'skills', 'about', 'contact'].forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  var totop = $('#totop');
  var tticking = false;
  window.addEventListener('scroll', function () {
    if (tticking) return;
    tticking = true;
    requestAnimationFrame(function () {
      totop.classList.toggle('is-on', window.pageYOffset > 700);
      var ft = $('#contact');
      $('[data-header]').classList.toggle('hdr--light', ft.getBoundingClientRect().top < 40);
      tticking = false;
    });
  }, { passive: true });
  totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

  /* ------------------------------------------------------------ scroll reveal */
  var rvs = $$('.rv').filter(function (n) { return !n.closest('.hero'); });
  if ('IntersectionObserver' in window && !reduced) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); rio.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rvs.forEach(function (n) { rio.observe(n); });
  } else rvs.forEach(function (n) { n.classList.add('is-in'); });
  $$('.hero .rv').forEach(function (n, i) { n.style.setProperty('--d', (0.25 + i * 0.1) + 's'); });

  /* ------------------------------------------------------------ hero flip card */
  var flip = $('[data-flip]');
  if (flip) {
    var face = $('[data-flip-face]', flip), fi = $('[data-flip-i]', flip), fn = $('[data-flip-n]', flip);
    var roles = D.profile.interests, ri = 0;
    fn.textContent = pad(roles.length);
    function setRole() { face.textContent = roles[ri]; fi.textContent = pad(ri + 1); }
    setRole();
    if (!reduced) {
      setInterval(function () {
        if (document.hidden) return;
        face.classList.remove('is-flip'); void face.offsetWidth; face.classList.add('is-flip');
        setTimeout(function () { ri = (ri + 1) % roles.length; setRole(); }, 380);
      }, 2800);
    }
  }

  /* ------------------------------------------------------------ contact + card dialogs */
  var modal = $('#modal'), mForm = $('#m-form'), mOk = $('#m-ok'), modalTrigger = null;
  function openModal(trigger) {
    modalTrigger = trigger || null;
    mForm.hidden = false; mOk.hidden = true;
    modal.showModal(); lockBody(true);
  }
  $$('[data-start]').forEach(function (b) {
    b.addEventListener('click', function () { if (menuOpen) setMenu(false); openModal(b); });
  });
  var card = $('#card'), cardTrigger = null;
  $$('[data-open-card]').forEach(function (b) { b.addEventListener('click', function () { cardTrigger = b; card.showModal(); lockBody(true); }); });
  [modal, card].forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
    dlg.addEventListener('close', function () {
      lockBody(false);
      var t = dlg === modal ? modalTrigger : cardTrigger;
      if (t) t.focus({ preventScroll: true });
    });
  });

  /* ------------------------------------------------------------ story: year roller + active item */
  var yearEl = $('#year');
  var digitCols = [];
  for (var di = 0; di < 4; di++) {
    var wrap = el('span', 'year__d'), col = el('span', 'year__col');
    for (var k = 0; k < 10; k++) col.appendChild(el('span', null, String(k)));
    wrap.appendChild(col); yearEl.appendChild(wrap); digitCols.push(col);
  }
  var stItems = $$('.st'), stActive = -1;
  var periodEl = $('#story-period'), idxEl = $('#story-i'), barEl = $('#story-bar');
  $('#story-n').textContent = pad(D.story.length);
  yearEl.setAttribute('aria-hidden', 'true');
  function setStory(i) {
    if (i === stActive) return;
    stActive = i;
    stItems.forEach(function (n, k) { n.classList.toggle('is-active', k === i); });
    var s = D.story[i];
    String(s.year).split('').forEach(function (ch, c) { digitCols[c].style.setProperty('--n', ch); });
    periodEl.textContent = s.period;
    idxEl.textContent = pad(i + 1);
    barEl.style.transform = 'scaleX(' + ((i + 1) / D.story.length) + ')';
  }
  setStory(0);
  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setStory(stItems.indexOf(en.target)); });
    }, { rootMargin: '-38% 0px -50% 0px' });
    stItems.forEach(function (n) { sio.observe(n); });
  } else stItems.forEach(function (n) { n.classList.add('is-active'); });

  /* ------------------------------------------------------------ pointer effects */
  if (finePointer && !reduced) {
    // magnetic buttons
    $$('[data-magnetic]').forEach(function (n) {
      n.addEventListener('pointermove', function (e) {
        var r = n.getBoundingClientRect();
        n.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.2).toFixed(1) + 'px');
        n.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      }, { passive: true });
      n.addEventListener('pointerleave', function () { n.style.setProperty('--mx', '0px'); n.style.setProperty('--my', '0px'); });
    });

    // research card tilt
    var c3 = $('#card3d');
    c3.addEventListener('pointermove', function (e) {
      var r = c3.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      c3.style.transform = 'perspective(900px) rotateY(' + (px * 8).toFixed(2) + 'deg) rotateX(' + (-py * 8).toFixed(2) + 'deg)';
    }, { passive: true });
    c3.addEventListener('pointerleave', function () { c3.style.transform = ''; });

    // cursor
    var cursor = $('.cursor');
    body.classList.add('has-cursor');
    var dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('[data-cursor-label]', cursor);
    var dc = $('#door-cursor');
    var mx = 0, my = 0, rx = 0, ry = 0, running = false;
    var loop = function () {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) requestAnimationFrame(loop); else running = false;
    };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      cursor.classList.add('is-on');
      if (!running) { running = true; requestAnimationFrame(loop); }
      var t = e.target.closest ? e.target.closest('.dr__btn, [data-cursor], a, button, input, textarea, label, .chips li') : null;
      var onDoor = !!(t && t.classList.contains('dr__btn'));
      var text = t && !onDoor ? t.getAttribute('data-cursor') : null;
      cursor.classList.toggle('is-label', !!text);
      cursor.classList.toggle('is-link', !!t && !text && !onDoor);
      if (text) label.textContent = text;
      ring.style.opacity = onDoor ? '0' : '';
      dc.classList.toggle('is-on', onDoor);
      if (onDoor) dc.style.transform = 'translate(' + (e.clientX + 16) + 'px,' + (e.clientY + 16) + 'px)';
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('is-on'); dc.classList.remove('is-on'); });
  }

  /* ------------------------------------------------------------ portrait: greyscale base, colour revealed under the pointer */
  (function () {
    var stage = $('[data-portrait]');
    var colour = stage && $('.hero__img--color', stage);
    if (!colour) return;
    var R = window.matchMedia('(max-width: 700px)').matches ? 170 : 290;   // reveal radius in px
    var cur = { x: 0, y: 0, r: 0 }, tgt = { x: 0, y: 0, r: 0 }, raf = 0, active = false;
    var ease = reduced ? 1 : 0.16;
    function paint() {
      cur.x += (tgt.x - cur.x) * ease;
      cur.y += (tgt.y - cur.y) * ease;
      cur.r += (tgt.r - cur.r) * (reduced ? 1 : 0.14);
      colour.style.setProperty('--mx', cur.x.toFixed(1) + 'px');
      colour.style.setProperty('--my', cur.y.toFixed(1) + 'px');
      colour.style.setProperty('--mr', Math.max(cur.r, 0.01).toFixed(1) + 'px');
      var settled = Math.abs(tgt.x - cur.x) < 0.3 && Math.abs(tgt.y - cur.y) < 0.3 && Math.abs(tgt.r - cur.r) < 0.3;
      raf = settled ? 0 : requestAnimationFrame(paint);
      if (settled && tgt.r === 0) colour.style.setProperty('--mr', '0.01px');
    }
    function aim(clientX, clientY, grow) {
      var r = stage.getBoundingClientRect();
      tgt.x = clientX - r.left; tgt.y = clientY - r.top;
      if (!active || grow) { if (!active) { cur.x = tgt.x; cur.y = tgt.y; } active = true; }
      tgt.r = R;
      if (!raf) raf = requestAnimationFrame(paint);
    }
    function away() { active = false; tgt.r = 0; if (!raf) raf = requestAnimationFrame(paint); }
    // the colour starts to appear as the cursor approaches the portrait, and fades once it has left
    var heroEl = $('#top');
    heroEl.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = stage.getBoundingClientRect();
      var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      var dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      if (Math.hypot(dx, dy) < 120) aim(Math.max(r.left, Math.min(r.right, e.clientX)), Math.max(r.top, Math.min(r.bottom, e.clientY)));
      else if (active) away();
    }, { passive: true });
    heroEl.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') away(); });
    stage.addEventListener('touchstart', function (e) { var t = e.touches[0]; if (t) aim(t.clientX, t.clientY, true); }, { passive: true });
    stage.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) aim(t.clientX, t.clientY); }, { passive: true });
    stage.addEventListener('touchend', away, { passive: true });
    stage.addEventListener('touchcancel', away, { passive: true });
    window.addEventListener('blur', away);
  })();

  /* ------------------------------------------------------------ hero: portrait top aligned with the greeting */
  (function () {
    var hero = $('#top'), fig = $('.hero__fig', hero), h1 = $('.hero__title', hero);
    if (!fig || !h1) return;
    function topWithin(n, root) { var y = 0; while (n && n !== root) { y += n.offsetTop; n = n.offsetParent; } return y; }
    function place() {
      if (window.matchMedia('(min-width: 900px)').matches) fig.style.setProperty('--ft', Math.max(topWithin(h1, hero) + 6, 70) + 'px');
      else fig.style.removeProperty('--ft');
    }
    place();
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    if (window.ResizeObserver) new ResizeObserver(place).observe(hero);
  })();
})();