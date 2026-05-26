import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import {
  createAdminPlan,
  deleteAdminPlan,
  getAdminPlans,
  updateAdminPlan,
} from "../../../lib/api/adminApi";
import styles from "./AdminPlansPage.module.css";

const emptyForm = {
  plan_name: "",
  price: "",
};

function formatDate(value) {
  if (!value) return "Unavailable";

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
    currency: "NGN",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function AdminPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadPlans() {
    const rows = await getAdminPlans();
    setPlans(rows || []);
  }

  useEffect(() => {
    let alive = true;

    async function loadInitial() {
      setLoading(true);

      try {
        const rows = await getAdminPlans();
        if (alive) setPlans(rows || []);
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Unable to load plans"), { title: "Plans unavailable" });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadInitial();

    return () => {
      alive = false;
    };
  }, [toast]);

  const filteredPlans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return plans.filter((plan) =>
      !normalizedQuery ||
      [plan.plan_name, plan.price, plan.created_at]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [plans, query]);

  const averagePrice = useMemo(() => {
    const prices = plans.map((plan) => Number(plan.price)).filter(Number.isFinite);
    if (!prices.length) return 0;
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }, [plans]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editPlan(plan) {
    setEditingId(plan.id);
    setForm({
      plan_name: plan.plan_name || "",
      price: plan.price ?? "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const planName = form.plan_name.trim();
    const price = Number(form.price);

    if (!planName || !Number.isFinite(price) || price <= 0) {
      toast.error("Enter a plan name and a price greater than 0.", { title: "Plan not saved" });
      return;
    }

    setSaving(true);

    try {
      const payload = { plan_name: planName, price };

      if (editingId) {
        await updateAdminPlan(editingId, payload);
        toast.success("Plan updated.");
      } else {
        await createAdminPlan(payload);
        toast.success("Plan saved.");
      }

      resetForm();
      await loadPlans();
    } catch (err) {
      toast.error(getApiError(err, "Unable to save plan"), { title: "Plan not saved" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);

    try {
      await deleteAdminPlan(id);
      toast.success("Plan deleted.");
      if (editingId === id) resetForm();
      await loadPlans();
    } catch (err) {
      toast.error(getApiError(err, "Unable to delete plan"), { title: "Delete failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1>Plans</h1>
          <p>Create and manage subscription plans shown to users.</p>
        </div>
      </header>

      <section className={styles.stats} aria-label="Plan totals">
        <article>
          <span>Total plans</span>
          <strong>{loading ? "..." : plans.length}</strong>
        </article>
        <article>
          <span>Average price</span>
          <strong>{loading ? "..." : formatPrice(averagePrice)}</strong>
        </article>
        <article>
          <span>Shown</span>
          <strong>{loading ? "..." : filteredPlans.length}</strong>
        </article>
      </section>

      <div className={styles.layout}>
        <section className={styles.formPanel}>
          <div className={styles.panelHeader}>
            <h2>{editingId ? "Edit plan" : "New plan"}</h2>
            {editingId ? (
              <button aria-label="Cancel editing" type="button" onClick={resetForm}>
                <FiX aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Plan name
              <input
                value={form.plan_name}
                onChange={(event) => setForm((current) => ({ ...current, plan_name: event.target.value }))}
                placeholder="Premium"
              />
            </label>
            <label>
              Price
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                placeholder="5000"
              />
            </label>
            <button className={styles.primary} disabled={saving} type="submit">
              <FiPlus aria-hidden="true" />
              {editingId ? "Update plan" : "Save plan"}
            </button>
          </form>
        </section>

        <section className={styles.listPanel}>
          <div className={styles.panelHeader}>
            <h2>All plans</h2>
            <label className={styles.search}>
              <FiSearch aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plans..."
              />
            </label>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Plan</span>
              <span>Price</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            {filteredPlans.map((plan) => (
              <article className={styles.tableRow} key={plan.id}>
                <strong>{plan.plan_name}</strong>
                <span>{formatPrice(plan.price)}</span>
                <span>{formatDate(plan.created_at)}</span>
                <div className={styles.actions}>
                  <button
                    aria-label="Edit plan"
                    disabled={saving}
                    title="Edit plan"
                    type="button"
                    onClick={() => editPlan(plan)}
                  >
                    <FiEdit2 aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Delete plan"
                    disabled={saving}
                    title="Delete plan"
                    type="button"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
            {!loading && !filteredPlans.length ? <p className={styles.empty}>No plans match this view.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
