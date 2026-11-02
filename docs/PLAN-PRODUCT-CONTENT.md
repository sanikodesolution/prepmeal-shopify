# Meal Plan Pages — Admin Content Guide

Everything on a meal plan page is edited in **Shopify Admin**. No theme editor,
no code.

Five pages use this system: 5, 6, 7, 10 and 15 Meal Plans. Each one is a page
template (`templates/page.N-meal-plan.json`) rendered by
`sections/cm-meal-plan-page.liquid`.

---

## 1. How content resolves

Each piece of content is looked up in this order, and the first non-empty value
wins:

```
1. Plan product metafield      Products → <plan product> → Metafields
2. Shop-level shared metafield Settings → Custom data → Shop → Metafields
3. Theme editor setting        Online Store → Customize → the section
4. Hardcoded default           Built into the theme
```

Because of step 2, content that is identical on all five plans (FAQ,
testimonials, how-it-works steps, delivery towns, chef story) is entered **once**
and every plan page picks it up. A plan that needs its own version fills the
matching product metafield and that wins instead.

A blank value never renders an empty heading or a broken image: it falls through
to the next source, and the section hides the wrapper when the final value is
still blank.

**Metafield namespace is always `custom`.**

---

## 2. What to fill where

| I want to change... | Edit this | Level |
|---|---|---|
| Plan headline, price fact, plan badge | `custom.heading`, `custom.fact_*`, `custom.badge_*` | Per product |
| Stats strip numbers (24oz, 2-3 min, Fresh...) | `stat_item` list → `custom.stats` | Shop shared |
| Hero tagline ("6 meals. 1 week. Zero stress.") | `custom.ben_line_1/2/3`, `custom.ben_eyebrow` | Per product |
| The meals, their photos, macros, badges | Product **variants** + variant metafields | Per product |
| Explore grid filters | Variant `custom.diet_tags` | Per variant |
| Chef story text | `custom.chef_eyebrow/heading/text` | Shop shared |
| Chef story photos | `custom.chef_image_1`, `custom.chef_image_2` (file) | Shop shared |
| The two feature cards | `feature_card` metaobject list → `custom.feature_cards` | Shop shared |
| Delivery days, cutoff, towns | `delivery_area` metaobject list → `custom.delivery_area_list` | Shop shared |
| How it works steps | `how_it_works_step` metaobject list → `custom.how_it_works` | Shop shared |
| Testimonials | `testimonial` metaobject list → `custom.testimonials` | Shop shared |
| FAQ | `faq_item` metaobject list → `custom.faq_items` | Shop shared |
| Other plans cards | `meal_plan` metaobject list → `custom.plan_cards` | Shop shared |
| Final CTA text + background | `custom.cta_eyebrow/heading/text`, `custom.cta_image`, `custom.cta_button_link` | Per product |
| Hero photos | `custom.hero_image_1/2` + `_alt` | Per product or shop |
| Meal gallery heading | `custom.gallery_eyebrow/heading` | Per product or shop |
| Delivery map + ZIP labels | `custom.delivery_*`, `custom.plate_*` | Per product or shop |
| Button wording on meal cards | Theme editor → section → Meal card link label | Theme |

---

## 3. Step 1 — Products and variants

### 3.1 One variant per meal

1. Products → **6 Meal Plan** → **Variants**.
2. The option must be named **Meal**.
3. Each variant title is one meal, exactly as it should read: `Chimichurri Steak`.
4. Give each variant a price, a photo and stock status.

Variant order is the order meals appear. Prices and stock always come from the
variant, so the order box keeps charging what Shopify charges.

### 3.2 Variant metafields

Settings → **Custom data** → **Products** → **Variants** → Add definition.
Create these once, then fill them per variant.

