# Header Component Spec

## Purpose

Provide a small, well-scoped header component that exposes a search bar, a guided filter card, and active filter chips. It integrates with the existing page-level search/back-end (`performSearch`) and uses URL parameters for canonical filter state.

---

## File structure

- components/
  - Header.js            # Container component
  - Header.module.css    # Styles (CSS modules)
  - SearchBar.js         # Small, focused search input component
  - FilterCard.js        # Guided questions UI (single-question focused)
  - FilterChips.js       # Displays active filters with edit/remove actions
  - __tests__/Header.test.js

---

## Public API (props & events)

### Header props

- searchQuery?: string
- filters: Filters
- onSearch(query: string): void
- onFiltersChange(filters: Filters): void
- onFilterEdit?(filterKey: string): void
- onFilterRemove?(filterKey: string): void
- filterCardStartIndex?: number  # (optional) index of guided question to show when editing a chip
- activeQuestion?: object       # (optional) the currently shown guided question (single-question)
- activeAnswer?: string        # (optional) the currently selected answer for the active question
- hasSearched?: boolean        # whether the user has executed a search (controls showing chips and card)
- onToggleSidebar?(): void
- className?: string

### Filters shape (TypeScript-friendly)

```ts
type Filters = {
  selectedSources?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  selectedConditions?: string[];
  descriptionFilter?: 'all' | 'withDescription' | 'noDescription';
}
```

---

## Events (analytics-friendly)

- search_submitted { query }
- filter_applied { filterKey, value }
- filter_removed { filterKey }
- filter_edited { filterKey }
- search_results_shown { tookMs, totalResults }

> Note: these are emitted via callbacks (e.g. `props.onAnalyticsEvent` or a shared analytics util) and should not include any PII.

---

## Accessibility

- Search input must have `aria-label="Search"` and be reachable with Tab.
- Filter modal/slide-over must trap focus while open and support `Esc` to close.
- Filter chips must be buttons with `aria-pressed` where applicable and keyboard-accessible.
- All interactive elements require visible focus styles and sufficient color contrast.

---

## Sample usage (pages/index.js)

```jsx
import Header from '../components/Header';

function Page() {
  const [filters, setFilters] = useState({ selectedSources: ['ss'] });
  const [query, setQuery] = useState('');

  const handleSearch = (q) => {
    setQuery(q);
    // Keep URL in sync and call performSearch
    performSearch(q, filters);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    performSearch(query, newFilters);
  };

  return (
    <Header
      searchQuery={query}
      filters={filters}
      onSearch={handleSearch}
      onFiltersChange={handleFiltersChange}
    />
  );
}
```

---

## Tests (high-level)

- Unit: `SearchBar` submits `onSearch` when pressing Enter or clicking submit.
- Unit: `FilterCard` cycles questions and calls `onAnswer` with expected payloads.
- Integration: `Header` calls `onSearch` when submitting, and `onFiltersChange` when chips are added/removed/edited.
- Accessibility tests: Focus trap for mobile modal, keyboard navigation for chips and search input.

---

## Acceptance criteria

- Header compiles and renders without errors.
- Typing and submitting search triggers `onSearch` with trimmed query.
- Answering guided questions adds chips and triggers `onFiltersChange`.
- Filter chips support edit & remove and are keyboard-accessible.
- Mobile filter uses slide-over modal with focus trap and ESC handling.

---

## Estimates

- Draft + review: 1h
- Implement SearchBar + wired integration: 1–2h
- Implement FilterCard + chips: 3–5h
- Styling & accessibility: 2–3h
- Tests & docs: 1–2h

---

## Next steps

1. Confirm the props/event names and Filters shape.
2. Implement `SearchBar` and wire it to `pages/index.js` (Phase 1).
3. Implement `FilterCard` and `FilterChips` (Phase 2).

---

*Spec created by GitHub Copilot using Raptor mini (Preview).*