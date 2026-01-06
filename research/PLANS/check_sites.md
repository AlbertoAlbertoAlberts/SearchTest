# Marketplace Accessibility Check Plan

**Date:** 29 December 2025  
**Purpose:** Verify if candidate marketplaces are accessible for automated scraping before writing implementation code

---

## Context & Lessons Learned

**Why we're doing this:**
- Osta.ee: All URLs returned 404 errors - site inaccessible
- Okidoki.ee: Cloudflare Turnstile blocks all automation - cannot bypass

**Key insight:** Test accessibility FIRST before writing any implementation code. A 5-minute test saves 2-3 hours of wasted development.

---

## Sites to Check (Priority Order)

1. **Soov.ee** (Estonia) - https://www.soov.ee
2. **Skelbiu.lt** (Lithuania) - https://www.skelbiu.lt
3. **Vinted.lt** (Lithuania) - https://www.vinted.lt
4. **Tori.fi** (Finland) - https://www.tori.fi

---

## Testing Methodology (Standard for All Sites)

For each site, we will execute the following tests in order:

### Test 1: Basic HTTP Access
**Tool:** `curl` with headers  
**Purpose:** Check if simple HTTP requests work (server-rendered sites)  
**Success criteria:** 
- HTTP 200 response
- No Cloudflare challenge page
- No 404 errors
- HTML contains actual content

### Test 2: Cloudflare Detection
**Tool:** Inspect HTTP response headers and body  
**Purpose:** Identify protection mechanisms  
**Look for:**
- HTTP 403 status
- Headers: `cf-mitigated`, `cf-ray`
- Body: "Just a moment...", "Verify you are human", `cf-chl-widget`
- Cloudflare types:
  - ✅ None (best case)
  - ⚠️ Managed challenge (may work with Puppeteer)
  - ❌ Turnstile (blocks automation)
  - ❌ reCAPTCHA (blocks automation)

### Test 3: Search Functionality Test
**Tool:** Try multiple URL patterns  
**Purpose:** Find working search URL structure  
**Patterns to test:**
- `/search?q=iphone`
- `/otsi?q=iphone` (Estonian)
- `/paieska?q=iphone` (Lithuanian)
- `/haku?q=iphone` (Finnish)
- `/kuulutused?q=iphone`
- `/skelbimai?q=iphone`

### Test 4: Puppeteer Bypass (If Needed)
**Tool:** Puppeteer with realistic browser fingerprint  
**Purpose:** Test if Cloudflare can be bypassed with headless browser  
**Success criteria:**
- Page loads after challenge
- Real content visible (not challenge page)
- Search results extractable

### Test 5: Content Extraction Preview
**Tool:** Inspect HTML structure  
**Purpose:** Quick check that listing data is present  
**Look for:**
- Listing containers (article, div with class)
- Price indicators (€, EUR, price text)
- Title/description elements
- Image URLs
- Pagination links

---

## Phase 1: Soov.ee (Estonia)

### Background
- Country: Estonia
- Language: Estonian
- Known info: Listed in SPEC.md as planned source
- Priority: HIGH (after Osta.ee and Okidoki.ee failed)

### Test Plan

**Step 1.1: Basic HTTP test**
```bash
curl -s -I https://www.soov.ee/
curl -s https://www.soov.ee/ | head -200
```
**Expected outcomes:**
- ✅ Best case: HTTP 200, no Cloudflare
- ⚠️ Acceptable: HTTP 200 with manageable Cloudflare
- ❌ Blocker: HTTP 403, Turnstile, or 404

**Step 1.2: Search URL discovery**
Test patterns:
- `https://www.soov.ee/search?q=iphone`
- `https://www.soov.ee/otsi?q=iphone`
- `https://www.soov.ee/otsing?q=iphone`
- `https://www.soov.ee/kuulutused?q=iphone`
- `https://www.soov.ee/?q=iphone`

**Step 1.3: Content verification**
- If HTTP works: Use `curl` to fetch search page
- If Cloudflare: Create Puppeteer test script
- Save HTML sample for inspection
- Grep for Estonian keywords: "hind", "kuulutus", "€"

**Step 1.4: Cloudflare bypass test (if needed)**
- Launch Puppeteer with realistic headers
- Wait for page load + 3-5 seconds
- Check if challenge resolves automatically
- Document bypass success/failure

### Decision Criteria
- ✅ **PROCEED:** HTTP 200 + content visible + no Turnstile → Create full implementation plan
- ⚠️ **CONDITIONAL:** Manageable Cloudflare → Create plan with Puppeteer requirement
- ❌ **SKIP:** Turnstile/reCAPTCHA or 404 → Move to Phase 2 (Skelbiu.lt)

### Time Estimate
- 10-15 minutes (quick test)
- 20-25 minutes (with Puppeteer test if needed)

---

## Phase 2: Skelbiu.lt (Lithuania)

