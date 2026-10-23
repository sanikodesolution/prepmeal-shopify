(() => {
  const COLORS = [
    ['#b5372f', '#4a2d55', '#4f8a3c'],
    ['#d9a066', '#4a2d55', '#e0562c'],
    ['#7a3b2b', '#e8b923', '#4f8a3c'],
    ['#a4342c', '#d68a2e', '#6b8f3a'],
    ['#b5372f', '#e07b2e', '#3f7d3a'],
    ['#6b3a2a', '#e6c88c', '#2f6b3a'],
    ['#5a2f27', '#4a2d55', '#8a5a3a'],
    ['#d89a3c', '#e8c93a', '#3f7d3a'],
    ['#c4602a', '#4a2d55', '#5b8a3c'],
    ['#e0b36a', '#4a2d55', '#3f7d3a']
  ];

  const esc = (value) =>
    String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  document.querySelectorAll('[data-byb]').forEach((root) => {
    if (root.dataset.bybReady === '1') return;
    root.dataset.bybReady = '1';

    const node = root.querySelector('[data-byb-meals]');
    let meals = [];
    try { meals = JSON.parse(node ? node.textContent : '[]'); } catch (err) { meals = []; }
    if (!meals.length) return;

    const qty = meals.map(() => 0);
    const grid = root.querySelector('[data-byb-grid]');
    const box = root.querySelector('[data-byb-box]');
    const mtxt = root.querySelector('[data-byb-mtxt]');
    const status = root.querySelector('[data-byb-status]');
    const sample = root.dataset.money || '$0.00';
    const plan = root.dataset.plan || '10 Meal Plan';

    const money = (cents) => sample.replace(/[0-9]+[0-9.,]*/, (cents / 100).toFixed(2));
    const count = () => qty.reduce((sum, n) => sum + n, 0);

    const paint = () => {
      const n = count();
      const rate = n >= 10 ? 0.2 : n >= 5 ? 0.15 : 0;
      const sub = meals.reduce((sum, meal, i) => sum + qty[i] * meal.cents, 0);
      const saved = Math.round(sub * rate);
      const span = n >= 5 ? 10 : 5;
      const left = Math.max(span - n, 0);
      const dots = [];
      qty.forEach((amount, i) => {
        for (let k = 0; k < amount; k += 1) dots.push(i);
      });

      grid.innerHTML = meals.map((meal, i) => {
        const colors = COLORS[i % COLORS.length];
        const controls = qty[i]
          ? `<div class="byb__qty"><button type="button" data-ch="${i}" data-d="-1" aria-label="Remove one">−</button><span>${qty[i]}</span><button type="button" data-ch="${i}" data-d="1" aria-label="Add one">+</button></div>`
          : `<button type="button" class="byb__add" data-ch="${i}" data-d="1">Add</button>`;
        const plate = meal.image
          ? `<div class="byb__plate has-photo"><img src="${esc(meal.image)}" alt="${esc(meal.name)}" width="150" height="150"></div>`
          : `<div class="byb__plate"> </div>`;
        const text = `<p>${meal.text ? esc(meal.text) : '&nbsp;'}</p>`;
        const facts = meal.cal
          ? `<ul class="byb__facts"><li><b>${esc(meal.cal)}</b><span>cal</span></li><li><b>${esc(meal.protein)}</b><span>protein</span></li><li><b>${esc(meal.carbs)}</b><span>carbs</span></li><li><b>${esc(meal.fat)}</b><span>fat</span></li></ul>`
          : '';
        return `<article class="byb__meal${qty[i] ? ' is-in' : ''}" style="--c1:${colors[0]};--c2:${colors[1]};--c3:${colors[2]}">${plate}<div class="byb__body"><h4>${esc(meal.name)}</h4>${text}${facts}<div class="byb__row"><span class="byb__price">${esc(meal.price)}</span>${controls}</div></div></article>`;
      }).join('');

      const slots = [];
      for (let s = 0; s < span; s += 1) {
        const meal = dots[s] != null ? meals[dots[s]] : null;
        const colors = meal ? COLORS[dots[s] % COLORS.length] : null;
        const mark = s === 4 ? ' data-m="15%"' : s === 9 ? ' data-m="20%"' : '';
        const style = meal
          ? meal.image
            ? ''
            : ` style="--c1:${colors[0]};--c2:${colors[1]}"`
          : '';
        const slotPhoto = meal && meal.image
          ? `<img src="${esc(meal.image)}" alt="" width="64" height="64">`
          : ' ';
        slots.push(`<div class="byb__slot${meal ? ' is-on' : ''}${meal && meal.image ? ' is-photo' : ''}${s === 4 || s === 9 ? ' is-mark' : ''}"${mark}${style}>${slotPhoto}</div>`);
      }

      const lines = meals.map((meal, i) => qty[i]
        ? `<li><span>${qty[i]} × ${esc(meal.name)}</span><span>${money(qty[i] * meal.cents)}<button type="button" class="byb__x" data-ch="${i}" data-d="${-qty[i]}">Remove</button></span></li>`
        : '').join('');

      const hint = n >= 10
        ? 'You’ve unlocked the best rate: 20% off every plate.'
        : n >= 5
          ? `15% unlocked. ${10 - n} more for 20% off.`
          : `${left} more ${left === 1 ? 'plate' : 'plates'} to unlock 15% off.`;

      box.innerHTML = `<h2>Your box</h2><p class="byb__hint">${hint}</p><div class="byb__slots">${slots.join('')}</div><div class="byb__tiers"><div class="byb__tier${n >= 5 ? ' is-hit' : ''}"><span>5 plates</span><b>15% off</b></div><div class="byb__tier${n >= 10 ? ' is-hit' : ''}"><span>10 plates</span><b>20% off</b></div></div><ul class="byb__lines">${lines}</ul><div class="byb__sum"><div><span>Subtotal</span><span>${money(sub)}</span></div>${saved ? `<div class="byb__save"><span>Box discount</span><span>−${money(saved)}</span></div>` : ''}<div class="byb__tot"><span>Total</span><span>${money(sub - saved)}</span></div></div><button type="button" class="byb__cta" data-byb-cta${n < 5 ? ' disabled' : ''}>${n < 5 ? `Add ${left} more ${left === 1 ? 'plate' : 'plates'}` : 'Add box to cart'}</button><p class="byb__note">Each meal is added at its menu price.</p>`;
      if (mtxt) mtxt.innerHTML = `<b>${n}</b> plates · ${money(sub - saved)}`;
    };

    root.addEventListener('click', (event) => {
      const step = event.target.closest('[data-ch]');
      if (step && root.contains(step)) {
        const index = Number(step.dataset.ch);
        qty[index] = Math.max(0, qty[index] + Number(step.dataset.d));
        paint();
        return;
      }
      if (event.target.closest('[data-byb-view]')) {
        box.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (event.target.closest('[data-byb-cta]')) addBox();
    });

    const say = (message, ok) => {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('is-yes', !!ok);
      status.classList.toggle('is-no', !!message && !ok);
    };

    const addBox = async () => {
      const items = meals
        .map((meal, i) => qty[i] ? { id: meal.id, quantity: qty[i], properties: { Plan: plan } } : null)
        .filter(Boolean);
      if (!items.length) return;
      const button = box.querySelector('[data-byb-cta]');
      const drawer = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
      const sections = drawer && typeof drawer.getSectionsToRender === 'function'
        ? drawer.getSectionsToRender().map((section) => section.id)
        : ['cart-icon-bubble'];
      if (button) button.disabled = true;
      say('');
      try {
        const response = await fetch(`${(window.routes && window.routes.cart_add_url) || '/cart/add'}.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items, sections, sections_url: window.location.pathname })
        });
        const data = await response.json();
        if (!response.ok || data.status) throw new Error(data.description || data.message || 'Could not add to cart');
        if (drawer && typeof drawer.renderContents === 'function') {
          drawer.classList.remove('is-empty');
          const added = data.items ? data.items[0] : data;
          drawer.renderContents({ ...added, title: plan, product_title: plan, sections: data.sections });
        }
        say('Added to your cart.', true);
      } catch (error) {
        say(error.message || 'Could not add to cart');
        if (button) button.disabled = false;
      }
    };

    paint();
  });
})();