| Name | Namespace and key | Type | Notes |
|---|---|---|---|
| Short name | `custom.short_name` | Single line text | Card and dropdown label. Blank uses the variant title |
| Description | `custom.description` | Single line text | Line under the meal name |
| Calories | `custom.calories` | Integer | Nutrition ring centre |
| Protein | `custom.protein` | Integer | Grams |
| Carbs | `custom.carbs` | Integer | Grams |
| Fat | `custom.fat` | Integer | Grams |
| Ingredients | `custom.ingredients` | List of single line text | One per row |
| Diet tags | `custom.diet_tags` | List of single line text | One per row, e.g. `Gluten free`. Drives the filter chips |
| Allergens | `custom.allergens` | List of single line text | One per row |
| Reheat instructions | `custom.reheat_instructions` | Multi-line text | Shown as "Heating" |
| Badge | `custom.badge` | Single line text | Ribbon on the card, e.g. `Chef's special` |

Diet tags are matched on the text: any tag containing **gluten** adds the
*Gluten free* chip, any tag containing **dairy** adds *Dairy free*. Nothing else
needs ticking.

### 3.3 Product metafields (per plan)

Settings → **Custom data** → **Products** → Add definition. Fill on each plan
product.

| Name | Namespace and key | Type |
|---|---|---|
| Plan label | `custom.plan_label` | Single line text |
| Heading | `custom.heading` | Multi-line text |
| Subheading | `custom.subheading` | Multi-line text |
| Fact 1 label / value | `custom.fact_1_label`, `custom.fact_1_value` | Single line text |
| Fact 2 label / value | `custom.fact_2_label`, `custom.fact_2_value` | Single line text |
| Fact 3 label / value | `custom.fact_3_label`, `custom.fact_3_value` | Single line text |
| Hero buttons | `custom.button_label`, `custom.button_label_2` | Single line text |
| Plan badge | `custom.badge_value`, `custom.badge_label` | Single line text |
| Stats strip headline | `custom.ben_eyebrow`, `custom.ben_line_1`, `_2`, `_3`, `custom.ben_note` | Single line / multi-line text |
| Menu block copy | `custom.menu_eyebrow`, `custom.menu_heading`, `custom.menu_text`, `custom.menu_button` | Text |
| Explore heading | `custom.explore_heading` | Single line text |
| Load more label | `custom.load_more_label` | Single line text |
| Meal detail footnote | `custom.detail_note` | Single line text |
| Plan total label | `custom.total_label` | Single line text |
| Weekly menu sheet | `custom.menu_modal_heading`, `custom.menu_caption`, `custom.picker_placeholder`, `custom.order_panel_title` | Single line text |
| Chef story | `custom.chef_eyebrow`, `custom.chef_heading`, `custom.chef_text` | Text |
| Chef photos | `custom.chef_image_1`, `custom.chef_image_2` | File (image) |
| Steps heading | `custom.steps_eyebrow`, `custom.steps_heading` | Single line text |
| Delivery copy | `custom.delivery_eyebrow`, `custom.delivery_heading`, `custom.delivery_text` | Text |
| Delivery map | `custom.delivery_map_query`, `custom.delivery_map_title` | Single line text |
| Hero photos | `custom.hero_image_1`, `custom.hero_image_2` | File (image) |
| Hero photo alt text | `custom.hero_image_1_alt`, `custom.hero_image_2_alt` | Single line text |
| Meal gallery copy | `custom.gallery_eyebrow`, `custom.gallery_heading` | Single line / multi-line text |
| Calories label | `custom.calories_label` | Single line text, default `calories` |
| Diet chip labels | `custom.diet_gluten_label`, `custom.diet_dairy_label` | Single line text |
| Quality-points eyebrow | `custom.quality_eyebrow` | Single line text |
| Screen-reader labels | `custom.filter_meals_label`, `custom.gallery_prev_label`, `custom.gallery_next_label` | Single line text |
| Delivery / map labels | `custom.delivery_placeholder`, `custom.delivery_button`, `custom.delivery_areas_title`, `custom.plate_areas_title`, `custom.plate_more_label`, `custom.plate_less_label`, `custom.plate_map_label`, `custom.plate_kitchen_label`, `custom.plate_kitchen_address`, `custom.plate_maps_label`, `custom.plate_legend_kitchen`, `custom.plate_legend_area`, `custom.plate_legend_zone`, `custom.plate_msg_yes`, `custom.plate_msg_no`, `custom.plate_msg_empty` | Single line text |
| Reviews heading | `custom.reviews_eyebrow`, `custom.reviews_heading` | Single line text |
| FAQ heading | `custom.faq_eyebrow`, `custom.faq_heading` | Single line text |
| Related heading | `custom.related_eyebrow`, `custom.related_heading` | Single line text |
| Final CTA | `custom.cta_eyebrow`, `custom.cta_heading`, `custom.cta_text`, `custom.cta_button_label` | Text |
| CTA background | `custom.cta_image` | File (image) |

