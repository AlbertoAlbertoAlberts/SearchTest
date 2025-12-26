/**
 * API orchestrator for marketplace search.
 * Coordinates adapters, merges results, and returns unified response per SPEC.md.
 */

import * as ssAdapter from "../../lib/adapters/ss.js";

// Map of available adapters
const ADAPTERS = {
  ss: ssAdapter,
};

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

    res.status(200).json({
      query,
      sources,
      tookMs,
      errors,
      items: results,
    });
  } catch (error) {
    const tookMs = Date.now() - startTime;
    res.status(500).json({
      query: req.query.q || "",
      sources: [],
      tookMs,
      errors: [{ source: "api", message: error?.message || String(error) }],
      items: [],
    });
  }
}
