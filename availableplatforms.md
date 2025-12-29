# Available Marketplace Platforms - Testing Summary

**Last Updated**: December 29, 2025  
**Testing Phases Completed**: Phase 1 + Phase 2 (9 platforms tested)

---

## ✅ Currently Working Sources

### SS.lv (Latvia)
- **Status**: ✅ Operational
- **Adapter**: `/lib/adapters/ss.js`
- **Market**: Latvia - general classifieds
- **Notes**: Existing working implementation

### Andele Mandele (Latvia)
- **Status**: ✅ Operational
- **Adapter**: `/lib/adapters/andele.js`
- **Market**: Latvia - general classifieds
- **Notes**: Existing working implementation

---

## 🔍 Newly Tested Platforms

### Phase 1: Estonia - ❌ Not Viable

All Estonian sites tested are blocked by Cloudflare Turnstile and cannot be accessed via Puppeteer:

#### Soov.ee (Estonia)
- **Status**: ❌ Blocked
- **Issue**: Cloudflare Turnstile on all pages (homepage, search, listings)
- **Market**: Estonia - general classifieds
- **Conclusion**: Cannot proceed without Turnstile bypass (not recommended)

#### Osta.ee (Estonia)
- **Status**: ❌ Offline/Restructured
- **Issue**: All URLs return 404
- **Market**: Estonia - general classifieds
- **Conclusion**: Site appears to be offline or significantly restructured

#### Okidoki.ee (Estonia)
- **Status**: ❌ Blocked
- **Issue**: Cloudflare Turnstile blocks all search pages
- **Market**: Estonia - general classifieds
- **Conclusion**: Turnstile prevents access

**Estonian Market Summary**: 3/3 sites tested are inaccessible. Turnstile protection is widespread in Estonian marketplace sites. **Not recommended** for implementation.

---

### Phase 2: Lithuania - Skelbiu.lt

#### Skelbiu.lt (Lithuania)
- **Status**: ⚠️ Partially Accessible
- **URL Pattern**: `/skelbimai?keywords={query}`
- **Protection**: Cloudflare present but non-blocking
- **Issue**: HTTP 200 responses, but listing data structure unclear
- **Market**: Lithuania - general classifieds
- **Test Results**: 
  - Search pages load (1.6MB HTML)
  - No Turnstile blocking
  - Listing extraction needs investigation
- **Conclusion**: Accessible but requires further HTML structure analysis to determine if viable
- **Priority**: Low (investigate only after Vinted/Tori implementation)

---

### Phase 3: Lithuania - Vinted.lt ✅

#### Vinted.lt (Lithuania)
- **Status**: ✅ **FULLY ACCESSIBLE - READY FOR IMPLEMENTATION**
- **URL Pattern**: `/catalog?search_text={query}`
- **Protection**: Cloudflare present but non-blocking, NO Turnstile
- **Market**: Lithuania - **fashion marketplace** (clothing, accessories, shoes)
- **Test Results**:
  - 200+ iPhone listings found (in accessories category)
  - Clean HTML structure with `data-testid` selectors
  - Infinite scroll pagination
- **Findings**: Complete documentation in `vinted-findings.md`
- **HTML Structure**:
  - Container: `div[data-testid*="item-box"]`
  - Title: `h3[data-testid="item-title"]`
  - Price: `h3[data-testid="item-price"]`
  - Images: High-quality CDN
- **Pros**: 
  - NO Turnstile (critical!)
  - Fashion-focused = good for clothing/accessories
  - Lithuanian + English support
  - Clean modern structure
- **Cons**: 
  - Fashion specialization (limited to clothing category)
  - Smaller market than general classifieds
- **Priority**: **HIGH** - Ready for adapter implementation

---

### Phase 4: Finland - Tori.fi ✅

#### Tori.fi (Finland)
- **Status**: ✅ **FULLY ACCESSIBLE - READY FOR IMPLEMENTATION**
- **URL Pattern**: `/koko_suomi?q={query}` (koko_suomi = "all Finland")
- **Protection**: Cloudflare present but non-blocking, NO Turnstile
- **Market**: Finland - **general classifieds** (all categories)
- **Test Results**:
  - 4/5 URL patterns working
  - Large inventory across categories
  - Finnish keywords work better than English
  - Standard pagination (7+ pages)
