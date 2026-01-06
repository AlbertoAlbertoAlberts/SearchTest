# Phase 1 Research: Andele Mandele Technical Investigation

**Date:** December 28, 2024  
**Status:** ✅ COMPLETE - Decision Made

---

## Research Summary

### **✅ DECISION: Use Cheerio + HTML Scraping (Option C)**

Andele Mandele uses **server-side rendering** with HTML responses. No API endpoints discovered, no embedded JSON data. This is similar to SS.com, making it perfect for Cheerio-based scraping.

---

## Investigation Results

### 1. **Network Analysis**

**Search URL Pattern:**
```
https://www.andelemandele.lv/perles/?search={query}
https://www.andelemandele.lv/perles/?search={query}&page=2
```

**Individual Listing URL Pattern:**
```
https://www.andelemandele.lv/perle/{id}/{slug}/
Example: /perle/14806533/althair-5-vai-10-ml/
```

**Key Findings:**
- No GraphQL or REST API endpoints found
- No `__NEXT_DATA__` or `window.__INITIAL_STATE__` in HTML
- The `/product-data/` route exists but **returns HTML**, not JSON
- Server-side rendered content (ready for Cheerio)

---

### 2. **HTML Structure Analysis**

#### **Pagination**
```html
<!-- Over 5,000 pages with up to 48 items per page -->
<a data-page="1" class="dropdown-item" href="javascript:;">1</a>
<a data-page="2" class="dropdown-item" href="javascript:;">2</a>
...
<a data-page="5877" class="dropdown-item" href="javascript:;">5877</a>

<!-- Total count displayed -->
<span>282092 pērles</span>
```

**Pagination Strategy:**
- Add `&page={N}` parameter to URL
- ~48 listings per page
- 280,000+ total listings = ~5,800 pages
- For Phase 1 (price scan): scan first 3-5 pages (150-250 listings)
- For Phase 2 (detail enrichment): fetch individual listing pages

---

#### **Listing Cards** (Search Results Page)

**HTML Pattern Observed:**
```html
<!-- Price examples from search page -->
<span>25 €</span>  <!-- Regular price -->
<span>25 €35 €</span>  <!-- Sale: 25€ (new price), 35€ (original) -->
<span>-50%</span>  <!-- Discount badge -->

<!-- Link pattern -->
<a href="/perle/14806533/althair-5-vai-10-ml/">...</a>

<!-- Brand -->
<a href="/brand/h-m/494/">H&M</a>

<!-- Size -->
<span>|S</span>
```

**Key Selectors to Test:**
- `.product-card` or similar container (need to inspect actual HTML)
- Price: Look for `€` symbol patterns
- URL: `<a>` tags with `/perle/` in href
- Brand: Links to `/brand/`
- Images: `static*.andelemandele.lv/images/...`

---

### 3. **Price Formats**

| Format | Example | Description |
|--------|---------|-------------|
| Regular | `25 €` | Normal price |
| Sale | `25 €35 €` | Sale price (25€) + Original price (35€) |
| Discount badge | `-50%` | Percentage off |
| Free | `0.85 €` or Free | Very low prices |

**Price Parsing Strategy:**
```javascript
function parsePriceValue(priceText) {
  if (!priceText) return Infinity;
  
  // Match first number before €
  const match = priceText.match(/(\d+(?:[.,]\d+)?)\s*€/);
  if (!match) return Infinity;
  
  const value = parseFloat(match[1].replace(',', '.'));
  return isNaN(value) ? Infinity : value;
}
```

**Always extract the FIRST price** (sale price if on sale)

---

### 4. **Categories**

Andele Mandele has 5 main categories:
- **DĀMĀM** (Women) - 133,384 items
- **BĒRNIEM** (Children) - 88,285 items
- **KUNGIEM** (Men) - 18,296 items
- **MĀJAI** (Home) - 39,624 items
- **TRANSPORTS** (Transport) - 1,320 items

**Category URLs:**
```
/perles/damam/  (Women)
/perles/kids/   (Children)
/perles/kungiem/ (Men)
/perles/home/   (Home)
/perles/auto/   (Transport)
```

---

### 5. **Filters & Sorting**

**Sort Options (in Latvian):**
- **Aktuālie** - Current/Active
- **Jaunākie** - Newest
- **Populārākie** - Most popular
- **Cena, sākot no zemākās** - Price low to high ✅ (our default)
- **Cena, sākot no augstākās** - Price high to low
- **Lielākā izpārdošana** - Biggest sale

**Filters Available:**
- Stāvoklis (Condition): Jauns, Lietots
- Izmērs (Size): XXS, XS, S, M, L, XL, etc.
- Krāsa (Color): Multiple colors
- Cena (Price): Slider 0-200€+
- Zīmols (Brand): H&M, ZARA, NIKE, etc.
- Atrašanās vieta (Location): With radius

**Note:** We'll implement basic search first, add filters in future phases

---

### 6. **Brand Data**

