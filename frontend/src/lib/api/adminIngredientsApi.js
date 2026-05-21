import { api } from "../api";

export function getAdminIngredients() {
  return api.get("/admin/storage-items").then((res) => res.data.storage_items);
}

export function createAdminIngredient(name) {
  return api.post("/admin/storage-items/add", { name }).then((res) => res.data);
}

export function updateAdminIngredient(id, name) {
  return api.put(`/admin/storage-items/${id}`, { name }).then((res) => res.data);
}

export function deleteAdminIngredient(id) {
  return api.delete(`/admin/storage-items/${id}`).then((res) => res.data);
}
