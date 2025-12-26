# Frontend Design Plan – Marketplace Aggregator UI

**Status:** Planning phase  
**Date:** 26 December 2025  
**Goal:** Redesign the UI to match the mockup screenshots with improved layout, filters, and listing display

---

## Design Overview

Based on the provided screenshots, the UI should have:

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│  Header (Logo, Search Bar, Navigation)                 │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │         Main Content Area               │
│   (Filters)  │         (Search Results)                │
│              │                                          │
│   - Sources  │   Showing X of Y listings               │
│   - Price    │                                          │
│   - Condition│   ┌────────────────────────────┐        │
│   - Desc     │   │  Listing Card              │        │
│              │   │  - Image                   │        │
│              │   │  - Title (bold)            │        │
│              │   │  - Price (right)           │        │
│              │   │  - Checkboxes (green)      │        │
│              │   │  - Source link             │        │
│              │   └────────────────────────────┘        │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Header Component
**File:** `components/Header.js` (new)

**Elements:**
- Logo/App name: "Second-Hand Market Finder" (left side)
- Main search input (center)
- Navigation links: Browse, Categories, Saved (right side)
- Responsive: collapses to hamburger menu on mobile

**Props:**
- `searchQuery` - current search term
- `onSearch` - callback for search submission

**State:**
- Search input value (local)

---

### 2. Sidebar Filter Component
**File:** `components/Sidebar.js` (new)

**Sections:**

#### A. Marketplace Sites Filter
- **Display:** Grouped by country
- **Structure:**
  ```
  Latvia
    ☐ SS.lv / SS.com
    ☐ Andele Mandele
    ☐ PP.lv
  Estonia
    ☐ Okidoki
    ☐ Osta
    ☐ Soov
  Lithuania
    ☐ Skelbiu
    ☐ Vinted (LT)
  Finland
    ☐ Tori
    ☐ Huuto
  Poland
    ☐ OLX
    ☐ Allegro Lokalnie
    ☐ Sprzedajemy
  ```
- **Functionality:** Multi-select checkboxes
- **Default:** All unchecked (search all when none selected, or use "Select All" button)

#### B. Price Range Filter
- **Display:** Dual-range slider
- **Range:** €0 - €1000 (adjustable based on results)
- **Inputs:** 
  - Two text inputs showing min/max values
  - Slider handles to adjust visually
- **Functionality:** Filter items where `priceValue` is within range

#### C. Condition Filter
- **Display:** Checkboxes
- **Options:**
  - ☐ New
  - ☐ Good as New
  - ☐ Used
  - ☐ Bad
  - ☐ Broken
- **Functionality:** Multi-select, show items matching any checked condition
- **Note:** Handle items with no condition data

#### D. Description Filter
- **Display:** Radio buttons or checkbox toggle
- **Options:**
  - ○ All (default)
  - ○ Has Description
  - ○ No Description
- **Functionality:** Filter by `hasDescription` field

#### E. Clear All Filters Button
- **Display:** Bottom of sidebar
- **Functionality:** Reset all filters to defaults

**Props for Sidebar:**
```javascript
{
  sources: [],           // Array of selected source IDs
  priceMin: 0,
  priceMax: 1000,
  conditions: [],        // Array of selected conditions
  descriptionFilter: 'all',
  onFilterChange: fn     // Callback with all filter values
}
```

---

