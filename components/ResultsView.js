import ListingCard from "./ListingCard";
import SkeletonCard from "./SkeletonCard";
import styles from "./ResultsView.module.css";

export default function ResultsView({ items, loading, errors, metadata, onSortChange, currentSort }) {
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
              Showing {items?.length || 0} listings
              {metadata?.tookMs && (
                <span className={styles.timing}> · {metadata.tookMs}ms</span>
              )}
            </div>

            <div className={styles.sortDropdown}>
              <label htmlFor="sort">Sort by:</label>
              <select 
                id="sort" 
                className={styles.select}
                value={currentSort || "relevance"}
                onChange={(e) => onSortChange && onSortChange(e.target.value)}
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {!items || items.length === 0 ? (
            <div className={styles.noResults}>
              <p>No listings found. Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className={styles.results}>
              {items.map((item, idx) => (
                <ListingCard key={item.id || idx} listing={item} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
