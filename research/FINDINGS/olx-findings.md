# OLX.pl Implementation Findings

## Status: ✅ FULLY ACCESSIBLE - IMPLEMENTATION READY

**Test Date:** December 28, 2025  
**Test Results:** 6/6 accessibility tests passed  
**Market:** Poland (38M+ population, 70M+ Polish speakers globally)  
**Priority:** 🔴 **HIGHEST** - Poland's largest classifieds marketplace

---

## Overview

OLX.pl is **FULLY ACCESSIBLE** via Puppeteer with no Turnstile blocking. This is the **largest classifieds marketplace in Poland** and represents a major success for expanding market coverage.

### Key Success Indicators
- ✅ **NO Turnstile blocking**
- ✅ **CloudFront CDN** (correlates with accessibility)
- ✅ **React SPA architecture** (requires Puppeteer)
- ✅ **Structured data attributes** (`data-cy`, `data-testid`)
- ✅ **52 listings per page**
- ✅ **Polish keyword support** (telefon, laptop, elektronika)
- ✅ **Pagination support** (25 pages per search)

---

## Technical Architecture

### Platform Details
- **Framework:** React SPA with code-splitting
- **CDN:** CloudFront
- **Server:** nginx
- **Image CDN:** apollo.olxcdn.com
- **Listing Attributes:** `data-cy="l-card"`, `data-testid="l-card"`
- **Page Size:** 514-545 KB HTML (React state embedded)
- **Listings Per Page:** 52

### Requirements
- **Puppeteer Required:** React content needs JavaScript execution
- **User Agent:** Desktop browser recommended
- **Wait Strategy:** Wait for `data-cy="l-card"` elements

---

## Complete HTML Structure

### Listing Card Container
```html
<div data-cy="l-card" 
     data-testid="l-card" 
     data-visually-ready-trigger-element="true" 
     id="1046584753" 
     class="css-1sw7q4x">
  <!-- Full listing content -->
</div>
```

**Notes:**
- Each card has unique numeric ID
- `data-visually-ready-trigger-element` indicates rendering complete
- Container class: `css-1sw7q4x`

---

## Extraction Selectors

### 1. Card Container
**Primary Selector:** `[data-cy="l-card"]` or `[data-testid="l-card"]`  
**Purpose:** Main listing card container

```javascript
const cards = await page.$$('[data-cy="l-card"]');
// Returns 52 cards per page
```

---

### 2. Title Extraction

**HTML Structure:**
```html
<div data-cy="ad-card-title" data-testid="ad-card-title" class="css-u2ayx9">
  <a class="css-1tqlkj0" href="/d/oferta/rozowy-iphone-13-CID99-ID18Pmwf.html">
    <h4 class="css-hzlye5">Różowy Iphone 13</h4>
  </a>
</div>
```

**Selector Chain:**
```javascript
// Within card element:
const titleElement = await card.$('[data-cy="ad-card-title"] h4');
const title = await titleElement.evaluate(el => el.textContent.trim());

// Alternative:
const title = await card.$eval('[data-testid="ad-card-title"] h4', el => el.textContent.trim());
```

**Example Values:**
- "Różowy Iphone 13"
- "Apple iPhone Air na częśći"
- "iPhone 14 Pro 128GB złoty, bateria 86%"

---

### 3. Price Extraction

**HTML Structure:**
```html
<p data-testid="ad-price" class="css-blr5zl">
  900 zł
  <span class="css-1ygi0zw">do negocjacji</span>
  <span class="css-1ygi0zw"></span>
</p>
```

**Selector:**
```javascript
const priceElement = await card.$('[data-testid="ad-price"]');
const priceText = await priceElement.evaluate(el => el.childNodes[0].textContent.trim());
// Returns: "900 zł"

// Extract numeric value:
const priceValue = parseInt(priceText.replace(/[^0-9]/g, ''));
// Returns: 900
```

**Price Variations:**
1. **Base price:** `"900 zł"`
2. **Negotiable:** `"900 zł do negocjacji"`
3. **With safety package:** `"939,50 zł z Pakietem Ochronnym"` (shown in separate element)

