/**
 * API orchestrator for marketplace search.
 * Coordinates adapters, merges results, and returns unified response per SPEC.md.
 */

import * as ssAdapter from "../../lib/adapters/ss.js";
import cache from "../../lib/cache.js";

// Map of available adapters
const ADAPTERS = {
  ss: ssAdapter,
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

    // Generate cache key based on query and sources
    const cacheKey = `search_${query}_${sources.sort().join(',')}`;
    
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
        const listings = await adapter.search(query);
        results.push(...listings);
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
