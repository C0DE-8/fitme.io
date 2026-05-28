import { useCallback, useEffect, useMemo, useState } from "react";
import { FiActivity, FiEye, FiHeart, FiSearch, FiTrash2, FiUserCheck, FiUsers, FiX } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { deleteAdminUser, getAdminDemoUsers } from "../../../lib/api/adminApi";
import styles from "./AdminDemoUsersPage.module.css";

function formatDate(value) {
  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminDemoUsersPage() {
  const toast = useToast();
  const [demoUsers, setDemoUsers] = useState([]);
  const [totals, setTotals] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadDemoUsers = useCallback(async () => {
    const data = await getAdminDemoUsers();
    setDemoUsers(data.demoUsers || []);
    setTotals(data.totals || null);
  }, []);

  useEffect(() => {
    let alive = true;

    getAdminDemoUsers()
      .then((data) => {
        if (!alive) return;
        setDemoUsers(data.demoUsers || []);
        setTotals(data.totals || null);
      })
      .catch((err) => {
        if (alive) toast.error(getApiError(err, "Unable to load demo users"), { title: "Demo users unavailable" });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [toast]);

  async function handleDeleteUser() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.user_id);

    try {
      const data = await deleteAdminUser(deleteTarget.user_id);
      toast.success(data.message || "Demo user deleted.");
      setDeleteTarget(null);
      setViewTarget(null);
      await loadDemoUsers();
    } catch (err) {
      toast.error(getApiError(err, "Unable to delete demo user"), { title: "Delete failed" });
    } finally {
      setDeletingId(null);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      demoUsers.filter((user) =>
        [user.username, user.email, user.bio, user.plan_name, user.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))
      ),
    [demoUsers, normalizedQuery]
  );

  const stats = totals || {
    users: demoUsers.length,
    followers: demoUsers.reduce((sum, user) => sum + Number(user.followers || 0), 0),
    following: demoUsers.reduce((sum, user) => sum + Number(user.following || 0), 0),
    likes: demoUsers.reduce((sum, user) => sum + Number(user.likes || 0), 0),
    active_posts: demoUsers.reduce((sum, user) => sum + Number(user.active_posts || 0), 0),
  };

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1>Demo management</h1>
        </div>
        <label className={styles.search}>
          <FiSearch aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search demo accounts..."
          />
        </label>
      </header>

      <section className={styles.stats} aria-label="Demo user totals">
        <article>
          <FiUsers aria-hidden="true" />
          <span>Demo users</span>
          <strong>{loading ? "..." : stats.users}</strong>
        </article>
        <article>
          <FiUserCheck aria-hidden="true" />
          <span>Followers</span>
          <strong>{loading ? "..." : stats.followers}</strong>
        </article>
        <article>
          <FiUsers aria-hidden="true" />
          <span>Following</span>
          <strong>{loading ? "..." : stats.following}</strong>
        </article>
        <article>
          <FiHeart aria-hidden="true" />
          <span>Likes</span>
          <strong>{loading ? "..." : stats.likes}</strong>
        </article>
        <article>
          <FiActivity aria-hidden="true" />
          <span>Active posts</span>
          <strong>{loading ? "..." : stats.active_posts}</strong>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.kicker}>Accounts</p>
            <h2>Demo users</h2>
          </div>
          <span>{loading ? "Loading..." : `${filteredUsers.length} shown`}</span>
        </div>

        <div className={styles.grid}>
          {filteredUsers.map((user) => (
            <article className={styles.card} key={user.user_id}>
              <div className={styles.cardTop}>
                <span>{String(user.username || "D").charAt(0).toUpperCase()}</span>
                <div>
                  <strong>{user.username}</strong>
                  <small>{user.email}</small>
                </div>
              </div>

              <dl>
                <div>
                  <dt>Followers</dt>
                  <dd>{Number(user.followers || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Following</dt>
                  <dd>{Number(user.following || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Likes</dt>
                  <dd>{Number(user.likes || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Posts</dt>
                  <dd>{Number(user.active_posts || 0).toLocaleString()}</dd>
                </div>
              </dl>

              <p className={styles.password}>
                Password <strong>{user.demo_password || "Unavailable"}</strong>
              </p>

              <div className={styles.cardMeta}>
                <span>{user.status || "No plan"}</span>
                <span>{user.plan_name || "No subscription"}</span>
              </div>

              <div className={styles.actions}>
                <button type="button" onClick={() => setViewTarget(user)}>
                  <FiEye aria-hidden="true" />
                  View
                </button>
                <button className={styles.deleteButton} type="button" onClick={() => setDeleteTarget(user)}>
                  <FiTrash2 aria-hidden="true" />
                  Delete
                </button>
              </div>
            </article>
          ))}

          {!loading && !filteredUsers.length ? (
            <div className={styles.empty}>
              <strong>No demo users found.</strong>
              <p>Create demo users from the main Users page.</p>
            </div>
          ) : null}
        </div>
      </section>

      {viewTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label="Demo user information">
            <header>
              <div>
                <p className={styles.kicker}>Demo user</p>
                <h2>{viewTarget.username}</h2>
              </div>
              <button type="button" onClick={() => setViewTarget(null)} aria-label="Close demo user information">
                <FiX aria-hidden="true" />
              </button>
            </header>

            <dl className={styles.infoList}>
              <div>
                <dt>Email</dt>
                <dd>{viewTarget.email}</dd>
              </div>
              <div>
                <dt>Password</dt>
                <dd className={styles.copyable}>{viewTarget.demo_password || "Unavailable"}</dd>
              </div>
              <div>
                <dt>Followers</dt>
                <dd>{Number(viewTarget.followers || 0).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Following</dt>
                <dd>{Number(viewTarget.following || 0).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Likes</dt>
                <dd>{Number(viewTarget.likes || 0).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Active posts</dt>
                <dd>{Number(viewTarget.active_posts || 0).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Subscription</dt>
                <dd>{viewTarget.status || "No plan"}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{viewTarget.plan_name || "No subscription"}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{formatDate(viewTarget.created_at)}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{formatDate(viewTarget.expiry_date)}</dd>
              </div>
              {viewTarget.bio ? (
                <div className={styles.wideInfo}>
                  <dt>Bio</dt>
                  <dd>{viewTarget.bio}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label="Delete demo user">
            <header>
              <div>
                <p className={styles.kicker}>Delete demo user</p>
                <h2>{deleteTarget.username}</h2>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} aria-label="Cancel delete">
                <FiX aria-hidden="true" />
              </button>
            </header>
            <p>This permanently removes the demo user account, subscriptions, storage, chat history, and feed activity.</p>
            <footer>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deletingId === deleteTarget.user_id}>
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingId === deleteTarget.user_id}
              >
                <FiTrash2 aria-hidden="true" />
                {deletingId === deleteTarget.user_id ? "Deleting..." : "Delete demo"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
