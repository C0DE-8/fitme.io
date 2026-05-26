import { Link, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiArrowLeft, FiCompass, FiHome, FiRefreshCw } from "react-icons/fi";
import styles from "./ErrorPage.module.css";

const copy = {
  404: {
    eyebrow: "404",
    title: "Page not found",
    body: "The page you opened does not exist or the link has changed.",
    Icon: FiCompass,
  },
  500: {
    eyebrow: "500",
    title: "Something went wrong",
    body: "The app hit an unexpected error. Refresh the page or go back home.",
    Icon: FiAlertTriangle,
  },
};

export function ErrorPage({ status = 404, showBack = true }) {
  const navigate = useNavigate();
  const content = copy[status] || copy[500];
  const Icon = content.Icon;

  function handleRefresh() {
    window.location.reload();
  }

  return (
    <section className={styles.page} aria-labelledby="error-title">
      <div className={styles.art} aria-hidden="true">
        <span className={styles.status}>{content.eyebrow}</span>
        <Icon className={styles.icon} />
      </div>

      <div className={styles.copy}>
        <span>{content.eyebrow} error</span>
        <h1 id="error-title">{content.title}</h1>
        <p>{content.body}</p>
      </div>

      <div className={styles.actions}>
        <Link className={styles.primaryAction} to="/">
          <FiHome aria-hidden="true" />
          <span>Home</span>
        </Link>
        {status === 500 ? (
          <button className={styles.secondaryAction} type="button" onClick={handleRefresh}>
            <FiRefreshCw aria-hidden="true" />
            <span>Refresh</span>
          </button>
        ) : null}
        {showBack ? (
          <button className={styles.secondaryAction} type="button" onClick={() => navigate(-1)}>
            <FiArrowLeft aria-hidden="true" />
            <span>Back</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
