// Nav + mega menu, text size, office open/closed status, demo forms, reveals, lightbox. No dependencies.
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');

  function store(get, key, val) {
    try { return get ? window.localStorage.getItem(key) : window.localStorage.setItem(key, val); } catch (e) { return null; }
  }

  // Preview ribbon
  var ribbon = d.querySelector('.ribbon');
  if (ribbon) {
    try { if (window.sessionStorage.getItem('ribbon-dismissed')) ribbon.hidden = true; } catch (e) {}
    ribbon.querySelector('button').addEventListener('click', function () {
      ribbon.hidden = true;
      try { window.sessionStorage.setItem('ribbon-dismissed', '1'); } catch (e) {}
    });
  }

  // Text size (the live site has a text-size control in its accessibility mode)
  var sizeBtns = d.querySelectorAll('.textsize button');
  function setSize(v) {
    root.style.fontSize = v + '%';
    sizeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-size') === String(v))); });
  }
  var saved = store(true, 'galvan-size');
  setSize(saved || 100);
  sizeBtns.forEach(function (b) {
    b.addEventListener('click', function () { var v = b.getAttribute('data-size'); setSize(v); store(false, 'galvan-size', v); });
  });

  // Mobile nav
  var toggle = d.querySelector('.nav-toggle'), nav = d.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Mega menu
  var mega = d.querySelector('.has-mega');
  if (mega) {
    var mt = mega.querySelector('.mega-toggle');
    mt.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = mega.classList.toggle('open');
      mt.setAttribute('aria-expanded', String(open));
    });
    d.addEventListener('click', function (e) {
      if (!mega.contains(e.target)) { mega.classList.remove('open'); mt.setAttribute('aria-expanded', 'false'); }
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { mega.classList.remove('open'); mt.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Open / closed status, in the practice's time zone
  function clock() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var dow = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[o.weekday];
    return { dow: dow, mins: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }
  function toMin(s) { var p = s.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function fmt(m) { var h = Math.floor(m / 60), ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (m % 60 ? ':' + ('0' + (m % 60)).slice(-2) : '') + ' ' + ap; }
  var now = clock();
  d.querySelectorAll('table.hours').forEach(function (t) {
    var key = t.getAttribute('data-office');
    var row = t.querySelector('tr[data-dow="' + now.dow + '"]');
    if (row) row.classList.add('today');
    var info = t.getAttribute('data-d' + now.dow);
    var label = 'Closed today', cls = 'closed';
    if (info && info !== 'closed') {
      var a = info.split('-'), s = toMin(a[0]), e = toMin(a[1]);
      if (now.mins >= s && now.mins < e) { label = 'Open now · until ' + fmt(e); cls = 'open'; }
      else if (now.mins < s) { label = 'Opens today ' + fmt(s); cls = 'closed'; }
      else { label = 'Closed now'; cls = 'closed'; }
    }
    d.querySelectorAll('[data-status-for="' + key + '"]').forEach(function (el) { el.textContent = label; el.className = 'status ' + cls; });
  });

  // Demo forms: validate lightly, then show a "preview only" confirmation
  d.querySelectorAll('[data-preview-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.querySelector('[name="name"]');
      var email = f.querySelector('[name="email"]'), phone = f.querySelector('[name="phone"]');
      var ok = true;
      [name, email, phone].forEach(function (x) { if (x) x.classList.remove('invalid'); });
      if (name && !name.value.trim()) { name.classList.add('invalid'); ok = false; }
      if (email && phone && !email.value.trim() && !phone.value.trim()) { email.classList.add('invalid'); phone.classList.add('invalid'); ok = false; }
      if (!ok) { var bad = f.querySelector('.invalid'); if (bad) bad.focus(); return; }
      var done = f.querySelector('.form-done');
      if (done) { done.hidden = false; done.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    });
  });

  // "Any day" / "Any time" chips are exclusive with the specific ones
  d.querySelectorAll('[data-group]').forEach(function (g) {
    var any = g.querySelector('[data-any]'), rest = g.querySelectorAll('input:not([data-any])');
    any.addEventListener('change', function () { if (any.checked) rest.forEach(function (r) { r.checked = false; }); });
    rest.forEach(function (r) {
      r.addEventListener('change', function () {
        var some = Array.prototype.some.call(rest, function (x) { return x.checked; });
        any.checked = !some;
      });
    });
  });

  // ?office=concord pre-selects an office on the appointment form
  var qs = window.location.search.match(/office=(concord|fairfield)/);
  if (qs) { var c = d.querySelector('input[name="office"][value="' + qs[1] + '"]'); if (c) c.checked = true; }

  // Gallery lightbox
  d.querySelectorAll('.shot').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var lb = d.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Photo');
      lb.innerHTML = '<img alt="">'; lb.firstChild.src = a.getAttribute('href');
      function close() { lb.remove(); d.removeEventListener('keydown', onKey); }
      function onKey(ev) { if (ev.key === 'Escape') close(); }
      lb.addEventListener('click', close); d.addEventListener('keydown', onKey); d.body.appendChild(lb);
    });
  });

  // Scroll reveals
  var items = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }
})();
