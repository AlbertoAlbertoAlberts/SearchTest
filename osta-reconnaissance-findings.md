# Osta.ee Reconnaissance Findings

**Date:** 29 December 2025  
**Status:** Completed - Step 1 of implementation  
**Site:** https://www.osta.ee (Estonia)

---

## Key Finding: Cloudflare Protection

### What we discovered

Osta.ee uses **Cloudflare's bot protection** (managed challenge) which presents a JavaScript challenge before allowing access to any page. This is confirmed by:

1. **Homepage fetch:** Returns Cloudflare challenge page with title "Just a moment..."
2. **Search results fetch:** Same Cloudflare challenge
3. **robots.txt fetch:** Same Cloudflare challenge

### Challenge page characteristics

```html
<title>Just a moment...</title>
<noscript>
  <div class="h2">
    <span id="challenge-error-text">Enable JavaScript and cookies to continue</span>
  </div>
</noscript>
```

The page includes:
- Meta tag: `<meta name="robots" content="noindex,nofollow">`
- JavaScript challenge script from `/cdn-cgi/challenge-platform/h/g/orchestrate/chl_page/v1`
- Requires cookie and JavaScript execution to proceed

---

## Technical implications

### Rendering method: **JavaScript-rendered (forced)**

**Verdict:** We MUST use Puppeteer for Osta.ee

**Reason:** Cloudflare challenge cannot be bypassed with simple HTTP requests. The challenge:
1. Executes JavaScript to validate the browser
2. Sets authentication cookies
3. Redirects to the actual requested page

This means:
- ❌ Simple `fetch()` or `cheerio` parsing won't work
- ❌ `fetchHtml()` helper will only get the challenge page
- ✅ `Puppeteer` (via `fetchWithBrowser()`) is **required**
- ✅ Must wait for challenge to complete before parsing content

### Expected performance

Based on Andele adapter (also uses Puppeteer):
- **Phase 1 (scanPrices):** ~2-4 seconds per page (acceptable)
- **Phase 2 (enrichDetails):** Can use simple fetch after initial browser session establishes cookies (potential optimization)
- **First request:** Slower due to browser launch + challenge solving
- **Subsequent requests:** Faster if browser instance is reused

---

## URL patterns (to be verified with Puppeteer)

Once we can access the site with Puppeteer, we need to verify:

### Search URL structure

**Expected patterns:**
```
https://www.osta.ee/search?q={query}
https://www.osta.ee/otsing?q={query}
```

### Pagination

**Likely patterns:**
```
https://www.osta.ee/search?q={query}&page=2
https://www.osta.ee/search?q={query}&offset=20
```

### Sorting

**Possible patterns:**
```
https://www.osta.ee/search?q={query}&sort=price_asc
https://www.osta.ee/search?q={query}&sort=price_desc
https://www.osta.ee/search?q={query}&sort=date
```

### Price filtering

**Possible patterns:**
```
https://www.osta.ee/search?q={query}&price_min=50&price_max=500
https://www.osta.ee/search?q={query}&minPrice=50&maxPrice=500
```

**Action required:** These patterns must be confirmed during Step 3 (scanPrices implementation) by:
1. Loading the site in Puppeteer
2. Performing a search
3. Inspecting the URL after search
4. Testing pagination/sorting controls
5. Examining URL changes when filters are applied

---

## Architecture decision

### Adapter approach: **Puppeteer-based (like Andele)**

**Implementation strategy:**

1. **Use existing `fetchWithBrowser()` from `lib/browser.js`**
   - This already handles Puppeteer browser management
   - Reuses browser instances for performance
   - Handles Cloudflare challenges automatically

2. **Phase 1 (scanPrices):**
   - Use Puppeteer to load search result pages
   - Wait for results to render
   - Parse HTML with cheerio after page loads
   - Extract URLs, prices, thumbnails

3. **Phase 2 (enrichDetails):**
   - **Option A:** Use Puppeteer for detail pages too (safest, consistent)
   - **Option B:** Try simple `fetch()` if cookies persist (optimization for later)
   - Start with Option A for reliability