### Background
- Country: Lithuania
- Language: Lithuanian
- Known info: Listed in SPEC.md as planned source
- Priority: MEDIUM (Baltic region alternative)

### Test Plan

**Step 2.1: Basic HTTP test**
```bash
curl -s -I https://www.skelbiu.lt/
curl -s https://www.skelbiu.lt/ | head -200
```

**Step 2.2: Search URL discovery**
Test patterns:
- `https://www.skelbiu.lt/search?q=iphone`
- `https://www.skelbiu.lt/paieska?q=iphone` (Lithuanian: search)
- `https://www.skelbiu.lt/skelbimai?q=iphone` (Lithuanian: ads)
- `https://www.skelbiu.lt/?search=iphone`

**Step 2.3: Content verification**
- Check for Lithuanian keywords: "kaina" (price), "skelbimas" (ad), "€"
- Verify listings are present
- Inspect HTML structure

**Step 2.4: Cloudflare bypass test (if needed)**
Same methodology as Phase 1

### Decision Criteria
Same as Phase 1:
- ✅ PROCEED if accessible
- ⚠️ CONDITIONAL if manageable Cloudflare
- ❌ SKIP if Turnstile/404 → Move to Phase 3 (Vinted.lt)

### Time Estimate
10-20 minutes

---

## Phase 3: Vinted.lt (Lithuania)

### Background
- Country: Lithuania
- Language: Lithuanian/English
- Type: **Fashion marketplace** (clothing, shoes, accessories)
- Known info: Listed in SPEC.md as planned source
- Special note: May have different structure than general classifieds

### Test Plan

**Step 3.1: Basic HTTP test**
```bash
curl -s -I https://www.vinted.lt/
curl -s https://www.vinted.lt/ | head -200
```

**Step 3.2: Search URL discovery**
Vinted likely uses modern web app structure:
- `https://www.vinted.lt/search?q=iphone`
- `https://www.vinted.lt/catalog?search_text=iphone`
- `https://www.vinted.lt/items?search=iphone`

**Step 3.3: API detection**
Vinted may use a REST/GraphQL API:
- Check Network tab for API calls
- Look for JSON responses with item data
- Document API endpoints if available (easier than scraping)

**Step 3.4: Content verification**
- Check if server-rendered or JS-rendered (likely JS)
- Look for item cards, prices, images
- Verify search results are present

**Step 3.5: Protection check**
Vinted is a large international platform and may have:
- Rate limiting
- API authentication requirements
- Anti-bot measures
- reCAPTCHA on search

### Decision Criteria
- ✅ **PROCEED:** Accessible + has public search (even if API-based)
- ⚠️ **CONDITIONAL:** Requires authentication → May need different approach
- ❌ **SKIP:** Requires login, Turnstile, or API key → Move to Phase 4 (Tori.fi)

### Special Considerations
- Vinted is fashion-focused, not general marketplace
- May be less relevant for electronics/general searches
- If accessible, still consider deprioritizing vs general marketplaces

### Time Estimate
15-25 minutes (API detection adds complexity)

---

## Phase 4: Tori.fi (Finland)

### Background
- Country: Finland
- Language: Finnish/Swedish
- Known info: Listed in SPEC.md as planned source
- Priority: HIGH (Finland is stable market, Tori is major player)
- Note: Finland is geographically close to Estonia/Latvia

### Test Plan

**Step 4.1: Basic HTTP test**
```bash
curl -s -I https://www.tori.fi/
curl -s https://www.tori.fi/ | head -200
```

**Step 4.2: Search URL discovery**
Test patterns:
- `https://www.tori.fi/search?q=iphone`
- `https://www.tori.fi/haku?q=iphone` (Finnish: search)
- `https://www.tori.fi/ilmoitukset?q=iphone` (Finnish: ads)
- `https://www.tori.fi/koko-suomi?q=iphone` (Finnish: whole Finland)

**Step 4.3: Content verification**
- Check for Finnish keywords: "hinta" (price), "ilmoitus" (ad), "€"
- Verify listings structure
- Check pagination

**Step 4.4: Cloudflare bypass test (if needed)**
Same methodology as previous phases

### Decision Criteria
- ✅ **PROCEED:** Accessible → Create full implementation plan
- ⚠️ **CONDITIONAL:** Manageable Cloudflare → Puppeteer-based plan
- ❌ **SKIP:** Turnstile/404 → Re-evaluate marketplace selection strategy

### Special Considerations
- Tori.fi is considered a high-quality source
- If Tori.fi fails, we may need to reconsider our approach:
  - Look for sites with public APIs
  - Consider RSS feeds
  - Explore data partnerships

### Time Estimate
10-20 minutes

---

## Test Execution Strategy

### Sequential Testing (Recommended)
Test sites one at a time in priority order:
1. Soov.ee (Estonia - closest region to existing sources)
2. Skelbiu.lt (Lithuania - Baltic expansion)
3. Tori.fi (Finland - high quality source)
4. Vinted.lt (Lithuania - specialized, test last)

