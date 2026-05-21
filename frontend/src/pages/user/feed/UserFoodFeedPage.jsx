import { useEffect, useState } from "react";
import { FiCamera, FiClock, FiHeart, FiMessageCircle, FiThumbsUp, FiTrash2, FiUserPlus, FiZap } from "react-icons/fi";
import { getApiError } from "../../../lib/api";
import {
  createFoodFeedComment,
  createFoodFeedPost,
  followFoodFeedUser,
  getFoodFeed,
  removeFoodFeedComment,
  removeFoodFeedPost,
  removeFoodFeedReaction,
  saveFoodFeedReaction,
  unfollowFoodFeedUser,
} from "../../../lib/api/foodFeedApi";
import { useToast } from "../../../components/feedback/useToast";
import styles from "./UserFoodFeedPage.module.css";

const reactions = [
  { value: "like", label: "Like", icon: FiThumbsUp },
  { value: "love", label: "Love", icon: FiHeart },
  { value: "fire", label: "Fire", icon: FiZap },
];

function postTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function expiryTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function initial(name) {
  return String(name || "F").trim().charAt(0).toUpperCase();
}

function nextReactionCounts(post, nextReaction) {
  const counts = { ...(post.reactions || {}) };
  if (post.my_reaction) counts[post.my_reaction] = Math.max(0, Number(counts[post.my_reaction] || 0) - 1);
  if (nextReaction) counts[nextReaction] = Number(counts[nextReaction] || 0) + 1;
  return counts;
}

