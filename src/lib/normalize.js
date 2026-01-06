/**
 * Normalizes raw adapter data to the universal Listing schema defined in SPEC.md.
 * Ensures all adapters return consistent data structures.
 */

/**
 * Normalizes a raw listing object to the Listing schema.
 * @param {object} raw - Raw listing data from adapter
 * @param {string} source - Source identifier (e.g., "ss")
 * @param {string} sourceName - Human-readable source name (e.g., "SS.lv")
 * @returns {object} - Normalized Listing object
 */
export function normalizeListing(raw, source, sourceName) {
  // Generate ID: use raw.id if available, otherwise hash source + url
  const id = raw.id || `${source}-${hashUrl(raw.url || raw.link)}`;

  const normalized = {
    // Required fields
    id,
    source,
    sourceName,
    url: raw.url || raw.link,
    title: raw.title || "",
    priceText: raw.price || raw.priceText || "",

    // Optional fields (only include if available)
    ...(raw.currency && { currency: raw.currency }),
    ...(raw.priceValue !== undefined && { priceValue: raw.priceValue }),
    ...(raw.locationText && { locationText: raw.locationText }),
    ...(raw.postedAtText && { postedAtText: raw.postedAtText }),
    ...(raw.postedAtISO && { postedAtISO: raw.postedAtISO }),
    ...(raw.conditionText && { conditionText: raw.conditionText }),
    ...(raw.hasDescription !== undefined && { hasDescription: raw.hasDescription }),
    ...(raw.hasImage !== undefined && { hasImage: raw.hasImage }),
    ...((raw.images?.[0] || raw.imageUrl) && { imageUrl: raw.images?.[0] || raw.imageUrl }),
    ...(raw.descriptionPreview && { descriptionPreview: raw.descriptionPreview }),
  };
  
  return normalized;
}

/**
 * Simple hash function for URLs to generate IDs.
 * @param {string} url
 * @returns {string}
 */
function hashUrl(url) {
  if (!url) return "unknown";
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
