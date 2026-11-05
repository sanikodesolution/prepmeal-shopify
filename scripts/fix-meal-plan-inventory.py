"""Build GraphQL variables to track + stock meal-plan product variants."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "scripts" / "meal-products.json").read_text(encoding="utf-8"))
TARGET_QTY = 25

products = DATA["products"]["nodes"]
locations = DATA["locations"]["nodes"]
location_id = locations[0]["id"]

items_to_track: list[str] = []
quantities: list[dict] = []

for product in products:
    title = product.get("title") or ""
    if "Meal Plan" not in title:
        continue
    for variant in product["variants"]["nodes"]:
        item = variant["inventoryItem"]
        item_id = item["id"]
        if not item.get("tracked"):
            items_to_track.append(item_id)
        quantities.append(
            {
                "inventoryItemId": item_id,
                "locationId": location_id,
                "quantity": TARGET_QTY,
            }
        )

out = {
    "locationId": location_id,
    "itemsToTrack": items_to_track,
    "quantities": quantities,
    "productCount": sum(1 for p in products if "Meal Plan" in (p.get("title") or "")),
    "variantCount": len(quantities),
}
(ROOT / "scripts" / "inventory-plan.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
print(json.dumps({k: out[k] for k in ("locationId", "productCount", "variantCount")}, indent=2))
print(f"items to enable tracking: {len(items_to_track)}")
