import { Link, useNavigate } from "react-router-dom";
import { clearSession, getCurrentUser, getToken } from "../../lib/auth";
import styles from "./AdminHeader.module.css";

export function AdminHeader() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAdmin = Boolean(getToken() && user?.role === "admin");

  function handleSignOut() {
    clearSession();
    navigate("/admin/auth");
  }

  return (
    <header className={styles.header}>
      <nav className={styles.navbar} aria-label="Admin navigation">
        <Link className={styles.brand} to={isAdmin ? "/admin" : "/"}>
          <span className={styles.brandMark}>F</span>
          <span className={styles.brandText}>
            <strong>fitme.io</strong>
            <small>Admin Dashboard</small>
          </span>
        </Link>

        <div className={styles.links}>
          {isAdmin ? (
            <button className={styles.button} type="button" onClick={handleSignOut}>
              Log out
            </button>
          ) : (
            <Link className={styles.link} to="/">
              Home
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
