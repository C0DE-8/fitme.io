import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiLogIn, FiLogOut, FiUser } from "react-icons/fi";
import { clearSession, getCurrentUser, getToken } from "../../lib/auth";
import styles from "./PublicHeader.module.css";

export function PublicHeader() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const hasSession = Boolean(getToken());
  const accountPath = user?.role === "admin" ? "/admin" : "/profile";

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
          {!hasSession ? (
            <>
              <NavLink className={({ isActive }) => (isActive ? styles.active : styles.link)} to="/">
                Home
              </NavLink>
              <NavLink className={({ isActive }) => (isActive ? styles.active : styles.link)} to="/terms">
                Terms
              </NavLink>
            </>
          ) : null}
          {hasSession ? (
            <>
              <Link className={styles.account} to={accountPath} aria-label={`Open ${user?.username || "your"} account`}>
                <span>
                  <FiUser aria-hidden="true" />
                </span>
                <strong>{user?.username || "Account"}</strong>
                <small>Logged in</small>
              </Link>
              <button className={styles.button} type="button" onClick={handleSignOut}>
                <FiLogOut aria-hidden="true" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              <span className={styles.sessionState}>Logged out</span>
              <NavLink className={({ isActive }) => (isActive ? styles.authLinkActive : styles.authLink)} to="/auth">
                <FiLogIn aria-hidden="true" />
                <span>Log in</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
