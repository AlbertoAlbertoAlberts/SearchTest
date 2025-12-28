# Sidequest: Fix Andele Showing 48 Items Instead of 127

## Problem Statement

When searching for "airpods" on Andele Mandele website directly, there are **127 listings**. However, our application only shows **48 listings** from Andele.

### Current Behavior:
- Logs show: "Found 240 total listings" → "After deduplication: 48 unique listings"
- This means we're fetching multiple pages but getting duplicate URLs
- Currently fetching **6 pages** (increased from 3) with **48 items per page** = 288 potential items
- After deduplication: only 48 unique items

### Expected Behavior:
- Should fetch all **127 unique listings** from Andele
- No excessive duplicates (some overlap between pages is normal, but not 240→48)

---

## Current Workflow Confirmation

✅ **Yes, your understanding is correct!**

### Current Two-Phase Architecture:

**Phase 1: Price Scanning (Lightweight)**
```
For each source in parallel:
  1. Fetch search results pages (URLs only)
  2. Extract: URL + price + image thumbnail
  3. Return: [{url, priceValue, priceText, source, imageUrl}, ...]
```

**Phase 2: Global Sorting & Pagination**
```
API Level:
  1. Combine all price results from all sources
  2. Sort globally by price (low to high)
  3. Calculate total pages: 127 items ÷ 20 per page = 7 pages
  4. Slice for current page: [0-19] for page 1, [20-39] for page 2, etc.
```

**Phase 3: Detail Enrichment (Only Current Page)**
```
For current page's 20 URLs:
  1. Group URLs by source (e.g., 12 from SS, 8 from Andele)
  2. Call enrichDetails(urls) for each source in parallel
  3. Fetch full details: title, description, condition, date, etc.
  4. Merge enriched data with price data
  5. Return exactly 20 fully enriched items
```

### Efficiency Notes:
- ✅ **Current approach is efficient**: We only enrich the 20-40 cheapest items that will be displayed
- ✅ **Page 2 loads faster**: Price data is already cached, only need to enrich the next 20 items
- ✅ **No wasted bandwidth**: We don't fetch full details for items that won't be shown

---

## Potential Causes of the 48/127 Issue

### **Theory 1: Pagination Parameter Not Working**
**Hypothesis**: Andele's `?page=2` parameter might not be advancing results
- If pages 1, 2, 3, 4, 5, 6 all return the same 48 items
- This would explain: 240 total items (6 pages × 40 duplicates) → 48 unique

**How to test**:
1. ✅ Add logging to show each page's URL (DONE)
2. Check if URLs have `?page=2`, `?page=3`, etc.
3. Manually visit those URLs in browser and compare results

**Evidence**:
- Need to check logs: Do page URLs have pagination parameter?
- Do results differ between pages?

---

### **Theory 2: Andele Rate Limiting / Bot Detection**
**Hypothesis**: Andele detects our Puppeteer automation and returns limited results
- Fetching 6 pages in parallel might trigger anti-bot measures
- Server might return cached/limited results after first few requests

**How to test**:
1. Reduce parallelization: Fetch pages sequentially instead of in batches
2. Add longer delays between requests (currently 800ms)
3. Randomize delays (human-like behavior)
4. Check response headers for rate limit indicators

**Evidence**:
- We're using headless Chromium (detectable by websites)
- Fetching multiple pages quickly might look like a bot
- No CAPTCHA solving implemented

---

### **Theory 3: JavaScript Rendering Timing**
**Hypothesis**: We're capturing the page before all items have loaded
- Currently wait for `article.product-card` selector (800ms)
- Maybe Andele loads items progressively via AJAX
- We might be capturing the page before page 2+ items render

**How to test**:
1. Increase wait time from 800ms to 2000ms
2. Wait for specific selector count: "wait until 48 items are visible"
3. Scroll to bottom to trigger lazy loading

**Evidence**:
- Reduced wait time from 1500ms to 800ms in performance optimization
- This might have broken pagination

---

### **Theory 4: Andele Changed Their Pagination**
**Hypothesis**: Andele's website updated and pagination works differently now
- Maybe they use infinite scroll instead of page numbers
- Maybe pagination parameter changed from `?page=2` to `?offset=48`
- Maybe they limit results to 48 items for unauthenticated users

**How to test**:
1. Manually test Andele pagination in browser
2. Check network tab: How does clicking "page 2" change the URL?
3. Verify we can see all 127 items manually

**Evidence**:
- Need to inspect actual Andele website behavior
- Check if our `buildSearchUrl()` matches their current URL format

---

