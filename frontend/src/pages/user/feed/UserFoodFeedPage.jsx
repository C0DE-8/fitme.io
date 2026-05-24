import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCamera,
  FiClock,
  FiHeart,
  FiMessageCircle,
  FiPlus,
  FiSearch,
  FiThumbsUp,
  FiTrash2,
  FiUserPlus,
  FiX,
  FiZap,
} from "react-icons/fi";
import { getApiError } from "../../../lib/api";
import {
  createFoodFeedComment,
  createFoodFeedPost,
  followFoodFeedUser,
  getFoodFeed,
  removeFoodFeedComment,
  removeFoodFeedCommentReaction,
  removeFoodFeedPost,
  removeFoodFeedReaction,
  saveFoodFeedReaction,
  saveFoodFeedCommentReaction,
  searchFoodFeedUsers,
  unfollowFoodFeedUser,
} from "../../../lib/api/foodFeedApi";
import { getCurrentUser } from "../../../lib/auth";
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

function nextCommentReactionCounts(comment, nextReaction) {
  const counts = { ...(comment.reactions || {}) };
  if (comment.my_reaction) counts[comment.my_reaction] = Math.max(0, Number(counts[comment.my_reaction] || 0) - 1);
  if (nextReaction) counts[nextReaction] = Number(counts[nextReaction] || 0) + 1;
  return counts;
}

