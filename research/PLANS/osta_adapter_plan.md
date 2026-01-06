# Osta.ee Adapter Implementation Plan

**Date:** 29 December 2025  
**Target marketplace:** Osta.ee (Estonia)  
**Status:** Planning phase — no code yet

---

## 1. Site key + adapter location

**Proposed source key:** `osta`

**File path:** `lib/adapters/osta.js`

**Reason for key choice:**
- Short, memorable, and matches the actual site domain
- Follows existing pattern (`ss`, `andele`)
- No conflicts with existing source keys

---

## 2. How Osta.ee works technically

### Investigation approach

To determine the rendering method, I will:

1. **Check initial page source** (View Source in browser)
   - If search results are in the HTML, it's server-rendered
   - If results container is empty with `<script>` tags loading data, it's JS-rendered

2. **Inspect Network tab** (Chrome DevTools → Network → XHR/Fetch)
   - Search for a test query (e.g., "iphone")
   - Look for JSON API endpoints returning listing data
   - Check if results are loaded via AJAX calls

3. **Run a test fetch** from Node.js
   - Use simple `fetch()` or `fetchHtml()` helper
   - Examine if search results are present in the raw HTML response
   - If results are missing, Puppeteer will be required

### Expected outcome (to be verified during implementation)

Based on typical Estonian marketplace patterns (similar to SS.lv structure):
- **Most likely:** Server-rendered HTML with results in initial page load
- **Alternative:** Hybrid approach (initial results server-rendered, lazy-loading more via JS)
- **Least likely:** Pure SPA with client-side rendering (like Andele)

**Decision rule:**
- If server-rendered: Use `cheerio` + `fetchHtml()` (fast, like SS adapter)
- If JS-rendered: Use `Puppeteer` + `fetchWithBrowser()` (slower, like Andele adapter)

---

## 3. Exact URLs and patterns

### Search URL structure

**Base pattern (to be confirmed):**
```
https://www.osta.ee/search.php?q={query}
OR
https://www.osta.ee/otsing/?q={query}
```

**Pagination:**
- Likely uses `page=N` parameter (common pattern)
- Example: `https://www.osta.ee/search.php?q=iphone&page=2`
- Alternative: offset-based (`offset=20`) or path-based (`/search/page2`)
- **To be determined:** Test actual pagination structure during implementation

### Sorting capabilities

**Price sorting (to be verified):**
```
https://www.osta.ee/search.php?q={query}&sort=price_asc
https://www.osta.ee/search.php?q={query}&sort=price_desc
```

**Possible sort parameter values:**
- `price_asc` / `price_low` / `price` — ascending price
- `price_desc` / `price_high` — descending price
- `date` / `newest` / `created` — newest first
- `relevance` / `default` — relevance sorting

**If URL sorting is NOT supported:**
- Fall back to local sorting after fetching results
- Parse dates and prices, sort in-memory before returning

### Price filtering

**Min/max price filters (to be verified):**
```
https://www.osta.ee/search.php?q={query}&price_min=50&price_max=500
```

**Alternative parameter names:**
- `minPrice`, `maxPrice`
- `priceFrom`, `priceTo`
- `min_price`, `max_price`

**If URL filtering is NOT supported:**
- Apply filters locally after parsing results
- Filter out listings where `priceValue < minPrice` or `priceValue > maxPrice`

---

## 4. Adapter interface (matching existing system)

### Core functions

The adapter must export two functions to match the orchestrator's expectations:

#### Function 1: `scanPrices(query, options)`

**Purpose:** Fast price scanning across multiple pages (Phase 1)

**Signature:**
```javascript
export async function scanPrices(query, options = {}) {
  const {
    maxResults = 150,
    minPrice = null,
    maxPrice = null,
    sortBy = 'price-low',
  } = options;
  
  // Implementation here
}
```

**What it extracts from search result pages:**
- `url` — absolute URL to the listing detail page (required)
- `priceText` — raw price string (e.g., "45 €", "€150") (required)
- `priceValue` — parsed numeric value for sorting (required)
- `currency` — detected currency (e.g., "EUR", "€")
- `imageUrl` — thumbnail URL (optional, best effort from search results)
- `source` — always `"osta"`

