# Price Filtering and Sorting Implementation Plan

## Current State
- Price range filter UI exists but is not functional
- Sort options UI exists (relevance, newest first, price low/high)
- Currently only SS.com as data source
- Results are sorted by price (low to high) on backend but not controllable from frontend
- No price range filtering implemented

## Goal
1. Make price range filter functional (min/max price inputs)
2. Implement price sorting (low to high, high to low)
3. Set "Price: Low to High" as default sort
4. Design system to support multi-source price comparison (future)

---

## Phase 1: Frontend State Management & URL Parameters

### Changes Needed
**File: `pages/index.js`**
- Add state for price range: `minPrice`, `maxPrice`
- Add state for sort option: `sortBy` (default: 'price-low')
- Store these in URL query parameters for bookmarking/sharing
- Pass these values to API call and to components

**File: `components/Sidebar.js`**
- Connect price range inputs to parent state
- Implement "Apply" button to trigger search with price filters
- Add input validation (min < max, positive numbers)
- Show active filter indicators

**File: `components/ResultsView.js`**
- Connect sort dropdown to parent state
- Highlight active sort option
- Update URL when sort changes

### API Parameters
```javascript
/api/search?q=airpods&sources=ss&minPrice=50&maxPrice=200&sortBy=price-low
```

---

## Phase 2: Backend Filtering Implementation

### Changes Needed
**File: `pages/api/search.js`**
- Accept new query parameters: `minPrice`, `maxPrice`, `sortBy`
- Pass these to adapter's search function
- Update cache key to include these parameters
  - Cache key: `${query}-${sources}-${page}-${minPrice}-${maxPrice}-${sortBy}`

**File: `lib/adapters/ss.js`**
- Accept `minPrice`, `maxPrice`, `sortBy` in options
- Apply price range filtering in Phase 1 (during price extraction)
  - Filter out items where `parsePriceValue(priceText) < minPrice`
  - Filter out items where `parsePriceValue(priceText) > maxPrice`
  - Keep "Free" items (price = 0) unless minPrice > 0
- Implement sorting:
  - `price-low`: Sort by price ascending (already implemented)
  - `price-high`: Sort by price descending
  - `relevance`: No sorting (SS.com default order) - NOT IMPLEMENTED YET
  - `newest`: No sorting (SS.com default order) - NOT IMPLEMENTED YET

### Price Parsing Enhancement
- Ensure `parsePriceValue()` handles edge cases:
  - "Free" → 0
  - "150 €" → 150
  - "1,500 €" → 1500
  - "€1,200" → 1200
  - Invalid/missing → Infinity (sorts to end)

---

## Phase 3: Multi-Source Price Comparison (Future)

### Design Considerations
When multiple sources are added (e.g., SS.com + OLX + Facebook Marketplace):

**Option A: Normalize All Sources to Same Currency**
- Convert all prices to EUR (or user's preferred currency)
- Each adapter returns normalized price value
- Frontend shows original price + normalized price
- Sorting/filtering uses normalized price

**Option B: Currency-Aware Filtering**
- Store price with currency: `{ value: 150, currency: 'EUR' }`
- Convert user's filter (e.g., "50-200 EUR") to each source's currency
- Show prices in original currency
- Add currency selector to filter

**Recommendation: Option A**
- Simpler implementation
- Better user experience (direct comparison)
- Most Baltic sources use EUR anyway

### Implementation for Multi-Source
```javascript
// Each adapter returns:
{
  price: "150 €",
  priceValue: 150,
  currency: "EUR",
  source: "ss"
}

// API aggregates all sources:
const ssResults = await ssAdapter.search(query, options);
const olxResults = await olxAdapter.search(query, options);

// Merge and sort by normalized price
const allResults = [...ssResults.items, ...olxResults.items];
allResults.sort((a, b) => a.priceValue - b.priceValue);
```

---

## Phase 4: UI Enhancements (Optional)

### Improvements
1. **Price Range Slider** instead of text inputs
   - Better UX for quick filtering
   - Shows price distribution histogram
   - Library: `rc-slider` or `@mui/slider`

2. **Active Filter Tags**
   - Show active filters as removable chips
   - "€50 - €200" [×] "Price: Low to High" [×]
   - Quick way to clear filters

3. **Results Count Update**
   - Show "169 results" → "47 results (122 filtered out)"
   - Give feedback when filters reduce results

4. **Save Filter Presets**
   - Allow users to save common searches
   - "AirPods under €100"
   - Store in localStorage

---

## Implementation Order

### Step 1: Phase 1 (Frontend State) - ~30 minutes
- Add state management
- Wire up UI components
- Update URL parameters

### Step 2: Phase 2 (Backend Filtering) - ~45 minutes
- Implement price range filtering
- Implement price sorting
- Update cache keys
- Test with different price ranges

### Step 3: Testing & Validation - ~15 minutes
- Test edge cases (free items, high prices, no results)
- Test with different queries
- Verify caching works correctly
- Test URL parameter persistence

### Step 4: Phase 3 (Multi-Source) - FUTURE
- Implement when second source is added
- Requires currency normalization strategy

---

## Technical Notes

### Caching Strategy
- Cache must include filter parameters
- Cache key: `${query}-${sources}-${page}-${minPrice || 'any'}-${maxPrice || 'any'}-${sortBy}`
- Example: `airpods-ss-1-50-200-price-low`
- This ensures filtered results don't return wrong cached data

### Performance Considerations
- Price filtering happens in Phase 1 (before detail enrichment)
- Reduces number of items to enrich in Phase 2
- Example: Filter 300 items → 50 items → enrich only 20
- Faster response times when filters are applied

### URL Parameter Format
```
/?q=airpods&sources=ss&minPrice=50&maxPrice=200&sortBy=price-low
```

### Sort Options
- `price-low` - Price: Low to High (DEFAULT)
- `price-high` - Price: High to Low
- `relevance` - Relevance (not implemented yet)
- `newest` - Newest First (not implemented yet)

---

## Testing Checklist

- [ ] Price range filter: 50-200 EUR
- [ ] Price range filter: Only min (50+)
- [ ] Price range filter: Only max (0-200)
- [ ] Free items appear when minPrice = 0
- [ ] Free items excluded when minPrice > 0
- [ ] Sort: Low to High (default)
- [ ] Sort: High to Low
- [ ] URL parameters update correctly
- [ ] Browser back/forward works
- [ ] Cache respects filter parameters
- [ ] No results scenario shows appropriate message
- [ ] Edge case: minPrice > maxPrice (validation)
- [ ] Edge case: Negative prices (validation)
- [ ] Edge case: Very large numbers (10000+)

---

## Success Criteria

✅ Default sort is "Price: Low to High"
✅ User can filter by price range (min/max)
✅ User can switch between low→high and high→low sorting
✅ URL parameters preserve filter state
✅ Cache works correctly with filters
✅ System is ready for multi-source comparison (extensible design)
✅ UI shows clear feedback on active filters
