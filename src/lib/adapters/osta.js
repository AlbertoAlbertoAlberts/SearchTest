/**
 * Osta.ee adapter - scrapes search results from Osta.ee marketplace (Estonia).
 * Returns standardized Listing objects per SPEC.md schema.
 * 
 * IMPORTANT: Osta.ee uses Cloudflare protection, requiring Puppeteer for all requests.
 * Uses two-phase search architecture similar to Andele adapter:
 * - Phase 1: Fast price scanning across multiple pages (scanPrices)
 * - Phase 2: Detail enrichment for current page only (enrichDetails)
 */

import * as cheerio from "cheerio";
import { fetchWithBrowser } from "../browser.js";
import { normalizeListing } from "../normalize.js";
import { getDescriptionPreview } from "../textHelpers.js";

const BASE_URL = "https://www.osta.ee";

/**
 * Delay helper for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Build search URL with query and pagination
 * Note: Actual URL pattern to be determined during implementation (Step 3)
 * 
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @param {string} sortBy - Sort order (price-low, price-high)
 * @returns {string} - Search URL
 */
function buildSearchUrl(query, page = 1, sortBy = 'price-low') {
  // TODO: Verify actual URL structure with Puppeteer in Step 3
  // Possible patterns:
  // - https://www.osta.ee/search?q={query}
  // - https://www.osta.ee/otsing?q={query}
  
  let url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
  
  // Add sorting if supported (to be verified)
  if (sortBy === 'price-low') {
    url += '&sort=price_asc';
  } else if (sortBy === 'price-high') {
    url += '&sort=price_desc';
  }
  
  // Add pagination if not first page (to be verified)
  if (page > 1) {
    url += `&page=${page}`;
  }
  
  return url;
}

/**
 * Parse price text to numeric value
 * Handles Estonian formats: "45 €", "€150", "Tasuta" (free), "Kokkuleppel" (negotiable)
 * 
 * @param {string} priceText - Price text from listing
 * @returns {number} - Numeric price value (Infinity for unparseable)
 */
function parseOstaPriceValue(priceText) {
  if (!priceText || typeof priceText !== 'string') return Infinity;
  
  const text = priceText.toLowerCase().trim();
  
  // Handle free listings
  if (text.includes('free') || text.includes('tasuta')) {
    return 0;
  }
  
  // Handle negotiable price (Estonian: "kokkuleppel")
  if (text.includes('kokkuleppel') || text.includes('negotiable')) {
    return Infinity; // Sort to bottom
  }
  
  // Extract numeric value
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return Infinity;
  
  const cleaned = match[1].replace(',', '.');
  const value = parseFloat(cleaned);
  
  return isNaN(value) ? Infinity : value;
}

/**
 * Parse a single search results page
 * @param {string} html - Rendered HTML from search page
 * @param {string} baseUrl - Base URL for resolving relative URLs
 * @returns {Array} - Array of {url, priceText, priceValue, imageUrl}
 */
function parseSearchPage(html, baseUrl) {
  const $ = cheerio.load(html);
  const results = [];
  
  // TODO: Update these selectors after inspecting actual Osta.ee HTML
  // These are placeholder selectors that need verification
  const listingSelectors = [
    '.listing-item',
    '.search-result-item',
    '.ad-item',
    'article.listing',
    '[data-testid="listing"]',
  ];
  
  let listingSelector = null;
  for (const selector of listingSelectors) {
    if ($(selector).length > 0) {
      listingSelector = selector;
      console.log(`[Osta] Using selector: ${selector} (found ${$(selector).length} items)`);
      break;
    }
  }
  
  if (!listingSelector) {
    console.warn('[Osta] No listing items found on page. Selectors may need updating.');
    return results;
  }
  
  $(listingSelector).each((i, elem) => {
    try {
      const $item = $(elem);
      
      // Extract URL - try multiple possible selectors
      let url = $item.find('a[href*="/item/"]').attr('href') ||
                $item.find('a[href*="/listing/"]').attr('href') ||
                $item.find('a.listing-link').attr('href') ||
                $item.find('a').first().attr('href');
      
      if (!url) {
        return; // Skip items without URL
      }
      
      // Make URL absolute if relative
      if (url.startsWith('/')) {
        url = baseUrl + url;
      } else if (!url.startsWith('http')) {
        url = baseUrl + '/' + url;
      }
      
      // Extract price - try multiple possible selectors
      const priceText = $item.find('.price').text().trim() ||
                        $item.find('[class*="price"]').first().text().trim() ||
                        $item.find('[data-testid="price"]').text().trim() ||
                        $item.find('.listing-price').text().trim() ||
                        '';
      
      if (!priceText) {
        return; // Skip items without price
      }
      
      // Parse price value
      const priceValue = parseOstaPriceValue(priceText);
      
      // Extract image URL - try multiple possible selectors
      let imageUrl = $item.find('img').first().attr('src') ||
                     $item.find('img').first().attr('data-src') ||
                     null;
      
      // Make image URL absolute if relative
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = baseUrl + imageUrl;
      }
      
      results.push({
        url,
        priceText,
        priceValue,
        imageUrl,
        source: 'osta',
      });
      
    } catch (error) {
      console.warn('[Osta] Error parsing listing item:', error.message);
      // Continue to next item
    }
  });
  
  return results;
}