Strong brand organization:
- **H&M** - 7,388 items
- **ZARA** - 6,966 items
- **NIKE** - 4,372 items
- **RESERVED** - 3,251 items

Brand URLs: `/brand/{slug}/{id}/`

---

### 7. **Image CDN**

**Pattern:**
```
https://static2.andelemandele.lv/images/{hash}/large/{id}.jpg
https://static4.andelemandele.lv/images/{hash}/large/{id}.jpg
https://static5.andelemandele.lv/images/{hash}/large/{id}.jpg
https://static6.andelemandele.lv/images/{hash}/large/{id}.jpg
```

**Multiple CDN subdomains** for load balancing  
**Size:** `/large/` for thumbnails (already optimized)

---

### 8. **Condition Mapping**

Latvian → English:
```javascript
const CONDITION_MAP = {
  'Jauns': 'new',
  'Lietots, lieliskā stāvoklī': 'like-new',
  'Lietots, labā stāvoklī': 'good',
  'Lietots, iespējami trūkumi': 'fair',
  'Antīks/ Vintage': 'vintage',
};
```

---

## Implementation Strategy

### ✅ **Option C: Cheerio (HTML Scraping)**

**Why This Works:**
1. **Server-side rendered** - HTML is complete on load
2. **No API** - Only HTML responses available
3. **Similar to SS.com** - Can reuse patterns and code structure
4. **Fast** - No browser overhead
5. **Reliable** - Content is in HTML, not loaded via JavaScript

**Architecture:**
```
Two-Phase Search (matching SS.com):
├── Phase 1: extractPricesOnly(query, maxResults, minPrice, maxPrice, sortBy)
│   ├── Fetch search pages (1-5 pages max for performance)
│   ├── Extract: URL + price pairs
│   ├── Filter by price range
│   ├── Sort by price
│   └── Return sorted URLs for enrichment
│
└── Phase 2: fetchListingDetails(url)
    ├── Fetch individual listing page
    ├── Extract: title, description, images, condition, brand, size
    ├── Return normalized listing object
    └── Batch enrichment (5 at a time)
```

---

## Next Steps for Phase 2

1. ✅ **Create** `lib/adapters/andele.js`
2. ✅ **Implement** `buildSearchUrl(query, page)`
3. ✅ **Implement** `parsePriceValue(priceText)`
4. ✅ **Research HTML selectors** - Fetch actual search page and identify listing card selectors
5. ✅ **Implement** `extractPricesOnly()` - Phase 1 price scanning
6. ✅ **Implement** `fetchListingDetails()` - Phase 2 detail enrichment
7. ✅ **Implement** `search()` - Main orchestrator
8. ✅ **Register adapter** in `pages/api/search.js`
9. ✅ **Test** with sample queries

---

## Technical Specifications

### **URL Building**
```javascript
function buildSearchUrl(query, page = 1) {
  const baseUrl = 'https://www.andelemandele.lv/perles/';
  const params = new URLSearchParams({ search: query });
  if (page > 1) params.append('page', page);
  return `${baseUrl}?${params.toString()}`;
}
```

### **Headers for Requests**
```javascript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'lv,en-US;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
};
```

### **Rate Limiting**
- Same as SS.com: 3 pages at a time with 150ms delays
- Batch enrichment: 5 listings at a time with 100ms delays
- Respect robots.txt
- Implement exponential backoff on errors

---

## Challenges Identified

1. **Challenge:** Heavy fashion focus vs SS.com's general marketplace
   - **Solution:** May need different spam filtering thresholds

2. **Challenge:** Sale prices show both values (`25 €35 €`)
   - **Solution:** Always extract first price (sale price)

3. **Challenge:** Brand-centric structure may affect search relevance
   - **Solution:** Use same smart category detection as SS.com

4. **Challenge:** ~280K listings = potential for slow searches
   - **Solution:** Limit Phase 1 to first 3-5 pages (~150-250 items)

---

## Performance Expectations

**Phase 1 (Price Scan):**
- Fetch 3-5 pages in parallel batches
- ~2-3 seconds for 150-250 listings

**Phase 2 (Detail Enrichment):**
- Enrich current page (10-50 items)
- Batch 5 at a time with 100ms delays
- ~2-10 seconds depending on page size

**Total:** ~4-13 seconds for first page load  
**Cached:** <10ms

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Rate limiting | Medium | High | Implement delays, respect robots.txt |
| HTML changes | Low | Medium | Flexible selectors, monitoring |
| Cloudflare | Low | High | Proper headers, retry logic |
| Performance | Medium | Medium | Limit pages scanned, aggressive caching |

---

## Conclusion

✅ **Ready to proceed to Phase 2:** Adapter implementation  
✅ **Approach confirmed:** Cheerio + HTML scraping (Option C)  
✅ **Architecture defined:** Two-phase search matching SS.com pattern  
✅ **Technical specs documented:** URLs, selectors, price parsing, pagination

**Estimated Time to Complete Phase 2:** 3-4 hours

