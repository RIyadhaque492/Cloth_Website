/*
 * Velora tracking — paste your IDs below, save, push to GitHub. That's it.
 * Leave a value empty ('' or []) to switch that platform off.
 * Later, the admin panel's "Pixels & Tracking" page will write these values for you.
 */
window.VELORA_TRACKING = {
  fbPixelIds: [],          // e.g. ['221292732077953', '423399810454531']
  ga4: '',                 // e.g. 'G-XXXXXXXXXX'
  gtm: '',                 // e.g. 'GTM-XXXXXXX'
  tiktok: '',              // e.g. 'C1234567890ABCDEF'
  currency: 'BDT',
  events: { ViewContent: true, AddToCart: true, InitiateCheckout: true, Purchase: true, Search: true }
};

(function () {
  'use strict';
  var C = window.VELORA_TRACKING, d = document;
  var on = C.fbPixelIds.length || C.ga4 || C.gtm || C.tiktok;
  function load(src, async) { var s = d.createElement('script'); s.async = async !== false; s.src = src; d.head.appendChild(s); }

  if (C.gtm) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    load('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(C.gtm));
  }
  if (C.ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', C.ga4);
    load('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.ga4));
  }
  if (C.fbPixelIds.length) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, d, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    C.fbPixelIds.forEach(function (id) { fbq('init', id); });
    fbq('track', 'PageView');
  }
  if (C.tiktok) {
    (function (w, D, t) {
      w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.load = function (e) { var s = D.createElement('script'); s.async = !0; s.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + e + '&lib=' + t; D.head.appendChild(s); };
      ttq.load(C.tiktok); ttq.page();
    })(window, d, 'ttq');
  }

  /* One generic event → each platform's own format. */
  window.vtrack = function (name, p) {
    p = p || {};
    if (!on || (C.events && C.events[name] === false)) return;
    var cur = p.currency || C.currency, val = p.value || 0, items = p.items || [];
    try {
      if (window.fbq) {
        var fp = name === 'Search' ? { search_string: p.search || '' } : {
          content_ids: p.ids || [], content_type: 'product', value: val, currency: cur,
          contents: items.map(function (i) { return { id: i.id, quantity: i.qty }; })
        };
        if (name === 'Purchase' || name === 'InitiateCheckout') fp.num_items = items.reduce(function (a, i) { return a + i.qty; }, 0);
        fbq('track', name, fp, p.order_id ? { eventID: 'order-' + p.order_id } : undefined);
      }
      var g = { ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout', Purchase: 'purchase', Search: 'search' }[name];
      var gp = name === 'Search' ? { search_term: p.search || '' } : {
        currency: cur, value: val,
        items: items.map(function (i) { return { item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty }; })
      };
      if (name === 'Purchase') gp.transaction_id = p.order_id;
      if (window.gtag && g) gtag('event', g, gp);
      if (C.gtm && window.dataLayer && g) { dataLayer.push({ ecommerce: null }); dataLayer.push({ event: g, ecommerce: gp }); }
      if (window.ttq) {
        var t = { ViewContent: 'ViewContent', AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout', Purchase: 'CompletePayment', Search: 'Search' }[name];
        ttq.track(t, name === 'Search' ? { query: p.search || '' } : {
          content_type: 'product', value: val, currency: cur,
          contents: items.map(function (i) { return { content_id: i.id, content_name: i.name, quantity: i.qty, price: i.price }; })
        });
      }
    } catch (e) { if (window.console) console.warn('vtrack', e); }
  };
})();
