(function () {
  'use strict';

  var GOOGLE_FONTS = {
    Inter: 'Inter:wght@400;500;600;700;800',
    Montserrat: 'Montserrat:wght@400;500;600;700;800',
    Roboto: 'Roboto:wght@400;500;700;900',
    'Open Sans': 'Open+Sans:wght@400;500;600;700;800',
    Lato: 'Lato:wght@400;700;900',
    Nunito: 'Nunito:wght@400;500;600;700;800',
    Raleway: 'Raleway:wght@400;500;600;700;800',
    Oswald: 'Oswald:wght@400;500;600;700',
    'DM Sans': 'DM+Sans:wght@400;500;600;700',
    'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700',
    'Playfair Display': 'Playfair+Display:wght@400;500;600;700;800',
    Merriweather: 'Merriweather:wght@400;700;900',
    'Libre Baskerville': 'Libre+Baskerville:wght@400;700'
  };

  var LOCAL_FONTS = {
    'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    Georgia: 'Georgia, "Times New Roman", serif',
    Arial: 'Arial, Helvetica, sans-serif'
  };

  var DEFAULTS = {
    gift: 'Gift',
    card: 'Card',
    brand: 'MEALS',
    subtitle: 'FRESH MEAL PREP',
    badge: 'CM',
    note: 'Redeemable on any meal plan',
    fontFamily: 'theme',
    weightHead: '700',
    weightBody: '400',
    giftSize: 84,
    cardSize: 62,
    brandSize: 15,
    subSize: 14,
    badgeSize: 22,
    noteSize: 14,
    tracking: -2,
    cardWidth: 560,
    cardBg: '#FFFDF6',
    sectionBg: '#E6E6E3',
    textMain: '#14213D',
    textAccent: '#F5A623',
    ribbon: '#14213D',
    bow: '#F5A623',
    tilt: -7,
    showRibbon: true,
    transparentBg: false
  };

  function clampSize(n) {
    return Math.max(14, Number(n) || 14);
  }

  function escapeXml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function ensureGoogleFont(name) {
    if (!GOOGLE_FONTS[name]) return;
    var id = 'gce-gf-' + name.replace(/\s+/g, '-').toLowerCase();
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + GOOGLE_FONTS[name] + '&display=swap';
    document.head.appendChild(link);
  }

  function resolveFont(key, root) {
    if (!key || key === 'theme') {
      return (
        (root && root.getAttribute('data-gce-theme-heading')) ||
        'var(--gce-font-heading), sans-serif'
      );
    }
    if (LOCAL_FONTS[key]) return LOCAL_FONTS[key];
    if (GOOGLE_FONTS[key]) {
      ensureGoogleFont(key);
      return '"' + key + '", sans-serif';
    }
    return key + ', sans-serif';
  }

  function buildSvg(state, fontCss) {
    var showLogo = !!state.logoData;
    var bg = state.transparentBg ? 'none' : state.sectionBg;
    var gift = escapeXml(state.gift);
    var card = escapeXml(state.card);
    var brand = escapeXml(state.brand);
    var sub = escapeXml(state.subtitle);
    var badge = escapeXml(state.badge);
    var note = escapeXml(state.note);
    var gs = clampSize(state.giftSize);
    var cs = clampSize(state.cardSize);
    var bs = clampSize(state.brandSize);
    var ss = clampSize(state.subSize);
    var bgs = clampSize(state.badgeSize);
    var ns = clampSize(state.noteSize);
    var track = Number(state.tracking) || 0;
    var wh = state.weightHead || '700';
    var wb = state.weightBody || '400';
    var tilt = Number(state.tilt) || 0;

    var ribbon = '';
    if (state.showRibbon) {
      ribbon =
        '<g transform="translate(560 40)">' +
        '<path d="M40 0 L120 80 L100 100 L20 20 Z" fill="' +
        state.ribbon +
        '"/>' +
        '<path d="M100 100 L80 120 L0 40 L20 20 Z" fill="' +
        state.ribbon +
        '" opacity="0.85"/>' +
        '<g transform="translate(70 70)">' +
        '<ellipse cx="-18" cy="0" rx="22" ry="14" fill="' +
        state.bow +
        '"/>' +
        '<ellipse cx="18" cy="0" rx="22" ry="14" fill="' +
        state.bow +
        '"/>' +
        '<circle cx="0" cy="0" r="10" fill="' +
        state.bow +
        '"/>' +
        '<path d="M-4 8 Q-12 36 -20 48" stroke="' +
        state.bow +
        '" stroke-width="8" fill="none" stroke-linecap="round"/>' +
        '<path d="M4 8 Q12 36 20 48" stroke="' +
        state.bow +
        '" stroke-width="8" fill="none" stroke-linecap="round"/>' +
        '</g></g>';
    }

    var brandBlock = '';
    if (showLogo) {
      brandBlock =
        '<image href="' +
        state.logoData +
        '" x="72" y="72" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>';
    } else {
      brandBlock =
        '<g transform="translate(72 72)">' +
        '<circle cx="42" cy="42" r="42" fill="' +
        state.textMain +
        '"/>' +
        '<text x="42" y="50" text-anchor="middle" fill="#fff" font-family="' +
        fontCss +
        '" font-size="' +
        bgs +
        '" font-weight="' +
        wh +
        '">' +
        badge +
        '</text>' +
        '<text x="108" y="38" fill="' +
        state.textMain +
        '" font-family="' +
        fontCss +
        '" font-size="' +
        bs +
        '" font-weight="' +
        wh +
        '" letter-spacing="2">' +
        brand +
        '</text>' +
        '<text x="108" y="62" fill="' +
        state.textMain +
        '" font-family="' +
        fontCss +
        '" font-size="' +
        ss +
        '" font-weight="' +
        wb +
        '" letter-spacing="1.5" opacity="0.75">' +
        sub +
        '</text></g>';
    }

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="680" viewBox="0 0 800 680">' +
      '<rect width="800" height="680" fill="' +
      bg +
      '"/>' +
      '<g transform="translate(400 340) rotate(' +
      tilt +
      ') translate(-320 -220)">' +
      '<rect x="0" y="0" width="640" height="440" rx="28" fill="' +
      state.cardBg +
      '" stroke="rgba(20,33,61,0.08)" stroke-width="2"/>' +
      '<rect x="18" y="18" width="604" height="404" rx="18" fill="none" stroke="rgba(20,33,61,0.06)" stroke-width="1"/>' +
      brandBlock +
      ribbon +
      '<text x="72" y="280" fill="' +
      state.textMain +
      '" font-family="' +
      fontCss +
      '" font-size="' +
      gs +
      '" font-weight="' +
      wh +
      '" letter-spacing="' +
      track +
      '">' +
      gift +
      '</text>' +
      '<text x="72" y="360" fill="' +
      state.textAccent +
      '" font-family="' +
      fontCss +
      '" font-size="' +
      cs +
      '" font-weight="' +
      wh +
      '" letter-spacing="' +
      track +
      '">' +
      card +
      '</text>' +
      '<text x="72" y="410" fill="' +
      state.textMain +
      '" font-family="' +
      fontCss +
      '" font-size="' +
      ns +
      '" font-weight="' +
      wb +
      '" opacity="0.7">' +
      note +
      '</text></g></svg>'
    );
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function init(root) {
    var svgEl = root.querySelector('[data-gce-svg]');
    var stage = root.querySelector('[data-gce-stage]');
    if (!svgEl || !stage) return;

    var state = Object.assign({}, DEFAULTS, { logoData: null, logoName: '' });

    function readFields() {
      root.querySelectorAll('[data-gce-field]').forEach(function (el) {
        var key = el.getAttribute('data-gce-field');
        if (key === 'logo') return;
        if (el.type === 'checkbox') {
          state[key] = el.checked;
        } else if (el.type === 'range' || el.type === 'number') {
          state[key] = Number(el.value);
        } else {
          state[key] = el.value;
        }
      });
    }

    function updateVals() {
      var map = {
        giftSize: clampSize(state.giftSize) + 'px',
        cardSize: clampSize(state.cardSize) + 'px',
        brandSize: clampSize(state.brandSize) + 'px',
        subSize: clampSize(state.subSize) + 'px',
        badgeSize: clampSize(state.badgeSize) + 'px',
        noteSize: clampSize(state.noteSize) + 'px',
        tracking: String(state.tracking),
        cardWidth: state.cardWidth + 'px',
        tilt: state.tilt + '°'
      };
      Object.keys(map).forEach(function (k) {
        var el = root.querySelector('[data-gce-val="' + k + '"]');
        if (el) el.textContent = map[k];
      });
    }

    function render() {
      readFields();
      updateVals();
      var fontCss = resolveFont(state.fontFamily, root);
      stage.style.maxWidth = state.cardWidth + 'px';
      svgEl.outerHTML = buildSvg(state, fontCss);
      svgEl = root.querySelector('[data-gce-svg]');
      svgEl.setAttribute('data-gce-svg', '');
      svgEl.classList.add('gce__svg');
    }

    root.addEventListener('input', function (e) {
      if (e.target && e.target.matches('[data-gce-field]')) render();
    });
    root.addEventListener('change', function (e) {
      if (e.target && e.target.matches('[data-gce-field]')) render();
    });

    var logoInput = root.querySelector('[data-gce-field="logo"]');
    var logoName = root.querySelector('[data-gce-logo-name]');
    if (logoInput) {
      logoInput.addEventListener('change', function () {
        var file = logoInput.files && logoInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          state.logoData = reader.result;
          state.logoName = file.name;
          if (logoName) logoName.textContent = file.name;
          render();
        };
        reader.readAsDataURL(file);
      });
    }

    var removeLogo = root.querySelector('[data-gce-remove-logo]');
    if (removeLogo) {
      removeLogo.addEventListener('click', function () {
        state.logoData = null;
        state.logoName = '';
        if (logoInput) logoInput.value = '';
        if (logoName) logoName.textContent = 'কোনো ফাইল নেই';
        render();
      });
    }

    var resetBtn = root.querySelector('[data-gce-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        Object.keys(DEFAULTS).forEach(function (k) {
          state[k] = DEFAULTS[k];
        });
        state.logoData = null;
        state.logoName = '';
        if (logoInput) logoInput.value = '';
        if (logoName) logoName.textContent = 'কোনো ফাইল নেই';
        root.querySelectorAll('[data-gce-field]').forEach(function (el) {
          var key = el.getAttribute('data-gce-field');
          if (key === 'logo') return;
          if (el.type === 'checkbox') el.checked = !!DEFAULTS[key];
          else if (DEFAULTS[key] != null) el.value = DEFAULTS[key];
        });
        render();
      });
    }

    var svgBtn = root.querySelector('[data-gce-svg]');
    if (svgBtn) {
      svgBtn.addEventListener('click', function () {
        readFields();
        var fontCss = resolveFont(state.fontFamily, root);
        var blob = new Blob([buildSvg(state, fontCss)], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, 'gift-card.svg');
      });
    }

    var pngBtn = root.querySelector('[data-gce-png]');
    if (pngBtn) {
      pngBtn.addEventListener('click', function () {
        readFields();
        var fontCss = resolveFont(state.fontFamily, root);
        var svg = buildSvg(state, fontCss);
        var img = new Image();
        var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
        img.onload = function () {
          var canvas = document.createElement('canvas');
          canvas.width = 1600;
          canvas.height = 1360;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 1600, 1360);
          URL.revokeObjectURL(url);
          canvas.toBlob(function (blob) {
            if (blob) downloadBlob(blob, 'gift-card.png');
          }, 'image/png');
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          alert('PNG export failed. Try SVG download instead.');
        };
        img.src = url;
      });
    }

    render();
  }

  function boot() {
    document.querySelectorAll('[data-gce]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