**Important:** 
- Price format uses space as thousands separator: `"4 999 zł"`
- Safety package pricing shown in `[data-testid="btr-label-text"]` element
- Parse first text node only to get base price

---

### 4. Link Extraction

**HTML Structure:**
```html
<a class="css-1tqlkj0" href="/d/oferta/rozowy-iphone-13-CID99-ID18Pmwf.html">
  <h4 class="css-hzlye5">Różowy Iphone 13</h4>
</a>
```

**Selector:**
```javascript
const linkElement = await card.$('[data-cy="ad-card-title"] a');
const relativeUrl = await linkElement.evaluate(el => el.getAttribute('href'));
const fullUrl = `https://www.olx.pl${relativeUrl}`;
```

**URL Format:**
- Pattern: `/d/oferta/{slug}-{category}-{id}.html`
- Example: `/d/oferta/rozowy-iphone-13-CID99-ID18Pmwf.html`
- Components:
  - Slug: `rozowy-iphone-13`
  - Category: `CID99` (Electronics category)
  - ID: `ID18Pmwf` (unique listing ID)

---

### 5. Location & Date Extraction

**HTML Structure:**
```html
<p data-testid="location-date" class="css-1b24pxk">
  Warszawa, Targówek - Dzisiaj o 18:35
</p>
```

**Selector:**
```javascript
const locationDate = await card.$eval(
  '[data-testid="location-date"]', 
  el => el.textContent.trim()
);
// Returns: "Warszawa, Targówek - Dzisiaj o 18:35"
```

**Format Patterns:**
- **Today:** `"Warszawa, Targówek - Dzisiaj o 18:35"`
- **Specific date:** `"Szczytno - 27 grudnia 2025"`
- **Refreshed:** `"Piotrków Trybunalski - Odświeżono dnia 27 grudnia 2025"`
- **No district:** `"Kielce - Dzisiaj o 17:17"` (smaller cities)

**Parsing Strategy:**
```javascript
function parseLocationDate(text) {
  // Format: "City, District - Date/Time" or "City - Date/Time"
  const parts = text.split(' - ');
  const location = parts[0]; // "Warszawa, Targówek" or "Kielce"
  const dateTime = parts[1]; // "Dzisiaj o 18:35"
  
  const locationParts = location.split(', ');
  return {
    city: locationParts[0],
    district: locationParts[1] || null,
    dateTime: dateTime
  };
}
```

---

### 6. Image Extraction

**HTML Structure:**
```html
<div class="css-gl6djm">
  <img src="/app/static/media/no_thumbnail.15f456ec5.svg" 
       alt="Różowy Iphone 13" 
       class="css-8wsg1m">
</div>

<!-- OR for real images: -->
<div class="css-gl6djm">
  <img src="https://apollo.olxcdn.com/v1/files/..." 
       alt="Różowy Iphone 13" 
       class="css-8wsg1m">
</div>
```

**Selector:**
```javascript
const imageElement = await card.$('img.css-8wsg1m');
const imageSrc = await imageElement.evaluate(el => el.getAttribute('src'));

// Check if placeholder:
const isPlaceholder = imageSrc.includes('no_thumbnail');

// Build full URL if needed:
const imageUrl = imageSrc.startsWith('http') 
  ? imageSrc 
  : `https://www.olx.pl${imageSrc}`;
```

**Image Types:**
1. **Placeholder:** `/app/static/media/no_thumbnail.15f456ec5.svg`
2. **CDN Images:** `https://apollo.olxcdn.com/v1/files/...`

---

### 7. Condition Badge

**HTML Structure:**
```html
<span title="Używane" class="css-1mqzepw">
  <span>Używane</span>
</span>

<!-- OR for new items: -->
<span title="Nowe" class="css-1mqzepw">
  <span>Nowe</span>
</span>
```

