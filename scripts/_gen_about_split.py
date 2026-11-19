# -*- coding: utf-8 -*-
import json
import re
import pathlib

root = pathlib.Path(r"G:\kodesolution\htdocs\sanikodesolution\shopify\prepmeal-shopify")
dl = pathlib.Path(r"C:\Users\sanikodesolution\Downloads\files")
frag = json.loads((root / "scripts" / "pm-type-schema-fragment.json").read_text(encoding="utf-8"))
group_tpl = frag["group_template"]


def type_group(label, prefix):
    out = []
    for item in group_tpl:
        raw = json.dumps(item, ensure_ascii=False)
        raw = raw.replace("{{LABEL}}", label).replace("{{PREFIX}}", prefix)
        out.append(json.loads(raw))
    return out


extra_settings = [
    {"type": "header", "content": "Layout"},
    {"type": "checkbox", "id": "full_width", "label": "Full width", "default": False},
    {"type": "range", "id": "margin_top", "min": 0, "max": 100, "step": 4, "unit": "px", "label": "Margin top", "default": 0},
    {"type": "range", "id": "margin_bottom", "min": 0, "max": 100, "step": 4, "unit": "px", "label": "Margin bottom", "default": 0},
    {"type": "header", "content": "Button style"},
    {"type": "color", "id": "button_text_color", "label": "Text color"},
    {"type": "color", "id": "button_bg_color", "label": "Background color"},
    {"type": "color", "id": "button_hover_text_color", "label": "Hover text color", "info": "Clear to keep the style preset hover."},
    {"type": "color", "id": "button_hover_bg_color", "label": "Hover background color", "info": "Clear to keep the style preset hover."},
    {"type": "color", "id": "button_icon_bg", "label": "Icon background"},
    {"type": "color", "id": "button_icon_color", "label": "Icon color"},
    {"type": "range", "id": "button_font_size", "min": 12, "max": 24, "step": 1, "unit": "px", "label": "Font size", "default": 16},
]

type_prefixes = [
    ("Badge", "badge_"),
    ("Heading", "heading_"),
    ("Point label", "label_"),
    ("Point text", "body_"),
    ("Overlay title", "panel_title_"),
    ("Overlay text", "panel_text_"),
]

specs = [
    {
        "src": "content-split-1.liquid",
        "dst": "ss-about-1.liquid",
        "name": "SS About #1 (Sticker)",
        "class": "about-split1",
        "variant": "ps-a",
        "note": "About split — sticker overlap (Downloads content-split-1).",
    },
    {
        "src": "content-split-2.liquid",
        "dst": "ss-about-2.liquid",
        "name": "SS About #2 (Ribbon)",
        "class": "about-split2",
        "variant": "ps-b",
        "note": "About split — leaf ribbon (Downloads content-split-2).",
    },
    {
        "src": "content-split-3.liquid",
        "dst": "ss-about-3.liquid",
        "name": "SS About #3 (Stamp)",
        "class": "about-split3",
        "variant": "ps-c",
        "note": "About split — numbered stamp (Downloads content-split-3).",
    },
    {
        "src": "content-split-4.liquid",
        "dst": "ss-about-4.liquid",
        "name": "SS About #4 (Hero)",
        "class": "about-split4",
        "variant": "ps-d",
        "note": "About split — hero card (Downloads content-split-4).",
    },
]

(root / "assets" / "pm-split-styles.css").write_text(
    (dl / "pm-split-styles.css").read_text(encoding="utf-8"), encoding="utf-8"
)

btn_re = re.compile(
    r"\{%- if s\.button_label != blank -%\}\s*<a class=\"ps__btn\" href=\"\{\{ s\.button_link \| default: '#' \}\}\"><span>\{\{ s\.button_label \| escape \}\}</span><span class=\"ps__btn-arrow\" aria-hidden=\"true\"></span></a>\s*\{%- endif -%\}",
    re.S,
)
btn_new = """{%- if s.button_label != blank -%}
  <div class="ps__btn-wrap">
    {% render 'pm-button',
      label: s.button_label,
      link: s.button_link,
      style: 'brand',
      text_color: s.button_text_color,
      bg_color: s.button_bg_color,
      hover_text_color: s.button_hover_text_color,
      hover_bg_color: s.button_hover_bg_color,
      icon_bg: s.button_icon_bg,
      icon_color: s.button_icon_color,
      font_size: s.button_font_size
    %}
  </div>
{%- endif -%}"""

