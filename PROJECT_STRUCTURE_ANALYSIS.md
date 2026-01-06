# Project Structure Analysis & Reorganization Plan

## Current Project Overview

**Project Type**: Marketplace Aggregator (Next.js + Node.js)
**Purpose**: Unified search interface for second-hand marketplaces across multiple European countries
**Status**: MVP Phase 0 complete with proof-of-concept implementations

---

## Current Structure (AS-IS)

### Core Application Files
```
/pages/
  ├─ index.js              # Main UI/search page
  ├─ _app.js              # Next.js app wrapper
  └─ /api
     └─ search.js         # API orchestrator endpoint

/components/
  ├─ Header.js            # Navigation component
  ├─ SearchBar.js         # Search input component
  ├─ Sidebar.js           # Filters sidebar
  ├─ FilterCard.js        # Filter card component
  ├─ FilterChips.js       # Filter chip display
  ├─ ResultsView.js       # Results list container
  ├─ ListingCard.js       # Individual listing card
  ├─ SkeletonCard.js      # Loading skeleton
  ├─ /shared/
  │  └─ CheckmarkIcon.js  # Reusable icon
  └─ *.module.css         # Component-scoped styles

/lib/
  ├─ adapters/
  │  ├─ ss.js             # SS.com marketplace adapter
  │  ├─ osta.js           # OSTA marketplace adapter
  │  └─ andele.js         # Andele marketplace adapter
  ├─ cache.js             # Caching layer
  ├─ http.js              # HTTP client utilities
  ├─ normalize.js         # Schema normalization
  ├─ filterHelpers.js     # Filter logic utilities
  ├─ textHelpers.js       # Text processing utilities
  ├─ mockData.js          # Mock data for testing
  └─ browser.js           # Browser automation utilities

/styles/
  ├─ globals.css          # Global styles
  └─ Home.module.css      # Home page styles

/CATEGORIES/
  ├─ categories_main.json # Main category mapping
  ├─ ss-lv-categories.json
  ├─ andele-categories.json
  ├─ convert_to_json.py   # Conversion utility
  ├─ show_samples.js      # Display utility
  └─ /CSV/
     ├─ categories_main.csv
     ├─ ss-lv-category-mapping.csv
     └─ andele-category-mapping.csv
```

### Research & Documentation Files (ROOT LEVEL)

**Findings Files** (8 files - research documentation):
- `allegro-findings.md` - Allegro marketplace research
- `olx-findings.md` - OLX marketplace research
- `osta-reconnaissance-findings.md` - OSTA reconnaissance
- `skelbiu-findings.md` - Skelbiu marketplace research
- `soov-findings.md` - Soov marketplace research
- `sprzedajemy-findings.md` - Sprzedajemy research
- `tori-findings.md` - Tori marketplace research
- `vinted-findings.md` - Vinted marketplace research

**Adapter Plans** (2 files):
- `osta_adapter_plan.md`
- `okidoki_adapter_plan.md`

**Planning Documents** (5 files):
- `check_sites.md`
- `check_sites_phase2.md`
- `filtering-price.md`
- `availableplatforms.md`
- `okidoki-reconnaissance-findings.md`

**Sample HTML Files** (8 files - cached search result pages):
- `allegro-search-sample.html`
- `olx-search-sample.html`
- `skelbiu-search-sample.html`
- `soov-search-sample.html`
- `sprzedajemy-search-sample.html`
- `tori-search-sample.html`
- `vinted-search-sample.html`

### Test Files (8 files - ROOT LEVEL)

```
test-allegro-access.js
test-huuto-access.js
test-olx-access.js
test-skelbiu-access.js
test-soov-access.js
test-sprzedajemy-access.js
test-tori-access.js
test-vinted-access.js
```

### Debug Files (2 files)

```
debug-search.js
debug-osta-html.js
```

### Completed Plans Folder (12 files - ARCHIVED)

```
/Completed_Plans/
  ├─ ANDELE_COMPLETE.md
  ├─ ANDELE_FULL_LIST.md
  ├─ Andele_implementation.md
  ├─ bestprice.md
  ├─ Category_Implementation.md
  ├─ CODE_OPTIMIZATION_DONE.md
  ├─ FRONTEND-PLAN_DONE.md
  ├─ NEXT_STEPS.md
  ├─ PAGES_TOTAL_PLAN.md
  ├─ PERFORMANCE_IMPROVEMENTS_DONE.md
  ├─ PHASE1_RESEARCH.md
  └─ Summary 27-28_2025_Done.md
```

### Configuration & Package Files
- `package.json`
- `package-lock.json`
- `.gitignore`

### Conversion Utility (ROOT LEVEL)
- `convert_to_json.py` - Category conversion script