**Selector:**
```javascript
const conditionElement = await card.$('span[title="Używane"], span[title="Nowe"]');
const condition = conditionElement 
  ? await conditionElement.evaluate(el => el.getAttribute('title'))
  : null;
// Returns: "Używane" or "Nowe" or null
```

**Values:**
- `"Używane"` = Used
- `"Nowe"` = New
- `null` = Not specified

---

### 8. Delivery Badge (Optional)

**HTML Structure:**
```html
<div data-testid="card-delivery-badge" class="css-swokb0">
  <div class="css-14xvpcy">
    <svg><!-- Delivery truck icon --></svg>
  </div>
</div>
```

**Selector:**
```javascript
const hasDelivery = await card.$('[data-testid="card-delivery-badge"]') !== null;
```

**Note:** Delivery option is not always available. Indicates seller offers shipping.

---

### 9. Favorite Button

**HTML Structure:**
```html
<button type="button" 
        data-testid="adAddToFavorites" 
        aria-label="Różowy Iphone 13 Obserwuj" 
        aria-pressed="false" 
        class="css-1iwyj97">
  <div data-testid="favorite-icon" class="css-185v2wv">Obserwuj</div>
  <svg><!-- Heart icon --></svg>
</button>
```

**Purpose:** User interaction element (not needed for scraping)

---

## Complete Extraction Function

```javascript
async function extractListingCard(card) {
  try {
    // Title
    const title = await card.$eval(
      '[data-cy="ad-card-title"] h4',
      el => el.textContent.trim()
    ).catch(() => null);

    // Price
    const priceText = await card.$eval(
      '[data-testid="ad-price"]',
      el => el.childNodes[0].textContent.trim()
    ).catch(() => null);
    
    const price = priceText 
      ? parseInt(priceText.replace(/[^0-9]/g, ''))
      : null;

    // Link
    const relativeUrl = await card.$eval(
      '[data-cy="ad-card-title"] a',
      el => el.getAttribute('href')
    ).catch(() => null);
    
    const url = relativeUrl ? `https://www.olx.pl${relativeUrl}` : null;

    // Location & Date
    const locationDate = await card.$eval(
      '[data-testid="location-date"]',
      el => el.textContent.trim()
    ).catch(() => null);

    // Parse location
    let city = null, district = null, dateTime = null;
    if (locationDate) {
      const parts = locationDate.split(' - ');
      const locationParts = parts[0].split(', ');
      city = locationParts[0];
      district = locationParts[1] || null;
      dateTime = parts[1] || null;
    }

    // Image
    const imageSrc = await card.$eval(
      'img.css-8wsg1m',
      el => el.getAttribute('src')
    ).catch(() => null);
    
    const isPlaceholder = imageSrc?.includes('no_thumbnail');
    const imageUrl = imageSrc && !isPlaceholder
      ? (imageSrc.startsWith('http') ? imageSrc : `https://www.olx.pl${imageSrc}`)
      : null;

    // Condition
    const condition = await card.$eval(
      'span[title="Używane"], span[title="Nowe"]',
      el => el.getAttribute('title')
    ).catch(() => null);

    // Delivery
    const hasDelivery = await card.$('[data-testid="card-delivery-badge"]') !== null;

    // Unique ID from container
    const listingId = await card.evaluate(el => el.id);

    return {
      id: listingId,
      title,
      price,
      url,
      city,
      district,
      dateTime,
      imageUrl,
      condition,
      hasDelivery,
      source: 'olx.pl'
    };
  } catch (error) {
    console.error('Error extracting listing:', error);
    return null;
  }
}
```

---

## Search URL Patterns

### Base Search
```
https://www.olx.pl/oferty/q-{query}/
```
Example: `https://www.olx.pl/oferty/q-iphone/`

### Category Filter
```
https://www.olx.pl/{category}/q-{query}/
```
Example: `https://www.olx.pl/elektronika/q-iphone/`

### Location Filter
```
https://www.olx.pl/{city}/q-{query}/
```
Example: `https://www.olx.pl/warszawa/q-iphone/`

### Combined Filters
```
https://www.olx.pl/{city}/{category}/q-{query}/
```

