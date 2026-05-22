import { useEffect, useMemo, useState } from "react";
import { FiClock, FiHeart, FiMessageCircle, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { useToast } from "../../../components/feedback/useToast";
import { getApiError } from "../../../lib/api";
import { getAdminFoodFeedPosts, removeAdminFoodFeedPost } from "../../../lib/api/adminFoodFeedApi";
import styles from "./AdminFoodFeedPage.module.css";

function dateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function initial(name) {
  return String(name || "F").trim().charAt(0).toUpperCase();
}

export function AdminFoodFeedPage() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;

    getAdminFoodFeedPosts()
      .then((items) => {
        if (alive) setPosts(items || []);
      })
      .catch((err) => {
        if (alive) toast.error(getApiError(err, "Unable to load food feed posts"), { title: "Admin feed unavailable" });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey, toast]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return posts;

    return posts.filter((post) =>
      [post.username, post.meal_name, post.caption].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [posts, search]);

  async function deletePost(post) {
    setBusyId(post.id);
    try {
      const data = await removeAdminFoodFeedPost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success(data.message || "Food feed post removed.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to remove food feed post"), { title: "Moderation failed" });
    } finally {
      setBusyId("");
    }
  }

  function refreshPosts() {
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  const reactionTotal = posts.reduce((sum, post) => sum + Number(post.reaction_count || 0), 0);
  const commentTotal = posts.reduce((sum, post) => sum + Number(post.comment_count || 0), 0);

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1>Food Feed</h1>
          <p>Review active food posts before their 24-hour window closes.</p>
        </div>
        <button type="button" onClick={refreshPosts} disabled={loading}>
          <FiRefreshCw aria-hidden="true" />
          Refresh
        </button>
      </header>

      <div className={styles.stats}>
        <article>
          <span>Active posts</span>
          <strong>{loading ? "..." : posts.length}</strong>
        </article>
        <article>
          <span>Reactions</span>
          <strong>{loading ? "..." : reactionTotal}</strong>
        </article>
        <article>
          <span>Comments</span>
          <strong>{loading ? "..." : commentTotal}</strong>
        </article>
      </div>

      <div className={styles.tools}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search user, food name, or post text..."
        />
      </div>

      <section className={styles.list}>
        <div className={styles.listHeader}>
          <h2>Active posts</h2>
          <span>{loading ? "Loading..." : `${filteredPosts.length} visible`}</span>
        </div>

        <div className={styles.grid}>
          {filteredPosts.map((post) => (
            <article className={styles.post} key={post.id}>
              <header>
                <span className={styles.avatar}>{initial(post.username)}</span>
                <div>
                  <strong>{post.username}</strong>
                  <em>
                    <FiClock aria-hidden="true" />
                    Expires {dateTime(post.expires_at)}
                  </em>
                </div>
                <button
                  type="button"
                  disabled={busyId === post.id}
                  onClick={() => deletePost(post)}
                  aria-label={`Remove ${post.meal_name || "food feed"} post`}
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </header>

              {post.image_url ? <img src={post.image_url} alt="" /> : null}

              <div className={styles.copy}>
                {post.meal_name ? <h3>{post.meal_name}</h3> : null}
                {post.caption ? <p>{post.caption}</p> : null}
                <small>Posted {dateTime(post.created_at)}</small>
              </div>

              <footer>
                <span>
                  <FiHeart aria-hidden="true" />
                  {Number(post.reaction_count || 0)}
                </span>
                <span>
                  <FiMessageCircle aria-hidden="true" />
                  {Number(post.comment_count || 0)}
                </span>
              </footer>
            </article>
          ))}

          {!loading && !filteredPosts.length ? (
            <div className={styles.empty}>
              <strong>{posts.length ? "No posts match this search." : "No active food posts."}</strong>
              <p>Expired posts are cleared by the feed expiry worker.</p>
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
