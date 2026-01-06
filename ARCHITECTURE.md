# Marketplace Aggregator – Architecture & MVP Plan

This document describes the current state of the project, architectural decisions, and the phased plan for building the MVP.

This file MUST be read together with:
- SPEC.md (data contracts, schemas, filters, limitations)

Copilot or other tools should treat these files as the source of truth.

---

## Project goal

Build a unified search interface for second-hand marketplaces across multiple European countries.

The platform does NOT sell items.
It aggregates search results and redirects users to the original listing on the source site.

---

## Current status (Phase 0 complete)

### What already exists
- Working Next.js app
- Server-side scraping proof-of-concept for SS.com
- Search UI (minimal, functional)
- `/api/search` endpoint
- Project structure prepared for multi-site expansion
- Clear MVP scope and limitations defined in SPEC.md

### Current folder structure

/
├─ src/                      # Application source code
│  ├─ pages/
│  │  ├─ index.js           # UI
│  │  ├─ _app.js            # Next.js app wrapper
│  │  └─ api/
│  │     └─ search.js       # API orchestrator
│  │
│  ├─ components/           # React components
│  │  ├─ Header.js
│  │  ├─ SearchBar.js
│  │  ├─ Sidebar.js
│  │  ├─ FilterCard.js
│  │  ├─ FilterChips.js
│  │  ├─ ResultsView.js
│  │  ├─ ListingCard.js
│  │  ├─ SkeletonCard.js
│  │  ├─ shared/            # Shared components
│  │  │  └─ CheckmarkIcon.js
│  │  └─ *.module.css       # Component styles
│  │
│  ├─ lib/
│  │  ├─ adapters/          # One adapter per marketplace
│  │  │  ├─ ss.js           # SS.com adapter
│  │  │  ├─ osta.js         # Osta adapter
│  │  │  └─ andele.js       # Andele adapter
│  │  ├─ cache.js           # Caching (memory or DB-backed later)
│  │  ├─ http.js            # Shared fetch helpers (headers, timeout)
│  │  ├─ normalize.js       # Normalize adapter output to Listing schema
│  │  ├─ filterHelpers.js   # Filter utilities
│  │  ├─ textHelpers.js     # Text processing utilities
│  │  └─ browser.js         # Browser automation utilities
│  │
│  ├─ styles/               # Global styles
│  │  ├─ globals.css
│  │  └─ Home.module.css
│  │
│  └─ data/                 # Static data files
│     ├─ categories_main.json
│     ├─ ss-lv-categories.json
│     └─ andele-categories.json
│
├─ research/                # Research & documentation
│  ├─ FINDINGS/             # Marketplace research
│  ├─ SAMPLES/              # HTML samples (gitignored)
│  ├─ PLANS/                # Implementation plans
│  │  └─ ARCHIVE/           # Completed plans
│  └─ TOOLS/                # Utilities & scripts
│
├─ tests/                   # Test files
│  ├─ integration/          # Integration tests
│  └─ debug/                # Debug scripts
│
├─ SPEC.md                  # Data schema, filters, constraints
├─ ARCHITECTURE.md          # This file
├─ README.md                # Project overview
└─ package.json             # Dependencies & scripts

---

## Core architectural rules

1. **Each marketplace has its own adapter**
   - One file per site
   - No cross-site logic inside adapters

2. **Adapters only parse search result pages**
   - No listing detail page fetching in MVP v1

3. **All adapters output the same Listing schema**
   - Defined in SPEC.md
   - Missing fields are allowed

4. **The API orchestrator does not scrape**
   - It only coordinates adapters, merges results, applies filters/sorting

5. **UI is source-agnostic**
   - New sites appear automatically via configuration

---

## Data flow (runtime)

1. User submits search query
2. Frontend calls `/api/search?q=...&sources=...`
3. API:
   - selects adapters
   - fetches results in parallel
   - normalizes output
   - caches results
4. API returns unified list
5. UI renders results
6. User clicks → redirected to original site

Results may be cached short-term.
Persistent storage is used for saved searches, refresh jobs, and notifications.

---

## Storage strategy (Level C)

The project is designed to support a database from the beginning.

### What is NOT stored
- Scraped listings are not permanently stored by default
- Original images and descriptions are not copied

### What IS stored
- Users (or external auth provider)
- Saved searches
- Search refresh runs
- Previously seen listings (for notifications)
- Optional short-term search cache

Database choice:
- Supabase / PostgreSQL recommended
- SQLite acceptable for local development

---

## MVP v1 data fields (best effort)

Adapters attempt to extract:
- title
- priceText
- currency / priceValue (if parseable)
- postedAt (if available on list page)
- condition (if available on list page)
- hasDescription (boolean)
- hasImage (boolean)

Fields may be missing per site.

---

## Initial marketplaces (MVP targets)

### Latvia
- SS.lv / SS.com  
  https://www.ss.lv  
- Andele Mandele  
  https://www.andelemandele.lv  
- PP.lv  
  https://www.pp.lv  

### Estonia
- Okidoki  
  https://www.okidoki.ee  
- Osta  
  https://www.osta.ee  
- Soov  
  https://www.soov.ee  

### Lithuania
- Skelbiu  
  https://www.skelbiu.lt  
- Vinted (LT)  
  https://www.vinted.lt  

### Finland
- Tori  
  https://www.tori.fi  
- Huuto  
  https://www.huuto.net  

### Poland
- OLX  
  https://www.olx.pl  
- Allegro Lokalnie  
  https://allegrolokalnie.pl  
- Sprzedajemy  
  https://sprzedajemy.pl  

---

## MVP build phases (high level)

### Phase 1 — Refactor to adapter architecture
- Move SS scraping logic into `lib/adapters/ss.js`
- Implement adapter registry
- Update `/api/search` to orchestrate adapters
- Preserve existing functionality

### Phase 2 — Multi-site support
- Add 1–2 sites per country incrementally
- Each site = one adapter file
- Add source toggles in UI

### Phase 3 — Filters and sorting
- Price filtering
- Source and country filters
- Sorting (newest / price / relevance)

### Phase 4 — Persistence and saved searches
- User accounts
- Save searches
- Periodic refresh
- Detect new listings

### Phase 5 — Enrichment (post-MVP)
- Optional detail-page parsing
- AI summaries / icons
- Translation
- Partnerships / APIs

---

## Non-goals (for MVP)
- No copying full descriptions
- No hosting images
- No bypassing paywalls or logins
- No heavy crawling or indexing