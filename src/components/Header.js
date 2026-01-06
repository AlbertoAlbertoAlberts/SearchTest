import { useState } from "react";
import styles from "./Header.module.css";
import SearchBar from "./SearchBar";
import FilterChips from "./FilterChips";
import FilterCard from "./FilterCard";

export default function Header({ searchQuery, onSearch, sidebarOpen, onToggleSidebar, activeFilters = [], onFilterEdit, onFilterRemove, questions = [], activeQuestion = null, activeAnswer = undefined, onGuidedAnswer, onGuidedSkip, onGuidedComplete, filterCardStartIndex = 0, guidedOpen = false, hasSearched = false }) {
  const [query, setQuery] = useState(searchQuery || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <header className={styles.header}>
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
          <span className={styles.visuallyHidden}>Toggle filters menu</span>
        </button>
        
        <div className={styles.logo}>
          <span className={styles.logoText}>Second hand item finder</span>
        </div>

        <div className={styles.searchContainer}>
          <SearchBar initialQuery={searchQuery} onSearch={onSearch} />
        </div>
      </div>

      {/* Guided FilterCard (one question at a time) */}
      <div className={styles.filterCardContainer}>
        {guidedOpen && (
          <FilterCard question={activeQuestion} answer={activeAnswer} isActive={true} onAnswer={onGuidedAnswer} onSkip={onGuidedSkip} />
        )}
      </div>

      {/* Active filter chips (below filter card) */}
      <div className={styles.chipsContainer}>
        {hasSearched && <FilterChips filters={activeFilters} onEdit={onFilterEdit} onRemove={onFilterRemove} />}
      </div>
    </header>
  );
}
