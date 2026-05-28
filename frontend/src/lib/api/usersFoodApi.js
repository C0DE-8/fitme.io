import { api } from "../api";

export function getFoodSuggestions(type) {
  return api.get(`/user/foods/suggest/${type}`).then((res) => res.data);
}

export function getFoodSuggestion(type, id) {
  return api.get(`/user/foods/suggest/${type}/${id}`).then((res) => res.data);
}

export function getBudgetFoodSuggestions(type, budget) {
  return api.post(`/user/foods/suggest-budget/${type}`, { budget }).then((res) => res.data);
}

export function searchFavoriteFoodOptions({ q = "", type = "", limit = 20 } = {}) {
  const params = { limit };
  if (q) params.q = q;
  if (type) params.type = type;

  return api.get("/user/foods/favorites/search", { params }).then((res) => res.data);
}

export function getFavoriteFoods() {
  return api.get("/user/foods/favorites").then((res) => res.data.favorites);
}

export function addFavoriteFood(foodId) {
  return api.post("/user/foods/favorites", { food_id: foodId }).then((res) => res.data);
}

export function removeFavoriteFood(foodId) {
  return api.delete(`/user/foods/favorites/${foodId}`).then((res) => res.data);
}