4. **Selector strategy:**
   - Use browser DevTools to inspect actual rendered HTML
   - Document selectors in code comments
   - Provide multiple fallbacks per field

---

## Comparison with existing adapters

| **Aspect**              | **SS.lv**                | **Andele**                     | **Osta.ee (planned)**          |
|-------------------------|--------------------------|--------------------------------|--------------------------------|
| **Rendering**           | Server-rendered          | JavaScript SPA                 | JS-rendered (Cloudflare)       |
| **Tool required**       | `cheerio` + `fetchHtml`  | `Puppeteer` + `fetchWithBrowser` | `Puppeteer` + `fetchWithBrowser` |
| **Speed**               | Fast (~100-200ms/page)   | Slower (~2-4s/page)            | Slower (~2-4s/page)            |
| **Protection**          | None                     | None                           | Cloudflare challenge           |
| **Reliability**         | High (stable HTML)       | Medium (SPA changes)           | Medium (Cloudflare + SPA)      |

**Conclusion:** Osta.ee adapter will be most similar to Andele adapter in terms of implementation approach.

---

## Risks and mitigations

### Risk 1: Cloudflare protection too aggressive

**Risk level:** Medium  
**Impact:** High (adapter might not work at all)

**Mitigation:**
- Use realistic browser fingerprints (already handled by Puppeteer)
- Add random delays between requests (300-500ms)
- Respect rate limits (don't hammer the site)
- Consider rotating user agents (if needed)
- Monitor for IP blocking (rare for reasonable usage)

### Risk 2: Slower performance than other adapters

**Risk level:** High  
**Impact:** Medium (acceptable tradeoff)

**Mitigation:**
- Accept slower speed as necessary tradeoff for JS-rendered site
- Optimize by reusing browser instances (already done in `browser.js`)
- Consider caching results more aggressively (5-10 min TTL)
- Prefetch next page while user views current page (future optimization)

### Risk 3: Cloudflare challenge changes

**Risk level:** Low  
**Impact:** High (would break adapter)

**Mitigation:**
- Puppeteer automatically handles most challenges
- Use latest Puppeteer version
- Add error detection for challenge failures
- Log errors clearly so we know when challenge changes
- Have fallback error message: "Osta.ee temporarily unavailable"

### Risk 4: Site structure differs from expectations

**Risk level:** Medium  
**Impact:** Low (just need to adjust selectors)

**Mitigation:**
- Inspect actual HTML structure in Step 3
- Document all selectors with screenshots
- Provide multiple fallback selectors
- Test with real queries immediately

---

## Next steps (from plan)

### ✅ Step 1: Reconnaissance — **COMPLETED**

**Findings:**
- Site uses Cloudflare protection
- Must use Puppeteer
- Performance will be slower but acceptable
- URL patterns must be verified in Step 3

### ⏭ Step 2: Create adapter skeleton (15 minutes)

**Tasks:**
- Create `lib/adapters/osta.js`
- Import `fetchWithBrowser` from `lib/browser.js`
- Import `cheerio` for HTML parsing after page loads
- Import helper functions from `lib/textHelpers.js` and `lib/normalize.js`
- Create function stubs: `scanPrices()`, `enrichDetails()`
- Add adapter config with metadata

### ⏭ Step 3: Implement scanPrices (1-2 hours)

**Critical tasks:**
1. **First priority:** Load https://www.osta.ee with Puppeteer and verify it works
2. **Second priority:** Perform test search and document actual URL structure
3. **Third priority:** Inspect rendered HTML for listing selectors
4. **Then:** Implement price scanning loop with pagination

**Testing approach:**
- Start with loading homepage
- Verify Cloudflare challenge is solved
- Test search functionality
- Document actual selectors found
- Iterate on selector reliability

---

## Code preparation notes

### Imports needed

```javascript
import * as cheerio from "cheerio";
import { fetchWithBrowser } from "../browser.js";
import { normalizeListing } from "../normalize.js";
import { parsePriceValue, getDescriptionPreview } from "../textHelpers.js";
```

### Puppeteer usage pattern (from Andele adapter)

```javascript
const html = await fetchWithBrowser(url, {
  waitFor: 'selector-for-results', // Wait for results to load
  timeout: 15000, // 15 second timeout
});

const $ = cheerio.load(html);
// Parse with cheerio...
```

### Delay helper (for rate limiting)

```javascript
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

---

## Open questions (to answer in Step 3)

1. **What is the exact search URL structure?**
   - Path: `/search`, `/otsing`, or something else?
   - Parameter: `q`, `query`, or something else?

2. **How does pagination work?**
   - Parameter: `page`, `offset`, or path-based?
   - Zero-indexed or one-indexed?

3. **Does the site support URL-based sorting?**
   - If yes: what are the parameter names and values?
   - If no: we'll sort locally (acceptable)

4. **Does the site support URL-based price filtering?**
   - If yes: what are the parameter names?
   - If no: we'll filter locally (acceptable)

5. **What selectors do we need for search results?**
   - Listing container selector
   - Individual listing item selector
   - URL/link selector
   - Price text selector
   - Thumbnail image selector

6. **What selectors do we need for detail pages?**
   - Title selector
   - Description selector
   - Price selector
   - Image selector
   - Condition selector (if available)
   - Location selector
   - Posted date selector (if available)

---

## Success criteria for Step 1 ✅

- [x] Determined rendering method (JavaScript-rendered)
- [x] Identified required tools (Puppeteer + fetchWithBrowser)
- [x] Documented Cloudflare protection
- [x] Compared with existing adapters
- [x] Identified risks and mitigations
- [x] Prepared code patterns to use
- [x] Listed open questions for Step 3
- [x] Ready to proceed to Step 2 (skeleton creation)

---

## UPDATE: Step 3 Implementation Findings (29 Dec 2025)

### Critical Discovery

After implementing `scanPrices` and testing with Puppeteer, we discovered:

**Problem:** All tested URL patterns return 404 errors, including:
- `https://www.osta.ee/search?q=iphone`
- `https://www.osta.ee/otsi?q=iphone`
- `https://www.osta.ee/otsing?q=iphone` 
- `/search/iphone`, `/reklaamid?q=iphone`, etc.

**Status:** Osta.ee appears to be either:
1. **Fully blocking automated access** (even Puppeteer with realistic browser fingerprints)
2. **Restructured/offline** - all pages return the same 404 page
3. **Using a different URL structure** we haven't discovered yet

###Next Steps (Proposed)

Given these findings, we have three options:

**Option A: Skip Osta.ee for now** ✅ **RECOMMENDED**
- Move to a different Estonian marketplace (e.g., Okidoki.ee, Soov.ee)
- Come back to Osta.ee after successfully implementing other sources
- Reason: Don't waste time on a source that may not be scrapable

**Option B: Try alternative approaches**
- Check if Osta.ee has a public API
- Try different anti-detection techniques (residential proxies, etc.)
- Contact Osta.ee to ask about their robots.txt policy
- Time investment: High, success probability: Low

**Option C: Keep the skeleton, mark as "not implemented"**
- Document in the adapter that Osta.ee blocks automated access
- Return empty results with a clear log message
- Users won't see Osta.ee as an option in the UI

### Recommendation

**Skip to next Estonian marketplace:** Move implementation efforts to **Okidoki.ee** or **Soov.ee** instead, as they may have different protection levels and be more accessible for scraping.

The Osta.ee adapter skeleton can remain in the codebase as a placeholder for future attempts.

---

**Status:** Step 3 blocked due to access restrictions. Recommend moving to alternative Estonian marketplace.

**Time spent:** ~30 minutes (reconnaissance complete, implementation blocked)  
**Estimated time to resolve:** Unknown (may require manual browser inspection or alternative access methods)
