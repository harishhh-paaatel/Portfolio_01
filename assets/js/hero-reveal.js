/*!
 * Interactive Hero Reveal
 * -----------------------------------------------------------------------------
 * Image 1 (the <img>) is the permanent base layer and is never touched.
 * Image 2 is painted onto a canvas that sits exactly on top of Image 1, but only
 * inside an organic, continuously morphing, feathered blob that follows the
 * cursor (or finger) with a little inertia. Outside the blob the canvas is
 * transparent, so the visitor always sees Image 1 there.
 *
 *  - Never a circle / oval / spotlight: the outline is built from several
 *    out-of-phase harmonics, so it is asymmetric and always moving.
 *  - Soft feathered edge via an off-screen shadow blur (works in every browser).
 *  - The blob stretches against the direction of travel and sheds two small
 *    trailing droplets when moving fast, which gives the liquid feel.
 *  - Both images share identical dimensions and are drawn into the same box,
 *    so they stay perfectly aligned. Only the mask moves and deforms.
 *  - Mouse leave (or touch end) shrinks the mask to nothing => Image 1 only.
 *  - requestAnimationFrame loop that sleeps whenever nothing is visible.
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // Frame-rate independent smoothing factor (k is the per-frame factor at 60fps)
  function damp(k, dt) { return 1 - Math.pow(1 - k, dt * 60); }

  function HeroReveal(root, options) {
    this.root = root;
    this.stage = root.querySelector('[data-reveal-stage]');
    this.canvas = root.querySelector('[data-reveal-canvas]');
    if (!this.stage || !this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.o = Object.assign({
      minSize: 250,     // overall blob size in CSS px (spec: ~250–400px)
      maxSize: 400,
      sizeRatio: 0.38,  // size relative to the portrait height, clamped to the range above
      follow: 0.15,     // position smoothing (lower = more inertia)
      enter: 0.12,      // grow speed
      exit: 0.2,        // shrink speed on leave
      feather: 0.26,    // edge softness as a fraction of the radius
      points: 72        // outline resolution
    }, options || {});

    if (this.reduced) {
      this.o.follow = 0.35;
    }

    // State (all positions in canvas device pixels)
    this.scale = 1;           // canvas px per CSS px
    this.size = 320;          // current overall size in CSS px
    this.target = { x: 0, y: 0 };
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.drops = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    this.presence = 0;        // 0 = hidden, 1 = fully open
    this.active = false;
    this.client = null;       // last pointer position in client coords
    this.time = Math.random() * 100;
    this.last = 0;
    this.running = false;
    this.ready = false;
    this.seed = [Math.random() * TAU, Math.random() * TAU, Math.random() * TAU, Math.random() * TAU];

    this.img = new Image();
    this.img.decoding = 'async';
    this.img.onload = function () { this.ready = true; this.resize(); }.bind(this);
    this.img.src = this.canvas.getAttribute('data-src');

    this.tick = this.tick.bind(this);
    this.bind();
    this.resize();
  }

  HeroReveal.prototype.bind = function () {
    var self = this;

    // Mouse / pen
    this.root.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      self.move(e.clientX, e.clientY);
    }, { passive: true });
    this.root.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      self.leave();
    });

    // Touch: finger position drives the reveal; listeners are passive so scrolling stays native
    this.root.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      if (t) self.move(t.clientX, t.clientY, true);
    }, { passive: true });
    this.root.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      if (t) self.move(t.clientX, t.clientY);
    }, { passive: true });
    this.root.addEventListener('touchend', function () { self.leave(); }, { passive: true });
    this.root.addEventListener('touchcancel', function () { self.leave(); }, { passive: true });

    // Keep the mask under a stationary cursor while the page scrolls
    window.addEventListener('scroll', function () {
      if (self.active && self.client) self.updateTarget(self.client.x, self.client.y);
    }, { passive: true });

    window.addEventListener('blur', function () { self.leave(); });

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { self.resize(); }).observe(this.stage);
    } else {
      window.addEventListener('resize', function () { self.resize(); });
    }
  };

  HeroReveal.prototype.resize = function () {
    var rect = this.stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Never render more pixels than Image 2 actually has; cap at 2x for retina.
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var natural = this.img.naturalWidth || rect.width * dpr;
    var scale = Math.min(dpr, Math.max(1, natural / rect.width));

    var w = Math.round(rect.width * scale);
    var h = Math.round(rect.height * scale);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      var ratioX = this.canvas.width ? w / this.canvas.width : 1;
      var ratioY = this.canvas.height ? h / this.canvas.height : 1;
      this.canvas.width = w;
      this.canvas.height = h;
      [this.pos, this.target].concat(this.drops).forEach(function (p) { p.x *= ratioX; p.y *= ratioY; });
    }
    this.scale = scale;
    this.size = clamp(rect.height * this.o.sizeRatio, this.o.minSize, this.o.maxSize);
    if (!this.running) this.clear();
  };

  HeroReveal.prototype.updateTarget = function (cx, cy) {
    var rect = this.canvas.getBoundingClientRect();
    var sx = this.canvas.width / (rect.width || 1);
    var sy = this.canvas.height / (rect.height || 1);
    this.target.x = (cx - rect.left) * sx;
    this.target.y = (cy - rect.top) * sy;
  };

  HeroReveal.prototype.move = function (cx, cy, snap) {
    this.client = { x: cx, y: cy };
    this.updateTarget(cx, cy);

    // Entering from a hidden state: open right where the pointer is
    if (!this.active && (snap || this.presence < 0.05)) {
      this.pos.x = this.target.x; this.pos.y = this.target.y;
      this.vel.x = 0; this.vel.y = 0;
      for (var i = 0; i < this.drops.length; i++) {
        this.drops[i].x = this.target.x; this.drops[i].y = this.target.y;
      }
    }
    this.active = true;
    this.start();
  };

  HeroReveal.prototype.leave = function () {
    this.active = false;
    this.client = null;
  };

  HeroReveal.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  };

  HeroReveal.prototype.clear = function () {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  HeroReveal.prototype.tick = function (now) {
    var dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    this.time += dt * (this.reduced ? 0.35 : 1);

    // Presence (grow on enter, shrink on leave)
    this.presence = lerp(this.presence, this.active ? 1 : 0, damp(this.active ? this.o.enter : this.o.exit, dt));

    // Smoothed follow with inertia
    var prevX = this.pos.x, prevY = this.pos.y;
    var f = damp(this.o.follow, dt);
    this.pos.x = lerp(this.pos.x, this.target.x, f);
    this.pos.y = lerp(this.pos.y, this.target.y, f);

    // Smoothed velocity in CSS px / frame (used for deformation)
    var inv = 1 / (this.scale * Math.max(dt * 60, 0.001));
    this.vel.x = lerp(this.vel.x, (this.pos.x - prevX) * inv, damp(0.2, dt));
    this.vel.y = lerp(this.vel.y, (this.pos.y - prevY) * inv, damp(0.2, dt));

    // Trailing droplets follow with more lag
    var k1 = damp(0.09, dt), k2 = damp(0.06, dt);
    this.drops[0].x = lerp(this.drops[0].x, this.pos.x, k1);
    this.drops[0].y = lerp(this.drops[0].y, this.pos.y, k1);
    this.drops[1].x = lerp(this.drops[1].x, this.drops[0].x, k2);
    this.drops[1].y = lerp(this.drops[1].y, this.drops[0].y, k2);

    this.draw();

    if (!this.active && this.presence < 0.004) {
      this.presence = 0;
      this.clear();
      this.running = false;
      return;
    }
    requestAnimationFrame(this.tick);
  };

  // Build an organic closed outline around (cx, cy).
  HeroReveal.prototype.blobPath = function (ctx, cx, cy, radius, t, phase, stretch) {
    var n = this.o.points;
    var s = this.seed;
    var speed = stretch ? Math.min(Math.hypot(this.vel.x, this.vel.y), 60) : 0;
    var dir = Math.atan2(this.vel.y, this.vel.x);
    var dirX = Math.cos(dir), dirY = Math.sin(dir);
    var sp = speed / 60; // 0..1
    var pts = [];

    for (var i = 0; i < n; i++) {
      var a = (i / n) * TAU;
      // Out-of-phase harmonics => asymmetric, liquid, never a circle
      var r = 1
        + 0.11 * Math.sin(2 * a + t * 0.83 + s[0] + phase)
        + 0.075 * Math.sin(3 * a - t * 1.17 + s[1] - phase)
        + 0.045 * Math.sin(5 * a + t * 1.61 + s[2])
        + 0.025 * Math.sin(7 * a - t * 2.27 + s[3] + phase * 2);

      var ux = Math.cos(a), uy = Math.sin(a);
      var facing = ux * dirX + uy * dirY; // 1 = front edge, -1 = trailing edge

      // Compress the leading edge slightly, pull the trailing edge back like liquid
      r *= 1 - 0.1 * sp * Math.max(0, facing);
      var x = cx + ux * radius * r;
      var y = cy + uy * radius * r;
      if (sp > 0) {
        var back = Math.pow(Math.max(0, -facing), 1.6) * radius * 0.55 * sp;
        x -= dirX * back;
        y -= dirY * back;
      }
      pts.push(x, y);
    }

    // Smooth closed curve through the midpoints
    var lx = pts[pts.length - 2], ly = pts[pts.length - 1];
    ctx.moveTo((lx + pts[0]) / 2, (ly + pts[1]) / 2);
    for (var j = 0; j < pts.length; j += 2) {
      var nx = pts[(j + 2) % pts.length], ny = pts[(j + 3) % pts.length];
      ctx.quadraticCurveTo(pts[j], pts[j + 1], (pts[j] + nx) / 2, (pts[j + 1] + ny) / 2);
    }
    ctx.closePath();
  };

  HeroReveal.prototype.draw = function () {
    var ctx = this.ctx;
    var w = this.canvas.width, h = this.canvas.height;
    this.clear();
    if (!this.ready || this.presence <= 0) return;

    var ease = 1 - Math.pow(1 - this.presence, 3);
    var radius = (this.size * 0.5) * this.scale * ease;
    var feather = radius * this.o.feather;
    var core = Math.max(radius - feather * 0.6, 1);
    var t = this.time;

    // 1) Paint the soft mask: shapes are drawn far off-canvas and only their
    //    blurred shadow lands on the canvas => feathered edge in every browser.
    var off = w + h + feather * 4;
    ctx.setTransform(1, 0, 0, 1, -off, 0);
    ctx.shadowOffsetX = off;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = feather;
    ctx.shadowColor = '#000';
    ctx.fillStyle = '#000';

    ctx.beginPath();
    this.blobPath(ctx, this.pos.x, this.pos.y, core, t, 0, true);
    ctx.fill();

    // Droplets only show up while moving fast, then merge back into the body
    if (!this.reduced) {
      var speed = Math.min(Math.hypot(this.vel.x, this.vel.y) / 40, 1);
      if (speed > 0.05) {
        var d0 = this.drops[0], d1 = this.drops[1];
        ctx.beginPath();
        this.blobPath(ctx, d0.x, d0.y, core * 0.42 * speed, t * 1.3, 1.7, false);
        ctx.fill();
        ctx.beginPath();
        this.blobPath(ctx, d1.x, d1.y, core * 0.26 * speed, t * 1.6, 3.1, false);
        ctx.fill();
      }
    }

    // 2) Keep Image 2 only where the mask is
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(this.img, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  };

  window.HeroReveal = HeroReveal;

  function init() {
    var root = document.querySelector('[data-hero]');
    if (root) window.heroReveal = new HeroReveal(root);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