Not every plan needs every key. Anything blank falls through to the shop-level
value, then the theme editor.

### 3.4 Shared overrides on the product

To give one plan its own version of shared content, add the same **metaobject
list** definition to Products and fill it there. Empty means "use the shared one".

| Shared content | Metaobject type | Product key | Shop key |
|---|---|---|---|
| Stats strip | `stat_item` | `custom.stats` | `custom.stats` |
| How it works | `how_it_works_step` | `custom.how_it_works` | `custom.how_it_works` |
| FAQ | `faq_item` | `custom.faq_items` | `custom.faq_items` |
| Testimonials | `testimonial` | `custom.testimonials` | `custom.testimonials` |
| Related plans | `meal_plan` | `custom.plan_cards` | `custom.plan_cards` |
| Feature cards | `feature_card` | `custom.feature_cards` | `custom.feature_cards` |
| Delivery towns | `delivery_area` | `custom.delivery_area_list` | `custom.delivery_area_list` |
| GKK panel stats | `stat_item` | `custom.thali_stat_items` | `custom.thali_stat_items` |
| GKK panel facts | `stat_item` | `custom.thali_fact_items` | `custom.thali_fact_items` |

---

## 4. Step 2 — Metaobject definitions

Settings → **Custom data** → **Metaobjects** → **Add definition**. The API name
is the `type` — it must match exactly.

> Four of these already exist in the theme and are used by other pages. Do **not**
> create a second type with a similar name: the same record is reused, so a
> testimonial you add once appears wherever testimonials are shown.

### 4.1 `stat_item` — stats strip, GKK panel numbers

| Field name | Key | Type |
|---|---|---|
| Value | `value` | Single line text |
| Label | `label` | Single line text |

Fill `value` with the big number (`24oz`, `2-3 min`, `40+`) and `label` with the
caption (`Per container`, `Years experience`).

### 4.2 `how_it_works_step` — already exists

| Field name | Key | Type |
|---|---|---|
| Step number | `step_number` | Integer |
| Title | `title` | Single line text |
| Description | `description` | Multi-line text |
| Icon | `icon` | File (image), optional |

Order comes from the list order, so `step_number` is only for your own reference.

### 4.3 `faq_item` — already exists

| Field name | Key | Type |
|---|---|---|
| Question | `question` | Single line text |
| Answer | `answer` | Rich text |
| Category | `category` | Single line text, optional |

The plan page prints the answer as plain text, so rich text formatting is stripped
there but still works on the standalone FAQ page.

### 4.4 `testimonial` — already exists

| Field name | Key | Type |
|---|---|---|
| Customer name | `customer_name` | Single line text |
| Photo | `photo` | File (image), optional |
| Review | `review` | Multi-line text |
| Rating | `rating` | Rating |
| Plan name | `plan_name` | Single line text, optional |

A testimonial with a photo shows that photo on the plan page. Without one the
card uses a bundled food photo.

To hide the image on one card, leave `photo` blank and the card renders as text
only — set that per plan by using a product-level list where you want it.

### 4.5 `meal_plan` — already exists (related plan cards)

| Field name | Key | Type |
|---|---|---|
| Name | `name` | Single line text |
| Image | `image` | File (image), optional |
| Short description | `short_description` | Multi-line text |
| Linked product | `linked_product` | Product reference |
| Badge | `badge` | Single line text, optional |
| Price note | `price_note` | Single line text, optional |
| Button label | `button_label` | Single line text, optional |

`linked_product` supplies the link and, if `image` is blank, the photo. A card
whose product is the plan you are already viewing is skipped automatically, so a
plan never recommends itself.

