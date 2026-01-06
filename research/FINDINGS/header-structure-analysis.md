# Header Component Structure Analysis

## Overview

The Header is the main navigation and search component that sits at the top of the application. It orchestrates the search experience, filter management, and navigation elements.

---

## File Components

### 1. Header.js (Main Component)
**Location:** `src/components/Header.js`

#### What's There:
- **Hamburger Menu Button** - Toggle for sidebar (mobile-responsive)
- **Logo/Brand** - "Second-Hand Market Finder" text
- **SearchBar Integration** - Reusable search input component
- **Navigation Links** - Browse, Categories, Saved (placeholders)
- **FilterChips Container** - Shows active filters below header
- **FilterCard Container** - Guided question-based filtering

#### Why:
- **Centralized Search Entry Point** - Users start their marketplace search here
- **Filter Visibility** - Active filters shown as removable chips for transparency
- **Responsive Design** - Hamburger menu for mobile, full nav for desktop
- **Accessibility** - Skip link for keyboard navigation to main content
- **Guided Experience** - Optional question-based filter card to help users refine searches

---

### 2. Header.module.css (Styles)
**Location:** `src/components/Header.module.css`

#### Key Styling Features:

| Element | Purpose |
|---------|---------|
| `.header` | Sticky positioning (stays visible on scroll), white background, subtle shadow |
| `.skipLink` | Accessibility - hidden link that appears on keyboard focus to skip to content |
| `.visuallyHidden` | Screen reader text (accessible but invisible) |
| `.menuButton` | Hamburger icon for mobile sidebar toggle |
| `.logo` | Brand identity with primary blue color (#2563eb) |
| `.container` | Flexbox layout with max-width 1440px for content centering |
| `.chipsContainer` | Holds active filter chips below the search bar |
| `.filterCardContainer` | Container for guided filter questions |

#### Why:
- **Sticky Header** - Always accessible while scrolling through results
- **Accessibility First** - Skip links, visually hidden text for screen readers
- **Responsive Breakpoints** - `@media (max-width: 1024px)` for mobile layout
- **Design System Integration** - Uses CSS variables (`--primary`, `--bg-white`, etc.)
- **Professional Polish** - Smooth transitions, hover states, active states

---

### 3. Header.spec.md (Specification Document)
**Location:** `src/components/Header.spec.md`

#### What's Documented:

**Props Interface:**
```typescript
{
  searchQuery?: string
  sidebarOpen: boolean
  onToggleSidebar(): void
  activeFilters: Array
  onFilterEdit(key): void
  onFilterRemove(key): void
  questions: Array
  activeQuestion: object
  activeAnswer: string
  onGuidedAnswer(): void
  onGuidedSkip(): void
  onGuidedComplete(): void
  filterCardStartIndex: number
  guidedOpen: boolean
  hasSearched: boolean
}
```

**Filter Data Shape:**
```typescript
{
  selectedSources?: string[]
  minPrice?: number | null
  maxPrice?: number | null
  selectedConditions?: string[]
  descriptionFilter?: 'all' | 'withDescription' | 'noDescription'
}
```

**Analytics Events:**
- `search_submitted { query }`
- `filter_applied { filterKey, value }`
- `filter_removed { filterKey }`
- `filter_edited { filterKey }`

**Accessibility Requirements:**
- Search input with `aria-label`
- Filter chips with `aria-pressed`
- Focus trap for mobile modal
- ESC key to close
- Keyboard navigation

#### Why This Spec Exists:
- **Developer Onboarding** - Clear contract for how to use the component
- **Type Safety** - Even without TypeScript, documents expected shapes
- **Accessibility Compliance** - Ensures WCAG standards are met
- **Analytics Tracking** - Defines what user actions should be tracked
- **Testing Blueprint** - Lists acceptance criteria and test scenarios

---

## Architecture Decisions

### 1. **Why Separate SearchBar Component?**
- **Reusability** - Can be used in header, mobile view, or future search pages
- **Single Responsibility** - Header orchestrates, SearchBar handles input
- **Testing** - Easier to test search input logic in isolation

### 2. **Why FilterChips Below Header?**
- **Visual Hierarchy** - Users see what filters are active before results
- **Edit/Remove Actions** - Quick access to modify search without sidebar
- **Desktop Experience** - Horizontal space utilization

### 3. **Why Guided FilterCard?**
- **Progressive Disclosure** - One question at a time reduces cognitive load
- **Onboarding** - Helps new users understand available filters
- **Mobile-Friendly** - Step-by-step works better on small screens

### 4. **Why Sticky Positioning?**
- **Search Refinement** - Users can modify search while viewing results
- **Navigation Access** - Logo and menu always accessible
- **Industry Standard** - Common pattern in e-commerce and aggregators

### 5. **Why Hamburger Menu for Sidebar?**
- **Mobile First** - Conserves screen space on phones/tablets
- **Progressive Enhancement** - Full sidebar on desktop, slide-over on mobile
- **Accessibility** - `aria-expanded` announces state to screen readers

---

## Component Hierarchy

```
Header
├─── Skip Link (accessibility)
├─── Container
│    ├─── Menu Button (hamburger)
│    ├─── Logo
│    ├─── SearchBar (imported component)
│    └─── Nav Links (Browse, Categories, Saved)
├─── FilterChips Container
│    └─── FilterChips (imported component)
└─── FilterCard Container
     └─── FilterCard (imported component - guided questions)
```

---

## Data Flow

```
User Action (Header) → Event Handler → Parent Page (index.js)
                                            ↓
                                       URL Update
                                            ↓
                                       API Call
                                            ↓
                                    Results + Filters
                                            ↓
                                  Header Re-renders
```

**Example Flow:**
1. User types "laptop" → calls `onSearch(query)`
2. Parent updates URL (`?q=laptop`)
3. Parent calls `/api/search?q=laptop`
4. Results rendered, `hasSearched=true`
5. Header shows FilterChips
6. User clicks price filter → `onFilterEdit('price')`
7. FilterCard opens with price question
8. User answers → `onGuidedAnswer({ minPrice: 100 })`
9. Parent updates URL (`?q=laptop&minPrice=100`)
10. API called again with price filter

---

## Current State & Future Enhancements

### ✅ Implemented:
- Sticky header with responsive layout
- Search input integration
- Filter chips display
- Guided filter card (single question)
- Accessibility features (skip link, aria labels)
- Mobile hamburger menu

### 🚧 Placeholder (Not Functional):
- **Navigation Links** - "Browse", "Categories", "Saved" don't link anywhere yet
- **Logo Click** - Doesn't redirect to home
- **Advanced Filters** - Only basic guided questions implemented

### 🔮 Future Considerations:
- **User Account Menu** - Login/profile dropdown
- **Notification Badge** - For saved search alerts (Phase 4)
- **Quick Filters** - Popular searches or categories
- **Search History** - Recent searches dropdown
- **Multi-Language** - Language selector in header

---

## Integration Points

### With SearchBar:
- Receives `initialQuery` prop
- Calls parent's `onSearch` callback

### With FilterChips:
- Receives `activeFilters` array
- Calls `onEdit` and `onRemove` callbacks

### With FilterCard:
- Receives single `activeQuestion` and `activeAnswer`
- Calls `onGuidedAnswer`, `onGuidedSkip`, `onGuidedComplete`

### With Sidebar:
- `onToggleSidebar` controls mobile slide-over
- `sidebarOpen` state managed by parent

### With Page (index.js):
- Header is presentational
- Parent manages all state (query, filters, results)
- Parent syncs with URL parameters
- Parent calls API

---

## Performance Considerations

### Why No State in Header?
- **Controlled Component** - Parent owns truth (URL)
- **Server-Side Rendering** - URL as canonical state enables SSR
- **Browser Back/Forward** - URL changes trigger correct state
- **Shareable Links** - Full search state in URL

### Sticky Header Impact:
- **z-index: 100** - Stays above content
- **Box shadow** - Minimal performance impact
- **Fixed max-width** - Prevents layout shift

---

## Styling Philosophy

### CSS Modules:
- **Local Scoping** - `.header` doesn't conflict with other components
- **Type Safety** - Import errors caught at build time
- **Co-location** - Styles near component code

### Design Tokens:
- Uses CSS variables (`--primary`, `--bg-white`, `--border`)
- Defined in `globals.css`
- Enables theme switching in future

### Responsive Strategy:
- **Desktop First** - Full layout, then hide/adapt for mobile
- **1024px Breakpoint** - Tablet/laptop transition
- **Flexbox** - Self-adjusting layout

---

## Accessibility Compliance

✅ **WCAG 2.1 AA Standards Met:**

| Criterion | Implementation |
|-----------|----------------|
| Keyboard Navigation | All buttons focusable, logical tab order |
| Screen Reader Support | `aria-label`, `aria-expanded`, visually hidden text |
| Skip Links | Bypass repetitive navigation |
| Color Contrast | Tested against WCAG minimums |
| Focus Indicators | Visible focus styles on all interactive elements |

---

## Summary

The Header is a **well-architected, accessible, and responsive** component that serves as the primary entry point for search and filtering. It delegates to specialized sub-components (SearchBar, FilterChips, FilterCard) while maintaining a clean separation of concerns. The specification document ensures consistency, and the styling follows modern best practices with CSS modules and design tokens.

**Key Strengths:**
- Clear component boundaries
- Accessibility-first design
- Mobile-responsive
- Well-documented
- State management delegated to parent

**Areas for Future Work:**
- Make navigation links functional
- Add user authentication UI
- Implement notification system
- Enhance filter types