**Return format:**
```javascript
return [
  { url: "https://...", priceText: "45 €", priceValue: 45, currency: "EUR", imageUrl: "https://...", source: "osta" },
  { url: "https://...", priceText: "120 €", priceValue: 120, currency: "EUR", imageUrl: "https://...", source: "osta" },
  // ... up to maxResults items
];
```

**How it stops:**
1. When `maxResults` is reached
2. When no more pages are available (pagination exhausted)
3. When a page returns zero results
4. When an error occurs (return partial results, never throw)

**Error handling:**
- Catch all errors internally
- Return partial results if some pages succeeded
- Log warnings but don't crash

#### Function 2: `enrichDetails(urls)`

**Purpose:** Enrich a batch of URLs with full details (Phase 2)

**Signature:**
```javascript
export async function enrichDetails(urls) {
  // urls is an array of listing URLs to enrich
  // e.g., ["https://www.osta.ee/item/123", "https://www.osta.ee/item/456"]
}
```

**What it extracts from listing detail pages:**
- `url` — final URL (after any redirects)
- `title` — listing title (required)
- `description` — full description text (optional, best effort)
- `descriptionPreview` — truncated preview (~120 chars)
- `priceText` — price string (may differ from search results)
- `priceValue` — parsed numeric price
- `currency` — currency symbol/code
- `imageUrl` — first/best image URL (higher quality than thumbnail)
- `conditionText` — condition if available (e.g., "new", "used", "like new")
- `locationText` — city/region if available
- `postedAtText` — raw posted date string (e.g., "29.12.2024")
- `postedAtISO` — ISO date if parseable
- `hasImage` — boolean (true if imageUrl exists)
- `source` — always `"osta"`

**Return format:**
```javascript
return [
  {
    url: "https://...",
    title: "iPhone 13 Pro",
    description: "Full description text...",
    descriptionPreview: "Full description text...",
    priceText: "450 €",
    priceValue: 450,
    currency: "EUR",
    imageUrl: "https://...",
    conditionText: "used",
    locationText: "Tallinn",
    postedAtText: "29.12.2024",
    postedAtISO: "2024-12-29T00:00:00.000Z",
    hasImage: true,
    source: "osta",
  },
  // ... one object per input URL
];
```

**Missing fields:**
- If a field is unavailable, set it to `null` or empty string
- Never crash or throw when a field is missing
- Always return an object for each URL (even if partially empty)

**Error handling per URL:**
- If a single URL fails, skip it or return minimal data (url + source)
- Don't let one failure crash the entire batch
- Use `Promise.allSettled()` for batch processing

---

## 5. Data mapping to unified Listing schema

### Mapping table (Osta.ee → SPEC.md Listing)

| **SPEC.md field**      | **Osta.ee source**                          | **Extraction notes**                                                 |
|------------------------|---------------------------------------------|----------------------------------------------------------------------|
| `id`                   | Hash of `source + url`                      | Generated in `normalize.js`                                          |
| `source`               | Hardcoded: `"osta"`                         | Adapter responsibility                                               |
| `sourceName`           | Hardcoded: `"Osta.ee"`                      | Adapter responsibility                                               |
| `url`                  | Listing page URL                            | Absolute URL to detail page                                          |
| `title`                | Title element on listing page               | e.g., `.listing-title`, `h1`, or meta description                    |
| `description`          | Description text block                      | Full text from detail page; may be in `<div class="description">`   |
| `descriptionPreview`   | First 120-200 chars of description          | Truncate with `getDescriptionPreview()` helper                       |
| `priceText`            | Price element text                          | e.g., "45 €", "€150", "Kokkuleppel" (negotiable)                    |
| `priceValue`           | Parsed from `priceText`                     | Use `parsePriceValue()` helper; Infinity for unparseable            |
| `currency`             | Extracted from `priceText`                  | Usually "EUR" or "€" for Estonia                                     |
| `imageUrl`             | First image `src` attribute                 | Prefer thumbnail on search page, full image on detail page           |
| `hasImage`             | Boolean: `!!imageUrl`                       | True if image exists                                                 |
| `conditionText`        | Condition label (if exists)                 | e.g., "new", "used", "like new"; may be in filter section or N/A     |
| `locationText`         | Location/city element                       | e.g., "Tallinn", "Tartu"; often in listing meta                      |
| `postedAtText`         | Posted date string                          | e.g., "29.12.2024", "täna" (today), "2 päeva tagasi" (2 days ago)   |
| `postedAtISO`          | Parsed ISO date                             | Best effort; use date parsing helper if available                    |
| `qualityScore`         | Computed by `normalize.js`                  | Based on completeness (image, description, condition, date)          |
| `qualityFlags`         | Computed by `normalize.js`                  | e.g., `["no_image", "no_description"]`                               |

