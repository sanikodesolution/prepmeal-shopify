import json
from pathlib import Path

d = json.loads(Path("scripts/meal-products-verify.json").read_text(encoding="utf-8"))
for p in d["products"]["nodes"]:
    print(f"{p['title']}: inv={p['totalInventory']} tracked={p['tracksInventory']}")