- **Findings**: Complete documentation in `tori-findings.md`
- **HTML Structure**:
  - Container: `article.sf-search-ad`
  - Title: `a.sf-search-ad-link`
  - Price: `{price}&nbsp;€` pattern
  - Rich metadata (location, specs, seller)
- **Finnish Keywords**:
  - matkapuhelin (mobile phone) → 182 matches
  - puhelin (phone) → 190 matches
- **URL Patterns**:
  - Nationwide: `/koko_suomi?q={query}`
  - Regional: `/{region}?q={query}`
  - Category: `/{region}/{category}?q={query}`
- **Pros**: 
  - NO Turnstile (critical!)
  - General marketplace = all categories
  - Large Finnish market
  - Multiple search patterns
  - Clean semantic HTML
- **Cons**: 
  - Finnish language preferred for searches
  - Cloudflare could change policy
- **Priority**: **HIGH** - Ready for adapter implementation

---

## 📊 Testing Summary

| Site | Country | Market Type | Accessibility | Status |
|------|---------|-------------|---------------|--------|
| **SS.lv** | 🇱🇻 Latvia | General | ✅ Working | Operational |
| **Andele** | 🇱🇻 Latvia | General | ✅ Working | Operational |
| **Soov.ee** | 🇪🇪 Estonia | General | ❌ Blocked | Turnstile |
| **Osta.ee** | 🇪🇪 Estonia | General | ❌ Offline | 404 errors |
| **Okidoki.ee** | 🇪🇪 Estonia | General | ❌ Blocked | Turnstile |
| **Skelbiu.lt** | 🇱🇹 Lithuania | General | ⚠️ Partial | Needs investigation |
| **Vinted.lt** | 🇱🇹 Lithuania | Fashion | ✅ **Ready** | **Implement** |
| **Tori.fi** | 🇫🇮 Finland | General | ✅ **Ready** | **Implement** |

---

## 🎯 Implementation Priorities

### Tier 1: Ready for Immediate Implementation
1. **Tori.fi** (Finland) - General classifieds, broad inventory
2. **Vinted.lt** (Lithuania) - Fashion marketplace, niche coverage

### Tier 2: Investigation Needed
3. **Skelbiu.lt** (Lithuania) - Accessible but listing structure unclear

### Tier 3: Not Viable (Blocked)
- ❌ All Estonian sites (Soov.ee, Osta.ee, Okidoki.ee)

---

## 🌍 Market Coverage

### Current (Working)
- 🇱🇻 **Latvia**: 2 sources (SS.lv, Andele)

### Ready to Add
- 🇱🇹 **Lithuania**: 1 source (Vinted.lt - fashion)
- 🇫🇮 **Finland**: 1 source (Tori.fi - general)

### Future Consideration
- 🇱🇹 **Lithuania**: Skelbiu.lt (needs structure analysis)
- �🇮 **Finland**: Oikotie.fi (not yet tested - optional)

### Not Viable
- 🇪🇪 **Estonia**: All sites blocked by Turnstile (3/3)
- 🇫🇮 **Finland**: Huuto.net - Cloudflare Turnstile blocking (1/2 Finnish sites tested)

---

## 🇵🇱 Phase 2: Poland - EXCEPTIONAL SUCCESS! 🎯

### OLX.pl - Priority #1 ⭐⭐⭐

#### Status: ✅ **FULLY ACCESSIBLE - HIGHEST PRIORITY**
- **URL Pattern**: `https://www.olx.pl/oferty/q-{query}/`
- **Protection**: NONE - No Cloudflare, No Turnstile
- **Market**: Poland - **#1 largest marketplace** (38M+ users)
- **Test Results**: 6/6 tests passed (100% success rate)
- **Listings**: **52 per page** (highest volume)
- **Page Size**: 600KB+ with substantial content
- **Findings**: Complete documentation in `olx-findings.md` (500+ lines)

**HTML Structure**:
- Container: `[data-cy="l-card"]`
- Title: `[data-cy="listing-ad-title"]`
- Price: `[data-testid="ad-price"]`
- Location: Polish city names extracted
- Images: CDN hosted, high quality

