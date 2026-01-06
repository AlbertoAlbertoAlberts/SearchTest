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
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCardStartIndex, setFilterCardStartIndex] = useState(0);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [guidedAnswers, setGuidedAnswers] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

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
      const page = parseInt(router.query.page) || 1;

      setSearchQuery(query);
      setFilters(parsedFilters);
      setSortBy(sort);
      setMinPrice(min);
      setMaxPrice(max);
      setCurrentPage(page);

      // Open guided flow only if there's a query
      if (query) {
        setGuidedOpen(true);
        setHasSearched(true);
        setCurrentQuestionIndex(0);
        setGuidedAnswers({});
        setEditingQuestionId(null);
        performSearch(query, parsedFilters, sort, min, max, page);
      } else {
        setGuidedOpen(false);
        setHasSearched(false);
      }
    }
  }, [router.isReady]);

  // Update URL when filters or query change
  useEffect(() => {
    if (!router.isReady) return;

    const queryString = buildQueryString(searchQuery, filters);
    const params = new URLSearchParams(queryString);
    
    // Add price filters, sort, and page
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage);
    
    const newUrl = params.toString() ? `/?${params.toString()}` : "/";

    // Only update if different from current
    if (router.asPath !== newUrl) {
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [searchQuery, filters, sortBy, minPrice, maxPrice, currentPage, router.isReady]);

  // Perform search with current filters
  async function performSearch(query, searchFilters = filters, sort = sortBy, min = minPrice, max = maxPrice, page = currentPage) {
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
      
      // Build API URL with price filters, sort, and page
      const params = new URLSearchParams({
        q: query,
        sources: sources,
        sortBy: sort,
        page: page,
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
        totalResults: data.totalResults,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
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
    setCurrentPage(1); // Reset to page 1 on new search
    // Open guided flow when user searches
    const open = Boolean(query && query.trim());
    setGuidedOpen(open);
    setHasSearched(open);
    setCurrentQuestionIndex(0);
    setGuidedAnswers({});
    setEditingQuestionId(null);
    performSearch(query, filters, sortBy, minPrice, maxPrice, 1);
  }, [filters, sortBy, minPrice, maxPrice]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 on filter change
    if (searchQuery) {
      performSearch(searchQuery, newFilters, sortBy, minPrice, maxPrice, 1);
    }
  }, [searchQuery, sortBy, minPrice, maxPrice]);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to page 1 on sort change
    if (searchQuery) {
      performSearch(searchQuery, filters, newSort, minPrice, maxPrice, 1);
    }
  }, [searchQuery, filters, minPrice, maxPrice]);
  
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    if (searchQuery) {
      performSearch(searchQuery, filters, sortBy, minPrice, maxPrice, newPage);
    }
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, filters, sortBy, minPrice, maxPrice]);
  
  // Handler for price filter changes
  const handlePriceFilterChange = useCallback((min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
    setCurrentPage(1); // Reset to page 1 on price change
    // Trigger new search with new price filters
    if (searchQuery) {
      performSearch(searchQuery, filters, sortBy, min, max, 1);
    }
  }, [searchQuery, filters, sortBy]);

  // Questions for guided FilterCard (simple set from example)
  const guidedQuestions = [
    { id: 'brand', question: 'What brand are you looking for?', options: ['Any', 'Apple', 'Samsung', 'Dell', 'HP', 'Lenovo'] },
    { id: 'condition', question: 'What condition works for you?', options: ['Any', 'Like New', 'Excellent', 'Good', 'Fair'] },
    { id: 'priceRange', question: "What's your budget?", options: ['Any', 'Under $200', '$200-$500', '$500-$1000', 'Over $1000'] },
    { id: 'category', question: 'Which category are you interested in?', options: ['Any', 'Laptops', 'Smartphones', 'Tablets', 'Audio', 'Cameras'] },
  ];

  // Compute active filter chips for Header using guided answers (mirrors Frontend-example)
  const activeFilterChips = useMemo(() => {
    const chips = [];
    // Conditions
    if (guidedAnswers.condition && guidedAnswers.condition !== 'Any') {
      chips.push({ id: 'conditions', label: 'Condition', value: guidedAnswers.condition });
    } else if (filters.selectedConditions && filters.selectedConditions.length > 0) {
      chips.push({ id: 'conditions', label: 'Condition', value: filters.selectedConditions.join(', ') });
    }

    // Brand
    if (guidedAnswers.brand && guidedAnswers.brand !== 'Any') {
      chips.push({ id: 'brand', label: 'Brand', value: guidedAnswers.brand });
    } else if (filters.brand) {
      chips.push({ id: 'brand', label: 'Brand', value: filters.brand });
    }

    // Category
    if (guidedAnswers.category && guidedAnswers.category !== 'Any') {
      chips.push({ id: 'category', label: 'Category', value: guidedAnswers.category });
    } else if (filters.category) {
      chips.push({ id: 'category', label: 'Category', value: filters.category });
    }

    // Price
    if ((guidedAnswers.priceRange && guidedAnswers.priceRange !== 'Any') || minPrice || maxPrice) {
      const priceVal = (minPrice || guidPriceMin(guidedAnswers.priceRange)) || '';
      const priceMaxVal = (maxPrice || guidPriceMax(guidedAnswers.priceRange)) || '';
      const label = `${priceVal || ''}${priceVal && priceMaxVal ? ' - ' : ''}${priceMaxVal || ''}`;
      chips.push({ id: 'price', label: 'Price', value: label });
    }

    return chips;
  }, [guidedAnswers, filters, minPrice, maxPrice]);

  // Helper functions to map guided answer to min/max for display (used above)
  function guidPriceMin(answer) {
    switch (answer) {
      case '$200-$500': return '200';
      case '$500-$1000': return '500';
      case 'Over $1000': return '1000';
      default: return '';
    }
  }

  function guidPriceMax(answer) {
    switch (answer) {
      case 'Under $200': return '200';
      case '$200-$500': return '500';
      case '$500-$1000': return '1000';
      default: return '';
    }
  }

  // Guided filter handlers (now maintain guidedAnswers & wire to filters)
  const handleGuidedAnswer = useCallback((questionId, answer) => {
    // Update guided answers
    const newAnswers = { ...guidedAnswers, [questionId]: answer };
    setGuidedAnswers(newAnswers);

    // Also update page-level filters for search
    if (questionId === 'brand') {
      const newFilters = { ...filters, brand: answer === 'Any' ? undefined : answer };
      setFilters(newFilters);
      if (searchQuery) performSearch(searchQuery, newFilters, sortBy, minPrice, maxPrice, 1);
    }

    if (questionId === 'condition') {
      const newFilters = { ...filters, selectedConditions: answer === 'Any' ? [] : [answer] };
      setFilters(newFilters);
      if (searchQuery) performSearch(searchQuery, newFilters, sortBy, minPrice, maxPrice, 1);
    }

    if (questionId === 'priceRange') {
      let min = '';
      let max = '';
      switch (answer) {
        case 'Under $200': min = ''; max = '200'; break;
        case '$200-$500': min = '200'; max = '500'; break;
        case '$500-$1000': min = '500'; max = '1000'; break;
        case 'Over $1000': min = '1000'; max = ''; break;
        default:
          min = '';
          max = '';
      }
      setMinPrice(min);
      setMaxPrice(max);
      if (searchQuery) performSearch(searchQuery, filters, sortBy, min, max, 1);
    }

    if (questionId === 'category') {
      const newFilters = { ...filters, category: answer === 'Any' ? undefined : answer };
      setFilters(newFilters);
      if (searchQuery) performSearch(searchQuery, newFilters, sortBy, minPrice, maxPrice, 1);
    }

    // If editing, close edit state; otherwise advance to next question (if there is one)
    setEditingQuestionId(null);
    if (!editingQuestionId && currentQuestionIndex < guidedQuestions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex((idx) => idx + 1), 300);
    }
  }, [guidedAnswers, filters, searchQuery, sortBy, minPrice, maxPrice, editingQuestionId, currentQuestionIndex, guidedQuestions]);

  const handleGuidedSkip = useCallback((questionId) => {
    const newAnswers = { ...guidedAnswers, [questionId]: 'Any' };
    setGuidedAnswers(newAnswers);
    setEditingQuestionId(null);
    if (!editingQuestionId && currentQuestionIndex < guidedQuestions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex((idx) => idx + 1), 300);
    }
  }, [guidedAnswers, editingQuestionId, currentQuestionIndex, guidedQuestions]);

  const handleGuidedComplete = useCallback(() => {
    // No auto-reset: keep the last question visible with selected answer (mirrors example)
    // We leave guidedOpen as-is (still true) so user can edit; app can close it explicitly if desired.
  }, []);


  const handleFilterEdit = useCallback((filterId) => {
    // Open sidebar and open guided flow in edit mode for the related question
    setSidebarOpen(true);
    setGuidedOpen(true);
    setEditingQuestionId(filterId);
    const idx = guidedQuestions.findIndex((q) => q.id === filterId);
    if (idx >= 0) {
      setCurrentQuestionIndex(idx);
      setFilterCardStartIndex(idx);
    } else {
      setCurrentQuestionIndex(0);
      setFilterCardStartIndex(0);
    }
  }, [guidedQuestions]);

  const handleFilterRemove = useCallback((filterId) => {
    // Also remove from guidedAnswers where applicable
    if (filterId === 'price') {
      setMinPrice('');
      setMaxPrice('');
      const newAnswers = { ...guidedAnswers };
      delete newAnswers['priceRange'];
      setGuidedAnswers(newAnswers);
      if (searchQuery) performSearch(searchQuery, filters, sortBy, '', '', 1);
    } else if (filterId === 'conditions') {
      const newFilters = { ...filters, selectedConditions: [] };
      setFilters(newFilters);
      const newAnswers = { ...guidedAnswers };
      delete newAnswers['condition'];
      setGuidedAnswers(newAnswers);
      if (searchQuery) performSearch(searchQuery, newFilters, sortBy, minPrice, maxPrice, 1);
    } else if (filterId === 'brand') {
      const newFilters = { ...filters };
      delete newFilters.brand;
      setFilters(newFilters);
      const newAnswers = { ...guidedAnswers };
      delete newAnswers['brand'];
      setGuidedAnswers(newAnswers);
      if (searchQuery) performSearch(searchQuery, newFilters, sortBy, minPrice, maxPrice, 1);
    } else if (filterId === 'category') {
      const newFilters = { ...filters };
      delete newFilters.category;
      setFilters(newFilters);
      const newAnswers = { ...guidedAnswers };
      delete newAnswers['category'];
      setGuidedAnswers(newAnswers);
      if (searchQuery) performSearch(searchQuery, newFilters, sortBy, minPrice, maxPrice, 1);
    }
  }, [searchQuery, filters, sortBy, minPrice, maxPrice, guidedAnswers]);

  // Re-search when sources change (requires new API call)
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1); // Reset to page 1 on source change
      performSearch(searchQuery, filters, sortBy, minPrice, maxPrice, 1);
    }
  }, [filters.selectedSources]);

  // Determine active question (editing vs progressive)
  const activeQuestion = editingQuestionId ? guidedQuestions.find(q => q.id === editingQuestionId) : guidedQuestions[currentQuestionIndex];
  const activeAnswer = activeQuestion ? guidedAnswers[activeQuestion.id] : undefined;

  return (
    <div className={styles.layout}>
      <Header 
        searchQuery={searchQuery} 
        onSearch={handleSearch}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeFilters={activeFilterChips}
        onFilterEdit={handleFilterEdit}
        onFilterRemove={handleFilterRemove}
        filterCardStartIndex={filterCardStartIndex}
        questions={guidedQuestions}
        guidedOpen={guidedOpen}
        onGuidedAnswer={handleGuidedAnswer}
        onGuidedSkip={handleGuidedSkip}
        onGuidedComplete={handleGuidedComplete}
        activeQuestion={activeQuestion}
        activeAnswer={activeAnswer}
        hasSearched={hasSearched}
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
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}