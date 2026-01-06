# UI Redesign Plan - Clean Search Interface

## Goal
Transform the current search page into a clean, centered, guided experience matching the reference design.

**Reference Design Features:**
- Large, centered search bar
- Guided filter questions (one at a time) below search
- Inline filter chips for active filters
- Clean white background with minimal chrome
- Card-based results layout
- Simple, focused user flow

---

## Current State vs Target State

### Current State
- Header with logo, nav links, search
- Sidebar for filters (desktop)
- Results in grid layout
- Multiple filter types shown at once

### Target State
- **Centered search bar** (hero-style, prominent)
- **Single guided question** below search (progressive disclosure)
- **Inline filter chips** (small, removable)
- **Minimal header** or no header
- **Focused search experience** (search → filter → results)
- **White, spacious layout**

---

## Phase 1: Simplify Header & Center Search

**Goal:** Remove navigation clutter, make search the hero

### Tasks:
1. **Remove/Hide Navigation Links**
   - Remove "Browse", "Categories", "Saved" nav (Phase 1 doesn't need them)
   - Keep logo but make it smaller/less prominent
   - Option: Hide logo entirely and use just text

2. **Center Search Bar**
   - Move search from header to page center
   - Increase search input size (larger padding, font)
   - Add subtle shadow/border for emphasis
   - Position above guided questions

3. **Update Header Component**
   - Simplify to: Logo (optional) + Mobile Menu (if needed)
   - Or remove header entirely for clean slate
   - Keep sticky behavior for results view only

### Files to Edit:
- `src/components/Header.js`
- `src/components/Header.module.css`
- `src/pages/index.js`
- `src/styles/globals.css`

### Acceptance Criteria:
- [ ] Search bar is centered and prominent
- [ ] No distracting navigation elements
- [ ] Mobile still has access to filters (hamburger)
- [ ] Logo present but subtle (or removed)

**Estimated Time:** 2-3 hours

---

## Phase 2: Implement Guided Filter Questions

**Goal:** Show one filter question at a time below search bar

### Tasks:
1. **Question Visibility Logic**
   - Show first question automatically after search
   - Display question in centered card below search
   - Options displayed as rounded button pills

2. **Answer Selection Flow**
   - Click option → applies filter → shows next question
   - "Skip" button advances to next question
   - After all questions, focus moves to results

3. **Question Set Design**
   ```javascript
   const guidedQuestions = [
     {
       id: 'condition',
       text: 'What condition works for you?',
       options: ['Any', 'Like New', 'Excellent', 'Good', 'Fair'],
       filterKey: 'selectedConditions'
     },
     {
       id: 'price',
       text: 'What\'s your budget?',
       options: ['Any', 'Under €50', '€50-€100', '€100-€200', 'Over €200'],
       filterKey: 'priceRange'
     },
     {
       id: 'source',
       text: 'Which sites should we search?',
       options: ['All', 'SS.lv', 'Andele', 'Osta.ee'],
       filterKey: 'selectedSources'
     }
   ];
   ```

4. **Update FilterCard Component**
   - Match button styling (rounded pills, hover states)
   - Add skip button styling
   - Ensure responsive layout

### Files to Edit:
- `src/components/FilterCard.js`
- `src/components/FilterCard.module.css` (create if needed)
- `src/pages/index.js` (question sequencing logic)
- `src/lib/filterHelpers.js` (map answers to filter values)

### Acceptance Criteria:
- [ ] One question shown at a time
- [ ] Options styled as rounded pills
- [ ] Skip advances to next question
- [ ] Selection applies filter and advances
- [ ] Questions disappear when all answered

**Estimated Time:** 4-6 hours

---

## Phase 3: Inline Filter Chips

**Goal:** Display active filters as small, removable chips

### Tasks:
1. **Chip Positioning**
   - Place chips below search bar, above guided questions
   - Or place between guided question and results
   - Horizontal row with wrap

2. **Chip Styling**
   - Dark background (black or dark gray)
   - White text
   - Small × close button
   - Rounded corners
   - Compact size (not too large)

3. **Chip Interaction**
   - Click × to remove filter
   - Click chip body to edit (optional)
   - Smooth fade-in/out animation

4. **Update FilterChips Component**
   ```jsx
   // Example chip
   <div className={styles.chip}>
     <span>Apple</span>
     <button onClick={() => onRemove('brand')}>×</button>
   </div>
   ```

### Files to Edit:
- `src/components/FilterChips.js`
- `src/components/FilterChips.module.css` (or create)
- `src/pages/index.js`

### Acceptance Criteria:
- [ ] Chips appear when filters active
- [ ] Styled as dark, compact pills
- [ ] Remove action works correctly
- [ ] Responsive (wrap on mobile)

**Estimated Time:** 2-3 hours

---

## Phase 4: Clean Results Layout

**Goal:** Card-based results with consistent spacing and styling

### Tasks:
1. **Results Container Styling**
   - Center-aligned container
   - Max-width constraint (e.g., 1200px)
   - White background with subtle shadows on cards
   - Clean spacing between cards

2. **Listing Card Updates**
   - Match reference: image on left, details on right (or stacked)
   - Consistent padding and spacing
   - Subtle hover effect
   - Remove any excessive borders

3. **Results Count**
   - Display "X listings found" above results
   - Centered, subtle gray text
   - Small font size

4. **Loading States**
   - Use existing SkeletonCard
   - Ensure skeleton matches card layout

### Files to Edit:
- `src/components/ResultsView.js`
- `src/components/ResultsView.module.css`
- `src/components/ListingCard.js`
- `src/components/ListingCard.module.css`

### Acceptance Criteria:
- [ ] Cards have consistent layout
- [ ] Results count displayed clearly
- [ ] Clean spacing and alignment
- [ ] Hover states work smoothly

**Estimated Time:** 3-4 hours

---

## Phase 5: Interaction Flow & Animations

**Goal:** Smooth transitions and logical user flow

### Tasks:
1. **Search Submission Flow**
   - Search bar → loading indicator
   - Fade in first guided question
   - Smooth scroll to questions

2. **Filter Application Flow**
   - Answer option → fade out question
   - Show chip with slide-in animation
   - Fade in next question (if any)
   - If last question, scroll to results

3. **Results Appearance**
   - Fade in results container
   - Stagger card appearance (optional)
   - Results count animates in

4. **State Transitions**
   - Empty state (before search)
   - Loading state (during search)
   - Results state (with filters)
   - No results state

### Files to Edit:
- `src/pages/index.js` (orchestration)
- `src/styles/globals.css` (animation keyframes)
- All component CSS files (transition properties)

### Acceptance Criteria:
- [ ] Smooth transitions between states
- [ ] No jarring layout shifts
- [ ] Loading states feel responsive
- [ ] Animations are subtle and professional

**Estimated Time:** 3-5 hours

---

## Phase 6: Mobile Optimization

**Goal:** Ensure clean experience on mobile devices

### Tasks:
1. **Search Bar Responsiveness**
   - Full width on mobile with margin
   - Appropriate font size (at least 16px to prevent zoom)
   - Touch-friendly hit areas

2. **Guided Questions on Mobile**
   - Stack options vertically or wrap
   - Ensure buttons are finger-sized (min 44px)
   - Skip button clearly visible

3. **Filter Chips on Mobile**
   - Wrap to multiple rows if needed
   - Adequate spacing between chips
   - Easy to tap × button

4. **Results Cards on Mobile**
   - Single column layout
   - Stack image and content vertically
   - Optimize image loading

### Files to Edit:
- All component CSS files (media queries)
- `src/components/SearchBar.module.css`
- `src/components/FilterCard.module.css`

### Acceptance Criteria:
- [ ] Works well on 375px width (iPhone SE)
- [ ] No horizontal scrolling
- [ ] Touch targets are appropriate size
- [ ] Text is readable without zoom

**Estimated Time:** 2-4 hours

---

## Phase 7: Polish & Refinements

**Goal:** Match reference design aesthetics exactly

### Tasks:
1. **Color Palette Refinement**
   - Update CSS variables to match reference
   - Likely: white background, dark text, subtle grays
   - Blue accent for interactive elements

2. **Typography**
   - Font weights and sizes to match
   - Line heights for readability
   - Letter spacing adjustments

3. **Spacing System**
   - Consistent padding/margin scale
   - Vertical rhythm
   - Comfortable whitespace

4. **Button Styling**
   - Match rounded corners
   - Hover/active states
   - Focus indicators

5. **Shadow & Borders**
   - Subtle shadows on cards
   - Border radius consistency
   - Border colors and weights

### Files to Edit:
- `src/styles/globals.css` (design tokens)
- All component CSS files

### Acceptance Criteria:
- [ ] Visual design matches reference closely
- [ ] Consistent spacing throughout
- [ ] Professional, polished appearance

**Estimated Time:** 2-3 hours

---

## Optional Enhancements

### A. Empty State Design
- Illustration or icon before search
- Sample searches or categories
- Friendly messaging

### B. Advanced Filter Access
- "More filters" link to open sidebar/modal
- For power users who want all filters at once

### C. Search Suggestions
- Autocomplete based on popular searches
- Recent searches (local storage)

### D. Filter Presets
- "Like New Only"
- "Budget Friendly"
- Quick access to common combinations

---

## Implementation Order

### Sprint 1 (Week 1)
- Phase 1: Simplify Header & Center Search
- Phase 2: Guided Filter Questions
- Phase 3: Inline Filter Chips

### Sprint 2 (Week 2)
- Phase 4: Clean Results Layout
- Phase 5: Interaction Flow & Animations
- Phase 6: Mobile Optimization

### Sprint 3 (Polish)
- Phase 7: Polish & Refinements
- Testing & bug fixes
- Accessibility audit

---

## Design Tokens to Define

```css
/* src/styles/globals.css */

:root {
  /* Colors */
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-primary: #2563eb;
  --color-border: #e5e7eb;
  
  /* Chip colors */
  --chip-bg: #1f2937;
  --chip-text: #ffffff;
  
  /* Spacing scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* Typography */
  --font-base: 15px;
  --font-lg: 17px;
  --font-xl: 20px;
  --line-height: 1.6;
}
```

---

## Key Architectural Decisions

### 1. **Guided vs. Advanced Filtering**
- **Decision:** Start with guided, add "advanced" toggle later
- **Rationale:** Simpler for most users, progressive disclosure
- **Trade-off:** Power users may want all filters at once

### 2. **State Management**
- **Decision:** Keep URL as source of truth
- **Rationale:** Shareable links, browser back/forward works
- **Implementation:** Update URL on each filter change

### 3. **Question Sequencing**
- **Decision:** Linear flow (condition → price → source)
- **Rationale:** Most common filter priorities
- **Future:** Allow skipping entire flow or randomize based on query

### 4. **Filter Chip Placement**
- **Decision:** Between search and questions
- **Rationale:** Visual feedback of what's active
- **Alternative:** Could go below questions, above results

---

## Success Metrics

After implementation, measure:
- **User Engagement:** % who use guided filters vs. typing only
- **Conversion:** % who click through to listings
- **Time to Result:** How fast users find what they want
- **Mobile Usage:** Mobile vs. desktop traffic patterns
- **Filter Usage:** Which questions are answered vs. skipped

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users skip all questions | Medium | Make "Any" default, allow quick skip |
| Too many questions | High | Limit to 3-4 max, make optional |
| Mobile performance | Medium | Lazy load results, optimize images |
| Breaking existing functionality | High | Keep sidebar filters as fallback |
| Accessibility regression | High | Test with screen readers at each phase |

---

## Rollback Plan

- Keep current UI as "classic view" toggle
- A/B test new design with % of users
- Monitor analytics before full rollout
- Easy switch back if metrics decline

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Create mockup** in Figma (optional but recommended)
3. **Set up design tokens** in globals.css
4. **Start Phase 1** - simplify header
5. **Iterate** - test each phase before moving forward

---

*Total Estimated Time: 18-28 hours of development + testing*