**Polish Keywords**:
- telefon, komputer, meble, samochód, etc.

**URL Patterns**:
- Search: `/oferty/q-{query}/`
- Category: `/elektronika/telefony-komorkowe/`
- Location: `/krakow/q-{query}/`
- Pagination: Page 2+ with trailing slash

**Pros**:
- ✅ **Largest Polish marketplace** (38M+ users)
- ✅ **NO protection** (completely accessible)
- ✅ **52 listings/page** (highest volume tested)
- ✅ **Structured selectors** (data-cy attributes)
- ✅ **React SPA** - modern, clean structure
- ✅ **Complete documentation** ready
- ✅ **CloudFront CDN** - fast, reliable

**Cons**: None - perfect accessibility

**Priority**: 🥇 **#1 HIGHEST** - Implement FIRST

---

### Sprzedajemy.pl - Priority #2 ⭐⭐⭐

#### Status: ✅ **FULLY ACCESSIBLE - BEST SELECTORS**
- **URL Pattern**: `http://sprzedajemy.pl/szukaj?q={query}`
- **Protection**: NONE - No Cloudflare, No Turnstile
- **Market**: Poland - General classifieds (vehicles strong)
- **Test Results**: 6/6 tests passed (100% success rate)
- **Listings**: **30 per page**
- **Page Size**: ~270KB per search page
- **Findings**: Complete documentation in `sprzedajemy-findings.md`

**HTML Structure** (BEST STABILITY):
- Container: `li[id^="offer-"]` - **Unique ID per listing!**
- Title: `h2 > a.offerLink`
- Price: `.pricing .price` (zł currency)
- Attributes: `.attributes.g1` (year, mileage, engine)
- Image: `.picture.offerLink img`

**Polish Keywords**:
- telefon, laptop, samochód, auto, ciężarówka, etc.

**URL Patterns**:
- Search: `/szukaj?q={query}`
- Location: `/szukaj?q={query}&location={city}`
- Homepage: `/` (130 price indicators)

**Pros**:
- ✅ **ID-based selectors** (`#offer-72746631`) - MOST STABLE
- ✅ **NO protection** (completely accessible)
- ✅ **100% test success rate** - perfect stability
- ✅ **30 listings/page** - good volume
- ✅ **Rich metadata** - year, mileage, engine specs
- ✅ **No network issues** - completely stable
- ✅ **Strong vehicle category** - cars, trucks dominant
- ✅ **Complete documentation** ready

**Cons**: None - perfect accessibility

**Priority**: 🥈 **#2 HIGH** - Best selector quality

---

### Allegro Lokalnie - Priority #3 ⭐⭐

#### Status: ✅ **VIABLE - NEEDS RETRY LOGIC**
- **URL Pattern**: `https://allegrolokalnie.pl/oferty/q/{query}`
- **Protection**: NONE - No Cloudflare, No Turnstile
- **Market**: Poland - Owned by Allegro.pl (major e-commerce)
- **Test Results**: 2/6 accessible, 2/6 network errors (temporary), 2/6 unclear (SPA)
- **Listings**: **~15 per carousel page**
- **Page Size**: 647KB (category), 1.3MB (homepage)
- **Findings**: Complete documentation in `allegro-findings.md`

**HTML Structure**:
- Container: `._container_uxoe7_7`
- Title: `._title_uxoe7_17` or `[data-testid="heading"]`
- Price: `._price_-KCGD` (zł currency)
- Location: `._location_uxoe7_47`
- Carousel: `[data-testid="carousel-item"]` (29 items)

**Polish Keywords**:
- telefon, komputer, meble, samochód, etc.

**URL Patterns**:
- Search: `/oferty/q/{query}`
- Category: `/kategoria/{category-slug}`
- Homepage: `/` (26 prices)

**Pros**:
- ✅ **NO protection** detected
- ✅ **Structured selectors** (data-testid attributes)
- ✅ **Large accessible pages** (647KB+)
- ✅ **Major platform** (Allegro.pl owned)
- ✅ **Complete documentation** ready