### 3. Listing Card Component
**File:** `components/ListingCard.js` (new)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  ┌────────┐  TITLE IN BOLD                   850 €  │
│  │ Image  │                                          │
│  │ 120x120│  ✓ Condition: Good as New               │
│  └────────┘  ✓ Listing added: Dec 22, 2024          │
│              ✓ Has Description                       │
│                                                       │
│              Source: Okidoki (clickable link)        │
└─────────────────────────────────────────────────────┘
```

**Elements:**

1. **Image** (left side)
   - Placeholder: gray box with icon if no image
   - Size: 120x120px (responsive)
   - Aspect ratio maintained

2. **Title** (top, bold)
   - Font weight: 700
   - Font size: 16-18px
   - Truncate if too long (max 2 lines with ellipsis)

3. **Price** (top right, aligned)
   - Large, prominent
   - Color: primary/accent color
   - Show `priceText` as-is

4. **Checkboxes** (metadata indicators)
   - **ALL GREEN checkboxes** (✓ in green)
   - **Order:**
     1. Condition: {conditionText}
     2. Listing added: {postedAtText}
     3. Has Description (or unchecked gray if no description)
   - Layout: vertical stack below image
   - Font size: 14px
   - Use actual checkmark icons or SVG
   - Grayed out/unchecked if data not available

5. **Source Link** (bottom)
   - Text: "Source: {sourceName}"
   - Link to: `{url}`
   - Opens in new tab
   - Font size: 12-13px
   - Color: muted/gray

**Props:**
```javascript
{
  listing: {
    id, title, priceText, url, sourceName,
    conditionText, postedAtText, hasDescription,
    hasImage, ...
  }
}
```

**State:** None (pure presentational)

---

### 4. Main Content Component
**File:** `components/ResultsView.js` (new)

**Structure:**

#### A. Results Header
- "Showing X of Y listings"
- Sort dropdown (placeholder for now):
  - Relevance
  - Newest First
  - Price: Low to High
  - Price: High to Low

#### B. Results Grid/List
- Display: Vertical list of ListingCard components
- Responsive: 
  - Desktop: 1 column (full width cards)
  - Tablet: Could stay 1 column or 2 columns
  - Mobile: 1 column
- Padding/spacing between cards: 16px
- No results state: "No listings found. Try adjusting your filters."

#### C. Loading State
- Skeleton cards or spinner while fetching
- Text: "Searching marketplaces..."

#### D. Error Display
- Show adapter errors from API response
- Design: Warning banner above results
- List each source that failed

**Props:**
```javascript
{
  items: [],            // Array of Listing objects
  loading: boolean,
  errors: [],           // API errors
  metadata: {           // From API response
    tookMs, sources, query
  }
}
```

---

### 5. Main Page Component
**File:** `pages/index.js` (refactor existing)

**Responsibilities:**
- State management for all filters
- API calls to `/api/search`
- Coordinate between Sidebar and ResultsView
- Handle URL query parameters (for shareable filtered searches)

**State Structure:**
```javascript
{
  // Search
  searchQuery: "",
  
  // Filters
  selectedSources: [],      // e.g., ["ss", "okidoki", "tori"]
  priceRange: { min: 0, max: 1000 },
  selectedConditions: [],   // e.g., ["new", "good"]
  descriptionFilter: "all", // "all" | "has" | "none"
  
  // Results
  items: [],
  loading: false,
  errors: [],
  metadata: null,
  
  // UI
  sidebarOpen: true  // For mobile toggle
}
```

**Functions:**
- `handleSearch()` - Execute search with current filters
- `handleFilterChange()` - Update filters and re-search
- `buildApiUrl()` - Construct API call with query params
- `applyClientSideFilters()` - Filter results (price, condition, etc.)

**URL Sync:**
- Sync filters to URL query params
- Allow bookmarking/sharing filtered searches
- Example: `?q=macbook&sources=ss,okidoki&priceMax=500&condition=new`

---

## Styling Approach

### Technology Choice
**Recommendation:** CSS Modules or Tailwind CSS

#### Option A: CSS Modules (simpler)
- File per component: `Header.module.css`, `ListingCard.module.css`
- Scoped styles, no conflicts
- Full control over design

#### Option B: Tailwind CSS (faster)
- Utility-first
- Rapid prototyping
- Consistent spacing/colors
- Would require setup: `npm install tailwindcss postcss autoprefixer`

**Decision:** Start with **CSS Modules** for better learning and control

### Color Scheme (Proposed)
```css
:root {
  --primary: #2563eb;      /* Blue for links/buttons */
  --success: #10b981;      /* Green for checkmarks */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --bg-gray: #f9fafb;
  --bg-white: #ffffff;
}
```

### Typography
- **Font:** System font stack or Inter/Roboto
- **Sizes:**
  - Headings: 24px, 20px, 18px
  - Body: 16px
  - Small: 14px, 12px

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

---

## Data Flow & State Management

### Filter Application Strategy

**Two-stage filtering:**

1. **Server-side (API level):**
   - Source selection → passed as `?sources=ss,okidoki`
   - Query string → passed as `?q=laptop`
   
2. **Client-side (after API response):**
   - Price range filtering
   - Condition filtering
   - Description filtering
   - Sorting

**Why?**
- API already returns all results from selected sources
- Client-side filtering is instant (no additional API calls)
- Can add debouncing later for live filter updates

**Future optimization:**
- Move filters to API if result sets become large (>500 items)
- Implement pagination

---

## Responsive Design Breakpoints

```css
/* Mobile first */
- Base: 320px - 767px (mobile)
- Tablet: 768px - 1023px
- Desktop: 1024px+

