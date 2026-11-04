/**
 * Theme editor helpers for the meal plan page.
 * - Clicking a block/section scrolls it smoothly to the top of the preview.
 * - Interactive order UI is paused so clicks select the editable area instead.
 */
(() => {
  if (!(window.Shopify && window.Shopify.designMode)) return;

  const isMealPlan = (node) =>
    Boolean(node && (node.matches?.('[data-mp-page], .mealplan-page, .mealplan-sec')
      || node.querySelector?.('[data-mp-page], .mealplan-page')
      || node.closest?.('[data-mp-page], .mealplan-page, .mealplan-sec')));

  const scrollSelected = (el) => {
    if (!el || typeof el.scrollIntoView !== 'function') return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    });
  };

  document.addEventListener('shopify:block:select', (event) => {
    if (!isMealPlan(event.target)) return;
    scrollSelected(event.target);
  });

  document.addEventListener('shopify:section:select', (event) => {
    if (!isMealPlan(event.target)) return;
    const page = event.target.querySelector?.('[data-mp-page]') || event.target;
    scrollSelected(page);
  });

  document.documentElement.classList.add('mp-theme-editor');
})();