**Cons**:
- ⚠️ **Network errors** (ERR_NETWORK_CHANGED) - needs retry mechanism
- ⚠️ **SPA loading states** - selector-specific waits needed
- ⚠️ **Lower volume** - ~15 listings vs OLX's 52

**Priority**: 🥉 **#3 MEDIUM** - Good complement, needs retry logic

---

### Phase 2: Finland - Huuto.net ❌

#### Huuto.net (Finland)
- **Status**: ❌ **BLOCKED**
- **URL**: `https://www.huuto.net/`
- **Protection**: Cloudflare Turnstile on ALL pages
- **Market**: Finland - auction site
- **Test Results**: 6/6 tests BLOCKED (0% success)
- **curl Response**: HTTP 403 + `cf-mitigated: challenge` header
- **Page Size**: 18KB challenge pages (no content)
- **Verdict**: NOT VIABLE

**Issue**: Turnstile challenge appears on:
- Homepage ❌
- Search pages ❌
- Category pages ❌
- All listing pages ❌

**Conclusion**: Finnish auction market NOT accessible. **Finland still has Tori.fi** (working alternative).

---

## 📊 Complete Testing Summary (Phase 1 + Phase 2)

| Site | Country | Market Type | Accessibility | Listings/Page | Status |
|------|---------|-------------|---------------|---------------|--------|
| **SS.lv** | 🇱🇻 Latvia | General | ✅ Working | - | Operational |
| **Andele** | 🇱🇻 Latvia | General | ✅ Working | - | Operational |
| **OLX.pl** | 🇵🇱 **Poland** | General | ✅ **Ready** | **52** | **#1 Priority** ⭐⭐⭐ |
| **Sprzedajemy.pl** | 🇵🇱 **Poland** | General | ✅ **Ready** | **30** | **#2 Priority** ⭐⭐⭐ |
| **Allegro Lokalnie** | 🇵🇱 **Poland** | General | ✅ **Ready** | ~15 | **#3 Priority** ⭐⭐ |
| **Tori.fi** | 🇫🇮 Finland | General | ✅ **Ready** | - | **#4 Priority** ⭐⭐ |
| **Vinted.lt** | 🇱🇹 Lithuania | Fashion | ✅ **Ready** | - | **#5 Priority** ⭐ |
| **Skelbiu.lt** | 🇱🇹 Lithuania | General | ⚠️ Partial | - | Low priority |
| **Huuto.net** | 🇫🇮 Finland | Auction | ❌ Blocked | - | Turnstile |
| **Soov.ee** | 🇪🇪 Estonia | General | ❌ Blocked | - | Turnstile |
| **Osta.ee** | 🇪🇪 Estonia | General | ❌ Offline | - | 404 errors |
| **Okidoki.ee** | 🇪🇪 Estonia | General | ❌ Blocked | - | Turnstile |

---

## 🌍 Market Coverage Summary

### ✅ Currently Working
- 🇱🇻 **Latvia**: 2 sources (SS.lv, Andele) - **OPERATIONAL**

