(function () {
  function mod(a, b) { return ((a % b) + b) % b; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function start(root) {
    if (root._tw) return;
    var stage = root.querySelector('[data-tw-stage]');
    var ring = root.querySelector('[data-tw-ring]');
    var ring2 = root.querySelector('[data-tw-ring2]');
    var plates = [].slice.call(root.querySelectorAll('.tw__plate'));
    if (!stage || plates.length < 2) return;
    root._tw = true;

    var n = plates.length;
    var step = 360 / n;
    var rot = 0;
    var target = 0;
    var anim = 0;
    var timer = 0;
    var scrubbing = false;
    var drive = 0;
    var vis = true;
    var hovered = null;
    var drag = null;
    var justDragged = false;
    var g = { size: 300, R: 200, cx: 0, cy: 0 };
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function measure() {
      var w = stage.clientWidth;
      var h = stage.clientHeight;
      var m = window.innerWidth < 990;
      var size = m ? Math.max(160, Math.min(w * 0.5, 240)) : Math.max(220, Math.min(h * 0.38, 340));
      var slot = Math.min(step, 90) * Math.PI / 180;
      var R = (h / 2) / Math.sin(slot);
      var ax = m ? w * 0.5 : w * 0.62;
      g = { size: size, R: R, cx: ax - R, cy: h / 2 };
      stage.style.setProperty('--s', size + 'px');
      var rr = R + size * 0.65;
      ring.style.width = ring.style.height = rr * 2 + 'px';
      ring.style.transform = 'translate(' + (g.cx - rr) + 'px,' + (g.cy - rr) + 'px)';
      var ir = Math.max(rr - 200, 0);
      ring2.style.width = ring2.style.height = ir * 2 + 'px';
      ring2.style.transform = 'translate(' + (g.cx - ir) + 'px,' + (g.cy - ir) + 'px)';
    }

    function render() {
      for (var i = 0; i < n; i++) {
        var a = mod(i * step - rot + 180, 360) - 180;
        var ab = Math.abs(a);
        var rad = a * Math.PI / 180;
        var x = g.cx + g.R * Math.cos(rad) - g.size / 2;
        var y = g.cy + g.R * Math.sin(rad) - g.size / 2;
        var neighbor = Math.abs(ab - step) < 10;
        var front = ab < 8;
        var sc = front ? 1 : (neighbor ? 0.96 : Math.max(0.7, 1 - ab / 200));
        if (hovered === plates[i] && front) sc = 1.1;
        var op = Math.max(0, 1 - Math.pow(ab / 140, 2));
        var el = plates[i];
        var label = el.querySelector('.tw__label');
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
        el.style.opacity = op.toFixed(3);
        el.style.zIndex = String(200 - Math.round(ab));
        el.style.pointerEvents = op < 0.15 ? 'none' : 'auto';
        if (label) label.style.opacity = Math.max(0, 1 - ab / (step * 0.55)).toFixed(3);
      }
    }

    function go(t, ms) {
      target = t;
      if (reduce) { rot = t; render(); return; }
      var from = rot;
      var startAt = performance.now();
      cancelAnimationFrame(anim);
      (function tick(now) {
        var p = Math.min((now - startAt) / (ms || 1100), 1);
        rot = from + (target - from) * ease(p);
        render();
        if (p < 1) anim = requestAnimationFrame(tick);
      })(startAt);
    }

    function sched() {
      clearTimeout(timer);
      if (reduce || !vis || document.hidden || drag || scrubbing) return;
      timer = setTimeout(function () { go(target + step); sched(); }, 3500);
    }

    function steer(e) {
      if (drag || reduce || e.pointerType === 'touch') return;
      var rect = stage.getBoundingClientRect();
      if (!rect.height) return;
      var fromCenter = (e.clientY - rect.top) / rect.height - 0.5;
      var dead = 0.11;
      if (Math.abs(fromCenter) <= dead) {
        if (!scrubbing) return;
        scrubbing = false;
        drive = 0;
        target = rot;
        sched();
        return;
      }
      if (!scrubbing) {
        scrubbing = true;
        cancelAnimationFrame(anim);
        clearTimeout(timer);
      }
      var mag = (Math.abs(fromCenter) - dead) / (0.5 - dead);
      mag = mag * mag * (3 - 2 * mag);
      drive = (fromCenter > 0 ? 1 : -1) * mag * 280;
    }

    plates.forEach(function (el, i) {
      function pick() {
        if (justDragged) return;
        var a = mod(i * step - target + 180, 360) - 180;
        if (Math.abs(a) > 0.01) go(target + a);
        sched();
      }
      el.addEventListener('pointerenter', function () { hovered = el; render(); });
      el.addEventListener('pointerleave', function () {
        if (hovered === el) hovered = null;
        render();
      });
      el.addEventListener('click', pick);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
    });

    stage.addEventListener('dragstart', function (e) { e.preventDefault(); });
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      cancelAnimationFrame(anim);
      clearTimeout(timer);
      drive = 0;
      scrubbing = false;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, rot: rot, moved: false, vel: 0, lt: performance.now(), lr: rot };
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) {
        steer(e);
        return;
      }
      var d = window.innerWidth < 990 ? e.clientX - drag.x : e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(d) < 6) return;
        drag.moved = true;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        root.classList.add('dragging');
      }
      rot = drag.rot - (d / g.R) * 180 / Math.PI;
      var now = performance.now();
      var dt = now - drag.lt;
      if (dt > 16) { drag.vel = (rot - drag.lr) / dt; drag.lt = now; drag.lr = rot; }
      render();
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var moved = drag.moved;
      var vel = drag.vel;
      drag = null;
      root.classList.remove('dragging');
      if (!moved) { sched(); return; }
      justDragged = true;
      setTimeout(function () { justDragged = false; }, 0);
      var push = Math.max(-step * 2, Math.min(step * 2, vel * 220));
      target = Math.round((rot + push) / step) * step;
      go(target, 800);
      sched();
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('mouseleave', function () {
      drive = 0;
      scrubbing = false;
      sched();
    });
    var lastTick = performance.now();
    (function frame(now) {
      var dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      if (!drag && !reduce && Math.abs(drive) > 0.01) {
        cancelAnimationFrame(anim);
        rot += drive * dt;
        target = rot;
        render();
      }
      requestAnimationFrame(frame);
    })(lastTick);
    document.addEventListener('visibilitychange', sched);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        vis = entries[0].isIntersecting;
        sched();
      }, { threshold: 0.2 }).observe(root);
    }
    if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); render(); }).observe(stage);
    window.addEventListener('resize', function () { measure(); render(); });
    measure();
    render();
    sched();
  }

  function boot() {
    document.querySelectorAll('[data-thali-wheel]').forEach(start);
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('shopify:section:load', function () { setTimeout(boot, 60); });
})();
