# Andele Full List - Diagnostic & Fix Plan

## Current Situation (December 29, 2025) - ROOT CAUSE FOUND! ✅

### Problem Summary:
**We've been using the WRONG URL format entirely! Andele uses hash-based SPA routing, not path-based!**

### ACTUAL Browser URL Format (from user testing):
```
Page 1: https://www.andelemandele.lv/search/?search=airpods#order:price-asc
Page 2: https://www.andelemandele.lv/search/?search=airpods#order:price-asc/page:1
Page 3: https://www.andelemandele.lv/search/?search=airpods#order:price-asc/page:2

KEY DIFFERENCES:
1. Uses HASH (#) not path segment (/)
2. Uses COLONS (:) not equals (=) → order:price-asc NOT order=price-asc
3. Uses FORWARD SLASH before page → /page:1 NOT /page=1
4. It's a Single Page Application (SPA) - partial updates, not full reloads
```

### What We Were Using (WRONG):
```
Page 1: https://www.andelemandele.lv/search/?search=airpods&order=price-asc
Page 2: https://www.andelemandele.lv/search/?search=airpods&order=price-asc/page=1  ❌ WRONG!
Page 3: https://www.andelemandele.lv/search/?search=airpods&order=price-asc/page=2  ❌ WRONG!

Problems:
- Missing hash (#)
- Using & for order parameter (should be in hash)
- Using = instead of :
- Wrong format: /page=1 instead of /page:1
```

### Evidence from User Testing:
```
✅ Page content IS different between pages (pagination works on real site)
✅ Total count visible: "124 PĒRLES" (decreased from 127 earlier)
✅ Only partial page refresh (filters + listings, not header) = SPA behavior
✅ URL uses hash-based routing: #order:price-asc/page:1

Result of wrong URLs:
- Server returns same page 1 HTML for all requests
- JavaScript routing never triggers (we don't use hash format)
- 83% duplication: All 6 fetches get identical content
```

---

## Root Cause Analysis - SOLVED! ✅

### The REAL Problem: Wrong URL Format
**Andele is a Single Page Application (SPA) using hash-based client-side routing!**

❌ **What we thought:** Path-based server-side routing
```
/search/?search=airpods&order=price-asc/page=1
```

✅ **What it actually is:** Hash-based client-side routing
```
/search/?search=airpods#order:price-asc/page:1
                        ↑ Hash symbol!
                         ↑ Colons, not equals!
```

### Why Our Current Approach Fails:

1. **Server doesn't understand our URLs**
   - We send: `?search=airpods&order=price-asc/page=1`
   - Server sees: No hash fragment, no routing instructions
   - Server returns: Default page 1 HTML (every time!)

2. **Client-side JavaScript never runs**
   - JavaScript looks for hash: `window.location.hash`
   - Our URLs have no hash → JavaScript does nothing
   - DOM never updates to show page 2 content

3. **We fetch HTML too early**
   - Even if we used correct hash format
   - We grab HTML after 1.5s wait
   - But SPA needs time to:
     - Parse hash
     - Fetch data via AJAX
     - Render new content
     
### Correct Understanding:

**This is NOT bot detection!** This is just using the wrong URL format for an SPA.

**OLD HYPOTHESIS 1: Bot Detection / Anti-Scraping Measures** ❌ INCORRECT
```
Andele detects Puppeteer/automated browsing and serves ONLY page 1 regardless of URL.

Evidence:
- URLs are correct but content is identical
- Browser DevTools shows different content for /page=1 vs /page=2
- Our Puppeteer requests return same content

Indicators in our setup:
1. We're using Puppeteer (easily detected)
2. We're fetching pages in PARALLEL (unnatural behavior)
3. We're fetching 6 pages rapidly (suspicious pattern)
4. Each page is a NEW browser context (no cookies/session)
5. We abort image/font requests (abnormal browsing pattern)

How Andele might detect us:
- Headless browser detection (navigator.webdriver, CDP detection)
- Missing cookies/localStorage from page 1
- No mouse movements or scrolling
- Fetching too fast
- User-agent mismatches
- WebGL/Canvas fingerprinting
```