Sidebar behavior:
- Mobile: Hidden by default, toggleable overlay
- Tablet+: Always visible, fixed position
```

---

## Accessibility Considerations

1. **Keyboard Navigation:**
   - All filters accessible via keyboard
   - Tab order: Search → Filters → Results
   - Enter/Space to toggle checkboxes

2. **Screen Readers:**
   - Proper ARIA labels on filters
   - Alt text for images (or aria-label)
   - Announce filter changes
   - Announce results count

3. **Color Contrast:**
   - Ensure text meets WCAG AA (4.5:1 ratio)
   - Don't rely solely on color for checkmarks

4. **Focus Indicators:**
   - Visible focus rings on all interactive elements

---

## Component File Structure (Proposed)

```
ss-search-test/
├─ pages/
│  └─ index.js                 # Main page (refactored)
│
├─ components/
│  ├─ Header.js
│  ├─ Header.module.css
│  ├─ Sidebar.js
│  ├─ Sidebar.module.css
│  ├─ ListingCard.js
│  ├─ ListingCard.module.css
│  ├─ ResultsView.js
│  ├─ ResultsView.module.css
│  └─ shared/
│     ├─ RangeSlider.js       # Reusable price slider
│     ├─ Checkbox.js          # Styled checkbox component
│     └─ CheckmarkIcon.js     # Green checkmark SVG
│
├─ lib/
│  └─ filterHelpers.js         # Client-side filter logic
│
└─ styles/
   └─ globals.css              # Global styles, CSS variables
```

---

## Implementation Phases

### Phase A: Component Structure (placeholder content)
1. Create all component files with basic structure
2. No real data, just hardcoded placeholders
3. Get layout working
4. Add CSS for positioning

### Phase B: Styling & Visual Polish
1. Implement CSS Modules for each component
2. Match screenshot aesthetics
3. Add color scheme, typography
4. Responsive breakpoints

### Phase C: Wire Up Existing API
1. Connect Sidebar filters to state
2. Pass filters to API (sources only for now)
3. Display real results in ListingCard components
4. Show metadata (count, timing)

### Phase D: Client-Side Filtering
1. Implement price range filtering
2. Implement condition filtering
3. Implement description filtering
4. Add filter logic in `filterHelpers.js`

### Phase E: Polish & Interactions
1. Add loading states
2. Add error handling UI
3. Add "Clear All Filters" functionality
4. URL query parameter sync
5. Mobile sidebar toggle

### Phase F: Final Touches
1. Accessibility audit
2. Cross-browser testing
3. Performance optimization (lazy loading, memoization)
4. Add subtle animations/transitions

---

## Key Design Decisions

### Checkboxes Style
- **All green when checked** (not mixed blue/green)
- Use: `✓` checkmark character or SVG icon
- Color: `--success` (#10b981)
- Unchecked/unavailable: Gray with light background

### Source Display
- Show as clickable link: `Source: {sourceName}`
- Opens in new tab (`target="_blank" rel="noopener noreferrer"`)
- Full URL visible on hover (browser tooltip)

### Title Display
- **Always bold** (font-weight: 700)
- Truncate with ellipsis if too long
- 2-line maximum on desktop, 1-line on mobile

### Image Handling
- Placeholder: Use subtle icon (image outline) on gray background
- Real images: Will be added in future phases when `hasImage` is implemented
- For now: Show placeholder or use a generic icon

---

## Mock Data for Development

Create `lib/mockData.js` with sample listings:

```javascript
export const mockListings = [
  {
    id: "1",
    source: "ss",
    sourceName: "SS.lv",
    url: "https://www.ss.lv/msg/...",
    title: "Vintage Bicycle in Great Condition",
    priceText: "150 €",
    priceValue: 150,
    currency: "EUR",
    conditionText: "Good as New",
    postedAtText: "Dec 20, 2024",
    hasDescription: true,
    hasImage: true,
  },
  {
    id: "2",
    source: "okidoki",
    sourceName: "Okidoki",
    url: "https://www.okidoki.ee/...",
    title: "MacBook Pro 2019 - Barely Used",
    priceText: "850 €",
    priceValue: 850,
    currency: "EUR",
    conditionText: "Good as New",
    postedAtText: "Dec 22, 2024",
    hasDescription: true,
    hasImage: true,
  },
  // Add 6-8 more...
];
```

---

## Success Criteria

✅ Layout matches screenshot structure  
✅ All components render with placeholder content  
✅ Sidebar filters display correctly  
✅ Listing cards show all required fields  
✅ Checkmarks are all green  
✅ Titles are bold  
✅ Source shows as clickable link  
✅ Responsive on mobile/tablet/desktop  
✅ Can toggle filters (UI only, filtering comes later)  
✅ Clean, modern aesthetic  

---

## Notes & Considerations

1. **Images:** Since we're not fetching images in MVP, use placeholder images or icons
2. **Performance:** With 100+ listings, consider virtualization (react-window) later
3. **Real-time updates:** Not in MVP, but architecture allows for it
4. **Saved searches:** UI can have placeholder button/link for future
5. **Categories:** Show in header nav but no functionality yet

---

## Next Steps (After Plan Approval)

1. Review this plan with team/stakeholders
2. Create component files with JSX structure
3. Add CSS Modules styling
4. Connect to existing API
5. Test with real data from SS.com adapter
6. Iterate based on feedback

---

**End of Frontend Plan**
