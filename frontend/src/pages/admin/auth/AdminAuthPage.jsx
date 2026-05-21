import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { login } from "../../../lib/api/authApi";
import { saveSession } from "../../../lib/auth";
import styles from "./AdminAuthPage.module.css";

export function AdminAuthPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await login(form);

      if (data.user?.role !== "admin") {
        toast.error("This sign in is only for admin accounts.", { title: "Admin access required" });
        return;
      }

      saveSession(data);
      navigate("/admin");
    } catch (err) {
      toast.error(getApiError(err, "Admin login failed"), { title: "Admin sign in failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.terminal}>
        <div className={styles.bar}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.output}>
          <p>
            <span>$</span> fitme.io admin
          </p>
          <h1>Admin sign in</h1>
          <p className={styles.copy}>Authenticate with an admin account to manage users, plans, accounts, and approvals.</p>
        </div>
      </div>

      <form className={styles.card} onSubmit={handleSubmit}>
        <label>
          Username or email
          <input
            value={form.identifier}
            onChange={(event) => setForm({ ...form, identifier: event.target.value })}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            autoComplete="current-password"
            required
          />
        </label>

        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? "Checking..." : "Enter admin"}
        </button>
        <Link className={styles.userLink} to="/auth">
          User sign in
        </Link>
      </form>
    </section>
  );
}
