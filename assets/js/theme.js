/* Central theme provider. Loaded synchronously in <head> so the correct theme is on <html>
   before first paint (no flash). Everything else asks window.HPTheme. */
(function () {
  'use strict';
  var KEY = 'hp-theme';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var listeners = [];

  function stored() { try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch (e) { return null; } }
  function initial() { return stored() || (mq && mq.matches ? 'dark' : 'light'); }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#181512' : '#EEE8DF');
    listeners.forEach(function (fn) { try { fn(theme); } catch (e) {} });
  }

  var theme = initial();
  apply(theme);

  window.HPTheme = {
    get: function () { return theme; },
    set: function (t, persist) {
      if (t !== 'dark' && t !== 'light') return;
      theme = t;
      root.classList.add('theme-anim');
      apply(t);
      clearTimeout(window.HPTheme._t);
      window.HPTheme._t = setTimeout(function () { root.classList.remove('theme-anim'); }, 700);
      if (persist !== false) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    },
    toggle: function () { this.set(theme === 'dark' ? 'light' : 'dark'); return theme; },
    onChange: function (fn) { listeners.push(fn); }
  };

  // follow the OS only while the visitor has not chosen a theme themselves
  if (mq && mq.addEventListener) mq.addEventListener('change', function (e) { if (!stored()) window.HPTheme.set(e.matches ? 'dark' : 'light', false); });
  // keep several open tabs in sync
  window.addEventListener('storage', function (e) { if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) window.HPTheme.set(e.newValue, false); });
})();
