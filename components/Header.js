import { useState } from "react";
import styles from "./Header.module.css";

export default function Header({ searchQuery, onSearch, sidebarOpen, onToggleSidebar }) {
  const [query, setQuery] = useState(searchQuery || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <header className={styles.header}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      
      <div className={styles.container}>
        <button 
          className={styles.menuButton}
          onClick={onToggleSidebar}
          aria-label="Toggle filters menu"
          aria-expanded={sidebarOpen}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        
        <div className={styles.logo}>
          <span className={styles.logoText}>Second-Hand Market Finder</span>
        </div>

        <form className={styles.searchForm} onSubmit={handleSubmit} role="search">
          <label htmlFor="search-input" className={styles.visuallyHidden}>
            Search for listings
          </label>
          <input
            id="search-input"
            type="text"
            className={styles.searchInput}
            placeholder="Search listings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search listings"
          />
          <button type="submit" className={styles.visuallyHidden}>
            Search
          </button>
        </form>

        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Browse</a>
          <a href="#" className={styles.navLink}>Categories</a>
          <a href="#" className={styles.navLink}>Saved</a>
        </nav>
      </div>
    </header>
  );
}
