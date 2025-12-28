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
 * @param {number} page - Page number (default: 1)
 * @returns {string} - The search results URL
 */
function buildSearchUrl(query, page = 1) {
  // SS.com uses /en/ for English interface
  // Page 1: /en/search-result/?q=query
  // Page 2+: /en/search-result/page2.html?q=query
  if (page === 1) {
    return `https://www.ss.com/en/search-result/?q=${encodeURIComponent(query)}`;
  } else {
    return `https://www.ss.com/en/search-result/page${page}.html?q=${encodeURIComponent(query)}`;
  }
}

/**
 * Converts price text to numeric value for sorting.
 * @param {string} priceText - Price text like "150 €", "€ 1,200", "Free"
 * @returns {number} - Numeric price value (Infinity for unparseable prices)
 */
function parsePriceValue(priceText) {
  if (!priceText || typeof priceText !== 'string') return Infinity;
  
  const text = priceText.toLowerCase().trim();
  
  // Handle free/no price cases
  if (text.includes('free') || text.includes('bezmaksas') || text.includes('bez maksas')) {
    return 0;
  }
  
  if (text.includes('price not specified') || text.includes('nav norādīta')) {
    return Infinity;
  }
  
  // Extract numeric value using regex
  // Matches patterns: "150 €", "€150", "1,500.50", "1 500"
  const match = text.match(/([\d\s,.]+)/);
  
  if (!match) return Infinity;
  
  // Remove spaces and convert comma to dot for decimal
  const cleanedNumber = match[1]
    .replace(/\s/g, '') // Remove spaces
    .replace(/,/g, '.'); // Convert comma to dot
  
  const value = parseFloat(cleanedNumber);
  
  return isNaN(value) ? Infinity : value;
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
      // Skip advertisement headers and navigation text
      const isAdText = text.match(/advertisement/i) || text.match(/reklāma/i);
      if (text && text.length > 5 && text.length < 300 && !text.includes('Price:') && !isAdText) {
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
 * Phase 1: Extract URLs and prices from ALL search pages.
 * Scans all pages until no more results or maxResults reached.
 * Uses batched fetching (3 pages at a time) for safety.
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to collect (default: 300)
 * @param {number} minPrice - Minimum price filter (optional)
 * @param {number} maxPrice - Maximum price filter (optional)
 * @param {string} sortBy - Sort order: 'price-low' or 'price-high'
 * @returns {Promise<Array>} - Array of {url, priceText} sorted by price
 */
async function extractPricesOnly(query, maxResults = 300, minPrice = null, maxPrice = null, sortBy = 'price-low') {
  if (!query || !query.trim()) {
    throw new Error("Query is required");
  }

  const allPrices = [];
  let currentPage = 1;
  const BATCH_SIZE = 3; // Fetch 3 pages at a time
  const BATCH_DELAY = 150; // 150ms delay between batches
  
  console.log(`[SS.com Phase 1] Starting price scan for "${query}"`);
  
  // Helper function to add delay
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Helper function to extract prices from a single page
  const extractFromPage = async (pageNum) => {
    const url = buildSearchUrl(query, pageNum);
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const pageResults = [];
    
    // Extract listings from this page
    $('a[href*="/msg/"], a[href*=".html"]').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      let title = $link.text().trim();
      
      // Skip invalid links
      if (!href || !title || title.length < 5) return;
      if (href.includes('javascript:') || href.includes('#')) return;
      if (title.match(/^(Menu|Search|Login|Register|Home|Back|Next|Page)/i)) return;
      
      // Build absolute URL
      const absoluteUrl = href.startsWith('http') ? href : `https://www.ss.com${href}`;
      
      // Skip if not a listing URL
      if (!absoluteUrl.includes('/msg/') && !absoluteUrl.match(/\/[a-z]{2}\/[\w-]+\/\d+\.html/)) return;
      
      // Find the parent row/container to extract price
      const $container = $link.closest('tr, div[class*="row"], div[class*="item"]');
      
      // Extract price - look for text with currency symbols in the same row
      let priceText = '';
      $container.find('td, div, span').each((_, el) => {
        const text = $(el).text().trim();
        // Match patterns: "300 €", "€ 150", "1,500 EUR"
        // Must be relatively short (< 50 chars) to avoid matching descriptions
        if (text.length < 50 && (text.match(/[\d\s,.]+ ?[€$]/i) || text.match(/[€$] ?[\d\s,.]+/i))) {
          priceText = text.replace(/\s+/g, ' ');
          return false; // break
        }
      });
      
      // Only add if we found a price (skip listings without prices)
      if (priceText) {
        pageResults.push({
          url: absoluteUrl,
          priceText: priceText,
        });
      }
    });
    
    return pageResults;
  };
  
  // Scan pages in batches
  while (allPrices.length < maxResults) {
    // Determine batch: up to 3 pages
    const batchPages = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      batchPages.push(currentPage + i);
    }
    
    console.log(`[SS.com Phase 1] Fetching pages ${batchPages[0]}-${batchPages[batchPages.length - 1]}...`);
    
    // Fetch batch in parallel
    const batchPromises = batchPages.map(pageNum => extractFromPage(pageNum));
    const batchResults = await Promise.all(batchPromises);
    
    // Check if any page returned results
    let foundResults = false;
    for (const pageResults of batchResults) {
      if (pageResults.length > 0) {
        foundResults = true;
        allPrices.push(...pageResults);
      }
    }
    
    // Stop if no results found in entire batch (no more pages)
    if (!foundResults) {
      console.log(`[SS.com Phase 1] No more results found at page ${currentPage}`);
      break;
    }
    
    // Stop if we've reached the limit
    if (allPrices.length >= maxResults) {
      console.log(`[SS.com Phase 1] Reached max results limit (${maxResults})`);
      break;
    }
    
    // Move to next batch
    currentPage += BATCH_SIZE;
    
    // Add delay between batches (rate limiting safety)
    if (allPrices.length < maxResults) {
      await sleep(BATCH_DELAY);
    }
  }
  
  // Deduplicate by URL
  const seen = new Set();
  const deduplicated = allPrices.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
  
  // Filter out spam/scam listings and obviously irrelevant results
  const filtered = deduplicated.filter((item) => {
    const priceValue = parsePriceValue(item.priceText);
    
    // Filter out items with suspiciously low prices (< 10€) unless they're free
    // This catches spam listings with fake prices like "5€"
    if (priceValue < 10 && priceValue !== 0) return false;
    
    // Apply user's price range filters
    if (minPrice !== null && priceValue < minPrice && priceValue !== 0) return false;
    if (maxPrice !== null && priceValue > maxPrice && priceValue !== 0) return false;
    
    // Basic category mismatch detection
    // Only filter out if there's a clear mismatch between query and category
    const url = item.url.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Define broad category keywords
    const transportKeywords = ['car', 'auto', 'vehicle', 'bmw', 'audi', 'mercedes', 'toyota', 'bike', 'motorcycle', 'scooter'];
    const realEstateKeywords = ['apartment', 'flat', 'house', 'room', 'property', 'rent'];
    const electronicsKeywords = ['phone', 'laptop', 'computer', 'iphone', 'samsung', 'airpods', 'headphones', 'tablet'];
    const musicHobbyKeywords = ['guitar', 'bass', 'piano', 'drum', 'violin', 'saxophone', 'synthesizer', 'amplifier', 'pedal'];
    const sportsKeywords = ['bicycle', 'ski', 'snowboard', 'skateboard', 'football', 'basketball', 'tennis', 'fitness'];
    
    // Check if query is clearly about a specific category
    const queryIsTransport = transportKeywords.some(kw => queryLower.includes(kw));
    const queryIsRealEstate = realEstateKeywords.some(kw => queryLower.includes(kw));
    const queryIsElectronics = electronicsKeywords.some(kw => queryLower.includes(kw));
    const queryIsMusicHobby = musicHobbyKeywords.some(kw => queryLower.includes(kw));
    const queryIsSports = sportsKeywords.some(kw => queryLower.includes(kw));
    
    // Check if URL is from a specific category
    const urlIsTransport = url.includes('/transport/');
    const urlIsRealEstate = url.includes('/real-estate/');
    const urlIsElectronics = url.includes('/electronics/');
    const urlIsMusicHobby = url.includes('/hobby/') || url.includes('/music/') || url.includes('/entertainment/');
    const urlIsSports = url.includes('/sports/');
    
    // Filter out clear mismatches:
    // - If query is about electronics, exclude transport/real-estate
    // - If query is about transport, exclude electronics/real-estate/music/sports
    // - If query is about real-estate, exclude transport/electronics
    // - If query is about music/hobby, exclude transport/real-estate
    // - If query is about sports, exclude transport/real-estate
    
    if (queryIsElectronics && (urlIsTransport || urlIsRealEstate)) return false;
    if (queryIsTransport && (urlIsElectronics || urlIsRealEstate || urlIsMusicHobby || urlIsSports)) return false;
    if (queryIsRealEstate && (urlIsTransport || urlIsElectronics)) return false;
    if (queryIsMusicHobby && (urlIsTransport || urlIsRealEstate || urlIsElectronics)) return false;
    if (queryIsSports && (urlIsTransport || urlIsRealEstate || urlIsElectronics)) return false;
    
    return true;
  });
  
  // Sort by price based on sortBy parameter
  const sorted = filtered.sort((a, b) => {
    const priceA = parsePriceValue(a.priceText);
    const priceB = parsePriceValue(b.priceText);
    
    if (sortBy === 'price-high') {
      // High to low: handle free items (0) specially - put them at the end
      if (priceA === 0 && priceB === 0) return 0;
      if (priceA === 0) return 1;  // Free items go to end
      if (priceB === 0) return -1; // Free items go to end
      return priceB - priceA; // Descending
    } else {
      // Low to high (default): free items first, then ascending
      if (priceA === 0 && priceB === 0) return 0;
      if (priceA === 0) return -1; // Free items first
      if (priceB === 0) return 1;  // Free items first
      return priceA - priceB; // Ascending
    }
  });
  
  // Limit to maxResults
  const limited = sorted.slice(0, maxResults);
  
  console.log(`[SS.com Phase 1] Complete: Found ${limited.length} listings with prices (sorted by ${sortBy})`);
  
  return limited;
}

