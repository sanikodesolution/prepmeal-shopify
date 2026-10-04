(function () {
  function fillTicker(root) {
    if (!root) return;

    var track = root.querySelector('.cm-ticker__track');
    var seed = track && track.querySelector('.cm-ticker__group');
    if (!track || !seed) return;

    // Reset to a single seed group before rebuilding
    while (track.children.length > 1) {
      track.removeChild(track.lastChild);
    }
    seed.removeAttribute('aria-hidden');

    var guard = 0;
    while (track.scrollWidth < root.offsetWidth + 40 && guard < 20) {
      var filler = seed.cloneNode(true);
      filler.setAttribute('aria-hidden', 'true');
      filler.querySelectorAll('[data-shopify-editor-block]').forEach(function (el) {
        el.removeAttribute('data-shopify-editor-block');
      });
      track.appendChild(filler);
      guard += 1;
    }

    // Duplicate the filled sequence so -50% animation loops seamlessly
    var sequence = Array.from(track.children);
    sequence.forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('[data-shopify-editor-block]').forEach(function (el) {
        el.removeAttribute('data-shopify-editor-block');
      });
      track.appendChild(clone);
    });

    root.dataset.cmTickerReady = 'true';
  }

  function initAll() {
    document.querySelectorAll('[data-cm-ticker]').forEach(fillTicker);
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.querySelectorAll('[data-cm-ticker]').forEach(function (root) {
        root.dataset.cmTickerReady = 'false';
        fillTicker(root);
      });
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.addEventListener('resize', onResize);
  document.addEventListener('shopify:section:load', function (event) {
    var root = event.target && event.target.querySelector('[data-cm-ticker]');
    if (root) fillTicker(root);
  });
})();