**HYPOTHESIS 2: Session/Cookie-Based Pagination**
```
Pagination requires session state from page 1.

Evidence needed:
- Check if page 1 sets cookies
- Check if pagination links use JavaScript navigation
- Check if there's CSRF tokens or session IDs

Test:
1. Fetch page 1 in browser context
2. Keep same page/context open
3. Navigate to page 2 using page.goto() with same context
```Implementation Steps - CLEAR PATH FORWARD! ✅

### User Testing Results (CONFIRMED):
1. ✅ **Pages ARE different** - pagination works correctly on real site
2. ✅ **URL format:** `#order:price-asc/page:1` (hash-based with colons)
3. ✅ **SPA behavior:** Partial page update (filters + listings only)
4. ✅ **Total count:** "124 PĒRLES" element visible in HTML
5. ✅ **No full reload:** Only content section updates = client-side routing
- Sample URLs are identical across all pages
- This would be a parsing issue, not a fetching issue

Unlikely but check:
- Are we accidentally caching HTML between requests?
- Is Cheerio reusing the same $ instance?
```

---

## Immediate Diagnostic Steps

### Step 1: Manual Browser Test (5 minutes)
**Goal**: Verify actual website behavior

```bash
# What to do:
1. Open https://www.andelemandele.lv/search/?search=airpods&order=price-asc
2. Count items on page 1 (should be 48)
3. Click "Page 2" or "Next"
4. Check URL in address bar - does it change to /page=1?
5. Compare first item on page 2 vs page 1 - is it different?
6. Open DevTools → Network tab
7. Click Page 2 again - is it a navigation or AJAX request?
8. Check Response in Network tab - is it full HTML or JSON?
```

**Questions to answer:**
- Does the URL actually change when clicking pagination?
- Is pagination URL-based or JavaScript/AJAX-based?
- Do you see different items on page 2?
- Are there any cookies set on page 1?

---

### Step 2: Test Sequential Navigation (30 minutes)
**Goal**: Navigate like a real user - keep browser context open

```javascript
// NEW APPROACH: Sequential navigation in single browser context
async function extractPricesSequential(query, sortBy = 'price-asc') {
  console.log('[Andele] Sequential approach: Navigating like a real user');
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Set up page like a real browser
    await page.setViewport({ width: 1280, height: 800 });
    aOLUTION: Use Correct Hash-Based URLs + Wait for SPA

**Step 1: Fix buildSearchUrl() - Use Hash Format (15 minutes)**

```javascript
/**
 * Build search URL with HASH-BASED routing (SPA format)
 * Andele uses client-side routing: #order:price-asc/page:1
 */
export function buildSearchUrl(query, page = 1, sortBy = 'price-asc') {
  // Base URL with ONLY search query parameter
  const baseUrl = `${BASE_URL}${SEARCH_PATH}?search=${encodeURIComponent(query)}`;
  
  // Build hash fragment with colon-based format
  // Format: #order:price-asc/page:1
  let hashFragment = `#order:${sortBy}`;
  
  // Add page to hash (page 1 has no /page:N part)
  if (page > 1) {
    hashFragment += `/page:${page - 1}`; // Still 0-indexed: page 2 = /page:1
  }
  
  return `${baseUrl}${hashFragment}`;
}

