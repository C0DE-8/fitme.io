import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiPlus, FiSearch, FiShield, FiTrash2, FiUser, FiUserPlus, FiUsers, FiX } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { getCurrentUser } from "../../../lib/auth";
import {
  createAdminDemoUser,
  deleteAdminUser,
  getAdminAutoFollowSettings,
  getAdminPlans,
  getAdminUsersWithSubscriptions,
  updateAdminAutoFollowSettings,
} from "../../../lib/api/adminApi";
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
  const currentAdmin = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSaving, setDemoSaving] = useState(false);
  const [createdDemoPassword, setCreatedDemoPassword] = useState("");
  const [demoForm, setDemoForm] = useState({
    username: "",
    email: "",
    password: "",
    bio: "",
    verified: true,
    create_subscription: true,
    plan_name: "",
    subscription_days: "30",
  });
  const [autoFollowEnabled, setAutoFollowEnabled] = useState(false);
  const [autoFollowTargetIds, setAutoFollowTargetIds] = useState([]);
  const [autoFollowSearch, setAutoFollowSearch] = useState("");
  const [autoFollowSaving, setAutoFollowSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    const rows = await getAdminUsersWithSubscriptions();
    setUsers(getLatestUsers(rows || []));
  }, []);

  useEffect(() => {
    let alive = true;

    Promise.all([getAdminUsersWithSubscriptions(), getAdminAutoFollowSettings(), getAdminPlans().catch(() => [])])
      .then(([rows, settings, planRows]) => {
        if (!alive) return;

        setUsers(getLatestUsers(rows || []));
        setAutoFollowEnabled(Boolean(settings?.enabled));
        setAutoFollowTargetIds(settings?.target_user_ids || []);
        setPlans(planRows || []);
        setDemoForm((current) => ({
          ...current,
          plan_name: current.plan_name || planRows?.[0]?.plan_name || "",
        }));
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

  async function handleDeleteUser() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.user_id);

    try {
      const data = await deleteAdminUser(deleteTarget.user_id);
      toast.success(data.message || "User deleted.");
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      toast.error(getApiError(err, "Unable to delete user"), { title: "Delete failed" });
    } finally {
      setDeletingId(null);
    }
  }

  function updateDemoField(name, value) {
    setDemoForm((current) => ({ ...current, [name]: value }));
    setCreatedDemoPassword("");
  }

  function openDemoModal() {
    setCreatedDemoPassword("");
    setDemoModalOpen(true);
  }

  async function handleCreateDemoUser(event) {
    event.preventDefault();
    setDemoSaving(true);
    setCreatedDemoPassword("");

    try {
      const payload = {
        ...demoForm,
        subscription_days: Number(demoForm.subscription_days),
      };
      const data = await createAdminDemoUser(payload);
      toast.success(data.message || "Demo user created.");
      if (data.demo_password) setCreatedDemoPassword(data.demo_password);
      setDemoForm((current) => ({
        ...current,
        username: "",
        email: "",
        password: "",
        bio: "",
      }));
      await loadUsers();
    } catch (err) {
      toast.error(getApiError(err, "Unable to create demo user"), { title: "Demo user failed" });
    } finally {
      setDemoSaving(false);
    }
  }

  function addAutoFollowTarget(user) {
    const userId = Number(user.user_id);
    if (!Number.isInteger(userId) || Number(currentAdmin?.id) === userId) return;

    setAutoFollowTargetIds((current) => (current.includes(userId) ? current : [...current, userId]));
    setAutoFollowSearch("");
  }

  function removeAutoFollowTarget(userId) {
    setAutoFollowTargetIds((current) => current.filter((id) => id !== Number(userId)));
  }

  async function saveAutoFollowSettings() {
    setAutoFollowSaving(true);

    try {
      const data = await updateAdminAutoFollowSettings({
        enabled: autoFollowEnabled,
        target_user_ids: autoFollowTargetIds,
      });
      setAutoFollowEnabled(Boolean(data.settings?.enabled));
      setAutoFollowTargetIds(data.settings?.target_user_ids || []);
      toast.success(data.message || "Auto-follow settings saved.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to save auto-follow settings"), { title: "Settings not saved" });
    } finally {
      setAutoFollowSaving(false);
    }
  }

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
  const demoUsers = users.filter((user) => user.is_demo).length;
  const autoFollowTargets = users.filter((user) => autoFollowTargetIds.includes(Number(user.user_id)));
  const autoFollowCandidates = useMemo(() => {
    const query = autoFollowSearch.trim().toLowerCase();

    return users
      .filter((user) => Number(user.user_id) !== Number(currentAdmin?.id))
      .filter((user) => !autoFollowTargetIds.includes(Number(user.user_id)))
      .filter(
        (user) =>
          !query ||
          [user.username, user.email, user.role]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [autoFollowSearch, autoFollowTargetIds, currentAdmin?.id, users]);

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
        <button className={styles.createDemoButton} type="button" onClick={openDemoModal}>
          <FiPlus aria-hidden="true" />
          Demo user
        </button>
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
        <article>
          <FiUserPlus aria-hidden="true" />
          <span>Demo users</span>
          <strong>{loading ? "..." : demoUsers}</strong>
        </article>
      </section>

      <section className={styles.autoFollowPanel}>
        <div className={styles.autoFollowHeader}>
          <div>
            <p className={styles.kicker}>Food feed</p>
            <h2>New user auto-follow</h2>
            <p>Choose accounts every new user should follow automatically after registration.</p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={autoFollowEnabled}
              onChange={(event) => setAutoFollowEnabled(event.target.checked)}
            />
            <span>{autoFollowEnabled ? "On" : "Off"}</span>
          </label>
        </div>

        <div className={styles.autoFollowGrid}>
          <div className={styles.autoFollowPicker}>
            <label>
              Search accounts
              <input
                value={autoFollowSearch}
                onChange={(event) => setAutoFollowSearch(event.target.value)}
                placeholder="Search username or email..."
              />
            </label>
            <div className={styles.autoFollowResults}>
              {autoFollowCandidates.map((user) => (
                <button key={user.user_id} type="button" onClick={() => addAutoFollowTarget(user)}>
                  <FiUserPlus aria-hidden="true" />
                  <span>
                    <strong>{user.username}</strong>
                    <small>{user.email}</small>
                  </span>
                </button>
              ))}
              {!autoFollowCandidates.length ? <p>No available accounts match this search.</p> : null}
            </div>
          </div>

          <div className={styles.autoFollowTargets}>
            <div>
              <strong>Selected accounts</strong>
              <span>{autoFollowTargets.length} target{autoFollowTargets.length === 1 ? "" : "s"}</span>
            </div>
            {autoFollowTargets.map((user) => (
              <article key={user.user_id}>
                <span>
                  <strong>{user.username}</strong>
                  <small>{user.email}</small>
                </span>
                <button type="button" onClick={() => removeAutoFollowTarget(user.user_id)} aria-label={`Remove ${user.username}`}>
                  <FiX aria-hidden="true" />
                </button>
              </article>
            ))}
            {!autoFollowTargets.length ? <p>No accounts selected yet.</p> : null}
            <button className={styles.saveSettings} type="button" onClick={saveAutoFollowSettings} disabled={autoFollowSaving}>
              {autoFollowSaving ? "Saving..." : "Save auto-follow"}
            </button>
          </div>
        </div>
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
            <span>Actions</span>
          </div>
          {filteredUsers.map((user) => (
            <article className={styles.tableRow} key={user.user_id}>
              <div className={styles.userCell}>
                <strong>
                  {user.username}
                  {user.is_demo ? <em>Demo</em> : null}
                </strong>
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
              <div className={styles.actionCell}>
                <button
                  type="button"
                  disabled={deletingId === user.user_id || Number(currentAdmin?.id) === Number(user.user_id)}
                  onClick={() => setDeleteTarget(user)}
                  aria-label={`Delete ${user.username || "user"}`}
                  title={
                    Number(currentAdmin?.id) === Number(user.user_id)
                      ? "You cannot delete your own admin account here"
                      : "Delete user"
                  }
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
          {!loading && !filteredUsers.length ? <p className={styles.empty}>No users match this search.</p> : null}
        </div>
      </section>

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label="Delete user">
            <header>
              <div>
                <p className={styles.kicker}>Delete user</p>
                <h2>{deleteTarget.username || "User account"}</h2>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} aria-label="Cancel delete">
                <FiX aria-hidden="true" />
              </button>
            </header>
            <p>
              This permanently removes the user account, subscriptions, storage, chat history, and food feed activity.
            </p>
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
                {deletingId === deleteTarget.user_id ? "Deleting..." : "Delete user"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {demoModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={`${styles.modal} ${styles.demoModal}`} role="dialog" aria-modal="true" aria-label="Create demo user">
            <header>
              <div>
                <p className={styles.kicker}>Demo account</p>
                <h2>Create demo user</h2>
              </div>
              <button type="button" onClick={() => setDemoModalOpen(false)} aria-label="Close demo user form">
                <FiX aria-hidden="true" />
              </button>
            </header>

            <form className={styles.demoForm} onSubmit={handleCreateDemoUser}>
              <label>
                Username
                <input
                  value={demoForm.username}
                  onChange={(event) => updateDemoField("username", event.target.value)}
                  placeholder="e.g. demo chef"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={demoForm.email}
                  onChange={(event) => updateDemoField("email", event.target.value)}
                  placeholder="demo@example.com"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="text"
                  value={demoForm.password}
                  onChange={(event) => updateDemoField("password", event.target.value)}
                  placeholder="Leave empty to auto-generate"
                />
              </label>

              <label>
                Bio
                <textarea
                  value={demoForm.bio}
                  onChange={(event) => updateDemoField("bio", event.target.value)}
                  placeholder="Short demo profile bio"
                  rows={3}
                />
              </label>

              <div className={styles.demoToggles}>
                <label>
                  <input
                    type="checkbox"
                    checked={demoForm.verified}
                    onChange={(event) => updateDemoField("verified", event.target.checked)}
                  />
                  Verified
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={demoForm.create_subscription}
                    onChange={(event) => updateDemoField("create_subscription", event.target.checked)}
                  />
                  Active subscription
                </label>
              </div>

              {demoForm.create_subscription ? (
                <div className={styles.demoSubscriptionGrid}>
                  <label>
                    Plan
                    <select
                      value={demoForm.plan_name}
                      onChange={(event) => updateDemoField("plan_name", event.target.value)}
                      required={demoForm.create_subscription}
                    >
                      {plans.map((plan) => (
                        <option key={plan.id || plan.plan_name} value={plan.plan_name}>
                          {plan.plan_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Days
                    <input
                      min="1"
                      type="number"
                      value={demoForm.subscription_days}
                      onChange={(event) => updateDemoField("subscription_days", event.target.value)}
                    />
                  </label>
                </div>
              ) : null}

              {createdDemoPassword ? (
                <p className={styles.demoPassword}>
                  Generated password: <strong>{createdDemoPassword}</strong>
                </p>
              ) : null}

              <footer>
                <button type="button" onClick={() => setDemoModalOpen(false)} disabled={demoSaving}>
                  Cancel
                </button>
                <button className={styles.saveDemoButton} type="submit" disabled={demoSaving}>
                  <FiUserPlus aria-hidden="true" />
                  {demoSaving ? "Creating..." : "Create demo"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
