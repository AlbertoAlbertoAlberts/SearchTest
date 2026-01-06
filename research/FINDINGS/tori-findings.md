# Tori.fi (Finland) - Accessibility & Structure Analysis

**Status**: ✅ **FULLY ACCESSIBLE - PROCEED WITH IMPLEMENTATION**

---

## Test Summary

- **Domain**: https://www.tori.fi
- **Market**: Finland (Finnish general classifieds marketplace)
- **Test Date**: Phase 4 completion
- **Protection**: Cloudflare (non-blocking) - NO Turnstile
- **Accessibility**: ✅ Full access via Puppeteer

---

## Test Results (6 URL patterns)

### ✅ Working Endpoints (4/5)

1. **`/koko_suomi?q=iphone`** (All Finland search)
   - Status: ✅ HTTP 200
   - Size: 1,075,643 bytes (~1MB HTML)
   - Listings: ✅ Detected (5 prices found in test)
   - Turnstile: ✅ NO
   - **PRIMARY URL PATTERN**

2. **`/uusimaa/elektroniikka?q=iphone`** (Regional + category search)
   - Status: ✅ HTTP 200
   - Size: 1,126,949 bytes
   - Listings: ✅ Detected
   - Turnstile: ✅ NO
   - **ALTERNATIVE URL PATTERN**

3. **`/koko_suomi?q=matkapuhelin`** (Finnish keyword: mobile phone)
   - Status: ✅ HTTP 200
   - Keyword matches: 182 instances
   - Listings: ✅ Detected
   - Cloudflare: ⚠️ Present (non-blocking)

4. **`/koko_suomi?q=puhelin`** (Finnish keyword: phone)
   - Status: ✅ HTTP 200
   - Keyword matches: 190 instances
   - Listings: ✅ Detected
   - Cloudflare: ⚠️ Present (non-blocking)

### ❌ Not Working (1/5)

5. **`/?q=iphone`** (Homepage search)
   - Status: ⚠️ HTTP 200 but NO listings detected
   - Issue: Redirects to homepage, no region specified
   - Conclusion: Requires region parameter

---

## HTML Structure Analysis

### Listing Container
```html
<article class="relative isolate sf-search-ad card card--cardShadow s-bg ">
  <!-- Listing content -->
</article>
```

**Selector**: `article.sf-search-ad`

### Key Elements

#### 1. Price
```html
<span>175&nbsp;€</span>
<span>279&nbsp;€</span>
<span>850&nbsp;€</span>
```
- **Pattern**: `{price}&nbsp;€`
- **Selector**: Look for span with price pattern inside article
- **Note**: Uses `&nbsp;` (non-breaking space) before currency

#### 2. Title
```html
<h2 class="h4 mb-0 break-words font-normal text-s sm:mt-4 md:mt-8" id="search-ad-35017204">
  <a class="sf-search-ad-link s-text! hover:no-underline block truncate" href="..." id="35017204">
    <span class="absolute inset-0" aria-hidden="true"></span>
    ALE iPhone 11 Pro Max 64GB space gray - TAKUU 12 kk
  </a>
</h2>
```
- **Selector**: `h2.h4 a.sf-search-ad-link` text content
- **ID**: Available on `<a>` tag (e.g., `id="35017204"`)

#### 3. URL/Link
```html
<a class="sf-search-ad-link s-text! hover:no-underline block truncate" 
   href="https://www.tori.fi/recommerce/forsale/item/35017204" 
   id="35017204">
```
- **Selector**: `a.sf-search-ad-link` with `href` attribute
- **URL Pattern**: `https://www.tori.fi/recommerce/forsale/item/{itemId}`
- **Item ID**: Available in href and as element ID

