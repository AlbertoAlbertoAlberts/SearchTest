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

export default function Sidebar({ filters, onFilterChange, sidebarOpen, onToggle }) {
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
            <label>Min</label>
            <input 
              type="number" 
              placeholder="€0"
              value={filters?.priceRange?.min || 0}
              onChange={(e) => handlePriceChange('min', e.target.value)}
            />
          </div>
          <div className={styles.priceInput}>
            <label>Max</label>
            <input 
              type="number" 
              placeholder="€1000"
              value={filters?.priceRange?.max || 1000}
              onChange={(e) => handlePriceChange('max', e.target.value)}
            />
          </div>
        </div>
        <input
          type="range"
          className={styles.rangeSlider}
          min="0"
          max="1000"
          value={filters?.priceRange?.max || 1000}
          onChange={(e) => handlePriceChange('max', e.target.value)}
        />
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
