(function () {
  if (window.__cmDaInit) return;
  window.__cmDaInit = true;
  var roots = document.querySelectorAll('.da');
  if (!roots.length) return;

  roots.forEach(function (root) {
    root.classList.add('da--js');
    var go = function () { root.classList.add('da--ready'); };
    if (!('IntersectionObserver' in window)) { go(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { go(); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(root);
  });
})();
