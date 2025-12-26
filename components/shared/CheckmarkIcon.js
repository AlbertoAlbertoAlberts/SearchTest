import styles from "./CheckmarkIcon.module.css";

export default function CheckmarkIcon({ checked = true }) {
  return (
    <span className={`${styles.checkmark} ${checked ? styles.checked : styles.unchecked}`}>
      {checked ? "✓" : "○"}
    </span>
  );
}
