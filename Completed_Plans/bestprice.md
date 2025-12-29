# Best Price Implementation Plan

**Goal:** Show listings sorted by best (lowest) price across ALL available results, while maintaining fast performance and safe scraping practices.

**Created:** 28 December 2025  
**Status:** Planning Phase

---

## Current vs. Proposed Architecture

### **Current Flow (Inefficient)**
```
Search "airpods"
  ↓
Fetch search page 1 (30 listings)
  ↓
Fetch 30 detail pages for full info
  ↓
Display 30 unsorted results
Time: ~5-8 seconds
```

**Problem:** Can't sort by price across all listings because we only have 30.

### **Proposed Flow (Efficient)**
```
Search "airpods"
  ↓
PHASE 1: Lightweight Price Scan
├─ Fetch ALL search pages (until no more results or 300 listings reached)
├─ Extract ONLY: URL + Price (minimal data)
├─ Batched fetching: 3 pages at a time
├─ Stop at 300 results maximum
├─ Sort all by price (low to high)
└─ Time: ~2-20 seconds (depends on total pages)
  ↓
PHASE 2: Detail Enrichment
├─ Take top 20 results (best prices)
├─ Fetch full details for these 20 only
├─ Get: title, description, images, date, condition
└─ Time: ~8-10 seconds
  ↓
Display first page with full details
Total time: ~10-30 seconds (depends on total listings)
```

---

## Implementation Plan

### **Phase 1: Minimal Data Extraction**

#### What to Extract
From search result pages, extract **ONLY**:
- ✅ URL (to identify listing)
- ✅ Price text (for sorting)
- ❌ Title (not needed yet)
- ❌ Date (not needed yet)
- ❌ Images (not needed yet)
- ❌ Description (not on search page anyway)

#### Why This Is Fast
- No detail page requests
- Minimal parsing (just price patterns)
- Batched fetching (3 pages at a time)
- Dynamic scanning (stops when no more results or 300 reached)
- Typical: 2-10 pages = 2-8 seconds
- Popular items: 10-15 pages = 8-12 seconds
- Max: stops at 300 results

#### Code Changes Needed

**File: `lib/adapters/ss.js`**

1. **Add new function: `extractPricesOnly()`**
   ```javascript
   /**
    * Phase 1: Quickly extract URLs and prices from search results.
    * Does NOT fetch detail pages - just parses search results.
    * Scans ALL pages until no more results or max results reached.
    * @param {string} query - Search query
    * @param {number} maxResults - Max results to collect (default: 300)
    * @returns {Promise<Array>} - Array of {url, priceText}
    */
   async function extractPricesOnly(query, maxResults = 300)
   ```

