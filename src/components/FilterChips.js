import React from 'react';
import styles from './Header.module.css';

export default function FilterChips({ filters = [], onEdit, onRemove }) {
  if (!filters || filters.length === 0) return null;

  return (
    <div className={styles.chipsBar} role="list" aria-label="Active filters">
      {filters.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={styles.chip}
          onClick={() => onEdit && onEdit(chip.id)}
          aria-pressed="false"
        >
          <span className={styles.chipLabel} aria-hidden="true">{chip.value}</span>
          <span className={styles.visuallyHidden}>{chip.label}</span>
          <button
            type="button"
            className={styles.chipRemove}
            onClick={(e) => {
              e.stopPropagation();
              onRemove && onRemove(chip.id);
            }}
            aria-label={`Remove ${chip.label} filter`}
          >
            ×
          </button>
        </button>
      ))}
    </div>
  );
}
