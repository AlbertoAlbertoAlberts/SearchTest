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
  // SS.com uses /en/ for English interface
  // Search results are at /en/search-result/
  return `https://www.ss.com/en/search-result/?q=${encodeURIComponent(query)}`;
}

/**
 * Fetches and parses an individual listing page to get full details.
 * @param {string} url - The listing URL
 * @returns {Promise<object>} - Object with hasDescription, fullDescription, images
 */
async function fetchListingDetails(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    // Look for description in the main content area
    // SS.com typically has descriptions in divs or table cells
    const descriptionSelectors = [
      '.msg_div_msg',           // Common SS.com description container
      '#msg_div_msg',
      'table[align="center"] td[style*="padding"]',
      '.ads_in_text',
      'td[colspan] > div',
    ];
    
    let description = '';
    for (const selector of descriptionSelectors) {
      const text = $(selector).text().trim();
      if (text && text.length > 100) { // Meaningful description (>100 chars)
        description = text;
        break;
      }
    }
    
    // Extract date from listing page
    let dateText = '';
    const dateSelectors = [
      'td:contains("Date:")',
      'td:contains("Added:")',
      '.msg_footer',
      'td[id*="date"]',
    ];
    
    for (const selector of dateSelectors) {
      const text = $(selector).text().trim();
      // Match "Date: 07.12.2025 12:44" or similar
      const dateMatch = text.match(/\d{2}\.\d{2}\.\d{4}\s*\d{1,2}:\d{2}/);
      if (dateMatch) {
        dateText = dateMatch[0];
        break;
      }
    }
    
    // Extract images - try multiple strategies
    const images = [];
    
    // Strategy 1: Look for images with /msg/ in src
    $('img[src*="/msg/"]').each((_, img) => {
      const src = $(img).attr('src');
      if (src && !src.includes('nophoto')) {
        images.push(src.startsWith('http') ? src : `https://www.ss.com${src}`);
      }
    });
    
    // Strategy 2: Look for images in common containers
    if (images.length === 0) {
      $('img[id*="pic"], img[id*="photo"], img[class*="photo"], img.ads_photo').each((_, img) => {
        const src = $(img).attr('src');
        if (src && !src.includes('nophoto')) {
          images.push(src.startsWith('http') ? src : `https://www.ss.com${src}`);
        }
      });
    }
    
    // Strategy 3: Look for ANY img tag in the content area
    if (images.length === 0) {
      $('table img, #msg_div img, .msg img').each((_, img) => {
        const src = $(img).attr('src');
        if (src && src.length > 10 && !src.includes('nophoto') && !src.includes('icon') && !src.includes('banner')) {
          images.push(src.startsWith('http') ? src : `https://www.ss.com${src}`);
        }
      });
    }
    
    console.log(`[SS.com] Extracting images from ${url}`);
    console.log(`[SS.com] Found ${images.length} images`);
    console.log(`[SS.com] All img tags on page: ${$('img').length}`);
    if (images.length > 0) {
      console.log(`[SS.com] First image: ${images[0]}`);
    } else {
      // Log first few img src attributes to debug
      const allImgSrcs = [];
      $('img').slice(0, 5).each((_, img) => {
        allImgSrcs.push($(img).attr('src'));
      });
      console.log(`[SS.com] Sample img src values:`, allImgSrcs);
    }
    
    // Extract condition from the listing details
    let condition = '';
    const conditionSelectors = [
      'td:contains("Condition:")',
      'td:contains("Stāvoklis:")',
      'td:contains("Состояние:")',
    ];
    
    for (const selector of conditionSelectors) {
      const $cell = $(selector);
      if ($cell.length) {
        // Get the next cell or text after the label
        const conditionText = $cell.next('td').text().trim() || 
                             $cell.parent().find('td').eq(1).text().trim();
        if (conditionText && conditionText.length < 50) {
          condition = conditionText;
          break;
        }
      }
    }
    
    return {
      hasDescription: description.length > 100,
      fullDescription: description,
      images: images,
      hasImage: images.length > 0,
      postedAtText: dateText || '',
      conditionText: condition || '',
    };
  } catch (error) {
    console.error(`Failed to fetch listing details from ${url}:`, error.message);
    return {
      hasDescription: false,
      fullDescription: '',
      images: [],
      hasImage: false,
      postedAtText: '',
      conditionText: '',
    };
  }
}

/**
 * Searches SS.com and returns normalized listings.
 * @param {string} query - The search query
 * @param {object} options - Search options
 * @param {boolean} options.fetchDetails - Whether to fetch individual listing pages (slower but more accurate)
 * @returns {Promise<object[]>} - Array of normalized Listing objects
 * @throws {Error} - If the request fails
 */
