# Meal Plan Pages — Admin Content Guide

Everything on a meal plan page is edited in **Shopify Admin**. No theme editor,
no code.

Five pages use this system: 5, 6, 7, 10 and 15 Meal Plans. Each one is a page
template (`templates/page.N-meal-plan.json`) rendered by
`sections/cm-meal-plan-page.liquid`.

> **Verified against the live theme `#188743614770`.** Every key, fallback
> chain and row format below was checked against the Liquid that is actually
> published, not against an older draft. See section 9 for how to re-verify.

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
| Ghar Ka Khana story panel | `custom.thali_*` | Per product |
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
5. **Online Store → Customize → the plan page** — confirm the section's
   **Plan product** field points at the right product.

Repeat step 3 for 5, 7, 10 and 15 Meal Plans. Steps 1, 2 and 4's definitions are
created once and shared.

---

## 7. Theme editor settings still available

These provide the fallback layer and are also design controls:

| Setting | What it does |
|---|---|
| **Plan product** (`content_product`) | Highest-priority source for the plan product. Blank is the shipped default — see 7.2 |
| **Plan product** / **Meals product** (order box group) | The fallbacks used when `content_product` is blank. These are what the 6 Meal Plan page actually uses |
| Order dropdowns (`picker_count`) | How many meal dropdowns the order box shows |
| Meals in the featured row (`menu_count`) | How many meals "This week's menu" shows, default 5 |
| Meals per Explore page (`grid_page_size`) | Cards before Load more, default 6 |
| Meal card link label | Default `View meal` |
| Filter: all label | Default `All` |
| Nutrition labels | `Protein`, `Carbs`, `Fat`, `Contains`, `Heating` |
| Delivery style (`delivery_style`) | `plate`, `leaflet` or `embed`. Decides which delivery snippet renders — see 7.1 |
| Padding, colours | Layout only |

Everything in that table is also a fallback, so nothing here is required to make
the page work.

### 7.1 Which delivery snippet renders

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

### 7.2 `content_product` is optional, and blank is the shipped default

`content_product` is a **product picker**, and it is the highest-priority source
for the plan product. It is **not required**: when it is blank the section uses
the **Plan product** setting from the order-box group, and then **Meals product**.
All three are `product` pickers, so all three already hold a product object and
`.metafields` / `.variants` work on them directly.

The 6 Meal Plan page ships with `content_product` empty and `plan_product` set to
`6-meal-plan`, so its content comes from that product without anything else
being configured.

Set `content_product` only when you want this section to read a product other
than the one the order box charges.

> **Do not resolve these with `all_products`.** They are product objects, not
> handle strings, so `all_products[section.settings.plan_product]` returns nil.
> That nils out `plan_meta` (every metafield on the page) *and* `plan_variant`
> (the order box price) at the same time, and the page silently falls back to the
> theme editor. This was a real bug in this theme — see the note in section 10.

---

## 8. Checklist before publishing

- [ ] **Plan product** is set on every plan page — either `content_product` or the
      order-box **Plan product** — and points at that page's plan product
- [ ] Every plan product has one variant per meal, each with price and photo
- [ ] Every meal variant has calories, protein, carbs, fat
- [ ] Diet tags are correct, so the filter chips match the food
- [ ] Allergens are accurate
- [ ] `custom.delivery_area_list` has your real towns, with exactly one row
      marked as the kitchen
- [ ] Every `delivery_area` record has `latitude`/`longitude` if any plan uses the
      street-map checker, and `map_x`/`map_y` if any plan uses the plate map
- [ ] **Order dropdowns** is 6 on the 6 Meal Plan page, 5 on the 5, and so on
- [ ] Nothing renders as an empty heading or a missing image on any of the five
      plan pages

---

## 9. Re-verifying this document

The key list above is generated from the Liquid, not hand-maintained. To check
for drift after a theme change:

```bash
# 1. Pull the live files
shopify theme pull --store <store> --theme <id> --path /tmp/audit \
  --only "sections/cm-meal-plan-page.liquid" \
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

---

## 10. How the plan product is resolved

This is the one place where a plausible-looking "fix" silently breaks the page,
so it is worth stating plainly.

```liquid
assign plan_product = section.settings.content_product
if plan_product == blank
  assign plan_product = section.settings.plan_product
endif
if plan_product == blank
  assign plan_product = section.settings.meals_product
endif
assign plan_meta = plan_product.metafields.custom
```

`content_product`, `plan_product` and `meals_product` are all declared
`"type": "product"` in the section schema. Shopify resolves a `product`-type
setting to a **product object**, not to the handle string stored in the template
JSON. The JSON says `"plan_product": "6-meal-plan"`, but Liquid receives a
product whose `.handle` is `6-meal-plan`.

The consequence: **never** wrap these in `all_products`. `all_products` takes a
handle *string*. Given a product object it returns `nil`, and then:

- `plan_meta` is `nil`, so every product metafield and metaobject resolves blank
  and the whole page silently falls back to the theme editor
- `plan_product.variants` is empty, so there are no meals
- `plan_variant` at the order box is `blank`, so the plan total renders as zero

This exact mistake was made in this theme and shipped to the live theme. It was
reverted. If the page ever loses all its Admin content at once, check this block
before anything else.

The symptom is distinctive: everything is fine, and then *every* Admin-driven
value disappears together while the page still renders. A single missing
metafield cannot do that — only a `nil` plan product can.
