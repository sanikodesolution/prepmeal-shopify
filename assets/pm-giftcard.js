/* Gift card sections: amount selection updates the variant id, the price text and the live card amount. */
(function () {
  function init(root) {
    if (root.__gcReady) return;
    root.__gcReady = true;
    var idInput = root.querySelector('[data-gc-id]');
    var submit = root.querySelector('[data-gc-submit]');
    var prices = root.querySelectorAll('[data-gc-price]');
    var amounts = root.querySelectorAll('[data-gc-amount]');
    root.querySelectorAll('.gc__radio').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (!radio.checked) return;
        if (idInput && radio.value) idInput.value = radio.value;
        prices.forEach(function (el) { el.textContent = radio.getAttribute('data-price'); });
        amounts.forEach(function (el) { el.textContent = radio.getAttribute('data-amount'); });
        if (submit && idInput) submit.disabled = radio.getAttribute('data-available') === 'false';
      });
    });
  }
  function boot(scope) {
    (scope || document).querySelectorAll('[data-gc]').forEach(init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(); });
  else boot();
  document.addEventListener('shopify:section:load', function (e) { boot(e.target); });
})();
