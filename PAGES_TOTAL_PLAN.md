# Multi-Source Pagination & Total Count Implementation Plan

## Current Status (Updated: December 28, 2025)

### ✅ COMPLETED Issues:
1. ✅ **Total count fixed**: Shows correct combined total from all sources (e.g., "20 of 217 listings")
2. ✅ **Exactly 20 items per page**: Fixed pagination to show correct number per page
3. ✅ **Pagination working**: Added full pagination controls with page numbers and navigation
4. ✅ **Efficient enrichment**: Only enrich items that will be displayed on current page (Phase 1-3 complete)

### ⚠️ REMAINING Issues:
1. ⚠️ **Andele showing 48 items instead of 127**: Website has 127 items but app only fetches 48 (see sidequest.md)
2. ⚠️ **Page 1 showing 19 items instead of 20**: Minor pagination calculation or enrichment issue

### 🔄 IN PROGRESS:
- Investigating why Andele pagination doesn't fetch all available items (possible rate limiting, pagination parameter issue, or timing issue)

## Desired Behavior

1. **Correct total count**: "20 of 250 listings" (sum from all sources)
2. **Exactly 20 items per page** (top 20 cheapest across ALL sources)
3. **Pagination controls**: Page 1, 2, 3... based on total results
4. **Efficient enrichment**: Only fetch details for the 20 items that will be displayed on current page

## Architecture Overview

### Current (✅ IMPLEMENTED) Architecture:
```
API Request (page=1, perPage=20)
  ↓
Phase 1: Price Scanning (Parallel by Source)
  SS Adapter: scanPrices() → [{url, priceValue, source}, ...] × 169
  Andele Adapter: scanPrices() → [{url, priceValue, source}, ...] × 48
  ↓
Phase 2-4: API-Level Orchestration
  - Combine all results: 217 items total
  - Sort globally by price
  - Calculate pagination: 217 ÷ 20 = 11 pages
  - Slice for current page: items [0-19] for page 1
  ↓
Phase 5-7: Detail Enrichment (Only Current Page)
  - Group page URLs by source
  - Call enrichDetails() in parallel:
    * SS: enrich 12 URLs
    * Andele: enrich 8 URLs
  - Merge enriched data with price data
  ↓
Return exactly 20 enriched items
Total: "20 of 217 listings (Page 1 of 11)"
✅ Only fetches details for displayed items
✅ Multi-source sorting works correctly
```



---

## Implementation Phases

### **Phase 1: Separate Price Scanning from Detail Enrichment** ✅ COMPLETED
**Goal**: Adapters return lightweight price data first, details later

**Implementation Status**: ✅ DONE (December 2025)

**Changes Completed**:

1. ✅ **New adapter method**: `scanPrices(query, options)`
   - Returns: `[{url, priceText, priceValue, source, imageUrl}, ...]`
   - No descriptions, conditions, dates - just price data
   - Fast execution (Puppeteer only for search results, no detail pages)
   - Implemented in both SS and Andele adapters

2. ✅ **Existing method refactored**: `enrichDetails(urls)`
   - Input: Array of URLs to enrich
   - Returns: `[{url, title, description, condition, ...}, ...]`
   - Only fetches detail pages for specified URLs
   - Includes URL field in returned objects (fixed bug where URL was missing)

3. ✅ **Both adapters updated**:
   - `lib/adapters/ss.js`: Split into `scanPrices()` + `enrichDetails()` ✅
   - `lib/adapters/andele.js`: Split into `scanPrices()` + `enrichDetails()` ✅

**Files Modified**:
- ✅ `lib/adapters/ss.js` (lines 483-578)
- ✅ `lib/adapters/andele.js` (lines 224-318)

---

### **Phase 2: API-Level Orchestration** ✅ COMPLETED
**Goal**: API combines all sources before pagination

**Implementation Status**: ✅ DONE (December 2025)

**Changes Completed**:

1. ✅ **API Flow** (`pages/api/search.js` lines 67-211):
   ```javascript
   // Phase 1: Scan prices from all sources (parallel)
   const scanPromises = selectedSources.map(source => 
     ADAPTERS[source].scanPrices(query, {...})
   );
   const scanResults = await Promise.all(scanPromises);
   const allPriceItems = scanResults.flat();
   
   // Phase 2: Sort globally by price
   allPriceItems.sort((a, b) => a.priceValue - b.priceValue);
   
   // Phase 3: Calculate pagination
   const totalResults = allPriceItems.length;
   const totalPages = Math.ceil(totalResults / perPage);
   
   // Phase 4: Slice for current page
   const startIndex = (validPage - 1) * perPage;
   const endIndex = startIndex + perPage;
   const pageItems = allPriceItems.slice(startIndex, endIndex);
   
   // Phase 5: Group URLs by source
   const urlsBySource = {};
   pageItems.forEach(item => {
     if (!urlsBySource[item.source]) urlsBySource[item.source] = [];
     urlsBySource[item.source].push(item.url);
   });
   
   // Phase 6: Enrich details (parallel by source)
   const enrichPromises = Object.entries(urlsBySource).map(
     async ([source, urls]) => {
       const enriched = await ADAPTERS[source].enrichDetails(urls);
       return enriched.map(item => ({...item, source}));
     }
   );
   const enrichResults = await Promise.all(enrichPromises);
   const enrichedItems = enrichResults.flat();
   
   // Phase 7: Merge enriched data with price data
   const enrichedMap = new Map(
     enrichedItems.map(item => [item.url, item])
   );
   const finalItems = pageItems.map(priceItem => {
     const enriched = enrichedMap.get(priceItem.url) || {};
     return {
       ...priceItem,
       ...enriched,
       priceValue: priceItem.priceValue
     };
   });
   ```