function FoodFeedLoader() {
  return (
    <section className={styles.feedLoader} role="status" aria-label="Loading Food Feed">
      <div className={styles.loaderMark} aria-hidden="true">
        <span className={styles.loaderRing} />
        <span className={styles.loaderPulse} />
        <strong>F</strong>
      </div>
      <div className={styles.loaderCopy}>
        <strong>fitme.io</strong>
        <span>Loading Food Feed</span>
      </div>
      <div className={styles.loaderPost} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

export function UserFoodFeedPage() {
  const toast = useToast();
  const currentUser = getCurrentUser();
  const [scope, setScope] = useState("all");
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ meal_name: "", caption: "", image: null });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerStep, setComposerStep] = useState("edit");
  const [commentPostId, setCommentPostId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const previewImageUrl = useMemo(() => (form.image ? URL.createObjectURL(form.image) : ""), [form.image]);
  const profilePath = (userId) => (Number(userId) === Number(currentUser?.id) ? "/profile" : `/profile/${userId}`);
  const commentPost = posts.find((post) => post.id === commentPostId) || null;

  useEffect(() => {
    return () => {
      if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewImageUrl]);

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
      setComposerOpen(false);
      setComposerStep("edit");
      toast.success(data.message || "Food post shared.");
    } catch (err) {
      toast.error(getApiError(err, "Unable to share food post"), { title: "Post not shared" });
    } finally {
      setSaving(false);
    }
  }

  function previewPost(event) {
    event.preventDefault();
    if (!form.meal_name.trim() && !form.caption.trim() && !form.image) {
      toast.info("Add a meal name, a note, or a food photo before previewing.", { title: "Post is empty" });
      return;
    }

    setComposerStep("preview");
  }

  function closeComposer() {
    setComposerOpen(false);
    setComposerStep("edit");
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

  async function reactToComment(post, comment, reactionType) {
    setBusyKey(`comment-reaction-${comment.id}`);
    const nextReaction = comment.my_reaction === reactionType ? null : reactionType;

    try {
      if (nextReaction) await saveFoodFeedCommentReaction(comment.id, nextReaction);
      else await removeFoodFeedCommentReaction(comment.id);

      updatePost(post.id, (current) => ({
        ...current,
        comments: (current.comments || []).map((item) =>
          item.id === comment.id
            ? {
                ...item,
                my_reaction: nextReaction,
                reactions: nextCommentReactionCounts(item, nextReaction),
              }
            : item
        ),
      }));
    } catch (err) {
      toast.error(getApiError(err, "Unable to react to comment"), { title: "Reaction failed" });
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

  async function toggleFollow(author) {
    const userId = author.user_id || author.id;
    setBusyKey(`follow-${userId}`);
    try {
      if (author.is_following) await unfollowFoodFeedUser(userId);
      else await followFoodFeedUser(userId);

      setPosts((current) =>
        current.map((item) =>
          item.user_id === userId ? { ...item, is_following: !author.is_following } : item
        )
      );
      setSearchResults((current) =>
        current.map((item) => (item.id === userId ? { ...item, is_following: !author.is_following } : item))
      );
      toast.success(author.is_following ? `Unfollowed ${author.username}.` : `Following ${author.username}.`);
    } catch (err) {
      toast.error(getApiError(err, "Unable to update follow"), { title: "Follow failed" });
    } finally {
      setBusyKey("");
    }
  }

  async function searchUsers(event) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      setSearchResults(await searchFoodFeedUsers(query));
    } catch (err) {
      toast.error(getApiError(err, "Unable to search users"), { title: "Search failed" });
    } finally {
      setSearching(false);
    }
  }

  function askDeletePost(post) {
    setDeleteTarget({
      kind: "post",
      title: "Delete food post?",
      copy: "This removes the post and its comments from the live feed.",
      post,
    });
  }

  function askDeleteComment(post, comment) {
    setDeleteTarget({
      kind: "comment",
      title: "Delete comment?",
      copy: post.is_owner && !comment.is_owner
        ? "You can remove this comment from your food post."
        : "This removes your comment from the food post.",
      post,
      comment,
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "post") await deletePost(deleteTarget.post);
    if (deleteTarget.kind === "comment") await deleteComment(deleteTarget.post.id, deleteTarget.comment);
    setDeleteTarget(null);
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.kicker}>Foods</p>
          <h1>Food Feed</h1>
        </div>
        <div className={styles.headingActions}>
          <button
            className={styles.searchButton}
            type="button"
            onClick={() => setSearchOpen((current) => !current)}
            aria-label="Search users"
          >
            <FiSearch aria-hidden="true" />
          </button>
          <button
            className={styles.postButton}
            type="button"
            onClick={() => {
              setComposerStep("edit");
              setComposerOpen(true);
            }}
          >
            <FiPlus aria-hidden="true" />
            Post
          </button>
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
        </div>
      </header>

      {searchOpen ? (
        <section className={styles.searchPanel}>
          <form onSubmit={searchUsers}>
            <FiSearch aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users by username..."
              autoFocus
            />
            <button type="submit" disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </button>
          </form>
          {searchResults.length ? (
            <div className={styles.userResults}>
              {searchResults.map((user) => (
                <article key={user.id}>
                  <Link className={styles.resultAvatar} to={profilePath(user.id)} aria-label={`View ${user.username}'s profile`}>
                    {initial(user.username)}
                  </Link>
                  <div>
                    <Link className={styles.profileLink} to={profilePath(user.id)}>
                      {user.username}
                    </Link>
                    {user.bio ? <p>{user.bio}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={busyKey === `follow-${user.id}`}
                    onClick={() => toggleFollow(user)}
                  >
                    {user.is_following ? "Following" : "Follow"}
                  </button>
                </article>
              ))}
            </div>
          ) : searchQuery && !searching ? <p className={styles.searchEmpty}>Search the feed to find users by username.</p> : null}
        </section>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.feed}>
          {posts.map((post) => (
            <article className={styles.post} key={post.id}>
              <header className={styles.postHeader}>
                <Link className={`${styles.avatar} ${styles.avatarLink}`} to={profilePath(post.user_id)} aria-label={`View ${post.username}'s profile`}>
                  {initial(post.username)}
                </Link>
                <div>
                  <Link className={styles.profileLink} to={profilePath(post.user_id)}>
                    {post.username}
                  </Link>
                  <span>
                    <FiClock aria-hidden="true" /> {postTime(post.created_at)} until {expiryTime(post.expires_at)}
                  </span>
                </div>
                {post.is_owner ? (
                  <button
                    className={styles.iconButton}
                    type="button"
                    disabled={busyKey === `post-${post.id}`}
                    onClick={() => askDeletePost(post)}
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

              <div className={styles.foodMedia}>
                {post.image_url ? (
                  <img className={styles.foodImage} src={post.image_url} alt="" />
                ) : (
                  <span className={styles.foodFallback}>{initial(post.meal_name || post.username)}</span>
                )}
              </div>

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

              <button
                className={styles.commentTrigger}
                type="button"
                onClick={() => setCommentPostId(post.id)}
                aria-label={`Open comments on ${post.meal_name || "food post"}`}
              >
                <span>
                  <FiMessageCircle aria-hidden="true" />
                  <strong>{post.comments?.length || 0} comments</strong>
                </span>
                <em>{post.comments?.length ? "View all" : "Add comment"}</em>
              </button>
            </article>
          ))}

          {!loading && !posts.length ? (
            <div className={styles.empty}>
              <strong>{scope === "following" ? "No followed food posts yet." : "No food posts yet."}</strong>
              <p>Share a meal from the composer to start the feed.</p>
            </div>
          ) : null}

          {loading ? <FoodFeedLoader /> : null}
        </div>
      </div>

      {commentPost ? (
        <div className={styles.commentBackdrop} role="presentation" onMouseDown={() => setCommentPostId(null)}>
          <section
            className={styles.commentDrawer}
            role="dialog"
            aria-modal="true"
            aria-label={`Comments on ${commentPost.meal_name || "food post"}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.drawerHandle} aria-hidden="true" />
            <header className={styles.drawerHeader}>
              <div>
                <strong>Comments</strong>
                <span>{commentPost.comments?.length || 0} on {commentPost.meal_name || "food post"}</span>
              </div>
              <button type="button" onClick={() => setCommentPostId(null)} aria-label="Close comments">
                <FiX aria-hidden="true" />
              </button>
            </header>

            <div className={styles.commentList}>
              {(commentPost.comments || []).map((comment) => (
                <div className={styles.comment} key={comment.id} tabIndex={comment.can_delete ? 0 : undefined}>
                  <span>{initial(comment.username)}</span>
                  <div className={styles.commentBody}>
                    <p>
                      <Link className={styles.commentProfileLink} to={profilePath(comment.user_id)}>
                        {comment.username}
                      </Link>
                      {comment.body}
                    </p>
                    <div className={styles.commentReactions}>
                      {reactions.map((reaction) => {
                        const Icon = reaction.icon;
                        return (
                          <button
                            className={comment.my_reaction === reaction.value ? styles.commentReactionActive : ""}
                            type="button"
                            key={reaction.value}
                            disabled={busyKey === `comment-reaction-${comment.id}`}
                            onClick={() => reactToComment(commentPost, comment, reaction.value)}
                            aria-label={`${reaction.label} ${comment.username}'s comment`}
                          >
                            <Icon aria-hidden="true" />
                            <em>{Number(comment.reactions?.[reaction.value] || 0)}</em>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {comment.can_delete ? (
                    <button
                      type="button"
                      disabled={busyKey === `delete-comment-${comment.id}`}
                      onClick={() => askDeleteComment(commentPost, comment)}
                      aria-label="Delete comment"
                    >
                      <FiTrash2 aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              ))}
              {!commentPost.comments?.length ? (
                <div className={styles.emptyComments}>
                  <strong>No comments yet.</strong>
                  <p>Start the conversation on this food post.</p>
                </div>
              ) : null}
            </div>

            <form className={styles.commentForm} onSubmit={(event) => submitComment(event, commentPost)}>
              <input
                value={commentDrafts[commentPost.id] || ""}
                onChange={(event) => setCommentDrafts((current) => ({ ...current, [commentPost.id]: event.target.value }))}
                placeholder="Comment on this food..."
                maxLength={500}
                autoFocus
              />
              <button type="submit" disabled={busyKey === `comment-${commentPost.id}`}>
                Send
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {composerOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <form
            className={styles.composerModal}
            onSubmit={composerStep === "preview" ? submitPost : previewPost}
            role="dialog"
            aria-modal="true"
            aria-label="Create food post"
          >
            <div className={styles.modalHeader}>
              <div className={styles.composerTitle}>
                <strong>{composerStep === "preview" ? "Preview your food post" : "Share what you ate"}</strong>
                <span>24 hours</span>
              </div>
              <button type="button" onClick={closeComposer} aria-label="Close post composer">
                <FiX aria-hidden="true" />
              </button>
            </div>

            {composerStep === "edit" ? (
              <>
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
                  <button type="submit">
                    Preview post
                  </button>
                </div>
              </>
            ) : (
              <>
                <article className={styles.previewCard} aria-label="Food post preview">
                  <header className={styles.postHeader}>
                    <span className={styles.avatar}>{initial(currentUser?.username)}</span>
                    <div>
                      <strong>{currentUser?.username || "You"}</strong>
                      <span>
                        <FiClock aria-hidden="true" /> visible for 24 hours
                      </span>
                    </div>
                  </header>
                  {previewImageUrl ? (
                    <div className={styles.foodMedia}>
                      <img className={styles.foodImage} src={previewImageUrl} alt="" />
                    </div>
                  ) : null}
                  <div className={styles.postCopy}>
                    {form.meal_name ? <h2>{form.meal_name}</h2> : null}
                    {form.caption ? <p>{form.caption}</p> : null}
                  </div>
                  <div className={styles.previewReactions}>
                    <span>
                      <FiThumbsUp aria-hidden="true" />
                      Like
                    </span>
                    <span>
                      <FiMessageCircle aria-hidden="true" />
                      Comment
                    </span>
                  </div>
                </article>
                <div className={styles.previewActions}>
                  <button type="button" onClick={() => setComposerStep("edit")} disabled={saving}>
                    Edit post
                  </button>
                  <button type="submit" disabled={saving}>
                    {saving ? "Posting..." : "Confirm post"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.deleteModal} role="dialog" aria-modal="true" aria-label={deleteTarget.title}>
            <span>
              <FiTrash2 aria-hidden="true" />
            </span>
            <h2>{deleteTarget.title}</h2>
            <p>{deleteTarget.copy}</p>
            <div>
              <button type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={Boolean(busyKey)}>
                {busyKey ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
