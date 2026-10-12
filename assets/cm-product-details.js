(() => {
  document.querySelectorAll('[data-mealplan-pd]').forEach((root) => {
    root.classList.add('mealplan-pd-js');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = [...root.querySelectorAll('[data-pd-reveal]')];
    reveals.forEach((el, i) => el.style.setProperty('--d', `${(i % 6) * 70}ms`));
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
      reveals.forEach((el) => io.observe(el));
    }

    const slides = [...root.querySelectorAll('[data-pd-slide]')];
    const thumbs = [...root.querySelectorAll('[data-pd-thumb]')];
    const stage = root.querySelector('[data-pd-stage]');
    const canHover = matchMedia('(hover: hover) and (pointer: fine)');
    let cur = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));

    const markThumbs = (i) => {
      thumbs.forEach((t, k) => {
        t.classList.toggle('is-active', k === i);
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
    };
    const show = (i) => {
      if (i < 0 || i >= slides.length || i === cur) return;
      cur = i;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      markThumbs(i);
    };
    markThumbs(cur);
    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('mouseenter', () => { if (canHover.matches) show(i); });
      thumb.addEventListener('click', () => show(i));
      thumb.addEventListener('focus', () => show(i));
    });
    if (stage && canHover.matches && !root.classList.contains('mealplan-pd--plate')) {
      stage.addEventListener('mousemove', (e) => {
        const r = stage.getBoundingClientRect();
        stage.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
        stage.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
        stage.classList.add('is-zoom');
      });
      stage.addEventListener('mouseleave', () => stage.classList.remove('is-zoom'));
    }

    let variants = [];
    try { variants = JSON.parse(root.querySelector('[data-pd-variants]')?.textContent || '[]'); } catch (e) { variants = []; }
    const fieldsets = [...root.querySelectorAll('[data-pd-option]')];
    const vid = root.querySelector('[data-pd-vid]');
    const priceEl = root.querySelector('[data-pd-price]');
    const compareEl = root.querySelector('[data-pd-compare]');
    const saveEl = root.querySelector('[data-pd-save]');
    const soldEl = root.querySelector('[data-pd-sold]');
    const btn = root.querySelector('[data-pd-btn]');
    const btnLabel = root.querySelector('[data-pd-btnlabel]');
    const msg = root.querySelector('[data-pd-msg]');
    const customBox = root.querySelector('[data-pd-custom]');
    const customText = root.querySelector('[data-pd-custom-text]');
    const customSum = root.querySelector('[data-pd-custom-summary]');
    const totalEl = root.querySelector('[data-pd-custom-total]');
    const dishes = [...root.querySelectorAll('[data-dish]')];
    const customLabel = (customBox?.getAttribute('data-label') || '').toLowerCase();
    const customMin = parseInt(customBox?.getAttribute('data-min') || '1', 10) || 1;
    let customCollapsed = false;
    let prevOn = false;
    let customInput = null;
    let customLabelEl = null;

    const selectedOptions = () => fieldsets.map((fs) => fs.querySelector('input:checked')?.value || null);
    const customOn = () => customBox && customLabel && selectedOptions().some((value) => value && value.toLowerCase() === customLabel);
    const dishTotal = () => {
      let total = 0;
      const parts = [];
      dishes.forEach((li) => {
        const n = parseInt(li.getAttribute('data-n') || '0', 10);
        li.classList.toggle('has-n', n > 0);
        const count = li.querySelector('[data-d-count]');
        if (count) count.textContent = String(n);
        if (n > 0) {
          total += n;
          parts.push(`${li.getAttribute('data-dish')} × ${n}`);
        }
      });
      if (totalEl) totalEl.textContent = String(total);
      if (customSum) customSum.value = parts.length ? `${parts.join(', ')} (Total: ${total} meals)` : '';
      return total;
    };
    const syncCustom = () => {
      if (!customBox) return;
      const on = customOn();
      if (on && !prevOn) customCollapsed = false;
      prevOn = on;
      const open = on && !customCollapsed;
      customBox.hidden = !open;
      customBox.classList.toggle('is-open', open);
      customBox.setAttribute('aria-hidden', open ? 'false' : 'true');
      if ('inert' in customBox) customBox.inert = !open;
      if (customLabelEl) customLabelEl.classList.toggle('is-open', open);
      if (customInput) customInput.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (customText) customText.disabled = !on;
      if (customSum) customSum.disabled = !on;
      customBox.querySelectorAll('button').forEach((button) => { button.disabled = !on; });
    };

    dishes.forEach((li) => {
      const bump = (delta) => {
        const next = Math.max(0, Math.min(20, (parseInt(li.getAttribute('data-n') || '0', 10) || 0) + delta));
        li.setAttribute('data-n', String(next));
        dishTotal();
      };
      li.querySelector('[data-d-minus]')?.addEventListener('click', () => bump(-1));
      li.querySelector('[data-d-plus]')?.addEventListener('click', () => bump(1));
    });
    root.querySelectorAll('[data-pd-option] input').forEach((input) => {
      if (!customBox || !customLabel || input.value.toLowerCase() !== customLabel) return;
      customInput = input;
      customLabelEl = input.closest('label');
      customLabelEl?.classList.add('has-toggle');
      customLabelEl?.querySelector('.mealplan-pd__valBox')?.insertAdjacentHTML('beforeend', '<svg class="mealplan-pd__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg>');
      if (!customBox.id) customBox.id = `${root.id}-custom`;
      input.setAttribute('aria-controls', customBox.id);
      input.setAttribute('aria-expanded', 'false');
    });
    let armedCollapse = false;
    if (customInput) {
      customInput.addEventListener('pointerdown', () => {
        armedCollapse = customOn();
      });
    }
    fieldsets.forEach((fs) => {
      fs.addEventListener('click', (event) => {
        if (event.target !== customInput || !armedCollapse) return;
        customCollapsed = !customCollapsed;
        syncCustom();
      });
    });
    syncCustom();
    dishTotal();

    const findVariant = (sel) => variants.find((v) => v.options.every((o, i) => o === sel[i]));
    const applyVariant = (v) => {
      syncCustom();
      if (!v || !btn || !btnLabel) return;
      if (vid) {
        vid.value = v.id;
        vid.disabled = !v.available;
      }
      if (priceEl) priceEl.textContent = v.price;
      if (compareEl) {
        compareEl.hidden = !v.compare;
        if (v.compare) compareEl.textContent = v.compare;
      }
      if (saveEl) {
        saveEl.hidden = !v.save;
        if (v.save) saveEl.textContent = `Save ${v.save}%`;
      }
      if (soldEl) soldEl.hidden = v.available;
      btn.disabled = !v.available;
      btnLabel.textContent = v.available ? 'Add to cart' : 'Sold out';
      if (v.media) {
        const i = slides.findIndex((s) => s.dataset.mediaId === String(v.media));
        if (i >= 0) show(i);
      }
    };
    fieldsets.forEach((fs) => {
      fs.addEventListener('change', () => {
        const label = fs.querySelector('[data-pd-selected]');
        const checked = fs.querySelector('input:checked');
        if (label && checked) label.textContent = checked.value;
        applyVariant(findVariant(selectedOptions()));
      });
    });

    const form = root.querySelector('form');
    form?.addEventListener('submit', (event) => {
      if (!customOn() || dishTotal() >= customMin) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (msg) msg.textContent = 'Pick at least one meal for your custom order.';
    }, true);

    const qty = root.querySelector('[data-pd-qty]');
    const setQty = (n) => { if (qty) qty.value = String(Math.max(1, n || 1)); };
    root.querySelector('[data-pd-minus]')?.addEventListener('click', () => setQty((parseInt(qty.value, 10) || 1) - 1));
    root.querySelector('[data-pd-plus]')?.addEventListener('click', () => setQty((parseInt(qty.value, 10) || 1) + 1));

    root.querySelectorAll('[data-pd-acc]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.parentElement;
        const open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });

    const gallery = root.querySelector('.mealplan-pd__gallery');
    const info = root.querySelector('.mealplan-pd__info');
    const desktop = matchMedia('(min-width: 901px)');
    let pin;
    const headerOffset = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
      return (parseFloat(raw) || 80) + 16;
    };
    const setupPin = () => {
      if (pin) {
        pin.kill();
        pin = null;
      }
      if (!gallery || !info || !window.ScrollTrigger || !desktop.matches) return;
      pin = ScrollTrigger.create({
        trigger: gallery,
        start: () => `top ${headerOffset()}px`,
        endTrigger: info,
        end: () => `bottom ${headerOffset() + gallery.offsetHeight}px`,
        pin: true,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });
    };
    setupPin();
    desktop.addEventListener('change', setupPin);
  });
})();
