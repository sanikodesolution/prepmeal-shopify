# Meal Plan Pages — Admin Content Guide

Meal plan pages are edited in two places:

1. **Shopify Admin (products + metafields)** — meals, prices, macros, shared copy  
2. **Theme editor (Customize)** — headlines and band copy you click in the preview  

Five plan sizes use this system: **5, 6, 7, 10 and 15**. Each has a page template
(`templates/page.N-meal-plan.json`) and a matching product template
(`templates/product.N-meal-plan.json`) so **Product → Preview** shows the same
layout as the page.

> **Verified against the live theme `#188743614770`.** See section 10 for how to
> re-verify after theme changes.

---

## 0. Theme editor — click a band to edit it

### 0.1 What you see under Template (6 Meal Plan)

On the **6-meal-plan** templates the left sidebar lists **separate sections**
(not one giant folder):

| Left sidebar name | Section file | What it controls |
|---|---|---|
| **MP Hero** | `sections/cm-mp-hero.liquid` | Plan label, heading, text, facts, buttons, hero images, badge |
| **MP Benefits** | `sections/cm-mp-benefits.liquid` | “Hartland's #1…”, “6 meals. 1 week. Zero stress.”, note, benefit chips |
| **CM meal plan page** | `sections/cm-meal-plan-page.liquid` | Menu, order box, explore grid, chef, steps, delivery, reviews, FAQ, related, CTA |

Built-in hero/benefits inside **CM meal plan page** stay **off**
(`show_hero` / `show_benefits_band` = false) so you do not get two heroes.

Other plan sizes (5 / 7 / 10 / 15) may still use a single `CM meal plan page`
section until they are split the same way. Prefer the same three-section pattern
when you update those templates.

### 0.2 How to edit (easy path)

1. Online Store → **Customize** → open the 6 Meal Plan page (or product).  
2. Hard-refresh if the left list still looks old.  
3. **Click the band in the preview** (hero headline, benefits lines, etc.).  
4. The left sidebar selects that section (**MP Hero**, **MP Benefits**, or
   **CM meal plan page**).  
5. The **right sidebar** shows only that section’s fields — edit and Save.

You can also click the section name on the left first, then edit on the right.

### 0.3 Plan product on every section

Set **Plan product** / **content_product** to the same product (e.g. `6 Meal Plan`)
on **MP Hero**, **MP Benefits**, and **CM meal plan page**. That product’s
variants feed the menu and order box; its metafields can still override copy.

### 0.4 Order box behaviour (storefront)

- Option name on the product must be **Meal** (one variant per meal).  
- Plan total = **sum of the selected meal prices** (not one price × 6).  
- Dropdowns hide the absolute price; meals above the cheapest show a **+$**
  surcharge.  
- A diner can **clear** a slot back to “Choose a meal”.  
- `picker_count` (and metafield `custom.meal_slots` when used) should match the
  plan size (6 on the 6 Meal Plan).

---

## 1. How content resolves

Each piece of content is looked up in this order, and the first non-empty value
wins:

```
1. Plan product metafield      Products → <plan product> → Metafields
2. Shop-level shared metafield Settings → Custom data → Shop → Metafields
3. Theme editor setting        Customize → MP Hero / MP Benefits / CM meal plan page
4. Hardcoded default           Built into the theme
```

On **MP Hero** and **MP Benefits**, the Customize fields are the primary edit
surface. Product metafields still win on the live storefront when filled; leave
metafields blank if you want Customize to drive that band.

Because of step 2, content that is identical on all five plans (FAQ,
testimonials, how-it-works steps, delivery towns, chef story) is entered **once**
and every plan page picks it up. A plan that needs its own version fills the
matching product metafield and that wins instead.

A blank value never renders an empty heading or a broken image: it falls through
to the next source, and the section hides the wrapper when the final value is
still blank.

**Metafield namespace is always `custom`.**

### 1.1 Not every key has all four levels

