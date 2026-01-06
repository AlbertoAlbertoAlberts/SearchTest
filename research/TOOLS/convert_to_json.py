import csv
import json

# Convert categories_main.csv
with open('categories_main.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    categories_main = []
    for row in reader:
        categories_main.append({
            'id': row['category_id'],
            'name': row['category_level_3'] or row['category_level_2'] or row['category_level_1'],
            'level1': row['category_level_1'],
            'level2': row['category_level_2'] or None,
            'level3': row['category_level_3'] or None,
            'type': row['category_type'],
            'blacklistReason': row['blacklist_reason'] or None,
            'ssId': row['ss_category_id'],
            'andeleId': row['andele_category_id'] or None
        })

with open('categories_main.json', 'w', encoding='utf-8') as f:
    json.dump(categories_main, f, ensure_ascii=False, indent=2)

print(f"✅ Created categories_main.json ({len(categories_main)} categories)")

# Convert ss-lv-category-mapping.csv
with open('ss-lv-category-mapping.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    ss_categories = []
    for row in reader:
        ss_categories.append({
            'id': row['id'],
            'level1': row['category_level_1'],
            'level2': row['category_level_2'] or None,
            'level3': row['category_level_3'] or None,
            'name': row['category_level_3'] or row['category_level_2'] or row['category_level_1'],
            'url': row['url'],
            'type': row['category_type'],
            'blacklistReason': row['blacklist_reason'] or None
        })

with open('ss-lv-categories.json', 'w', encoding='utf-8') as f:
    json.dump(ss_categories, f, ensure_ascii=False, indent=2)

print(f"✅ Created ss-lv-categories.json ({len(ss_categories)} categories)")

# Convert andele-category-mapping.csv
with open('andele-category-mapping.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    andele_categories = []
    for row in reader:
        andele_categories.append({
            'id': row['id'],
            'level1': row['category_level_1'],
            'level2': row['category_level_2'] or None,
            'level3': row['category_level_3'] or None,
            'name': row['category_level_3'] or row['category_level_2'] or row['category_level_1'],
            'url': row['url']
        })

with open('andele-categories.json', 'w', encoding='utf-8') as f:
    json.dump(andele_categories, f, ensure_ascii=False, indent=2)

print(f"✅ Created andele-categories.json ({len(andele_categories)} categories)")

print(f"\n📦 All JSON files created successfully!")
print(f"   - categories_main.json (unified mapping)")
print(f"   - ss-lv-categories.json (SS.lv specific)")
print(f"   - andele-categories.json (Andele specific)")
