import { memo } from "react";
import styles from "./ListingCard.module.css";
import CheckmarkIcon from "./shared/CheckmarkIcon";

function ListingCard({ listing }) {
  const {
    title,
    priceText,
    url,
    sourceName,
    conditionText,
    postedAtText,
    hasDescription,
    hasImage,
  } = listing;

  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        {hasImage ? (
          <div className={styles.imagePlaceholder} role="img" aria-label="Listing image placeholder">
            <span className={styles.imageIcon} aria-hidden="true">🖼️</span>
          </div>
        ) : (
          <div className={styles.imagePlaceholder} role="img" aria-label="No image available">
            <span className={styles.imageIcon} aria-hidden="true">📷</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title || "(No title)"}</h3>
          {priceText && <div className={styles.price}>{priceText}</div>}
        </div>

        <div className={styles.metadata}>
          {conditionText && (
            <div className={styles.metadataItem}>
              <CheckmarkIcon checked={true} />
              <span>Condition: {conditionText}</span>
            </div>
          )}

          {postedAtText && (
            <div className={styles.metadataItem}>
              <CheckmarkIcon checked={true} />
              <span>Listing added: {postedAtText}</span>
            </div>
          )}

          <div className={styles.metadataItem}>
            <CheckmarkIcon checked={hasDescription} />
            <span>{hasDescription ? "Has Description" : "No Description"}</span>
          </div>
        </div>

        <div className={styles.source}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Source: {sourceName || "Unknown"}
          </a>
        </div>
      </div>
    </article>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ListingCard);
