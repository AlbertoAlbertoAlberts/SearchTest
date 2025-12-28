/**
 * API orchestrator for marketplace search.
 * Coordinates adapters, merges results, and returns unified response per SPEC.md.
 */

import * as ssAdapter from "../../lib/adapters/ss.js";
import * as andeleAdapter from "../../lib/adapters/andele.js";
import cache from "../../lib/cache.js";

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

    // Collect results and errors from each adapter
    const results = [];
    const errors = [];
    let metadata = null;

    // Execute adapters in parallel
    const adapterPromises = sources.map(async (source) => {
      const adapter = ADAPTERS[source];
      
      if (!adapter) {
        errors.push({
          source,
          message: `Unknown source: ${source}`,
        });
        return;
      }

      try {
        const result = await adapter.search(query, {
          maxResults,
          resultsPerPage: perPage,
          currentPage: page,
          fetchDetails: true,
          minPrice,
          maxPrice,
          sortBy,
        });
        
        // Adapter now returns {items, totalResults, currentPage, totalPages, showNotification}
        results.push(...result.items);
        
        // Store metadata from first adapter (for now we only have one)
        if (!metadata) {
          metadata = {
            totalResults: result.totalResults,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            showNotification: result.showNotification,
          };
        }
      } catch (error) {
        errors.push({
          source,
          message: error.message || String(error),
        });
      }
    });

    await Promise.all(adapterPromises);

    // Return unified response per SPEC.md
    const tookMs = Date.now() - startTime;

    const response = {
      query,
      sources,
      tookMs,
      errors,
      items: results,
      totalResults: metadata?.totalResults || results.length,
      currentPage: metadata?.currentPage || page,
      totalPages: metadata?.totalPages || 1,
      showNotification: metadata?.showNotification || false,
      cached: false,
    };
    
    // Cache the successful response (only if no errors)
    if (errors.length === 0 && results.length > 0) {
      cache.set(cacheKey, response, CACHE_TTL);
      console.log(`[API] Cached results for "${query}" (${results.length} items, TTL: ${CACHE_TTL/1000}s)`);
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
