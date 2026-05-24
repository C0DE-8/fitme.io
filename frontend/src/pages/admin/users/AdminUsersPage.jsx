import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiSearch, FiShield, FiUser, FiUsers } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { getAdminUsersWithSubscriptions } from "../../../lib/api/adminApi";
import styles from "./AdminUsersPage.module.css";

function formatDate(value) {
  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getLatestUsers(rows) {
  const users = new Map();

  rows.forEach((row) => {
    const current = users.get(row.user_id);
    const nextExpiry = row.expiry_date ? new Date(row.expiry_date).getTime() : 0;
    const currentExpiry = current?.expiry_date ? new Date(current.expiry_date).getTime() : 0;

    if (!current || nextExpiry >= currentExpiry) {
      users.set(row.user_id, row);
    }
  });

  return [...users.values()];
}

export function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getAdminUsersWithSubscriptions()
      .then((rows) => {
        if (alive) setUsers(getLatestUsers(rows || []));
      })
      .catch((err) => {
        if (alive) toast.error(getApiError(err, "Unable to load admin users"), { title: "Users unavailable" });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [toast]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        [user.username, user.email, user.role, user.plan_name, user.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))
      ),
    [normalizedQuery, users]
  );
  const totalVerified = users.filter((user) => user.verified).length;
  const activeSubscriptions = users.filter((user) => user.status === "active").length;
  const admins = users.filter((user) => user.role === "admin").length;

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1>Users</h1>
        </div>
        <label className={styles.search}>
          <FiSearch aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, plan..."
          />
        </label>
      </header>

      <section className={styles.stats} aria-label="User totals">
        <article>
          <FiUsers aria-hidden="true" />
          <span>Total users</span>
          <strong>{loading ? "..." : users.length}</strong>
        </article>
        <article>
          <FiCheckCircle aria-hidden="true" />
          <span>Verified</span>
          <strong>{loading ? "..." : totalVerified}</strong>
        </article>
        <article>
          <FiShield aria-hidden="true" />
          <span>Admins</span>
          <strong>{loading ? "..." : admins}</strong>
        </article>
        <article>
          <FiUser aria-hidden="true" />
          <span>Active subs</span>
          <strong>{loading ? "..." : activeSubscriptions}</strong>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.kicker}>Accounts</p>
            <h2>All users</h2>
          </div>
          <span>{loading ? "Loading..." : `${filteredUsers.length} shown`}</span>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>User</span>
            <span>Role</span>
            <span>Subscription</span>
            <span>Joined</span>
          </div>
          {filteredUsers.map((user) => (
            <article className={styles.tableRow} key={user.user_id}>
              <div className={styles.userCell}>
                <strong>{user.username}</strong>
                <small>{user.email}</small>
                {user.bio ? <p>{user.bio}</p> : null}
              </div>
              <span className={styles.role}>{user.role}</span>
              <div className={styles.subscriptionCell}>
                <strong className={styles[user.status || "none"]}>{user.status || "No plan"}</strong>
                <small>{user.plan_name || "No subscription"}</small>
                {user.expiry_date ? <em>Ends {formatDate(user.expiry_date)}</em> : null}
              </div>
              <div className={styles.dateCell}>
                <strong>{formatDate(user.created_at)}</strong>
                <small>{user.verified ? "Verified" : "Not verified"}</small>
              </div>
            </article>
          ))}
          {!loading && !filteredUsers.length ? <p className={styles.empty}>No users match this search.</p> : null}
        </div>
      </section>
    </section>
  );
}