/**
 * Phase 1: Fast price scanning
 * Scans multiple search result pages to extract URL + price pairs
 * Uses Puppeteer due to Cloudflare protection
 * 
 * @param {string} query - Search query
 * @param {object} options - Scanning options
 * @param {number} options.maxResults - Maximum results to return (default: 150)
 * @param {number} options.minPrice - Minimum price filter (optional)
 * @param {number} options.maxPrice - Maximum price filter (optional)
 * @param {string} options.sortBy - Sort order (price-low, price-high)
 * @returns {Promise<Array>} - Array of {url, priceText, priceValue, imageUrl, source}
 */
export async function scanPrices(query, options = {}) {
  const {
    maxResults = 150,
    minPrice = null,
    maxPrice = null,
    sortBy = 'price-low',
  } = options;
  
  console.log(`[Osta] Starting price scan for "${query}" (max ${maxResults} results)`);
  
  const allResults = [];
  let page = 1;
  const MAX_PAGES = 10; // Safety limit
  
  try {
    while (allResults.length < maxResults && page <= MAX_PAGES) {
      console.log(`[Osta] Fetching page ${page}...`);
      
      // Build search URL
      const searchUrl = buildSearchUrl(query, page, sortBy);
      console.log(`[Osta] URL: ${searchUrl}`);
      
      // Fetch with Puppeteer (handles Cloudflare challenge)
      const html = await fetchWithBrowser(searchUrl, {
        waitFor: 3000, // Wait 3s for content to load after Cloudflare
        retries: 2,
      });
      
      // Parse the page
      const pageResults = parseSearchPage(html, BASE_URL);
      
      if (pageResults.length === 0) {
        console.log(`[Osta] No more results found on page ${page}`);
        break;
      }
      
      console.log(`[Osta] Found ${pageResults.length} items on page ${page}`);
      
      // Apply price filters locally
      const filtered = pageResults.filter(item => {
        if (minPrice !== null && item.priceValue < minPrice) return false;
        if (maxPrice !== null && item.priceValue > maxPrice) return false;
        return true;
      });
      
      allResults.push(...filtered);
      
      // Check if we have enough results
      if (allResults.length >= maxResults) {
        console.log(`[Osta] Reached maxResults limit (${maxResults})`);
        break;
      }
      
      // Polite delay before next page (respect rate limits)
      if (page < MAX_PAGES) {
        await delay(500); // 500ms delay between pages
      }
      
      page++;
    }
    
    // Trim to maxResults
    const finalResults = allResults.slice(0, maxResults);
    
    console.log(`[Osta] Price scan complete: ${finalResults.length} results`);
    return finalResults;
    
  } catch (error) {
    console.error('[Osta] Error in scanPrices:', error.message);
    
    // Return partial results if we got some before error
    if (allResults.length > 0) {
      console.log(`[Osta] Returning ${allResults.length} partial results despite error`);
      return allResults.slice(0, maxResults);
    }
    
    return []; // Return empty array, never throw
  }
}

/**
 * Phase 2: Detail enrichment
 * Fetches full details for a batch of listing URLs
 * Uses Puppeteer for detail pages (Cloudflare protection)
 * 
 * @param {string[]} urls - Array of listing URLs to enrich
 * @returns {Promise<Array>} - Array of enriched listing objects
 */
export async function enrichDetails(urls) {
  console.log(`[Osta] Enriching ${urls.length} listings...`);
  
  if (!urls || urls.length === 0) {
    return [];
  }
  
  try {
    // TODO: Implement in Step 4
    // 1. Process URLs in batches (5-8 concurrent)
    // 2. Fetch each URL with Puppeteer
    // 3. Parse with cheerio after page loads
    // 4. Extract: title, description, price, image, condition, location, postedAt
    // 5. Use Promise.allSettled for graceful failure handling
    // 6. Return enriched objects
    
    console.warn('[Osta] enrichDetails not yet implemented (Step 4)');
    return [];
    
  } catch (error) {
    console.error('[Osta] Error in enrichDetails:', error.message);
    return []; // Return empty array, never throw
  }
}

/**
 * Adapter configuration metadata
 */
export const config = {
  id: "osta",
  name: "Osta.ee",
  country: "EE",
  enabled: true,
};
