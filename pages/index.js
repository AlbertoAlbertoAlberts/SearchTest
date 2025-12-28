import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ResultsView from "../components/ResultsView";
import { applyFilters, sortItems, buildQueryString, parseFiltersFromUrl } from "../lib/filterHelpers";
import styles from "../styles/Home.module.css";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawItems, setRawItems] = useState([]); // Raw API response
  const [displayItems, setDisplayItems] = useState([]); // Filtered and sorted
  const [error, setError] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [sortBy, setSortBy] = useState("price-low"); // Default to price low to high
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Price filter state (separate from general filters for direct API passthrough)
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    selectedSources: ["ss"], // Default to SS.lv for now
    priceRange: { min: 0, max: 1000 },
    selectedConditions: [],
    descriptionFilter: "all",
  });

  // Initialize from URL on mount
  useEffect(() => {
    if (router.isReady) {
      const query = router.query.q || "";
      const parsedFilters = parseFiltersFromUrl(router.query);
      const sort = router.query.sort || "price-low"; // Default to price-low
      const min = router.query.minPrice || "";
      const max = router.query.maxPrice || "";

      setSearchQuery(query);
      setFilters(parsedFilters);
      setSortBy(sort);
      setMinPrice(min);
      setMaxPrice(max);

      if (query) {
        performSearch(query, parsedFilters, sort, min, max);
      }
    }
  }, [router.isReady]);

  // Update URL when filters or query change
  useEffect(() => {
    if (!router.isReady) return;

    const queryString = buildQueryString(searchQuery, filters);
    const params = new URLSearchParams(queryString);
    
    // Add price filters and sort
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('sort', sortBy);
    
    const newUrl = params.toString() ? `/?${params.toString()}` : "/";

    // Only update if different from current
    if (router.asPath !== newUrl) {
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [searchQuery, filters, sortBy, minPrice, maxPrice, router.isReady]);

  // Perform search with current filters
  async function performSearch(query, searchFilters = filters, sort = sortBy, min = minPrice, max = maxPrice) {
    if (!query || !query.trim()) {
      setRawItems([]);
      setDisplayItems([]);
      setMetadata(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Build API URL with sources parameter
      const sources = searchFilters.selectedSources.length > 0 
        ? searchFilters.selectedSources.join(',') 
        : 'ss';
      
      // Build API URL with price filters and sort
      const params = new URLSearchParams({
        q: query,
        sources: sources,
        sortBy: sort,
      });
      
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
      
      const apiUrl = `/api/search?${params.toString()}`;
      
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }
      
      // Store raw items
      setRawItems(data.items || []);
      
      // Apply filters and sorting
      const filtered = applyFilters(data.items || [], searchFilters);
      const sorted = sortItems(filtered, sortBy);
      setDisplayItems(sorted);
      
      setMetadata({
        tookMs: data.tookMs,
        errors: data.errors || [],
        sources: data.sources || [],
      });
    } catch (err) {
      setError(err.message || String(err));
      setRawItems([]);
      setDisplayItems([]);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  }

  // Re-apply filters and sorting when they change (memoized)
  useEffect(() => {
    if (rawItems.length > 0) {
      const filtered = applyFilters(rawItems, filters);
      const sorted = sortItems(filtered, sortBy);
      setDisplayItems(sorted);
    } else {
      setDisplayItems([]);
    }
  }, [filters, sortBy, rawItems]);

  // Memoized handlers for performance
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    performSearch(query, filters, sortBy, minPrice, maxPrice);
  }, [filters, sortBy, minPrice, maxPrice]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // Update URL with current search and filters
    const queryString = buildQueryString(searchQuery, newFilters, sortBy);
    router.push(`/?${queryString}`, undefined, { shallow: true });
  }, [searchQuery, sortBy]);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    // Trigger new search with new sort order
    if (searchQuery) {
      performSearch(searchQuery, filters, newSort, minPrice, maxPrice);
    }
  }, [searchQuery, filters, minPrice, maxPrice]);
  
  // Handler for price filter changes
  const handlePriceFilterChange = useCallback((min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
    // Trigger new search with new price filters
    if (searchQuery) {
      performSearch(searchQuery, filters, sortBy, min, max);
    }
  }, [searchQuery, filters, sortBy]);

  // Re-search when sources change (requires new API call)
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, filters, sortBy, minPrice, maxPrice);
    }
  }, [filters.selectedSources]);

  return (
    <div className={styles.layout}>
      <Header 
        searchQuery={searchQuery} 
        onSearch={handleSearch}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className={styles.main}>
        <Sidebar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceFilterChange={handlePriceFilterChange}
          sidebarOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(false)}
        />
        
        {error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorBox}>
              <h2>⚠️ Error</h2>
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <ResultsView
            items={displayItems}
            loading={loading}
            errors={metadata?.errors}
            metadata={metadata}
            currentSort={sortBy}
            onSortChange={handleSortChange}
          />
        )}
      </div>
    </div>
  );
}