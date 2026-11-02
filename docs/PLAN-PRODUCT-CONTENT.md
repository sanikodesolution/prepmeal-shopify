# Plan Product Content Guide

How to edit every word, meal, photo and price on a meal plan page from
**Shopify Admin → Products**, with no code and no theme editor.

The plan page reads its content from one product. On this store that product is
`6-meal-plan` (Products → 6 Meal Plan). The same setup works for 5, 7, 10 and 15
meal plans by pointing each page at its own product.

---

## 1. How the wiring works

| What you edit | Where | What it changes on the page |
|---|---|---|
| The product title | Products → *product* → Title | Order panel heading, cart line name |
| The variant options | Products → *product* → Variants | The meal list, order dropdowns, filters, meal detail panel |
| Variant price | Products → *product* → Variants → Price | Cart price and the plan total |
| Variant image | Products → *product* → Variants → Image | The meal photo everywhere it appears |
| Variant metafields | Products → *product* → Variants → the variant | Calories, protein, carbs, fat, ingredients, diet tags |
| Product metafields | Products → *product* → Metafields | Every heading, paragraph, FAQ, review and card on the page |

A field left empty falls back to the theme editor setting for that spot, so the
page never breaks while you are part-way through filling the product in.

---

## 2. Meals: one variant per meal

1. Products → **6 Meal Plan** → **Variants**.
2. Make sure the option is named **Meal** (the first meal name becomes the
   option name automatically).
3. Each variant title is one meal, exactly as it should read on the page:
   `Chimichurri Steak`, `Orange Basil Salmon`, and so on.
4. Add a photo, price and stock status to each variant.

The order of variants is the order of meals on the page.

### Variant metafields

Add these on each variant. Settings → Custom data → Products → **Variants**
first, then fill them per variant.

| Metafield (namespace.key) | Type | Example | Shown as |
|---|---|---|---|
| `custom.short_name` | Single line text | `Butter Chicken` | Short label in the menu list, meal cards and the order dropdowns. Blank uses the full variant title |
| `custom.description` | Single line text | `With roasted potatoes and glazed carrots.` | Under the meal name |
| `custom.calories` | Integer | `623` | Centre of the nutrition ring |
| `custom.protein` | Integer | `52` | Protein bar, in grams |
| `custom.carbs` | Integer | `34` | Carbs bar, in grams |
| `custom.fat` | Integer | `31` | Fat bar, in grams |
| `custom.ingredients` | List of single line text | `Roasted potatoes`, `Glazed carrots` | Ingredient chips |
| `custom.diet_tags` | List of single line text | `Gluten free`, `Dairy free` | Filter buttons and diet chips |
| `custom.allergens` | List of single line text | `Milk`, `Nuts` | "Contains" list in the meal detail |
| `custom.reheat_instructions` | Multi-line text | `Microwave 2–3 minutes.` | "Heating" note in the meal detail |
| `custom.badge` | Single line text | `Chef's special` | Ribbon on the meal card |

Diet tags drive the diet chips automatically: any tag containing **gluten**
adds a *Gluten free* chip, any tag containing **dairy** adds a *Dairy free*
chip. You do not need to tick anything else.

If you leave the variant metafields empty, the page uses the same metafields on
the **product** instead, so one shared set of nutrition values applies to every
meal. Variant values always win over product values.

---

## 3. Page copy: product metafields

Products → **6 Meal Plan** → **Metafields**. Add each key below. Text and
single-line fields hold one value; the *list* fields hold one row per line.

### Hero

| Key | Type | What it says |
|---|---|---|
| `custom.plan_label` | Single line text | Small label above the headline, e.g. `6 Meal Plan` |
| `custom.heading` | Multi-line text | The big headline; each line break becomes a line |
| `custom.subheading` | Multi-line text | The paragraph under the headline |
| `custom.fact_1_label` / `custom.fact_1_value` | Single line text | First fact pill, e.g. `Price` / `From $89.00` |
| `custom.fact_2_label` / `custom.fact_2_value` | Single line text | Second fact, e.g. `Meals` / `6 per week` |
| `custom.fact_3_label` / `custom.fact_3_value` | Single line text | Third fact, e.g. `Menu` / `10+ options` |
| `custom.button_label` / `custom.button_label_2` | Single line text | Hero button labels |
| `custom.badge_value` / `custom.badge_label` | Single line text | Round badge, e.g. `10+` / `meal options` |

### Benefits band

| Key | Type | What it says |
|---|---|---|
| `custom.benefits` | List of single line text | The scrolling stat rail. One row per item as `value\|label`, e.g. `24oz\|Per container` |
| `custom.ben_eyebrow` | Single line text | Small line above the headline |
| `custom.ben_line_1` / `_2` / `_3` | Single line text | The three headline lines; line 3 prints outlined |
| `custom.ben_note` | Multi-line text | Paragraph under the headline |

### Menu block

| Key | Type | What it says |
|---|---|---|
| `custom.menu_eyebrow` | Single line text | Small label at the top of the meal list |
| `custom.menu_heading` | Single line text | Heading beside the meal list |
| `custom.menu_text` | Multi-line text | Line under that heading |
| `custom.menu_button` | Single line text | Button under the meal list |
| `custom.total_label` | Single line text | Label of the plan total, e.g. `Plan total` |
| `custom.explore_heading` | Single line text | Heading above the filterable meal grid |
| `custom.load_more_label` | Single line text | Text on the "load more" button |
| `custom.detail_note` | Single line text | Footnote under the meal detail panel |
| `custom.menu_modal_heading` / `custom.menu_caption` / `custom.picker_placeholder` / `custom.order_panel_title` | Single line text | Text on the weekly menu sheet, its caption, the dropdown placeholder and the order panel heading |

