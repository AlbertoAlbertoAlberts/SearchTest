import { useState, useEffect } from "react";
import styles from "./SearchBar.module.css";

export default function SearchBar({ initialQuery = "", onSearch }) {
  const [query, setQuery] = useState(initialQuery || "");

  useEffect(() => {
    setQuery(initialQuery || "");
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = (query || "").toString().trim();
    if (onSearch) onSearch(trimmed);
  };

  return (
    <form className={styles.searchForm} onSubmit={handleSubmit} role="search" aria-label="Site search">
      <label htmlFor="search-input" className={styles.visuallyHidden}>
        Search for listings
      </label>
      <input
        id="search-input"
        type="text"
        className={styles.searchInput}
        placeholder="Search for items..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search listings"
      />

      <button
        type="submit"
        className={styles.searchButton}
        aria-label="Submit search"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