### 4.6 `feature_card` — new (the two story cards)

| Field name | Key | Type |
|---|---|---|
| Title | `title` | Single line text |
| Text | `text` | Multi-line text |
| Image | `image` | File (image), optional |

Used for "Cooked by Chef Matt" and "Real ingredients". Two entries read best. If
`image` is blank the theme draws its own illustration, as before; with a photo it
fills the same box at a 24:17 ratio.

### 4.7 `delivery_area` — new (map towns + ZIP checker)

| Field name | Key | Type | Notes |
|---|---|---|---|
| Name | `name` | Single line text | Required. Shown on the chip and used for search |
| Postcodes | `postcodes` | Single line text | Comma separated, e.g. `53186, 53188` |
| Map X | `map_x` | Decimal number | Horizontal position on the plate map, `0`–`100` |
| Map Y | `map_y` | Decimal number | Vertical position, `0`–`100` |
| Kitchen | `is_kitchen` | Boolean | Tick exactly one row |
| Latitude | `latitude` | Decimal number | Optional, exact pin placement |
| Longitude | `longitude` | Decimal number | Optional |

The ZIP checker matches on `name` and `postcodes`. `map_x` and `map_y` place the
pin on the stylised map; without them the theme looks the town up by name.

> This replaces the old `custom.delivery_towns` pipe-delimited list. That list
> still works and is used when no `delivery_area` records exist, so nothing breaks
> mid-migration.

### 4.8 `meal` — optional per-meal override

| Field name | Key | Type | Notes |
|---|---|---|---|
| Meal name | `name` | Single line text | Matched to the variant when `variant` is blank |
| Short name | `short_name` | Single line text | Card and dropdown label |
| Linked variant | `variant` | Product variant reference | The reliable link. Wins over the name match |
| Image | `image` | File (image) | Overrides the variant photo |
| Description | `description` | Single line text | Line under the meal name |
| Calories | `calories` | Integer | |
| Protein | `protein` | Integer | Grams |
| Carbs | `carbs` | Integer | Grams |
| Fat | `fat` | Integer | Grams |
| Badge | `badge` | Single line text | Ribbon on the card |
| Diet tags | `diet_tags` | List of single line text | One per row, e.g. `Gluten free` |
| Ingredients | `ingredients` | List of single line text | One per row |
| Allergens | `allergens` | List of single line text | One per row |
| Reheat | `reheat` | Multi-line text | Shown as "Heating" |

You do **not** need this to run the page: one variant per meal, with variant
metafields, is enough. Add a `meal` record only when a meal needs copy, a photo
or macros that differ from its variant — it then feeds "This week's menu", the
nutrition card and "Explore all meals" at the same time. Prices and cart ids
always come from the variant, never from here.

---

## 5. Step 3 — Shop-level shared metafields

Settings → **Custom data** → **Shop** → **Add definition**.

