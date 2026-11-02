/* Research card: hover tilt, then a physical flip. On click the card lifts, pivots up around its
   bottom edge in 3D and its reverse side opens into the research panel. The same timeline plays
   backwards to close, returning the card to its exact place. GSAP is optional (instant fallback). */
(function () {
  'use strict';
  var D = window.PORTFOLIO;
  var front = document.getElementById('rc-front');
  if (!D || !D.research || !front) return;
  var R = D.research, g = window.gsap;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small = window.matchMedia('(max-width: 700px)');
  var body = document.body;

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function proj(id) { for (var i = 0; i < D.projects.length; i++) if (D.projects[i].id === id) return D.projects[i]; return null; }
  function pad(n) { return ('0' + n).slice(-2); }

  /* ------------------------------------------------------------ hover: tilt, elevation, light (mouse only) */
  if (fine && !reduced) {
    front.addEventListener('pointermove', function (e) {
      var r = front.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      front.style.setProperty('--ry', ((px - 0.5) * 12).toFixed(2) + 'deg');
      front.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
      front.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      front.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      front.style.setProperty('--sx', ((0.5 - px) * 26).toFixed(1) + 'px');
    }, { passive: true });
    front.addEventListener('pointerleave', function () {
      ['--rx', '--ry'].forEach(function (k) { front.style.setProperty(k, '0deg'); });
      front.style.setProperty('--sx', '0px');
    });
  }

  /* ------------------------------------------------------------ the stage (built once) */
  var areas = R.areas.map(function (a, i) {
    var ev = (a.projects || []).map(function (id) { var p = proj(id); return p ? p.title : null; }).filter(Boolean);
    if (a.where) ev.push(a.where);
    return '<li><span class="rc-n">' + pad(i + 1) + '</span><div><h5>' + esc(a.name) + '</h5><p>' + esc(a.note) + '</p>' +
      (ev.length ? '<p class="rc-ev">' + ev.map(esc).join(' · ') + '</p>' : '') + '</div></li>';
  }).join('');
  var projects = R.projects.map(function (id) {
    var p = proj(id); if (!p) return '';
    return '<li><b>' + esc(p.title) + '</b><span>' + esc(p.kicker.split(' · ').slice(0, 2).join(' · ')) + '</span></li>';
  }).join('');
  var upcoming = R.upcoming.map(function (u) { return '<li><b>' + esc(u.title) + '</b><span>' + esc(u.note) + '</span></li>'; }).join('');
  var chips = D.profile.interests.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('');

  var stage = document.createElement('div');
  stage.className = 'rc-stage';
  stage.hidden = true;
  stage.setAttribute('role', 'dialog');
  stage.setAttribute('aria-modal', 'true');
  stage.setAttribute('aria-label', 'Research');
  stage.innerHTML =
    '<div class="rc-backdrop"></div>' +
    '<div class="rc3d">' +
      '<div class="rc-face rc-face--front rc-face--ghost" aria-hidden="true">' + front.innerHTML + '</div>' +
      '<div class="rc-face rc-face--back">' +
        '<button class="rc-close" type="button"><span aria-hidden="true">←</span> Back</button>' +
        '<div class="rc-back">' +
          '<div class="rc-back__in">' +
            '<header class="rc-head"><p class="rc-eyebrow">Research</p><h3 class="rc-h">Questions first, then measurements.</h3><p class="rc-lead">' + esc(R.blurb) + '</p>' +
              '<ul class="rc-chips" aria-label="Research interests">' + chips + '</ul></header>' +
            '<section class="rc-sec rc-areas"><h4>Focus areas</h4><ol>' + areas + '</ol></section>' +
            '<div class="rc-cols">' +
              '<section class="rc-sec"><h4>Research projects</h4><ul class="rc-list">' + projects + '</ul></section>' +
              '<section class="rc-sec"><h4>Upcoming research areas</h4><ul class="rc-list rc-list--up">' + upcoming + '</ul></section>' +
            '</div>' +
            '<p class="rc-method">' + esc(D.profile.method) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(stage);
  var card = stage.querySelector('.rc3d'), backdrop = stage.querySelector('.rc-backdrop'), backIn = stage.querySelector('.rc-back__in');
  var closeBtn = stage.querySelector('.rc-close'), backFace = stage.querySelector('.rc-face--back');

  /* ------------------------------------------------------------ open / close */
  var busy = false, isOpen = false, tl = null, trigger = null;

  function panelRect() {
    var w = Math.min(980, window.innerWidth * (small.matches ? 0.94 : 0.9));
    var h = Math.min(window.innerHeight * (small.matches ? 0.9 : 0.86), 780);
    return { left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2, width: w, height: h };
  }
  function lock(on) { body.classList.toggle('is-locked', on); }

  function finishOpen() { var sc = backFace.querySelector('.rc-back'); if (sc) sc.scrollTop = 0; busy = false; isOpen = true; front.setAttribute('aria-expanded', 'true'); closeBtn.focus({ preventScroll: true }); }
  function finishClose() {
    if (tl) { tl.kill(); tl = null; }
    if (g) g.set([card, backIn, backdrop].concat([].slice.call(backIn.children)), { clearProps: 'all' });
    stage.hidden = true;
    front.style.visibility = '';
    lock(false);
    front.setAttribute('aria-expanded', 'false');
    busy = false; isOpen = false;
    if (trigger && trigger.focus) trigger.focus({ preventScroll: true });
  }

  function open() {
    if (busy || isOpen) return;
    busy = true;
    trigger = document.activeElement === document.body ? front : document.activeElement;
    var r = front.getBoundingClientRect(), p = panelRect();
    stage.hidden = false; lock(true);
    if (!g || reduced) {                                    // no 3D: show the opened state directly
      if (g) g.set(card, { left: p.left, top: p.top - p.height, width: p.width, height: p.height, rotationX: -180 });
      else card.style.cssText = 'left:' + p.left + 'px;top:' + (p.top - p.height) + 'px;width:' + p.width + 'px;height:' + p.height + 'px;transform:rotateX(-180deg)';
      front.style.visibility = 'hidden';
      finishOpen();
      return;
    }
    var k = small.matches ? 0.8 : 1;
    g.set(card, { left: r.left, top: r.top, width: r.width, height: r.height, rotationX: 0, y: 0, scale: 1, '--sh': 16, transformOrigin: '50% 100%' });
    g.set(backIn.children, { clearProps: 'all' });        // a reversed close leaves the 'from' values behind
    g.set(backIn, { opacity: 0 });
    g.set(backdrop, { opacity: 0 });
    front.style.visibility = 'hidden';
    tl = g.timeline({ onComplete: finishOpen, onReverseComplete: finishClose });
    tl.to(card, { scale: 0.975, duration: 0.1 * k, ease: 'power2.out' })                                   // the click is felt
      .to(card, { y: -22, scale: 1.04, '--sh': 52, duration: 0.38 * k, ease: 'power2.out' })              // the card lifts
      .to(backdrop, { opacity: 1, duration: 0.6 * k, ease: 'power1.out' }, 0.15 * k)
      .to(card, { rotationX: -180, duration: 1.25 * k, ease: 'power3.inOut' }, 0.42 * k)                  // pivots up from its bottom edge
      // a 180 degree turn about the bottom edge lands the card below that edge, so the hinge travels to the panel's top
      .to(card, { left: p.left, top: p.top - p.height, width: p.width, height: p.height, y: 0, scale: 1, duration: 1.25 * k, ease: 'power3.inOut' }, 0.42 * k)
      .to(card, { '--sh': 70, duration: 0.6 * k, ease: 'sine.inOut' }, 0.5 * k)
      .to(card, { '--sh': 34, duration: 0.5 * k, ease: 'power2.out' }, '>-0.1')                           // settles
      .to(backIn, { opacity: 1, duration: 0.55 * k, ease: 'power1.out' }, 1.2 * k)
      .from(backIn.children, { y: 16, opacity: 0, duration: 0.5 * k, stagger: 0.07, ease: 'power2.out' }, 1.25 * k);
  }

  function close() {
    if (busy || !isOpen) return;
    busy = true; isOpen = false;
    if (!g || reduced || !tl) { finishClose(); return; }
    tl.timeScale(1.25).reverse();                           // the same shot backwards: exact original position
  }

  front.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (stage.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab' && isOpen) {
      var f = [].slice.call(backFace.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])'));
      var scroller = backFace.querySelector('.rc-back');
      if (!f.length) { e.preventDefault(); return; }
      var idx = f.indexOf(document.activeElement);
      if (e.shiftKey && idx <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && idx === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.addEventListener('resize', function () {
    if (!isOpen || busy) return;
    var p = panelRect();
    if (g) g.set(card, { left: p.left, top: p.top - p.height, width: p.width, height: p.height });
  });

  // footer shortcut: bring the card into view, then open it
  [].forEach.call(document.querySelectorAll('[data-open-card]'), function (b) {
    b.addEventListener('click', function () {
      trigger = b;
      front.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(function () { if (!busy && !isOpen) { var t = trigger; open(); trigger = t; } }, reduced ? 0 : 750);
    });
  });
})();