// Results:
// buildSearchUrl('airpods', 1) → ?search=airpods#order:price-asc
// buildSearchUrl('airpods', 2) → ?search=airpods#order:price-asc/page:1 ✅
// buildSearchUrl('airpods', 3) → ?search=airpods#order:price-asc/page:2 ✅
```

**Step 2: Wait for SPA to Load Content (30 minutes)**

Since it's an SPA, we need to:
1. Navigate to URL with hash
2. Wait for JavaScript to parse hash
3. Wait for AJAX request to complete
4. Wait for DOM to update with new content
5. THEN extract HTML

```javascript
async function fetchWithBrowser(url, options = {}) {
  const { waitFor = 2000, waitForSelector = null, retries = 2 } = options;
  
  // ... existing setup code ...
  
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  // NEW: Wait for SPA content to load
  // Look for the specific element that shows total count
  try {
    // Wait for catalog results to be populated
    await page.waitForSelector('article.product-card', { timeout: 5000 });
    
    // Additional wait for AJAX to complete (SPA needs this)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Optional: Wait for network to be idle (AJAX done)
    // await page.waitForNetworkIdle({ timeout: 5000 });
    
  } catch (error) {
    console.log('[Browser] No results or timeout waiting for content');
  }
  
  const html = await page.content();
  return html;
}
```

**Step 3: Extract Total Count from "124 PĒRLES" (15 minutes)**

```javascript
async function detectTotalPages(firstPageHtml) {
  const $ = cheerio.load(firstPageHtml);
  
  // User confirmed it's in HTML with text "124 PĒRLES"
  // Selector from inspector: figure element with data-role="catalog.count"
  const countElement = $('figure[data-role="catalog.count"]').text();
  
  // Also try these fallbacks:
  const countText = countElement || 
                   $('.catalog-count').text() || 
                   $('figure').filter((i, el) => $(el).text().includes('PĒRLES')).text();
  
  console.log(`[Andele] Count element text: "${countText}"`);
  
  // Extract number: "124 PĒRLES" → 124
  const match = countText.match(/(\d+)\s*(?:PĒRLES|pērles)/i);
  
  if (match) {
    const totalItems = parseInt(match[1]);
    const itemsPerPage = 48;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    console.log(`[Andele] Found ${totalItems} total items → ${totalPages} pages needed`);
    return totalPages;
  }
  
  console.warn('[Andele] Could not detect total count, defaulting to 1 page');
  return 1;
}
```
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function getBrowser() {
  browserInstance = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      // REMOVE these (too suspicious):
      // '--disable-images',
      // '--disable-javascript-harmony',
      
      // ADD these (more realistic):
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--lang=en-US,en',
    ],
  });
  
  // Override navigator.webdriver
  const context = await browserInstance.createIncognitoBrowserContext();
  const page = await context.newPage();
  
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });
  
  return browserInstance;
}
```

**Benefits:**
- Removes `navigator.webdriver` flag
- Adds realistic browser fingerprints
- Passes more anti-bot checks

---

### Step 4: Dynamic Page Detection (30 minutes)
**Goal**: Don't fetch 6 pages blindly - detect actual page count

```javascript
// Extract from page 1 HTML
async function detectTotalPages(firstPageHtml) {
  const $ = cheerio.load(firstPageHtml);
  
  // Find total count indicator (examples to check):
  // "125 PĒRLES" or "Showing 1-48 of 125" or similar
  const totalText = $('.results-count, .pagination-info, .total-results').text();
  const totalMatch = totalText.match(/(\d+)\s*(?:pērles|results|listings)/i);
  
  if (totalMatch) {
    const totalItems = parseInt(totalMatch[1]);
    const pages = Math.ceil(totalItems / 48);
    console.log(`[Andele] Detected ${totalItems} total items → ${pages} pages`);
    return pages;
  }
  
  // Fallback: Look for pagination links
  const pageLinks = $('.pagination a, .pager a').length;
  if (pageLinks > 0) {
    console.log(`[Andele] Detected ${pageLinks} page links`);
    return Math.min(pageLinks, 6);
  }
  
  // Fallback: Just page 1
  console.log('[Andele] Could not detect total pages, defaulting to 1');
  return 1;
}
```

**Usage:**
```javascript
// Fetch page 1 first
const page1Html = await fetchWithBrowser(url1);
const page1Results = parseListings(page1Html);

// Detect how many pages exist
const totalPages = await detectTotalPages(page1Html);

// Only fetch remaining pages if > 1
if (totalPages > 1) {
  for (let page = 2; page <= totalPages; page++) {
    // Fetch sequentially with delays
    await new Promise(resolve => setTimeout(resolve, 2000));
    const pageHtml = await fetchWithBrowser(buildSearchUrl(query, page, sortBy));
    const pageResults = parseListings(pageHtml);
    allResults.push(...pageResults);
  }
}
```

