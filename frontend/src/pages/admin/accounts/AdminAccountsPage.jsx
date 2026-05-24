import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiImage, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError, imageUrl } from "../../../lib/api";
import {
  createAdminAccount,
  deleteAdminAccount,
  getAdminAccounts,
  updateAdminAccount,
} from "../../../lib/api/adminApi";
import styles from "./AdminAccountsPage.module.css";

const emptyForm = {
  bank_name: "",
  account_name: "",
  account_number: "",
  account_logo: null,
};

function logoUrl(account) {
  if (!account?.account_logo) return "";
  return imageUrl(`/uploads/account-logos/${account.account_logo}`);
}

function formatDate(value) {
  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminAccountsPage() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadAccounts() {
    const rows = await getAdminAccounts();
    setAccounts(rows || []);
  }

  useEffect(() => {
    let alive = true;

    async function loadInitial() {
      setLoading(true);

      try {
        const rows = await getAdminAccounts();
        if (alive) setAccounts(rows || []);
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Unable to load accounts"), { title: "Accounts unavailable" });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadInitial();

    return () => {
      alive = false;
    };
  }, [toast]);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return accounts.filter((account) =>
      !normalizedQuery ||
      [account.bank_name, account.account_name, account.account_number, account.created_at]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [accounts, query]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editAccount(account) {
    setEditingId(account.id);
    setForm({
      bank_name: account.bank_name || "",
      account_name: account.account_name || "",
      account_number: account.account_number || "",
      account_logo: null,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      bank_name: form.bank_name.trim(),
      account_name: form.account_name.trim(),
      account_number: String(form.account_number).trim(),
      account_logo: form.account_logo,
    };

    if (!payload.bank_name || !payload.account_name || !payload.account_number) {
      toast.error("Bank name, account name, and account number are required.", { title: "Account not saved" });
      return;
    }

    if (!editingId && !payload.account_logo) {
      toast.error("Account logo is required for new accounts.", { title: "Account not saved" });
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateAdminAccount(editingId, payload);
        toast.success("Account updated.");
      } else {
        await createAdminAccount(payload);
        toast.success("Account created.");
      }

      resetForm();
      await loadAccounts();
    } catch (err) {
      toast.error(getApiError(err, "Unable to save account"), { title: "Account not saved" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);

    try {
      await deleteAdminAccount(id);
      toast.success("Account deleted.");
      if (editingId === id) resetForm();
      await loadAccounts();
    } catch (err) {
      toast.error(getApiError(err, "Unable to delete account"), { title: "Delete failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1>Accounts</h1>
          <p>Manage bank accounts users can pay into for subscription verification.</p>
        </div>
      </header>

      <section className={styles.stats} aria-label="Account totals">
        <article>
          <span>Total accounts</span>
          <strong>{loading ? "..." : accounts.length}</strong>
        </article>
        <article>
          <span>Shown</span>
          <strong>{loading ? "..." : filteredAccounts.length}</strong>
        </article>
      </section>

      <div className={styles.layout}>
        <section className={styles.formPanel}>
          <div className={styles.panelHeader}>
            <h2>{editingId ? "Edit account" : "New account"}</h2>
            {editingId ? (
              <button aria-label="Cancel editing" type="button" onClick={resetForm}>
                <FiX aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Bank name
              <input
                value={form.bank_name}
                onChange={(event) => setForm((current) => ({ ...current, bank_name: event.target.value }))}
                placeholder="Bank name"
              />
            </label>
            <label>
              Account name
              <input
                value={form.account_name}
                onChange={(event) => setForm((current) => ({ ...current, account_name: event.target.value }))}
                placeholder="Account holder"
              />
            </label>
            <label>
              Account number
              <input
                value={form.account_number}
                onChange={(event) => setForm((current) => ({ ...current, account_number: event.target.value }))}
                placeholder="Account number"
              />
            </label>
            <label>
              Logo {editingId ? <span>Optional when editing</span> : null}
              <input
                accept="image/*"
                type="file"
                onChange={(event) =>
                  setForm((current) => ({ ...current, account_logo: event.target.files?.[0] || null }))
                }
              />
            </label>
            <button className={styles.primary} disabled={saving} type="submit">
              <FiPlus aria-hidden="true" />
              {editingId ? "Update account" : "Save account"}
            </button>
          </form>
        </section>

        <section className={styles.listPanel}>
          <div className={styles.panelHeader}>
            <h2>All accounts</h2>
            <label className={styles.search}>
              <FiSearch aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search accounts..."
              />
            </label>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Bank</span>
              <span>Account</span>
              <span>Number</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            {filteredAccounts.map((account) => (
              <article className={styles.tableRow} key={account.id}>
                <div className={styles.bankCell}>
                  <div className={styles.logo}>
                    {account.account_logo ? <img alt="" src={logoUrl(account)} /> : <FiImage aria-hidden="true" />}
                  </div>
                  <strong>{account.bank_name}</strong>
                </div>
                <span>{account.account_name}</span>
                <span>{account.account_number}</span>
                <span>{formatDate(account.created_at)}</span>
                <div className={styles.actions}>
                  <button
                    aria-label="Edit account"
                    disabled={saving}
                    title="Edit account"
                    type="button"
                    onClick={() => editAccount(account)}
                  >
                    <FiEdit2 aria-hidden="true" />
                  </button>
                  <button
                    aria-label="Delete account"
                    disabled={saving}
                    title="Delete account"
                    type="button"
                    onClick={() => handleDelete(account.id)}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
            {!loading && !filteredAccounts.length ? <p className={styles.empty}>No accounts match this view.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
