"""Set each Meal Plan product's theme templateSuffix to N-meal-plan."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "scripts" / "meal-products.json").read_text(encoding="utf-8"))
STORE = "prepmeal-dev.myshopify.com"


def run_graphql(variables: dict) -> dict:
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
        str(ROOT / "scripts" / "product-update-template.graphql"),
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
        raise SystemExit("productUpdate failed")
    return json.loads(out_path.read_text(encoding="utf-8"))


def main() -> None:
    for product in DATA["products"]["nodes"]:
        title = product.get("title") or ""
        m = re.match(r"^(\d+)\s+Meal Plan$", title.strip(), re.I)
        if not m:
            continue
        n = int(m.group(1))
        suffix = f"{n}-meal-plan"
        result = run_graphql({"input": {"id": product["id"], "templateSuffix": suffix}})
        errors = result.get("productUpdate", {}).get("userErrors") or []
        if errors:
            print("error", title, errors)
        else:
            print(f"{title} -> {suffix}")


if __name__ == "__main__":
    main()
