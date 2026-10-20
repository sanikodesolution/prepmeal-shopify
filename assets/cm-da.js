(function () {
  if (window.__cmDaInit) return;
  window.__cmDaInit = true;
  var roots = document.querySelectorAll('.da');
  if (!roots.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DURATION = 420;
  var EASING = 'cubic-bezier(.22,.7,.2,1)';

  // Native <details> snaps open and closed, which cannot be transitioned. The
  // summary is intercepted and the body's height is animated instead, so the
  // panel grows and collapses smoothly while the markup stays a real <details>
  // (keyboard, find-in-page and no-JS fallbacks all keep working).
  function enhanceMore(root) {
    var more = root.querySelector('.da__more');
    if (!more || more.dataset.daAnimated === 'true') return;
    var summary = more.querySelector('summary');
    var body = more.querySelector('.da__more-body');
    var inner = more.querySelector('.da__more-inner');
    if (!summary || !body || !inner) return;

    more.dataset.daAnimated = 'true';
    var anim = null;

    function stop() {
      if (anim) {
        anim.cancel();
        anim = null;
      }
    }

    function finishOpen() {
      body.style.height = '';
      body.style.overflow = '';
      more.classList.remove('is-animating');
    }

    function finishClosed() {
      more.open = false;
      body.style.height = '';
      body.style.overflow = '';
      more.classList.remove('is-animating');
    }

    function open() {
      stop();
      more.open = true;
      if (reduce) {
        finishOpen();
        return;
      }
      body.style.overflow = 'hidden';
      body.style.height = '0px';
      var target = inner.offsetHeight;
      more.classList.add('is-animating');
      anim = body.animate(
        [{ height: '0px' }, { height: target + 'px' }],
        { duration: DURATION, easing: EASING, fill: 'both' }
      );
      anim.onfinish = function () {
        anim = null;
        finishOpen();
      };
      anim.oncancel = function () {
        anim = null;
      };
    }

    function close() {
      stop();
      if (reduce) {
        finishClosed();
        return;
      }
      body.style.overflow = 'hidden';
      var from = inner.offsetHeight;
      body.style.height = from + 'px';
      more.classList.add('is-animating');
      anim = body.animate(
        [{ height: from + 'px' }, { height: '0px' }],
        { duration: DURATION, easing: EASING, fill: 'both' }
      );
      anim.onfinish = function () {
        anim = null;
        finishClosed();
      };
      anim.oncancel = function () {
        anim = null;
      };
    }

    summary.addEventListener('click', function (event) {
      event.preventDefault();
      if (more.classList.contains('is-animating')) {
        // Let a second click reverse the current direction instead of stacking
        // animations on top of each other.
        var closing = more.open;
        stop();
        more.classList.remove('is-animating');
        if (closing) close();
        else open();
        return;
      }
      if (more.open) close();
      else open();
    });
  }

  roots.forEach(function (root) {
    root.classList.add('da--js');
    enhanceMore(root);
    var go = function () { root.classList.add('da--ready'); };
    if (!('IntersectionObserver' in window)) { go(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { go(); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(root);
  });
})();
