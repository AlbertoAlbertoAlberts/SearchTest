import React from "react";
import styles from "./Sidebar.module.css";

const MARKETPLACE_GROUPS = {
  Latvia: [
    { id: "ss", name: "SS.lv / SS.com" },
    { id: "andele", name: "Andele Mandele" },
    { id: "pp", name: "PP.lv" },
  ],
  Estonia: [
    { id: "okidoki", name: "Okidoki" },
    { id: "osta", name: "Osta" },
    { id: "soov", name: "Soov" },
  ],
  Lithuania: [
    { id: "skelbiu", name: "Skelbiu" },
    { id: "vinted", name: "Vinted (LT)" },
  ],
  Finland: [
    { id: "tori", name: "Tori" },
    { id: "huuto", name: "Huuto" },
  ],
  Poland: [
    { id: "olx", name: "OLX" },
    { id: "allegro", name: "Allegro Lokalnie" },
    { id: "sprzedajemy", name: "Sprzedajemy" },
  ],
};

const CONDITIONS = ["New", "Good as New", "Used", "Bad", "Broken"];

export default function Sidebar({ filters, onFilterChange, minPrice, maxPrice, onPriceFilterChange, sidebarOpen, onToggle }) {
  // Local state for price inputs (before applying)
  const [localMinPrice, setLocalMinPrice] = React.useState(minPrice || "");
  const [localMaxPrice, setLocalMaxPrice] = React.useState(maxPrice || "");
  const [priceError, setPriceError] = React.useState("");
  
  // Sync local state with props when they change
  React.useEffect(() => {
    setLocalMinPrice(minPrice || "");
    setLocalMaxPrice(maxPrice || "");
  }, [minPrice, maxPrice]);
  
  const handleApplyPriceFilter = () => {
    const min = localMinPrice.trim();
    const max = localMaxPrice.trim();
    
    // Validation
    const minNum = min ? parseFloat(min) : null;
    const maxNum = max ? parseFloat(max) : null;
    
    if (minNum !== null && minNum < 0) {
      setPriceError("Minimum price cannot be negative");
      return;
    }
    
    if (maxNum !== null && maxNum < 0) {
      setPriceError("Maximum price cannot be negative");
      return;
    }
    
    if (minNum !== null && maxNum !== null && minNum > maxNum) {
      setPriceError("Minimum price must be less than maximum price");
      return;
    }
    
    setPriceError("");
    
    if (onPriceFilterChange) {
      onPriceFilterChange(min, max);
    }
  };
  
  const handleClearPriceFilter = () => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    setPriceError("");
    if (onPriceFilterChange) {
      onPriceFilterChange("", "");
    }
  };
  
  const handleSourceToggle = (sourceId) => {
    if (!onFilterChange) return;
    
    const currentSources = filters?.selectedSources || [];
    const newSources = currentSources.includes(sourceId)
      ? currentSources.filter(id => id !== sourceId)
      : [...currentSources, sourceId];
    
    onFilterChange({
      ...filters,
      selectedSources: newSources,
    });
  };

  const handleConditionToggle = (condition) => {
    if (!onFilterChange) return;
    
    const currentConditions = filters?.selectedConditions || [];
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter(c => c !== condition)
      : [...currentConditions, condition];
    
    onFilterChange({
      ...filters,
      selectedConditions: newConditions,
    });
  };

  const handlePriceChange = (type, value) => {
    if (!onFilterChange) return;
    
    onFilterChange({
      ...filters,
      priceRange: {
        ...filters?.priceRange,
        [type]: value ? parseInt(value, 10) : 0,
      },
    });
  };

  const handleDescriptionChange = (value) => {
    if (!onFilterChange) return;
    
    onFilterChange({
      ...filters,
      descriptionFilter: value,
    });
  };

  const handleClearFilters = () => {
    if (!onFilterChange) return;
    
    const defaultFilters = {
      selectedSources: [],
      priceRange: { min: 0, max: 1000 },
      selectedConditions: [],
      descriptionFilter: "all",
    };
    
    onFilterChange(defaultFilters);
  };

  const isSourceSelected = (sourceId) => {
    return filters?.selectedSources?.includes(sourceId) || false;
  };

  const isConditionSelected = (condition) => {
    return filters?.selectedConditions?.includes(condition) || false;
  };

  return (
    <>
      {sidebarOpen && (
        <div 
          className={styles.overlay} 
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.mobileHeader}>
          <h2 className={styles.mobileTitle}>Filters</h2>
          <button 
            className={styles.closeButton}
            onClick={onToggle}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>

      <fieldset className={styles.filterSection}>
        <legend className={styles.sectionTitle}>Marketplace Sites</legend>
        
        {Object.entries(MARKETPLACE_GROUPS).map(([country, sites]) => (
          <div key={country} className={styles.countryGroup}>
            <h4 className={styles.countryTitle}>{country}</h4>
            {sites.map((site) => (
              <label key={site.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isSourceSelected(site.id)}
                  onChange={() => handleSourceToggle(site.id)}
                />
                <span>{site.name}</span>
              </label>
            ))}
          </div>
        ))}
      </fieldset>

      <fieldset className={styles.filterSection}>
        <legend className={styles.sectionTitle}>Price Range</legend>
        <div className={styles.priceInputs}>
          <div className={styles.priceInput}>
            <label>Min €</label>
            <input 
              type="number" 
              placeholder="No min"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              min="0"
            />
          </div>
          <div className={styles.priceInput}>
            <label>Max €</label>
            <input 
              type="number" 
              placeholder="No max"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              min="0"
            />
          </div>
        </div>
        
        {/* Dual range sliders */}
        <div className={styles.sliderContainer}>
          <div className={styles.sliderTrack}>
            <div 
              className={styles.sliderRange}
              style={{
                left: `${(parseInt(localMinPrice) || 0) / 10}%`,
                right: `${100 - ((parseInt(localMaxPrice) || 1000) / 10)}%`
              }}
            />
          </div>
          <input
            type="range"
            className={styles.rangeSlider}
            min="0"
            max="1000"
            step="10"
            value={localMinPrice || 0}
            onChange={(e) => {
              const value = e.target.value;
              if (!localMaxPrice || parseInt(value) <= parseInt(localMaxPrice)) {
                setLocalMinPrice(value);
              }
            }}
          />
          <input
            type="range"
            className={styles.rangeSlider}
            min="0"
            max="1000"
            step="10"
            value={localMaxPrice || 1000}
            onChange={(e) => {
              const value = e.target.value;
              if (!localMinPrice || parseInt(value) >= parseInt(localMinPrice)) {
                setLocalMaxPrice(value);
              }
            }}
          />
        </div>
        <div className={styles.sliderLabels}>
          <span>€0</span>
          <span>€1000+</span>
        </div>
        
        {priceError && (
          <div className={styles.priceError}>{priceError}</div>
        )}
        <div className={styles.priceButtons}>
          <button 
            className={styles.applyButton} 
            onClick={handleApplyPriceFilter}
            type="button"
          >
            Apply
          </button>
          {(minPrice || maxPrice) && (
            <button 
              className={styles.clearPriceButton} 
              onClick={handleClearPriceFilter}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
        {(minPrice || maxPrice) && (
          <div className={styles.activeFilter}>
            Active: €{minPrice || '0'} - €{maxPrice || '∞'}
          </div>
        )}
      </fieldset>

      <fieldset className={styles.filterSection}>
        <legend className={styles.sectionTitle}>Condition</legend>
        {CONDITIONS.map((condition) => (
          <label key={condition} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={isConditionSelected(condition)}
              onChange={() => handleConditionToggle(condition)}
            />
            <span>{condition}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className={styles.filterSection}>
        <legend className={styles.sectionTitle}>Description</legend>
        <label className={styles.radioLabel}>
          <input 
            type="radio" 
            name="description" 
            value="all" 
            checked={filters?.descriptionFilter === "all"}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className={styles.radio} 
          />
          <span>All</span>
        </label>
        <label className={styles.radioLabel}>
          <input 
            type="radio" 
            name="description" 
            value="has"
            checked={filters?.descriptionFilter === "has"}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className={styles.radio} 
          />
          <span>Has Description</span>
        </label>
        <label className={styles.radioLabel}>
          <input 
            type="radio" 
            name="description" 
            value="none"
            checked={filters?.descriptionFilter === "none"}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className={styles.radio} 
          />
          <span>No Description</span>
        </label>
      </fieldset>

      <button className={styles.clearButton} onClick={handleClearFilters} aria-label="Clear all filters">
        Clear All Filters
      </button>
    </aside>
    </>
  );
}
