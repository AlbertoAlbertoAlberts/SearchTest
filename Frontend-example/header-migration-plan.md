# Header Migration Plan — import header and search features from Frontend-example → main site 🚀

## Summary

**Goal:** Implement the header and its features from `Frontend-example` into the main project UI (`pages/index.js` and `components/`). This includes the compact header with search bar, guided filtering card, and active filter chips. The Q/A items are placeholders and should be filled during discovery.

---

## What we will copy/adapt from `Frontend-example`

- Search bar component (`src/components/SearchBar.tsx`) — keyboard-friendly, accessible input and submit button.
- Guided filtering card (`FilterCard`) behavior (one question at a time, skip/edit, collect answers) — UX for narrowing results.
- Active filter chips with edit/remove actions.
- ResultsCount and ListingsGrid integration (how filters affect results count and blurring behavior).
- Responsive, mobile-first layout and styles from Tailwind-style utility classes (we’ll convert to CSS modules / project styles).

---

## Implementation approach (high-level)

1. **Analyze** `Frontend-example` header components and extract the exact behaviors (animations, timeouts, keyboard interactions).
2. **Design** a small Header component API: props and events (onSearch, onFilterChange, onEditFilter, onRemoveFilter). Add a thin adapter to connect with existing state in `pages/index.js`.
3. **Implement** components in `components/` (SearchBar, FilterCard, FilterChips, Header container). Avoid copying Tailwind utilities if not used in main project — prefer project CSS modules (`Header.module.css`).
4. **Integrate**: replace header area in `pages/index.js` (or `components/Header.js`) with the new Header component and wire to existing `performSearch` and `filters` state.
5. **Test & QA**: unit tests, integration tests for search flow and accessibility checks.
6. **Document** the changes and add a demo page (or story) showing the header behavior with mock data.

---

## Detailed tasks (developer-friendly) ✅

1. Analyze example header (files to read):
   - `Frontend-example/src/App.tsx` (search + filter flow)
   - `Frontend-example/src/components/SearchBar.tsx`
   - `Frontend-example/src/components/FilterCard.tsx` (if present)
   - `Frontend-example/src/components/*` (UI helpers used by header)

2. Design new components and file map:
   - `components/Header.js` (container)
   - `components/SearchBar.js` (ported/adapted)
   - `components/FilterCard.js` (guided filter UI)
   - `components/FilterChips.js` (active filters display)
   - `components/Header.module.css` (styling)

3. Implement ported components (scope & rules):
   - Keep logic same but refactor to use existing project style and state management (hooks + props).
   - Provide accessible markup: `role`, `aria-*`, labels, focus management.
   - Add `data-testid` hooks for tests.

4. Integration & behavior:
   - Hook `onSearch` to call existing `performSearch()` (maintain current API query params: `q`, `minPrice`, `maxPrice`, `sortBy`).
   - Keep Phase 1 quick scan behavior unchanged — header only modifies API input.
   - Implement `answers` state inside header (or lift to `pages/index.js`) — **decision placeholder**: "lift state to page" vs "localize in Header".

5. Styling & responsive:
   - Mobile-first layout, collapse filter card into a modal on small screens (placeholder).
   - Ensure header remains compact, slim vertical spacing.

6. Tests & accessibility:
   - Unit tests for `SearchBar` and `FilterCard` actions
   - Integration test simulating search + guided answers + removal of filter chip
   - Accessibility checks: keyboard navigation, color contrast

7. Docs / Demo:
   - Add `docs/header-migration-plan.md` (this file)
   - Add a `/demo/header` page or Storybook story that shows the header with mock data

---

## Q/A placeholders (to be filled during discovery) ❓

- Q: Which filters must be stored in the URL?  
  A: [ANSWER_PLACEHOLDER]

- Q: Should guided filter answers be persisted per-session or per-query?  
  A: [ANSWER_PLACEHOLDER]

- Q: Do we want to reuse Tailwind classes or translate to CSS modules?  
  A: [ANSWER_PLACEHOLDER]

- Q: What's the mobile behavior for the filter card? slide-over / modal / inline?  
  A: [ANSWER_PLACEHOLDER]

- Q: Are there analytics events required (search, filter applied, filter removed)?  
  A: [ANSWER_PLACEHOLDER]

---

## Acceptance criteria & tests ✅

- Header compiles and renders without errors.
- Typing in the search bar and submitting triggers `performSearch` with correct `q` param.
- Guided filter card steps through questions; answers appear as chips and can be edited/removed.
- ResultsCount reflects filter changes and ListingsGrid updates accordingly.
- Keyboard accessibility: tab order, Enter to submit, Esc to exit edit mode.
- Basic responsive behavior: on narrow view, header remains usable and layout does not break.
- Unit and integration tests added and passing.

---

## Estimates (rough)

- Analysis & design: 1–2 dev hours  
- Component implementation: 4–8 dev hours  
- Integration & styling: 3–5 dev hours  
- Tests & accessibility: 2–4 dev hours  
- Docs & demo: 1–2 dev hours

---

## Risks & notes ⚠️

- If the main project uses a different styling approach, translating Tailwind utilities may take time.
- Decide early where filter state lives (Header vs page-level) to avoid rework.
- Keep the header stateless where possible and pass event handlers down for easier testing.

---

## Next steps

1. Confirm the answers to the Q/A placeholders.  
2. Pick where filter state is kept (page vs header).  
3. Start implementation tasks (see TODO list).

---

## Phased implementation plan (recommended)

**Short answer:** implement in phases to reduce risk and get value fast. Below are the recommended phases with rough estimates.

- **Phase 0 — Discovery & decisions (0.5–1h)**
  - Fill Q/A placeholders (URL persistence, state ownership, styling approach, mobile behavior, analytics).
  - Acceptance: decisions documented and shared.

- **Phase 1 — SearchBar + integration (1–2h)**
  - Port `SearchBar` into `components/`, wire `onSearch` → `performSearch` and ensure submit triggers API call and UI loading state.
  - Tests: unit for submit; integration: searching triggers API call.
  - Acceptance: typing + submit triggers API and UI shows results.

- **Phase 2 — FilterCard (guided flow) + FilterChips (3–5h)**
  - Implement guided questions flow, chip creation, edit/remove handlers. Lift state to page-level (recommended) and implement handlers that call `performSearch`.
  - Tests: question flow, chip edit/remove behavior.
  - Acceptance: answers appear as chips and adjust results.

- **Phase 3 — Styling & responsive polish (2–4h)**
  - Add `Header.module.css`, implement mobile behavior (modal/slide-over), ensure keyboard accessibility and visual polish.
  - Acceptance: passes basic a11y checks and responsive verification.

- **Phase 4 — Tests, docs & demo (1–2h)**
  - Add unit/integration tests, demo page or Storybook story, and update docs.
  - Acceptance: tests pass and demo available.

- **Phase 5 — Review & release (1–2h)**
  - Code review, address feedback, smoke-test in staging, monitor after merge.
  - Acceptance: merged and verified in staging.

**Recommendation:** Start with Phase 1 (SearchBar) to deliver immediate value and keep each PR small and reviewable. Proceed to Phase 2 after Phase 1 passes tests and integration checks.

---

> **Notes**: Replace placeholder Q/A answers during the discovery meeting. This plan is intentionally conservative and focused on a minimal, testable implementation first, then iterate for polish.
