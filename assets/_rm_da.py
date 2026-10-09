import json
from pathlib import Path

path = Path(r"G:\kodesolution\htdocs\sanikodesolution\shopify\prepmeal-shopify\templates\index.json")
raw = path.read_text(encoding="utf-8")
comment, body = raw.split("*/", 1)
data = json.loads(body)
removed = []
for key in list(data["sections"]):
    if data["sections"][key].get("type") in ("cm-delivery-areas", "image-banner") and key != "image_banner":
        if "DELIVERY" in json.dumps(data["sections"][key]).upper() or data["sections"][key].get("type") == "cm-delivery-areas":
            removed.append(key)
            del data["sections"][key]
data["order"] = [item for item in data["order"] if item not in removed and item != "cm_delivery_areas" and item != "image_banner_tTXiaq"]
path.write_text(comment + "*/\n" + json.dumps(data, indent=2) + "\n", encoding="utf-8")
print("removed", removed)
print("order", data["order"])
print("types", [data["sections"][k]["type"] for k in data["order"]])