The four-step chain is the overall model, but which steps a given key actually
walks differs. Filling a shop-level value for a key that never reads the shop
level does nothing. The real chains are:

| Chain | Keys |
|---|---|
| **Product → Shop → Theme** | `ben_eyebrow`, `chef_*`, `cta_*`, `gallery_*`, `menu_*`, `reviews_eyebrow/heading`, `faq_eyebrow/heading`, `related_eyebrow/heading`, `steps_eyebrow/heading`, `quality_eyebrow`, `delivery_eyebrow/heading/text`, `hero_image_1/2`, `explore_heading`, `thali_badge`, `thali_heading`, `thali_intro`, `thali_delivery_*`, `thali_cutoff_note`, `thali_fresh_*`, `thali_cta_heading`, `thali_cta_text` |
| **Product → Theme** | `plan_label`, `heading`, `subheading`, `fact_1..3_label/value`, `button_label`, `button_label_2`, `badge_value`, `badge_label`, `ben_line_1/2/3`, `ben_note`, `detail_note`, `total_label`, `load_more_label`, `menu_button`, `order_panel_title`, `delivery_map_query`, `delivery_map_title`, `hero_image_1/2_alt`, `thali_chips`, `thali_cards`, `thali_tickets`, `thali_steps`, `thali_towns`, `thali_stats`, `thali_facts`, `thali_image`, `thali_plate_alt`, `thali_cta_label`, `thali_cta_link`, `thali_cta_note` |
| **Product → Shop** (metaobject list) | `stats`, `meals`, `how_it_works`, `faq_items`, `testimonials`, `plan_cards`, `feature_cards`, `delivery_area_list`, `thali_stat_items`, `thali_fact_items` |
| **Product → Shop → literal** | `delivery_placeholder`, `delivery_button`, `delivery_show_all`, `delivery_show_less`, `delivery_reset_label`, `plate_*` labels, `delivery_msg_yes/no`, `plate_msg_*` |
| **Product → literal** | `calories_label`, `filter_meals_label`, `gallery_prev_label`, `gallery_next_label`, `menu_modal_heading`, `menu_caption`, `picker_placeholder` |
| **Product → Theme blocks** | `quality_points` (the only source; with no metafield and no blocks the section is hidden) |
| **Variant → Meal metaobject → Product** | meal macros, `description`, `badge`, `ingredients`, `diet_tags`, `reheat_instructions` |

---

## 2. What to fill where

| I want to change... | Edit this | Level |
|---|---|---|
| Hero headline, facts, buttons, badge | Customize → **MP Hero** (or `custom.heading` / `fact_*` / `badge_*`) | Theme / product |
| Hero photos | **MP Hero** image pickers or `custom.hero_image_1/2` | Theme / product |
| Benefits headline (“6 meals. 1 week…”) | Customize → **MP Benefits** (or `custom.ben_line_*`) | Theme / product |
| Benefit chips (24oz, 2 min, Fresh…) | **MP Benefits** → Benefit chip blocks, or `stat_item` → `custom.stats` | Theme / shop |
| Menu / order box / explore | Customize → **CM meal plan page** + product variants | Theme / product |
| The meals, photos, macros, badges | Product **variants** + variant metafields | Per product |
| Explore grid filters | Variant `custom.diet_tags` | Per variant |
| Chef story text | `custom.chef_eyebrow/heading/text` or CM meal plan page settings | Shop / theme |
| Chef story photos | `custom.chef_image_1`, `custom.chef_image_2` (file) | Shop shared |
| The two feature cards | `feature_card` metaobject list → `custom.feature_cards` | Shop shared |
| Delivery days, cutoff, towns | `delivery_area` metaobject list → `custom.delivery_area_list` | Shop shared |
| How it works steps | `how_it_works_step` metaobject list → `custom.how_it_works` | Shop shared |
| Testimonials | `testimonial` metaobject list → `custom.testimonials` | Shop shared |
| FAQ | `faq_item` metaobject list → `custom.faq_items` | Shop shared |
| Other plans cards | `meal_plan` metaobject list → `custom.plan_cards` | Shop shared |
| Final CTA text + background | `custom.cta_*` or CM meal plan page CTA settings | Product / theme |
| Meal gallery heading | `custom.gallery_eyebrow/heading` | Per product or shop |
| Delivery map + ZIP labels | `custom.delivery_*`, `custom.plate_*` | Per product or shop |
| Ghar Ka Khana story panel | `custom.thali_*` | Per product |
| Button wording on meal cards | Customize → CM meal plan page → Meal card link label | Theme |

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

