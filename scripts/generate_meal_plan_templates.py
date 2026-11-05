"""Generate product.N-meal-plan.json templates for N = 1..30 from the 6-meal base."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
BASE = TEMPLATES / "product.6-meal-plan.json"

HEADER = """/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin theme editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */
"""


def main() -> None:
    raw = BASE.read_text(encoding="utf-8")
    body = re.sub(r"^/\*.*?\*/\s*", "", raw, count=1, flags=re.S)
    data = json.loads(body)
    created: list[str] = []

    for n in range(1, 31):
        if n == 6:
            continue
        d = json.loads(json.dumps(data))
        sec = d.get("sections", {}).get("mp_page", {})
        settings = sec.setdefault("settings", {})
        settings.update(
            {
                "plan_label": f"{n} Meal Plan",
                "picker_count": n,
                "ben_line_1": f"{n} meals.",
                "button_label": f"Build my {n} meals",
                "cta_button_label": f"Build my {n} meal plan",
                "content_product": f"{n}-meal-plan",
                "plan_product": f"{n}-meal-plan",
                "meals_product": f"{n}-meal-plan",
            }
        )
        blocks = sec.setdefault("blocks", {})
        if "area_hero" in blocks:
            hs = blocks["area_hero"].setdefault("settings", {})
            hs["plan_label"] = f"{n} Meal Plan"
            hs["button_label"] = f"Build my {n} meals"
        if "hero_button_1" in blocks:
            blocks["hero_button_1"].setdefault("settings", {})["label"] = f"Build my {n} meals"
        if "area_benefits" in blocks:
            blocks["area_benefits"].setdefault("settings", {})["line_1"] = f"{n} meals."
        if "area_cta" in blocks:
            blocks["area_cta"].setdefault("settings", {})["button_label"] = f"Build my {n} meal plan"

        out = TEMPLATES / f"product.{n}-meal-plan.json"
        out.write_text(HEADER + json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        created.append(out.name)

    print(f"created {len(created)} templates")
    for name in created:
        print(name)


if __name__ == "__main__":
    main()
