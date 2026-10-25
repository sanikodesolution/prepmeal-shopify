/**
 * Delivery area checker — Leaflet map, live town / ZIP search, town chips.
 *
 * Progressive: the markup is fully usable without this file (the towns are
 * listed server-side). Leaflet is only fetched once the section nears the
 * viewport, so pages that never scroll here pay nothing.
 */
(() => {
  const SEL = '[data-mpd]';
  const DEFAULTS = {
    dotZoom: 11,
    maxSettleZoom: 12
  };

  const setup = (root) => {
    const $ = (sel, ctx = root) => ctx.querySelector(sel);
    const $$ = (sel, ctx = root) => Array.from(ctx.querySelectorAll(sel));

    const readJSON = (sel, fallback) => {
      const node = $(sel);
      if (!node) return fallback;
      try {
        return JSON.parse(node.textContent);
      } catch (err) {
        return fallback;
      }
    };

    const towns = readJSON('[data-mpd-towns]', []).filter(
      (t) => t && typeof t.n === 'string' && t.n
    );
    const copy = readJSON('[data-mpd-copy]', {}) || {};

    // A section whose saved markup predates these keys still needs copy, so the
    // lookup answer is never an empty line.
    const copyDefaults = {
      lookupYes: '{place} is inside our delivery zone.',
      lookupNo: '{place} is about {distance} from our kitchen, outside our delivery zone.',
      lookupFail: 'We could not find "{query}". Try a town, a postcode or a nearby landmark.',
      lookupLoading: 'Looking up "{query}"…',
      lookupRow: 'Look up "{query}" on the map'
    };
    Object.keys(copyDefaults).forEach((key) => {
      if (!copy[key] || !String(copy[key]).trim()) copy[key] = copyDefaults[key];
    });

    const placeOf = (town) => town.q || town.n;

    // Towns listed without numbers are geocoded in the browser, so the merchant
    // can write "Waukesha" instead of hunting for decimal coordinates.
    let geocoder = window.CMGeocode || null;
    const country = root.dataset.country || '';
    const kitchenPlace = (root.dataset.kplace || '').trim();

    let KITCHEN = [parseFloat(root.dataset.klat) || 43.1051, parseFloat(root.dataset.klng) || -88.342];
    const declaredRadius = parseFloat(root.dataset.radius) || 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = $('[data-mpd-canvas]');
    const form = $('[data-mpd-form]');
    const input = form && form.querySelector('input');
    const result = $('[data-mpd-result]');
    const suggest = $('[data-mpd-suggest]');
    const chips = $$('.mpd__chip[data-mpd-i]');
    const resetBtn = $('[data-mpd-reset]');
    const moreBtn = $('[data-mpd-more]');
    const extras = $('[data-mpd-extras]');
    const suggestId = suggest ? suggest.id : 'mpd-list';

    if (!towns.length || !canvas || !form || !input) return;

    const hasCoords = (town) =>
      town && Number.isFinite(town.lat) && Number.isFinite(town.lng);

    /* Resolve any place name that arrived without numbers. Runs before the map
       is built, so markers always get real coordinates. Failures are silent:
       the town keeps working in search, it just gets no pin. */
    const waitForGeo = () => {
      if (window.CMGeocode) return Promise.resolve(window.CMGeocode);
      return new Promise((resolve) => {
        let tries = 0;
        const tick = window.setInterval(() => {
          if (window.CMGeocode || ++tries > 40) {
            window.clearInterval(tick);
            resolve(window.CMGeocode || null);
          }
        }, 100);
      });
    };

    const ensureCoords = () =>
      waitForGeo().then((api) => {
        geocoder = api;
        if (!geocoder) return;
        const jobs = [];

        if (kitchenPlace) {
          jobs.push(
            geocoder.lookup(kitchenPlace, { country, bias: KITCHEN }).then((hit) => {
              if (hit) KITCHEN = [hit.lat, hit.lng];
            })
          );
        }

        towns.forEach((town) => {
          if (hasCoords(town)) return;
          jobs.push(
            geocoder.lookup(placeOf(town), { country, bias: KITCHEN }).then((hit) => {
              if (!hit) return;
              town.lat = hit.lat;
              town.lng = hit.lng;
              town.resolved = true;
            })
          );
        });

        return Promise.all(jobs).catch(() => {});
      });

    let map = null;
    let zone = null;
    let zoneRadius = declaredRadius > 0 ? declaredRadius * 1000 : 0;
    let markers = [];
    let current = -1;
    let suggestIndex = -1;

    const esc = (value) =>
      String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c]));

    const fill = (template, token, value) => String(template || '').split(token).join(value);

    const norm = (value) =>
      String(value == null ? '' : value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    /* ---------------- distance helpers ---------------- */

    const metresBetween = (a, b) => {
      const R = 6371000;
      const rad = Math.PI / 180;
      const dLat = (b[0] - a[0]) * rad;
      const dLng = (b[1] - a[1]) * rad;
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    };

    // The circle is sized to just hold the farthest town, so the whole zone fits
    // inside the card with margin on every side.
    const autoRadius = () => {
      const farthest = towns.filter(hasCoords).reduce(
        (max, town) => Math.max(max, metresBetween(KITCHEN, [town.lat, town.lng])),
        0
      );
      return Math.max(6000, farthest + 2200);
    };

    /* ---------------- result copy ---------------- */

    const say = (kind, html) => {
      if (!result) return;
      result.className = `mpd__result ${kind} is-pop`;
      result.innerHTML = html;
      result.dataset.mpdShown = '1';
      // Restart the pop animation on repeated identical messages.
      void result.offsetWidth;
    };

    const clearResult = () => {
      if (!result) return;
      result.className = 'mpd__result';
      result.textContent = '';
      delete result.dataset.mpdShown;
    };

    /* ---------------- map ---------------- */

    const loadLeaflet = () => {
      if (window.L && window.L.map) return Promise.resolve(window.L);
      if (window.__mpdLeaflet) return window.__mpdLeaflet;

      const tag = (name, attrs) =>
        new Promise((resolve, reject) => {
          const el = document.createElement(name);
          Object.assign(el, attrs);
          el.onload = resolve;
          el.onerror = reject;
          document.head.appendChild(el);
        });

      window.__mpdLeaflet = Promise.all([
        tag('link', {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
        }),
        tag('script', {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
          async: true
        })
      ])
        .then(() => {
          if (!window.L) throw new Error('Leaflet missing');
          return window.L;
        })
        .catch((err) => {
          window.__mpdLeaflet = null;
          throw err;
        });

      return window.__mpdLeaflet;
    };

    const fitZone = (animate) => {
      if (!map || !zone) return;
      const bounds = zone.getBounds();
      // fitBounds would fill the card with the circle; step back so the
      // surrounding towns and roads stay visible around the zone.
      const zoomOut = 0.55;
      const target = Math.max(3, map.getBoundsZoom(bounds) - zoomOut);
      const center = bounds.getCenter();
      if (animate && !reduceMotion) map.flyTo(center, target, { duration: 0.7 });
      else map.setView(center, target);
    };

    const markActive = (index) => {
      markers.forEach((marker, i) => {
        if (!marker) return;
        const el = marker.getElement();
        const dot = el && el.firstElementChild;
        if (dot) dot.classList.toggle('is-active', i === index);
      });
      chips.forEach((chip) => {
        chip.setAttribute('aria-pressed', String(Number(chip.dataset.mpdI) === index));
      });
    };

    const select = (index, { fromChip = false, fly = true } = {}) => {
      const town = towns[index];
      if (!town) return;

      current = index;
      markActive(index);
      clearLook();
      if (fromChip) input.value = town.n;

      say('is-yes', `<b>${esc(fill(copy.yes, '{town}', town.n))}</b> ${esc(copy.yes2 || '')}`);

      if (map) {
        if (!hasCoords(town)) {
          fitZone(true);
          return;
        }
        const target = [town.lat, town.lng];
        const zoom = Math.max(map.getZoom(), DEFAULTS.dotZoom);
        if (fly && !reduceMotion) map.flyTo(target, zoom, { duration: 0.8 });
        else map.setView(target, zoom);
      }
    };

    const reset = () => {
      current = -1;
      markActive(-1);
      clearResult();
      clearLook();
      fitZone(true);
    };

    const build = () => {
      const L = window.L;
      if (map || !L) return;

      map = L.map(canvas, {
        center: KITCHEN,
        zoom: 10,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 140
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      zoneRadius = zoneRadius || autoRadius();

      zone = L.circle(KITCHEN, {
        radius: zoneRadius,
        color: '#f5a623',
        weight: 2,
        opacity: 0.9,
        dashArray: '7 7',
        fillColor: '#f5a623',
        fillOpacity: 0.08,
        interactive: false
      }).addTo(map);

      const hubIcon = L.divIcon({
        className: 'mpd__hub-wrap',
        html: '<div class="mpd__hub"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker(KITCHEN, { icon: hubIcon, keyboard: false, zIndexOffset: 1000 }).addTo(map);

      const dotIcon = L.divIcon({
        className: 'mpd__dot-wrap',
        html: '<div class="mpd__dot"></div>',
        iconSize: [13, 13],
        iconAnchor: [6.5, 6.5]
      });

      markers = towns.map((town, i) => {
        if (!hasCoords(town)) return null;
        const marker = L.marker([town.lat, town.lng], { icon: dotIcon, keyboard: false }).addTo(map);
        marker.bindTooltip(town.n, { direction: 'top', offset: [0, -8] });
        // pick() fills the field, hides the suggestions and selects the town.
        marker.on('click', () => pick(town.n));
        return marker;
      });

      map.on('click', () => map.scrollWheelZoom.enable());
      map.on('mouseout', () => map.scrollWheelZoom.disable());
      map.on('dragstart zoomstart', () => map.scrollWheelZoom.disable());

      map.invalidateSize();
      fitZone(false);
      if (current > -1) select(current, { fly: false });

      // Refit when the card resizes, unless the visitor has picked a town.
      let resizeTimer = 0;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          if (!map) return;
          map.invalidateSize();
          if (current === -1) fitZone(false);
        }, 160);
      };
      window.addEventListener('resize', onResize);
      if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(canvas);
      setTimeout(() => map && map.invalidateSize(), 250);
    };

    /* ---------------- search ---------------- */

    const zipOf = (town) => String(town.z || '');

    const search = (query) => {
      const q = norm(query);
      if (!q) return -1;

      // Exact town name first.
      let i = towns.findIndex((town) => norm(town.n) === q);
      if (i > -1) return i;

      // ZIP, exact then prefix (needs at least 3 digits).
      const digits = q.replace(/\D/g, '');
      if (digits.length >= 3) {
        i = towns.findIndex((town) =>
          zipOf(town)
            .split(',')
            .some((zip) => zip.trim().replace(/\D/g, '') === digits)
        );
        if (i > -1) return i;
        i = towns.findIndex((town) =>
          zipOf(town)
            .split(',')
            .some((zip) => zip.trim().replace(/\D/g, '').startsWith(digits))
        );
        if (i > -1) return i;
      }

      // Town name starts with the query, then contains it.
      i = towns.findIndex((town) => norm(town.n).startsWith(q));
      if (i > -1) return i;
      return towns.findIndex((town) => norm(town.n).includes(q));
    };

    const matches = (query, limit = 6) => {
      const q = norm(query);
      if (!q) return [];
      const digits = q.replace(/\D/g, '');

      return towns
        .map((town, i) => {
          const name = norm(town.n);
          const zips = zipOf(town)
            .split(',')
            .map((zip) => zip.trim().replace(/\D/g, ''));

          let score = -1;
          if (name === q) score = 0;
          else if (digits.length >= 3 && zips.includes(digits)) score = 1;
          else if (name.startsWith(q)) score = 2;
          else if (digits.length >= 3 && zips.some((zip) => zip.startsWith(digits))) score = 3;
          else if (name.includes(q)) score = 4;

          return score < 0 ? null : { i, score };
        })
        .filter(Boolean)
        .sort((a, b) => a.score - b.score || towns[a.i].n.localeCompare(towns[b.i].n))
        .slice(0, limit)
        .map((hit) => towns[hit.i]);
    };

    /* ---------------- suggestion list ---------------- */

    const hideSuggest = () => {
      if (!suggest) return;
      suggest.hidden = true;
      suggest.innerHTML = '';
      suggestIndex = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    };

    const highlight = (options) => {
      options.forEach((option, i) => option.classList.toggle('is-active', i === suggestIndex));
      if (suggestIndex > -1 && options[suggestIndex]) {
        const option = options[suggestIndex];
        option.scrollIntoView({ block: 'nearest' });
        const row = option.closest('[role="option"]');
        if (row && row.id) input.setAttribute('aria-activedescendant', row.id);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    };

    const showSuggest = (query) => {
      if (!suggest) return;
      const hits = matches(query);
      const text = query.trim();
      // A query that is not one of our towns still deserves an answer, so the
      // list ends with a "look this place up" row backed by the geocoder.
      const exact = hits.some((town) => norm(town.n) === norm(text));
      const wantLookup = text.length > 2 && !exact;

      if (!hits.length && !wantLookup) {
        hideSuggest();
        return;
      }

      const rows = hits.map(
        (town, i) =>
          `<li role="option" id="${suggestId}-${i}"><button type="button" data-mpd-town="${esc(town.n)}">` +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' +
          `${esc(town.n)}</button></li>`
      );

      if (wantLookup) {
        rows.push(
          `<li role="option" id="${suggestId}-look"><button type="button" class="mpd__suggest-look" data-mpd-lookup="${esc(text)}">` +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 2a9 9 0 1 0 5.6 16l4.2 4.2 1.4-1.4-4.2-4.2A9 9 0 0 0 11 2zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14z"/></svg>' +
            `${esc(fill(copy.lookupRow, '{query}', text))}</button></li>`
        );
      }

      suggest.innerHTML = rows.join('');

      suggest.hidden = false;
      suggestIndex = -1;
      input.removeAttribute('aria-activedescendant');
      input.setAttribute('aria-expanded', 'true');
    };

    /* ---------------- picking a town ---------------- */

    const pick = (name) => {
      input.value = name;
      hideSuggest();
      const index = search(name);
      if (index > -1) select(index, { fly: true });
    };

    /* ---------------- free place lookup ----------------
       A visitor is not limited to the towns the merchant listed: any town,
       postcode, street or landmark is geocoded and compared with the zone
       circle, so the map answers with a real position instead of a guess. */

    let lookMarker = null;
    let previewTimer = 0;
    let previewSeq = 0;

    const clearLook = () => {
      if (lookMarker && map) map.removeLayer(lookMarker);
      lookMarker = null;
    };

    // Debounced lookups mean one request per pause, not one per keystroke.
    const clearPending = () => {
      if (previewTimer) window.clearTimeout(previewTimer);
      previewTimer = 0;
      previewSeq += 1;
    };

    const km = (metres) => {
      const value = metres / 1000;
      return (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10) + ' km';
    };

    const zoneMetres = () => {
      if (zoneRadius > 0) return zoneRadius;
      return autoRadius();
    };

    // "Oconomowoc, Wisconsin, United States" is too wide for a small map pin,
    // so the tooltip keeps just the place and its region.
    const shortLabel = (label, fallback) => {
      const parts = String(label || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      return parts.length ? parts.slice(0, 2).join(', ') : fallback;
    };

    const plotLook = (hit) => {
      if (!map || !window.L) return;
      clearLook();
      const icon = window.L.divIcon({
        className: 'mpd__look-wrap',
        html: '<div class="mpd__look"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      lookMarker = window.L.marker([hit.lat, hit.lng], {
        icon,
        keyboard: false,
        zIndexOffset: 1200
      }).addTo(map);
      lookMarker.bindTooltip(esc(shortLabel(hit.label, input.value.trim())), {
        direction: 'top',
        offset: [0, -12],
        className: 'mpd__look-tip',
        permanent: true
      });
      const zoom = Math.max(map.getZoom(), DEFAULTS.dotZoom);
      if (!reduceMotion) map.flyTo([hit.lat, hit.lng], zoom, { duration: 0.8 });
      else map.setView([hit.lat, hit.lng], zoom);
    };

    const lookupPlace = (query, { preview = false } = {}) => {
      if (!geocoder) {
        if (!preview) say('is-no', esc(fill(copy.lookupFail, '{query}', query)));
        return;
      }

      if (!preview) {
        say('is-info', esc(fill(copy.lookupLoading, '{query}', query)));
        current = -1;
        markActive(-1);
      }

      const seq = ++previewSeq;

      geocoder
        .lookup(query, { country, bias: KITCHEN })
        .then((hit) => {
          // A newer keystroke or a changed field wins over this result.
          if (seq !== previewSeq) return;
          if (norm(input.value) !== norm(query)) return;

          if (!hit) {
            clearLook();
            if (!preview) say('is-no', esc(fill(copy.lookupFail, '{query}', query)));
            return;
          }

          const distance = metresBetween(KITCHEN, [hit.lat, hit.lng]);
          const inside = distance <= zoneMetres();

          plotLook(hit);
          if (preview) return;

          const place = hit.label || query;
          const template = inside ? copy.lookupYes : copy.lookupNo;
          const text = fill(fill(template, '{place}', place), '{distance}', km(distance));
          const link =
            copy.contact && copy.contactLabel
              ? ` <a href="${esc(copy.contact)}">${esc(copy.contactLabel)}</a>`
              : '';
          say(inside ? 'is-yes' : 'is-no', esc(text) + (inside ? '' : link));
        })
        .catch(() => {
          if (seq !== previewSeq) return;
          if (norm(input.value) !== norm(query)) return;
          if (!preview) say('is-no', esc(fill(copy.lookupFail, '{query}', query)));
        });
    };

    /* Typing pauses are a strong signal of intent, so after a moment of quiet
       the text is geocoded and previewed. Nothing is announced until submit. */
    const queuePreview = (query) => {
      clearPending();
      if (!geocoder || query.length < 3) return;

      previewTimer = window.setTimeout(() => {
        previewTimer = 0;
        if (norm(input.value) !== norm(query)) return;
        lookupPlace(query, { preview: true });
      }, 650);
    };

    /* ---------------- events ---------------- */

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      hideSuggest();
      clearPending();

      const query = input.value.trim();
      if (!query) {
        reset();
        return;
      }

      const index = search(query);
      if (index > -1) {
        clearLook();
        select(index, { fly: true });
        return;
      }

      // Not one of the listed towns: geocode the text and answer from the map.
      lookupPlace(query);
    });

    input.addEventListener('input', () => {
      const query = input.value.trim();
      if (!query) {
        hideSuggest();
        clearPending();
        if (current > -1 || result.hasAttribute('data-mpd-shown')) reset();
        return;
      }

      showSuggest(query);

      // A previous confirmation no longer describes what is in the field.
      const picked = current > -1 && norm(towns[current].n) === norm(query);
      if (!picked) {
        current = -1;
        markActive(-1);
        clearResult();
      }

      // Move the map to the best match while typing, without announcing success.
      const hit = search(query);
      if (hit > -1) {
        const town = towns[hit];
        if (hasCoords(town) && map) {
          const zoom = Math.max(map.getZoom(), DEFAULTS.dotZoom);
          map.setView([town.lat, town.lng], Math.min(zoom, DEFAULTS.maxSettleZoom));
        }
        clearPending();
        return;
      }

      // No listed town matches: once typing settles, geocode the text and drop
      // a preview pin, so the map places itself without a submit.
      queuePreview(query);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim()) showSuggest(input.value.trim());
    });

    input.addEventListener('keydown', (event) => {
      const options = suggest ? Array.from(suggest.querySelectorAll('button')) : [];

      if (event.key === 'Escape') {
        hideSuggest();
        return;
      }
      if (!options.length || !suggest || suggest.hidden) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        suggestIndex =
          event.key === 'ArrowDown'
            ? Math.min(suggestIndex + 1, options.length - 1)
            : Math.max(suggestIndex - 1, 0);
        highlight(options);

        // The map follows the highlighted suggestion.
        const name = options[suggestIndex].getAttribute('data-mpd-town');
        const index = name == null ? -1 : search(name);
        if (index > -1 && map) {
          const town = towns[index];
          map.setView([town.lat, town.lng], Math.max(map.getZoom(), DEFAULTS.dotZoom), {
            animate: !reduceMotion
          });
        }
      } else if (event.key === 'Enter' && suggestIndex > -1) {
        event.preventDefault();
        const chosen = options[suggestIndex];
        const look = chosen.getAttribute('data-mpd-lookup');
        if (look != null) {
          input.value = look;
          hideSuggest();
          lookupPlace(look);
        } else {
          pick(chosen.getAttribute('data-mpd-town'));
        }
      }
    });

    if (suggest) {
      suggest.addEventListener('click', (event) => {
        const look = event.target.closest('button[data-mpd-lookup]');
        if (look) {
          const query = look.getAttribute('data-mpd-lookup');
          input.value = query;
          hideSuggest();
          lookupPlace(query);
          return;
        }
        const option = event.target.closest('button[data-mpd-town]');
        if (option) pick(option.getAttribute('data-mpd-town'));
      });
    }

    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) hideSuggest();
    });

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const index = Number(chip.dataset.mpdI);
        if (Number.isFinite(index)) select(index, { fromChip: true, fly: true });
      });
    });

    if (resetBtn) resetBtn.addEventListener('click', reset);

    /* ---------------- "Show all" accordion ---------------- */

    if (moreBtn && extras) {
      moreBtn.addEventListener('click', () => {
        const open = !extras.classList.contains('is-open');
        extras.classList.toggle('is-open', open);
        moreBtn.setAttribute('aria-expanded', String(open));

        const label = moreBtn.querySelector('[data-mpd-more-label]');
        if (label) {
          label.textContent = open ? moreBtn.dataset.moreLess : moreBtn.dataset.moreAll;
        }
        extras.setAttribute('aria-hidden', String(!open));
      });
    }

    /* ---------------- boot ---------------- */

    const boot = () => {
      ensureCoords().then(() => {
        loadLeaflet().then(build).catch(() => {
          canvas.innerHTML = '<div class="mpd__map-fallback">The delivery map could not load.</div>';
        });
      });
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          io.disconnect();
          boot();
        },
        { rootMargin: '350px' }
      );
      io.observe(canvas);
    } else {
      boot();
    }
  };

  /* ---------------- mount ---------------- */

  const mount = (scope) => {
    scope.querySelectorAll(SEL).forEach((node) => {
      if (node.dataset.mpdReady === '1') return;
      node.dataset.mpdReady = '1';
      setup(node);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mount(document));
  } else {
    mount(document);
  }

  // Theme editor: a re-rendered section arrives as a fresh, unmounted node.
  document.addEventListener('shopify:section:load', (event) => mount(event.target));
})();