Meal macros resolve **variant → meal metaobject → product**. So a product-level
`custom.calories` acts as a single fallback value for every meal that does not
set its own. Fill the variant, not the product, unless you want one shared value.

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
| Delivery / map labels | `custom.delivery_placeholder`, `custom.delivery_button`, `custom.delivery_areas_title`, `custom.plate_areas_title`, `custom.plate_more_label`, `custom.plate_less_label`, `custom.plate_map_label`, `custom.plate_kitchen_label`, `custom.plate_kitchen_address`, `custom.plate_maps_label`, `custom.plate_legend_kitchen`, `custom.plate_legend_area`, `custom.plate_legend_zone`, `custom.plate_msg_yes`, `custom.plate_msg_no`, `custom.plate_msg_empty`, `custom.delivery_show_all`, `custom.delivery_show_less`, `custom.delivery_reset_label`, `custom.delivery_msg_yes`, `custom.delivery_msg_no` | Single line text |
| Reviews heading | `custom.reviews_eyebrow`, `custom.reviews_heading` | Single line text |
| FAQ heading | `custom.faq_eyebrow`, `custom.faq_heading` | Single line text |
| Related heading | `custom.related_eyebrow`, `custom.related_heading` | Single line text |
| Final CTA | `custom.cta_eyebrow`, `custom.cta_heading`, `custom.cta_text`, `custom.cta_button_label`, `custom.cta_button_link` | Text / URL |
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

### 3.5 Legacy plain-text lists (still supported)

These predate the metaobject lists and are still read, so a store that already
filled them keeps working. They sit **after** the metaobject list and **before**
the theme editor blocks. Do not migrate by hand — fill the metaobject list and
the old text is ignored.

| Content | Product / Shop key | Type | Row format |
|---|---|---|---|
| Stats strip | `custom.benefits` | List of single line text | `value\|label` |
| How it works | `custom.steps` | List of single line text | `title\|text` |
| FAQ | `custom.faq` | List of single line text | `question\|answer` |
| Testimonials | `custom.reviews` | List of single line text | `name\|rating\|review\|aspect\|show image\|image url` |
| Related plans | `custom.related_plans` | List of single line text | `title\|text\|url\|button label\|price note\|image url` |
| Quality points | `custom.quality_points` | List of single line text | `title\|text\|detail` |
| Delivery towns | `custom.delivery_towns` | Multi-line text | see 4.7 |
| Delivery area chips | `custom.delivery_areas` | List of single line text | one town per row |

`custom.quality_points` is **product-only** — there is no shop-level or theme
editor equivalent, so it is the only way to drive the quality cards from Admin.

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
| Show photo | `show_photo` | Boolean, optional |

A testimonial with a photo shows that photo on the plan page. Without one the
card uses a bundled food photo.

To hide the image on one card, tick `show_photo` off — the card then renders as
text only even when a photo is attached.

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

**Which fields each map style uses**

| Field | Plate map (`delivery_style` = `plate`) | Street-map checker |
|---|---|---|
| `name` | chip + search | chip + search |
| `postcodes` | chip search | chip search |
| `map_x`, `map_y` | pin position | **not used** |
| `is_kitchen` | pin shown as the kitchen | **not used** — this style has no kitchen pin |
| `latitude`, `longitude` | exact pin, else geocoded | exact pin, else geocoded |

