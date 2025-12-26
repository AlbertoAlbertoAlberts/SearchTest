/**
 * SS.com adapter - scrapes search results from SS.lv marketplace.
 * Returns standardized Listing objects per SPEC.md schema.
 */

import * as cheerio from "cheerio";
import { fetchHtml } from "../http.js";
import { normalizeListing } from "../normalize.js";

/**
 * Builds the SS.com search URL for a given query.
 * @param {string} query - The search query
 * @returns {string} - The search results URL
 */
function buildSearchUrl(query) {
  // IMPORTANT: This URL pattern should be verified against actual SS.com search behavior
  // If this doesn't work, navigate to ss.com manually, search, and copy the actual URL pattern
  return `https://www.ss.com/en/search-result/?q=${encodeURIComponent(query)}`;
}

/**
 * Searches SS.com and returns normalized listings.
 * @param {string} query - The search query
 * @returns {Promise<object[]>} - Array of normalized Listing objects
 * @throws {Error} - If the request fails
 */
export async function search(query) {
  if (!query || !query.trim()) {
    throw new Error("Query is required");
  }

  const url = buildSearchUrl(query);
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const rawListings = [];

  // Extract listings from the search results page
  // NOTE: These selectors are generic and may need adjustment based on actual SS.com HTML structure
  $("a").each((_, element) => {
    const $link = $(element);
    const href = $link.attr("href");
    const title = $link.text().trim().replace(/\s+/g, " ");

    // Filter: keep only links that look like actual listings
    // Adjust these patterns based on actual SS.com URL structure
    if (!href || !title) return;
    if (href.includes("msg") || href.includes("item") || href.match(/\/\w+\/\d+\.html/)) {
      const absoluteUrl = href.startsWith("http") ? href : new URL(href, url).toString();

      rawListings.push({
        title,
        url: absoluteUrl,
        link: absoluteUrl,
        price: "", // Will be populated when we identify where prices appear in HTML
        source: "ss",
      });
    }
  });

  // Deduplicate by URL
  const seen = new Set();
  const deduplicated = rawListings.filter((listing) => {
    if (!listing.url || seen.has(listing.url)) return false;
    seen.add(listing.url);
    return true;
  });

  // Normalize to Listing schema
  return deduplicated.map((raw) =>
    normalizeListing(raw, "ss", "SS.lv")
  );
}

/**
 * Adapter configuration metadata.
 */
export const config = {
  id: "ss",
  name: "SS.lv",
  country: "LV",
  enabled: true,
};
