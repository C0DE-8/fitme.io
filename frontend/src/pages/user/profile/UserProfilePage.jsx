import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiGrid,
  FiHeart,
  FiMail,
  FiSettings,
  FiStar,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { clearSession, updateCurrentUser } from "../../../lib/auth";
import { getFoodFeedFollowList, getMyFoodFeedPosts } from "../../../lib/api/foodFeedApi";
import {
  addFavoriteFood,
  getFavoriteFoods,
  removeFavoriteFood,
  searchFavoriteFoodOptions,
} from "../../../lib/api/usersFoodApi";
import {
  changeUserPassword,
  deleteUserAccount,
  getUserProfile,
  getUserSubscriptionStatus,
  updateUserProfile,
} from "../../../lib/api/userApi";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import styles from "./UserProfilePage.module.css";

const foodTypes = [
  { value: "", label: "All" },
  { value: "rice", label: "Rice" },
  { value: "swallow", label: "Swallow" },
  { value: "junks", label: "Others" },
];

function initial(name) {
  return String(name || "F").trim().charAt(0).toUpperCase();
}

function foodTypeLabel(value) {
  return foodTypes.find((type) => type.value === value)?.label || value;
}

function formatMoney(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "No subscription";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [followModal, setFollowModal] = useState(null);
  const [followUsers, setFollowUsers] = useState([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [favoriteSearch, setFavoriteSearch] = useState("");
  const [favoriteType, setFavoriteType] = useState("");
  const [favoriteOptions, setFavoriteOptions] = useState([]);
  const [favoriteFoods, setFavoriteFoods] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoriteActionId, setFavoriteActionId] = useState(null);

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

    getUserSubscriptionStatus()
      .then((data) => {
        if (alive) setSubscription(data);
      })
      .catch((err) => {
        if (alive) toast.error(getApiError(err, "Unable to load your subscription"), { title: "Subscription unavailable" });
      });

    getMyFoodFeedPosts()
      .then((data) => {
        if (alive) setPosts(data || []);
      })
      .catch((err) => {
        if (alive) toast.error(getApiError(err, "Unable to load your food posts"), { title: "Posts unavailable" });
      })
      .finally(() => {
        if (alive) setPostsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [toast]);

  useEffect(() => {
    let alive = true;

    async function loadFavorites() {
      setFavoritesLoading(true);

      try {
        const favorites = await getFavoriteFoods();
        if (alive) setFavoriteFoods(favorites || []);
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Unable to load favorite foods"), { title: "Favorites unavailable" });
      } finally {
        if (alive) setFavoritesLoading(false);
      }
    }

    loadFavorites();

    return () => {
      alive = false;
    };
  }, [toast]);

  useEffect(() => {
    let alive = true;
    const search = window.setTimeout(async () => {
      const query = favoriteSearch.trim();

      if (!query) {
        if (alive) setFavoriteOptions([]);
        return;
      }

      try {
        const data = await searchFavoriteFoodOptions({ q: query, type: favoriteType, limit: 10 });
        if (alive) setFavoriteOptions(data?.foods || []);
      } catch (err) {
        if (alive) toast.error(getApiError(err, "Could not search foods"), { title: "Food search failed" });
      }
    }, 300);

    return () => {
      alive = false;
      window.clearTimeout(search);
    };
  }, [favoriteSearch, favoriteType, toast]);

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

  async function deleteAccount(password) {
    setDeleting(true);

    try {
      const data = await deleteUserAccount(password);
      clearSession();
      toast.success(data.message || "Account deleted.");
      navigate("/", { replace: true });
      return true;
    } catch (err) {
      toast.error(getApiError(err, "Unable to delete account"), { title: "Account not deleted" });
      return false;
    } finally {
      setDeleting(false);
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

  async function openFollowList(kind) {
    if (!profile?.id) return;

    setFollowModal(kind);
    setFollowUsers([]);
    setFollowLoading(true);

    try {
      const users = await getFoodFeedFollowList(profile.id, kind);
      setFollowUsers(users || []);
    } catch (err) {
      toast.error(getApiError(err, "Unable to load users"), { title: "Follow list unavailable" });
    } finally {
      setFollowLoading(false);
    }
  }

  async function saveFavoriteFood(food) {
    setFavoriteActionId(food.id);

    try {
      const data = await addFavoriteFood(food.id);
      const favorite = data?.favorite;
      if (favorite) {
        setFavoriteFoods((current) => [favorite, ...current.filter((item) => item.id !== favorite.id)]);
        setFavoriteOptions((current) => current.map((item) => (item.id === favorite.id ? { ...item, favorited: true } : item)));
      }
      toast.success(`${food.name} saved to favorites`, { title: "Favorite added" });
    } catch (err) {
      toast.error(getApiError(err, "Unable to save favorite food"), { title: "Favorite failed" });
    } finally {
      setFavoriteActionId(null);
    }
  }

  async function deleteFavoriteFood(food) {
    setFavoriteActionId(food.id);

    try {
      await removeFavoriteFood(food.id);
      setFavoriteFoods((current) => current.filter((item) => item.id !== food.id));
      setFavoriteOptions((current) => current.map((item) => (item.id === food.id ? { ...item, favorited: false } : item)));
      toast.success(`${food.name} removed from favorites`, { title: "Favorite removed" });
    } catch (err) {
      toast.error(getApiError(err, "Unable to remove favorite food"), { title: "Remove failed" });
    } finally {
      setFavoriteActionId(null);
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
          <button type="button" onClick={() => openFollowList("following")} disabled={loading || !profile}>
            <strong>{loading ? "..." : Number(totals.following || 0).toLocaleString()}</strong>
            <span>Following</span>
          </button>
          <button type="button" onClick={() => openFollowList("followers")} disabled={loading || !profile}>
            <strong>{loading ? "..." : Number(totals.followers || 0).toLocaleString()}</strong>
            <span>Followers</span>
          </button>
          <article>
            <strong>{loading ? "..." : Number(totals.likes || 0).toLocaleString()}</strong>
            <span>Likes</span>
          </article>
        </div>

        <p className={styles.bio}>{profile?.bio || "Add a short bio from profile settings."}</p>
      </section>

      <nav className={styles.tabs} aria-label="Profile sections">
        <button
          className={activeTab === "posts" ? styles.activeTab : ""}
          type="button"
          onClick={() => setActiveTab("posts")}
          aria-label="Your food posts"
        >
          <FiHeart aria-hidden="true" />
        </button>
        <button
          className={activeTab === "summary" ? styles.activeTab : ""}
          type="button"
          onClick={() => setActiveTab("summary")}
          aria-label="Profile summary"
        >
          <FiGrid aria-hidden="true" />
        </button>
        <button
          className={activeTab === "favorites" ? styles.activeTab : ""}
          type="button"
          onClick={() => setActiveTab("favorites")}
          aria-label="Favorite foods"
        >
          <FiStar aria-hidden="true" />
        </button>
      </nav>

      {activeTab === "posts" ? (
        <section className={styles.postPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.kicker}>Your feed</p>
              <h2>Food posts</h2>
            </div>
            <span>{postsLoading ? "..." : posts.length}</span>
          </div>
          <div className={styles.postGrid}>
            {posts.map((post) => (
              <article className={styles.postCard} key={post.id}>
                {post.image_url ? (
                  <img src={post.image_url} alt="" />
                ) : (
                  <span className={styles.postFallback}>{initial(post.meal_name)}</span>
                )}
                <div>
                  <strong>{post.meal_name || "Food post"}</strong>
                  {post.caption ? <p>{post.caption}</p> : null}
                  <small>
                    {Number(post.reaction_count || 0)} likes · {Number(post.comment_count || 0)} comments
                  </small>
                </div>
              </article>
            ))}
            {!postsLoading && !posts.length ? (
              <div className={styles.emptyPosts}>
                <strong>No active food posts.</strong>
                <p>Food Feed posts expire after 24 hours, so only active posts appear here.</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : activeTab === "summary" ? (
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
                <dt>Subscribed</dt>
                <dd>{loading ? "Loading..." : formatDate(subscription?.start_date)}</dd>
              </div>
              <div>
                <dt>Ends</dt>
                <dd>{loading ? "Loading..." : formatDate(subscription?.expiry_date)}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : (
        <section className={styles.favoritePanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.kicker}>Saved food</p>
              <h2>Favorite foods</h2>
            </div>
            <span>{favoritesLoading ? "..." : favoriteFoods.length}</span>
          </div>

          <div className={styles.favoriteBody}>
            <div className={styles.favoriteTools}>
              <label className={styles.favoriteSearch}>
                <span>Search system foods</span>
                <input
                  type="search"
                  value={favoriteSearch}
                  onChange={(event) => setFavoriteSearch(event.target.value)}
                  placeholder="Search by food or ingredient"
                />
              </label>

              <div className={styles.favoriteChips} aria-label="Favorite food type">
                {foodTypes.map((type) => (
                  <button
                    className={favoriteType === type.value ? styles.favoriteChipActive : ""}
                    key={type.value || "all"}
                    type="button"
                    onClick={() => setFavoriteType(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {favoriteOptions.length ? (
              <div className={styles.favoriteResults}>
                {favoriteOptions.map((food) => (
                  <article key={food.id}>
                    {food.image_url ? <img src={food.image_url} alt="" /> : <span>{initial(food.name)}</span>}
                    <div>
                      <strong>{food.name}</strong>
                      <small>{foodTypeLabel(food.type)} · {formatMoney(food.estimated_cost)}</small>
                    </div>
                    <button
                      type="button"
                      disabled={favoriteActionId === food.id}
                      onClick={() => (food.favorited ? deleteFavoriteFood(food) : saveFavoriteFood(food))}
                    >
                      {favoriteActionId === food.id ? "Saving..." : food.favorited ? "Remove" : "Add"}
                    </button>
                  </article>
                ))}
              </div>
            ) : favoriteSearch.trim() ? (
              <p className={styles.favoriteEmpty}>No matching food found in the system.</p>
            ) : null}

            <div className={styles.favoriteListHeader}>
              <h3>Saved favorites</h3>
              <span>{favoriteFoods.length}</span>
            </div>

            {favoritesLoading ? (
              <div className={styles.favoriteGrid}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <article className={styles.favoriteSkeleton} key={`favorite-skeleton-${index}`} aria-hidden="true">
                    <span />
                    <div>
                      <span />
                      <span />
                    </div>
                  </article>
                ))}
              </div>
            ) : favoriteFoods.length ? (
              <div className={styles.favoriteGrid}>
                {favoriteFoods.map((food) => (
                  <article className={styles.favoriteCard} key={food.id}>
                    {food.image_url ? <img src={food.image_url} alt="" /> : <span>{initial(food.name)}</span>}
                    <div>
                      <strong>{food.name}</strong>
                      <small>{foodTypeLabel(food.type)} · {formatMoney(food.estimated_cost)}</small>
                    </div>
                    <button
                      type="button"
                      disabled={favoriteActionId === food.id}
                      onClick={() => deleteFavoriteFood(food)}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.favoriteEmpty}>No favorite foods yet.</p>
            )}
          </div>
        </section>
      )}

      {settingsOpen ? (
        <ProfileSettingsModal
          profile={profile}
          saving={saving}
          passwordSaving={passwordSaving}
          deleting={deleting}
          onDelete={deleteAccount}
          onClose={() => setSettingsOpen(false)}
          onPasswordSave={savePassword}
          onSave={saveProfile}
        />
      ) : null}

      {followModal ? (
        <div className={styles.followBackdrop} role="presentation">
          <section className={styles.followModal} role="dialog" aria-modal="true" aria-label={followModal}>
            <header>
              <div>
                <p className={styles.kicker}>Social</p>
                <h2>{followModal === "followers" ? "Followers" : "Following"}</h2>
              </div>
              <button type="button" onClick={() => setFollowModal(null)} aria-label="Close list">
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className={styles.followList}>
              {followLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div className={styles.followSkeleton} key={`follow-skeleton-${index}`} aria-hidden="true">
                      <span />
                      <div>
                        <span />
                        <span />
                      </div>
                    </div>
                  ))
                : null}
              {followUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setFollowModal(null);
                    navigate(user.is_self ? "/profile" : `/profile/${user.id}`);
                  }}
                >
                  <span className={styles.followAvatar}>{initial(user.username)}</span>
                  <span>
                    <strong>{user.username}</strong>
                    <small>{user.is_self ? "You" : user.is_following ? "Following" : user.bio || "View profile"}</small>
                  </span>
                </button>
              ))}
              {!followLoading && !followUsers.length ? <p>No users to show.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
