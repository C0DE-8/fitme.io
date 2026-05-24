import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import {
  getAdminAccounts,
  getAdminPlans,
  getAdminProfile,
  getAdminStats,
  getAdminSubscriptions,
  getAdminUsers,
  getPendingSubscriptions,
} from "../../../lib/api/adminApi";
import styles from "./AdminPage.module.css";

function formatDate(value) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return value || "No price";

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function AdminPage() {
  const toast = useToast();
  const [data, setData] = useState({
    profile: null,
    stats: null,
    users: [],
    subscriptions: [],
    accounts: [],
    plans: [],
    pendingSubscriptions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadAdmin() {
      setLoading(true);

      try {
        const [profile, stats, users, subscriptions, accounts, plans, pendingSubscriptions] = await Promise.all([
          getAdminProfile(),
          getAdminStats(),
          getAdminUsers(),
          getAdminSubscriptions(),
          getAdminAccounts(),
          getAdminPlans(),
          getPendingSubscriptions(),
        ]);

        if (!alive) return;

        setData({ profile, stats, users, subscriptions, accounts, plans, pendingSubscriptions });
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Unable to load admin dashboard"), { title: "Dashboard unavailable" });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAdmin();

    return () => {
      alive = false;
    };
  }, [toast]);

  const recentUsers = useMemo(() => data.users.slice(0, 6), [data.users]);
  const recentSubscriptions = useMemo(() => data.subscriptions.slice(0, 6), [data.subscriptions]);
  const activeSubscriptions = data.subscriptions.filter((subscription) => subscription.status === "active").length;

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1>Dashboard</h1>
        </div>
        <div className={styles.identity}>
          <span>{data.profile?.username || "Admin"}</span>
          <strong>{data.profile?.email || "fitme.io"}</strong>
        </div>
      </div>

      <div className={styles.stats}>
        <article>
          <span>Total users</span>
          <strong>{loading ? "..." : data.stats?.totalUsers ?? data.users.length}</strong>
        </article>
        <article>
          <span>Subscriptions</span>
          <strong>{loading ? "..." : data.stats?.totalSubscriptions ?? data.subscriptions.length}</strong>
        </article>
        <article>
          <span>Active subs</span>
          <strong>{loading ? "..." : activeSubscriptions}</strong>
        </article>
        <article>
          <span>Pending subs</span>
          <strong>{loading ? "..." : data.pendingSubscriptions.length}</strong>
        </article>
      </div>

      <div className={styles.grid}>
        <section className={`${styles.tablePanel} ${styles.userPanel}`}>
          <div className={styles.panelHeader}>
            <h2>Recent users</h2>
            <Link to="/admin/users">{data.users.length} total</Link>
          </div>
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>User</span>
              <span>Role</span>
              <span>Verified</span>
            </div>
            {recentUsers.map((user) => (
              <div className={styles.tableRow} key={user.id}>
                <span>
                  <strong>{user.username}</strong>
                  <small>{user.email}</small>
                </span>
                <span>{user.role}</span>
                <span>{user.verified ? "yes" : "no"}</span>
              </div>
            ))}
            {!loading && !recentUsers.length ? <p className={styles.empty}>No users found.</p> : null}
          </div>
        </section>

        <section className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h2>Accounts</h2>
            <span>{data.accounts.length}</span>
          </div>
          <div className={styles.list}>
            {data.accounts.slice(0, 5).map((account) => (
              <div className={styles.listItem} key={account.id}>
                <span>
                  <strong>{account.bank_name}</strong>
                  <small>{account.account_name}</small>
                </span>
                <em>{account.account_number}</em>
              </div>
            ))}
            {!loading && !data.accounts.length ? <p className={styles.empty}>No bank accounts yet.</p> : null}
          </div>
        </section>

        <section className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h2>Plans</h2>
            <span>{data.plans.length}</span>
          </div>
          <div className={styles.list}>
            {data.plans.slice(0, 5).map((plan) => (
              <div className={styles.listItem} key={plan.id}>
                <span>
                  <strong>{plan.plan_name}</strong>
                  <small>{formatDate(plan.created_at)}</small>
                </span>
                <em>{formatPrice(plan.price)}</em>
              </div>
            ))}
            {!loading && !data.plans.length ? <p className={styles.empty}>No plans yet.</p> : null}
          </div>
        </section>

        <section className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h2>Pending proofs</h2>
            <span>{data.pendingSubscriptions.length}</span>
          </div>
          <div className={styles.list}>
            {data.pendingSubscriptions.slice(0, 5).map((subscription) => (
              <div className={styles.listItem} key={subscription.id}>
                <span>
                  <strong>{subscription.username}</strong>
                  <small>{subscription.payer_bank_name || subscription.email}</small>
                </span>
                <em>{subscription.plan_name}</em>
              </div>
            ))}
            {!loading && !data.pendingSubscriptions.length ? <p className={styles.empty}>No pending proofs.</p> : null}
          </div>
        </section>

        <section className={`${styles.tablePanel} ${styles.subscriptionPanel}`}>
          <div className={styles.panelHeader}>
            <h2>Subscriptions</h2>
            <span>{data.subscriptions.length}</span>
          </div>
          <div className={styles.subscriptionTable}>
            <div className={styles.subscriptionHead}>
              <span>User</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Ends</span>
            </div>
            {recentSubscriptions.map((subscription) => (
              <div className={styles.subscriptionRow} key={subscription.id}>
                <span>
                  <strong>{subscription.username}</strong>
                  <small>{subscription.email}</small>
                </span>
                <span>{subscription.plan_name}</span>
                <span className={`${styles.status} ${styles[subscription.status] || ""}`}>
                  {subscription.status || "unknown"}
                </span>
                <span>{formatDate(subscription.expiry_date)}</span>
              </div>
            ))}
            {!loading && !recentSubscriptions.length ? <p className={styles.empty}>No subscriptions found.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