2. ✅ **Response format updated**:
   ```javascript
   return res.status(200).json({
     items: normalizedItems, // exactly 20 items
     totalResults, // 217
     currentPage: validPage, // 1
     totalPages, // 11
     loadTime: `${(Date.now() - startTime) / 1000}s`
   });
   ```

**Files Modified**:
- ✅ `pages/api/search.js` (complete seven-phase orchestration)

---

### **Phase 3: Frontend Pagination UI** ✅ COMPLETED
**Goal**: Show page numbers and navigation

**Implementation Status**: ✅ DONE (December 2025)

**Changes Completed**:

1. ✅ **ResultsView component** (`components/ResultsView.js`):
   - Lines 69-77: Display "Showing X of Y listings (Page N of M)"
   - Lines 26-57: `getPageNumbers()` function for smart page display (e.g., "1 2 3 ... 11")
   - Lines 100-145: Pagination controls with Previous/Next buttons
   - Active page highlighting
   - Disabled states for boundary pages
   - `onPageChange` callback prop

2. ✅ **URL state management** (`pages/index.js`):
   - Line 19: Added `const [currentPage, setCurrentPage] = useState(1);`
   - Lines 40-50: Parse `?page=N` from URL on load
   - Lines 67-77: Update URL params when page changes
   - Lines 161-172: `handlePageChange()` callback
     * Updates currentPage state
     * Calls performSearch with new page
     * Scrolls to top: `window.scrollTo({ top: 0, behavior: 'smooth' })`
   - Line 241: Pass `onPageChange={handlePageChange}` to ResultsView

3. ✅ **Browser history integration**:
   - URL updates when changing pages: `?page=2`, `?page=3`, etc.
   - Back/forward buttons work correctly
   - Direct URL navigation works (e.g., bookmark page 5)

**Files Modified**:
- ✅ `components/ResultsView.js` (lines 26-145)
- ✅ `pages/index.js` (state management and callbacks)

---

### **Phase 4: Caching Strategy Update**
**Goal**: Cache by page number

**Changes Required**:

1. **Cache keys include page number**:
   - Current: `search_airpods_ss,andele_120_any_price-low`
   - New: `search_airpods_ss,andele_page1_120_any_price-low`

2. **Separate cache for price scans**:
   - Cache Phase 1 results separately (longer TTL - 10 minutes)
   - Cache Phase 2 results per page (5 minutes)
   - Avoid re-scanning prices when navigating pages

**Files to modify**:
- `pages/api/search.js`
- `lib/cache.js` (possibly)

---

### **Phase 5: Performance Optimization**
**Goal**: Fast page navigation

**Optimizations**:

1. **Prefetch next page**: When user is on page 1, prefetch page 2 in background
2. **Aggressive caching**: Cache price scans for 10+ minutes
3. **Progressive loading**: Show results as they arrive (SSE or polling)
4. **Batch detail fetching**: Increase batch sizes for faster enrichment

**Files to modify**:
- `pages/api/search.js`
- `pages/index.js` (prefetch logic)

---

## Implementation Order

### **Sprint 1: Core Functionality** ✅ COMPLETED (Priority: HIGH)
1. ✅ **Phase 1**: Split adapters into `scanPrices()` + `enrichDetails()` - DONE
2. ✅ **Phase 2**: API orchestration for multi-source sorting - DONE
3. ✅ **Phase 3**: Basic pagination UI - DONE

**Bugs Fixed During Sprint 1**:
- ✅ Fixed missing URL field in `enrichDetails()` return objects
- ✅ Fixed total count display (was showing 0)
- ✅ Fixed items per page (was showing 40, now shows 20)
- ✅ Fixed multi-source sorting (now sorts globally across all sources)

### **Sprint 2: Polish** (Priority: MEDIUM) - NOT STARTED
4. ⏸️ **Phase 4**: Caching improvements
5. ⏸️ **Phase 5**: Performance optimizations

**Blockers for Sprint 2**:
- ⚠️ Must fix Andele 48/127 issue first (see sidequest.md)
- ⚠️ Must fix page 1 showing 19 items instead of 20

