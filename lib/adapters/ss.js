/**
 * SS.com adapter - scrapes search results from SS.lv marketplace.
 * Returns standardized Listing objects per SPEC.md schema.
 */

import * as cheerio from "cheerio";
import { fetchHtml } from "../http.js";
import { normalizeListing } from "../normalize.js";
import { getDescriptionPreview, cleanTitle } from "../textHelpers.js";

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
 * Optimizes SS.com image URL to use thumbnail version if available.
 * SS.com typically has full images at /msg/lv/.../_full.jpg
 * and thumbnails at /msg/lv/.../th1.jpg or similar
 * @param {string} imageUrl - Original image URL
 * @returns {string} - Optimized image URL
 */
function optimizeImageUrl(imageUrl) {
  if (!imageUrl || !imageUrl.includes('ss.com')) return imageUrl;
  
  // If it's a full-size image, try to convert to thumbnail
  if (imageUrl.includes('_full.jpg') || imageUrl.includes('_full.jpeg')) {
    // Replace _full with th1 for thumbnail
    return imageUrl.replace(/_full\.(jpg|jpeg)/i, '_th1.$1');
  }
  
  // If image path contains /msg/ and doesn't have thumbnail marker, add it
  if (imageUrl.includes('/msg/') && !imageUrl.match(/th\d/)) {
    // Try to insert thumbnail indicator before extension
    return imageUrl.replace(/\.(jpg|jpeg|png)$/i, '_th1.$1');
  }
  
  // Return original if no optimization possible
  return imageUrl;
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
    
    // Extract title from detail page (more reliable than search results breadcrumb)
    let actualTitle = '';
    const titleSelectors = [
      'h1#tdo_31',              // SS.com title ID
      'h1',                     // Generic h1
      'td#tdo_31',              // Sometimes title is in table cell
      'b:contains("Price:")',   // Look near price label
    ];
    
    for (const selector of titleSelectors) {
      const text = $(selector).first().text().trim();
      // Valid title should be substantial but not too long
      if (text && text.length > 5 && text.length < 300 && !text.includes('Price:')) {
        actualTitle = text;
        break;
      }
    }
    
    // If no title found in normal places, try to extract from breadcrumb
    if (!actualTitle) {
      // SS.com breadcrumb is usually in a specific table
      const breadcrumbs = $('td[style*="padding"] a, .headtitle a').last().text().trim();
      if (breadcrumbs && breadcrumbs.length > 5) {
        actualTitle = breadcrumbs;
      }
    }
    
    // Clean the title to remove breadcrumbs and unnecessary text
    actualTitle = cleanTitle(actualTitle, 100);
    
    // Extract price from detail page
    let priceText = '';
    const priceSelectors = [
      'td#tdo_8',               // Common SS.com price cell
      'td:contains("Price:") + td',
      'td:contains("Цена:") + td',
      'td:contains("Cena:") + td',
    ];
    
    for (const selector of priceSelectors) {
      const text = $(selector).text().trim();
      // Match currency patterns
      if (text && (text.match(/\d/) && (text.includes('€') || text.includes('EUR') || text.includes('$')))) {
        priceText = text.replace(/\s+/g, ' ');
        break;
      }
    }
    
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
        const fullUrl = src.startsWith('http') ? src : `https://www.ss.com${src}`;
        images.push(optimizeImageUrl(fullUrl));
      }
    });
    
    // Strategy 2: Look for images in common containers
    if (images.length === 0) {
      $('img[id*="pic"], img[id*="photo"], img[class*="photo"], img.ads_photo').each((_, img) => {
        const src = $(img).attr('src');
        if (src && !src.includes('nophoto')) {
          const fullUrl = src.startsWith('http') ? src : `https://www.ss.com${src}`;
          images.push(optimizeImageUrl(fullUrl));
        }
      });
    }
    
    // Strategy 3: Look for ANY img tag in the content area
    if (images.length === 0) {
      $('table img, #msg_div img, .msg img').each((_, img) => {
        const src = $(img).attr('src');
        if (src && src.length > 10 && !src.includes('nophoto') && !src.includes('icon') && !src.includes('banner')) {
          const fullUrl = src.startsWith('http') ? src : `https://www.ss.com${src}`;
          images.push(optimizeImageUrl(fullUrl));
        }
      });
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
    
    // Extract description preview (first sentence)
    const descriptionPreview = getDescriptionPreview(description);
    
    return {
      title: actualTitle || '',           // Override search results title
      priceText: priceText || '',         // Override search results price
      hasDescription: description.length > 100,
      fullDescription: description,
      descriptionPreview: descriptionPreview,
      images: images,
      hasImage: images.length > 0,
      postedAtText: dateText || '',
      conditionText: condition || '',
    };
  } catch (error) {
    console.error(`Failed to fetch listing details from ${url}:`, error.message);
    return {
      title: '',
      priceText: '',
      hasDescription: false,
      fullDescription: '',
      descriptionPreview: null,
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
    
    // Clean the title using the helper function
    title = cleanTitle(title, 200); // Allow longer initially, will truncate later
    
    // Skip if title is too short after cleaning
    if (title.length < 5) return;
    
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
    
    // Truncate title intelligently at word boundary (~70 chars)
    let truncatedTitle = title.replace(/\s+/g, ' ');
    const maxLength = 70;
    if (truncatedTitle.length > maxLength) {
      // Break at last space before maxLength to avoid cutting words
      const lastSpace = truncatedTitle.substring(0, maxLength).lastIndexOf(' ');
      if (lastSpace > maxLength * 0.6) { // At least 60% of maxLength (42+ chars)
        truncatedTitle = truncatedTitle.substring(0, lastSpace) + '...';
      } else {
        // No good word boundary, hard cut
        truncatedTitle = truncatedTitle.substring(0, maxLength) + '...';
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
        const detailData = details[idx];
        detailedListings.push({
          ...listing,
          ...detailData,
          // Prefer detail page title if available (more accurate than breadcrumb)
          title: detailData.title || listing.title,
          // Prefer detail page price if available
          priceText: detailData.priceText || listing.priceText,
          // Prefer detail page date if available, otherwise keep search results date
          postedAtText: detailData.postedAtText || listing.postedAtText,
          // Prefer detail page condition
          conditionText: detailData.conditionText || listing.conditionText || '',
          // Ensure images array is included
          images: detailData.images || [],
          hasImage: detailData.hasImage || false,
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
