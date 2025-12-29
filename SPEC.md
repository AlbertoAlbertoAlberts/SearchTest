# MVP spec (Phase 0)

## Listing schema (universal)
Every site adapter must return an array of Listing objects with the following shape.
Adapters should extract as much as possible from **search result pages**, but may optionally enrich from listing pages if cheap and reliable.

{
  id: string,               // unique per source (hash of source + listingId or URL)
  source: string,           // machine id: "ss", "andele", "tori", etc.
  sourceName: string,       // human readable: "SS.lv", "Andele Mandele", etc.
  url: string,              // absolute URL to the listing detail page

  title: string,            // listing title
  description: string,      // full description text (raw)
  descriptionPreview: string, // truncated preview (e.g. first 120–200 chars)

  priceText: string,        // raw price text, e.g. "150 €", "€150", "Dogovor"
  currency?: string,        // parsed currency if detectable
  priceValue?: number,      // parsed numeric price if available

  imageUrl?: string,        // first image URL (thumbnail-sized if possible)
  hasImage: boolean,        // whether listing has at least one image

  conditionText?: string,   // normalized if possible: "new", "like new", "used", etc.
  locationText?: string,    // city / region if available

  postedAtText?: string,    // raw posted date string from site
  postedAtISO?: string,     // ISO date if parseable (preferred)

  qualityScore?: number,    // computed score (0–100) representing listing completeness
  qualityFlags?: string[]   // e.g. ["no_image","no_description","no_condition","no_date"]

}

## Data completeness & quality scoring (MVP)

Listings may have missing fields depending on what each marketplace exposes.
Missing data MUST NOT break the pipeline.

### Missing field rules
- If a field is not available on the source site, set it to null or an empty string.
- hasImage must be false if no image is available.
- priceText is required; priceValue may be null.
- description, conditionText, postedAtISO are optional.

### Quality scoring (v1 heuristic)
Each listing should receive a qualityScore (0–100) based on available data.
This score is used for ranking and optional filtering, not hard exclusion.

Suggested penalties:
- Missing image: −40 points
- Missing description: −25 points
- Missing condition: −15 points
- Missing posted date: −10 points

qualityFlags should record which penalties were applied.

### Default behavior
- All listings are included by default.
- Higher-quality listings are ranked first within the selected sort.
- Low-quality listings may be hidden only when an explicit UI option is enabled
  (e.g. “Include low-detail results” or “Extended search”).

## API response shape
GET /api/search?q=...&sources=ss,andele returns:

{
  query: string,
  sources: string[],
  tookMs: number,
  errors: { source: string, message: string }[],
  items: Listing[]
}


## MVP filters
- sources: multi-select (required)
- country: optional (derived from source)
- priceMin, priceMax: optional (only for items with priceValue)
- sort: "relevance" | "newest" | "price_asc" | "price_desc"

## MVP limitations
- Primary data should be extracted from search result pages where possible
- Listing detail pages may be fetched selectively when required data is missing (e.g. description, condition, image)
- Scraping must remain lightweight and respectful (rate limits, minimal requests)

## Source-side filtering, paging, and merge strategy (MVP)

The aggregator should minimize scraping volume by reusing each marketplace’s own filtering/sorting where available,
then merging a limited set of results locally.

### Source-side mirroring
When the user selects filters/sort on our site, we should mirror them on each source site whenever the source supports it:
- sort: price_asc / price_desc (preferred default: price_asc)
- priceMin / priceMax (when supported)
- category constraints (when supported)

If a source does not support a filter, the filter may be applied locally after normalization.

### Two-step fetch per source
For each selected source, the adapter should support a lightweight two-step strategy:

1) Count step (cheap)
- Fetch the source’s total result count for the query+filters (if the site exposes it).
- Use this to compute and display the overall total across all selected sources.

2) Page step (limited)
- Fetch only the first page (or first N results) from the source using mirrored filters/sort.
- Extract minimal fields needed to rank candidates:
  - url, title, priceText/priceValue/currency, hasImage, postedAt* if available
- This creates a candidate pool across sources without scraping hundreds of items.

### Global merge & pagination
We build a global result list by merging candidates from all sources:

- Each UI page shows 20 items.
- To build page 1, fetch page 1 from each source and merge-sort globally (e.g. by price).
- Return only the top 20 items to the UI.

### Prefetching (optional, MVP-friendly)
To improve UX, the backend may also prefetch enough candidates to fill the next page:
- While serving page 1, also prepare page 2 candidates if cheap.
- This should remain bounded by caps below.

### Incremental fetching for later pages
When the user goes to page 2/3/…:
- Reuse cached candidates when available.
- If there are not enough candidates to fill the requested page, fetch the next page from only the sources
  most likely to contribute (e.g. those already producing low-priced items), then merge again.

This avoids fetching “everything” upfront while still allowing deep paging.

### Caps and truncation
To protect both our server and source sites, enforce caps:
- maxPagesPerSource (suggested: 3 for MVP)
- maxCandidatesPerSource (suggested: 150)
- maxCandidatesTotal (suggested: 500)
If caps are hit, the response should indicate truncation (e.g. truncated=true) so the UI can show a note.

### Source capability configuration (in code)
Do NOT hardcode URL templates in this spec.
Each source should have a config/capabilities entry in code (e.g. `lib/sources.js`) that declares:
- supportsSortPrice, supportsPriceRange, supportsCategories
- pageSize
- buildSearchUrl() / buildCountUrl() logic

## Sources planned (MVP)
Latvia:
- SS.lv — https://www.ss.lv
- Andele Mandele — https://www.andelemandele.lv
- PP.lv — https://www.pp.lv

Estonia:
- Osta — https://www.osta.ee
- Okidoki — https://www.okidoki.ee
- Soov — https://www.soov.ee

Lithuania:
- Skelbiu — https://www.skelbiu.lt
- Vinted LT — https://www.vinted.lt
- Autoplius (optional later) — https://www.autoplius.lt

Finland:
- Tori — https://www.tori.fi
- Huuto — https://www.huuto.net
- Oikotie (optional later) — https://www.oikotie.fi

Poland:
- OLX — https://www.olx.pl
- Allegro Lokalnie — https://allegrolokalnie.pl
- Sprzedajemy — https://sprzedajemy.pl