### Fields likely UNAVAILABLE on Osta.ee (based on typical Estonian marketplaces)

- `conditionText` — may not be explicitly shown (set to `null`)
- `postedAtISO` — date formats vary; may only have relative dates ("2 days ago")

### Fallback strategy for missing data

- Missing image: `imageUrl = null`, `hasImage = false`
- Missing description: `description = ""`, `descriptionPreview = ""`
- Missing condition: `conditionText = null`
- Missing date: `postedAtText = null`, `postedAtISO = null`
- Unparseable price: `priceValue = Infinity` (listings will sort to bottom)

**Critical rule:** Never crash or throw when fields are missing. Return partial data.

---

## 6. Performance + reliability strategy

### Rendering method decision tree

**IF server-rendered HTML:**
- Use `cheerio` for parsing (fast, lightweight)
- Use existing `fetchHtml()` helper from `lib/http.js`
- Batch detail page requests with concurrency limit (e.g., 5-8 concurrent)
- Expected speed: ~100-200ms per page

**IF JavaScript-rendered:**
- Use `Puppeteer` via `fetchWithBrowser()` from `lib/browser.js`
- Cache browser instance across requests (don't create new browser per search)
- Wait for results container to load before parsing
- Expected speed: ~2-4 seconds per page (acceptable for Phase 1 scanning)

**Decision point:** Test during implementation with real requests.

### Rate limiting

**Rules:**
- Respect robots.txt if available
- Add 200-500ms delay between page fetches in `scanPrices`
- Use `Promise.allSettled()` for batch enrichment (fail gracefully)
- Max 5-8 concurrent detail page requests in `enrichDetails`

**Example implementation:**
```javascript
// Delay helper (if needed)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In scanPrices loop
for (let page = 1; page <= maxPages; page++) {
  const items = await fetchSearchPage(query, page);
  results.push(...items);
  
  if (results.length >= maxResults) break;
  
  // Polite delay before next page
  if (page < maxPages) await delay(300);
}
```

### Concurrency control for enrichment

**Strategy:** Process URLs in batches of 5-8 to avoid overwhelming the server

```javascript
export async function enrichDetails(urls) {
  const BATCH_SIZE = 5;
  const results = [];
  
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(url => fetchListingDetails(url))
    );
    
    const valid = batchResults
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);
    
    results.push(...valid);
  }
  
  return results;
}
```

### Fallback strategies if selectors break

**Problem:** Site redesigns can break CSS selectors

**Mitigation:**
1. Use multiple fallback selectors per field:
   ```javascript
   const title = 
     $('h1.listing-title').text().trim() ||
     $('h1.item-title').text().trim() ||
     $('.title-main').text().trim() ||
     $('h1').first().text().trim() ||
     'Untitled';
   ```

2. Log warnings when primary selectors fail:
   ```javascript
   if (!title) {
     console.warn(`[Osta] No title found for ${url}`);
   }
   ```

3. Return partial results instead of crashing:
   ```javascript
   return {
     url,
     title: title || 'Untitled',
     description: description || '',
     priceText: priceText || 'N/A',
     // ...
     source: 'osta',
   };
   ```

4. Consider using attribute-based selectors when possible:
   - `[data-testid="price"]` is more stable than `.price-label`
   - Schema.org microdata (`itemprop="price"`) is very stable

### Error handling rules

**Adapter-level guarantees:**
1. **Never throw errors from adapter functions**
   - Always catch and log errors internally
   - Return empty array or partial results

2. **Graceful degradation:**
   - If page 1 fails, return `[]`
   - If page 2+ fails, return results from successful pages
   - If a detail page fails, skip that URL and continue

3. **Error logging:**
   ```javascript
   try {
     // fetch and parse
   } catch (error) {
     console.error('[Osta] Failed to fetch:', error.message);
     return []; // or partial results
   }
   ```

4. **Timeout protection:**
   ```javascript
   const timeoutPromise = new Promise((_, reject) => 
     setTimeout(() => reject(new Error('Timeout')), 10000)
   );
   const result = await Promise.race([fetchPromise, timeoutPromise]);
   ```

---

## 7. Testing plan

### Test script: `test-osta-integration.js`

**Purpose:** Verify adapter works end-to-end before integrating with orchestrator

**Location:** `test-osta-integration.js` (root of project)

**What it should test:**

1. **Test 1: Basic search returns results**
   ```javascript
   const results = await scanPrices("iphone", { maxResults: 50 });
   console.log(`✓ Found ${results.length} results`);
   assert(results.length > 0, "Should return at least one result");
   ```

2. **Test 2: Results have required fields**
   ```javascript
   results.forEach(item => {
     assert(item.url, "Item should have URL");
     assert(item.priceText, "Item should have priceText");
     assert(typeof item.priceValue === 'number', "Item should have numeric priceValue");
     assert(item.source === 'osta', "Source should be 'osta'");
   });
   console.log("✓ All items have required fields");
   ```

3. **Test 3: Price filtering works**
   ```javascript
   const filtered = await scanPrices("phone", { minPrice: 100, maxPrice: 500 });
   filtered.forEach(item => {
     assert(item.priceValue >= 100 && item.priceValue <= 500, 
       `Price ${item.priceValue} should be in range 100-500`);
   });
   console.log("✓ Price filtering works");
   ```

4. **Test 4: Enrichment returns details**
   ```javascript
   const urls = results.slice(0, 3).map(r => r.url);
   const enriched = await enrichDetails(urls);
   
   assert(enriched.length > 0, "Should enrich at least one URL");
   
   enriched.forEach(item => {
     assert(item.title, "Enriched item should have title");
     assert(item.url, "Enriched item should have URL");
     console.log(`  - ${item.title} (${item.priceText})`);
   });
   console.log("✓ Enrichment works");
   ```

5. **Test 5: Error handling (invalid query)**
   ```javascript
   const empty = await scanPrices("xyznonexistentquery123", { maxResults: 10 });
   assert(Array.isArray(empty), "Should return array even for empty results");
   console.log(`✓ Error handling: returned ${empty.length} results for invalid query`);
   ```

**Sample output:**
```
[Osta] Testing adapter...
✓ Found 48 results for "iphone"
✓ All items have required fields (url, priceText, priceValue, source)
✓ Price filtering works (100-500 EUR range)
✓ Enrichment works for 3 URLs:
  - iPhone 13 Pro 128GB (450 €)
  - iPhone 12 64GB (320 €)
  - iPhone SE 2020 (180 €)
✓ Error handling: returned 0 results for invalid query

All tests passed! Adapter is ready for integration.
```

**Usage:**
```bash
node test-osta-integration.js
```

---

## 8. MVP scope confirmation

### Scope definition

**Phase 1 (scanPrices):**
- ✅ Parse search result pages only
- ✅ Extract: URL, price, thumbnail (if visible on search results)
- ✅ Support pagination (fetch multiple pages up to `maxResults`)
- ✅ Apply server-side filters if available (price range, sorting)

**Phase 2 (enrichDetails):**
- ✅ Fetch listing detail pages for selected URLs
- ✅ Extract: title, description, full image, condition (if available), posted date (if available)
- ✅ Handle missing fields gracefully (return empty string or null)

### Why detail pages are necessary

**Reason:** Search result pages typically show minimal info (thumbnail, price, maybe truncated title)

**What's missing on search results:**
- Full title (often truncated to 50 chars)
- Full description text (not shown on search results)
- Listing condition (if site supports it)
- Posted date (may be hidden or not shown)
- High-quality images (search results only have thumbnails)

**Alternative considered:**
- Fetch everything from search results only → **Rejected** because it would produce low-quality listings with missing titles/descriptions

**Solution:**
- Use two-phase architecture (same as SS and Andele adapters)
- Phase 1: Fast price scanning (search results only)
- Phase 2: Selective enrichment (detail pages for current page only)

This balances speed and data quality.

### Data availability expectations

**Likely available:**
- ✅ Title (from detail page)
- ✅ Price (from search results and detail page)
- ✅ Description (from detail page)
- ✅ Image (thumbnail on search, full image on detail page)
- ✅ Location (city/region)

**Possibly unavailable:**
- ⚠️ Condition (depends on site structure; many Estonian marketplaces don't show explicit condition)
- ⚠️ Posted date (may be relative: "2 days ago" instead of absolute date)

**Definitely unavailable:**
- ❌ Seller rating (not in MVP scope)
- ❌ View count (not in MVP scope)
- ❌ Contact info (not needed for aggregator)

---

## Next 5 concrete implementation steps

### Step 1: Site reconnaissance (research phase)
**Time estimate:** 15-30 minutes  
**Tasks:**
- Open https://www.osta.ee in browser
- Search for test query: "iphone"
- Inspect page source (View Source)
- Check Network tab (DevTools → Network → XHR/Fetch)
- Determine if server-rendered or JS-rendered
- Document exact URL patterns for:
  - Search results page
  - Pagination
  - Sorting
  - Price filtering
- Take screenshots of HTML structure for selectors

**Output:** Notes file with URL patterns and rendering method decision

---

### Step 2: Create adapter skeleton
**Time estimate:** 15 minutes  
**Tasks:**
- Create `lib/adapters/osta.js`
- Add file header with description
- Import necessary dependencies:
  - `cheerio` or `puppeteer` (based on Step 1 findings)
  - `fetchHtml` or `fetchWithBrowser` from `lib/http.js` or `lib/browser.js`
  - `normalizeListing` from `lib/normalize.js`
  - `parsePriceValue`, `getDescriptionPreview` from `lib/textHelpers.js`
- Define empty function stubs:
  ```javascript
  export async function scanPrices(query, options = {}) {
    // TODO
    return [];
  }
  
  export async function enrichDetails(urls) {
    // TODO
    return [];
  }
  
  export const config = {
    id: "osta",
    name: "Osta.ee",
    country: "EE",
    enabled: true,
  };
  ```

**Output:** Working skeleton file (compiles but returns empty results)

---

### Step 3: Implement scanPrices (Phase 1)
**Time estimate:** 1-2 hours  
**Tasks:**
- Build search URL generator function
- Implement page fetching loop (fetch pages 1, 2, 3... until `maxResults`)
- Parse search result items using CSS selectors:
  - Listing URL
  - Price text
  - Thumbnail URL (optional)
- Convert price text to numeric value
- Apply local price filtering if server-side not available
- Stop early when:
  - `maxResults` reached
  - No more pages
  - Empty page detected
- Add error handling (try-catch, return partial results)
- Add logging for debugging

**Output:** Working `scanPrices` function that returns price-sorted URLs

**Test command:**
```bash
node -e "import('./lib/adapters/osta.js').then(m => m.scanPrices('iphone', {maxResults: 20}).then(console.log))"
```

---

### Step 4: Implement enrichDetails (Phase 2)
**Time estimate:** 1-2 hours  
**Tasks:**
- Implement detail page fetcher
- Parse listing detail page using CSS selectors:
  - Title (h1 or equivalent)
  - Full description (text block)
  - Price (verify against search results)
  - Full-size image URL
  - Condition (if available)
  - Location (city/region)
  - Posted date (if available)
- Create description preview (truncate to 120 chars)
- Batch process URLs with concurrency limit (5-8 concurrent)
- Use `Promise.allSettled()` for graceful failure handling
- Return array of enriched objects

**Output:** Working `enrichDetails` function

**Test command:**
```bash
node -e "import('./lib/adapters/osta.js').then(m => m.enrichDetails(['https://www.osta.ee/item/...', 'https://www.osta.ee/item/...']).then(console.log))"
```

---

### Step 5: Write integration test + validate
**Time estimate:** 30-45 minutes  
**Tasks:**
- Create `test-osta-integration.js` in project root
- Implement all test cases from Section 7 (Testing plan):
  - Test 1: Basic search returns results
  - Test 2: Results have required fields
  - Test 3: Price filtering works
  - Test 4: Enrichment returns details
  - Test 5: Error handling
- Run test script: `node test-osta-integration.js`
- Fix any issues revealed by tests
- Document any discovered limitations (e.g., "condition not available")
- Update this plan file with findings

**Output:** Passing test script + validated adapter ready for orchestrator integration

**Test command:**
```bash
node test-osta-integration.js
```

---

## Post-implementation: Integration with orchestrator

Once Steps 1-5 are complete and tests pass:

**Step 6: Register adapter in API orchestrator**
- Open `pages/api/search.js`
- Add import: `import * as ostaAdapter from "../../lib/adapters/osta.js";`
- Add to `ADAPTERS` map: `osta: ostaAdapter,`
- No other changes needed (orchestrator already supports new sources)

**Step 7: Update UI to show Osta.ee**
- Add "Osta.ee" checkbox to source selector in `pages/index.js`
- Verify search works end-to-end with multiple sources

**Step 8: Production readiness**
- Add Osta.ee to README.md list of supported sources
- Test with real queries in production-like environment
- Monitor error logs for any selector breakage

---

## Risk mitigation

| **Risk**                          | **Likelihood** | **Impact** | **Mitigation**                                                                 |
|-----------------------------------|----------------|------------|--------------------------------------------------------------------------------|
| Site is JS-rendered (slow)        | Medium         | Medium     | Use Puppeteer with browser caching; accept slower speed as necessary tradeoff |
| Selectors change after deploy     | Medium         | High       | Use multiple fallback selectors; monitor error logs; implement health checks  |
| No sorting/filtering in URL       | Low            | Low        | Apply filters locally after fetching; slightly slower but works               |
| Rate limiting / IP blocking       | Low            | High       | Add delays between requests; respect robots.txt; use rotation if needed       |
| Condition field not available     | High           | Low        | Accept missing field; return null (won't break system)                        |
| Date parsing fails (relative)     | Medium         | Low        | Parse relative dates ("2 days ago"); fallback to null if unparseable          |

---

## Success criteria

The adapter is considered **complete and ready** when:

✅ `scanPrices` returns results for common queries (e.g., "iphone", "laptop")  
✅ Results include valid URLs, prices, and source metadata  
✅ `enrichDetails` successfully fetches titles and descriptions  
✅ Price filtering and sorting work (either server-side or local)  
✅ Error handling prevents crashes (returns empty array or partial results)  
✅ Test script passes all 5 tests  
✅ Integration with orchestrator works without changing SS.lv behavior  
✅ No errors in console logs for typical queries

---

## Timeline estimate

| **Phase**                 | **Time estimate** |
|---------------------------|-------------------|
| Step 1: Reconnaissance     | 15-30 minutes     |
| Step 2: Skeleton           | 15 minutes        |
| Step 3: scanPrices         | 1-2 hours         |
| Step 4: enrichDetails      | 1-2 hours         |
| Step 5: Testing            | 30-45 minutes     |
| **Total**                 | **3-5 hours**     |

---

## Appendix: Example code patterns

### URL builder example
```javascript
function buildSearchUrl(query, page = 1, sortBy = 'price-low') {
  let url = `https://www.osta.ee/search.php?q=${encodeURIComponent(query)}`;
  
  // Add sorting
  if (sortBy === 'price-low') {
    url += '&sort=price_asc';
  } else if (sortBy === 'price-high') {
    url += '&sort=price_desc';
  }
  
  // Add pagination
  if (page > 1) {
    url += `&page=${page}`;
  }
  
  return url;
}
```

### Price parser example
```javascript
function parsePriceValue(priceText) {
  if (!priceText) return Infinity;
  
  const text = priceText.toLowerCase().trim();
  
  // Handle free/negotiable
  if (text.includes('free') || text.includes('tasuta')) {
    return 0;
  }
  if (text.includes('kokkuleppel')) {
    return Infinity; // Negotiable → sort to bottom
  }
  
  // Extract numeric value
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return Infinity;
  
  const cleaned = match[1].replace(',', '.');
  const value = parseFloat(cleaned);
  
  return isNaN(value) ? Infinity : value;
}
```

---

**End of plan. Ready for implementation.**
