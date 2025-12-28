/**
 * Andele Mandele Adapter
 * 
 * Scrapes listings from https://www.andelemandele.lv/
 * Uses two-phase search architecture:
 * - Phase 1: Fast price scanning across multiple pages (uses Puppeteer for JS-rendered search)
 * - Phase 2: Detail enrichment for current page (uses Cheerio)
 */

import * as cheerio from "cheerio";
import { fetchHtml } from "../http.js";
import { fetchWithBrowser } from "../browser.js";
import { normalizeListing } from "../normalize.js";
import { parsePriceValue } from "../textHelpers.js";

const BASE_URL = "https://www.andelemandele.lv";
const SEARCH_PATH = "/search/";

/**
 * Build search URL with query and pagination
 */
export function buildSearchUrl(query, page = 1) {
  const params = new URLSearchParams({ search: query });
  if (page > 1) {
    params.append('page', page);
  }
  return `${BASE_URL}${SEARCH_PATH}?${params.toString()}`;
}

/**
 * Extract price value from Andele's price text
 * Handles formats: "25 €", "25 €35 €" (sale), "0.85 €"
 * For sales, returns the FIRST price (sale price)
 */
function parseAndelePriceValue(priceText) {
  if (!priceText) return Infinity;
  
  // Remove whitespace and normalize
  const cleaned = priceText.trim();
  
  // Match first number before €
  const match = cleaned.match(/(\d+(?:[.,]\d+)?)\s*€/);
  if (!match) return Infinity;
  
  const value = parseFloat(match[1].replace(',', '.'));
  return isNaN(value) ? Infinity : value;
}

/**
 * Phase 1: Fast price scanning
 * Scans multiple pages to extract URL + price pairs
 * Returns sorted array of {url, priceText} for enrichment
 */