#### 4. Location & Timestamp
```html
<div class="text-xs s-text-subtle flex justify-between flex-wrap mt-4 sm:mt-8 ">
  <span class="whitespace-nowrap truncate mr-8">Espoo, Otaniemi, Uusimaa</span>
  <span class="whitespace-nowrap">2 t</span>
</div>
```
- **Location Selector**: `.s-text-subtle span.whitespace-nowrap.truncate` (first span)
- **Timestamp Selector**: `.s-text-subtle span.whitespace-nowrap:last-child`
- **Format**: "City, District, Region" | "2 t" (hours ago), "6 min" (minutes ago)

#### 5. Specifications (Storage, Brand)
```html
<div class="flex flex-wrap mt-4 text-xs">
  <span class="mr-8"> 64 GB</span>
  <span class="mr-8"> Apple</span>
</div>
```
- **Selector**: `.flex.flex-wrap.mt-4.text-xs span`
- **Specs**: Storage (GB) and Brand name

#### 6. Images
```html
<img alt="" 
     class="w-full h-full object-center object-cover" 
     sizes="..." 
     src="https://img.tori.net/dynamic/480w/item/35017204/72aaa0be-..."
     srcset="...">
```
- **Selector**: `article img[src*='img.tori.net']`
- **CDN**: `https://img.tori.net/dynamic/480w/item/{itemId}/{imageHash}`
- **Responsive sizes**: 240w, 320w, 480w, 640w, 960w available

#### 7. Seller Information (when available)
```html
<div class="mt-4 sm:mt-8 text-xs s-text-subtle truncate">
  <span>TradeUp</span>
</div>
```
- **Selector**: `.text-xs.s-text-subtle.truncate span`
- **Note**: Not present for all listings (private sellers)

#### 8. Special Badges (ToriDiili, Free Shipping)
```html
<span class="absolute top-0 left-0 pointer-events-none badge--positionTL badge--warning">
  <svg>...</svg>ToriDiili
</span>
```
- **ToriDiili**: Tori's fast shipping program (like Amazon Prime)
- **Badges**: `.badge--positionTL` (top-left position)

---

## Pagination

```html
<a aria-label="Sivu 2" href="?page=2&amp;q=iphone" rel="">2</a>
<a aria-label="Sivu 3" href="?page=3&amp;q=iphone" rel="">3</a>
```

- **Pattern**: `?page={pageNumber}&q={query}`
- **Selector**: `nav[aria-label="Pagination"] a[href*="page="]`
- **Pages visible**: 7 pages shown in pagination controls
- **Finnish**: "Sivu" = Page

---

## URL Patterns & Search Strategy

### Primary Search URL
```
https://www.tori.fi/koko_suomi?q={query}
```
- **koko_suomi** = "All Finland" (nationwide search)
- Most reliable pattern for general searches

### Regional Search URL
```
https://www.tori.fi/{region}?q={query}
```
Examples:
- `/uusimaa?q=iphone` (Uusimaa region)
- `/pirkanmaa?q=puhelin` (Pirkanmaa region)

### Category + Regional Search
```
https://www.tori.fi/{region}/{category}?q={query}
```
Example:
- `/uusimaa/elektroniikka?q=iphone` (Electronics in Uusimaa)

### Pagination
```
https://www.tori.fi/koko_suomi?q={query}&page={pageNum}
```

---

## Finnish Keywords (Important!)

Finnish keywords perform **better** than English for searches:

| English | Finnish | Test Results |
|---------|---------|--------------|
| mobile phone | matkapuhelin | 182 matches |
| phone | puhelin | 190 matches |
| electronics | elektroniikka | Works (category) |
| price | hinta | - |
| used | käytetty | - |
| new | uusi | - |

**Recommendation**: Support Finnish keyword translation in adapter for best results.

---

## Sample Scraping Flow

```javascript
// 1. Navigate to search URL
const url = `https://www.tori.fi/koko_suomi?q=${encodeURIComponent(query)}`;
const html = await fetchWithBrowser(url);

// 2. Load with Cheerio
const $ = cheerio.load(html);

