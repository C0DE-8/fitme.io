import { useEffect, useState } from "react";
import {
  FiBookmark,
  FiCheckCircle,
  FiGrid,
  FiHeart,
  FiLock,
  FiMail,
  FiRepeat,
  FiSettings,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { updateCurrentUser } from "../../../lib/auth";
import { changeUserPassword, getUserProfile, updateUserProfile } from "../../../lib/api/userApi";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import styles from "./UserProfilePage.module.css";

function initial(name) {
  return String(name || "F").trim().charAt(0).toUpperCase();
}

export function UserProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    getUserProfile()
      .then((data) => {
        if (alive) setProfile(data);
      })
      .catch((err) => {
        if (alive) toast.error(getApiError(err, "Unable to load your profile"), { title: "Profile unavailable" });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [toast]);

  async function saveProfile(payload) {
    setSaving(true);

    try {
      const data = await updateUserProfile(payload);
      if (data.profile) {
        setProfile(data.profile);
        updateCurrentUser({
          username: data.profile.username,
          email: data.profile.email,
        });
      }
      setSettingsOpen(false);
      toast.success(data.message || "Profile updated.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to update profile"), { title: "Profile not updated" });
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(payload) {
    setPasswordSaving(true);

    try {
      const data = await changeUserPassword(payload);
      toast.success(data.message || "Password changed.");
      return true;
    } catch (err) {
      toast.error(getApiError(err, "Unable to change password"), { title: "Password not changed" });
      return false;
    } finally {
      setPasswordSaving(false);
    }
  }

  const totals = profile?.social_totals || {};

  return (
    <section className={styles.page}>
      <section className={styles.profileHeader}>
        <div className={styles.toolbar}>
          <p className={styles.kicker}>Profile</p>
          <button type="button" onClick={() => setSettingsOpen(true)} disabled={!profile} aria-label="Open profile settings">
            <FiSettings aria-hidden="true" />
          </button>
        </div>

        <div className={styles.profileCenter}>
          <span className={styles.avatar}>{loading ? "..." : initial(profile?.username)}</span>
          <div className={styles.nameRow}>
            <h1>{profile?.username || "Your profile"}</h1>
            {profile?.verified ? (
              <span className={styles.verified} aria-label="Verified profile">
                <FiCheckCircle aria-hidden="true" />
              </span>
            ) : null}
            <button type="button" onClick={() => setSettingsOpen(true)} disabled={!profile}>
              Edit
            </button>
          </div>
          <p className={styles.handle}>
            <FiMail aria-hidden="true" />
            {profile?.email || (loading ? "Loading..." : "No email")}
          </p>
        </div>

        <div className={styles.stats}>
          <article>
            <strong>{loading ? "..." : Number(totals.following || 0).toLocaleString()}</strong>
            <span>Following</span>
          </article>
          <article>
            <strong>{loading ? "..." : Number(totals.followers || 0).toLocaleString()}</strong>
            <span>Followers</span>
          </article>
          <article>
            <strong>{loading ? "..." : Number(totals.likes || 0).toLocaleString()}</strong>
            <span>Likes</span>
          </article>
        </div>

        <p className={styles.bio}>{profile?.bio || "Add a short bio from profile settings."}</p>
      </section>

      <nav className={styles.tabs} aria-label="Profile sections">
        <span className={styles.activeTab}>
          <FiGrid aria-hidden="true" />
        </span>
        <span>
          <FiLock aria-hidden="true" />
        </span>
        <span>
          <FiRepeat aria-hidden="true" />
        </span>
        <span>
          <FiBookmark aria-hidden="true" />
        </span>
        <span>
          <FiHeart aria-hidden="true" />
        </span>
      </nav>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.summaryTitle}>
            <FiUsers aria-hidden="true" />
            <div>
              <p className={styles.kicker}>Social</p>
              <h2>Feed profile</h2>
            </div>
          </div>
          <div className={styles.socialList}>
            <span>
              <FiUserCheck aria-hidden="true" />
              {Number(totals.following || 0).toLocaleString()} following
            </span>
            <span>
              <FiUsers aria-hidden="true" />
              {Number(totals.followers || 0).toLocaleString()} followers
            </span>
            <span>
              <FiHeart aria-hidden="true" />
              {Number(totals.likes || 0).toLocaleString()} likes
            </span>
          </div>
        </section>

        <section className={styles.panel}>
          <p className={styles.kicker}>Account</p>
          <h2>Profile details</h2>
          <dl>
            <div>
              <dt>Joined</dt>
              <dd>{profile?.created_at_from_now || (loading ? "Loading..." : "Unavailable")}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{profile?.updated_at_from_now || (loading ? "Loading..." : "Unavailable")}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile?.role || "user"}</dd>
            </div>
          </dl>
        </section>
      </div>

      {settingsOpen ? (
        <ProfileSettingsModal
          profile={profile}
          saving={saving}
          passwordSaving={passwordSaving}
          onClose={() => setSettingsOpen(false)}
          onPasswordSave={savePassword}
          onSave={saveProfile}
        />
      ) : null}
    </section>
  );
}
