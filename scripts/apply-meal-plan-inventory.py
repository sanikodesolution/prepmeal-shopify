"""Enable tracking + set stock on all Meal Plan product variants."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = json.loads((ROOT / "scripts" / "inventory-plan.json").read_text(encoding="utf-8"))
STORE = "prepmeal-dev.myshopify.com"
QTY = 25


def run_graphql(query_file: Path, variables: dict) -> dict:
    var_path = ROOT / "scripts" / "_tmp-vars.json"
    out_path = ROOT / "scripts" / "_tmp-out.json"
    var_path.write_text(json.dumps(variables), encoding="utf-8")
    shopify = "shopify.cmd" if sys.platform.startswith("win") else "shopify"
    cmd = [
        shopify,
        "store",
        "execute",
        "-s",
        STORE,
        "--query-file",
        str(query_file),
        "--variable-file",
        str(var_path),
        "--allow-mutations",
        "-j",
        "--output-file",
        str(out_path),
    ]
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, shell=sys.platform.startswith("win"))
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(f"GraphQL failed for {query_file.name}")
    return json.loads(out_path.read_text(encoding="utf-8"))


def main() -> None:
    location_id = PLAN["locationId"]
    track_file = ROOT / "scripts" / "inventory-item-update.graphql"
    activate_file = ROOT / "scripts" / "inventory-activate.graphql"
    set_file = ROOT / "scripts" / "inventory-set-quantities.graphql"

    skip_track = "--skip-track" in sys.argv
    if not skip_track:
        print(f"Enabling tracking on {len(PLAN['itemsToTrack'])} items...")
        for item_id in PLAN["itemsToTrack"]:
            result = run_graphql(track_file, {"id": item_id, "input": {"tracked": True}})
            errors = result.get("inventoryItemUpdate", {}).get("userErrors") or []
            if errors:
                print("track error", item_id, errors)
    else:
        print("Skipping tracking pass (--skip-track)")

    print(f"Activating + stocking {len(PLAN['quantities'])} variants at qty {QTY}...")
    for idx, row in enumerate(PLAN["quantities"], start=1):
        item_id = row["inventoryItemId"]
        key = f"prepmeal-activate-{idx}-{item_id.split('/')[-1]}"
        activate_query = ROOT / "scripts" / "_tmp-activate.graphql"
        activate_query.write_text(
            f"""mutation inventoryActivate($inventoryItemId: ID!, $locationId: ID!, $available: Int) {{
  inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId, available: $available) @idempotent(key: "{key}") {{
    inventoryLevel {{ id }}
    userErrors {{ field message }}
  }}
}}
""",
            encoding="utf-8",
        )
        result = run_graphql(
            activate_query,
            {
                "inventoryItemId": item_id,
                "locationId": location_id,
                "available": QTY,
            },
        )
        errors = result.get("inventoryActivate", {}).get("userErrors") or []
        if not errors:
            print(f"[{idx}/{len(PLAN['quantities'])}] activated ok")
            continue

        msg = " | ".join(e.get("message") or "" for e in errors)
        print(f"[{idx}/{len(PLAN['quantities'])}] activate note: {msg}")

        set_key = f"prepmeal-setqty-{idx}-{item_id.split('/')[-1]}"
        set_query = ROOT / "scripts" / "_tmp-setqty.graphql"
        set_query.write_text(
            f"""mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {{
  inventorySetQuantities(input: $input) @idempotent(key: "{set_key}") {{
    userErrors {{ field message code }}
  }}
}}
""",
            encoding="utf-8",
        )
        result = run_graphql(
            set_query,
            {
                "input": {
                    "name": "available",
                    "reason": "correction",
                    "quantities": [
                        {
                            "inventoryItemId": item_id,
                            "locationId": location_id,
                            "quantity": QTY,
                            "changeFromQuantity": None,
                        }
                    ],
                }
            },
        )
        set_errors = result.get("inventorySetQuantities", {}).get("userErrors") or []
        if set_errors:
            print("stock error", item_id, set_errors)
        else:
            print(f"[{idx}/{len(PLAN['quantities'])}] set qty ok")

    print("done")


if __name__ == "__main__":
    main()