2. **Add pagination support:**
   ```javascript
   function buildSearchUrl(query, page = 1) {
     const baseUrl = `https://www.ss.com/en/search-result/?q=${encodeURIComponent(query)}`;
     return page === 1 ? baseUrl : `${baseUrl}&page=${page}`;
   }
   ```

3. **Implement minimal extraction:**
   - Fetch pages in batches of 3 (3 parallel requests per batch)
   - Start from page 1, continue until:
     - No more results found (page returns 0 listings), OR
     - 300 results collected (ceiling reached)
   - For each page, extract links with `/msg/` or `.html`
   - For each link, find price in same row/container
   - Store only: `{ url: absoluteUrl, priceText: "150 €" }`
   - Add 100-200ms delay between batches (rate limiting safety)
   - No detail page fetching
   - No title extraction
   - Return raw array of {url, priceText}

4. **Add price parsing helper:**
   ```javascript
   /**
    * Converts price text to numeric value for sorting
    * "150 €" → 150
    * "€ 1,200" → 1200
    * "Free" → 0
    * "Price not specified" → Infinity (sort to end)
    */
   function parsePriceValue(priceText)
   ```

5. **Sort by price:**
   ```javascript
   // After extraction, sort the minimal array
   priceOnlyResults.sort((a, b) => {
     const priceA = parsePriceValue(a.priceText);
     const priceB = parsePriceValue(b.priceText);
     return priceA - priceB;
   });
   ```

---

### **Phase 2: Detail Enrichment**

#### What to Fetch
For the **top 20 results** (best prices), fetch full details:
- ✅ Title (from detail page)
- ✅ Description + preview
- ✅ Images
- ✅ Date posted
- ✅ Condition
- ✅ Better price (if detail page has more accurate price)

#### Code Changes Needed

**File: `lib/adapters/ss.js`**

1. **Modify main `search()` function:**
   ```javascript
   export async function search(query, options = {}) {
     const { 
       maxResults = 300,      // Max total results to collect (ceiling)
       resultsPerPage = 20,   // How many to show per page
       currentPage = 1,       // Which page user is viewing
     } = options;
     
     // PHASE 1: Get all prices (fast!)
     const priceOnlyResults = await extractPricesOnly(query, maxResults);
     
     // Check for 100+ results notification
     const showNotification = priceOnlyResults.length > 100;
     
     // PHASE 2: Enrich current page only
     const startIdx = (currentPage - 1) * resultsPerPage;
     const endIdx = startIdx + resultsPerPage;
     const currentPageUrls = priceOnlyResults.slice(startIdx, endIdx);
     
     // Fetch full details for current page
     const enrichedResults = await Promise.all(
       currentPageUrls.map(item => fetchListingDetails(item.url))
     );
     
     // Combine price info with details
     const finalResults = currentPageUrls.map((item, idx) => {
       const details = enrichedResults[idx];
       return {
         url: item.url,
         priceText: item.priceText,
         ...details,
       };
     });
     
     return {
       items: finalResults.map(raw => normalizeListing(raw, "ss", "SS.lv")),
       totalResults: priceOnlyResults.length,
       currentPage,
       totalPages: Math.ceil(priceOnlyResults.length / resultsPerPage),
       showNotification,
     };
   }
   ```

2. **Keep existing `fetchListingDetails()` function**
   - Already fetches full details from detail pages
   - No changes needed

---

### **API Layer Changes**

**File: `pages/api/search.js`**

1. **Accept pagination parameters:**
   ```javascript
   const page = parseInt(req.query.page) || 1;
   const perPage = parseInt(req.query.perPage) || 20;
   const maxResults = parseInt(req.query.maxResults) || 300;
   ```

2. **Pass options to adapter:**
   ```javascript
   const listings = await adapter.search(query, {
     maxResults: maxResults,  // Max 300 results ceiling
     resultsPerPage: perPage, // Show 20 per page
     currentPage: page,       // Which page to enrich
   });
   ```

3. **Return pagination metadata:**
   ```javascript
   return res.status(200).json({
     query,
     sources,
     tookMs,
     errors,
     items: listings.items,
     totalResults: listings.totalResults,
     currentPage: listings.currentPage,
     totalPages: listings.totalPages,
     showNotification: listings.showNotification,
     cached: false,
   });
   ```

4. **Update cache key to include page:**
   ```javascript
   const cacheKey = `search_${query}_${sources.sort().join(',')}_page${page}`;
   ```

---

### **Frontend Changes**

#### **File: `pages/index.js`**

1. **Add pagination state:**
   ```javascript
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [totalResults, setTotalResults] = useState(0);
   const [showNotification, setShowNotification] = useState(false);
   ```

2. **Update search function:**
   ```javascript
   async function performSearch(query, searchFilters = filters, page = 1) {
     // ... existing code ...
     
     const apiUrl = `/api/search?q=${encodeURIComponent(query)}&sources=${sources}&page=${page}`;
     
     const data = await res.json();
     
     setRawItems(data.items || []);
     setTotalResults(data.totalResults || 0);
     setTotalPages(data.totalPages || 1);
     setCurrentPage(data.currentPage || 1);
     setShowNotification(data.showNotification || false);
     
     // ... rest of code ...
   }
   ```

3. **Add pagination handlers:**
   ```javascript
   const handlePageChange = useCallback((newPage) => {
     setCurrentPage(newPage);
     performSearch(searchQuery, filters, newPage);
     window.scrollTo(0, 0); // Scroll to top
   }, [searchQuery, filters]);
   ```

#### **File: `components/ResultsView.js`**

1. **Add notification bar:**
   ```javascript
   {showNotification && (
     <div className={styles.notificationBar}>
       <span className={styles.notificationIcon}>💡</span>
       <p>
         Found {totalResults}+ results. 
         Try using more specific keywords or adjust filter settings 
         to narrow down your search for better results.
       </p>
     </div>
   )}
   ```

2. **Update results count:**
   ```javascript
   <div className={styles.resultsCount}>
     Showing {items?.length || 0} of {totalResults} listings
     (Page {currentPage} of {totalPages})
     {metadata?.tookMs && (
       <span className={styles.timing}> · {metadata.tookMs}ms</span>
     )}
   </div>
   ```

3. **Add pagination controls:**
   ```javascript
   {totalPages > 1 && (
     <div className={styles.pagination}>
       <button 
         disabled={currentPage === 1}
         onClick={() => onPageChange(currentPage - 1)}
       >
         ← Previous
       </button>
       
       <span className={styles.pageInfo}>
         Page {currentPage} of {totalPages}
       </span>
       
       <button 
         disabled={currentPage === totalPages}
         onClick={() => onPageChange(currentPage + 1)}
       >
         Next →
       </button>
     </div>
   )}
   ```

#### **File: `components/ResultsView.module.css`**

Add styles for:
- `.notificationBar` - Yellow/blue info bar at top
- `.pagination` - Pagination controls at bottom
- `.pageInfo` - Current page indicator

---

## Performance Characteristics

### **Phase 1: Price Extraction (Dynamic)**
- **Pages scanned:** Variable (until no more results or 300 listings)
- **HTTP requests:** 3-15 (batched: 3 pages at a time)
- **Data extracted per page:** ~30 URLs + prices
- **Total results:** Up to 300 price-sorted listings
- **Time:** ~2-12 seconds (depends on total listings available)
- **Batching:** 3 pages parallel, then 100-200ms delay, repeat

### **Phase 2: Detail Enrichment (Per Page)**
- **Listings enriched:** 20 (current page only)
- **HTTP requests:** 20 (batched in groups of 5)
- **Time:** ~8-10 seconds

### **Total Initial Load**
- Phase 1 + Phase 2 = **~10-22 seconds** (depends on total listings)
- User sees results sorted by best price across up to 300 listings
- Only first page has full details
- Popular items: ~18-22 seconds
- Common items: ~12-16 seconds
- Niche items: ~10-12 seconds

### **Subsequent Pages**
- No Phase 1 (already cached)
- Phase 2 only = **~8-10 seconds per page**
- Each page shows next 20 best-priced items with full details

---

## Rate Limiting Safety

### **Request Pattern**
**Initial search:**
- 3-15 search page requests (Phase 1, batched)
- 20 detail page requests (Phase 2)
- **Total: 23-35 requests** in ~12-22 seconds
- **Rate: ~2-3 requests/second** (safe batching)
- **Pattern:** 3 parallel requests, 150ms delay, repeat

**Next page click:**
- 0 search page requests (already have URLs)
- 20 detail page requests
- **Total: 20 requests** in ~10 seconds
- **Rate: ~2 requests/second**

### **Safety Assessment**
✅ **Safe** - 2 req/sec is very reasonable
✅ **Batched** - Groups of 5 prevent overwhelming server
✅ **Spaced** - Sequential batches add natural delays
✅ **Cacheable** - 5-minute cache reduces repeat searches

### **Additional Safety Measures**
Could add if needed:
- Random delay between batches (100-300ms)
- Reduce batch size from 5 to 3
- Set User-Agent header
- Exponential backoff on errors

---

## Caching Strategy

### **Cache Phase 1 Results**
```javascript
// Cache the price-only scan (2-12 seconds worth of work)
const phase1CacheKey = `prices_${query}_${sources}`;
cache.set(phase1CacheKey, priceOnlyResults, 10 * 60 * 1000); // 10 min TTL
```

### **Cache Phase 2 Results Per Page**
```javascript
// Cache enriched pages separately
const phase2CacheKey = `details_${query}_${sources}_page${page}`;
cache.set(phase2CacheKey, enrichedResults, 5 * 60 * 1000); // 5 min TTL
```

### **Benefits**
- Phase 1 cached for 10 minutes (rarely changes)
- Phase 2 cached per page for 5 minutes
- Subsequent page navigation: instant if cached
- Repeat search: 5ms instead of 10 seconds

---

## User Experience Flow

### **User searches "airpods"**

**Step 1: Initial Load**
```
0s  → Search button clicked
0s  → "Scanning all pages for best prices..." loading screen
3s  → "Scanned 3 pages (90 listings)..." (progress update)
6s  → "Scanned 6 pages (180 listings)..." (progress update)
10s → Phase 1 complete (285 prices scanned, sorted)
10s → "Loading details for best prices..."
18s → Phase 2 complete (first 20 enriched)
18s → Results displayed: "Showing 1-20 of 285 listings (sorted by price)"
18s → Notification bar: "Found 285 results. Try more specific keywords..." (if >100)
```

**Step 2: User clicks "Next Page"**
```
0s  → Page 2 button clicked
0s  → Loading indicators on cards
8s  → Details loaded for listings 21-40
8s  → Results displayed
```

**Step 3: User filters or searches again**
```
0s  → New search "airpods pro"
0s  → Check cache (miss)
12s → Results displayed with new query
```

---

## Implementation Steps

### **Step 1: Core Price Extraction** ✅ Critical
1. Add `extractPricesOnly()` function to ss.js
2. Add pagination support to `buildSearchUrl()`
3. Add `parsePriceValue()` helper
4. Test: Scan 5 pages, extract ~150 URLs + prices
5. Verify prices are sortable

### **Step 2: Two-Phase Search** ✅ Critical
1. Modify main `search()` function
2. Call Phase 1 (price extraction)
3. Sort by price
4. Call Phase 2 (enrich top 20)
5. Return pagination metadata
6. Test: Verify correct results returned

### **Step 3: API Layer** ✅ Critical
1. Accept page, perPage, maxPages parameters
2. Pass options to adapter
3. Return pagination metadata
4. Update cache keys
5. Test: API returns correct page data

### **Step 4: Frontend State** ✅ Critical
1. Add pagination state variables
2. Update performSearch to handle pages
3. Add handlePageChange callback
4. Test: State updates correctly

### **Step 5: UI Components** ✅ Important
1. Add notification bar to ResultsView
2. Add pagination controls
3. Update results count display
4. Add loading states for pagination
5. Test: UI renders correctly

### **Step 6: Styling** ✅ Important
1. Style notification bar (yellow/blue banner)
2. Style pagination controls
3. Responsive design for mobile
4. Test: Looks good on all screen sizes

### **Step 7: Caching** ✅ Nice-to-have
1. Implement Phase 1 caching (price lists)
2. Implement Phase 2 caching (enriched pages)
3. Test: Cache hit rates

### **Step 8: Error Handling** ✅ Important
1. Handle pagination errors
2. Handle empty results
3. Handle partial failures
4. Test: Graceful degradation

### **Step 9: Testing** ✅ Critical
1. Test with various queries
2. Test pagination navigation
3. Test with <20, 20-100, >100 results
4. Test cache behavior
5. Test filter interactions
6. Test mobile responsiveness

---

## Configuration Options

### **Adjustable Parameters**

```javascript
// In ss.js or via options
const CONFIG = {
  MAX_RESULTS: 300,             // Maximum results to collect (ceiling)
  RESULTS_PER_PAGE: 20,         // How many to show (10-50)
  BATCH_SIZE_PHASE1: 3,         // Search page batch size (3 parallel)
  BATCH_SIZE_PHASE2: 5,         // Detail fetching batch size (3-10)
  BATCH_DELAY: 150,             // Delay between batches in ms
  NOTIFICATION_THRESHOLD: 100,  // Show warning at this count
  PHASE1_CACHE_TTL: 600000,     // 10 minutes
  PHASE2_CACHE_TTL: 300000,     // 5 minutes
};
```

### **Recommended Defaults**
- **MAX_RESULTS:** 300 (ceiling to prevent excessive scraping)
- **RESULTS_PER_PAGE:** 20 (good balance)
- **BATCH_SIZE_PHASE1:** 3 (safe for search pages)
- **BATCH_SIZE_PHASE2:** 5 (safe for detail pages)
- **BATCH_DELAY:** 150ms (safety between batches)
- **NOTIFICATION_THRESHOLD:** 100 (reasonable limit)

---

## Success Criteria

### **Performance**
- ✅ Phase 1 completes in < 15 seconds (for up to 300 results)
- ✅ Phase 2 completes in < 12 seconds
- ✅ Total initial load < 25 seconds (popular items)
- ✅ Total initial load < 15 seconds (common items)
- ✅ Subsequent pages < 10 seconds
- ✅ Cache hits < 100ms

### **Functionality**
- ✅ Results sorted by price (low to high)
- ✅ Scans ALL pages up to 300 results maximum
- ✅ Stops automatically when no more results or 300 reached
- ✅ Pagination works correctly
- ✅ Notification shows when results > 100
- ✅ Progress updates during Phase 1 scan
- ✅ Filters still work with pagination

### **Safety**
- ✅ No rate limiting from SS.com
- ✅ < 3 requests/second sustained
- ✅ Graceful error handling
- ✅ No crashes on edge cases

### **User Experience**
- ✅ Clear loading indicators
- ✅ Smooth pagination
- ✅ Informative notification
- ✅ Results appear progressively
- ✅ Mobile responsive

---

## Potential Issues & Solutions

### **Issue 1: SS.com pagination URLs differ**
**Solution:** Test actual SS.com pagination and adjust `buildSearchUrl()`

### **Issue 2: Prices missing from search results**
**Solution:** Fall back to detail page price if search page price empty

### **Issue 3: Duplicate listings across pages**
**Solution:** Deduplicate by URL after Phase 1

### **Issue 4: Takes too long for popular items**
**Solution:** Already using batched parallel fetching (3 at a time); if still slow, reduce MAX_RESULTS to 200

### **Issue 5: User changes filters mid-search**
**Solution:** Cancel ongoing requests, start fresh search

### **Issue 6: Cache invalidation**
**Solution:** Include filter state in cache keys

---

## Testing Plan

### **Unit Tests**
- `parsePriceValue()` with various formats
- `extractPricesOnly()` with mock HTML
- Pagination logic
- Cache key generation

### **Integration Tests**
- Full search flow with real SS.com
- Pagination navigation
- Filter changes with pagination
- Cache hit/miss scenarios

### **Manual Tests**
- Search "airpods" (many results)
- Search "rare vintage item" (few results)
- Navigate pages 1-3
- Apply filters on page 2
- Test on mobile
- Test with network throttling

---

## Rollout Strategy

### **Phase A: Backend** (No UI changes yet)
1. Implement price extraction
2. Implement two-phase search
3. Add pagination to API
4. Test thoroughly
5. Deploy backend changes

### **Phase B: Frontend** (UI updates)
1. Add pagination state
2. Add UI components
3. Wire up handlers
4. Test navigation
5. Deploy frontend changes

### **Phase C: Polish**
1. Optimize caching
2. Fine-tune styling
3. Add loading animations
4. Performance monitoring
5. User feedback collection

---

## Future Enhancements

### **Nice-to-have Features**
- Infinite scroll instead of pagination
- Virtual scrolling for performance
- "Jump to page" input
- Price range filter UI (slider)
- Visual price distribution chart
- Save search / alert when price drops
- Sort by date instead of price (toggle)
- Export results to CSV

### **Advanced Optimizations**
- Parallel page fetching (Phase 1)
- WebWorkers for price parsing
- Progressive image loading
- Request deduplication
- Smarter cache warming
- Background refresh

---

## Estimated Timeline

| Task | Estimated Time |
|------|---------------|
| Step 1: Core extraction | 1-2 hours |
| Step 2: Two-phase search | 1 hour |
| Step 3: API layer | 30 minutes |
| Step 4: Frontend state | 1 hour |
| Step 5: UI components | 1-2 hours |
| Step 6: Styling | 1 hour |
| Step 7: Caching | 30 minutes |
| Step 8: Error handling | 1 hour |
| Step 9: Testing | 2 hours |
| **Total** | **9-11 hours** |

---

## Next Steps

1. ✅ Review this plan
2. ⏳ Get approval for implementation approach
3. ⏳ Start with Step 1 (price extraction)
4. ⏳ Test Phase 1 thoroughly
5. ⏳ Proceed with Steps 2-9
6. ⏳ Deploy and monitor

---

**Status:** Ready for implementation  
**Priority:** High - Core feature for best price discovery  
**Risk Level:** Medium - Requires careful testing but architecture is sound
