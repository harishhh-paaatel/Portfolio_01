/* The rope: every pull toggles light / dark through the central HPTheme provider. */
(function () {
  'use strict';
  var rope = document.getElementById('cord');
  var T = window.HPTheme;
  if (!rope || !T) return;
  var g = window.gsap;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pulling = false;
  var state = { pull: 0 };

  function sync(theme) {
    var dark = theme === 'dark';
    rope.setAttribute('aria-pressed', String(dark));
    rope.setAttribute('aria-label', dark ? 'Pull the rope to switch to light mode' : 'Pull the rope to switch to dark mode');
    rope.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  sync(T.get());
  T.onChange(sync);

  function paint() {
    rope.style.setProperty('--pull', state.pull.toFixed(1) + 'px');
    rope.style.setProperty('--tilt', (state.pull * 0.07).toFixed(2) + 'deg');
  }

  function pull() {
    if (pulling) return;
    pulling = true;
    var done = function () { rope.classList.remove('is-pulled'); state.pull = 0; paint(); pulling = false; };
    if (!g || reduced) { T.toggle(); pulling = false; return; }
    rope.classList.add('is-pulled');                       // pauses the idle sway
    g.timeline({ onUpdate: paint })
      .to(state, { pull: 46, duration: 0.2, ease: 'power2.out' })
      .to(state, { pull: 0, duration: 1.0, ease: 'elastic.out(1, 0.32)' });
    // timers (not the animation clock) drive state, so a busy or background tab can never skip or double a pull
    setTimeout(function () { T.toggle(); }, 200);          // the theme flips at the bottom of the pull
    setTimeout(done, 1250);
  }

  rope.addEventListener('click', pull);
})();
