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

  // Locations list: keep one row of pills and collapse the rest behind a
  // "More locations" button that sits at the end of that first row, so the
  // section is much shorter by default while every area stays reachable.
  function enhancePlaces(root) {
    var list = root.querySelector('.da__deliver-pills');
    var moreItem = list && list.querySelector('.da__places-more');
    var btn = moreItem && moreItem.querySelector('.da__places-btn');
    if (!list || !moreItem || !btn || list.dataset.daPlaces === 'true') return;
    var textEl = moreItem.querySelector('[data-da-places-text]');
    var countEl = moreItem.querySelector('[data-da-places-count]');
    var zones = [];
    Array.prototype.forEach.call(list.children, function (li) {
      if (li.querySelector('.da__zone')) zones.push(li);
    });
    if (zones.length < 2) return;

    list.dataset.daPlaces = 'true';
    var open = false;
    var anim = null;
    var hidden = [];
    var DUR = 380;

    function top(el) { return Math.round(el.offsetTop); }

    // `set` is optional so a split can be measured without committing it.
    function mask(set) {
      var arr = set || hidden;
      zones.forEach(function (li) {
        li.classList.toggle('is-extra', arr.indexOf(li) !== -1);
      });
    }

    function shown(set) {
      var arr = set || hidden;
      return zones.filter(function (li) { return arr.indexOf(li) === -1; });
    }

    function label() {
      if (textEl) textEl.textContent = open ? 'Show less' : 'More locations';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (countEl) countEl.textContent = open ? '' : '+' + hidden.length;
    }

    function settle() {
      if (anim) { anim.cancel(); anim = null; }
      list.classList.remove('is-animating');
      list.style.maxHeight = '';
    }

    // Everything below the first row is hidden; then pills come off that row
    // until the button fits there too, so it never sits on a line by itself.
    function measure() {
      settle();
      mask([]);
      // The button starts hidden so no-JS users see the full list; it has to be
      // visible here or its offsetTop cannot be measured.
      moreItem.hidden = false;
      var firstTop = top(zones[0]);
      hidden = zones.filter(function (li) { return top(li) !== firstTop; });
      mask();
      var guard = 0;
      while (guard++ < zones.length && shown().length > 1 && top(moreItem) !== top(zones[0])) {
        var last = shown().pop();
        if (!last) break;
        hidden.push(last);
        mask();
      }
      moreItem.hidden = hidden.length === 0;
    }

    function run(from, to, done) {
      list.style.maxHeight = from + 'px';
      void list.offsetHeight;
      list.classList.add('is-animating');
      anim = list.animate(
        [{ maxHeight: from + 'px' }, { maxHeight: to + 'px' }],
        { duration: DUR, easing: EASING, fill: 'both' }
      );
      anim.onfinish = function () {
        anim = null;
        list.classList.remove('is-animating');
        list.style.maxHeight = '';
        if (done) done();
      };
      anim.oncancel = function () { anim = null; };
    }

    function expand() {
      var from = list.offsetHeight;
      // Pin the collapsed height before revealing every pill, otherwise the
      // list would snap to full height for one frame before animating.
      list.style.maxHeight = from + 'px';
      mask([]);
      var to = list.scrollHeight;
      if (reduce) { settle(); return; }
      run(from, to, null);
    }

    function collapse() {
      var from = list.offsetHeight;
      mask(hidden);
      var to = list.scrollHeight;
      mask([]);
      if (reduce) { mask(hidden); settle(); return; }
      run(from, to, function () { mask(hidden); });
    }

    btn.addEventListener('click', function () {
      if (anim) settle();
      open = !open;
      label();
      if (open) expand();
      else collapse();
    });

    // Which pills fit on the first row depends only on the available width.
    var width = list.clientWidth;
    var rt = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(rt);
      rt = window.setTimeout(function () {
        if (Math.abs(list.clientWidth - width) < 2) return;
        width = list.clientWidth;
        settle();
        open = false;
        measure();
        label();
      }, 160);
    });

    measure();
    label();

    // Web fonts can land after first paint and change pill widths, which would
    // leave the wrong number of pills on the first row.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (open) return;
        settle();
        measure();
        label();
      });
    }
  }

  roots.forEach(function (root) {
    root.classList.add('da--js');
    enhanceMore(root);
    enhancePlaces(root);
    var go = function () { root.classList.add('da--ready'); };
    if (!('IntersectionObserver' in window)) { go(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { go(); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(root);
  });
})();
