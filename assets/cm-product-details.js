(() => {
  document.querySelectorAll('[data-mealplan-pd]').forEach((root) => {
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
    if (stage && canHover.matches) {
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
    const selectedOptions = () => fieldsets.map((fs) => fs.querySelector('input:checked')?.value || null);
    const findVariant = (sel) => variants.find((v) => v.options.every((o, i) => o === sel[i]));
    const applyVariant = (v) => {
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
      });
    });
  });
})();