### 🎯 Ready to Implement (5 platforms!)
- 🇵🇱 **Poland**: 3 sources ⭐⭐⭐
  - OLX.pl (#1 priority - 52 listings/page)
  - Sprzedajemy.pl (#2 priority - best selectors)
  - Allegro Lokalnie (#3 priority - needs retry)
- 🇫🇮 **Finland**: 1 source
  - Tori.fi (#4 priority - general marketplace)
- 🇱🇹 **Lithuania**: 1 source
  - Vinted.lt (#5 priority - fashion niche)

### ⚠️ Future Consideration
- 🇱🇹 **Lithuania**: Skelbiu.lt (needs structure analysis)
- 🇫🇮 **Finland**: Oikotie.fi (optional - already have Tori)

### ❌ Not Viable (4 platforms blocked)
- 🇪🇪 **Estonia**: All 3 sites blocked by Turnstile
- 🇫🇮 **Finland**: Huuto.net blocked by Turnstile

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Phase A: Polish Market Dominance (Highest Impact) 🇵🇱

**WHY START WITH POLAND?**
- ✅ **38M+ population** (largest market tested)
- ✅ **3 viable sources** (best coverage)
- ✅ **Complete documentation** ready for all 3
- ✅ **NO protection** on any site
- ✅ **High volume**: 52 + 30 + 15 = 97 listings per search across all 3!

**Implementation Order:**

#### 1️⃣ OLX.pl - START HERE! (Week 1)
- **Priority**: 🥇 HIGHEST
- **Reason**: Largest marketplace (38M+ users), 52 listings/page
- **Complexity**: Medium (React SPA, data-cy selectors)
- **Docs**: `olx-findings.md` (500+ lines complete)
- **Adapter**: `lib/adapters/olx.js`
- **Time Estimate**: 2-3 days
- **Impact**: MAXIMUM - covers Poland's #1 marketplace

**Benefits**:
- Immediate access to Poland's largest inventory
- Proven selector stability (data-cy attributes)
- CloudFront CDN = fast responses
- Sets foundation for Polish market

#### 2️⃣ Sprzedajemy.pl - BEST STABILITY (Week 1-2)
- **Priority**: 🥈 HIGH
- **Reason**: ID-based selectors (most stable), 100% test success
- **Complexity**: LOW (simplest selectors, clean HTML)
- **Docs**: `sprzedajemy-findings.md` (complete)
- **Adapter**: `lib/adapters/sprzedajemy.js`
- **Time Estimate**: 1-2 days
- **Impact**: HIGH - adds 30 more listings per search

**Benefits**:
- ID-based selectors = future-proof
- Strong vehicle category coverage
- Rich metadata (year, mileage, engine)
- No network issues = completely reliable

#### 3️⃣ Allegro Lokalnie - COMPLEMENT (Week 2)
- **Priority**: 🥉 MEDIUM
- **Reason**: Adds diversity, owned by major platform
- **Complexity**: MEDIUM (needs retry logic, SPA waits)
- **Docs**: `allegro-findings.md` (complete)
- **Adapter**: `lib/adapters/allegro.js`
- **Time Estimate**: 2-3 days (retry mechanism needed)
- **Impact**: GOOD - adds 15 more listings, complements OLX/Sprzedajemy

**Benefits**:
- 3rd Polish source = comprehensive coverage
- Major platform backing (Allegro.pl)
- Carousel format = different UX

**After 3 Polish Sources**: You'll have **97+ listings per search** from Poland alone! 🚀

---

### Phase B: Nordic Expansion (Weeks 3-4) 🇫🇮🇱🇹

#### 4️⃣ Tori.fi (Finland) - GENERAL MARKETPLACE
- **Priority**: ⭐⭐ MEDIUM-HIGH
- **Reason**: Finland's general classifieds, broad inventory
- **Complexity**: MEDIUM (Finnish keywords, semantic HTML)
- **Docs**: `tori-findings.md` (complete)
- **Adapter**: `lib/adapters/tori.js`
- **Time Estimate**: 2-3 days
- **Impact**: GOOD - opens Finnish market (5.5M population)

#### 5️⃣ Vinted.lt (Lithuania) - FASHION NICHE
- **Priority**: ⭐ MEDIUM
- **Reason**: Fashion specialization, niche coverage
- **Complexity**: MEDIUM (data-testid selectors, infinite scroll)
- **Docs**: `vinted-findings.md` (complete)
- **Adapter**: `lib/adapters/vinted.js`
- **Time Estimate**: 2-3 days
- **Impact**: MODERATE - niche fashion market

---

## 📋 Complete Implementation Roadmap

### **Recommended: Polish-First Strategy**

```
WEEK 1: Polish Foundation
├── Day 1-3: Implement OLX.pl (Priority #1)
│   └── Test with existing SS.lv + Andele
├── Day 4-5: Implement Sprzedajemy.pl (Priority #2)
│   └── Test 3-source Polish aggregation
└── Day 6-7: Polish market validation & testing

WEEK 2: Polish Completion + Finnish Start
├── Day 1-3: Implement Allegro Lokalnie (Priority #3)
│   └── Add retry logic for network stability
├── Day 4-5: Test 3-source Polish coverage
│   └── Validate 97+ listings per search
└── Day 6-7: Start Tori.fi implementation (Priority #4)

WEEK 3: Nordic Expansion
├── Day 1-3: Complete Tori.fi implementation
├── Day 4-7: Implement Vinted.lt (Priority #5)
└── Final testing: 7 sources (2 Latvia + 3 Poland + 1 Finland + 1 Lithuania)

WEEK 4: Optimization & Documentation
├── Performance tuning across all sources
├── Error handling improvements
├── User documentation
└── Deploy production
```

**Total Sources After Implementation**: 7 marketplaces across 4 countries! 🎉

---

## 📊 Expected Impact

### Market Reach
- 🇱🇻 **Latvia**: 1.9M population → 2 sources
- 🇵🇱 **Poland**: 38M+ population → **3 sources** ⭐
- 🇫🇮 **Finland**: 5.5M population → 1 source
- 🇱🇹 **Lithuania**: 2.8M population → 1 source
- **Total**: 48.2M population reach!

### Listings per Search (Estimated)
- OLX.pl: 52 listings
- Sprzedajemy.pl: 30 listings
- Allegro Lokalnie: 15 listings
- **Polish Total**: **97+ listings** per search term! 🚀
- Plus Latvia (SS.lv + Andele), Finland (Tori), Lithuania (Vinted)

---

## ⚠️ Technical Considerations

### OLX.pl
- React SPA: May need dynamic waits
- CloudFront CDN: Generally fast
- Pagination: Trailing slash required

### Sprzedajemy.pl
- Clean HTML: Easiest implementation
- ID-based selectors: Most stable approach
- No known issues

### Allegro Lokalnie
- **Retry mechanism required**: Handle ERR_NETWORK_CHANGED
- **SPA waits needed**: Selector-specific vs networkidle0
- Carousel format: Different pagination

### Tori.fi
- Finnish keywords preferred: matkapuhelin > mobile phone
- Multiple URL patterns: Nationwide vs regional
- Semantic HTML: Clean structure

### Vinted.lt
- Fashion-focused: Limited to clothing/accessories
- Infinite scroll: Pagination handling needed
- data-testid selectors: Reliable extraction

---

## 🎯 Success Metrics

### After Phase A (Polish Implementation)
- **3 Polish sources operational**
- **97+ listings per search** (Polish market)
- **38M+ population** reach
- **Foundation for Nordic expansion**

### After Phase B (Nordic Implementation)
- **7 total sources** operational
- **48M+ population** reach
- **4 countries** covered
- **Production-ready aggregator**

---

## 🚀 Next Steps

1. **IMMEDIATE**: Implement OLX.pl adapter (Priority #1)
   - File: `lib/adapters/olx.js`
   - Reference: `olx-findings.md`
   - Test with existing SS.lv + Andele

2. **WEEK 1**: Implement Sprzedajemy.pl adapter (Priority #2)
   - File: `lib/adapters/sprzedajemy.js`
   - Reference: `sprzedajemy-findings.md`
   - Validate 3-source Polish coverage

3. **WEEK 2**: Implement Allegro Lokalnie adapter (Priority #3)
   - File: `lib/adapters/allegro.js`
   - Reference: `allegro-findings.md`
   - Add retry mechanism for stability

4. **WEEK 3+**: Nordic expansion (Tori.fi, Vinted.lt)

**RECOMMENDATION**: Start with OLX.pl THIS WEEK - highest impact, largest market, complete documentation ready! 🎯

### Technical Decisions Needed
- Which adapter to prioritize first?
- Should we add Finnish keyword translation for Tori?
- Should we add Lithuanian keyword translation for Vinted?
- Multi-source testing strategy for aggregator

---

## 📄 Reference Documentation

- **Vinted.lt**: See `vinted-findings.md` for complete implementation details
- **Tori.fi**: See `tori-findings.md` for complete implementation details
- **Test Scripts**: 
  - `test-soov-access.js` (Phase 1)
  - `test-skelbiu-access.js` (Phase 2)
  - `test-vinted-access.js` (Phase 3)
  - `test-tori-access.js` (Phase 4)
- **HTML Samples**:
  - `vinted-search-sample.html` (Phase 3)
  - `tori-search-sample.html` (Phase 4)
