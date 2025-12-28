# MVP spec (Phase 0)

## Listing schema (universal)
Every site adapter must return an array of:

{
  id: string,            // unique inside a source, or a hash of source+url
  source: string,        // "ss", "andele", "tori", etc.
  sourceName: string,    // "SS.lv", "Andele Mandele", ...
  url: string,           // absolute URL to listing on source site

  title: string,         // listing title from search results page
  priceText: string,     // raw, e.g. "150 €", "€150", "150 EUR", "Dogovor"
  currency?: string,     // optional, if parseable
  priceValue?: number,   // optional, if parseable

  locationText?: string, // optional, if available on list page
  postedAtText?: string, // optional, if available on list page
  postedAtISO?: string,  // optional, ISO date if parseable

  conditionText?: string,// optional (only if structured)
  hasDescription?: boolean, // optional
  hasImage?: boolean,       // optional (we don't show images, but can detect)
  imageUrl?: string         // optional, first image URL
}

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
- Only parse from search result pages (no listing detail pages in v1)
- No images are fetched or shown
- No description text is copied


## Sources planned (MVP)
Latvia: ss, andele, pp
Estonia: okidoki, osta, soov
Lithuania: skelbiu, vinted_lt, autoplius (optional later)
Finland: tori, huuto, oikotie (optional later)
Poland: olx, allegrolokalnie, sprzedajemy