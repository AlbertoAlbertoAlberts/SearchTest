import styles from './SkeletonCard.module.css';

export default function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.image}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.title}></div>
          <div className={styles.price}></div>
        </div>
        <div className={styles.metadata}>
          <div className={styles.metaItem}></div>
          <div className={styles.metaItem}></div>
          <div className={styles.metaItem}></div>
        </div>
        <div className={styles.source}></div>
      </div>
    </div>
  );
}
