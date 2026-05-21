import { Link } from "react-router-dom";
import styles from "./PublicFooter.module.css";

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>© {new Date().getFullYear()} fitme.io. All rights reserved.</p>
        <nav className={styles.links} aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/auth">Sign in</Link>
        </nav>
      </div>
    </footer>
  );
}
