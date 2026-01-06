# Category Implementation Plan

## Overview
Create a unified category mapping system (`categories_main.csv`) that uses SS.lv's detailed structure as the foundation and maps Andele's broader categories to it.

**Challenge:** SS.lv has 216 categories with deep granularity (brand-specific phone categories, detailed audio equipment), while Andele has 111 categories with broader groupings. Not all categories overlap 1:1.

---

## Current State Analysis

### SS.lv Structure (216 categories)
- **Depth:** 3 levels (Level 1 → Level 2 → Level 3)
- **Granularity:** Very detailed (e.g., separate categories for Apple, Samsung, Xiaomi phones)
- **Unique:** Many SS.lv-specific categories (Satellite TV equipment, Radio components, specific TV types)
- **IDs:** SS00001 - SS00216

### Andele Structure (111 categories)
- **Depth:** 2-3 levels (Level 1 → Level 2 → Level 3 where applicable)
- **Granularity:** Broader (e.g., single "TELEFONI" with subcategories for iOS/Android)
- **Unique:** Some Andele-specific categories (Beauty devices, Climate control)
- **IDs:** AM00001 - AM00111

---

## Phase 1: Analysis & Mapping Strategy

### 1.1 Category Overlap Identification
**Goal:** Identify direct 1:1 mappings, many-to-one mappings, and unmapped categories

**Direct Matches (Examples):**
- SS.lv "Datori" (Desktop computers) → Andele "Stacionārie datori"
- SS.lv "Piezīmjdatori" (Laptops) → Andele "Portatīvie datori"
- SS.lv "Monitori" → Andele "Monitori"

**Many-to-One Mappings (Examples):**
- SS.lv brand-specific phone categories (Apple, Samsung, Xiaomi, etc.) → Andele "Mob.telefoni IOS" / "Mob.telefoni Android"
- SS.lv detailed audio categories → Andele broader "AUDIO TEHNIKA" subcategories

**SS.lv Unique (No Andele equivalent):**
- Satellite TV equipment
- Radio components and repair services
- Specific TV types (CRT, Plasma)
- GPS navigation (separate category)

**Andele Unique (No SS.lv equivalent in electronics):**
- Beauty devices (hair dryers, electric shavers) - SS.lv has these under "Home Appliances"
- Climate control - SS.lv has under "Home Appliances"

### 1.2 Mapping Rules
1. **Use SS.lv structure as base** - All 216 SS.lv categories become rows
2. **Map Andele where clear overlap exists** - Add Andele ID to corresponding rows
3. **Leave Andele ID empty** for SS.lv-specific categories
4. **Handle SS.lv blacklisted categories** - Preserve blacklist status in main mapping

---

## Phase 2: Mapping Table Creation

### 2.1 Unified CSV Structure
```csv
category_id,category_level_1,category_level_2,category_level_3,category_type,blacklist_reason,ss_category_id,andele_category_id
```

**Field Descriptions:**
- `category_id`: Unique CM00001-CM00216 identifier
- `category_level_1/2/3`: From SS.lv structure (more detailed)
- `category_type`: normal | blacklisted
- `blacklist_reason`: repairs | services | rentals | non-item listings (if applicable)
- `ss_category_id`: Always populated (SS00001-SS00216)
- `andele_category_id`: Populated where mapping exists (AM00001-AM00111), empty otherwise

### 2.2 Mapping Logic Examples

**Example 1: Direct Match**
```
CM00030,Elektrotehnika,Datori un orgtehnika,Datori,normal,,SS00030,AM00019
```
SS.lv "Datori" (desktops) maps to Andele "Stacionārie datori"

**Example 2: Many-to-One**
```
CM00002,Elektrotehnika,Sakaru līdzekļi,Apple,normal,,SS00002,AM00052
CM00003,Elektrotehnika,Sakaru līdzekļi,Samsung,normal,,SS00003,AM00053
```
Both Apple and Samsung map to Andele's broader phone categories (iOS/Android)

