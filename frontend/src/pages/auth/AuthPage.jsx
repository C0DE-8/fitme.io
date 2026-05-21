import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiError } from "../../lib/api";
import { login, register, verifyOtp } from "../../lib/api/authApi";
import { saveSession } from "../../lib/auth";
import styles from "./AuthPage.module.css";

const initialLogin = { identifier: "", password: "" };
const initialRegister = { username: "", email: "", bio: "", password: "" };
const initialOtp = { email: "", otp: "" };

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [otpForm, setOtpForm] = useState(initialOtp);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await login(loginForm);
      saveSession(data);
      navigate(data.user?.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(getApiError(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await register(registerForm);
      setOtpForm({ email: registerForm.email, otp: "" });
      setStatus(data.message || "Registration started. Check your email for an OTP.");
      setMode("verify");
    } catch (err) {
      setError(getApiError(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const data = await verifyOtp(otpForm);
      setStatus(data.message || "Email verified. You can sign in now.");
      setMode("login");
      setLoginForm((current) => ({ ...current, identifier: otpForm.email }));
    } catch (err) {
      setError(getApiError(err, "OTP verification failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        <aside className={styles.side}>
          <p className={styles.kicker}>Fitme access</p>
          <h1>Plan meals and budgets with fitme.io.</h1>
          <p>
            Sign in to manage your food storage, subscriptions, meal suggestions, and budget planning.
          </p>
        </aside>

        <div className={styles.card}>
          <div className={styles.tabs} role="tablist" aria-label="Auth mode">
            <button className={mode === "login" ? styles.tabActive : styles.tab} onClick={() => setMode("login")} type="button">
              Login
            </button>
            <button className={mode === "register" ? styles.tabActive : styles.tab} onClick={() => setMode("register")} type="button">
              Register
            </button>
            <button className={mode === "verify" ? styles.tabActive : styles.tab} onClick={() => setMode("verify")} type="button">
              Verify
            </button>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}
          {status ? <p className={styles.status}>{status}</p> : null}

          {mode === "login" ? (
            <form className={styles.form} onSubmit={handleLogin}>
              <label>
                Username or email
                <input
                  value={loginForm.identifier}
                  onChange={(event) => setLoginForm({ ...loginForm, identifier: event.target.value })}
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  autoComplete="current-password"
                  required
                />
              </label>
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : null}

          {mode === "register" ? (
            <form className={styles.form} onSubmit={handleRegister}>
              <label>
                Username
                <input
                  value={registerForm.username}
                  onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Bio
                <textarea
                  value={registerForm.bio}
                  onChange={(event) => setRegisterForm({ ...registerForm, bio: event.target.value })}
                  rows={3}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                  autoComplete="new-password"
                  required
                />
              </label>
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>
          ) : null}

          {mode === "verify" ? (
            <form className={styles.form} onSubmit={handleVerify}>
              <label>
                Email
                <input
                  type="email"
                  value={otpForm.email}
                  onChange={(event) => setOtpForm({ ...otpForm, email: event.target.value })}
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                OTP
                <input
                  value={otpForm.otp}
                  onChange={(event) => setOtpForm({ ...otpForm, otp: event.target.value })}
                  inputMode="numeric"
                  required
                />
              </label>
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify email"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
