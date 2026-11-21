(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var V = window.VELORA || { products: [], districts: [], cur: '৳' };
  var byId = {}; V.products.forEach(function (p) { byId[p.id] = p; });
  var fmt = function (n) { return V.cur + Number(n).toLocaleString('en-US'); };
  var store = {
    get: function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var vt = function (n, p) { if (window.vtrack) window.vtrack(n, p); };

  /* ---------- toast ---------- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- cart store ---------- */
  var getCart = function () { return store.get('velora_cart', []); };
  var saveCart = function (c) { store.set('velora_cart', c); badge(); };
  function badge() {
    var n = getCart().reduce(function (a, i) { return a + i.qty; }, 0);
    $$('[data-cart-count]').forEach(function (b) { b.textContent = n; b.setAttribute('data-n', n); });
  }
  function unit(p) { return p.sale || p.price; }
  function cartItems() {
    return getCart().map(function (i, idx) { var p = byId[i.id]; return p ? { idx: idx, p: p, size: i.size, color: i.color, qty: i.qty, line: unit(p) * i.qty } : null; }).filter(Boolean);
  }
  function trackPayload(items, orderId, total) {
    var mapped = items.map(function (i) { return { id: i.p.id, name: i.p.name, price: unit(i.p), qty: i.qty }; });
    var sum = mapped.reduce(function (a, i) { return a + i.price * i.qty; }, 0);
    return { value: total || sum, currency: 'BDT', ids: mapped.map(function (i) { return i.id; }), items: mapped, order_id: orderId };
  }
  function shipping(district, sub) {
    var free = V.freeOver || 0;
    if (free && sub >= free) return 0;
    return district === 'Dhaka' ? (V.shipDhaka || 70) : (V.shipOut || 130);
  }
  badge();

  /* ---------- drawer, search ---------- */
  var nav = $('#nav'), scrim = $('.drawer-scrim');
  function drawer(el, open) {
    if (!el) return;
    el.classList.toggle('open', open); scrim.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  $$('[data-drawer="nav"]').forEach(function (b) { b.addEventListener('click', function () { drawer(nav, !nav.classList.contains('open')); }); });
  var filters = $('#filters');
  $$('[data-drawer="filters"]').forEach(function (b) { b.addEventListener('click', function () { drawer(filters, !filters.classList.contains('open')); }); });
  if (scrim) scrim.addEventListener('click', function () { drawer(nav, false); drawer(filters, false); });

  var sp = $('#searchPanel');
  function openSearch() { sp.classList.add('open'); var i = $('input', sp); i.focus(); }
  function closeSearch() { sp.classList.remove('open'); }
  $$('[data-search]').forEach(function (b) { b.addEventListener('click', openSearch); });
  if (sp) {
    sp.addEventListener('click', function (e) { if (e.target === sp) closeSearch(); });
    var si = $('input', sp), out = $('.search-results', sp);
    si.addEventListener('input', function () {
      var q = si.value.trim().toLowerCase();
      if (q.length < 2) { out.innerHTML = ''; return; }
      var hits = V.products.filter(function (p) { return (p.name + ' ' + p.col).toLowerCase().indexOf(q) > -1; }).slice(0, 6);
      out.innerHTML = hits.length ? hits.map(function (p) {
        return '<a class="sr-item" href="' + p.url + '"><img src="' + p.img + '" alt="" width="44" height="55"><span>' + p.name + '</span><b>' + fmt(unit(p)) + '</b></a>';
      }).join('') : '<p class="muted" style="padding:10px">No shirts match “' + q.replace(/</g, '') + '”.</p>';
    });
    $('form', sp).addEventListener('submit', function () { vt('Search', { search: si.value.trim() }); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeSearch(); drawer(nav, false); drawer(filters, false); $$('.modal.open').forEach(function (m) { m.classList.remove('open'); }); }
  });

  /* ---------- hero slider ---------- */
  var hero = $('[data-slider]');
  if (hero) {
    var slides = $$('.slide', hero), dots = $$('.dots button', hero), cur = 0, timer;
    var go = function (n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === cur); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
    };
    var play = function () {
      clearInterval(timer);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(function () { go(cur + 1); }, 6000);
    };
    $('.prev', hero).addEventListener('click', function () { go(cur - 1); play(); });
    $('.next', hero).addEventListener('click', function () { go(cur + 1); play(); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); play(); }); });
    var sx = 0;
    hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { go(cur + (dx < 0 ? 1 : -1)); play(); } });
    play();
  }

  /* ---------- modals ---------- */
  $$('[data-open-modal]').forEach(function (b) {
    b.addEventListener('click', function () { var m = $('#modal-' + b.getAttribute('data-open-modal')); if (m) m.classList.add('open'); });
  });
  $$('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close-modal]')) m.classList.remove('open'); });
  });

  /* ---------- demo forms (newsletter / contact) ---------- */
  $$('[data-demo-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); toast(f.getAttribute('data-demo-form') || 'Thank you!'); f.reset(); });
  });

  /* ---------- shop: filter + sort ---------- */
  var grid = $('#shopGrid');
  if (grid) {
    var cards = $$('.card', grid), form = $('#filterForm'), sortSel = $('#sortSel'), countEl = $('#resultCount'), emptyEl = $('#emptyMsg');
    var params = new URLSearchParams(location.search);
    if (params.get('col') && form) { $$('input[name=col]', form).forEach(function (c) { c.checked = c.value === params.get('col'); }); }
    if (params.get('sale') === '1' && form) { $('input[name=sale]', form).checked = true; }
    if (params.get('sort') && sortSel) sortSel.value = params.get('sort');
    var apply = function () {
      var cols = form ? $$('input[name=col]:checked', form).map(function (c) { return c.value; }) : [];
      var sizes = form ? $$('input[name=size]:checked', form).map(function (c) { return c.value; }) : [];
      var max = form && $('#priceMax') ? +$('#priceMax').value : 1e9;
      var sale = form && $('input[name=sale]', form) ? $('input[name=sale]', form).checked : false;
      var q = (params.get('q') || '').toLowerCase();
      var shown = [];
      cards.forEach(function (c) {
        var ok = (!cols.length || cols.indexOf(c.dataset.col) > -1) &&
          (!sizes.length || sizes.some(function (s) { return c.dataset.sizes.split(' ').indexOf(s) > -1; })) &&
          (+c.dataset.price <= max) && (!sale || c.dataset.sale === '1') &&
          (!q || (c.dataset.name + ' ' + c.dataset.col).toLowerCase().indexOf(q) > -1);
        c.hidden = !ok; if (ok) shown.push(c);
      });
      var s = sortSel ? sortSel.value : 'new';
      var key = { 'new': function (a, b) { return a.dataset.i - b.dataset.i; }, 'price-asc': function (a, b) { return a.dataset.price - b.dataset.price; },
        'price-desc': function (a, b) { return b.dataset.price - a.dataset.price; }, 'best': function (a, b) { return b.dataset.rev - a.dataset.rev; },
        'name': function (a, b) { return a.dataset.name.localeCompare(b.dataset.name); } }[s];
      cards.slice().sort(key).forEach(function (c) { grid.appendChild(c); });
      if (countEl) countEl.textContent = shown.length + (shown.length === 1 ? ' shirt' : ' shirts');
      if (emptyEl) emptyEl.hidden = shown.length > 0;
      if ($('#priceOut')) $('#priceOut').textContent = V.cur + Number(max).toLocaleString('en-US');
    };
    if (form) { form.addEventListener('input', apply); form.addEventListener('reset', function () { setTimeout(apply, 0); }); }
    if (sortSel) sortSel.addEventListener('change', apply);
    apply();
  }

  /* ---------- product page ---------- */
  var main = $('[data-product]');
  if (main) {
    var p = byId[main.dataset.product];
    vt('ViewContent', { value: unit(p), currency: 'BDT', ids: [p.id], name: p.name, items: [{ id: p.id, name: p.name, price: unit(p), qty: 1 }] });
    var mainImg = $('#mainImg');
    $$('.thumb').forEach(function (t) {
      t.addEventListener('click', function () { mainImg.src = t.dataset.src; $$('.thumb').forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); });
    });
    var qty = $('#qty');
    $$('[data-qty]').forEach(function (b) { b.addEventListener('click', function () { qty.value = Math.max(1, Math.min(20, (+qty.value || 1) + (+b.dataset.qty))); }); });
    var bf = $('#buyForm'), mode = 'add';
    $$('button[data-mode]', bf).forEach(function (b) { b.addEventListener('click', function () { mode = b.dataset.mode; }); });
    var sticky = $('.sticky-buy');
    $$('[data-sticky-add]').forEach(function (b) { b.addEventListener('click', function () { mode = 'add'; bf.requestSubmit(); }); });
    bf.addEventListener('submit', function (e) {
      e.preventDefault();
      var size = $('input[name=size]:checked', bf), color = $('input[name=color]:checked', bf), msg = $('#buyMsg');
      if (!size) { msg.textContent = 'Please choose a size.'; msg.hidden = false; $('.chips', bf).scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      msg.hidden = true;
      var n = Math.max(1, Math.min(20, +qty.value || 1)), cart = getCart();
      var found = cart.filter(function (i) { return i.id === p.id && i.size === size.value && i.color === (color ? color.value : ''); })[0];
      if (found) found.qty = Math.min(20, found.qty + n); else cart.push({ id: p.id, size: size.value, color: color ? color.value : '', qty: n });
      saveCart(cart);
      vt('AddToCart', { value: unit(p) * n, currency: 'BDT', ids: [p.id], name: p.name, items: [{ id: p.id, name: p.name, price: unit(p), qty: n }] });
      if (mode === 'buy') location.href = 'checkout.html'; else toast('Added to your bag ✓');
    });
    if (sticky && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { sticky.classList.toggle('show', !en[0].isIntersecting && en[0].boundingClientRect.top < 0); }).observe($('.buy-row', bf));
    }
  }

  /* ---------- cart page ---------- */
  var cartRoot = $('#cartRoot');
  if (cartRoot) {
    var renderCart = function () {
      var items = cartItems(), sub = items.reduce(function (a, i) { return a + i.line; }, 0);
      if (!items.length) {
        cartRoot.innerHTML = '<div class="empty"><h2 style="font-family:var(--serif);margin-bottom:10px">Your bag is empty</h2><p>Find a shirt you love and it will show up here.</p><a class="btn btn-dark" href="shop.html">Shop shirts</a></div>';
        return;
      }
      var free = V.freeOver || 0, pct = free ? Math.min(100, Math.round(sub / free * 100)) : 0;
      cartRoot.innerHTML = '<div class="cart-grid"><div>' + items.map(function (i) {
        return '<div class="cart-row"><a href="' + i.p.url + '"><img src="' + i.p.img + '" alt="" width="96" height="120"></a><div><h3><a href="' + i.p.url + '">' + i.p.name + '</a></h3>' +
          '<div class="opts">Size ' + i.size + (i.color ? ' · ' + i.color : '') + '</div><div class="opts">' + fmt(unit(i.p)) + ' each</div><button class="rm" data-rm="' + i.idx + '">Remove</button></div>' +
          '<div class="qty" data-i="' + i.idx + '"><button type="button" data-d="-1" aria-label="Decrease">−</button><input value="' + i.qty + '" readonly aria-label="Quantity"><button type="button" data-d="1" aria-label="Increase">+</button></div>' +
          '<div class="cart-line">' + fmt(i.line) + '</div></div>';
      }).join('') + '</div><aside class="box summary"><h2>Order summary</h2><div class="sum-row"><span>Subtotal</span><strong>' + fmt(sub) + '</strong></div>' +
        '<div class="sum-row"><span>Delivery</span><span>Calculated at checkout</span></div>' +
        (free ? '<div class="free-bar"><i style="width:' + pct + '%"></i></div><p class="muted" style="font-size:14px;margin:0 0 14px">' + (sub >= free ? 'You get free delivery 🎉' : 'Add ' + fmt(free - sub) + ' more for free delivery') + '</p>' : '') +
        '<a class="btn btn-accent btn-block" href="checkout.html">Checkout</a><p class="center" style="margin:14px 0 0"><a class="link" href="shop.html">Continue shopping</a></p></aside></div>';
    };
    cartRoot.addEventListener('click', function (e) {
      var c = getCart(), rm = e.target.closest('[data-rm]'), d = e.target.closest('[data-d]');
      if (rm) { c.splice(+rm.dataset.rm, 1); saveCart(c); renderCart(); }
      if (d) { var i = +d.parentNode.dataset.i; c[i].qty = Math.max(1, Math.min(20, c[i].qty + (+d.dataset.d))); saveCart(c); renderCart(); }
    });
    renderCart();
  }

  /* ---------- checkout ---------- */
  var ckForm = $('#checkoutForm');
  if (ckForm) {
    var items = cartItems();
    var dsel = $('#district', ckForm);
    dsel.innerHTML = V.districts.map(function (d) { return '<option' + (d === 'Dhaka' ? ' selected' : '') + '>' + d + '</option>'; }).join('');
    var sub = items.reduce(function (a, i) { return a + i.line; }, 0);
    var drawSum = function () {
      var ship = shipping(dsel.value, sub);
      $('#sumItems').innerHTML = items.map(function (i) { return '<div class="sum-row"><span>' + i.p.name + ' <small class="muted">× ' + i.qty + ' · ' + i.size + '</small></span><span>' + fmt(i.line) + '</span></div>'; }).join('') || '<p class="muted">Your bag is empty. <a class="link" href="shop.html">Shop shirts</a></p>';
      $('#sumSub').textContent = fmt(sub); $('#sumShip').textContent = ship ? fmt(ship) : 'Free'; $('#sumTotal').textContent = fmt(sub + ship);
    };
    dsel.addEventListener('change', drawSum); drawSum();
    if (items.length) vt('InitiateCheckout', trackPayload(items));
    $$('input[name=pay]', ckForm).forEach(function (r) {
      r.addEventListener('change', function () {
        $$('.pay-note', ckForm).forEach(function (n) { n.classList.toggle('show', n.dataset.for === r.value); });
      });
    });
    ckForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!items.length) { toast('Your bag is empty.'); return; }
      var ph = $('[name=phone]', ckForm).value.replace(/[\s-]/g, '');
      if (!/^(\+?88)?01[3-9]\d{8}$/.test(ph)) { $('#phoneErr').hidden = false; $('[name=phone]', ckForm).focus(); return; }
      $('#phoneErr').hidden = true;
      var ship = shipping(dsel.value, sub), no = 'VL' + String(Date.now()).slice(-6);
      var order = { no: no, name: $('[name=name]', ckForm).value, phone: ph, district: dsel.value, address: $('[name=address]', ckForm).value,
        pay: $('input[name=pay]:checked', ckForm).value, sub: sub, ship: ship, total: sub + ship, date: new Date().toISOString(),
        items: items.map(function (i) { return { id: i.p.id, name: i.p.name, size: i.size, color: i.color, qty: i.qty, price: unit(i.p) }; }) };
      var orders = store.get('velora_orders', []); orders.unshift(order); store.set('velora_orders', orders);
      store.set('velora_cart', []);
      location.href = 'order-success.html?o=' + no;
    });
  }

  /* ---------- order success ---------- */
  var okRoot = $('#successRoot');
  if (okRoot) {
    var no = new URLSearchParams(location.search).get('o'), o = store.get('velora_orders', []).filter(function (x) { return x.no === no; })[0];
    if (!o) { okRoot.innerHTML = '<h1 style="font-family:var(--serif)">Order not found</h1><p class="muted">We could not find that order in this browser.</p><a class="btn btn-dark" href="shop.html">Shop shirts</a>'; }
    else {
      $('#okNo').textContent = o.no; $('#okTotal').textContent = fmt(o.total);
      $('#okPay').textContent = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', card: 'Card' }[o.pay] || o.pay;
      $('#okAddr').textContent = o.name + ', ' + o.address + ', ' + o.district + ' · ' + o.phone;
      $('#okTrack').href = 'track-order.html?o=' + o.no;
      if (!o.tracked) {
        vt('Purchase', { value: o.total, currency: 'BDT', ids: o.items.map(function (i) { return i.id; }), order_id: o.no,
          items: o.items.map(function (i) { return { id: i.id, name: i.name, price: i.price, qty: i.qty }; }) });
        var all = store.get('velora_orders', []); all.forEach(function (x) { if (x.no === o.no) x.tracked = true; }); store.set('velora_orders', all);
      }
    }
  }

  /* ---------- track order ---------- */
  var tf = $('#trackForm');
  if (tf) {
    var DEMO = { no: 'VL240107', stage: 3, courier: 'Pathao', cn: 'PA-8841203', events: [
      ['20 Nov, 10:42 am', 'Out for delivery — rider is on the way'], ['20 Nov, 07:15 am', 'Arrived at Dhaka delivery hub'],
      ['19 Nov, 09:30 pm', 'Picked up by Pathao'], ['19 Nov, 04:10 pm', 'Order packed and handed to courier'], ['19 Nov, 11:02 am', 'Order confirmed by our team']] };
    var show = function (no) {
      var res = $('#trackResult'), mine = store.get('velora_orders', []).filter(function (x) { return x.no.toLowerCase() === no.toLowerCase(); })[0];
      var d = no.toLowerCase() === DEMO.no.toLowerCase() ? DEMO : mine ? { no: mine.no, stage: 1, courier: 'Assigned soon', cn: '—', events: [[new Date(mine.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }), 'Order placed — waiting for confirmation']] } : null;
      if (!d) { res.innerHTML = '<div class="box"><h2>Order not found</h2><p class="muted">Check the order number. You can try the sample order <b>VL240107</b>.</p></div>'; return; }
      var names = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
      res.innerHTML = '<div class="box"><h2>Order ' + d.no + '</h2><p class="muted">Courier: ' + d.courier + ' · Tracking ID: ' + d.cn + '</p><div class="steps">' +
        names.map(function (n, i) { return '<div class="step ' + (i < d.stage ? 'done' : i === d.stage ? 'now' : '') + '"><i>' + (i < d.stage ? '✓' : i + 1) + '</i>' + n + '</div>'; }).join('') +
        '</div><ul class="timeline">' + d.events.map(function (e) { return '<li><time>' + e[0] + '</time><span>' + e[1] + '</span></li>'; }).join('') + '</ul></div>';
    };
    tf.addEventListener('submit', function (e) { e.preventDefault(); show($('[name=order]', tf).value.trim()); });
    var pre = new URLSearchParams(location.search).get('o'); if (pre) { $('[name=order]', tf).value = pre; show(pre); }
  }
})();
