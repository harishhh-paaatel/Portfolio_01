/* =============================================================================
   Four doors, proximity interaction, cinematic door-to-room travel and the
   category ("room") pages. One transition system serves every door:
     travel.enter(id, doorEl)  door -> room      (camera moves through the doorway)
     travel.leave()            room -> doors     (the same shot, reversed)
     travel.swap(id)           room -> room      (light wipe between connected rooms)
   GSAP is optional: without it rooms simply switch instantly.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PORTFOLIO;
  if (!D) return;
  var g = window.gsap;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small = window.matchMedia('(max-width: 700px)');

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function pad(n) { return ('0' + n).slice(-2); }

  /* ------------------------------------------------------------ canonical registry (one entry per project) */
  var registry = {};
  var catById0 = {};
  D.categories.forEach(function (c) { catById0[c.id] = c; });
  D.projects.forEach(function (p) {
    if (registry[p.id]) { console.error('Duplicate project id ignored:', p.id); return; }
    registry[p.id] = p;
    if (!catById0[p.category]) console.error('Unknown category for project', p.id);
  });
  var catById = {};
  D.categories.forEach(function (c) { catById[c.id] = c; });
  function projectsOf(catId) {
    return Object.keys(registry).map(function (k) { return registry[k]; }).filter(function (p) { return p.category === catId; });
  }

  /* ------------------------------------------------------------ the four doors */
  function doorMarkup(c, i) {
    return '<span class="dr__casing">' +
      '<span class="dr__hinge dr__hinge--a"></span><span class="dr__hinge dr__hinge--b"></span><span class="dr__hinge dr__hinge--c"></span>' +
      '<span class="dr__recess"><span class="dr__glow"></span></span>' +
      '<span class="dr__leaf dr__leaf--' + c.tone + '">' +
        '<span class="dr__panel dr__panel--t"></span><span class="dr__panel dr__panel--b"></span>' +
        '<span class="dr__plate">' + esc(c.plate) + '</span>' +
        '<span class="dr__handle"><i></i></span><span class="dr__key"></span>' +
      '</span></span>';
  }
  var row = $('#doors-row');
  var doors = D.categories.map(function (c, i) {
    var li = document.createElement('li');
    li.className = 'dr';
    li.innerHTML = '<button class="dr__btn" type="button" data-room="' + c.id + '" aria-haspopup="dialog" aria-label="Open door ' + (i + 1) + ': ' + esc(c.plate) + '">' + doorMarkup(c, i) + '</button>' +
      '<p class="dr__cap"><b>' + pad(i + 1) + '</b>' + esc(c.short) + '</p>';
    row.appendChild(li);
    return { cat: c, el: li, btn: $('.dr__btn', li), cur: 0, tgt: 0, px: 0, cpx: 0 };
  });

  var footList = $('#foot-doors');
  D.categories.forEach(function (c) {
    var li = document.createElement('li'), a = document.createElement('a');
    a.href = '#room/' + c.id; a.textContent = c.short;
    a.addEventListener('click', function (e) { e.preventDefault(); openRoom(c.id, null); });
    li.appendChild(a); footList.appendChild(li);
  });

  /* ------------------------------------------------------------ proximity (cursor distance -> door reaction) */
  var RANGE = 300, raf = 0, focusIdx = -1, stageEl = $('.doors');
  function loop() {
    var moving = false;
    doors.forEach(function (d) {
      d.cur += (d.tgt - d.cur) * 0.11;
      d.cpx += (d.px - d.cpx) * 0.11;
      if (Math.abs(d.tgt - d.cur) < 0.002) d.cur = d.tgt; else moving = true;
      if (Math.abs(d.px - d.cpx) < 0.002) d.cpx = d.px; else moving = true;
      d.el.style.setProperty('--p', d.cur.toFixed(3));
      d.el.style.setProperty('--px', d.cpx.toFixed(3));
    });
    raf = moving ? requestAnimationFrame(loop) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function setFocus(idx) {
    focusIdx = idx;
    doors.forEach(function (d, i) {
      d.el.classList.toggle('is-near', i === idx);
      d.el.classList.toggle('is-dim', idx >= 0 && i !== idx);
    });
    row.classList.toggle('has-focus', idx >= 0);
  }
  function release() {
    doors.forEach(function (d) { d.tgt = 0; d.px = 0; });
    setFocus(-1); kick();
  }
  if (fine && !reduced) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || busy || roomsOpen) return;
      var sr = stageEl.getBoundingClientRect();
      if (sr.bottom < 0 || sr.top > window.innerHeight) { if (focusIdx >= 0) release(); return; }
      var best = -1, bestP = 0.14;
      doors.forEach(function (d, i) {
        var r = d.btn.getBoundingClientRect();
        var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        var dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        var p = Math.max(0, 1 - Math.hypot(dx, dy) / RANGE);
        p = p * p * (3 - 2 * p);
        d.tgt = p;
        d.px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.2)));
        if (p > bestP) { bestP = p; best = i; }
      });
      if (best !== focusIdx) setFocus(best);
      // only the selected door keeps its full reaction; neighbours settle back
      doors.forEach(function (d, i) { if (best >= 0 && i !== best) d.tgt = Math.min(d.tgt, 0.18); });
      kick();
    }, { passive: true });
    row.addEventListener('pointerleave', function () { if (!busy) release(); });
  }
  // keyboard focus and touch press give the same "selected" state
  doors.forEach(function (d, i) {
    d.btn.addEventListener('focus', function () { d.tgt = 1; setFocus(i); kick(); });
    d.btn.addEventListener('blur', function () { if (!busy) release(); });
    d.btn.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') { d.tgt = 1; setFocus(i); kick(); } });
    d.btn.addEventListener('click', function () { openRoom(d.cat.id); });
  });

  /* ------------------------------------------------------------ room pages */
  var rooms = $('#rooms'), scroller = $('#rooms-scroll'), page = $('#rp');
  var tabs = $('#rn-tabs'), overlay = $('#rn-overlay'), menuBtn = $('#rn-menu');
  var current = null, roomsOpen = false, busy = false, pushed = false;

  D.categories.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rn__tab'; b.setAttribute('data-tab', c.id); b.textContent = c.short;
    b.addEventListener('click', function () { if (c.id !== current) openRoom(c.id, null); });
    tabs.appendChild(b);
    var o = document.createElement('button');
    o.type = 'button'; o.className = 'rn__item'; o.setAttribute('data-tab', c.id);
    o.innerHTML = '<span>' + pad(i + 1) + '</span>' + esc(c.plate);
    o.addEventListener('click', function () { setOverlay(false); if (c.id !== current) openRoom(c.id, null); });
    $('#rn-list').appendChild(o);
  });

  var ART = {
    books: '<rect x="42" y="34" width="26" height="92" rx="4"/><rect x="74" y="24" width="26" height="102" rx="4"/><rect x="106" y="40" width="26" height="86" rx="4"/><path d="m140 48 26-7 22 84-26 7z"/><path d="M30 134h170"/>',
    graph: '<path d="M54 50 112 34l64 28M54 50l28 62M112 34 82 112M176 62l-34 62M82 112l60 12M112 34l30 90"/><circle cx="54" cy="50" r="9"/><circle cx="112" cy="34" r="11"/><circle cx="176" cy="62" r="9"/><circle cx="82" cy="112" r="10"/><circle cx="142" cy="124" r="9"/>',
    adapter: '<rect x="40" y="38" width="120" height="86" rx="8"/><path d="M60 62h80M60 82h80M60 102h50"/><rect x="132" y="94" width="48" height="40" rx="6"/><path d="M146 114h20"/>',
    drone: '<circle cx="110" cy="80" r="13"/><path d="M100 70 66 36M120 70l34-34M100 90 66 124M120 90l34 34"/><circle cx="60" cy="30" r="16"/><circle cx="160" cy="30" r="16"/><circle cx="60" cy="130" r="16"/><circle cx="160" cy="130" r="16"/>',
    pcb: '<rect x="36" y="26" width="148" height="108" rx="8"/><rect x="88" y="58" width="44" height="44" rx="4"/><path d="M88 70H62V44M88 90H56M132 70h28V44M132 90h34v30M110 102v26"/><circle cx="62" cy="44" r="4"/><circle cx="56" cy="90" r="4"/><circle cx="160" cy="44" r="4"/><circle cx="166" cy="120" r="4"/><circle cx="110" cy="128" r="4"/>',
    agent: '<circle cx="110" cy="80" r="18"/><circle cx="52" cy="40" r="10"/><circle cx="168" cy="40" r="10"/><circle cx="56" cy="124" r="10"/><circle cx="166" cy="122" r="10"/><path d="M96 66 58 46M124 66l38-20M96 94l-32 26M124 94l34 26"/><circle cx="110" cy="80" r="5" fill="currentColor"/>',
    video: '<rect x="30" y="38" width="124" height="84" rx="10"/><path d="m154 70 36-20v60l-36-20z"/><path d="m88 64 28 16-28 16z" fill="currentColor"/><path d="M44 134h96"/>',
    audio: '<path d="M52 26h62l24 24v84H52z"/><path d="M114 26v24h24"/><path d="M72 72h46M72 90h34"/><path d="M156 72q12 8 0 16M168 60q22 20 0 44M180 48q32 32 0 68"/>',
    components: '<rect x="36" y="26" width="148" height="108" rx="8"/><rect x="58" y="50" width="34" height="26" rx="3"/><rect x="128" y="86" width="34" height="26" rx="3"/><rect x="58" y="86" width="34" height="26" rx="3" stroke-dasharray="5 5"/><path d="M110 56h-12M120 100h8M128 56h34"/>',
    trace: '<rect x="36" y="26" width="148" height="108" rx="8"/><path d="M52 50h46M122 50h46M52 80h116M52 110h30M104 110h64"/><circle cx="52" cy="50" r="4"/><circle cx="168" cy="50" r="4"/><circle cx="52" cy="110" r="4"/><circle cx="168" cy="110" r="4"/><path d="M104 44l12 12M116 44l-12 12" />'
  };

  function chips(list) { return list.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join(''); }

  var STATUS = { completed: 'Completed', ongoing: 'Ongoing', upcoming: 'Upcoming project' };

  function cardMarkup(p, i) {
    var cat = catById[p.category];
    var team = p.role === 'Team', solo = p.role === 'Individual', up = p.status === 'upcoming';
    var roleHtml = p.role
      ? '<p class="pc__role pc__role--' + (team ? 'team' : 'solo') + '"><span>' + (team ? 'Team project' : 'Individual project') + '</span>' +
        esc(p.roleNote || (team ? 'Developed as part of a team' : 'Independently developed')) + '</p>'
      : '';
    var links = (p.links || []).map(function (l) {
      var href = l.href === 'profile' ? D.profile.github : l.href;
      return '<a class="pc__link" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(l.label) + ' <i aria-hidden="true">↗</i></a>';
    }).join('');
    return '<article class="pc' + (i % 2 ? ' pc--flip' : '') + (team ? ' pc--team' : '') + (solo ? ' pc--solo' : '') + (up ? ' pc--upcoming' : '') + '" data-project="' + p.id + '" data-status="' + p.status + '">' +
      '<div class="pc__in">' +
        '<div class="pc__info">' +
          '<p class="pc__meta">' + esc(p.kicker) + '</p>' +
          '<h2 class="pc__t">' + esc(p.title) + '</h2>' +
          '<p class="pc__badges"><span class="pc__status pc__status--' + p.status + '">' + esc(STATUS[p.status] || p.status) + '</span><span class="pc__type">' + esc(p.type) + '</span></p>' +
          roleHtml +
          '<p class="pc__s">' + esc(p.summary) + '</p>' +
          (p.concept ? '<div class="pc__prob"><h3>The concept</h3><p>' + esc(p.concept) + '</p></div>' : '') +
          (p.problem ? '<div class="pc__prob"><h3>Problem</h3><p>' + esc(p.problem) + '</p></div>' : '') +
          (p.stack && p.stack.length ? '<ul class="pc__tags" aria-label="Technologies">' + chips(p.stack) + '</ul>' : '') +
          (p.outcomes && p.outcomes.length ? '<div class="pc__out"><h3>Verified outcomes</h3><ul>' + p.outcomes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') +
          (p.points && p.points.length ? '<details class="pc__more"><summary>' + (team ? 'Details' : 'What I did') + '</summary><ul>' + p.points.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
            (p.note ? '<p class="pc__note">' + esc(p.note) + '</p>' : '') + '</details>' : (p.note ? '<p class="pc__note">' + esc(p.note) + '</p>' : '')) +
          (up ? '<p class="pc__note">Planned: not yet built, completed or deployed.</p>' : '') +
          links +
        '</div>' +
        '<div class="pc__vis pc__vis--' + cat.tone + '" aria-hidden="true"><svg viewBox="0 0 220 160" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (ART[p.art] || '') + '</svg><span class="pc__vis-note">' + (up ? 'Concept' : 'Preview') + '</span></div>' +
      '</div></article>';
  }

  function renderRoom(id) {
    var c = catById[id], list = projectsOf(id);
    var idx = D.categories.indexOf(c), next = D.categories[(idx + 1) % D.categories.length];
    page.innerHTML = '<div class="rp__in">' +
      '<p class="rp__idx">Door ' + pad(idx + 1) + ' of ' + pad(D.categories.length) + ' · ' + list.length + (list.length === 1 ? ' project' : ' projects') + '</p>' +
      '<h1 class="rp__h" id="rp-title">' + esc(c.plate) + '</h1>' +
      '<p class="rp__p">' + esc(c.blurb) + '</p>' +
      '<div class="rp__cards">' + (list.length
        ? list.map(cardMarkup).join('')
        : '<article class="pc pc--empty"><p class="pc__meta">Nothing here yet</p><h2 class="pc__t">No projects in this room</h2><p class="pc__s">' + esc(c.empty || 'Nothing is published in this category yet.') + '</p></article>') + '</div>' +
      '<div class="rp__next"><span>Next room</span><button type="button" class="rp__nextbtn" data-next="' + next.id + '">' + esc(next.plate) + ' <i aria-hidden="true">→</i></button></div>' +
      '</div>';
    $$('.pc', page).forEach(function (el) { if (fine) tiltCard(el); });
    var nb = $('[data-next]', page);
    if (nb) nb.addEventListener('click', function () { openRoom(nb.getAttribute('data-next'), null); });
    scroller.scrollTop = 0;
    $$('[data-tab]', rooms).forEach(function (t) {
      var on = t.getAttribute('data-tab') === id;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    document.title = c.plate + ' — K G Harish Patel';
    current = id;
  }

  function tiltCard(card) {
    var vis = $('.pc__vis', card);
    if (!vis) return;
    card.addEventListener('pointermove', function (e) {
      var r = vis.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      vis.style.setProperty('--tx', (px * 14).toFixed(1) + 'px');
      vis.style.setProperty('--ty', (py * 10).toFixed(1) + 'px');
      vis.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
      vis.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
    }, { passive: true });
    card.addEventListener('pointerleave', function () {
      ['--tx', '--ty'].forEach(function (k) { vis.style.setProperty(k, '0px'); });
      ['--rx', '--ry'].forEach(function (k) { vis.style.setProperty(k, '0deg'); });
    });
  }

  function setOverlay(open) {
    overlay.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    if (open) { var a = $('.rn__item.is-active', overlay) || $('.rn__item', overlay); if (a) a.focus({ preventScroll: true }); }
  }
  menuBtn.addEventListener('click', function () { setOverlay(overlay.hidden); });
  $('#rn-overlay-back').addEventListener('click', function () { setOverlay(false); closeRooms(); });

  /* ------------------------------------------------------------ cinematic travel
     `current` is the single source of truth for the door being viewed. It is updated the
     moment a category is rendered (renderRoom), and the reverse shot always uses it. */
  var tl = null, wanted;                       // wanted: a navigation requested while a shot was running
  function killTl() { if (tl) { tl.kill(); tl = null; } }
  function doorIndex(id) { for (var i = 0; i < doors.length; i++) if (doors[i].cat.id === id) return i; return -1; }

  function showRooms(on) {
    roomsOpen = on;
    rooms.hidden = !on;
    body.classList.toggle('in-room', on);
    body.classList.toggle('is-locked', on);
    if (g) g.set(rooms, { clearProps: 'all' });
    if (on) $('#rn-back').focus({ preventScroll: true });
  }

  function buildCam(d) {
    var r = d.btn.getBoundingClientRect();
    var cam = document.createElement('div');
    cam.className = 'cam';
    cam.innerHTML = '<div class="cam__wall"></div><div class="cam__door dr is-near" data-door="' + d.cat.id + '" style="left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;--p:1"><div class="dr__btn">' + doorMarkup(d.cat, 0) + '</div></div>';
    $('#travel').appendChild(cam);
    var cx = r.left + r.width / 2, cy = r.top + r.height * 0.52;
    var scale = Math.max(window.innerWidth / (r.width * 0.74), window.innerHeight / (r.height * 0.74)) * 1.06;
    var door = $('.cam__door', cam);
    return { cam: cam, wall: $('.cam__wall', cam), door: door, cx: cx, cy: cy, scale: scale,
      leaf: $('.dr__leaf', door), handle: $('.dr__handle', door), glow: $('.dr__glow', door) };
  }
  function cleanupCam(c, d) {
    if (c.cam.parentNode) c.cam.parentNode.removeChild(c.cam);
    d.el.style.visibility = '';
  }
  function settle() {
    busy = false; tl = null;
    if (wanted !== undefined) { var w = wanted; wanted = undefined; goto(w); }
  }

  function enter(id, d) {
    var k = small.matches ? 0.75 : 1;
    busy = true; killTl();
    renderRoom(id);                              // current = id
    var c = buildCam(d);
    d.el.style.visibility = 'hidden';
    g.set(c.cam, { transformOrigin: c.cx + 'px ' + c.cy + 'px', willChange: 'transform' });
    g.set(c.leaf, { transformOrigin: '0% 50%' });
    g.set(rooms, { autoAlpha: 0, scale: 1.05, transformOrigin: '50% 50%' });
    rooms.hidden = false;
    tl = g.timeline({ onComplete: function () {
      cleanupCam(c, d); release(); showRooms(true);
      history.pushState({ room: id }, '', '#room/' + id); pushed = true;
      settle();
    } });
    tl.to(c.handle, { rotation: 16, duration: 0.3 * k, ease: 'power2.out', transformOrigin: '0% 50%' })
      .to(c.glow, { opacity: 1, scale: 1.2, duration: 1.1 * k, ease: 'power1.in' }, 0.25 * k)
      .to(c.leaf, { rotationY: -108, duration: 1.7 * k, ease: 'power3.inOut' }, 0.35 * k)
      .to(c.door, { '--lit': 1, duration: 1 * k }, 0.4 * k)
      .to(c.cam, { scale: c.scale, duration: 1.9 * k, ease: 'power3.in' }, 1.0 * k)
      .to(c.wall, { filter: 'brightness(.93)', duration: 1.2 * k }, 1.0 * k)
      .to(rooms, { autoAlpha: 1, scale: 1, duration: 0.95 * k, ease: 'power2.out' }, 2.15 * k)
      .to(c.cam, { opacity: 0, duration: 0.5 * k }, 2.6 * k);
  }

  // the exit always goes through the door of the room currently on screen
  function leave() {
    var exitId = current;
    var idx = doorIndex(exitId);
    if (idx < 0) { showRooms(false); return; }
    var d = doors[idx];
    HPRooms.exitDoor = exitId;
    var k = small.matches ? 0.75 : 1;
    var works = $('#works');
    window.scrollTo({ top: works.getBoundingClientRect().top + window.pageYOffset - 20, behavior: 'auto' });
    body.classList.remove('is-locked');
    busy = true; killTl();
    var c = buildCam(d);
    d.el.style.visibility = 'hidden';
    g.set(c.cam, { transformOrigin: c.cx + 'px ' + c.cy + 'px', scale: c.scale, opacity: 1 });
    g.set(c.leaf, { transformOrigin: '0% 50%', rotationY: -108 });
    g.set(c.handle, { rotation: 16, transformOrigin: '0% 50%' });
    g.set(c.glow, { opacity: 1, scale: 1.2 });
    c.door.style.setProperty('--lit', 1);
    tl = g.timeline({ onComplete: function () {
      cleanupCam(c, d); showRooms(false); current = null; pushed = false;
      document.title = 'K G Harish Patel — Computer Vision & Machine Learning';
      // show which door we came out of, then let it settle
      d.tgt = 1; setFocus(idx); kick();
      setTimeout(function () { if (!roomsOpen && !busy) release(); }, 1600);
      settle();
    } });
    tl.to(rooms, { autoAlpha: 0, scale: 1.05, duration: 0.8 * k, ease: 'power2.in' }, 0)
      .to(c.cam, { scale: 1, duration: 1.8 * k, ease: 'power3.out' }, 0.45 * k)
      .to(c.leaf, { rotationY: 0, duration: 1.2 * k, ease: 'power3.inOut' }, 1.5 * k)
      .to(c.handle, { rotation: 0, duration: 0.35 * k, ease: 'power2.out' }, 2.5 * k)
      .to(c.glow, { opacity: 0, duration: 0.9 * k }, 1.7 * k);
  }

  function swap(id) {
    busy = true; killTl();
    current = id;                                 // the exit door follows the room immediately
    history.replaceState({ room: id }, '', '#room/' + id);
    var wipe = $('#rn-wipe');
    tl = g.timeline({ onComplete: function () { g.set(page, { clearProps: 'all' }); settle(); } });
    tl.to(page, { autoAlpha: 0, y: -26, duration: 0.35, ease: 'power2.in' })
      .fromTo(wipe, { opacity: 0, xPercent: -100 }, { opacity: 1, xPercent: 0, duration: 0.45, ease: 'power2.inOut' }, 0.05)
      .add(function () { renderRoom(id); g.set(page, { autoAlpha: 0, y: 44 }); })
      .to(wipe, { xPercent: 100, duration: 0.55, ease: 'power2.inOut' }, '>-0.05')
      .to(page, { autoAlpha: 1, y: 0, duration: 0.75, ease: 'power3.out' }, '<0.1')
      .set(wipe, { opacity: 0 });
  }

  // one entry point for every kind of navigation (door click, tabs, footer, popstate)
  function goto(id) {
    if (busy) { wanted = id; return; }          // latest request wins once the running shot ends
    if (id === null) { if (roomsOpen) { if (pushed) history.back(); else doLeave(); } return; }
    if (!catById[id]) return;
    if (roomsOpen) {
      if (id === current) return;
      if (!g || reduced) { renderRoom(id); history.replaceState({ room: id }, '', '#room/' + id); return; }
      return swap(id);
    }
    var d = doors[doorIndex(id)];
    var r = d.btn.getBoundingClientRect();
    if (!g || reduced) { renderRoom(id); showRooms(true); history.pushState({ room: id }, '', '#room/' + id); pushed = true; return; }
    if (!(r.bottom > 0 && r.top < window.innerHeight)) {
      var works = $('#works');
      window.scrollTo({ top: works.getBoundingClientRect().top + window.pageYOffset - 20, behavior: 'auto' });
    }
    enter(id, d);
  }
  function openRoom(id) { goto(id); }

  function closeRooms() {
    if (busy) { wanted = null; return; }
    if (!roomsOpen) return;
    if (pushed) { history.back(); return; }       // popstate runs the same leave shot
    history.replaceState(null, '', location.pathname + location.search);
    doLeave();
  }
  function doLeave() {
    if (!g || reduced) { showRooms(false); current = null; document.title = 'K G Harish Patel — Computer Vision & Machine Learning'; return; }
    leave();
  }

  $('#rn-back').addEventListener('click', closeRooms);
  document.addEventListener('keydown', function (e) {
    if (!roomsOpen) return;
    if (e.key === 'Escape') { if (!overlay.hidden) setOverlay(false); else closeRooms(); }
  });

  // browser back / forward
  window.addEventListener('popstate', function (e) {
    var id = e.state && e.state.room;
    if (id && catById[id]) { if (!roomsOpen) pushed = true; goto(id); }
    else { pushed = false; goto(null); }
  });

  // deep link: #room/<id>
  var m = /^#room\/([a-z]+)$/.exec(location.hash);
  if (m && catById[m[1]]) {
    renderRoom(m[1]); showRooms(true);
    history.replaceState({ room: m[1] }, '', location.hash);
  }

  var HPRooms = window.HPRooms = { open: openRoom, close: closeRooms, current: function () { return current; }, count: function () { return doors.length; }, exitDoor: null, busy: function () { return busy; } };
})();
