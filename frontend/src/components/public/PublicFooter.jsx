import { Link } from "react-router-dom";
import { getCurrentUser, getToken } from "../../lib/auth";
import styles from "./PublicFooter.module.css";

export function PublicFooter() {
  const user = getCurrentUser();
  const hasSession = Boolean(getToken());
  const accountPath = user?.role === "admin" ? "/admin" : "/profile";

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <strong>fitme.io</strong>
          <p>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
        <nav className={styles.links} aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          {hasSession ? <Link to={accountPath}>{user?.username || "Account"}</Link> : <Link to="/auth">Log in</Link>}
        </nav>
        <p className={styles.session}>
          {hasSession ? `Logged in as ${user?.username || "user"}` : "Logged out"}
        </p>
      </div>
    </footer>
  );
}