/**
 * Searches SS.com and returns normalized listings with pagination.
 * Uses two-phase approach: Phase 1 scans for prices, Phase 2 enriches current page.
 * @param {string} query - The search query
 * @param {object} options - Search options
 * @param {number} options.maxResults - Maximum total results to scan (default: 300)
 * @param {number} options.resultsPerPage - Results to show per page (default: 20)
 * @param {number} options.currentPage - Current page number (default: 1)
 * @param {boolean} options.fetchDetails - Whether to fetch detail pages (default: true)
 * @returns {Promise<object>} - Object with items, totalResults, currentPage, totalPages, showNotification
 * @throws {Error} - If the request fails
 */
export async function search(query, options = {}) {
  const { 
    maxResults = 300,
    resultsPerPage = 20,
    currentPage = 1,
    fetchDetails = true,
    minPrice = null,
    maxPrice = null,
    sortBy = 'price-low',
  } = options;
  
  if (!query || !query.trim()) {
    throw new Error("Query is required");
  }

  console.log(`[SS.com] Starting search for "${query}" (page ${currentPage})`);
  
  // PHASE 1: Get all prices (fast!)
  console.log(`[SS.com] Phase 1: Scanning for prices (max ${maxResults} results)...`);
  const priceOnlyResults = await extractPricesOnly(query, maxResults, minPrice, maxPrice, sortBy);
  
  const totalResults = priceOnlyResults.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const showNotification = totalResults > 100;
  
  console.log(`[SS.com] Phase 1 complete: Found ${totalResults} listings, ${totalPages} pages`);
  
  // PHASE 2: Enrich current page only
  const startIdx = (currentPage - 1) * resultsPerPage;
  const endIdx = startIdx + resultsPerPage;
  const currentPageUrls = priceOnlyResults.slice(startIdx, endIdx);
  
  console.log(`[SS.com] Phase 2: Enriching ${currentPageUrls.length} listings for page ${currentPage}...`);
  
  if (!fetchDetails || currentPageUrls.length === 0) {
    // Return basic data without enrichment
    const items = currentPageUrls.map((item) => 
      normalizeListing({
        url: item.url,
        link: item.url,
        priceText: item.priceText,
        title: '',
        source: 'ss',
      }, "ss", "SS.lv")
    );
    
    return {
      items,
      totalResults,
      currentPage,
      totalPages,
      showNotification,
    };
  }
  
  // Fetch full details for current page (batched for safety)
  const batchSize = 5;
  const enrichedResults = [];
  
  for (let i = 0; i < currentPageUrls.length; i += batchSize) {
    const batch = currentPageUrls.slice(i, i + batchSize);
    const detailsPromises = batch.map(item => fetchListingDetails(item.url));
    const details = await Promise.all(detailsPromises);
    
    batch.forEach((item, idx) => {
      const detailData = details[idx];
      enrichedResults.push({
        url: item.url,
        link: item.url,
        priceText: detailData.priceText || item.priceText, // Prefer detail page price
        title: detailData.title || '',
        source: 'ss',
        ...detailData,
      });
    });
  }
  
  console.log(`[SS.com] Phase 2 complete: Enriched ${enrichedResults.length} listings`);
  
  // Normalize and return
  const items = enrichedResults.map((raw) => normalizeListing(raw, "ss", "SS.lv"));
  
  return {
    items,
    totalResults,
    currentPage,
    totalPages,
    showNotification,
  };
}

/**
 * Export Phase 1 function for testing
 */
export { extractPricesOnly };

/**
 * Adapter configuration metadata.
 */
export const config = {
  id: "ss",
  name: "SS.lv",
  country: "LV",
  enabled: true,
};