Only one style renders per plan, so one `delivery_area` list serves both: fill
`map_x`/`map_y` **and** `latitude`/`longitude` and the records work whichever
style the plan uses. Filling only the coordinates leaves the plate map
geocoding by name, which is slower but still correct.

**The two snippets do not share a row format.** Both parse newline-separated
pipe rows, but the column order differs:

```
cm-delivery-area    (plate)   Name|ZIPs|left%|top%|kitchen|lat|lng
cm-delivery-checker (street)  Name|lat|lng|ZIPs
```

Each snippet builds its own row from the metaobject fields. Do not copy one
builder into the other: the plate row puts percentages where the checker expects
a latitude, and the map silently plots the town in the wrong place. The checker
chooses the row shape by column count, so a record with no coordinates is
emitted as `Name|ZIPs` and geocoded in the browser.

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
nutrition card and "Explore all meals" at the same time. Match it by `variant`
wherever possible; the name match is case- and whitespace-insensitive but only
works while the variant title is unchanged. Prices and cart ids always come from
the variant, never from here.

The list itself is pointed at by `custom.meals` — a metaobject list of `meal`
entries. Set it on the product, or on the shop as the shared default.

### 4.9 Ghar Ka Khana story panel — `custom.thali_*`

The story panel (`snippets/cm-thali-story.liquid`) is off unless `thali_show` is
ticked in the theme editor. Its copy has its own keys, and **the fallback level
differs per key** — the ten single-value keys read the shop level, and the list
keys fall all the way through to the theme editor textarea. Note that neither
group reads the shop level for the list keys.

| Product key | Type | Shop-level fallback? |
|---|---|---|
| `custom.thali_badge` | Single line text | Yes |
| `custom.thali_heading` | Single line text | Yes |
| `custom.thali_intro` | Multi-line text | Yes |
| `custom.thali_delivery_heading` | Single line text | Yes |
| `custom.thali_delivery_text` | Multi-line text | Yes |
| `custom.thali_cutoff_note` | Single line text | Yes |
| `custom.thali_fresh_heading` | Single line text | Yes |
| `custom.thali_fresh_text` | Multi-line text | Yes |
| `custom.thali_cta_heading` | Single line text | Yes |
| `custom.thali_cta_text` | Multi-line text | Yes |
| `custom.thali_chips` | List of single line text | **No** |
| `custom.thali_cards` | List of single line text | **No** |
| `custom.thali_tickets` | List of single line text | **No** |
| `custom.thali_steps` | List of single line text | **No** |
| `custom.thali_towns` | List of single line text | **No** |
| `custom.thali_stats` | List of single line text | **No** |
| `custom.thali_facts` | List of single line text | **No** |
| `custom.thali_image` | File (image) | **No** |
| `custom.thali_plate_alt` | Single line text | **No** |
| `custom.thali_cta_label` | Single line text | **No** |
| `custom.thali_cta_link` | URL | **No** |
| `custom.thali_cta_note` | Single line text | **No** |

For the list keys, each entry is one row and the panel splits on newlines. Row
shape for each:

```
thali_chips     one chip per line
thali_tickets   label|value        e.g. Sunday|Delivery 10 AM - 2 PM
thali_steps     title|text
thali_stats     value|label
thali_facts     value|label
thali_cards     title|text
thali_towns     comma separated, in one row
```

