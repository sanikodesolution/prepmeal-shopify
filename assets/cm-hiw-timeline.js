(function () {
  function initHiw(root) {
    if (!root || root.dataset.cmHiwReady === 'true') return;

    var list = root.querySelector('.cm-hiw__steps');
    if (!list) return;

    var steps = list.querySelectorAll('.cm-hiw-step');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function paint(all) {
      var mark = window.innerHeight * 0.6;
      var rect = list.getBoundingClientRect();
      var progress = all ? 1 : Math.min(1, Math.max(0, (mark - rect.top) / rect.height));
      root.style.setProperty('--p', progress.toFixed(3));

      steps.forEach(function (step) {
        var num = step.querySelector('.cm-hiw-step__num');
        if (!num) return;
        var n = num.getBoundingClientRect();
        step.classList.toggle('is-reached', all || n.top + n.height / 2 < mark);
      });
    }

    root.dataset.cmHiwReady = 'true';

    if (reduce) {
      paint(true);
      return;
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        paint(false);
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint(false);
  }

  function initAll() {
    document.querySelectorAll('[data-cm-hiw]').forEach(initHiw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var root = event.target && event.target.querySelector('[data-cm-hiw]');
    if (root) {
      root.dataset.cmHiwReady = 'false';
      initHiw(root);
    }
  });
})();