export async function extractPricesOnly(
  query,
  maxResults = 300,
  minPrice = null,
  maxPrice = null,
  sortBy = 'price-low'
) {
  console.log(`[Andele] Phase 1: Scanning prices for "${query}" (max ${maxResults} items)`);
  
  const results = [];
  const itemsPerPage = 48; // Andele shows ~48 items per page
  const maxPages = Math.min(Math.ceil(maxResults / itemsPerPage), 5); // Scan max 5 pages
  
  try {
    // Fetch pages in batches of 3
    const BATCH_SIZE = 3;
    for (let batchStart = 1; batchStart <= maxPages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, maxPages);
      const pages = [];
      
      for (let page = batchStart; page <= batchEnd; page++) {
        pages.push(page);
      }
      
      // Fetch batch in parallel
      const batchPromises = pages.map(async (page) => {
        const url = buildSearchUrl(query, page);
        console.log(`[Andele] Fetching page ${page} with Puppeteer...`);
        
        try {
          // Use Puppeteer to render JavaScript
          const html = await fetchWithBrowser(url, {
            waitForSelector: 'article.product-card, .no-results, .search-results-empty',
            waitFor: 1500 // Wait for AJAX to complete
          });
          const $ = cheerio.load(html);
          const pageResults = [];
          
          // Check for "no results" message
          const noResults = $('.no-results, .search-results-empty').length > 0 || $('article.product-card').length === 0;
          if (noResults && page === 1) {
            console.log(`[Andele] No results found on page ${page}`);
            return [];
          }
          
          // Andele uses article.product-card for each listing
          $('article.product-card').each((i, elem) => {
            const $card = $(elem);
            
            // Extract listing URL from product-card__link
            const $link = $card.find('a.product-card__link');
            const href = $link.attr('href');
            
            if (!href || !href.includes('/perle/')) return;
            
            // Build absolute URL (remove UTM parameters)
            const cleanHref = href.split('?')[0];
            const listingUrl = cleanHref.startsWith('http') ? cleanHref : `${BASE_URL}${cleanHref}`;
            
            // Extract price from span.product-card__price (this is the current/active price)
            const $price = $card.find('span.product-card__price');
            const rawPriceText = $price.text().trim();
            
            // Extract only the first price (active price), ignore old/crossed-out prices
            // Format: "120 €" or "120 €150 €" -> we want only "120 €"
            const priceMatch = rawPriceText.match(/(\d+(?:[.,]\d+)?)\s*€/);
            const priceText = priceMatch ? `${priceMatch[1]} €` : rawPriceText;
            
            // Extract image URL from product card
            let imageUrl = null;
            const $image = $card.find('img.product-card__image, .product-card__image img');
            if ($image.length > 0) {
              const src = $image.attr('src') || $image.attr('data-src');
              if (src && src.includes('andelemandele.lv')) {
                // Use medium size for thumbnails
                const mediumUrl = src.replace('/thumbnail/', '/medium/').replace('/large/', '/medium/');
                imageUrl = mediumUrl.startsWith('http') ? mediumUrl : `https:${mediumUrl}`;
              }
            }
            
            if (priceText && priceText.includes('€')) {
              pageResults.push({
                url: listingUrl,
                priceText: priceText,
                imageUrl: imageUrl || undefined
              });
            }
          });
          
          console.log(`[Andele] Page ${page}: Found ${pageResults.length} listings`);
          return pageResults;
        } catch (error) {
          console.error(`[Andele] Error fetching page ${page}:`, error.message);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());
      
      // Small delay between batches
      if (batchEnd < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
    
    console.log(`[Andele] Phase 1: Found ${results.length} total listings`);
    
    // Deduplicate by URL (in case same listings appear on multiple pages)
    const seen = new Set();
    const deduplicated = results.filter(item => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });
    
    console.log(`[Andele] After deduplication: ${deduplicated.length} unique listings`);
    
    // Parse prices and filter
    let filtered = deduplicated
      .map(item => ({
        ...item,
        priceValue: parseAndelePriceValue(item.priceText)
      }))
      .filter(item => {
        // Filter invalid prices
        if (item.priceValue === Infinity) return false;
        
        // Apply price range filters
        if (minPrice !== null && item.priceValue < minPrice) return false;
        if (maxPrice !== null && item.priceValue > maxPrice) return false;
        
        return true;
      });
    
    // Sort by price
    if (sortBy === 'price-low') {
      // Free items first, then ascending
      filtered.sort((a, b) => {
        if (a.priceValue === 0 && b.priceValue === 0) return 0;
        if (a.priceValue === 0) return -1;
        if (b.priceValue === 0) return 1;
        return a.priceValue - b.priceValue;
      });
    } else if (sortBy === 'price-high') {
      // Paid items descending, then free items
      filtered.sort((a, b) => {
        if (a.priceValue === 0 && b.priceValue === 0) return 0;
        if (a.priceValue === 0) return 1;
        if (b.priceValue === 0) return -1;
        return b.priceValue - a.priceValue;
      });
    }
    
    // Limit to maxResults
    filtered = filtered.slice(0, maxResults);
    
    console.log(`[Andele] Phase 1: After filtering/sorting: ${filtered.length} listings`);
    
    return filtered;
    
  } catch (error) {
    console.error('[Andele] Phase 1 error:', error);
    return [];
  }
}

/**
 * Phase 2: Fetch full listing details
 * Scrapes individual listing page for complete information
 */
export async function fetchListingDetails(url) {
  // Validate URL
  if (!url || !url.includes('/perle/')) {
    console.warn(`[Andele] Invalid listing URL: ${url}`);
    return null;
  }
  
  try {
    const html = await fetchHtml(url);
    
    // Validate HTML response
    if (!html || html.length < 100) {
      console.warn(`[Andele] Empty or invalid HTML for ${url}`);
      return null;
    }
    
    const $ = cheerio.load(html);
    
    // Check if listing still exists (not deleted/removed)
    const isDeleted = $('.error-page, .not-found').length > 0;
    if (isDeleted) {
      console.warn(`[Andele] Listing no longer available: ${url}`);
      return null;
    }
    
    // Extract title from h1.product-node__title
    const title = $('h1.product-node__title').first().text().trim() 
      || $('meta[property="og:title"]').attr('content')
      || 'Untitled';
    
    // Validate we got a real title (not error page title)
    if (title === 'Untitled' || title.toLowerCase().includes('error') || title.toLowerCase().includes('not found')) {
      console.warn(`[Andele] Suspicious title for ${url}: ${title}`);
      return null;
    }
    
    // Extract price from product-node (similar to product-card)
    const $price = $('.product-node__price, .product-card__price').first();
    const rawPriceText = $price.text().trim();
    
    // Extract only the first price (active price), ignore old/crossed-out prices
    // Format: "120 €" or "120 €150 €" -> we want only "120 €"
    const priceMatch = rawPriceText.match(/(\d+(?:[.,]\d+)?)\s*€/);
    const priceText = priceMatch ? `${priceMatch[1]} €` : rawPriceText;
    
    // Extract description
    const description = $('.product-node__description').text().trim()
      || $('meta[property="og:description"]').attr('content')
      || '';
    
    // Extract images from gallery
    const images = [];
    $('img[src*="andelemandele.lv/images"]').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        // Convert to large size
        const largeUrl = src.replace('/thumbnail/', '/large/').replace('/medium/', '/large/');
        const fullUrl = largeUrl.startsWith('http') ? largeUrl : `https:${largeUrl}`;
        if (!images.includes(fullUrl)) {
          images.push(fullUrl);
        }
      }
    });
    
    // If no images found, try og:image meta tag
    if (images.length === 0) {
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage && !ogImage.includes('logo')) {
        images.push(ogImage);
      }
    }
    
    // Extract brand from product attribute list or link
    const $brandLink = $('a[href*="/brand/"]').first();
    const brand = $brandLink.text().trim();
    
    // Extract condition from attribute table
    let condition = '';
    $('.product-attribute-list__key').each((i, elem) => {
      const key = $(elem).text().trim();
      if (key === 'Stāvoklis') {
        condition = $(elem).next('.product-attribute-list__value').text().trim();
      }
    });
    
    // Extract size from attribute table or product-card__attr
    let size = '';
    $('.product-attribute-list__key').each((i, elem) => {
      const key = $(elem).text().trim();
      if (key === 'Izmērs') {
        size = $(elem).next('.product-attribute-list__value').text().trim();
      }
    });
    
    // If size not found in table, check product attributes
    if (!size) {
      const $attrs = $('.product-card__attr li, .product-node__attr li');
      $attrs.each((i, elem) => {
        const text = $(elem).text().trim();
        // Size is usually just numbers/letters like "S", "M", "L", "37", "122/128"
        if (/^[SMLX0-9/\-]+$/.test(text) && !text.includes('/brand/')) {
          size = text;
        }
      });
    }
    
    // Extract location
    let location = '';
    $('.product-attribute-list__key').each((i, elem) => {
      const key = $(elem).text().trim();
      if (key === 'Vieta' || key === 'Location') {
        location = $(elem).next('.product-attribute-list__value').text().trim();
      }
    });
    
    // If not in attributes, try seller info section
    if (!location) {
      const locationText = $('.seller-info__location, .product-node__location').text().trim();
      if (locationText) location = locationText;
    }
    
    // Extract seller info
    const sellerName = $('.seller-info__name, .product-node__seller-name').first().text().trim();
    
    // Extract posting date
    let postedDate = '';
    $('.product-attribute-list__key').each((i, elem) => {
      const key = $(elem).text().trim();
      if (key === 'Pievienots' || key === 'Posted') {
        const rawDate = $(elem).next('.product-attribute-list__value').text().trim();
        // Clean up: remove view count (numbers after time)
        // Format: "16. decembris, 7:44196" -> "16. decembris, 7:44"
        // Match date and time (HH:MM), stop before any extra digits
        const dateMatch = rawDate.match(/^(.+?\d{1,2}:\d{2})/);;
        postedDate = dateMatch ? dateMatch[1] : rawDate;
      }
    });
    
    // Create short description preview (first 100 chars)
    const descriptionPreview = description 
      ? description.substring(0, 100) + (description.length > 100 ? '...' : '')
      : undefined;
    
    return {
      url,
      link: url,
      title,
      priceText,
      description,
      descriptionPreview,
      images: images.slice(0, 5), // Limit to first 5 images
      imageUrl: images[0] || undefined, // First image for thumbnail
      hasImage: images.length > 0,
      hasDescription: !!description,
      brand: brand || undefined,
      conditionText: condition ? mapCondition(condition) : undefined,
      size: size || undefined,
      locationText: location || undefined,
      sellerName: sellerName || undefined,
      postedAtText: postedDate || undefined,
    };
    
  } catch (error) {
    console.error(`[Andele] Error fetching details for ${url}:`, error.message);
    return null;
  }
}

