import { api } from "../api";

export function getFoodFeed(scope = "all") {
  return api.get("/user/food-feed", { params: { scope } }).then((res) => res.data.posts);
}

export function getMyFoodFeedPosts() {
  return api.get("/user/food-feed/posts/mine").then((res) => res.data.posts);
}

export function searchFoodFeedUsers(query) {
  return api.get("/user/food-feed/users/search", { params: { q: query } }).then((res) => res.data.users);
}

export function getFoodFeedUserProfile(id) {
  return api.get(`/user/food-feed/users/${id}/profile`).then((res) => res.data);
}

export function getFoodFeedFollowList(id, kind) {
  return api.get(`/user/food-feed/users/${id}/${kind}`).then((res) => res.data.users);
}

export function createFoodFeedPost(payload) {
  const form = new FormData();
  if (payload.meal_name) form.append("meal_name", payload.meal_name);
  if (payload.caption) form.append("caption", payload.caption);
  if (payload.image) form.append("image", payload.image);

  return api.post("/user/food-feed/posts", form).then((res) => res.data);
}

export function removeFoodFeedPost(id) {
  return api.delete(`/user/food-feed/posts/${id}`).then((res) => res.data);
}

export function saveFoodFeedReaction(postId, reactionType) {
  return api.put(`/user/food-feed/posts/${postId}/reaction`, { reaction_type: reactionType }).then((res) => res.data);
}

export function removeFoodFeedReaction(postId) {
  return api.delete(`/user/food-feed/posts/${postId}/reaction`).then((res) => res.data);
}

export function createFoodFeedComment(postId, body) {
  return api.post(`/user/food-feed/posts/${postId}/comments`, { body }).then((res) => res.data.comment);
}

export function removeFoodFeedComment(id) {
  return api.delete(`/user/food-feed/comments/${id}`).then((res) => res.data);
}

export function saveFoodFeedCommentReaction(commentId, reactionType) {
  return api.put(`/user/food-feed/comments/${commentId}/reaction`, { reaction_type: reactionType }).then((res) => res.data);
}

export function removeFoodFeedCommentReaction(commentId) {
  return api.delete(`/user/food-feed/comments/${commentId}/reaction`).then((res) => res.data);
}

export function followFoodFeedUser(id) {
  return api.put(`/user/food-feed/users/${id}/follow`).then((res) => res.data);
}

export function unfollowFoodFeedUser(id) {
  return api.delete(`/user/food-feed/users/${id}/follow`).then((res) => res.data);
}
