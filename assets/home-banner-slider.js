(() => {
  const roots = document.querySelectorAll('[data-home-banner-slider]');
  if (!roots.length) return;
  const instances = new WeakMap();

  const loadGsap = (root) => {
    if (window.gsap) return Promise.resolve(window.gsap);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return Promise.resolve(null);
    const src = root.dataset.gsapSrc;
    if (!src) return Promise.resolve(null);

    const existing = document.querySelector('script[data-home-banner-gsap]');
    if (existing) {
      return new Promise((resolve) => {
        if (window.gsap) return resolve(window.gsap);
        existing.addEventListener('load', () => resolve(window.gsap || null), { once: true });
        existing.addEventListener('error', () => resolve(null), { once: true });
      });
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.homeBannerGsap = 'true';
      script.addEventListener('load', () => resolve(window.gsap || null), { once: true });
      script.addEventListener('error', () => resolve(null), { once: true });
      document.head.appendChild(script);
    });
  };

  const initialize = (root) => {
    if (root.dataset.hbsReady === 'true') return;
    root.dataset.hbsReady = 'true';
    const controller = new AbortController();

    const slides = Array.from(root.querySelectorAll('[data-hbs-slide]'));
    if (!slides.length) return;

    const previous = root.querySelector('[data-hbs-prev]');
    const next = root.querySelector('[data-hbs-next]');
    const toggle = root.querySelector('[data-hbs-toggle]');
    const progress = root.querySelector('[data-hbs-progress]');
    const status = root.querySelector('[data-hbs-status]');
    const interval = Math.max(4000, Number(root.dataset.interval) || 7000);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canAutoplay = root.dataset.autoplay === 'true' && !reducedMotion && slides.length > 1;

    let gsap = null;
    let active = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    let animating = false;
    let userPaused = !canAutoplay;
    let timer = 0;
    let progressTween = null;
    let hovered = false;
    let focused = false;
    let destroyed = false;

    if (toggle) toggle.hidden = !canAutoplay;

    const markActive = (index, announce = false) => {
      slides.forEach((slide, i) => {
        const selected = i === index;
        slide.classList.toggle('is-active', selected);
        slide.setAttribute('aria-hidden', selected ? 'false' : 'true');
        slide.inert = !selected;
      });
      if (announce && status) status.textContent = `Slide ${index + 1} of ${slides.length}`;
    };

    const splitHeadingWords = (heading) => {
      if (!heading || heading.dataset.hbsSplit === 'true') return;
      const label = heading.textContent.trim();
      const fragment = document.createDocumentFragment();
      label.split(/(\s+)/).forEach((piece) => {
        if (!piece) return;
        if (/^\s+$/.test(piece)) {
          fragment.appendChild(document.createTextNode(piece));
          return;
        }
        const windowSpan = document.createElement('span');
        const word = document.createElement('span');
        windowSpan.className = 'home-banner-slider__word-window';
        windowSpan.setAttribute('aria-hidden', 'true');
        word.className = 'home-banner-slider__word';
        word.dataset.hbsWord = 'true';
        word.textContent = piece;
        windowSpan.appendChild(word);
        fragment.appendChild(windowSpan);
      });
      heading.replaceChildren(fragment);
      heading.setAttribute('aria-label', label);
      heading.dataset.hbsSplit = 'true';
    };

    slides.forEach((slide) => splitHeadingWords(slide.querySelector('[data-hbs-heading]')));

    const clearProgress = () => {
      window.clearTimeout(timer);
      timer = 0;
      if (progressTween) {
        progressTween.kill();
        progressTween = null;
      }
      if (progress) progress.style.transform = 'scaleX(0)';
    };

    instances.set(root, () => {
      destroyed = true;
      controller.abort();
      clearProgress();
    });

    const goTo = (requested, announce = true) => {
      if (slides.length < 2 || animating) return;
      const targetIndex = (requested + slides.length) % slides.length;
      if (targetIndex === active) return;

      const oldIndex = active;
      const oldSlide = slides[oldIndex];
      const newSlide = slides[targetIndex];
      active = targetIndex;
      markActive(active, announce);

      if (!gsap || reducedMotion) {
        schedule();
        return;
      }

      animating = true;
      const oldImages = Array.from(oldSlide.querySelectorAll('.banner__media img'));
      const newImages = Array.from(newSlide.querySelectorAll('.banner__media img'));
      const newCopy = newSlide.querySelectorAll('.banner__text, .banner__buttons');
      const newWords = newSlide.querySelectorAll('[data-hbs-word]');

      gsap.killTweensOf([oldSlide, newSlide, ...oldImages, ...newImages, ...newCopy, ...newWords]);
      gsap.set(oldSlide, { autoAlpha: 1, zIndex: 2, x: 0, clipPath: 'inset(0)' });
      gsap.set(newSlide, { autoAlpha: 1, visibility: 'visible', zIndex: 3, x: 0, clipPath: 'inset(0 0 0 100%)' });
      gsap.set(newImages, { scale: 1.13, transformOrigin: 'center center' });
      gsap.set(newCopy, { autoAlpha: 0, y: 24 });
      gsap.set(newWords, { yPercent: 120, rotate: 2.5, transformOrigin: 'left bottom' });

      const transition = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          gsap.set(oldSlide, { autoAlpha: 0, visibility: 'hidden', zIndex: 0, clearProps: 'clipPath,transform' });
          gsap.set(newSlide, { autoAlpha: 1, visibility: 'visible', zIndex: 1, clearProps: 'clipPath,transform' });
          gsap.set(oldImages, { clearProps: 'transform' });
          gsap.set(newImages, { clearProps: 'transform' });
          gsap.set(newCopy, { clearProps: 'opacity,visibility,transform' });
          animating = false;
          schedule();
        },
      })
        .to(oldSlide, { x: -22, autoAlpha: 0, duration: 0.58, ease: 'power2.inOut' }, 0)
        .to(newSlide, { clipPath: 'inset(0 0 0 0)', duration: 1.05, ease: 'power4.inOut' }, 0)
        .to(newWords, { yPercent: 0, rotate: 0, duration: 0.85, stagger: 0.035, ease: 'power4.out' }, 0.25)
        .to(newCopy, { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.09, ease: 'power3.out' }, 0.48);
      if (newImages.length) transition.to(newImages, { scale: 1, duration: 1.45, stagger: 0.08, ease: 'power2.out' }, 0);
    };

    const schedule = () => {
      clearProgress();
      if (destroyed || userPaused || hovered || focused || document.hidden || !canAutoplay) return;
      if (progress && gsap) {
        progressTween = gsap.to(progress, {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: interval / 1000,
          ease: 'none',
          onComplete: () => goTo(active + 1, false),
        });
      } else {
        timer = window.setTimeout(() => goTo(active + 1, false), interval);
      }
    };

    const resetAutoplay = () => {
      clearProgress();
      schedule();
    };

    previous?.addEventListener('click', () => { goTo(active - 1); resetAutoplay(); }, { signal: controller.signal });
    next?.addEventListener('click', () => { goTo(active + 1); resetAutoplay(); }, { signal: controller.signal });
    toggle?.addEventListener('click', () => {
      userPaused = !userPaused;
      toggle.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      toggle.setAttribute('aria-label', userPaused ? 'Play automatic slide show' : 'Pause automatic slide show');
      resetAutoplay();
    }, { signal: controller.signal });

    root.addEventListener('mouseenter', () => { hovered = true; clearProgress(); }, { signal: controller.signal });
    root.addEventListener('mouseleave', () => { hovered = false; schedule(); }, { signal: controller.signal });
    root.addEventListener('focusin', () => { focused = true; clearProgress(); }, { signal: controller.signal });
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) { focused = false; schedule(); }
    }, { signal: controller.signal });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(active - 1); resetAutoplay(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(active + 1); resetAutoplay(); }
    }, { signal: controller.signal });
    const viewport = root.querySelector('[data-hbs-viewport]');
    let touchStartX = null;
    let didSwipe = false;
    viewport?.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') touchStartX = event.clientX;
    }, { passive: true, signal: controller.signal });
    viewport?.addEventListener('pointerup', (event) => {
      if (touchStartX === null) return;
      const distance = event.clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) < 48) return;
      didSwipe = true;
      goTo(active + (distance < 0 ? 1 : -1));
      resetAutoplay();
      window.setTimeout(() => { didSwipe = false; }, 0);
    }, { passive: true, signal: controller.signal });
    viewport?.addEventListener('pointercancel', () => { touchStartX = null; }, { passive: true, signal: controller.signal });
    viewport?.addEventListener('click', (event) => {
      if (!didSwipe) return;
      event.preventDefault();
      event.stopPropagation();
    }, { capture: true, signal: controller.signal });
    document.addEventListener('visibilitychange', () => document.hidden ? clearProgress() : schedule(), { signal: controller.signal });

    markActive(active, true);
    loadGsap(root).then((loadedGsap) => {
      if (destroyed) return;
      gsap = loadedGsap;
      if (gsap && progress) gsap.set(progress, { scaleX: 0, transformOrigin: 'left center' });
      if (gsap) {
        const first = slides[active];
        const firstWords = first.querySelectorAll('[data-hbs-word]');
        const firstCopy = first.querySelectorAll('.banner__text, .banner__buttons');
        const firstImages = first.querySelectorAll('.banner__media img');
        gsap.set(firstWords, { yPercent: 120, rotate: 2.5, transformOrigin: 'left bottom' });
        gsap.set(firstCopy, { autoAlpha: 0, y: 20 });
        gsap.set(firstImages, { scale: 1.07, transformOrigin: 'center center' });
        const intro = gsap.timeline({ onComplete: schedule });
        intro.to(firstWords, { yPercent: 0, rotate: 0, duration: 0.9, stagger: 0.035, ease: 'power4.out' }, 0.08)
          .to(firstCopy, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, 0.34);
        if (firstImages.length) intro.to(firstImages, { scale: 1, duration: 1.35, stagger: 0.08, ease: 'power2.out' }, 0);
      } else {
        schedule();
      }
    });
  };

  const slidersIn = (container) => {
    const sliders = Array.from(container.querySelectorAll('[data-home-banner-slider]'));
    if (container.matches?.('[data-home-banner-slider]')) sliders.unshift(container);
    return sliders;
  };

  roots.forEach(initialize);
  document.addEventListener('shopify:section:load', (event) => slidersIn(event.target).forEach(initialize));
  document.addEventListener('shopify:section:unload', (event) => {
    slidersIn(event.target).forEach((root) => {
      instances.get(root)?.();
      instances.delete(root);
      delete root.dataset.hbsReady;
    });
  });
})();
