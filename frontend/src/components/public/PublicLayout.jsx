import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import styles from "./PublicLayout.module.css";

export function PublicLayout({ children }) {
  return (
    <div className={styles.layout}>
      <PublicHeader />
      <main className={styles.main}>{children}</main>
      <PublicFooter />
    </div>
  );
}
