import ListingCard from "./ListingCard";
import SkeletonCard from "./SkeletonCard";
import styles from "./ResultsView.module.css";

export default function ResultsView({ items, loading, errors, metadata, onSortChange, currentSort, onPageChange }) {
  if (loading) {
    return (
      <main className={styles.container} id="main-content" aria-busy="true">
        <div className={styles.loadingState}>
          <div className={styles.loadingHeader}>
            <div className={styles.spinner} role="status" aria-label="Loading results"></div>
            <p>Searching marketplaces...</p>
          </div>
          <div className={styles.results}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const hasNoSources = metadata && metadata.sources && metadata.sources.length === 0;
  const totalResults = metadata?.totalResults || 0;
  const currentPage = metadata?.currentPage || 1;
  const totalPages = metadata?.totalPages || 1;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show max 7 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (start > 2) pages.push('...');
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) pages.push('...');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <main className={styles.container} id="main-content" aria-busy="false">
      {errors && errors.length > 0 && (
        <div className={styles.errorBanner}>
          <div className={styles.errorHeader}>
            <strong>⚠️ Some sources encountered errors</strong>
          </div>
          <ul className={styles.errorList}>
            {errors.map((err, idx) => (
              <li key={idx}>
                <span className={styles.errorSource}>{err.source}:</span> {err.message}
              </li>
            ))}
          </ul>
          <div className={styles.errorFooter}>
            <p>Results may be incomplete. Try refreshing the page.</p>
          </div>
        </div>
      )}

      {hasNoSources ? (
        <div className={styles.noResults}>
          <p>👈 Please select at least one marketplace from the sidebar to search.</p>
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <div className={styles.resultsCount} role="status" aria-live="polite">
              Showing {items?.length || 0} of {totalResults} listings
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              {metadata?.tookMs && (
                <span className={styles.timing}> · {metadata.tookMs}ms</span>
              )}
            </div>

            <div className={styles.sortDropdown}>
              <label htmlFor="sort">Sort by:</label>
              <select 
                id="sort" 
                className={styles.select}
                value={currentSort || "price-low"}
                onChange={(e) => onSortChange && onSortChange(e.target.value)}
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="relevance" disabled>Relevance (coming soon)</option>
                <option value="newest" disabled>Newest First (coming soon)</option>
              </select>
            </div>
          </div>

          {!items || items.length === 0 ? (
            <div className={styles.noResults}>
              <p>No listings found. Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <div className={styles.results}>
                {items.map((item, idx) => (
                  <ListingCard key={item.id || idx} listing={item} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageButton}
                    onClick={() => onPageChange && onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    ← Previous
                  </button>

                  <div className={styles.pageNumbers}>
                    {getPageNumbers().map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          className={`${styles.pageNumber} ${pageNum === currentPage ? styles.active : ''}`}
                          onClick={() => onPageChange && onPageChange(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          aria-current={pageNum === currentPage ? 'page' : undefined}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    className={styles.pageButton}
                    onClick={() => onPageChange && onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