### Chef, steps and quality

| Key | Type | What it says |
|---|---|---|
| `custom.chef_eyebrow` / `custom.chef_heading` / `custom.chef_text` | Text | The chef story block |
| `custom.steps_eyebrow` / `custom.steps_heading` | Text | Heading of the how-it-works block |
| `custom.steps` | List of single line text | One step per row as `title\|text` |
| `custom.quality_points` | List of single line text | One row as `title\|text\|detail` |

### Ghar Ka Khana panel (`thali_*`)

Shown between the meal detail panel and the Explore grid when **Show the Ghar Ka
Khana panel** is ticked in the theme editor. Every line reads its `custom.thali_*`
metafield first and falls back to the theme editor setting.

| Key | Type | What it says |
|---|---|---|
| `custom.thali_badge` / `custom.thali_heading` / `custom.thali_intro` | Text | Badge, headline and intro paragraph |
| `custom.thali_plate_alt` | Single line text | Alt text of the plate photo |
| `custom.thali_image` | File (image) | Plate photo. Blank uses the bundled cut-out plate |
| `custom.thali_stats` | List of single line text | One row as `value\|label` |
| `custom.thali_chips` | List of single line text | The labels around the plate |
| `custom.thali_cards` | List of single line text | One card per row as `title\|text` |
| `custom.thali_delivery_heading` / `custom.thali_delivery_text` | Text | Delivery block |
| `custom.thali_tickets` | List of single line text | One row as `day\|window\|order-by label\|order-by value` |
| `custom.thali_cutoff_note` | Multi-line text | Note under the tickets |
| `custom.thali_fresh_heading` / `custom.thali_fresh_text` | Text | Fresh block |
| `custom.thali_steps` | List of single line text | One row as `title\|text` |
| `custom.thali_towns` | List of single line text | Delivery towns, one per row |
| `custom.thali_cta_heading` / `_text` / `_label` / `_note` | Text | Closing panel copy |
| `custom.thali_cta_link` | URL | Panel button link |
| `custom.thali_facts` | List of single line text | One row as `value\|label` |

Panel colours stay in the theme editor, because they are design, not content.

### Delivery

| Key | Type | What it says |
|---|---|---|
| `custom.delivery_eyebrow` / `custom.delivery_heading` / `custom.delivery_text` | Text | Delivery block copy |

Town lists, the map coordinates and the checker messages stay in the theme
editor, because they are not per-product content.

### Reviews, FAQ, related plans, CTA

| Key | Type | What it says |
|---|---|---|
| `custom.reviews_eyebrow` / `custom.reviews_heading` | Single line text | Reviews heading |
| `custom.reviews` | List of single line text | One review per row as `name\|rating\|review\|aspect\|show image\|image`. `aspect` is the photo ratio (`1` square, `1.3` wide); `show image` is `1` or `0` |
| `custom.faq_eyebrow` / `custom.faq_heading` | Single line text | FAQ heading |
| `custom.faq` | List of single line text | One question per row as `question\|answer` |
| `custom.related_eyebrow` / `custom.related_heading` | Single line text | Related plans heading |
| `custom.related_plans` | List of single line text | One card per row as `title\|text\|product handle\|button label\|price note`. The handle pulls that plan's photo and link, e.g. `10 Meal Plan\|Ten meals from the weekly menu.\|10-meal-plan\|View plan\|Price at checkout` |
| `custom.cta_eyebrow` / `custom.cta_heading` / `custom.cta_text` / `custom.cta_button_label` | Text | Closing call to action |

Review photos: a product metafield cannot hold an image per row, so review rows
with `show image` set to `1` use the theme's bundled food photos. If a review
needs a specific photo, keep that review as a theme editor block instead.

---

## 4. Pointing a page at its product

1. Online Store → **Customize** → open the plan page.
2. Select the **CM meal plan page** section.
3. Under **Content source → Plan product**, choose the plan product,
   e.g. `6 Meal Plan`.
4. Save.

Once that is set, the theme editor fields act only as fallbacks, so day-to-day
editing happens entirely in Products.

---

## 5. Publishing the definitions

Metafield definitions are store data, not theme files, so they are created once
in Admin. For each key above:

1. Settings → **Custom data** → **Products** (or **Variants** for the meal
   fields) → **Add definition**.
2. Name it for your team, e.g. `Calories`.
3. Set the namespace and key to exactly `custom.calories` — the namespace box
   must say `custom`.
4. Pick the type from the tables above.
5. Save, then fill the values on the product or variant.

Checklist before you publish:

- [ ] The plan product has one variant per meal, each with a price and photo
- [ ] Every meal variant has calories, protein, carbs and fat
- [ ] Diet tags are correct, so the gluten-free and dairy-free chips are right
- [ ] Allergens are filled in and accurate
- [ ] The section's **Plan product** field points at the right product
- [ ] The page shows six dropdowns (**Order dropdowns** = `6`) if you sell it as a
      build-your-own box