`thali_stats` and `thali_facts` are plain text and are **not** the same thing as
`custom.thali_stat_items` / `custom.thali_fact_items`, which are `stat_item`
metaobject lists and do carry a shop-level fallback. If you are starting fresh,
use the metaobject lists; the text versions exist for stores already filled in.

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
| Delivery / map labels | `custom.delivery_placeholder`, `custom.delivery_button`, `custom.delivery_areas_title`, `custom.plate_more_label`, `custom.plate_less_label`, `custom.plate_map_label`, `custom.plate_kitchen_label`, `custom.plate_kitchen_address`, `custom.plate_maps_label`, `custom.plate_legend_kitchen`, `custom.plate_legend_area`, `custom.plate_legend_zone`, `custom.plate_msg_yes`, `custom.plate_msg_no`, `custom.plate_msg_empty`, `custom.delivery_show_all`, `custom.delivery_show_less`, `custom.delivery_reset_label`, `custom.delivery_msg_yes`, `custom.delivery_msg_no` | Single line text | No |
| Section headings | `custom.ben_eyebrow`, `custom.menu_eyebrow`, `custom.menu_heading`, `custom.menu_text`, `custom.explore_heading`, `custom.steps_eyebrow`, `custom.steps_heading`, `custom.delivery_eyebrow`, `custom.delivery_heading`, `custom.delivery_text`, `custom.reviews_eyebrow`, `custom.reviews_heading`, `custom.faq_eyebrow`, `custom.faq_heading`, `custom.related_eyebrow`, `custom.related_heading`, `custom.quality_eyebrow` | Single line text | No |
| Closing CTA | `custom.cta_eyebrow`, `custom.cta_heading`, `custom.cta_text` | Text | No |
| CTA image | `custom.cta_image` | File (image) | No |

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
5. **Online Store → Customize → the plan page** — confirm **Plan product** on
   **MP Hero**, **MP Benefits**, and **CM meal plan page** all point at the same
   product. Click each band in the preview to edit its copy (see §0).

Repeat step 3 for 5, 7, 10 and 15 Meal Plans. Steps 1, 2 and 4's definitions are
created once and shared.

---

## 7. Theme editor settings

### 7.0 Section map (6 Meal Plan)

| Section | Primary settings |
|---|---|
| **MP Hero** | `plan_label`, `heading`, `text`, `fact_*`, buttons, images, badge |
| **MP Benefits** | `eyebrow`, `line_1/2/3`, `note`, Benefit chip blocks |
| **CM meal plan page** | Plan product, order box, menu, explore, chef, delivery, reviews, FAQ, CTA; keep **Show built-in hero/benefits** off |

Files: `templates/page.6-meal-plan.json`, `templates/product.6-meal-plan.json`
→ section order `mp_hero` → `mp_benefits` → `mp_page`.

### 7.1 CM meal plan page controls

| Setting | What it does |
|---|---|
| **Plan product** (`content_product`) | Which product supplies the meals and the copy |
| **Plan product** / **Meals product** (order box group) | Fallbacks when `content_product` is empty |
| Show built-in hero / benefits | Legacy only — leave **off** when MP Hero / MP Benefits sections are used |
| Order dropdowns (`picker_count`) | How many meal dropdowns the order box shows |
| Meals in the featured row (`menu_count`) | How many meals "This week's menu" shows |
| Meals per Explore page (`grid_page_size`) | Cards before Load more, default 6 |
| Meal card link label | Default `View meal` |
| Filter: all label | Default `All` |
| Nutrition labels | `Protein`, `Carbs`, `Fat`, `Contains`, `Heating` |
| Delivery style (`delivery_style`) | `plate`, `leaflet` or `embed` — see 7.2 |
| Padding | Layout only |

### 7.2 Which delivery snippet renders

Driven by `delivery_style` first, then the `delivery_checker` checkbox:

| Condition | Snippet | Reads |
|---|---|---|
| `delivery_style` = `plate` | `snippets/cm-delivery-area.liquid` | `delivery_area` metaobjects, plate row format |
| not `plate`, and `delivery_checker` on | `snippets/cm-delivery-checker.liquid` | `delivery_area` metaobjects, checker row format |
| not `plate`, and `delivery_checker` off | inline block in the section | `delivery_map_query`, `delivery_map_title` |

Note `delivery_style` = `embed` does **not** select a separate embed path: with
`delivery_checker` off you get the inline Google Maps embed, which is the same
thing. With it on you get the street-map checker.
 
All three take copy from the same metafield chain, so switching style never
loses your wording. Only the row format differs; see 4.7.

### 7.3 `content_product` is required in practice

`content_product` is a **product picker**, and it is the only setting that makes
the section product-aware. Leave it blank and the section falls back to its
theme-editor blocks for everything — no product metafield, metaobject or variant
metafield will appear, because nothing resolves the plan product first.

