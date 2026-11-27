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
      var lat = Number(item.lat) || (pair && pair[0]);
      var lng = Number(item.lng) || (pair && pair[1]);
      return lat && lng ? { n: item.n, lat: lat, lng: lng } : null;
    }).filter(Boolean);
  }

  function mapConfig(el) {
    var root = el.closest('.da');
    var lat = root && parseFloat(root.getAttribute('data-da-kitchen-lat'));
    var lng = root && parseFloat(root.getAttribute('data-da-kitchen-lng'));
    var radius = root && parseFloat(root.getAttribute('data-da-radius'));
    return {
      root: root,
      hub: {
        lat: isFinite(lat) ? lat : HUB.lat,
        lng: isFinite(lng) ? lng : HUB.lng,
        label: root && root.getAttribute('data-da-kitchen-label') || HUB.label,
        sub: root && root.getAttribute('data-da-kitchen-sub') || HUB.sub
      },
      radius: isFinite(radius) && radius > 0 ? radius : RADIUS_MI
    };
  }

  function draw(el) {
    if (!el || el._daMap) return;
    el._daMap = true;
    loadLeaflet().then(function (L) {
      el.innerHTML = '';
      var config = mapConfig(el);
      var hub = config.hub;
      var map = L.map(el, {
        center: [hub.lat, hub.lng],
        zoom: 10,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      var ring = L.circle([hub.lat, hub.lng], {
        radius: config.radius * 1609.34,
        color: BRAND,
        weight: 2,
        opacity: 0.75,
        fillColor: BRAND,
        fillOpacity: 0.08,
        interactive: false
      }).addTo(map);
      var marks = {};
      pointsFor(el).forEach(function (c) {
        marks[norm(c.n)] = L.circleMarker([c.lat, c.lng], {
          radius: 6,
          color: '#ffffff',
          weight: 1.5,
          fillColor: BRAND,
          fillOpacity: 0.95
        }).addTo(map)
          .bindTooltip(esc(c.n), { direction: 'top', offset: [0, -6] })
          .bindPopup('<b>' + esc(c.n) + '</b><br>We deliver here');
      });
      el._daState = { map: map, marks: marks };
      L.circleMarker([hub.lat, hub.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: NAVY,
        fillOpacity: 1
      }).addTo(map)
        .bindTooltip(esc(hub.label), { direction: 'top', offset: [0, -9] })
        .bindPopup('<b>' + esc(hub.label) + '</b><br>' + esc(hub.sub));
      map.fitBounds(ring.getBounds(), { padding: [16, 16] });
      map.on('focus click', function () { map.scrollWheelZoom.enable(); });
      map.on('blur mouseout', function () { map.scrollWheelZoom.disable(); });
      setTimeout(function () { map.invalidateSize(); }, 300);
      window.addEventListener('resize', function () { map.invalidateSize(); });
    }).catch(function () {
      var config = mapConfig(el);
      var error = config.root && config.root.getAttribute('data-da-map-error') || 'The delivery map could not load.';
      el.innerHTML = '<div class="da__map-fallback">' + esc(error) + '</div>';
      el._daMap = false;
    });
  }

  function miles(a, b) {
    var r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * 3958.8 * Math.asin(Math.sqrt(h));
  }
  function findPlace(q, places) {
    var k = norm(q);
    var dynamicKey = places.find(function (name) { return norm(name) === k; });
    if (dynamicKey) return norm(dynamicKey);
    dynamicKey = places.find(function (name) { return k && norm(name).indexOf(k) === 0; });
    if (dynamicKey) return norm(dynamicKey);
    return '';
  }
  function showResult(box, miss, html) {
    box.hidden = false;
    box.className = 'da__check-result' + (miss ? ' is-miss' : '');
    box.innerHTML = html;
  }
  function focusPlace(mapEl, key) {
    var state = mapEl && mapEl._daState;
    var mark = state && state.marks[key];
    if (!state || !mark) return;
    state.map.setView(mark.getLatLng(), 12, { animate: true });
    mark.openPopup();
  }
  function mapPlaces(block) {
    var node = block.parentElement && block.parentElement.querySelector('[data-da-points]');
    var names = [];
    try { names = JSON.parse(node ? node.textContent : '[]'); } catch (e) { names = []; }
    var seen = {};
    return names.map(function (item) { return (item.n || '').trim(); }).filter(function (name) {
      var k = norm(name);
      if (!k || seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }
  function bindCheck(block) {
    if (block._daCheck) return;
    var form = block.querySelector('[data-da-form]');
    var box = block.querySelector('[data-da-result]');
    var list = block.querySelector('[data-da-suggest]');
    var mapEl = block.parentElement && block.parentElement.querySelector('[data-da-map]');
    if (!form || !box || !list) return;
    block._daCheck = true;
    var input = form.querySelector('input');
    var btn = form.querySelector('button');
    var places = mapPlaces(block);
    var config = mapConfig(mapEl || block);
    var root = config.root || block.closest('.da');
    var hub = config.hub;
    var country = (root && root.getAttribute('data-da-country') || 'US').toLowerCase();
    var region = root && root.getAttribute('data-da-region') || hub.sub;
    var messages = {
      yes: root && root.getAttribute('data-da-msg-yes') || 'Yes, we deliver to {place}.',
      no: root && root.getAttribute('data-da-msg-no') || '{place} is outside our regular delivery area.',
      fail: root && root.getAttribute('data-da-msg-fail') || 'We could not find that address. Try a city we deliver to.'
    };
    var detail = root && root.getAttribute('data-da-msg-detail') || 'Your meals can be delivered to this area.';
    var checking = root && root.getAttribute('data-da-msg-checking') || 'Checking your address...';
    function message(template, place) { return esc(String(template).replace(/\{place\}/g, place)); }
    var active = -1;

    function hideList() {
      list.hidden = true;
      list.innerHTML = '';
      input.setAttribute('aria-expanded', 'false');
      active = -1;
    }
    function showList(items) {
      if (!items.length) { hideList(); return; }
      list.innerHTML = items.map(function (name) {
        return '<li><button type="button" role="option" data-place="' + esc(name) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' + esc(name) + '</button></li>';
      }).join('');
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      active = -1;
    }
    function matches(q) {
      var k = norm(q);
      if (!k) return places.slice();
      return places.filter(function (name) { return norm(name).indexOf(k) !== -1; });
    }
    function pick(name) {
      input.value = name;
      hideList();
      var key = findPlace(name, places);
      if (!key) return;
      showResult(box, false, '<strong>' + message(messages.yes, name) + '</strong>' + esc(detail));
      focusPlace(mapEl, key);
    }

    input.addEventListener('input', function () { showList(matches(input.value)); });
    input.addEventListener('focus', function () { showList(matches(input.value)); });
    input.addEventListener('keydown', function (e) {
      var options = list.querySelectorAll('button');
      if (e.key === 'Escape') { hideList(); return; }
      if (!options.length || list.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = e.key === 'ArrowDown' ? Math.min(active + 1, options.length - 1) : Math.max(active - 1, 0);
        options.forEach(function (opt, i) { opt.classList.toggle('is-active', i === active); });
        options[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        pick(options[active].getAttribute('data-place'));
      }
    });
    list.addEventListener('click', function (e) {
      var opt = e.target.closest('button');
      if (opt) pick(opt.getAttribute('data-place'));
    });
    document.addEventListener('click', function (e) {
      if (!form.contains(e.target)) hideList();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideList();
      var q = input.value.trim();
      if (!q) return;
      var key = findPlace(q, places);
      if (key) {
        var chosen = places.filter(function (name) { return norm(name) === key; })[0];
        var label = chosen || key.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        showResult(box, false, '<strong>' + message(messages.yes, label) + '</strong>' + esc(detail));
        focusPlace(mapEl, key);
        return;
      }
      btn.disabled = true;
      showResult(box, false, '<strong>' + esc(checking) + '</strong>');
      var query = region ? q + ', ' + region : q;
      var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1' + (country ? '&countrycodes=' + encodeURIComponent(country) : '') + '&q=' + encodeURIComponent(query);
      fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); }).then(function (rows) {
        var hit = rows && rows[0];
        if (!hit) {
          showResult(box, true, '<strong>' + message(messages.fail, q) + '</strong>');
          return;
        }
        var d = miles([hub.lat, hub.lng], [+hit.lat, +hit.lon]);
        if (d <= config.radius) {
          showResult(box, false, '<strong>' + message(messages.yes, q) + '</strong>About ' + d.toFixed(1) + ' miles from ' + esc(hub.label) + '.');
        } else {
          showResult(box, true, '<strong>' + esc(q) + ' is about ' + d.toFixed(1) + ' miles from ' + esc(hub.label) + '.</strong>' + message(messages.no, q));
        }
      }).catch(function () {
        showResult(box, true, '<strong>' + message(messages.fail, q) + '</strong>');
      }).then(function () { btn.disabled = false; });
    });
  }

  function boot() {
    document.querySelectorAll('[data-da-check]').forEach(bindCheck);
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
