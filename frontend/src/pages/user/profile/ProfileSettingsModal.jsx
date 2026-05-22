import { useState } from "react";
import { FiX } from "react-icons/fi";
import styles from "./ProfileSettingsModal.module.css";

export function ProfileSettingsModal({ profile, saving, passwordSaving, onClose, onPasswordSave, onSave }) {
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

  return (
    <div className={styles.backdrop} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true" aria-label="Profile settings">
        <header>
          <div>
            <p>Settings</p>
            <h2>Update profile</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close profile settings">
            <FiX aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={submit}>
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

        <form className={styles.passwordForm} onSubmit={submitPassword}>
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
      </section>
    </div>
  );
}