Set it on every plan page. It must be the same product the order box charges.

> **Do not** "fix" a blank picker by changing the Liquid to resolve the handle
> settings with `all_products` — those settings are already product objects, and
> passing one to `all_products` returns nothing, which blanks the meals, the
> order box price and the whole content layer at once.

---

## 8. Checklist before publishing

- [ ] **6 Meal Plan** Customize left list shows **MP Hero**, **MP Benefits**,
      **CM meal plan page**
- [ ] Clicking the hero in the preview selects **MP Hero** and opens heading fields
- [ ] Clicking the benefits band selects **MP Benefits**
- [ ] **Plan product** is set on MP Hero, MP Benefits, and CM meal plan page to
      the same product
- [ ] Built-in hero / benefits toggles on CM meal plan page are **off**
- [ ] Every plan product has one **Meal** variant per meal, each with price and photo
- [ ] Every meal variant has calories, protein, carbs, fat
- [ ] Diet tags are correct, so the filter chips match the food
- [ ] Allergens are accurate
- [ ] Order box total equals the **sum** of selected meal prices; clear/reselect works
- [ ] `custom.delivery_area_list` has your real towns, with exactly one row
      marked as the kitchen
- [ ] Every `delivery_area` record has `latitude`/`longitude` if any plan uses the
      street-map checker, and `map_x`/`map_y` if any plan uses the plate map
- [ ] **Order dropdowns** is 6 on the 6 Meal Plan page, 5 on the 5, and so on
- [ ] Product **Preview** uses the meal-plan product template
- [ ] Nothing renders as an empty heading or a missing image on any of the five
      plan pages

---

## 9. Related files

| Path | Role |
|---|---|
| `sections/cm-mp-hero.liquid` | Clickable hero section |
| `sections/cm-mp-benefits.liquid` | Clickable benefits section |
| `sections/cm-meal-plan-page.liquid` | Menu, order, rest of page |
| `sections/cm-mp-band.liquid` | Optional reusable text / CTA band |
| `assets/cm-meal-plan-page.js` / `.css` | Storefront behaviour and styles |
| `assets/cm-meal-plan-editor.js` | Customize preview helpers |
| `templates/page.6-meal-plan.json` | Page template section order |
| `templates/product.6-meal-plan.json` | Product Preview template |
| `docs/CONTENT-GUIDE.md` | Broader theme content modes |

---

## 10. Re-verifying this document

The key list above is generated from the Liquid, not hand-maintained. To check
for drift after a theme change:

```bash
# 1. Pull the live files
shopify theme pull --store <store> --theme <id> --path /tmp/audit \
  --only "sections/cm-meal-plan-page.liquid" \
  --only "sections/cm-mp-hero.liquid" \
  --only "sections/cm-mp-benefits.liquid" \
  --only "snippets/cm-*.liquid"

# 2. List every metafield key the theme actually reads (141 today)
rg -o --no-filename "\b(plan_meta|shared_meta|meta|shared|mv|mo)\.[a-z0-9_]+\.value" \
  /tmp/audit \
  | sed -E 's/^(plan_meta|shared_meta|meta|shared|mv|mo)\.//; s/\.value$//' \
  | sort -u
```

On Windows PowerShell the `sed` half becomes:

```powershell
rg -o --no-filename "\b(plan_meta|shared_meta|meta|shared|mv|mo)\.[a-z0-9_]+\.value" $audit |
  ForEach-Object { $_ -replace '^(plan_meta|shared_meta|meta|shared|mv|mo)\.','' -replace '\.value$','' } |
  Sort-Object -Unique
```

If a key appears there but not in this document, the document is behind. If a key
is documented but no longer read, the field is dead and should be removed from
Admin to avoid confusion.

Two known non-issues when running `shopify theme check`: the locale files report
~2100 translation offenses on this theme. That is pre-existing and unrelated to
the plan pages.
