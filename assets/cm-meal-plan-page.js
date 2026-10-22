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

  const scrollToDetail = () => {
    if (!detail) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = Math.max(0, detail.getBoundingClientRect().top + window.scrollY);
    // A wheel scroll cancels the first smooth scroll and leaves it stuck, so the
    // next scrollIntoView on this same section is ignored. Snap to the current
    // position first, then start a fresh smooth scroll.
    window.scrollTo({ top: window.scrollY, behavior: 'auto' });
    window.requestAnimationFrame(() => {
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-i]');
    if (!t) return;
    e.preventDefault();
    showMeal(+t.dataset.i);
    scrollToDetail();
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
    const allSlide = week.querySelector('[data-mp-all]');
    const frame = week.querySelector('.mealplan-menu__frame');
    const rows = [...week.querySelectorAll('[data-mp-row]')];
    const count = week.querySelector('[data-mp-count]');
    const cap = week.querySelector('[data-mp-caption]');
    const listEl = week.querySelector('.mealplan-menu__list');
    const fullEl = week.querySelector('.mealplan-menu__full');
    const modal = week.querySelector('[data-mp-modal]');
    const canHover = matchMedia('(hover: hover) and (pointer: fine)');
    let current = -1;
    let lastIndex = 0;
    // The meal picked from the list stays on screen after the pointer leaves,
    // so moving the cursor from the list to the photo (or away) no longer
    // snaps the stage back to the group shot.
    const clearHoverZoom = () => frame?.classList.remove('is-hover');
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
      fit(listEl, 10, false);
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
      const sheet = week.querySelector('[data-mp-sheet]');
      if (sheet) {
        sheet.hidden = true;
        sheet.closest('.mealplan-menu__frame')?.classList.remove('is-sheet');
      }
      if (i === current || i < 0 || i >= items.length) return;
      current = i;
      lastIndex = i;
      if (allSlide) allSlide.classList.remove('is-active');
      frame?.classList.remove('is-all');
      frame?.classList.add('is-hover');
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
    if (canHover.matches && listEl) listEl.addEventListener('mouseleave', clearHoverZoom);

    // Cursor-following magnifier shared by the stage photo and the lightbox.
    // Scaling about the pointer's own position keeps that pixel pinned at
    // every animation frame; transform is set inline so nothing else wins.
    const lensScale = 2.2;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    // Untransformed box of an image. getBoundingClientRect() reports the
    // zoomed box once the lens is on, and the stage also applies a CSS
    // scale(1.14) hover effect, which fed a wrong origin back in and made the
    // photo slide away, so the base box is cached with its transform undone.
    const baseRect = (img) => {
      if (!img.__lensBase) {
        const r = img.getBoundingClientRect();
        const tf = getComputedStyle(img).transform;
        let sx = 1;
        let sy = 1;
        const m = tf && tf !== 'none' ? tf.match(/matrix\(([^)]+)\)/) : null;
        if (m) {
          const p = m[1].split(',').map(Number);
          sx = Math.hypot(p[0], p[1]) || 1;
          sy = Math.hypot(p[2], p[3]) || 1;
        }
        const w = r.width / sx;
        const h = r.height / sy;
        img.__lensBase = {
          left: r.left + (r.width - w) / 2,
          top: r.top + (r.height - h) / 2,
          width: w,
          height: h,
        };
      }
      return img.__lensBase;
    };
    // Visible part of an image that is letterboxed by object-fit:contain. The
    // stage frame is square while the poster is ~1:2.9, so most of the <img>
    // box is empty margin; zoom has to be anchored on the drawn pixels.
    const contentRect = (img) => {
      const box = baseRect(img);
      const nw = img.naturalWidth || 0;
      const nh = img.naturalHeight || 0;
      if (!nw || !nh || !box.width || !box.height) return null;
      if (getComputedStyle(img).objectFit !== 'contain') return box;
      const scale = Math.min(box.width / nw, box.height / nh);
      const w = nw * scale;
      const h = nh * scale;
      return {
        left: box.left + (box.width - w) / 2,
        top: box.top + (box.height - h) / 2,
        width: w,
        height: h,
      };
    };
    // The lens must feel the same everywhere, but the stage frame is square
    // while the group poster is ~1:2.9, so the drawn poster is only ~1/3 of
    // the frame width. A flat 2.2x barely changes that sliver, while the same
    // 2.2x on the full-frame sheet looks like a real zoom. Boost the factor
    // enough for a letterboxed photo to fill the frame, so the poster zooms
    // as strongly on the stage as it does after opening it from the title.
    const lensArea = (img) => img.closest('.mealplan-menu__gallery-shot, .mealplan-menu__frame') || img;
    const lensScaleFor = (img, content) => {
      const area = lensArea(img).getBoundingClientRect();
      if (!content.width || !content.height || !area.width || !area.height) return lensScale;
      const fill = Math.max(area.width / content.width, area.height / content.height);
      return Math.min(4, Math.max(lensScale, fill));
    };
    const makeLens = (host, target) => {
      if (!host) return;
      let timer = 0;
      const el = () => (typeof target === 'function' ? target() : target);
      const off = () => {
        window.clearTimeout(timer);
        const img = el();
        if (!img) return;
        img.classList.remove('is-lens', 'is-lens-live');
        img.style.removeProperty('transform');
        img.style.removeProperty('transform-origin');
        delete img.__lensBase;
      };
      const move = (event) => {
        const img = el();
        if (!img) return;
        // Only the photo itself magnifies. The host is a bigger box (gallery
        // scroll area, caption, letterboxed stage margins), so hovering its
        // chrome - notably the lightbox scrollbar - must not zoom the picture.
        // Anywhere over the photo triggers it, including the empty margin
        // around a letterboxed poster, so the poster is not a narrow hot strip.
        if (event.target !== img && !img.contains(event.target)) {
          off();
          return;
        }
        const box = baseRect(img);
        const content = contentRect(img);
        if (!content) return;
        const area = lensArea(img).getBoundingClientRect();
        const scale = lensScaleFor(img, content);

        // Anchor on the pixel under the pointer, expressed as a percentage of
        // the image box (the coordinate space transform-origin uses).
        const px = clamp(event.clientX, content.left, content.left + content.width);
        const py = clamp(event.clientY, content.top, content.top + content.height);
        const ox = clamp((px - box.left) / box.width, 0, 1);
        const oy = clamp((py - box.top) / box.height, 0, 1);

        // Where the drawn photo lands after scaling about that anchor.
        const drawnLeft = px + (content.left - px) * scale;
        const drawnTop = py + (content.top - py) * scale;
        const drawnW = content.width * scale;
        const drawnH = content.height * scale;

        // Keep the photo covering the frame. Without this the poster slid off
        // to one side and left grey space whenever the pointer was near an
        // edge of the square stage box. When the drawn photo is smaller than
        // the frame on an axis it is centred there instead.
        const fitAxis = (drawnStart, drawnSize, areaStart, areaSize) => {
          if (drawnSize <= areaSize) {
            return areaStart + (areaSize - drawnSize) / 2 - drawnStart;
          }
          const min = areaStart + areaSize - (drawnStart + drawnSize);
          const max = areaStart - drawnStart;
          return clamp(0, min, max);
        };
        const dx = fitAxis(drawnLeft, drawnW, area.left, area.width);
        const dy = fitAxis(drawnTop, drawnH, area.top, area.height);

        img.style.transformOrigin = `${(ox * 100).toFixed(2)}% ${(oy * 100).toFixed(2)}%`;
        img.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale.toFixed(4)})`;
        if (!img.classList.contains('is-lens')) {
          img.classList.add('is-lens');
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            if (img.classList.contains('is-lens')) img.classList.add('is-lens-live');
          }, 240);
        }
      };
      host.addEventListener('pointerenter', move);
      host.addEventListener('pointermove', move);
      host.addEventListener('pointerleave', off);
      host.addEventListener('blur', off);
      // A cached base box goes stale as soon as the page moves under the
      // pointer, so drop the zoom instead of zooming in the wrong place.
      window.addEventListener('scroll', off, { passive: true });
      host.__lensOff = off;
      return off;
    };

    // Stage photo. The group poster gets the same cursor lens as the meal
    // slides, so hovering it works immediately on load instead of only after
    // opening the sheet from the title.
    if (frame && canHover.matches) {
      makeLens(frame, () => {
        if (frame.classList.contains('is-sheet')) return null;
        return frame.querySelector('.mealplan-menu__slide.is-active img');
      });
      items.forEach((el) => el.addEventListener('mouseenter', () => frame.__lensOff?.()));
    }

    const gallery = week.querySelector('[data-mp-gallery]');
    if (gallery && frame && (slides.length || allSlide)) {
      document.body.appendChild(gallery);
      const gImg = gallery.querySelector('[data-mp-gallery-img]');
      const gShot = gallery.querySelector('.mealplan-menu__gallery-shot') || gallery;
      const gName = gallery.querySelector('[data-mp-gallery-name]');
      const gCount = gallery.querySelector('[data-mp-gallery-count]');
      const photos = [];
      // The group poster is a tall ~1:2.9 strip; flag it so the gallery can
      // size it by width instead of height-capping it into a thin sliver.
      if (allSlide) {
        const img = allSlide.querySelector('img');
        if (img) photos.push({ src: img.currentSrc || img.src, name: img.alt || "This week's meals", tall: true });
      }
      slides.forEach((slide, index) => {
        const img = slide.querySelector('img');
        if (!img) return;
        photos.push({
          src: img.currentSrc || img.src,
          name: items[index]?.querySelector('.mealplan-menu__name')?.textContent.trim() || img.alt || '',
        });
      });
      let gIndex = 0;
      let swapTimer = 0;
      const paint = (i, animate) => {
        const total = photos.length;
        if (!total) return;
        const next = (i + total) % total;
        const photo = photos[next];
        const apply = () => {
          gIndex = next;
          gShot.__lensOff?.();
          gShot.classList.toggle('is-tall', Boolean(photo.tall));
          if (gImg) {
            gImg.src = photo.src;
            gImg.alt = photo.name;
          }
          if (gName) gName.textContent = photo.name;
          if (gCount) gCount.textContent = `${gIndex + 1} / ${total}`;
        };
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!animate || reduce || !gImg || next === gIndex) {
          window.clearTimeout(swapTimer);
          gImg?.classList.remove('is-out', 'is-next', 'is-prev');
          gallery.classList.remove('is-swapping');
          apply();
          return;
        }
        const forward = (next - gIndex + total) % total <= total / 2;
        gImg.classList.toggle('is-next', forward);
        gImg.classList.toggle('is-prev', !forward);
        gImg.classList.add('is-out');
        gallery.classList.add('is-swapping');
        window.clearTimeout(swapTimer);
        swapTimer = window.setTimeout(() => {
          apply();
          requestAnimationFrame(() => {
            gImg.classList.remove('is-out', 'is-next', 'is-prev');
            gallery.classList.remove('is-swapping');
          });
        }, 180);
      };
      const openGallery = (i) => {
        paint(i);
        gallery.hidden = false;
        document.documentElement.style.overflow = 'hidden';
        gallery.querySelector('[data-mp-gallery-close]')?.focus();
      };
      const closeGallery = () => {
        if (gallery.hidden) return;
        gallery.hidden = true;
        document.documentElement.style.overflow = '';
        gShot.__lensOff?.();
        frame.focus();
      };
      const openFromFrame = () => {
        const sheetOpen = frame.classList.contains('is-sheet');
        openGallery(sheetOpen ? 0 : (current >= 0 ? current + (allSlide ? 1 : 0) : 0));
      };
      frame.addEventListener('click', openFromFrame);

      // Lightbox magnifier - same cursor-following lens as the stage photo.
      makeLens(gShot, () => gImg);
      frame.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openFromFrame();
      });
      gallery.querySelector('[data-mp-gallery-prev]')?.addEventListener('click', () => paint(gIndex - 1, true));
      gallery.querySelector('[data-mp-gallery-next]')?.addEventListener('click', () => paint(gIndex + 1, true));
      gallery.querySelector('[data-mp-gallery-close]')?.addEventListener('click', closeGallery);
      gallery.addEventListener('click', (event) => {
        if (event.target === gallery) closeGallery();
      });
      document.addEventListener('keydown', (event) => {
        if (gallery.hidden) return;
        if (event.key === 'Escape') closeGallery();
        else if (event.key === 'ArrowLeft') paint(gIndex - 1, true);
        else if (event.key === 'ArrowRight') paint(gIndex + 1, true);
      });
    }

    rows.forEach((el, i) => {
      el.addEventListener('mouseenter', () => { if (canHover.matches) set(i, 'rows'); });
      el.addEventListener('click', () => set(i, 'rows'));
    });
    fitAll();
    window.addEventListener('resize', fitAll);
    if (modal) {
      document.body.appendChild(modal);
      const open = () => { modal.hidden = false; modal.classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; };
      const close = () => { modal.classList.remove('is-open'); modal.hidden = true; document.documentElement.style.overflow = ''; };
      week.querySelector('[data-mp-open]')?.addEventListener('click', open);
      modal.querySelectorAll('[data-mp-close]').forEach((el) => el.addEventListener('click', close));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
    }

    const posterTitle = week.querySelector('[data-mp-poster]');
    const cursorImg = week.querySelector('[data-mp-cursor]');
    const sheet = week.querySelector('[data-mp-sheet]');
    if (posterTitle && cursorImg) {
      document.body.appendChild(cursorImg);
      const placeCursor = (event) => {
        cursorImg.hidden = false;
        cursorImg.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      };
      const hideCursor = () => { cursorImg.hidden = true; };
      if (canHover.matches) {
        posterTitle.addEventListener('pointerenter', placeCursor);
        posterTitle.addEventListener('pointermove', placeCursor);
        posterTitle.addEventListener('pointerleave', hideCursor);
      }
      posterTitle.addEventListener('click', () => {
        hideCursor();
        if (!sheet) return;
        sheet.hidden = false;
        sheet.closest('.mealplan-menu__frame')?.classList.add('is-sheet');
      });
    }
    if (sheet && canHover.matches) {
      const zoomAt = (event) => {
        const box = sheet.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const x = Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100));
        const y = Math.min(100, Math.max(0, ((event.clientY - box.top) / box.height) * 100));
        sheet.style.setProperty('--mp-zoom-x', `${x}%`);
        sheet.style.setProperty('--mp-zoom-y', `${y}%`);
        sheet.classList.add('is-zoom');
      };
      sheet.addEventListener('pointerenter', zoomAt);
      sheet.addEventListener('pointermove', zoomAt);
      sheet.addEventListener('pointerleave', () => sheet.classList.remove('is-zoom'));
    }

    const orderForm = week.querySelector('[data-mp-order]');
    if (orderForm) {
      // Custom dropdown UI. A native <select> popup is painted by the OS and
      // cannot be styled, so each select is wrapped by a button + listbox. The
      // select itself stays in the DOM (visually hidden) so the existing submit
      // handler and Shopify properties keep working untouched.
      const closePickers = (except) => {
        $$('[data-mp-trigger]', orderForm).forEach((btn) => {
          if (btn === except) return;
          btn.setAttribute('aria-expanded', 'false');
          const panel = document.querySelector(`[data-mp-panel="${btn.dataset.mpTrigger}"]`);
          if (panel) panel.hidden = true;
        });
      };

      const syncTrigger = (select, trigger) => {
        const chosen = select.options[select.selectedIndex];
        const empty = !select.value;
        const text = trigger.querySelector('.mealplan-menu__trigger-text');
        if (text) text.textContent = empty ? 'Choose a meal' : (chosen ? chosen.textContent.trim() : '');
        trigger.classList.toggle('is-empty', empty);
        // Price lives in a sibling span so the name can keep its own ellipsis.
        const price = trigger.querySelector('.mealplan-menu__trigger-price');
        if (price) {
          const value = chosen && !empty ? chosen.dataset.price : '';
          price.textContent = value || '';
          price.hidden = !value;
        }
      };

      $$('select[data-mp-pick]', orderForm).forEach((select, index) => {
        const key = `picker-${index}`;
        const wrap = document.createElement('div');
        wrap.className = 'mealplan-menu__picker';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'mealplan-menu__trigger is-empty';
        trigger.dataset.mpTrigger = key;
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-label', `Meal ${index + 1}`);
        trigger.innerHTML = '<span class="mealplan-menu__trigger-text">Choose a meal</span>'
          + '<span class="mealplan-menu__trigger-price" hidden></span>'
          + '<svg viewBox="0 0 12 8" fill="none" aria-hidden="true"><path fill="none" stroke="#15251C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M1 1.5 6 6.5 11 1.5"/></svg>';

        const panel = document.createElement('ul');
        panel.className = 'mealplan-menu__panel';
        panel.dataset.mpPanel = key;
        panel.setAttribute('role', 'listbox');
        panel.hidden = true;

        [...select.options].forEach((opt, optIndex) => {
          const li = document.createElement('li');
          li.className = 'mealplan-menu__option';
          li.setAttribute('role', 'option');
          li.dataset.value = opt.value;
          li.dataset.index = String(optIndex);
          if (!opt.value) {
            li.classList.add('is-placeholder');
            li.innerHTML = '<span class="mealplan-menu__option-mark">✓</span><span>Choose a meal</span>';
          } else {
            li.innerHTML = '<span class="mealplan-menu__option-mark">✓</span><span class="mealplan-menu__option-name"></span>'
              + (opt.dataset.price ? '<span class="mealplan-menu__option-price"></span>' : '');
            li.querySelector('.mealplan-menu__option-name').textContent = opt.textContent.trim();
            const priceEl = li.querySelector('.mealplan-menu__option-price');
            if (priceEl) priceEl.textContent = opt.dataset.price;
          }
          if (opt.selected && opt.value) li.classList.add('is-selected');
          li.setAttribute('aria-selected', opt.selected && opt.value ? 'true' : 'false');
          panel.appendChild(li);
        });

        select.classList.add('mealplan-menu__select-native');
        // The custom trigger is the only tab stop; keep the native control out
        // of the tab order but still in the form for submission + validation.
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(trigger);
        wrap.appendChild(select);
        document.body.appendChild(panel);

        const positionPanel = () => {
          const box = trigger.getBoundingClientRect();
          const width = box.width;
          const maxH = Math.min(340, window.innerHeight * 0.52);
          const below = window.innerHeight - box.bottom - 12;
          const openUp = below < 160 && box.top > below;
          panel.style.width = `${width}px`;
          panel.style.left = `${box.left}px`;
          panel.style.maxHeight = `${Math.min(maxH, openUp ? box.top - 12 : below)}px`;
          panel.style.top = openUp ? 'auto' : `${box.bottom + 6}px`;
          panel.style.bottom = openUp ? `${window.innerHeight - box.top + 6}px` : 'auto';
        };

        const commit = (li) => {
          const optIndex = Number(li.dataset.index);
          select.selectedIndex = optIndex;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          panel.querySelectorAll('.mealplan-menu__option').forEach((el) => {
            el.classList.toggle('is-selected', el === li);
            el.classList.toggle('is-active', el === li);
            el.setAttribute('aria-selected', el === li ? 'true' : 'false');
          });
          syncTrigger(select, trigger);
          closePickers();
        };

        const open = () => {
          closePickers(trigger);
          positionPanel();
          panel.hidden = false;
          trigger.setAttribute('aria-expanded', 'true');
          const current = panel.querySelector('.is-selected') || panel.querySelector('.mealplan-menu__option:not(.is-placeholder)');
          panel.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
          if (current) {
            current.classList.add('is-active');
            current.scrollIntoView({ block: 'nearest' });
          }
        };

        const closePanel = () => {
          panel.hidden = true;
          trigger.setAttribute('aria-expanded', 'false');
          panel.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
        };

        trigger.addEventListener('click', (event) => {
          // Prevent the surrounding <label> from forwarding this click to the
          // hidden <select> and opening the native OS popup.
          event.preventDefault();
          if (trigger.getAttribute('aria-expanded') === 'true') closePickers();
          else open();
        });

        panel.addEventListener('mousedown', (event) => event.preventDefault());
        panel.addEventListener('click', (event) => {
          const li = event.target.closest('.mealplan-menu__option');
          if (!li || li.classList.contains('is-placeholder')) return;
          commit(li);
        });

        trigger.addEventListener('keydown', (event) => {
          const opts = [...panel.querySelectorAll('.mealplan-menu__option:not(.is-placeholder)')];
          if (!opts.length) return;
          // Resolve the active index after opening so the first arrow press
          // steps from the highlighted row instead of skipping past it.
          const move = (step) => {
            event.preventDefault();
            const at = opts.findIndex((el) => el.classList.contains('is-active'));
            const from = at < 0 ? (step > 0 ? -1 : 0) : at;
            opts.forEach((el) => el.classList.remove('is-active'));
            const el = opts[(from + step + opts.length * 2) % opts.length];
            el.classList.add('is-active');
            el.scrollIntoView({ block: 'nearest' });
          };
          if (event.key === 'ArrowDown') {
            if (panel.hidden) { event.preventDefault(); open(); } else move(1);
          } else if (event.key === 'ArrowUp') {
            if (panel.hidden) { event.preventDefault(); open(); } else move(-1);
          } else if (event.key === 'Enter' || event.key === ' ') {
            if (panel.hidden) { event.preventDefault(); open(); }
            else {
              event.preventDefault();
              const el = panel.querySelector('.is-active');
              if (el) commit(el);
            }
          } else if (event.key === 'Escape' && !panel.hidden) {
            event.preventDefault();
            closePanel();
            trigger.focus();
          }
        });

        syncTrigger(select, trigger);
      });

      const onDocDown = (event) => {
        if (event.target.closest('.mealplan-menu__picker') || event.target.closest('.mealplan-menu__panel')) return;
        closePickers();
      };
      document.addEventListener('pointerdown', onDocDown);
      window.addEventListener('resize', () => closePickers());
      week.addEventListener('scroll', () => closePickers(), true);

      const orderMsg = orderForm.querySelector('[data-mp-order-msg]');
      const orderBtn = orderForm.querySelector('[type="submit"]');
      const orderSum = orderForm.querySelector('[data-mp-sum]');
      const say = (text, ok) => {
        if (!orderMsg) return;
        orderMsg.hidden = !text;
        orderMsg.textContent = text || '';
        orderMsg.classList.toggle('is-ok', Boolean(ok));
      };

      // Total for the chosen meals. The plan variant itself carries the plan
      // price; this only summarises the picks so the number is visible in the
      // form box instead of the meal list.
      const syncSum = () => {
        if (!orderSum) return;
        // Placeholder comes from Liquid as a full money string, so we can reuse
        // the store's exact currency formatting instead of guessing symbols.
        const template = orderSum.dataset.mpMoney || orderSum.textContent;
        let cents = 0;
        orderForm.querySelectorAll('[data-mp-pick]').forEach((select) => {
          const chosen = select.options[select.selectedIndex];
          const value = chosen && select.value ? Number(chosen.dataset.priceCents) : 0;
          if (value > 0) cents += value;
        });
        orderSum.textContent = template.replace(/[\d][\d.,]*/, (cents / 100).toFixed(2));
      };
      orderForm.addEventListener('change', syncSum);
      syncSum();
      orderForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const picks = [...orderForm.querySelectorAll('[data-mp-pick]')];
        if (picks.some((select) => !select.value)) {
          say('Choose a meal in every dropdown.');
          return;
        }
        const planName = orderForm.dataset.mpPlan || 'Meal plan';
        const mealItems = [];
        picks.forEach((select, index) => {
          const chosen = select.options[select.selectedIndex];
          const variantId = chosen && chosen.dataset.variantId;
          if (!variantId) return;
          mealItems.push({
            id: Number(variantId),
            quantity: 1,
            properties: {
              Plan: planName,
              Slot: `Meal ${index + 1}`,
            },
          });
        });
        const id = orderForm.querySelector('[name="id"]')?.value;
        let items = [];
        if (mealItems.length === picks.length) {
          items = mealItems;
        } else if (mealItems.length === 0 && id) {
          items = [{
            id: Number(id),
            quantity: 1,
            properties: Object.fromEntries(picks.map((select, index) => [`Meal ${index + 1}`, select.value])),
          }];
        } else {
          say('Each meal needs its own price before it can be added.');
          return;
        }
        const drawer = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
        const sections = drawer && typeof drawer.getSectionsToRender === 'function'
          ? drawer.getSectionsToRender().map((section) => section.id)
          : ['cart-icon-bubble'];
        if (orderBtn) orderBtn.disabled = true;
        say('');
        try {
          const response = await fetch(`${(window.routes && window.routes.cart_add_url) || '/cart/add'}.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              items,
              sections,
              sections_url: window.location.pathname,
            }),
          });
          const data = await response.json();
          if (!response.ok || data.status) {
            const description = data.description || data.message || 'Could not add to cart';
            if (/cannot find variant/i.test(description)) {
              throw new Error('Publish the meal products to the Online Store, then try again.');
            }
            throw new Error(description);
          }
          if (drawer && typeof drawer.renderContents === 'function') {
            drawer.classList.remove('is-empty');
            const added = data.items ? data.items[0] : data;
            drawer.renderContents({
              ...added,
              title: planName,
              product_title: planName,
              sections: data.sections,
            });
          }
          say('Added to your cart.', true);
        } catch (error) {
          say(error.message || 'Could not add to cart');
        } finally {
          if (orderBtn) orderBtn.disabled = false;
        }
      });
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