/**
 * Map Latvian condition to English display text
 */
function mapCondition(latvianCondition) {
  const conditionMap = {
    'Jauns': 'New',
    'Lietots, lieliskā stāvoklī': 'Like New',
    'Lietots, labā stāvoklī': 'Good',
    'Lietots, iespējami trūkumi': 'Fair',
    'Antīks/ Vintage': 'Vintage',
  };
  
  return conditionMap[latvianCondition] || latvianCondition;
}

/**
 * Main search function
 * Orchestrates two-phase search with enrichment
 */
export async function search(query, options = {}) {
  const {
    maxResults = 300,
    resultsPerPage = 10,
    currentPage = 1,
    minPrice = null,
    maxPrice = null,
    sortBy = 'price-low'
  } = options;
  
  // Validate and sanitize query
  const sanitizedQuery = sanitizeQuery(query);
  
  // Validate numeric parameters
  const validMaxResults = Math.min(Math.max(1, maxResults), 500);
  const validResultsPerPage = Math.min(Math.max(1, resultsPerPage), 50);
  const validPage = Math.max(1, currentPage);
  
  console.log(`[Andele] Starting search for "${sanitizedQuery}"`, {
    maxResults: validMaxResults,
    resultsPerPage: validResultsPerPage,
    currentPage: validPage,
    minPrice,
    maxPrice,
    sortBy
  });
  
  try {
    // Phase 1: Fast price scanning
    const priceResults = await extractPricesOnly(
      sanitizedQuery,
      validMaxResults,
      minPrice,
      maxPrice,
      sortBy
    );
    
    if (priceResults.length === 0) {
      console.log('[Andele] No results found');
      return {
        items: [],
        totalResults: 0,
        currentPage: 1,
        totalPages: 0,
      };
    }
    
    // Calculate pagination
    const totalResults = priceResults.length;
    const totalPages = Math.ceil(totalResults / validResultsPerPage);
    const finalPage = Math.min(Math.max(1, validPage), totalPages || 1);
    
    // Get URLs for current page
    const startIndex = (finalPage - 1) * validResultsPerPage;
    const endIndex = Math.min(startIndex + validResultsPerPage, totalResults);
    const currentPageUrls = priceResults.slice(startIndex, endIndex);
    
    // Handle case where no results were found in Phase 1
    if (priceResults.length === 0) {
      console.log(`[Andele] No results found for "${sanitizedQuery}"`);
      return {
        items: [],
        totalResults: 0,
        currentPage: finalPage,
        totalPages: 0,
      };
    }
    
    console.log(`[Andele] Phase 2: Enriching ${currentPageUrls.length} listings for page ${finalPage}`);
    
    // Phase 2: Enrich current page with full details (batch of 5)
    const BATCH_SIZE = 5;
    const enriched = [];
    let failedCount = 0;
    
    for (let i = 0; i < currentPageUrls.length; i += BATCH_SIZE) {
      const batch = currentPageUrls.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            // Add timeout to prevent hanging on slow listings
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Detail fetch timeout')), 15000)
            );
            
            const detailsPromise = fetchListingDetails(item.url);
            const details = await Promise.race([detailsPromise, timeoutPromise]);
            
            if (!details) {
              failedCount++;
              return null;
            }
            
            // Merge Phase 1 data (imageUrl) with Phase 2 details
            return { ...details, imageUrl: item.imageUrl || details.imageUrl };
          } catch (error) {
            console.warn(`[Andele] Failed to enrich ${item.url}:`, error.message);
            failedCount++;
            return null;
          }
        })
      );
      
      // Extract fulfilled values
      const validResults = batchResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);
      
      enriched.push(...validResults);
      
      // Small delay between batches
      if (i + BATCH_SIZE < currentPageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (failedCount > 0) {
      console.warn(`[Andele] Failed to enrich ${failedCount} out of ${currentPageUrls.length} listings`);
    }
    
    // Normalize results
    const normalized = enriched.map(item => 
      normalizeListing(item, 'andele', 'Andele Mandele')
    );
    
    // Warn if we got significantly fewer results than expected
    if (normalized.length < currentPageUrls.length * 0.5) {
      console.warn(`[Andele] Only enriched ${normalized.length} out of ${currentPageUrls.length} listings (${Math.round(normalized.length / currentPageUrls.length * 100)}% success rate)`);
    }
    
    console.log(`[Andele] Search complete: ${normalized.length} enriched listings returned`);
    
    return {
      items: normalized,
      totalResults,
      currentPage: finalPage,
      totalPages,
    };
    
  } catch (error) {
    console.error('[Andele] Search error:', error);
    
    // Return empty results rather than throwing
    // This allows the app to continue with other sources
    return {
      items: [],
      totalResults: 0,
      currentPage: validPage,
      totalPages: 0,
      hasMore: false,
      source: 'andele',
      error: error.message
    };
  }
}

/**
 * Validate and sanitize query input
 */
function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid search query');
  }
  
  const cleaned = query.trim();
  if (cleaned.length === 0) {
    throw new Error('Empty search query');
  }
  
  if (cleaned.length > 100) {
    throw new Error('Search query too long (max 100 characters)');
  }
  
  return cleaned;
}
