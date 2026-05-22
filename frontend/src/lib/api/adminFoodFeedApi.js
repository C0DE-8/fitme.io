import { api } from "../api";

export function getAdminFoodFeedPosts() {
  return api.get("/admin/food-feed/posts").then((res) => res.data.posts);
}

export function removeAdminFoodFeedPost(id) {
  return api.delete(`/admin/food-feed/posts/${id}`).then((res) => res.data);
}