**Stop conditions:**
- If 2 sites are accessible → Proceed with those two
- If 1 site is accessible → Proceed with that one
- If 0 sites are accessible → Re-evaluate strategy

### Parallel Testing (Alternative)
If time-constrained, test all 4 sites in parallel:
- Faster to get overall picture
- But may waste time on low-priority sites
- Use only if we need complete assessment quickly

---

## Test Script Template

For each site, create a test script: `test-{site}-access.js`

```javascript
/**
 * {SiteName} Accessibility Test
 * Phase {N} of marketplace accessibility check
 */

import { fetchWithBrowser } from './lib/browser.js';

async function test{SiteName}() {
  console.log('[{SiteName}] Starting accessibility test...\n');

  // Test 1: Homepage
  console.log('Test 1: Homepage accessibility');
  try {
    const homeHtml = await fetchWithBrowser('{homepage-url}');
    console.log(`✓ Homepage loaded: ${homeHtml.length} bytes`);
    
    if (homeHtml.includes('Just a moment') || homeHtml.includes('cf-chl-widget')) {
      console.log('⚠️  Cloudflare challenge detected');
      // Continue to see if it resolves...
    }
    
    if (homeHtml.includes('kaduma') || homeHtml.includes('404')) {
      console.log('❌ Homepage returns 404');
      return;
    }
  } catch (error) {
    console.error('❌ Homepage failed:', error.message);
    return;
  }

  // Test 2: Search URL patterns
  console.log('\nTest 2: Search URL discovery');
  const patterns = [
    '{url-pattern-1}',
    '{url-pattern-2}',
    '{url-pattern-3}',
  ];

  for (const url of patterns) {
    console.log(`\nTesting: ${url}`);
    try {
      const html = await fetchWithBrowser(url);
      console.log(`  Size: ${html.length} bytes`);
      
      // Check for content indicators
      const hasContent = html.includes('{keyword-1}') || 
                        html.includes('{keyword-2}') ||
                        html.includes('€');
      
      if (hasContent) {
        console.log('  ✓✓✓ WORKING PATTERN - Contains listings!');
        
        // Save for inspection
        const fs = await import('fs');
        fs.writeFileSync('{site}-search-sample.html', html);
        console.log('  ✓ HTML saved');
        break;
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n[{SiteName}] Test complete');
}

test{SiteName}();
```

---

## Documentation Requirements

For each tested site, create: `{site}-findings.md`

**Document:**
- ✅/❌ Accessibility status
- Protection type (None / Cloudflare / Turnstile / Other)
- Working URL patterns (if found)
- Sample HTML saved (yes/no)
- Listing structure notes (if visible)
- Recommendation: PROCEED / SKIP / CONDITIONAL
- Estimated adapter complexity (Easy / Medium / Hard)

---

## Success Metrics

### Ideal Outcome
- **2-3 sites accessible** without Turnstile → Create implementation plans
- **1-2 require Puppeteer** (manageable Cloudflare) → Accept slower performance
- **Clear winner identified** → Prioritize that site for implementation

### Acceptable Outcome
- **1 site accessible** → Focus on single-source expansion
- **All sites require Puppeteer** → Accept performance tradeoff
- **Known blockers documented** → Avoid wasting time in future

### Worst Case
- **0 sites accessible** → Need strategy change:
  - Look for sites with public APIs
  - Consider RSS feeds
  - Explore data aggregator services
  - Re-evaluate country/region selection

---

## Timeline

**Total estimated time:** 1-2 hours for all 4 sites

| Phase | Site | Time |
|-------|------|------|
| 1 | Soov.ee | 15-20 min |
| 2 | Skelbiu.lt | 10-20 min |
| 3 | Vinted.lt | 15-25 min |
| 4 | Tori.fi | 10-20 min |
| **Total** | | **50-85 min** |

**Optimization:** Stop early if we find 2 good sources.

---

## Next Actions (After Testing Complete)

### If ≥2 sites accessible:
1. Update SPEC.md with confirmed available sources
2. Create detailed implementation plans for top 2
3. Implement adapters sequentially
4. Test integration with orchestrator

### If 1 site accessible:
1. Create implementation plan for that site
2. Continue testing other regions (Poland, other countries)
3. Consider API-based sources as alternatives

### If 0 sites accessible:
1. Re-evaluate marketplace scraping strategy
2. Research alternative data sources:
   - RSS feeds
   - Public APIs
   - Data partnerships
   - Browser extension approach (user-driven)

---

## Appendix: Language Keywords Reference

### Estonian (Soov.ee)
- kuulutus = advertisement
- hind = price
- otsing = search
- seisukord = condition

### Lithuanian (Skelbiu.lt, Vinted.lt)
- skelbimas = advertisement
- kaina = price
- paieška = search
- būklė = condition

### Finnish (Tori.fi)
- ilmoitus = advertisement
- hinta = price
- haku = search
- kunto = condition

---

**Ready to begin Phase 1 with Soov.ee.**
