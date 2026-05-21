import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import {
  getAdminAccounts,
  getAdminPlans,
  getAdminProfile,
  getAdminStats,
  getAdminUsers,
  getPendingSubscriptions,
} from "../../../lib/api/adminApi";
import styles from "./AdminPage.module.css";

export function AdminPage() {
  const toast = useToast();
  const [data, setData] = useState({
    profile: null,
    stats: null,
    users: [],
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
        const [profile, stats, users, accounts, plans, pendingSubscriptions] = await Promise.all([
          getAdminProfile(),
          getAdminStats(),
          getAdminUsers(),
          getAdminAccounts(),
          getAdminPlans(),
          getPendingSubscriptions(),
        ]);

        if (!alive) return;

        setData({ profile, stats, users, accounts, plans, pendingSubscriptions });
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
          <strong>{loading ? "..." : data.stats?.totalSubscriptions ?? 0}</strong>
        </article>
        <article>
          <span>Pending proofs</span>
          <strong>{loading ? "..." : data.pendingSubscriptions.length}</strong>
        </article>
        <article>
          <span>Plans</span>
          <strong>{loading ? "..." : data.plans.length}</strong>
        </article>
      </div>

      <div className={styles.grid}>
        <section className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <h2>Recent users</h2>
            <span>{data.users.length} total</span>
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
            <h2>Bank accounts</h2>
            <span>{data.accounts.length}</span>
          </div>
          <div className={styles.list}>
            {data.accounts.slice(0, 5).map((account) => (
              <div className={styles.listItem} key={account.id}>
                <span>{account.bank_name}</span>
                <strong>{account.account_number}</strong>
              </div>
            ))}
            {!loading && !data.accounts.length ? <p className={styles.empty}>No bank accounts yet.</p> : null}
          </div>
        </section>

        <section className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h2>Pending subscriptions</h2>
            <span>{data.pendingSubscriptions.length}</span>
          </div>
          <div className={styles.list}>
            {data.pendingSubscriptions.slice(0, 5).map((subscription) => (
              <div className={styles.listItem} key={subscription.id}>
                <span>{subscription.username}</span>
                <strong>{subscription.plan_name}</strong>
              </div>
            ))}
            {!loading && !data.pendingSubscriptions.length ? (
              <p className={styles.empty}>No pending subscriptions.</p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
