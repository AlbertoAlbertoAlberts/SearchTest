/**
 * Client-side filtering and sorting utilities for listings.
 * Used to filter and sort results after API returns data.
 */

/**
 * Apply all filters to a list of items
 */
export function applyFilters(items, filters) {
  if (!items || items.length === 0) return [];

  let filtered = [...items];

  // Filter by price range
  if (filters.priceRange) {
    const { min, max } = filters.priceRange;
    if (min > 0 || max < 1000) {
      filtered = filtered.filter((item) => {
        if (!item.priceValue) return true; // Keep items without price
        return item.priceValue >= min && item.priceValue <= max;
      });
    }
  }

  // Filter by condition
  if (filters.selectedConditions && filters.selectedConditions.length > 0) {
    filtered = filtered.filter((item) => {
      if (!item.conditionText) return false;
      return filters.selectedConditions.includes(item.conditionText);
    });
  }

  // Filter by description
  if (filters.descriptionFilter) {
    if (filters.descriptionFilter === "has") {
      filtered = filtered.filter((item) => item.hasDescription === true);
    } else if (filters.descriptionFilter === "none") {
      filtered = filtered.filter((item) => !item.hasDescription);
    }
    // "all" means no filtering
  }

  return filtered;
}

/**
 * Sort items based on sort option
 */
export function sortItems(items, sortBy) {
  if (!items || items.length === 0) return [];

  const sorted = [...items];

  switch (sortBy) {
    case "newest":
      // Sort by postedAtISO if available, otherwise by postedAtText
      return sorted.sort((a, b) => {
        const dateA = a.postedAtISO ? new Date(a.postedAtISO) : new Date(0);
        const dateB = b.postedAtISO ? new Date(b.postedAtISO) : new Date(0);
        return dateB - dateA; // Newest first
      });

    case "price_asc":
      // Sort by price ascending (items without price go last)
      return sorted.sort((a, b) => {
        if (!a.priceValue) return 1;
        if (!b.priceValue) return -1;
        return a.priceValue - b.priceValue;
      });

    case "price_desc":
      // Sort by price descending (items without price go last)
      return sorted.sort((a, b) => {
        if (!a.priceValue) return 1;
        if (!b.priceValue) return -1;
        return b.priceValue - a.priceValue;
      });

    case "relevance":
    default:
      // Keep original order (relevance/API order)
      return sorted;
  }
}

/**
 * Get count of active filters (excluding defaults)
 */
export function getActiveFilterCount(filters) {
  let count = 0;

  // Count selected sources (if not default)
  if (filters.selectedSources && filters.selectedSources.length > 0) {
    count += filters.selectedSources.length;
  }

  // Count price filter if not default
  if (filters.priceRange) {
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) {
      count += 1;
    }
  }

  // Count condition filters
  if (filters.selectedConditions && filters.selectedConditions.length > 0) {
    count += filters.selectedConditions.length;
  }

  // Count description filter if not "all"
  if (filters.descriptionFilter && filters.descriptionFilter !== "all") {
    count += 1;
  }

  return count;
}

/**
 * Build URL query string from filters and search query
 */
export function buildQueryString(query, filters) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (filters.selectedSources && filters.selectedSources.length > 0) {
    params.set("sources", filters.selectedSources.join(","));
  }

  if (filters.priceRange) {
    if (filters.priceRange.min > 0) {
      params.set("priceMin", filters.priceRange.min.toString());
    }
    if (filters.priceRange.max < 1000) {
      params.set("priceMax", filters.priceRange.max.toString());
    }
  }

  if (filters.selectedConditions && filters.selectedConditions.length > 0) {
    params.set("conditions", filters.selectedConditions.join(","));
  }

  if (filters.descriptionFilter && filters.descriptionFilter !== "all") {
    params.set("description", filters.descriptionFilter);
  }

  return params.toString();
}

/**
 * Parse filters from URL query parameters
 * @param {object} queryObject - Next.js router.query object
 */
export function parseFiltersFromUrl(queryObject) {
  const filters = {
    selectedSources: [],
    priceRange: { min: 0, max: 1000 },
    selectedConditions: [],
    descriptionFilter: "all",
  };

  // Parse sources
  const sources = queryObject.sources;
  if (sources) {
    filters.selectedSources = sources.split(",").filter(Boolean);
  } else {
    filters.selectedSources = ["ss"]; // Default
  }

  // Parse price range
  const priceMin = queryObject.priceMin;
  const priceMax = queryObject.priceMax;
  if (priceMin) filters.priceRange.min = parseInt(priceMin, 10);
  if (priceMax) filters.priceRange.max = parseInt(priceMax, 10);

  // Parse conditions
  const conditions = queryObject.conditions;
  if (conditions) {
    filters.selectedConditions = conditions.split(",").filter(Boolean);
  }

  // Parse description filter
  const description = queryObject.description;
  if (description && ["all", "has", "none"].includes(description)) {
    filters.descriptionFilter = description;
  }

  return filters;
}
