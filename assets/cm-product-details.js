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

    const thumbsEl = root.querySelector('.mealplan-pd__thumbs');
    let lockHover = false;
    const markThumbs = (i) => {
      thumbs.forEach((t, k) => {
        t.classList.toggle('is-active', k === i);
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      const thumb = thumbs[i];
      if (!thumb || !thumbsEl) return;
      const view = thumbsEl.getBoundingClientRect();
      const box = thumb.getBoundingClientRect();
      let delta = 0;
      if (box.left < view.left + 2) delta = box.left - view.left - 8;
      else if (box.right > view.right - 2) delta = box.right - view.right + 8;
      if (!delta) return;
      lockHover = true;
      thumbsEl.scrollTo({ left: thumbsEl.scrollLeft + delta, behavior: reduce ? 'auto' : 'smooth' });
      window.setTimeout(() => { lockHover = false; }, reduce ? 0 : 450);
    };
    let slideTl = null;
    let onDish = null;
    const mediaOf = (slide) => slide.querySelector('img, svg');
    const show = (i) => {
      if (i < 0 || i >= slides.length || i === cur) return;
      cur = i;
      markThumbs(i);
      if (slideTl) {
        slideTl.kill();
        slideTl = null;
      }
      slides.forEach((s, k) => {
        s.classList.remove('is-incoming');
        s.classList.toggle('is-active', k === i);
        if (window.gsap) {
          gsap.set(s, { clearProps: 'clipPath' });
          const media = mediaOf(s);
          if (media) gsap.set(media, { clearProps: 'transform' });
        }
      });
      if (onDish) onDish(slides[i]);
    };
    markThumbs(cur);
    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('mouseenter', () => {
        if (canHover.matches && !lockHover) show(i);
      });
      thumb.addEventListener('click', () => show(i));
      thumb.addEventListener('focus', () => show(i));
    });
    if (stage && canHover.matches && !reduce) {
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
    const planSets = [...root.querySelectorAll('[data-pd-plan]')];
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

    const selectedOptions = () => [...fieldsets, ...planSets].map((fs) => fs.querySelector('input:checked')?.value || null);
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
    root.querySelectorAll('[data-pd-option] input, [data-pd-plan] input').forEach((input) => {
      if (!customBox || !customLabel || input.value.toLowerCase() !== customLabel) return;
      customInput = input;
      customLabelEl = input.closest('label');
      customLabelEl?.classList.add('has-toggle');
      customLabelEl?.querySelector('.mealplan-pd__valBox')?.insertAdjacentHTML('beforeend', '<svg class="mealplan-pd__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg>');
      if (!customBox.id) customBox.id = `${root.id}-custom`;
      input.setAttribute('aria-controls', customBox.id);
      input.setAttribute('aria-expanded', 'false');
    });
    let wasCustomOn = false;
    if (customLabelEl && customInput) {
      customLabelEl.addEventListener('pointerdown', () => {
        wasCustomOn = customOn();
      });
      customLabelEl.addEventListener('click', (event) => {
        if (!wasCustomOn) return;
        event.preventDefault();
        customCollapsed = !customCollapsed;
        syncCustom();
      });
    }
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
    const paintVariant = (v) => {
      if (!v) return;
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
    };
    const applyPlan = (input) => {
      if (!input) return;
      const nextId = input.dataset.variantId;
      if (vid && nextId) {
        vid.value = nextId;
        vid.disabled = false;
      }
      const available = input.dataset.available !== 'false';
      if (priceEl && input.dataset.price) priceEl.textContent = input.dataset.price;
      if (compareEl) {
        compareEl.hidden = !input.dataset.compare;
        if (input.dataset.compare) compareEl.textContent = input.dataset.compare;
      }
      if (soldEl) soldEl.hidden = available;
      if (btn && btnLabel) {
        btn.disabled = !available || !nextId;
        btnLabel.textContent = available && nextId ? 'Add to cart' : 'Sold out';
      }
    };
    planSets.forEach((fs) => {
      fs.addEventListener('change', () => {
        const label = fs.querySelector('[data-pd-selected]');
        const checked = fs.querySelector('input:checked');
        if (label && checked) label.textContent = checked.value;
        if (checked?.dataset.variantId) applyPlan(checked);
        else paintVariant(variants.find((item) => item.options.includes(checked?.value)));
        if (msg) msg.textContent = '';
        syncCustom();
      });
    });

    const form = root.querySelector('form');
    form?.addEventListener('submit', async (event) => {
      if (customOn() && dishTotal() < customMin) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (msg) msg.textContent = `Please choose at least ${customMin} ${customMin === 1 ? 'meal' : 'meals'} for your custom order.`;
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!btn || btn.classList.contains('loading')) return;

      const checkedPlans = [...form.querySelectorAll('[data-pd-plan] input:checked, [data-pd-option] input:checked')];
      const idInput = form.querySelector('[name="id"]');
      if (idInput) idInput.disabled = false;
      const selectedValues = checkedPlans.map((input) => input.value);
      const exact = variants.find((item) => item.options.length === selectedValues.length && item.options.every((option, index) => option === selectedValues[index]));
      const named = variants.find((item) => selectedValues.some((value) => item.options.includes(value)));
      const fromRadio = checkedPlans.map((input) => input.getAttribute('data-variant-id')).find((id) => id);
      const variantId = exact?.id || fromRadio || named?.id || idInput?.value || variants.find((item) => item.id)?.id;
      if (idInput && variantId) idInput.value = variantId;
      if (!variantId) {
        if (msg) msg.textContent = 'Choose a meal plan, then add it to the cart.';
        return;
      }

      btn.classList.add('loading');
      btn.setAttribute('aria-disabled', 'true');
      if (msg) msg.textContent = '';
      const afterAdd = root.getAttribute('data-after-add') || 'stay';
      const drawer = document.querySelector('cart-drawer');
      const drawerSections = drawer && typeof drawer.getSectionsToRender === 'function'
        ? drawer.getSectionsToRender().map((section) => section.id)
        : [];
      const sectionIds = [...new Set(['cart-icon-bubble', ...drawerSections])];

      try {
        const response = await fetch(`${(window.routes && window.routes.cart_add_url) || '/cart/add'}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            items: [{
              id: Number(variantId),
              quantity: Math.max(1, parseInt(form.querySelector('[name="quantity"]')?.value, 10) || 1),
              properties: Object.fromEntries(
                [...new FormData(form).entries()]
                  .filter(([key, value]) => key.startsWith('properties[') && value)
                  .map(([key, value]) => [key.slice(11, -1), value])
              ),
            }],
            sections: sectionIds,
            sections_url: window.location.pathname,
          }),
        });
        const data = await response.json();
        if (!response.ok || data.status) {
          const description = typeof data.description === 'string' ? data.description : data.message;
          throw new Error(description || 'Could not add to cart');
        }
        const bubbleHtml = data.sections && data.sections['cart-icon-bubble'];
        const bubble = document.getElementById('cart-icon-bubble');
        if (bubbleHtml && bubble) {
          const parsed = new DOMParser().parseFromString(bubbleHtml, 'text/html');
          const source = parsed.querySelector('.shopify-section') || parsed.body;
          if (source) bubble.innerHTML = source.innerHTML;
        }
        // Keep the cart drawer in sync so it never shows stale contents.
        if (drawer && data.sections && data.sections['cart-drawer']) {
          const drawerHtml = new DOMParser().parseFromString(data.sections['cart-drawer'], 'text/html').querySelector('#CartDrawer');
          const drawerEl = document.getElementById('CartDrawer');
          if (drawerHtml && drawerEl) drawerEl.innerHTML = drawerHtml.innerHTML;
          drawer.classList.remove('is-empty');
          drawer.querySelector('.drawer__inner')?.classList.remove('is-empty');
        }
        document.body.classList.remove('overflow-hidden');
        const smoother = window.ScrollSmoother && window.ScrollSmoother.get && window.ScrollSmoother.get();
        if (smoother && smoother.paused) smoother.paused(false);
        btn.dataset.cartOk = 'true';
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
        if (afterAdd === 'cart') {
          window.location.href = (window.routes && window.routes.cart_url) || '/cart';
        } else if (afterAdd === 'drawer' && drawer && typeof drawer.open === 'function') {
          drawer.querySelector('#CartDrawer-Overlay')?.addEventListener('click', () => drawer.close(), { once: true });
          drawer.open(btn);
          if (typeof drawer.showAddedBanner === 'function') drawer.showAddedBanner(data.items && data.items[0]);
        }
      } catch (error) {
        btn.dataset.cartOk = '';
        if (msg) msg.textContent = error.message || 'Could not add to cart';
      } finally {
        btn.classList.remove('loading');
        if (!btn.disabled) btn.removeAttribute('aria-disabled');
      }
    }, true);

    const qty = root.querySelector('[data-pd-qty]');
    const qtyValue = () => Math.max(1, parseInt(qty?.value, 10) || 1);
    const macroEls = [...root.querySelectorAll('[data-pd-count]')];
    const macros = macroEls.map((el) => {
      const match = el.textContent.trim().match(/^(\D*)([\d.]+)(.*)$/);
      return {
        el,
        prefix: match ? match[1] : '',
        num: match ? parseFloat(match[2]) : null,
        decimals: match ? (match[2].split('.')[1] || '').length : 0,
        suffix: match ? match[3] : '',
      };
    });
    let macroToken = 0;
    const writeMacros = () => {
      const q = qtyValue();
      macros.forEach((macro) => {
        if (macro.num == null) return;
        const value = macro.num * q;
        const shown = macro.decimals ? value.toFixed(macro.decimals) : String(value);
        macro.el.textContent = macro.prefix + shown + macro.suffix;
      });
    };
    const setQty = (n) => {
      if (!qty) return;
      qty.value = String(Math.max(1, n || 1));
      macroToken += 1;
      writeMacros();
    };
    root.querySelector('[data-pd-minus]')?.addEventListener('click', () => setQty(qtyValue() - 1));
    root.querySelector('[data-pd-plus]')?.addEventListener('click', () => setQty(qtyValue() + 1));
    qty?.addEventListener('input', () => {
      macroToken += 1;
      writeMacros();
    });

    root.querySelectorAll('[data-pd-acc]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.parentElement;
        const open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });

    // Swap title, description and nutrition to the active dish.
    const titleEl = root.querySelector('[data-pd-title]');
    const descEl = root.querySelector('[data-pd-desc]');
    const baseDesc = descEl ? descEl.innerHTML : '';
    const baseDescHidden = descEl ? descEl.hidden : true;
    const swap = (el) => {
      if (!el || reduce) return;
      el.classList.remove('is-swap');
      void el.offsetWidth;
      el.classList.add('is-swap');
    };
    const escapeHtml = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    onDish = (slide) => {
      if (!slide || !slide.dataset) return;
      const d = slide.dataset;
      if (titleEl && d.name && titleEl.textContent !== d.name) {
        titleEl.textContent = d.name;
        swap(titleEl);
      }
      if (descEl) {
        const next = d.desc ? escapeHtml(d.desc) : baseDesc;
        if (descEl.innerHTML !== next) {
          descEl.innerHTML = next;
          descEl.hidden = d.desc ? false : baseDescHidden;
          swap(descEl);
        }
      }
      let changed = false;
      macros.forEach((macro) => {
        const key = macro.el.getAttribute('data-pd-macro');
        if (!key || d[key] === undefined) return;
        const match = String(d[key]).trim().match(/^(\D*)([\d.]+)(.*)$/);
        const next = {
          prefix: match ? match[1] : '',
          num: match ? parseFloat(match[2]) : null,
          decimals: match ? (match[2].split('.')[1] || '').length : 0,
          suffix: match ? match[3] : '',
        };
        if (next.num === macro.num && next.prefix === macro.prefix && next.suffix === macro.suffix) return;
        Object.assign(macro, next);
        if (macro.num == null) macro.el.textContent = String(d[key]).trim() || '–';
        changed = true;
      });
      if (changed) {
        macroToken += 1;
        writeMacros();
        macros.forEach((macro) => swap(macro.el));
      }
    };

    const counters = macroEls;
    const countUp = (el) => {
      const macro = macros.find((item) => item.el === el);
      if (!macro || macro.num == null || reduce) return;
      const token = macroToken;
      const end = macro.num * qtyValue();
      let started = null;
      const step = (ts) => {
        if (token !== macroToken) return;
        if (!started) started = ts;
        const progress = Math.min(1, (ts - started) / 1100);
        const eased = 1 - (1 - progress) ** 3;
        const shown = (end * eased).toFixed(macro.decimals);
        el.textContent = macro.prefix + shown + macro.suffix;
        if (progress < 1) requestAnimationFrame(step);
        else {
          const finalShown = macro.decimals ? end.toFixed(macro.decimals) : String(end);
          el.textContent = macro.prefix + finalShown + macro.suffix;
        }
      };
      requestAnimationFrame(step);
    };
    if (counters.length && 'IntersectionObserver' in window && !reduce) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach((counter) => counterObserver.observe(counter));
    }

    if (window.gsap && !reduce && root.getAttribute('data-anim') !== 'false') {
      root.classList.add('mealplan-pd-fx');
      const active = slides[cur];
      if (stage && active) {
        gsap.fromTo(stage, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath' });
        gsap.fromTo(mediaOf(active), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform' });
      }
    }

    if (btn) {
      let addedTimer = 0;
      const watch = new MutationObserver(() => {
        // classList.add/remove rewrite the attribute even when nothing changes,
        // which re-triggers this observer forever. Only touch classes on a real change.
        if (btn.classList.contains('loading')) {
          if (!btn.classList.contains('is-loading')) btn.classList.add('is-loading');
          return;
        }
        if (!btn.classList.contains('is-loading')) return;
        btn.classList.remove('is-loading');
        if (!btnLabel || btn.dataset.cartOk !== 'true') return;
        btn.dataset.cartOk = '';
        btn.classList.add('is-added');
        const previous = btnLabel.textContent;
        btnLabel.textContent = 'Added to cart';
        window.clearTimeout(addedTimer);
        addedTimer = window.setTimeout(() => {
          btn.classList.remove('is-added');
          if (!btn.disabled) btnLabel.textContent = previous;
        }, 2200);
      });
      watch.observe(btn, { attributes: true, attributeFilter: ['class'] });
    }

    root.classList.remove('mealplan-pd--pin');
  });
})();
