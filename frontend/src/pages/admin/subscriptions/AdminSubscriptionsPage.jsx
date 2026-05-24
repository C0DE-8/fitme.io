import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiEdit2, FiExternalLink, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import {
  confirmAdminSubscription,
  createAdminSubscription,
  deleteAdminSubscription,
  extendAdminSubscription,
  getAdminPlans,
  getAdminSubscriptions,
  getAdminUsers,
  rejectAdminSubscription,
  updateAdminSubscription,
} from "../../../lib/api/adminApi";
import styles from "./AdminSubscriptionsPage.module.css";

function formatDate(value) {
  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const statusOptions = ["all", "pending", "active", "cancelled", "inactive"];
const editStatusOptions = ["pending", "active", "inactive", "cancelled"];
const emptyForm = {
  user_id: "",
  plan_name: "",
  status: "active",
  days: 30,
  start_date: "",
  expiry_date: "",
};

export function AdminSubscriptionsPage() {
  const toast = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [extendDays, setExtendDays] = useState({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  async function loadSubscriptions() {
    const rows = await getAdminSubscriptions();
    setSubscriptions(rows || []);
  }

  useEffect(() => {
    let alive = true;

    async function loadInitial() {
      setLoading(true);

      try {
        const [subscriptionRows, userRows, planRows] = await Promise.all([
          getAdminSubscriptions(),
          getAdminUsers(),
          getAdminPlans(),
        ]);

        if (!alive) return;

        setSubscriptions(subscriptionRows || []);
        setUsers((userRows || []).filter((user) => user.role !== "admin"));
        setPlans(planRows || []);
        setForm((current) => ({
          ...current,
          user_id: current.user_id || (userRows || []).find((user) => user.role !== "admin")?.id || "",
          plan_name: current.plan_name || (planRows || [])[0]?.plan_name || "",
        }));
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Unable to load subscriptions"), { title: "Subscriptions unavailable" });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadInitial();

    return () => {
      alive = false;
    };
  }, [toast]);

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      const matchesStatus = status === "all" || subscription.status === status;
      const matchesQuery =
        !normalizedQuery ||
        [
          subscription.username,
          subscription.email,
          subscription.plan_name,
          subscription.status,
          subscription.payer_bank_name,
          subscription.payer_account_name,
          subscription.payer_account_number,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [query, status, subscriptions]);

  const totals = useMemo(
    () => ({
      all: subscriptions.length,
      pending: subscriptions.filter((item) => item.status === "pending").length,
      active: subscriptions.filter((item) => item.status === "active").length,
      cancelled: subscriptions.filter((item) => item.status === "cancelled").length,
    }),
    [subscriptions]
  );

  async function updateSubscription(id, action) {
    setSavingId(id);

    try {
      if (action === "confirm") {
        await confirmAdminSubscription(id);
        toast.success("Subscription confirmed.");
      } else {
        await rejectAdminSubscription(id);
        toast.success("Subscription rejected.");
      }

      await loadSubscriptions();
    } catch (err) {
      toast.error(getApiError(err, "Unable to update subscription"), { title: "Update failed" });
    } finally {
      setSavingId(null);
    }
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      user_id: users[0]?.id || "",
      plan_name: plans[0]?.plan_name || "",
    });
    setEditingId(null);
  }

  function toDateInputValue(value) {
    if (!value) return "";
    return new Date(value).toISOString().slice(0, 10);
  }

  function editSubscription(subscription) {
    setEditingId(subscription.id);
    setForm({
      user_id: subscription.user_id || "",
      plan_name: subscription.plan_name || plans[0]?.plan_name || "",
      status: subscription.status || "active",
      days: 30,
      start_date: toDateInputValue(subscription.start_date),
      expiry_date: toDateInputValue(subscription.expiry_date),
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSavingId(editingId || "new");

    try {
      if (editingId) {
        await updateAdminSubscription(editingId, {
          plan_name: form.plan_name,
          status: form.status,
          start_date: form.start_date,
          expiry_date: form.expiry_date,
        });
        toast.success("Subscription updated.");
      } else {
        await createAdminSubscription({
          user_id: form.user_id,
          plan_name: form.plan_name,
          status: form.status,
          days: Number(form.days),
          start_date: form.start_date || undefined,
        });
        toast.success("Subscription added to user.");
      }

      resetForm();
      await loadSubscriptions();
    } catch (err) {
      toast.error(getApiError(err, "Unable to save subscription"), { title: "Subscription not saved" });
    } finally {
      setSavingId(null);
    }
  }

  async function handleExtend(subscription) {
    const days = Number(extendDays[subscription.id] || 1);

    if (!Number.isInteger(days) || days <= 0) {
      toast.error("Enter one or more days to add.", { title: "Extension not saved" });
      return;
    }

    setSavingId(subscription.id);

    try {
      await extendAdminSubscription(subscription.id, days);
      toast.success(`Added ${days} day(s).`);
      setExtendDays((current) => ({ ...current, [subscription.id]: "" }));
      await loadSubscriptions();
    } catch (err) {
      toast.error(getApiError(err, "Unable to extend subscription"), { title: "Extension failed" });
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(subscription) {
    setSavingId(subscription.id);

    try {
      await deleteAdminSubscription(subscription.id);
      toast.success("Subscription deleted.");
      if (editingId === subscription.id) resetForm();
      await loadSubscriptions();
    } catch (err) {
      toast.error(getApiError(err, "Unable to delete subscription"), { title: "Delete failed" });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1>Subscriptions</h1>
          <p>Review payment proofs, payer details, plans, and current subscription status.</p>
        </div>
      </header>

      <section className={styles.stats} aria-label="Subscription totals">
        <article>
          <span>Total</span>
          <strong>{loading ? "..." : totals.all}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{loading ? "..." : totals.pending}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{loading ? "..." : totals.active}</strong>
        </article>
        <article>
          <span>Cancelled</span>
          <strong>{loading ? "..." : totals.cancelled}</strong>
        </article>
      </section>

      <section className={styles.tools}>
        <label className={styles.search}>
          <FiSearch aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search user, email, plan, payer..."
          />
        </label>
        <div className={styles.filters} aria-label="Filter by status">
          {statusOptions.map((option) => (
            <button
              className={status === option ? styles.selected : ""}
              key={option}
              type="button"
              onClick={() => setStatus(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.managePanel}>
        <div className={styles.panelHeader}>
          <h2>{editingId ? "Edit user subscription" : "Add subscription to user"}</h2>
          {editingId ? (
            <button className={styles.clearButton} type="button" onClick={resetForm}>
              <FiX aria-hidden="true" />
              Cancel
            </button>
          ) : null}
        </div>
        <form className={styles.manageForm} onSubmit={handleSubmit}>
          <label>
            User
            <select
              disabled={!!editingId}
              value={form.user_id}
              onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </label>
          <label>
            Plan
            <select
              value={form.plan_name}
              onChange={(event) => setForm((current) => ({ ...current, plan_name: event.target.value }))}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.plan_name}>
                  {plan.plan_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            >
              {editStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {editingId ? (
            <>
              <label>
                Start date
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
                />
              </label>
              <label>
                Expiry date
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(event) => setForm((current) => ({ ...current, expiry_date: event.target.value }))}
                />
              </label>
            </>
          ) : (
            <label>
              Days
              <input
                min="1"
                step="1"
                type="number"
                value={form.days}
                onChange={(event) => setForm((current) => ({ ...current, days: event.target.value }))}
              />
            </label>
          )}
          <button className={styles.primaryButton} disabled={!!savingId || !form.user_id || !form.plan_name} type="submit">
            <FiPlus aria-hidden="true" />
            {editingId ? "Update subscription" : "Add subscription"}
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>All subscriptions</h2>
          <span>{loading ? "Loading..." : `${filteredSubscriptions.length} shown`}</span>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>User</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Payer</span>
            <span>Dates</span>
            <span>Proof</span>
            <span>Add days</span>
            <span>Actions</span>
          </div>

          {filteredSubscriptions.map((subscription) => {
            const isPending = subscription.status === "pending";
            const isSaving = savingId === subscription.id;

            return (
              <article className={styles.tableRow} key={subscription.id}>
                <div className={styles.userCell}>
                  <strong>{subscription.username}</strong>
                  <small>{subscription.email}</small>
                </div>
                <span>{subscription.plan_name}</span>
                <span className={`${styles.status} ${styles[subscription.status] || ""}`}>
                  {subscription.status || "unknown"}
                </span>
                <div className={styles.payerCell}>
                  <strong>{subscription.payer_bank_name || "No bank"}</strong>
                  <small>{subscription.payer_account_name || "No account name"}</small>
                  {subscription.payer_account_number ? <em>{subscription.payer_account_number}</em> : null}
                </div>
                <div className={styles.dateCell}>
                  <strong>{formatDate(subscription.start_date)}</strong>
                  <small>Ends {formatDate(subscription.expiry_date)}</small>
                </div>
                <span>
                  {subscription.payment_proof_url ? (
                    <a href={subscription.payment_proof_url} rel="noreferrer" target="_blank">
                      <FiExternalLink aria-hidden="true" />
                      Proof
                    </a>
                  ) : (
                    "No proof"
                  )}
                </span>
                <div className={styles.extendCell}>
                  <input
                    min="1"
                    step="1"
                    type="number"
                    value={extendDays[subscription.id] || ""}
                    onChange={(event) =>
                      setExtendDays((current) => ({ ...current, [subscription.id]: event.target.value }))
                    }
                    placeholder="1"
                  />
                  <button disabled={isSaving} type="button" onClick={() => handleExtend(subscription)}>
                    Add
                  </button>
                </div>
                <div className={styles.actions}>
                  <button
                    aria-label="Confirm subscription"
                    disabled={!isPending || isSaving}
                    title="Confirm subscription"
                    type="button"
                    onClick={() => updateSubscription(subscription.id, "confirm")}
                  >
                    <FiCheck aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Reject subscription"
                    disabled={!isPending || isSaving}
                    title="Reject subscription"
                    type="button"
                    onClick={() => updateSubscription(subscription.id, "reject")}
                  >
                    <FiX aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Edit subscription"
                    disabled={isSaving}
                    title="Edit subscription"
                    type="button"
                    onClick={() => editSubscription(subscription)}
                  >
                    <FiEdit2 aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Delete subscription"
                    disabled={isSaving}
                    title="Delete subscription"
                    type="button"
                    onClick={() => handleDelete(subscription)}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}

          {!loading && !filteredSubscriptions.length ? (
            <p className={styles.empty}>No subscriptions match this view.</p>
          ) : null}
        </div>
      </section>
    </section>
  );
}
