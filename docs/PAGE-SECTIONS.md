# Page sections map

Rule: **one content job per theme section**. Do not nest How-it-works / FAQ / Reviews / Forms inside a single mega-section. Theme editor should show each content area as its own section in the template sidebar.

## Already split (content-wise)

| Template | Sections (order) |
| --- | --- |
| `page.gift-cards` | `cm-gift-card` (buy + strip) → `cm-gift-card-how` → `cm-gift-card-faq` → `cm-gift-card-reviews` |
| `page.private-chef-experience` | `cm-private-chef` (hero + perk strip) → `cm-private-chef-occasions` → `cm-private-chef-expect` → `cm-private-chef-steps` → `cm-private-chef-quote` |
| `page.meal-plans` + `page.*-meal-plan` | `cm-mp-order` → hero → benefits → menu grid → thali → explore → chef → steps → delivery → reviews → faq → related → cta |
| `page.about` | story → usp → cta |
| `page.how-it-works` | hero → steps → good_to_know → cta |
| `page.contact` | main → contact_page |
| `page.custom-meal-plans` | main → intro → form |
| `page.faqs` | main + multiple collapsible content sections |

## Intentionally single-section

| Template | Why |
| --- | --- |
| `page.gift-card-editor` | One interactive editor UI (preview + controls) |
| `page.json` | Default Shopify page body |
| `404` / `search` / `blog` / `collection` | System templates, not marketing pages |

## Gift card editor notes

- Live preview + Bengali customization panel
- Card size + typography controls (font family/weight/per-line sizes, min **14px**)
- Do **not** load fonts from a local Downloads folder; use theme fonts or Google fonts loaded by the editor JS

## Adding content to a page

1. Prefer **Add section** in the theme editor over stuffing new blocks into an unrelated mega-section.
2. Keep section names short and content-scoped (`GC FAQ`, `PC steps`, `MP reviews`).
3. After local edits: push live theme `#188743614770`, then sync GitHub `main` (`prepmeal-shopify`).
