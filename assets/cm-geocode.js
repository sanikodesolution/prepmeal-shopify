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

  /* Photon returns its own ranking, which favours fuzzy text matches over the
     place the visitor actually means. Asking for a handful and picking with
     the scoring below gives far steadier answers, especially for street
     addresses and for town names that repeat across states. */
  var roughKm = function (a, b) {
    var R = 6371;
    var rad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * rad;
    var dLng = (b[1] - a[1]) * rad;
    var h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  /* A visitor typing a place almost always means a town, a postcode or a
     street address — not the restaurant, church or consulate that happens to
     share the name. These buckets encode that expectation.
     Nominatim labels a city "administrative" and a little else, so its
     vocabulary has to be included or every city lands in the fallback bucket. */
  var PLACE_TYPES = {
    city: 0, town: 0, village: 0, municipality: 0, borough: 0, administrative: 0,
    hamlet: 1, locality: 1, suburb: 1, district: 1, postcode: 1, postal_code: 1,
    neighbourhood: 1, quarter: 1,
    county: 2, state_district: 2,
    state: 3, region: 3, country: 3
  };
  var ADDRESS_TYPES = {
    house: 0, building: 1, street: 1, road: 1, address: 0, residential: 2
  };
  var POI_TYPES = {
    amenity: 6, shop: 6, tourism: 6, leisure: 6, office: 6, historic: 5,
    man_made: 5, highway: 4, waterway: 6, natural: 6, landuse: 4, barrier: 6
  };

  /* A street address is recognised by a street-type word ("… Rd", "… Street")
     or a leading house number. A bare postcode must not qualify — "Hartland,
     WI 53029" is a town plus a ZIP, not an address, and treating it as one
     made the confident town match get rejected. */
  var STREET_WORD =
    /\b(rd|road|st|street|ave|avenue|dr|drive|ln|lane|ct|court|blvd|way|pl|place|ter|terrace|cir|circle|pkwy|parkway|hwy|highway|trl|trail|sq|square|loop|cv|cove|pt|point|row|alley|fwy|freeway)\b/i;
  var HOUSE_NUMBER = /^\s*\d+[a-z]?\s+[a-z]|\b[nsew]\d+[nsew]\d+\b/i;

  var looksLikeAddress = function (text) {
    var value = String(text || '');
    if (STREET_WORD.test(value)) return true;
    return HOUSE_NUMBER.test(value);
  };

  /* Does the text already name its own region? A comma-separated tail
     ("Toronto, Ontario", "Hartland, WI 53029", "12 Main St, Hartland") or a
     country / state / postcode token both count. A bare "Hartland" does not,
     and only that kind should receive the country hint. */
  var REGION_HINT =
    /\b(usa|u\.s\.a|united states|uk|united kingdom|canada|australia|ireland|zealand|germany|france|india|bangladesh|pakistan|singapore|malaysia|dubai|uae|ontario|quebec|alberta|columbia|england|scotland|wales)\b|\b(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)\b|\b\d{4,6}\b/i;

  var namesRegion = function (text) {
    var value = String(text || '');
    if (REGION_HINT.test(value)) return true;
    // "Something, Something" reads as place + region, not a bare name.
    return value.split(',').length > 1;
  };

  var kindRank = function (type, addressQuery) {
    var key = normKey(type);
    var place = PLACE_TYPES[key];
    var addr = ADDRESS_TYPES[key];
    var poi = POI_TYPES[key];

    if (addressQuery) {
      if (addr != null) return addr;
      if (place != null) return 3;
      return poi != null ? poi : 4;
    }

    if (place != null) return place;
    if (addr != null) return 3;
    return poi != null ? poi : 4;
  };

  /* Shared picker. Lower score wins: an exact name match outweighs a close
     but wrong kind, and kind outweighs distance, so "Pewaukee" resolves to the
     city even when a Pewaukee shop sits nearer to the kitchen. */
  var pickBest = function (candidates, query, bias) {
    if (!candidates.length) return null;

    var head = String(query).split(',')[0];
    var wanted = normKey(head);
    var addressQuery = looksLikeAddress(query);
    var digits = String(query).replace(/\D/g, '');

    candidates.forEach(function (item) {
      var names = item.names || [];
      var exact = 0;
      names.forEach(function (value) {
        var key = normKey(value);
        if (!key) return;
        if (key === wanted) exact = 1;
      });

      // A postcode typed on its own should match a candidate tagged with it.
      if (!exact && digits.length >= 4) {
        names.forEach(function (value) {
          var key = String(value || '').replace(/\D/g, '');
          if (key && key.indexOf(digits) > -1) exact = 1;
        });
      }

      var away = 0;
      if (bias && finite(bias[0]) && finite(bias[1])) {
        away = roughKm(bias, [item.lat, item.lng]);
      }

      item.exact = exact;
      item.kind = kindRank(item.type, addressQuery);
      item.away = away;
      item.score = item.kind * 100 - exact * 60 + Math.min(away, 45);
    });

    candidates.sort(function (a, b) {
      return a.score - b.score;
    });

    var best = candidates[0];

    /* Someone typed a full street address. Returning the town that shares its
       street name would be actively misleading ("your address is 12 km away"
       when it is next door), so a weaker match is reported as no answer and
       the visitor is asked to refine instead. */
    if (addressQuery && best.kind > 1) return null;

    return {
      lat: best.lat,
      lng: best.lng,
      label: best.label || query,
      kind: best.kind,
      // Distance from the bias point, so callers can sanity-check the answer.
      away: best.away,
      // True when nothing better than a landmark came back, so the caller can
      // ask the second service before settling for it.
      weak: best.kind >= 4
    };
  };

  var joinLabel = function (parts) {
    return parts
      .filter(function (part) {
        return part && String(part).trim();
      })
      .map(function (part) {
        return String(part).trim();
      })
      .join(', ');
  };

  var fromPhoton = function (query, bias) {
    var url =
      'https://photon.komoot.io/api/?limit=8&q=' + encodeURIComponent(query);
    if (bias && finite(bias[0]) && finite(bias[1])) {
      url += '&lat=' + bias[0] + '&lon=' + bias[1];
    }

    return fetchJSON(url).then(function (data) {
      var features = (data && data.features) || [];
      var candidates = [];

      features.forEach(function (feature) {
        if (!feature || !feature.geometry) return;

        var coords = feature.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return;

        var lat = parseFloat(coords[1]);
        var lng = parseFloat(coords[0]);
        if (!finite(lat) || !finite(lng)) return;

        var props = feature.properties || {};
        var label = joinLabel([
          props.housenumber ? props.name : '',
          !props.housenumber ? props.name : '',
          props.street,
          props.city,
          props.state,
          props.postcode,
          props.country
        ]);

        candidates.push({
          lat: lat,
          lng: lng,
          label: label || query,
          type: props.osm_value || props.type,
          names: [props.name, props.city, props.district, props.locality, props.county, props.postcode, props.street]
        });
      });

      return pickBest(candidates, query, bias);
    });
  };

  /* Nominatim accepts ISO codes for a hard country filter. Mapping the common
     country names keeps the schema field human ("United States") while the
     request stays precise. */
  var COUNTRY_CODES = {
    'united states': 'us', 'united states of america': 'us', usa: 'us', us: 'us',
    'united kingdom': 'gb', uk: 'gb', gb: 'gb', england: 'gb', scotland: 'gb', wales: 'gb',
    canada: 'ca', australia: 'au', ireland: 'ie', 'new zealand': 'nz',
    germany: 'de', france: 'fr', spain: 'es', italy: 'it', netherlands: 'nl',
    india: 'in', bangladesh: 'bd', pakistan: 'pk', singapore: 'sg', malaysia: 'my',
    uae: 'ae', 'united arab emirates': 'ae', 'saudi arabia': 'sa'
  };

  var countryCode = function (name) {
    return COUNTRY_CODES[normKey(name)] || '';
  };

  var fromNominatim = function (query, bias, country) {
    var url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&q=' +
      encodeURIComponent(query);

    /* A country filter is far safer than a viewbox: a viewbox re-ranked a
       search towards a local street and hid the actual city, while the filter
       only removes other countries. Distance is judged separately by the
       caller, so a genuinely distant answer can still be reported. */
    var code = countryCode(country);
    if (code) url += '&countrycodes=' + code;

    return fetchJSON(url).then(function (data) {
      var hits = Array.isArray(data) ? data : [];
      var candidates = [];

      hits.forEach(function (hit) {
        var lat = parseFloat(hit.lat);
        var lng = parseFloat(hit.lon);
        if (!finite(lat) || !finite(lng)) return;

        var addr = hit.address || {};
        candidates.push({
          lat: lat,
          lng: lng,
          label: hit.display_name || query,
          type: hit.type || hit.class,
          names: [
            hit.name,
            addr.city,
            addr.town,
            addr.village,
            addr.municipality,
            addr.suburb,
            addr.county,
            addr.postcode,
            addr.house_number ? addr.road : ''
          ]
        });
      });

      return pickBest(candidates, query, bias);
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

      /* The country hint should narrow a search the visitor left open, never
         override a region they named themselves. "Hartland" alone is ambiguous
         worldwide, so it is searched inside the configured country first;
         "Toronto, Ontario" already names its region, so the hint only becomes a
         fallback there. Distance is still judged by the caller, so a place
         genuinely far from the kitchen is reported as outside the zone rather
         than silently replaced. */
      var ownRegion = namesRegion(text);
      var hinted = country && !ownRegion ? text + ', ' + country : text;
      var attempts = hinted === text ? [text] : [text, hinted];
      if (hinted !== text) attempts.reverse();

      var run = function (index) {
        var query = attempts[index];
        return fromPhoton(query, bias)
          .catch(function () {
            return null;
          })
          .then(function (hit) {
            /* A weak first answer (a landmark that shares the name) is worth
               retrying against the other service before settling, because
               Photon's top results can omit the town entirely. */
            if (hit && !hit.weak) return hit;
            return fromNominatim(query, bias, ownRegion ? '' : country)
              .catch(function () {
                return null;
              })
              .then(function (second) {
                if (!second) return hit;
                if (!hit) return second;
                return second.kind <= hit.kind ? second : hit;
              });
          })
          .then(function (hit) {
            if (!hit && index + 1 < attempts.length) return run(index + 1);

            /* The text found a real place but it sits hundreds of kilometres
               from the kitchen while the visitor named no region of their own.
               That is the classic wrong-continent match, so the other spelling
               gets a turn and the closer of the two answers wins. */
            if (
              hit &&
              attempts.length > 1 &&
              !ownRegion &&
              finite(bias && bias[0]) &&
              hit.away != null &&
              hit.away > 400 &&
              index + 1 < attempts.length
            ) {
              return run(index + 1).then(function (retry) {
                if (!retry) return hit;
                if (retry.away == null) return retry;
                return retry.away < hit.away ? retry : hit;
              });
            }

            return hit;
          });
      };

      return run(0).then(function (hit) {
        if (!hit) return null;
        // Weak fields are internal scoring detail; callers only need the point.
        var stored = { lat: hit.lat, lng: hit.lng, label: hit.label };
        cache[key] = stored;
        if (country) {
          try {
            window.localStorage.setItem(COUNTRY_KEY, country);
          } catch (err) {
            /* ignore */
          }
        }
        saveCache();
        return stored;
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
