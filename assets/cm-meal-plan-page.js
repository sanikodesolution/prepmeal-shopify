/**
 * Meal plan full page — interactive menu, filters, detail, FAQ, gallery.
 * Expects root [data-mp-page] with data-foods JSON of image URLs + meal blocks JSON.
 */
(() => {
  const root = document.querySelector('[data-mp-page]');
  if (!root) return;

  const $ = (s, c = root) => c.querySelector(s);
  const $$ = (s, c = root) => Array.from(c.querySelectorAll(s));

  let foods = [];
  let alts = [];
  try {
    foods = JSON.parse($('[data-mp-foods]')?.textContent || '[]');
    alts = JSON.parse($('[data-mp-alts]')?.textContent || '[]');
  } catch (e) {}

  const foodImg = (k) => {
    const src = foods[k % Math.max(foods.length, 1)] || '';
    const alt = alts[k % Math.max(alts.length, 1)] || '';
    return `<img class="mp-food mealplan-ph ph" src="${src}" alt="${alt}" width="700" height="700" loading="lazy" decoding="async">`;
  };

  // Seed hero images with data-f
  $$('img[data-f]').forEach((img) => {
    const i = +img.dataset.f;
    if (foods[i]) img.src = foods[i];
  });

  // Meals from JSON
  let meals = [];
  try {
    meals = JSON.parse($('[data-mp-meals]')?.textContent || '[]');
  } catch (e) {}

  const v = (x, u = '') => (x == null || x === '' ? '—' : x + u);
  const pad = (n) => String(n + 1).padStart(2, '0');
  const imgFor = (m, k) => {
    if (m.image) {
      return `<img class="mp-food mealplan-ph ph" src="${m.image}" alt="${m.name || ''}" width="700" height="700" loading="lazy" decoding="async">`;
    }
    return foodImg(m.imageIndex != null ? m.imageIndex : k);
  };

  const menuEl = $('#menu');
  const gridEl = $('#grid');
  const filtersEl = $('#filters');
  const moreBtn = $('#more');
  const detail = $('#detail');

  if (menuEl && meals.length) {
    menuEl.innerHTML = meals
      .slice(0, 5)
      .map(
        (m, k) => `<article class="m"><div class="img">${imgFor(m, k)}</div><div class="info"><span class="no">${pad(k)}</span>${
          m.badge ? `<span class="tag">${m.badge}</span>` : ''
        }<h3>${m.name}</h3><div class="reveal"><div><p>${m.description || ''}</p><div class="macros"><span><b>${v(
          m.calories
        )}</b> cal</span><span><b>${v(m.protein, 'g')}</b> protein</span><span><b>${v(m.carbs, 'g')}</b> carbs</span><span><b>${v(
          m.fat,
          'g'
        )}</b> fat</span></div><a class="btn" href="#detail" data-i="${k}">View meal</a></div></div></div></article>`
      )
      .join('');
  }

  if (filtersEl && gridEl && meals.length) {
    const tags = ['all', ...new Set(meals.flatMap((m) => (m.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)))];
    let cur = 'all';
    let shown = 6;
    filtersEl.innerHTML = tags
      .map((t) => `<button type="button" aria-pressed="${t === 'all'}" data-t="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`)
      .join('');
    gridEl.innerHTML = meals
      .map(
        (m, k) =>
          `<article class="e" data-t="${(m.tags || '')
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .join('|')}"><div class="thumb">${imgFor(m, k)}</div><h4>${m.name}</h4><small>${v(m.calories)} cal · ${v(
            m.protein,
            'g'
          )} protein</small><button type="button" data-i="${k}">View meal</button></article>`
      )
      .join('');

    const apply = (animate) => {
      const cards = [...gridEl.querySelectorAll('.e')];
      const prev = new Map();
      if (animate) {
        cards.forEach((el) => {
          if (!el.hidden) prev.set(el, el.getBoundingClientRect());
        });
      }
      const gridBox = gridEl.getBoundingClientRect();
      let n = 0;
      let match = 0;
      const nextShow = new Set();
      cards.forEach((el) => {
        const ok = cur === 'all' || el.dataset.t.split('|').includes(cur);
        if (ok) match++;
        const show = ok && n < shown;
        if (show) {
          n += 1;
          nextShow.add(el);
        }
      });
      cards.forEach((el) => {
        const show = nextShow.has(el);
        const was = !el.hidden;
        if (!show && was && animate && prev.has(el)) {
          const r = prev.get(el);
          el.style.position = 'absolute';
          el.style.top = `${r.top - gridBox.top}px`;
          el.style.left = `${r.left - gridBox.left}px`;
          el.style.width = `${r.width}px`;
          el.style.margin = '0';
          el.classList.add('is-leave');
          const done = () => {
            el.hidden = true;
            el.classList.remove('is-leave', 'is-gone');
            el.style.cssText = '';
          };
          el.addEventListener('transitionend', done, { once: true });
          requestAnimationFrame(() => el.classList.add('is-gone'));
        } else if (show) {
          el.hidden = false;
          if (!was) el.classList.add('is-enter');
        } else {
          el.hidden = true;
        }
      });
      if (animate) {
        cards.forEach((el) => {
          if (!nextShow.has(el) || !prev.has(el)) return;
          const a = prev.get(el);
          const b = el.getBoundingClientRect();
          const dx = a.left - b.left;
          const dy = a.top - b.top;
          if (!dx && !dy) return;
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.style.transition = 'none';
        });
        gridEl.getBoundingClientRect();
        cards.forEach((el) => {
          if (!nextShow.has(el)) return;
          el.style.transition = '';
          el.style.transform = '';
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            cards.forEach((el) => el.classList.remove('is-enter'));
          });
        });
      }
      if (moreBtn) moreBtn.style.display = match > shown ? '' : 'none';
    };

    filtersEl.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      cur = b.dataset.t;
      shown = 6;
      $$('button', filtersEl).forEach((x) => x.setAttribute('aria-pressed', x === b));
      apply(true);
    });
    if (moreBtn) moreBtn.addEventListener('click', () => { shown += 6; apply(true); });
    apply(false);
  }

  function showMeal(k) {
    const m = meals[k];
    if (!m || !detail) return;
    const ok = m.protein != null;
    const tot = ok ? m.protein * 4 + m.carbs * 4 + m.fat * 9 : 1;
    const pp = ok ? (m.protein * 4) / tot * 100 : 33.3;
    const cc = ok ? (m.carbs * 4) / tot * 100 : 33.3;
    const dImg = $('#dImg');
    const dName = $('#dName');
    const dDesc = $('#dDesc');
    const dCal = $('#dCal');
    const dIng = $('#dIng');
    const ring = $('#ring');
    const bars = $('#bars');
    if (dImg) dImg.innerHTML = imgFor(m, k);
    if (dName) dName.textContent = m.name;
    if (dDesc) dDesc.textContent = m.description || '';
    if (dCal) dCal.textContent = v(m.calories);
    const ings = (m.ingredients || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => `<li>${x}</li>`);
    if (m.gluten_free) ings.push('<li class="diet">Gluten free</li>');
    if (m.dairy_free) ings.push('<li class="diet">Dairy free</li>');
    if (dIng) dIng.innerHTML = ings.join('');
    if (ring) {
      ring.style.setProperty('--p', pp.toFixed(1));
      ring.style.setProperty('--c', cc.toFixed(1));
    }
    const mx = ok ? Math.max(m.protein, m.carbs, m.fat) : 1;
    if (bars) {
      bars.innerHTML = [
        ['Protein', m.protein, 'var(--tomato)'],
        ['Carbs', m.carbs, 'var(--saffron)'],
        ['Fat', m.fat, 'var(--leaf)'],
      ]
        .map(
          ([l, val, c]) =>
            `<div class="bar"><header><span>${l}</span><b>${val == null ? '—' : val + 'g'}</b></header><i><b style="width:${
              val == null ? 0 : (val / mx) * 100
            }%;background:${c}"></b></i></div>`
        )
        .join('');
    }
  }

  if (meals.length) showMeal(0);

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-i]');
    if (!t) return;
    e.preventDefault();
    showMeal(+t.dataset.i);
    detail?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth',
    });
  });

  // Plate images [data-p]
  $$('[data-p]').forEach((el) => {
    if (el.id === 'qImg') return;
    el.innerHTML = foodImg(+el.dataset.p);
  });

  // Gallery
  const gal = $('#gal');
  if (gal) {
    const names = alts.length ? alts : meals.map((m) => m.name);
    gal.innerHTML = names
      .slice(0, 10)
      .map(
        (n, k) =>
          `<figure class="mealplan-slide" style="margin:0"><div class="mealplan-img">${foodImg(k)}</div><h4>${n}</h4></figure>`
      )
      .join('');
    $$('[data-g]').forEach((b) => {
      b.addEventListener('click', () => gal.scrollBy({ left: +b.dataset.g * 380, behavior: 'smooth' }));
    });
  }

  // Quality image swap
  const qBox = $('#qImg');
  const qUl = $('#qTerms');
  if (qBox && qUl && foods.length) {
    const items = [...qUl.children];
    const map = [6, 5, 7, 0, 8];
    qBox.innerHTML = '';
    const imgs = map.slice(0, items.length).map((k) => {
      const im = document.createElement('img');
      im.className = 'mp-food mealplan-ph ph mp-qimg';
      im.src = foods[k % foods.length];
      im.alt = alts[k % alts.length] || '';
      im.width = 700;
      im.height = 700;
      im.decoding = 'async';
      qBox.append(im);
      return im;
    });
    const qDetail = document.getElementById('qDetail');
    const qMenu = qDetail?.querySelector('.mealplan-q__menu');
    const writeDetail = (i) => {
      const li = items[i];
      if (!qDetail || !li) return;
      const showMenu = li.dataset.showMenu === '1' && qMenu;
      qDetail.classList.toggle('is-menu', Boolean(showMenu));
      if (qMenu) qMenu.hidden = !showMenu;
      if (showMenu) return;
      const note = qDetail.querySelector('.mealplan-q__note');
      if (!note) return;
      note.querySelector('b').textContent = li.querySelector('b')?.textContent || '';
      note.querySelector('p').textContent = li.dataset.detail || li.querySelector('span')?.textContent || '';
    };
    let cur = 0;
    if (imgs[0]) imgs[0].classList.add('is-on');
    qUl.classList.add('mp-has');
    if (items[0]) items[0].classList.add('is-active');
    writeDetail(0);
    const set = (i) => {
      if (i === cur || !imgs[i]) return;
      imgs[cur]?.classList.remove('is-on');
      items[cur]?.classList.remove('is-active');
      imgs[i].classList.remove('is-on');
      void imgs[i].offsetWidth;
      imgs[i].classList.add('is-on');
      items[i].classList.add('is-active');
      writeDetail(i);
      cur = i;
    };
    items.forEach((li, i) => {
      li.tabIndex = 0;
      li.addEventListener('mouseenter', () => {
        if (matchMedia('(hover:hover)').matches) set(i);
      });
      li.addEventListener('focus', () => set(i));
      li.addEventListener('click', () => set(i));
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          set(i);
        }
      });
    });
  }

  const qTitle = document.querySelector('.mealplan-q__title');
  const qPeek = document.querySelector('.mealplan-q__peek');
  const qLightbox = document.getElementById('qLightbox');
  if (qTitle && qPeek && qLightbox) {
    const closeLightbox = () => {
      qLightbox.hidden = true;
      document.body.style.overflow = '';
    };
    qTitle.addEventListener('click', (e) => {
      if (e.target.closest('.mealplan-q__peek')) return;
      qPeek.classList.toggle('is-on');
    });
    qPeek.addEventListener('click', (e) => {
      e.stopPropagation();
      qLightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
    qLightbox.addEventListener('click', (e) => {
      if (e.target === qLightbox || e.target.closest('[data-q-close]')) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !qLightbox.hidden) closeLightbox();
    });
  }

  const week = document.querySelector('.mealplan-menu');
  if (week) {
    const items = [...week.querySelectorAll('[data-mp-item]')];
    const slides = [...week.querySelectorAll('[data-mp-slide]')];
    const rows = [...week.querySelectorAll('[data-mp-row]')];
    const count = week.querySelector('[data-mp-count]');
    const cap = week.querySelector('[data-mp-caption]');
    const listEl = week.querySelector('.mealplan-menu__list');
    const fullEl = week.querySelector('.mealplan-menu__full');
    const modal = week.querySelector('[data-mp-modal]');
    const canHover = matchMedia('(hover: hover) and (pointer: fine)');
    let current = 0;
    const fit = (box, full, half) => {
      if (!box) return;
      const kids = [...box.children];
      box.style.maxHeight = '';
      if (kids.length <= full + (half ? 1 : 0)) return;
      let h = 0;
      for (let k = 0; k < full; k++) h += kids[k].getBoundingClientRect().height;
      if (half && kids[full]) h += kids[full].getBoundingClientRect().height * 0.5;
      const cs = getComputedStyle(box);
      h += (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      box.style.maxHeight = `${Math.round(h)}px`;
    };
    const fitAll = () => {
      fit(listEl, 7, false);
      fit(fullEl, 5, true);
    };
    const reveal = (box, el) => {
      if (!box || !el) return;
      const b = box.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      let d = 0;
      if (r.top < b.top) d = r.top - b.top - 8;
      else if (r.bottom > b.bottom) d = r.bottom - b.bottom + 8;
      if (d) box.scrollTo({ top: box.scrollTop + d, behavior: 'smooth' });
    };
    const set = (i, src) => {
      if (i === current || i < 0 || i >= items.length) return;
      current = i;
      items.forEach((el, k) => {
        const on = k === i;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-selected', on ? 'true' : 'false');
        el.tabIndex = on ? 0 : -1;
      });
      slides.forEach((el, k) => el.classList.toggle('is-active', k === i));
      rows.forEach((el, k) => el.classList.toggle('is-active', k === i));
      if (count) count.textContent = String(i + 1);
      if (cap) cap.textContent = items[i].querySelector('.mealplan-menu__name')?.textContent || '';
      if (src !== 'list') reveal(listEl, items[i]);
      if (src !== 'rows') reveal(fullEl, rows[i]);
    };
    items.forEach((el, i) => {
      el.addEventListener('mouseenter', () => { if (canHover.matches) set(i, 'list'); });
      el.addEventListener('focus', () => set(i, 'list'));
      el.addEventListener('click', () => set(i, 'list'));
    });
    rows.forEach((el, i) => {
      el.addEventListener('mouseenter', () => { if (canHover.matches) set(i, 'rows'); });
      el.addEventListener('click', () => set(i, 'rows'));
    });
    fitAll();
    window.addEventListener('resize', fitAll);
    if (modal) {
      const img = modal.querySelector('img');
      const markTall = () => {
        if (img && img.naturalWidth && img.naturalHeight / img.naturalWidth > 1.25) modal.classList.add('is-tall');
      };
      if (img) {
        if (img.complete) markTall();
        else img.addEventListener('load', markTall);
      }
      const open = () => { modal.hidden = false; modal.classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; };
      const close = () => { modal.classList.remove('is-open'); modal.hidden = true; document.documentElement.style.overflow = ''; };
      week.querySelector('[data-mp-open]')?.addEventListener('click', open);
      modal.querySelectorAll('[data-mp-close]').forEach((el) => el.addEventListener('click', close));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
    }
  }

  // Reviews (static from markup — no rebuild needed if liquid rendered)
  // FAQ accordion
  const faq = $('#faq');
  if (faq) {
    faq.addEventListener('click', (e) => {
      const b = e.target.closest('.mealplan-qb');
      if (!b) return;
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open);
      b.nextElementSibling?.classList.toggle('mealplan-open', open);
    });
  }

  // Related plans track is liquid-rendered
})();
