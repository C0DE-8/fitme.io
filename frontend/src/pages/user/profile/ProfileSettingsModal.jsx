import { useState } from "react";
import { FiKey, FiTrash2, FiUser, FiX, FiSun } from "react-icons/fi";
import { useTheme } from "../../../components/feedback/ThemeContext";
import styles from "./ProfileSettingsModal.module.css";

const sections = [
  { value: "profile", label: "Update profile", icon: FiUser },
  { value: "password", label: "Change password", icon: FiKey },
  { value: "theme", label: "Theme", icon: FiSun },
  { value: "delete", label: "Delete account", icon: FiTrash2 },
];

export function ProfileSettingsModal({
  profile,
  saving,
  passwordSaving,
  deleting,
  onClose,
  onDelete,
  onPasswordSave,
  onSave,
}) {
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState("profile");
  const [form, setForm] = useState({
    username: profile?.username || "",
    email: profile?.email || "",
    bio: profile?.bio || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [deletePassword, setDeletePassword] = useState("");

  function submit(event) {
    event.preventDefault();
    onSave({
      username: form.username.trim(),
      email: form.email.trim(),
      bio: form.bio.trim(),
    });
  }

  async function submitPassword(event) {
    event.preventDefault();
    const saved = await onPasswordSave(passwordForm);

    if (saved) {
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
  }

  async function submitDelete(event) {
    event.preventDefault();
    const deleted = await onDelete(deletePassword);
    if (!deleted) setDeletePassword("");
  }

  return (
    <div className={styles.backdrop} role="presentation">
      <aside className={styles.modal} role="dialog" aria-modal="true" aria-label="Profile settings">
        <header>
          <div>
            <p>Settings</p>
            <h2>Update profile</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close profile settings">
            <FiX aria-hidden="true" />
          </button>
        </header>

        <nav className={styles.sectionNav} aria-label="Profile settings sections">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={section === item.value ? styles.sectionActive : ""}
                key={item.value}
                type="button"
                onClick={() => setSection(item.value)}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {section === "profile" ? (
          <form onSubmit={submit}>
            <div className={styles.sectionTitle}>
              <p>Profile</p>
              <h3>Update profile</h3>
            </div>
            <label>
              Username
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                maxLength={120}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label>
              Bio
              <textarea
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                rows={4}
                maxLength={500}
                placeholder="Food interests, cooking style, or a short intro."
              />
            </label>
            <div className={styles.actions}>
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        ) : null}

        {section === "password" ? (
          <form onSubmit={submitPassword}>
            <div className={styles.sectionTitle}>
              <p>Security</p>
              <h3>Change password</h3>
            </div>
            <label>
              Current password
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
                }
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, new_password: event.target.value }))
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <div className={styles.passwordAction}>
              <button type="submit" disabled={passwordSaving}>
                {passwordSaving ? "Changing..." : "Change password"}
              </button>
            </div>
          </form>
        ) : null}

        {section === "theme" ? (
          <div className={styles.themeSection}>
            <div className={styles.sectionTitle}>
              <p>Appearance</p>
              <h3>Theme</h3>
            </div>
            <div className={styles.themeOptions}>
              <button
                type="button"
                className={`${styles.themeButton} ${theme === "dark" ? styles.themeActive : ""}`}
                onClick={toggleTheme}
              >
                <span className={styles.themePreview} style={{ background: "var(--fitme-bg)" }} />
                <span>Dark</span>
              </button>
              <button
                type="button"
                className={`${styles.themeButton} ${theme === "light" ? styles.themeActive : ""}`}
                onClick={toggleTheme}
              >
                <span className={styles.themePreview} style={{ background: "#f8fafc" }} />
                <span>Light</span>
              </button>
            </div>
            <div className={styles.themeInfo}>
              <p>Current theme: <strong>{theme === "dark" ? "Dark" : "Light"}</strong></p>
            </div>
          </div>
        ) : null}

        {section === "delete" ? (
          <form className={styles.deleteForm} onSubmit={submitDelete}>
            <div className={styles.sectionTitle}>
              <p>Danger zone</p>
              <h3>Delete account</h3>
            </div>
            <p>This removes your profile, storage, active feed posts, comments, follows, and subscriptions.</p>
            <label>
              Confirm password
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <div className={styles.deleteAction}>
              <button type="submit" disabled={deleting}>
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