header = """{{ 'pm-split-styles.css' | asset_url | stylesheet_tag }}
{%- assign s = section.settings -%}
{%- capture badge_style -%}{%- render 'pm-block-type-style', settings: s, prefix: 'badge_' -%}{%- endcapture -%}
{%- capture heading_style -%}{%- render 'pm-block-type-style', settings: s, prefix: 'heading_' -%}{%- endcapture -%}
{%- capture label_style -%}{%- render 'pm-block-type-style', settings: s, prefix: 'label_' -%}{%- endcapture -%}
{%- capture body_style -%}{%- render 'pm-block-type-style', settings: s, prefix: 'body_' -%}{%- endcapture -%}
{%- capture panel_title_style -%}{%- render 'pm-block-type-style', settings: s, prefix: 'panel_title_' -%}{%- endcapture -%}
{%- capture panel_text_style -%}{%- render 'pm-block-type-style', settings: s, prefix: 'panel_text_' -%}{%- endcapture -%}

"""

for spec in specs:
    raw = (dl / spec["src"]).read_text(encoding="utf-8")
    m = re.search(r"\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}", raw, re.S)
    schema = json.loads(m.group(1))
    schema["name"] = spec["name"]
    schema["class"] = spec["class"]
    schema["presets"][0]["name"] = spec["name"]

    settings = schema["settings"]
    settings.insert(1, {"type": "paragraph", "content": spec["note"]})
    settings.extend(extra_settings)
    for label, prefix in type_prefixes:
        settings.extend(type_group(label, prefix))

    body = raw[: m.start()]
    body = re.sub(r"\{\{\s*'pm-split-styles\.css'[^}]+\}\}\s*", "", body)
    body = body.replace("{%- assign s = section.settings -%}", "")
    body = body.replace(
        f'class="ps {spec["variant"]}',
        f'id="AboutSplit-{{{{ section.id }}}}" class="section-{{{{ section.id }}}} pm-about-split ps {spec["variant"]}',
        1,
    )
    body = re.sub(
        r'style="--ps-accent: \{\{ s\.accent \}\}; --ps-ink: \{\{ s\.ink \}\}; --ps-bg: \{\{ s\.bg \}\}; --ps-pt: \{\{ s\.padding_top \}\}px; --ps-pb: \{\{ s\.padding_bottom \}\}px;"',
        'style="--ps-accent: {{ s.accent }}; --ps-ink: {{ s.ink }}; --ps-bg: {{ s.bg }}; --ps-pt: {{ s.padding_top }}px; --ps-pb: {{ s.padding_bottom }}px; margin-top: {{ s.margin_top }}px; margin-bottom: {{ s.margin_bottom }}px;"',
        body,
        count=1,
    )
    body = body.replace(
        '<div class="ps__wrap">',
        '<div class="ps__wrap{% unless s.full_width %} page-width{% endunless %}">',
        1,
    )
    body = body.replace(
        '<p class="ps__badge">',
        '<p class="ps__badge"{% if badge_style != blank %} style="{{ badge_style | strip }}"{% endif %}>',
        1,
    )
    body = body.replace(
        '<h2 class="ps__heading">',
        '<h2 class="ps__heading"{% if heading_style != blank %} style="{{ heading_style | strip }}"{% endif %}>',
        1,
    )
    body = body.replace(
        '<strong class="ps__label">',
        '<strong class="ps__label"{% if label_style != blank %} style="{{ label_style | strip }}"{% endif %}>',
    )
    body = body.replace(
        '<p class="ps__body">',
        '<p class="ps__body"{% if body_style != blank %} style="{{ body_style | strip }}"{% endif %}>',
    )
    body = body.replace(
        '<h3 class="ps__panel-title">',
        '<h3 class="ps__panel-title"{% if panel_title_style != blank %} style="{{ panel_title_style | strip }}"{% endif %}>',
        1,
    )
    body = body.replace(
        '<p class="ps__panel-text">',
        '<p class="ps__panel-text"{% if panel_text_style != blank %} style="{{ panel_text_style | strip }}"{% endif %}>',
        1,
    )

    body2, n = btn_re.subn(btn_new, body)
    if n == 0:
        print("WARN: button not replaced in", spec["dst"])
    else:
        body = body2

    out = header + body.strip() + "\n\n{% schema %}\n" + json.dumps(schema, indent=2, ensure_ascii=False) + "\n{% endschema %}\n"
    (root / "sections" / spec["dst"]).write_text(out, encoding="utf-8")
    json.loads(re.search(r"\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}", out, re.S).group(1))
    print("Wrote", spec["dst"], "settings", len(schema["settings"]))

print("done")
