(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.collapsible-content details').forEach((details) => {
    const summary = details.querySelector('summary');
    const panel = details.querySelector('.accordion__panel');
    if (!summary || !panel) return;

    if (details.hasAttribute('open')) {
      details.classList.add('is-open');
      summary.setAttribute('aria-expanded', 'true');
    }

    summary.addEventListener('click', (event) => {
      event.preventDefault();

      const isOpen = details.classList.contains('is-open');

      if (reduceMotion) {
        if (isOpen) {
          details.classList.remove('is-open');
          details.removeAttribute('open');
          summary.setAttribute('aria-expanded', 'false');
        } else {
          details.setAttribute('open', '');
          details.classList.add('is-open');
          summary.setAttribute('aria-expanded', 'true');
        }
        return;
      }

      if (isOpen) {
        details.classList.remove('is-open');
        summary.setAttribute('aria-expanded', 'false');

        const onEnd = (e) => {
          if (e.target !== panel || e.propertyName !== 'grid-template-rows') return;
          panel.removeEventListener('transitionend', onEnd);
          details.removeAttribute('open');
        };
        panel.addEventListener('transitionend', onEnd);
      } else {
        details.setAttribute('open', '');
        summary.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            details.classList.add('is-open');
          });
        });
      }
    });
  });
})();
