import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";

const metrics = [
  ["Meal ideas", "Get suggestions from your saved storage"],
  ["Subscriptions", "Keep plan status clear"],
  ["Admin control", "Review users, plans, and payments"],
];

export function HomePage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Meal planning from your storage</p>
          <h1>fitme.io</h1>
          <p className={styles.lead}>
            Plan food, manage storage, and keep subscription workflows organized from one focused app.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} to="/auth">
              Get started
            </Link>
            <Link className={styles.secondary} to="/auth">
              Sign in
            </Link>
          </div>
        </div>

        <div className={styles.panel} aria-label="Fitme status preview">
          <div className={styles.panelHeader}>
            <span>fitme.io</span>
            <span>live</span>
          </div>
          <div className={styles.status}>
            <span>Meal planner</span>
            <strong>ready</strong>
          </div>
          <div className={styles.rows}>
            <div>
              <span>Rice menu</span>
              <strong>ready</strong>
            </div>
            <div>
              <span>Payment proofs</span>
              <strong>pending review</strong>
            </div>
            <div>
              <span>Storage list</span>
              <strong>synced</strong>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.metrics}>
        {metrics.map(([title, text]) => (
          <article className={styles.metric} key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
