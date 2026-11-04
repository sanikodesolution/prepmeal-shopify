"""Rename product metafield definition labels for clearer Admin editing."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MF_FILE = ROOT / ".shopify" / "metafields.json"
IDS_FILE = ROOT / "scripts" / "mf-ids.json"
MUT_FILE = ROOT / "scripts" / "update-mf-labels.graphql"

# key -> (new name, optional description)
RENAMES = {
    # Hero
    "plan_label": ("Hero · Plan label", "Small label above the headline, e.g. 6 Meal Plan."),
    "heading": ("Hero · Section title", "Main plan headline. Line breaks become new lines."),
    "subheading": ("Hero · Text", "Supporting paragraph under the headline."),
    "fact_1_label": ("Hero · Fact 1 label", "First fact pill label, e.g. Price."),
    "fact_1_value": ("Hero · Fact 1 value", "First fact pill value."),
    "fact_2_label": ("Hero · Fact 2 label", None),
    "fact_2_value": ("Hero · Fact 2 value", None),
    "fact_3_label": ("Hero · Fact 3 label", None),
    "fact_3_value": ("Hero · Fact 3 value", None),
    "button_label": ("Hero · Button", "Primary hero button label."),
    "button_label_2": ("Hero · Button 2", "Secondary hero button label."),
    "badge_value": ("Hero · Badge value", "Big number on the hero badge, e.g. 10+."),
    "badge_label": ("Hero · Badge label", "Small text under the badge value."),
    # Benefits
    "ben_eyebrow": ("Benefits · Eyebrow", "Small label above the benefits headline."),
    "ben_line_1": ("Benefits · Line 1", "First headline line, e.g. 6 meals."),
    "ben_line_2": ("Benefits · Line 2", "Second headline line, e.g. 1 week."),
    "ben_line_3": ("Benefits · Line 3 (outline)", "Third outlined headline line."),
    "ben_note": ("Benefits · Text", "Short note under the benefits headline."),
    "benefits": ("Benefits · Stat chips", "One chip per row as value|label."),
    # Menu / explore
    "menu_eyebrow": ("Menu · Eyebrow", None),
    "menu_heading": ("Menu · Section title", None),
    "menu_text": ("Menu · Text", None),
    "menu_button": ("Menu · Button", None),
    "explore_heading": ("Explore · Section title", None),
    "detail_note": ("Menu · Detail note", None),
    "total_label": ("Order box · Total label", None),
    "load_more_label": ("Explore · Load more label", None),
    "menu_modal_heading": ("Menu · Modal title", None),
    "menu_caption": ("Menu · Caption", None),
    "picker_placeholder": ("Order box · Dropdown placeholder", None),
    "order_panel_title": ("Order box · Panel title", None),
    "meal_slots": ("Order box · Meal slots", "How many MEAL dropdowns to show (e.g. 6)."),
    # Chef
    "chef_eyebrow": ("Chef · Eyebrow", None),
    "chef_heading": ("Chef · Section title", None),
    "chef_text": ("Chef · Text", None),
    # Steps
    "steps_eyebrow": ("How it works · Eyebrow", None),
    "steps_heading": ("How it works · Section title", None),
    "steps": ("How it works · Steps", "One row as title|text."),
    "quality_points": ("Quality · Points", "One row as title|text|detail."),
    # Delivery
    "delivery_eyebrow": ("Delivery · Eyebrow", None),
    "delivery_heading": ("Delivery · Section title", None),
    "delivery_text": ("Delivery · Text", None),
    "delivery_areas_title": ("Delivery areas · Section title", "Heading above the town list."),
    "delivery_areas": ("Delivery areas · Town chips", "One town name per row."),
    "delivery_towns": ("Delivery map · Town list", "One per row: Name|ZIP|left%|top%. Add kitchen on the kitchen row."),
    "delivery_map_query": ("Delivery map · Location", "Place the map centres on, e.g. Hartland, Wisconsin."),
    "delivery_map_title": ("Delivery map · Label", "Caption printed on/near the map."),
    # Reviews / FAQ / related / CTA
    "reviews_eyebrow": ("Reviews · Eyebrow", None),
    "reviews_heading": ("Reviews · Section title", None),
    "reviews": ("Reviews · List", "Legacy pipe list. Prefer Review blocks in the theme editor."),
    "faq_eyebrow": ("FAQ · Eyebrow", None),
    "faq_heading": ("FAQ · Section title", None),
    "faq": ("FAQ · List", "Legacy pipe list. Prefer FAQ blocks in the theme editor."),
    "related_eyebrow": ("Related plans · Eyebrow", None),
    "related_heading": ("Related plans · Section title", None),
    "related_plans": ("Related plans · List", None),
    "cta_eyebrow": ("Closing CTA · Eyebrow", None),
    "cta_heading": ("Closing CTA · Section title", None),
    "cta_text": ("Closing CTA · Text", None),
    "cta_button_label": ("Closing CTA · Button", None),
    # Chef story / thali panel
    "thali_badge": ("Chef story · Badge", None),
    "thali_heading": ("Chef story · Section title", None),
    "thali_intro": ("Chef story · Text", None),
    "thali_stats": ("Chef story · Stats", "One row as value|label."),
    "thali_chips": ("Chef story · Plate labels", "Exactly four labels, one per corner."),
    "thali_cards": ("Chef story · Cards", "One row as title|text."),
    "thali_delivery_heading": ("Chef story delivery · Section title", None),
    "thali_delivery_text": ("Chef story delivery · Text", None),
    "thali_tickets": ("Chef story delivery · Cutoff tickets", None),
    "thali_cutoff_note": ("Chef story delivery · Note", None),
    "thali_fresh_heading": ("Chef story fresh · Section title", None),
    "thali_fresh_text": ("Chef story fresh · Text", None),
    "thali_steps": ("Chef story · Steps", "One row as title|text."),
    "thali_towns": ("Chef story · Towns", None),
    "thali_image": ("Chef story · Plate photo", "Transparent PNG plate cut-out reads best."),
    "thali_cta_heading": ("Chef story CTA · Section title", None),
    "thali_cta_text": ("Chef story CTA · Text", None),
    "thali_cta_label": ("Chef story CTA · Button", None),
    "thali_cta_note": ("Chef story CTA · Note", None),
    "thali_facts": ("Chef story CTA · Facts", "One row as value|label."),
}


def main():
    data = json.loads(MF_FILE.read_text(encoding="utf-8"))
    for item in data.get("product", []):
        key = item.get("key")
        if key in RENAMES:
            name, desc = RENAMES[key]
            item["name"] = name
            if desc is not None:
                item["description"] = desc
    MF_FILE.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    ids = json.loads(IDS_FILE.read_text(encoding="utf-8"))
    nodes = ids["metafieldDefinitions"]["nodes"]
    by_key = {n["key"]: n["id"] for n in nodes}

    parts = ["mutation UpdateProductMetafieldLabels {"]
    i = 0
    for key, (name, desc) in RENAMES.items():
        mid = by_key.get(key)
        if not mid:
            print(f"SKIP missing id: {key}")
            continue
        i += 1
        alias = f"u{i}"
        desc_lit = "null" if desc is None else json.dumps(desc)
        parts.append(
            f"""  {alias}: metafieldDefinitionUpdate(
    definition: {{
      namespace: "custom"
      key: {json.dumps(key)}
      name: {json.dumps(name)}
      description: {desc_lit}
      ownerType: PRODUCT
    }}
  ) {{
    updatedDefinition {{ id name }}
    userErrors {{ field message code }}
  }}"""
        )
    parts.append("}")
    MUT_FILE.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"Updated {MF_FILE}")
    print(f"Wrote {i} mutations to {MUT_FILE}")


if __name__ == "__main__":
    main()
