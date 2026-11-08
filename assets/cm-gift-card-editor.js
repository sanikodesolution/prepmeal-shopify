(() => {
  const root = document.querySelector('[data-gce]');
  if (!root) return;

  const svg = root.querySelector('[data-gce-svg]');
  const defaults = {
    gift: 'Gift',
    card: 'Card',
    brand: 'MEALS',
    subtitle: 'FRESH MEAL PREP',
    badge: 'CM',
    note: 'Redeemable on any meal plan',
    font: 'Poppins',
    scale: 100,
    cardBg: '#FFFDF6',
    sectionBg: '#E6E6E3',
    textMain: '#14213D',
    textAccent: '#F5A623',
    ribbon: '#14213D',
    bow: '#F5A623',
    tilt: -7,
    showRibbon: true,
    transparentBg: false,
  };

  const $ = (id) => root.querySelector(`[data-gce-field="${id}"]`);
  const els = {
    gift: $('gift'),
    card: $('card'),
    brand: $('brand'),
    subtitle: $('subtitle'),
    badge: $('badge'),
    note: $('note'),
    font: $('font'),
    scale: $('scale'),
    scaleVal: root.querySelector('[data-gce-scale-val]'),
    cardBg: $('cardBg'),
    sectionBg: $('sectionBg'),
    textMain: $('textMain'),
    textAccent: $('textAccent'),
    ribbon: $('ribbon'),
    bow: $('bow'),
    tilt: $('tilt'),
    tiltVal: root.querySelector('[data-gce-tilt-val]'),
    showRibbon: $('showRibbon'),
    transparentBg: $('transparentBg'),
    logo: $('logo'),
    removeLogo: root.querySelector('[data-gce-remove-logo]'),
    logoName: root.querySelector('[data-gce-logo-name]'),
    stage: root.querySelector('[data-gce-stage]'),
  };

  let logoUrl = '';

  const darken = (hex, pct) => {
    const n = hex.replace('#', '');
    const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    r = Math.max(0, Math.round(r * (1 - pct)));
    g = Math.max(0, Math.round(g * (1 - pct)));
    b = Math.max(0, Math.round(b * (1 - pct)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const lighten = (hex, pct) => {
    const n = hex.replace('#', '');
    const num = parseInt(n.length === 3 ? n.split('').map((c) => c + c).join('') : n, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    r = Math.min(255, Math.round(r + (255 - r) * pct));
    g = Math.min(255, Math.round(g + (255 - g) * pct));
    b = Math.min(255, Math.round(b + (255 - b) * pct));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const fontStack = (name) => {
    if (name === 'Plus Jakarta Sans') return `'Plus Jakarta Sans', Poppins, Arial, sans-serif`;
    if (name === 'Inter') return `Inter, Poppins, Arial, sans-serif`;
    return `Poppins, 'Plus Jakarta Sans', Arial, sans-serif`;
  };

  const state = () => ({
    gift: els.gift.value.trim() || defaults.gift,
    card: els.card.value.trim() || defaults.card,
    brand: els.brand.value.trim() || defaults.brand,
    subtitle: els.subtitle.value.trim() || defaults.subtitle,
    badge: els.badge.value.trim() || defaults.badge,
    note: els.note.value.trim() || defaults.note,
    font: els.font.value,
    scale: Number(els.scale.value) || 100,
    cardBg: els.cardBg.value,
    sectionBg: els.sectionBg.value,
    textMain: els.textMain.value,
    textAccent: els.textAccent.value,
    ribbon: els.ribbon.value,
    bow: els.bow.value,
    tilt: Number(els.tilt.value),
    showRibbon: els.showRibbon.checked,
    transparentBg: els.transparentBg.checked,
  });

  const render = () => {
    const s = state();
    const stack = fontStack(s.font);
    const giftSize = Math.round(84 * (s.scale / 100));
    const cardSize = Math.round(62 * (s.scale / 100));
    const bowDark = darken(s.bow, 0.1);
    const bowLight = lighten(s.bow, 0.18);

    if (els.scaleVal) els.scaleVal.textContent = `${s.scale}%`;
    if (els.tiltVal) els.tiltVal.textContent = `${s.tilt}°`;
    if (els.stage) {
      els.stage.style.background = s.transparentBg ? 'transparent' : s.sectionBg;
    }

    const ribbon = s.showRibbon
      ? `<g clip-path="url(#gce-clip)">
          <polygon points="340,0 392,0 480,88 480,140" fill="${s.ribbon}"/>
          <polygon points="352,0 362,0 480,118 480,128" fill="${s.textAccent}" opacity="0.9"/>
        </g>
        <g transform="translate(423 57)">
          <path d="M0 0 C-10 -46 -56 -40 -48 -6 C-44 8 -14 8 0 0Z" fill="${s.bow}"/>
          <path d="M0 0 C46 -10 40 -56 6 -48 C-8 -44 -8 -14 0 0Z" fill="${bowDark}"/>
          <path d="M0 0 C10 46 56 40 48 6 C44 -8 14 -8 0 0Z" fill="${bowDark}"/>
          <path d="M0 0 C-46 10 -40 56 -6 48 C8 44 8 14 0 0Z" fill="${s.bow}"/>
          <rect x="-13" y="-13" width="26" height="26" rx="6" fill="${bowLight}" transform="rotate(45)"/>
        </g>`
      : '';

    const brand = logoUrl
      ? `<image href="${logoUrl}" x="36" y="30" width="170" height="64" preserveAspectRatio="xMinYMid meet"/>`
      : `<circle cx="62" cy="62" r="26" fill="${s.textAccent}" stroke="${s.textMain}" stroke-width="3"/>
         <text x="62" y="70" text-anchor="middle" font-family="${stack}" font-weight="800" font-size="22" fill="${s.textMain}">${escapeXml(s.badge)}</text>
         <text x="98" y="58" font-family="${stack}" font-weight="700" font-size="15" letter-spacing="3" fill="${s.textMain}">${escapeXml(s.brand)}</text>
         <text x="98" y="76" font-family="${stack}" font-size="10" letter-spacing="2" fill="#7A8194">${escapeXml(s.subtitle)}</text>`;

    svg.innerHTML = `
      <defs>
        <clipPath id="gce-clip"><rect width="480" height="300" rx="18"/></clipPath>
        <filter id="gce-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>
      <ellipse cx="400" cy="520" rx="230" ry="14" fill="#000" opacity="0.22" filter="url(#gce-blur)"/>
      <g transform="translate(400 330) rotate(${s.tilt}) translate(-240 -150)">
        <rect x="4" y="10" width="480" height="300" rx="18" fill="#000" opacity="0.12" filter="url(#gce-blur)"/>
        <rect width="480" height="300" rx="18" fill="${s.cardBg}"/>
        ${ribbon}
        ${brand}
        <text x="36" y="188" font-family="${stack}" font-weight="800" font-size="${giftSize}" letter-spacing="-2" fill="${s.textMain}">${escapeXml(s.gift)}</text>
        <text x="36" y="252" font-family="${stack}" font-weight="400" font-size="${cardSize}" fill="${s.textAccent}">${escapeXml(s.card)}</text>
        <text x="444" y="276" text-anchor="end" font-family="${stack}" font-size="11" fill="#7A8194">${escapeXml(s.note)}</text>
      </g>
    `;
    svg.setAttribute('aria-label', `${s.gift} ${s.card}`);
  };

  const escapeXml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const svgMarkup = () => {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '800');
    clone.setAttribute('height', '680');
    const s = state();
    if (!s.transparentBg) {
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.setAttribute('width', '800');
      bg.setAttribute('height', '680');
      bg.setAttribute('rx', '20');
      bg.setAttribute('fill', s.sectionBg);
      clone.insertBefore(bg, clone.firstChild);
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  };

  const downloadBlob = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  const downloadSvg = () => {
    downloadBlob(new Blob([svgMarkup()], { type: 'image/svg+xml;charset=utf-8' }), 'gift-card.svg');
  };

  const downloadPng = async () => {
    const markup = svgMarkup();
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.decoding = 'async';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1360;
    const ctx = canvas.getContext('2d');
    const s = state();
    if (!s.transparentBg) {
      ctx.fillStyle = s.sectionBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'gift-card.png');
    }, 'image/png');
  };

  const reset = () => {
    els.gift.value = defaults.gift;
    els.card.value = defaults.card;
    els.brand.value = defaults.brand;
    els.subtitle.value = defaults.subtitle;
    els.badge.value = defaults.badge;
    els.note.value = defaults.note;
    els.font.value = defaults.font;
    els.scale.value = defaults.scale;
    els.cardBg.value = defaults.cardBg;
    els.sectionBg.value = defaults.sectionBg;
    els.textMain.value = defaults.textMain;
    els.textAccent.value = defaults.textAccent;
    els.ribbon.value = defaults.ribbon;
    els.bow.value = defaults.bow;
    els.tilt.value = defaults.tilt;
    els.showRibbon.checked = defaults.showRibbon;
    els.transparentBg.checked = defaults.transparentBg;
    logoUrl = '';
    els.logo.value = '';
    if (els.logoName) els.logoName.textContent = 'কোনো ফাইল নেই';
    render();
  };

  root.addEventListener('input', (e) => {
    if (e.target.closest('[data-gce-field]')) render();
  });
  root.addEventListener('change', (e) => {
    if (e.target.closest('[data-gce-field]')) render();
  });

  els.logo?.addEventListener('change', () => {
    const file = els.logo.files && els.logo.files[0];
    if (!file) return;
    if (els.logoName) els.logoName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      logoUrl = reader.result;
      render();
    };
    reader.readAsDataURL(file);
  });

  els.removeLogo?.addEventListener('click', () => {
    logoUrl = '';
    els.logo.value = '';
    if (els.logoName) els.logoName.textContent = 'কোনো ফাইল নেই';
    render();
  });

  root.querySelector('[data-gce-png]')?.addEventListener('click', () => downloadPng());
  root.querySelector('[data-gce-svg]')?.addEventListener('click', () => downloadSvg());
  root.querySelector('[data-gce-reset]')?.addEventListener('click', () => reset());

  render();
})();