export async function search(query, options = {}) {
  const { fetchDetails = true } = options; // Enable by default for accurate data
  
  if (!query || !query.trim()) {
    throw new Error("Query is required");
  }

  const url = buildSearchUrl(query);
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const rawListings = [];
  
  console.log(`[SS.com] Fetched search page, HTML length: ${html.length}`);
  console.log(`[SS.com] Found ${$('a[href*="/msg/"]').length} links with /msg/`);
  console.log(`[SS.com] Found ${$('a[href*=".html"]').length} links with .html`);

  // SS.com search results: look for all links that point to listings
  // Listing URLs typically contain /msg/ or match patterns like /lv/electronics/12345.html
  $('a[href*="/msg/"], a[href*=".html"]').each((_, element) => {
    const $link = $(element);
    const href = $link.attr('href');
    let title = $link.text().trim();
    
    // Skip navigation, footer, and other non-listing links
    if (!href || !title || title.length < 5) return;
    if (href.includes('javascript:') || href.includes('#')) return;
    if (title.match(/^(Menu|Search|Login|Register|Home|Back|Next|Page)/i)) return;
    
    // Build absolute URL
    const absoluteUrl = href.startsWith('http') ? href : `https://www.ss.com${href}`;
    
    // Skip if not a listing URL
    if (!absoluteUrl.includes('/msg/') && !absoluteUrl.match(/\/[a-z]{2}\/[\w-]+\/\d+\.html/)) return;
    
    // Find the parent row/container to extract price and date
    const $container = $link.closest('tr, div[class*="row"], div[class*="item"]');
    
    // Extract price - look for text with currency symbols in the same row
    let priceText = '';
    $container.find('td, div, span').each((_, el) => {
      const text = $(el).text().trim();
      // Match patterns: "300 €", "€ 150", "1,500 EUR"
      if (text.match(/[\d\s,.]+ ?[€$]/i) || text.match(/[€$] ?[\d\s,.]+/i)) {
        priceText = text.replace(/\s+/g, ' ');
        return false; // break
      }
    });
    
    // Extract date - look for date patterns in the same row
    let dateText = '';
    $container.find('td, div, span').each((_, el) => {
      const text = $(el).text().trim();
      // Match: "07.12.", "07.12.2025", "12:44"
      if (text.match(/\d{2}\.\d{2}\.(\d{4})?/) || text.match(/\d{1,2}:\d{2}/)) {
        dateText = text;
        return false; // break
      }
    });
    
    // Truncate title intelligently at word boundary
    let truncatedTitle = title.replace(/\s+/g, ' ');
    const maxLength = 120;
    if (truncatedTitle.length > maxLength) {
      // Try to break at sentence end first
      const sentenceEnd = truncatedTitle.substring(0, maxLength).lastIndexOf('.');
      if (sentenceEnd > 50) {
        truncatedTitle = truncatedTitle.substring(0, sentenceEnd + 1);
      } else {
        // Break at last space before maxLength
        const lastSpace = truncatedTitle.substring(0, maxLength).lastIndexOf(' ');
        truncatedTitle = truncatedTitle.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
      }
    }
    
    rawListings.push({
      title: truncatedTitle,
      url: absoluteUrl,
      link: absoluteUrl,
      priceText: priceText,
      postedAtText: dateText,
      source: "ss",
    });
  });

  // Deduplicate by URL
  const seen = new Set();
  const deduplicated = rawListings.filter((listing) => {
    if (!listing.url || seen.has(listing.url)) return false;
    seen.add(listing.url);
    return true;
  });
  
  console.log(`[SS.com] Extracted ${rawListings.length} raw listings, ${deduplicated.length} after deduplication`);

  // Fetch individual listing pages for full details if enabled
  if (fetchDetails) {
    const detailedListings = [];
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < deduplicated.length; i += batchSize) {
      const batch = deduplicated.slice(i, i + batchSize);
      const detailsPromises = batch.map(listing => fetchListingDetails(listing.url));
      const details = await Promise.all(detailsPromises);
      
      batch.forEach((listing, idx) => {
        detailedListings.push({
          ...listing,
          ...details[idx],
          // Prefer detail page date if available, otherwise keep search results date
          postedAtText: details[idx].postedAtText || listing.postedAtText,
          // Prefer detail page condition
          conditionText: details[idx].conditionText || listing.conditionText || '',
          // Ensure images array is included
          images: details[idx].images || [],
          hasImage: details[idx].hasImage || false,
        });
      });
    }
    
    return detailedListings.map((raw) =>
      normalizeListing(raw, "ss", "SS.lv")
    );
  }

  // If not fetching details, just return with basic data
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