---

## Issues with Current Structure

### 1. **Root Folder Clutter** (CRITICAL)
- **20+ files at root level** that should be organized
- Test files mixed with documentation
- Sample HTML files competing for attention
- Research findings scattered across root
- Utility scripts at root level

### 2. **Research/Documentation Organization** (HIGH)
- No dedicated research folder
- Findings, plans, and samples all at root level
- Makes it hard to distinguish active code from research
- 8+ sample HTML files take up space (could be ignored)

### 3. **Test Files Location** (HIGH)
- 8 test files at root level (unmaintained, outdated)
- Not in a standard `tests/` or `__tests__/` folder
- No test runner configured in `package.json`
- Unclear if these are still relevant or just for reference

### 4. **Debug Files at Root** (MEDIUM)
- 2 debug files shouldn't be in root
- Should be in a debug/scratch folder

### 5. **Completed Plans Folder** (MEDIUM)
- Archive is good, but contents could be compressed
- 12 markdown files documenting historical decisions
- Takes up space when not actively used

---

## Recommended New Structure

```
/marketplace-aggregator/
├─ .github/
│  ├─ workflows/          # (optional future) CI/CD pipelines
│  └─ ISSUE_TEMPLATE/     # (optional future)
│
├─ /src/                  # PRIMARY APPLICATION CODE
│  ├─ /pages/
│  │  ├─ index.js
│  │  ├─ _app.js
│  │  └─ /api/
│  │     └─ search.js
│  │
│  ├─ /components/
│  │  ├─ Header.js
│  │  ├─ SearchBar.js
│  │  ├─ Sidebar.js
│  │  ├─ FilterCard.js
│  │  ├─ FilterChips.js
│  │  ├─ ResultsView.js
│  │  ├─ ListingCard.js
│  │  ├─ SkeletonCard.js
│  │  ├─ /shared/
│  │  │  └─ CheckmarkIcon.js
│  │  └─ *.module.css
│  │
│  ├─ /lib/
│  │  ├─ adapters/
│  │  │  ├─ ss.js
│  │  │  ├─ osta.js
│  │  │  └─ andele.js
│  │  ├─ cache.js
│  │  ├─ http.js
│  │  ├─ normalize.js
│  │  ├─ filterHelpers.js
│  │  ├─ textHelpers.js
│  │  └─ browser.js
│  │
│  ├─ /styles/
│  │  ├─ globals.css
│  │  └─ Home.module.css
│  │
│  └─ /data/
│     ├─ categories_main.json
│     ├─ ss-lv-categories.json
│     └─ andele-categories.json
│
├─ /research/             # RESEARCH & DOCUMENTATION
│  ├─ FINDINGS/           # Marketplace research
│  │  ├─ allegro-findings.md
│  │  ├─ olx-findings.md
│  │  ├─ osta-reconnaissance-findings.md
│  │  ├─ okidoki-reconnaissance-findings.md
│  │  ├─ skelbiu-findings.md
│  │  ├─ soov-findings.md
│  │  ├─ sprzedajemy-findings.md
│  │  ├─ tori-findings.md
│  │  └─ vinted-findings.md
│  │
│  ├─ SAMPLES/           # Cached HTML samples (can be gitignored)
│  │  ├─ allegro-search-sample.html
│  │  ├─ olx-search-sample.html
│  │  ├─ skelbiu-search-sample.html
│  │  ├─ soov-search-sample.html
│  │  ├─ sprzedajemy-search-sample.html
│  │  ├─ tori-search-sample.html
│  │  └─ vinted-search-sample.html
│  │
│  ├─ PLANS/             # Historical & Current Plans
│  │  ├─ osta_adapter_plan.md
│  │  ├─ okidoki_adapter_plan.md
│  │  ├─ check_sites.md
│  │  ├─ check_sites_phase2.md
│  │  ├─ filtering-price.md
│  │  ├─ availableplatforms.md
│  │  └─ ARCHIVE/        # Completed plans (optional compress)
│  │     ├─ ANDELE_COMPLETE.md
│  │     ├─ Category_Implementation.md
│  │     └─ ... (rest of completed plans)
│  │
│  └─ TOOLS/            # Data conversion utilities
│     ├─ convert_to_json.py
│     ├─ show_samples.js
│     ├─ categories-mapping.csv
│     └─ ...
│
├─ /tests/               # TEST FILES (Not currently maintained)
│  ├─ integration/
│  │  ├─ test-allegro-access.js
│  │  ├─ test-huuto-access.js
│  │  ├─ test-olx-access.js
│  │  ├─ test-skelbiu-access.js
│  │  ├─ test-soov-access.js
│  │  ├─ test-sprzedajemy-access.js
│  │  ├─ test-tori-access.js
│  │  └─ test-vinted-access.js
│  │
│  └─ debug/
│     ├─ debug-search.js
│     └─ debug-osta-html.js
│
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ SPEC.md                # Core specification (KEEP AT ROOT)
├─ ARCHITECTURE.md        # Core architecture (KEEP AT ROOT)
├─ README.md              # (CREATE) Project overview
└─ /node_modules/
```

