import styles from "./AdminFooter.module.css";

export function AdminFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>fitme.io admin</span>
        <span>System management console</span>
      </div>
    </footer>
  );
}
