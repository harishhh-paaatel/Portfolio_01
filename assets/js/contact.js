/* Contact form -> EmailJS (official browser SDK, free plan). Success is shown only after
   EmailJS answers with status 200. Nothing is simulated. */
(function () {
  'use strict';
  var form = document.getElementById('req-form');
  if (!form) return;

  var CFG = window.EMAILJS_CONFIG || {};
  var EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
  var MAX = { name: 120, email: 200, subject: 150, message: 5000 };
  var COOLDOWN_MS = 30000, DEDUPE_MS = 10 * 60 * 1000, TIMEOUT_MS = 20000;
  var MSG_OK = 'Thanks for reaching out! Your message has been sent successfully.';
  var MSG_FAIL = 'Your message could not be sent. Please try again or contact me directly by email.';

  var mForm = document.getElementById('m-form'), mOk = document.getElementById('m-ok');
  var title = document.getElementById('m-ok-title'), text = document.getElementById('m-ok-text');
  var errBox = form.querySelector('[data-err]');
  var btn = document.getElementById('req-submit'), label = btn.querySelector('[data-label]');
  var sending = false;

  function configured() {
    return !!(window.emailjs && CFG.serviceId && CFG.templateId && CFG.publicKey && !/^YOUR_|^$/i.test(CFG.serviceId + CFG.templateId + CFG.publicKey));
  }
  if (configured()) { try { window.emailjs.init({ publicKey: CFG.publicKey }); } catch (e) { /* surfaced on submit */ } }

  function store(op, k, v) { try { return op === 'get' ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } }
  function fingerprint(v) { return [v.email.toLowerCase(), v.subject, v.message].join('\u0001'); }

  function fieldErr(name, msg) {
    var input = form.elements[name], out = document.getElementById('e-' + name);
    if (out) out.textContent = msg || '';
    if (input) { input.classList.toggle('is-invalid', !!msg); if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function read() {
    var f = form.elements;
    return { name: f.name.value.trim(), email: f.email.value.trim(), subject: f.subject.value.trim(), message: f.message.value.trim() };
  }
  function validate(v) {
    fieldErr('name', !v.name ? 'Please enter your name.' : v.name.length > MAX.name ? 'Name is too long.' : '');
    fieldErr('email', !v.email ? 'Please enter your email address.' : (v.email.length > MAX.email || !EMAIL_RE.test(v.email)) ? 'Please enter a valid email address.' : '');
    fieldErr('subject', !v.subject ? 'Please enter a subject.' : v.subject.length > MAX.subject ? 'Subject is too long.' : '');
    fieldErr('message', !v.message ? 'Please write a message.' : v.message.length > MAX.message ? 'Message is too long (5000 characters maximum).' : '');
    return ['name', 'email', 'subject', 'message'].map(function (k) { return form.elements[k]; }).filter(function (el) { return el.classList.contains('is-invalid'); });
  }
  function busy(on) {
    sending = on;
    btn.disabled = on;
    btn.classList.toggle('is-sending', on);
    label.textContent = on ? 'Sending…' : 'Send message';
    form.setAttribute('aria-busy', String(on));
  }
  function fail(extra) {
    errBox.textContent = MSG_FAIL + (extra ? ' ' + extra : '');
  }
  function explain(err) {
    var s = err && err.status, t = String((err && (err.text || err.message)) || '').toLowerCase();
    if (s === 429 || /quota|limit|exceed/.test(t)) return '(The monthly email limit has been reached.)';
    if (s === 402) return '(The email service plan limit has been reached.)';
    if (s === 403 || /origin|domain|not allowed|forbidden/.test(t)) return '(This website is not allowed to use the email service.)';
    if (s === 400 || s === 412) return '(The email service rejected the request: check the EmailJS configuration.)';
    if (!s || /network|failed to fetch|timeout/.test(t)) return '(Network problem: please check your connection.)';
    return '';
  }

  ['input', 'change'].forEach(function (ev) {
    form.addEventListener(ev, function (e) { if (e.target.classList && e.target.classList.contains('is-invalid')) fieldErr(e.target.name, ''); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;                                           // no duplicate submissions while a request is running
    errBox.textContent = '';
    var v = read();
    var bad = validate(v);
    if (bad.length) { bad[0].focus(); return; }
    if (form.elements.website.value) { fail(); return; }            // honeypot: bots never reach EmailJS
    if (!configured()) { fail('(The contact service is not configured.)'); return; }

    var now = Date.now();
    var last = Number(store('get', 'hp-last-send')) || 0;
    if (now - last < COOLDOWN_MS) { errBox.textContent = 'Please wait a few seconds before sending another message.'; return; }
    var prev = store('get', 'hp-last-fp');
    if (prev && prev.split('|')[0] === fingerprint(v) && now - Number(prev.split('|')[1]) < DEDUPE_MS) {
      errBox.textContent = 'This exact message was already sent a moment ago.'; return;
    }

    busy(true);
    var params = { from_name: v.name, reply_to: v.email, subject: v.subject, message: v.message };
    var timeout = new Promise(function (_, rej) { setTimeout(function () { rej({ status: 0, text: 'timeout' }); }, TIMEOUT_MS); });
    Promise.race([window.emailjs.send(CFG.serviceId, CFG.templateId, params), timeout])
      .then(function (res) {
        if (!res || res.status !== 200) throw res || { status: 0, text: 'no response' };
        store('set', 'hp-last-send', String(Date.now()));
        store('set', 'hp-last-fp', fingerprint(v) + '|' + Date.now());
        mForm.hidden = true; mOk.hidden = false; mOk.classList.remove('is-error');
        title.textContent = 'Message sent';
        text.textContent = MSG_OK;
        mOk.querySelector('.msuccess__badge').textContent = '✓';
        form.reset();
      })
      .catch(function (err) { fail(explain(err)); })               // the visitor's text stays in the form for a retry
      .then(function () { busy(false); });
  });
})();