---

## Reorganization Plan

### Phase 1: Create Folder Structure (Lowest Risk)
1. Create `/src/` folder
2. Create `/research/`, `/research/FINDINGS/`, `/research/SAMPLES/`, `/research/PLANS/`, `/research/TOOLS/`
3. Create `/tests/integration/` and `/tests/debug/`
4. Create `/src/data/` for JSON category files

### Phase 2: Move Application Code (MEDIUM RISK)
1. Move `pages/` → `src/pages/`
2. Move `components/` → `src/components/`
3. Move `lib/` → `src/lib/`
4. Move `styles/` → `src/styles/`
5. Update imports in all files (use search-replace)

### Phase 3: Move Research & Documentation (LOW RISK)
1. Move findings files → `research/FINDINGS/`
2. Move sample HTML → `research/SAMPLES/` (add to `.gitignore`)
3. Move plans → `research/PLANS/`
4. Move utilities → `research/TOOLS/`

### Phase 4: Move Tests (LOW RISK)
1. Move test files → `tests/integration/`
2. Move debug files → `tests/debug/`

### Phase 5: Update Configuration (MEDIUM RISK)
1. Update `.gitignore` to ignore `/research/SAMPLES/*.html`
2. Update any build/dev scripts if they reference old paths
3. Create README.md at root

### Phase 6: Verify & Clean (LOW RISK)
1. Remove empty old folders
2. Test dev server still works
3. Commit to git

---

## What to Remove/Relocate

### REMOVE (or gitignore):
| Item | Reason | Action |
|------|--------|--------|
| `*.html` sample files | Cache files, not source code | Move to `research/SAMPLES/`, gitignore |
| `Completed_Plans/` | Historical archive | Keep but archive, compress into single file if desired |
| `convert_to_json.py` | Utility script, not app code | Move to `research/TOOLS/` |
| Test files at root | Should be in tests folder | Move to `tests/integration/` |
| Debug files at root | Should be in tests folder | Move to `tests/debug/` |
| `package-lock.json` | Config, but necessary | Keep at root |
| `.next/` | Build output | Already in `.gitignore` |
| `node_modules/` | Dependencies | Already in `.gitignore` |

### KEEP AT ROOT:
| Item | Reason |
|------|--------|
| `SPEC.md` | Core specification document |
| `ARCHITECTURE.md` | Core architecture document |
| `package.json` | NPM configuration (must be at root) |
| `.gitignore` | Git configuration |
| `README.md` | (Create) Project overview |

### RELOCATE:
| From | To | Items |
|------|-----|-------|
| Root | `src/` | pages/, components/, lib/, styles/ |
| Root | `research/FINDINGS/` | *-findings.md, *-reconnaissance-findings.md (8 files) |
| Root | `research/SAMPLES/` | *-search-sample.html (8 files) |
| Root | `research/PLANS/` | *_adapter_plan.md, check_sites.md, filtering-price.md, etc. |
| Root | `research/TOOLS/` | convert_to_json.py, category files |
| Root | `tests/integration/` | test-*.js (8 files) |
| Root | `tests/debug/` | debug-*.js (2 files) |
| Root | `src/data/` | category JSON files |
| Root | `research/PLANS/ARCHIVE/` | Completed_Plans/* (12 files) |

---

## Expected Benefits

✅ **Cleaner root directory** - Only 7 essential files instead of 30+  
✅ **Clear separation of concerns** - App code, research, tests are distinct  
✅ **Easier onboarding** - New developers see `src/` as application code  
✅ **Better git hygiene** - Can gitignore research samples and debug files  
✅ **Scalability** - Room to add tests/, docs/, scripts/ etc.  
✅ **IDE clarity** - Easier to navigate in VS Code  
✅ **Professional structure** - Follows Next.js + Node.js conventions  

---

## Migration Checklist

- [x] Create folder structure
- [x] Move application code to `/src/`
- [x] Update import paths in all JS files
- [x] Move research files to `/research/`
- [x] Move test files to `/tests/`
- [x] Update `.gitignore` for research samples
- [x] Create README.md
- [ ] Test `npm run dev` still works
- [ ] Test `npm run build` still works
- [ ] Commit to git
- [ ] Delete old empty folders

