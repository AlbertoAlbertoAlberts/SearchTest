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
    imageUrl,
    descriptionPreview,
  } = listing;

  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title || "Listing image"}
            className={styles.listingImage}
            width="140"
            height="140"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={styles.imagePlaceholder} 
          style={{ display: imageUrl ? 'none' : 'flex' }}
          role="img" 
          aria-label={imageUrl ? "Listing image placeholder" : "No image available"}
        >
          <span className={styles.imageIcon} aria-hidden="true">{imageUrl ? '🖼️' : '📷'}</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          {descriptionPreview && (
            <div className={styles.descriptionSection}>
              <span className={styles.descriptionLabel}>Description:</span>
              <span className={styles.descriptionText}>{descriptionPreview}</span>
            </div>
          )}
          {priceText && <div className={styles.price}>{priceText}</div>}
        </div>

        <div className={styles.metadata}>
          {postedAtText && (
            <div className={styles.metadataItem}>
              <CheckmarkIcon checked={true} />
              <span>Listing added: {postedAtText}</span>
            </div>
          )}

          {conditionText && (
            <div className={styles.metadataItem}>
              <CheckmarkIcon checked={true} />
              <span>Condition: {conditionText}</span>
            </div>
          )}
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
