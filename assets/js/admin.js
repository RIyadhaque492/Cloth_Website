/* Velora admin — UI behaviour only. Nothing is saved yet (backend comes later). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var val = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
  var slugify = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
  var strip = function (h) { var d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };

  /* toast */
  var tEl, tT;
  function toast(m) {
    if (!tEl) { tEl = document.createElement('div'); tEl.className = 'toast'; tEl.setAttribute('role', 'status'); document.body.appendChild(tEl); }
    tEl.textContent = m; tEl.classList.add('show'); clearTimeout(tT); tT = setTimeout(function () { tEl.classList.remove('show'); }, 2600);
  }
  $$('[data-toast]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); toast(b.getAttribute('data-toast')); }); });
  $$('form[data-demo]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); toast(f.getAttribute('data-demo') || 'Saved (demo — nothing is stored yet)'); }); });

  /* sidebar */
  var side = $('#side'), scrim = $('.scrim');
  $$('[data-menu]').forEach(function (b) { b.addEventListener('click', function () { var o = !side.classList.contains('open'); side.classList.toggle('open', o); scrim.classList.toggle('open', o); }); });
  if (scrim) scrim.addEventListener('click', function () { side.classList.remove('open'); scrim.classList.remove('open'); });

  /* tabs */
  $$('[data-tabs]').forEach(function (wrap) {
    var btns = $$('[data-tab]', wrap), panes = $$('[data-pane]', wrap.parentNode);
    var show = function (id) {
      btns.forEach(function (b) { b.classList.toggle('on', b.dataset.tab === id); b.setAttribute('aria-selected', b.dataset.tab === id); });
      panes.forEach(function (p) { p.hidden = p.dataset.pane !== id; });
    };
    btns.forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.tab); if (history.replaceState) history.replaceState(null, '', '#' + b.dataset.tab); }); });
    var h = location.hash.slice(1); show(btns.some(function (b) { return b.dataset.tab === h; }) ? h : btns[0].dataset.tab);
  });

  /* modals */
  $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { var m = document.getElementById(b.dataset.open); if (m) m.classList.add('open'); }); });
  $$('.modal').forEach(function (m) { m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('open'); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { $$('.modal.open').forEach(function (m) { m.classList.remove('open'); }); side && side.classList.remove('open'); scrim && scrim.classList.remove('open'); } });

  /* copy */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.querySelector(b.dataset.copy); if (!t) return;
      var txt = t.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('Copied to clipboard'); }, function () { toast('Select the text and press Ctrl+C'); });
    });
  });
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  /* counters */
  $$('.counter[data-count]').forEach(function (c) {
    var i = document.getElementById(c.dataset.count), max = +c.dataset.max; if (!i) return;
    var u = function () { var n = i.value.length; c.textContent = n + ' / ' + max; c.className = 'counter ' + (n === 0 ? '' : n > max ? 'over' : n < max * 0.5 ? 'low' : 'ok'); };
    i.addEventListener('input', u); u();
  });

  /* table: search + status tabs + select-all */
  $$('[data-table]').forEach(function (root) {
    var rows = $$('tbody tr', root), q = $('[data-search-rows]', root), st = $$('[data-status-btn]', root), cur = 'all';
    var sel = $$('[data-filter-select]', root);
    var run = function () {
      var term = q ? q.value.trim().toLowerCase() : '';
      var n = 0;
      rows.forEach(function (r) {
        var ok = (cur === 'all' || r.dataset.status === cur) && (!term || r.textContent.toLowerCase().indexOf(term) > -1) &&
          sel.every(function (s) { return !s.value || r.dataset[s.dataset.filterSelect] === s.value; });
        r.hidden = !ok; if (ok) n++;
      });
      var c = $('[data-count-rows]', root); if (c) c.textContent = n;
      var em = $('[data-empty]', root); if (em) em.hidden = n > 0;
    };
    if (q) q.addEventListener('input', run);
    sel.forEach(function (s) { s.addEventListener('change', run); });
    st.forEach(function (b) { b.addEventListener('click', function () { cur = b.dataset.statusBtn; st.forEach(function (x) { x.classList.toggle('on', x === b); }); run(); }); });
    var all = $('[data-check-all]', root), bulk = $('.bulk', root);
    var upd = function () { var n = $$('tbody input[type=checkbox]:checked', root).length; if (bulk) { bulk.classList.toggle('show', n > 0); $('b', bulk).textContent = n + ' selected'; } };
    if (all) all.addEventListener('change', function () { $$('tbody tr:not([hidden]) input[type=checkbox]', root).forEach(function (c) { c.checked = all.checked; }); upd(); });
    root.addEventListener('change', function (e) { if (e.target.matches('tbody input[type=checkbox]')) upd(); });
  });

  /* image upload with previews */
  $$('[data-drop]').forEach(function (zone) {
    var input = $('input[type=file]', zone), list = document.getElementById(zone.dataset.drop), files = [];
    var draw = function () {
      list.innerHTML = '';
      files.forEach(function (f, i) {
        var url = URL.createObjectURL(f), d = document.createElement('div'); d.className = 'preview';
        d.innerHTML = '<img alt=""><button type="button" class="x" aria-label="Remove image">×</button>' + (i === 0 ? '<span class="main">Main</span>' : '');
        d.firstChild.src = url; d.querySelector('.x').addEventListener('click', function () { files.splice(i, 1); draw(); });
        list.appendChild(d);
      });
    };
    var add = function (fl) { Array.prototype.forEach.call(fl, function (f) { if (/^image\//.test(f.type) && f.size < 8 * 1048576) files.push(f); else toast('Only images under 8 MB are allowed'); }); draw(); };
    input.addEventListener('change', function () { add(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('over'); }); });
    zone.addEventListener('drop', function (e) { add(e.dataTransfer.files); });
    $$('.preview .x', list).forEach(function (x) { x.addEventListener('click', function () { x.parentNode.remove(); }); });
  });

  /* tag input (colours) */
  $$('[data-tagbox]').forEach(function (box) {
    var list = $('.tags', box), inp = $('input', box);
    var mk = function (t) { var s = document.createElement('span'); s.innerHTML = '<em style="font-style:normal"></em><button type="button" aria-label="Remove">×</button>'; s.firstChild.textContent = t; s.lastChild.addEventListener('click', function () { s.remove(); }); list.appendChild(s); };
    inp.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ',') && inp.value.trim()) { e.preventDefault(); mk(inp.value.trim().replace(/,$/, '')); inp.value = ''; } });
    $$('.tags button', box).forEach(function (b) { b.addEventListener('click', function () { b.parentNode.remove(); }); });
  });

  /* rich editor */
  $$('[data-rte]').forEach(function (r) {
    $$('[data-cmd]', r).forEach(function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        var v = b.dataset.val || null; if (b.dataset.cmd === 'createLink') { v = prompt('Link address (https://…)'); if (!v) return; }
        if (b.dataset.cmd === 'formatBlock' && v) v = '<' + v + '>';
        $('.rte-area', r).focus(); document.execCommand(b.dataset.cmd, false, v);
      });
    });
  });

  /* SEO box */
  var seo = $('[data-seo]');
  if (seo) {
    var tpl = seo.dataset.template || '%title% | %sitename%', site = seo.dataset.site || '', sname = seo.dataset.sitename || '';
    var title = function () { return val('p-name'); }, slug = function () { return val('p-slug') || slugify(title()); };
    var full = function () { return val('seo-title') || (title() ? tpl.replace('%title%', title()).replace('%sitename%', sname) : sname); };
    var desc = function () { return val('seo-desc') || strip((document.getElementById('p-desc') || {}).innerHTML || val('p-short')).slice(0, 155); };
    var upd = function () {
      $('[data-serp-title]', seo).textContent = full();
      $('[data-serp-desc]', seo).textContent = desc() || 'No description yet — Google will choose text from the page.';
      $('[data-serp-url]', seo).textContent = site.replace(/^https?:\/\//, '') + ' › ' + slug();
      var kw = val('seo-kw').toLowerCase(), items = [], add = function (s, m) { items.push([s, m]); };
      var rd = val('seo-desc'), tl = full().length;
      if (!kw) add('bad', 'Set a focus keyword — the phrase you want this page to rank for.');
      else {
        add(full().toLowerCase().indexOf(kw) > -1 ? 'ok' : 'bad', 'Focus keyword appears in the SEO title.');
        add(rd.toLowerCase().indexOf(kw) > -1 ? 'ok' : 'bad', 'Focus keyword appears in the meta description.');
        add(slug().indexOf(slugify(kw)) > -1 ? 'ok' : 'mid', 'Focus keyword appears in the URL slug.');
      }
      add(tl >= 30 && tl <= 60 ? 'ok' : 'mid', 'SEO title is ' + tl + ' characters (aim for 30–60).');
      add(!rd ? 'bad' : rd.length >= 120 && rd.length <= 160 ? 'ok' : 'mid', !rd ? 'No meta description written yet.' : 'Meta description is ' + rd.length + ' characters (aim for 120–160).');
      var imgs = $$('[data-has-image]').length ? 1 : 0; add(imgs ? 'ok' : 'mid', imgs ? 'Page has an image for social sharing.' : 'Add an image for social sharing.');
      var ul = $('[data-checks]', seo); ul.innerHTML = '';
      items.forEach(function (i) { var li = document.createElement('li'); li.className = i[0]; li.innerHTML = '<i></i><span></span>'; li.lastChild.textContent = i[1]; ul.appendChild(li); });
      var n = items.filter(function (i) { return i[0] === 'ok'; }).length, sc = $('[data-score]', seo), p = n / items.length;
      sc.textContent = n + '/' + items.length; sc.className = 'score ' + (p >= 0.8 ? 'ok' : p >= 0.5 ? 'mid' : 'bad');
    };
    $$('input,textarea,select', document).forEach(function (e) { e.addEventListener('input', upd); });
    $$('.rte-area').forEach(function (e) { e.addEventListener('input', upd); });
    $$('[data-serp-mode]', seo).forEach(function (b) { b.addEventListener('click', function () { $('.serp', seo).classList.toggle('mobile', b.dataset.serpMode === 'mobile'); $$('[data-serp-mode]', seo).forEach(function (x) { x.classList.toggle('btn-primary', x === b); }); }); });
    var sn = $('#p-name'), sl = $('#p-slug');
    if (sn && sl && !sl.value) sn.addEventListener('input', function () { sl.placeholder = slugify(sn.value); });
    upd();
  }
  /* simple SERP (global SEO page) */
  var gs = $('[data-gserp]');
  if (gs) {
    var gu = function () {
      $('[data-serp-title]', gs).textContent = val('g-title') || 'Your homepage title';
      $('[data-serp-desc]', gs).textContent = val('g-desc') || 'Your homepage description appears here.';
    };
    ['g-title', 'g-desc'].forEach(function (id) { var e = document.getElementById(id); if (e) e.addEventListener('input', gu); }); gu();
  }

  /* live tracking-config generator (pixels page) */
  var gen = $('#genConfig');
  if (gen) {
    var ids = function (id) { return val(id).split(/\s*,\s*/).filter(Boolean).map(function (x) { return "'" + x.replace(/[^0-9]/g, '') + "'"; }).join(', '); };
    var evs = function () { var o = {}; $$('[data-ev]').forEach(function (c) { o[c.dataset.ev] = c.checked; }); return o; };
    var render = function () {
      var e = evs();
      gen.textContent = "window.VELORA_TRACKING = {\n  fbPixelIds: [" + ids('t-fb') + "],\n  ga4: '" + val('t-ga') + "',\n  gtm: '" + val('t-gtm') + "',\n  tiktok: '" + val('t-tt') + "',\n  currency: 'BDT',\n  events: { " + Object.keys(e).map(function (k) { return k + ': ' + e[k]; }).join(', ') + " }\n};";
      [['t-fb', 'st-fb'], ['t-ga', 'st-ga'], ['t-gtm', 'st-gtm'], ['t-tt', 'st-tt']].forEach(function (p) {
        var b = document.getElementById(p[1]); if (!b) return; var on = !!val(p[0]);
        b.className = 'badge ' + (on ? 'b-ok' : 'b-mute'); b.textContent = on ? 'Connected' : 'Not connected';
      });
    };
    $$('input', document).forEach(function (i) { i.addEventListener('input', render); i.addEventListener('change', render); }); render();
  }

  /* dashboard chart (inline SVG, no library) */
  var ch = $('[data-chart]');
  if (ch) {
    var d = JSON.parse(ch.dataset.chart), W = 700, H = 240, pad = { l: 44, r: 12, t: 12, b: 28 }, max = Math.max.apply(null, d.map(function (x) { return x[1]; })) * 1.15;
    var bw = (W - pad.l - pad.r) / d.length, svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Sales for the last 14 days" preserveAspectRatio="none">';
    for (var g = 0; g <= 4; g++) { var y = pad.t + (H - pad.t - pad.b) * g / 4; svg += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y + '" y2="' + y + '" stroke="#e3e6ec"/><text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="#6a7183">' + Math.round(max * (1 - g / 4) / 1000) + 'k</text>'; }
    d.forEach(function (x, i) { var h = (H - pad.t - pad.b) * x[1] / max, bx = pad.l + i * bw + bw * 0.2; svg += '<rect x="' + bx + '" y="' + (H - pad.b - h) + '" width="' + bw * 0.6 + '" height="' + h + '" rx="4" fill="' + (i === d.length - 1 ? '#b4532a' : '#1b2a4a') + '"><title>' + x[0] + ': ৳' + x[1].toLocaleString() + '</title></rect><text x="' + (bx + bw * 0.3) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10.5" fill="#6a7183">' + x[0] + '</text>'; });
    ch.innerHTML = svg + '</svg>';
  }

  /* tracking modal sample */
  $$('[data-track-open]').forEach(function (b) {
    b.addEventListener('click', function () { var m = document.getElementById('trackModal'); if (m) { $('[data-tm-no]', m).textContent = b.dataset.trackOpen; m.classList.add('open'); } });
  });
})();
