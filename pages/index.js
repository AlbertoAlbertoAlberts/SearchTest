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
  const [sortBy, setSortBy] = useState("relevance");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      const sort = router.query.sort || "relevance";

      setSearchQuery(query);
      setFilters(parsedFilters);
      setSortBy(sort);

      if (query) {
        performSearch(query, parsedFilters);
      }
    }
  }, [router.isReady]);

  // Update URL when filters or query change
  useEffect(() => {
    if (!router.isReady) return;

    const queryString = buildQueryString(searchQuery, filters);
    const newUrl = queryString ? `/?${queryString}&sort=${sortBy}` : "/";

    // Only update if different from current
    if (router.asPath !== newUrl) {
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [searchQuery, filters, sortBy, router.isReady]);

  // Perform search with current filters
  async function performSearch(query, searchFilters = filters) {
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
      
      const apiUrl = `/api/search?q=${encodeURIComponent(query)}&sources=${sources}`;
      
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
    
    // Update URL with new query
    const queryString = buildQueryString(query, filters, sortBy);
    router.push(`/?${queryString}`, undefined, { shallow: true });
    
    performSearch(query, filters);
  }, [filters, sortBy]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // Update URL with current search and filters
    const queryString = buildQueryString(searchQuery, newFilters, sortBy);
    router.push(`/?${queryString}`, undefined, { shallow: true });
  }, [searchQuery, sortBy]);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    
    // Update URL with current search and filters
    const queryString = buildQueryString(searchQuery, filters, newSort);
    router.push(`/?${queryString}`, undefined, { shallow: true });
  }, [searchQuery, filters]);

  // Re-search when sources change (requires new API call)
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, filters);
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