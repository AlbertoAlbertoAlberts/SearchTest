/**
 * API orchestrator for marketplace search.
 * Coordinates adapters, merges results, and returns unified response per SPEC.md.
 */

import * as ssAdapter from "../../lib/adapters/ss.js";
import * as andeleAdapter from "../../lib/adapters/andele.js";
import cache from "../../lib/cache.js";
import { normalizeListing } from "../../lib/normalize.js";

// Map of available adapters
const ADAPTERS = {
  ss: ssAdapter,
  andele: andeleAdapter,
};

// Cache TTL: 5 minutes (in milliseconds)
const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // Extract and validate query parameters
    const query = (req.query.q || "").toString().trim();
    if (!query) {
      return res.status(400).json({
        error: "Missing query parameter 'q'",
      });
    }

    // Parse sources (default to 'ss' for backward compatibility)
    const sourcesParam = req.query.sources || "ss";
    const sources = sourcesParam.split(",").map((s) => s.trim()).filter(Boolean);
    
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const maxResults = parseInt(req.query.maxResults) || 300;
    
    // Parse price filter parameters
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const sortBy = req.query.sortBy || 'price-low';

    // Generate cache key based on query, sources, page, and filters
    const cacheKey = `search_${query}_${sources.sort().join(',')}_page${page}_${minPrice || 'any'}_${maxPrice || 'any'}_${sortBy}`;
    
    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      const tookMs = Date.now() - startTime;
      console.log(`[API] Cache HIT for "${query}" (${tookMs}ms)`);
      
      return res.status(200).json({
        ...cachedResult,
        tookMs, // Update with actual response time
        cached: true, // Indicate this is from cache
      });
    }
    
    console.log(`[API] Cache MISS for "${query}"`);

    // PHASE 1: Scan prices from all sources in parallel
    console.log(`[API] Phase 1: Scanning prices from ${sources.length} source(s)...`);
    
    const scanPromises = sources.map(async (source) => {
      const adapter = ADAPTERS[source];
      
      if (!adapter || !adapter.scanPrices) {
        console.warn(`[API] Source "${source}" does not support scanPrices`);
        return [];
      }

      try {
        return await adapter.scanPrices(query, {
          maxResults,
          minPrice,
          maxPrice,
          sortBy,
        });
      } catch (error) {
        console.error(`[API] Error scanning ${source}:`, error.message);
        return [];
      }
    });

    const scanResults = await Promise.all(scanPromises);
    const allPriceItems = scanResults.flat();
    
    if (allPriceItems.length === 0) {
      console.log(`[API] No results found for "${query}"`);
      return res.status(200).json({
        query,
        sources,
        tookMs: Date.now() - startTime,
        errors: [],
        items: [],
        totalResults: 0,
        currentPage: 1,
        totalPages: 0,
        cached: false,
      });
    }

    // PHASE 2: Sort combined results globally by price
    console.log(`[API] Phase 2: Sorting ${allPriceItems.length} items by price...`);
    
    if (sortBy === 'price-low') {
      allPriceItems.sort((a, b) => {
        const priceA = a.priceValue ?? Infinity;
        const priceB = b.priceValue ?? Infinity;
        // Free items first, then ascending
        if (priceA === 0 && priceB === 0) return 0;
        if (priceA === 0) return -1;
        if (priceB === 0) return 1;
        return priceA - priceB;
      });
    } else if (sortBy === 'price-high') {
      allPriceItems.sort((a, b) => {
        const priceA = a.priceValue ?? 0;
        const priceB = b.priceValue ?? 0;
        return priceB - priceA;
      });
    }

    // PHASE 3: Calculate pagination
    const totalResults = allPriceItems.length;
    const totalPages = Math.ceil(totalResults / perPage);
    const validPage = Math.min(Math.max(1, page), totalPages || 1);
    
    console.log(`[API] Pagination: ${totalResults} total items, ${totalPages} pages, requesting page ${validPage}`);

    // PHASE 4: Slice for current page
    const startIndex = (validPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, totalResults);
    const pageItems = allPriceItems.slice(startIndex, endIndex);
    
    console.log(`[API] Phase 4: Selected items ${startIndex}-${endIndex-1} (${pageItems.length} items)`);

    // PHASE 5: Group URLs by source for enrichment
    const urlsBySource = {};
    pageItems.forEach(item => {
      if (!urlsBySource[item.source]) {
        urlsBySource[item.source] = [];
      }
      urlsBySource[item.source].push(item.url);
    });
    
    console.log(`[API] Phase 5: Enriching details...`, 
      Object.entries(urlsBySource).map(([src, urls]) => `${src}: ${urls.length} URLs`).join(', ')
    );

    // PHASE 6: Enrich details for current page items only
    const enrichPromises = Object.entries(urlsBySource).map(async ([source, urls]) => {
      const adapter = ADAPTERS[source];
      
      if (!adapter || !adapter.enrichDetails) {
        console.warn(`[API] Source "${source}" does not support enrichDetails`);
        return [];
      }

      try {
        const enriched = await adapter.enrichDetails(urls);
        return enriched;
      } catch (error) {
        console.error(`[API] Error enriching ${source}:`, error.message);
        return [];
      }
    });

    const enrichResults = await Promise.all(enrichPromises);
    const allEnriched = enrichResults.flat();
    
    // PHASE 7: Merge enriched details with price data
    const enrichedMap = new Map();
    allEnriched.forEach(item => {
      enrichedMap.set(item.url, item);
    });
    
    const finalItems = pageItems.map(priceItem => {
      const enriched = enrichedMap.get(priceItem.url);
      if (!enriched) {
        console.warn(`[API] No enriched data for ${priceItem.url}`);
        return null;
      }
      
      // Merge: enriched data takes priority, but keep price info from scan
      const merged = {
        ...enriched,
        priceValue: priceItem.priceValue, // Use parsed value from scan
        imageUrl: priceItem.imageUrl || enriched.imageUrl, // Prefer scan image
      };
      
      // Normalize to ensure consistent format
      const sourceName = priceItem.source === 'ss' ? 'SS.lv' : 'Andele Mandele';
      return normalizeListing(merged, priceItem.source, sourceName);
    }).filter(Boolean);
    
    console.log(`[API] Phase 7: Successfully merged ${finalItems.length} items`);

    // Return unified response per SPEC.md
    const tookMs = Date.now() - startTime;

    const response = {
      query,
      sources,
      tookMs,
      errors: [],
      items: finalItems,
      totalResults,
      currentPage: validPage,
      totalPages,
      cached: false,
    };
    
    // Cache the successful response
    if (finalItems.length > 0) {
      cache.set(cacheKey, response, CACHE_TTL);
      console.log(`[API] Cached results for "${query}" page ${validPage} (${finalItems.length} items, TTL: ${CACHE_TTL/1000}s)`);
    }

    res.status(200).json(response);
  } catch (error) {
    const tookMs = Date.now() - startTime;
    res.status(500).json({
      query: req.query.q || "",
      sources: [],
      tookMs,
      errors: [{ source: "api", message: error?.message || String(error) }],
      items: [],
      cached: false,
    });
  }
}