---

## Testing Checklist

### ✅ Completed Tests:
- ✅ Single source (SS only): Shows correct total, 20 items, pagination works
- ✅ Single source (Andele only): Shows correct total, pagination controls work
- ✅ Multi-source (both): Shows combined total, 20 items from both sources sorted by price
- ✅ Pagination: Page navigation works, URL updates correctly
- ✅ Edge case: Query with 0 results shows "0 of 0 listings"

### ⚠️ Issues Found:
- ⚠️ Andele: Only fetching 48 items instead of all 127 available (under investigation)
- ⚠️ Page 1 sometimes shows 19 items instead of 20 (enrichment failure?)

### ⏸️ Not Yet Tested:
- ⏸️ Pagination: Page 11 shows remaining items (< 20 items) correctly
- ⏸️ Performance: Page 1 loads in < 15 seconds
- ⏸️ Performance: Page 2 loads in < 5 seconds (with cache)

---

## Technical Challenges & Solutions

### **Challenge 1: Determining URL ownership**
**Problem**: After combining URLs, how do we know which adapter to call for enrichment?

**Solution**: Include `source` field in price scan results:
```javascript
{
  url: "https://ss.lv/msg/...",
  priceValue: 120,
  source: "ss" // ← Add this
}
```

### **Challenge 2: Different item counts per source**
**Problem**: Page 1 might need 15 items from SS and 5 from Andele

**Solution**: Group URLs by source, call each adapter with its specific URLs:
```javascript
const urlsBySource = {
  ss: [url1, url3, url5, ...], // 15 URLs
  andele: [url2, url4, url6, ...], // 5 URLs
};
```

### **Challenge 3: Maintaining sort order after enrichment**
**Problem**: Enrichment calls return in arbitrary order

**Solution**: Merge by URL, preserve original sort:
```javascript
const enrichedMap = new Map(
  enrichedResults.map(item => [item.url, item])
);

const finalResults = pageUrls.map(priceItem => ({
  ...priceItem,
  ...enrichedMap.get(priceItem.url)
}));
```

### **Challenge 4: Partial failures**
**Problem**: If one adapter fails enrichment, should we show partial results?

**Solution**: Yes - show items that succeeded, log errors for failed ones:
```javascript
const enriched = await Promise.allSettled(enrichPromises);
const successful = enriched
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
```

---

## Success Metrics

### ✅ Achieved:
- ✅ Total count shows correctly (e.g., "20 of 217")
- ✅ Exactly 20 items per page (with minor bug: sometimes shows 19)
- ✅ Items sorted by price across ALL sources
- ✅ Pagination controls work (page 1, 2, 3...)
- ✅ Works with 1 source or multiple sources
- ✅ Graceful degradation when a source fails

### ⚠️ Partial / In Progress:
- ⚠️ Page load time < 15s for page 1 (needs testing with full data)
- ⚠️ Page load time < 5s for subsequent pages (caching not optimized yet)

### ❌ Not Yet Achieved:
- ❌ Andele fetching all available results (48/127 issue - see sidequest.md)

---

## Rollback Plan

If implementation causes issues:
1. Revert to single-source mode (disable multi-source)
2. Keep old `search()` method as fallback
3. Feature flag: `ENABLE_MULTI_SOURCE_PAGINATION=false`

---

## Future Enhancements

1. **Infinite scroll** instead of pagination
2. **Real-time updates** (WebSocket for new listings)
3. **Smart prefetching** (ML to predict next page)
4. **Partial page loading** (show first 10 items while fetching rest)
5. **Result deduplication** (same item on multiple sources)

---

## Notes

### Implementation Summary (December 2025):
- ✅ Phases 1-3 completed successfully
- ✅ Two-phase architecture working: scanPrices → sort → paginate → enrichDetails
- ✅ Multi-source aggregation and sorting functional
- ✅ Frontend pagination UI complete with URL state management
- ⚠️ Current blockers: Andele 48/127 issue, occasional 19/20 items on page 1
- 📋 Next steps: Fix blockers, then proceed to Phase 4 (caching) and Phase 5 (performance)

### Architecture Benefits:
- 🚀 **Efficiency**: Only enrich 20-40 items that will be displayed (not all 200+)
- 💰 **Cost**: Reduced bandwidth and processing time
- ⚡ **Speed**: Page 2+ can load faster if price scans are cached
- 🎯 **Accuracy**: Multi-source sorting ensures cheapest items always show first

### Known Limitations:
- Andele pagination may be limited by website's anti-bot measures
- Cache strategy not yet optimized (Phase 4)
- Performance optimizations pending (Phase 5)

### Related Documents:
- `sidequest.md`: Investigation plan for Andele 48/127 issue
- `ARCHITECTURE.md`: Overall system architecture
- `FRONTEND-PLAN.md`: Frontend component structure
