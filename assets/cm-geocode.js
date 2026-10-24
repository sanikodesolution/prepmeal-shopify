/**
 * CM geocoder — turns a place name into latitude / longitude.
 *
 * Used by the delivery maps so a merchant can type "Hartland, WI" or
 * "Waukesha" instead of hunting for decimal coordinates. Two free,
 * key-less services are tried in order:
 *
 *   1. Photon (photon.komoot.io) — built for type-ahead, allows client use.
 *   2. Nominatim (nominatim.openstreetmap.org) — OpenStreetMap fallback.
 *
 * Results are cached in localStorage so a page view only pays for places it
 * has never seen, and repeat visits issue no network calls at all.
 *
 * Public API (window.CMGeocode):
 *   lookup(query, { bias, country }) -> Promise<{lat, lng, label} | null>
 *   lookupMany(queries)              -> Promise<Array<result|null>>
 *   has(query)                       -> Boolean
 *
 * Nothing here blocks rendering: callers await the promise and keep their
 * existing markup visible until a result arrives.
 */
(function () {
  'use strict';

  if (window.CMGeocode) return;

  var CACHE_KEY = 'cmgeo:v1';
  var COUNTRY_KEY = 'cmgeo:country:v1';
  var MAX_CACHE = 400;
  var TIMEOUT_MS = 8000;
  var MIN_GAP_MS = 180; // be polite to the free endpoints

  var cache = {};
  try {
    cache = JSON.parse(window.localStorage.getItem(CACHE_KEY) || '{}') || {};
  } catch (err) {
    cache = {};
  }

  var saveCache = function () {
    var keys = Object.keys(cache);
    // Oldest-first eviction keeps the store bounded without extra bookkeeping.
    while (keys.length > MAX_CACHE) {
      delete cache[keys.shift()];
    }
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      /* storage full or blocked — caching is optional */
    }
  };

  var normKey = function (value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  };

  var finite = function (n) {
    return typeof n === 'number' && isFinite(n);
  };

  var fetchJSON = function (url) {
    return new Promise(function (resolve, reject) {
      var controller = 'AbortController' in window ? new AbortController() : null;
      var timer = window.setTimeout(function () {
        if (controller) controller.abort();
        reject(new Error('timeout'));
      }, TIMEOUT_MS);

      window
        .fetch(url, {
          signal: controller ? controller.signal : undefined,
          headers: { Accept: 'application/json' },
          credentials: 'omit'
        })
        .then(function (response) {
          window.clearTimeout(timer);
          if (!response.ok) throw new Error('http ' + response.status);
          return response.json();
        })
        .then(resolve)
        .catch(function (err) {
          window.clearTimeout(timer);
          reject(err);
        });
    });
  };

  var fromPhoton = function (query, bias) {
    var url =
      'https://photon.komoot.io/api/?limit=1&q=' + encodeURIComponent(query);
    if (bias && finite(bias[0]) && finite(bias[1])) {
      url += '&lat=' + bias[0] + '&lon=' + bias[1];
    }

    return fetchJSON(url).then(function (data) {
      var feature = data && data.features && data.features[0];
      if (!feature || !feature.geometry) return null;

      var coords = feature.geometry.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return null;

      var lat = parseFloat(coords[1]);
      var lng = parseFloat(coords[0]);
      if (!finite(lat) || !finite(lng)) return null;

      var props = feature.properties || {};
      var label = [props.name, props.city, props.state, props.country]
        .filter(function (part) {
          return part && String(part).trim();
        })
        .join(', ');

      return { lat: lat, lng: lng, label: label || query };
    });
  };

  var fromNominatim = function (query) {
    return fetchJSON(
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
        encodeURIComponent(query)
    ).then(function (data) {
      var hit = Array.isArray(data) && data[0];
      if (!hit) return null;

      var lat = parseFloat(hit.lat);
      var lng = parseFloat(hit.lon);
      if (!finite(lat) || !finite(lng)) return null;

      return { lat: lat, lng: lng, label: hit.display_name || query };
    });
  };

  /* Requests are serialised so a 20-town list never bursts the endpoint. */
  var queue = Promise.resolve();
  var lastRun = 0;

  var throttle = function (task) {
    var run = queue.then(function () {
      var wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastRun));
      return new Promise(function (resolve) {
        window.setTimeout(resolve, wait);
      });
    });
    queue = run.then(
      function () {
        lastRun = Date.now();
        return task().catch(function () {
          return null;
        });
      },
      function () {
        return null;
      }
    );
    return queue;
  };

  var lookup = function (query, opts) {
    var text = String(query == null ? '' : query).trim();
    if (!text) return Promise.resolve(null);

    var key = normKey(text);
    if (cache[key]) return Promise.resolve(cache[key]);

    var bias = opts && opts.bias;
    var country = opts && opts.country;

    return throttle(function () {
      // A cache hit may have landed while this sat in the queue.
      if (cache[key]) return Promise.resolve(cache[key]);

      var primary = country ? text + ', ' + country : text;

      return fromPhoton(primary, bias)
        .catch(function () {
          return null;
        })
        .then(function (hit) {
          return hit || fromNominatim(primary).catch(function () {});
        })
        .then(function (hit) {
          if (!hit) return null;
          cache[key] = hit;
          if (country) {
            try {
              window.localStorage.setItem(COUNTRY_KEY, country);
            } catch (err) {
              /* ignore */
            }
          }
          saveCache();
          return hit;
        });
    });
  };

  var lookupMany = function (queries, opts) {
    return Promise.all(
      (queries || []).map(function (query) {
        return lookup(query, opts);
      })
    );
  };

  window.CMGeocode = {
    lookup: lookup,
    lookupMany: lookupMany,
    has: function (query) {
      return !!cache[normKey(query)];
    },
    normalise: normKey,
    rememberedCountry: function () {
      try {
        return window.localStorage.getItem(COUNTRY_KEY) || '';
      } catch (err) {
        return '';
      }
    }
  };
})();