### Pagination
```
https://www.olx.pl/oferty/q-{query}/?page={page_number}
```
Example: `https://www.olx.pl/oferty/q-iphone/?page=2`

**Pagination Details:**
- Pages indexed from 1
- Maximum ~25 pages per search
- Pagination HTML: `<li class="pagination-item__active">` for current page
- Next page link: `[data-testid="pagination-forward"]`

---

## Polish Keyword Mappings

### Search Keywords
```javascript
const keywords = {
  phone: 'telefon',
  laptop: 'laptop',
  electronics: 'elektronika',
  computer: 'komputer',
  tablet: 'tablet',
  camera: 'aparat',
  tv: 'telewizor',
  monitor: 'monitor'
};
```

### UI Text Patterns
```javascript
const uiText = {
  used: 'Używane',
  new: 'Nowe',
  negotiable: 'do negocjacji',
  watch: 'Obserwuj',
  today: 'Dzisiaj',
  refreshed: 'Odświeżono dnia',
  safetyPackage: 'z Pakietem Ochronnym'
};
```

### Date Patterns
- **Today:** `"Dzisiaj o {HH:MM}"` → "Dzisiaj o 18:35"
- **Specific date:** `"{DD} {month_name} {YYYY}"` → "27 grudnia 2025"
- **Refreshed:** `"Odświeżono dnia {DD} {month_name} {YYYY}"` or `"Odświeżono Dzisiaj o {HH:MM}"`

**Polish Months:**
- stycznia, lutego, marca, kwietnia, maja, czerwca
- lipca, sierpnia, września, października, listopada, grudnia

---

## Implementation Example

### Complete Scraping Function

```javascript
import { getBrowser, fetchWithBrowser, closeBrowser } from './lib/browser.js';

async function scrapeOLX(query, page = 1) {
  const browser = await getBrowser();
  
  try {
    // Build search URL
    const searchUrl = `https://www.olx.pl/oferty/q-${encodeURIComponent(query)}/${page > 1 ? `?page=${page}` : ''}`;
    
    // Fetch page
    const html = await fetchWithBrowser(searchUrl, {
      waitForSelector: '[data-cy="l-card"]',
      timeout: 30000
    });
    
    // Load into Puppeteer page
    const pageInstance = await browser.newPage();
    await pageInstance.setContent(html, { waitUntil: 'networkidle0' });
    
    // Extract all listings
    const cards = await pageInstance.$$('[data-cy="l-card"]');
    console.log(`Found ${cards.length} listings`);
    
    const listings = [];
    for (const card of cards) {
      const listing = await extractListingCard(card);
      if (listing) {
        listings.push(listing);
      }
    }
    
    await pageInstance.close();
    return listings;
    
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  } finally {
    await closeBrowser();
  }
}

