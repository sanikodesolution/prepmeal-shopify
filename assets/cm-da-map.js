(function () {
  var COORDS = {
    hartland: [43.1051, -88.342],
    delafield: [43.0608, -88.4037],
    pewaukee: [43.0806, -88.2612],
    waukesha: [43.0117, -88.2315],
    sussex: [43.1336, -88.2223],
    merton: [43.1422, -88.3107],
    nashotah: [43.0961, -88.4018],
    'okauchee lake': [43.1136, -88.4401],
    oconomowoc: [43.1117, -88.4993],
    'oconomowoc lake': [43.0947, -88.4576],
    chenequa: [43.1236, -88.3815],
    lisbon: [43.155, -88.2501],
    lannon: [43.1492, -88.1626],
    'menomonee falls': [43.1789, -88.1173],
    'monomonee falls': [43.1789, -88.1173],
    brookfield: [43.0606, -88.1065],
    'elm grove': [43.0431, -88.0787],
    wales: [43.0042, -88.377],
    dousman: [43.0136, -88.4723],
    summit: [43.0578, -88.4612],
    'lake country': [43.08, -88.45],
    'stone bank': [43.1306, -88.4701],
    'north lake': [43.1503, -88.3712],
    mapleton: [43.068, -88.42],
    genesee: [42.9689, -88.3654],
    mukwonago: [42.8667, -88.3334]
  };
  var HUB = { lat: 43.1051, lng: -88.342, label: 'Chef Matt\'s Kitchen', sub: 'Hartland, WI' };
  var RADIUS_MI = 20;
  var BRAND = '#F7931E';
  var NAVY = '#0f1f3d';

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function loadTag(tag, attrs) {
    return new Promise(function (res, rej) {
      var el = document.createElement(tag);
      for (var k in attrs) el[k] = attrs[k];
      el.onload = res;
      el.onerror = rej;
      document.head.appendChild(el);
    });
  }
  function loadLeaflet() {
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (window.__cmDaLeaflet) return window.__cmDaLeaflet;
    window.__cmDaLeaflet = Promise.all([
      loadTag('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css' }),
      loadTag('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', async: true })
    ]).then(function () {
      if (!window.L) throw new Error('Leaflet missing');
      return window.L;
    }).catch(function (err) {
      window.__cmDaLeaflet = null;
      throw err;
    });
    return window.__cmDaLeaflet;
  }

  function pointsFor(el) {
    var node = el.parentElement && el.parentElement.querySelector('[data-da-points]');
    var names = [];
    try { names = JSON.parse(node ? node.textContent : '[]'); } catch (e) { names = []; }
    return names.map(function (item) {
      var pair = COORDS[norm(item.n)];
      return pair ? { n: item.n, lat: pair[0], lng: pair[1] } : null;
    }).filter(Boolean);
  }

  function draw(el) {
    if (!el || el._daMap) return;
    el._daMap = true;
    loadLeaflet().then(function (L) {
      el.innerHTML = '';
      var map = L.map(el, {
        center: [HUB.lat, HUB.lng],
        zoom: 10,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      var ring = L.circle([HUB.lat, HUB.lng], {
        radius: RADIUS_MI * 1609.34,
        color: BRAND,
        weight: 2,
        opacity: 0.75,
        fillColor: BRAND,
        fillOpacity: 0.08,
        interactive: false
      }).addTo(map);
      pointsFor(el).forEach(function (c) {
        L.circleMarker([c.lat, c.lng], {
          radius: 6,
          color: '#ffffff',
          weight: 1.5,
          fillColor: BRAND,
          fillOpacity: 0.95
        }).addTo(map)
          .bindTooltip(esc(c.n), { direction: 'top', offset: [0, -6] })
          .bindPopup('<b>' + esc(c.n) + '</b><br>We deliver here');
      });
      L.circleMarker([HUB.lat, HUB.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: NAVY,
        fillOpacity: 1
      }).addTo(map)
        .bindTooltip(esc(HUB.label), { direction: 'top', offset: [0, -9] })
        .bindPopup('<b>' + esc(HUB.label) + '</b><br>' + esc(HUB.sub));
      map.fitBounds(ring.getBounds(), { padding: [16, 16] });
      map.on('focus click', function () { map.scrollWheelZoom.enable(); });
      map.on('blur mouseout', function () { map.scrollWheelZoom.disable(); });
      setTimeout(function () { map.invalidateSize(); }, 300);
    }).catch(function () {
      el.innerHTML = '<div class="da__map-fallback">The map could not load.</div>';
      el._daMap = false;
    });
  }

  function boot() {
    document.querySelectorAll('[data-da-map]').forEach(function (el) {
      if (!('IntersectionObserver' in window)) { draw(el); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.disconnect();
          draw(el);
        });
      }, { rootMargin: '300px' });
      io.observe(el);
    });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('shopify:section:load', function () { setTimeout(boot, 60); });
})();