---

### Step 5: Click-Based Pagination (1 hour)
**Goal**: Click "Next" button instead of navigating to URL

```javascript
async function extractPricesWithClicks(query, sortBy = 'price-asc') {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0...');
    
   Implementation Decision - CLEAR PATH! ✅

```
✅ CONFIRMED: Hash-based SPA routing
   #order:price-asc/page:1

         ↓

┌─────────────────────────────┐
│ 1. Fix URL format           │
│    Use hash + colons        │
│    #order:price-asc/page:1  │
└─────────────┬───────────────┘
              │
              ↓
┌─────────────────────────────┐
│ 2. Wait for SPA to load     │
│    - waitForSelector        │
│    - Extra 2s delay         │
│    - Network idle           │
└─────────────┬───────────────┘
              │
              ↓
┌─────────────────────────────┐
│ 3. Extract total from HTML  │
│    "124 PĒRLES" element     │
│    Calculate pages needed   │
└─────────────┬───────────────┘
              │
              ↓
┌─────────────────────────────┐
│ 4. Fetch only needed pages  │
│    Sequential + delays      │
│    Same browser context     │
└─────────────────────────────┘
```

**No bot detection workarounds needed!** Just correct URL format + SPA handling. return allResults;
    
  } finally {
    await page.close();
  }
}
```

---

## Decision Tree

```
┌─────────────────────────────────────┐
│ Is pagination URL-based or AJAX?    │
└─────────────┬───────────────────────┘
              │
      ┌───────┴────────┐
      │                │
  URL-based        AJAX-based
      │                │
      ▼                ▼
┌─────────────┐  ┌──────────────┐
│ Try Step 2: │  │ Try Step 5:  │
│ Sequential  │  │ Click-based  │
│ navigation  │  │ pagination   │
└──────┬──────┘  └──────┬───────┘
       │                │
       │                │
       ▼                ▼
  ┌─────────────────────────┐
  │ Still getting identical │
  │ pages?                  │
  └───────┬─────────────────┘
          │
          ▼
    ┌──────────────┐
    │ Try Step 3:  │
    │ Stealth mode │
    └──────┬───────┘
           │
           ▼
    ┌─────────────────┐
    │ Add Step 4:     │
    │ Dynamic pages   │
    └─────────────────┘
```

---
User Testing Results - ALL QUESTIONS ANSWERED! ✅