// 3. Extract listings
$('article.sf-search-ad').each((_, article) => {
  const $article = $(article);
  
  // Title & URL
  const $link = $article.find('a.sf-search-ad-link');
  const title = $link.text().trim();
  const url = $link.attr('href');
  const id = $link.attr('id');
  
  // Price
  const priceText = $article.find('span').filter((_, el) => {
    return $(el).text().includes('€');
  }).first().text();
  const price = parseFloat(priceText.replace(/\s/g, '').replace('€', ''));
  
  // Location
  const location = $article.find('.s-text-subtle span.whitespace-nowrap.truncate').first().text();
  
  // Image
  const image = $article.find('img[src*="img.tori.net"]').attr('src');
  
  // Specs
  const specs = [];
  $article.find('.flex-wrap.mt-4.text-xs span').each((_, span) => {
    specs.push($(span).text().trim());
  });
});
```

---

## Pros & Cons

### ✅ Pros

1. **NO Turnstile** - Full Puppeteer access (critical!)
2. **General marketplace** - Not limited to fashion like Vinted
3. **Rich HTML** - All data in initial page load (no JS rendering needed)
4. **Good structure** - Clean semantic HTML with classes
5. **Multiple URL patterns** - Regional, category, nationwide options
6. **Large inventory** - Finnish market coverage
7. **Pagination** - Standard page-based pagination
8. **Responsive images** - CDN with multiple sizes
9. **Seller info** - Business sellers identified
10. **Finnish + English** - Bilingual support (Finnish works better)

### ⚠️ Considerations

1. **Finnish language** - Finnish keywords needed for best results
2. **Regional market** - Finland only (smaller than Baltic combined)
3. **Cloudflare present** - Non-blocking now, but could change
4. **HTML entities** - Uses `&nbsp;` in prices (needs handling)
5. **Region required** - Homepage search doesn't work, needs `/koko_suomi`

---

## Comparison: Vinted vs Tori

| Feature | Vinted.lt (Phase 3) | Tori.fi (Phase 4) |
|---------|---------------------|-------------------|
| **Accessibility** | ✅ NO Turnstile | ✅ NO Turnstile |
| **Market** | Lithuania, Fashion | Finland, General |
| **Selectors** | data-testid | CSS classes |
| **Inventory** | 200+ iPhones found | Large (5+ per page) |
| **Language** | Lithuanian/English | Finnish/English |
| **URL Pattern** | `/catalog?search_text=` | `/koko_suomi?q=` |
| **Pagination** | Infinite scroll | Standard pages |
| **Specialization** | Fashion-focused | All categories |

---

## Implementation Recommendation

### ✅ **PROCEED WITH IMPLEMENTATION**

**Priority: HIGH** (alongside Vinted.lt)

**Rationale**:
1. ✅ Fully accessible (NO Turnstile blocking)
2. ✅ General classifieds (broader than Vinted's fashion focus)
3. ✅ Finnish market coverage (complementary to Lithuanian Vinted)
4. ✅ Clean HTML structure (easy to parse)
5. ✅ Multiple tested URL patterns (robust search)
6. ✅ Rich metadata (location, specs, timestamps)

**Implementation Order**:
- **Option A**: Implement Tori first (general classifieds = broader inventory)
- **Option B**: Implement Vinted first (already documented, fashion niche)
- **Option C**: Implement both simultaneously (maximum coverage)

**Suggested**: Implement **Tori first** for general marketplace coverage, then add Vinted for fashion specialization.

---

## Next Steps

1. ✅ Create `/lib/adapters/tori.js`
2. ✅ Implement search function with `/koko_suomi?q=` pattern
3. ✅ Add Finnish keyword translation layer (optional but recommended)
4. ✅ Extract listings with Cheerio using selectors above
5. ✅ Normalize data (location → Finnish regions, timestamps)
6. ✅ Implement pagination support
7. ✅ Add to aggregator source list
8. ✅ Test with various queries (Finnish + English keywords)

---

## Test Script Reference

All accessibility tests documented in: `test-tori-access.js`
- 6 URL pattern tests
- Finnish keyword validation
- Cloudflare/Turnstile detection
- HTML sample saved to: `tori-search-sample.html`