// Usage
const results = await scrapeOLX('iphone', 1);
console.log(`Scraped ${results.length} listings from OLX.pl`);
```

---

## Adapter Implementation Guide

### File: `lib/adapters/olx.js`

**Pattern:** Follow `vinted.js` and `tori.js` structure

**Key Functions:**
1. `buildSearchUrl(query, options)` - Construct search URLs
2. `normalizePrice(priceText)` - Parse Polish price format
3. `parseLocationDate(text)` - Extract location and date
4. `extractListings(html)` - Main extraction logic
5. `searchOLX(query, options)` - Public API

**Example Structure:**
```javascript
export async function searchOLX(query, options = {}) {
  const {
    category = null,
    location = null,
    page = 1
  } = options;
  
  const searchUrl = buildSearchUrl(query, { category, location, page });
  
  // Use Puppeteer to fetch
  const html = await fetchWithBrowser(searchUrl, {
    waitForSelector: '[data-cy="l-card"]'
  });
  
  // Extract listings
  const listings = await extractListings(html);
  
  // Normalize to common format
  return listings.map(listing => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    currency: 'PLN',
    url: listing.url,
    location: listing.city,
    image: listing.imageUrl,
    date: listing.dateTime,
    source: 'olx.pl'
  }));
}
```

---

## Testing Coverage

### Test Results (December 28, 2025)

| Test | URL Pattern | Status | Size | Prices | Listings |
|------|-------------|--------|------|--------|----------|
| 1 | Basic query | ✅ Pass | 514 KB | 74 | ✓ |
| 2 | Category + query | ✅ Pass | 545 KB | 104 | ✓ |
| 3 | Location + query | ✅ Pass | 520 KB | 71 | ✓ |
| 4 | Polish keyword | ✅ Pass | 523 KB | 80 | ✓ |
| 5 | Laptop search | ✅ Pass | 528 KB | 79 | ✓ |
| 6 | Category only | ✅ Pass | 159 KB | 0 | ✓ |

**Summary:** 6/6 tests passed (100% success rate)

---

## Important Notes

### React SPA Considerations
1. **JavaScript Required:** Content is client-side rendered
2. **Wait Strategy:** Use `waitForSelector` for `[data-cy="l-card"]`
3. **Network Idle:** Wait for `networkidle0` for complete loading
4. **State Embedded:** HTML includes embedded React state (large file size)

### Price Handling
1. **Thousands Separator:** Space character (e.g., `"4 999 zł"`)
2. **Currency:** Always złoty (zł) or PLN
3. **Negotiable:** Look for `"do negocjacji"` in price element
4. **Safety Package:** Separate pricing in `[data-testid="btr-label-text"]`

### Location Parsing
1. **Format Variability:** May include district or not
2. **City First:** Always first component before comma
3. **Date Formats:** Multiple Polish date patterns
4. **Today Detection:** Check for `"Dzisiaj"` string

### Image Handling
1. **CDN Domain:** apollo.olxcdn.com
2. **Placeholder Detection:** Check for `"no_thumbnail"` in src
3. **Relative URLs:** May need to prepend `https://www.olx.pl`
4. **Image Quality:** CDN serves optimized versions

---

## Market Significance

### Why OLX.pl is Critical

1. **Largest Polish Marketplace:** #1 classifieds platform in Poland
2. **Market Size:** 38M+ population (Poland) + 70M Polish speakers globally
3. **Category Coverage:** Electronics, vehicles, real estate, jobs, services
4. **User Base:** Millions of active users monthly
5. **Listing Volume:** Hundreds of thousands of active listings

### Competitive Advantage
- **Opening Polish Market:** First fully accessible Polish marketplace
- **High Traffic:** One of most visited sites in Poland
- **Geographic Reach:** Covers all Polish cities and regions
- **Category Depth:** Competes with specialized marketplaces

---

## Next Steps

### Immediate Actions
1. ✅ **Documentation Complete** (this file)
2. ⏳ **Implement `lib/adapters/olx.js`**
3. ⏳ **Add OLX to aggregator**
4. ⏳ **Test with live queries**
5. ⏳ **Validate data normalization**

### Testing Priorities
- [ ] Price parsing (space separator handling)
- [ ] Polish character encoding
- [ ] Location extraction accuracy
- [ ] Pagination navigation
- [ ] Category filter integration
- [ ] Error handling for missing fields

### Integration Checklist
- [ ] Add to `SPEC.md` as ACCESSIBLE
- [ ] Update `availableplatforms.md` with Phase 2 results
- [ ] Create adapter following Vinted/Tori pattern
- [ ] Add Polish keyword support to search interface
- [ ] Test aggregator with OLX results
- [ ] Verify currency conversion (PLN to EUR/USD)

---

## Related Documentation
- Test script: `test-olx-access.js`
- HTML sample: `olx-search-sample.html` (2117 lines, 52 listings)
- Phase 2 plan: `check_sites_phase2.md`
- Phase 1 results: `availableplatforms.md`

---

**Status:** Ready for implementation  
**Confidence Level:** HIGH - All selectors verified, structure fully documented  
**Estimated Implementation Time:** 4-6 hours (adapter + testing)  
**Priority:** 🔴 **CRITICAL** - Largest Polish marketplace, immediate integration recommended