**Example 3: SS.lv Unique (No Andele)**
```
CM00027,Elektrotehnika,Sakaru līdzekļi,Telefonu numuri,blacklisted,non-item listings,SS00027,
```
No Andele equivalent - andele_category_id left empty

---

## Phase 3: Implementation Approach

### 3.1 Automated Mapping (Python Script)
**Create:** `build_unified_categories.py`

**Logic:**
1. Load both CSVs (SS.lv and Andele)
2. Use SS.lv as base (216 rows)
3. For each SS.lv row:
   - Check for semantic match in Andele based on:
     - Exact name match (case-insensitive)
     - Keyword overlap (e.g., "Datori" → "datori")
     - Level 2/3 hierarchy match
   - If match found: Add Andele ID
   - If no match: Leave empty
4. Generate categories_main.csv with CM IDs

### 3.2 Manual Review & Refinement
After automated mapping:
- Review many-to-one mappings (e.g., phone brands)
- Verify semantic matches
- Document intentional gaps
- Add notes for complex mappings

### 3.3 Validation
- Ensure all 216 SS.lv categories present
- Verify no duplicate CM IDs
- Check andele_category_id references are valid
- Confirm blacklist statuses preserved

---

## Phase 4: Usage in Application

### 4.1 How It Works
1. **Search queries** hit both SS.lv and Andele adapters
2. Each listing returned has a source-specific category ID (SS##### or AM#####)
3. **Lookup** in categories_main.csv to get unified CM##### ID
4. **Frontend** can display category filters using CM IDs
5. **Users select CM category** → system knows which SS + Andele categories to search

### 4.2 Example Query Flow
```
User searches: "laptop"
├─ SS.lv adapter returns listings with category SS00031 (Piezīmjdatori)
├─ Andele adapter returns listings with category AM00018 (Portatīvie datori)
└─ Normalize: Both map to CM00031 in categories_main.csv
   → Display as single "Laptops" category to user
```

---

## Phase 5: Execution Plan

### Step-by-Step Implementation

**✅ Step 1: Create automated mapper** (~30 mins)
- Python script with semantic matching logic
- Handle name normalization (lowercase, remove diacritics)
- Output preliminary categories_main.csv

**✅ Step 2: Run automated mapping** (~5 mins)
- Generate initial categories_main.csv
- Review mapping quality (expect ~60-70% automated matches)

**✅ Step 3: Manual refinement** (~45 mins)
- Review unmapped rows
- Add many-to-one mappings for phone brands
- Document intentional gaps
- Verify complex categories (audio, video equipment)

**✅ Step 4: Validation** (~15 mins)
- Check data integrity
- Verify all IDs valid
- Test lookup queries

**✅ Step 5: Integration** (future)
- Update search API to use categories_main.csv
- Add category normalization to adapters
- Implement frontend category filters

---

## Mapping Complexity Matrix

| SS.lv Category Group | Andele Overlap | Mapping Type | Notes |
|---------------------|----------------|--------------|-------|
| Phones (brand-specific) | Partial | Many-to-one | Map to iOS/Android |
| Computers | High | 1:1 mostly | Clear matches |
| Audio/Video | Medium | 1:1 and gaps | Some SS unique items |
| Photo/Optics | High | 1:1 mostly | Clear matches |
| Batteries | Partial | Subset | Andele has fewer types |
| Home Appliances | High | 1:1 mostly | Different hierarchy |
| TVs | Medium | Mixed | SS has more TV types |
| Game Consoles | High | 1:1 | Clear match |
| Printers | High | 1:1 | Clear match |
| Climate Control | None | SS gap | Andele-only category |

---

## Decision: Execute Now or Phase?

**Recommendation: Execute in one go with automated + manual refinement**

**Rationale:**
- Python script handles 70% automatically
- Manual review of ~60 categories manageable
- Single commit keeps mapping consistent
- Can iterate later if needed

**Total Time Estimate:** ~90 minutes

---

## Next Action

Run automated mapper → Generate categories_main.csv → Manual review → Commit final version