### **Theory 5: Search Query Specificity**
**Hypothesis**: Andele filters out some results based on query matching
- Maybe "airpods" returns 127 on website but our automated search returns 48
- Different search algorithm for bots vs humans
- Some items might be hidden from automated searches

**How to test**:
1. Compare HTML received by Puppeteer vs browser DevTools
2. Check if item count in HTML matches what we see
3. Test with different search terms

---

## Recommended Investigation Steps

### **Step 1: Add Detailed Logging** ✅ DONE
- Log each page URL being fetched
- Log item count per page
- Log sample URLs from each page (first 3 URLs)

### **Step 2: Manual URL Testing**
```bash
# Get URLs from logs, test manually:
https://andelemandele.lv/en/search/?search=airpods
https://andelemandele.lv/en/search/?search=airpods&page=2
https://andelemandele.lv/en/search/?search=airpods&page=3
```
- Visit each URL in regular browser
- Count items on each page
- Check if pages show different items

### **Step 3: Compare HTML Content**
- Save HTML from Puppeteer to file
- Save HTML from browser DevTools to file
- Use `diff` to compare
- Look for differences in item count or structure

### **Step 4: Test Pagination Behavior**
```javascript
// In extractPricesOnly or scanPrices, add:
console.log(`[Andele] Page ${page} first 3 URLs:`, 
  pageResults.slice(0, 3).map(r => r.url)
);
```
- Check if page 1, 2, 3 show different first URLs
- If all pages show same first 3 URLs → pagination not working

### **Step 5: Reduce Parallelization**
```javascript
// Change from batches of 5 to sequential:
const BATCH_SIZE = 1; // Fetch one page at a time
// OR add delay between batches:
await new Promise(resolve => setTimeout(resolve, 2000));
```

### **Step 6: Increase Wait Time**
```javascript
// In scanPrices, change:
waitFor: 800  // Current
// To:
waitFor: 2000  // More time for items to load
```

---

## Implementation Plan

### **Phase A: Gather Evidence** (1-2 hours)
1. ✅ Run search with new logging
2. Examine logs: URLs, item counts, sample URLs per page
3. Manually test URLs in browser
4. Determine which theory is most likely

### **Phase B: Test Quick Fixes** (30 min - 1 hour each)
Depending on findings from Phase A:

**If pagination parameter issue:**
- Check Andele website's actual pagination URL format
- Update `buildSearchUrl()` to match
- Test with correct parameter

**If rate limiting:**
- Reduce `BATCH_SIZE` from 5 to 2
- Increase delay between requests to 1500-2000ms
- Add random jitter to delays
- Test with sequential fetching

**If timing issue:**
- Increase `waitFor` from 800ms to 2000ms
- Add scroll behavior to trigger lazy loading
- Wait for specific item count

**If pagination changed:**
- Inspect Andele's actual search results page
- Check network tab for AJAX requests
- Update scraping logic to match new behavior

### **Phase C: Implement Robust Solution** (2-3 hours)
Based on root cause:

1. **Update Andele adapter** with proper pagination
2. **Add retry logic** for failed pages
3. **Implement incremental fetching**: Stop when no new items found
4. **Add monitoring**: Log warnings if item count < expected

### **Phase D: Verify Fix** (30 min)
1. Test with "airpods" search
2. Verify 127 items are fetched
3. Check pagination works correctly
4. Verify no performance regression

---

## Fallback Options

If we can't fetch all 127 items:

### **Option 1: Accept Limitation**
- Document that Andele limits automated searches to 48 items
- Show warning in UI: "Some results may be filtered by source website"

### **Option 2: User Authentication**
- Add login support for Andele
- Authenticated users might see all 127 items

### **Option 3: Different Scraping Strategy**
- Use Andele's API if they have one
- Use RSS/Sitemap if available
- Implement Selenium with real browser profile (harder to detect)

---

## Success Criteria

- ✅ Fetch all **127 unique listings** from Andele for "airpods" search
- ✅ Deduplication ratio improves: Should be < 10% duplicates (e.g., 140→127, not 240→48)
- ✅ Pagination works correctly: Each page shows different items
- ✅ Performance acceptable: < 15 seconds for initial search
- ✅ No regression: SS.com still works correctly

---

## Timeline Estimate

- **Phase A** (Evidence): 1-2 hours
- **Phase B** (Quick fixes): 2-4 hours total (testing multiple theories)
- **Phase C** (Robust solution): 2-3 hours
- **Phase D** (Verification): 30 minutes

**Total**: 5-9 hours depending on root cause complexity

---

## Notes

- Priority: HIGH (core functionality broken)
- Risk: LOW (changes isolated to Andele adapter)
- Testing: Can verify by comparing app results to manual website search
- Monitoring: Add alerts if item count drops significantly