| Name | Namespace and key | Type | List? |
|---|---|---|---|
| Stats strip | `custom.stats` | Metaobject (`stat_item`) | Yes — list of entries |
| How it works | `custom.how_it_works` | Metaobject (`how_it_works_step`) | Yes |
| FAQ | `custom.faq_items` | Metaobject (`faq_item`) | Yes |
| Testimonials | `custom.testimonials` | Metaobject (`testimonial`) | Yes |
| Related plans | `custom.plan_cards` | Metaobject (`meal_plan`) | Yes |
| Feature cards | `custom.feature_cards` | Metaobject (`feature_card`) | Yes |
| Delivery towns | `custom.delivery_area_list` | Metaobject (`delivery_area`) | Yes |
| GKK panel stats | `custom.thali_stat_items` | Metaobject (`stat_item`) | Yes |
| GKK panel facts | `custom.thali_fact_items` | Metaobject (`stat_item`) | Yes |
| Chef story copy | `custom.chef_eyebrow`, `custom.chef_heading`, `custom.chef_text` | Single line / multi-line text | No |
| Chef photos | `custom.chef_image_1`, `custom.chef_image_2` | File (image) | No |
| Hero photos | `custom.hero_image_1`, `custom.hero_image_2` | File (image) | No |
| Meal gallery copy | `custom.gallery_eyebrow`, `custom.gallery_heading` | Single line / multi-line text | No |
| Delivery / map labels | `custom.delivery_placeholder`, `custom.delivery_button`, `custom.delivery_areas_title`, `custom.plate_more_label`, `custom.plate_less_label`, `custom.plate_map_label`, `custom.plate_kitchen_label`, `custom.plate_kitchen_address`, `custom.plate_maps_label`, `custom.plate_legend_kitchen`, `custom.plate_legend_area`, `custom.plate_legend_zone`, `custom.plate_msg_yes`, `custom.plate_msg_no`, `custom.plate_msg_empty` | Single line text | No |
| Section headings | `custom.ben_eyebrow`, `custom.menu_eyebrow`, `custom.menu_heading`, `custom.menu_text`, `custom.explore_heading`, `custom.steps_eyebrow`, `custom.steps_heading`, `custom.delivery_eyebrow`, `custom.delivery_heading`, `custom.delivery_text`, `custom.reviews_eyebrow`, `custom.reviews_heading`, `custom.faq_eyebrow`, `custom.faq_heading`, `custom.related_eyebrow`, `custom.related_heading` | Single line text | No |
| Closing CTA | `custom.cta_eyebrow`, `custom.cta_heading`, `custom.cta_text` | Text | No |
| CTA image | `custom.cta_image` | File (image) | No |
| GKK panel copy | `custom.thali_badge`, `custom.thali_heading`, `custom.thali_intro`, `custom.thali_delivery_heading`, `custom.thali_delivery_text`, `custom.thali_cutoff_note`, `custom.thali_fresh_heading`, `custom.thali_fresh_text`, `custom.thali_cta_heading`, `custom.thali_cta_text` | Text | No |

Metaobject list fields need **Storefront access is not required** — everything
below renders in Liquid on the server, so the metaobjects do not need to be
exposed to the Storefront API.

---

## 6. Where to fill each one

1. **Settings → Custom data → Metaobjects** — create the definitions in step 4,
   then add entries under *Content → Metaobjects*.
2. **Settings → Custom data → Shop** — add the shared metafields, then point each
   metaobject list at the entries you just made.
3. **Products → 6 Meal Plan → Metafields** — the per-plan copy.
4. **Products → 6 Meal Plan → Variants** — one variant per meal, with variant
   metafields.
5. **Online Store → Customize → the plan page** — confirm the section's
   **Plan product** field points at the right product.

Repeat step 3 for 5, 7, 10 and 15 Meal Plans. Steps 1, 2 and 4's definitions are
created once and shared.

---

## 7. Theme editor settings still available

These are design and layout controls, not content, and they stay in the theme
editor:

| Setting | What it does |
|---|---|
| Order dropdowns (`picker_count`) | How many meal dropdowns the order box shows |
| Meals in the featured row (`menu_count`) | How many meals "This week's menu" shows, default 5 |
| Meals per Explore page (`grid_page_size`) | Cards before Load more, default 6 |
| Meal card link label | Default `View meal` |
| Filter: all label | Default `All` |
| Nutrition labels | `Protein`, `Carbs`, `Fat`, `Contains`, `Heating` |
| Delivery style | Plate map, street map or Google embed |
| Padding, colours | Layout only |

Everything in that table is also a fallback, so nothing here is required to make
the page work.

---

## 8. Checklist before publishing

- [ ] Every plan product has one variant per meal, each with price and photo
- [ ] Every meal variant has calories, protein, carbs, fat
- [ ] Diet tags are correct, so the filter chips match the food
- [ ] Allergens are accurate
- [ ] `custom.delivery_area_list` has your real towns, with exactly one row
      marked as the kitchen
- [ ] The section's **Plan product** points at the right product on each page
- [ ] **Order dropdowns** is 6 on the 6 Meal Plan page, 5 on the 5, and so on
- [ ] Nothing renders as an empty heading or a missing image on any of the five
      plan pages
