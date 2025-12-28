# Andele Mandele Implementation Plan

## Overview
**Goal:** Add Andele Mandele (https://www.andelemandele.lv/) as a second marketplace source, enabling multi-source price comparison and aggregation.

**Key Findings from Site Analysis:**
- Uses "pērles" (pearls) terminology for listings
- URL structure: `/perle/{id}/{title}/` for individual listings
- Search: `/perles/?search={query}` (no dedicated search endpoint found)
- Price format: `{price} €` or `{original} €{sale} €` for discounts
- Has pagination and sorting options (Aktuālie, Jaunākie, Populārākie, Cena)
- Categories: DĀMĀM, BĒRNIEM, KUNGIEM, MĀJAI, TRANSPORTS
- ~280,000+ listings total
- Heavy JavaScript rendering (may require API reverse-engineering or browser automation)

---

## Phase 1: Research & Architecture Planning (2-3 hours)

### 1.1 Technical Investigation
**Goal:** Understand Andele Mandele's data delivery mechanism

#### Tasks:
- [ ] **Network Analysis:**
  - Use browser DevTools to inspect search requests
  - Identify if site uses API endpoints (likely GraphQL or REST)
  - Check for pagination parameters
  - Document authentication/headers requirements
  
- [ ] **HTML Structure Analysis:**
  - Inspect listing card structure (if server-rendered)
  - Identify selectors for: title, price, URL, images, condition
  - Check if content is JavaScript-rendered or server-side
  
- [ ] **Search Behavior:**
  - Test search with different queries (e.g., "airpods", "iphone", "guitar")
  - Document URL patterns and parameters
  - Test pagination (page 2, page 3, etc.)
  - Test sorting options
  
#### Decision Point:
- **Option A:** If API exists → Use API endpoints (preferred, faster)
- **Option B:** If JS-rendered → Use Puppeteer/Playwright for browser automation
- **Option C:** If server-rendered → Use Cheerio (like SS.com adapter)

**Expected Outcome:** Technical specification document with:
- Request/response examples
- Required headers
- Selector mappings
- Pagination strategy

---

## Phase 2: Adapter Foundation (3-4 hours)

### 2.1 Create Adapter File Structure
**Location:** `lib/adapters/andele.js`

**Architecture Pattern:** Match SS.com adapter structure for consistency

```javascript
lib/adapters/
  ├── ss.js          // Existing SS.com adapter
  └── andele.js      // New Andele Mandele adapter (new)
```

### 2.2 Implement Core Functions

#### Function 1: `buildSearchUrl(query, page)`
**Purpose:** Generate correct search URLs for Andele Mandele
```javascript
// Expected format: https://www.andelemandele.lv/perles/?search=airpods&page=2
export function buildSearchUrl(query, page = 1) {
  const baseUrl = 'https://www.andelemandele.lv/perles/';
  const params = new URLSearchParams({
    search: query,
    ...(page > 1 && { page }),
  });
  return `${baseUrl}?${params.toString()}`;
}
```

#### Function 2: `parsePriceValue(priceText)`
**Purpose:** Convert price strings to numeric values for sorting
```javascript
// Andele formats: "25 €", "25 €35 €" (sale + original)
// Extract the SALE price (first number)
export function parsePriceValue(priceText) {
  if (!priceText) return Infinity;
  
  // Match first number before €
  const match = priceText.match(/(\d+(?:[.,]\d+)?)\s*€/);
  if (!match) return Infinity;
  
  const value = parseFloat(match[1].replace(',', '.'));
  return isNaN(value) ? Infinity : value;
}
```

#### Function 3: `extractPricesOnly(query, maxResults, minPrice, maxPrice, sortBy)`
**Purpose:** Phase 1 - Fast price scanning across all pages
- Similar to SS.com's Phase 1 approach
- Scan multiple pages to extract URL + price pairs
- Apply price filters and sorting
- Return sorted array of {url, priceText}

#### Function 4: `fetchListingDetails(url)`
**Purpose:** Phase 2 - Enrich individual listing with full details
- Fetch individual listing page
- Extract: title, full description, images, condition, brand, size
- Return normalized data

#### Function 5: `search(query, options)`
**Purpose:** Main orchestrator function
- Execute two-phase search (like SS.com)
- Accept same options: maxResults, minPrice, maxPrice, sortBy
- Return standardized format: {items, totalResults, currentPage, totalPages}

### 2.3 Integration Points

#### Update API Orchestrator
**File:** `pages/api/search.js`

```javascript
// Add Andele adapter to ADAPTERS map
import * as andeleAdapter from "../../lib/adapters/andele.js";

const ADAPTERS = {
  ss: ssAdapter,
  andele: andeleAdapter,  // NEW
};
```

**No other changes needed** - existing API already supports:
- Multi-source selection: `?sources=ss,andele`
- Price filtering: `?minPrice=50&maxPrice=200`
- Sorting: `?sortBy=price-low`
- Result aggregation and merging

---

## Phase 3: Data Extraction & Normalization (4-5 hours)

### 3.1 Listing Card Extraction
**Challenge:** Identify correct HTML selectors or API response structure

**Key Data Points to Extract:**
1. **URL** - Link to individual listing
2. **Price** - Current price (handle sales/discounts)
3. **Title** - Listing name
4. **Images** - Thumbnail URLs (Andele uses CDN: `static*.andelemandele.lv`)
5. **Condition** - New/Used status
6. **Brand** - If available
7. **Size** - If applicable
8. **Location** - Seller location

**Normalization Function:**
```javascript
import { normalizeListing } from '../normalize.js';

// Ensure consistent data structure across sources
const normalized = normalizeListing({
  url: absoluteUrl,
  link: absoluteUrl,
  priceText: '25 €',
  title: 'iPhone 13 Pro',
  description: '...',
  images: ['https://static2.andelemandele.lv/...'],
  condition: 'Lietots, lieliskā stāvoklī',
  brand: 'Apple',
  source: 'andele',
}, 'andele', 'Andele Mandele');
```

### 3.2 Handle Andele-Specific Features

#### Price Formats:
- **Regular:** `25 €`
- **Sale:** `25 €35 €` (sale price, then original)
- **Discount percentage:** `-30%` badge
- **Strategy:** Always extract the FIRST price (sale price if on sale)

#### Condition Mapping:
```javascript
const CONDITION_MAP = {
  'Jauns': 'new',
  'Lietots, lieliskā stāvoklī': 'like-new',
  'Lietots, labā stāvoklī': 'good',
  'Lietots, iespējami trūkumi': 'fair',
  'Antīks/ Vintage': 'vintage',
};
```

#### Image CDN:
- Andele uses: `static2.andelemandele.lv`, `static4.andelemandele.lv`, etc.
- Multiple CDN subdomains (load balancing)
- Image paths: `/images/{hash}/large/{id}.jpg`
- Use `large` size for thumbnails (already optimized)

---

## Phase 4: Testing & Validation (2-3 hours)

### 4.1 Unit Tests

Create test file: `test-andele.js`

```javascript
import * as andele from './lib/adapters/andele.js';

async function test() {
  console.log('=== Testing Andele Mandele Adapter ===\n');
  
  // Test 1: Price parsing
  console.log('Test 1: Price Parsing');
  console.log('25 € →', andele.parsePriceValue('25 €'));
  console.log('25 €35 € →', andele.parsePriceValue('25 €35 €'));
  console.log('Free →', andele.parsePriceValue('Free'));
  
  // Test 2: Phase 1 - Price extraction
  console.log('\nTest 2: Phase 1 Price Extraction');
  const prices = await andele.extractPricesOnly('airpods', 100);
  console.log(`Found ${prices.length} listings`);
  prices.slice(0, 5).forEach((p, i) => {
    console.log(`${i+1}. ${p.priceText} - ${p.url.substring(0, 60)}...`);
  });
  
  // Test 3: Full search with enrichment
  console.log('\nTest 3: Full Search');
  const results = await andele.search('iphone', {
    maxResults: 50,
    resultsPerPage: 10,
    currentPage: 1,
    minPrice: 50,
    maxPrice: 500,
    sortBy: 'price-low',
  });
  
  console.log(`Total results: ${results.totalResults}`);
  console.log(`Pages: ${results.totalPages}`);
  results.items.slice(0, 3).forEach((item, i) => {
    console.log(`${i+1}. ${item.price} - ${item.title}`);
  });
}

test().catch(console.error);
```

### 4.2 Integration Testing

**Test Scenarios:**
1. **Single source (Andele only):**
   ```
   GET /api/search?q=airpods&sources=andele
   ```

2. **Multi-source (SS + Andele):**
   ```
   GET /api/search?q=airpods&sources=ss,andele
   ```

3. **Price filtering:**
   ```
   GET /api/search?q=iphone&sources=ss,andele&minPrice=100&maxPrice=500
   ```

4. **Sorting:**
   ```
   GET /api/search?q=guitar&sources=andele&sortBy=price-high
   ```

### 4.3 Expected Behavior

**Result Aggregation:**
- API merges results from both sources
- Sorts combined results by price
- Maintains source attribution (each listing shows `source: 'andele'` or `source: 'ss'`)

**Frontend Display:**
- Listings show source badge: "SS.lv" or "Andele Mandele"
- Price filtering applies to both sources
- Sorting works across both sources
- Cache keys include source selection

---

## Phase 5: Error Handling & Edge Cases (2 hours)

### 5.1 Common Failure Scenarios

#### Scenario 1: Site Unavailable
```javascript
try {
  const html = await fetchHtml(url);
} catch (error) {
  console.error(`[Andele] Failed to fetch: ${error.message}`);
  // Return empty results, don't crash entire search
  return { items: [], totalResults: 0, currentPage: 1, totalPages: 0 };
}
```

#### Scenario 2: No Results Found
```javascript
if (listings.length === 0) {
  console.log('[Andele] No results found for query:', query);
  return { items: [], totalResults: 0, currentPage: 1, totalPages: 0 };
}
```

#### Scenario 3: Rate Limiting
- Implement same batching strategy as SS.com
- 3 pages at a time with 150ms delays
- Respect site's robots.txt

#### Scenario 4: Invalid Prices
```javascript
// Handle missing/malformed prices gracefully
const priceValue = parsePriceValue(priceText);
if (priceValue === Infinity) {
  // Skip or place at end of results
  console.warn('[Andele] Invalid price:', priceText);
}
```

### 5.2 Graceful Degradation

**If Andele adapter fails:**
- SS.com results still work
- Error shown in API response: `errors: [{ source: 'andele', message: '...' }]`
- User sees partial results + error banner

**Frontend Error Display:**
Already implemented in `components/ResultsView.js`:
```javascript
{errors && errors.length > 0 && (
  <div className={styles.errorBanner}>
    <strong>⚠️ Some sources encountered errors</strong>
    <ul>
      {errors.map((err, idx) => (
        <li key={idx}>{err.source}: {err.message}</li>
      ))}
    </ul>
  </div>
)}
```

---

## Phase 6: Performance Optimization (1-2 hours)

### 6.1 Caching Strategy

**Cache Keys Include Source:**
```javascript
// Already implemented in pages/api/search.js
const cacheKey = `search_${query}_${sources.sort().join(',')}_page${page}_${minPrice}_${maxPrice}_${sortBy}`;

// Examples:
// - "search_airpods_ss_page1_any_any_price-low"
// - "search_airpods_andele_page1_any_any_price-low"
// - "search_airpods_andele,ss_page1_50_200_price-low" (both sources)
```

**Cache Benefits:**
- 5-minute TTL reduces server load
- Separate cache per source combination
- Price filters included in key

### 6.2 Parallel Execution

**Already Implemented:**
```javascript
// pages/api/search.js - executes adapters in parallel
const adapterPromises = sources.map(async (source) => {
  const adapter = ADAPTERS[source];
  const result = await adapter.search(query, options);
  return result;
});

await Promise.all(adapterPromises); // Run SS + Andele simultaneously
```

**Expected Performance:**
- **Single source:** ~2 seconds (Phase 1) + ~10 seconds (Phase 2) = ~12 seconds
- **Multi-source:** Same ~12 seconds (parallel execution)
- **Cached:** <10ms

### 6.3 Batched Enrichment

**Copy SS.com's batching strategy:**
```javascript
// Enrich 5 listings at a time to avoid overwhelming the server
const BATCH_SIZE = 5;
for (let i = 0; i < urls.length; i += BATCH_SIZE) {
  const batch = urls.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(
    batch.map(url => fetchListingDetails(url))
  );
  results.push(...batchResults);
  
  // Small delay between batches
  if (i + BATCH_SIZE < urls.length) {
    await sleep(100);
  }
}
```

---

## Phase 7: Multi-Source Features (1-2 hours)

### 7.1 Currency Normalization

**Current Situation:**
- Both SS.com and Andele Mandele use EUR (€)
- No conversion needed for Baltic region

**Future-Proofing:**
```javascript
// In normalize.js - add currency field
export function normalizeListing(raw, source, sourceName) {
  return {
    ...existing fields,
    priceValue: parsePriceValue(raw.priceText), // Numeric value
    currency: 'EUR', // For future multi-currency support
  };
}
```

### 7.2 Source Attribution

**Visual Indicators:**
Already implemented in `components/ListingCard.js`:
```javascript
<div className={styles.source}>
  {listing.sourceName || 'Unknown'}
</div>
```

**Badges Display:**
- "SS.lv" badge for SS.com listings
- "Andele Mandele" badge for Andele listings
- Different colors/styles possible

### 7.3 Deduplication (Future Enhancement)

**Problem:** Same item might appear on both platforms

**Solution (optional for v1):**
```javascript
// Compare: title similarity + price similarity + image similarity
function isDuplicate(listing1, listing2) {
  const titleSimilarity = levenshteinDistance(listing1.title, listing2.title);
  const priceDiff = Math.abs(listing1.priceValue - listing2.priceValue);
  
  if (titleSimilarity > 0.8 && priceDiff < 5) {
    return true; // Likely duplicate
  }
  return false;
}
```

**Note:** Not critical for v1, implement later if duplicates become an issue

---

## Implementation Timeline

### Week 1: Research & Foundation
- **Day 1-2:** Phase 1 (Research)
  - Network analysis
  - API reverse-engineering
  - Document findings
  
- **Day 3-4:** Phase 2 (Adapter Foundation)
  - Create andele.js file
  - Implement core functions
  - URL building and price parsing

### Week 2: Extraction & Testing
- **Day 1-2:** Phase 3 (Data Extraction)
  - Implement Phase 1 (price scan)
  - Implement Phase 2 (enrichment)
  - Handle Andele-specific features
  
- **Day 3:** Phase 4 (Testing)
  - Unit tests
  - Integration tests
  - Multi-source testing

- **Day 4:** Phase 5 (Error Handling)
  - Edge cases
  - Graceful degradation
  - Error messaging

### Week 3: Optimization & Launch
- **Day 1:** Phase 6 (Performance)
  - Caching validation
  - Parallel execution testing
  - Batching optimization
  
- **Day 2:** Phase 7 (Multi-Source Features)
  - Source attribution
  - Visual indicators
  - Documentation
  
- **Day 3:** Final testing and launch

**Total Estimated Time:** 15-20 hours of development work

---

## Technical Challenges & Solutions

### Challenge 1: JavaScript Rendering
**Issue:** Andele heavily uses JavaScript (React/modern framework)

**Solutions:**
- **Option A:** Find API endpoints (inspect Network tab)
- **Option B:** Use Puppeteer for browser automation
- **Option C:** Check if initial HTML has data embedded (JSON in `<script>` tags)

**Recommendation:** Start with Option A, fall back to Option B if needed

### Challenge 2: Rate Limiting
**Issue:** Scanning many pages might trigger rate limits

**Solutions:**
- Implement same batching as SS.com (3 pages at a time)
- Add delays between batches (150ms)
- Respect robots.txt
- Use proper User-Agent headers

### Challenge 3: Cloudflare Protection
**Issue:** Andele might use Cloudflare bot protection

**Solutions:**
- Use proper headers (User-Agent, Accept, Accept-Language)
- Implement cookie handling
- If blocked: use Puppeteer with real browser
- Implement retry logic with exponential backoff

### Challenge 4: Different Data Models
**Issue:** Andele focuses on fashion/lifestyle (sizes, brands, conditions)

**Solutions:**
- Use flexible normalization (optional fields)
- Map Andele's condition system to standard values
- Handle missing data gracefully
- Don't force SS.com's data model onto Andele

---

## Success Criteria

### Functional Requirements:
✅ User can select "Andele Mandele" from sidebar
✅ Search returns Andele results alongside SS results
✅ Price filtering works across both sources
✅ Sorting works across both sources
✅ Results show source badge (SS.lv or Andele Mandele)
✅ Performance: <15 seconds for combined search
✅ Cache works correctly per source combination

### Quality Requirements:
✅ Error handling: failures don't crash entire search
✅ Price parsing: handles sales, discounts, free items
✅ Data quality: titles, prices, images are accurate
✅ Deduplication: URLs are unique within each source
✅ Mobile responsive: works on all devices

### User Experience:
✅ Clear source attribution on each listing
✅ Error messages are user-friendly
✅ Loading states show progress
✅ Results are sorted correctly by price
✅ Filtering is intuitive and fast

---

## Future Enhancements (Post-v1)

### 1. Advanced Filtering
- Filter by brand (Andele has strong brand data)
- Filter by condition (New, Used, Vintage)
- Filter by size (clothing sizes)
- Filter by location (seller location)

### 2. Smart Deduplication
- Image similarity detection
- Title fuzzy matching
- Price correlation
- Show "Also on [other platform]" links

### 3. Price History
- Track price changes over time
- Show "Price dropped" badges
- Alert users to deals

### 4. Seller Ratings
- Integrate Andele's user ratings
- Show seller reputation
- Filter by seller quality

### 5. More Sources
- Expand to other Baltic marketplaces:
  - Vinted (Lithuania)
  - OLX (Poland)
  - Tori (Finland)
  - Okidoki (Estonia)

---

## Risk Assessment

### High Risk:
🔴 **JavaScript Rendering** - May require Puppeteer (slower, complex)
- Mitigation: Research API endpoints first

🔴 **Rate Limiting** - Aggressive scraping could get blocked
- Mitigation: Respect delays, batch requests, use caching

### Medium Risk:
🟡 **Site Changes** - Andele could update HTML structure
- Mitigation: Flexible selectors, error handling, monitoring

🟡 **Performance** - Two sources = 2x request time
- Mitigation: Parallel execution, aggressive caching

### Low Risk:
🟢 **Integration Issues** - Existing architecture supports multi-source
- Mitigation: API already designed for multiple adapters

🟢 **Currency Handling** - Both use EUR
- Mitigation: Simple, no conversion needed

---

## Documentation Requirements

### Developer Documentation:
1. **Adapter API Reference** - How to write new adapters
2. **Testing Guide** - How to test adapters
3. **Deployment Checklist** - Steps before launching new source

### User Documentation:
1. **FAQ** - "Why do some searches take longer?"
2. **Source Comparison** - "Differences between SS.lv and Andele Mandele"
3. **Tips** - "How to find best deals across platforms"

---

## Rollout Strategy

### Phase A: Internal Testing (Dev Environment)
1. Deploy Andele adapter to dev
2. Test with team
3. Verify all functionality
4. Fix any bugs

### Phase B: Limited Beta (Selected Users)
1. Enable Andele for 10% of users
2. Monitor error rates
3. Collect feedback
4. Adjust if needed

### Phase C: Full Launch
1. Enable Andele for all users
2. Monitor performance
3. Track usage analytics
4. Celebrate! 🎉

---

## Monitoring & Analytics

### Metrics to Track:
- **Adapter Performance:**
  - Average response time per source
  - Error rate per source
  - Cache hit rate per source
  
- **User Behavior:**
  - % of searches using Andele
  - % of searches using both sources
  - Most popular source combinations
  
- **Quality Metrics:**
  - Price extraction accuracy
  - Image loading success rate
  - User complaints/bug reports

### Alerts to Set Up:
- ⚠️ Andele adapter error rate > 10%
- ⚠️ Response time > 20 seconds
- ⚠️ Cache hit rate < 50%
- ⚠️ Price parsing failures > 5%

---

## Next Steps

1. ✅ **Review this plan** - Get feedback from stakeholders
2. 🔲 **Start Phase 1** - Begin technical research
3. 🔲 **Set up development branch** - `feature/andele-adapter`
4. 🔲 **Create test cases** - Write tests before implementation
5. 🔲 **Begin coding** - Start with Phase 2

**Ready to begin?** Let's start with Phase 1 research! 🚀