export function UserFoodFeedPage() {
  const toast = useToast();
  const [scope, setScope] = useState("all");
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ meal_name: "", caption: "", image: null });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyKey, setBusyKey] = useState("");

  useEffect(() => {
    let alive = true;

    getFoodFeed(scope)
      .then((items) => {
        if (alive) setPosts(items || []);
      })
      .catch((err) => {
        if (alive) toast.error(getApiError(err, "Unable to load food feed"), { title: "Feed unavailable" });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [scope, toast]);

  function updatePost(id, change) {
    setPosts((current) => current.map((post) => (post.id === id ? change(post) : post)));
  }

  async function submitPost(event) {
    event.preventDefault();
    if (!form.meal_name.trim() && !form.caption.trim() && !form.image) {
      toast.info("Add a meal name, a note, or a food photo before posting.", { title: "Post is empty" });
      return;
    }

    setSaving(true);
    try {
      const data = await createFoodFeedPost(form);
      if (data.post) setPosts((current) => [data.post, ...current]);
      setForm({ meal_name: "", caption: "", image: null });
      toast.success(data.message || "Food post shared.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to share food post"), { title: "Post not shared" });
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(post) {
    setBusyKey(`post-${post.id}`);
    try {
      await removeFoodFeedPost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success("Food post removed.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to remove food post"), { title: "Delete failed" });
    } finally {
      setBusyKey("");
    }
  }

  async function reactToPost(post, reactionType) {
    setBusyKey(`reaction-${post.id}`);
    const nextReaction = post.my_reaction === reactionType ? null : reactionType;

    try {
      if (nextReaction) await saveFoodFeedReaction(post.id, nextReaction);
      else await removeFoodFeedReaction(post.id);

      updatePost(post.id, (current) => ({
        ...current,
        my_reaction: nextReaction,
        reactions: nextReactionCounts(current, nextReaction),
      }));
    } catch (err) {
      toast.error(getApiError(err, "Unable to save reaction"), { title: "Reaction failed" });
    } finally {
      setBusyKey("");
    }
  }

  async function submitComment(event, post) {
    event.preventDefault();
    const body = String(commentDrafts[post.id] || "").trim();
    if (!body) return;

    setBusyKey(`comment-${post.id}`);
    try {
      const comment = await createFoodFeedComment(post.id, body);
      updatePost(post.id, (current) => ({ ...current, comments: [...(current.comments || []), comment] }));
      setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
    } catch (err) {
      toast.error(getApiError(err, "Unable to add comment"), { title: "Comment failed" });
    } finally {
      setBusyKey("");
    }
  }

  async function deleteComment(postId, comment) {
    setBusyKey(`delete-comment-${comment.id}`);
    try {
      await removeFoodFeedComment(comment.id);
      updatePost(postId, (current) => ({
        ...current,
        comments: (current.comments || []).filter((item) => item.id !== comment.id),
      }));
    } catch (err) {
      toast.error(getApiError(err, "Unable to remove comment"), { title: "Delete failed" });
    } finally {
      setBusyKey("");
    }
  }

  async function toggleFollow(post) {
    setBusyKey(`follow-${post.user_id}`);
    try {
      if (post.is_following) await unfollowFoodFeedUser(post.user_id);
      else await followFoodFeedUser(post.user_id);

      setPosts((current) =>
        current.map((item) =>
          item.user_id === post.user_id ? { ...item, is_following: !post.is_following } : item
        )
      );
      toast.success(post.is_following ? `Unfollowed ${post.username}.` : `Following ${post.username}.`);
    } catch (err) {
      toast.error(getApiError(err, "Unable to update follow"), { title: "Follow failed" });
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.kicker}>Foods</p>
          <h1>Food Feed</h1>
        </div>
        <div className={styles.tabs} aria-label="Feed scope">
          <button
            className={scope === "all" ? styles.activeTab : ""}
            type="button"
            onClick={() => {
              if (scope !== "all") {
                setLoading(true);
                setScope("all");
              }
            }}
          >
            All
          </button>
          <button
            className={scope === "following" ? styles.activeTab : ""}
            type="button"
            onClick={() => {
              if (scope !== "following") {
                setLoading(true);
                setScope("following");
              }
            }}
          >
            Following
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <form className={styles.composer} onSubmit={submitPost}>
          <div className={styles.composerTitle}>
            <strong>Share what you ate</strong>
            <span>24 hours</span>
          </div>
          <label>
            Food name
            <input
              value={form.meal_name}
              onChange={(event) => setForm((current) => ({ ...current, meal_name: event.target.value }))}
              placeholder="Jollof rice, amala..."
              maxLength={140}
            />
          </label>
          <label>
            Post
            <textarea
              value={form.caption}
              onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))}
              placeholder="What did you eat and how was it?"
              rows={4}
              maxLength={1200}
            />
          </label>
          <div className={styles.composerActions}>
            <label className={styles.fileButton}>
              <FiCamera aria-hidden="true" />
              <span>{form.image?.name || "Add photo"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setForm((current) => ({ ...current, image: event.target.files?.[0] || null }))}
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Posting..." : "Post"}
            </button>
          </div>
        </form>

        <div className={styles.feed}>
          {posts.map((post) => (
            <article className={styles.post} key={post.id}>
              <header className={styles.postHeader}>
                <span className={styles.avatar}>{initial(post.username)}</span>
                <div>
                  <strong>{post.username}</strong>
                  <span>
                    <FiClock aria-hidden="true" /> {postTime(post.created_at)} until {expiryTime(post.expires_at)}
                  </span>
                </div>
                {post.is_owner ? (
                  <button
                    className={styles.iconButton}
                    type="button"
                    disabled={busyKey === `post-${post.id}`}
                    onClick={() => deletePost(post)}
                    aria-label={`Delete ${post.meal_name || "food"} post`}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    className={styles.followButton}
                    type="button"
                    disabled={busyKey === `follow-${post.user_id}`}
                    onClick={() => toggleFollow(post)}
                  >
                    <FiUserPlus aria-hidden="true" />
                    {post.is_following ? "Following" : "Follow"}
                  </button>
                )}
              </header>

              {post.image_url ? <img className={styles.foodImage} src={post.image_url} alt="" /> : null}

              <div className={styles.postCopy}>
                {post.meal_name ? <h2>{post.meal_name}</h2> : null}
                {post.caption ? <p>{post.caption}</p> : null}
              </div>

              <div className={styles.reactionBar}>
                {reactions.map((reaction) => {
                  const Icon = reaction.icon;
                  return (
                    <button
                      className={post.my_reaction === reaction.value ? styles.reactionActive : ""}
                      type="button"
                      key={reaction.value}
                      disabled={busyKey === `reaction-${post.id}`}
                      onClick={() => reactToPost(post, reaction.value)}
                    >
                      <Icon aria-hidden="true" />
                      <span>{reaction.label}</span>
                      <em>{Number(post.reactions?.[reaction.value] || 0)}</em>
                    </button>
                  );
                })}
              </div>

              <section className={styles.comments} aria-label={`Comments on ${post.meal_name || "food post"}`}>
                <div className={styles.commentTitle}>
                  <FiMessageCircle aria-hidden="true" />
                  <strong>{post.comments?.length || 0} comments</strong>
                </div>
                {(post.comments || []).map((comment) => (
                  <div className={styles.comment} key={comment.id}>
                    <span>{initial(comment.username)}</span>
                    <p>
                      <strong>{comment.username}</strong>
                      {comment.body}
                    </p>
                    {comment.is_owner ? (
                      <button
                        type="button"
                        disabled={busyKey === `delete-comment-${comment.id}`}
                        onClick={() => deleteComment(post.id, comment)}
                        aria-label="Delete comment"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ))}
                <form className={styles.commentForm} onSubmit={(event) => submitComment(event, post)}>
                  <input
                    value={commentDrafts[post.id] || ""}
                    onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                    placeholder="Comment on this food..."
                    maxLength={500}
                  />
                  <button type="submit" disabled={busyKey === `comment-${post.id}`}>
                    Send
                  </button>
                </form>
              </section>
            </article>
          ))}

          {!loading && !posts.length ? (
            <div className={styles.empty}>
              <strong>{scope === "following" ? "No followed food posts yet." : "No food posts yet."}</strong>
              <p>Share a meal from the composer to start the feed.</p>
            </div>
          ) : null}

          {loading ? <div className={styles.loading}>Loading feed...</div> : null}
        </div>
      </div>
    </section>
  );
}
