import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiX } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import {
  followFoodFeedUser,
  getFoodFeedFollowList,
  getFoodFeedUserProfile,
  unfollowFoodFeedUser,
} from "../../../lib/api/foodFeedApi";
import styles from "./UserProfilePage.module.css";

function initial(name) {
  return String(name || "F").trim().charAt(0).toUpperCase();
}

export function UserPublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followModal, setFollowModal] = useState(null);
  const [followUsers, setFollowUsers] = useState([]);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    getFoodFeedUserProfile(userId)
      .then((data) => {
        if (!alive) return;
        setProfile(data.profile || null);
        setPosts(data.posts || []);
      })
      .catch((err) => {
        if (alive) toast.error(getApiError(err, "Unable to load this profile"), { title: "Profile unavailable" });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [toast, userId]);

  async function toggleFollow() {
    if (!profile || profile.is_self) return;

    setFollowing(true);
    try {
      if (profile.is_following) await unfollowFoodFeedUser(profile.id);
      else await followFoodFeedUser(profile.id);

      setProfile((current) => {
        if (!current) return current;
        const nextFollowing = !current.is_following;
        const followerTotal = Number(current.social_totals?.followers || 0) + (nextFollowing ? 1 : -1);
        return {
          ...current,
          is_following: nextFollowing,
          social_totals: {
            ...current.social_totals,
            followers: Math.max(0, followerTotal),
          },
        };
      });
    } catch (err) {
      toast.error(getApiError(err, "Unable to update follow"), { title: "Follow failed" });
    } finally {
      setFollowing(false);
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

  if (profile?.is_self) return <Navigate to="/profile" replace />;

  const totals = profile?.social_totals || {};

  return (
    <section className={styles.page}>
      <section className={styles.profileHeader}>
        <div className={styles.toolbar}>
          <Link className={styles.backLink} to="/foods" aria-label="Back to food feed">
            <FiArrowLeft aria-hidden="true" />
          </Link>
          <p className={styles.kicker}>Food Profile</p>
        </div>

        <div className={styles.profileCenter}>
          <span className={styles.avatar}>{loading ? "..." : initial(profile?.username)}</span>
          <div className={styles.nameRow}>
            <h1>{profile?.username || "User profile"}</h1>
            {profile?.verified ? (
              <span className={styles.verified} aria-label="Verified profile">
                <FiCheckCircle aria-hidden="true" />
              </span>
            ) : null}
            {profile ? (
              <button type="button" onClick={toggleFollow} disabled={following}>
                {profile.is_following ? "Following" : "Follow"}
              </button>
            ) : null}
          </div>
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

        <p className={styles.bio}>{profile?.bio || (loading ? "Loading profile..." : "No bio yet.")}</p>
      </section>

      <section className={styles.postPanel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.kicker}>Feed</p>
            <h2>Active food posts</h2>
          </div>
          <span>{loading ? "..." : posts.length}</span>
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
                  {Number(post.reaction_count || 0)} likes, {Number(post.comment_count || 0)} comments
                </small>
              </div>
            </article>
          ))}
          {!loading && !posts.length ? (
            <div className={styles.emptyPosts}>
              <strong>No active food posts.</strong>
              <p>Food Feed posts expire after 24 hours, so only live posts appear here.</p>
            </div>
          ) : null}
        </div>
      </section>

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
              {followLoading ? <p>Loading users...</p> : null}
              {!followLoading && !followUsers.length ? <p>No users to show.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
