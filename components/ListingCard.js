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
  
  // Debug: Log image data
  if (imageUrl) {
    console.log(`[ListingCard] Rendering with image: ${imageUrl}`);
  } else {
    console.log(`[ListingCard] No imageUrl for: ${title?.substring(0, 30)}...`);
  }

  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title || "Listing image"}
            className={styles.listingImage}
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

        </div>

        {descriptionPreview && (
          <div className={styles.descriptionPreview}>
            <p>{descriptionPreview}</p>
          </div>
        )}

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