1. **URL Format Check** ✅
   - EXACT URL: `https://www.andelemandele.lv/search/?search=airpods#order:price-asc/page:1`
   - Uses HASH (#) not path (/)
   - Uses COLONS (:) not equals (=)
   - Format: `#order:price-asc/page:1`

2. **Page Content Check** ✅
   - Pages ARE different between page 1 and page 2
   - Pagination works correctly on the actual website

3. **Pagination Type** ✅
   - **Partial page update** - only filters + listings reload
   - Header stays the same (no full reload)
   - This confirms: **Single Page Application (SPA)**

4. **Total Count** ✅
   - Shows "124 PĒRLES" (decreased from 127)
   - Location: Top of results, highlighted in screenshot
   - Element: `<figure data-role="catalog.count">124 PĒRLES</figure>`

5. **Hash-Based Routing** ✅
   - URL uses hash fragment for routing
   - JavaScript handles pagination client-side
   - No full page reloads, just DOM updatesage 1?
   - Do they change when navigating to page 2?

---

## Recommended Implementation Order

### Phase 1: Diagnostic (1-2 hours) - READY TO CODE! ✅

### Phase 1: Fix URL Format (30 minutes) ⚠️ DO THIS NOW
1. ✅ User questions answered - we know the exact format
2. 🔧 Update `buildSearchUrl()` to use hash format: `#order:price-asc/page:1`
3. 🔧 Use colons (:) not equals (=)
4. 🔧 Keep 0-indexed pages: page 2 = `/page:1`
5. ✅ Test with "airpods" search

**Files to modify:**
- `lib/adapters/andele.js` - buildSearchUrl() function

### Phase 2: Wait for SPA Content (30 minutes)
1. 🔧 Add `waitForSelector('article.product-card')` in fetchWithBrowser
2. 🔧 Increase wait time to 2-3 seconds for AJAX
3. 🔧 Optional: Wait for network idle after navigation
4. ✅ Verify different content on each page

**Files to modify:**
- `lib/browser.js` - fetchWithBrowser() function

### Phase 3: Dynamic Page Detection (30 minutes)
1. 🔧 Extract total count from `"124 PĒRLES"` element
2. 🔧 Calculate actual pages: `Math.ceil(124 / 48) = 3 pages`
3. 🔧 Only fetch needed pages (not hardcoded 6)
4. ✅ Test with different searches

**Files to modify:**
- `lib/adapters/andele.js` - extractPricesOnly() function

### Phase 4: Sequential Fetching (15 minutes)
1. 🔧 Keep same browser context between pages
2. 🔧 Add 2-3s delay between page requests
3. 🔧 Navigate sequentially, not in parallel
4. ✅ Verify < 5% duplication rate

### Phase 5: Optimization (15 minutes)
1. 🔧 Remove image extraction from Phase 1 (not needed)
2. 🔧 Better error handling for 0 results
3. ✅ Final testing

**Total estimated time: 2-2.5 hours**

## Alternative Approaches (If All Else Fails)

### Option 1: Use Andele's API (if available)
- Check if Andele has a public API
- Check Network tab for API calls
- Reverse engineer API endpoints

### Option 2: Residential Proxy
- Use proxy service (Bright Data, Oxylabs)
- Route Puppeteer through residential IPs
- Avoid detection entirely

### Option 3: Accept Limitations
- Only fetch page 1 (48 items)
- Add disclaimer: "Andele shows limited results"
- Focus on SS.com which works

### Option 4: Hybrid Approach
- Use Puppeteer with visible browser (`headless: false`)
- Add CAPTCHA solving service
- More expensive but more reliable

---

## Technical Debt to Address

1. **Hardcoded maxPages = 6**: Should be dynamic
2. **Parallel fetching**: Too bot-like, switch to sequential
3. **Image blocking**: Makes us detectable, remove this
4. **No delay between pages**: Add 2-3s delays
5. **Fresh context each time**: Reuse context with cookies

---

## Success Criteria

**Phase 1 - Diagnostic Complete:**
- ✅ Understand why pages are identical
- ✅ Know if it's bot detection or URL issue
- ✅ Have work - READY TO IMPLEMENT! 🚀

**ALL DIAGNOSTIC QUESTIONS ANSWERED** ✅

Now implementing:
1. 🔧 Fix buildSearchUrl() - hash format with colons
2. 🔧 Update fetchWithBrowser() - wait for SPA content
3. 🔧 Add dynamic page detection - extract from "124 PĒRLES"
4. 🔧 Sequential fetching with delays
5. ✅ Test and verify 124 unique items (not 48)

**No more blockers!** Clear understanding of the issue and solution.

---

## Additional Questions?

**Do you want me to proceed with implementation now?**

Or do you have any other questions:
- Should I implement all phases at once?
- Start with just Phase 1 (URL fix) and test first?
- Any specific error handling you want?
- Performance requirements (max wait time, etc.)?
- ✅ Error handling for 0 results
- ✅ Reasonable performance (< 20s for 3 pages)

---

## Next Steps

**IMMEDIATE: Please answer the diagnostic questions above.**

Once I have those answers, I can:
1. Implement the correct solution
2. Test it thoroughly
3. Fix the deduplication issue
4. Get all 125 items showing correctly

**Current blocker**: Need to understand why identical pages are returned despite correct URLs.
