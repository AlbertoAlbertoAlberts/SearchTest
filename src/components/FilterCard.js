import React from 'react';
import styles from './Header.module.css';

// Controlled single-question FilterCard similar to Frontend-example
export default function FilterCard({ question, isActive = true, answer, onAnswer, onSkip }) {
  if (!question) return null;

  return (
    <div className={styles.filterCard} role="region" aria-label="Guided filter">
      <div className={styles.filterMeta}>{question?.id}</div>
      <div className={styles.filterQuestion}>{question.question}</div>

      <div className={styles.filterOptions}>
        {(question.options || []).map((opt) => (
          <button
            key={opt}
            type="button"
            className={`${styles.filterOption} ${answer === opt ? styles.selectedOption : ''}`}
            onClick={() => onAnswer && onAnswer(question.id, opt)}
            aria-pressed={answer === opt}
          >
            {opt}
          </button>
        ))}

        <button type="button" className={styles.filterSkip} onClick={() => onSkip && onSkip(question.id)}>Skip</button>
      </div>
    </div>
  );
}
