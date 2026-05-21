import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearSession, getCurrentUser, getToken } from "../../lib/auth";
import styles from "./PublicHeader.module.css";

export function PublicHeader() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const hasSession = Boolean(getToken());

  function handleSignOut() {
    clearSession();
    navigate("/auth");
  }

  return (
    <header className={styles.header}>
      <nav className={styles.navbar} aria-label="Main navigation">
        <Link className={styles.brand} to="/">
          <span className={styles.brandMark}>F</span>
          <span className={styles.brandText}>
            <strong>fitme.io</strong>
            <small>AI nutrition & habits</small>
          </span>
        </Link>

        <div className={styles.links}>
          <NavLink className={({ isActive }) => (isActive ? styles.active : styles.link)} to="/">
            Home
          </NavLink>
          {user?.role === "admin" ? (
            <NavLink className={({ isActive }) => (isActive ? styles.active : styles.link)} to="/admin">
              Admin
            </NavLink>
          ) : null}
          {hasSession ? (
            <button className={styles.button} type="button" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <NavLink className={({ isActive }) => (isActive ? styles.active : styles.link)} to="/auth">
              Sign in
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}
